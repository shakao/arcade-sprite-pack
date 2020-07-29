import React from 'react';
import '../styles/Alert.css';

interface AlertOption {
    text: string;
    onClick: () => void;
    style?: { [key: string]: string };
}

export interface AlertProps {
    title: string;
    text: string;
    icon?: string;
    options?: AlertOption[];
    visible?: boolean;
    onClose?: () => void;
}

export class Alert extends React.Component<AlertProps, {}> {
    onAlertClick(evt: any) {
        evt.stopPropagation();
        evt.preventDefault();
    }

    render() {
        if (!this.props.visible) return <div />;

        const { title, text, icon, options } = this.props;
        return <div className="alert-container" onClick={this.props.onClose}>
            <div className="alert" onClick={this.onAlertClick}>
                <div className="alert-title">
                    {icon && <i className={`alert-icon icon ${icon}`}></i>}
                    <span>{title}</span>
                    <i className="icon delete" onClick={this.props.onClose}></i>
                </div>
                <div className="alert-text">{text}</div>
                {this.props.children && this.props.children}
                {options && <div className="alert-options">
                    {options.map((el, i) => {
                        return <div key={i} onClick={el.onClick} style={el.style}>{el.text}</div>
                    })}
                </div>}
            </div>
        </div>
    }
}