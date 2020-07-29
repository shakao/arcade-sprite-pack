import { uint8ArrayToString, hexToUint8Array } from "./util";

export interface JRESImage {
    data: string; // Base64 encoded string of f4 encoded bytes
    previewURI: string; // PNG data uri
    width: number;
    height: number;

    qualifiedName?: string;
    tilemapTile?: boolean;
    sourceFile?: string;
}

export interface ImageInfo {
    width: number;
    height: number;
    pixels: Uint8ClampedArray;
}

export async function getImageFromURIAsync(uri: string): Promise<ImageInfo | null> {
    const loaded = await loadImageAsync(uri);
    const canvas = document.createElement("canvas");
    canvas.width = loaded.width;
    canvas.height = loaded.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(loaded, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);

    return {
        width: data.width,
        height: data.height,
        pixels: data.data
    };
}

async function loadImageAsync(uri: string): Promise<HTMLImageElement> {
    return new Promise<HTMLImageElement>(resolve => {
        const el = document.createElement("img");
        el.src = uri
        el.onload = () => {
            resolve(el)
        };
    })
}

export async function getJRESImageFromUint8Array(buf: Uint8Array, palette: string[]): Promise<JRESImage | null> {
    const encoded = btoa(uint8ArrayToString(buf));
    const imageInfo = await getImageFromURIAsync("data:image/png;base64," + encoded);
    if (imageInfo) {
        const imageLit = imgEncodeImage(imageInfo, palette);
        return await getJRESImageFromImageLiteral(imageLit, palette);
    }
    return null;
}

export function getJRESImageFromDataString(data: string, palette: string[], qname?: string, tilemapTile?: boolean, sourceFile?: string): JRESImage {
    const bitmap = jresDataToBitmap(data);

    return getJRESImage(bitmap, palette, data, qname, tilemapTile, sourceFile)
}

export function getJRESImageFromImageLiteral(literal: string, palette: string[], sourceFile?: string) {
    const bitmap = imageLiteralToBitmap(literal);
    return getJRESImage(bitmap, palette, undefined, undefined, undefined, sourceFile)
}


function getJRESImage(bitmap: Bitmap, palette: string[], data?: string, qname?: string, tilemapTile?: boolean, sourceFile?: string): JRESImage {
    return {
        width: bitmap.width,
        height: bitmap.height,
        data: data || base64EncodeBitmap(bitmap),
        previewURI: bitmapToImageURI(bitmap, palette),
        qualifiedName: qname,
        tilemapTile,
        sourceFile
    }
}

export function imgEncodeJRESImage(image: JRESImage) {
    const bitmap = jresDataToBitmap(image.data);
    return bitmapToImageLiteral(bitmap, "typescript");
}


const hexChars = [".", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];

function bitmapToImageLiteral(bitmap: Bitmap, fileType: "typescript" | "python"): string {
    let res = '';
    switch (fileType) {
        case "python":
            res = "img(\"\"\"";
            break;
        default:
            res = "img`";
            break;
    }

    if (bitmap) {
        for (let r = 0; r < bitmap.height; r++) {
            res += "\n"
            for (let c = 0; c < bitmap.width; c++) {
                res += hexChars[bitmap.get(c, r)] + " ";
            }
        }
    }

    res += "\n";

    switch (fileType) {
        case "python":
            res += "\"\"\")";
            break;
        default:
            res += "`";
            break;
    }

    return res;
}


/**
 * Encodes the image in the image/mkcd-f4 format (used for the data attribute in jres files)
 * @param image
 * @param colors
 */
export function f4EncodeImage(image: ImageInfo, colors: string[]) {
    const palette = colorsToNumbers(colors);

    return f4EncodeImgCore(image.width, image.height, 4, (x, y) => {
        const index = y * image.width + x;
        return closestColor(image.pixels, index << 2, palette);
    });
}

/**
 * Encodes the image as an img`` literal
 * @param image
 * @param colors
 */
export function imgEncodeImage(image: ImageInfo, colors: string[]) {
    const palette = colorsToNumbers(colors);

    return imgEncodeImgCore(image.width, image.height, (x, y) => {
        const index = y * image.width + x;
        return closestColor(image.pixels, index << 2, palette);
    });
}

function colorsToNumbers(colors: string[]): number[][] {
    const res: number[][] = [];
    for (let i = 0; i < colors.length; i++) {
        const color = parseColorString(colors[i]);
        res.push([_r(color), _g(color), _b(color)]);
    }
    return res;
}

