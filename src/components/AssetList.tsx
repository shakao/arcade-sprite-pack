import React from 'react';
import { Alert, AlertProps } from './Alert';
import { Asset, AssetInfo } from './Asset';
import { JRESImage, getJRESImageFromDataString } from '../images'
import { arcadePalette, fetchMakeCodeScriptAsync } from '../share';
import '../styles/AssetList.css';

interface AlertInfo extends AlertProps {
    type: "delete" | "import" | "warning";
}

interface AssetListProps {
    postMessage: (msg: any) => void;
}

interface AssetListState {
    items: AssetInfo[];
    selected: number;
    saving?: number;
    alert?: AlertInfo;
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
    private _inputRef!: HTMLInputElement;

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
    }

    componentWillUnmount() {
        window.removeEventListener("message", this.handleMessage);
    }

    componentDidUpdate(prevProps: AssetListProps, prevState: AssetListState) {
        if (this.state.saving !== undefined && prevState.saving === undefined) {
            this.getJres();
        }
        if (this.state.selected !== prevState.selected || this.state.selected === 0) {
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
            saving: this._items.length - 1
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

    importAssets(url: string, replace?: boolean) {
        fetchMakeCodeScriptAsync(url).then((res: {projectImages: JRESImage[]}) => {
            if (replace) this._items = [];
            res.projectImages.forEach((el: JRESImage) => {
                this._items.push({ name: el.qualifiedName || this.getValidAssetName(DEFAULT_NAME), jres: el })
            } )
            this.setState({items: this._items})
        })
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
        if (this._items.length > 1) {
            this.setState({
                alert: {
                    type: "delete",
                    icon: "exclamation triangle",
                    title: "Warning!",
                    text: "Deleting an image is permanent. You will not be able to undo this action.",
                    options: [{
                            text: "Delete",
                            onClick: () => {
                                this.deleteAsset(this.state.selected);
                                this.hideAlert();
                            }
                        }]
                }
            })
        } else {
            this.setState({
                alert: {
                    type: "warning",
                    icon: "ban",
                    title: "Unable to delete",
                    text: "You must have at least one image in your project.",
                }
            })
        }
    }

    onImportButtonClick = () => {
        this.setState({
            alert: {
                type: "import",
                icon: "upload",
                title: "Import Sprites",
                text: "Paste the URL to a shared game from MakeCode Arcade to import sprites from an existing project.",
                options: [{
                        text: "Import",
                        onClick: () => {
                            this.importAssets(this._inputRef.value);
                            this.hideAlert();
                        }
                    }]
            }
        })
    }

    onExportButtonClick = () => {
        // ensure we have most updated sprites
        this.getJres();
    }

    hideAlert = () => {
        this.setState({ alert: undefined });
    }

    handleInputRef = (el: HTMLInputElement) => {
        this._inputRef = el;
    }

    render() {
        const { items, selected, alert } = this.state;

        return <div id="asset-list">
            {alert && <Alert icon={alert.icon} title={alert.title} text={alert.text} options={alert.options} visible={true} onClose={this.hideAlert}>
                {alert.type === "import" && <input className="asset-import" ref={this.handleInputRef} placeholder="https://makecode.com/_r8fboJQTDPtH or https://arcade.makeode.com/62736-71128-62577-28722" />}
            </Alert>}
            <div className="asset-list-buttons">
                <div className="asset-button" title="Add asset" onClick={this.onAddButtonClick}>
                    <i className="icon plus square outline"></i>
                </div>
                <div className="asset-button" title="Import assets" onClick={this.onImportButtonClick}>
                    <i className="icon upload"></i>
                </div>
                <div className="asset-button" title="Export assets" onClick={this.onExportButtonClick}>
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
                        onRename={this.onAssetRename(i)}
                        onDelete={this.onDeleteButtonClick} />
                }) }
            </div>
        </div>
    }
}

export default AssetList