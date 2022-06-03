//   //Analysis Filters Panel Component
//   /**TODO - Delet this file later */
//   function analysisFiltersPanel() {

//     // extract the filtered items( based on search available in transform tab) in each block to display
//     const searchInput = this.state.panelFirstTabSearchValue.trim().toLowerCase();
//     const all_items = this.state.all_items.filter(item => item.title.includes(searchInput));
//     const applied_filters = this.state.selected_filters.filter(item => item.title.includes(searchInput));
//     const applied_rows = this.state.selected_rows.filter(item => item.title.includes(searchInput));
//     const applied_columns = this.state.selected_columns.filter(item => item.title.includes(searchInput));
//     const applied_values = this.state.selected_values.filter(item => item.title.includes(searchInput));

//     // Disable Run,Undo,Redo,Reset buttons when a request is in progress
//     const areActionButtonsDisabled = this.state.inprocess_last_updated || this.state.inprocess_start_analysis || this.state.inprocess_get_analysis;
//     const runBtnCount = this.giveSettingsChangeCount();
//     // forceDisplayDate For MultiPicker calculation : Set 1st date of Month prev to lastUpdated date's month
//     const lastUpdated = this.state.lastUpdatedDateObj;
//     const forceDisplayDateForMultiPicker = lastUpdated ? new Date(lastUpdated.getFullYear(), lastUpdated.getMonth() - 1, 1) : null;

//     return (
//       <ClickOutsideListner onOutsideClick={() => { this.setState({ toggleFilterPanel: false }) }}>
//         <div id="analysis-filters-panel" className={this.state.filterPanelPosition} ref={node => { this.analysisFilterPanelNode = node; }}>
//           <div className="analysis-filter-header clearfix">
//             <div className="header-inner">
//               <ul className="tabs">
//                 <li className={'tab filters ' + (this.state.filter_panel_current_tab === 'Transform' ? 'active' : '')} onClick={(e) => this.handleFilterTabChange('Transform')}>
//                   <div className="btn-wrapper">
//                     <button className="btn-tab btn-filter" title="Filters">Filters</button>
//                   </div>
//                 </li>
//                 <li className={'tab calender ' + (this.state.filter_panel_current_tab === 'Period' ? 'active' : '')} onClick={(e) => this.handleFilterTabChange('Period')}>
//                   <div className="btn-wrapper">
//                     <button className="btn-tab btn-calender" title="Calendar">Calendar</button>
//                   </div>
//                 </li>
//                 <li className={'tab formatting ' + (this.state.filter_panel_current_tab === 'Conditional Formatting' ? 'active' : '')} onClick={(e) => this.handleFilterTabChange('Conditional Formatting')}>
//                   <div className="btn-wrapper">
//                     <button className="btn-tab btn-formatting" title="Conditional Formatting">Formatting</button>
//                   </div>
//                 </li>
//               </ul>
//             </div>
//           </div>

//           <div className="analysis-filter-content clearfix">

//             {/* Analysis Period Tab Content */}
//             <div id="data-period" className={'tab-content clearfix ' + (this.state.filter_panel_current_tab === 'Period' ? 'active' : '')}>
//               <div className="analysis-period-wrapper" ref={node => { this.datePickerNode = node; }}>
//                 <div className="title-wrapper">
//                   <span>Period</span>
//                 </div>
//                 <div className="analysis-period-field">
//                   <div className="analysis-panel-wrapper">

//                     <div className="content-wrapper">

//                       <CalendarPanelInDataGrid
//                         periods={this.state.selectedDateRanges}
//                         periodBGColors={[this.colors[0], this.colors[1], this.colors[2], this.colors[3]]}
//                         periodColors={['#000', '#fff', '#000', '#000']}
//                         benchmarkIndex={this.state.benchmarkRangeIndex}
//                         // disableBenchmarkChange={this.state.periodComparisonPreselect ? this.state.periodComparisonPreselect.id !== 'CUSTOM' : false}
//                         forceDisplayDate={forceDisplayDateForMultiPicker}
//                         dateForLastDaysCalculation={this.state.lastUpdatedDateObj}
//                         onChange={this.handleAnalysisPeriodChange}
//                         isPeriodComparisonEnabled={this.state.isPeriodComparisonEnabled}
//                         onPeriodComaprisonChange={this.handlePeriodComaparisonToggle}
//                         periodComparisonPreselect={this.state.periodComparisonPreselect.id}
//                         onPeriodComparisonPreselectChange={this.handlePeriodComaprisonPreselect}
//                         showBenchmarkInGrid={this.state.showBenchmarkInGrid}
//                         onShowBenchmarkInGridChange={this.handleShowBenchmarkInGridChange}
//                         periodComparisonGroupByOptions={this.state.all_items ? this.state.all_items.filter(item => item.type === 'date') : []}
//                         periodComparisonGroupBy={this.state.periodComparisonGroupBy || {}}
//                         onPeriodComparisonGroupByChange={(val) => this.setState({ periodComparisonGroupBy: val })}
//                         disableFn={(dObj) => isDateGreater(dObj, this.state.lastUpdatedDateObj)}
//                       />

