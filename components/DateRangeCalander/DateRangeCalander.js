import React from 'react';
import { DateRangePicker, createStaticRanges } from 'react-date-range';
import { addDays, endOfDay, startOfDay, startOfMonth, endOfMonth, addMonths, startOfWeek, endOfWeek } from 'date-fns';
import './DateRangeCalander.scss';

const defineds = {
    startOfWeek: startOfWeek(new Date()),
    endOfWeek: endOfWeek(new Date()),
    startOfLastWeek: startOfWeek(addDays(new Date(), -7)),
    endOfLastWeek: endOfWeek(addDays(new Date(), -7)),
    startOfToday: startOfDay(new Date()),
    endOfToday: endOfDay(new Date()),
    startOfYesterday: startOfDay(addDays(new Date(), -1)),
    endOfYesterday: endOfDay(addDays(new Date(), -1)),
    startOfMonth: startOfMonth(new Date()),
    endOfMonth: endOfMonth(new Date()),
    startOfLastMonth: startOfMonth(addMonths(new Date(), -1)),
    endOfLastMonth: endOfMonth(addMonths(new Date(), -1)),
};

export default class DateRangeCalander extends React.Component {

    constructor(props) {
        super(props);
        const datesAvailableInProps = props.dateRange && props.dateRange.startDate && props.dateRange.endDate;
        this.state = {
            startDate: datesAvailableInProps ? props.dateRange.startDate : new Date(),
            endDate: datesAvailableInProps ? props.dateRange.endDate : new Date(),
            lastUpdatedDate: (props.lastUpdatedDate!==undefined ? props.lastUpdatedDate : new Date())
        };

        this.selfDOMRef = React.createRef();
        this.cachedPositionStyles = null;

        this.handleDateSelect = this.handleDateSelect.bind(this);
        this.outsideClickListener = this.outsideClickListener.bind(this);
        this.onCancelBtn = this.onCancelBtn.bind(this);
        this.onApplyBtn = this.onApplyBtn.bind(this);

        this.defaultStaticRanges = createStaticRanges([
            // { label: 'Last 7 Days', range: () => ({ startDate: addDays(this.props.dateRange.endDate, -6), endDate: this.props.dateRange.endDate }) },
            // { label: 'Last 30 Days', range: () => ({ startDate: addDays(this.props.dateRange.endDate, -29), endDate: this.props.dateRange.endDate }) },
            // { label: 'This Month', range: () => ({ startDate: defineds.startOfMonth, endDate: (this.props.dateRange.endDate) ? this.props.dateRange.endDate : defineds.endOfMonth }) },
            { label: 'Last 7 Days', range: () => ({ startDate: addDays(this.state.lastUpdatedDate, -6), endDate: this.state.lastUpdatedDate }) },
            { label: 'Last 30 Days', range: () => ({ startDate: addDays(this.state.lastUpdatedDate, -29), endDate: this.state.lastUpdatedDate }) },
            // { label: 'This Month', range: () => ({ startDate: defineds.startOfMonth, endDate: defineds.endOfMonth }) },
            { label: 'This Month', range: () => ({ startDate: defineds.startOfMonth, endDate: this.state.lastUpdatedDate }) },
            { label: 'Last Month', range: () => ({ startDate: defineds.startOfLastMonth, endDate: defineds.endOfLastMonth }) }
        ]);
    }

