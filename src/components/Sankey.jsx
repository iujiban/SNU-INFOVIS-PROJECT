import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { sankey as d3Sankey, sankeyLinkHorizontal } from "d3-sankey";
import { useDimensions } from "../hooks/useDimensions";
import ExpandButton from "./ui/ExpandButton";
import Modal from "./ui/Modal";

// Sankey 데이터 준비 함수
const prepareSankeyData = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn('Invalid or empty data provided to Sankey diagram');
        return { nodes: [], links: [] };
    }

    const nodes = [];
    const links = [];
    const nodeMap = new Map(); // 노드 중복 방지
    const linkMap = new Map(); // 링크 중복 방지

    const addNode = (name) => {
        if (!name) return -1; // Return invalid index for undefined/null names
        if (!nodeMap.has(name)) {
            nodeMap.set(name, nodes.length);
            nodes.push({ name });
        }
        return nodeMap.get(name);
    };

    const addLink = (source, target, value) => {
        if (source === -1 || target === -1) return; // Skip invalid nodes

        const linkKey = `${source}-${target}`;
        if (linkMap.has(linkKey)) {
            const existingLink = links[linkMap.get(linkKey)];
            existingLink.value += value;
        } else {
            linkMap.set(linkKey, links.length);
            links.push({
                source,
                target,
                value: Math.max(1, value || 1), // Ensure value is at least 1
            });
        }
    };

    data.forEach((item) => {
        const { drugGroup, traffickingCategory, seizuredLocation, total } = item;

        const drugNode = addNode(drugGroup);
        const transportNode = addNode(traffickingCategory);
        const locationNode = addNode(seizuredLocation);

        if (drugNode !== -1 && transportNode !== -1) {
            addLink(drugNode, transportNode, total || 1);
        }

        if (transportNode !== -1 && locationNode !== -1) {
            addLink(transportNode, locationNode, total || 1);
        }
    });

    if (nodes.length === 0 || links.length === 0) {
        console.warn('No valid nodes or links could be created from the data');
        return { nodes: [], links: [] };
    }

    return { nodes, links };
};

// SankeyChart 
const SankeyChart = ({ data }) => {
    const containerRef = useRef();
    const svgRef = useRef();
    const dimensions = useDimensions(containerRef);

    const firstLevelColors = {
        "Cannabis and Synthetic Cannabinoids": "#8dd3c7",
        "Cocaine and Derivatives": "#ffffb3",
        "Opioids and Opiates": "#bebada",
        "Amphetamines and Stimulants": "#fb8072",
        "Classic Hallucinogens": "#80b1d3",
        "Tranquillizers and Sedatives": "#fdb462",
        "MDMA and Ecstasy-like Drugs": "#b3de69",
        "NPS": "#fccde5",
        "Miscellaneous": "#d9d9d9"
    };

    useEffect(() => {
        if (!data || !data.nodes || !data.links || !dimensions || data.nodes.length === 0) {
            // Clear the SVG if data is invalid
            const svg = d3.select(svgRef.current);
            svg.selectAll("*").remove();
            return;
        }

        const margin = { top: 10, right: 30, bottom: 10, left: 30 };
        const width = dimensions.width - margin.left - margin.right;
        const height = dimensions.height - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        svg.attr("width", dimensions.width)
            .attr("height", dimensions.height);

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Convert node references from names to indices
        const nodeMap = new Map(data.nodes.map((node, i) => [node.name, i]));
        const links = data.links.map(d => ({
            source: typeof d.source === 'number' ? d.source : nodeMap.get(d.source),
            target: typeof d.target === 'number' ? d.target : nodeMap.get(d.target),
            value: d.value
        })).filter(d => d.source !== undefined && d.target !== undefined);

        // Recreate nodes array to ensure proper indexing
        const nodes = data.nodes.map((node, index) => ({
            ...node,
            index: index
        }));

        // Verify data integrity
        if (nodes.length === 0 || links.length === 0) {
            console.warn('No valid nodes or links after processing');
            return;
        }

        // Create Sankey generator with fixed node width and padding
        const sankey = d3Sankey()
            .nodeWidth(15)
            .nodePadding(8)
            .extent([[0, 0], [width, height]])
            .nodeId(d => d.index);

        try {
            // Generate the Sankey layout
            const sankeyData = sankey({
                nodes: nodes,
                links: links
            });

            // Draw links
            g.append("g")
                .selectAll("path")
                .data(sankeyData.links)
                .enter()
                .append("path")
                .attr("d", sankeyLinkHorizontal())
                .attr("stroke", d => d3.color(firstLevelColors[d.source.name] || "#d9d9d9"))
                .attr("fill", "none")
                .attr("stroke-width", d => Math.max(1, d.width))
                .style("stroke-opacity", 0.5);

            // Draw nodes
            const node = g.append("g")
                .selectAll("g")
                .data(sankeyData.nodes)
                .enter()
                .append("g");

            node.append("rect")
                .attr("x", d => d.x0)
                .attr("y", d => d.y0)
                .attr("height", d => Math.max(1, d.y1 - d.y0))
                .attr("width", sankey.nodeWidth())
                .style("fill", d => firstLevelColors[d.name] || "#d9d9d9");

            // Add labels
            const fontSize = Math.max(8, Math.min(12, width / 50));
            node.append("text")
                .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
                .attr("y", d => (d.y0 + d.y1) / 2)
                .attr("dy", "0.35em")
                .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
                .text(d => d.name)
                .style("font-size", `${fontSize}px`);

        } catch (error) {
            console.error('Error generating Sankey diagram:', error);
            svg.selectAll("*").remove();
        }
    }, [data, dimensions]);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <svg ref={svgRef} style={{ display: 'block', width: '100%', height: '100%' }}></svg>
        </div>
    );
};