//                     </div>
//                   </div>

//                 </div>
//               </div>

//             </div>

//             {/* Analysis Conditional Formatting */}
//             <div id="data-formatting" className={'tab-content clearfix ' + (this.state.filter_panel_current_tab === 'Conditional Formatting' ? 'active' : '')}>

//               <div className="analysis-formatting-wrapper" ref={node => { this.conditionalFormattingNode = node; }}>
//                 <div className="title-wrapper">
//                   <span>Conditional Formatting</span>
//                 </div>
//                 <div className="analysis-formatting-inner">
//                   <div className="analysis-panel-wrapper">

//                     <div className="content-wrapper">
//                       <div className="conditions-wrapper">
//                         {this.state.tempConditionalFormatting.map((item, i) => {
//                           return (
//                             <div key={i + 1} className="condition">
//                               <div id={'col-inputs-' + i} className="inputs-wrapper" style={{ width: this.state.condtionalFormattingInputWrapperWidths[i] > 0 ? Math.max(...this.state.condtionalFormattingInputWrapperWidths) : 'auto' }}>
//                                 <div className="field-group" key={i + 1}>
//                                   <div className="sno">{i + 1}</div>

//                                   <div className="field-wrapper format_type">
//                                     <SpeedSelect
//                                       options={this.state.conditionalFormatTypes}
//                                       selectedOption={item.format_type}
//                                       onSelect={(e) => this.handleConditionalFormattingSelect(e, 'format_type', i)}
//                                       displayKey='name'
//                                       uniqueKey='id'
//                                       selectLabel='Format Type'
//                                       maxHeight={65}
//                                       disableSearch={true}
//                                     />
//                                   </div>

//                                   <div className="field-wrapper cell_value">
//                                     <SpeedSelect
//                                       options={this.state.conditionalCellValues}
//                                       selectedOption={item.cell_value}
//                                       onSelect={(e) => this.handleConditionalFormattingSelect(e, 'cell_value', i)}
//                                       displayKey='name'
//                                       uniqueKey='id'
//                                       selectLabel='Cell Value'
//                                       maxHeight={55}
//                                       multiple
//                                       hideOkCancelBtns={true}
//                                     />
//                                   </div>

//                                   <div className="field-wrapper condition">
//                                     <SpeedSelect
//                                       options={CONDITIONAL_FORMATTING_OPTIONS}
//                                       selectedOption={item.condition}
//                                       onSelect={(e) => this.handleConditionalFormattingSelect(e, 'condition', i)}
//                                       displayKey='name'
//                                       uniqueKey='id'
//                                       selectLabel='Condition'
//                                       maxHeight={65}
//                                     />
//                                   </div>

//                                   {(item.condition !== undefined && item.condition.id !== 'empty') &&
//                                     <div className="field-wrapper compare-val compare-val1">
//                                       <input type="text" id="txt-comparison-val1" name="txt-comparison-val1" className="form-control number" onChange={(e) => this.handleConditionalFormattingSelect(e, 'value1', i)} value={item.value1} placeholder={(item.condition.id === 'between') ? 'From' : 'Compare Value'} />
//                                       {(item.format_type !== undefined && item.format_type.id === 'period_comparison') &&
//                                         <div className="symbol">%</div>
//                                       }
//                                     </div>
//                                   }

//                                   {item.condition.id === 'between' &&
//                                     <div className="field-wrapper  compare-val compare-val2">
//                                       <input type="text" id="txt-comparison-val2" name="txt-comparison-val2" className="form-control number" onChange={(e) => this.handleConditionalFormattingSelect(e, 'value2', i)} value={item.value2} placeholder="To" />
//                                       {item.format_type.id === 'period_comparison' &&
//                                         <div className="symbol">%</div>
//                                       }
//                                     </div>
//                                   }
//                                 </div>
//                               </div>

//                               <div className="color-inputs-wrapper">
//                                 <div className="field-group color-field-group" key={i + 1}>
//                                   <div className="field-group-inner">
//                                     <div className="cell-preview" style={{ backgroundColor: (item.background !== '' ? item.background : '#000') }}>
//                                       <div className="cell-text" style={{ color: (item.color !== '' ? item.color : '#fff') }}>Cell Preview 123</div>
//                                     </div>

