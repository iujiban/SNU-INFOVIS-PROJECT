// React
import React, { useState, useMemo, useEffect } from 'react';

// Data
import Drugdata from './data/Drug_seizures_2018_2022.json';
import PrevalenceNPSdata from './data/Prevalence_of_drug_use_NPS_General.json';
import PrevalenceNonNPSdata from './data/Prevalence_of_drug_use_NonNPS_General.json'
import PriceData from './data/Prices_of_drugs.json'

// Components
import Sidebar from './components/Sidebar';
import WorldMap from './components/WorldMap';
import Prevalence from './components/Prevalence';
import Seizure from './components/Seizure';
import Price from './components/Price';
import UseQuantity from './components/UseQuantity';

// Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';

// Seizure data
export const seizureData = [
    { group: "2018", Opioid: 20, Benzo: 15, NonOpioid: 10 },
    { group: "2019", Opioid: 25, Benzo: 18, NonOpioid: 12 },
    { group: "2020", Opioid: 22, Benzo: 20, NonOpioid: 15 },
    { group: "2021", Opioid: 30, Benzo: 22, NonOpioid: 18 },
    { group: "2022", Opioid: 28, Benzo: 25, NonOpioid: 20 }
];

// Sample data for prevalence and price charts
export const prevalenceData1 = [
    { label: "Category A", value: 30 },
    { label: "Category B", value: 45 },
    { label: "Category C", value: 25 }
];

export const prevalenceData2 = [
    { label: "Type X", value: 40 },
    { label: "Type Y", value: 35 },
    { label: "Type Z", value: 25 }
];

export const priceData = [
    { date: "2023-01-01", price: 100 },
    { date: "2023-02-01", price: 120 },
    { date: "2023-03-01", price: 115 },
    { date: "2023-04-01", price: 140 },
    { date: "2023-05-01", price: 135 },
    { date: "2023-06-01", price: 160 }
];

