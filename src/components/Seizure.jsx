import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useDimensions } from '../hooks/useDimensions';

const SeizureChart = ({ data, selectedCountry }) => {
    const containerRef = useRef();
    const svgRef = useRef();
    const dimensions = useDimensions(containerRef);

    const customColors = {
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

    // Process data for Stacked Bar Chart
    const processDataForStackedBar = (data) => {
        const groupedData = data.reduce((acc, item) => {
            const msCode = Array.isArray(item.msCodes) && item.msCodes.length > 0 ? item.msCodes[0] : "Unknown";
            const country = item.country && item.country.trim() !== "" ? item.country : "Unknown";
            const drugGroup = item.drugGroup || "Unknown Drug Group";
            const total = parseFloat(item.total) || 0;

            if (msCode === "Unknown" || country === "Unknown" || drugGroup === "Unknown Drug Group" || total <= 0) {
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

    // Process data for Pie Chart
    const processDataForPie = (data, selectedCountry) => {
        if (!selectedCountry) {
            console.warn("No country selected");
            return [];
        }
    
        // Find the data for the selected country
        const countryData = data.filter((item) => item.country === selectedCountry);
    
        if (!countryData || countryData.length === 0) {
            console.warn(`No data found for the selected country: ${selectedCountry}`);
            return [];
        }
    
        console.log("Country Data for Pie Chart:", countryData);
    
        return countryData.map((item) => ({
            label: item.drugGroup,
            value: parseFloat(item.total) || 0, // Convert total to a float or default to 0
        }));
    };
    // Create Stacked Bar Chart
    const createStackedBarChart = (processedData) => {
        const { width, height } = dimensions;
        const margin = { top: 20, right: 30, bottom: 120, left: 50 };

        const drugGroups = Array.from(
            new Set(
                processedData.flatMap((d) =>
                    Object.keys(d).filter((key) => key !== 'msCode' && key !== 'country')
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

        const color = (drugGroup) => customColors[drugGroup] || "#ccc";

        // Clear previous chart
        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3
            .select(svgRef.current)
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        svg
            .append('g')
            .selectAll('g')
            .data(series)
            .join('g')
            .attr('fill', (d) => color(d.key))
            .selectAll('rect')
            .data((d) => d)
            .join('rect')
            .attr('x', (d) => x(d.data.msCode))
            .attr('y', (d) => y(d[1]))
            .attr('height', (d) => y(d[0]) - y(d[1]))
            .attr('width', x.bandwidth())
            .append('title')
            .text((d) => `${d.data.msCode}: ${d[1] - d[0]}%`);

        svg
            .append('g')
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');

        svg.append('g').attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y));
    };

    // Create Pie Chart
    const createPieChart = (processedData) => {
        const { width, height } = dimensions;
        const radius = Math.min(width, height) / 2 - 20;
    
        const svg = d3
            .select(svgRef.current)
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');
    
        svg.selectAll('*').remove();
    
        const pie = d3.pie().value((d) => d.value);
        const arc = d3.arc().innerRadius(0).outerRadius(radius);
    
        const color = (drugGroup) => customColors[drugGroup] || '#ccc';
    
        const pieData = pie(processedData);
    
        const g = svg.append('g').attr('transform', `translate(${width / 2}, ${height / 2})`);
    
        g.selectAll('path')
            .data(pieData)
            .join('path')
            .attr('d', arc)
            .attr('fill', (d) => color(d.data.label))
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .append('title')
            .text((d) => `${d.data.label}: ${parseFloat(d.data.value || 0).toFixed(2)}%`);
    
        const labelArc = d3
            .arc()
            .outerRadius(radius + 20)
            .innerRadius(radius + 20);
    
        g.selectAll('text')
            .data(pieData)
            .join('text')
            .attr('transform', (d) => `translate(${labelArc.centroid(d)})`)
            .attr('text-anchor', 'middle')
            .attr('font-size', 10)
            .text((d) => `${d.data.label}: ${parseFloat(d.data.value || 0).toFixed(1)}%`);
    };
    
    useEffect(() => {
        if (!data || !dimensions.width || !dimensions.height) return;

        const processedData = processDataForStackedBar(data);
        createStackedBarChart(processedData);
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
                <h5 className="card-title mb-0">
                    {selectedCountry ? `Drug Distribution in ${selectedCountry}` : 'Drug Seizure'}
                </h5>
            </div>
            <div className="card-body d-flex flex-column">
                <svg ref={svgRef} style={{ flexGrow: 1, width: '100%', height: '100%' }}></svg>
                <div className="color-legend" style={{ marginTop: '0px' }}>
                    <h6 style={{ marginBottom: '5px' }}>Color Legend:</h6>
                    <ul
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            listStyleType: 'none',
                            padding: 0,
                            margin: 0,
                        }}
                    >
                        {Object.entries(customColors).map(([drugGroup, color]) => (
                            <li
                                key={drugGroup}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    margin: '0px 5px',
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
                                {drugGroup}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
    
    
    
};

export default SeizureChart;