//                                     <div className="field-wrapper color-field" onClick={(e) => this.handleToggleColorPicker(e, 'background', i)}>
//                                       <div className="label">Fill</div>
//                                       {/* <input type="color" id={'txt-font-color' + i} name={'txt-font-color' + i} ref={this.state.conditionalColorsRefs[i]['bg']} className="form-control color-control" onChange={(e) => this.handleConditionalFormattingSelect(e, 'background', i)} value={item.background} /> */}

//                                       <div id={'txt-background-color' + i} className="form-control color-control" style={{ backgroundColor: item.background }} onClick={(e) => this.handleToggleColorPicker(e, 'background', i)}></div>
//                                       {item.display_background_picker &&
//                                         <ClickOutsideListner onOutsideClick={(e) => this.handleToggleColorPicker(e, 'background', i)}>
//                                           <div className={'color-picker-wrapper'}>
//                                             <div className="color-picker">
//                                               {Object.keys(COLOR_PICKER_LIST).map((colorKey) => {
//                                                 return (<div className="color-col">
//                                                   {COLOR_PICKER_LIST[colorKey].map((color) => {
//                                                     return (<div className="color" style={{ backgroundColor: color }} onClick={(e) => this.handleColorPickerSelect('background', i, color)}></div>)
//                                                   })}
//                                                 </div>)
//                                               })}
//                                             </div>
//                                             {/* <CompactPicker
//                                               disableAlpha={true}
//                                               presetColors={this.state.colorPickerPresets['background']}
//                                               color={item.background}
//                                               onChangeComplete={(color) => this.handleColorPickerSelect('background', i, color)}
//                                             /> */}
//                                           </div>
//                                         </ClickOutsideListner>
//                                       }
//                                     </div>

//                                     <div className="field-wrapper color-field" onClick={(e) => this.handleToggleColorPicker(e, 'fontcolor', i)}>
//                                       <div className="label">Text</div>
//                                       {/* <input type="color" id={'txt-background-color' + i} name={'txt-background-color' + i} ref={this.state.conditionalColorsRefs[i]['color']} className="form-control color-control" onChange={(e) => this.handleConditionalFormattingSelect(e, 'color', i)} value={(item.color !== '' ? item.color : '#ffffff')} /> */}

//                                       <div id={'txt-font-color' + i} className="form-control color-control" style={{ backgroundColor: (item.color !== '' ? item.color : '#ffffff') }} onClick={(e) => this.handleToggleColorPicker(e, 'font', i)}></div>
//                                       {item.display_fontcolor_picker &&
//                                         <ClickOutsideListner onOutsideClick={(e) => this.handleToggleColorPicker(e, 'fontcolor', i)}>
//                                           <div className="color-picker-wrapper">
//                                             <div className="color-picker">
//                                               {Object.keys(COLOR_PICKER_LIST).map((colorKey) => {
//                                                 return (<div className="color-col">
//                                                   {COLOR_PICKER_LIST[colorKey].map((color) => {
//                                                     return (<div className="color" style={{ backgroundColor: color }} onClick={(e) => this.handleColorPickerSelect('color', i, color)}></div>)
//                                                   })}
//                                                 </div>)
//                                               })}
//                                             </div>
//                                             {/* <CompactPicker
//                                               disableAlpha={true}
//                                               presetColors={this.state.colorPickerPresets['color']}
//                                               color={item.color}
//                                               onChangeComplete={(color) => this.handleColorPickerSelect('color', i, color)}
//                                             /> */}
//                                           </div>
//                                         </ClickOutsideListner>
//                                       }
//                                     </div>
//                                   </div>

//                                   <div className="btn-remove-condition-wrapper">
//                                     <button className="btn-remove-condition" onClick={(e) => this.handleRemoveNewConditionalFormatting(e, i)}>Remove</button>
//                                   </div>
//                                 </div>
//                               </div>
//                             </div>
//                           )
//                         })}

//                         <button className={'btn-add-condition' + (this.state.tempConditionalFormatting.length <= 0 ? ' mar-t0' : '')} onClick={this.handleAddNewConditionalFormatting}>Add New</button>
//                       </div>

//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Filter Tab Content */}
//             <div id="data-filters" className={'tab-content clearfix ' + this.state.panel_first_tab_current_subtab.split(' ').join('-').toLowerCase() + (this.state.filtersSelectionBoxStatus ? ' filter-selection-open' : '') + (this.state.filter_panel_current_tab === 'Transform' ? ' active' : '')}>
//               <div className="col-dnd-wrapper">
//                 <div className="header">
//                   <div className="title"> <span>Transform</span> </div>
//                   <div className="filter-sub-tab">

