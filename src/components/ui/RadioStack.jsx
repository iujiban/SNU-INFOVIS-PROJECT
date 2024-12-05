import React from 'react';

const RadioStack = ({ label, options, name }) => {
    return (
        <div className="card m-2">
            <div className="card-body">
                <h6 className="form-label">{label}</h6>
                {options.map((option, index) => (
                    <div className="form-check" key={index}>
                        <input 
                            className="form-check-input" 
                            type="radio"
                            name={name}
                            value={option.value} 
                            id={`radio-${option.value}`} 
                            {...(index === 0 ? { checked: true } : {})}
                        />
                        <label className="form-check-label" htmlFor={`radio-${option.value}`}>
                            {option.label}
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RadioStack;
