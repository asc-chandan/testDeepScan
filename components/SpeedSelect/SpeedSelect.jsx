import React from 'react';
import './SpeedSelect.scss';

import ClickedOutsideListener from './components/ClickOutsideListener';

export default class SpeedSelect extends React.Component {
    constructor(props) {
        super(props);

        this.validateProps(props);
        this.state = this.giveState(props);

        this.dropDownRef = React.createRef();
        this.selectBoxRef = React.createRef();
        this.searchInputRef = React.createRef();
        this.dropDownPositionStyles = {
            top: 'calc(100% + 6px)',
            bottom: null,
            left: this.props.dropdownAlignment !== 'right' ? '0px' : 'auto',
            right: this.props.dropdownAlignment === 'right' ? '0px' : 'auto',
        };

        this.closeDropdown = this.closeDropdown.bind(this);
        this.handleOptionClick = this.handleOptionClick.bind(this);
        this.handleOptionRemove = this.handleOptionRemove.bind(this);
        this.handleSelectBoxClick = this.handleSelectBoxClick.bind(this);
        this.handleKeyBoardEvents = this.handleKeyBoardEvents.bind(this);
        this.handleDropdownOutsideClick = this.handleDropdownOutsideClick.bind(this);
        this.handleSearch = this.handleSearch.bind(this);

        this.handleSelectOpen = this.handleSelectOpen.bind(this); //Open dropdown on label click
    }

    validateProps(props) {
        // validate required props here before doing anything
        if (!Array.isArray(props.options)) {
            throw Error('options prop must be an \'Array\'');
        }

        const optionType = typeof props.options[0];
        if (optionType === 'object') {
            if (!props.displayKey || !props.uniqueKey) {
                throw Error('Both displayKey and uniqueKey props must be provided when options is an \'Object Array\'');
            }
        }
        // validate selectedOptions type in case of multiple
        if (props.hasOwnProperty('multiple') && !Array.isArray(props.selectedOption)) {
            throw Error('selectedOption prop must be an \'Array\' in case multiple prop is present');
        }
    }

    giveState(props) {
        return {
            isOpen: false,
            optionsCopy: props.options,
            inputSearch: '',
            keyboardSelectedIndex: null, // stores the index of currently selected item using keyup and keydown keys
            // keyboardEnterPressedOnItem: false, // used to trigger the selection of the keyboard selected item
            checkedOptions: props.selectedOption, // used only in case of multiple select
            isMultiple: props.hasOwnProperty('multiple')
        };
    }


    componentDidUpdate(prevProps, prevState) {
        if (prevProps.options !== this.props.options) {
            this.validateProps(this.props);
            this.setState(this.giveState(this.props));
        }
    }


    handleSelectBoxClick(e) {
        e.stopPropagation();
        if (!this.props.options.length) {
            // ignore the click until options are available
            return;
        }
        this.setState({
            // reset overall state and specifically change the value which is required 
            ...this.giveState(this.props),
            isOpen: true,
        }, ()=>{
            if (!this.state.isOpen) {
                // since handleSelectBox is also called when user press the select box to close the opened dropdown
                // hence in this case dropdown is not available (this.dropDownRef will be 'null'), no need to recompute the styles 
                // Do check that if dropdown is open or not before doing anything
                return;
            }

            //to handle sub header z-index only
            setTimeout(()=>{
                if(this.props.onDropDownOpen){
                    this.props.onDropDownOpen(this.state.isOpen); 
                }
            },10);
            
            this.searchInputRef.current && this.searchInputRef.current.focus();

            // dropDown's height  is available now, do required computations here
            const selectBoxRect = this.selectBoxRef.current.getBoundingClientRect();
            // decide vertical position 
            const windowHeight = window.innerHeight;
            const dropDownHeight = this.dropDownRef.current.clientHeight;
            const selectBoxBottomPos = selectBoxRect.bottom;
            const selectBoxTopPos = selectBoxRect.top;

            const isHieghtBelowEnough = (windowHeight - selectBoxBottomPos) > dropDownHeight + 35;/** 35 is the gap btwn select box and dropdown*/
            const isHieghtAboveEnough = selectBoxTopPos > dropDownHeight + 35;
            if (isHieghtBelowEnough || !isHieghtAboveEnough) {
                // remaining height is more than enough,  show dropdown below the select-box
                if (this.dropDownPositionStyles.top) {
                    // do nothing if already below
                    // this is to avoid re-render
                    return;
                }
                this.dropDownPositionStyles = {
                    top: 'calc(100% + 6px)',
                    bottom: null
                };
                this.forceUpdate();
            } else {
                // remaining height is less than enough,  show dropdown above the select-box
                if (this.dropDownPositionStyles.bottom) {
                    // do nothing if alrady above
                    return;
                }
                this.dropDownPositionStyles = {
                    top: null,
                    bottom: 'calc(100% + 6px)'
                };
                this.forceUpdate();
            }
        });
    }

