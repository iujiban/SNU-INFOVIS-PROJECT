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
    const [yearStatic, setYearStatic] = useState({ minYear: 2018, maxYear: 2022 });
    const [selectedMode, setSelectedMode] = useState(null);
    const [yearRange, setYearRange] = useState({ minYear: yearMin, maxYear: yearMax });
    // const [selectedCountry, setSelectedCountry] = useState(null);


    const dataMap = {
        seizure: Seziure,
        prevalence: Prevalence,
        price: Price,
    }

    const handleModeChange = (selectedModes) => {
        setSelectedMode(selectedModes)
        onFilterChange({mode: selectedModes});

    };
/*
    const filteredData = selectedMode && Array.isArray(selectedMode)
    ? selectedMode.flatMap(mode => dataMap[mode] || []) // Combine data for all selected modes
    : selectedMode
    ? dataMap[selectedMode.value]
    : null;
*/
    const filteredData = useMemo(() => {
        if (!selectedMode || !Array.isArray(selectedMode)) return null;
        return selectedMode.flatMap((mode) => dataMap[mode] || []);
    }, [selectedMode]);

    const drugSeziureFilteredData = useMemo(() => {
        if (!filteredData || filteredData.length === 0) return [];
        return filteredData.filter((item) => {
            const year = Number(item.Year);
            return year >= yearRange.minYear && year <= yearRange.maxYear && !isNaN(year);
        });
    }, [filteredData, yearRange]);
    
    const totalsByCountryDrugGroupAndYear = useMemo(() => {
        if (!drugSeziureFilteredData || drugSeziureFilteredData.length === 0) return {};
    
        return drugSeziureFilteredData.reduce((totals, item) => {
            const country = item['Country/Territory'];
            const drugGroup = item['Drug group'];
            const year = item['Year'];
            const weight = parseFloat(item.Kilograms) || 0;
    
            if (country && drugGroup) {
                // Initialize country if not already present
                if (!totals[country]) totals[country] = {};
    
                // Initialize Drug group if not present
                if (!totals[country][drugGroup]) {
                    totals[country][drugGroup] = { total: 0, years: {} };
                }
    
                // Add weight to the Drug group total
                totals[country][drugGroup].total += weight;
    
                // Add weight to the Year total
                if (!totals[country][drugGroup].years[year]) {
                    totals[country][drugGroup].years[year] = 0;
                }
                totals[country][drugGroup].years[year] += weight;
            }
            return totals;
        }, {});
    }, [drugSeziureFilteredData]);


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
            return { minYear: yearStatic.minYear, maxYear: yearStatic.maxYear };
        }

        const years = filteredData
            .map((item) => Number(item.Year)) // Convert Year to a number
            .filter((year) => !isNaN(year)) // Exclude invalid years
            .sort((a, b) => a - b); // Sort in ascending order

        if (years.length === 0) {
            return { minYear: yearStatic.minYear, maxYear: yearStatic.maxYear }; // Default to static if no valid years
        }

        // Find the minimum and maximum year within the filtered range
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);

        return { minYear, maxYear };
    }, [filteredData, yearStatic]);

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
        const newRange = { minYear: yearRange[0], maxYear: yearRange[1] };
        setYearRange(newRange);
        const payload = { year: yearRange };
        onFilterChange(payload);
    };

    // Debug
    useEffect(() => {
        if (yearOptions.minYear !== yearStatic.minYear || yearOptions.maxYear !== yearStatic.maxYear) {
            setYearStatic({ minYear: yearOptions.minYear, maxYear: yearOptions.maxYear });
        }
        console.log('Dynamic Year Options', yearOptions);
        console.log('FilteredSeziure Data:', drugSeziureFilteredData);
        console.log('Total Kilograms by Drug Group:', totalsByCountryDrugGroupAndYear);
    }, [yearOptions,  yearRange, totalsByCountryDrugGroupAndYear]);
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
                min={yearStatic.minYear} 
                max={yearStatic.maxYear}
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