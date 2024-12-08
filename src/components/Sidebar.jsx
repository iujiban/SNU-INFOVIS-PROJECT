import CheckboxStack from './ui/CheckboxStack';
import RadioStack from './ui/RadioStack';
import Range from './ui/Range';
import MultiLevelDropdown from './ui/MultiLevelDropdown';

// data
import Seziure from '../data/Drug_seizures_2018_2022.json'
import Prevalence from '../data/Prevalence_of_drug_use_NPS_General.json';
import Price from '../data/Prices_of_drugs.json'

const modeOptions = [
    { value: 'prevalence', label: 'Prevalence'},
    { value: 'seizure', label: 'Seizure'},
    { value: 'price', label: 'Price'},
];

const genderOptions = [
    { value: 'all', label: 'All'},
    { value: 'male', label: 'Male'},
    { value: 'female', label: 'Female'},
];

const ageOptions = [
    {value: 'all', label: 'All'},
    {value: 'youth', label: 'Youth'},
];

const drugOptions = [
    { type: 'Opioid', name: 'Heroin', type: 'Natural' },
    { type: 'Opioid', name: 'Morphine', type: 'Natural' },
    { type: 'Opioid', name: 'Fentanyl', type: 'Synthetic' },
    { type: 'Opioid', name: 'Oxycodone', type: 'Semi-synthetic' },
    { type: 'Benzo', name: 'Xanax', type: 'Short-acting' },
    { type: 'Benzo', name: 'Valium', type: 'Long-acting' },
    { type: 'Benzo', name: 'Ativan', type: 'Short-acting' },
    { type: 'Benzo', name: 'Klonopin', type: 'Long-acting' },
    { type: 'Non-Opioid', name: 'Cocaine', type: 'Stimulant' },
    { type: 'Non-Opioid', name: 'Methamphetamine', type: 'Stimulant' },
    { type: 'Non-Opioid', name: 'Cannabis', type: 'Cannabinoid' },
    { type: 'Non-Opioid', name: 'MDMA', type: 'Empathogen' }
];

const regionOptions = [
    { continent: 'Asia', country: 'China', region: 'East Asia' },
    { continent: 'Asia', country: 'Japan', region: 'East Asia' },
    { continent: 'Asia', country: 'South Korea', region: 'East Asia' },
    { continent: 'Asia', country: 'India', region: 'South Asia' },
    { continent: 'Asia', country: 'Thailand', region: 'Southeast Asia' },
    { continent: 'Asia', country: 'Vietnam', region: 'Southeast Asia' },
    { continent: 'Europe', country: 'UK', region: 'Western Europe' },
    { continent: 'Europe', country: 'France', region: 'Western Europe' },
    { continent: 'Europe', country: 'Germany', region: 'Central Europe' },
    { continent: 'Europe', country: 'Italy', region: 'Southern Europe' },
    { continent: 'Europe', country: 'Spain', region: 'Southern Europe' },
    { continent: 'Europe', country: 'Netherlands', region: 'Western Europe' },
    { continent: 'North America', country: 'USA', region: 'Northern America' },
    { continent: 'North America', country: 'Canada', region: 'Northern America' },
    { continent: 'North America', country: 'Mexico', region: 'Central America' },
    { continent: 'South America', country: 'Brazil', region: 'Eastern South America' },
    { continent: 'South America', country: 'Argentina', region: 'Southern South America' },
    { continent: 'South America', country: 'Chile', region: 'Southern South America' },
    { continent: 'South America', country: 'Colombia', region: 'Northern South America' },
    { continent: 'South America', country: 'Peru', region: 'Western South America' }
];

const yearMin = 2018;
const yearMax = 2022;

const Sidebar = ({onFilterChange}) => {
    //const [selectedMode, setSelectedMode] = useState[null];
    //const [selectedRegion, setSelectedRegion] = useState[null];
    //const [selectedCountry, setSelectedCountry] = useState[null]

    const handleModeChange = (selectedModes) => {
      //  const filteredData = dataMap[selectedModes.value];
        onFilterChange({mode: selectedModes});

    };
    const handleGenderChange = (selectedGender) => {
        onFilterChange({ gender: selectedGender });
    };

    const handleAgeChange = (selectedAge) => {
        onFilterChange({ age: selectedAge });
    };

    const handleDrugChange = (selectedDrugs) => {
        onFilterChange({ drugs: selectedDrugs });
    };

    const handleRegionChange = (selectedRegion) => {
        onFilterChange({ region: selectedRegion });
    };

    const handleYearChange = (yearRange) => {
        onFilterChange({ year: yearRange });
    };

    return (
        <div className="sidebar">
            <CheckboxStack 
                label="Mode" 
                options={modeOptions}
                onChange={handleModeChange} 
            />
            <MultiLevelDropdown 
                label="Region" 
                options={regionOptions}
                levels={['continent', 'country']} 
                onChange={handleRegionChange}
            />
            <Range 
                min={yearMin} 
                max={yearMax} 
                step={1} 
                name="Year" 
                onChange={handleYearChange}
            />
            <RadioStack 
                label="Gender"
                options={genderOptions} 
                name='genderRadio'
                onChange={handleGenderChange}
            />
            <RadioStack 
                label="Age" 
                options={ageOptions} 
                name='ageRadio'
                onChange={handleAgeChange}
            />
            <MultiLevelDropdown 
                label="Drug" 
                options={drugOptions}
                levels={['type', 'name']}
                onChange={handleDrugChange} 
            />
        </div>
    )
}

export default Sidebar;