import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as bootstrap from 'bootstrap';
import { useDimensions } from '../hooks/useDimensions';

const Seizure = ({ data }) => {
    const containerRef = useRef();
    const dimensions = useDimensions(containerRef);
    const svgRef = useRef();

    useEffect(() => {
        if (!data || !dimensions.width || !dimensions.height) return;

        // Use dimensions.width and dimensions.height for dynamic sizing
        const margin = { top: 10, right: 30, bottom: 20, left: 50 };
        const width = dimensions.width - margin.left - margin.right;
        const height = dimensions.height - margin.top - margin.bottom;

        // Clear any existing SVG
        d3.select(svgRef.current).selectAll("*").remove();

        // Append the svg object
        const svg = d3.select(svgRef.current)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // List of subgroups
        const subgroups = ["Opioid", "Benzo", "NonOpioid"];

        // List of groups
        const groups = data.map(d => d.group);

        // Add X axis
        const x = d3.scaleBand()
            .domain(groups)
            .range([0, width])
            .padding([0.2]);
        
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickSizeOuter(0));

        // Add Y axis
        const y = d3.scaleLinear()
            .domain([0, 60])
            .range([height, 0]);
        
        svg.append("g")
            .call(d3.axisLeft(y));

        // Color palette
        const color = d3.scaleOrdinal()
            .domain(subgroups)
            .range(['#C7EFCF','#FE5F55','#EEF5DB']);

        // Stack the data
        const stackedData = d3.stack()
            .keys(subgroups)(data);

        // Show the bars
        svg.append("g")
            .selectAll("g")
            .data(stackedData)
            .enter().append("g")
            .attr("fill", d => color(d.key))
            .selectAll("rect")
            .data(d => d)
            .enter().append("rect")
            .attr("x", d => x(d.data.group))
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]))
            .attr("width", x.bandwidth())
            .attr("data-bs-toggle", "tooltip")
            .attr("data-bs-placement", "top")
            .attr("data-bs-html", "true")
            .attr("data-bs-title", function(d) {
                const subgroupName = d3.select(this.parentNode).datum().key;
                const value = d.data[subgroupName];
                return `<div class="tooltip-inner">${subgroupName}: ${value}</div>`;
            });

        // Initialize tooltips after all elements are created
        const tooltips = [...document.querySelectorAll('[data-bs-toggle="tooltip"]')]
            .map(el => new bootstrap.Tooltip(el, {
                container: 'body',
                trigger: 'hover',
                html: true
            }));

        // Cleanup function
        return () => {
            tooltips.forEach(tooltip => tooltip.dispose());
        };
    }, [data, dimensions]);

    return (
        <div ref={containerRef} className="card">
            <div className="card-header">
                <h5 className="card-title mb-0">Drug Seizure</h5>
            </div>
            <div className="card-body">
                <svg ref={svgRef}></svg>
            </div>
        </div>
    );
};

export default Seizure;