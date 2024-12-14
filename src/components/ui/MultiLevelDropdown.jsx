import React, { useState, useEffect } from 'react';

const MultiLevelDropdown = ({ label, options, levels, onChange, value }) => {
    const [selections, setSelections] = useState({});
    const [filteredOptions, setFilteredOptions] = useState({});
    
    // Update selections when value prop changes
    useEffect(() => {
        if (value) {
            setSelections(value);
        }
    }, [value]);

    // Initialize filtered options for each level
    useEffect(() => {
        const newFilteredOptions = {};
        
        levels.forEach((level, index) => {
            if (index === 0) {
                // First level shows unique values
                newFilteredOptions[level] = [...new Set(options.map(opt => opt[level]))].filter(Boolean).sort();
            } else {
                // Other levels are filtered based on previous selections
                const filtered = options.filter(opt => {
                    return Object.entries(selections)
                        .filter(([key]) => levels.indexOf(key) < index)
                        .every(([key, value]) => opt[key] === value);
                });
                newFilteredOptions[level] = [...new Set(filtered.map(opt => opt[level]))].filter(Boolean).sort();

                // If we have a selection for this level but it's not in the filtered options,
                // add it to ensure it's available for selection
                if (selections[level] && !newFilteredOptions[level].includes(selections[level])) {
                    console.log(`Adding missing selection ${selections[level]} to options for ${level}`);
                    newFilteredOptions[level].push(selections[level]);
                    newFilteredOptions[level].sort();
                }
            }
        });
        
        console.log('Filtered options:', newFilteredOptions);
        console.log('Current selections:', selections);
        setFilteredOptions(newFilteredOptions);
    }, [options, levels, selections]);

    const handleChange = (level, value) => {
        const levelIndex = levels.indexOf(level);
        const newSelections = {
            ...selections,
            [level]: value || null
        };
        
        // Clear subsequent selections
        levels.slice(levelIndex + 1).forEach(nextLevel => {
            newSelections[nextLevel] = null;
        });
        
        setSelections(newSelections);
        onChange(newSelections);
    };

    return (
        <div className="card m-2">
            <div className="card-body">
                <h6 className="form-label">{label}</h6>
                <div className="d-flex flex-column gap-2">
                    {levels.map((level, index) => (
                        <select
                            key={level}
                            className="form-select"
                            value={selections[level] || ''}
                            onChange={(e) => handleChange(level, e.target.value)}
                            disabled={index > 0 && !selections[levels[index - 1]]}
                        >
                            <option value="">{`Select ${level}`}</option>
                            {(filteredOptions[level] || []).map((value, i) => (
                                <option key={`${level}-${value}-${i}`} value={value}>
                                    {value}
                                </option>
                            ))}
                        </select>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MultiLevelDropdown;