//                     {this.state.filterPanelPosition === 'bottom' &&
//                       <div className="sub-tabs">
//                         <div className={'sub-tab pivot' + (this.state.panel_first_tab_current_subtab === 'Pivot' ? ' selected' : '')} onClick={() => this.handleFirstTabSubtabChange('Pivot')}>Pivot</div>
//                         <div className={'sub-tab calculated-field' + (this.state.panel_first_tab_current_subtab === 'Calculated Field' ? ' selected' : '')} onClick={() => this.handleFirstTabSubtabChange('Calculated Field')}>Calculated Field</div>
//                         <div className={'sub-tab custom-value' + (this.state.panel_first_tab_current_subtab === 'Custom Value' ? ' selected' : '')} onClick={() => this.handleFirstTabSubtabChange('Custom Value')}>Custom Value</div>
//                       </div>
//                     }
//                     {this.state.filterPanelPosition !== 'bottom' &&
//                       <div className="filter-position-toggle">
//                         <SpeedSelect
//                           options={['Pivot', 'Calculated Field', 'Custom Value']}
//                           selectedOption={this.state.panel_first_tab_current_subtab}
//                           onSelect={(value) => this.handleFirstTabSubtabChange(value)}
//                           disableSearch={true}
//                         />
//                       </div>
//                     }
//                     <div className="search" onClick={() => this.setState({ showPanelFirstTabSearch: true })}>
//                       <input placeholder="Search" style={{ display: this.state.showPanelFirstTabSearch ? 'block' : 'none' }}
//                         value={this.state.panelFirstTabSearchValue}
//                         onChange={(e) => this.setState({ panelFirstTabSearchValue: e.target.value })}
//                       />
//                     </div>

//                   </div>

//                 </div>
//                 <div className="content-area">
//                   <div className={'all-lists-wrapper variable clearfix ' + (this.state.highlightedBlocks.includes('add_items') ? 'highlight' : '')}>

//                     <div className="content">
//                       <h3 className="title">All</h3>
//                       <div className="content-inner">
//                         {all_items &&
//                           all_items.map((item, index) => {
//                             // In 'Calculated Field' or 'Custom Value' subtab, only 'number' and 'currency' type items should be operational,disable other types
//                             const isDisabled = (this.state.panel_first_tab_current_subtab === 'Calculated Field' || this.state.panel_first_tab_current_subtab === 'Custom Value') && (item.type !== 'number' && item.type !== 'currency' && item.type !== 'percent');
//                             const isSelected = this.state.selectedFilterItem && this.state.selectedFilterItem.item['id'] === item.id;
//                             const isSelectedForEdit = this.state.calculated_expression_fieldForEdit && this.state.calculated_expression_fieldForEdit.title === item.title;
//                             // Only user who has created the fields, can edit the same
//                             const isCalculated = isCalculatedField(item);
//                             const isEditable = isCalculated && item.created_by === this.user.id;
//                             const clickHandler = this.state.panel_first_tab_current_subtab === 'Calculated Field' ? () => this.handleFieldClick(item) : (e) => this.handleFilterClick(e, index, item, 'all_items');

//                             return <div key={item.id + '-' + index} className={'element ' + item.type + (isCalculated ? ' calculated' : '') + (isDisabled ? ' disabled' : '') + (isSelected ? ' selected' : '') + (isSelectedForEdit ? ' selected-edit' : '')} onClick={clickHandler}>
//                               <span>{item.display_title}{isEditable && <span className="edit-btn" onClick={(e) => this.handleCalculatedFieldEdit(e, item)}>Edit</span>}</span>
//                             </div>
//                           })
//                         }
//                       </div>
//                     </div>
//                   </div>

//                   <div className="all-filter-outer">

//                     {/* Filters Block */}
//                     {this.state.panel_first_tab_current_subtab === 'Pivot' &&
//                       < div className={'filters-wrapper variable clearfix ' + (this.state.highlightedBlocks.includes('filters') ? 'highlight' : '')}>
//                         <div className="content" onClick={(e) => this.handleSelectedFilter(e, 'filters')}>
//                           <h3 className="title">Filters</h3>
//                           <div className="content-inner">
//                             {applied_filters.length > 0 &&
//                               applied_filters.map((item, index) => (
//                                 <div key={'filter-' + index} className={'element filter-element ' + item.type + ' ' + ((this.state.selectedFilterItem && this.state.selectedFilterItem.item['id'] == item.id) ? 'selected' : '')} onClick={(e) => this.handleFilterClick(e, index, item, 'filters')}>
//                                   <div className="element-text">
//                                     {item.display_title}

