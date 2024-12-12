import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useDimensions } from '../hooks/useDimensions';

const SeizureChart = ({ data, selectedCountry, selectedDrugType }) => {
    const containerRef = useRef();
    const svgRef = useRef();
    const dimensions = useDimensions(containerRef);

    const customColors = (selectedDrugType) => {
        const groupColors = {
            "Cannabis and Synthetic Cannabinoids": "#1f77b4", // Blue
            "Cocaine and Derivatives": "#ff7f0e", // Orange
            "Opioids and Opiates": "#2ca02c", // Green
            "Amphetamines and Stimulants": "#d62728", // Red
            "NPS": "#9467bd", // Purple
            "Tranquillizers and Sedatives": "#7f7f7f", // Gray
            "MDMA and Ecstasy-like Drugs": "#e377c2", // Pink
            "Classic Hallucinogens": "#bcbd22", // Olive
            "Miscellaneous": "#17becf" // Teal
        }

        const typeColors = [
            "#1f77b4", // Blue
            "#ff7f0e", // Orange
            "#2ca02c", // Green
            "#d62728", // Red
            "#9467bd", // Purple
            "#8c564b", // Brown
            "#e377c2", // Pink
            "#7f7f7f", // Gray
            "#bcbd22", // Olive
            "#17becf", // Teal
        ];

        // If no drug type is selected, return group colors
        if (!selectedDrugType) return groupColors;

        // If a drug type is selected, assign dynamic colors to each type
        const colorMap = {};
        let index = 0;
        selectedDrugType.forEach((drugType) => {
            colorMap[drugType] = typeColors[index % typeColors.length];
            index++;
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
    const createStackedBarChart = (processedData, colorMap) => {
        const { width, height } = dimensions;
        const margin = { top: 20, right: 30, bottom: 120, left: 50 };

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
            .range([margin.left, width - margin.right])
            .padding(0.1);

        const y = d3
            .scaleLinear()
            .domain([0, d3.max(series, (s) => d3.max(s, (d) => d[1]))])
            .range([height - margin.bottom, margin.top]);

        const color = (drugGroup) => colorMap[drugGroup] || "#ccc";

        // Clear previous chart
        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3
            .select(svgRef.current)
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        svg
            .append("g")
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
            .append("title")
            .text((d) => `${d.data.msCode}: ${d[1] - d[0]}%`);

        svg
            .append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));
    };

    const renderLegend = (selectedDrugType) => {
        // Define default group colors
        const groupColors = {
            "Cannabis and Synthetic Cannabinoids": "#1f77b4", // Blue
            "Cocaine and Derivatives": "#ff7f0e", // Orange
            "Opioids and Opiates": "#2ca02c", // Green
            "Amphetamines and Stimulants": "#d62728", // Red
            "NPS": "#9467bd", // Purple
            "Tranquillizers and Sedatives": "#7f7f7f", // Gray
            "MDMA and Ecstasy-like Drugs": "#e377c2", // Pink
            "Classic Hallucinogens": "#bcbd22", // Olive
            "Miscellaneous": "#17becf" // Teal
        };

        // Define dynamic type colors
        const typeColors = [
            "#1f77b4", // Blue
            "#ff7f0e", // Orange
            "#2ca02c", // Green
            "#d62728", // Red
            "#9467bd", // Purple
            "#8c564b", // Brown
            "#e377c2", // Pink
            "#7f7f7f", // Gray
            "#bcbd22", // Olive
            "#17becf", // Teal
        ];

        const legendColors = {};

        // If no drug type is selected, use group colors
        if (!selectedDrugType) {
            Object.keys(groupColors).forEach((group) => {
                legendColors[group] = groupColors[group];
            });
        } else {
            // If a drug type is selected, use dynamic colors
            const drugTypes = Object.keys(drugTypeLookup[selectedDrugType] || {});
            drugTypes.forEach((drugType, index) => {
                legendColors[drugType] = typeColors[index % typeColors.length];
            });
        }

        // Render the legend UI
        return (
            <ul
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    listStyleType: "none",
                    padding: 0,
                    margin: 0,
                }}
            >
                {Object.entries(legendColors).map(([label, color]) => (
                    <li
                        key={label}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            margin: "0px 5px",
                        }}
                    >
                        <span
                            style={{
                                display: "inline-block",
                                width: "15px",
                                height: "15px",
                                backgroundColor: color,
                                marginRight: "5px",
                            }}
                        ></span>
                        {label}
                    </li>
                ))}
            </ul>
        );
    };

    // Create Pie Chart 
    const createPieChart = (processedData, colorMap) => {
        const { width, height } = dimensions;
        const radius = Math.min(width, height) / 2 - 20;

        // Clear the previous chart
        d3.select(svgRef.current).selectAll('*').remove();

        // Create an SVG container
        const svg = d3
            .select(svgRef.current)
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        // Prepare pie data
        const pie = d3.pie().value((d) => d[1]); // Using object values
        const arc = d3.arc().innerRadius(0).outerRadius(radius);

        // Extract data for pie chart
        const drugGroups = Object.entries(processedData[0]).filter(
            ([key]) => key !== 'country' && key !== 'msCode' // Exclude non-drug keys
        );

        const color = d3.scaleOrdinal()
            .domain(drugGroups.map(([key]) => key))
            .range(Object.values(customColors(null))); // Use predefined group colors

        const pieData = pie(drugGroups);

        // Append group container
        const g = svg.append('g').attr('transform', `translate(${width / 2}, ${height / 2})`);

        // Create pie chart paths
        g.selectAll('path')
            .data(pieData)
            .join('path')
            .attr('d', arc)
            .attr('fill', (d) => color(d.data[0])) // Use the key (drug group) for color
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .append('title')
            .text((d) => `${d.data[0]}: ${parseFloat(d.data[1]).toFixed(2)}%`);
    };

    useEffect(() => {
        if (!data || !dimensions.width || !dimensions.height) return;

        if (selectedCountry) {
            if (!selectedDrugType) {
                const processedData = processDataForStackedBar(data);
                console.log("Processed Pie Data:", processedData);
                createPieChart(processedData);
            } else {
                const processedData = selectedDrugType
                    ? processDataFromPreprocessedLookup(drugTypeLookup, selectedDrugType)
                    : processDataForStackedBar(data);

                createPieChart(processedData)
            }
        } else {
            // Process data
            const processedData = selectedDrugType
                ? processDataFromPreprocessedLookup(drugTypeLookup, selectedDrugType)
                : processDataForStackedBar(data);

            // Generate colors dynamically based on selection
            const colorMap = customColors(
                selectedDrugType ? Object.keys(drugTypeLookup[selectedDrugType]) : null
            );
            console.log("processedData", processedData);
            // Create chart
            createStackedBarChart(processedData, colorMap);
        }
        /*
        if (selectedCountry) {
            console.log("Processed Pie Data:", processedData);
            const processedData = processDataForPie(data, selectedCountry);
            console.log("Processed Pie Data:", processedData);
            createPieChart(processedData);
        } else {
            const processedData = processDataForStackedBar(data);
            createStackedBarChart(processedData);
        }
        */
    }, [data, selectedCountry, dimensions]);

    return (
        <div ref={containerRef} className="card h-100">
            <div className="card-header">
                <h5 className="card-title mb-0">Drug Distribution</h5>
            </div>
            <div className="card-body d-flex flex-column">
                <svg ref={svgRef} style={{ flexGrow: 1, width: '100%', height: '100%' }}></svg>
                <div className="color-legend" style={{ marginTop: '10px' }}>
                    <h6 style={{ marginBottom: '5px' }}>Color Legend:</h6>
                    {renderLegend(selectedDrugType)}
                </div>
            </div>
        </div>
    );
};

export default SeizureChart;
