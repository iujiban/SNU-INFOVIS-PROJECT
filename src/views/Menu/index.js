import React, { useState } from 'react';
import ModeDropDownMenu from '../../menu/modeDropDownMenu';
import CountryDropDownMenu from '../../menu/countryDropDownMenu';
import './view1.css';

const Menu = () => {
    const [selectedMode, setSelectedMode] = useState({ value: 'DrugSeziure', label: 'DrugSeziure' });
    const [selectedCountry, setSelectedCountry] = useState({ value: 'Kenya', label: 'Kenya' });
    

    return (
        <div id="menu" className="pane">
            <div className="header" >Menu</div>
            {/* 모드 드롭다운 메뉴 */}
            <div className='menu-content'>
                <div className ="menu-section">
                    <label className="menu-label">Mode</label>
                    <ModeDropDownMenu setSelectedMode={setSelectedMode}></ModeDropDownMenu>
                </div>           
            </div>
            {/* 나라 드롭다운 메뉴 */}
            <div className='country-menu-content'>
                <div className ="menu-section">
                    <label className="menu-label">Region</label>
                    <CountryDropDownMenu selectedMode={selectedMode} setSelectedCountry={setSelectedCountry}></CountryDropDownMenu>
                </div>
            </div>
        </div>
    );
};

export default Menu;
