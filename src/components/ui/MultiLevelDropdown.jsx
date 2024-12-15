import React, { useState, useEffect } from 'react';

const MultiLevelDropdown = ({ label, options, levels, onChange, value }) => {
    const [selections, setSelections] = useState({});
    const [filteredOptions, setFilteredOptions] = useState({});

    // Update selections when value prop changes
    useEffect(() => {
        if (value) {
            setSelections(value);
        } else {
            // Reset selections when value is null
            setSelections({});
        }
    }, [value]);

    // Initialize filtered options for each level
    useEffect(() => {
        const newFilteredOptions = {};

        levels.forEach((level, index) => {
            const key = level.toLowerCase(); // 소문자로 변환하여 일치시킴
            console.log(`현재 레벨: ${level}, 키: ${key}`);

            if (index === 0) {
                newFilteredOptions[level] = Array.from(
                    new Set(options.map(opt => opt[key]))
                ).filter(Boolean).sort();
            } else {
                const filtered = options.filter(opt => {
                    return Object.entries(selections)
                        .filter(([key]) => levels.indexOf(key) < index)
                        .every(([key, value]) => opt[key.toLowerCase()] === value);
                });
                newFilteredOptions[level] = Array.from(
                    new Set(filtered.map(opt => opt[key]))
                ).filter(Boolean).sort();
            }
        });
        console.log("options[0]:", options[0]);
        console.log("options:", options);
        console.log("levels:", levels);
        console.log("Filtered Options:", newFilteredOptions);
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
        <div className="card">
            <div className="card-body d-flex flex-row gap-2 align-items-center">
                <h6 className="form-label mb-0">{label}</h6>
                <div className="d-flex flex-row gap-2 flex-grow-1">
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