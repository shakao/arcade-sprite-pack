import React, { useState } from "react";
import { AssetType, getTilemapProject, saveProject } from "../project";
import { AssetPreview } from "./AssetPreview";

import "../styles/AssetList.css";
import { Button } from "./Button";

export interface AssetListProps {
    activeTab: pxt.AssetType;
    asset: pxt.Asset;
    onAssetSelected: (asset: pxt.Asset) => void;
}

export const AssetList = (props: AssetListProps) => {
    const { activeTab, asset, onAssetSelected } = props;
    const project = getTilemapProject();

    const assets = project.getAssets(activeTab);
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

    const [revision, setRevision] = useState(0);

    const debouncedSave = pxt.Util.debounce(() => {
        saveProject();
    }, 500)


    const revisionListener = (revision: number) => {
        setRevision(revision);
        debouncedSave();
        project.removeProjectChangeListener(revisionListener);
    };

    project.addProjectChangeListener(revisionListener);

    return <div className="asset-list-container">
        <div className="asset-details-header">
            All {pluralized}
        </div>
        <div className="asset-list-outer">
            <div className="asset-list">
                { assets.map(a => <AssetPreview key={a.internalID} asset={a} selected={a.id == asset.id} onClick={onAssetSelected} />) }
                <Button label="Create New" title="Create New Asset" onClick={createNewAsset} />
            </div>
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

    if (!asset!.meta.displayName) {
        asset!.meta.displayName = pxt.getDefaultAssetDisplayName(kind);
        project.updateAsset(asset!);
        asset = project.lookupAsset(asset!.type, asset!.id);
    }

    return asset!;
}