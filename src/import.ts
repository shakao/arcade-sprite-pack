import { getProjectPalette, getTilemapProject } from "./project";
import { ScriptMeta } from "./share";

const backendEndpoint = "https://makecode.com/api";


export async function importScriptAsync(url: string) {
    // https://makecode.com/_UAVXEwU7RAew
    // https://arcade.makecode.com/62736-71028-62577-28752
    let scriptID = url.trim();

    if (scriptID.indexOf("/") !== -1) {
        scriptID = scriptID.substr(scriptID.lastIndexOf("/") + 1)
    }

    const meta: ScriptMeta = await httpGetJSONAsync(backendEndpoint + "/" + scriptID);
    const filesystem: {[index: string]: string} = await httpGetJSONAsync(backendEndpoint + "/" + scriptID + "/text");

    loadImagesFromProject(filesystem);
}

export function loadImagesFromProject(filesystem: pxt.Map<string>) {
    // A mapping of filenames to filecontents
    const config = filesystem["pxt.json"];

    let palette = getProjectPalette();
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

    const project = getTilemapProject();

    for (const file of Object.keys(filesystem)) {
        if (file.endsWith(".jres")) {
            const jres = JSON.parse(filesystem[file]);
            if (file.indexOf("tilemap") !== -1) {
                project.loadTilemapJRes(jres);
            }
            else {
                project.loadAssetsJRes(jres);
            }
        }
        else if (file.endsWith(".ts") && !file.endsWith(".g.ts")) {
            grabImagesFromTypeScript(filesystem[file]);
        }
    }
}

function grabImagesFromTypeScript(fileText: string) {
    const literalRegex = /img\s*`[\s\da-f.#tngrpoyw]*`/img;

    const project = getTilemapProject();


    fileText.replace(literalRegex, match => {
        const bitmap = pxt.sprite.imageLiteralToBitmap(match);
        project.createNewProjectImage(bitmap.data());
        return "";
    });
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