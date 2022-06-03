import React from 'react';
// import { drawPieChart } from './ChartsUtils';

class SharedChart extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <div>
                {/* {drawPieChart()} */}
            </div>
        );
        // return (
            // <div dangerouslySetInnerHTML={{ __html: this.chart }}>
            // </div>
        // );
    }
}

export default SharedChart;