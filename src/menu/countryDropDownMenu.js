import React from 'react'
import Select from 'react-select';
import './countryDropDownMenu.css';
import SeizuresCountry from '../data/Drug_seizures_2018_2022.json'
import PrevalanceCountry from '../data/Prevalence_of_drug_use_NPS_General.json'
import PriceCountry from '../data/Prices_of_drugs.json'
const countryDropDownMenu = (props) => {
/* modeDropDownMenu를 선택한 값으로 그 값의 country를 하려고 하였으나.. 작동이 느려짐..   
  const {selectedMode} = props;

    const dataMap = {
      DrugSeziure: SeizuresCountry,
      DrugPrevalance: PrevalanceCountry,
      DrugPrice: PriceCountry,
    };

    const filteredData = dataMap[selectedMode.value];
*/
const {selectedMode} = props;

const dataMap = {
  DrugSeziure: SeizuresCountry,
  DrugPrevalance: PrevalanceCountry,
  DrugPrice: PriceCountry,
};

const filteredData = dataMap[selectedMode.value];
    const optionsCountry = [
      ...new Set(filteredData.map(item => item["Country/Territory"]))
    ].filter(country => country).map(country => ({value: country, label: country}))

    const handleCountryChange = (selected) => {
      props.setSelectedCountry(selected);
    }

    function countryDropDownMenuContainer() {
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
                defaultValue={optionsCountry[0]}
                options={optionsCountry}
                onChange={handleCountryChange}
              />
            </div>
          );
    }
    

    return (
      <div class="DropDwonMenu" style={{ display: 'flex', alignItems: 'center' }}>
			  {countryDropDownMenuContainer()}
			  
		</div>
    )

};

export default countryDropDownMenu;