// use geometric distance on colors
function scale(v: number) {
    return v * v
}

function closestColor(buf: Uint8ClampedArray, pix: number, palette: number[][], alpha = true) {
    if (alpha && buf[pix + 3] < 100)
        return 0 // transparent
    let mindelta = 0
    let idx = -1
    for (let i = alpha ? 1 : 0; i < palette.length; ++i) {
        let delta = scale(palette[i][0] - buf[pix + 0]) + scale(palette[i][1] - buf[pix + 1]) + scale(palette[i][2] - buf[pix + 2])
        if (idx < 0 || delta < mindelta) {
            idx = i
            mindelta = delta
        }
    }
    return idx
}

function f4EncodeImgCore(w: number, h: number, bpp: number, getPix: (x: number, y: number) => number) {
    let r = hex2(0xe0 | bpp) + hex2(w) + hex2(h) + "00"
    let ptr = 4
    let curr = 0
    let shift = 0

    let pushBits = (n: number) => {
        curr |= n << shift
        // eslint-disable-next-line
        if (shift == 8 - bpp) {
            r += hex2(curr)
            ptr++
            curr = 0
            shift = 0
        } else {
            shift += bpp
        }
    }

    for (let i = 0; i < w; ++i) {
        for (let j = 0; j < h; ++j)
            pushBits(getPix(i, j))
        // eslint-disable-next-line
        while (shift != 0)
            pushBits(0)
        if (bpp > 1) {
            while (ptr & 3)
                pushBits(0)
        }
    }

    return r

    function hex2(n: number) {
        return ("0" + n.toString(16)).slice(-2)
    }
}

function imgEncodeImgCore(w: number, h: number, getPix: (x: number, y: number) => number) {
    let res = "img`\n    "
    for (let r = 0; r < h; r++) {
        let row: number[] = []
        for (let c = 0; c < w; c++) {
            row.push(getPix(c, r));
        }
        res += row.map(n => n.toString(16)).join(" ");
        res += "\n    "
    }
    res += "`";
    return res;
}

function base64EncodeBitmap(bitmap: Bitmap) {
    const hex = f4EncodeImgCore(bitmap.width, bitmap.height, 4, (x, y) => bitmap.get(x, y));
    return btoa(uint8ArrayToString(hexToUint8Array(hex)))
}

function _r(color: number) { return (color >> 16) & 0xff }
function _g(color: number) { return (color >> 8) & 0xff }
function _b(color: number) { return color & 0xff }

function parseColorString(color: string) {
    if (color) {
        if (color.length === 6) {
            return parseInt("0x" + color);
        }
        else if (color.length === 7) {
            return parseInt("0x" + color.substr(1));
        }
    }
    return 0;
}

/**
 * 16-color sprite
 */
export class Bitmap {
    protected buf: Uint8ClampedArray;

    constructor(public width: number, public height: number, public x0 = 0, public y0 = 0, buf?: Uint8ClampedArray) {
        this.buf = buf || new Uint8ClampedArray(this.dataLength());
    }

    set(col: number, row: number, value: number) {
        if (col < this.width && row < this.height && col >= 0 && row >= 0) {
            const index = this.coordToIndex(col, row);
            this.setCore(index, value);
        }
    }

    get(col: number, row: number) {
        if (col < this.width && row < this.height && col >= 0 && row >= 0) {
            const index = this.coordToIndex(col, row);
            return this.getCore(index);
        }
        return 0;
    }

    protected coordToIndex(col: number, row: number) {
        return col + row * this.width;
    }

    protected getCore(index: number) {
        const cell = Math.floor(index / 2);
        if (index % 2 === 0) {
            return this.buf[cell] & 0xf;
        }
        else {
            return (this.buf[cell] & 0xf0) >> 4;
        }
    }

    protected setCore(index: number, value: number) {
        const cell = Math.floor(index / 2);
        if (index % 2 === 0) {
            this.buf[cell] = (this.buf[cell] & 0xf0) | (value & 0xf);
        }
        else {
            this.buf[cell] = (this.buf[cell] & 0x0f) | ((value & 0xf) << 4);
        }
    }

    protected dataLength() {
        return Math.ceil(this.width * this.height / 2);
    }
}


