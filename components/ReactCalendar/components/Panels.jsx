import React from 'react';
import { isDateEqual, isDateInRange, isDateInBetween, isDateSmaller, isDateGreater } from './utils';
import { IconArrow } from '../components/SvgIcons';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];


const DatePanel = ({ year, month, onDateClick, onMonthBtn, onYearBtn, onPrevMonthBtn, onNextMonthBtn, disable = () => false, selectDate = () => false, rangeStartDate, rangeEndDate, rangeHoverDate, onDateHover = () => { } }) => {
    const firstDay = (new Date(year, month)).getDay(); // btwn 0-6
    const daysInMonth = 32 - new Date(year, month, 32).getDate();

    const getMonthData = () => {
        let data = [[], [], [], [], [], []]; // data will be a 2-D array
        let weekCounter = 0, cellInWeekCounter = 1, dateCounter = 1;

        const prevMonthLastDate = new Date(year, month, 0);

        // FOR FIRST WEEK  
        // Fill the dates of previous month in first row
        while (cellInWeekCounter <= firstDay) {
            const dObj = new Date(year, month - 1, prevMonthLastDate.getDate() - firstDay + cellInWeekCounter);
            data[weekCounter].push({
                date: prevMonthLastDate.getDate() - firstDay + cellInWeekCounter,
                fullDate: [year, month - 1, prevMonthLastDate.getDate() - firstDay + cellInWeekCounter],
                isInView: false,
                disabled: disable(dObj),
                selected: selectDate(dObj),
                rangeSelected: rangeStartDate && rangeEndDate ? isDateInRange(dObj, [rangeStartDate, rangeEndDate]) : false,
                rangeStart: rangeStartDate ? isDateEqual(dObj, rangeStartDate) : false,
                rangeEnd: rangeEndDate ? isDateEqual(dObj, rangeEndDate) : false,
                rangeHover: rangeHoverDate ? isDateInBetween(dObj, [rangeStartDate, rangeHoverDate]) : false,
                rangeHoverStart: (rangeHoverDate && rangeStartDate) ? isDateSmaller(rangeStartDate, rangeHoverDate) ? isDateEqual(rangeStartDate, dObj) : isDateEqual(rangeHoverDate, dObj) : false,
                rangeHoverEnd: (rangeHoverDate && rangeStartDate) ? isDateGreater(rangeStartDate, rangeHoverDate) ? isDateEqual(rangeStartDate, dObj) : isDateEqual(rangeHoverDate, dObj) : false,
            });
            cellInWeekCounter++;
        }
        // Fill the dates of current month in first row
        while (cellInWeekCounter <= 7) {
            const dObj = new Date(year, month, dateCounter);
            data[weekCounter].push({
                date: dateCounter,
                fullDate: [year, month, dateCounter],
                isInView: true,
                disabled: disable(dObj),
                selected: selectDate(dObj),
                rangeSelected: rangeStartDate && rangeEndDate ? isDateInRange(dObj, [rangeStartDate, rangeEndDate]) : false,
                rangeStart: rangeStartDate ? isDateEqual(dObj, rangeStartDate) : false,
                rangeEnd: rangeEndDate ? isDateEqual(dObj, rangeEndDate) : false,
                rangeHover: rangeHoverDate ? isDateInBetween(dObj, [rangeStartDate, rangeHoverDate]) : false,
                rangeHoverStart: (rangeHoverDate && rangeStartDate) ? isDateSmaller(rangeStartDate, rangeHoverDate) ? isDateEqual(rangeStartDate, dObj) : isDateEqual(rangeHoverDate, dObj) : false,
                rangeHoverEnd: (rangeHoverDate && rangeStartDate) ? isDateGreater(rangeStartDate, rangeHoverDate) ? isDateEqual(rangeStartDate, dObj) : isDateEqual(rangeHoverDate, dObj) : false,
            });
            dateCounter++;
            cellInWeekCounter++;
        }
        weekCounter++;
        cellInWeekCounter = 1;

        // FOR 2nd to 6th WEEK, fill the corresponding rows
        while (weekCounter < 6) {
            while (cellInWeekCounter <= 7) {
                if (dateCounter <= daysInMonth) {
                    // for current month dates
                    const dObj = new Date(year, month, dateCounter);
                    data[weekCounter].push({
                        date: dateCounter,
                        fullDate: [year, month, dateCounter],
                        isInView: true,
                        disabled: disable(dObj),
                        selected: selectDate(dObj),
                        rangeSelected: rangeStartDate && rangeEndDate ? isDateInRange(dObj, [rangeStartDate, rangeEndDate]) : false,
                        rangeStart: rangeStartDate ? isDateEqual(dObj, rangeStartDate) : false,
                        rangeEnd: rangeEndDate ? isDateEqual(dObj, rangeEndDate) : false,
                        rangeHover: rangeHoverDate ? isDateInBetween(dObj, [rangeStartDate, rangeHoverDate]) : false,
                        rangeHoverStart: rangeHoverDate && rangeStartDate ? isDateSmaller(rangeStartDate, rangeHoverDate) ? isDateEqual(rangeStartDate, dObj) : isDateEqual(rangeHoverDate, dObj) : false,
                        rangeHoverEnd: (rangeHoverDate && rangeStartDate) ? isDateGreater(rangeStartDate, rangeHoverDate) ? isDateEqual(rangeStartDate, dObj) : isDateEqual(rangeHoverDate, dObj) : false,
                    });
                } else {
                    // for next month dates
                    const dObj = new Date(year, month + 1, dateCounter - daysInMonth);
                    data[weekCounter].push({
                        date: dateCounter - daysInMonth,
                        fullDate: [year, month + 1, dateCounter - daysInMonth],
                        isInView: false,
                        disabled: disable(dObj),
                        selected: selectDate(dObj),
                        rangeSelected: rangeStartDate && rangeEndDate ? isDateInRange(dObj, [rangeStartDate, rangeEndDate]) : false,
                        rangeStart: rangeStartDate ? isDateEqual(dObj, rangeStartDate) : false,
                        rangeEnd: rangeEndDate ? isDateEqual(dObj, rangeEndDate) : false,
                        rangeHover: rangeHoverDate ? isDateInBetween(dObj, [rangeStartDate, rangeHoverDate]) : false,
                        rangeHoverStart: rangeHoverDate && rangeStartDate ? isDateSmaller(rangeStartDate, rangeHoverDate) ? isDateEqual(rangeStartDate, dObj) : isDateEqual(rangeHoverDate, dObj) : false,
                        rangeHoverEnd: (rangeHoverDate && rangeStartDate) ? isDateGreater(rangeStartDate, rangeHoverDate) ? isDateEqual(rangeStartDate, dObj) : isDateEqual(rangeHoverDate, dObj) : false,
                    });
                }

                dateCounter++;
                cellInWeekCounter++;
            }
            cellInWeekCounter = 1;
            weekCounter++;
        }
        return data;
    };

    const data = getMonthData();
    // console.log('Month data', month, data);
    return (
        <div className="asc-picker-date-panel">
            <PanelHeader panel="date" year={year} month={month}
                onPrevBtn={onPrevMonthBtn} onNextBtn={onNextMonthBtn} onMonthBtn={onMonthBtn} onYearBtn={onYearBtn} />
            <div className="asc-picker-body">
                <table className="asc-picker-content">
                    <thead>
                        <tr>
                            {WEEKDAYS.map((w, i) => {
                                return <th key={w + i}>{w}</th>
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((week, weekIndex) => {
                            return <tr key={weekIndex} className="asc-picker-week-row">
                                {week.map((cell, cellIndex) => {
                                    const currDate = new Date(new Date().setHours(0, 0, 0, 0));
                                    const isToday = isDateEqual(currDate, new Date(...cell.fullDate));
                                    const isFirstDay = cell.fullDate[2] === 1;
                                    const isLastDay = cell.fullDate[2] === new Date(cell.fullDate[0], cell.fullDate[1] + 1, 0).getDate();
                                    let className = 'asc-picker-cell' +
                                        (cell.isInView ? ' asc-picker-cell-in-view' : '') +
                                        (cell.disabled ? ' asc-picker-cell-disabled' : '') +
                                        (cell.selected ? ' asc-picker-cell-selected' : '') +
                                        (cell.rangeSelected ? ' asc-picker-cell-range-selected' : '') +
                                        (cell.rangeStart ? ' asc-picker-cell-range-selected-start' : '') +
                                        (cell.rangeEnd ? ' asc-picker-cell-range-selected-end' : '') +
                                        (cell.rangeHover ? ' asc-picker-cell-range-hover' : '') +
                                        (cell.rangeHoverStart ? ' asc-picker-cell-range-hover-start' : '') +
                                        (cell.rangeHoverEnd ? ' asc-picker-cell-range-hover-end' : '') +
                                        (isToday ? ' asc-picker-cell-today' : '') +
                                        (isFirstDay ? ' asc-picker-cell-first-day' : '') +
                                        (isLastDay ? ' asc-picker-cell-last-day' : '');
                                    return <td key={cellIndex} className={className} onClick={() => onDateClick(cell.fullDate)} onMouseEnter={() => onDateHover(new Date(...cell.fullDate))}>
                                        <div className="asc-picker-cell-inner">{cell.date}</div>
                                    </td>
                                })}
                            </tr>
                        })}
                    </tbody>
                </table>
            </div>

        </div>

    );
};


const MonthPanel = ({ year, onMonthClick, onYearBtn, onPrevYearBtn, onNextYearBtn, disable = () => false, selectMonth = () => false, rangeStartDate, rangeEndDate, rangeHoverDate, onDateHover = () => { } }) => {
    const getData = () => {
        let data = [[], [], [], []];
        let monthCounter = 0, quarterCounter = 0;

        while (quarterCounter <= 3) {
            const dObj = new Date(year, monthCounter, 1);
            data[quarterCounter].push({
                month: monthCounter,
                monthName: MONTHS[monthCounter],
                disabled: disable(dObj),
                selected: selectMonth(monthCounter, year),
                rangeSelected: rangeStartDate && rangeEndDate ? isDateInRange(dObj, [rangeStartDate, rangeEndDate]) : false,
                rangeStart: rangeStartDate ? isDateEqual(dObj, rangeStartDate) : false,
                rangeEnd: rangeEndDate ? isDateEqual(dObj, rangeEndDate) : false,
                rangeHover: rangeHoverDate ? isDateInBetween(dObj, [rangeStartDate, rangeHoverDate]) : false,
                rangeHoverStart: (rangeHoverDate && rangeStartDate) ? isDateSmaller(rangeStartDate, rangeHoverDate) ? isDateEqual(rangeStartDate, dObj) : isDateEqual(rangeHoverDate, dObj) : false,
                rangeHoverEnd: (rangeHoverDate && rangeStartDate) ? isDateGreater(rangeStartDate, rangeHoverDate) ? isDateEqual(rangeStartDate, dObj) : isDateEqual(rangeHoverDate, dObj) : false,
            });
            monthCounter++;
            if ((monthCounter) % 3 === 0) {
                quarterCounter++;
            }
        }
        return data;
    };


    const data = getData();


    return (
        <div className="asc-picker-month-panel">
            <PanelHeader panel="month" year={year}
                onYearBtn={onYearBtn}
                onPrevBtn={onPrevYearBtn}
                onNextBtn={onNextYearBtn} />
            <div className="asc-picker-body">
                <table className="asc-picker-content">
                    <tbody>
                        {data.map((quarter, quarterIndex) => {
                            return <tr key={quarterIndex} >
                                {quarter.map((cell, cellIndex) => {
                                    let className = 'asc-picker-cell asc-picker-cell-in-view' +
                                        // (cell.isInView ? ' asc-picker-cell-in-view' : '') +
                                        (cell.disabled ? ' asc-picker-cell-disabled' : '') +
                                        (cell.selected ? ' asc-picker-cell-selected' : '') +
                                        (cell.rangeSelected ? ' asc-picker-cell-range-selected' : '') +
                                        (cell.rangeStart ? ' asc-picker-cell-range-selected-start' : '') +
                                        (cell.rangeEnd ? ' asc-picker-cell-range-selected-end' : '') +
                                        (cell.rangeHover ? ' asc-picker-cell-range-hover' : '') +
                                        (cell.rangeHoverStart ? ' asc-picker-cell-range-hover-start' : '') +
                                        (cell.rangeHoverEnd ? ' asc-picker-cell-range-hover-end' : '');
                                    return <td key={cellIndex} className={className} onClick={() => onMonthClick([year, cell.month])} onMouseEnter={() => onDateHover(new Date(year, cell.month, 1))}>
                                        <div className="asc-picker-cell-inner">{cell.monthName}</div>
                                    </td>
                                })}
                            </tr>
                        })}
                    </tbody>
                </table>
            </div>
        </div>

    );


};

const YearPanel = ({ year, onYearClick, onPrevDecadeBtn, onNextDecadeBtn, disable = () => false, selectYear = () => false, rangeStartDate, rangeEndDate, rangeHoverDate, onDateHover = () => { } }) => {
    const startYear = Math.floor(year / 10) * 10 - 1;
    const getData = () => {
        let data = [[], [], [], []];
        let yearCounter = startYear, rowCounter = 0;

        while (rowCounter <= 3) {
            const dObj = new Date(yearCounter, 0, 1);
            data[rowCounter].push({
                year: yearCounter,
                isInView: yearCounter > startYear && yearCounter <= startYear + 10,
                disabled: disable(dObj),
                selected: selectYear(yearCounter),
                rangeSelected: rangeStartDate && rangeEndDate ? isDateInRange(dObj, [rangeStartDate, rangeEndDate]) : false,
                rangeStart: rangeStartDate ? isDateEqual(dObj, rangeStartDate) : false,
                rangeEnd: rangeEndDate ? isDateEqual(dObj, rangeEndDate) : false,
                rangeHover: rangeHoverDate ? isDateInBetween(dObj, [rangeStartDate, rangeHoverDate]) : false,
                rangeHoverStart: (rangeHoverDate && rangeStartDate) ? isDateSmaller(rangeStartDate, rangeHoverDate) ? isDateEqual(rangeStartDate, dObj) : isDateEqual(rangeHoverDate, dObj) : false,
                rangeHoverEnd: (rangeHoverDate && rangeStartDate) ? isDateGreater(rangeStartDate, rangeHoverDate) ? isDateEqual(rangeStartDate, dObj) : isDateEqual(rangeHoverDate, dObj) : false,
            });
            yearCounter++;
            if (data[rowCounter].length === 3) {
                rowCounter++;
            }
        }
        return data;
    };


    const data = getData();


    return (
        <div className="asc-picker-year-panel">
            <PanelHeader panel="year" year={startYear + 1}
                onPrevBtn={onPrevDecadeBtn}
                onNextBtn={onNextDecadeBtn} />
            <div className="asc-picker-body">
                <table className="asc-picker-content">
                    <tbody >
                        {data.map((row, rowIndex) => {
                            return <tr key={rowIndex} >
                                {row.map((cell, cellIndex) => {
                                    let className = 'asc-picker-cell' +
                                        (cell.isInView ? ' asc-picker-cell-in-view' : '') +
                                        (cell.disabled ? ' asc-picker-cell-disabled' : '') +
                                        (cell.selected ? ' asc-picker-cell-selected' : '') +
                                        (cell.rangeSelected ? ' asc-picker-cell-range-selected' : '') +
                                        (cell.rangeStart ? ' asc-picker-cell-range-selected-start' : '') +
                                        (cell.rangeEnd ? ' asc-picker-cell-range-selected-end' : '') +
                                        (cell.rangeHover ? ' asc-picker-cell-range-hover' : '') +
                                        (cell.rangeHoverStart ? ' asc-picker-cell-range-hover-start' : '') +
                                        (cell.rangeHoverEnd ? ' asc-picker-cell-range-hover-end' : '');
                                    return <td key={cellIndex} className={className} onClick={() => onYearClick([cell.year])} onMouseEnter={() => onDateHover(new Date(cell.year, 0, 1))}>
                                        <div className="asc-picker-cell-inner">{cell.year}</div>
                                    </td>
                                })}
                            </tr>
                        })}
                    </tbody>
                </table>
            </div>
        </div>

    );


};

const QuarterPanel = ({ year, onQuarterClick, onYearBtn, onPrevYearBtn, onNextYearBtn, disable = () => false, selectQuarter = () => false, rangeStartDate, rangeEndDate, rangeHoverDate, onDateHover = () => { } }) => {
    const data = [1, 2, 3, 4].map(q => {
        const dObj = new Date(year, 3 * (q - 1), 1);
        return {
            quarter: 'Q' + q,
            disabled: disable(dObj),
            selected: selectQuarter(q, year),
            rangeSelected: rangeStartDate && rangeEndDate ? isDateInRange(dObj, [rangeStartDate, rangeEndDate]) : false,
            rangeStart: rangeStartDate ? isDateEqual(dObj, rangeStartDate) : false,
            rangeEnd: rangeEndDate ? isDateEqual(dObj, rangeEndDate) : false,
            rangeHover: rangeHoverDate ? isDateInBetween(dObj, [rangeStartDate, rangeHoverDate]) : false,
            rangeHoverStart: (rangeHoverDate && rangeStartDate) ? isDateSmaller(rangeStartDate, rangeHoverDate) ? isDateEqual(rangeStartDate, dObj) : isDateEqual(rangeHoverDate, dObj) : false,
            rangeHoverEnd: (rangeHoverDate && rangeStartDate) ? isDateGreater(rangeStartDate, rangeHoverDate) ? isDateEqual(rangeStartDate, dObj) : isDateEqual(rangeHoverDate, dObj) : false,
        }
    });

    return (
        <div className="asc-picker-quarter-panel">
            <PanelHeader panel="quarter" year={year}
                onYearBtn={onYearBtn}
                onPrevBtn={onPrevYearBtn}
                onNextBtn={onNextYearBtn} />
            <div className="asc-picker-body">
                <table className="asc-picker-content">
                    <tbody >
                        <tr>
                            {data.map((cell, cellIndex) => {
                                let className = 'asc-picker-cell asc-picker-cell-in-view' +
                                    (cell.disabled ? ' asc-picker-cell-disabled' : '') +
                                    (cell.selected ? ' asc-picker-cell-selected' : '') +
                                    (cell.rangeSelected ? ' asc-picker-cell-range-selected' : '') +
                                    (cell.rangeStart ? ' asc-picker-cell-range-selected-start' : '') +
                                    (cell.rangeEnd ? ' asc-picker-cell-range-selected-end' : '') +
                                    (cell.rangeHover ? ' asc-picker-cell-range-hover' : '') +
                                    (cell.rangeHoverStart ? ' asc-picker-cell-range-hover-start' : '') +
                                    (cell.rangeHoverEnd ? ' asc-picker-cell-range-hover-end' : '');
                                return <td key={cellIndex} className={className} onClick={() => onQuarterClick([year, cell.quarter[1]])} onMouseEnter={() => onDateHover(new Date(year, 3 * (cell.quarter[1] - 1), 1))}>
                                    <div className="asc-picker-cell-inner">{cell.quarter}</div>
                                </td>
                            })}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

    );


};

const PanelHeader = ({ panel, month, year, onPrevBtn, onNextBtn, onMonthBtn, onYearBtn }) => {
    const decade = panel === 'year' ? year + '-' + (year + 9) : '';
    return (
        <div className="asc-picker-header">
            <button tabIndex="-1" className="asc-picker-header-prev-btn" onClick={onPrevBtn}>
                <span className="asc-picker-header-prev-icon"><IconArrow /></span>
            </button>
            <div className="asc-picker-header-view">
                {panel === 'date' && <button tabIndex="-1" className="asc-picker-header-month-btn" onClick={onMonthBtn}>{MONTHS[month]}</button>}
                {(panel === 'date' || panel === 'month' || panel === 'quarter') && <button tabIndex="-1" className="asc-picker-header-year-btn" onClick={onYearBtn}>{year}</button>}
                {(panel === 'year') && <span className="asc-picker-header-decade" >{decade}</span>}
            </div>
            <button tabIndex="-1" className="asc-picker-header-next-btn" onClick={onNextBtn}>
                <span className="asc-picker-header-next-icon"><IconArrow /></span>
            </button>
        </div>
    );
};

export { DatePanel, MonthPanel, YearPanel, QuarterPanel };