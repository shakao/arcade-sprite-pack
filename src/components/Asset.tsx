import React from 'react';
import '../styles/Asset.css';

export interface AssetInfo {
    name: string;
    jres: string;
}

interface AssetProps {
    info: AssetInfo;
}

export class Asset extends React.Component<AssetProps, {}> {
    render() {
        const { name, jres } = this.props.info;

        return <div className="asset">
            <div className="asset-img">{jres}</div>
            <div className="asset-title"><span>{name}</span></div>
        </div>
    }
}