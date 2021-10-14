import React from "react";

import "../styles/AssetTabBar.css";

export interface AssetTab {
    type: pxt.AssetType;
    name: string;
    title: string;
}

export interface AssetTabBarProps {
    activeTab: pxt.AssetType;
    options: AssetTab[];
    onTabSelected(type: pxt.AssetType): void;
}

export const AssetTabBar = (props: AssetTabBarProps) => {
    const { options, onTabSelected, activeTab } = props;

    return <div className="asset-tab-bar">
        { options.map(({ type, name, title }) => (
            <div key={type} className={`asset-tab ${activeTab === type ? "selected" : ""} ${type}`} title={title} onClick={() => onTabSelected(type)}>
                <span className="asset-tab-name">{name}</span>
            </div>
            )
        ) }
    </div>
}