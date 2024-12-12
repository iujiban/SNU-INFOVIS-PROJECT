import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { geoNaturalEarth2 } from 'd3-geo-projection';
import { useDimensions } from '../hooks/useDimensions';
import ExpandButton from './ui/ExpandButton';
import Modal from './ui/Modal';

const WorldMap = ({ data }) => {
    const containerRef = useRef();
    const svgContainerRef = useRef();
    const svgRef = useRef();
    const modalSvgRef = useRef();
    const modalSvgContainerRef = useRef();
    const dimensions = useDimensions(svgContainerRef);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [worldGeoData, setWorldGeoData] = useState(null);

    useEffect(() => {
        // Fetch GeoJSON data once when component mounts
        d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
            .then(data => {
                setWorldGeoData(data);
            })
            .catch(error => {
                console.error('Error loading GeoJSON:', error);
            });
    }, []);

    useEffect(() => {
        const renderMap = (svgElement, containerElement, width, height) => {
            if (!width || !data || data.length === 0 || !worldGeoData) return;

            // Filter for Country-level data
            const countryData = data.filter(item => item.level === 'Country');

            // Normalize names and create a map for easier lookup
            const normalizeName = name => name.toLowerCase().replace(/\s+/g, '');
            const dataMap = new Map(countryData.map(d => [normalizeName(d.name), d.total]));

            // Create the SVG canvas
            const svg = d3.select(svgElement)
                .attr('width', '100%')
                .attr('height', '100%')
                .attr('preserveAspectRatio', 'xMinYMin meet')
                .attr('viewBox', `0 0 ${width} ${height}`);

            svg.selectAll("*").remove(); // Clear any previous content

            // Define the map projection
            const projection = geoNaturalEarth2()
                .scale(Math.min(width / 1.3, height * 1.5) / Math.PI)
                .translate([width / 2, height / 2]);

            // Create a color scale for the choropleth
            const colorScale = d3.scaleSequential()
                .domain([0, d3.max(countryData.map(d => d.total))])
                .interpolator(d3.interpolateYlGnBu);

            // Draw the map
            svg.append("g")
                .selectAll("path")
                .data(worldGeoData.features)
                .enter()
                .append("path")
                .attr("fill", d => {
                    const normalizedName = normalizeName(d.properties.name);
                    const value = dataMap.get(normalizedName) || 0;
                    return value > 0 ? colorScale(value) : '#ccc';
                })
                .attr("d", d3.geoPath().projection(projection))
                .style("stroke", "#fff")
                .append("title")
                .text(d => {
                    const normalizedName = normalizeName(d.properties.name);
                    const value = dataMap.get(normalizedName) || 0;
                    return `${d.properties.name}: ${value.toFixed(2)} kg`;
                });

            // Add the legend
            const legendWidth = 200;
            const legendHeight = 20;

            const legendSvg = svg.append("g")
                .attr("transform", `translate(${width - legendWidth - 20}, ${height - 40})`);

            const gradientId = `legend-gradient-${Math.random().toString(36).substr(2, 9)}`; // Unique ID for each render

            legendSvg.append("defs")
                .append("linearGradient")
                .attr("id", gradientId)
                .selectAll("stop")
                .data(colorScale.ticks().map((t, i, n) => ({
                    offset: `${(100 * i) / (n.length - 1)}%`,
                    color: colorScale(t)
                })))
                .enter()
                .append("stop")
                .attr("offset", d => d.offset)
                .attr("stop-color", d => d.color);

            legendSvg.append("rect")
                .attr("width", legendWidth)
                .attr("height", legendHeight)
                .style("fill", `url(#${gradientId})`);

            const legendScale = d3.scaleLinear()
                .domain(colorScale.domain())
                .range([0, legendWidth]);

            const legendAxis = d3.axisBottom(legendScale)
                .ticks(5)
                .tickSize(-legendHeight);

            legendSvg.append("g")
                .attr("transform", `translate(0, ${legendHeight})`)
                .call(legendAxis)
                .call(g => g.select(".domain").remove());
        };

        renderMap(svgRef.current, svgContainerRef.current, dimensions.width, dimensions.height);
        if (isModalOpen) {
            // Use window dimensions for modal
            const modalWidth = window.innerWidth * 0.8;
            const modalHeight = window.innerHeight * 0.8;
            renderMap(modalSvgRef.current, modalSvgContainerRef.current, modalWidth, modalHeight);
        }
    }, [dimensions, data, isModalOpen, worldGeoData]);

    return (
        <div className="card h-100" ref={containerRef}>
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">World Map</h5>
                <ExpandButton onClick={() => setIsModalOpen(true)} />
            </div>
            <div className="card-body p-0" style={{ height: dimensions.height }}>
                <div ref={svgContainerRef} style={{ width: '100%', height: '100%' }}>
                    <svg 
                        ref={svgRef} 
                        style={{ 
                            display: 'block', 
                            width: '100%', 
                            height: '100%',
                            maxWidth: '100%',
                            margin: 0
                        }}
                    ></svg>
                </div>
            </div>
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="World Map"
            >
                <div ref={modalSvgContainerRef} style={{ 
                    width: '100%', 
                    height: '80vh',
                    padding: 0 
                }}>
                    <svg 
                        ref={modalSvgRef} 
                        style={{ 
                            display: 'block', 
                            width: '100%', 
                            height: '100%',
                            maxWidth: '100%',
                            margin: 0
                        }}
                    ></svg>
                </div>
            </Modal>
        </div>
    );
};

export default WorldMap;
