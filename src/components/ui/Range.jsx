import React, { useState } from 'react';
import { Range as RangeSlider } from 'react-range';

const Range = ({ name, min, max, step, onChange }) => {
    const [values, setValues] = useState([min, max]);
    const id = `range-${name.toLowerCase().replace(/\s+/g, '-')}`;

    const handleChange = (newValues) => {
        setValues(newValues);
        if (onChange) {
            onChange(newValues);
        }
    };
    
    return (
        <div className="card m-2 my-2">
            <div className="card-body">
                <h6 className="form-label d-flex justify-content-between align-items-center" htmlFor={id}>
                    <span>{name}:</span>
                    <span className="fw-normal">{values[0]} - {values[1]}</span>
                </h6>
                <RangeSlider
                    step={step}
                    min={min}
                    max={max}
                    values={values}
                    onChange={handleChange}
                    renderTrack={({ props, children, isDragged }) => (
                        <div
                            {...props}
                            style={{
                                ...props.style,
                                height: '6px',
                                width: '100%',
                                backgroundColor: '#ddd',
                                position: 'relative'
                            }}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    height: '100%',
                                    left: `${(values[0] - min) / (max - min) * 100}%`,
                                    right: `${100 - (values[1] - min) / (max - min) * 100}%`,
                                    backgroundColor: '#007bff'
                                }}
                            />
                            {children}
                        </div>
                    )}
                    renderThumb={({ props }) => (
                        <div
                            {...props}
                            style={{
                                ...props.style,
                                height: '16px',
                                width: '16px',
                                borderRadius: '50%',
                                backgroundColor: '#007bff'
                            }}
                        />
                    )}
                />
            </div>
        </div>
    );
};

export default Range;
