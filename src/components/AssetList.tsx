import React from 'react';
import { Asset, AssetInfo } from './Asset';
import '../styles/AssetList.css';

interface AssetListProps {
    onItemSelect?: (item: AssetInfo) => void;
}

interface AssetListState {
    items: AssetInfo[];
    selected: number;
}

const DEFAULT_NAME = "mySprite";
const DEFAULT_JRES = "hwQQABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=="

class AssetList extends React.Component<AssetListProps, AssetListState> {
    constructor(props: AssetListProps) {
        super(props);
        this.state = {
            items: [{ name: DEFAULT_NAME, jres: DEFAULT_JRES }],
            selected: 0
        };
    }

    componentDidMount() {
        window.addEventListener("message", this.handleMessage);
    }

    componentWillUnmount() {
        window.removeEventListener("message", this.handleMessage);
    }

    handleMessage = (msg: any) => {
        const data = msg.data;
        switch (data.type) {
            case "update":
                const items = this.state.items;
                items[this.state.selected].jres = data.message;
                this.setState({ items });
                break;
            default:
                break;
        }
    }

    getJres = () => {
        // this.postMessage({ type: "update" })
    }

    /** ASSET HANDLING */

    addAsset(name?: string) {
        const items = this.state.items;
        items.push({
            name: this.getValidAssetName(name || DEFAULT_NAME),
            jres: DEFAULT_JRES
        })
        this.setState({ items })
    }

    deleteAsset(index: number) {
        const items = this.state.items;
        items.splice(index, 1);
        this.setState({
            items,
            selected: Math.max(index - 1, 0)
         })
    }

    getAssetIndex(name: string): number {
        return this.state.items.findIndex((el) => el.name === name);
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

    /** ASSET EVENT LISTENERS */

    onAssetClick = (asset: AssetInfo): (e: any) => void => {
        return () => {
            if (this.props.onItemSelect) this.props.onItemSelect(asset);
            this.setState({ selected: this.getAssetIndex(asset.name) });
        }
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
                <div className="asset-button" title="Add asset" onClick={this.onAddButtonClick}>
                    <i className="icon plus"></i>
                </div>
                <div className="asset-button" title="Delete asset" onClick={this.onDeleteButtonClick}>
                    <i className="icon delete"></i>
                </div>
                <div className="asset-button" title="Rename asset">
                    <i className="icon i cursor"></i>
                </div>
            </div>
            <div>
                { items.map((item, i) => {
                    return <Asset
                        key={i}
                        info={item}
                        selected={i === selected}
                        onClick={this.onAssetClick(item)} />
                }) }
            </div>
        </div>
    }
}

export default AssetList