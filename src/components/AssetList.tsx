import React from 'react';
import { Alert, AlertProps } from './Alert';
import { Asset, AssetInfo } from './Asset';
import { JRESImage, getJRESImageFromDataString, getJRESImageFromUint8Array } from '../images'
import { arcadePalette, fetchMakeCodeScriptAsync } from '../share';
import { setupDragAndDrop, fileReadAsBufferAsync } from '../dragAndDrop';
import '../styles/AssetList.css';
import { downloadProjectAsync, downloadTypeScriptAsync } from '../export';

interface AlertInfo extends AlertProps {
    type: "delete" | "import" | "warning" | "export";
}

interface AssetListProps {
    postMessage: (msg: any) => void;
}

interface AssetListState {
    items: AssetInfo[];
    selected: number;
    saving?: number;
    dragging?: boolean;
    alert?: AlertInfo;
}

const DEFAULT_NAME = "mySprite";
const DEFAULT_JRES = {
    data: "hwQQABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
    previewURI: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAH0lEQVQ4T2NkoBAwUqifYdQAhtEwYBgNA1A+Gvi8AAAmmAARf9qcXAAAAABJRU5ErkJggg==",
    width: 16,
    height: 16,
}

const STORAGE_KEY = "SPRITE_DATA"
const SAVE_INTERVAL = 1500; // autosave every 1s

class AssetList extends React.Component<AssetListProps, AssetListState> {
    private _items: AssetInfo[];
    private _inputRef!: HTMLInputElement;
    private _dragInit: boolean = false;

    constructor(props: AssetListProps) {
        super(props);

        const storedJson = window.localStorage.getItem(STORAGE_KEY);
        const storedItems = storedJson && JSON.parse(storedJson) as AssetInfo[];
        this._items = storedItems || [{ name: DEFAULT_NAME, jres: { ...DEFAULT_JRES } }];

        this.state = {
            items: this._items,
            selected: 0
        };
    }

    componentDidMount() {
        window.addEventListener("message", this.handleMessage);
        this.loadJres(this._items[this.state.selected]);

        setTimeout(this.autosaveJres, SAVE_INTERVAL);
    }

    componentWillUnmount() {
        window.removeEventListener("message", this.handleMessage);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this._items));
    }

    componentDidUpdate(prevProps: AssetListProps, prevState: AssetListState) {
        if (this.state.saving !== undefined && prevState.saving === undefined) {
            this.getJres();
        }
        if (this.state.selected !== prevState.selected || this.state.selected === 0) {
            this.loadJres(this._items[this.state.selected]);
        }
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this._items));
    }

    handleMessage = (msg: any) => {
        const data = msg.data;
        switch (data.type) {
            case "ready":
                this.loadJres(this._items[this.state.selected]);
                break;
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

    autosaveJres = () => {
        if (!this.state.saving) this.getJres();
        setTimeout(this.autosaveJres, SAVE_INTERVAL);
    }

    loadJres = (asset: AssetInfo) => {
        this.props.postMessage({ type: "initialize", message: asset.jres.data });
    }

    getJres = () => {
        this.props.postMessage({ type: "update" });
    }

    /** ASSET HANDLING */

    addAsset(name?: string, jres?: JRESImage) {
        this._items.push({
            name: this.getValidAssetName(name || DEFAULT_NAME),
            jres: jres || { ...DEFAULT_JRES }
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
                text: "Paste a URL from MakeCode Arcade or drag and drop PNG files to import existing sprites.",
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

    onImportDragEnter = (e: any) => {
        this.setState({ dragging: true });
    }

    onImportDragLeave = (e: any) => {
        this.setState({ dragging: false });
    }

    onExportButtonClick = () => {
        // ensure we have most updated sprites
        this.getJres();
        this.setState({
            alert: {
                type: "export",
                icon: "download",
                title: "Export Sprite Pack",
                text: "Export your sprites as an .mckd project to load directly into Arcade, or as a .ts file with your images encoded.",
                options: [{
                        text: "Download MKCD",
                        onClick: () => {
                            // download as MKCD
                            this.hideAlert();
                            downloadProjectAsync("project", this.state.items);
                        }
                    },
                    {
                        text: "Download TS",
                        onClick: () => {
                            // download as TS
                            this.hideAlert();
                            downloadTypeScriptAsync("project", this.state.items);
                        }
                    }]
            }
        })
    }

    hideAlert = () => {
        this.setState({ alert: undefined });
    }

    /* REF HANDLING */

    handleInputRef = (el: HTMLInputElement) => {
        this._inputRef = el;
    }

    handleDropRef = (el: HTMLInputElement) => {
        if (!this._dragInit) {
            this._dragInit = true;
            setupDragAndDrop(document.body, f => true, async files => {
                for (const f of files) {
                    const idx = f.name.lastIndexOf(".");
                    const ext = f.name.substr(idx);
                    const name = f.name.slice(0, idx);
                    if (ext.toLowerCase() === ".png") {
                        const buf = await fileReadAsBufferAsync(f);
                        if (buf) {
                            const jres = await getJRESImageFromUint8Array(buf, arcadePalette);
                            if (jres) {
                                this.addAsset(name, jres);
                                this.hideAlert();
                            }
                        }
                    }
                }
            });
        }
    }

    render() {
        const { items, selected, dragging, alert } = this.state;

        return <div id="asset-list">
            {alert && <Alert icon={alert.icon} title={alert.title} text={alert.text} options={alert.options} visible={true} onClose={this.hideAlert}>
                {alert.type === "import" && <div className="asset-import">
                    <div className={`asset-drop ${dragging ? "dragging" : ""}`} ref={this.handleDropRef} onDragEnter={this.onImportDragEnter} onDragLeave={this.onImportDragLeave}>
                        Drop PNG files here to import.
                    </div>
                    <input ref={this.handleInputRef} placeholder="https://makecode.com/_r8fboJQTDPtH or https://arcade.makeode.com/62736-71128-62577-28722" />
                </div>}
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