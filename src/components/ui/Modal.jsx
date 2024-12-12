import React from 'react';
import PropTypes from 'prop-types';

const Modal = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;

    return (
        <>
            <div className="modal fade show" 
                style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
                onClick={onClose}
            >
                <div className="modal-dialog modal-dialog-centered modal-xl"
                    style={{ maxWidth: '98%', margin: '10px auto' }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{title}</h5>
                            <button type="button" 
                                className="btn-close" 
                                onClick={onClose}
                                aria-label="Close"
                            />
                        </div>
                        <div className="modal-body p-0">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

Modal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
    title: PropTypes.string.isRequired
};

export default Modal;
