import React, { useState, useEffect } from 'react';
import ClickOutsideListener from './components/ClickOutsideListener';
import { DatePanel, MonthPanel, QuarterPanel, YearPanel } from './components/Panels';
import { isDateEqual, giveQuarterFromMonth, isDateSmaller } from './components/utils';
import { IconCalendar, IconClear, IconCancel, IconOk } from './components/SvgIcons';
import './calendar-styles.scss';



const RangePicker = ({ picker, showInline, placeholder, align, allowClear, range, dateForLastDaysCalculation, onChange, predefinedDates, showOkCancelBtns, disableFn }) => {
    picker = picker || 'date';
    showInline = showInline || false;
    align = align || 'left';
    allowClear = allowClear === false ? false : true;
    dateForLastDaysCalculation = dateForLastDaysCalculation || new Date();
    predefinedDates = predefinedDates || null;
    showOkCancelBtns = showOkCancelBtns || false;

    const [inputFocused, setInputFocused] = useState(false);
    const [rangeInState, setRangeInState] = useState((range && range[0] && range[1]) ? range : null);

    useEffect(() => {
        // update the Range value in state whenever range in prop changes
        setRangeInState((range && range[0] && range[1]) ? range : null);
    }, [range]);

    const handlePickerClick = () => {
        setTimeout(() => {
            setInputFocused(true);
        });
    }

    const handleInputFocus = (e) => {
        handlePickerClick(e);
    };

    const handleClearBtn = (e) => {
        e.stopPropagation();
        notifyRangeSelection(null)
    };

    const handleOutsideClick = () => {
        // console.log('outside clicked');
        // If ok Cancel btn is visible, user might have changed the 'rangeInState' before clicking outside
        // Hence, reset the Range 
        if (showOkCancelBtns) {
            handleCancelBtn();
        } else {
            setInputFocused(false);
        }
    }

    const handleRangeChange = (date) => {
        setRangeInState(date);
        if (showInline || !showOkCancelBtns) {
            notifyRangeSelection(date);
        }
    };

    const notifyRangeSelection = (rangeSelection) => {
        onChange(rangeSelection);
        setTimeout(() => {
            setInputFocused(false);
        }, 200);
    };

    const handleOkBtn = () => {
        notifyRangeSelection(rangeInState);
    };

    const handleCancelBtn = () => {
        // reset the state to earlier value available in 'range' prop
        setRangeInState((range && range[0] && range[1]) ? range : null);
        setInputFocused(false);
    };

    const giveFormattedDate = () => {

        if (rangeInState === null) { return ''; }
        if (picker === 'date') {
            return (rangeInState[0].getMonth() + 1 < 10 ? '0' + (rangeInState[0].getMonth() + 1) : rangeInState[0].getMonth() + 1) + '/' + (rangeInState[0].getDate() < 10 ? '0' + rangeInState[0].getDate() : rangeInState[0].getDate()) + '/' + rangeInState[0].getFullYear()
                + ' - '
                + (rangeInState[1].getMonth() + 1 < 10 ? '0' + (rangeInState[1].getMonth() + 1) : rangeInState[1].getMonth() + 1) + '/' + (rangeInState[1].getDate() < 10 ? '0' + rangeInState[1].getDate() : rangeInState[1].getDate()) + '/' + rangeInState[1].getFullYear();
        }
        if (picker === 'month') {
            return (rangeInState[0].getMonth() + 1 < 10 ? '0' + (rangeInState[0].getMonth() + 1) : rangeInState[0].getMonth() + 1) + '-' + rangeInState[0].getFullYear()
                + ' - '
                + (rangeInState[1].getMonth() + 1 < 10 ? '0' + (rangeInState[1].getMonth() + 1) : rangeInState[1].getMonth() + 1) + '-' + rangeInState[1].getFullYear();
        }
        if (picker === 'quarter') {
            return 'Q' + giveQuarterFromMonth(rangeInState[0].getMonth()) + '-' + rangeInState[0].getFullYear()
                + ' - '
                + 'Q' + giveQuarterFromMonth(rangeInState[1].getMonth()) + '-' + rangeInState[1].getFullYear();
        }
        // // for year
        return rangeInState[0].getFullYear() + ' - ' + rangeInState[1].getFullYear();
    };


    const displayDate = giveFormattedDate();
    placeholder = placeholder || 'Select ' + picker[0].toUpperCase() + picker.slice(1) + ' Range';

    return (
        <div className={'asc-date-picker asc-date-range-picker' + (showInline ? ' inline' : '')}>
            {!showInline &&
                <div className={'asc-picker-input' + (inputFocused ? ' asc-picker-input-focused' : '')} onClick={handlePickerClick}>
                    <div className="asc-picker-input-inner" >
                        <input placeholder={placeholder} autoComplete="off" size="24" value={displayDate} readOnly onFocus={handleInputFocus} />
                        <span className="asc-picker-suffix" style={{ visibility: rangeInState === null || allowClear === false ? 'visible' : 'hidden' }}>
                            <span role="img" className="asc-picker-icon asc-picker-cal-icon">
                                <IconCalendar />
                            </span>
                        </span>
                        {allowClear === true && rangeInState !== null && <span className="asc-picker-clear" onClick={handleClearBtn}>
                            <span role="img" className="asc-picker-icon asc-picker-cal-clear">
                                <IconClear />
                            </span>
                        </span>
                        }
                    </div>
                </div>
            }
            {!showInline && inputFocused &&
                <ClickOutsideListener onOutsideClick={handleOutsideClick}>
                    <div className="asc-picker-container" style={{ left: align === 'left' ? '0' : 'auto', right: align === 'right' ? '0' : 'auto' }}>
                        <RangePickerPanel picker={picker} range={rangeInState} dateForLastDaysCalculation={dateForLastDaysCalculation} onChange={handleRangeChange}
                            predefinedDates={predefinedDates}
                            showOkCancelBtns={showOkCancelBtns}
                            onCancel={handleCancelBtn}
                            onApply={handleOkBtn}
                            disableFn={disableFn} />
                    </div>
                </ClickOutsideListener>

            }
            {showInline &&
                <div className="asc-picker-container">
                    <RangePickerPanel picker={picker} range={rangeInState} dateForLastDaysCalculation={dateForLastDaysCalculation} onChange={handleRangeChange} predefinedDates={predefinedDates} disableFn={disableFn} />
                </div>
            }
        </div>
    )
};

