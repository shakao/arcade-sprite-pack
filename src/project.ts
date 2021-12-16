/// <reference path="../node_modules/pxt-core/built/pxtlib.d.ts" />

let project: pxt.TilemapProject;
let projectPalette = [
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

const STORAGE_KEY = "tilemap-project";

export const AssetType = {
    Image: "image" as pxt.AssetType,
    Tile: "tile" as pxt.AssetType,
    Tilemap: "tilemap" as pxt.AssetType,
    Animation: "animation" as pxt.AssetType
}
export function getTilemapProject() {
    if (!project) newTilemapProject();
    return project;
}

export function newTilemapProject(empty = false) {
    project = new pxt.TilemapProject();
    projectPalette = [
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
    ]

    if (!empty) {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const blob = JSON.parse(saved);
            project.loadAssetsJRes(blob.images);
            project.loadTilemapJRes(blob.tilemaps);
        }
    }

    return project;
}

export function getProjectPalette() {
    return projectPalette.slice();
}

export function saveProject() {
    if (project) {
        const saveBlob = {
            images: project.getProjectAssetsJRes(),
            tilemaps : project.getProjectTilesetJRes()
        }

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saveBlob));
    }
}
