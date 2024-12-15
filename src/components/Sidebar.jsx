import CheckboxStack from './ui/CheckboxStack';
import RadioStack from './ui/RadioStack';
import Range from './ui/Range';
import MultiLevelDropdown from './ui/MultiLevelDropdown';
import React, { useEffect, useState, useMemo } from 'react';

// data
import Seziure from '../data/Drug_seizures_2018_2022.json'
import Prevalence from '../data/Prevalence_of_drug_use_NPS_General.json';
import NonNPSPrevalence from '../data/Prevalence_of_drug_use_NonNPS_General.json'
import Price from '../data/Prices_of_drugs.json'


const yearMin = 2018;
const yearMax = 2022;

const Sidebar = ({ onFilterChange, selectedRegion, selectedCountry }) => {
    const [yearStatic, setYearStatic] = useState({ minYear: 2018, maxYear: 2022 });
    const [selectedMode, setSelectedMode] = useState({ value: 'seizure', label: 'Seziure' });
    const [yearRange, setYearRange] = useState({ minYear: yearMin, maxYear: yearMax });
    // const [selectedCountry, setSelectedCountry] = useState(null);


    const dataMap = {
        seizure: Seziure
    }

    const handleModeChange = (selectedModes) => {
        setSelectedMode(selectedModes)
        onFilterChange({ mode: selectedModes });

    };
    /*
        const filteredData = selectedMode && Array.isArray(selectedMode)
        ? selectedMode.flatMap(mode => dataMap[mode] || []) // Combine data for all selected modes
        : selectedMode
        ? dataMap[selectedMode.value]
        : null;
    */

    const filteredData = useMemo(() => {
        if (!selectedMode || !selectedMode.value) return [];
        return dataMap[selectedMode.value] || [];
    }, [selectedMode]);

    const regionOptions = useMemo(() => {
        if (!filteredData || filteredData.length === 0) {
            return [];
        }
        const uniqueRegions = new Map();
        filteredData.forEach((item) => {
            const { Region, 'Country/Territory': CountryTerritory } = item;
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
        if (yearOptions.minYear !== yearStatic.minYear || yearOptions.maxYear !== yearStatic.maxYear) {
            setYearStatic({ minYear: yearOptions.minYear, maxYear: yearOptions.maxYear });
        }
        console.log("filteredData", filteredData);
        console.log("selectedMode", selectedMode);
        console.log("regionOptions", regionOptions);
    }, [yearOptions, yearRange, selectedMode, filteredData, regionOptions]);

    return (
        <div className='row'>
            <div className="col-8 p-2">
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
            </div>
            <div className="col-4 p-2">
                <Range
                    min={yearStatic.minYear}
                    max={yearStatic.maxYear}
                    step={1}
                    name="Year"
                    onChange={handleYearChange}
                />
            </div>
        </div>
    )
}

export default Sidebar;