import React from 'react';
import { isDateEqual, isDateInRange, isDateInBetween, isDateSmaller, isDateGreater, giveNextNthDate, giveEndDateOfNextNthMonth, giveEndDateOfNextNthYear, giveEndDateOfNextNthQuarter, giveQuarterFromMonth, giveDaysCountInRange, giveMonthsCountInRange, giveYearsCountInRange, giveQuartersCountInRange } from './utils';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
// const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**Gives the lighten version of given color */
const ColorLuminance = (hex, lum) => {

    // validate hex string
    hex = String(hex).replace(/[^0-9a-f]/gi, '');
    if (hex.length < 6) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    lum = lum || 0;

    // convert to decimal and change luminosity
    var rgb = "#", c, i;
    for (i = 0; i < 3; i++) {
        c = parseInt(hex.substr(i * 2, 2), 16);
        c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
        rgb += ("00" + c).substr(c.length);
    }

    return rgb;
}


const getColorOfStartOrEnd = (dObj, ranges, type = 'bg') => {
    let matchedRangeIndex;
    for (let i = 0; i < ranges.length; i++) {
        if ((ranges[i][0] && isDateEqual(dObj, ranges[i][0])) || (ranges[i][1] && isDateEqual(dObj, ranges[i][1]))) {
            matchedRangeIndex = i;
            break;
        }
    }

    if (type === 'color') { return ranges[matchedRangeIndex][3]; }
    return ranges[matchedRangeIndex][2];
};

const getColorOfSelected = (dObj, ranges, type = 'bg') => {
    let matchedRangeIndex;
    for (let i = 0; i < ranges.length; i++) {
        if (ranges[i][0] && ranges[i][1] && isDateInRange(dObj, ranges[i])) {
            matchedRangeIndex = i;
            break;
        }
    }

    if (type === 'color') { return ColorLuminance(ranges[matchedRangeIndex][3], 0.8); }
    return ColorLuminance(ranges[matchedRangeIndex][2], 0.8);
};

const giveProposedEndDate = (pickerType, startDate, gap) => {
    if (pickerType === 'date') return giveNextNthDate(startDate, gap - 1);
    if (pickerType === 'month') return giveEndDateOfNextNthMonth(startDate, gap - 1);
    if (pickerType === 'year') return giveEndDateOfNextNthYear(startDate, gap - 1);
    return giveEndDateOfNextNthQuarter(startDate, gap - 1);
};

const giveFirstDate = (pickerType, date) => {
    if (pickerType === 'date') return date;
    if (pickerType === 'month') return new Date(date.getFullYear(), date.getMonth(), 1);
    if (pickerType === 'year') return new Date(date.getFullYear(), 0, 1);
    return new Date(date.getFullYear(), 3 * (giveQuarterFromMonth(date.getMonth()) - 1), 1);
};

//Used for applying classes on First and last cell(2nd cell) when a selected range has only 2 adjacent cells
const getRangeOfStartOrEnd = (dObj, ranges) => {
    let matchedRangeIndex;
    for (let i = 0; i < ranges.length; i++) {
        if ((ranges[i][0] && isDateEqual(dObj, ranges[i][0])) || (ranges[i][1] && isDateEqual(dObj, ranges[i][1]))) {
            matchedRangeIndex = i;
            break;
        }
    }
    return ranges[matchedRangeIndex];
};

const isDateInRangeOfAny = (dObj, ranges) => {
    // console.log('isDateInRangeOfAny', dObj,ranges);
    let isInRangeOfAny = false;
    for (let i = 0; i < ranges.length; i++) {
        if (ranges[i][0] && ranges[i][1] && isDateInRange(dObj, ranges[i])) {
            isInRangeOfAny = true;
            break;
        }
    }
    return isInRangeOfAny;
};

const isDateStartOfAny = (dObj, ranges) => {
    let isStartOfAny = false;
    for (let i = 0; i < ranges.length; i++) {
        if (ranges[i][0] && isDateEqual(dObj, ranges[i][0])) {
            isStartOfAny = true;
            break;
        }
    }
    return isStartOfAny;
};

const isDateEndOfAny = (dObj, ranges) => {
    let isEndOfAny = false;
    for (let i = 0; i < ranges.length; i++) {
        if (ranges[i][1] && isDateEqual(dObj, ranges[i][1])) {
            isEndOfAny = true;
            break;
        }
    }
    return isEndOfAny;
};

