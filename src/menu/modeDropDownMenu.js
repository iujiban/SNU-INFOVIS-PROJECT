import React from 'react'
import Select from 'react-select';
import './modeDropDownMenu.css';

const modeDropDownMenu = (props) => {

    const optionsMode = [
		    { value: 'DrugSeziure', label: 'DrugSeziure' },
        { value: 'DrugPrevalance', label: 'DrugPrevalance' },
        { value: 'DrugPrice', label: 'DrugPrice' },

    ];

    const handleModeChange = (selected) => {
        props.setSelectedMode(selected);
    };


    function modeDropDownMenuContainer() {
        return (
            <div style={{ display: 'flex', alignItems: 'center', marginRight: '0px' }}>
              <Select
                styles={{
                  control: (baseStyles) => ({
                    ...baseStyles,
                    margin: 10,
                  }),
                }}
                className="selection-mode"
                defaultValue={optionsMode[0]}
                options={optionsMode}
                onChange={handleModeChange}
              />
            </div>
          );
    }
    

    return (
      <div class="DropDwonMenu" style={{ display: 'flex', alignItems: 'center' }}>
			  {modeDropDownMenuContainer()}
			  
		</div>
    )

};

export default modeDropDownMenu;