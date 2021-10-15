import React from "react";
import { newTilemapProject } from "../project";
import { AlertProps } from "./Alert";

import '../styles/AssetActions.css';
import { downloadProjectAsync } from "../export";
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
    <div className="asset-button" title="Export assets" onClick={onExportButtonClick}>
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
                    newTilemapProject();
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
                        newTilemapProject();
                        importScriptAsync(input)
                    }
                }
            }]
    });
}

function onExportButtonClick() {
    downloadProjectAsync("project");
}