    handleKeyBoardEvents(e) {
        // console.log('keyboard event on select box called...', e.eventPhase, e.defaultPrevented);
        e.stopPropagation();
        // do not call preventDefault(), calling this will prevent the onChange event to be executed on search input
        switch (e.key) {
            case 'Enter':
                if (!this.state.isOpen) {
                    // console.log('opening on enter btn');
                    this.handleSelectBoxClick(e);
                    return;
                }
                if (this.state.keyboardSelectedIndex !== null) {
                    const currentOption = this.state.optionsCopy[this.state.keyboardSelectedIndex];
                    // this.setState({ keyboardEnterPressedOnItem: true });
                    if (this.state.isMultiple) {
                        const isOptionObject = typeof this.props.options[0] === 'object';
                        const { uniqueKey } = this.props;
                        const isChecked = isOptionObject ? this.state.checkedOptions.some(co => co[uniqueKey] === currentOption[uniqueKey]) : this.state.checkedOptions.includes(currentOption);
                        this.handleOptionClickMultiple(currentOption, !isChecked);
                    } else {
                        this.handleOptionClickSingle(currentOption);
                    }
                }
                break;

            case 'ArrowDown':
                if (!this.state.isOpen) {
                    // console.log('opening on ArrowDown btn');
                    this.handleSelectBoxClick(e);
                    return;
                }
                // TODO : FIND NEXT SELECTABLE OPTION
                this.setState({ keyboardSelectedIndex: this.giveNextKeyboardSelectableIndex(e.key) });
                break;

            case 'ArrowUp':
                this.setState({ keyboardSelectedIndex: this.giveNextKeyboardSelectableIndex(e.key) });
                break;

            case 'Tab':
                if (this.state.isOpen && (!this.state.isMultiple || this.props.hideOkCancelBtns)) {
                    this.closeDropdown();
                    return;
                }
                break;

            default:
                break;
        }

    }

