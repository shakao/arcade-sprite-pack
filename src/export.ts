import { AssetInfo, Asset } from "./components/Asset";
import { lzmaCompressAsync } from "./lzma";
import { JRes } from "./share";
import { escapeIdentifier, IMAGE_MIME_TYPE, browserDownloadUInt8Array, browserDownloadText, browserDownloadDataUri } from "./util";
import { imgEncodeJRESImage } from "./images";
import { AssetType, getProjectPalette, getTilemapProject } from "./project";


interface PXTHexFile {
    meta: {
        cloudId: "pxt/arcade";
        targetVersions: any;
        editor: "tsprj";
        name: string;
    };
    source: string; // a mapping of filenames to file text that has been stringified
}

const PROJECT_COMMENT = `/*
 * This project was created using arcade-sprite-pack. If you
 * want to publish this project to GitHub as a sprite pack, do
 * not add any code to this file! The code that is running in the
 * simulator can be edited by clicking on the file explorer to the
 * left and selecting "test.ts". Any code added to "test.ts" will
 * not be added to a project that imports this sprite pack as an
 * extension.
 *
 * If you don't wish to publish this project, you can use this project
 * as-is. Your sprites should show up in the sprite gallery. Make sure
 * you delete the code in "test.ts"!
 *
 *
 * To publish this project to GitHub:
 *   1. Rename this project to something descriptive
 *   2. Click the GitHub button in the bottom bar next to the save
 *      button (sign in to GitHub if prompted)
 *   3. Choose a name for your repository. This is the name that
 *      people will see when importing your project.
 *   4. Make sure "public repository" is selected in the dropdown
 *      if you want other people to be able to use your sprites
 *   5. Click "go ahead"
 *   6. If you are on a shared computer, make sure you sign out of
 *      GitHub!
 *
 *
 * To add a published project to an Arcade project:
 *   1. Inside the MakeCode editor, click "Extensions" under "Advanced"
 *      in the toolbox
 *   2. Inside the search box that appears, type your GitHub username
 *      followed by a "/" and the name of the repository. It should
 *      look something like this: username/repository
 *   3. Hit enter on your keyboard and click the card that appears
 *   4. The sprites should now show up in the gallery of the sprite
 *      editor (at the bottom)
 * */
`;

const TEST_SCRIPT = `
const padding = 10;
const speed = 50;
game.onUpdate(function() {
    for (const sprite of sprites.allOfKind(SpriteKind.Player)) {
        if (sprite.vx > 0 && sprite.x >= screen.width - padding) {
            sprite.x = screen.width - padding;
            sprite.vx = 0;
            sprite.vy = speed;
        }
        else if (sprite.vy > 0 && sprite.y >= screen.height - padding) {
            sprite.y = screen.height - padding;
            sprite.vx = -speed;
            sprite.vy = 0;
        }
        else if (sprite.vx < 0 && sprite.x <= padding) {
            sprite.x = padding;
            sprite.vx = 0;
            sprite.vy = -speed;
        }
        else if (sprite.vy < 0 && sprite.bottom <= 0) {
            sprite.destroy();
        }
    }
})

let index = 0;
game.onUpdateInterval(700, function() {
    const asset = sprites.create(allImages[index], SpriteKind.Player);
    asset.x = padding;
    asset.y = padding;
    asset.vx = speed;
    asset.setFlag(SpriteFlag.Ghost, true)
    index = (index + 1) % allImages.length;
})

let line1 = sprites.create(img\`0\`, SpriteKind.Food)
line1.say("PRESS A TO  ")

let line2 = sprites.create(img\`0\`, SpriteKind.Food)
line2.say("CHANGE COLOR")
line2.top += 10

let bgColor = 0;
controller.player1.onButtonEvent(ControllerButton.A, ControllerButtonEvent.Pressed, function() {
    scene.setBackgroundColor(bgColor);
    bgColor = (bgColor + 1) % 15
})`;

const MAIN_BLOCKS = "main.blocks"
const ASSET_TS = "assets.ts";
const ASSET_JRES = "assets.jres"
const TEST_TS = "test.ts";
const MAIN_TS = "main.ts";
const PXT_JSON = "pxt.json";
const README_MD = "README.md";

