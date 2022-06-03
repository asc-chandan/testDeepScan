
import React, { useState } from 'react';
import ClickOutsideListener from './components/ClickOutsideListener';
import { DatePanel, MonthPanel, QuarterPanel, YearPanel } from './components/Panels';
import { isDateEqual, giveQuarterFromMonth } from './components/utils';
import { IconCalendar, IconClear } from './components/SvgIcons';
import './calendar-styles.scss';


const DatePicker = ({ picker, showInline, placeholder, align, allowClear, date, onChange, disableFn }) => {
    picker = picker || 'date';
    showInline = showInline || false;
    align = align || 'left';
    date = date || null;
    allowClear = allowClear === false ? false : true;

    const [inputFocused, setInputFocused] = useState(false);
    const [dropDownPosBottom, setDropDownPosBottom] = useState(false);

    const handlePickerClick = (e) => {
        let elementObj = e.target;
        let topPos = elementObj.getBoundingClientRect().top;
 
        if((topPos + 175) >= window.innerHeight && inputFocused===false){
            setDropDownPosBottom(true);
        }
        setTimeout(()=>{
            setInputFocused(true);
        });
    }

    const handleInputFocus = (e) => {
        // console.log('input focus');
        handlePickerClick(e);
    };

    const handleClearBtn = (e) => {
        e.stopPropagation();
        handleDateChange('', null);
    };

    const handleOutsideClick = (e) => {
        // console.log('outside clicked');
        setInputFocused(false);
    }

    const handleDateChange = (dateStr, date) => {
        onChange(dateStr, date);
        setTimeout(() => {
            setInputFocused(false);
        }, 200);
    };

    const giveFormattedDate = () => {
        if (date === null) { return ''; }
        if (picker === 'date') {
            return (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '/' + (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + '/' + date.getFullYear();
        }
        if (picker === 'month') {
            return (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-' + date.getFullYear();
        }
        if (picker === 'quarter') {
            return 'Q' + giveQuarterFromMonth(date.getMonth()) + '-' + date.getFullYear();
        }
        // for year
        return date.getFullYear();
    };

    const displayDate = giveFormattedDate();
    placeholder = placeholder || 'Select ' + picker[0].toUpperCase() + picker.slice(1);

    return (
        <div className={'asc-date-picker' + (showInline ? ' inline' : '')}>
            {!showInline &&
                <div className={'asc-picker-input' + (inputFocused ? ' asc-picker-input-focused' : '')} onClick={handlePickerClick}>
                    <div className="asc-picker-input-inner" >
                        <input placeholder={placeholder} autoComplete="off" size="12" value={displayDate} readOnly onFocus={handleInputFocus} />
                        <span className="asc-picker-suffix" style={{ visibility: date === null || allowClear === false ? 'visible' : 'hidden' }}>
                            <span role="img" className="asc-picker-icon asc-picker-cal-icon">
                                <IconCalendar />
                            </span>
                        </span>
                        {allowClear === true && date !== null && 
                            <span className="asc-picker-clear" onClick={handleClearBtn}>
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
                    <div className="asc-picker-container" style={{ left: align === 'left' ? '0' : 'auto', right: align === 'right' ? '0' : 'auto', top: dropDownPosBottom ? 'auto' : 'calc(100% + 5px)', bottom: dropDownPosBottom ? 'calc(100% + 5px)' : 'auto'  }}>
                        <DatePickerPanel picker={picker} date={date} onChange={handleDateChange} disableFn={disableFn} />
                    </div>
                </ClickOutsideListener>
            }
            {showInline &&
                <DatePickerPanel picker={picker} date={date} onChange={handleDateChange} disableFn={disableFn} />
            }
        </div>
    )
};

const DatePickerPanel = ({ picker, date, onChange, disableFn }) => {

    const [year, setYear] = useState(date ? date.getFullYear() : new Date().getFullYear());
    const [month, setMonth] = useState(date ? date.getMonth() : new Date().getMonth());
    const [panel, setPanel] = useState(picker);
    const [prevPanel, setPrevPanel] = useState('');


    const handleDateClick = ([year, month, day]) => {
        const dObj = new Date(year, month, day);
        const dStr = dObj.getFullYear() + '-' + (dObj.getMonth() + 1 < 10 ? '0' + (dObj.getMonth() + 1) : dObj.getMonth() + 1) + '-' + (dObj.getDate() < 10 ? '0' + dObj.getDate() : dObj.getDate());
        onChange(dStr, dObj);
    };
    const handleMonthClick = ([year, month]) => {
        // console.log('month clicked', month);
        setMonth(month);
        if (picker === 'date') {
            changePanels('', 'date');
        } else {
            // send the date object with selected month and selected year and 1st date
            const dObj = new Date(year, month, 1);
            const dStr = dObj.getFullYear() + '-' + (dObj.getMonth() + 1 < 10 ? '0' + (dObj.getMonth() + 1) : dObj.getMonth() + 1);
            onChange(dStr, dObj);
        }
    }
    const handleYearClick = ([year]) => {
        // console.log('year clicked', year);
        setYear(year);
        if (picker === 'date' || picker === 'month' || picker === 'quarter') {
            changePanels('', prevPanel);
        } else {
            // send the date object with selected year and Quarter & 1st date 
            const dObj = new Date(year, 0, 1);
            const dStr = dObj.getFullYear() + '';
            onChange(dStr, dObj);
        }
    };
    const handleQuarterClick = ([year, quarter]) => {
        const dObj = new Date(year, Math.floor(quarter - 1) * 3, 1);
        const dStr = dObj.getFullYear() + '-Q' + quarter;
        onChange(dStr, dObj);
    };

    const handleYearBtnOnDatePanel = () => {
        // console.log('year clicked on date panel');
        changePanels('date', 'year');
    };
    const handleYearBtnOnMonthPanel = () => {
        // console.log('year clicked on month panel');
        changePanels('month', 'year');
    };
    const handleYearBtnOnQuarterPanel = () => {
        // console.log('year clicked on quarter panel');
        changePanels('quarter', 'year');
    };
    const handleMonthBtnOnDatePanel = () => {
        // console.log('month clicked on date panel');
        changePanels('date', 'month');
    };

    const changePanels = (prevP, currP) => {
        setTimeout(() => {
            setPrevPanel(prevP);
            setPanel(currP);
        });
    };

    const handlePrevMonthClick = (e) => {
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        setMonth(prevMonth);
        setYear(prevYear);
    };
    const handleNextMonthClick = (e) => {
        const nextMonth = (month + 1) % 12;
        const nextYear = month === 11 ? year + 1 : year;
        setMonth(nextMonth);
        setYear(nextYear);
    };

    const handlePrevYearClick = (e) => setYear(year - 1);
    const handleNextYearClick = (e) => setYear(year + 1);
    const handlePrevDecadeClick = () => setYear(year - 10);
    const handleNextDecadeClick = () => setYear(year + 10);

    return (
        <div className="asc-picker-panel">
            {panel === 'date' &&
                <DatePanel year={year} month={month}
                    onDateClick={handleDateClick}
                    onMonthBtn={handleMonthBtnOnDatePanel}
                    onYearBtn={handleYearBtnOnDatePanel}
                    onPrevMonthBtn={handlePrevMonthClick}
                    onNextMonthBtn={handleNextMonthClick}
                    disable={disableFn}
                    selectDate={(dObj) => date ? isDateEqual(dObj, date) : false}
                />
            }
            {panel === 'month' &&
                <MonthPanel year={year} month={month}
                    onMonthClick={handleMonthClick}
                    onYearBtn={handleYearBtnOnMonthPanel}
                    onPrevYearBtn={handlePrevYearClick}
                    onNextYearBtn={handleNextYearClick}
                    disable={picker === 'month' ? disableFn : () => false}
                    selectMonth={(month, y) => date ? month === date.getMonth() : false}
                />
            }
            {panel === 'year' &&
                <YearPanel year={year}
                    onYearClick={handleYearClick}
                    onPrevDecadeBtn={handlePrevDecadeClick}
                    onNextDecadeBtn={handleNextDecadeClick}
                    disable={picker === 'year' ? disableFn : () => false}
                    selectYear={(y) => date ? y === date.getFullYear() : false}

                />
            }
            {panel === 'quarter' &&
                <QuarterPanel year={year}
                    onQuarterClick={handleQuarterClick}
                    onYearBtn={handleYearBtnOnQuarterPanel}
                    onPrevYearBtn={handlePrevYearClick}
                    onNextYearBtn={handleNextYearClick}
                    disable={picker === 'quarter' ? disableFn : () => false}
                // selectQuarter={(quarter, y) => date ? y === date.getFullYear() && quarter === giveQuarterFromMonth(date.getMonth()) : false}

                />
            }
        </div>
    );
};

export default DatePicker;