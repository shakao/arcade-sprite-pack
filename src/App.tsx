import React from 'react';
import AssetList from './components/AssetList';
import { AssetInfo } from './components/Asset';
import './styles/App.css';

class App extends React.Component {
    private iframe!: HTMLIFrameElement;

    constructor(props: {}) {
        super(props);
    }

    componentDidMount() {
        this.iframe = document.getElementById("editor") as HTMLIFrameElement;
    }

    postMessage = (data: any) => {
        if (this.iframe && this.iframe.contentWindow) {
            data["_fromVscode"] = true; // fake _fromVscode for now
            this.iframe.contentWindow.postMessage(data, "*");
        }
    }

    loadJres = (asset: AssetInfo) => {
        this.postMessage({ type: "initialize", message: asset.jres })
    }

    render() {
        return (
            <div className="app">
                <iframe id="editor" title="MakeCode Arcade sprite editor" src="https://arcade.makecode.com/beta--asseteditor" />
                <AssetList onItemSelect={this.loadJres} />
            </div>
        );
    }
}

export default App;