const TILEMAP_JRES = "tilemap.g.jres";
const IMAGE_JRES = "images.g.jres";
const TILEMAP_G_TS = "tilemap.g.ts";
const IMAGE_G_TS = "images.g.ts";

function createProjectBlobAsync(name: string) {
    const config = {
        "name": name,
        "dependencies": {
            "device": "*" // required for arcade
        },
        "description": "An asset pack for MakeCode Arcade",
        "files": [
            MAIN_BLOCKS,
            MAIN_TS
        ],
        "testFiles": [
            TEST_TS
        ]
    };



    const files: {[index: string]: string} = {};

    const project = getTilemapProject();

    const tmjres = project.getProjectTilesetJRes();

    if (Object.keys(tmjres).length > 1) {
        const stringRes = JSON.stringify(tmjres, null, 4);
        const ts = pxt.emitTilemapsFromJRes(tmjres);
        files[TILEMAP_JRES] = stringRes;
        files[TILEMAP_G_TS] = ts;
        config.files.push(TILEMAP_JRES);
        config.files.push(TILEMAP_G_TS);
    }

    const imgjres = project.getProjectAssetsJRes();

    if (Object.keys(imgjres).length > 1) {
        const stringRes = JSON.stringify(imgjres, null, 4);
        const ts = pxt.emitProjectImages(imgjres);
        files[IMAGE_JRES] = stringRes;
        files[IMAGE_G_TS] = ts;
        config.files.push(IMAGE_JRES);
        config.files.push(IMAGE_G_TS);
    }

    files[PXT_JSON] = JSON.stringify(config, null, 4);
    files[MAIN_TS] = PROJECT_COMMENT;
    files[TEST_TS] = "";
    files[README_MD] = ""
    files[MAIN_BLOCKS] =`<xml xmlns="http://www.w3.org/1999/xhtml"><variables></variables><block type="pxt-on-start" x="0" y="0"></block></xml>`;

    const out: PXTHexFile = {
        meta: {
            cloudId: "pxt/arcade",
            targetVersions: {},
            name: name,
            editor: "tsprj"
        },
        source: JSON.stringify(files)
    };

    return lzmaCompressAsync(JSON.stringify(out));
}


export async function downloadProjectAsync(name: string) {
    const blob = await createProjectBlobAsync(name);
    return browserDownloadUInt8Array(blob, name + ".mkcd");
}


export async function downloadScaledSprites(scaleFactor: number) {
    const project = getTilemapProject();

    const allBitmaps: pxt.sprite.Bitmap[] = [];

    for (const asset of project.getAssets(AssetType.Image)) {
        allBitmaps.push(pxt.sprite.Bitmap.fromData((asset as pxt.ProjectImage).bitmap));
    }
    for (const asset of project.getAssets(AssetType.Tile)) {
        allBitmaps.push(pxt.sprite.Bitmap.fromData((asset as pxt.Tile).bitmap));
    }
    for (const asset of project.getAssets(AssetType.Animation)) {
        allBitmaps.push(...(asset as pxt.Animation).frames.map(frame => pxt.sprite.Bitmap.fromData(frame)));
    }

    const renderCanvas: HTMLCanvasElement = document.createElement("canvas");

    const palette = getProjectPalette();

    const output: string[] = [];
    for (const bitmap of allBitmaps) {
        renderCanvas.width = bitmap.width * scaleFactor;
        renderCanvas.height = bitmap.height * scaleFactor;
        const context = renderCanvas.getContext("2d");

        for (let x = 0; x < bitmap.width; x++) {
            for (let y = 0; y < bitmap.height; y++) {
                const pixel = bitmap.get(x, y);
                if (pixel) {
                    context!.fillStyle = palette[pixel];
                    context!.fillRect(x * scaleFactor, y * scaleFactor, scaleFactor, scaleFactor);
                }
                else {
                    context!.clearRect(x * scaleFactor, y * scaleFactor, scaleFactor, scaleFactor)
                }
            }
        }

        output.push(renderCanvas.toDataURL());
    }

    for (let i = 0; i < output.length; i++) {
        browserDownloadDataUri(output[i], "image" + i + ".png")
    }
}

