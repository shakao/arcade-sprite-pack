import React from 'react';
import { JRESImage } from '../images';
import '../styles/Asset.css';

export interface AssetInfo {
    name: string;
    jres: JRESImage;
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
            <div className="asset-img">
                <img src={jres.previewURI} alt="Preview of asset" />
            </div>
            <div className="asset-title"><span>{name}</span></div>
        </div>
    }
}