import React, { useState } from "react";

import "../styles/Dropdown.css";

export interface DropdownItem {
    id: string;
    label: string;
}

export interface DropdownProps {
    items: DropdownItem[];
    selectedId: string;
    onItemSelected: (id: string) => void;
}

export const Dropdown = (props: DropdownProps) => {
    const { items, selectedId, onItemSelected } = props;
    const [ isOpen, setIsOpen ] = useState(false);

    const selected = items.find(item => item.id === selectedId);

    return <div className={`dropdown ${isOpen ? "open" : ""}`} onClick={() => setIsOpen(!isOpen)}>
        <span className="dropdown-title">{selected?.label}</span>
        <i className="icon caret down" />
        {isOpen &&
            <div className="dropdown-menu">
                {items.map(item => (
                    <div key={item.id} className={`dropdown-menu-item ${item.id === selectedId ? "selected" : ""}`} onClick={() => onItemSelected(item.id)}>
                        {item.label}
                    </div>
                ))}
            </div>
        }
    </div>
}