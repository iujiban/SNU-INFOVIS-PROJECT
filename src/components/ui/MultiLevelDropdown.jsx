import React, { useState, useEffect } from 'react';

const MultiLevelDropdown = ({ label, options, levels, onChange }) => {
    const [selections, setSelections] = useState({});
    const [filteredOptions, setFilteredOptions] = useState({});
    
    // Initialize filtered options for each level
    useEffect(() => {
        const newFilteredOptions = {};
        
        levels.forEach((level, index) => {
            if (index === 0) {
                // First level shows unique values
                newFilteredOptions[level] = [...new Set(options.map(opt => opt[level]))];
            } else {
                // Other levels are filtered based on previous selections
                const filtered = options.filter(opt => {
                    return Object.entries(selections)
                        .filter(([key]) => levels.indexOf(key) < index)
                        .every(([key, value]) => opt[key] === value);
                });
                newFilteredOptions[level] = [...new Set(filtered.map(opt => opt[level]))];
            }
        });
        
        setFilteredOptions(newFilteredOptions);
    }, [options, levels, selections]);

    const handleChange = (level, value) => {
        const levelIndex = levels.indexOf(level);
        const newSelections = {
            ...selections,
            [level]: value
        };
        
        // Clear subsequent selections
        levels.slice(levelIndex + 1).forEach(nextLevel => {
            delete newSelections[nextLevel];
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
                    value={selections[level] || ''} // Fallback to empty string
                    onChange={(e) => handleChange(level, e.target.value)}
                    disabled={index > 0 && !selections[levels[index - 1]]} // Disable if no parent is selected
                >
                    <option value="">{`Select ${level}`}</option>
                    {filteredOptions[level]?.map((value, i) => (
                        <option key={i} value={value || ''}>{value || `Select ${level}`}</option> // Fallback value
                    ))}
                </select>
                ))}
            </div>
        </div>
    </div>
);
};

export default MultiLevelDropdown;