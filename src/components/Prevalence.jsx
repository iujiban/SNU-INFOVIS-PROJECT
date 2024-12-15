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
    const svgRef = useRef();

    useEffect(() => {
        if (!data || !data.nodes || !data.links) return;

        const width = 800;
        const height = 600;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // 기존 SVG 초기화

        // Sankey 설정
        const sankey = d3Sankey()
            .nodeWidth(20)
            .nodePadding(10)
            .size([width, height]);

        const sankeyData = sankey({
            nodes: data.nodes.map((d) => ({ ...d })),
            links: data.links.map((d) => ({ ...d })),
        });

        // 링크 그리기
        svg.append("g")
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
        const node = svg.append("g")
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

        node.append("text")
            .attr("x", (d) => d.x0 - 6)
            .attr("y", (d) => (d.y0 + d.y1) / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .text((d) => d.name)
            .style("font-size", "12px");
    }, [data]);

    return <svg ref={svgRef} width={800} height={600}></svg>;
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
            <div className="card-body p-0">
                <div style={{ display: "flex", justifyContent: "space-around", height: "100%" }}>
                    <div ref={containerRef1} style={{ flex: 1 }}>
                        <SankeyChart data={sankeyData} />
                    </div>
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Drug Prevalence">
                <div style={{ display: "flex", justifyContent: "space-around", height: "80vh" }}>
                    <div ref={modalContainerRef1} style={{ flex: 1 }}>
                        <SankeyChart data={sankeyData} />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Prevalence;