const isDateHovered = (dObj, ranges, currentRangeIndex, currentRangeDateType, rangeHoverDate, hoverRangeForNonBenchmarkRanges, pickerType) => {

    // check for not any date input focused for selection
    if (currentRangeIndex === null) return false;

    const strt = ranges[currentRangeIndex][0];
    const end = ranges[currentRangeIndex][1];
    if (strt && end) {
        if (currentRangeDateType === 'start' && (isDateSmaller(rangeHoverDate, strt) || isDateEqual(rangeHoverDate, strt))) {
            return isDateInBetween(dObj, [rangeHoverDate, strt]);
        } else if (currentRangeDateType === 'end') {
            // Special treatment for end date, normalize the date `end` to 1st date so that comparision can be done with dObj(which always have 1st date)
            const endWithFirstDate = giveFirstDate(pickerType, end);
            if (isDateGreater(rangeHoverDate, endWithFirstDate) || isDateEqual(rangeHoverDate, endWithFirstDate)) {
                return isDateInBetween(dObj, [endWithFirstDate, rangeHoverDate]);
            }
        }
        return false;
    }
    if (strt && !end) {
        // This condition only runs for 1st range (currentRangeIndex = 0)
        return isDateInBetween(dObj, [strt, rangeHoverDate]);
    }
    if (!strt && !end && currentRangeIndex > 0) {
        let proposedEndDate = giveProposedEndDate(pickerType, rangeHoverDate, hoverRangeForNonBenchmarkRanges);
        // for comparision with dObj, use the `proposedEndDate` with 1st date 
        proposedEndDate = giveFirstDate(pickerType, proposedEndDate);
        return isDateInBetween(dObj, [rangeHoverDate, proposedEndDate]);
    }
    return false;
};
const isDateHoveredStart = (dObj, ranges, currentRangeIndex, currentRangeDateType, rangeHoverDate, hoverRangeForNonBenchmarkRanges, pickerType) => {

    if (currentRangeIndex === null) return false;

    const strt = ranges[currentRangeIndex][0];
    const end = ranges[currentRangeIndex][1];
    if (strt && end) {
        if (currentRangeDateType === 'start' && (isDateSmaller(rangeHoverDate, strt) || isDateEqual(rangeHoverDate, strt))) {
            return isDateEqual(dObj, rangeHoverDate);
        } else if (currentRangeDateType === 'end') {
            // Special treatment for end date, normalize the date `end` to 1st date so that comparision can be done with dObj(which always have 1st date)
            const endWithFirstDate = giveFirstDate(pickerType, end);
            if (isDateGreater(rangeHoverDate, endWithFirstDate) || isDateEqual(rangeHoverDate, endWithFirstDate)) {
                return isDateEqual(dObj, endWithFirstDate);
            }
        }
        return false;
    }
    if (strt && !end) {
        // This condition only runs for 1st range (currentRangeIndex = 0)
        return isDateSmaller(strt, rangeHoverDate) ? isDateEqual(strt, dObj) : isDateEqual(rangeHoverDate, dObj);
    }
    if (!strt && !end && currentRangeIndex > 0) {
        // This condition only runs for 1st range (currentRangeIndex = 0)
        return isDateEqual(dObj, rangeHoverDate);
    }
};
const isDateHoveredEnd = (dObj, ranges, currentRangeIndex, currentRangeDateType, rangeHoverDate, hoverRangeForNonBenchmarkRanges, pickerType) => {

    if (currentRangeIndex === null) return false;

    const strt = ranges[currentRangeIndex][0];
    const end = ranges[currentRangeIndex][1];
    if (strt && end) {
        if (currentRangeDateType === 'start' && (isDateSmaller(rangeHoverDate, strt) || isDateEqual(rangeHoverDate, strt))) {
            return isDateEqual(dObj, end);
        } else if (currentRangeDateType === 'end' && (isDateGreater(rangeHoverDate, end) || isDateEqual(rangeHoverDate, end))) {
            return isDateEqual(dObj, rangeHoverDate);
        }
        return false;
    }
    if (strt && !end) {
        return isDateSmaller(strt, rangeHoverDate) ? isDateEqual(dObj, rangeHoverDate) : isDateEqual(dObj, strt);
    }
    if (!strt && !end && currentRangeIndex > 0) {
        let proposedEndDate = giveProposedEndDate(pickerType, rangeHoverDate, hoverRangeForNonBenchmarkRanges);
        proposedEndDate = giveFirstDate(pickerType, proposedEndDate);
        return isDateEqual(dObj, proposedEndDate);
    }
};

