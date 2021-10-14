import React from "react";
import { AssetType } from "../project";
import { AlertProps } from "./Alert";
import { Dropdown, DropdownItem } from "./Dropdown";

import '../styles/AssetDetails.css';
import { Button } from "./Button";


interface AssetDetailsProps {
    showAlert(alert: AlertProps): void;
    asset: pxt.Asset;
}

const tileDropdownOptions: DropdownItem[] = [
    {
        id: "8",
        label: "8x8"
    },
    {
        id: "16",
        label: "16x16"
    },
    {
        id: "32",
        label: "32x32"
    }
]


export const AssetDetails = (props: AssetDetailsProps) => {
    const { asset } = props;

    const showTileSizeDropdown = asset.type === AssetType.Tile || asset.type === AssetType.Tilemap;

    const onTileSizeSelected = (size: string) => {

    }

    const onDuplicate = () => {

    }

    const onDelete = () => {

    }

    return <div className="asset-details">
        <div className="asset-details-header">
            Asset Options
        </div>
        <div className="asset-details-parameters">
            {showTileSizeDropdown &&
                <div className="asset-details-key-value">
                    <div className="asset-details-key">
                        Tile Size:
                    </div>
                    <Dropdown
                        items={tileDropdownOptions}
                        onItemSelected={onTileSizeSelected}
                        selectedId={"" + getTileWidth(asset)}/>
                </div>
            }
            <Button label="Duplicate" title="Create a copy of this asset" onClick={onDuplicate} />
            <Button label="Delete" title="Delete this asset" onClick={onDelete} />
        </div>
    </div>
}

function getTileWidth(asset: pxt.Asset) {
    if (asset.type === AssetType.Tilemap) {
        return (asset as pxt.ProjectTilemap).data.tileset.tileWidth;
    }
    else if (asset.type === AssetType.Tile) {
        return (asset as pxt.Tile).bitmap.width;
    }
}