//                                     {/* Show Selected Dimensions Count */}
//                                     {(item.type !== 'dateobj') &&
//                                       <span className="count">
//                                         {(this.state.selected_dimensions !== undefined && this.state.currentSelectedFilter !== undefined && this.state.selected_dimensions[item.title] !== undefined) &&
//                                           '+' + this.state.selected_dimensions[item.title].length
//                                         }
//                                       </span>
//                                     }

//                                     {(item.type === 'dateobj') &&
//                                       <span className="count auto">
//                                         {(this.getFilterDateObjDaysCount(item.title) !== '' && this.state.selected_filters_date_obj[item.title] !== undefined) &&
//                                           this.getFilterDateObjDaysCount(item.title) + ' days'
//                                         }
//                                       </span>
//                                     }
//                                   </div>
//                                   <div className="element-btn">
//                                     <button className="btn-toggle-list" data-title={item.title} onClick={(e) => this.handleAnalysisFilter(e, item)}></button>
//                                     <button className="btn-close" data-key={(index + 1)} data-type={JSON.stringify(item)} data-source="filters" onClick={this.handleCloseSelectedFilter}></button>
//                                   </div>
//                                 </div>
//                               ))
//                             }
//                           </div>
//                         </div>
//                       </div>
//                     }

//                     {/* Filters Selection Options Block */}
//                     {this.state.panel_first_tab_current_subtab === 'Pivot' &&
//                       this.state.filtersSelectionBoxStatus &&
//                       <div className={'selected-filters-wrapper variable clearfix ' + (this.state.currentSelectedFilter.type === 'dateobj' ? ' large' : '')}>
//                         <ClickOutsideListner onOutsideClick={() => this.setState({ filtersSelectionBoxStatus: false })}>
//                           <div className="content" ref={node => { this.filtersNode = node; }}>
//                             <div className="content-inner">
//                               {(this.state.currentSelectedFilter.type !== 'dateobj') &&
//                                 <MultiSelectList
//                                   data={this.state.currentSelectedFilterOptions}
//                                   filter={this.state.currentSelectedFilter.title}
//                                   selectedOptions={this.state.selected_dimensions}
//                                   onMultiSelectFiltersClose={this.handleMultiSelectFiltersClose}
//                                   onMultiSelectLFiltersSelection={this.handleMultiSelectLFiltersSelection}
//                                 />
//                               }
//                               {(this.state.currentSelectedFilter.type === "dateobj") &&
//                                 <div className="date-period-wrapper" ref={node => { this.datePickerNode = node; }}>
//                                   <div className="date-period-field">
//                                     <RangePicker picker="date"
//                                       range={this.state.selected_filters_date_obj[this.state.currentSelectedFilter.title] !== undefined ? this.state.selected_filters_date_obj[this.state.currentSelectedFilter.title] : null}
//                                       dateForLastDaysCalculation={new Date()}
//                                       onChange={(date_range) => this.handleAnalysisFilterDateChange(date_range, this.state.currentSelectedFilter.title)}
//                                       // disableFn={(dObj) => isDateGreater(dObj, this.state.lastUpdatedDateObj)}
//                                       allowClear={false}
//                                     />
//                                   </div>
//                                 </div>
//                               }
//                             </div>
//                           </div>
//                         </ClickOutsideListner>
//                       </div>
//                     }

//                     {/* Rows Block */}
//                     {this.state.panel_first_tab_current_subtab === 'Pivot' &&
//                       <div className={'rows-wrapper variable clearfix ' + (this.state.highlightedBlocks.includes('rows') ? 'highlight' : '')}>
//                         <div className="content" onClick={(e) => this.handleSelectedFilter(e, 'rows')}>
//                           <h3 className="title">Rows</h3>
//                           <div className="content-inner">
//                             {applied_rows.map((item, index) => (
//                               <div key={'row-' + index} className={'element ' + item.type + ' ' + ((this.state.selectedFilterItem && this.state.selectedFilterItem.item['id'] == item.id) ? 'selected' : '')} onClick={(e) => this.handleFilterClick(e, index, item, 'rows')}>
//                                 <div className="element-text">
//                                   {item.display_title}
//                                 </div>
//                                 <div className="element-btn">
//                                   {/* Don't show close button if it is values element */}
//                                   {item.title !== 'values' &&
//                                     <button className="btn-close" data-key={(index + 1)} data-type={JSON.stringify(item)} data-source="rows" onClick={this.handleCloseSelectedFilter}></button>
//                                   }
//                                   {/* Don't show order button if it is first element */}
//                                   {index > 0 &&
//                                     <button className="btn-order" data-key={(index + 1)} onClick={(e) => this.handleFilterOrder(e, index, item, 'rows')}></button>
//                                   }
//                                 </div>
//                               </div>
//                             ))}
//                           </div>
//                         </div>
//                       </div>
//                     }

