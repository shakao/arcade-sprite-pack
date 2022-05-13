import React from 'react';
import { fileReadAsBufferAsync, setupDragAndDrop } from '../dragAndDrop';
import { getImageLiteralFromUint8Array } from '../images';
import { loadImagesFromProject } from '../import';
import { lzmaDecompressAsync } from '../lzma';
import { getProjectPalette, getTilemapProject } from '../project';
import '../styles/Alert.css';

interface AlertOption {
    text: string;
    onClick: (input?: string) => void;
    style?: { [key: string]: string };
}

export interface AlertState {
    dragging: boolean;
}

export interface AlertProps {
    type?: string;
    title: string;
    text: string;
    icon?: string;
    options?: AlertOption[];
    visible?: boolean;
    onClose?: () => void;
}

export class Alert extends React.Component<AlertProps, AlertState> {
    protected importInputRef: HTMLInputElement | undefined;
    protected dragInit: boolean = false;

    constructor(props: AlertProps) {
        super(props);

        this.state = {
            dragging: false
        };
    }
    onAlertClick(evt: any) {
        evt.stopPropagation();
        evt.preventDefault();
    }

    render() {
        if (!this.props.visible) return <div />;

        const { title, text, icon, options, onClose, type } = this.props;
        const { dragging } = this.state;

        return <div className="alert-container" onClick={onClose}>
            <div className="alert" onClick={this.onAlertClick}>
                <div className="alert-title">
                    {icon && <i className={`alert-icon icon ${icon}`}></i>}
                    <span>{title}</span>
                    <i className="icon delete" onClick={onClose}></i>
                </div>
                <div className="alert-text">{text}</div>
                {type === "import" && <div className="asset-import">
                    <div className={`asset-drop ${dragging ? "dragging" : ""}`} ref={this.handleDropRef} onDragEnter={this.onImportDragEnter} onDragLeave={this.onImportDragLeave}>
                        Drop PNG files here to import.
                    </div>
                    <input ref={this.handleImportInputRef} placeholder="https://makecode.com/_r8fboJQTDPtH or https://arcade.makeode.com/62736-71128-62577-28722" />
                </div>}
                {type === "scale" && <div className="asset-import">
                    <input ref={this.handleImportInputRef} placeholder="1" />
                </div>}
                {options && <div className="alert-options">
                    {options.map((el, i) => {
                        const onClick = () => {
                            el.onClick(this.importInputRef?.value);
                            if (onClose) onClose();
                        }
                        return <div key={i} onClick={onClick} style={el.style}>{el.text}</div>
                    })}
                </div>}
            </div>
        </div>
    }


    protected handleImportInputRef = (el: HTMLInputElement) => {
        if (el) {
            this.importInputRef = el;
        }
    }

    protected onImportDragEnter = (e: any) => {
        this.setState({ dragging: true });
    }

    protected onImportDragLeave = (e: any) => {
        this.setState({ dragging: false });
    }


    protected handleDropRef = (el: HTMLInputElement) => {
        if (!this.dragInit) {
            this.dragInit = true;
            setupDragAndDrop(document.body, f => true, async files => {
                for (const f of files) {
                    const idx = f.name.lastIndexOf(".");
                    const ext = f.name.substr(idx);
                    const name = f.name.slice(0, idx);
                    if (ext.toLowerCase() === ".png") {
                        const buf = await fileReadAsBufferAsync(f);
                        if (buf) {
                            const literal = await getImageLiteralFromUint8Array(buf, getProjectPalette());

                            if (literal) {
                                getTilemapProject().createNewProjectImage(pxt.sprite.imageLiteralToBitmap(literal).data(), name)
                            }

                            if (this.props.onClose) this.props.onClose();
                        }
                    }
                    else if (ext.toLowerCase() === ".mkcd") {
                        const buf = await fileReadAsBufferAsync(f);
                        if (buf) {
                            const text = await lzmaDecompressAsync(buf);
                            try {
                                const project = JSON.parse(text);
                                const files = JSON.parse(project.source);

                                loadImagesFromProject(files);
                                if (this.props.onClose) this.props.onClose();
                            }
                            catch (e) {

                            }
                        }
                    }
                }
            });
        }
    }
}