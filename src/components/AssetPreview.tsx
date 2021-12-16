import React, { useState } from 'react';
import { getTilemapProject } from '../project';

import "../styles/AssetPreview.css";
import { generatePreviewURI } from '../util';


export interface AssetPreviewProps {
    asset: pxt.Asset;
    selected?: boolean;
    onClick: (asset: pxt.Asset) => void;
}

export const AssetPreview = (props: AssetPreviewProps) => {
    const { asset, selected, onClick } = props;

    const [ revision, setRevision ] = useState(0);
    const project = getTilemapProject();

    let onAssetChange = () => {
        setRevision(revision + 1);
        project.removeChangeListener(asset.type, onAssetChange);
    }
    project.addChangeListener(asset, onAssetChange);

    let updated = project.lookupAsset(asset.type, asset.id);
    generatePreviewURI(updated);

    return <div className={`asset-preview ${selected ? "selected" : ""}`} onClick={() => onClick(updated)}>
        <img src={updated.previewURI} />
    </div>
}