//                     {/* Columns Block */}
//                     {this.state.panel_first_tab_current_subtab === 'Pivot' &&
//                       <div className={'columns-wrapper variable clearfix ' + (this.state.highlightedBlocks.includes('columns') ? 'highlight' : '')}>

//                         <div className="content" onClick={(e) => this.handleSelectedFilter(e, 'columns')}>
//                           <h3 className="title">Columns</h3>
//                           <div className="content-inner">
//                             {/* Columns Span Filter  */}
//                             {this.state.selected_columns_count > 0 &&
//                               this.analysisColumnsSpanFilter(false)
//                             }

//                             {applied_columns.map((item, index) => (
//                               <div key={'col-' + index} className={'element ' + item.type + ' ' + ((this.state.selectedFilterItem && this.state.selectedFilterItem.item['id'] == item.id) ? 'selected' : '')} onClick={(e) => this.handleFilterClick(e, index, item, 'columns')}>
//                                 <div className="element-text">
//                                   {item.display_title}
//                                 </div>
//                                 <div className="element-btn">
//                                   {/* Don't show close button if it is values element */}
//                                   {item.title !== 'values' &&
//                                     <button className="btn-close" data-key={(index + 1)} data-type={JSON.stringify(item)} data-source="columns" onClick={this.handleCloseSelectedFilter}></button>
//                                   }
//                                   {index > 0 &&
//                                     <button className="btn-order" data-key={(index + 1)} disabled={this.state.isPeriodComparisonEnabled} onClick={(e) => this.handleFilterOrder(e, index, item, 'columns')}></button>
//                                   }
//                                 </div>
//                               </div>
//                             ))}

//                             {(this.state.isPeriodComparisonEnabled && this.state.showReplaceDateDimensionMsg) &&
//                               <div className="alert">
//                                 <p>Atleast one Date dimension is mandatory for period comparison.</p>
//                                 <p>Replace {this.state.replaceDateDimensionName} with {(this.state.replaceDateDimensionName === 'date' ? 'month' : 'date')} <button className="btn outline xs btn-replace" onClick={this.handleReplaceDateField}>replace</button></p>
//                               </div>
//                             }
//                           </div>
//                         </div>
//                       </div>
//                     }

//                     {/* Values Block */}
//                     {(this.state.panel_first_tab_current_subtab === 'Pivot' || this.state.panel_first_tab_current_subtab === 'Custom Value') &&
//                       <div className={'values-wrapper variable clearfix ' + (this.state.highlightedBlocks.includes('values') ? 'highlight' : '')}>
//                         <div className="content" onClick={(e) => this.handleSelectedFilter(e, 'values')}>
//                           <h3 className="title">Values</h3>
//                           <div className="content-inner">
//                             {(applied_values !== undefined && applied_values.length > 0) &&
//                               applied_values.map((item, index) => {
//                                 const isSelectedForOperation = this.state.selected_value_field ? item.id === this.state.selected_value_field.id : false;
//                                 return (
//                                   <div key={'val-' + index} onClick={() => this.state.panel_first_tab_current_subtab === 'Custom Value' && this.openValuesOperationsList(item)} className={item.type + ' element' + (isSelectedForOperation ? ' selected' : '')}>
//                                     <div className="element-text">
//                                       {(!isCalculatedField(item)) && <span>{OPERATIONS_FOR_VALUES.find(op => op.id === item.default_action).shortName}</span>}
//                                       {(isCalculatedField(item)) && <span>Calculated</span>}
//                                       {(!isCalculatedField(item)) && ' of '}
//                                       <span> {item.display_title}</span>
//                                     </div>
//                                     <div className="element-btn">
//                                       <button className="btn-select-operation" data-key={(index + 1)} data-type={item.id} onClick={() => this.state.panel_first_tab_current_subtab !== 'Custom Value' && this.openValuesOperationsList(item)}></button>
//                                       <button className="btn-close" data-key={(index + 1)} data-type={JSON.stringify(item)} data-source="values" onClick={this.handleCloseSelectedFilter}></button>
//                                       {index > 0 &&
//                                         <button className="btn-order" data-key={(index + 1)} onClick={(e) => this.handleFilterOrder(e, index, item, 'values')}></button>
//                                       }
//                                     </div>
//                                   </div>
//                                 )
//                               })
//                             }
//                           </div>
//                         </div>
//                       </div>
//                     }

