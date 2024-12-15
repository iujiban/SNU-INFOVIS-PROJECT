import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { sankey as d3Sankey, sankeyLinkHorizontal } from "d3-sankey";
import { useDimensions } from "../hooks/useDimensions";
import ExpandButton from "./ui/ExpandButton";
import Modal from "./ui/Modal";

// Sankey 데이터 준비 함수
const prepareSankeyData = (data) => {
    const nodes = [];
    const links = [];
    const nodeMap = new Map(); // 노드 중복 방지
    const linkMap = new Map(); // 링크 중복 방지

    const addNode = (name) => {
        if (!nodeMap.has(name)) {
            nodeMap.set(name, nodes.length);
            nodes.push({ name });
        }
        return nodeMap.get(name);
    };

    const addLink = (source, target, value) => {
        const linkKey = `${source}-${target}`;
        if (linkMap.has(linkKey)) {
            // If link exists, add to its value
            const existingLink = links[linkMap.get(linkKey)];
            existingLink.value += value;
        } else {
            // If link doesn't exist, create new one
            linkMap.set(linkKey, links.length);
            links.push({
                source,
                target,
                value: value || 1,
            });
        }
    };

    // 데이터 순회: drugGroup → traffickingCategory → seizuredLocation
    data.forEach((item) => {
        const { drugGroup, traffickingCategory, seizuredLocation, total } = item;

        if (!drugGroup || !traffickingCategory || !seizuredLocation) return;

        const drugNode = addNode(drugGroup);
        const transportNode = addNode(traffickingCategory);
        const locationNode = addNode(seizuredLocation);

        // drugGroup → traffickingCategory
        addLink(drugNode, transportNode, total || 1);

        // traffickingCategory → seizuredLocation
        addLink(transportNode, locationNode, total || 1);
    });

    return { nodes, links };
};

// SankeyChart 
const SankeyChart = ({ data }) => {
    const containerRef = useRef();
    const svgRef = useRef();
    const dimensions = useDimensions(containerRef);

    useEffect(() => {
        if (!data || !data.nodes || !data.links || !dimensions) return;

        const margin = { top: 10, right: 30, bottom: 10, left: 30 };
        const width = dimensions.width - margin.left - margin.right;
        const height = dimensions.height - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        // Set SVG dimensions
        svg.attr("width", dimensions.width)
           .attr("height", dimensions.height);

        // Create main group with margins
        const g = svg.append("g")
                    .attr("transform", `translate(${margin.left},${margin.top})`);

        // Sankey 설정
        const sankey = d3Sankey()
            .nodeWidth(15)
            .nodePadding(8)
            .size([width, height]);

        const sankeyData = sankey({
            nodes: data.nodes.map((d) => ({ ...d })),
            links: data.links.map((d) => ({ ...d })),
        });

        // 링크 그리기
        g.append("g")
            .selectAll("path")
            .data(sankeyData.links)
            .enter()
            .append("path")
            .attr("d", sankeyLinkHorizontal())
            .attr("stroke", "#007bff")
            .attr("fill", "none")
            .attr("stroke-width", (d) => Math.max(1, d.width))
            .style("stroke-opacity", 0.5);

        // 노드 그리기
        const node = g.append("g")
            .selectAll("g")
            .data(sankeyData.nodes)
            .enter()
            .append("g");

        node.append("rect")
            .attr("x", (d) => d.x0)
            .attr("y", (d) => d.y0)
            .attr("height", (d) => d.y1 - d.y0)
            .attr("width", sankey.nodeWidth())
            .style("fill", "#69b3a2");

        // Adjust text size based on container width
        const fontSize = Math.max(8, Math.min(12, width / 50));

        node.append("text")
            .attr("x", (d) => (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
            .attr("y", (d) => (d.y0 + d.y1) / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", (d) => d.x0 < width / 2 ? "start" : "end")
            .text((d) => d.name)
            .style("font-size", `${fontSize}px`);
    }, [data, dimensions]);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <svg ref={svgRef} style={{ display: 'block', width: '100%', height: '100%' }}></svg>
        </div>
    );
};

// Prevalence 
const Prevalence = ({ data, selectedRegion, selectedCountry }) => {
    const containerRef1 = useRef();
    const containerRef2 = useRef();
    const modalContainerRef1 = useRef();
    const modalContainerRef2 = useRef();
    const dimensions1 = useDimensions(containerRef1);
    const dimensions2 = useDimensions(containerRef2);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Dynamic leftKey 
    const leftKey = selectedCountry ? "country" : "region";

    const filteredData = data.filter((item) => {
        if (selectedRegion && item.region !== selectedRegion) return false;
        if (selectedCountry && item.country !== selectedCountry) return false;
        return true;
    });

    const sankeyData = prepareSankeyData(filteredData);

    return (
        <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Drug Prevalence</h5>
                <ExpandButton onClick={() => setIsModalOpen(true)} />
            </div>
            <div className="card-body p-0" style={{ flex: 1, minHeight: 0 }}>
                <div style={{ height: "100%", padding: "10px" }}>
                    <div ref={containerRef1} style={{ width: "100%", height: "100%" }}>
                        <SankeyChart data={sankeyData} />
                    </div>
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Drug Prevalence">
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
