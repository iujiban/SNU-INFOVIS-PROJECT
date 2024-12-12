import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as bootstrap from 'bootstrap';
import { useDimensions } from '../hooks/useDimensions';
import ExpandButton from './ui/ExpandButton';
import Modal from './ui/Modal';

const Prevalence = ({ data1, data2 }) => {
    const containerRef1 = useRef();
    const containerRef2 = useRef();
    const modalContainerRef1 = useRef();
    const modalContainerRef2 = useRef();
    const dimensions1 = useDimensions(containerRef1);
    const dimensions2 = useDimensions(containerRef2);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (data1 && data2 && dimensions1.width && dimensions2.width) {
            createDonutChart(data1, containerRef1, "Category Distribution", dimensions1);
            createDonutChart(data2, containerRef2, "Type Distribution", dimensions2);
            if (isModalOpen) {
                createDonutChart(data1, modalContainerRef1, "Category Distribution", dimensions1);
                createDonutChart(data2, modalContainerRef2, "Type Distribution", dimensions2);
            }
        }
    }, [data1, data2, dimensions1.width, dimensions1.height, dimensions2.width, dimensions2.height, isModalOpen]);

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
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .style("display", "block")
            .style("margin", 0)
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
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Drug Prevalence</h5>
                <ExpandButton onClick={() => setIsModalOpen(true)} />
            </div>
            <div className="card-body p-0">
                <div style={{ display: 'flex', justifyContent: 'space-around', height: '100%', padding: 0 }}>
                    <div ref={containerRef1} style={{ flex: 1, height: '100%', width: '100%' }}>
                        <svg style={{ 
                            display: 'block', 
                            width: '100%', 
                            height: '100%',
                            maxWidth: '100%',
                            margin: 0
                        }}></svg>
                    </div>
                    <div ref={containerRef2} style={{ flex: 1, height: '100%', width: '100%' }}>
                        <svg style={{ 
                            display: 'block', 
                            width: '100%', 
                            height: '100%',
                            maxWidth: '100%',
                            margin: 0
                        }}></svg>
                    </div>
                </div>
            </div>
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Drug Prevalence"
            >
                <div style={{ display: 'flex', justifyContent: 'space-around', height: '80vh', padding: 0 }}>
                    <div ref={modalContainerRef1} style={{ flex: 1, height: '100%', width: '100%' }}>
                        <svg style={{ 
                            display: 'block', 
                            width: '100%', 
                            height: '100%',
                            maxWidth: '100%',
                            margin: 0
                        }}></svg>
                    </div>
                    <div ref={modalContainerRef2} style={{ flex: 1, height: '100%', width: '100%' }}>
                        <svg style={{ 
                            display: 'block', 
                            width: '100%', 
                            height: '100%',
                            maxWidth: '100%',
                            margin: 0
                        }}></svg>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Prevalence;