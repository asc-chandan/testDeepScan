import React from 'react';
import DateRangeCalander from '../DateRangeCalander/DateRangeCalander';
import { format } from 'date-fns'

import './DateRangeSelector.scss';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file

export default class DateRangeSelector extends React.Component {
    constructor(props) {
        super(props);
        // props shud have dateRange = { startDate : new Date(), endDate : new Date()}
        this.state = {
            showCalendar: false
        };

        this.selectBtnRef = React.createRef();
        this.openCalender = this.openCalender.bind(this);
        this.closeCalander = this.closeCalander.bind(this);
        this.onDateSelect = this.onDateSelect.bind(this);
    }

    openCalender() {
        if (!this.state.showCalendar) {
            this.setState({ showCalendar: true });
        }
    }

    closeCalander() {
        this.setState({ showCalendar: false });
    }

    onDateSelect(dates) {
        if(this.props.showApplyCancelButtons!=='false'){ //for datatrend 
            this.closeCalander();
        }
        this.props.onSelect(dates);
    }

    render() {
        const dateText = this.props.dateRange && this.props.dateRange.startDate && this.props.dateRange.endDate ?
            `${format(this.props.dateRange.startDate, 'MM/dd/yyyy')} - ${format(this.props.dateRange.endDate, 'MM/dd/yyyy')}` : 'Date';

        const position = (this.props.position!==undefined || this.props.position==='') ? this.props.position : '';

        let DateRangePicker;
        if(this.props.view_type!==undefined || this.props.view_type!==''){
            DateRangePicker = <DateRangeCalander dateRange={this.props.dateRange || null}
                onCancel={this.closeCalander}
                onSelect={this.onDateSelect}
                showApplyCancelButtons={this.props.showApplyCancelButtons}
                position={position}
                lastUpdatedDate={this.props.lastUpdatedDate}
                client={this.props.client}
                view_type={this.props.view_type}
            />
        } else {
            DateRangePicker = <DateRangeCalander dateRange={this.props.dateRange || null}
                onCancel={this.closeCalander}
                onSelect={this.onDateSelect}
                showApplyCancelButtons={this.props.showApplyCancelButtons}
                position={position}
                lastUpdatedDate={this.props.lastUpdatedDate}
                client={this.props.client}
            />
        }

        return (
            <div className="date-range-selector">
                <div className="select-btn" ref={this.selectBtnRef} onClick={this.openCalender}>
                    <div className="text">{dateText}</div>
                    <div className="dropdown-icon"></div>
                </div>
                {(this.state.showCalendar || (this.props.showByDefault!==undefined && this.props.showByDefault)) &&
                    DateRangePicker
                }
            </div>
        );
    }
}
