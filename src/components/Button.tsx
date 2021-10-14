import React from "react";

import "../styles/Button.css";

interface ButtonProps {
    label: string;
    title: string;
    onClick: () => void;
}

export const Button = (props: ButtonProps) => {
    const { label, title, onClick } = props;

    return <button className="asset-details-button" title={title} onClick={onClick}>
        {label}
    </button>
}