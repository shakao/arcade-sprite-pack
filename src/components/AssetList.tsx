import React from 'react';
import { Asset, AssetInfo } from './Asset';
import { JRESImage, getJRESImageFromDataString } from '../images'
import { arcadePalette, fetchMakeCodeScriptAsync } from '../share';
import '../styles/AssetList.css';

interface AssetListProps {
    postMessage: (msg: any) => void;
}

interface AssetListState {
    items: AssetInfo[];
    selected: number;
    saving?: number;
}

const DEFAULT_NAME = "mySprite";
const DEFAULT_JRES = {
    data: "hwQQABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
    previewURI: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAH0lEQVQ4T2NkoBAwUqifYdQAhtEwYBgNA1A+Gvi8AAAmmAARf9qcXAAAAABJRU5ErkJggg==",
    width: 16,
    height: 16,
}

class AssetList extends React.Component<AssetListProps, AssetListState> {
    private _items: AssetInfo[];

    constructor(props: AssetListProps) {
        super(props);
        this._items =  [{ name: DEFAULT_NAME, jres: { ...DEFAULT_JRES } }];
        this.state = {
            items: this._items,
            selected: 0
        };
    }

    componentDidMount() {
        window.addEventListener("message", this.handleMessage);

        // FOR TESTING! just loading in a script to make sure all the data parsing is correct
        fetchMakeCodeScriptAsync("https://arcade.makecode.com/62736-71028-62577-28752").then((res: {projectImages: JRESImage[]}) => {
            this._items = [];
            res.projectImages.forEach((el: JRESImage) => {
                this._items.push({ name: el.qualifiedName || this.getValidAssetName(DEFAULT_NAME), jres: el })
            } )
            this.setState({items: this._items})
        })
    }

    componentWillUnmount() {
        window.removeEventListener("message", this.handleMessage);
    }

    componentDidUpdate(prevProps: AssetListProps, prevState: AssetListState) {
        if (this.state.saving !== undefined && prevState.saving === undefined) {
            this.getJres();
        }
        if (this.state.selected !== prevState.selected) {
            this.loadJres(this._items[this.state.selected]);
        }
    }

    handleMessage = (msg: any) => {
        const data = msg.data;
        switch (data.type) {
            case "update":
                const jresImage = getJRESImageFromDataString(data.message, arcadePalette);
                if (this.state.saving !== undefined) {
                    const saving = this.state.saving;
                    this._items[this.state.selected].jres = jresImage;
                    this.setState({
                        items: this._items,
                        selected: saving,
                        saving: undefined
                    });
                } else {
                    this._items[this.state.selected].jres = jresImage;
                    this.setState({ items: this._items });
                }
                break;
            default:
                break;
        }
    }

    loadJres = (asset: AssetInfo) => {
        this.props.postMessage({ type: "initialize", message: asset.jres.data });
    }

    getJres = () => {
        this.props.postMessage({ type: "update" });
    }

    /** ASSET HANDLING */

    addAsset(name?: string) {
        this._items.push({
            name: this.getValidAssetName(name || DEFAULT_NAME),
            jres: { ...DEFAULT_JRES }
        })
        this.setState({
            items: this._items,
            selected: this._items.length - 1
         });
    }

    deleteAsset(index: number) {
        this._items.splice(index, 1);
        this.setState({
            items: this._items,
            selected: Math.max(index - 1, 0)
         })
    }

    renameAsset(index: number, newName: string) {
        if (this._items[index].name !== newName) {
            this._items[index].name = this.getValidAssetName(newName);
            this.setState({ items: this._items });
        }
    }

    getAssetIndex(name: string): number {
        return this._items.findIndex((el) => el.name.toLowerCase() === name.toLowerCase());
    }

    getValidAssetName(name: string): string {
        name = name.replace(/[^a-zA-Z0-9]/g, '');
        while (this.getAssetIndex(name) >= 0) {
            let r = name.match(/^(.*?)(\d+)$/);
            // increment counter by one
            name = r ? r[1] + (parseInt(r[2], 10) + 1) : name + "2";
        }
        return name;
    }

    /** ASSET EVENT LISTENERS */

    onAssetClick = (index: number): (e: any) => void => {
        return () => {
            this.setState({ saving: index });
        }
    }

    onAssetRename = (index: number): (name: string) => void => {
        return (name: string) => { this.renameAsset(index, name) };
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
                <div className="asset-button" title="Export assets">
                    <i className="icon download"></i>
                </div>
            </div>
            <div>
                { items.map((item, i) => {
                    return <Asset
                        key={i}
                        info={item}
                        selected={i === selected}
                        onClick={this.onAssetClick(i)}
                        onRename={this.onAssetRename(i)} />
                }) }
            </div>
        </div>
    }
}

export default AssetList