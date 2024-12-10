import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { geoNaturalEarth2 } from 'd3-geo-projection';
import { useDimensions } from '../hooks/useDimensions';

const Map = ({data}) => {
    const containerRef = useRef();
    const svgContainerRef = useRef();
    const svgRef = useRef();
    const dimensions = useDimensions(svgContainerRef);

    // Debug Data
    useEffect(() => {
        console.log('Map data updated:', data);
        console.log("Container Map dimensions (useDimensions):", dimensions);
        // Use the data to render the map
    }, [data]);
    
    useEffect(() => {
        if (dimensions.width === 0) return;

        // Create SVG
        const svg = d3.select(svgRef.current)
            .attr('width', dimensions.width)
            .attr('height', dimensions.height);

        // Clear any existing content
        svg.selectAll("*").remove();

        // Create projection
        const projection = geoNaturalEarth2()
            .scale(Math.min(dimensions.width / 1.3, dimensions.height * 1.5) / Math.PI)
            .translate([dimensions.width / 2, dimensions.height / 2]);

        // Load and draw the world map
        d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
            .then(data => {
                // Draw the map
                svg.append("g")
                    .selectAll("path")
                    .data(data.features)
                    .enter()
                    .append("path")
                    .attr("fill", "#69b3a2")
                    .attr("d", d3.geoPath().projection(projection))
                    .style("stroke", "#fff");
            })
            .catch(error => {
                console.error('Error loading the map data:', error);
            });
    }, [dimensions]); // Re-render when dimensions change

    return (
        <div className="card h-100" ref={containerRef}>
            <div className="card-header">
                <h5 className="card-title mb-0">World Map</h5>
            </div>
            <div className="card-body d-flex flex-column">
                <div className="flex-grow-1" ref={svgContainerRef}>
                    <svg ref={svgRef} style={{ width: '100%', height: '100%' }}></svg>
                </div>
            </div>
        </div>
    );
};

export default Map;