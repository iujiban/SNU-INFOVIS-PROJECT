import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useDimensions } from "../hooks/useDimensions";
import ExpandButton from "./ui/ExpandButton";
import Modal from "./ui/Modal";

const UseQuantity = ({ data, selectedCountry }) => {
    const containerRef = useRef();
    const svgRef = useRef();
    const modalSvgRef = useRef();
    const dimensions = useDimensions(containerRef);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const createChart = (svgRef) => {
        if (!data || data.length === 0 || !dimensions.width || !dimensions.height) return;

        const margin = { top: 30, right: 200, bottom: 50, left: 50 };
        const width = dimensions.width - margin.left - margin.right;
        const height = dimensions.height - margin.top - margin.bottom;

        const processedData = data
            .filter((d) => d && d.Year && d["Past_year Total"] !== undefined)
            .map((d) => ({
                ...d,
                AdjustedYear: Number(d.Year) - 1,
                PastYearTotal: parseFloat(d["Past_year Total"]) || 0,
            }))
            .filter((d) => d.PastYearTotal > 0);

        if (processedData.length === 0) {
            console.warn("No valid data after processing.");
            return;
        }

        const keys = Array.from(new Set(processedData.map((d) => d.Drug)));
        const years = Array.from(new Set(processedData.map((d) => d.AdjustedYear))).sort((a, b) => a - b);

        const stackedData = d3.stack()
            .keys(keys)
            .value((group, key) => {
                const entry = group[1].find((d) => d.Drug === key);
                return entry ? entry.PastYearTotal : 0;
            })(
            Array.from(
                d3.group(processedData, (d) => d.AdjustedYear)
            )
        );

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        svg
            .attr("width", dimensions.width)
            .attr("height", dimensions.height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear()
            .domain(d3.extent(years))
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(stackedData, (layer) => d3.max(layer, (d) => d[1]))])
            .nice()
            .range([height, 0]);

        const color = d3.scaleOrdinal()
            .domain(keys)
            .range(d3.schemeTableau10);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format("d")));

        svg.append("g").call(d3.axisLeft(y));

        const area = d3.area()
            .x((d) => x(d.data[0]))
            .y0((d) => y(d[0]))
            .y1((d) => y(d[1]));

        svg.selectAll(".area")
            .data(stackedData)
            .join("path")
            .attr("class", (d) => `area ${d.key}`)
            .attr("fill", (d) => color(d.key))
            .attr("d", area);

        const legend = svg.append("g").attr("transform", `translate(${width + 20}, 0)`);

        legend
            .selectAll("rect")
            .data(keys)
            .join("rect")
            .attr("x", 0)
            .attr("y", (d, i) => i * 20)
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", (d) => color(d));

        legend
            .selectAll("text")
            .data(keys)
            .join("text")
            .attr("x", 25)
            .attr("y", (d, i) => i * 20 + 9)
            .attr("dy", "0.35em")
            .text((d) => d);
    };

    useEffect(() => {
        createChart(svgRef);
        if (isModalOpen) {
            createChart(modalSvgRef);
        }
    }, [data, dimensions, selectedCountry, isModalOpen]);

    return (
        <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">{selectedCountry ? `Drug Use Quantity in ${selectedCountry}` : 'Drug Use Quantity'}</h5>
                <ExpandButton onClick={() => setIsModalOpen(true)} />
            </div>
            <div className="card-body p-0">
                <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
                    <svg 
                        ref={svgRef}
                        style={{ 
                            display: 'block',
                            width: '100%',
                            height: '100%'
                        }}
                    ></svg>
                </div>
            </div>
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedCountry ? `Drug Use Quantity in ${selectedCountry}` : 'Drug Use Quantity'}
            >
                <div style={{ width: '100%', height: '80vh' }}>
                    <svg 
                        ref={modalSvgRef}
                        style={{ 
                            display: 'block',
                            width: '100%',
                            height: '100%'
                        }}
                    ></svg>
                </div>
            </Modal>
        </div>
    );
};

export default UseQuantity;
