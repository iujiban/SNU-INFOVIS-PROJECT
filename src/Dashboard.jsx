// React
import React, { useState, useMemo, useEffect } from 'react';

// Data
import Drugdata from './data/Drug_seizures_2018_2022.json';
import PrevalenceNPSdata from './data/Prevalence_of_drug_use_NPS_General.json';
import PrevalenceNonNPSdata from './data/Prevalence_of_drug_use_NonNPS_General.json'
import PriceData from './data/Prices_of_drugs.json'

// Components
import Sidebar from './components/Sidebar';
import Map from './components/Map';
import Prevalence from './components/Prevalence';
import Seizure from './components/Seizure';
import Price from './components/Price';

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
        drugs: [],
        region: null,
        year: [2018, 2022],
    });
    
    const handleFilterChange = (newFilters) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            ...newFilters,
        }));
    };

    // Filtered Seizure Data
    const drugSeziureFilteredData = useMemo(() => {
        if (!Drugdata || Drugdata.length === 0) return [];
        return Drugdata.filter((item) => {
            const year = Number(item.Year);
            return (
                year >= filters.year[0] &&
                year <= filters.year[1] &&
                (filters.region ? item["Country/Territory"] === filters.region : true) &&
                (filters.drugs.length > 0 ? filters.drugs.includes(item["Drug group"]) : true)
            );
        });
    }, [filters]);

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

    // Debug
    useEffect(() => {
        console.log('Filters updated:', filters);
        console.log('Processed Seizure Data:', totalsByCountryDrugGroupAndYear);
    }, [filters, totalsByCountryDrugGroupAndYear]);

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
        // Apply the filters to fetch or filter data as needed
        console.log('Filters updated:', filters);
    }, [filters]);

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
            <div className='row' style={{ height: 'calc(100vh - 150px)' }}>
                {/* Sidebar */}
                <div className='col-2 p-2 d-flex flex-column' style={{ height: '100%' }}>
                    <Sidebar onFilterChange={handleFilterChange} />
                </div>
                {/* Main Content */}
                <div className='col-10 p-2 d-flex flex-column' style={{ height: '100%' }}>
                    <div className='row flex-grow-1' style={{ flex: 1 }}>
                        {/* Map */}
                        <div className='col-6 p-2 h-100'>
                            <Map data ={filteredMapData}/>
                        </div>
                        {/* Prevalence */}
                        <div className='col-6 p-2 h-100'>
                            <Prevalence data1={prevalenceData1} data2={prevalenceData2} />
                        </div>
                    </div>
                    <div className='row flex-grow-1' style={{ flex: 1 }}>
                        {/* Seizure */}
                        <div className='col-6 p-2 h-100'>
                            <Seizure data={totalsByCountryDrugGroupAndYear} />
                        </div>
                        {/* Price */}
                        <div className='col-6 p-2 h-100'>
                            <Price data={priceData} />
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