//                     {/* SummarizeBy Block In Custom Value*/}
//                     {this.state.panel_first_tab_current_subtab === 'Custom Value' &&
//                       // When Selected Field is calculated one, summarize block is not needed, hence disable this
//                       <div className={'summarizeby-wrapper variable clearfix'} >
//                         <div className="content">
//                           <h3 className="title">Summarize By</h3>
//                           <div className="content-inner" style={isCalculatedField(this.state.selected_value_field) ? { pointerEvents: 'none', opacity: '0.5' } : {}}>
//                             <ul className="options">
//                               {OPERATIONS_FOR_VALUES.map(op => {
//                                 const isSelected = op.id === this.state.selected_value_field.default_action;
//                                 return <li key={op.id} className={'option' + (isSelected ? ' selected' : '')} onClick={() => this.selectOperation(op.id)}> {op.name}  </li>
//                               })}
//                             </ul>
//                           </div>
//                         </div>
//                       </div>
//                     }

//                     {/* Comparison Block */}
//                     {this.state.panel_first_tab_current_subtab === 'Custom Value' &&
//                       <div className={'comparison-wrapper variable clearfix'}>
//                         <div className="content">
//                           <h3 className="title">Data Comparison</h3>
//                           <div className="content-inner">
//                             <ul className="options">
//                               {SHOW_DATA_AS_FOR_VALUES.map(op => {
//                                 const selectedShowAs = this.state.selected_value_field.default_show_as || 'no_calculation';
//                                 const isSelected = op.id === selectedShowAs;
//                                 return <li key={op.id} className={'option' + (isSelected ? ' selected' : '')} onClick={() => this.selectShowDataAs(op.id)}> {op.name}  </li>
//                               })}
//                             </ul>
//                           </div>
//                         </div>
//                       </div>
//                     }

//                     {/* Precision Block */}
//                     {this.state.panel_first_tab_current_subtab === 'Custom Value' &&
//                       <div className={'precision-wrapper variable clearfix'}>
//                         <div className="content">
//                           <h3 className="title">Precision</h3>
//                           <div className="content-inner">
//                             <div className="precision-value">{this.state.selected_value_field.default_precision}</div>
//                             <div className="precision-btns">
//                               <span className={'precision-btn decrease-btn' + (this.state.selected_value_field.default_precision === 0 ? ' disabled' : '')} onClick={() => this.selectPrecision(this.state.selected_value_field.default_precision - 1)}></span>
//                               <span className={'precision-btn increase-btn' + (this.state.selected_value_field.default_precision === 9 ? ' disabled' : '')} onClick={() => this.selectPrecision(this.state.selected_value_field.default_precision + 1)}></span>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     }


//                     {/* SummarizeBy Block In Calculated Field*/}
//                     {this.state.panel_first_tab_current_subtab === 'Calculated Field' &&
//                       // For selectedFilterItem is calculated one, summarize block is not needed, hence disable this
//                       <div className={'summarizeby-wrapper variable clearfix'} >
//                         <div className="content">
//                           <h3 className="title">Summarize By</h3>
//                           <div className="content-inner" style={(this.state.selectedFilterItem === null || (this.state.selectedFilterItem && isCalculatedField(this.state.selectedFilterItem.item))) ? { pointerEvents: 'none', opacity: '0.5' } : {}}>
//                             <ul className="options">
//                               {OPERATIONS_FOR_VALUES.map(op => {
//                                 const isSelected = op.id === this.state.calculated_expression_summarizeby;
//                                 return <li key={op.id} className={'option' + (isSelected ? ' selected' : '')} onClick={() => this.handleCalculatedFieldSummarizeClick(op.id)}> {op.name}  </li>
//                               })}
//                             </ul>
//                           </div>
//                         </div>
//                       </div>
//                     }

//                     {/* Calculated Field Presets Block */}
//                     {this.state.panel_first_tab_current_subtab === 'Calculated Field' &&
//                       <div className={'preset-wrapper variable clearfix'}>
//                         <div className="content">
//                           <h3 className="title">Preset</h3>
//                           <div className="content-inner">
//                             <div className="preset-inner-wrapper">
//                               {CALCULATED_FIELD_OPERATORS.map((operator) => {
//                                 return <div key={operator.id} className="operator" onClick={() => this.handleCalculatedFiedOperatorClick(operator)}>{operator.name}</div>
//                               })}
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     }