    giveNextKeyboardSelectableIndex(key) {
        if (key === 'ArrowDown') {
            if (this.state.keyboardSelectedIndex === this.state.optionsCopy.length - 1) {
                // can't go beyond this, hence return the exisitng one
                return this.state.keyboardSelectedIndex;
            }

            // find next selectable(not disabled) index  starting from startIndex and moving downwards
            const startIndex = this.state.keyboardSelectedIndex === null ? 0 : this.state.keyboardSelectedIndex + 1;
            let nextIndex = null;
            for (let i = startIndex, l = this.state.optionsCopy.length; i < l; i++) {
                const op = this.state.optionsCopy[i];
                const { disabledOptions = [], uniqueKey } = this.props;
                const isOptionObject = typeof this.props.options[0] === 'object';
                const isDisabled = isOptionObject ? disabledOptions.some(d => d[uniqueKey] === op[uniqueKey]) : disabledOptions.includes(op);
                if (!isDisabled) {
                    nextIndex = i;
                    break;
                }
            }
            if (nextIndex === null) {
                // no next selectable item found, hence return exisiting one
                return this.state.keyboardSelectedIndex;
            }
            return nextIndex;
        } else {
            //  key==='ArrowUp'
            if (this.state.keyboardSelectedIndex === 0) {
                // can't go above this, hence return 0
                return 0;
            }
            if (this.state.keyboardSelectedIndex === null) {
                // no index is selected yet, in this case, find the first index selectable from top
                // it is similar to finding first index when 'ArrowDown' Key is pressed
                return this.giveNextKeyboardSelectableIndex('ArrowDown');
            }

            // find next selectable index starting from startIndex and moving upwards
            const startIndex = this.state.keyboardSelectedIndex - 1;
            let nextIndex = null;
            for (let i = startIndex; i >= 0; i--) {
                const op = this.state.optionsCopy[i];
                const { disabledOptions = [], uniqueKey } = this.props;
                const isOptionObject = typeof this.props.options[0] === 'object';
                const isDisabled = isOptionObject ? disabledOptions.some(d => d[uniqueKey] === op[uniqueKey]) : disabledOptions.includes(op);
                if (!isDisabled) {
                    nextIndex = i;
                    break;
                }
            }
            if (nextIndex === null) {
                return this.state.keyboardSelectedIndex;
            }
            return nextIndex;
        }
    }

    closeDropdown() {
        this.setState({ isOpen: false }, ()=>{
            if(this.props.onDropDownOpen){
                this.props.onDropDownOpen(this.state.isOpen); //to handle sub header z-index
            }
        });
    }

    handleDropdownOutsideClick(e) {
        this.closeDropdown();
    }

    handleOptionClick(e, op, singleOrMultiple) {
        e.stopPropagation();
        if (singleOrMultiple === 'multiple') {
            this.handleOptionClickMultiple(op, e.target.checked);
        } else {
            this.handleOptionClickSingle(op);
        }
    }

    handleOptionClickSingle(op) {
        // op is the clicked item
        this.props.onSelect(op);
        this.closeDropdown();
    }

    handleOptionClickMultiple(op, checked) {

        // op indicates what is clicked or pressed
        if (op === 'CANCEL_BTN') {
            // close dropdown, no other action needed
            this.closeDropdown();
        } else if (op === 'OK_BTN') {
            // send the list of checkedOptions to parent component and close dropdown
            this.props.onSelect(this.state.checkedOptions);
            this.closeDropdown();
        } else if (op === 'SELECT_ALL_BTN') {
            let updated;
            const isOptionObject = typeof this.props.options[0] === 'object';
            const { disabledOptions = [], uniqueKey } = this.props;
            const { checkedOptions, optionsCopy } = this.state;
            if (checked) {
                // filter out options which are disabled
                updated = optionsCopy.filter(oc => !disabledOptions.some(dop => isOptionObject ? dop[uniqueKey] === oc[uniqueKey] : dop === oc));
                // check if updated contains the current selected ones, if not then add
                checkedOptions.forEach(co => {
                    const presentAlready = updated.some(uo => isOptionObject ? uo[uniqueKey] === co[uniqueKey] : uo === co);
                    if (!presentAlready) {
                        updated.push(co);
                    }
                });
            } else {
                // filter out all options visible(present in optionsCopy) which are not disabled 
                const optionsCopyNotDisabled = optionsCopy.filter(oc => !disabledOptions.some(dop => isOptionObject ? dop[uniqueKey] === oc[uniqueKey] : dop === oc));
                updated = checkedOptions.filter(co => !optionsCopyNotDisabled.some(oc => isOptionObject ? co[uniqueKey] === oc[uniqueKey] : co === oc));
            }
            this.setState({ checkedOptions: updated });
            if (this.props.hideOkCancelBtns) {
                this.props.onSelect(updated);
            }
        } else {
            // else checkbox of an option has been checked/unchecked
            // here op is the option itself
            // this code will also be executed in case Enter Key is pressed
            let updated;
            const { checkedOptions } = this.state;
            const { uniqueKey } = this.props;
            const isOptionObject = typeof this.props.options[0] === 'object';
            if (checked) {
                updated = [...checkedOptions, op];
            } else {
                const index = isOptionObject ? checkedOptions.findIndex(co => co[uniqueKey] === op[uniqueKey]) : checkedOptions.indexOf(op);
                updated = [...checkedOptions.slice(0, index), ...checkedOptions.slice(index + 1)];
            }
            this.setState({ checkedOptions: updated });
            if (this.props.hideOkCancelBtns) {
                this.props.onSelect(updated);
            }
        }

    }