function jresDataToBitmap(jresURL: string) {
    let data = atob(jresURL.slice(jresURL.indexOf(",") + 1))
    let magic = data.charCodeAt(0);
    let w = data.charCodeAt(1);
    let h = data.charCodeAt(2);

    if (magic === 0x87) {
        magic = 0xe0 | data.charCodeAt(1);
        w = data.charCodeAt(2) | (data.charCodeAt(3) << 8);
        h = data.charCodeAt(4) | (data.charCodeAt(5) << 8);
        data = data.slice(4);
    }

    const out = new Bitmap(w, h);

    let index = 4
    if (magic === 0xe1) {
        // Monochrome
        let mask = 0x01
        let v = data.charCodeAt(index++)
        for (let x = 0; x < w; ++x) {
            for (let y = 0; y < h; ++y) {
                out.set(x, y, (v & mask) ? 1 : 0);
                mask <<= 1
                // eslint-disable-next-line
                if (mask == 0x100) {
                    mask = 0x01
                    v = data.charCodeAt(index++)
                }
            }
        }
    }
    else {
        // Color
        for (let x = 0; x < w; x++) {
            for (let y = 0; y < h; y += 2) {
                let v = data.charCodeAt(index++)
                out.set(x, y, v & 0xf);
                // eslint-disable-next-line
                if (y != h - 1) {
                    out.set(x, y + 1, (v >> 4) & 0xf);
                }
            }
            while (index & 3) index++
        }
    }

    return out;
}

function imageLiteralToBitmap(text: string, defaultPattern?: string): Bitmap {
    // Strip the tagged template string business and the whitespace. We don't have to exhaustively
    // replace encoded characters because the compiler will catch any disallowed characters and throw
    // an error before the decompilation happens. 96 is backtick and 9 is tab
    text = text.replace(/[ `]|(?:&#96;)|(?:&#9;)|(?:img)/g, "").trim();
    // eslint-disable-next-line
    text = text.replace(/^["`\(\)]*/, '').replace(/["`\(\)]*$/, '');
    text = text.replace(/&#10;/g, "\n");

    if (!text && defaultPattern)
        text = defaultPattern;

    const rows = text.split("\n");

    // We support "ragged" sprites so not all rows will be the same length
    const sprite: number[][] = [];
    let spriteWidth = 0;

    for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const rowValues: number[] = [];
        for (let c = 0; c < row.length; c++) {
            // This list comes from libs/screen/targetOverrides.ts in pxt-arcade
            // Technically, this could change per target.
            switch (row[c]) {
                case "0": case ".": rowValues.push(0); break;
                case "1": case "#": rowValues.push(1); break;
                case "2": case "T": rowValues.push(2); break;
                case "3": case "t": rowValues.push(3); break;
                case "4": case "N": rowValues.push(4); break;
                case "5": case "n": rowValues.push(5); break;
                case "6": case "G": rowValues.push(6); break;
                case "7": case "g": rowValues.push(7); break;
                case "8": rowValues.push(8); break;
                case "9": rowValues.push(9); break;
                case "a": case "A": case "R": rowValues.push(10); break;
                case "b": case "B": case "P": rowValues.push(11); break;
                case "c": case "C": case "p": rowValues.push(12); break;
                case "d": case "D": case "O": rowValues.push(13); break;
                case "e": case "E": case "Y": rowValues.push(14); break;
                case "f": case "F": case "W": rowValues.push(15); break;
            }
        }

        if (rowValues.length) {
            sprite.push(rowValues);
            spriteWidth = Math.max(spriteWidth, rowValues.length);
        }
    }

    const spriteHeight = sprite.length;

    const result = new Bitmap(spriteWidth, spriteHeight)

    for (let r = 0; r < spriteHeight; r++) {
        const row = sprite[r];
        for (let c = 0; c < spriteWidth; c++) {
            if (c < row.length) {
                result.set(c, r, row[c]);
            }
            else {
                result.set(c, r, 0);
            }
        }
    }

    return result;
}

/**
 * Converts a bitmap into a square image suitable for display
 */
function bitmapToImageURI(frame: Bitmap, colors: string[]) {
    const canvas = document.createElement("canvas");
    canvas.width = frame.width;
    canvas.height = frame.height;

    let context = canvas.getContext("2d");

    if (context) {
        for (let c = 0; c < frame.width; c++) {
            for (let r = 0; r < frame.height; r++) {
                const color = frame.get(c, r);

                if (color) {
                    context.fillStyle = colors[color];
                    context.fillRect(c, r, 1, 1);
                }
            }
        }
    }


    return canvas.toDataURL();
}

