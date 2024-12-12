import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { geoNaturalEarth2 } from 'd3-geo-projection';
import { useDimensions } from '../hooks/useDimensions';

const WorldMap = ({ data }) => {
    const containerRef = useRef();
    const svgContainerRef = useRef();
    const svgRef = useRef();
    const dimensions = useDimensions(svgContainerRef);

    useEffect(() => {
        if (dimensions.width === 0 || !data || data.length === 0) return;

        // Filter for Country-level data
        const countryData = data.filter(item => item.level === 'Country');

        // Normalize names and create a map for easier lookup
        const normalizeName = name => name.toLowerCase().replace(/\s+/g, '');
        const dataMap = new Map(countryData.map(d => [normalizeName(d.name), d.total]));

        // Create the SVG canvas
        const svg = d3.select(svgRef.current)
            .attr('width', dimensions.width)
            .attr('height', dimensions.height);

        svg.selectAll("*").remove(); // Clear any previous content

        // Define the map projection
        const projection = geoNaturalEarth2()
            .scale(Math.min(dimensions.width / 1.3, dimensions.height * 1.5) / Math.PI)
            .translate([dimensions.width / 2, dimensions.height / 2]);

        d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
            .then(worldData => {
                // Create a color scale for the choropleth
                const colorScale = d3.scaleSequential()
                    .domain([0, d3.max(countryData.map(d => d.total))])
                    .interpolator(d3.interpolateYlGnBu);

                // Draw the map
                svg.append("g")
                    .selectAll("path")
                    .data(worldData.features)
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
                    .attr("transform", `translate(${dimensions.width - legendWidth - 20}, ${dimensions.height - 40})`);

                const gradientId = "legend-gradient";

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
            })
            .catch(error => {
                console.error('Error loading GeoJSON:', error);
            });
    }, [dimensions, data]); // Re-render when dimensions or data changes

    return (
        <div className="card h-100" ref={containerRef}>
            <div className="card-header">
                <h5 className="card-title mb-0">World Map - Country Level</h5>
            </div>
            <div className="card-body d-flex flex-column">
                <div className="flex-grow-1" ref={svgContainerRef}>
                    <svg ref={svgRef} style={{ width: '100%', height: '100%' }}></svg>
                </div>
            </div>
        </div>
    );
};

export default WorldMap;
