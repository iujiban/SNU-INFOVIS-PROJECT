import React, { useState } from 'react';
import DropDownMenu from '../../menu/DropDownMenu';
import './view1.css';

const Menu = () => {
    const [selectedMode, setSelectedMode] = useState({ value: 'DrugSeziure', label: 'DrugSeziure' });

    return (
        <div id="menu" className="pane">
            <div className="header" >Menu</div>
            
            <div className='menu-content'>
                <div className ="menu-section">
                    <label className="menu-label">Mode</label>
                    <DropDownMenu setSelectedMode={setSelectedMode}></DropDownMenu>
                </div>
                
            </div>
        </div>
    );
};

export default Menu;
