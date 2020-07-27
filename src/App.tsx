import React from 'react';
import AssetList from './components/AssetList';
import './styles/App.css';
import { TestWidget } from './components/TestWidget';

function App() {
  return (
    <div className="app">
      <iframe id="editor" title="MakeCode Arcade sprite editor" src="https://arcade.makecode.com/beta--asseteditor" />
      <AssetList />
      <TestWidget></TestWidget>
    </div>
  );
}

export default App;
