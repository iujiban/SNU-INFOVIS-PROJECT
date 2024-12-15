import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useDimensions } from "../hooks/useDimensions";
import ExpandButton from "./ui/ExpandButton";
import Modal from "./ui/Modal";

const UseQuantity = ({ data }) => {
    const containerRef = useRef();
    const svgRef = useRef();
    const modalSvgRef = useRef();
    const dimensions = useDimensions(containerRef);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const createChart = (svgRef) => {
        if (!data || data.length === 0 || !dimensions.width || !dimensions.height) return;

        const margin = { top: 15, right: 20, bottom: 35, left: 45 };
        
        // Calculate the actual chart dimensions
        const width = dimensions.width;
        const height = dimensions.height;
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        // Create SVG container with viewBox for responsiveness
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();
        
        svg.attr('width', '100%')
           .attr('height', '100%')
           .attr('viewBox', `0 0 ${width} ${height}`)
           .attr('preserveAspectRatio', 'xMidYMid meet');

        const chartGroup = svg
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // X-axis scale: Years
        const x = d3.scaleBand()
            .domain(data.map((d) => d.year))
            .range([0, chartWidth])
            .padding(0.2);

        // Y-axis scale: Totals
        const y = d3.scaleLinear()
            .domain([0, d3.max(data, (d) => d.total) * 1.1])
            .range([chartHeight, 0])
            .nice();

        // Add X-axis
        chartGroup.append("g")
            .attr("transform", `translate(0,${chartHeight})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")))
            .attr("font-size", "12px");

        // Add Y-axis
        chartGroup.append("g")
            .call(d3.axisLeft(y).ticks(5).tickFormat((d) => d / 1000))
            .attr("font-size", "12px");

        // Add Y-axis label
        chartGroup.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -chartHeight / 2)
            .attr("y", -50)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .text("Quantity (t)");

        // Add X-axis label
        chartGroup.append("text")
            .attr("x", chartWidth / 2)
            .attr("y", chartHeight + 30)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .text("Year");

        // Create line generator
        const line = d3.line()
            .x((d) => x(d.year) + x.bandwidth() / 2)
            .y((d) => y(d.total));

        // Draw line
        chartGroup.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("d", line);

        // Add points
        chartGroup.selectAll("circle")
            .data(data)
            .join("circle")
            .attr("cx", (d) => x(d.year) + x.bandwidth() / 2)
            .attr("cy", (d) => y(d.total))
            .attr("r", 5)
            .attr("fill", "steelblue");

        // Add labels to points
        chartGroup.selectAll(".point-label")
            .data(data)
            .join("text")
            .attr("x", (d) => x(d.year) + x.bandwidth() / 2)
            .attr("y", (d) => y(d.total) - 10)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .text((d) => Math.round(d.total));
    };

    useEffect(() => {
        createChart(svgRef);
        if (isModalOpen) {
            createChart(modalSvgRef);
        }
    }, [data, dimensions, isModalOpen]);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
            <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-0">Drug Use Quantity</h5>
                    <ExpandButton onClick={() => setIsModalOpen(true)} />
                </div>
                <div className="card-body p-2">
                    <div style={{ width: "100%", height: "calc(100% - 8px)", position: "relative" }}>
                        <svg ref={svgRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}></svg>
                    </div>
                </div>
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="Drug Use Quantity"
                >
                    <div style={{ width: "100%", height: "80vh" }}>
                        <svg ref={modalSvgRef}></svg>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default UseQuantity;
