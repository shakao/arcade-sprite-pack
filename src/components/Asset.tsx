import React from 'react';
import '../styles/Asset.css';

export interface AssetInfo {
    name: string;
    jres: string;
}

interface AssetProps {
    info: AssetInfo;
    selected: boolean;
    onClick?: (e: any) => void;
}

export class Asset extends React.Component<AssetProps, {}> {
    render() {
        const { info, selected, onClick } = this.props;
        const { name, jres } = info;

        return <div className={`asset ${selected ? "selected" : ""}`} onClick={onClick}>
            <div className="asset-img">{jres}</div>
            <div className="asset-title"><span>{name}</span></div>
        </div>
    }
}