// React
import React, { useState, useMemo, useEffect } from 'react';

// Data
import Drugdata from './data/Drug_seizures_2018_2022.json';
import PrevalenceNPSdata from './data/Prevalence_of_drug_use_NPS_General.json';
import PrevalenceNonNPSdata from './data/Prevalence_of_drug_use_NonNPS_General.json';
import PriceData from './data/Prices_of_drugs.json';
import IDSDataOne from './data/IDS_data_2018.json';
import IDSDataTwo from './data/IDS_data_2019.json';
import IDSDataThree from './data/IDS_data_2020.json';
import IDSDataFour from './data/IDS_data_2021.json';
import IDSDataFive from './data/IDS_data_2022.json';

// Components
import Sidebar from './components/Sidebar';
import WorldMap from './components/WorldMap';
import Prevalence from './components/Sankey';
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

    const [selectedBarData, setSelectedBarData] = useState(null);
    const handleBarDataSelect = (data) => {
        setSelectedBarData(data);
    }
    const IdsData = [...IDSDataOne, ...IDSDataTwo, ...IDSDataThree, IDSDataFour, ...IDSDataFive]

    // Filtered IDS_DATA
    const idsDataFilteredData = useMemo(() => {
        if (!IdsData || IdsData.length === 0) return [];

        return IdsData.filter((item) => {
            const year = Number(item.Year);

            // 필터 조건 확인
            const matchesRegion = filters.region.region ? item["Region"] === filters.region.region : true;
            const matchesSubRegion = filters.region.subRegion ? item["SubRegion"] === filters.region.subRegion : true;
            const matchesCountry = filters.region.country ? item["Country/Territory"] === filters.region.country : true;
            const matchesDrugGroup = filters.drugs.drugGroup ? item["Drug group"] === filters.drugs.drugGroup : true;

            // 필터링 조건 적용
            return (
                year >= filters.year[0] && // Year 필터
                year <= filters.year[1] &&
                matchesRegion && // Region 필터
                matchesSubRegion && // SubRegion 필터
                matchesCountry && // Country/Territory 필터
                matchesDrugGroup // Drug Group 필터
            );
        });
    }, [filters, IdsData]);

    const totalsByRegionHierarchy = useMemo(() => {
        if (!idsDataFilteredData || idsDataFilteredData.length === 0) {
            console.warn("No filtered IDS data found");
            return [];
        }

        const yearRange = filters.year || [];
        const minYear = yearRange[0] || 2018;
        const maxYear = yearRange[1] || 2022;

        const totalsMap = new Map(); // 중복 항목을 합산하기 위한 Map

        // 데이터 그룹화 및 누적 계산
        idsDataFilteredData.forEach((item) => {
            const {
                Region: region,
                'Country/Territory': country,
                SeizuredLocation: seizuredLocation,
                SeizuredLocationCategory: seizuredCategory,
                DrugGroup: drugGroup,
                TraffickingTransportationCategory: traffickingCategory, // 추가된 항목
                Year: year,
                Q2,
            } = item;

            const weight = parseFloat(Q2) || 0; // 압수량
            if (
                !region ||
                !country ||
                !seizuredLocation ||
                !seizuredCategory ||
                !drugGroup ||
                !traffickingCategory || // 추가 조건
                !year ||
                weight <= 0
            )
                return;

            // Unique Key 생성
            const key = `${region} > ${country} > ${seizuredLocation} > ${seizuredCategory} > ${drugGroup} > ${traffickingCategory}`;

            // 연도 초기화
            const yearly = {};
            for (let y = minYear; y <= maxYear; y++) {
                yearly[y] = 0;
            }

            if (!totalsMap.has(key)) {
                totalsMap.set(key, {
                    region,
                    country,
                    seizuredLocation,
                    seizuredCategory,
                    drugGroup,
                    traffickingCategory, // 추가된 항목
                    total: 0,
                    yearly: { ...yearly },
                });
            }

            // 데이터 누적
            const entry = totalsMap.get(key);
            entry.total += weight;
            entry.yearly[year] += weight;

            totalsMap.set(key, entry);
        });

        const resultArray = Array.from(totalsMap.values());
        return resultArray;
    }, [idsDataFilteredData, filters.year]);

    useEffect(() => {
        console.log("Filtered Data with Totals:", totalsByRegionHierarchy);
    }, [totalsByRegionHierarchy]);

    const yearlyIDSTotals = useMemo(() => {
        if (!idsDataFilteredData || idsDataFilteredData.length === 0) return [];

        // Initialize totals for each year
        const yearTotalsMap = {
            2018: 0,
            2019: 0,
            2020: 0,
            2021: 0,
            2022: 0,
        };

        // Accumulate weights for each year
        idsDataFilteredData.forEach((item) => {
            const year = Number(item.Year);
            const weight = parseFloat(item.Kilograms) || 0; // Assuming weight is in "Kilograms"

            if (yearTotalsMap.hasOwnProperty(year)) {
                yearTotalsMap[year] += weight;
            }
        });

        // Convert to array of objects
        return Object.entries(yearTotalsMap).map(([year, total]) => ({
            year: Number(year),
            total,
        }));
    }, [idsDataFilteredData]);




    const handleMapCountrySelect = ({ region, country }) => {

        handleFilterChange({
            region: {
                region: region,
                subRegion: null,
                country: country
            }
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

    const FilteredPriceData = useMemo(() => {
        if (!PriceData || PriceData.length === 0) return [];

        return PriceData.filter((item) => {
            const year = Number(item.Year); // Ensure 'Year' is a number
            const country = item["Country/Territory"];
            const drugGroup = item["Drug group"];
            const subRegion = item["Sub-region"];
            const typical_USD = parseFloat(item.Typical_USD) || 0; // Parse 'Best' as a float
            const minimum_USD = parseFloat(item.Minimum_USD) || 0; // Parse 'Best' as a float
            const maximum_USD = parseFloat(item.Maximum_USD) || 0; // Parse 'Best' as a float


            return (
                year >= filters.year[0] && // Check if year is within range
                year <= filters.year[1] &&
                (filters.region ? country === filters.region : true) && // Filter by region if specified
                (filters.subRegion ? subRegion === filters.subRegion : true) && // Filter by sub-region
                (filters.drugs.length > 0 ? filters.drugs.includes(item["Drug group"]) : true)
                // (filters.drugs.length > 0 ? filters.drugs.includes(drugGroup) : true)  // Filter by drug group if specified
                // (filters.bestRange ? bestValue >= filters.bestRange[0] && bestValue <= filters.bestRange[1] : true)
            );
        });
    }, [filters]); // Recalculate when filters change


    // Filtered Seizure BarSelect Data (Step 1)
    const drugBarFilteredData = useMemo(() => {
        console.log("SelectedBarDATA:", selectedBarData);

        // Ensure Drugdata and selectedBarData are valid
        if (!Drugdata || Drugdata.length === 0) {
            console.log("Drugdata is empty or undefined.");
            return [];
        }
        if (!selectedBarData || !selectedBarData.msCode || !selectedBarData.drugGroup) {
            console.log("No valid selectedBarData provided.");
            return [];
        }

        // Filter the data to match `msCode`, `Drug group`, and restrict by `Year range`
        const filteredData = Drugdata.filter((item) => {
            const year = Number(item.Year); // Ensure Year is a valid number
            const matchesDrugs = item["Drug group"] === selectedBarData.drugGroup; // Check Drug group match
            const matchesmsCode = item["msCode"] === selectedBarData.msCode; // Check msCode match
            const inYearRange = year >= filters.year[0] && year <= filters.year[1]; // Check Year range

            // All conditions must be true for the item to pass
            return matchesDrugs && matchesmsCode && inYearRange;
        });

        console.log("Filtered DrugBar Data:", filteredData);
        return filteredData;
    }, [Drugdata, selectedBarData, filters.year]);

    // Filterering (Step 2)
    const yearlyTotals = useMemo(() => {
        // Ensure filtered data is valid
        if (!drugBarFilteredData || drugBarFilteredData.length === 0) {
            console.log("No data available for yearly totals.");
            return [];
        }

        // Initialize an object to hold totals for each year
        const yearTotalsMap = {
            2018: 0,
            2019: 0,
            2020: 0,
            2021: 0,
            2022: 0,
        };

        // Loop through filtered data and accumulate totals for each year
        drugBarFilteredData.forEach((item) => {
            const year = Number(item.Year);
            const weight = parseFloat(item.Kilograms) || 0; // Assume weight is stored in "Kilograms"

            // Add the weight to the corresponding year
            if (yearTotalsMap.hasOwnProperty(year)) {
                yearTotalsMap[year] += weight;
            }
        });

        // Convert the yearTotalsMap into an array of objects
        const result = Object.entries(yearTotalsMap).map(([year, total]) => ({
            year: Number(year),
            total,
        }));

        console.log("Yearly Totals:", result);
        return result;
    }, [drugBarFilteredData]);

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
    /*
        // TimeBased IDS_DATA Totals by Country and Year
        const IDSDataGroupedByRegion = useMemo(() => {
            if (!idsDataFilteredData || idsDataFilteredData.length === 0) {
                console.warn("No filtered IDS data found");
                return [];
            }
    
            const groupedData = {};
    
            idsDataFilteredData.forEach((item) => {
                const {
                    Region: region,
                    SubRegion: subRegion,
                    'Country/Territory': country,
                    Year: year,
                    Date: date,
                    DrugGroup: drugGroup,
                    Q2: quantity,
                    U2: unit,
                } = item;
    
                const parsedYear = Number(year);
                const parsedQuantity = parseFloat(quantity) || 0;
    
                // Skip invalid or zero values
                if (!region || !subRegion || !country || !drugGroup || parsedQuantity <= 0) return;
    
                // Create a unique key for Region + SubRegion + Country + DrugGroup
                const key = `${region}-${subRegion}-${country}-${drugGroup}`;
    
                if (!groupedData[key]) {
                    groupedData[key] = {
                        region,
                        subRegion,
                        country,
                        drugGroup,
                        total: 0,
                        years: {}, // Store quantities by year
                    };
                }
    
                // Initialize the year if not already present
                if (!groupedData[key].years[parsedYear]) {
                    groupedData[key].years[parsedYear] = {
                        year: parsedYear,
                        total: 0,
                        dates: {}, // Store quantities by date
                    };
                }
    
                // Parse the date (if available)
                const parsedDate = date ? new Date(date).toISOString().split("T")[0] : null;
    
                // Aggregate total quantity at the year level
                groupedData[key].years[parsedYear].total += parsedQuantity;
    
                // Aggregate total quantity at the date level (if date exists)
                if (parsedDate) {
                    if (!groupedData[key].years[parsedYear].dates[parsedDate]) {
                        groupedData[key].years[parsedYear].dates[parsedDate] = 0;
                    }
                    groupedData[key].years[parsedYear].dates[parsedDate] += parsedQuantity;
                }
    
                // Update overall total
                groupedData[key].total += parsedQuantity;
            });
    
            // Convert grouped data to an array format for visualization
            return Object.values(groupedData).map((group) => ({
                ...group,
                years: Object.values(group.years).map((yearData) => ({
                    ...yearData,
                    dates: Object.entries(yearData.dates).map(([date, quantity]) => ({
                        date,
                        quantity,
                    })),
                })),
            }));
        }, [idsDataFilteredData]);
    */
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
            const drugType = item['Drug'];
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
                        drugTypes: {},
                    };
                }

                // Initialize drugType-level entry
                if (!totalsMap[country][drugGroup].drugTypes[drugType]) {
                    totalsMap[country][drugGroup].drugTypes[drugType] = {
                        total: 0,
                        years: {},
                    };
                }

                // Add Weight to total for drugGruop
                totalsMap[country][drugGroup].total += weight;

                // Add weight to total for drugType
                totalsMap[country][drugGroup].drugTypes[drugType].total += weight;

                if (!totalsMap[country][drugGroup].years[year]) {
                    totalsMap[country][drugGroup].years[year] = 0;
                }
                totalsMap[country][drugGroup].years[year] += weight;

                if (!totalsMap[country][drugGroup].drugTypes[drugType].years[year]) {
                    totalsMap[country][drugGroup].drugTypes[drugType].years[year] = 0;
                }

                totalsMap[country][drugGroup].drugTypes[drugType].years[year] += weight;

                if (msCode) {
                    totalsMap[country][drugGroup].msCodes.add(msCode);
                }
            }
        });

        const totalsArray = [];
        Object.keys(totalsMap).forEach((country) => {
            Object.keys(totalsMap[country]).forEach((drugGroup) => {
                const { total, years, msCodes, drugTypes } = totalsMap[country][drugGroup];
                const drugTypeArray = Object.keys(drugTypes).map((drugType) => ({
                    drugType,
                    total: drugTypes[drugType].total,
                    years: drugTypes[drugType].years,
                }));

                totalsArray.push({
                    country,
                    drugGroup,
                    total,
                    years,
                    msCodes: Array.from(msCodes),
                    drugTypes: drugTypeArray,
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
        console.log('Filteres DrugSeziure Data: ', drugSeziureFilteredData);
        // console.log('Processed Seizure Data:', totalsByCountryDrugGroupAndYear);
        console.log('selection', selectedBarData);
        console.log('selectionFiltered', drugBarFilteredData);
        console.log('yearlyTotals', yearlyTotals);
        console.log('Filter Map', filteredMapData);
        console.log('totalsByCountryAndYearForMap', totalsByCountryAndYearForArray);
    }, [filters, totalsByCountryDrugGroupAndYear, selectedBarData, drugBarFilteredData, yearlyTotals]);

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
            {/* Options */}
            <Sidebar
                onFilterChange={handleFilterChange}
                selectedRegion={filters.region.region}
                selectedCountry={filters.region.country}
            />
            {/* Main Content */}
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
                    <Prevalence data={totalsByRegionHierarchy} />
                </div>
            </div>
            <div className='row'>
                {/* Seizure */}
                <div className='col-6 p-2' style={{ height: '400px' }}>
                    <Seizure data={totalsByCountryDrugGroupAndYear} selectedCountry={filters.region.country} selectedDrugType={filters.drugs.drugGroup} onBarDataSelect={handleBarDataSelect} />
                </div>
                {/* Price Charts */}
                <div className='col-6 p-2' style={{ height: '400px' }}>
                    <UseQuantity data={yearlyTotals} />
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
