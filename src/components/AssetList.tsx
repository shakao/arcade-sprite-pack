import React from 'react';
import { Asset, AssetInfo } from './Asset';
import '../styles/AssetList.css';

interface AssetListState {
    items: AssetInfo[];
    selected: string;
}

const DEFAULT_NAME = "mySprite";

class AssetList extends React.Component<{}, AssetListState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            items: [{
                name: DEFAULT_NAME,
                jres: ""
            }],
            selected: DEFAULT_NAME
        };
    }

    /** ASSET HANDLING */

    addAsset(name?: string) {
        const items = this.state.items;
        items.push({
            name: this.getValidAssetName(name || DEFAULT_NAME),
            jres: ""
        })
        this.setState({ items })
    }

    deleteAsset(name: string) {
        const items = this.state.items;
        const index = this.getAssetIndex(name);
        items.splice(index, 1);
        this.setState({
            items,
            selected: items[Math.max(index - 1, 0)].name
         })
    }

    getValidAssetName(name: string): string {
        name = name.replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
        while (this.getAssetIndex(name) >= 0) {
            let r = name.match(/^(.*?)(\d+)$/);
            // increment counter by one
            name = r ? r[1] + (parseInt(r[2], 10) + 1) : name + "2";
        }
        return name;
    }

    getAssetIndex(name: string): number {
        return this.state.items.findIndex((el) => el.name === name);
    }

    /** EVENT LISTENERS */

    onAssetClick = (name: string): (e: any) => void => {
        return () => this.setState({ selected: name });
    }

    onAddButtonClick = () => {
        this.addAsset(DEFAULT_NAME);
    }

    onDeleteButtonClick = () => {
        this.deleteAsset(this.state.selected);
    }

    render() {
        const { items, selected } = this.state;

        return <div id="asset-list">
            <div className="asset-list-buttons">
                <div className="asset-button" onClick={this.onAddButtonClick}>+</div>
                <div className="asset-button" onClick={this.onDeleteButtonClick}>x</div>
                <div className="asset-button">Tt</div>
            </div>
            <div>
                { items.map((item, i) => {
                    return <Asset
                        key={i}
                        info={item}
                        selected={item.name === selected}
                        onClick={this.onAssetClick(item.name)} />
                }) }
            </div>
        </div>
    }
}

export default AssetList