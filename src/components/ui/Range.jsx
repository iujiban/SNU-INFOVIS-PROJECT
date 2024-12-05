import React, { useState } from 'react';
import { Range as RangeSlider } from 'react-range';

const Range = ({ name, min, max, step }) => {
    const [values, setValues] = useState([min, max]);
    const id = `range-${name.toLowerCase().replace(/\s+/g, '-')}`;
    
    return (
        <div className="card m-2 my-2">
            <div className="card-body">
                <h6 className="form-label" htmlFor={id}>{name}: {values[0]} - {values[1]}</h6>
                <RangeSlider
                    step={step}
                    min={min}
                    max={max}
                    values={values}
                    onChange={setValues}
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
