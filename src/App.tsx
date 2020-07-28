import React from 'react';
import AssetList from './components/AssetList';
import './styles/App.css';

class App extends React.Component {
    private iframe!: HTMLIFrameElement;
    componentDidMount() {
        this.iframe = document.getElementById("editor") as HTMLIFrameElement;
    }

    postMessage = (data: any) => {
        if (this.iframe && this.iframe.contentWindow) {
            data["_fromVscode"] = true; // fake _fromVscode for now
            this.iframe.contentWindow.postMessage(data, "*");
        }
    }

    render() {
        return (
            <div className="app">
                <iframe id="editor" title="MakeCode Arcade sprite editor" src="https://arcade.makecode.com/beta--asseteditor" />
                <AssetList postMessage={this.postMessage} />
            </div>
        );
    }
}

export default App;
