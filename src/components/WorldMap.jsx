import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useDimensions } from '../hooks/useDimensions';
import ExpandButton from './ui/ExpandButton';
import Modal from './ui/Modal';
import continentData from '../data/continents.json';

const WorldMap = ({ data, selectedRegion, selectedCountry, onCountrySelect }) => {
    const containerRef = useRef();
    const svgContainerRef = useRef();
    const svgRef = useRef();
    const modalSvgRef = useRef();
    const modalSvgContainerRef = useRef();
    const dimensions = useDimensions(svgContainerRef);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [worldGeoData, setWorldGeoData] = useState(null);

    const handleOceanClick = () => {
        if (onCountrySelect) {
            // Reset both map selection and dropdown
            onCountrySelect({
                region: null,
                country: null
            });
        }
    };

    useEffect(() => {
        console.log('WorldMap props:', {
            selectedRegion,
            selectedCountry,
            hasOnCountrySelect: !!onCountrySelect
        });
    }, [selectedRegion, selectedCountry, onCountrySelect]);

    useEffect(() => {
        console.log('WorldMap selectedRegion:', selectedRegion);
    }, [selectedRegion]);

    // Define pastel colors for continents
    // const continentColors = {
    //     'AF': '#f0d689',
    //     'AN': '#E8BAFF',
    //     'AS': '#f89cfa',
    //     'EU': '#c386f1',
    //     'NA': '#aff28b',
    //     'OC': '#89d1dc',
    //     'SA': '#aff28b'
    // };
    const continentColors = {
        'AF': '#89d1dc',
        'AN': '#89d1dc',
        'AS': '#89d1dc',
        'EU': '#89d1dc',
        'NA': '#89d1dc',
        'OC': '#89d1dc',
        'SA': '#89d1dc'
    };

    // Define edge colors for selected and unselected states
    const edgeColors = {
        selected: '#808080',    // Grey color for selected regions
        default: '#FFFFFF'      // White color for unselected regions
    };

    // Map region names to continent codes
    const regionToContinentCode = {
        'Africa': ['AF'],
        'Antarctica': ['AN'],
        'Asia': ['AS'],
        'Europe': ['EU'],
        'North America': ['NA'],
        'Oceania': ['OC'],
        'South America': ['SA'],
        'Americas': ['NA', 'SA']  // Both North and South America
    };

    // Create a mapping of country codes to continents
    const countryToContinent = {};
    continentData.forEach(continent => {
        continent.countries.forEach(countryCode => {
            countryToContinent[countryCode] = continent.continent_code;
        });
    });

    // Add country name mapping
    const countryNameMapping = {
        'Vietnam': ['Vietnam', 'Viet Nam'],
        'South Korea': ['Korea, Republic of', 'South Korea', 'Republic of Korea'],
        'North Korea': ['Korea, Democratic People\'s Republic of', 'North Korea'],
        'United States': ['United States of America', 'USA', 'United States'],
        'Russia': ['Russian Federation', 'Russia'],
        'United Kingdom': ['United Kingdom of Great Britain and Northern Ireland', 'UK', 'Great Britain'],
        'Czech Republic': ['Czechia', 'Czech Republic'],
        'Macedonia': ['North Macedonia', 'Macedonia'],
        'Bolivia': ['Bolivia (Plurinational State of)', 'Bolivia'],
        'Venezuela': ['Venezuela (Bolivarian Republic of)', 'Venezuela'],
        'Iran': ['Iran (Islamic Republic of)', 'Iran'],
        'Syria': ['Syrian Arab Republic', 'Syria'],
        'Tanzania': ['United Republic of Tanzania', 'Tanzania'],
        'Congo': ['Democratic Republic of the Congo', 'Congo'],
        'Laos': ["Lao People's Democratic Republic", 'Laos'],
        'Moldova': ['Republic of Moldova', 'Moldova'],
        'China': ["China", "People's Republic of China"],
        'France': ['France', 'French Republic'],
        'Germany': ['Germany', 'Federal Republic of Germany'],
        'Japan': ['Japan'],
        'India': ['India', 'Republic of India'],
        'South Africa': ['South Africa', 'Republic of South Africa'],
        'Egypt': ['Egypt', 'Arab Republic of Egypt'],
        'Nigeria': ['Nigeria', 'Federal Republic of Nigeria'],
        'Brazil': ['Brazil', 'Federative Republic of Brazil'],
        'Canada': ['Canada'],
        'Australia': ['Australia', 'Commonwealth of Australia'],
        'New Zealand': ['New Zealand']
    };

    const normalizeCountryName = (name) => {
        if (!name) return null;
        
        // First check if this name is a key in our mapping
        if (countryNameMapping[name]) {
            return name;
        }

        // Then check if this name is in any of the variants
        for (const [normalized, variants] of Object.entries(countryNameMapping)) {
            if (variants.includes(name)) {
                return normalized;
            }
        }

        console.log('Country name not found in mapping:', name);
        // If no mapping found, return the original name
        return name;
    };

    useEffect(() => {
        console.log('Fetching GeoJSON data...');
        // Fetch GeoJSON data once when component mounts
        d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
            .then(data => {
                console.log('GeoJSON data received:', data);
                setWorldGeoData(data);
            })
            .catch(error => {
                console.error('Error loading GeoJSON:', error);
            });
    }, []);

    useEffect(() => {
        console.log('Selected country:', selectedCountry);
        console.log('Normalized country:', selectedCountry ? normalizeCountryName(selectedCountry) : null);
    }, [selectedCountry]);

    // Helper function to get region from continent code
    const getRegionFromContinentCode = (continentCode) => {
        for (const [region, codes] of Object.entries(regionToContinentCode)) {
            if (codes.includes(continentCode)) {
                // Special case for Americas
                if (continentCode === 'NA' || continentCode === 'SA') {
                    return 'Americas';
                }
                return region;
            }
        }
        return null;
    };

    const handleCountryClick = (shape) => {
        const countryName = shape.properties.name;
        const countryId = shape.id;
        const continentCode = countryToContinent[countryId];
        const region = getRegionFromContinentCode(continentCode);
        
        console.log('Country clicked:', {
            original: countryName,
            normalized: normalizeCountryName(countryName),
            id: countryId,
            continentCode,
            region
        });
        
        if (onCountrySelect && region && normalizeCountryName(countryName)) {
            onCountrySelect({
                region: region,
                country: normalizeCountryName(countryName)
            });
        }
    };

    useEffect(() => {
        // Calculate alpha values for regions
        const calculateRegionAlphas = () => {
            const regionData = data.filter(d => d.level === "Region");
            
            // Calculate averages for each region
            const regionAverages = regionData.map(region => {
                const yearValues = Object.values(region.years);
                const average = yearValues.reduce((sum, val) => sum + val, 0) / yearValues.length;
                return { name: region.name, average };
            });

            // Find min and max averages
            const minAvg = Math.min(...regionAverages.map(r => r.average));
            const maxAvg = Math.max(...regionAverages.map(r => r.average));

            // Scale averages to alpha values between 0.2 and 0.8
            const alphaScale = d3.scaleLinear()
                .domain([minAvg, maxAvg])
                .range([0.1, 0.9]);

            // Create map of region names to alpha values
            const alphaMap = {};
            regionAverages.forEach(region => {
                alphaMap[region.name] = alphaScale(region.average);
            });

            return alphaMap;
        };

        const regionAlphas = calculateRegionAlphas();

        const renderMap = (svgElement, containerElement, width, height) => {
            // Remove the data length check since we want to render the map even without data
            if (!width || !worldGeoData || !svgElement || !containerElement) {
                console.log('Missing required data:', { 
                    width, 
                    height,
                    hasWorldGeoData: !!worldGeoData,
                    hasSvgElement: !!svgElement,
                    hasContainerElement: !!containerElement
                });
                return;
            }

            console.log('Rendering map with dimensions:', { width, height });
            console.log('Current selection:', { selectedRegion, selectedCountry });

            const projection = d3
                .geoMercator()
                .fitSize([width, height], {
                    type: "FeatureCollection",
                    features: worldGeoData.features.filter(d => d.properties.name !== 'Antarctica')
                });

            const geoPathGenerator = d3.geoPath().projection(projection);

            // Create the SVG canvas
            const svg = d3.select(svgElement)
                .attr('width', width)
                .attr('height', height)
                .attr('viewBox', `0 0 ${width} ${height}`)
                .attr('preserveAspectRatio', 'xMidYMid meet');

            svg.selectAll("*").remove(); // Clear any previous content

            // Add ocean background that will handle ocean clicks
            svg.append('rect')
                .attr('width', width)
                .attr('height', height)
                .attr('fill', '#ffffff')  // White color for ocean
                .on('click', handleOceanClick);

            // Create a group for all map elements
            const mapGroup = svg.append('g');

            // First pass: Draw all non-selected countries
            worldGeoData.features
                .filter((shape) => shape.properties.name !== 'Antarctica')
                .forEach((shape) => {
                    const countryId = shape.id;
                    const countryName = shape.properties.name;
                    const continentCode = countryToContinent[countryId];
                    const selectedCodes = regionToContinentCode[selectedRegion] || [];
                    const region = getRegionFromContinentCode(continentCode);
                    
                    // Determine if this shape should be highlighted
                    let isSelected = false;
                    if (selectedCountry) {
                        const normalizedSelected = normalizeCountryName(selectedCountry);
                        const normalizedCountry = normalizeCountryName(countryName);
                        isSelected = normalizedSelected === normalizedCountry;
                    } else if (selectedRegion) {
                        isSelected = selectedCodes.includes(continentCode);
                    }

                    const fillColor = continentColors[continentCode] || '#CCCCCC';
                    const alpha = regionAlphas[region] || 0.5; // default to 0.5 if region not found

                    // Only draw non-selected countries in first pass
                    if (!isSelected) {
                        const path = mapGroup.append("path")
                            .datum(shape)
                            .attr("d", geoPathGenerator)
                            .attr("stroke", edgeColors.default)
                            .attr("stroke-width", 0.5)
                            .attr("fill", fillColor)
                            .attr("fill-opacity", alpha);

                        // Add event listeners for non-selected countries
                        addPathEventListeners(path, shape, containerElement, isSelected);
                    }
                });

            // Second pass: Draw selected countries on top
            worldGeoData.features
                .filter((shape) => shape.properties.name !== 'Antarctica')
                .forEach((shape) => {
                    const countryId = shape.id;
                    const countryName = shape.properties.name;
                    const continentCode = countryToContinent[countryId];
                    const selectedCodes = regionToContinentCode[selectedRegion] || [];
                    
                    // Determine if this shape should be highlighted
                    let isSelected = false;
                    if (selectedCountry) {
                        const normalizedSelected = normalizeCountryName(selectedCountry);
                        const normalizedCountry = normalizeCountryName(countryName);
                        console.log('Checking selection:', {
                            country: countryName,
                            normalized: normalizedCountry,
                            selected: normalizedSelected,
                            isMatch: normalizedSelected === normalizedCountry
                        });
                        isSelected = normalizedSelected === normalizedCountry;
                    } else if (selectedRegion) {
                        isSelected = selectedCodes.includes(continentCode);
                    }

                    const fillColor = continentColors[continentCode] || '#CCCCCC';

                    // Only draw selected countries in second pass
                    if (isSelected) {
                        console.log('Drawing selected country:', countryName);
                        const path = mapGroup.append("path")
                            .datum(shape)
                            .attr("d", geoPathGenerator)
                            .attr("stroke", edgeColors.selected)
                            .attr("stroke-width", 1.5)
                            .attr("fill", fillColor)
                            .attr("fill-opacity", 0.8);

                        // Add event listeners for selected countries
                        addPathEventListeners(path, shape, containerElement, isSelected);

                        // Draw the highlight border on top
                        mapGroup.append("path")
                            .datum(shape)
                            .attr("d", geoPathGenerator)
                            .attr("stroke", edgeColors.selected)
                            .attr("stroke-width", 1.5)
                            .attr("fill", "none")
                            .attr("pointer-events", "none");
                    }
                });

            console.log('Map rendering complete');
        };

        // Helper function for path event listeners
        const addPathEventListeners = (path, shape, containerElement, isSelected) => {
            const countryId = shape.id;
            const continentCode = countryToContinent[countryId];
            const region = getRegionFromContinentCode(continentCode);
            const baseAlpha = regionAlphas[region] || 0.5;

            path
                .on("mouseover", function(e) {
                    d3.select(this)
                        .attr("fill-opacity", 1)
                        .attr("stroke-width", isSelected ? 1.5 : 1);
                    
                    // Add tooltip
                    const tooltip = d3.select(containerElement)
                        .append("div")
                        .attr("class", "tooltip")
                        .style("position", "absolute")
                        .style("background-color", "rgba(0, 0, 0, 0.8)")
                        .style("color", "white")
                        .style("padding", "8px 12px")
                        .style("border-radius", "4px")
                        .style("font-size", "14px")
                        .style("pointer-events", "none")
                        .style("z-index", "1000")
                        .style("box-shadow", "0 2px 4px rgba(0,0,0,0.2)")
                        .style("opacity", "1")
                        .style("visibility", "visible")
                        .text(shape.properties.name);

                    const [x, y] = d3.pointer(e, containerElement);
                    tooltip
                        .style("left", (x + 15) + "px")
                        .style("top", (y - 25) + "px");
                })
                .on("mouseout", function() {
                    d3.select(this)
                        .attr("fill-opacity", baseAlpha)
                        .attr("stroke-width", isSelected ? 1.5 : 0.5);
                    
                    d3.select(containerElement)
                        .selectAll(".tooltip")
                        .remove();
                })
                .on("click", function() {
                    handleCountryClick(shape);
                });
        };

        renderMap(svgRef.current, svgContainerRef.current, dimensions.width, dimensions.height);
        if (isModalOpen && modalSvgRef.current && modalSvgContainerRef.current) {
            const modalContainer = modalSvgContainerRef.current;
            const modalWidth = modalContainer.clientWidth;
            const modalHeight = modalContainer.clientHeight;
            console.log('Modal dimensions:', { modalWidth, modalHeight });
            renderMap(modalSvgRef.current, modalSvgContainerRef.current, modalWidth, modalHeight);
        }
    }, [dimensions, worldGeoData, selectedRegion, selectedCountry, data, isModalOpen]);

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
                            width: '100%',
                            height: '100%'
                        }}
                    />
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
                    padding: 0,
                    overflow: 'hidden'
                }}>
                    <svg 
                        ref={modalSvgRef} 
                        style={{ 
                            width: '100%', 
                            height: '100%',
                            display: 'block'  // Remove any extra spacing
                        }} 
                    />
                </div>
            </Modal>
        </div>
    );
};

export default WorldMap;