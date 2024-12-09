import CheckboxStack from './ui/CheckboxStack';
import RadioStack from './ui/RadioStack';
import Range from './ui/Range';
import MultiLevelDropdown from './ui/MultiLevelDropdown';
import React, {useEffect, useState, useMemo} from 'react';

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

const yearMin = 2018;
const yearMax = 2022;

const Sidebar = ({onFilterChange}) => {
    const [selectedMode, setSelectedMode] = useState(null);
    const [yearRange, setYearRange] = useState({ minYear: yearMin, maxYear: yearMax });


    const dataMap = {
        seizure: Seziure,
        prevalence: Prevalence,
        price: Price,
    }

    const handleModeChange = (selectedModes) => {
        console.log('Selected mode:', selectedModes); 
        setSelectedMode(selectedModes)
        onFilterChange({mode: selectedModes});

    };

    const filteredData = selectedMode && Array.isArray(selectedMode)
    ? selectedMode.flatMap(mode => dataMap[mode] || []) // Combine data for all selected modes
    : selectedMode
    ? dataMap[selectedMode.value]
    : null;

    const regionOptions = useMemo(() => {
        if (!filteredData || filteredData.length === 0) {
            return [];
        }
        // Extract unique continent-country combinations from filteredData
        const uniqueRegions = new Map();
        filteredData.forEach((item) => {
            const { Region, 'Country/Territory': CountryTerritory } = item; // Adjust keys to match dataset structure
            if (Region && CountryTerritory) {
                uniqueRegions.set(`${Region}-${CountryTerritory}`, { region: Region, country: CountryTerritory });
            }
        });
        return Array.from(uniqueRegions.values());
    }, [filteredData]);

    const yearOptions = useMemo(() => {
        if (!filteredData || filteredData.length === 0) {
            return { minYear: yearMin, maxYear: yearMax };
        }

        console.log("filteredData.Length", filteredData.length);
    
        const years = filteredData
        .map((item) => Number(item.Year)) // Convert Year to a number
        .filter((year) => !isNaN(year)) // Exclude invalid years
        .sort((a, b) => a - b); // Sort in ascending order

        console.log("years.length", years.length);
        console.log("years", years)
        if (years.length === 0) {
            return { minYear: yearMin, maxYear: yearMax }; // Default range if no valid years found
         }

        // Find the minimum and maximum year within the filtered range
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
    
        return { minYear, maxYear };
    }, [filteredData, yearMin, yearMax]);

    const DrugOptions = useMemo(() => {
        if (!filteredData || filteredData.length === 0) {
            return [];
        }
        const uniqueDrugs = new Map();
        filteredData.forEach((item) => {
            const { 'Drug group': drugGroup, Drug } = item; // Extract relevant fields
            if (drugGroup && Drug) {
                uniqueDrugs.set(`${drugGroup}-${Drug}`, { group: drugGroup, name: Drug });
            }
        });
    
        return Array.from(uniqueDrugs.values()); // Convert Map values to an array
    }, [filteredData]);
    

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

    // Debug
    useEffect(() => {
        if (yearOptions.minYear !== yearRange.minYear || yearOptions.maxYear !== yearRange.maxYear) {
            setYearRange({ minYear: yearOptions.minYear, maxYear: yearOptions.maxYear });
        }
        console.log('Updated selectedModes:', selectedMode);
        console.log('Filtered Data:', filteredData);
        console.log('Dynamic Region Options:', regionOptions);
        console.log('Dynamic Year Options', yearOptions);
        console.log('Dynamic Drug Options', DrugOptions);
    }, [selectedMode, filteredData, regionOptions, yearOptions, DrugOptions, yearRange]);
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
                levels={['region', 'country']} 
                onChange={handleRegionChange}
            />
            <Range 
                min={yearRange.minYear} 
                max={yearRange.maxYear}
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