    /**For handling cross btn in selected option (in both single and multipe select) */
    handleOptionRemove(e, op, singleOrMultiple) {
        e.stopPropagation();
        if (singleOrMultiple === 'multiple') {
            this.handleOptionClickMultiple(op, false);
        } else {
            this.handleOptionClickSingle(null);
        }
    }


    handleSearch(e) {
        const value = e.target.value, dk = this.props.displayKey, isObj = typeof this.props.options[0] === 'object';
        if (value.trim() === '') {
            this.setState({ optionsCopy: this.props.options, inputSearch: value, keyboardSelectedIndex: null });
            return;
        }
        const filteredOptions = this.props.options.filter(op => isObj ? op[dk].toLowerCase().includes(value.toLowerCase()) : op.toLowerCase().includes(value.toLowerCase()));
        this.setState({ optionsCopy: filteredOptions, inputSearch: value, keyboardSelectedIndex: null });
    }

    //Open select dropdown on label click
    handleSelectOpen(e) {
        e.preventDefault();
        if (this.props.isLabelClickable !== undefined && this.props.isLabelClickable) {
            this.setState({ isOpen: true }, ()=>{
                setTimeout(()=>{
                    if(this.props.onDropDownOpen){
                        this.props.onDropDownOpen(this.state.isOpen); //to handle sub header z-index
                    }
                },10);
            });
        } else {
            return false;
        }
    }


    render() {
        const isOptionObject = typeof this.props.options[0] === 'object';
        const isMultiple = this.state.isMultiple;
        return (
            <div className={'react-select-container' + (isMultiple ? ' multiple' : ' single')}>
                {this.props.prominentLabel &&
                    <div className={'select-label-wrapper' + (this.state.isOpen ? ' focused' : '')} onClick={this.handleSelectOpen}>{this.props.prominentLabel}</div>
                }

                <div className="select-box-wrapper">
                    <div ref={this.selectBoxRef} tabIndex="0" onKeyDown={this.handleKeyBoardEvents}
                        className={'select-box' + (this.state.isOpen ? ' focused' : '') + (this.props.disable ? ' disabled' : '')}
                        onClick={this.handleSelectBoxClick}>
                        <SelectBoxLabel
                            onSelectedOptionRemove={this.handleOptionRemove}
                            isOptionObject={isOptionObject} {...this.props} {...this.state} />
                        <div className="dropdown-icon-wrapper">
                            <div>{/*this div renders dropdown icon*/}</div>
                        </div>
                    </div>
                    {this.state.isOpen &&
                        <ClickedOutsideListener isOpen={this.state.isOpen} onOutsideClick={this.handleDropdownOutsideClick}>
                            <DropDown {...this.props} {...this.state} isOptionObject={isOptionObject}
                                innerRef={this.dropDownRef}
                                inputRef={this.searchInputRef} handleSearch={this.handleSearch}
                                keyboardHandler={this.handleKeyBoardEvents}
                                style={this.dropDownPositionStyles}
                                onOptionClick={this.handleOptionClick}
                            />
                        </ClickedOutsideListener>
                    }
                </div>
            </div>
        );
    }
}