const Dashboard = () => {
    const [filters, setFilters] = useState({
        mode: [], 
        gender: 'all',
        drugs: { drugGroup: null, drug: null },
        region: { region: null, subRegion: null, country: null },
        year: [2018, 2022],
    });
    
    const handleFilterChange = (newFilters) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            ...newFilters,
        }));
    };

    const handleMapCountrySelect = ({ region, country }) => {
        console.log('Dashboard handleMapCountrySelect:', { region, country });
        setFilters(prevFilters => {
            const newFilters = {
                ...prevFilters,
                region: {
                    region: region,
                    subRegion: null,  // Reset subRegion when selecting from map
                    country: country
                }
            };
            console.log('New filters:', newFilters);
            return newFilters;
        });
    };

    // Filtered PrevalanceNPS Data
    const filteredPrevalenceData = useMemo(() => {
        if (!PrevalenceNPSdata || PrevalenceNPSdata.length === 0) return [];

        return PrevalenceNPSdata.filter((item) => {
            const year = Number(item.Year); // Ensure 'Year' is a number
            const country = item["Country/Territory"];
            const drugGroup = item["Drug group"];
            const subRegion = item["Sub-region"];
            const bestValue = parseFloat(item.Best) || 0; // Parse 'Best' as a float
            const male = item.Male;
            const female = item.Female;
            const age = item.Age;

            return (
                year >= filters.year[0] && // Check if year is within range
                year <= filters.year[1] &&
                (filters.region ? country === filters.region : true) && // Filter by region if specified
                (filters.subRegion ? subRegion === filters.subRegion : true) && // Filter by sub-region
                (filters.drugs.length > 0 ? filters.drugs.includes(drugGroup) : true) && // Filter by drug group if specified
                (filters.bestRange ? bestValue >= filters.bestRange[0] && bestValue <= filters.bestRange[1] : true) && // Filter by Best value range
                (filters.male ? male === filters.male : true) && // Filter by Male value
                (filters.female ? female === filters.female : true) && // Filter by Female value
                (filters.age ? age === filters.age : true) // Filter by Age
            );
        });
    }, [filters]); // Recalculate when filters change




    // Filtered Seizure Data
    const drugSeziureFilteredData = useMemo(() => {
        if (!Drugdata || Drugdata.length === 0) return [];
        
        return Drugdata.filter((item) => {
            const year = Number(item.Year);
            const matchesRegion = filters.region.region ? item["Region"] === filters.region.region : true;
            const matchesSubRegion = filters.region.subRegion ? item["SubRegion"] === filters.region.subRegion : true;
            const matchesCountry = filters.region.country ? item["Country/Territory"] === filters.region.country : true;
            const matchesDrugs = filters.drugs.drugGroup ? item["Drug group"] === filters.drugs.drugGroup : true;
    
            return (
                year >= filters.year[0] &&
                year <= filters.year[1] &&
                matchesRegion &&
                matchesSubRegion &&
                matchesCountry &&
                matchesDrugs
            );
        });
    }, [filters]);

    // Map Processed Totals by Country and Year
    const totalsByCountryAndYearForArray = useMemo(() => {
        if (!drugSeziureFilteredData || drugSeziureFilteredData.length === 0) {
            console.warn('No filtered seizure data found');
            return [];
        }
    
        const totalsMap = {};
    
        // Build the hierarchical totals map
        drugSeziureFilteredData.forEach((item) => {
            const { Region: region, SubRegion: subRegion, 'Country/Territory': country, Year: year, Kilograms } = item;
            const weight = parseFloat(Kilograms) || 0;
    
            if (!region || !subRegion || !country || !year || weight <= 0) return;
    
            // Initialize region if not present
            if (!totalsMap[region]) {
                totalsMap[region] = {
                    total: 0,
                    years: {},
                    subRegions: {},
                };
            }
    
            // Add to region total
            totalsMap[region].total += weight;
    
            // Add to region year total
            if (!totalsMap[region].years[year]) {
                totalsMap[region].years[year] = 0;
            }
            totalsMap[region].years[year] += weight;
    
            // Initialize subRegion if not present
            if (!totalsMap[region].subRegions[subRegion]) {
                totalsMap[region].subRegions[subRegion] = {
                    total: 0,
                    years: {},
                    countries: {},
                };
            }
    
            // Add to subRegion total
            totalsMap[region].subRegions[subRegion].total += weight;
    
            // Add to subRegion year total
            if (!totalsMap[region].subRegions[subRegion].years[year]) {
                totalsMap[region].subRegions[subRegion].years[year] = 0;
            }
            totalsMap[region].subRegions[subRegion].years[year] += weight;
    
            // Initialize country if not present
            if (!totalsMap[region].subRegions[subRegion].countries[country]) {
                totalsMap[region].subRegions[subRegion].countries[country] = {
                    total: 0,
                    years: {},
                };
            }
    
            // Add to country total
            totalsMap[region].subRegions[subRegion].countries[country].total += weight;
    
            // Add to country year total
            if (!totalsMap[region].subRegions[subRegion].countries[country].years[year]) {
                totalsMap[region].subRegions[subRegion].countries[country].years[year] = 0;
            }
            totalsMap[region].subRegions[subRegion].countries[country].years[year] += weight;
        });
    
        // Flatten the hierarchical structure into an array
        const resultArray = [];
    
        Object.entries(totalsMap).forEach(([region, regionData]) => {
            // Add region-level data
            resultArray.push({
                level: "Region",
                name: region,
                total: regionData.total,
                years: regionData.years,
            });
    
            Object.entries(regionData.subRegions).forEach(([subRegion, subRegionData]) => {
                // Add sub-region-level data
                resultArray.push({
                    level: "SubRegion",
                    name: subRegion,
                    total: subRegionData.total,
                    parent: region,
                    years: subRegionData.years,
                });
    
                Object.entries(subRegionData.countries).forEach(([country, countryData]) => {
                    // Add country-level data
                    resultArray.push({
                        level: "Country",
                        name: country,
                        total: countryData.total,
                        parent: subRegion,
                        years: countryData.years,
                    });
                });
            });
        });
    
        console.log('Flattened Array:', resultArray); // Debugging output
        return resultArray;
    }, [drugSeziureFilteredData]);

    // Processed Totals by Country, Drug Group, and Year
    const totalsByCountryDrugGroupAndYear = useMemo(() => {
        if (!drugSeziureFilteredData || drugSeziureFilteredData.length === 0) return [];

        const totalsMap = {};

        drugSeziureFilteredData.forEach((item) => {
            const country = item['Country/Territory'];
            const drugGroup = item['Drug group'];
            const year = Number(item['Year']);
            const msCode = item['msCode'];
            const weight = parseFloat(item['Kilograms']) || 0;

            if (country && drugGroup) {
                if (!totalsMap[country]) totalsMap[country] = {};
                if (!totalsMap[country][drugGroup]) {
                    totalsMap[country][drugGroup] = {
                        total: 0,
                        years: {},
                        msCodes: new Set(),
                    };
                }
                totalsMap[country][drugGroup].total += weight;

                if (!totalsMap[country][drugGroup].years[year]) {
                    totalsMap[country][drugGroup].years[year] = 0;
                }
                totalsMap[country][drugGroup].years[year] += weight;

                if (msCode) {
                    totalsMap[country][drugGroup].msCodes.add(msCode);
                }
            }
        });

        const totalsArray = [];
        Object.keys(totalsMap).forEach((country) => {
            Object.keys(totalsMap[country]).forEach((drugGroup) => {
                const { total, years, msCodes } = totalsMap[country][drugGroup];
                totalsArray.push({
                    country,
                    drugGroup,
                    total,
                    years,
                    msCodes: Array.from(msCodes),
                });
            });
        });

        return totalsArray;
    }, [drugSeziureFilteredData]);

    const filteredMapData = useMemo(() => {
        const result = {};
        // Mode에 따라 바뀌는 데이터
        if (filters.mode.includes('prevalence')) {
            result.NPS = PrevalenceNPSdata;
            result.NonNPS = PrevalenceNonNPSdata;
        } else if (filters.mode.includes('seizure')) {
            result.seizure = Drugdata; 
        } else if (filters.mode.includes('price')) {
            result.price = PriceData;
        }

        return result; // Return null if mode doesn't match any dataset

    }, [filters.mode]);

    useEffect(() => {
        console.log('Dashboard filters updated:', filters);
    }, [filters]);

    // Debug
    useEffect(() => {
       // console.log('Prevalence Data: ', filteredPrevalenceData);
       // console.log('Filters updated:', filters);
       // console.log('Selected Country in Dashboard:', filters.region?.country);
       // console.log('Filteres DrugSeziure Data: ', drugSeziureFilteredData);
       // console.log('Processed Seizure Data:', totalsByCountryDrugGroupAndYear);
       console.log('Filter Map', filteredMapData)
       console.log('totalsByCountryAndYearForMap', totalsByCountryAndYearForArray);
    }, [filters, totalsByCountryDrugGroupAndYear]);
    
    // UI 렌더링
    return (
        <div className='container-fluid'>
            {/* Navbar */}
            <div className='row'>
                <nav class="navbar bg-body-tertiary">
                    <div class="container-fluid">
                        <span class="navbar-brand mb-0 h1">Global Drug Use Dashboard</span>
                    </div>
                </nav>
            </div>
            <div className='row'>
                {/* Sidebar */}
                <div className='col-2 p-2'>
                    <Sidebar 
                        onFilterChange={handleFilterChange} 
                        selectedRegion={filters.region.region}
                        selectedCountry={filters.region.country}
                    />
                </div>
                {/* Main Content */}
                <div className='col-10 p-2'>
                    <div className='row'>
                        {/* Map */}
                        <div className='col-6 p-2' style={{ height: '400px' }}>
                            <WorldMap 
                                data={totalsByCountryAndYearForArray}
                                selectedRegion={filters.region.region}
                                selectedCountry={filters.region.country}
                                onCountrySelect={handleMapCountrySelect}
                            />
                        </div>
                        {/* Prevalence */}
                        <div className='col-6 p-2' style={{ height: '400px' }}>
                            <Prevalence data1={prevalenceData1} data2={prevalenceData2} />
                        </div>
                    </div>
                    <div className='row'>
                        {/* Seizure */}
                        <div className='col-6 p-2' style={{ height: '400px' }}>
                            <Seizure data={totalsByCountryDrugGroupAndYear} selectedCountry={filters.region.country} />
                        </div>
                        {/* Price Charts */}
                        <div className='col-6 p-2' style={{ height: '400px' }}>
                            <div className='col-12 h-50'>
                                <UseQuantity data={filteredPrevalenceData} />
                            </div>
                            <div className='col-12 h-50'>
                                <Price data={filteredPrevalenceData} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Footer */}
            <div className='row'>
                <footer class="py-3 my-4">
                    <p class="text-center text-body-secondary"> 2024 Jihoon Ban, Jaeseon Lee, Jaeyong Lee, Seohee Kim</p>
                    <p class="text-center text-body-secondary">
                        Source code: <a href="https://github.com/iujiban/SNU-INFOVIS-PROJECT">Github</a>
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default Dashboard;
