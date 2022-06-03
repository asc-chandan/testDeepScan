import React from 'react';
import './LoaderbyData.scss';

import logoBydataText from '../../images/bydata.svg';
import logoBydataIcon from '../../images/logo-icon.svg';
import logoOrbit from '../../images/logo-icon.gif';

export default function LoaderbyData({ progressPercent }) {
    return (
        <div className="bydata-loader-wrapper">
            <div className="bydata-loader">
                <div className="bydataDiv">
                    <div className="overlay"></div>
                    <img src={logoBydataText} className="bd-logo" alt="bydata text" />
                </div>

                <img src={logoBydataIcon} className="logo-icon-2" alt="bydata icon" />
                <div className="logo-icon">
                    <img src={logoOrbit} alt="bydata orbit" />
                </div>
            </div>
        </div>
    );
};