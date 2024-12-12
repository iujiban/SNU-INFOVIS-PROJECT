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

        const processedData = data.map(d => ({
            ...d,
            Year: new Date(d.Year, 0, 1),
            Minimum_USD: d.Minimum_USD === "" ? 0 : +d.Minimum_USD,
            Maximum_USD: d.Maximum_USD === "" ? 0 : +d.Maximum_USD,
            Typical_USD: d.Typical_USD === "" ? 0 : +d.Typical_USD
        }));

        const filteredData = processedData
            .filter(d => d.Minimum_USD > 0 && d.Maximum_USD > 0)
            .sort((a, b) => a.Year - b.Year);



        // Clear previous chart
        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3.select(svgRef.current)
            .attr("width", dimensions.width)
            .attr("height", dimensions.height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);


        const x = d3.scaleTime()
        .domain(d3.extent(filteredData, d => d.Year))
        .range([0, width]);

        const y = d3.scaleLinear()
        .domain([
            d3.min(filteredData, d => d.Minimum_USD), 
            d3.max(filteredData, d => d.Maximum_USD)
        ])
        .range([height, 0]);

        svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

        svg.append("g")
        .call(d3.axisLeft(y));

        svg.append("path")
        .datum(filteredData)
        .attr("fill", "#cce5df")
        .attr("stroke", "none")
        .attr("d", d3.area()
            .x(d => x(d.Year))
            .y0(d => y(d.Maximum_USD))
            .y1(d => y(d.Minimum_USD))
        );

        svg.append("path")
        .datum(filteredData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(d => x(d.Year))
            .y(d => y(d.Typical_USD))
        );


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