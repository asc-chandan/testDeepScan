import React from 'react';
import './ReactCheckbox.scss';
import PropTypes from 'prop-types';

const Checkbox = (props) => {
    const { label, uniqueHtmlForKey, ...rest } = props;
    return (
        <div className="asc-checkbox" >
            <input type="checkbox" id={uniqueHtmlForKey} {...rest} />
            <label htmlFor={uniqueHtmlForKey}>{label}</label>
        </div>
    );
};

Checkbox.propTypes = {
    label: PropTypes.string.isRequired,
    uniqueHtmlForKey: PropTypes.string.isRequired,
    checked: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired
};

export { Checkbox };