// Prevalence 
const Prevalence = ({ data, selectedRegion, selectedCountry }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const containerRef1 = useRef();
    const modalContainerRef1 = useRef();

    // Ensure data is valid
    if (!Array.isArray(data)) {
        console.warn('Invalid data provided to Prevalence component');
        return null;
    }

    // Filter data with validation
    const filteredData = data.filter((item) => {
        if (!item || typeof item !== 'object') return false;
        if (selectedRegion && (!item.region || item.region !== selectedRegion)) return false;
        if (selectedCountry && (!item.country || item.country !== selectedCountry)) return false;

        // Ensure all required fields are present
        return item.drugGroup &&
            item.traffickingCategory &&
            item.seizuredLocation &&
            item.total !== undefined;
    });

    // If no data after filtering, return early with a message
    if (filteredData.length === 0) {
        return (
            <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-0">Drug Trafficking Flow</h5>
                </div>
                <div className="card-body d-flex align-items-center justify-content-center">
                    <p>No data available for the selected filters</p>
                </div>
            </div>
        );
    }

    const sankeyData = prepareSankeyData(filteredData);

    // Verify sankeyData structure
    if (!sankeyData || !sankeyData.nodes || !sankeyData.links ||
        sankeyData.nodes.length === 0 || sankeyData.links.length === 0) {
        return (
            <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-0">Drug Trafficking Flow</h5>
                </div>
                <div className="card-body d-flex align-items-center justify-content-center">
                    <p>Unable to generate flow diagram with current data</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Drug Trafficking Flow</h5>
                <ExpandButton onClick={() => setIsModalOpen(true)} />
            </div>
            <div className="card-body p-0" style={{ flex: 1, minHeight: 0 }}>
                <div style={{ height: "100%", padding: "10px" }}>
                    <div ref={containerRef1} style={{ width: "100%", height: "100%" }}>
                        <SankeyChart data={sankeyData} />
                    </div>
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Drug Trafficking Flow">
                <div style={{ height: "80vh" }}>
                    <div ref={modalContainerRef1} style={{ width: "100%", height: "100%" }}>
                        <SankeyChart data={sankeyData} />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Prevalence;
