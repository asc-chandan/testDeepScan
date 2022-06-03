import React, { useContext } from 'react';
import './ReactRadio.scss';

import PropTypes from 'prop-types';


const RadioGroup = ({ name, selectedValue, onChange, ...rest }) => {

    const children = rest.children;
    return (
        <RadioGroupContext.Provider value={{ name, onChange, selectedValue }}>
            <div className="asc-radio-grp" role="radiogroup">
                {children}
            </div>
        </RadioGroupContext.Provider>
    );
};

const Radio = (props) => {

    const { name, selectedValue, onChange } = useContext(RadioGroupContext);

    const { label, value, uniqueHtmlForKey, ...rest } = props;
    const checked = selectedValue === value;

    return (
        <div className="asc-radio" >
            <input type="radio" id={uniqueHtmlForKey} {...{ ...rest,value, onChange, name, checked }} />
            <label htmlFor={uniqueHtmlForKey}>
                {label}
            </label>
        </div>
    );
};


const RadioGroupContext = React.createContext(null);

RadioGroupContext.propTypes = {
    name: PropTypes.string.isRequired,
    selectedValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    onChange: PropTypes.func.isRequired
};

Radio.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    uniqueHtmlForKey: PropTypes.string.isRequired
};

export { Radio, RadioGroup };