const selectBoxLabelClickHandler = (e) => {
    // stop click event to propagating to DOM, otherwise dropdown will close immediatly due to event emitted by <ClickedOutsideListener/>
    e.persist();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
}

const SelectBoxLabel = ({ selectedOption, optionsCopy, displayKey, selectLabel, showResetBtn, onSelectedOptionRemove, isMultiple, showSelectionsInChipForm, selectionWrapperMaxHeight, hideOkCancelBtns, isOptionObject, isOpen, handleSearch, inputSearch, inputRef }) => {


    showSelectionsInChipForm = showSelectionsInChipForm || false;
    selectionWrapperMaxHeight = selectionWrapperMaxHeight ? selectionWrapperMaxHeight + 'px' : 'auto';

    // in multiple, always show selectLabel with selected count
    if (isMultiple) {
        const allSelected = selectedOption.length === optionsCopy.length;
        return (
            <div className="label-wrapper multiple" title={selectLabel || 'Select'}>
                {
                    showSelectionsInChipForm && selectedOption.length ?
                        <div className="selected-options-wrapper" style={{ maxHeight: selectionWrapperMaxHeight }}>
                            {selectedOption.map((op, i) => (
                                <div className="selected-option-item" key={i}>
                                    <span className="selected-option-item-content">{op[displayKey]}</span>
                                    {hideOkCancelBtns && <span className="selected-option-item-remove" onClick={(e) => onSelectedOptionRemove(e, op, 'multiple')}>x</span>}
                                </div>
                            ))}
                        </div>
                        : <span className="label">{selectLabel || 'Select'}</span>
                }

                {selectedOption.length > 0 &&
                    <span className="count">{allSelected ? 'All (' + selectedOption.length + ')' : '+' + selectedOption.length}</span>
                }
            </div>
        );
    }
    // in single, show selected option if available, otherwise show selectLabel
    if (selectedOption) {
        const labelTxt = isOptionObject ? selectedOption[displayKey] : selectedOption;
        return (
            <div className="label-wrapper" title={labelTxt}>
                <span className="label">{labelTxt}</span>
                {showResetBtn && <span className="remove-btn" onClick={(e) => onSelectedOptionRemove(e, null, 'single')}>X</span>}
            </div>
        );
    }
    return (
        <div className="label-wrapper" title={selectLabel || 'Select'}>
            <span className="label">{selectLabel || 'Select'}</span>
        </div>
    );

}


const DropDown = ({ innerRef, style, isMultiple, disableSearch, inputRef, searchPlaceholder, inputSearch, handleSearch, keyboardHandler, ...rest }) => {
    let updated_style = {...style};
    if(inputSearch.trim() !== '') {
        updated_style['minWidth'] = '160px';
    }
    
    return (
        <div ref={innerRef} style={updated_style} className={'select-dropdown'} >
            {  !disableSearch &&
                <div className="search-wrapper" >
                    <input ref={inputRef} className="search" placeholder={searchPlaceholder || 'Search'}
                        value={inputSearch}
                        onChange={handleSearch}
                        onClick={selectBoxLabelClickHandler}
                        onKeyDown={keyboardHandler} />
                </div>
            }

            {isMultiple ?
                <MultipleDropDown inputSearch={inputSearch}  {...rest} /> :
                <SingleDropDown inputSearch={inputSearch} {...rest} />
            }
        </div>
    )
};