//                     {/* Calculated Field Expression Block */}
//                     {this.state.panel_first_tab_current_subtab === 'Calculated Field' &&
//                       <div className={'expression-wrapper variable clearfix'}>
//                         <div className="content">
//                           <div className="title">
//                             <h3>Expression</h3>
//                             <div className="action-btns">
//                               {!this.state.calculated_expression_saving && <button className="btn btn-save" title="Save" onClick={this.handleCalculatedExpressionSaveAndEdit} ></button>}
//                               {!this.state.calculated_expression_saving && this.state.calculated_expression_fieldForEdit !== null && <button className="btn btn-delete" title="Delete" onClick={this.handleCalculatedExpressionDelete} ></button>}
//                               {!this.state.calculated_expression_saving && this.state.calculated_expression_fieldForEdit !== null && <button className="btn btn-cancel-edit" title="Cancel Editing" onClick={this.handleCalculatedExpressionCancelEdit} ></button>}
//                               {this.state.calculated_expression_saving && <div className="expression-loader"><span>Please Wait..</span><Loader2 /></div>}
//                             </div>
//                           </div>
//                           <div className="content-inner">
//                             <div className="expression-inner-wrapper">
//                               <div className={'formula-wrapper' + (this.state.selectedFilterItem ? ' droppable' : '')}>
//                                 <textarea ref={this.calculatedFieldFormulaRef} value={this.state.calculated_expression_formula}
//                                   onClick={() => this.handleCalculatedFormulaFocus()}
//                                   onChange={(e) => this.setState({ calculated_expression_formula: e.target.value })}
//                                   spellCheck="false" placeholder="Type or Add Fields and Presets here"></textarea>
//                               </div>

//                               <div className="other-info-wrapper">
//                                 <div className="expression-name">
//                                   <input placeholder="Field Name" spellCheck="false" value={this.state.calculated_expression_name} onChange={(e) => {
//                                     this.setState({ calculated_expression_name: e.target.value })
//                                   }} />
//                                 </div>

//                                 <div className="expression-type-access">
//                                   <div className="type">
//                                     <span className="title">Type</span>
//                                     <ul className="options">
//                                       {CALCULATED_FIELD_TYPES.map(ft => {
//                                         const isSelected = ft.id === this.state.calculated_expression_type.id;
//                                         return <li key={ft.id} className={'option' + (isSelected ? ' selected' : '')} onClick={() => this.setState({ calculated_expression_type: ft })}>{ft.name}</li>
//                                       })}
//                                     </ul>
//                                   </div>
//                                   <div className="access">
//                                     <span className="title">Visible to</span>
//                                     <ul className="options">
//                                       {CALCULATED_FIELD_ACCESS.map(fa => {
//                                         const isSelected = fa === this.state.calculated_expression_access;
//                                         return <li key={fa} className={'option' + (isSelected ? ' selected' : '')} onClick={() => this.setState({ calculated_expression_access: fa })}>{fa}</li>
//                                       })}
//                                     </ul>
//                                   </div>
//                                 </div>
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     }

//                   </div>
//                 </div>
//               </div>

//             </div>
//           </div>
//           {/* End of analysis-filter-content */}

//           <div className="action-buttons-wrapper clearfix">

//             <ul className="action-buttons">
//               <li className="filter-count"><button className="btn-with-icon btn-run" title="Run" disabled={areActionButtonsDisabled} onClick={this.handleAnalysisFiltersRun}><i></i><span>Run</span></button>
//                 {runBtnCount > 0 && <p>{runBtnCount}</p>}
//               </li>
//               <li><button className="btn-with-icon btn-undo" title="Undo" disabled={areActionButtonsDisabled} onClick={this.handleAnalysisFiltersUndo}><i></i><span>Undo</span></button></li>
//               <li><button className="btn-with-icon btn-redo" title="Redo" disabled={areActionButtonsDisabled} onClick={this.handleAnalysisFiltersRedo}><i></i><span>Redo</span></button></li>
//               <li><button className="btn-with-icon btn-reset" title="Reset" disabled={areActionButtonsDisabled} onClick={this.handleAnalysisFiltersReset}><i></i><span>Reset</span></button></li>
//             </ul>
//             <ul className="filter-position">
//               <li><button onClick={() => this.handleFilterPanelPositionChange('bottom')} className={'filter-bottom' + (this.state.filterPanelPosition === 'bottom' ? ' active' : '')}></button></li>
//               <li><button onClick={() => this.handleFilterPanelPositionChange('left')} className={'filter-left' + (this.state.filterPanelPosition === 'left' ? ' active' : '')}></button></li>
//               <li><button onClick={() => this.handleFilterPanelPositionChange('right')} className={'filter-right' + (this.state.filterPanelPosition === 'right' ? ' active' : '')}></button></li>
//             </ul>
//           </div>

//         </div >
//       </ClickOutsideListner >
//     );
//   }