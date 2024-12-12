import React, {useState} from 'react';

const CheckboxStack = ({ label, options, onChange, singleSelect = false }) => {

    const [selectedOptions, setSelectedOptions] = useState([]);
    
    const handleCheckboxChange = (event) => {
        const {value, checked} = event.target;
        let updatedOptions;
        
        if (checked) {
            updatedOptions =[...selectedOptions, value];
            console.log(`Selected: ${value}`)
        } else {
            updatedOptions = selectedOptions.filter((option) => option !== value);
            console.log (`UnSelected: ${value}`)
        }

        setSelectedOptions(updatedOptions);
        onChange(updatedOptions)
    };

    return (
        <div className="card m-2">
            <div className="card-body">
                <h6 className="form-label">{label}</h6>
                {options.map((option, index) => (
                    <div className="form-check" style={{ overflow: 'hidden' }} key={index}>
                        <input 
                            className="form-check-input" 
                            type="checkbox" 
                            value={option.value} 
                            id={`checkbox-${option.value}`} 
                            onChange= {handleCheckboxChange}
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