    componentDidMount() {
        // DOM is available now, force update so that position of the component gets calculated
        this.forceUpdate();
        // register click listener to close the self when clicked outside itself's boundary
        document.addEventListener('click', this.outsideClickListener);
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.outsideClickListener);
    }


    componentDidUpdate(prev_props) {
        if( (this.props.client.id!==undefined && this.props.client.id!==prev_props.client.id) ||
            (this.props.view_type!==undefined && this.props.view_type!=='' && prev_props.view_type!==this.props.view_type) ||
            (this.props.dateRange.startDate!==undefined && this.props.dateRange.startDate!=='' && prev_props.dateRange.startDate!==this.props.dateRange.startDate) ||
            (this.props.dateRange.endDate!==undefined && this.props.dateRange.endDate!=='' && prev_props.dateRange.endDate!==this.props.dateRange.endDate) 
        ){
            const datesAvailableInProps = this.props.dateRange && this.props.dateRange.startDate && this.props.dateRange.endDate;
            this.setState({
                startDate: datesAvailableInProps ? this.props.dateRange.startDate : new Date(),
                endDate: datesAvailableInProps ? this.props.dateRange.endDate : new Date(),
                lastUpdatedDate: (this.props.lastUpdatedDate!==undefined ? this.props.lastUpdatedDate : new Date())
            });
        }
    }

    outsideClickListener(e) {
        if (this.isClickedOutside(e)) {
            this.onCancelBtn();
        }
    }

    isClickedOutside(e) {
        if(this.selfDOMRef.current && !this.selfDOMRef.current.contains(e.target)){
            return true;
        }
        return false;
    }

    handleDateSelect(ranges) {
        // console.log('---');
        // console.log(ranges);

        this.setState({
            startDate: ranges.selection.startDate,
            endDate: ranges.selection.endDate,
            lastUpdatedDate: this.props.lastUpdatedDate
        });

        setTimeout(() => {
            this.defaultStaticRanges = createStaticRanges([
                { label: 'Last 7 Days', range: () => ({ startDate: addDays(this.state.lastUpdatedDate, -6), endDate: this.state.lastUpdatedDate }) },
                { label: 'Last 30 Days', range: () => ({ startDate: addDays(this.state.lastUpdatedDate, -29), endDate: this.state.lastUpdatedDate }) },
                { label: 'This Month', range: () => ({ startDate: defineds.startOfMonth, endDate: this.state.lastUpdatedDate }) },
                // { label: 'This Month', range: () => ({ startDate: defineds.startOfMonth, endDate: defineds.endOfMonth }) },
                { label: 'Last Month', range: () => ({ startDate: defineds.startOfLastMonth, endDate: defineds.endOfLastMonth }) }
            ]);
    
            //Trigger Apply Button - if apply/cancel button is not displayed
            if(this.props.showApplyCancelButtons==='false'){
                setTimeout(() => {
                    this.props.onSelect(this.state);
                },0);
            }
        },10);
        
    }

    onCancelBtn() {
        this.props.onCancel();
    }

    onApplyBtn() {
        // console.log('print period');
        // console.log(this.state);

        this.props.onSelect(this.state);
    }

    givePositionStyle() {
        if (this.cachedPositionStyles) {
            return this.cachedPositionStyles;
        }
        const styles = {};

        if (this.selfDOMRef.current) {
            const parent = this.selfDOMRef.current.parentElement;
            const parentRect = parent.getBoundingClientRect();
            
            // decide vertical position 
            const windowHeight = window.innerHeight;
            // const selfHeight = 420;
            const selfHeight = 220;
            const parentBottomPos = parentRect.bottom;

            if(this.props.position!==undefined && this.props.position==='fixed'){
                //Do Nothing
            } else {
                if ((windowHeight - parentBottomPos) > selfHeight - 100) {
                    styles.top = 'calc(100% + 5px)';
                } else {
                    styles.bottom = 'calc(100% + 5px)';
                }
    
                // decide horizontal position
                const pw = parentRect.width;
                const sw = this.selfDOMRef.current.offsetWidth;
                const toLeft = sw / 2 - pw / 2;
                const toRight = toLeft;
                const leftNavbarOffset = 50;
    
                if (parentRect.left > (toLeft + leftNavbarOffset) && (window.innerWidth - parentRect.right) > toRight) {
                    // console.log('both sides available');
                    // styles.left = `${-toLeft}px`;
                    styles.left = '0px';
                } else if (parentRect.left > (toLeft + leftNavbarOffset) && (window.innerWidth - parentRect.right) < toRight) {
                    // console.log('only left sides available');
                    styles.right = `${-(window.innerWidth - parentRect.right) + 20}px`;
                } else {
                    // console.log('only right sides available');
                    // styles.left = `${-parentRect.left + 50}px`;
                    styles.left = '0px';
                }
            }

            this.cachedPositionStyles = styles;
        }
        return styles;
    }

    render(){
        const styles = this.givePositionStyle();
        const selectionRange = {
            startDate: this.state.startDate,
            endDate: this.state.endDate,
            key: 'selection',
        };

        if(this.props.lastUpdatedDate==='') return false;

        //Set minimum date
        let minDate = (new Date('Fri Jan 01 2010 00:00:00 GMT+0530 (India Standard Time)'));
        
        return (
            <div className="date-range-picker-wrapper" ref={this.selfDOMRef} style={styles}>
                <div className="date-range-picker">
                    <DateRangePicker
                        ranges={[selectionRange]}
                        onChange={this.handleDateSelect}
                        showSelectionPreview={true}
                        moveRangeOnFirstSelection={false}
                        months={2}
                        direction="horizontal"
                        rangeColors={['#004ed8']}
                        // fixedHeight={true}
                        staticRanges = {this.defaultStaticRanges}
                        weekdayDisplayFormat="EEEEE"
                        minDate={minDate}
                        maxDate={this.props.lastUpdatedDate}
                    />
                </div>

                {this.props.showApplyCancelButtons!=='false' &&
                    <div className="action-buttons">
                        <button className="button cancel" onClick={this.onCancelBtn}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><title>s remove</title>
                                <g className="nc-icon-wrapper" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" fill="#ed3833" stroke="#ed3833">
                                    <line data-color="color-2" x1="22" y1="10" x2="10" y2="22" fill="none" strokeMiterlimit="10"/> 
                                    <line data-color="color-2" x1="22" y1="22" x2="10" y2="10" fill="none" strokeMiterlimit="10"/> 
                                    <rect x="2" y="2" width="28" height="28" fill="none" stroke="#000000" strokeMiterlimit="10"/>
                                </g>
                            </svg>
                        </button>
                        <button className="button apply" onClick={this.onApplyBtn}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><title>i check</title>
                                <g className="nc-icon-wrapper" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" fill="#66da38" stroke="#66da38">
                                    <rect x="2" y="2" width="28" height="28" fill="none" stroke="#000000" strokeMiterlimit="10"/> 
                                    <polyline data-color="color-2" points="9 17 13 21 23 11" fill="none" strokeMiterlimit="10"/>
                                </g>
                            </svg>
                        </button>
                    </div>
                }
            </div>
        );
    }
}
