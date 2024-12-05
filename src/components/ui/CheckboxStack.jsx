import React from 'react';

const CheckboxStack = ({ label, options }) => {
    return (
        <div className="card m-2">
            <div className="card-body">
                <h6 className="form-label">{label}</h6>
                {options.map((option, index) => (
                    <div className="form-check" key={index}>
                        <input 
                            className="form-check-input" 
                            type="checkbox" 
                            value={option.value} 
                            id={`checkbox-${option.value}`} 
                            checked
                        />
                        <label className="form-check-label" htmlFor={`checkbox-${option.value}`}>
                            {option.label}
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CheckboxStack;