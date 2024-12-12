import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExpand } from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';

const ExpandButton = ({ onClick }) => {
    return (
        <button 
            className="btn btn-link-hover p-0"
            onClick={onClick}
            aria-label="Expand"
        >
            <FontAwesomeIcon icon={faExpand} className="fa-fw" />
        </button>
    );
};

ExpandButton.propTypes = {
    onClick: PropTypes.func.isRequired
};

export default ExpandButton;
