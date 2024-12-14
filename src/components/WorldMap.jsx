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
    const [initialData, setInitialData] = useState(null);

    const handleOceanClick = () => {
        if (onCountrySelect) {
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

    const continentColors = {
        'AF': '#89d1dc',
        'AN': '#89d1dc',
        'AS': '#89d1dc',
        'EU': '#89d1dc',
        'NA': '#89d1dc',
        'OC': '#89d1dc',
        'SA': '#89d1dc'
    };

    const edgeColors = {
        selected: '#808080',
        default: '#FFFFFF'
    };

    const regionToContinentCode = {
        'Africa': ['AF'],
        'Antarctica': ['AN'],
        'Asia': ['AS'],
        'Europe': ['EU'],
        'North America': ['NA'],
        'Oceania': ['OC'],
        'South America': ['SA'],
        'Americas': ['NA', 'SA']
    };

    const countryToContinent = {};
    continentData.forEach(continent => {
        continent.countries.forEach(countryCode => {
            countryToContinent[countryCode] = continent.continent_code;
        });
    });

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
        
        if (countryNameMapping[name]) {
            return name;
        }

        for (const [normalized, variants] of Object.entries(countryNameMapping)) {
            if (variants.includes(name)) {
                return normalized;
            }
        }

        console.log('Country name not found in mapping:', name);
        return name;
    };

    useEffect(() => {
        console.log('Fetching GeoJSON data...');
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

    const getRegionFromContinentCode = (continentCode) => {
        for (const [region, codes] of Object.entries(regionToContinentCode)) {
            if (codes.includes(continentCode)) {
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
        if (!initialData && data) {
            setInitialData(data);
        }
    }, [data]);

    useEffect(() => {
        const calculateAlphas = () => {
            const targetData = selectedCountry ? 
                (initialData || []).filter(d => d.level === "Country") :
                data.filter(d => d.level === "Region");
            
            if (targetData.length === 0) return {};

            const averages = targetData.map(item => {
                const yearValues = Object.values(item.years);
                const average = yearValues.reduce((sum, val) => sum + val, 0) / yearValues.length;
                return { 
                    name: selectedCountry ? normalizeCountryName(item.name) : item.name, 
                    average 
                };
            }).filter(item => item.name); // Filter out any null names after normalization

            const minAvg = Math.min(...averages.map(r => r.average));
            const maxAvg = Math.max(...averages.map(r => r.average));

            console.log('Alpha scale range:', { minAvg, maxAvg, count: averages.length });

            const alphaScale = d3.scaleLinear()
                .domain([minAvg, maxAvg])
                .range([0.5, 1.0]);

            const alphaMap = {};
            averages.forEach(item => {
                alphaMap[item.name] = alphaScale(item.average);
                console.log(`Alpha for ${item.name}:`, {
                    alpha: alphaMap[item.name],
                    average: item.average,
                    isMax: item.average === maxAvg,
                    isMin: item.average === minAvg
                });
            });

            return alphaMap;
        };

        const renderMap = (svgElement, containerElement, width, height) => {
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

            const svg = d3.select(svgElement)
                .attr('width', width)
                .attr('height', height)
                .attr('viewBox', `0 0 ${width} ${height}`)
                .attr('preserveAspectRatio', 'xMidYMid meet');

            svg.selectAll("*").remove(); 

            svg.append('rect')
                .attr('width', width)
                .attr('height', height)
                .attr('fill', '#ffffff')  
                .on('click', handleOceanClick);

            const mapGroup = svg.append('g');

            const alphas = calculateAlphas();

            const getCountryData = (countryName) => {
                if (!selectedCountry) return null;
                return (initialData || []).find(d => 
                    d.level === "Country" && 
                    d.name === countryName && 
                    d.years && 
                    Object.keys(d.years).length > 0
                );
            };

            const getAlphaForCountry = (countryName, countryId) => {
                const normalizedCountryName = normalizeCountryName(countryName);
                if (selectedCountry) {
                    if (!normalizedCountryName) return 0.4;  
                    const countryData = getCountryData(normalizedCountryName);
                    if (!countryData) return 0.4;  
                    return alphas[normalizedCountryName] || 0.4;  
                } else {
                    const continentCode = countryToContinent[countryId];
                    const region = getRegionFromContinentCode(continentCode);
                    return alphas[region] || 0.4;  
                }
            };

            const getCountryColor = (countryName, countryId) => {
                if (selectedCountry) {
                    const countryData = getCountryData(countryName);
                    if (!countryData) return '#CCCCCC';
                }
                const continentCode = countryToContinent[countryId];
                return continentColors[continentCode] || '#CCCCCC';
            };

            worldGeoData.features
                .filter((shape) => shape.properties.name !== 'Antarctica')
                .forEach((shape) => {
                    const countryId = shape.id;
                    const countryName = shape.properties.name;
                    const continentCode = countryToContinent[countryId];
                    const selectedCodes = regionToContinentCode[selectedRegion] || [];
                    const region = getRegionFromContinentCode(continentCode);
                    
                    let isSelected = false;
                    if (selectedCountry) {
                        const normalizedSelected = normalizeCountryName(selectedCountry);
                        const normalizedCountry = normalizeCountryName(countryName);
                        isSelected = normalizedSelected === normalizedCountry;
                    } else if (selectedRegion) {
                        isSelected = selectedCodes.includes(continentCode);
                    }

                    const fillColor = getCountryColor(countryName, countryId);
                    const alpha = getAlphaForCountry(countryName, countryId);

                    if (!isSelected) {
                        const path = mapGroup.append("path")
                            .datum(shape)
                            .attr("d", geoPathGenerator)
                            .attr("stroke", edgeColors.default)
                            .attr("stroke-width", 0.5)
                            .attr("fill", fillColor)
                            .attr("fill-opacity", alpha);

                        addPathEventListeners(path, shape, containerElement, isSelected, alpha);
                    }
                });

            worldGeoData.features
                .filter((shape) => shape.properties.name !== 'Antarctica')
                .forEach((shape) => {
                    const countryId = shape.id;
                    const countryName = shape.properties.name;
                    const continentCode = countryToContinent[countryId];
                    const selectedCodes = regionToContinentCode[selectedRegion] || [];
                    
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

                    const fillColor = getCountryColor(countryName, countryId);
                    const alpha = getAlphaForCountry(countryName, countryId);

                    if (isSelected) {
                        console.log('Drawing selected country:', countryName);
                        const path = mapGroup.append("path")
                            .datum(shape)
                            .attr("d", geoPathGenerator)
                            .attr("stroke", edgeColors.selected)
                            .attr("stroke-width", 1.5)
                            .attr("fill", fillColor)
                            .attr("fill-opacity", alpha);

                        addPathEventListeners(path, shape, containerElement, isSelected, alpha);

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

        const addPathEventListeners = (path, shape, containerElement, isSelected, baseAlpha) => {
            path
                .on("mouseover", function(e) {
                    d3.select(this)
                        .attr("fill-opacity", 1)
                        .attr("stroke-width", isSelected ? 1.5 : 1);
                    
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
                            display: 'block'  
                        }} 
                    />
                </div>
            </Modal>
        </div>
    );
};

export default WorldMap;