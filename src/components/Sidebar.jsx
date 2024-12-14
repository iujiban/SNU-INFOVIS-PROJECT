import CheckboxStack from './ui/CheckboxStack';
import RadioStack from './ui/RadioStack';
import Range from './ui/Range';
import MultiLevelDropdown from './ui/MultiLevelDropdown';
import React, {useEffect, useState, useMemo} from 'react';

// data
import Seziure from '../data/Drug_seizures_2018_2022.json'
import Prevalence from '../data/Prevalence_of_drug_use_NPS_General.json';
import NonNPSPrevalence from '../data/Prevalence_of_drug_use_NonNPS_General.json'
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


const yearMin = 2018;
const yearMax = 2022;

const Sidebar = ({onFilterChange, selectedRegion, selectedCountry}) => {
    const [yearStatic, setYearStatic] = useState({ minYear: 2018, maxYear: 2022 });
    const [selectedMode, setSelectedMode] = useState(null);
    const [yearRange, setYearRange] = useState({ minYear: yearMin, maxYear: yearMax });
    // const [selectedCountry, setSelectedCountry] = useState(null);


    const dataMap = {
        seizure: Seziure,
        prevalence: [...Prevalence, ...NonNPSPrevalence],
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

    // Flatten the array of data for selected modes
    return selectedMode.flatMap((mode) => dataMap[mode] || []);
}, [selectedMode]);

const regionOptions = useMemo(() => {
        // Create a base set of region options that always exist
        const baseRegions = [
            { Region: 'Europe', Country: 'Russia' },
            { Region: 'Europe', Country: 'France' },
            { Region: 'Europe', Country: 'Germany' },
            { Region: 'Asia', Country: 'China' },
            { Region: 'Asia', Country: 'Japan' },
            { Region: 'Asia', Country: 'India' },
            { Region: 'Africa', Country: 'South Africa' },
            { Region: 'Africa', Country: 'Egypt' },
            { Region: 'Africa', Country: 'Nigeria' },
            { Region: 'Americas', Country: 'United States' },
            { Region: 'Americas', Country: 'Canada' },
            { Region: 'Americas', Country: 'Brazil' },
            { Region: 'Oceania', Country: 'Australia' },
            { Region: 'Oceania', Country: 'New Zealand' }
        ];

        if (!filteredData || filteredData.length === 0) {
            console.log('Using base region options');
            return baseRegions;
        }

        const uniqueRegions = new Map();

        // Add base regions first
        baseRegions.forEach(option => {
            const key = `${option.Region}-${option.Country}`;
            uniqueRegions.set(key, option);
        });

        // Then add any additional regions from the data
        filteredData.forEach((item) => {
            const { Region, 'Country/Territory': Country } = item;
            if (Region && Country) {
                const key = `${Region}-${Country}`;
                uniqueRegions.set(key, { Region, Country });
            }
        });

        const result = Array.from(uniqueRegions.values());
        console.log('Dynamic Region Options:', result);
        return result;
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
    
        // Extract unique Drug group and Drug combinations
        filteredData.forEach((item) => {
            const { 'Drug group': drugGroup, Drug } = item || {}; // Extract relevant fields
            if (drugGroup && Drug) {
                uniqueDrugs.set(
                    `${drugGroup}-${Drug}`, // Use a unique key for each combination
                    { type: drugGroup, name: Drug } // Store the data structure for the dropdown
                );
            }
        });
    
        // Convert Map values to an array
        const result = Array.from(uniqueDrugs.values());
        return result;
    }, [filteredData]);
    

    const handleGenderChange = (selectedGender) => {
        onFilterChange({ gender: selectedGender });
    };

    const handleAgeChange = (selectedAge) => {
        onFilterChange({ age: selectedAge });
    };

    const handleDrugChange = (selectedDrugs) => {
        const { type: drugGroup, name: drug } = selectedDrugs || {}; 
        onFilterChange({ drugs: { drugGroup, drug } });
    };

    const handleRegionChange = (selectedRegion) => {
        const { Region: region, SubRegion: subRegion, Country: country } = selectedRegion || {}; 
        console.log('Sidebar handleRegionChange:', { selectedRegion, region, subRegion, country });
        onFilterChange({
            region: {
                region: region || null,
                subRegion: subRegion || null,
                country: country || null,
            },
        });
    };

    const handleYearChange = (yearRange) => {
        const newRange = { minYear: yearRange[0], maxYear: yearRange[1] };
        setYearRange(newRange);
        const payload = { year: yearRange };
        onFilterChange(payload);
    };

    useEffect(() => {
        console.log('Sidebar props:', { selectedRegion, selectedCountry });
        console.log('Region options:', regionOptions);
    }, [selectedRegion, selectedCountry, regionOptions]);

    return (
        <div className="sidebar">
            <MultiLevelDropdown 
                label="Region" 
                options={regionOptions}
                levels={['Region', 'Country']} 
                onChange={handleRegionChange}
                value={selectedRegion || selectedCountry ? {
                    Region: selectedRegion,
                    Country: selectedCountry
                } : null}
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
                options={DrugOptions}
                levels={['type']}
                onChange={handleDrugChange} 
            />
        </div>
    )
}

export default Sidebar;