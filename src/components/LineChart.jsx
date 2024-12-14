import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { useDimensions } from "../hooks/useDimensions";

const LineChart = ({ data, selectedRegion }) => {
    const containerRef = useRef();
    const svgRef = useRef();
    const dimensions = useDimensions(containerRef);

    useEffect(() => {
        if (!data || data.length === 0 || !dimensions.width || !dimensions.height) return;

        // Filter data based on the selected region
        const filteredData = selectedRegion
            ? data.filter(d => d.region === selectedRegion)
            : data;

        const margin = { top: 30, right: 200, bottom: 50, left: 50 };
        const width = dimensions.width - margin.left - margin.right;
        const height = dimensions.height - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current)
            .attr("width", dimensions.width)
            .attr("height", dimensions.height)
            .attr("viewBox", [0, 0, dimensions.width, dimensions.height]);

        // Clear previous elements
        svg.selectAll("*").remove();

        // Prepare data and ensure unique subregions
        const allPoints = filteredData.map(d => ({
            subRegion: d.subRegion,
            points: d.years.flatMap(year => year.dates.map(dateObj => ({
                date: new Date(dateObj.date),
                quantity: dateObj.quantity,
                year: year.year,
            }))),
        }));

        const uniqueSubRegions = [...new Set(allPoints.map(d => d.subRegion))];

        // Merge all dates across subregions
        const allDates = allPoints.flatMap(d => d.points.map(p => p.date));
        const xDomain = d3.extent(allDates);

        // Create scales
        const xScale = d3.scaleTime()
            .domain(xDomain)
            .range([margin.left, width + margin.left]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(allPoints.flatMap(d => d.points.map(p => p.quantity)))])
            .nice()
            .range([height + margin.top, margin.top]);

        // Create color scale
        const colorScale = d3.scaleOrdinal()
            .domain(uniqueSubRegions)
            .range(d3.schemeCategory10);

        // Add X-axis
        svg.append("g")
            .attr("transform", `translate(0,${height + margin.top})`)
            .call(d3.axisBottom(xScale).ticks(10));

        // Add Y-axis
        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(yScale).ticks(5));

        // Line generator for smooth interpolation
        const line = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScale(d.quantity))
            .curve(d3.curveMonotoneX);

        // Add lines for each subregion
        svg.append("g")
            .selectAll("path")
            .data(allPoints)
            .join("path")
            .attr("fill", "none")
            .attr("stroke", d => colorScale(d.subRegion)) // Use colorScale for unique colors
            .attr("stroke-width", 1.5)
            .attr("d", d => line(d.points));

        // Add tooltip interaction
        const tooltip = svg.append("g").attr("display", "none");
        tooltip.append("circle").attr("r", 4.5).attr("fill", "steelblue");
        tooltip.append("text")
            .attr("text-anchor", "middle")
            .attr("y", -10)
            .style("font-size", "12px");

        // Add interaction overlay
        svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "transparent")
            .attr("transform", `translate(${margin.left},${margin.top})`)
            .on("mousemove", function (event) {
                const [mouseX] = d3.pointer(event);
                const hoveredDate = xScale.invert(mouseX);

                // Find the closest data point
                const closest = allPoints
                    .flatMap(d => d.points)
                    .reduce((a, b) =>
                        Math.abs(new Date(b.date) - hoveredDate) < Math.abs(new Date(a.date) - hoveredDate)
                            ? b
                            : a
                    );

                // Update tooltip position
                tooltip.attr(
                    "transform",
                    `translate(${xScale(new Date(closest.date))},${yScale(closest.quantity)})`
                ).attr("display", null);

                tooltip.select("text").text(`${closest.quantity}`);
            })
            .on("mouseleave", () => tooltip.attr("display", "none"));

        // Add legend
        const legend = svg.append("g")
            .attr("transform", `translate(${width + margin.left + 20},${margin.top})`);

        uniqueSubRegions.forEach((subRegion, i) => {
            const legendRow = legend.append("g")
                .attr("transform", `translate(0, ${i * 20})`);

            legendRow.append("rect")
                .attr("width", 10)
                .attr("height", 10)
                .attr("fill", colorScale(subRegion));

            legendRow.append("text")
                .attr("x", 15)
                .attr("y", 10)
                .attr("text-anchor", "start")
                .attr("alignment-baseline", "middle")
                .style("font-size", "12px")
                .text(subRegion);
        });

    }, [data, selectedRegion, dimensions]);

    return (
        <div className="card h-100">
            <div className="card-header">
                <h5 className="card-title mb-0">
                    Time-Based Drug Data: {selectedRegion || "All Regions"}
                </h5>
            </div>
            <div className="card-body" ref={containerRef}>
                <svg ref={svgRef} style={{ width: "100%", height: "100%" }}></svg>
            </div>
        </div>
    );
};

export default LineChart;
