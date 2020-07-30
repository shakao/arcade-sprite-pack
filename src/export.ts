import { AssetInfo, Asset } from "./components/Asset";
import { lzmaCompressAsync } from "./lzma";
import { JRes } from "./share";
import { escapeIdentifier, IMAGE_MIME_TYPE, browserDownloadUInt8Array, browserDownloadText } from "./util";
import { imgEncodeJRESImage } from "./images";


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


function createProjectBlobAsync(name: string, assetTS: string, assetJRES: string, testTS: string) {
    const config = JSON.stringify({
        "name": name,
        "dependencies": {
            "device": "*" // required for arcade
        },
        "description": "An asset pack for MakeCode Arcade",
        "files": [
            MAIN_BLOCKS,
            MAIN_TS,
            ASSET_JRES,
            ASSET_TS
        ],
        "testFiles": [
            TEST_TS
        ]
    }, null, 4);


    const files: {[index: string]: string} = {};
    files[PXT_JSON] = config;
    files[MAIN_TS] = PROJECT_COMMENT;
    files[TEST_TS] = testTS;
    files[ASSET_TS] = assetTS;
    files[ASSET_JRES] = assetJRES;
    files[README_MD] = ""
    files[MAIN_BLOCKS] =`<xml xmlns="http://www.w3.org/1999/xhtml"><variables></variables><block type="pxt-on-start" x="0" y="0"></block></xml>`;


    const project: PXTHexFile = {
        meta: {
            cloudId: "pxt/arcade",
            targetVersions: {},
            name: name,
            editor: "tsprj"
        },
        source: JSON.stringify(files)
    };

    return lzmaCompressAsync(JSON.stringify(project));
}

export async function downloadProjectAsync(name: string, assets: AssetInfo[]) {
    let assetTS = "";

    const assetJRES: {[index: string]: JRes | string} = {};
    const takenNames: {[index: string]: boolean} = {};

    const projectNamespace = escapeIdentifier(name) + "Sprites";
    const qualifiedNames: string[] = [];


    // @ts-ignore
    assetJRES["*"] = {
        namespace: projectNamespace,
        mimeType: IMAGE_MIME_TYPE
    }

    for (const asset of assets) {
        const identifier = escapeName(asset.name);

        if (asset.jres.tilemapTile) {
            assetJRES[identifier] = {
                id: identifier,
                data: asset.jres.data,
                tilemapTile: true,
                mimeType: IMAGE_MIME_TYPE
            };
            assetTS += `    //% fixedInstance jres blockIdentity=images._tile\n`
        }
        else {
            assetJRES[identifier] = asset.jres.data;
            assetTS += `    //% fixedInstance jres blockIdentity=images._image\n`
        }

        assetTS += `    export const ${identifier} = image.ofBuffer(hex\`\`);\n`
        qualifiedNames.push(projectNamespace + "." + identifier);
    }

    assetTS = `namespace ${projectNamespace} {\n${assetTS}\n}\n`;

    const testTS = `const allImages = [${qualifiedNames.join(",")}]\n${TEST_SCRIPT}`;
    const project = await createProjectBlobAsync(name, assetTS, JSON.stringify(assetJRES), testTS);
    return browserDownloadUInt8Array(project, name + ".mkcd");



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