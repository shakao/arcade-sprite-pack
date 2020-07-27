
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

async function loadImageAsync(uri: string): Promise<HTMLImageElement> {
    return new Promise<HTMLImageElement>(resolve => {
        const el = document.createElement("img");
        el.src = uri
        el.onload = () => {
            resolve(el)
        };
    })
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