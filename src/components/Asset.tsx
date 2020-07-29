import React from 'react';
import { JRESImage } from '../images';
import '../styles/Asset.css';

export interface AssetInfo {
    name: string;
    jres: JRESImage;
}

interface AssetProps {
    info: AssetInfo;
    selected: boolean;
    onClick?: (e: any) => void;
    onRename?: (name: string) => void;
    onDelete?: (e: any) => void;
}

interface AssetState {
    renaming?: boolean;
}

export class Asset extends React.Component<AssetProps, AssetState> {
    private renameInput!: HTMLInputElement;
    constructor(props: AssetProps) {
        super(props);
        this.state = { renaming: true }
    }

    componentDidMount() {
        if (this.renameInput) this.renameInput.focus();
    }

    componentDidUpdate(prevProps: AssetProps, prevState: AssetState) {
        if (this.state.renaming && !prevState.renaming) {
            this.renameInput.focus();
        }
    }

    onBlur = (e: any) => {
        if (this.props.onRename) this.props.onRename(e.target.value);
        this.setState({ renaming: false });
    }

    onDoubleClick = (e: any) => {
        this.setState({ renaming: true });
    }

    handleInputRef = (e: HTMLInputElement) => {
        this.renameInput = e;
    }

    render() {
        const { info, selected, onClick, onDelete } = this.props;
        const { name, jres } = info;

        return <div className={`asset ${selected ? "selected" : ""}`} onClick={onClick}>
            {selected && <div className="asset-delete" onClick={onDelete}>
                <i className="icon delete"></i>
            </div>}
            <div className="asset-img">
                <img src={jres.previewURI} alt="Preview of asset" />
            </div>
            {this.state.renaming && selected
                ? <input className="asset-rename" onBlur={this.onBlur} defaultValue={name} ref={this.handleInputRef} />
                : <div className="asset-title" onDoubleClick={this.onDoubleClick}><span>{name}</span></div>
            }
        </div>
    }
}