import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useDimensions } from '../hooks/useDimensions';

const Seizure = ({ data }) => {
    const containerRef = useRef(); // Reference for the container element
    const svgRef = useRef(); // Reference for the SVG element
    const dimensions = useDimensions(containerRef); // Hook for dynamic chart dimensions

    // Process the data to prepare for the stacked bar chart
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
    // Function to create the stacked bar chart
    const createStackedBarChart = (processedData) => {
        const { width, height } = dimensions; // Use dimensions for dynamic sizing
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

        const color = d3.scaleOrdinal().domain(drugGroups).range(d3.schemeTableau10);

        // Clear previous chart
        d3.select(svgRef.current).selectAll('*').remove();

        // Create SVG container
        const svg = d3
            .select(svgRef.current)
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        // Append groups for stacks
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
            .text((d) => `${d.data.msCode}: ${d[1] - d[0]} kg`);

        // Add x-axis
        svg
            .append('g')
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');

        // Add y-axis
        svg.append('g').attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y));

        // Add legend
        const legend = svg
            .append('g')
            .attr('transform', `translate(${width - margin.right - 120}, ${margin.top})`);

        legend
            .selectAll('rect')
            .data(drugGroups)
            .join('rect')
            .attr('x', 0)
            .attr('y', (d, i) => i * 20)
            .attr('width', 18)
            .attr('height', 18)
            .attr('fill', (d) => color(d));

        legend
            .selectAll('text')
            .data(drugGroups)
            .join('text')
            .attr('x', 25)
            .attr('y', (d, i) => i * 20 + 9)
            .attr('dy', '0.35em')
            .text((d) => d);
    };

    useEffect(() => {
        if (!data || !dimensions.width || !dimensions.height) return;
        console.log("Container dimensions (useDimensions):", dimensions);
        const processedData = processDataForStackedBar(data);
        console.log('processed SeizureData', processedData)
        createStackedBarChart(processedData);
    }, [data, dimensions]);

    return (
        <div ref={containerRef} className="card h-100">
            <div className="card-header">
                <h5 className="card-title mb-0">Drug Seizure</h5>
            </div>
            <div className="card-body d-flex flex-column">
                <svg ref={svgRef} style={{ flexGrow: 1, width: '100%', height: '100%' }}></svg>
            </div>
        </div>
    );
};

export default Seizure;