const MultipleDropDown = ({ optionsCopy, checkedOptions, disabledOptions = [], hideOkCancelBtns, displayKey, uniqueKey, imgKey, onOptionClick, isOptionObject, inputSearch, createNewOptionWhenNotMatched, keyboardSelectedIndex, maxSelectionLimit, maxHeight }) => {
    maxSelectionLimit = maxSelectionLimit || null;

    let allSelected = false;
    if (optionsCopy.length !== 0) {
        // filter out the disabled ones from the visible ones
        let visibleEnabled = optionsCopy.filter(oc => !disabledOptions.some(dop => isOptionObject ? dop[uniqueKey] === oc[uniqueKey] : dop === oc));
        // check if each option in visibleEnabled is selected or not
        if (visibleEnabled.length && visibleEnabled.every(oc => checkedOptions.some(co => isOptionObject ? co[uniqueKey] === oc[uniqueKey] : co === oc))) {
            allSelected = true;
        }
        // console.log('visibleeEnabled',visibleEnabled,allSelected);
    }

    maxHeight = maxHeight ? maxHeight + 'px' : '450px';

    const handleOKBtnKeyboard = (e) => {
        if (e.key === 'Enter') {
            // on Enter key, do same as on click event
            onOptionClick(e, 'OK_BTN', 'multiple');
        }
    }

    const handleCANCELBtnKeyboard = (e) => {
        if (e.key === 'Enter' || e.key === 'Tab') {
            // on Enter or Tab key, do same as on click event
            onOptionClick(e, 'CANCEL_BTN', 'multiple');
        }
    }
    const newOptionToCreate = createNewOptionWhenNotMatched ? isOptionObject ? { [uniqueKey]: 'NEW_' + inputSearch.trim().toUpperCase(), [displayKey]: inputSearch.trim() } : inputSearch.trim() : null;
    const isMaxSelectionLimitDone = checkedOptions.length === maxSelectionLimit;
    return (
        <div className="options-with-btns">
            <div className={'select-all' + ((optionsCopy.length === 0 || maxSelectionLimit) ? ' disabled' : '')}>
                <label htmlFor='select-all' className={'checkbox-wrapper ' + (allSelected ? 'checked' : '')}>
                    <div className="chkbox">
                        <input id='select-all' type="checkbox" tabIndex="-1" checked={allSelected} onChange={(e) => onOptionClick(e, 'SELECT_ALL_BTN', 'multiple')} />
                    </div>
                    <span className="chkbox-label">{'Select All' + (inputSearch.trim() !== '' ? ' (Filtered)' : '')}</span>
                </label>
            </div>

            <div className='options-wrapper'>
                <ul className={'options' + (imgKey ? ' options-with-img' : '')} style={{ maxHeight }}>
                    {optionsCopy.map((op, index) => {
                        const isSelected = isOptionObject ? checkedOptions.some(co => co[uniqueKey] === op[uniqueKey]) : checkedOptions.includes(op);
                        const isDisabled = (isOptionObject ? disabledOptions.some(dop => dop[uniqueKey] === op[uniqueKey]) : disabledOptions.includes(op))
                            || (isMaxSelectionLimitDone && !isSelected);
                        const isKeyboardSelected = index === keyboardSelectedIndex;
                        const label = isOptionObject ? op[displayKey] : op;
                        const id = isOptionObject ? op[uniqueKey] : op;
                        const imgUrl = isOptionObject ? op[imgKey] : '';

                        return <li key={index} className={isDisabled ? 'disabled' : isKeyboardSelected ? 'keyboard-selected' : null}>
                            <label htmlFor={id} className={'checkbox-wrapper ' + (isSelected ? 'checked' : '')}>
                                <span className="chkbox">
                                    <input id={id} type="checkbox" tabIndex="-1" checked={isSelected} onChange={(e) => !isDisabled && onOptionClick(e, op, 'multiple')} />
                                </span>

                                <span className="chkbox-label">
                                    {imgKey && <div style={{ backgroundImage: `url(${imgUrl})` }} className="option-img"></div>}
                                    {label}
                                </span>
                            </label>
                        </li>
                    })}
                    {!newOptionToCreate && !optionsCopy.length && inputSearch.trim() !== '' &&
                        <li className={'no-match'}>
                            <label className="checkbox-wrapper">
                                <span>No match found</span>
                            </label>
                        </li>
                    }
                    {newOptionToCreate && !optionsCopy.length && inputSearch.trim() !== '' &&
                        <li className={'create-option ' + (0 === keyboardSelectedIndex ? 'keyboard-selected' : '')}>
                            <label htmlFor={isOptionObject ? newOptionToCreate[uniqueKey] : newOptionToCreate} className={'checkbox-wrapper ' + (checkedOptions.some(co => co[uniqueKey] === newOptionToCreate[uniqueKey]) ? 'checked' : '')}>
                                <span className="chkbox">
                                    <input id={isOptionObject ? newOptionToCreate[uniqueKey] : newOptionToCreate} type="checkbox" tabIndex="-1"
                                        checked={isOptionObject ? checkedOptions.some(co => co[uniqueKey] === newOptionToCreate[uniqueKey]) : checkedOptions.includes(newOptionToCreate)}
                                        onChange={(e) => onOptionClick(e, newOptionToCreate, 'multiple')} />
                                </span>
                                <span className="chkbox-label">{"Create '" + inputSearch + "'"}</span>
                            </label>
                        </li>
                    }
                </ul>
            </div>

            {!hideOkCancelBtns &&
                <div className="ok-cancel-btns">
                    <span role="button" tabIndex="0" onClick={(e) => onOptionClick(e, 'OK_BTN', 'multiple')} onKeyDown={handleOKBtnKeyboard}>OK</span>
                    <span role="button" tabIndex="0" onClick={(e) => onOptionClick(e, 'CANCEL_BTN', 'multiple')} onKeyDown={handleCANCELBtnKeyboard}>Cancel</span>
                </div>
            }
        </div>
    );
}

