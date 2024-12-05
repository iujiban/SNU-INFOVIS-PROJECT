import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useDimensions } from '../hooks/useDimensions';

const Price = ({ data }) => {
    const containerRef = useRef();
    const svgRef = useRef();
    const dimensions = useDimensions(containerRef);

    useEffect(() => {
        if (data && dimensions.width && dimensions.height) {
            createLineChart();
        }
    }, [data, dimensions.width, dimensions.height]);

    const createLineChart = () => {
        const margin = { top: 20, right: 30, bottom: 30, left: 60 };
        const width = dimensions.width - margin.left - margin.right;
        const height = dimensions.height - margin.top - margin.bottom;
        
        // Clear previous chart
        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3.select(svgRef.current)
            .attr("width", dimensions.width)
            .attr("height", dimensions.height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleTime()
            .domain(d3.extent(data, d => new Date(d.date)))
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.price)])
            .nice()
            .range([height, 0]);

        // Add the line
        const line = d3.line()
            .x(d => x(new Date(d.date)))
            .y(d => y(d.price));

        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", line);

        // Add the x-axis
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));

        // Add the y-axis
        svg.append("g")
            .call(d3.axisLeft(y));

        // Add dots
        svg.selectAll("circle")
            .data(data)
            .join("circle")
            .attr("cx", d => x(new Date(d.date)))
            .attr("cy", d => y(d.price))
            .attr("r", 4)
            .attr("fill", "steelblue");

        // Add title
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Price Trends Over Time");
    };

    return (
        <div className="card h-100">
            <div className="card-header">
                <h5 className="card-title mb-0">Price Analysis</h5>
            </div>
            <div className="card-body" ref={containerRef}>
                <svg ref={svgRef} style={{ width: '100%', height: '100%' }}></svg>
            </div>
        </div>
    );
};

export default Price;