const isDateSelectedForEdit = (dObj, ranges, currentRangeIndex, currentRangeDateType) => {
    let toEdit = false;
    for (let i = 0; i < ranges.length; i++) {
        if (i === currentRangeIndex && ranges[i][0] && ranges[i][1]) {
            if ((currentRangeDateType === 'start' && isDateEqual(dObj, ranges[i][0])) || (currentRangeDateType === 'end' && isDateEqual(dObj, ranges[i][1]))) {
                toEdit = true;
                break;
            }
        }
    }
    return toEdit;
};


const DatePanel = ({ year, month, onDateClick, onMonthBtn, onYearBtn, onPrevMonthBtn, onNextMonthBtn, disable = () => false, ranges, currentRangeIndex, currentRangeDateType, hoverRangeForNonBenchmarkRanges, rangeHoverDate, onDateHover = () => { } }) => {


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
                rangeSelected: isDateInRangeOfAny(dObj, ranges),
                rangeStart: isDateStartOfAny(dObj, ranges),
                rangeEnd: isDateEndOfAny(dObj, ranges),

                rangeHover: rangeHoverDate ? isDateHovered(dObj, ranges, currentRangeIndex, currentRangeDateType, rangeHoverDate, hoverRangeForNonBenchmarkRanges, 'date') : false,
                rangeHoverStart: rangeHoverDate ? isDateHoveredStart(dObj, ranges, currentRangeIndex, currentRangeDateType, rangeHoverDate, hoverRangeForNonBenchmarkRanges, 'date') : false,
                rangeHoverEnd: rangeHoverDate ? isDateHoveredEnd(dObj, ranges, currentRangeIndex, currentRangeDateType, rangeHoverDate, hoverRangeForNonBenchmarkRanges, 'date') : false,
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
                rangeSelected: isDateInRangeOfAny(dObj, ranges),
                rangeStart: isDateStartOfAny(dObj, ranges),
                rangeEnd: isDateEndOfAny(dObj, ranges),

                rangeHover: rangeHoverDate ? isDateHovered(dObj, ranges, currentRangeIndex, currentRangeDateType, rangeHoverDate, hoverRangeForNonBenchmarkRanges, 'date') : false,
                rangeHoverStart: rangeHoverDate ? isDateHoveredStart(dObj, ranges, currentRangeIndex, currentRangeDateType, rangeHoverDate, hoverRangeForNonBenchmarkRanges, 'date') : false,
                rangeHoverEnd: rangeHoverDate ? isDateHoveredEnd(dObj, ranges, currentRangeIndex, currentRangeDateType, rangeHoverDate, hoverRangeForNonBenchmarkRanges, 'date') : false,
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
                        rangeSelected: isDateInRangeOfAny(dObj, ranges),
                        rangeStart: isDateStartOfAny(dObj, ranges),
                        rangeEnd: isDateEndOfAny(dObj, ranges),

                        rangeHover: rangeHoverDate ? isDateHovered(dObj, ranges, currentRangeIndex, currentRangeDateType, rangeHoverDate, hoverRangeForNonBenchmarkRanges, 'date') : false,
                        rangeHoverStart: rangeHoverDate ? isDateHoveredStart(dObj, ranges, currentRangeIndex, currentRangeDateType, rangeHoverDate, hoverRangeForNonBenchmarkRanges, 'date') : false,
                        rangeHoverEnd: rangeHoverDate ? isDateHoveredEnd(dObj, ranges, currentRangeIndex, currentRangeDateType, rangeHoverDate, hoverRangeForNonBenchmarkRanges, 'date') : false,
                    });
                } else {
                    // for next month dates
                    const dObj = new Date(year, month + 1, dateCounter - daysInMonth);
                    data[weekCounter].push({
                        date: dateCounter - daysInMonth,
                        fullDate: [year, month + 1, dateCounter - daysInMonth],
                        isInView: false,
                        disabled: disable(dObj),
                        rangeSelected: isDateInRangeOfAny(dObj, ranges),
                        rangeStart: isDateStartOfAny(dObj, ranges),
                        rangeEnd: isDateEndOfAny(dObj, ranges),

                        rangeHover: rangeHoverDate ? isDateHovered(dObj, ranges, currentRangeIndex, currentRangeDateType, rangeHoverDate, hoverRangeForNonBenchmarkRanges, 'date') : false,
                        rangeHoverStart: rangeHoverDate ? isDateHoveredStart(dObj, ranges, currentRangeIndex, currentRangeDateType, rangeHoverDate, hoverRangeForNonBenchmarkRanges, 'date') : false,
                        rangeHoverEnd: rangeHoverDate ? isDateHoveredEnd(dObj, ranges, currentRangeIndex, currentRangeDateType, rangeHoverDate, hoverRangeForNonBenchmarkRanges, 'date') : false,
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
                    <thead >
                        <tr>
                            {WEEKDAYS.map((w, i) => {
                                return <th key={i}>{w}</th>
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
                                    // let colorRangeSelected = cell.rangeSelected && cell.isInView ? getColorOfSelected(new Date(...cell.fullDate), ranges) : '';
                                    let colorRangeSelected = cell.rangeSelected && cell.isInView ? '#fff' : '';
                                    if ((cell.rangeStart || cell.rangeEnd) && cell.isInView) {
                                        colorRangeSelected = getColorOfStartOrEnd(new Date(...cell.fullDate), ranges);
                                    }

                                    const colorRangeStartOrEnd = (cell.rangeStart || cell.rangeEnd) && cell.isInView ? getColorOfStartOrEnd(new Date(...cell.fullDate), ranges) : '';
                                    const fontColorRangeStartOrEnd = (cell.rangeStart || cell.rangeEnd) && cell.isInView ? getColorOfStartOrEnd(new Date(...cell.fullDate), ranges, 'color') : '';
                                    const colorHoverBorder = currentRangeIndex !== null ? ranges[currentRangeIndex][2] : '';
                                    const isSelectedForExtendingRange = (cell.rangeStart || cell.rangeEnd) ? isDateSelectedForEdit(new Date(...cell.fullDate), ranges, currentRangeIndex, currentRangeDateType) : false;
                                    // special case when a range has only two adjacent date/momth/year/quarter, in this case to show the white space btwn these 2 cells, we need to add white borders(right of 1st cell and left of 2nd)
                                    let range, isStartOneWhenRangeHasOnlyTwo = false, isEndOneWhenRangeHasOnlyTwo = false;
                                    if (cell.rangeStart || cell.rangeEnd) {
                                        range = getRangeOfStartOrEnd(new Date(...cell.fullDate), ranges);
                                        isStartOneWhenRangeHasOnlyTwo = cell.rangeStart && range[0] && range[1] && giveDaysCountInRange(range[0], range[1]) === 2;
                                        isEndOneWhenRangeHasOnlyTwo = cell.rangeEnd && range[0] && range[1] && giveDaysCountInRange(range[0], range[1]) === 2;
                                    }

                                    let className = 'asc-picker-cell' +
                                        (cell.isInView ? ' asc-picker-cell-in-view' : '') +
                                        (cell.disabled ? ' asc-picker-cell-disabled' : '') +
                                        (cell.rangeSelected ? ' asc-picker-cell-range-selected' : '') +
                                        (cell.rangeStart ? ' asc-picker-cell-range-selected-start' : '') +
                                        (cell.rangeEnd ? ' asc-picker-cell-range-selected-end' : '') +
                                        (cell.rangeHover ? ' asc-picker-cell-range-hover' : '') +
                                        (cell.rangeHoverStart ? ' asc-picker-cell-range-hover-start' : '') +
                                        (cell.rangeHoverEnd ? ' asc-picker-cell-range-hover-end' : '') +
                                        (isSelectedForExtendingRange ? ' asc-picker-cell-edit-ready' : '') +
                                        (isStartOneWhenRangeHasOnlyTwo ? ' asc-picker-cell-left-one-among-two' : '') +
                                        (isEndOneWhenRangeHasOnlyTwo ? ' asc-picker-cell-right-one-among-two' : '') +
                                        (isToday ? ' asc-picker-cell-today' : '') +
                                        (isFirstDay ? ' asc-picker-cell-first-inview-cell' : '') +
                                        (isLastDay ? ' asc-picker-cell-last-inview-cell' : '');
                                    return <td key={cellIndex} className={className} onClick={() => onDateClick(cell.fullDate)} onMouseEnter={() => onDateHover(new Date(...cell.fullDate))}>
                                        <div className="asc-picker-cell-before" style={{ background: colorRangeSelected, borderColor: colorHoverBorder }}></div>
                                        <div className="asc-picker-cell-inner" style={{ background: colorRangeStartOrEnd, color: fontColorRangeStartOrEnd }}>{cell.date}</div>
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


const MonthPanel = ({ year, month, onMonthClick, onYearBtn, onPrevYearBtn, onNextYearBtn, disable = () => false, ranges, currentRangeIndex, currentRangeDateType, hoverRangeForNonBenchmarkRanges, rangeHoverDate, onDateHover = () => { }, useInSingleView = false }) => {
    const getData = () => {
        let data = [[], [], [], []];
        let monthCounter = 0, quarterCounter = 0;

        while (quarterCounter <= 3) {
            const fdStart = new Date(year, monthCounter, 1);
            const fdEnd = new Date(year, monthCounter + 1, 0);
            data[quarterCounter].push({
                month: monthCounter,
                monthName: MONTHS[monthCounter],
                fullDateStart: fdStart,
                fullDateEnd: fdEnd,
                disabled: disable(fdStart),

                rangeSelected: !useInSingleView && isDateInRangeOfAny(fdStart, ranges),
                rangeStart: !useInSingleView && isDateStartOfAny(fdStart, ranges),
                rangeEnd: !useInSingleView && isDateEndOfAny(fdEnd, ranges),
                rangeHover: !useInSingleView && rangeHoverDate ? isDateHovered(fdStart, ranges, currentRangeIndex, currentRangeDateType, rangeHoverDate, hoverRangeForNonBenchmarkRanges, 'month') : false,
                rangeHoverStart: !useInSingleView && rangeHoverDate ? isDateHoveredStart(fdStart, ranges, currentRangeIndex, currentRangeDateType, rangeHoverDate, hoverRangeForNonBenchmarkRanges, 'month') : false,
                rangeHoverEnd: !useInSingleView && rangeHoverDate ? isDateHoveredEnd(fdStart, ranges, currentRangeIndex, currentRangeDateType, rangeHoverDate, hoverRangeForNonBenchmarkRanges, 'month') : false,
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
                                    let colorRangeSelected = cell.rangeSelected ? '#fff' : '';
                                    if ((cell.rangeStart || cell.rangeEnd) && cell.rangeSelected) {
                                        colorRangeSelected = getColorOfSelected(cell.fullDateStart, ranges);
                                    }
                                    const colorRangeStartOrEnd = cell.rangeStart || cell.rangeEnd ? (cell.rangeStart ? getColorOfStartOrEnd(cell.fullDateStart, ranges) : getColorOfStartOrEnd(cell.fullDateEnd, ranges)) : '';
                                    const fontColorRangeStartOrEnd = cell.rangeStart || cell.rangeEnd ? (cell.rangeStart ? getColorOfStartOrEnd(cell.fullDateStart, ranges, 'color') : getColorOfStartOrEnd(cell.fullDateEnd, ranges, 'color')) : '';
                                    const colorHoverBorder = currentRangeIndex !== null ? ranges[currentRangeIndex][2] : '';
                                    const isSelectedForExtendingRange = cell.rangeStart || cell.rangeEnd ? (cell.rangeStart ? isDateSelectedForEdit(cell.fullDateStart, ranges, currentRangeIndex, currentRangeDateType) : isDateSelectedForEdit(cell.fullDateEnd, ranges, currentRangeIndex, currentRangeDateType)) : false;
                                    // special case when a range has only two adjacent date/momth/year/quarter, in this case to show the white space btwn these 2 cells, we need to add white borders(right of 1st cell and left of 2nd)
                                    let range, isStartOneWhenRangeHasOnlyTwo = false, isEndOneWhenRangeHasOnlyTwo = false;
                                    if (cell.rangeStart || cell.rangeEnd) {
                                        range = cell.rangeStart ? getRangeOfStartOrEnd(cell.fullDateStart, ranges) : getRangeOfStartOrEnd(cell.fullDateEnd, ranges);
                                        isStartOneWhenRangeHasOnlyTwo = cell.rangeStart && range[0] && range[1] && giveMonthsCountInRange(range[0], range[1]) === 2;
                                        isEndOneWhenRangeHasOnlyTwo = cell.rangeEnd && range[0] && range[1] && giveMonthsCountInRange(range[0], range[1]) === 2;
                                    }

                                    let className = 'asc-picker-cell asc-picker-cell-in-view' +
                                        (cell.disabled ? ' asc-picker-cell-disabled' : '') +
                                        (cell.rangeSelected ? ' asc-picker-cell-range-selected' : '') +
                                        (cell.rangeStart ? ' asc-picker-cell-range-selected-start' : '') +
                                        (cell.rangeEnd ? ' asc-picker-cell-range-selected-end' : '') +
                                        (cell.rangeHover ? ' asc-picker-cell-range-hover' : '') +
                                        (cell.rangeHoverStart ? ' asc-picker-cell-range-hover-start' : '') +
                                        (cell.rangeHoverEnd ? ' asc-picker-cell-range-hover-end' : '') +
                                        (isSelectedForExtendingRange ? ' asc-picker-cell-edit-ready' : '') +
                                        (isStartOneWhenRangeHasOnlyTwo ? ' asc-picker-cell-left-one-among-two' : '') +
                                        (isEndOneWhenRangeHasOnlyTwo ? ' asc-picker-cell-right-one-among-two' : '');
                                    return <td key={cellIndex} className={className} onClick={() => onMonthClick([year, cell.month])} onMouseEnter={() => onDateHover(new Date(year, cell.month, 1))}>
                                        <div className="asc-picker-cell-before" style={{ background: colorRangeSelected, borderColor: colorHoverBorder }}></div>
                                        <div className="asc-picker-cell-inner" style={{ background: colorRangeStartOrEnd, color: fontColorRangeStartOrEnd }}>{cell.monthName}</div>
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

const YearPanel = ({ year, onYearClick, onPrevDecadeBtn, onNextDecadeBtn, disable = () => false, ranges, currentRangeIndex, currentRangeDateType, hoverRangeForNonBenchmarkRanges, rangeHoverDate, onDateHover = () => { }, useInSingleView = false }) => {

    const startYear = Math.floor(year / 10) * 10;
    const endYear = Math.floor(year / 10) * 10 + 9;
    const getData = () => {
        let data = [[], [], [], []];
        let yearCounter = startYear, rowCounter = 0;

        while (rowCounter <= 3) {
            const fdStart = new Date(yearCounter, 0, 1);
            const fdEnd = new Date(yearCounter, 11, 31);
            data[rowCounter].push({
                year: yearCounter,
                fullDateStart: fdStart,
                fullDateEnd: fdEnd,
                isInView: true,
                disabled: disable(fdStart),

                rangeSelected: !useInSingleView && isDateInRangeOfAny(fdStart, ranges),
                rangeStart: !useInSingleView && isDateStartOfAny(fdStart, ranges),
                rangeEnd: !useInSingleView && isDateEndOfAny(fdEnd, ranges),
                rangeHover: !useInSingleView && rangeHoverDate ? isDateHovered(fdStart, ranges, currentRangeIndex, currentRangeDateType, rangeHoverDate, hoverRangeForNonBenchmarkRanges, 'year') : false,
                rangeHoverStart: !useInSingleView && rangeHoverDate ? isDateHoveredStart(fdStart, ranges, currentRangeIndex, currentRangeDateType, rangeHoverDate, hoverRangeForNonBenchmarkRanges, 'year') : false,
                rangeHoverEnd: !useInSingleView && rangeHoverDate ? isDateHoveredEnd(fdStart, ranges, currentRangeIndex, currentRangeDateType, rangeHoverDate, hoverRangeForNonBenchmarkRanges, 'year') : false,
            });
            yearCounter++;
            if (yearCounter > endYear) {
                break;
            }
            if (data[rowCounter].length === 3) {
                rowCounter++;
            }

        }
        return data;
    };


    const data = getData();


    return (
        <div className="asc-picker-year-panel">
            <PanelHeader panel="year" year={startYear}
                onPrevBtn={onPrevDecadeBtn}
                onNextBtn={onNextDecadeBtn} />
            <div className="asc-picker-body">
                <table className="asc-picker-content">
                    <tbody >
                        {data.map((row, rowIndex) => {
                            return <tr key={rowIndex} >
                                {row.map((cell, cellIndex) => {
                                    const isFirstYear = cell.year === startYear;
                                    const isLastYear = cell.year === endYear;

                                    let colorRangeSelected = cell.rangeSelected && cell.isInView ? '#fff' : '';
                                    if ((cell.rangeStart || cell.rangeEnd) && cell.isInView && cell.rangeSelected) {
                                        colorRangeSelected = getColorOfSelected(cell.fullDateStart, ranges);
                                    }
                                    const colorRangeStartOrEnd = (cell.rangeStart || cell.rangeEnd) && cell.isInView ? (cell.rangeStart ? getColorOfStartOrEnd(cell.fullDateStart, ranges) : getColorOfStartOrEnd(cell.fullDateEnd, ranges)) : '';
                                    const fontColorRangeStartOrEnd = (cell.rangeStart || cell.rangeEnd) && cell.isInView ? (cell.rangeStart ? getColorOfStartOrEnd(cell.fullDateStart, ranges, 'color') : getColorOfStartOrEnd(cell.fullDateEnd, ranges, 'color')) : '';
                                    const colorHoverBorder = currentRangeIndex !== null ? ranges[currentRangeIndex][2] : '';
                                    const isSelectedForExtendingRange = cell.rangeStart || cell.rangeEnd ? (cell.rangeStart ? isDateSelectedForEdit(cell.fullDateStart, ranges, currentRangeIndex, currentRangeDateType) : isDateSelectedForEdit(cell.fullDateEnd, ranges, currentRangeIndex, currentRangeDateType)) : false;
                                    // special case when a range has only two adjacent date/momth/year/quarter, in this case to show the white space btwn these 2 cells, we need to add white borders(right of 1st cell and left of 2nd)
                                    let range, isStartOneWhenRangeHasOnlyTwo = false, isEndOneWhenRangeHasOnlyTwo = false;
                                    if (cell.rangeStart || cell.rangeEnd) {
                                        range = cell.rangeStart ? getRangeOfStartOrEnd(cell.fullDateStart, ranges) : getRangeOfStartOrEnd(cell.fullDateEnd, ranges);
                                        isStartOneWhenRangeHasOnlyTwo = cell.rangeStart && range[0] && range[1] && giveYearsCountInRange(range[0], range[1]) === 2;
                                        isEndOneWhenRangeHasOnlyTwo = cell.rangeEnd && range[0] && range[1] && giveYearsCountInRange(range[0], range[1]) === 2;
                                    }


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
                                        (isSelectedForExtendingRange ? ' asc-picker-cell-edit-ready' : '') +
                                        (isStartOneWhenRangeHasOnlyTwo ? ' asc-picker-cell-left-one-among-two' : '') +
                                        (isEndOneWhenRangeHasOnlyTwo ? ' asc-picker-cell-right-one-among-two' : '') +
                                        (isFirstYear ? ' asc-picker-cell-first-inview-cell' : '') +
                                        (isLastYear ? ' asc-picker-cell-last-inview-cell' : '');
                                    return <td key={cellIndex} className={className} onClick={() => onYearClick([cell.year])} onMouseEnter={() => onDateHover(cell.fullDateStart)}>
                                        <div className="asc-picker-cell-before" style={{ background: colorRangeSelected, borderColor: colorHoverBorder }}></div>
                                        <div className="asc-picker-cell-inner" style={{ background: colorRangeStartOrEnd, color: fontColorRangeStartOrEnd }}>{cell.year}</div>
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

const QuarterPanel = ({ year, month, onQuarterClick, onYearBtn, onPrevYearBtn, onNextYearBtn, disable = () => false, ranges, currentRangeIndex, currentRangeDateType, hoverRangeForNonBenchmarkRanges, rangeHoverDate, onDateHover = () => { } }) => {

    const data = [1, 2, 3, 4].map(q => {
        const fdStart = new Date(year, 3 * (q - 1), 1);
        const fdEnd = new Date(year, 3 * (q - 1) + 2 + 1, 0);
        return {
            quarter: 'Q' + q,
            fullDateStart: fdStart,
            fullDateEnd: fdEnd,
            disabled: disable(fdStart),

            rangeSelected: isDateInRangeOfAny(fdStart, ranges),
            rangeStart: isDateStartOfAny(fdStart, ranges),
            rangeEnd: isDateEndOfAny(fdEnd, ranges),
            rangeHover: rangeHoverDate ? isDateHovered(fdStart, ranges, currentRangeIndex, currentRangeDateType, rangeHoverDate, hoverRangeForNonBenchmarkRanges, 'quarter') : false,
            rangeHoverStart: rangeHoverDate ? isDateHoveredStart(fdStart, ranges, currentRangeIndex, currentRangeDateType, rangeHoverDate, hoverRangeForNonBenchmarkRanges, 'quarter') : false,
            rangeHoverEnd: rangeHoverDate ? isDateHoveredEnd(fdStart, ranges, currentRangeIndex, currentRangeDateType, rangeHoverDate, hoverRangeForNonBenchmarkRanges, 'quarter') : false,
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
                                let colorRangeSelected = cell.rangeSelected ? '#fff' : '';
                                if ((cell.rangeStart || cell.rangeEnd) && cell.rangeSelected) {
                                    colorRangeSelected = getColorOfSelected(cell.fullDateStart, ranges);
                                }
                                const colorRangeStartOrEnd = cell.rangeStart || cell.rangeEnd ? (cell.rangeStart ? getColorOfStartOrEnd(cell.fullDateStart, ranges) : getColorOfStartOrEnd(cell.fullDateEnd, ranges)) : '';
                                const fontColorRangeStartOrEnd = cell.rangeStart || cell.rangeEnd ? (cell.rangeStart ? getColorOfStartOrEnd(cell.fullDateStart, ranges, 'color') : getColorOfStartOrEnd(cell.fullDateEnd, ranges, 'color')) : '';
                                const colorHoverBorder = currentRangeIndex !== null ? ranges[currentRangeIndex][2] : '';
                                const isSelectedForExtendingRange = cell.rangeStart || cell.rangeEnd ? (cell.rangeStart ? isDateSelectedForEdit(cell.fullDateStart, ranges, currentRangeIndex, currentRangeDateType) : isDateSelectedForEdit(cell.fullDateEnd, ranges, currentRangeIndex, currentRangeDateType)) : false;
                                // special case when a range has only two adjacent date/momth/year/quarter, in this case to show the white space btwn these 2 cells, we need to add white borders(right of 1st cell and left of 2nd)
                                let range, isStartOneWhenRangeHasOnlyTwo = false, isEndOneWhenRangeHasOnlyTwo = false;
                                if (cell.rangeStart || cell.rangeEnd) {
                                    range = cell.rangeStart ? getRangeOfStartOrEnd(cell.fullDateStart, ranges) : getRangeOfStartOrEnd(cell.fullDateEnd, ranges);
                                    isStartOneWhenRangeHasOnlyTwo = cell.rangeStart && range[0] && range[1] && giveQuartersCountInRange(range[0], range[1]) === 2;
                                    isEndOneWhenRangeHasOnlyTwo = cell.rangeEnd && range[0] && range[1] && giveQuartersCountInRange(range[0], range[1]) === 2;
                                }

                                let className = 'asc-picker-cell asc-picker-cell-in-view' +
                                    (cell.disabled ? ' asc-picker-cell-disabled' : '') +
                                    (cell.selected ? ' asc-picker-cell-selected' : '') +
                                    (cell.rangeSelected ? ' asc-picker-cell-range-selected' : '') +
                                    (cell.rangeStart ? ' asc-picker-cell-range-selected-start' : '') +
                                    (cell.rangeEnd ? ' asc-picker-cell-range-selected-end' : '') +
                                    (cell.rangeHover ? ' asc-picker-cell-range-hover' : '') +
                                    (cell.rangeHoverStart ? ' asc-picker-cell-range-hover-start' : '') +
                                    (cell.rangeHoverEnd ? ' asc-picker-cell-range-hover-end' : '') +
                                    (isSelectedForExtendingRange ? ' asc-picker-cell-edit-ready' : '') +
                                    (isStartOneWhenRangeHasOnlyTwo ? ' asc-picker-cell-left-one-among-two' : '') +
                                    (isEndOneWhenRangeHasOnlyTwo ? ' asc-picker-cell-right-one-among-two' : '');
                                return <td key={cellIndex} className={className} onClick={() => onQuarterClick([year, cell.quarter[1]])} onMouseEnter={() => onDateHover(new Date(year, 3 * (cell.quarter[1] - 1), 1))}>
                                    <div className="asc-picker-cell-before" style={{ background: colorRangeSelected, borderColor: colorHoverBorder }}></div>
                                    <div className="asc-picker-cell-inner" style={{ background: colorRangeStartOrEnd, color: fontColorRangeStartOrEnd }}>{cell.quarter}</div>
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
                <span className="asc-picker-header-prev-icon"></span>
            </button>
            <div className="asc-picker-header-view">
                {panel === 'date' && <button tabIndex="-1" className="asc-picker-header-month-btn" onClick={onMonthBtn}>{MONTHS[month]}</button>}
                {(panel === 'date' || panel === 'month' || panel === 'quarter') && <button tabIndex="-1" className="asc-picker-header-year-btn" onClick={onYearBtn}>{year}</button>}
                {(panel === 'year') && <span className="asc-picker-header-decade" >{decade}</span>}
            </div>
            <button tabIndex="-1" className="asc-picker-header-next-btn" onClick={onNextBtn}>
                <span className="asc-picker-header-next-icon"></span>
            </button>
        </div>
    );
};

export { DatePanel, MonthPanel, YearPanel, QuarterPanel };