declare const GIF: any;

function toHexColor(i: number) {
    let color = i.toString(16);

    while (color.length < 6) {
        color = "0" + color;
    }

    return "#" + color;
}

export async function exportAnimationsAsGifs(scaleFactor: number) {
    const project = getTilemapProject();

    const animations = project.getAssets(AssetType.Animation) as pxt.Animation[];
    const palette = getProjectPalette();

    let alphaColor: number;

    for (let i = 0; i < 17; i++) {
        const color = toHexColor(i);
        alphaColor = i;

        if (!palette.some(c => c.toLowerCase() === color.toLowerCase())) {
            break;
        }
    }

    const rendered = await Promise.all(animations.map(async animation => {
        const gif = new GIF({
            workers: 2,
            quality: 1,
            transparent: alphaColor
        });

        for (const frame of animation.frames) {
            const canvas = document.createElement("canvas");
            canvas.width = frame.width * scaleFactor;
            canvas.height = frame.height * scaleFactor;

            const context = canvas.getContext("2d")!;

            context.clearRect(0, 0, canvas.width, canvas.height)

            const bitmap = pxt.sprite.Bitmap.fromData(frame);

            for (let x = 0; x < bitmap.width; x++) {
                for (let y = 0; y < bitmap.height; y++) {
                    const pixel = bitmap.get(x, y);
                    if (pixel) {
                        context!.fillStyle = palette[pixel];
                        context!.fillRect(x * scaleFactor, y * scaleFactor, scaleFactor, scaleFactor);
                    }
                    else {
                        context.fillStyle = toHexColor(alphaColor)
                        context!.fillRect(x * scaleFactor, y * scaleFactor, scaleFactor, scaleFactor)
                    }
                }
            }

            gif.addFrame(canvas, { delay: animation.interval });
        }

        return render(gif);
    }));

    for (let i = 0; i < rendered.length; i++) {
        browserDownloadDataUri(URL.createObjectURL(rendered[i]), "animation" + i + ".gif")
    }
}

function render(gif: GIF): Promise<Blob> {
    return new Promise((resolve, reject) => {
        gif.on("finished", (blob, data) => {
            resolve(blob);
        });

        gif.on("abort", reject);

        gif.render();
    })
}


// function createProjectBlobAsyncOld(name: string, assetTS: string, assetJRES: string, testTS: string) {
//     const config = JSON.stringify({
//         "name": name,
//         "dependencies": {
//             "device": "*" // required for arcade
//         },
//         "description": "An asset pack for MakeCode Arcade",
//         "files": [
//             MAIN_BLOCKS,
//             MAIN_TS,
//             ASSET_JRES,
//             ASSET_TS
//         ],
//         "testFiles": [
//             TEST_TS
//         ]
//     }, null, 4);


//     const files: {[index: string]: string} = {};
//     files[PXT_JSON] = config;
//     files[MAIN_TS] = PROJECT_COMMENT;
//     files[TEST_TS] = testTS;
//     files[ASSET_TS] = assetTS;
//     files[ASSET_JRES] = assetJRES;
//     files[README_MD] = ""
//     files[MAIN_BLOCKS] =`<xml xmlns="http://www.w3.org/1999/xhtml"><variables></variables><block type="pxt-on-start" x="0" y="0"></block></xml>`;


//     const project: PXTHexFile = {
//         meta: {
//             cloudId: "pxt/arcade",
//             targetVersions: {},
//             name: name,
//             editor: "tsprj"
//         },
//         source: JSON.stringify(files)
//     };

//     return lzmaCompressAsync(JSON.stringify(project));
// }

// export async function downloadProjectAsync(name: string, assets: AssetInfo[]) {
//     let assetTS = "";

//     const assetJRES: {[index: string]: JRes | string} = {};
//     const takenNames: {[index: string]: boolean} = {};

//     const projectNamespace = escapeIdentifier(name) + "Sprites";
//     const qualifiedNames: string[] = [];


//     // @ts-ignore
//     assetJRES["*"] = {
//         namespace: projectNamespace,
//         mimeType: IMAGE_MIME_TYPE
//     }

