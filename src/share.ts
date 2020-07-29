import { getJRESImageFromDataString, getJRESImageFromImageLiteral, JRESImage } from "./images";
import { IMAGE_MIME_TYPE } from "./util";

const backendEndpoint = "https://makecode.com/api";

export interface JRes {
    id: string; // something like "sounds.bark"
    data: string;
    dataEncoding?: string; // must be "base64" or missing (meaning the same)
    icon?: string; // URL (usually data-URI) for the icon
    namespace?: string; // used to construct id
    mimeType: string;
    tilemapTile?: boolean;
    tileset?: string[];
}

export const arcadePalette = [
    "#000000",
    "#ffffff",
    "#ff2121",
    "#ff93c4",
    "#ff8135",
    "#fff609",
    "#249ca3",
    "#78dc52",
    "#003fad",
    "#87f2ff",
    "#8e2ec4",
    "#a4839f",
    "#5c406c",
    "#e5cdc4",
    "#91463d",
    "#000000"
];

/*
{
    "kind": "script",
    "id": "62736-71028-62577-28752",
    "shortid": "_UAVXEwU7RAew",
    "time": 1595883166,
    "name": "Untitled",
    "description": "Made with ❤️ in Microsoft MakeCode Arcade.",
    "target": "arcade",
    "editor": "tsprj",
    "meta": {
        "versions": {
            "branch": "v1.0.14",
            "tag": "v1.0.14",
            "commits": "https://github.com/microsoft/pxt-arcade/commits/1460ac1c88950799eb51c9c297588c8abdc91077",
            "target": "1.0.14",
            "pxt": "6.1.41"
        },
        "blocksHeight": 0,
        "blocksWidth": 0
    },
    "thumb": false
}
*/

export interface ScriptMeta {
    kind: "script";
    id: string;
    shortid: string;
    time: number;
    name: string;
    description: string;
    target: string;
    editor: string;
    meta: {
        versions: {
            branch: string;
            tag: string;
            commits: string;
            target: string;
            pxt: string;
        };
        blocksHeight: number;
        blocksWidth: number;
    };
    thumb: boolean;
}

export interface ScriptInfo {
    meta: ScriptMeta;
    files: {[index: string]: string};
    customPalette?: string[];
    images: JRESImage[];
}


export async function fetchMakeCodeScriptAsync(url: string) {
    // https://makecode.com/_UAVXEwU7RAew
    // https://arcade.makecode.com/62736-71028-62577-28752
    let scriptID = url.trim();

    if (scriptID.indexOf("/") !== -1) {
        scriptID = scriptID.substr(scriptID.lastIndexOf("/") + 1)
    }

    const meta: ScriptMeta = await httpGetJSONAsync(backendEndpoint + "/" + scriptID);

    // A mapping of filenames to filecontents
    const filesystem: {[index: string]: string} = await httpGetJSONAsync(backendEndpoint + "/" + scriptID + "/text");

    const config = filesystem["pxt.json"];

    let palette = arcadePalette;
    let paletteIsCustom = false;

    if (config) {
        try {
            let parsedConfig = JSON.parse(config);

            if (parsedConfig?.palette && Array.isArray(parsedConfig.palette)) {
                palette = parsedConfig.palette.slice()
                paletteIsCustom = true;
            }
        }
        catch (e) {
            // ignore
        }
    }

    const projectImages = grabImagesFromProject(filesystem);

    return {
        meta,
        files: filesystem,
        projectImages: projectImages,
        customPalette: paletteIsCustom ? palette : undefined
    };
}


export function grabImagesFromProject(filesystem: {[index: string]: string}, palette = arcadePalette) {
    // Don't bother checking python and blocks files, they should all get converted to a matching ts
    // file that will also contain all image literals
    const typescriptFiles = Object.keys(filesystem).filter(filename =>
        filename.endsWith(".ts") || filename.endsWith(".jres"));

    // Grab any existing images in the project
    const projectImages: JRESImage[] = [];
    for (const filename of typescriptFiles) {

        const fileText = filesystem[filename];
        if (filename.endsWith("jres")) {
            projectImages.push(...grabImagesFromJRES(fileText, filename, palette));
        }
        else {
            projectImages.push(...grabImagesFromTypeScript(fileText, filename, palette));
        }
    }

    // Dedupe the images based on their content
    const seenImages: {[index: string]: JRESImage} = {};

    for (const image of projectImages) {
        const existing = seenImages[image.data];
        // Prefer images that have qualified names (from JRES)
        if (!existing || (!existing.qualifiedName && image.qualifiedName)) {
            seenImages[image.data] = image;
        }
    }

    return Object.keys(seenImages).map(data => seenImages[data]);
}

function grabImagesFromJRES(jresText: string, filename: string, palette = arcadePalette): JRESImage[] {
    let jres: {[index: string]: JRes | string};

    try {
        jres = JSON.parse(jresText);
    }
    catch (e) {
        return [];
    }

    const metaEntry = jres["*"] as JRes | undefined;

    const metaMime = metaEntry?.mimeType || "";
    const metaNamespace = metaEntry?.namespace || "";

    const result: JRESImage[] = [];

    for (const id of Object.keys(jres)) {
        if (id === "*") continue;

        let entry = jres[id];

        if (typeof entry === "string") {
            if (metaMime === IMAGE_MIME_TYPE) {
                result.push(getJRESImageFromDataString(entry, palette, metaNamespace ? metaNamespace + "." + id : id, false, filename));
            }
        }
        else if (entry.mimeType === IMAGE_MIME_TYPE) {
            result.push(getJRESImageFromDataString(entry.data, palette, metaNamespace ? metaNamespace + "." + id : id, entry.tilemapTile, filename));
        }
    }

    return result
}

function grabImagesFromTypeScript(fileText: string, filename: string, palette = arcadePalette) {
    const literalRegex = /img\s*`[\s\da-f.#tngrpoyw]*`/img;

    const res: JRESImage[] = [];

    fileText.replace(literalRegex, match => {
        res.push(getJRESImageFromImageLiteral(match, palette, filename))
        return "";
    });

    return res;
}


function httpGetJSONAsync(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();

        request.addEventListener("error", err => {
            reject(err);
        });

        request.addEventListener("load", () => {
            try {
                resolve(JSON.parse(request.responseText));
            }
            catch (e) {
                reject(e);
            }
        });

        request.open("GET", url);
        request.send();
    });
}