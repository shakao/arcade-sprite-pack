import React from 'react';
import { AlertProps } from './Alert';

import "../styles/AssetSideBar.css";
import { AssetList } from './AssetList';
import { AssetDetails } from './AssetDetails';

interface AssetSidebarProps {
    showAlert(alert: AlertProps): void;
    activeTab: pxt.AssetType;
    asset: pxt.Asset;
    onAssetSelected: (asset: pxt.Asset) => void;
}

export const AssetSidebar = (props: AssetSidebarProps) => {
    const { showAlert, activeTab, asset, onAssetSelected } = props;
    return <div className="asset-sidebar">
        <div className="asset-details-container">
            <AssetDetails asset={asset} showAlert={showAlert} />
        </div>
        <div className="asset-list-container">
            <AssetList activeTab={activeTab} asset={asset} onAssetSelected={onAssetSelected} />
        </div>
    </div>
}