import React, { useState, useEffect } from 'react';
import { useRef } from 'react';
import { DatePanel, MonthPanel, QuarterPanel, YearPanel } from './components/Panels';
import {
    isDateEqual, isDateSmaller, giveNextNthDate, giveDaysCountInRange,
    giveMonthsCountInRange, giveYearsCountInRange, giveQuartersCountInRange,
    isDateGreater, giveEndDateOfNextNthMonth, giveEndDateOfNextNthYear,
    giveEndDateOfNextNthQuarter, isDateInBetween
} from './components/utils';
import './multi-period-styles.scss';

const MAX_PERIOD_COUNT = 4;
const DEFAULT_PERIOD_BGCOLORS = ['#1890ff', '#06A535', '#ff7373', '#ffa500'];
const DEFAULT_PERIOD_COLORS = ['#fff', '#fff', '#fff', '#fff'];
const PREDEFINED_DATES = ['LAST_7_DAYS', 'LAST_30_DAYS', 'THIS_MONTH', 'LAST_MONTH']; // used only when used for selecting a single range only

const MultiPeriodPickerPanel = ({ periods, periodBGColors = DEFAULT_PERIOD_BGCOLORS, periodColors = DEFAULT_PERIOD_COLORS, benchmarkIndex, disableBenchmarkChange, singleRangeonly, forceDisplayDate = null, dateForLastDaysCalculation = null, maxPeriodCount = MAX_PERIOD_COUNT, onChange, disableFn }) => {
    // periods = periods && periods.length ? periods : singleRangeonly ? [[null, null]] : [[null, null], [null, null]];
    const defaultRanges = singleRangeonly ? [[null, null, periodBGColors[0], periodColors[0]]] : [[null, null, periodBGColors[0], periodColors[0]], [null, null, periodBGColors[1], periodColors[1]]];
    const initialRanges = periods && periods.length ? periods.map((p, i) => [...p, periodBGColors[i], periodColors[i]]) : defaultRanges;
    const [ranges, setRanges] = useState(initialRanges);
    const [startYear, setStartYear] = useState(forceDisplayDate ? forceDisplayDate.getFullYear() : ranges[0] && ranges[0][0] ? ranges[0][0].getFullYear() : new Date().getFullYear());
    const [startMonth, setStartMonth] = useState(forceDisplayDate ? forceDisplayDate.getMonth() : ranges[0] && ranges[0][0] ? ranges[0][0].getMonth() : new Date().getMonth());
    const [picker, setPicker] = useState('date');
    const [panel, setPanel] = useState(picker);

    const [prevPanel, setPrevPanel] = useState('');
    const [rangeHoverDate, setRangeHoverDate] = useState(null);

    //Use 'benchmarkIndex'(props) to initialize 'benchmarkRangeIndex'(state), Only use it if there is some valid date at given 'benchmarkIndex'
    const defaultBmIndex = benchmarkIndex !== null && benchmarkIndex !== undefined && periods && periods.length && periods[benchmarkIndex] && periods[benchmarkIndex][0] && periods[benchmarkIndex][1] ? benchmarkIndex : 0
    const [benchmarkRangeIndex, setBenchmarkRangeIndex] = useState(defaultBmIndex);
    const [currentRangeIndex, setCurrentRangeIndex] = useState(0);
    const [currentRangeDateType, setCurrentRangeDateType] = useState(null);
    // const [currentRangeIndexForExtension, setCurrentRangeIndexForExtension] = useState(0);
    // const [currentRangeDateTypeForExtension, setCurrentRangeDateTypeForExtension] = useState(null);

    const endYear = startMonth < 11 ? startYear : startYear + 1;
    const endMonth = startMonth < 11 ? startMonth + 1 : 0;

    const isMounted = useRef(false);

    // effect for updatng the current month and year in view as soon as forceDisplayDate props is changed
    // use the string version of data for comparing as forceDisplayDate is Date Object which is not reliable to compare in this case
    const forceDisplayDateStr = forceDisplayDate ? forceDisplayDate.getFullYear() + '-' + forceDisplayDate.getMonth() : '';
    useEffect(() => {
        if (!isMounted.current) { return; }
        if (forceDisplayDateStr !== '') {
            setStartYear(forceDisplayDate.getFullYear());
            setStartMonth(forceDisplayDate.getMonth());
        }
    }, [forceDisplayDateStr]);

    useEffect(() => {
        // console.log('running effect  : picker, singleRangeonly changed ');
        if (!isMounted.current) { return; }
        setPanel(picker);
        setPrevPanel('');
        // reset the ranges  and other things
        setRangeHoverDate(null);
        setBenchmarkRangeIndex(0);
        setCurrentRangeIndex(0);
        setCurrentRangeDateType(null);
        setRanges(defaultRanges);
    }, [picker, singleRangeonly]);

    useEffect(() => {
        // console.log('running effect  : picker changed ');
        if (!isMounted.current) { return; }
        notifyRangesChange(defaultRanges, 0);
    }, [picker]);

    useEffect(() => {
        // console.log('running effect  : periods changed ');
        if (!isMounted.current) { return; }
        setRanges(initialRanges);
    }, [periods]);

    useEffect(() => {
        if (!isMounted.current) { return; }
        setBenchmarkRangeIndex(defaultBmIndex);
    }, [defaultBmIndex]);

    /**Keep this as useEffect hook always */
    useEffect(() => {
        isMounted.current = true;
    }, []);

    const handlePickerTabClick = (view) => {
        setPicker(view);
    };

    const notifyRangesChange = (ranges, bIndex) => {
        let rs = [...ranges];
        // filter out 2nd index(last index) in each period which stores the color
        rs = rs.map(r => r.slice(0, 2));
        // find out the position of range with largest day count
        let pos = -1, maxDayCount = 0;
        rs.forEach((r, i) => {
            if (r[0] && r[1]) {
                if (giveDaysCountInRange(r[0], r[1]) > maxDayCount) {
                    maxDayCount = giveDaysCountInRange(r[0], r[1]);
                    pos = i;
                }
            }
        });
        
        onChange({
            ranges: rs,
            benchmarkRangeIndex: bIndex,
            largestRangeIndex: pos > -1 ? pos : null
        });
    };

    const getAvailablePeriodColor = (type = 'bg') => {
        // return the first available color from periodBGColors list which is not in use
        if (type === 'color') {
            return periodColors.find(pc => ranges.every(r => r[3] !== pc));
        }
        return periodBGColors.find(pc => ranges.every(r => r[2] !== pc));
    };

    const giveProposedEndDate = (dStrt) => {
        if (picker === 'date') {
            return giveNextNthDate(dStrt, hoverRangeForNonBenchmarkRanges - 1);
        }
        if (picker === 'month') {
            return giveEndDateOfNextNthMonth(dStrt, hoverRangeForNonBenchmarkRanges - 1);
        }
        if (picker === 'year') {
            return giveEndDateOfNextNthYear(dStrt, hoverRangeForNonBenchmarkRanges - 1);
        }
        // For picker==='quarter'
        return giveEndDateOfNextNthQuarter(dStrt, hoverRangeForNonBenchmarkRanges - 1);

    };


    const setRangeDates = (year, month, day) => {
        if (currentRangeIndex === null) { return; }
        setRangeHoverDate(null);
        if (currentRangeIndex === 0) {
            const strtDate = ranges[0][0];
            const endDate = ranges[0][1];
            const rangeColor = ranges[0][2];
            const rangeFontColor = ranges[0][3];
            const d = new Date(year, month, day);
            let updatedRange;

            // if (currentRangeDateTypeForExtension === 'start') {
            // } else {
            // }


            if (currentRangeDateType === 'start') {
                updatedRange = [d, null, rangeColor, rangeFontColor];
                // if (endDate) {
                //     //CHANGE
                //     return;
                //     const isSmallerThanEnd = isDateSmaller(d, endDate);
                //     if (isSmallerThanEnd) {
                //         if (isOverlapingWithOtherRanges([d, endDate], currentRangeIndex)) { return; }
                //         updatedRange = [d, endDate, rangeColor, rangeFontColor];
                //     } else {
                //         updatedRange = [d, null, rangeColor, rangeFontColor];
                //     }
                // } else {
                //     updatedRange = [d, null, rangeColor, rangeFontColor];
                // }
            } else {
                //CHANGE
                // if (endDate) { return; }
                if (strtDate) {
                    const isSmallerThanStart = isDateSmaller(d, strtDate);
                    const switchDates = isSmallerThanStart || !!endDate;
                    if (switchDates) {
                        let dCorrected;
                        if (picker === 'date') {
                            dCorrected = d;
                        } else if (picker === 'month') {
                            dCorrected = new Date(d.getFullYear(), d.getMonth(), 1); // first date of selected month
                        } else if (picker === 'year') {
                            dCorrected = new Date(d.getFullYear(), 0, 1); // first date of selected year
                        } else {
                            dCorrected = new Date(d.getFullYear(), d.getMonth() - 2, 1); // first date of selected quarter
                        }
                        updatedRange = [dCorrected, null, rangeColor, rangeFontColor];
                    } else {
                        updatedRange = [strtDate, d, rangeColor, rangeFontColor];
                    }


                    // const isGreaterThanStart = isDateGreater(d, strtDate);
                    // if (isGreaterThanStart) {
                    //     // ignore the click if range overlaps with existing ranges
                    //     if (isOverlapingWithOtherRanges([strtDate, d], currentRangeIndex)) { return }
                    //     updatedRange = [strtDate, d, rangeColor, rangeFontColor];
                    // } else {
                    //     // Here :  End date selected is smaller than start date, so make it start date and make end date equal to null 
                    //     // Also, For month,quarter and year view,date `d` will be last date of selected month,quarter or year whereas `strtDate` is first date of previously selected month,quarter and year
                    //     // hence we need to correct value of d as well (make it as first date of month,quarter,year)
                    //     let dCorrected;
                    //     if (picker === 'date') {
                    //         dCorrected = d;
                    //     } else if (picker === 'month') {
                    //         dCorrected = new Date(d.getFullYear(), d.getMonth(), 1); // first date of selected month
                    //     } else if (picker === 'year') {
                    //         dCorrected = new Date(d.getFullYear(), 0, 1); // first date of selected year
                    //     } else {
                    //         dCorrected = new Date(d.getFullYear(), d.getMonth() - 2, 1); // first date of selected quarter
                    //     }
                    //     // if (isOverlapingWithOtherRanges([dCorrected, strtDateCorrected], currentRangeIndex)) { return }
                    //     updatedRange = [dCorrected, null, rangeColor, rangeFontColor];
                    // }
                } else {

                    updatedRange = [d, null, rangeColor, rangeFontColor];
                    // return;
                    // TODO : HANDLE THIS CASE LATER, FOR NOW, IGNORE THE CLICK
                }
            }

            let updatedRanges = [updatedRange, ...ranges.slice(1)];

            // Move/Reset the date input focus 
            // if (currentRangeDateType === 'start') {
            //     if (!updatedRange[1]) {
            //         setCurrentRangeDateType('end');
            //     } else {
            //         setCurrentRangeIndex(null);
            //     }
            // } else {
            //     // special case check 
            //     // when end date clicked was smaller than start date, clicked date was made as start date and end date was set to null, refer code some lines above for this
            //     // in this case, move the focus again to end date so that it can be selected
            //     if (!updatedRange[1]) {
            //         setCurrentRangeDateType('end');
            //     } else {
            //         // Else, check the further condition to move the foucs to next range
            //         // if there are just 2 ranges visible and second range is not selected,  move the focus to second range start date automatically
            //         if (updatedRanges.length === 2 && updatedRanges[1][0] === null) {
            //             setCurrentRangeIndex(currentRangeIndex + 1);
            //             setCurrentRangeDateType('start');
            //         } else {
            //             setCurrentRangeIndex(null);
            //         }
            //     }
            // }

            // Move/Reset the date input focus 
            if (currentRangeDateType === 'start') {
                setCurrentRangeDateType('end');
            } else {
                // switch dates if 
                // a) End date is selected before start date,
                // b) End date is already selected
                // c) End date is smaller than start date

                const switchDates = !strtDate || !!endDate || isDateSmaller(d, strtDate);
                if (switchDates) {
                    setCurrentRangeDateType('end');
                } else {
                    setCurrentRangeDateType('start');
                }
            }

            setRanges(updatedRanges);
            notifyRangesChange(updatedRanges, benchmarkRangeIndex);
        } else {
            const strtDate = ranges[currentRangeIndex][0];
            const endDate = ranges[currentRangeIndex][1];
            const rangeColor = ranges[currentRangeIndex][2];
            const rangeFontColor = ranges[currentRangeIndex][3];
            const d = new Date(year, month, day);
            let updatedRange;
            if (!strtDate && !endDate) {
                // selecting first time
                const proposedEndDate = giveProposedEndDate(d);
                // check if selected range overlaps with any existing range or not, ignore click in case an overlap is found
                // if (!isOverlapingWithAnyRange([d, proposedEndDate])) {
                updatedRange = [d, proposedEndDate, rangeColor, rangeFontColor];
                const updatedRanges = [...ranges.slice(0, currentRangeIndex), updatedRange, ...ranges.slice(currentRangeIndex + 1)];
                setRanges(updatedRanges);
                notifyRangesChange(updatedRanges, benchmarkRangeIndex);
                // Reset the date input focus to null
                setCurrentRangeIndex(null);
                // }
                return;
            }

            if (currentRangeDateType === 'start') {
                updatedRange = [d, null, rangeColor, rangeFontColor];
                // if (endDate) {
                //     const isSmallerThanEnd = isDateSmaller(d, endDate);
                //     if (isSmallerThanEnd) {
                //         if (isOverlapingWithOtherRanges([d, endDate], currentRangeIndex)) { return }
                //         updatedRange = [d, endDate, rangeColor, rangeFontColor];
                //     } else {
                //         updatedRange = [d, null, rangeColor, rangeFontColor];

                //     }
                // } else {
                //     updatedRange = [d, null, rangeColor, rangeFontColor];
                // }
            } else {
                if (strtDate) {
                    const isSmallerThanStart = isDateSmaller(d, strtDate);
                    const switchDates = isSmallerThanStart || !!endDate;
                    if (switchDates) {
                        let dCorrected;
                        if (picker === 'date') {
                            dCorrected = d;
                        } else if (picker === 'month') {
                            dCorrected = new Date(d.getFullYear(), d.getMonth(), 1); // first date of selected month
                        } else if (picker === 'year') {
                            dCorrected = new Date(d.getFullYear(), 0, 1); // first date of selected year
                        } else {
                            dCorrected = new Date(d.getFullYear(), d.getMonth() - 2, 1); // first date of selected quarter
                        }
                        updatedRange = [dCorrected, null, rangeColor, rangeFontColor];
                    } else {
                        updatedRange = [strtDate, d, rangeColor, rangeFontColor];
                    }

                    // const isGreaterThanStart = isDateGreater(d, strtDate);
                    // if (isGreaterThanStart) {
                    //     if (isOverlapingWithOtherRanges([strtDate, d], currentRangeIndex)) { return }
                    //     updatedRange = [strtDate, d, rangeColor, rangeFontColor];
                    // } else {
                    //     if (isOverlapingWithOtherRanges([d, strtDate], currentRangeIndex)) { return }
                    //     updatedRange = [d, strtDate, rangeColor, rangeFontColor];
                    // }
                } else {
                    updatedRange = [d, null, rangeColor, rangeFontColor];
                    // return;
                    // TODO : HANDLE THIS CASE LATER, FOR NOW, IGNORE THE CLICK
                }
            }


            const updatedRanges = [...ranges.slice(0, currentRangeIndex), updatedRange, ...ranges.slice(currentRangeIndex + 1)];


            // Move/Reset the date input focus 
            // if (currentRangeDateType === 'start') {
            //     if (!updatedRange[1]) {
            //         setCurrentRangeDateType('end');
            //     } else {
            //         setCurrentRangeIndex(null);
            //     }

            // } else {
            //     setCurrentRangeIndex(null);
            // }

            // Move/Reset the date input focus 
            if (currentRangeDateType === 'start') {
                setCurrentRangeDateType('end');
            } else {
                // switch dates if 
                // a) End date is selected before start date,
                // b) End date is already selected
                // c) End date is smaller than start date

                const switchDates = !strtDate || !!endDate || isDateSmaller(d, strtDate);
                if (switchDates) {
                    setCurrentRangeDateType('end');
                } else {
                    setCurrentRangeDateType('start');
                }
            }

            setRanges(updatedRanges);
            notifyRangesChange(updatedRanges, benchmarkRangeIndex);

        }
    };


    const handleDateClick = ([year, month, day]) => {
        // perform check here for range end clicks
        setRangeDates(year, month, day);
    };

    const handleMonthClick = ([year, month]) => {
        // console.log('month clicked', month);
        if (picker === 'date') {
            setStartMonth(month);
            changePanels('', 'date');
        } else {
            const strtDate = currentRangeIndex !== null ? ranges[currentRangeIndex][0] : null;
            const day = currentRangeDateType === 'end' && strtDate ? new Date(year, month + 1, 0).getDate() : 1;
            setRangeDates(year, month, day);
        }
    }

    const handleYearClick = ([year]) => {
        // console.log('year clicked', year);
        if (picker === 'date' || picker === 'month' || picker === 'quarter') {
            setStartYear(year);
            changePanels('', prevPanel);
        } else {
            const strtDate = currentRangeIndex !== null ? ranges[currentRangeIndex][0] : null;
            const month = currentRangeDateType === 'end' && strtDate ? 11 : 0;
            const day = currentRangeDateType === 'end' && strtDate ? 31 : 1;
            setRangeDates(year, month, day);
        }
    };

    const handleQuarterClick = ([year, quarter]) => {
        const strtDate = currentRangeIndex !== null ? ranges[currentRangeIndex][0] : null;
        const month = currentRangeDateType === 'end' && strtDate ? 3 * (quarter - 1) + 2 : 3 * (quarter - 1);
        const day = currentRangeDateType === 'end' && strtDate ? new Date(year, month + 1, 0).getDate() : 1;
        setRangeDates(year, month, day);
    };

    const handleYearBtnOnDateRangePanel = () => changePanels('date', 'year-single');
    const handleYearBtnOnMonthRangePanel = () => changePanels('month', 'year-single');
    const handleYearBtnOnQuarterRangePanel = () => changePanels('quarter', 'year-single');
    const handleYearBtnOnMonthPanel = () => changePanels('month-single', 'year-single');
    const handleMonthBtnOnDateRangePanel = () => changePanels('date', 'month-single');

    const changePanels = (prevP, currP) => {
        setTimeout(() => {
            setPrevPanel(prevP);
            setPanel(currP);
        });
    };

    const handlePrevMonthClick = () => {
        const prevStartMonth = startMonth === 0 ? 11 : startMonth - 1;
        const prevStartYear = startMonth === 0 ? startYear - 1 : startYear;
        setStartMonth(prevStartMonth);
        setStartYear(prevStartYear);
    };
    const handleNextMonthClick = () => {
        const nextStartMonth = (startMonth + 1) % 12;
        const nextStartYear = startMonth === 11 ? startYear + 1 : startYear;
        setStartMonth(nextStartMonth);
        setStartYear(nextStartYear);
    };

    const handlePrevYearClick = () => setStartYear(startYear - 1);
    const handleNextYearClick = () => setStartYear(startYear + 1);
    const handlePrevDecadeClick = () => setStartYear(startYear - 10);
    const handleNextDecadeClick = () => setStartYear(startYear + 10);

    const handleDateHover = (hoverDate) => {
        // console.log('rangeHoverDate', hoverDate);
        if (currentRangeIndex === null) {
            setRangeHoverDate(null);
            return;
        }

        const strt = ranges[currentRangeIndex][0];
        const end = ranges[currentRangeIndex][1];
        if (!strt && !end && hoverRangeForNonBenchmarkRanges > 0) {
            // const hoverRangeStrt = hoverDate;
            // const hoverRangeEnd = giveNextNthDate(hoverRangeStrt, hoverRangeForNonBenchmarkRanges - 1);
            // const hoverRangeEnd = giveProposedEndDate(hoverRangeStrt);
            // if (isOverlapingWithAnyRange([hoverRangeStrt, hoverRangeEnd])) {
            //     setRangeHoverDate(null);
            //     return;
            // }
        }
        if (strt && !end) {
            // const proposedStart = strt;
            // const proposedEnd = hoverDate;
            // if (currentRangeDateType === 'start' || isOverlapingWithOtherRanges([proposedStart, proposedEnd], currentRangeIndex)) {
            //     setRangeHoverDate(null);
            //     return;
            // }
        }
        if (strt && end) {
            return;
            // let proposedStart, proposedEnd;
            // if (currentRangeDateType === 'start') {
            //     proposedStart = hoverDate;
            //     proposedEnd = end;
            // } else {
            //     proposedStart = end;
            //     proposedEnd = hoverDate;
            // }
            // // console.log('overlapping', proposedStart, proposedEnd);
            // // console.log('overlapping', isOv÷erlapingWithOtherRanges([proposedStart, proposedEnd], currentRangeIndex));
            // if (isOverlapingWithOtherRanges([proposedStart, proposedEnd], currentRangeIndex)) {
            //     setRangeHoverDate(null);
            //     return;
            // }
        }
        setRangeHoverDate(hoverDate);

    };

    // const isOverlapingWithAnyRange = ([sDate, eDate]) => {
    //     let overlap = false;
    //     for (let i = 0; i < ranges.length; i++) {
    //         if (ranges[i][0] && ranges[i][1] &&
    //             (isDateEqual(sDate, ranges[i][0]) || isDateEqual(eDate, ranges[i][1]) || !(isDateGreater(sDate, ranges[i][1]) || isDateSmaller(eDate, ranges[i][0])))
    //         ) {
    //             overlap = true;
    //             break;
    //         }
    //     }
    //     return overlap;
    // };
    const isOverlapingWithOtherRanges = ([sDate, eDate], selfRangeIndex) => {
        // console.log('-------------------', sDate, eDate, selfRangeIndex);
        let overlap = false;
        for (let i = 0; i < ranges.length; i++) {
            if (i !== selfRangeIndex && ranges[i][0] && ranges[i][1] &&
                (isDateEqual(sDate, ranges[i][0]) || isDateEqual(eDate, ranges[i][1]) || !(isDateGreater(sDate, ranges[i][1]) || isDateSmaller(eDate, ranges[i][0])))
            ) {
                overlap = true;
                break;
            }
        }
        return overlap;
    };


    const handleRangeRemoveBtn = (rangeIndex) => {
        const updatedRanges = [...ranges.slice(0, rangeIndex), ...ranges.slice(rangeIndex + 1)];
        const bRangeIndex = rangeIndex < benchmarkRangeIndex ? benchmarkRangeIndex - 1 : benchmarkRangeIndex;
        const currRangeIndex = (rangeIndex === currentRangeIndex || rangeIndex < currentRangeIndex) ? null : currentRangeIndex;
        setRanges(updatedRanges);
        setBenchmarkRangeIndex(bRangeIndex);
        setCurrentRangeIndex(currRangeIndex);
        notifyRangesChange(updatedRanges, bRangeIndex);
    };

    const handleDateInputChange = (event, rangeIndex, startOrEnd) => {
        const date = event.target.value;
        
        if (date) {
            let updatedDate = new Date(date);
            updatedDate.setHours(0, 0, 0, 0);
            const dateIndex = startOrEnd === 'start' ? 0 : 1;
            let rangeCopy = [...ranges[rangeIndex]];
            const needToCheckRangeOverlap = startOrEnd === 'start' ? rangeCopy[1] !== null : rangeCopy[0] !== null;
            const strtDateForRangeOverlapCheck = startOrEnd === 'start' ? updatedDate : rangeCopy[0];
            const endDateForRangeOverlapCheck = startOrEnd === 'start' ? rangeCopy[1] : updatedDate;
            // if(needToCheckRangeOverlap){debugger}
            if (isDateAlreadyExistInSomeOtherRange(updatedDate, rangeIndex)
                || (needToCheckRangeOverlap && isOverlapingWithOtherRanges([strtDateForRangeOverlapCheck, endDateForRangeOverlapCheck], rangeIndex))) {
                rangeCopy[dateIndex] = null;
            } else {
                rangeCopy[dateIndex] = updatedDate;
            }
            const updatedRanges = [...ranges.slice(0, rangeIndex), rangeCopy, ...ranges.slice(rangeIndex + 1)];
            setRanges(updatedRanges);
            notifyRangesChange(updatedRanges, benchmarkRangeIndex);
        }
    };

    const isDateAlreadyExistInSomeOtherRange = (date, selfRangeIndex) => {
        let exists = false;
        for (let i = 0; i < ranges.length; i++) {
            if (i !== selfRangeIndex && ranges[i][0] && ranges[i][1] && isDateInBetween(date, [ranges[i][0], ranges[i][1]])) {
                exists = true;
                break;
            }
        }
        return exists;
    };

    useEffect(() => {
        // console.log('running date input setting effect');
        ranges.forEach((range, index) => {
            const startInputRef = document.getElementById('asc-picker-date-input-ref' + index + 'start');
            const endInputRef = document.getElementById('asc-picker-date-input-ref' + index + 'end');
            startInputRef.value = range[0] ? giveFormattedDate(range[0]) : '';
            endInputRef.value = range[1] ? giveFormattedDate(range[1]) : '';

            startInputRef.style.animation = 'blink1 1s linear infinite';
        });
    }, [ranges]);

    const handleBenchmarkCheckbox = (checked, index) => {
        setBenchmarkRangeIndex(index);
        if (index !== benchmarkRangeIndex) {
            notifyRangesChange(ranges, index);
        }
    };

    const handleRangeInputFocus = (startOrEnd, rangeIndex) => {
        setCurrentRangeDateType(startOrEnd);
        setCurrentRangeIndex(rangeIndex);
        setRangeHoverDate(null);
    };

    const handlePeriodAddBtn = () => {
        const updatedRanges = [...ranges, [null, null, getAvailablePeriodColor(), getAvailablePeriodColor('color')]];
        setRanges(updatedRanges);
        setCurrentRangeIndex(updatedRanges.length - 1);
        setCurrentRangeDateType('start');
    };

    const giveFormattedDate = (date) => {
        if (date === null) { return ''; }
        // return (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '/' + (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + '/' + date.getFullYear();
        const y = date.getFullYear().toString();
        const yyyy = (y.length < 4) ? Array(4 - y.length).fill('0').join('') + y : y;
        return yyyy + '-' + (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-' + (date.getDate() < 10 ? '0' + date.getDate() : date.getDate());
        // return date.toISOString().slice(0, 10);
    };


    const benchMarkRange = ranges[benchmarkRangeIndex];
    const hoverRangeForNonBenchmarkRanges = (() => {
        if (benchMarkRange && benchMarkRange[0] && benchMarkRange[1]) {
            if (picker === 'date') {
                return giveDaysCountInRange(benchMarkRange[0], benchMarkRange[1]);
            }
            if (picker === 'month') {
                return giveMonthsCountInRange(benchMarkRange[0], benchMarkRange[1]);
            }
            if (picker === 'year') {
                return giveYearsCountInRange(benchMarkRange[0], benchMarkRange[1]);
            }
            return giveQuartersCountInRange(benchMarkRange[0], benchMarkRange[1]);
        }
        return 0;
    })();

    // Methods related to PREDEFINED DATES
    const giveDateRangeForPredefined = (pd) => {
        let startDate;
        let endDate = dateForLastDaysCalculation || new Date();
        endDate.setHours(0, 0, 0, 0);
        switch (pd) {
            case 'LAST_7_DAYS':
                startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 6);
                break;

            case 'LAST_30_DAYS':
                startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 29);
                break;

            case 'THIS_MONTH':
                startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
                break;

            case 'LAST_MONTH':
                startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1);
                endDate = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
                break;

            default:
                startDate = endDate;
                break;
        }
        return [startDate, endDate];
    };

    const handlePredefinedDateClick = (pd) => {
        const [sd, ed] = giveDateRangeForPredefined(pd);
        // ranges has only one range 
        const updatedRanges = [[sd, ed, periodBGColors[0], periodColors[0]]];
        setRanges(updatedRanges);
        notifyRangesChange(updatedRanges, 0);
    };

    const isPredefinedDateSelected = (pd) => {
        const [sd, ed] = giveDateRangeForPredefined(pd);
        return isDateEqual(sd, ranges[0][0]) && isDateEqual(ed, ranges[0][1]);
    }

    // console.log('hover date', rangeHoverDate);

    return (
        <div className={'asc-picker asc-picker-multi-range' + (singleRangeonly ? ' single-range-only' : '')}>
            <div className="asc-picker-inner-wrapper">
                <div className="asc-picker-view-tabs">
                    {['day', 'month', 'quarter', 'year'].map(view => (
                        <div key={view} onClick={() => handlePickerTabClick(view === 'day' ? 'date' : view)} className={'asc-picker-view-tab' + (picker === (view === 'day' ? 'date' : view) ? ' asc-picker-view-tab-selected' : '')}>
                            {view[0].toUpperCase() + view.slice(1)}
                        </div>
                    ))}
                </div>

                <div className="asc-picker-panels">
                    {panel === 'date' &&
                        <React.Fragment>
                            <div className="asc-picker-panel">
                                <DatePanel year={startYear} month={startMonth}
                                    onDateClick={handleDateClick}
                                    onMonthBtn={handleMonthBtnOnDateRangePanel}
                                    onYearBtn={handleYearBtnOnDateRangePanel}
                                    onPrevMonthBtn={handlePrevMonthClick}
                                    disable={disableFn}
                                    ranges={ranges}
                                    currentRangeIndex={currentRangeIndex}
                                    currentRangeDateType={currentRangeDateType}
                                    hoverRangeForNonBenchmarkRanges={hoverRangeForNonBenchmarkRanges}
                                    rangeHoverDate={rangeHoverDate}
                                    onDateHover={handleDateHover}
                                />
                            </div>
                            <div className="asc-picker-panel">
                                <DatePanel year={endYear} month={endMonth}
                                    onDateClick={handleDateClick}
                                    onMonthBtn={handleMonthBtnOnDateRangePanel}
                                    onYearBtn={handleYearBtnOnDateRangePanel}
                                    onNextMonthBtn={handleNextMonthClick}
                                    disable={disableFn}
                                    ranges={ranges}
                                    currentRangeIndex={currentRangeIndex}
                                    currentRangeDateType={currentRangeDateType}
                                    hoverRangeForNonBenchmarkRanges={hoverRangeForNonBenchmarkRanges}
                                    rangeHoverDate={rangeHoverDate}
                                    onDateHover={handleDateHover}
                                />
                            </div>
                        </React.Fragment>
                    }
                    {panel === 'month' &&
                        <React.Fragment>
                            <div className="asc-picker-panel">
                                <MonthPanel year={startYear} month={startMonth}
                                    onMonthClick={handleMonthClick}
                                    onYearBtn={handleYearBtnOnMonthRangePanel}
                                    onPrevYearBtn={handlePrevYearClick}
                                    rangeHoverDate={rangeHoverDate}
                                    onDateHover={handleDateHover}
                                    ranges={ranges}
                                    currentRangeIndex={currentRangeIndex}
                                    currentRangeDateType={currentRangeDateType}
                                    hoverRangeForNonBenchmarkRanges={hoverRangeForNonBenchmarkRanges}
                                    disable={picker === 'month' ? disableFn : () => false}
                                />
                            </div>
                            <div className="asc-picker-panel">
                                <MonthPanel year={startYear + 1} month={endMonth}
                                    onMonthClick={handleMonthClick}
                                    onYearBtn={handleYearBtnOnMonthRangePanel}
                                    onNextYearBtn={handleNextYearClick}
                                    rangeHoverDate={rangeHoverDate}
                                    onDateHover={handleDateHover}
                                    ranges={ranges}
                                    currentRangeIndex={currentRangeIndex}
                                    currentRangeDateType={currentRangeDateType}
                                    hoverRangeForNonBenchmarkRanges={hoverRangeForNonBenchmarkRanges}
                                    disable={picker === 'month' ? disableFn : () => false}
                                />
                            </div>
                        </React.Fragment>
                    }
                    {panel === 'year' &&
                        <React.Fragment>
                            <div className="asc-picker-panel">
                                <YearPanel year={startYear}
                                    onYearClick={handleYearClick}
                                    onPrevDecadeBtn={handlePrevDecadeClick}
                                    rangeHoverDate={rangeHoverDate}
                                    onDateHover={handleDateHover}
                                    ranges={ranges}
                                    currentRangeIndex={currentRangeIndex}
                                    currentRangeDateType={currentRangeDateType}
                                    hoverRangeForNonBenchmarkRanges={hoverRangeForNonBenchmarkRanges}
                                    disable={picker === 'year' ? disableFn : () => false}

                                />
                            </div>
                            <div className="asc-picker-panel">
                                <YearPanel year={startYear + 10}
                                    onYearClick={handleYearClick}
                                    onNextDecadeBtn={handleNextDecadeClick}
                                    rangeHoverDate={rangeHoverDate}
                                    onDateHover={handleDateHover}
                                    ranges={ranges}
                                    currentRangeIndex={currentRangeIndex}
                                    currentRangeDateType={currentRangeDateType}
                                    hoverRangeForNonBenchmarkRanges={hoverRangeForNonBenchmarkRanges}
                                    disable={picker === 'year' ? disableFn : () => false}
                                />
                            </div>
                        </React.Fragment>
                    }
                    {panel === 'quarter' &&
                        <React.Fragment>
                            <div className="asc-picker-panel">
                                <QuarterPanel year={startYear}
                                    onQuarterClick={handleQuarterClick}
                                    onYearBtn={handleYearBtnOnQuarterRangePanel}
                                    onPrevYearBtn={handlePrevYearClick}
                                    rangeHoverDate={rangeHoverDate}
                                    onDateHover={handleDateHover}
                                    ranges={ranges}
                                    currentRangeIndex={currentRangeIndex}
                                    currentRangeDateType={currentRangeDateType}
                                    hoverRangeForNonBenchmarkRanges={hoverRangeForNonBenchmarkRanges}
                                    disable={picker === 'quarter' ? disableFn : () => false}
                                />
                            </div>
                            <div className="asc-picker-panel">
                                <QuarterPanel year={startYear + 1}
                                    onQuarterClick={handleQuarterClick}
                                    onYearBtn={handleYearBtnOnQuarterRangePanel}
                                    onNextYearBtn={handleNextYearClick}
                                    rangeHoverDate={rangeHoverDate}
                                    onDateHover={handleDateHover}
                                    ranges={ranges}
                                    currentRangeIndex={currentRangeIndex}
                                    currentRangeDateType={currentRangeDateType}
                                    hoverRangeForNonBenchmarkRanges={hoverRangeForNonBenchmarkRanges}
                                    disable={picker === 'quarter' ? disableFn : () => false}
                                />
                            </div>
                        </React.Fragment>
                    }

                    {panel === 'month-single' &&
                        <div className="asc-picker-panel">
                            <MonthPanel year={startYear} month={startMonth}
                                onMonthClick={handleMonthClick}
                                onYearBtn={handleYearBtnOnMonthPanel}
                                onPrevYearBtn={handlePrevYearClick}
                                onNextYearBtn={handleNextYearClick}
                                ranges={ranges}
                                currentRangeIndex={currentRangeIndex}
                                currentRangeDateType={currentRangeDateType}
                                hoverRangeForNonBenchmarkRanges={hoverRangeForNonBenchmarkRanges}
                                useInSingleView={true}
                            />
                        </div>
                    }
                    {panel === 'year-single' &&
                        <div className="asc-picker-panel">
                            <YearPanel year={startYear}
                                onYearClick={handleYearClick}
                                onPrevDecadeBtn={handlePrevDecadeClick}
                                onNextDecadeBtn={handleNextDecadeClick}
                                ranges={ranges}
                                currentRangeIndex={currentRangeIndex}
                                currentRangeDateType={currentRangeDateType}
                                hoverRangeForNonBenchmarkRanges={hoverRangeForNonBenchmarkRanges}
                                useInSingleView={true}
                            />
                        </div>
                    }
                </div >

                {singleRangeonly &&
                    <div className="asc-picker-predefined-wrapper">
                        {PREDEFINED_DATES.slice(0, 4).map((pd) => {
                            const label = pd.split('_').map(str => str[0].toUpperCase() + str.slice(1).toLowerCase()).join(' ')
                            const isSelected = ranges[0] && ranges[0][0] && ranges[0][1] ? isPredefinedDateSelected(pd) : false;
                            return (
                                <div key={label} className={'asc-picker-predefined-date' + (isSelected ? ' asc-picker-predefined-date-selected' : '')} onClick={() => handlePredefinedDateClick(pd)}>
                                    <span className="asc-picker-predefined-date-label">{label}</span>
                                </div>
                            );
                        })}
                    </div>
                }
            </div>

            <div className="asc-picker-periods-wrapper">
                {ranges.map((range, index) => {

                    // const startDateValue = range[0] ? giveFormattedDate(range[0]) : '';
                    // const endDateValue = range[1] ? giveFormattedDate(range[1]) : '';
                    const daysCount = range[0] && range[1] ? giveDaysCountInRange(range[0], range[1]) : null;
                    return (
                        <div key={index} className={'asc-picker-period' + (currentRangeIndex === index ? ' asc-picker-period-focused' : '')}>
                            <div className="asc-picker-input-wrapper">
                                <div className="asc-picker-input" style={{ borderColor: range[2] }}>
                                    <div className={'asc-picker-input-inner start' + (currentRangeIndex === index && currentRangeDateType === 'start' ? ' focused' : '')}>
                                        <input id={'asc-picker-date-input-ref' + index + 'start'} type="date" className={'asc-picker-input-date-start' + (currentRangeIndex === index && currentRangeDateType === 'start' ? ' asc-picker-input-focused' : '')}
                                            disabled={!hoverRangeForNonBenchmarkRanges && index !== benchmarkRangeIndex}
                                            onChange={(e) => handleDateInputChange(e, index, 'start')}
                                            onFocus={() => handleRangeInputFocus('start', index)}
                                        />
                                    </div>
                                    <span className="asc-picker-input-date-separator">-</span>
                                    <div className={'asc-picker-input-inner end' + (currentRangeIndex === index && currentRangeDateType === 'end' ? ' focused' : '')}>
                                        <input id={'asc-picker-date-input-ref' + index + 'end'} type="date" className={'asc-picker-input-date-start' + (currentRangeIndex === index && currentRangeDateType === 'end' ? ' asc-picker-input-focused' : '')}
                                            disabled={!hoverRangeForNonBenchmarkRanges && index !== benchmarkRangeIndex}
                                            onChange={(e) => handleDateInputChange(e, index, 'end')}
                                            onFocus={() => handleRangeInputFocus('end', index)}
                                        />
                                    </div>
                                </div>

                                {daysCount && <span className="days">{daysCount + ' Days'}</span>}
                            </div>
                            {!singleRangeonly &&
                                <div className="asc-picker-period-extras">
                                    <div className="asc-picker-period-checkbox">
                                        {/* {daysCount && <span className="days">{daysCount + 'D'}</span>} */}
                                        {index === benchmarkRangeIndex && <span className="benchmark">Benchmark</span>}
                                        {!disableBenchmarkChange && index !== benchmarkRangeIndex &&
                                            <input type="checkbox" className="checkbox" disabled={daysCount === null} checked={index === benchmarkRangeIndex} onChange={(e) => handleBenchmarkCheckbox(e.target.checked, index)} />
                                        }
                                    </div>
                                    {index !== benchmarkRangeIndex && ranges.length > 2 &&
                                        <span className="asc-picker-remove" onClick={() => handleRangeRemoveBtn(index)}></span>
                                    }
                                    {/* {index === ranges.length - 1 && ranges.length < maxPeriodCount &&
                                        <button className="asc-picker-add-period" disabled={daysCount === null} onClick={handlePeriodAddBtn}>Add Period</button>
                                    } */}
                                </div>
                            }
                            {/* {singleRangeonly &&
                                <div className="asc-picker-period-extras">
                                    {daysCount && <span className="days">{daysCount + 'D'}</span>}
                                </div>
                            } */}

                            {/* {!singleRangeonly && index === ranges.length - 1 && ranges.length < maxPeriodCount && */}
                            {!singleRangeonly &&
                                <button className={'asc-picker-add-period'} disabled={(daysCount === null || (index === ranges.length - 1 && ranges.length < maxPeriodCount ? false : true))} onClick={handlePeriodAddBtn}>Add Period</button>
                            }
                        </div>


                    );
                })}
            </div>
        </div >
    );
};

export { MultiPeriodPickerPanel };
