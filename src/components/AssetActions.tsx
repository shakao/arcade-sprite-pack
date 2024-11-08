import React from "react";
import { newTilemapProject } from "../project";
import { AlertProps } from "./Alert";

import '../styles/AssetActions.css';
import { downloadProjectAsync, downloadScaledSprites, downloadTilesetAsync, exportAnimationsAsGifs } from "../export";
import { importScriptAsync } from "../import";


interface AssetActionsProps {
    showAlert(alert: AlertProps): void;
}

export const AssetActions = (props: AssetActionsProps) => {
    return <div className="asset-list-buttons">
    <div className="asset-button" title="Clear all assets" onClick={() => onDeleteButtonClick(props)}>
        <i className="icon delete"></i>
    </div>
    <div className="asset-button" title="Import assets" onClick={() => onImportButtonClick(props)}>
        <i className="icon upload"></i>
    </div>
    <div className="asset-button" title="Export assets" onClick={() => onExportButtonClick(props)}>
        <i className="icon download"></i>
    </div>
</div>
}

function onAddButtonClick() {

}

function onDeleteButtonClick(props: AssetActionsProps) {
    const { showAlert } = props;
    showAlert({
        icon: "exclamation triangle",
        title: "WARNING",
        text: "This will delete ALL assets in this project. You will not be able to undo this action.",
        options: [{
                text: "Delete All",
                style: {
                    backgroundColor: "#dc3f34"
                },
                onClick: () => {
                    newTilemapProject(true);
                }
            }]
    }
    );
}

function onImportButtonClick(props: AssetActionsProps) {
    const { showAlert } = props;

    showAlert({
        icon: "upload",
        type: "import",
        title: "Import Sprites",
        text: "Paste a URL from MakeCode Arcade or drag and drop PNG files to import existing sprites.",
        options: [{
                text: "Add to project",
                onClick: (input) => {
                    if (input) importScriptAsync(input)
                }
            },
            {
                text: "Overwrite project",
                onClick: (input) => {
                    if (input) {
                        newTilemapProject(true);
                        importScriptAsync(input)
                    }
                }
            }]
    });
}

function onExportButtonClick(props: AssetActionsProps) {
    const { showAlert } = props;
    showAlert({
        icon: "download",
        title: "Export",
        text: "Choose export method",
        options: [{
                text: "Export .mkcd file",
                onClick: (input) => {
                    downloadProjectAsync("project");
                }
            },
            {
                text: "Export tileset .mkcd file",
                onClick: (input) => {
                    setTimeout(() => {
                        showAlert({
                            icon: "download",
                            title: "Download Tileset",
                            text: "Enter a name for the tileset category. Only letters and numbers are allowed (no spaces).",
                            type: "tileset",
                            options: [{
                                text: "download",
                                onClick: (input) => {
                                    input = input?.replace(/[^a-zA-Z\d]/, "") || "CustomTiles";
                                    downloadTilesetAsync(input);
                                }
                            }]
                        })
                    })
                }
            },
            {
                text: "Export PNGs",
                onClick: (input) => {
                    setTimeout(() => {
                        showAlert({
                            type: "scale",
                            icon: "download",
                            title: "Export PNGs",
                            text: "Enter scale factor",
                            options: [
                                {
                                    text: "Export",
                                    onClick: (input) => {
                                        downloadScaledSprites(input ? parseInt(input) : 1);
                                    }
                                }]
                        });
                    }, 100)
                }
            },
            {
                text: "Export animations as GIFs",
                onClick: (input) => {
                    setTimeout(() => {
                        showAlert({
                            type: "scale",
                            icon: "download",
                            title: "Export animations as GIFs",
                            text: "Enter scale factor",
                            options: [
                                {
                                    text: "Export",
                                    onClick: (input) => {
                                        exportAnimationsAsGifs(input ? parseInt(input) : 1)
                                    }
                                }]
                        });
                    }, 100)
                }
            }]
    });
}