const SingleDropDown = ({ optionsCopy, selectedOption, disabledOptions = [], displayKey, uniqueKey, imgKey, onOptionClick, isOptionObject, inputSearch, createNewOptionWhenNotMatched, keyboardSelectedIndex, maxHeight }) => {
    selectedOption = selectedOption || {};
    maxHeight = maxHeight ? maxHeight + 'px' : '450px';
    const newOptionToCreate = createNewOptionWhenNotMatched ? isOptionObject ? { [uniqueKey]: 'NEW_' + inputSearch.trim().toUpperCase(), [displayKey]: inputSearch.trim() } : inputSearch.trim() : null;

    return (
        <div className='options-wrapper'>
            <ul className={'options' + (imgKey ? ' options-with-img' : '')} style={{ maxHeight }}>
                {optionsCopy.map((op, index) => {
                    const isSelected = isOptionObject ? op[uniqueKey] === selectedOption[uniqueKey] : op === selectedOption;
                    const isDisabled = isOptionObject ? disabledOptions.some(dop => dop[uniqueKey] === op[uniqueKey]) : disabledOptions.includes(op);
                    const isKeyboardSelected = index === keyboardSelectedIndex;
                    const label = isOptionObject ? op[displayKey] : op;
                    const imgUrl = isOptionObject ? op[imgKey] : '';

                    return <li key={index}
                        className={(isSelected || isDisabled || isKeyboardSelected) ? (isSelected ? ' selected' : '') + (isDisabled ? ' disabled' : '') + (isKeyboardSelected ? ' keyboard-selected' : '') : null}
                        onClick={(e) => !isDisabled && onOptionClick(e, op, 'single')}>
                        <label >
                            {imgKey && <div style={{ backgroundImage: `url(${imgUrl})` }} className="option-img"></div>}
                            <span >{label}</span>
                        </label>
                    </li>
                })}
                {!newOptionToCreate && !optionsCopy.length && inputSearch.trim() !== '' &&
                    <li className={'no-match'}>
                        <label>
                            <span>No match found</span>
                        </label>
                    </li>
                }
                {newOptionToCreate && !optionsCopy.length && inputSearch.trim() !== '' &&
                    <li className={'create-option'} onClick={(e) => onOptionClick(e, newOptionToCreate, 'single')}>
                        <label>
                            <span>Create '{inputSearch.trim()}'</span>
                        </label>
                    </li>
                }
            </ul>
        </div>
    );
}
