import React from 'react';
import { Alert, AlertProps } from './components/Alert';
import { AssetSidebar } from './components/AssetSidebar';
import { TopBar } from './components/TopBar';
import { AssetType, getTilemapProject } from './project';
import './styles/App.css';
import { generatePreviewURI } from './util';

interface AppState {
    alert?: AlertProps;
    asset: pxt.Asset;
    activeTab: pxt.AssetType;
    mostRecentAssets: {[index: string]: string};
}

class App extends React.Component<{}, AppState> {
    private iframe!: HTMLIFrameElement;

    constructor(props: {}) {
        super(props);
        this.state = {
            asset: this.getAssetForTab(AssetType.Image),
            activeTab: AssetType.Image,
            mostRecentAssets: {}
        };
    }

    componentDidMount() {
        window.addEventListener("message", msg => {
            const data = msg.data;

            switch (data.type) {
                case "ready":
                    this.openCurrentAsset();
                    break;
                case "save-asset":
                    this.onAssetSave(data.asset);
                    break;

            }
        });
    }

    postMessage = (data: any) => {
        if (this.iframe && this.iframe.contentWindow) {
            data["_fromVscode"] = true; // fake _fromVscode for now
            this.iframe.contentWindow.postMessage(data, "*");
        }
    }

    onMouseEnter = () => {
        this.iframe?.contentWindow?.focus();
    }

    showAlert = (alertProps: AlertProps) => {
        this.setState({ alert: alertProps });
    }

    onTabSelected = (tab: pxt.AssetType) => {
        if (tab === this.state.activeTab) return;

        const asset = this.getAssetForTab(tab);
        this.setState({ activeTab: tab, asset: asset! }, () => {
            this.openCurrentAsset();
        });

    }

    hideAlert = () => {
        if (this.state.alert?.onClose) {
            this.state.alert.onClose();
        }
        this.setState({ alert: undefined });
    }

    handleIframeRef = (iframe: HTMLIFrameElement) => {
        this.iframe = iframe;
    }

    onAssetSelected = (asset: pxt.Asset) => {
        if (asset === null) {
            asset = this.getAssetForTab(this.state.activeTab);
        }
        this.setState({
            asset: asset
        }, () => this.openCurrentAsset());
    }

    render() {
        const { alert, activeTab, asset } = this.state;
        return (
            <div className={`app ${activeTab}-active`}>
                <TopBar showAlert={this.showAlert} onTabSelected={this.onTabSelected} activeTab={activeTab}/>
                <div className="asset-editor-area">
                    <iframe id="editor"
                        ref={this.handleIframeRef}
                        onMouseEnter={this.onMouseEnter}
                        title="MakeCode Arcade sprite editor"
                        src="http://localhost:3232/asseteditor.html" />
                    <AssetSidebar showAlert={this.showAlert} asset={asset} activeTab={activeTab} onAssetSelected={this.onAssetSelected} />
                </div>
                { alert && <Alert {...alert} onClose={this.hideAlert} visible={true}/> }
            </div>
        );
    }

    protected openCurrentAsset() {
        if (this.state.asset.type === AssetType.Tilemap) {
            const tilemap = this.state.asset as pxt.ProjectTilemap;
            const project = getTilemapProject();

            const tileset = tilemap.data.tileset;

            for (let i = 0; i < tileset.tiles.length; i++) {
                const tile = tileset.tiles[i];
                tileset.tiles[i] = project.resolveTile(tile.id);
            }

            for (const tile of project.getAssets(AssetType.Tile) as pxt.Tile[]) {
                if (!tileset.tiles.some(t => t.id === tile.id) && tile.bitmap.width === tileset.tileWidth) {
                    tileset.tiles.push(tile);
                }
            }
        }
        this.postMessage({
            type: "open-asset",
            asset: this.state.asset
        });

        this.setState({
            mostRecentAssets: {
                ...this.state.mostRecentAssets,
                [this.state.asset.type]: this.state.asset.id
            }
        });
    }

    protected onAssetSave(asset: pxt.Asset) {
        const project = getTilemapProject();
        if (asset.type === AssetType.Tilemap) {
            const tm = asset as pxt.ProjectTilemap

            // After passing between iframe, we need to re-hydrate the classes
            const oldData = tm.data;
            const newTm = new pxt.sprite.Tilemap(oldData.tilemap.width, oldData.tilemap.height, 0, 0, (oldData.tilemap as any).buf);
            tm.data = new pxt.sprite.TilemapData(newTm, oldData.tileset, oldData.layers);
            tm.data.editedTiles = oldData.editedTiles;
            tm.data.deletedTiles = oldData.deletedTiles;

            for (let i = 0; i < tm.data.tileset.tiles.length; i++) {
                const tile = tm.data.tileset.tiles[i];
                const existing = project.lookupAsset(tile.type, tile.id);

                if (!existing) {
                    tm.data.tileset.tiles[i] = project.createNewTile(tile.bitmap, tile.id, tile.meta.displayName);
                }
                else {
                    tile.internalID = existing.internalID;
                }
                generatePreviewURI(tm.data.tileset.tiles[i]);
            }
            pxt.sprite.updateTilemapReferencesFromResult(project, tm);

            for (let i = 0; i < tm.data.tileset.tiles.length; i++) {
                let tile = tm.data.tileset.tiles[i];
                tile = project.lookupAsset(tile.type, tile.id)

                tm.data.tileset.tiles[i] = tile;

                generatePreviewURI(tile);
                project.updateAsset(tile);
            }
        }
        generatePreviewURI(asset);
        getTilemapProject().updateAsset(asset);
    }

    protected getAssetForTab(tab: pxt.AssetType) {
        const project = getTilemapProject();
        if (this.state?.mostRecentAssets?.[tab]) {
            const mostRecent = project.lookupAsset(tab, this.state.mostRecentAssets[tab]);

            if (mostRecent) return mostRecent;
        }
        let asset: pxt.Asset;
        switch (tab) {
            case AssetType.Image:
                asset = project.getAssets(AssetType.Image)[0] || project.createNewImage(16, 16);
                break;
            case AssetType.Tile:
                asset = project.getAssets(AssetType.Tile)[0] || project.createNewTile(new pxt.sprite.Bitmap(16, 16).data());
                break;
            case AssetType.Animation:
                asset = project.getAssets(AssetType.Animation)[0] || project.createNewAnimation(16, 16);
                break;
            case AssetType.Tilemap:
                asset = project.getAssets(AssetType.Tilemap)[0];

                if (!asset) {
                    const [id, tilemap] = project.createNewTilemap("level", 16, 16);
                    asset = project.lookupAsset(AssetType.Tilemap, id);
                }
                break;
        }

        if (!asset!.meta.displayName) {
            asset!.meta.displayName = pxt.getDefaultAssetDisplayName(tab);
            asset = project.updateAsset(asset!);
        }

        return asset!;
    }
}

export default App;
