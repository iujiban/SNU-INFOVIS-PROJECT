import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useDimensions } from '../hooks/useDimensions';

const Seizure = ({ data }) => {
    const containerRef = useRef(); // Reference for the container element
    const svgRef = useRef(); // Reference for the SVG element
    const dimensions = useDimensions(containerRef); // Hook for dynamic chart dimensions

    // Process the data to prepare for the stacked bar chart
    const processDataForStackedBar = (data) => {
        console.log("Input data to processDataForStackedBar:", data);
    
        const groupedData = data.reduce((acc, item) => {
            const msCode = Array.isArray(item.msCodes) && item.msCodes.length > 0 ? item.msCodes[0] : "Unknown";
            const country = item.country && item.country.trim() !== "" ? item.country : "Unknown";
            const drugGroup = item.drugGroup || "Unknown Drug Group";
            const total = parseFloat(item.total) || 0;
    
            console.log("Input Record:", { msCode, country, drugGroup, total });
    
            // Skip invalid records
            if (msCode === "Unknown" || country === "Unknown" || drugGroup === "Unknown Drug Group" || total <= 0) {
                console.warn("Skipping invalid record:", { msCode, country, drugGroup, total });
                return acc;
            }
    
            // Initialize msCode if not already present
            if (!acc[msCode]) {
                acc[msCode] = { msCode, country, drugGroups: {} };
            }
    
            // Add or update drug group totals
            if (!acc[msCode].drugGroups[drugGroup]) {
                acc[msCode].drugGroups[drugGroup] = 0;
            }
            acc[msCode].drugGroups[drugGroup] += total;
    
            return acc;
        }, {});
    
        console.log("Grouped Data by Country:", groupedData);
    
        // Transform groupedData to array format for charting
        const processedData = Object.entries(groupedData).map(([msCode, { country, drugGroups }]) => ({
            msCode,
            country,
            ...drugGroups,
        }));
    
        console.log("Processed Data for Stacked Bar:", processedData);
    
        return processedData;
    };        
    
    
    // Function to create the stacked bar chart
    const createStackedBarChart = (processedData, containerId) => {
        // Chart dimensions
        const width = 1000;
        const height = 500;
        const margin = { top: 20, right: 30, bottom: 120, left: 50 };
    
        // Extract unique drugGroups for stacking
        const drugGroups = Array.from(
            new Set(
                processedData.flatMap((d) =>
                    Object.keys(d).filter((key) => key !== 'msCode' && key !== 'country')
                )
            )
        );
    
        // Create stack generator
        const stack = d3.stack().keys(drugGroups);
    
        // Apply stack to data
        const series = stack(
            processedData.map((d) => ({
                msCode: d.msCode,
                ...drugGroups.reduce((obj, key) => {
                    obj[key] = d[key] || 0;
                    return obj;
                }, {}),
            }))
        );
    
        // Scales
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
        d3.select(containerId).selectAll('*').remove();
    
        // Create SVG container
        const svg = d3
            .select(containerId)
            .append('svg')
            .attr('width', width)
            .attr('height', height);
    
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
    
        console.log("Data passed to Seizure:", data);
    
        const processedData = processDataForStackedBar(data);
    
        console.log("Final Processed Data:", processedData);
    
        createStackedBarChart(processedData, svgRef.current);
    }, [data, dimensions]);
    

    return (
        <div ref={containerRef} className="card">
            <div className="card-header">
                <h5 className="card-title mb-0">Drug Seizure</h5>
            </div>
            <div className="card-body">
                <div ref={svgRef}></div>
            </div>
        </div>
    );
};

export default Seizure;