const RangePickerPanel = ({ picker, range, dateForLastDaysCalculation, onChange, predefinedDates, showOkCancelBtns, onCancel, onApply, disableFn }) => {

    const [startYear, setStartYear] = useState(range ? range[0].getFullYear() : new Date().getFullYear());
    const [startMonth, setStartMonth] = useState(range ? range[0].getMonth() : new Date().getMonth());
    const [panel, setPanel] = useState(picker);
    const [prevPanel, setPrevPanel] = useState('');
    const [rangeStartDate, setRangeStartDate] = useState(range ? range[0] : null);
    const [rangeEndDate, setRangeEndDate] = useState(range ? range[1] : null);
    const [rangeHoverDate, setRangeHoverDate] = useState(null);


    const endYear = startMonth < 11 ? startYear : startYear + 1;
    const endMonth = startMonth < 11 ? startMonth + 1 : 0;

    // Dont' show Predefined dates if array is []
    const showPredefinedDates = picker === 'date' && panel === 'date' && (predefinedDates === null || predefinedDates.length > 0);
    predefinedDates = predefinedDates || ['LAST_7_DAYS', 'LAST_30_DAYS', 'THIS_MONTH', 'LAST_MONTH'];

    const setRangeDates = (year, month, day) => {
        setRangeHoverDate(null);
        if (!rangeStartDate && !rangeEndDate) {
            setRangeStartDate(new Date(year, month, day));
            return;
        }
        if (rangeStartDate && !rangeEndDate) {
            const rEnd = new Date(year, month, day);
            const isSmaller = isDateSmaller(rEnd, rangeStartDate);
            if (isSmaller) {
                setRangeStartDate(rEnd);
                setRangeEndDate(rangeStartDate);
                onChange([rEnd, rangeStartDate]);
            } else {
                setRangeEndDate(rEnd);
                onChange([rangeStartDate, rEnd]);
            }

            return;
        }
        setRangeStartDate(new Date(year, month, day));
        setRangeEndDate(null);
    };


    const handleDateClick = ([year, month, day]) => {
        setRangeDates(year, month, day);

    };
    const handleMonthClick = ([year, month]) => {
        // console.log('month clicked', month);
        setStartMonth(month);
        if (picker === 'date') {
            changePanels('', 'date');
        } else {
            setRangeDates(year, month, 1);
        }
    }
    const handleYearClick = ([year]) => {
        // console.log('year clicked', year);
        if (picker === 'date' || picker === 'month' || picker === 'quarter') {
            setStartYear(year);
            changePanels('', prevPanel);
        } else {
            setRangeDates(year, 0, 1);
        }
    };
    const handleQuarterClick = ([year, quarter]) => {
        setRangeDates(year, 3 * (quarter - 1), 1);
    };

    const handleYearBtnOnDateRangePanel = () => {
        // console.log('year clicked on date panel');
        changePanels('date', 'year-single');
    };
    const handleYearBtnOnMonthRangePanel = () => {
        // console.log('year clicked on month panel');
        changePanels('month', 'year-single');
    };
    const handleYearBtnOnQuarterRangePanel = () => {
        // console.log('year clicked on quarter panel');
        changePanels('quarter', 'year-single');
    };
    const handleYearBtnOnMonthPanel = () => {
        // console.log('year clicked on date panel');
        changePanels('month-single', 'year-single');
    };
    const handleMonthBtnOnDateRangePanel = () => {
        // console.log('month clicked on date panel');
        changePanels('date', 'month-single');
    };

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
        // console.log(rangeHoverDate);
        if (rangeStartDate && !rangeEndDate) {
            setRangeHoverDate(hoverDate);
        }
    };

    const giveDateRangeForPredefined = (pd) => {
        let startDate;
        let endDate = dateForLastDaysCalculation;
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
        setRangeStartDate(sd);
        setRangeEndDate(ed);
        onChange([sd, ed]);
    };

    const isPredefinedDateSelected = (pd) => {
        const [sd, ed] = giveDateRangeForPredefined(pd);
        return isDateEqual(sd, range[0]) && isDateEqual(ed, range[1]);
    }

    return (
        <React.Fragment>
            <div className="asc-single-picker-panels-wrapper">
                {panel === 'date' &&
                    <React.Fragment>
                        <div className="asc-picker-panel">
                            <DatePanel year={startYear} month={startMonth}
                                onDateClick={handleDateClick}
                                onMonthBtn={handleMonthBtnOnDateRangePanel}
                                onYearBtn={handleYearBtnOnDateRangePanel}
                                onPrevMonthBtn={handlePrevMonthClick}
                                disable={disableFn}
                                rangeStartDate={rangeStartDate}
                                rangeEndDate={rangeEndDate}
                                rangeHoverDate={rangeHoverDate}
                                onDateHover={handleDateHover}
                            // selectDate={(dObj) => date ? isDateEqual(dObj, date) : false}
                            />
                        </div>
                        <div className="asc-picker-panel">
                            <DatePanel year={endYear} month={endMonth}
                                onDateClick={handleDateClick}
                                onMonthBtn={handleMonthBtnOnDateRangePanel}
                                onYearBtn={handleYearBtnOnDateRangePanel}
                                onNextMonthBtn={handleNextMonthClick}
                                disable={disableFn}
                                rangeStartDate={rangeStartDate}
                                rangeEndDate={rangeEndDate}
                                rangeHoverDate={rangeHoverDate}
                                onDateHover={handleDateHover}
                            // selectDate={(dObj) => date ? isDateEqual(dObj, date) : false}
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
                                rangeStartDate={rangeStartDate}
                                rangeEndDate={rangeEndDate}
                                rangeHoverDate={rangeHoverDate}
                                onDateHover={handleDateHover}
                                disable={picker === 'month' ? disableFn : () => false}
                            // selectMonth={(month, y) => date ? month === date.getMonth() : false}
                            />
                        </div>
                        <div className="asc-picker-panel">
                            <MonthPanel year={startYear + 1} month={endMonth}
                                onMonthClick={handleMonthClick}
                                onYearBtn={handleYearBtnOnMonthRangePanel}
                                onNextYearBtn={handleNextYearClick}
                                rangeStartDate={rangeStartDate}
                                rangeEndDate={rangeEndDate}
                                rangeHoverDate={rangeHoverDate}
                                onDateHover={handleDateHover}
                                disable={picker === 'month' ? disableFn : () => false}
                            // selectMonth={(month, y) => date ? month === date.getMonth() : false}
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
                                rangeStartDate={rangeStartDate}
                                rangeEndDate={rangeEndDate}
                                rangeHoverDate={rangeHoverDate}
                                onDateHover={handleDateHover}
                                disable={picker === 'year' ? disableFn : () => false}

                            // selectYear={(y) => date ? y === date.getFullYear() : false}
                            />
                        </div>
                        <div className="asc-picker-panel">
                            <YearPanel year={startYear + 10}
                                onYearClick={handleYearClick}
                                onNextDecadeBtn={handleNextDecadeClick}
                                rangeStartDate={rangeStartDate}
                                rangeEndDate={rangeEndDate}
                                rangeHoverDate={rangeHoverDate}
                                onDateHover={handleDateHover}
                                disable={picker === 'year' ? disableFn : () => false}
                            // selectYear={(y) => date ? y === date.getFullYear() : false}
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
                                rangeStartDate={rangeStartDate}
                                rangeEndDate={rangeEndDate}
                                rangeHoverDate={rangeHoverDate}
                                onDateHover={handleDateHover}
                                disable={picker === 'quarter' ? disableFn : () => false}
                            // selectQuarter={(quarter, y) => date ? y === date.getFullYear() && quarter === giveQuarterFromMonth(date.getMonth()) : false}
                            />
                        </div>
                        <div className="asc-picker-panel">
                            <QuarterPanel year={startYear + 1}
                                onQuarterClick={handleQuarterClick}
                                onYearBtn={handleYearBtnOnQuarterRangePanel}
                                onNextYearBtn={handleNextYearClick}
                                rangeStartDate={rangeStartDate}
                                rangeEndDate={rangeEndDate}
                                rangeHoverDate={rangeHoverDate}
                                onDateHover={handleDateHover}
                                disable={picker === 'quarter' ? disableFn : () => false}
                            // selectQuarter={(quarter, y) => date ? y === date.getFullYear() && quarter === giveQuarterFromMonth(date.getMonth()) : false}
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
                        // disable={disableDate}
                        // selectMonth={(month, y) => date ? month === date.getMonth() : false}
                        />
                    </div>
                }
                {panel === 'year-single' &&
                    <div className="asc-picker-panel">
                        <YearPanel year={startYear}
                            onYearClick={handleYearClick}
                            onPrevDecadeBtn={handlePrevDecadeClick}
                            onNextDecadeBtn={handleNextDecadeClick}
                        // disable={(y) => year <= 2034}
                        // selectYear={(y) => date ? y === date.getFullYear() : false}
                        />
                    </div>
                }
            </div>
            {showPredefinedDates &&
                <div className="asc-picker-predefined-wrapper">
                    {predefinedDates.slice(0, 4).map((pd) => {
                        const label = pd.split('_').map(str => str[0].toUpperCase() + str.slice(1).toLowerCase()).join(' ')
                        const isSelected = range ? isPredefinedDateSelected(pd) : false;
                        return (
                            <div key={label} className={'asc-picker-predefined-date' + (isSelected ? ' asc-picker-predefined-date-selected' : '')} onClick={() => handlePredefinedDateClick(pd)}>
                                <span className="asc-picker-predefined-date-label">{label}</span>
                            </div>
                        );
                    })}
                </div>
            }
            {showOkCancelBtns &&
                <div className="asc-picker-action-buttons">
                    <button className="button cancel" onClick={onCancel}>
                        <IconCancel />
                    </button>
                    <button className="button apply" onClick={onApply}>
                        <IconOk />
                    </button>


                </div>
            }
        </React.Fragment>
    );
};

export default RangePicker;

