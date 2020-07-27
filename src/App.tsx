import React from 'react';
import AssetList from './components/AssetList';
import './styles/App.css';

function App() {
  return (
    <div className="app">
      <iframe id="editor" title="MakeCode Arcade sprite editor" src="https://arcade.makecode.com/beta--asseteditor" />
      <AssetList />
    </div>
  );
}

export default App;
