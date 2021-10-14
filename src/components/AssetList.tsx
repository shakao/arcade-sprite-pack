import React from "react";
import { AssetType, getTilemapProject } from "../project";
import { AssetPreview } from "./AssetPreview";

import "../styles/AssetList.css";
import { Button } from "./Button";

export interface AssetListProps {
    activeTab: pxt.AssetType;
    asset: pxt.Asset;
    onAssetSelected: (asset: pxt.Asset) => void;
}

export const AssetList = (props: AssetListProps) => {
    const { activeTab, onAssetSelected } = props;
    const assets = getTilemapProject().getAssets(activeTab);
    assets.sort(compareInternalId);

    let pluralized = "";

    switch (activeTab) {
        case AssetType.Image:
            pluralized = "Images";
            break;
        case AssetType.Tile:
            pluralized = "Tiles";
            break;
        case AssetType.Animation:
            pluralized = "Animations";
            break;
        case AssetType.Tilemap:
            pluralized = "Tilemaps";
            break;
    }

    const createNewAsset = () => {
        onAssetSelected(createEmptyAsset(activeTab));
    }

    return <div className="asset-list-container">
        <div className="asset-details-header">
            All {pluralized}
        </div>
        <div className="asset-list">
            { assets.map(a => <AssetPreview key={a.internalID} asset={a} onClick={onAssetSelected} />) }
            <Button label="Create New" title="Create New Asset" onClick={createNewAsset} />
        </div>
    </div>
}

function compareInternalId(a: pxt.Asset, b: pxt.Asset) {
    return a.internalID - b.internalID;
}

export function createEmptyAsset(kind: pxt.AssetType) {
    let asset: pxt.Asset;
    const project = getTilemapProject();
    switch (kind) {
        case AssetType.Image:
            asset = project.createNewImage(16, 16);
            break;
        case AssetType.Tile:
            asset = project.createNewTile(new pxt.sprite.Bitmap(16, 16).data());
            break;
        case AssetType.Animation:
            asset = project.createNewAnimation(16, 16);
            break;
        case AssetType.Tilemap:
            const [id, tilemap] = project.createNewTilemap("level", 16, 16);
            asset = project.lookupAsset(AssetType.Tilemap, id);
            break;
    }

    return asset!;
}