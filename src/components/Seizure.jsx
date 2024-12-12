import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useDimensions } from '../hooks/useDimensions';
import ExpandButton from './ui/ExpandButton';
import Modal from './ui/Modal';

const SeizureChart = ({ data, selectedCountry }) => {
    const containerRef = useRef();
    const svgRef = useRef();
    const modalSvgRef = useRef();
    const dimensions = useDimensions(containerRef);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
    const createStackedBarChart = (processedData, svgRef) => {
        // Get actual SVG dimensions
        const svgElement = svgRef.current;
        const svgWidth = svgElement.clientWidth || svgElement.parentElement.clientWidth;
        const svgHeight = svgElement.clientHeight || svgElement.parentElement.clientHeight;
        
        const margin = { top: 20, right: 30, bottom: 40, left: 50 };
        const width = svgWidth - margin.left - margin.right;
        const height = svgHeight - margin.top - margin.bottom;

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
            .range([margin.left, width])
            .padding(0.1);

        const y = d3
            .scaleLinear()
            .domain([0, d3.max(series, (s) => d3.max(s, (d) => d[1]))])
            .range([height, margin.top]);

        const color = (drugGroup) => customColors[drugGroup] || "#ccc";

        // Clear previous chart
        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3
            .select(svgRef.current)
            .attr('width', svgWidth)
            .attr('height', svgHeight)
            .attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
            .attr('preserveAspectRatio', 'xMinYMin meet');

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
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .attr('transform', 'rotate(-45) translate(-5, 0)')
            .style('text-anchor', 'end')
            .style('font-size', '10px');

        svg.append('g')
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(y));
    };

    // Create Pie Chart
    const createPieChart = (processedData, svgRef) => {
        const svgElement = svgRef.current;
        const svgWidth = svgElement.clientWidth || svgElement.parentElement.clientWidth;
        const svgHeight = svgElement.clientHeight || svgElement.parentElement.clientHeight;
        const radius = Math.min(svgWidth, svgHeight) / 2 - 40;
    
        const svg = d3
            .select(svgRef.current)
            .attr('width', svgWidth)
            .attr('height', svgHeight)
            .attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');
    
        svg.selectAll('*').remove();
    
        const pie = d3.pie().value((d) => d.value);
        const arc = d3.arc().innerRadius(0).outerRadius(radius);
    
        const color = (drugGroup) => customColors[drugGroup] || '#ccc';
    
        const pieData = pie(processedData);
    
        const g = svg.append('g').attr('transform', `translate(${svgWidth / 2}, ${svgHeight / 2})`);
    
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
        createStackedBarChart(processedData, svgRef);
        if (isModalOpen) {
            createStackedBarChart(processedData, modalSvgRef);
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
    }, [data, selectedCountry, dimensions, isModalOpen]);

    return (
        <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">{selectedCountry ? `Drug Distribution in ${selectedCountry}` : 'Drug Seizure'}</h5>
                <ExpandButton onClick={() => setIsModalOpen(true)} />
            </div>
            <div className="card-body p-0 d-flex flex-column" style={{ height: '100%', overflow: 'hidden' }}>
                <div ref={containerRef} style={{ flex: '1 1 auto', minHeight: 0, height: '70%', overflowX: 'auto'}}>
                    <svg 
                        ref={svgRef} 
                        style={{ 
                            display: 'block', 
                            width: '500%',
                            height: '100%'
                        }}
                    ></svg>
                </div>
                <div style={{ 
                    padding: '8px',
                    backgroundColor: '#f8f9fa',
                    borderTop: '1px solid #dee2e6',
                    height: '30%'
                }}>
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
                        {Object.entries(customColors).map(([drugGroup, color]) => (
                            <li key={drugGroup} style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginRight: '12px',
                                whiteSpace: 'nowrap',
                                fontSize: '0.85rem'
                            }}>
                                <span style={{
                                    display: 'inline-block',
                                    width: '12px',
                                    height: '12px',
                                    backgroundColor: color,
                                    marginRight: '6px',
                                    borderRadius: '2px'
                                }}></span>
                                {drugGroup}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedCountry ? `Drug Distribution in ${selectedCountry}` : 'Drug Seizure'}
            >
                <div className="card h-100">
                    <div className="card-body p-0 d-flex flex-column" style={{ height: '80vh', overflow: 'hidden'}}>
                        <div style={{ flex: '1 1 auto', minHeight: 0, height: '80%', overflowX: 'auto' }}>
                            <svg 
                                ref={modalSvgRef} 
                                style={{ 
                                    display: 'block', 
                                    width: '500%',
                                    height: '100%'
                                }}
                            ></svg>
                        </div>
                        <div style={{ 
                            padding: '8px',
                            backgroundColor: '#f8f9fa',
                            borderTop: '1px solid #dee2e6',
                            height: '20%'
                        }}>
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
                                {Object.entries(customColors).map(([drugGroup, color]) => (
                                    <li key={drugGroup} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginRight: '12px',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.85rem'
                                    }}>
                                        <span style={{
                                            display: 'inline-block',
                                            width: '12px',
                                            height: '12px',
                                            backgroundColor: color,
                                            marginRight: '6px',
                                            borderRadius: '2px'
                                        }}></span>
                                        {drugGroup}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default SeizureChart;
