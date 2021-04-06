import React from 'react';
import AssetList from './components/AssetList';
import './styles/App.css';

class App extends React.Component {
    componentDidMount() {
    }

    render() {
        return (
            <div className="app">
                <AssetList postMessage={() => {}} />
            </div>
        );
    }
}

export default App;
