import React from "react";
import { AssetType, getTilemapProject } from "../project";
import { AlertProps } from "./Alert";
import { Dropdown, DropdownItem } from "./Dropdown";

import '../styles/AssetDetails.css';
import { Button } from "./Button";
import { generatePreviewURI } from "../util";


interface AssetDetailsProps {
    showAlert(alert: AlertProps): void;
    onAssetSelected: (asset: pxt.Asset) => void;
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
    const { asset, showAlert, onAssetSelected } = props;

    const showTileSizeDropdown = asset.type === AssetType.Tile || asset.type === AssetType.Tilemap;

    const onTileSizeSelected = (size: string) => {
        const currentAsset = getTilemapProject().lookupAsset(asset.type, asset.id);
        const tileSize = parseInt(size);
        let showWarning = false;
        if (currentAsset.type === AssetType.Tile) {
            const tile = currentAsset as pxt.Tile;
            showWarning = !isEmptyBitmap(tile.bitmap) && tileSize < tile.bitmap.width;
        }
        else {
            showWarning = !isEmptyTilemap((currentAsset as pxt.ProjectTilemap).data);
        }

        if (showWarning) {
            showAlert({
                icon: "exclamation triangle",
                title: "WARNING",
                text: "This will erase the contents of the current asset. This cannot be undone. Do you want to continue?",
                options: [{
                        text: "Yes",
                        style: {
                            backgroundColor: "#dc3f34"
                        },
                        onClick: () => {
                            changeTileSize(currentAsset, tileSize);
                            onAssetSelected(currentAsset);
                        }
                    }]
            });
        }
        else {
            changeTileSize(currentAsset, tileSize);
            onAssetSelected(currentAsset);
        }
    }

    const onDuplicate = () => {
        const dup = getTilemapProject().duplicateAsset(asset);
        generatePreviewURI(dup);
        onAssetSelected(dup);
    }

    const onDelete = () => {
        showAlert({
            icon: "exclamation triangle",
            title: "WARNING",
            text: "This will delete this asset. This cannot be undone. Do you want to continue?",
            options: [{
                    text: "Yes",
                    style: {
                        backgroundColor: "#dc3f34"
                    },
                    onClick: () => {
                        getTilemapProject().removeAsset(asset);
                        onAssetSelected(null as any);
                    }
                }]
        });
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

function isEmptyBitmap(data: pxt.sprite.BitmapData) {
    const bitmap = pxt.sprite.Bitmap.fromData(data);

    for (let x = 0; x < data.width; x++) {
        for (let y = 0; y < data.height; y++) {
            if (bitmap.get(x, y)) return false;
        }
    }
    return true;
}

function isEmptyTilemap(data: pxt.sprite.TilemapData) {
    if (!isEmptyBitmap(data.layers)) return false;

    const bitmap = data.tilemap

    for (let x = 0; x < bitmap.width; x++) {
        for (let y = 0; y < bitmap.height; y++) {
            if (bitmap.get(x, y)) return false;
        }
    }
    return true;
}

function changeTileSize(asset: pxt.Asset, tileSize: number) {
    const project = getTilemapProject();

    if (asset.type === AssetType.Tile) {
        const tile = asset as pxt.Tile;
        const oldBitmap = pxt.sprite.Bitmap.fromData(tile.bitmap);
        const newBitmap = new pxt.sprite.Bitmap(tileSize, tileSize);
        newBitmap.apply(oldBitmap);
        tile.bitmap = newBitmap.data();

    }
    else {
        const tilemap = asset as pxt.ProjectTilemap;
        const newTilemap = new pxt.sprite.Tilemap(tilemap.data.tilemap.width, tilemap.data.tilemap.height);
        const newLayers = new pxt.sprite.Bitmap(tilemap.data.tilemap.width, tilemap.data.tilemap.height)
        const newData = new pxt.sprite.TilemapData(
            newTilemap, {
                tileWidth: tileSize,
                tiles: [project.getTransparency(tileSize)]
            },
            newLayers.data()
        );
        tilemap.data = newData;
    }

    generatePreviewURI(asset);
    project.updateAsset(asset);

}