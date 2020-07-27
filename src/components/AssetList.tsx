import React from 'react';
import { Asset, AssetInfo } from './Asset';
import '../styles/AssetList.css';

interface AssetListState {
    items: AssetInfo[];
    selected?: string;
}

class AssetList extends React.Component<{}, AssetListState> {
    constructor(props: {}) {
        super(props);
        this.state = { items: [] };
    }

    render() {
        const { items } = this.state;

        return <div id="asset-list">
            <div className="asset-list-buttons">
                <div className="asset-button">+</div>
                <div className="asset-button">x</div>
                <div className="asset-button">Tt</div>
            </div>
            <div>
                { items.map((item, i) => {
                    return <Asset key={i} info={item} />
                }) }
            </div>
        </div>
    }
}

export default AssetList