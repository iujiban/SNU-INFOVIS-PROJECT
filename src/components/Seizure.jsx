import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useDimensions } from '../hooks/useDimensions';
import ExpandButton from './ui/ExpandButton';
import Modal from './ui/Modal';

const SeizureChart = ({ data, selectedCountry, selectedDrugType }) => {
    const containerRef = useRef();
    const svgRef = useRef();
    const svgContainerRef = useRef();
    const modalSvgRef = useRef();
    const dimensions = useDimensions(containerRef);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBarData, setSelectedBarData] = useState(null);
    const [selectedBar, setSelectedBar] = useState(null); // Track the selected DOM element


    const customColors = (selectedDrugType) => {
        const colors = {
            "Cannabis and Synthetic Cannabinoids": "#8dd3c7",
            "Cocaine and Derivatives": "#ffffb3",
            "Opioids and Opiates": "#bebada",
            "Amphetamines and Stimulants": "#fb8072",
            "Classic Hallucinogens": "#80b1d3",
            "Tranquillizers and Sedatives": "#fdb462",
            "MDMA and Ecstasy-like Drugs": "#b3de69",
            "NPS": "#fccde5",
            "Miscellaneous": "#d9d9d9"
        };

        // If no drug type is selected, return all colors
        if (!selectedDrugType) return colors;

        // If a drug type is selected, create a color map for selected types
        const colorMap = {};
        const colorValues = Object.values(colors);
        selectedDrugType.forEach((drugType, index) => {
            colorMap[drugType] = colorValues[index % colorValues.length];
        });

        return colorMap;
    };

    // Process data for Stacked Bar Chart
    const processDataForStackedBar = (data, selectedDrugType) => {
        const groupedData = data.reduce((acc, item) => {
            const msCode = Array.isArray(item.msCodes) && item.msCodes.length > 0 ? item.msCodes[0] : "Unknown";
            const country = item.country && item.country.trim() !== "" ? item.country : "Unknown";
            const drugGroup = selectedDrugType
                ? item.drugTypes.find((d) => d.drugType === selectedDrugType)?.drugType
                : item.drugGroup;
            const total = parseFloat(item.total) || 0;

            if (!drugGroup || msCode === "Unknown" || country === "Unknown" || total <= 0) {
                return acc; // Skip invalid records
            }

            if (!acc[msCode]) {
                acc[msCode] = { msCode, country, drugGroups: {} };
            }

            if (!acc[msCode].drugGroups[drugGroup]) {
                acc[msCode].drugGroups[drugGroup] = 0;
            }
            acc[msCode].drugGroups[drugGroup] += total;

            return acc;
        }, {});

        // Normalize data: convert values to percentages
        const processedData = Object.entries(groupedData).map(([msCode, { country, drugGroups }]) => {
            const total = Object.values(drugGroups).reduce((sum, value) => sum + value, 0); // Total for each country
            const normalized = Object.keys(drugGroups).reduce((acc, key) => {
                acc[key] = (drugGroups[key] / total) * 100; // Normalize to percentage
                return acc;
            }, {});
            return { msCode, country, ...normalized };
        });

        return processedData;
    };

    const preprocessDrugTypes = (data) => {
        const lookup = {};

        data.forEach((item) => {
            const drugGroup = item.drugGroup;
            if (!item.drugTypes || item.drugTypes.length === 0) return;

            if (!lookup[drugGroup]) {
                lookup[drugGroup] = {};
            }

            item.drugTypes.forEach((drugType) => {
                // Ensure each drugType is correctly added to the lookup
                if (!lookup[drugGroup][drugType.drugType]) {
                    lookup[drugGroup][drugType.drugType] = [];
                }
                lookup[drugGroup][drugType.drugType].push({
                    country: item.country,
                    msCodes: item.msCodes,
                    total: drugType.total,
                    years: drugType.years,
                });
            });
        });

        return lookup;
    };


    // Example: Preprocess the data
    const drugTypeLookup = preprocessDrugTypes(data);

    const processDataFromPreprocessedLookup = (lookup, selectedDrugType) => {
        if (!selectedDrugType || !lookup[selectedDrugType]) {
            console.warn("No Drug Type selected or not found in lookup");
            return [];
        }

        const groupedData = Object.entries(lookup[selectedDrugType]).reduce((acc, [drugType, entries]) => {
            entries.forEach((item) => {
                const msCode = Array.isArray(item.msCodes) && item.msCodes.length > 0 ? item.msCodes[0] : "Unknown";
                const country = item.country || "Unknown";
                const total = parseFloat(item.total) || 0;

                if (msCode === "Unknown" || country === "Unknown" || total <= 0) {
                    return acc; // Skip invalid records
                }

                if (!acc[msCode]) {
                    acc[msCode] = { msCode, country, drugs: {} };
                }

                if (!acc[msCode].drugs[drugType]) {
                    acc[msCode].drugs[drugType] = 0;
                }
                acc[msCode].drugs[drugType] += total;
            });

            return acc;
        }, {});

        // Normalize the data
        const normalizedData = Object.entries(groupedData).map(([msCode, { country, drugs }]) => {
            const total = Object.values(drugs).reduce((sum, value) => sum + value, 0);

            const normalized = Object.keys(drugs).reduce((acc, drugName) => {
                acc[drugName] = (drugs[drugName] / total) * 100; // Convert to percentages
                return acc;
            }, {});

            return { msCode, country, ...normalized };
        });

        return normalizedData;
    };

    // Create Stacked Bar Chart
    const createStackedBarChart = (processedData, colorMap, targetRef) => {
        const svgContainer = d3.select(svgContainerRef.current);
        const containerDimensions = svgContainer.node().getBoundingClientRect();
        const margin = { top: 20, right: 30, bottom: 60, left: 50 };  // Increased bottom margin
        
        // Calculate the actual chart dimensions
        const width = containerDimensions.width;
        const height = containerDimensions.height;
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        // Set up the SVG with viewBox for responsiveness
        const svg = d3.select(targetRef.current)
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        svg.selectAll("*").remove(); // Clear previous content

        // Create a group for the chart content with margin translation
        const chartGroup = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Extract the drug group keys
        const drugGroups = Array.from(
            new Set(
                processedData.flatMap((d) =>
                    Object.keys(d).filter((key) => key !== "msCode" && key !== "country")
                )
            )
        );

        const stack = d3.stack().keys(drugGroups);
        const series = stack(
            processedData.map((d) => ({
                msCode: d.msCode,
                ...drugGroups.reduce((obj, key) => {
                    obj[key] = d[key] || 0;
                    return obj;
                }, {}),
            }))
        );

        const x = d3
            .scaleBand()
            .domain(processedData.map((d) => d.msCode))
            .range([0, chartWidth])
            .padding(0.1);

        const y = d3
            .scaleLinear()
            .domain([0, 100])
            .range([chartHeight, 0]);

        const color = (drugGroup) => colorMap[drugGroup] || "#ccc";

        let selectedBar = null; // Track the selected bar

        // Add the bars
        chartGroup
            .selectAll("g")
            .data(series)
            .join("g")
            .attr("fill", (d) => color(d.key))
            .selectAll("rect")
            .data((d) => d)
            .join("rect")
            .attr("x", (d) => x(d.data.msCode))
            .attr("y", (d) => y(d[1]))
            .attr("height", (d) => y(d[0]) - y(d[1]))
            .attr("width", x.bandwidth())
            .on("mouseover", function (event, d) {
                const drugGroup = d3.select(this.parentNode).datum().key;
                const percentage = (d[1] - d[0]).toFixed(1);
                setSelectedBarData({
                    drugGroup,
                    percentage,
                    msCode: d.data.msCode,
                });

                // Highlight the bar
                if (selectedBar) {
                    d3.select(selectedBar).attr("stroke-width", 0);
                }
                d3.select(this)
                    .attr("stroke", "black")
                    .attr("stroke-width", 2);
                selectedBar = this;
            })
            .on("mouseout", function () {
                setSelectedBarData(null);
                // Remove highlight
                if (selectedBar) {
                    d3.select(selectedBar).attr("stroke-width", 0);
                    selectedBar = null;
                }
            });

        // Add the x-axis
        chartGroup
            .append("g")
            .attr("transform", `translate(0,${chartHeight})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle")
            .style("font-size", "4px")
            .attr("dx", "-3em")
            .attr("dy", "-2em");

        // Add the y-axis
        const yAxis = chartGroup
            .append("g")
            .call(d3.axisLeft(y).ticks(null, "s"))
            .selectAll("text")
            .style("font-size", "3px");

        // Add y-axis title
        chartGroup.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left + 25)
            .attr("x", -chartHeight / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "8px")
            .text("Percentage");
    };

    const renderLegend = (selectedDrugType, selectedCountry) => {
        // Define default group colors
        const groupColors = {
            "Cannabis and Synthetic Cannabinoids": "#8dd3c7",
            "Cocaine and Cocaine-type": "#ffffb3",
            "Opioids": "#bebada",
            "ATS": "#fb8072",
            "Hallucinogens": "#80b1d3",
            "Sedatives and Tranquilizers": "#fdb462",
            "Solvents and Inhalants": "#b3de69",
            "NPS": "#fccde5",
            "Miscellaneous": "#d9d9d9"
        };

        const legendColors = selectedDrugType ? customColors(selectedDrugType) : groupColors;

        // Render the legend UI
        return (
            <ul style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'flex-start',
                alignItems: 'center',
                listStyleType: 'none',
                padding: 0,
                margin: 0,
                gap: '8px',
                height: '100%',
                overflow: 'auto'
            }}>
                {Object.entries(legendColors).map(([label, color]) => (
                    <li
                        key={label}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <span
                            style={{
                                display: 'inline-block',
                                width: '15px',
                                height: '15px',
                                backgroundColor: color,
                                marginRight: '5px',
                            }}
                        ></span>
                        {label}
                    </li>
                ))}
            </ul>
        );
    };

    // Create Pie Chart 
    const createPieChart = (processedData, colorMap, targetRef) => {
        const svgContainer = d3.select(svgContainerRef.current);
        const containerDimensions = svgContainer.node().getBoundingClientRect();
        const margin = { top: 20, right: 30, bottom: 40, left: 50 };
        
        // Calculate dimensions
        const width = containerDimensions.width;
        const height = containerDimensions.height;
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;
        const radius = Math.min(chartWidth, chartHeight) / 2;

        // Clear the previous chart
        const svg = d3.select(targetRef.current)
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        svg.selectAll("*").remove();

        // Create a group for the pie chart, centered in the available space
        const chartGroup = svg.append('g')
            .attr('transform', `translate(${width/2},${height/2})`);

        // Process data for pie chart
        const pieData = processedData.reduce((acc, item) => {
            Object.entries(item).forEach(([key, value]) => {
                if (key !== "msCode" && key !== "country") {
                    if (!acc[key]) acc[key] = 0;
                    acc[key] += value;
                }
            });
            return acc;
        }, {});

        const pie = d3.pie()
            .value(d => d[1])
            .sort(null);

        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(radius);

        // Add the pie slices
        const slices = chartGroup
            .selectAll('path')
            .data(pie(Object.entries(pieData)))
            .join('path')
            .attr('d', arc)
            .attr('fill', d => colorMap[d.data[0]] || "#ccc")
            .attr('stroke', '#FFFFFF')
            .style('stroke-width', '0.5px');

        // Add hover interactions
        slices
            .on('mouseover', function(event, d) {
                const percentage = (d.data[1]).toFixed(1);
                setSelectedBarData({
                    drugGroup: d.data[0],
                    percentage,
                });
                
                d3.select(this)
                    .attr('stroke', 'black')
                    .style('stroke-width', '2px');
            })
            .on('mouseout', function() {
                setSelectedBarData(null);
                d3.select(this)
                    .attr('stroke', '#FFFFFF')
                    .style('stroke-width', '0.5px');
            });
    };


    useEffect(() => {
        if (!data || !dimensions.width || !dimensions.height) return;
        console.log("selected", selectedBar);
        console.log("Selected Bar Data:", selectedBarData);
        const findDrugType = (processedData, selectedData) => {
            if (!selectedData) {
                console.warn("No selected data provided.");
                return null;
            }

            const { msCode, drugValue } = selectedData;

            const matchingData = processedData.find((entry) => entry.msCode === msCode);

            if (!matchingData) {
                console.warn(`No matching data found for msCode: ${msCode}`);
                return null;
            }

            for (const [drugType, value] of Object.entries(matchingData)) {
                if (drugType !== "msCode" && drugType !== "country" && value === drugValue) {
                    return drugType;
                }
            }

            console.warn(`No matching drugType found for value: ${drugValue} in msCode: ${msCode}`);
            return null;
        };

        if (selectedCountry) {
            const processedData = selectedDrugType
                ? processDataFromPreprocessedLookup(drugTypeLookup, selectedDrugType)
                : processDataForStackedBar(data);

            const colorMap = customColors(null);
            createPieChart(processedData, colorMap, svgRef);
            if (isModalOpen) {
                createPieChart(processedData, colorMap, modalSvgRef);
            }
        } else {
            const processedData = processDataForStackedBar(data);
            const colorMap = customColors(null);
            createStackedBarChart(processedData, colorMap, svgRef);
            if (isModalOpen) {
                createStackedBarChart(processedData, colorMap, modalSvgRef);
            }
        }

        if (selectedBarData) {
            const processedData = processDataForStackedBar(data);
            const drugType = findDrugType(processedData, selectedBarData);
            console.log("Found Drug Type:", drugType);
        } else {
            console.log("No bar data selected yet.");
        }
    }, [data, selectedCountry, selectedDrugType, dimensions, isModalOpen]);

    return (
        <div ref={containerRef} className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">
                    {selectedCountry
                        ? `Drug Distribution in ${selectedCountry}`
                        : selectedDrugType
                            ? `Drug Types in ${selectedDrugType}`
                            : 'Drug Distribution'}
                </h5>
                <ExpandButton onClick={() => setIsModalOpen(true)} />
            </div>
            <div className="card-body p-0 d-flex flex-column" style={{ height: '100%', overflow: 'hidden' }}>
                <div ref={svgContainerRef} style={{ flex: '1 1 auto', minHeight: 0, height: '70%', position: 'relative' }}>
                    <svg ref={svgRef}></svg>
                </div>
                <div style={{
                    padding: '8px',
                    backgroundColor: '#f8f9fa',
                    borderTop: '1px solid #dee2e6',
                    height: '30%'
                }}>
                    {renderLegend(selectedDrugType, selectedCountry)}
                </div>
            </div>
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedCountry
                    ? `Drug Distribution in ${selectedCountry}`
                    : selectedDrugType
                        ? `Drug Types in ${selectedDrugType}`
                        : 'Drug Distribution'}
            >
                <div className="card h-100">
                    <div className="card-body p-0 d-flex flex-column" style={{ height: '80vh', overflow: 'hidden' }}>
                        <div style={{ flex: '1 1 auto', minHeight: 0, height: '85%', overflowX: 'auto' }}>
                            <svg 
                                ref={modalSvgRef} 
                                style={{ 
                                    display: 'block', 
                                    width: '100%',
                                    height: '100%'
                                }}
                            ></svg>
                        </div>
                        <div style={{ 
                            padding: '8px',
                            backgroundColor: '#f8f9fa',
                            borderTop: '1px solid #dee2e6',
                            height: '15%'
                        }}>
                            {renderLegend(selectedDrugType, selectedCountry)}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default SeizureChart;
