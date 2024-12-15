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

        const margin = { top: 30, right: 50, bottom: 50, left: 70 };
        const width = dimensions.width - margin.left - margin.right;
        const height = dimensions.height - margin.top - margin.bottom;

        // Create SVG container
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const chartGroup = svg
            .attr("width", dimensions.width)
            .attr("height", dimensions.height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // X-axis scale: Years
        const x = d3.scaleBand()
            .domain(data.map((d) => d.year))
            .range([0, width])
            .padding(0.2);

        // Y-axis scale: Totals
        const y = d3.scaleLinear()
            .domain([0, d3.max(data, (d) => d.total) * 1.1]) // Add 10% padding to max value
            .range([height, 0])
            .nice();

        // Add X-axis
        chartGroup.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")))
            .attr("font-size", "12px");

        // Add Y-axis
        chartGroup.append("g")
            .call(d3.axisLeft(y).ticks(5).tickFormat((d) => `${d} kg`))
            .attr("font-size", "12px");

        // Add Y-axis label
        chartGroup.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -50)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")


        // Add X-axis label
        chartGroup.append("text")
            .attr("x", width / 2)
            .attr("y", height + 40)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .text("Year");

        // Create line generator
        const line = d3.line()
            .x((d) => x(d.year) + x.bandwidth() / 2) // Center the line on each year
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
            .text((d) => d.total);
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
                <div className="card-body p-0">
                    <div style={{ width: "100%", height: "100%" }}>
                        <svg
                            ref={svgRef}
                            style={{
                                display: "block",
                                width: "100%",
                                height: "100%",
                            }}
                        ></svg>
                    </div>
                </div>
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="Drug Use Quantity"
                >
                    <div style={{ width: "100%", height: "80vh" }}>
                        <svg
                            ref={modalSvgRef}
                            style={{
                                display: "block",
                                width: "100%",
                                height: "100%",
                            }}
                        ></svg>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default UseQuantity;
