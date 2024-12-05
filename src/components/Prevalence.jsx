import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as bootstrap from 'bootstrap';
import { useDimensions } from '../hooks/useDimensions';

const Prevalence = ({ data1, data2 }) => {
    const containerRef1 = useRef();
    const containerRef2 = useRef();
    const dimensions1 = useDimensions(containerRef1);
    const dimensions2 = useDimensions(containerRef2);

    useEffect(() => {
        if (data1 && data2 && dimensions1.width && dimensions2.width) {
            createDonutChart(data1, containerRef1, "Category Distribution", dimensions1);
            createDonutChart(data2, containerRef2, "Type Distribution", dimensions2);
        }
    }, [data1, data2, dimensions1.width, dimensions1.height, dimensions2.width, dimensions2.height]);

    const createDonutChart = (data, ref, title, dimensions) => {
        // Calculate responsive dimensions
        const width = dimensions.width;
        const height = dimensions.height;
        const margin = 40;
        const radius = Math.min(width, height) / 2 - margin;

        // Clear previous chart
        d3.select(ref.current).selectAll("*").remove();

        const svg = d3.select(ref.current)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${width / 2},${height / 2})`);

        const color = d3.scaleOrdinal()
            .domain(data.map(d => d.label))
            .range(d3.schemeCategory10);

        const pie = d3.pie()
            .value(d => d.value);

        const arc = d3.arc()
            .innerRadius(radius * 0.6)
            .outerRadius(radius);

        // Add the arcs
        const paths = svg.selectAll("path")
            .data(pie(data))
            .join("path")
            .attr("d", arc)
            .attr("fill", d => color(d.data.label))
            .attr("stroke", "white")
            .style("stroke-width", "2px");

        // Add labels
        svg.selectAll("text")
            .data(pie(data))
            .join("text")
            .attr("transform", d => `translate(${arc.centroid(d)})`)
            .attr("dy", "0.35em")
            .text(d => d.data.label)
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .style("fill", "white");

        // Add title
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("y", -height/2 + margin)
            .text(title)
            .style("font-size", "16px");
    };

    return (
        <div className="card h-100">
            <div className="card-header">
                <h5 className="card-title mb-0">Drug Prevalence</h5>
            </div>
            <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-around', height: '100%' }}>
                    <div ref={containerRef1} style={{ flex: 1, height: '100%' }}></div>
                    <div ref={containerRef2} style={{ flex: 1, height: '100%' }}></div>
                </div>
            </div>
        </div>
    );
};

export default Prevalence;