import React from "react";
import { AssetType } from "../project";
import { AlertProps } from "./Alert";
import { AssetActions } from "./AssetActions";
import { AssetTab, AssetTabBar } from "./AssetTabBar";

import "../styles/TopBar.css";


export interface TopBarProps {
    showAlert(alert: AlertProps): void;
    onTabSelected(type: pxt.AssetType): void;
    activeTab: pxt.AssetType;
}

export const TopBar = (props: TopBarProps) => {
    const { onTabSelected, activeTab, showAlert } = props;

    const options: AssetTab[] = [
        {
            type: AssetType.Image,
            name: "Images",
            title: "Images"
        },
        {
            type: AssetType.Animation,
            name: "Animations",
            title: "Animations"
        },
        {
            type: AssetType.Tile,
            name: "Tiles",
            title: "Tiles"
        },
        {
            type: AssetType.Tilemap,
            name: "Tilemaps",
            title: "Tilemaps"
        }
    ];

    return <div className="asset-top-bar">
        <div className="asset-tab-bar-container">
            <AssetTabBar options={options} onTabSelected={onTabSelected} activeTab={activeTab} />
        </div>
        <div className="asset-actions-container">
            <AssetActions showAlert={showAlert}/>
        </div>
    </div>
}