//     for (const asset of assets) {
//         const identifier = escapeName(asset.name);

//         if (asset.jres.tilemapTile) {
//             assetJRES[identifier] = {
//                 id: identifier,
//                 data: asset.jres.data,
//                 tilemapTile: true,
//                 mimeType: IMAGE_MIME_TYPE
//             };
//             assetTS += `    //% fixedInstance jres blockIdentity=images._tile\n`
//         }
//         else {
//             assetJRES[identifier] = asset.jres.data;
//             assetTS += `    //% fixedInstance jres blockIdentity=images._image\n`
//         }

//         assetTS += `    export const ${identifier} = image.ofBuffer(hex\`\`);\n`
//         qualifiedNames.push(projectNamespace + "." + identifier);
//     }

//     assetTS = `namespace ${projectNamespace} {\n${assetTS}\n}\n`;

//     const testTS = `const allImages = [${qualifiedNames.join(",")}]\n${TEST_SCRIPT}`;
//     const project = await createProjectBlobAsync(name, assetTS, JSON.stringify(assetJRES), testTS);
//     return browserDownloadUInt8Array(project, name + ".mkcd");



//     function escapeName(name: string) {
//         const escaped = escapeIdentifier(name);

//         if (!takenNames[escaped]) {
//             takenNames[escaped] = true;
//             return escaped;
//         }

//         let index = 2;
//         while (takenNames[escaped + index]) {
//             index++;
//         }

//         takenNames[escaped + index] = true;
//         return escaped + index;
//     }
// }

export async function downloadTypeScriptAsync(name: string, assets: AssetInfo[]) {
    let assetTS = "";

    let takenNames: {[index: string]: boolean} = {};

    for (const asset of assets) {
        assetTS += `const ${escapeName(asset.name)} = ${imgEncodeJRESImage(asset.jres)};\n`
    }

    return browserDownloadText(assetTS, name + ".ts");

    function escapeName(name: string) {
        const escaped = escapeIdentifier(name);

        if (!takenNames[escaped]) {
            takenNames[escaped] = true;
            return escaped;
        }

        let index = 2;
        while (takenNames[escaped + index]) {
            index++;
        }

        takenNames[escaped + index] = true;
        return escaped + index;
    }
}

export async function downloadTilesetAsync(categoryName: string) {
    const config = {
        "name": categoryName,
        "dependencies": {
            "device": "*" // required for arcade
        },
        "description": "An asset pack for MakeCode Arcade",
        "files": [
            "tiles.jres",
            "tiles.ts"
        ],
        "testFiles": [
        ]
    };



    const files: {[index: string]: string} = {};

    const project = getTilemapProject();

    const tmjres = project.getProjectTilesetJRes();

    const namespaceName = "customTiles_" + categoryName;

    tmjres["*"].namespace = namespaceName;

    let outTs = "";

    for (const key of Object.keys(tmjres)) {
        if (key === "*") continue;
        const entry = tmjres[key];

        if (entry.mimeType === pxt.TILEMAP_MIME_TYPE) {
            delete tmjres[key];
            continue;
        }

        let id = key;
        if (key.indexOf("myTiles.") === 0) {
            delete tmjres[key];
            id = namespaceName + "." + (key.split(".")[1])
            tmjres[id] = entry;
        }

        outTs += `    //% fixedInstance jres blockIdentity=images._tile\n`
        outTs += `    //% tags="tile category-${categoryName}"\n`
        outTs += `    export const ${key} = image.ofBuffer(hex\`\`);\n`
    }

    outTs = `namespace ${namespaceName} {\n${outTs}}\n`;

    files[PXT_JSON] = JSON.stringify(config, null, 4);
    files["tiles.ts"] = outTs;
    files["tiles.jres"] = JSON.stringify(tmjres, null, 4);

    const out: PXTHexFile = {
        meta: {
            cloudId: "pxt/arcade",
            targetVersions: {},
            name: categoryName,
            editor: "tsprj"
        },
        source: JSON.stringify(files)
    };

    const blob = await lzmaCompressAsync(JSON.stringify(out));
    return browserDownloadUInt8Array(blob, categoryName + ".mkcd");
}