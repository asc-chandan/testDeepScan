import React, { Component } from 'react';
import moment from 'moment';
import * as Constants from '../../../components/Constants.js';
import subjectObj from '../../../subjects/Subject1';
import ReactQuill from 'react-quill';

import '../../../styles/AnalysisViews.scss';
import 'react-quill/dist/quill.snow.css';

import ClickOutsideListner from '../../../components/ClickOutsideListner';
import { CalendarPanelInDataGrid } from '../../../components/MultiPeriodPicker/CalendarPanelInDataGrid';
import { isDateGreater } from '../../../components/ReactCalendar/components/utils';
import { giveDaysCountInRange } from '../../../components/MultiPeriodPicker/components/utils.js';

import SpeedSelect from '../../../components/SpeedSelect/SpeedSelect';
import ReactDivTable from '../../../components/table/ReactDivTable';
import { UserAvatar } from '../../../components/UserAvatar/UserAvatar';

import { ReorderableList, ReorderableListItem } from '../../../components/ReorderableList/ReorderableList';
import { DndContext, DndDroppable, DndDraggable } from '../../../components/AscDnD/AscDnD';
import { getKeyByValue, getClients, getUser, isEmptyObject, numberWithCommas, covertUnderscoreToSpaceInString, getChartColors, PERIOD_COMPARISON_PRESELECT_OPTIONS } from '../../../utils/Common';
import APIService from '../../../services/apiService';
import AlertService from '../../../services/alertService';
import { Radio, RadioGroup } from '../../../components/ReactRadio/ReactRadio.js';
import { Checkbox } from '../../../components/ReactCheckbox/ReactCheckbox.js';
import alertService from '../../../services/alertService';
import { giveDateTimeInString } from '../TrendMaster/ChartsUtils';
import subject2 from '../../../subjects/Subject2.js';

const MAX_NAME_CHAR = 50;
const MAX_DESCRIPTION_CHAR = 150;
const OPERATIONS_FOR_VALUES = [
  { id: 'sum', name: 'Sum', shortName: 'Sum' },
  { id: 'count', name: 'Count', shortName: 'Count' },
  { id: 'min', name: 'Min', shortName: 'Min' },
  { id: 'max', name: 'Max', shortName: 'Max' },
  { id: 'mean', name: 'Mean', shortName: 'Mean' },
  { id: 'std', name: 'Standard Deviation', shortName: 'Std Dev' },
  { id: 'var', name: 'Variance', shortName: 'Variance' },
  { id: 'nunique', name: 'Count Distinct', shortName: 'Count Dist' },
  { id: 'no_calculation', name: 'No Calculation', shortName: 'No Calculation' },
  { id: 'percentage_of_row_total', name: '% of Row Total', shortName: '% of Row Total' },
  { id: 'percentage_of_column_total', name: '% of Column Total', shortName: '% of Col Total' },
];
// const SHOW_DATA_AS_FOR_VALUES = [
//   { id: 'no_calculation', name: 'No Calculation', shortName: 'No Calculation' },
//   { id: 'percentage_of_row_total', name: '% of Row Total', shortName: '% of Row Total' },
//   { id: 'percentage_of_column_total', name: '% of Column Total', shortName: '% of Col Total' },
//   { id: 'percentage_of_grand_total', name: '% of Grand Total', shortName: '% of Grand Total' },
// ];
const CALCULATED_FIELD_OPERATORS = [
  { id: '+', name: 'Sum' },
  { id: '-', name: 'Minus' },
  { id: '*', name: 'Product' },
  { id: '/', name: 'Divide' },
  { id: '^', name: 'Exponent' },
  { id: 'round', name: 'Round' }
];
const CALCULATED_FIELD_TYPES = [{ id: 'number', name: 'Number' }, { id: 'currency', name: 'Currency' }, { id: 'percent', name: 'Percentage' }];
const CALCULATED_FIELD_ACCESS = ['Only Me', 'Organisation'];
const COLOR_PICKER_LIST = {
  'yellow': ['#fefbbf', '#fdfa99', '#fdf851', '#fdf851', '#b4b438', '#65671c'],
  'orange1': ['#fce8bf', '#fbdb99', '#f8c14d', '#f4a540', '#b2742c', '#654315'],
  'orange2': ['#f6dbc6', '#f3c6a5', '#eb9a63', '#e07035', '#9d4e22', '#6e3815'],
  'orange3': ['#f6bebf', '#f29899', '#ed494a', '#ed3833', '#b52824', '#671310'],
  'pink': ['#f4b2bf', '#ef96fa', '#ea58f9', '#ea58f9', '#b53fb4', '#672067'],
  'purple': ['#e1c9f9', '#cea5f3', '#a862e9', '#8c46e3', '#6b35b4', '#421e70'],
  'blue': ['#c2c2fa', '#9a98f8', '#4e49f6', '#2046f5', '#1230b3', '#071867'],
  'green': ['#c2f9c2', '#96f698', '#73f44c', '#73f340', '#53b42d', '#2c6715'],
  'black': ['#ffffff', '#f8f8f8', '#dedede', '#999999', '#333333', '#000000']
}
const CONDITIONAL_FORMATTING_OPTIONS = [
  { 'id': 'greater_than', 'operator': '>', 'name': 'Greater than' },
  { 'id': 'greater_than_equal_to', 'operator': '>=', 'name': 'Greater than or equal to' },
  { 'id': 'less_than', 'operator': '<', 'name': 'Less than' },
  { 'id': 'less_than_equal_to', 'operator': '<=', 'name': 'Less than or equal to' },
  { 'id': 'equal_to', 'operator': '==', 'name': 'Equal to' },
  { 'id': 'not_equal_to', 'operator': '!=', 'name': 'Not equal to' },
  { 'id': 'between', 'operator': '', 'name': 'Between' },
  { 'id': 'empty', 'operator': '', 'name': 'Empty' },
];

const givePossibleAggregationForField = (field) => {
  if (isCalculatedField(field)) {
    return OPERATIONS_FOR_VALUES.filter(op => ['no_calculation', 'percentage_of_row_total', 'percentage_of_column_total'].includes(op.id));
  }
  if (field.type === 'string' || field.type === 'date') {
    return OPERATIONS_FOR_VALUES.filter(op => ['count', 'nunique'].includes(op.id));
  }
  return OPERATIONS_FOR_VALUES.filter(op => op.id !== 'no_calculation');
};
const isCalculatedField = (field) => { return !!field.operation; }


// a little function to help us with reordering the items in a block
// @returns a new list with position of item changed from currIndex to newIndex
const reorder = (list, currIndex, newIndex) => {
  const listCopy = [...list];
  const [removed] = listCopy.splice(currIndex, 1);
  listCopy.splice(newIndex, 0, removed);
  return listCopy;
};

const uniqueID = () => {
  return Math.random().toString(36).substr(2, 9);
};


class AnalysisView extends Component {
  constructor(props) {
    super(props);

    //Get Client & View Type & User
    this.user = getUser();
    this.controller = new AbortController();
    this.colors = getChartColors();
    this.state = this.getInitVariables();

    // DOM references
    this.calculatedFieldFormulaRef = React.createRef();
    this.insightAddFormQuillDOMRef = React.createRef();
    this.insightEditFormQuillDOMRef = React.createRef();
    this.insightReplyFormsQuillDOMRefs = {}; // stores DOM refs of reply editores for each note

    // Events Binding
    this.bindEvents([
      'openValuesOperationsList',
      'selectOperation',

      //settings
      'handleAnalysisSaveBtn',
      'handleAnalysisSettingsBtn',
      'handleAnalysisFullscreenBtn',
      'handleAnalysisFormCloseBtn',

      //filter actions
      'handleAnalysisFiltersRun',
      'handleAnalysisFiltersUndo',
      'handleAnalysisFiltersRedo',
      'handleAnalysisFiltersReset',
      // 'getSelectedFiltersList',

      // Events related to Dataset Tab
      'handleDatasetTabDndDrop',

      'toggleFiltersPanel',
      'handleAnalysisPeriodChange',
      'handleBackToAnalysisHome',

      'handleSubLevelDataFetch', //Table Sub level data fetch
      'handleSubLevelDataRemove', //Table Sub level data remove
      'handleTableDataSorting', //Table Sorting

      'handleConstructorPanelTabChange', //Analysis Filters Panel Component
      'handleDownloadView_UNUSED', //download view
      'handleDownloadToggle_UNUSED', //show/hide donwload options

      //table column pagination
      'handleCurrentColSpanChange',
      'handleColSpanChange',
      'handleNextColSpanChange',
      'handlePreviousColSpanChange',

      //period comparison
      'handlePeriodComaparisonToggle',
      'handleShowBenchmarkInGridChange',
      'handlePeriodComaprisonPreselect',

      // Apply btn disbale condition check when Period Comparison is enabled
      'isBothAnalysisPeriodAvailable',

      //calculated field
      'handleNewCalculatedFieldBtn',
      'handleCalculatedExpressionSaveAndEdit',
      'handleCalculatedExpressionDelete',
      'handleCalculatedExpressionCancelEdit',
      'handleCalculatedFieldEditorDrop',

      //Conditional Formatting
      'handleConditionalFormattingSelect',
      'handleAddNewConditionalFormatting',
      'handleRemoveNewConditionalFormatting',
      'renderTempFormatting',
      'handleColorPickerClick',
      'handleReplaceDateField',
      'handleToggleColorPicker',
      'handleColorPickerSelect',
      'giveFormattedCellValueInReactDivTable', // Callback for showing formaated value in datagrid cells

      // Event bindings related to Share tab
      'handleColorPickerSelect',
      'handleShareOrganisationSelect',
      'handleShareUsersSelect',
      'handleShareNewFormSubmit',
      'handleShareNewFormReset',
      'handleShareEditCancelBtn',
      'handleShareEditSubmitBtn',
      'handleShareEditDeleteBtn',

      // Event bindings related to Insights tab
      'handleInsightFormInputFocus',
      'handleInsightFormInputChange',
      'handleInsightFormCancelBtn',
      'handleInsightNoteSaveBtn',
      'handleInsightNoteSaveChangesBtn',
      'handleInsightEditFormInputChange',
      'handleInsightReplyFormInputChange',
      'handleInsightNoteReplySaveBtn',
      'handleInsightViewThreadBtn',
      'handleInsightUserFilterSelect',

      // Event binding for data selection
      'showSelectionValuesDropDown',
    ]);
  }

  /**
   * For unify the bind and unbind listener
   */
  bindEvents(methodArray) {
    methodArray.forEach(method => {
      this[method] = this[method].bind(this);
    });
  }

  //Set initial defaults
  getInitVariables() {
    const client_id = this.user.last_fetched_client;
    const terminal_type_id = this.user.terminal_type.id;

    //set defaults to initial state variables
    this.defaultConditionalFormatTypes = [{ 'id': 'standard', 'name': 'Standard' }];
    let defaultConditionalColorsRefs = [{ 'bg': React.createRef(), 'color': React.createRef() }];
    // let savedConfig = this.giveSavedConfig() ? this.giveSavedConfig()['saveConfig'] : {};
    
    //check the saved preference and render the panel position accordingly
    let sight_settings = JSON.parse(localStorage.getItem(Constants.SITE_PREFIX+'settings'));
    let default_panel_position = 'left';
    let default_datatab_viewmode = '1';
    if(sight_settings && sight_settings.user_preference){
      default_panel_position = sight_settings.user_preference.datagrid_panel!==undefined ? sight_settings.user_preference.datagrid_panel : default_panel_position;
      default_datatab_viewmode = sight_settings.user_preference.datagrid_datatab_viewmode!==undefined ? sight_settings.user_preference.datagrid_datatab_viewmode : default_datatab_viewmode;
    }
    
    let defaultObj = {
      // loading and error related variables
      inprocess_last_updated: false,
      inprocess_start_analysis: false,
      inprocess_get_analysis: false,
      inprocess_sublevel: false,
      total_content_length: 0,
      sublevel_content_length_reduce: 0,
      isIntialLoad: true,

      analysisSettings: this.giveAnalysisInitialSettings(),
      showReplaceDateDimensionMsg: false,
      replaceDateDimensionName: '',

      // Special variable to detect initial load error
      errorOccuredInStartOrGetAnalysis: false, // to enable RUN button to work even if there was some error (used mainly in case of error in initial load, needed as in initial load, we don't have more than one entry in panelEventLogs to compare)

      client: (client_id !== '' ? getKeyByValue(getClients(), client_id, 'id') : ''),
      terminal_type: terminal_type_id,
      data_sources: [],
      allDataSourcesDimensionsMetrics: {}, //store list of dimensions and metrics by datasource
      allDataSourcesDimensionsList: {}, //store dimensions list by datasource 
      selected_columns_count: 0,

      filter_panel_main_tab: 'Constructor', // can have 3 values 'Constructor', 'Insights', 'Share'
      filter_panel_current_tab: 'Transform', // can have 3 values 'Transform', 'Period','Conditional Formatting',
      dataTabView: default_datatab_viewmode,
      panel_first_tab_current_subtab: this.isAnalysisInEditMode() ? 'dataset' : 'period',
      panelConstructorSearchValue: '',

      last_updated_date: '',
      last_updated_date_tz: '',
      lastUpdatedDateObj: '',
      default_dynamic_timeperiod: '',

      selected_dimensions: {},
      selected_filters_date_obj: {},
      isSelectedDateRangeDynamic: false,
      selectedDateRanges: [],
      benchmarkRangeIndex: 0,
      isPeriodComparisonEnabled: false,
      showBenchmarkInGrid: false,
      periodComparisonPreselect: PERIOD_COMPARISON_PRESELECT_OPTIONS[0],
      periodComparisonGroupBy: null,

      conditionalFormatTypes: this.defaultConditionalFormatTypes,
      conditionalCellValues: [],
      conditionalColorsRefs: defaultConditionalColorsRefs,

      analysisid: '',
      isTimeoutCancelled: false,
      isAnalysisDataLoaded: false,
      analysisOrgColumns: '',
      analysisColumns: '',
      analysisColumnsDisplay: '', // used for showing table header grouping
      analysisColumnsWidth: null,
      analysisOrgData: '',
      analysisData: '',
      updateColumnsWidthInChild: true, // used to avoid updating column width in child component each time analysisData is changed, we have to update columns width in certain cases only

      savedAnalysisDetails: {},
      all_items: [],
      loading_all_items: false,
      view_type: this.props.analysisSavedSettings.view_type || '',
      selected_filters: [],
      selected_rows: [],
      selected_columns: [],
      selected_values: [],
      selected_value_field: null, // stores the value which is being edited in 'Custom Values' subtab
      // variables related to Calculated Field creation
      showCalculatedFieldForm: false,
      calculated_expression_name: '',
      calculated_expression_formula: '',
      calculated_expression_type: CALCULATED_FIELD_TYPES[0], // keep default type 'number'
      calculated_expression_access: CALCULATED_FIELD_ACCESS[0],
      calculated_expression_saving: false,
      calculated_expression_deleting: false,
      calculated_expression_fieldForEdit: null, // holds field item which is being edited
      calculated_expression_summarizeby: '', // holds the selected summarize by id( e.g 'sum', 'count', etc.) for selected Field from Avalailabel Fields 
      calculated_expression_aggregations_by_field: {}, // @type Object, it holds the selected aggregation value for each field in Calculated field form
      calculated_expression_aggregation_list_opened_field_title: '', // holds the title for the field in Calculated field form for which aggregation list is visible

      toggleFilterPanel: false,
      filterPanelPosition: default_panel_position,
      dimensions: {},
      currentSelectedFilter: null, // Stores the filter which is in expanded state to select its values

      collapseAllRows: false, //collapse all expanded rows and change icon on apply filter button click
      max_columns_allowed: 20,
      current_col_span: 1,

      // Variables related to anlayisForm
      showNewAnalysisForm: this.isNewAnalysis(),
      newAnalysisFormCurrentTab: 'setting',
      analysisSaveInProcess: false,

      organizationsList: [],
      organizationsUsersList: [],

      toggleDownloadOptions: false,
      tempConditionalFormatting: this.getDefaultConditionalFormattingSettings(),
      conditionalFormatting: this.getDefaultConditionalFormattingSettings(),

      // Variable to store and track history
      panelEventLogs: [],
      panelEventLogsIndex: null,
      panelEventLastExecutedLog: null,
      panelEventLogsDoneWhileRequestInProgress: [], // to store temporary logs corresponding to changes which are done by user after RUN btn and while request is in progress
      // Variable to store history of 'view_type'( It is not stored in panelEventLogs)
      view_type_last_executed: this.props.analysisSavedSettings.view_type || '',
      condtionalFormattingInputWrapperWidths: [], // to keep the widths of all the formatting settings always same

      // Variables related to panel 'share'
      loadingOrganisations: false,
      loadingUsers: false,
      shareOpertionInProgress: false, // common variable for disabling buttons during any operation related to Share
      organisationList: null,
      userList: null,
      shareShowNewForm: false,
      shareNewFormSelectedOrganisationId: null,
      shareNewFormSelectedUsers: [],
      shareNewFormSelectedAuthorizations: ['VIEW'],
      shareNewOrgSearch: '',
      shareNewUserSearch: '',
      loadingSharedUsers: false,
      sharedUsers: null,
      shareEditPopupUserID: null,
      shareEditUserInfo: null,
      shareEditSelectedAuthorizations: [],


      // Variables related to panel 'insight'
      insightNoteAddForm: { text: '' }, // its kept an object so that further info can be added if needed
      insightNoteAddInputExpanded: false,
      insightSelectedUsersIDs: [], // store the id's of user selected for fitlering notes
      insightNotes: null, // Notes list :fetched from server,
      insightOpenedOptionsNoteId: null,
      insightEditNoteId: null,
      insightEditNoteForm: { text: '' },
      insightNotesReplies: {}, // Map of parent note as a key and corresponding reply notes as value.
      insightNotesRepliesLoadings: {},
      insightNotesExpanded: {}, // Map of parent note as key and true/false as values indicating expanded/collapsed status of its replies
      insightReplyNoteId: null, // stores the id of note for which some reply is being done
      insightReplyNoteForm: { text: '' },
      loadingNotes: false,
      insightOpertionInProgress: false, // common variable for showing disabling buttons during any operation related to Insight


      // Variable for selected data
      selectedData: {},
      isDataSelected: false,
      isSelectionValueDropDownSelected: false,
    };

    return defaultObj;
  }

  /***********************************
   * Life Cycle Methods
   */
  componentDidMount() {
    // On component mount only trigger apis when this tab is in opened
    if (this.props.isActiveTab && !this.isNewAnalysis() && this.state.view_type !== '') {
      this.handleLoadScripts();
    } else {
      // for showing presentation filters at the time of new analysis creation
      if (this.isNewAnalysis()) { this.newAnalysisInitLoadScripts(); }
    }
    // subscribing the subject2 to get the notification about the client change from header.
    subject2.subscribe(this.handleClientChange.bind(this));

    subjectObj.notify({
      client: this.state.client
    });
  }


  componentDidUpdate(prev_props) {
    const scriptsAlreadyLoaded = this.state.data_sources.length > 0;
    if (!prev_props.isActiveTab && this.props.isActiveTab && this.state.inprocess_get_analysis) {
      this.setState({ inprocess_get_analysis: false })
    }
    if (!prev_props.isActiveTab && this.props.isActiveTab && !this.state.isAnalysisDataLoaded){// && !scriptsAlreadyLoaded) {
      this.setState({ isTimeoutCancelled: false });
      // If tab has become active and load apis are not loaded yet, trigger them
      if (!this.isNewAnalysis()) {
        this.handleLoadScripts();
      } else {
        if (this.isNewAnalysis()) {
          // for showing presentation filters at the time of new analysis creationx
          this.newAnalysisInitLoadScripts();
        }
      }
    }

    if (this.props.isActiveTab) {
      // If mode has been changed by pressing from either Edit to View or Vice-versa, set the variables accordingly
      if ((prev_props.isAnalysisInEditMode !== this.props.isAnalysisInEditMode)) {
        this.setState({
          dataTabView: '1',
          panel_first_tab_current_subtab: this.props.isAnalysisInEditMode ? 'dataset' : 'period',
          showNewAnalysisForm: false
        });
      }
    }
  }

  componentWillUnmount() {
    APIService.abortAPIRequests(this.controller);
    subject2.unSubscribe(this.handleClientChange.bind(this));
  }


  /***********************************
   * On Load - Functions
   */

  //for initial new analysis
  newAnalysisInitLoadScripts(){
    this.getTerminalDataSources()
      .then(() => {
        // set the list of all available fields and available fields for rows/cols etc. by passing the first data source name
        this.setAllItemsAndItemsOfRowsColsValuesFilters(this.state.view_type);
      });
  }

  //Load Data required initially
  handleLoadScripts() {
    this.setState({ inprocess_last_updated: true });
    
    this.informServerForTabOpen();
    this.getTerminalDataSources()
      .then(() => {
        // set the list of all available fields and available fields for rows/cols etc. by passing the first data source name
        this.setAllItemsAndItemsOfRowsColsValuesFilters(this.state.view_type);
        this.getDimensionsForViewType(this.state.view_type);

        this.getAnalysisID(true)
          .then(() => {
            // NOTE : Don't reset `inprocess_last_updated` to false here, setting it false here and again setting it true in getAnalysisData will cause to it to flash, which is not desirable
            this.getAnalysisData(this.getAnalysisDataPayload(), performance.now(), true);
          })
          .catch((err) => {
            this.setState({ inprocess_last_updated: false });
            console.log('Initial GetAnalysis Error', (err.msg || err.messge || err));
          });
      });

    // setTimeout(() => {
    //   this.toggleFiltersPanel();
    // }, 1200);
  }

  handleClientChange(obj) {
    this.setState({
      client: obj.client,
    }, () => {
      if (this.props.isActiveTab && !this.isNewAnalysis() && this.state.view_type !== '') {
        this.handleLoadScripts();
      } else {
        // for showing presentation filters at the time of new analysis creation
        if (this.isNewAnalysis()) { this.newAnalysisInitLoadScripts(); }
      }
    });
  }


  isNewAnalysis() { 
    return String(this.props.analysisSavedSettings.id).includes('new'); 
  }

  giveSavedConfig() {
    try {
      return this.props.analysisSavedSettings.config && this.props.analysisSavedSettings.config !== 'None' ? JSON.parse(this.props.analysisSavedSettings.config) : null
    } catch (e) {
      return null
    }
  }

  getDefaultConditionalFormattingSettings(){
    return [{ 
      'format_type': this.defaultConditionalFormatTypes[0], 
      'cell_value': [], 
      'condition': '', 
      'value1': '', 
      'value2': '', 
      'color': '#ffffff', 
      'background': '#000000', 
      'display_background_picker': false, 
      'display_fontcolor_picker': false 
    }];
  }



  /***********************************
   * Panel Changes Logs - Functions
   */

  //Returns the current value of all those state variables which are part of eventLoging
  giveCurrentValuesOfLoggedVariables() {
    const {
      selected_rows, selected_columns, selected_values, selected_filters, selected_dimensions, // Data tab variables
      isPeriodComparisonEnabled, selectedDateRanges, benchmarkRangeIndex, showBenchmarkInGrid, periodComparisonPreselect, // Period tab variables
      conditionalCellValues, conditionalColorsRefs, conditionalFormatTypes, tempConditionalFormatting // Formatting tab variables
    } = this.state;
    return {
      selected_rows, selected_columns, selected_values, selected_filters, selected_dimensions,
      isPeriodComparisonEnabled, selectedDateRanges, benchmarkRangeIndex, showBenchmarkInGrid, periodComparisonPreselect,
      conditionalCellValues, conditionalColorsRefs, conditionalFormatTypes, tempConditionalFormatting
    };
  }


  //Inserts a new element(state representing values of many state variables) in panelEventLogs
  setPanelEventLogs(newEntry) {
    // check if Some Request is in process, if Yes, store these logs in temporaryLogs variable
    const requestInProgess = this.state.inprocess_start_analysis || this.state.inprocess_get_analysis;
    if (requestInProgess) {
      this.setState({
        panelEventLogsDoneWhileRequestInProgress: [...this.state.panelEventLogsDoneWhileRequestInProgress, newEntry]
      });
    } else {
      // Do the normal process
      const updatedEventLogs = this.state.panelEventLogsIndex !== null ? [...this.state.panelEventLogs.slice(0, this.state.panelEventLogsIndex + 1), newEntry] : [...this.state.panelEventLogs, newEntry];
      this.setState({
        panelEventLogs: updatedEventLogs,
        panelEventLogsIndex: null
      });
    }
  }

  //Clear the logs entries(if any, possible when RUN button is pressed after undoing some settings) after panelEventLogsIndex.
  clearUnneededLogsAndUpdateLastExecutedLog() {
    const logIndex = this.state.panelEventLogsIndex;
    const newLastExecutedLog = logIndex !== null ? this.state.panelEventLogs[logIndex] : this.state.panelEventLogs[this.state.panelEventLogs.length - 1];
    this.setState({
      panelEventLogs: logIndex !== null ? this.state.panelEventLogs.filter((p, i) => i <= logIndex) : this.state.panelEventLogs,
      // Update the panelEventLastExecutedLog so that next time on RUN button, changes are compared with this value
      panelEventLastExecutedLog: newLastExecutedLog,
      // Also reset the panelEventLogsIndex
      panelEventLogsIndex: null,
      // Also reset view_type_last_executed
      view_type_last_executed: this.state.view_type
    })
  }

  //After completion of requests(suceess or error both), append the temp logs in main log list so that user can see those changes in RUN btn counter
  appendTempPanelEventLogs() {
    if (this.state.panelEventLogsDoneWhileRequestInProgress.length) {
      const logsWithUnneededCleared = this.state.panelEventLogsIndex !== null ? this.state.panelEventLogs.filter((p, i) => i <= this.state.panelEventLogsIndex) : this.state.panelEventLogs;
      this.setState({
        panelEventLogs: [...logsWithUnneededCleared, ...this.state.panelEventLogsDoneWhileRequestInProgress],
        // Also reset the panelEventLogsIndex
        panelEventLogsIndex: null,
        // Now clear the temp logs
        panelEventLogsDoneWhileRequestInProgress: []
      });
    }
  }



  //Concatenates list of dimensions, metrics, calculated metrics into one single list
  getAllListItems(results) {
    let allItems = [];
    if (results) {
      Object.keys(results).forEach((item) => {
        if (results[item].length > 0) {
          results[item].forEach((subitem) => {
            const subItemWithExtraKeys = this.getAllListItem(subitem)
            allItems.push(subItemWithExtraKeys);
          });
        }
      });
    }
    return allItems;
  }

  getAllListItem(originalItem) {
    let obj = { ...originalItem };
    obj['original_id'] = originalItem.id; // save the value of Database id in  new key 'original_id' as we will use key 'id' for front end purpose
    obj['id'] = originalItem.title;
    if (originalItem.type === 'number' || originalItem.type === 'currency' || originalItem.type === 'percent') {
      obj['default_action'] = isCalculatedField(originalItem) ? 'no_calculation' : 'sum';
      // obj['default_show_as'] = 'no_calculation';
      // obj['default_precision'] = 2;
    } else {
      // for originalItem.type==='string' OR for originalItem.type==='date'
      obj['default_action'] = 'count';
      // obj['default_show_as'] = 'no_calculation';
      // obj['default_precision'] = 2;
    }
    return obj;
  }

  /***********************************
   * Analysis Settings
   */
  isAnalysisInEditMode() { return this.props.isAnalysisInEditMode; }

  // NEW DASHBOARD FORM RELATED METHODS
  giveAnalysisInitialSettings() {
    const savedConfig = this.giveSavedConfig();
    return {
      name: this.isNewAnalysis() ? '' : this.props.analysisSavedSettings.name,
      description: this.props.analysisSavedSettings.description || '',
      id: this.isNewAnalysis() ? null : this.props.analysisSavedSettings.id,
      tags: this.props.analysisSavedSettings.tags || [],
      presentation_filters: (savedConfig && savedConfig.config) && savedConfig.config.presentation_filters ? savedConfig.config.presentation_filters : ['period']
    };
  }

  // Handle change in Dashboard name,description, time period etc.
  handleAnalysisSettingsChange(settingName, value) {
    const currSettings = this.state.analysisSettings;

    // Apply char count restriction in case of 'description' and 'name'
    if (settingName === 'description') {
      value = value.slice(0, MAX_DESCRIPTION_CHAR);
    }
    if (settingName === 'name') {
      value = value.slice(0, MAX_NAME_CHAR);
    }
    this.setState({
      analysisSettings: { ...currSettings, [settingName]: value }
    });
  }

  handleAnalysisPresentationFiltersShowAll(checked, allFilterList) {
    const updatedFilters = checked ? allFilterList : [];
    this.setState({ analysisSettings: { ...this.state.analysisSettings, presentation_filters: updatedFilters } });
  }

  handleAnalysisPresentationFiltersToggle(filterName) {
    let currentFilters = this.state.analysisSettings.presentation_filters ? [...this.state.analysisSettings.presentation_filters] : [];
    let savedFilters = (this.state.savedAnalysisDetails && this.state.savedAnalysisDetails.config) ? [...this.state.savedAnalysisDetails.config.presentation_filters] : [];    
    currentFilters = [...new Set([...currentFilters, ...savedFilters])];

    const updatedFilters = currentFilters.includes(filterName) ? currentFilters.filter(t => t !== filterName) : [...currentFilters, filterName];
    this.setState({ analysisSettings: { ...this.state.analysisSettings, presentation_filters: updatedFilters } });
  }

  handleAnalysisSettingsBtn() {
    this.setState({ showNewAnalysisForm: true });
  }

  //make view fullscreen 
  handleAnalysisFullscreenBtn() {
    const ele = document.querySelector(`#d-${this.props.analysisSavedSettings.id} #analysis`);
    const fullScreenFunc = ele.requestFullscreen || ele.webkitRequestFullscreen || ele.msRequestFullscreen;
    fullScreenFunc.call(ele).catch(err => console.log('Some error occured while opening full-screen mode'));
  }

  //save the analysis
  handleAnalysisSaveBtn() {
    let savedAnalysisConfig = {...this.state.savedAnalysisDetails.config};
    let analysisSettings = {...this.state.analysisSettings.config, presentation_filters: this.state.analysisSettings.presentation_filters};

    Object.keys(analysisSettings).forEach((item) => {
      savedAnalysisConfig[item] = analysisSettings[item];
    });
    
    const payload = {
      // config: JSON.stringify({ ...this.giveSavedConfig(), presentation_filters: this.state.analysisSettings.presentation_filters }),
      config: JSON.stringify(savedAnalysisConfig),
      name: this.state.analysisSettings.name,
      description: this.state.analysisSettings.description,
      view_type: this.state.view_type || 'advertiser', // Set default as 'advertiser'
      terminal: this.state.terminal_type,
    }

    // console.log('analysisSettings', this.state.analysisSettings);
    // console.log('config', payload.config);
    if (!this.isNewAnalysis()) {
      payload.id = this.props.analysisSavedSettings.id;
      // payload.config =JSON.stringify({ ...this.giveSavedConfig(), presentation_filters: this.state.analysisSettings.presentation_filters });
    }

    this.setState({ analysisSaveInProcess: true });
    const reqMethod = this.isNewAnalysis() ? 'POST' : 'PUT';
    APIService.apiRequest(Constants.API_BASE_URL + '/saveAnalysisView', payload, false, reqMethod, this.controller)
      .then(response => {
        if (response.status === 1) {
          // console.log(`ANALYSIS SAVE SUCCESS`);
          alertService.showToast('success', `Analysis ${this.isNewAnalysis() ? ' Created' : 'Edited'} Successfully`);
          this.setState({ analysisSaveInProcess: false });
          const updatedAnalysisData = reqMethod === 'POST' ? response.details : payload;
          this.props.onAnalysisSaveOrEdit(updatedAnalysisData);
        } else {
          // console.log(`ANALYSIS SAVE FAILED`);
          this.setState({ analysisSaveInProcess: false });
          console.log('FAIL REASON : ', response.message);
        }
      })
      .catch(err => {
        console.log(`Analysis SAVE FAILED`);
        console.log('FAIL REASON : ', err.message);
        this.setState({ analysisSaveInProcess: false });
      });
  }

  handleAnalysisFormCloseBtn() {
    this.setState({
      showNewAnalysisForm: false
    });
  }

  /***********************************
   * APIs Calls
   */

  //Save opend tab id to DB, it also returns saved config but not using it right now.
  informServerForTabOpen() {
    APIService.apiRequest(Constants.API_BASE_URL + '/data_grid/open_analysis_tab/' + this.props.analysisSavedSettings.id, null, false, 'PUT', this.controller)
      .then(response => {
        //new - fetch adn save analysis saved details
        let allAnalysisDetails = {...response.analysis};
        allAnalysisDetails['config'] = JSON.parse(allAnalysisDetails.config);
        if(allAnalysisDetails['config']['saveConfig']!==undefined){ //backward compatibility
          allAnalysisDetails['config'] = allAnalysisDetails['config']['saveConfig'];
        }

        allAnalysisDetails['dynamic_time_period'] = JSON.parse(allAnalysisDetails.dynamic_time_period);
        
        //set parsed analysis details and conditional formatting here and rest (rows, columns, values, filters_ dimensions etc) will get updated on next api call
        let defaultConditionalColorsRefs = [];
        let conditionalFormatting = [];
        if (allAnalysisDetails && allAnalysisDetails['config'] && allAnalysisDetails['config'].conditional_formatting) { // For saved report, initialize according to the saved condtions
          defaultConditionalColorsRefs = allAnalysisDetails['config'].conditional_formatting.map(x => ({ 'bg': React.createRef(), 'color': React.createRef() }));
          conditionalFormatting = allAnalysisDetails['config'].conditional_formatting;
        }
        
        let stateObj = { savedAnalysisDetails: allAnalysisDetails };
        //conditional formatting
        if(defaultConditionalColorsRefs.length > 0){
          stateObj['conditionalColorsRefs'] = defaultConditionalColorsRefs;
        }
        if(conditionalFormatting.length > 0){
          stateObj['tempConditionalFormatting'] = conditionalFormatting;
          stateObj['conditionalFormatting'] = conditionalFormatting;
        }

        //period comparison
        if(allAnalysisDetails['config']['selected_benchmark_index'] && allAnalysisDetails['config']['selected_benchmark_index']!==undefined){
          stateObj['benchmarkRangeIndex'] = allAnalysisDetails['config']['selected_benchmark_index'];
        }
        if(allAnalysisDetails['config']['period_comparison_enabled']){
          stateObj['isPeriodComparisonEnabled'] = allAnalysisDetails['config']['period_comparison_enabled'];
        }
        if(allAnalysisDetails['config']['show_benchmark_period']){
          stateObj['showBenchmarkInGrid'] = allAnalysisDetails['config']['show_benchmark_period'];
        }
        if(allAnalysisDetails['config']['period_comparison_preselect']){
          stateObj['periodComparisonPreselect'] = allAnalysisDetails['config']['period_comparison_preselect'];
        }
        if(allAnalysisDetails['config']['period_comparison_groupby']){
          stateObj['periodComparisonGroupBy'] = allAnalysisDetails['config']['period_comparison_groupby'];
        }
        stateObj['analysisSettings'] = allAnalysisDetails;
        if(allAnalysisDetails.config.presentation_filters!==undefined){
          stateObj['analysisSettings']['presentation_filters'] = allAnalysisDetails.config.presentation_filters;
        } else {
          stateObj['analysisSettings']['presentation_filters'] = ['period'];
          stateObj['savedAnalysisDetails']['presentation_filters'] = ['period'];
        }

        this.setState(stateObj);
      })
      .catch(err => {
        console.log('Error on informing  server about tab opening for tab: ' + this.props.analysisSavedSettings.id);
      });
  }

  //Get Terminal Data Sources
  getTerminalDataSources() {
    return new Promise((resolve, reject) => {
      APIService.apiRequest(Constants.API_BASE_URL + '/data_grid/get_data_sources/' + this.state.terminal_type, null, false, 'GET', this.controller)
        .then(response => {
          if (response.status === 1 && response.data !== undefined && response.data.length > 0) {
            let filtered_data_sources = [];
            let allDataSourcesDimensionsMetrics = {};
            let allDataSourcesDimensionsList = {};

            //show datasources which user has privilege
            response.data.forEach((item) => {
              if (item.is_custom_trend === 0 && (this.user.privileges[this.state.terminal_type].includes(item.privilege) || (this.user.privileges['sellside'] !== undefined && this.user.privileges['sellside'].includes('APEX')))) {
                filtered_data_sources.push(item);
                allDataSourcesDimensionsMetrics[item.name] = this.getAllListItems(item.columns);
              }
            });

            //filtered all dimension across all data sources
            if(Object.keys(allDataSourcesDimensionsMetrics).length > 0){
              Object.keys(allDataSourcesDimensionsMetrics).forEach((item) => {
                allDataSourcesDimensionsMetrics[item].forEach((subitem) => {
                  if(subitem && subitem.is_dimension!==undefined && subitem.is_dimension===1 && subitem.type==='string' && !Object.keys(allDataSourcesDimensionsList).includes(subitem.title)){
                    allDataSourcesDimensionsList[subitem.title] = [];
                  }
                });
              });
            }

            
            this.setState({
              data_sources: filtered_data_sources,
              allDataSourcesDimensionsMetrics: allDataSourcesDimensionsMetrics,
              allDataSourcesDimensionsList: allDataSourcesDimensionsList,
              view_type: this.state.view_type || filtered_data_sources[0].name // assign the first data source from list if not present already
            }, () => {
              const promise1 = this.getLastUpdatedDate();
              Promise.all([promise1])
                .then(() => {
                  resolve();
                })
                .catch((err) => {
                  console.log('Response startAnalysis Error', (err.msg || err.messge || err));
                  reject();
                });
            });
          } else {
            console.log('Error: ' + response.msg);
            reject(response);
          }
        })
        .catch(err => {
          console.log('Error on getting data sources list: ' + err.msg);
          reject(err);
        });
    });
  }

  //Set list of all_items, rows, columns, values, filters based on view_type
  setAllItemsAndItemsOfRowsColsValuesFilters(view_type) {
    const viewTypeInfo = this.state.data_sources.find(ds => ds.name === view_type);
    const allItems = this.getAllListItems(viewTypeInfo.columns);
    // also construct the 'mappingOfFieldAndDefaultAction' which will be used in Calculated Field form
    const mappingOfFieldAndDefaultAction = allItems.reduce((mapping, item) => ({ ...mapping, [item.title]: item.default_action }), {});
    const savedAnalysisConfig = this.state.savedAnalysisDetails;
    
    let stateObj = {
      all_items: this.giveSortedAllItems(allItems),
      calculated_expression_aggregations_by_field: mappingOfFieldAndDefaultAction
    };

    // Only use the saved config, if it has same view type as current selected
    let selected_rows = this.getDefaultElements(allItems, 'default_row');
    let selected_columns = this.getDefaultElements(allItems, 'default_column');
    let selected_values = this.getDefaultElements(allItems, 'default_value');
    let selected_dimensions = {};
    let selected_filters = [];
    
    if (savedAnalysisConfig && savedAnalysisConfig.view_type === this.state.view_type) {
      selected_rows = savedAnalysisConfig.config.rows ? savedAnalysisConfig.config.rows : this.getDefaultElements(allItems, 'default_row');
      selected_columns = savedAnalysisConfig.config.columns ? savedAnalysisConfig.config.columns : this.getDefaultElements(allItems, 'default_column');
      selected_values = [];

      // In saved report's values, some values of operation and default_action may have become old/invalid, so we need to pick up the latest operation value from corresponding item in all_items
      if (savedAnalysisConfig.config.values !==undefined && savedAnalysisConfig.config.values.length > 0) {
        savedAnalysisConfig.config.values.forEach(v => {
          const vInAll = stateObj.all_items.find(a => a.title === v.title);
          selected_values.push({ ...v, operation: vInAll.operation, default_action: vInAll.default_action });
        })
      } else {
        selected_values = this.getDefaultElements(allItems, 'default_value');
      }

      selected_filters = (savedAnalysisConfig.config.filters!==undefined && Object.keys(savedAnalysisConfig.config.filters).length > 0) ? this.getSelectedFiltersList(savedAnalysisConfig.config.filters, stateObj.all_items) : [];
      selected_dimensions = savedAnalysisConfig.config.filters || {};
    }

    let default_cell_values = [];
    selected_values.forEach((item) => {
      let option_id = isCalculatedField(item) ? '' : item.default_action + ' '; //remove calculated word when it is under dropdown value to fix the conditional formattng issue
      default_cell_values.push({ 'id': option_id + item.title, 'name': option_id + item.title });
    });
    stateObj['selected_rows'] = selected_rows;
    stateObj['selected_columns'] = selected_columns;
    stateObj['selected_values'] = selected_values;
    stateObj['conditionalCellValues'] = default_cell_values;
    stateObj['selected_dimensions'] = selected_dimensions;
    stateObj['selected_filters'] = selected_filters;

    this.setState(stateObj, () => {
      // Since we have got our initial values of all settings, we can push this as the first entry in panelEventLogs
      // Also, set the panelEventLastExecutedLog
      const firstEntry = this.giveCurrentValuesOfLoggedVariables();
      this.setState({
        panelEventLogs: [firstEntry],
        panelEventLastExecutedLog: firstEntry,
        panelEventLogsIndex: null
      });
    });
  }

  //get default/saved date ranges
  getLastUpdatedDate() {
    return new Promise((resolve, reject) => {
      let defaultCount = 29; //incase default is not coming from api
      let defaultFormat = 'days';
      let formattedDate = '';
      let formattedStartDate = '';
      let formattedEndDate = '';
      let formattedLastUpdatedDateObj = '';
      let savedDynamicTimePeriod = this.state.savedAnalysisDetails.dynamic_time_period;
      let endDate = new Date();
      
      // check the current datasource and find the default_dynamic_timeperiod
      let current_datasource_index = this.state.data_sources.findIndex((item) => item.name === this.state.view_type);
      if (current_datasource_index > -1) {
        defaultCount = this.state.data_sources[current_datasource_index]['default_dynamic_timeperiod'];
      }
      
      const isSavedView = (savedDynamicTimePeriod && savedDynamicTimePeriod!=='' && (savedDynamicTimePeriod.value!==undefined && savedDynamicTimePeriod.value.firstRange[0]!=='NaN-NaN-NaN')); // TODO, do it properly
      //for saved views
      if (isSavedView) {
        //if dynamic period selected
        if (savedDynamicTimePeriod.is_dynamic) {
          if (this.props.analysisSavedSettings.dynamic_time_period.value === 'Last 7 Days') { defaultCount = 6; }
          else if (this.props.analysisSavedSettings.dynamic_time_period.value === 'Last 15 Days') { defaultCount = 14; }
          else if (this.props.analysisSavedSettings.dynamic_time_period.value === 'Last 30 Days') { defaultCount = 29; }
          else if (this.props.analysisSavedSettings.dynamic_time_period.value === 'Last Month') {
            defaultCount = 1;
            defaultFormat = 'months';
          } else if (this.props.analysisSavedSettings.dynamic_time_period.value === 'This Month') {
            defaultFormat = 'this_month';
          }

          formattedEndDate = moment(endDate.getTime() + endDate.getTimezoneOffset() * 60000).toDate(); //convert to utc time
          formattedStartDate = moment(formattedEndDate).subtract(defaultCount, defaultFormat).toDate();
          if (defaultFormat === 'months') {//for saved views
            formattedStartDate = moment(formattedEndDate).subtract(defaultCount, defaultFormat).startOf('month').toDate();
            formattedEndDate = moment(formattedEndDate).subtract(defaultCount, defaultFormat).endOf('month').toDate();
          }
          if (defaultFormat === 'this_month') {
            formattedStartDate = moment(formattedEndDate).startOf('month').toDate();
          }

        } else if(!savedDynamicTimePeriod.is_dynamic) {
          // Here we have date range saved in Stingified Object form 
          const firstRange = savedDynamicTimePeriod.value.firstRange;
          formattedStartDate = moment(firstRange[0]).utc().toDate();
          formattedEndDate = moment(firstRange[1]).utc().toDate();
          formattedDate = formattedEndDate;
          // formattedLastUpdatedDateObj = formattedEndDate;
        }

      } else { // if not saved view show default days data
        // let endDate = moment(lastupdateddate[0]['last_updated_date']).utc().toDate();
        formattedEndDate = moment(endDate.getTime() + endDate.getTimezoneOffset() * 60000).toDate(); //convert to utc time

        if (this.state.terminal_type === 'klay_media') {
          // formattedDate = moment(lastupdateddate[0]['last_updated_date']).utc().format('MM/DD/YYYY HH:mm:ss');
          formattedDate = moment(endDate).utc().format('MM/DD/YYYY HH:mm:ss');
        } else {
          // formattedDate = moment(lastupdateddate[0]['last_updated_date']).utc().format('MMM DD, YYYY');
          formattedDate = moment(endDate.getTime() + endDate.getTimezoneOffset() * 60000).toDate();
        }

        // Now check if it is a saved report and that too is Auto saved or not.
        // If Auto saved, selected date range is to be directly picked from saved data
        // Else(either not saved or not auto saved), date range is to be calculated using `formattedDate` and `defaultFormat`
        // formattedLastUpdatedDateObj = moment(endDate.getTime() + endDate.getTimezoneOffset() * 60000).toDate(); //used for disabling future dates in calendar
        // if (this.state.terminal_type === 'klay_media') {
        //   formattedLastUpdatedDateObj = moment(endDate.getTime() + endDate.getTimezoneOffset() * 60000).toDate(); //used for disabling future dates in calendar
        // }

        formattedStartDate = moment(formattedEndDate).subtract(defaultCount, defaultFormat).toDate();
        if (defaultFormat === 'months') {//for saved views
          formattedStartDate = moment(formattedEndDate).subtract(defaultCount, defaultFormat).startOf('month').toDate();
          formattedEndDate = moment(formattedEndDate).subtract(defaultCount, defaultFormat).endOf('month').toDate();
        }
        if (defaultFormat === 'this_month') {
          formattedStartDate = moment(formattedEndDate).startOf('month').toDate();
        }
      }


      formattedLastUpdatedDateObj = moment(endDate.getTime() + endDate.getTimezoneOffset() * 60000).toDate(); //used for disabling future dates in calendar
      let formattedDateRange = [formattedStartDate, formattedEndDate];
      let secondDateRange = null;
      if (isSavedView && this.state.savedAnalysisDetails.config.period_comparison_enabled) {
        if (this.props.analysisSavedSettings.is_autosaved) {
          // Extract the secondRange from  savedAnalysisPeriod
          // const secondRange = JSON.parse(this.props.analysisSavedSettings.dynamic_time_period).secondRange;
          const secondRange = this.state.savedAnalysisDetails.config.dynamic_time_period.secondRange;
          let second_range_start = moment(secondRange[0]).utc().toDate();
          let second_range_end = moment(secondRange[1]).utc().toDate();
          secondDateRange = [second_range_start, second_range_end];

        } else {
          secondDateRange = this.calculateSecondRangeOfPeriodComparison(formattedDateRange, this.state.savedAnalysisDetails.config.period_comparison_preselect.id);
        }
      }

      let stateObj = {
        last_updated_date: formattedDate,
        lastUpdatedDateObj: formattedLastUpdatedDateObj,
        selectedDateRanges: secondDateRange ? [formattedDateRange, secondDateRange] : [formattedDateRange],
      };
      this.setState(stateObj, () => {
        resolve();
      });
    });
  }

  //Get Default Selected  - Rows/Columns/Filter/Values
  getDefaultElements(all_items, key) {
    let current_data_source = this.state.data_sources.find((item) => item.name === this.state.view_type);
    let default_items = current_data_source[key] ? current_data_source[key].split(',').map((item) => item.trim()) : [];
    let default_selected_items = [];

    //show values bydefault and then add selected dimensions
    if (key === 'default_column') {
      default_selected_items.push({ id: 'values', title: 'values', display_title: 'Values', type: 'string' });
    }


    // filter current data_source defaults
    default_items.forEach((ele) => {
      // debugger
      let matching_item = all_items.filter((item) => item.title === ele);
      if (matching_item.length > 0) {
        matching_item[0]['id'] = matching_item[0]['id'] + '_1';
        default_selected_items.push(matching_item[0]);
      }
    });

    return default_selected_items;
  }

  //Used under AnalysisViewSave
  getOrganizationsAndUsersList() {
    APIService.apiRequest(Constants.API_BASE_URL + '/getOrganizationAndUserList', null, false, 'POST', this.controller)
      .then(response => {
        if (response.status === 1 && (response.organization !== undefined || response.user !== undefined)) {
          this.setState({
            organizationsList: JSON.parse(response.organization),
            organizationsUsersList: JSON.parse(response.user)
          });
        } else {
          this.setState({
            organizationsList: [],
            organizationsUsersList: []
          });
        }
      })
      .catch(err => {
        console.log('Error on getting organizations list: ' + err.msg);
      });
  }

  //Get Site Dimension for site specific logins
  getDefaultDimensions() {
    let filters = [];
    if (Array.isArray(this.user.attributes)) {
      this.user.attributes.forEach((item) => {
        if (item.site_name !== undefined) {
          filters.push(item.site_name);
        }
      });
    }
    return { "property": filters };
  }

  //Get Analysis ID api payload
  getAnalysisIdPayload() {
    let obj = {
      "client_id": this.state.client.id,
      "view_type": this.state.view_type
    };
    if (this.state.view_type === 'performance') {
      obj['data_source'] = 'advertiser';
    }

    //Pass property names under dimensions if it is site specific login
    let dimension_filters = [];
    if (this.user.parent_organization_id > 1) {
      dimension_filters = this.getDefaultDimensions();
    }
    if (Object.keys(dimension_filters).length > 0) {
      obj['dimensions'] = dimension_filters;
    }
    return obj;
  }

  //Get Analysis ID and then Get Analysis Data based on received analysis id
  getAnalysisID(initial_load = false) {
    return new Promise((resolve, reject) => {
      // First check some input validations
      if (this.state.isPeriodComparisonEnabled) {
        // check that date range is same for both periods
        const daysInRange1 = giveDaysCountInRange(this.state.selectedDateRanges[0][0], this.state.selectedDateRanges[0][1]);
        const daysInRange2 = giveDaysCountInRange(this.state.selectedDateRanges[1][0], this.state.selectedDateRanges[1][1]);

        if (daysInRange1 !== daysInRange2) {
          AlertService.showToast('error', 'Range must be same for both Periods');
          reject();
          return;
        }
      }

      // check if date range is valid or not
      if(!this.state.isPeriodComparisonEnabled){
        const daysInRange = giveDaysCountInRange(this.state.selectedDateRanges[0][0], this.state.selectedDateRanges[0][1]);
        if (!daysInRange || daysInRange === 0) {
          AlertService.showToast('error', 'Please select the end date.');
          reject();
          return;
        }
      }

      // INPUT VALIDATION PASSED
      //NOW BASED ON PERIOD COMPARISON STATUS, PREPARE PAYLOADS AND SEND REQUESTS

      //Set loader and msg state variables and Send Request
      let loadingUIState = {
        inprocess_start_analysis: true,
        errorOccuredInStartOrGetAnalysis: false,
        selected_columns_count: 0,
        current_col_span: 1
      }, completedUIState = { inprocess_start_analysis: false };

      let toastId;
      let toastMsg = 'Loading data for the Date selection..';
      if (initial_load) { toastMsg = 'Starting analysis instance, please wait..'; }
      toastId = AlertService.showToast('process', toastMsg, { autoClose: false });

      this.setState(loadingUIState);

      // HANDLE DIFFERENTLY FOR PERIOD COMPARISON ON AND OFF
      if (this.state.isPeriodComparisonEnabled) {
        // In case of Period Comparison Enabled, two parallel requests for fetching the analyisis Id need to be sent
        // Then those 2 recieved analysis ids will be used in GetAnalysisDats Call

        // Ensure that range1 is for the benchmark period
        const bmRangeIndex = this.state.benchmarkRangeIndex;
        const r_i_1 = bmRangeIndex === 0 ? 0 : 1; // r_i  is range index
        const r_i_2 = bmRangeIndex === 0 ? 1 : 0;
        const start_date_1 = this.formatDate(this.state.selectedDateRanges[r_i_1][0], 'YYYY-MM-DD'); //MM/DD/YYYY
        const end_date_1 = this.formatDate(this.state.selectedDateRanges[r_i_1][1], 'YYYY-MM-DD');
        const start_date_2 = this.formatDate(this.state.selectedDateRanges[r_i_2][0], 'YYYY-MM-DD');
        const end_date_2 = this.formatDate(this.state.selectedDateRanges[r_i_2][1], 'YYYY-MM-DD');

        let api_url_1 = '/' + this.state.terminal_type + '/start_analysis/?start_date=' + start_date_1 + '&end_date=' + end_date_1 + '&view_type=' + this.state.view_type;
        let api_url_2 = '/' + this.state.terminal_type + '/start_analysis/?start_date=' + start_date_2 + '&end_date=' + end_date_2 + '&view_type=' + this.state.view_type;
        let req_method = 'GET';
        let chartsPayLoads = [null, null];

        // if (this.state.terminal_type === 'klay_media') {
          api_url_1 += '&client_id=' + this.state.client.id;
          api_url_2 += '&client_id=' + this.state.client.id;
        // }

        /* API Request parameters -  API_URL, data, showProgress=false, req_method='POST', signal=null */
        const Request_1 = APIService.apiRequest(Constants.API_BASE_URL + api_url_1, chartsPayLoads[0], false, req_method, this.controller);
        const Request_2 = APIService.apiRequest(Constants.API_BASE_URL + api_url_2, chartsPayLoads[1], false, req_method, this.controller);
        // APIService.apiRequest(Constants.API_BASE_URL + api_url, analysisPayLoad, false, req_method, this.controller)
        Promise.all([Request_1, Request_2])
          .then(([response_1, response_2]) => {
            if (response_1.status === 1 && response_1.analysisid !== undefined && response_2.status === 1 && response_2.analysisid !== undefined) {
              this.setState({ analysisid: [response_1.analysisid, response_2.analysisid], ...completedUIState }, () => {
                AlertService.hideToast(toastId);
                resolve();
              });

            } else {
              this.setState({...completedUIState,  errorOccuredInStartOrGetAnalysis: true});
              AlertService.hideToast(toastId);
              reject(response_1 || response_2);
            }
          })
          .catch(err => {
            this.setState({ ...completedUIState, errorOccuredInStartOrGetAnalysis: true });
            AlertService.hideToast(toastId);
            reject(err);
          });

      } else {
        const start_date = this.formatDate(this.state.selectedDateRanges[0][0], 'YYYY-MM-DD');
        const end_date = this.formatDate(this.state.selectedDateRanges[0][1], 'YYYY-MM-DD');

        let api_url = '/' + this.state.terminal_type + '/start_analysis/?start_date=' + start_date + '&end_date=' + end_date + '&view_type=' + this.state.view_type;
        let req_method = 'GET';
        let chartsPayLoad = null;

        // if (this.state.terminal_type !== 'klay_media') {
        //   api_url += '&client_id=' + this.state.client.id;
        // }
        api_url += '&client_id=' + this.state.client.id;

        /* API Request parameters -  API_URL, data, showProgress=false, req_method='POST', signal=null */
        APIService.apiRequest(Constants.API_BASE_URL + api_url, chartsPayLoad, false, req_method, this.controller)
          .then(response => {
            if (response.status === 1 && response.analysisid !== undefined) {
              this.setState({ analysisid: response.analysisid, ...completedUIState }, () => {
                AlertService.hideToast(toastId);
                resolve();
              });
            } else {
              this.setState({ ...completedUIState, errorOccuredInStartOrGetAnalysis: true });
              AlertService.hideToast(toastId);
              reject(response);
            }
          })
          .catch(err => {
            this.setState({ ...completedUIState, errorOccuredInStartOrGetAnalysis: true });
            AlertService.hideToast(toastId);
            reject(err);
          });
      }
    });
  }

  //Get Analysis Data api payload
  getAnalysisDataPayload() {
    //Pass property names under dimensions if it is site specific login
    let dimension_filters = this.state.selected_dimensions;
    if (this.user.parent_organization_id > 1 && !isEmptyObject(this.state.selected_dimension) && this.state.selected_filters.length <= 0) {
      dimension_filters = this.getDefaultDimensions();
    }

    return {
      "analysisid": this.state.analysisid,
      "rows": this.generateSelectedRowsColsElements(this.state.selected_rows),
      "columns": this.generateSelectedRowsColsElements(this.state.selected_columns),
      "filters": dimension_filters
    };
  }

  //append empty columns and data if actual data cols and rows are less than default cols and rows
  getModifiedDataWithBlankRowsColumns(analysisCols, analysisData){
    let default_rows = (60 - Object.keys(this.state.selected_columns).length);
    let default_cols = 20;
    let updatedAnalysisColumns = [...analysisCols];
    let updatedanalysisData = analysisData;
    
    if(updatedAnalysisColumns.length < default_cols){
      for(let i=(updatedAnalysisColumns.length+1); i<=default_cols; i++){
        updatedAnalysisColumns.push('blank_'+i);
      }
    }
    
    if(updatedanalysisData.length < default_rows){
      for(let i=0; i<default_rows; i++){
        //add empty data to existing columns of rows
        if(i < updatedanalysisData.length){
          updatedanalysisData.forEach((item, i) => {
            updatedAnalysisColumns.forEach((col)=>{
              if(col.includes('blank_')){ item[col] = ''; }
            });
          });

        } else {
          //add new row with all empty data
          let newRow = {};
          updatedAnalysisColumns.forEach((item)=>{
            newRow[item] = '';
          });
          updatedanalysisData.push(newRow);
        }
      }
    }  else if(updatedanalysisData.length >= default_rows && analysisCols.length < default_cols){ //render empty row cells for existing rows
      updatedanalysisData.forEach((item) => {
        updatedAnalysisColumns.forEach((col)=>{
          if(col.includes('blank_')){ item[col] = ''; }
        });
      });
    }

    return {analysisColumns: updatedAnalysisColumns, analysisData: updatedanalysisData};
  }

  //Get Analysis Data
  getAnalysisData(analysisPayLoad, request_send_time, initial_load=null) {
    //Input Validations and Send Fetch Request
    let col_span = parseInt(this.state.current_col_span);
    analysisPayLoad['column_span'] = col_span;
    analysisPayLoad['max_column_span'] = (this.state.max_columns_allowed); //100
    if (this.state.isPeriodComparisonEnabled) {
      analysisPayLoad['show_benchmark_data'] = this.state.showBenchmarkInGrid ? 1 : 0;
    }

    // let emptyRowsAndCols = this.getModifiedDataWithBlankRowsColumns([], []);
    this.setState({
      errorOccuredInStartOrGetAnalysis: false,
      inprocess_last_updated: false,
      inprocess_get_analysis: true,
      total_content_length: 0,

      // analysisOrgColumns: [],
      // analysisColumns: emptyRowsAndCols.analysisColumns,
      // analysisColumnsDisplay: [],
      // analysisOrgData: [],
      // analysisData: emptyRowsAndCols.analysisData,
      // inprocess: false,
      // inprocess_get_analysis: false,
      // show_data_loading: true
    }, ()=>{

      APIService.apiRequest(Constants.API_BASE_URL + '/getAnalysisLData', analysisPayLoad)
      .then(response => {
        // version 1.0
        if (response.status === 1 || response.wait_time) {
          if (this.state.timeoutVar === null) {
            this.setState({ isTimeoutCancelled: true });
          }
          if (response.wait_time && !this.state.isTimeoutCancelled) {
            let timeout = setTimeout(() => {
              this.setState({ inprocess_get_analysis: false }, () => {this.getAnalysisData(analysisPayLoad, request_send_time);})
            }, response.wait_time * 1000)
            this.props.setTimeoutVar(timeout);
            return;
          }

          this.props.setTimeoutVar(null);

          // Everytime new data is fetched, copy the `tempCondtionalFormatting` to `condtionalFormatting` so that it gets applied in next render
          this.renderTempFormatting();

          //update conditional formatting values dropdown as well
          let defaultCellValues = [];
          let analysisData = JSON.parse(response.data);
          let analysisOrgData = [...analysisData];

          this.state.selected_values.forEach((item) => {
            let option_id = isCalculatedField(item) ? '' : item.default_action + ' '; //remove calculated word when it is under dropdown value to fix the conditional formattng issue
            defaultCellValues.push({ 'id': option_id + item.title, 'name': option_id + item.title });
          });

          //make few empty entries for blank columns
          let updatedanalysisColsAndData = this.getModifiedDataWithBlankRowsColumns([...response.columns], [...analysisData]);

          this.setState({
            inprocess: false,
            isAnalysisDataLoaded: true,
            inprocess_get_analysis: false,
            show_data_loading: false,
            // data_requests_list: data_req_list,
            analysisOrgColumns: response.columns,
            analysisColumns: updatedanalysisColsAndData.analysisColumns,
            analysisColumnsDisplay: response.columns_display,
            analysisData: updatedanalysisColsAndData.analysisData,
            analysisOrgData: analysisOrgData,
            // analysisColumnsDisplay: that.state.isPeriodComparisonEnabled && !that.state.showBenchmarkInGrid ? that.giveCorrectedColumnsDisplay(results.columns_display) : results.columns_display,
            analysisColumnsWidth: response.columns_width,
            updateColumnsWidthInChild: true,
            collapseAllRows: true,
            selected_columns_count: response.max_number_of_columns,
            conditionalCellValues: defaultCellValues
          });

          //save when it is not initial load and edit mode
          if(!initial_load && this.isAnalysisInEditMode()){
            this.saveSettingsToServer();
          }

        } else {
          this.setState({
            errorOccuredInStartOrGetAnalysis: true,
            inprocess_get_analysis: false,
            show_data_loading: false,
            data_requests_list: [],
            dateperiod_loading: false,
            analysis_period_error: true,
            analysis_period_msg: response.msg,
            filter_panel_tabs: [false, true, false],
            analysisColumns: [],
            analysisColumnsDisplay: [],
            analysisData: []
          });
          AlertService.error(response.msg);
          // Call `renderTempFormatting` in case of status=0 also in order to set value of panelEventLastExecutedIndex
          this.renderTempFormatting();
          this.saveSettingsToServer();
          return;
        }
      })
      .catch(err => {
        this.setState({
          errorOccuredInStartOrGetAnalysis: true,
          inprocess_get_analysis: false,
        });
      });
    });
    
  }

  //Get Analysis Data
  getAnalysisSubLevelData(analysisPayLoad, row_index, level_details) {
    this.setState({ inprocess_sublevel: true });

    APIService.apiRequest(Constants.API_BASE_URL + '/getAnalysisLData', analysisPayLoad, true, 'POST', this.controller)
      .then(response => {
        let contentLength = response.total_len;
        let total = 0;
        let chunks = [];
        let that = this;

        response.reader.read().then(function processResult(result) {
          if (result.done) {
            // Step 4: concatenate chunks into single Uint8Array
            let chunksAll = new Uint8Array(total); // (4.1)
            let position = 0;
            for (let chunk of chunks) {
              chunksAll.set(chunk, position); // (4.2)
              position += chunk.length;
            }

            // Step 5: decode into a string
            let result = new TextDecoder("utf-8").decode(chunksAll);

            // We're done!
            let results = JSON.parse(result);


            let clonedObj = JSON.parse(JSON.stringify(that.state.analysisOrgData));
            let data = JSON.parse(results.data);
            let rows = row_index.split('_');
            let obj;

            //add empty header on sub level data
            let default_cols = 20;
            let updatedAnalysisColumns = [...that.state.analysisOrgColumns];
            if(updatedAnalysisColumns.length < default_cols){
              for(let i=(updatedAnalysisColumns.length+1); i<=default_cols; i++){
                updatedAnalysisColumns.push('blank_'+i);
              }
            }

            //add empty row col on sub level data
            if(data.length > 0){
              data.forEach((item) => {
                updatedAnalysisColumns.forEach((col)=>{
                  if(col.includes('blank_')){ item[col] = ''; }
                });
              });
            }

            for (let i = 0, len = rows.length; i < len; i++) {
              obj = (obj) ? obj['has_sub_level'][rows[i]] : clonedObj[rows[i]];
              if (i === (len - 1) && !obj['has_sub_level']) {
                obj['has_sub_level'] = data;
              }
            }

            contentLength = (that.state.sublevel_content_length_reduce > 0) ? parseInt(contentLength - that.state.sublevel_content_length_reduce) : contentLength; //reduce close row span content length

            //add empty columns and rows
            let updatedanalysisColsAndData = that.getModifiedDataWithBlankRowsColumns([...updatedAnalysisColumns], [...clonedObj]);

            that.setState({
              total_content_length: parseInt(that.state.total_content_length + contentLength),
              sublevel_content_length_reduce: 0,
              inprocess_sublevel: false,
              analysisColumnsDisplay: that.state.isPeriodComparisonEnabled && !that.state.showBenchmarkInGrid ? that.giveCorrectedColumnsDisplay(results.columns_display) : results.columns_display,
              // analysisData: updatedanalysisColsAndData.analysisData,
              analysisData: updatedanalysisColsAndData.analysisData,
              analysisOrgData: clonedObj,
              updateColumnsWidthInChild: false, // no need to update columns width on fetching sublevel data
            });
            return total;
          }

          const value = result.value;
          total += value.length;
          chunks.push(value); //get all the chunks

          return response.reader.read().then(processResult);
        })
      })
      .catch(err => {
        this.setState({ inprocess_sublevel: false });
      });
  }

  //Get Values under Columns and Rows
  generateSelectedRowsColsElements(arr) {
    var selected_values;
    var hasValues = arr.find((item, index) => {
      if (item.title === 'values') return true;
    });
    selected_values = this.getkeyValuesInArray(arr, 'title');

    if (hasValues) {
      var newValues = [];
      selected_values.forEach((item) => {
        if (item === 'values') {
          newValues.push({ 'values': this.generateValues(this.state.selected_values) });
        } else {
          newValues.push(item);
        }
      });
      return newValues;
    }
    return selected_values;
  }

  jsonCopy(srcObj) {
    return JSON.parse(JSON.stringify(srcObj));
  }

  //Format Date
  formatDate(date, date_format) {
    return moment(date).format(date_format);
  }

  //Get Date Range - pass end_date, days_count, date_format, and seperator
  getDateRange(end_date, days_count, date_format, seperator) {
    var start_date = moment(end_date).subtract((days_count - 1), 'days').format(date_format);
    return (start_date + seperator + end_date);
  }

  // Sorts the items inside all_items according to their types which can be either 'number','currency','percent','date','string'
  giveSortedAllItems(all_items) {
    const numberItems = all_items.filter(item => item.type === 'number');
    const currencyItems = all_items.filter(item => item.type === 'currency');
    const percentItems = all_items.filter(item => item.type === 'percent');
    const dateItems = all_items.filter(item => item.type === 'date');
    const stringItems = all_items.filter(item => item.type === 'string');
    const dateObjItems = all_items.filter(item => item.type === 'dateobj');
    return [...dateItems, ...numberItems, ...currencyItems, ...percentItems, ...stringItems, ...dateObjItems];
  }

  /************************************
   * Event based - Functions
   */

  //On change of view_Type, fetch dimension related to it
  handleViewTypeChange(view_type_name) {
    this.setState({
      view_type_last_executed: this.state.view_type,
      view_type: view_type_name,
    }, () => {
      this.setAllItemsAndItemsOfRowsColsValuesFilters(view_type_name);
      this.getDimensionsForViewType(view_type_name);
    });
  }


  handleAnalysisFormTabSelect(tabName) {
    this.setState({
      newAnalysisFormCurrentTab: tabName,
    });
  }


  //Only change the date range in state - don't call the api
  handleAnalysisPeriodChange(date_range_info) {
    const { ranges, benchmarkRangeIndex = 0 } = date_range_info;
    if (!ranges[0][0]) return;

    let updatedSecondRange = null;
    // Second range should be updated in case Period comparison is ON and some Preselect is Enabled
    if (this.state.isPeriodComparisonEnabled && ranges[0][0] && ranges[0][1]) {
      // Make sure first range is complety available
      // updatedSecondRange will be returned null if no change is needed
      updatedSecondRange = this.calculateSecondRangeOfPeriodComparison(ranges[0], this.state.periodComparisonPreselect.id);
    }

    this.setState({
      isSelectedDateRangeDynamic: date_range_info.isDynamicPeriod,
      selectedDateRanges: updatedSecondRange ? [ranges[0], updatedSecondRange] : ranges,
      benchmarkRangeIndex: benchmarkRangeIndex,
    }, () => {
      // Insert an entry in panelEventLogs only when both start & end date have been selected for a particular range. 
      // It is to be done bcz this method is called even when only one date( e.g start) is selected and end date is yet to be selected. So in this case we dont want 
      // the entry of any range like [DateObj,null] to get inserted in panelEvents
      // For second range, insert when both dates(start and end) are available or both dates are null
      const rs = this.state.selectedDateRanges;
      if ((rs.length === 1 && rs[0][0] && rs[0][1]) || 
          (rs.length === 2 && (rs[0][0] && rs[0][1]) && ((rs[1][0] === null && rs[1][1] === null) || (rs[1][0] !== null && rs[1][1] !== null)))
        ) {
        this.setPanelEventLogs(this.giveCurrentValuesOfLoggedVariables());
      }
    });
  }


  isBothAnalysisPeriodAvailable() {
    const dateRanges = this.state.selectedDateRanges;
    return dateRanges && dateRanges.length === 2 && dateRanges[0] && (dateRanges[0][0] && dateRanges[0][1]) && dateRanges[1] && (dateRanges[1][0] && dateRanges[1][1]);
  }

  //Used when Period Comparison is Enabled and ShowBenchmarkInGrid is false
  giveCorrectedColumnsDisplay(column_display) {
    for (let x in column_display) {
      // x may be 'level0', 'level1' etc. here
      // If column_display[x]=[1,5,9], then since benchmark column will not be shown, so it should change to[1,3,5]
      column_display[x] = column_display[x].map(i => (i + 1) / 2)
    }
    return column_display;
  }


  /**COLUMN PAGINATION RELATED METHODS - START**/
  handleColSpanChange() {
    let analysisPayLoad = { ...this.getAnalysisDataPayload() };
    this.setState({ selected_columns_count: 0 });

    //Horizontal scroll reset
    document.getElementById('analysis-wrapper').scrollLeft = 0;

    setTimeout(() => {
      this.getAnalysisData(analysisPayLoad, performance.now());
    }, 0);
  }

  handleNextColSpanChange() {
    let analysisPayLoad = { ...this.getAnalysisDataPayload() };
    let current_col_count = this.state.current_col_span;
    let next_col_count = (current_col_count + this.state.max_columns_allowed);
    if (next_col_count > this.state.selected_columns_count) {
      return false;
    }

    this.setState({
      current_col_span: next_col_count
    }, ()=>{
      //Horizontal scroll reset
      document.getElementById('analysis-wrapper').scrollLeft = 0;

      this.getAnalysisData(analysisPayLoad, performance.now());
    });
  }

  handlePreviousColSpanChange() {
    let analysisPayLoad = { ...this.getAnalysisDataPayload() };
    let current_col_count = this.state.current_col_span;
    let prev_col_count = (current_col_count - this.state.max_columns_allowed);

    if (current_col_count < this.state.max_columns_allowed) return;
    if (prev_col_count < 0) { prev_col_count = 1; }

    this.setState({
      current_col_span: prev_col_count
    }, ()=>{
      //Horizontal scroll reset
      document.getElementById('analysis-wrapper').scrollLeft = 0;

      this.getAnalysisData(analysisPayLoad, performance.now());
    });
  }

  handleCurrentColSpanChange(event) {
    let val = parseInt(event.target.value);
    if (isNaN(val)) {
      val = '';
    } else {
      let valnum = .5;
      let width = ((25 * (event.target.value.length) * valnum));
      if (width < 28) { width = 28; }
      if (width > 70) { width = 70; }
      event.target.style.width = width + 'px';
      val = (val > this.state.selected_columns_count) ? this.state.selected_columns_count : val;
    }

    this.setState({
      current_col_span: val
    });
  }

  //Get Table Columns Pangination
  givePaginationHtml() {
    // Don't show pagination if column count in the result are less than 'max_columns_allowed'
    if (this.state.selected_columns_count <= this.state.max_columns_allowed) { return null; }
    let total_col_span = null;

    if (isNaN(this.state.current_col_span) || this.state.current_col_span === '') {
      total_col_span = this.state.max_columns_allowed;
    } else {
      let total_col_span_count = (this.state.max_columns_allowed + parseInt(this.state.current_col_span));
      total_col_span = (total_col_span_count > this.state.selected_columns_count) ? this.state.selected_columns_count : total_col_span_count;
    }

    return (
      <div className="col-span-pagination">

        <div className="pagination-info">
          <span >Showing Columns </span>
          <input type="text" name="txt-current-span" className="current-span-input" value={this.state.current_col_span} onChange={this.handleCurrentColSpanChange} autoComplete="off" />
          <span className="text">&nbsp;-  {(this.state.selected_columns_count <= this.state.max_columns_allowed) ? this.state.selected_columns_count : total_col_span} of {this.state.selected_columns_count}</span>
        </div>
        <div className="pagination-buttons">
          <button className="btn-apply" title="Apply" onClick={this.handleColSpanChange}>apply</button>
          <button className="btn-prev" disabled={((this.state.current_col_span < this.state.max_columns_allowed) ? true : false)} title="Previous" onClick={this.handlePreviousColSpanChange}>previous</button>
          <button className="btn-next" disabled={(((this.state.current_col_span + this.state.max_columns_allowed) > this.state.selected_columns_count) ? true : false)} title="Next" onClick={this.handleNextColSpanChange}>next</button>
        </div>
      </div>
    )
  }
  /**COLUMN PAGINATION RELATED METHODS - END**/



  /**BELOW METHODS ARE USED TO CALCULATE SETTINGS CHANGE COUNT FOR DIFFERENT TYPES OF SETTINGS */
  giveViewTypeSettingsChangeCount() {
    return this.state.view_type !== this.state.view_type_last_executed ? 1 : 0;
  }

  giveDatesSettingsChangeCount(prevSettings, currSettings) {
    // handle case if selectedDateRanges is [] (may happen when this method is called even before lastUpdate response)
    if (currSettings.selectedDateRanges.length === 0 || prevSettings.selectedDateRanges.length === 0) { return 0; }

    let count = 0;
    // check  change in 1st range
    const sd1 = this.formatDate(currSettings.selectedDateRanges[0][0], 'MM/DD/YYYY');
    const ed1 = this.formatDate(currSettings.selectedDateRanges[0][1], 'MM/DD/YYYY');
    const sd2 = this.formatDate(prevSettings.selectedDateRanges[0][0], 'MM/DD/YYYY');
    const ed2 = this.formatDate(prevSettings.selectedDateRanges[0][1], 'MM/DD/YYYY');
    if (sd1 !== sd2 || ed1 !== ed2) { count++; }

    // check  change in 2nd range
    if (prevSettings.isPeriodComparisonEnabled && !currSettings.isPeriodComparisonEnabled) {
      count++;
    } else if (!prevSettings.isPeriodComparisonEnabled && currSettings.isPeriodComparisonEnabled) {
      // check if both dates for second range is also selected or not
      if (currSettings.selectedDateRanges[1][0] && currSettings.selectedDateRanges[1][0]) {
        count++;
      }
    } else if (prevSettings.isPeriodComparisonEnabled && currSettings.isPeriodComparisonEnabled && currSettings.selectedDateRanges[1]!==undefined) {
      const sd1 = this.formatDate(currSettings.selectedDateRanges[1][0], 'MM/DD/YYYY');
      const ed1 = this.formatDate(currSettings.selectedDateRanges[1][1], 'MM/DD/YYYY');
      const sd2 = this.formatDate(prevSettings.selectedDateRanges[1][0], 'MM/DD/YYYY');
      const ed2 = this.formatDate(prevSettings.selectedDateRanges[1][1], 'MM/DD/YYYY');
      if (sd1 !== sd2 || ed1 !== ed2) { count++; }
    } else {
      /**both are false, in case count should not be increased */
    }
    return count;
  }

  givePeriodComparisonGroupBySettingsChangeCount(prevSettings, currSettings) {
    let count = 0;
    if (prevSettings.periodComparisonGroupBy && currSettings.periodComparisonGroupBy && prevSettings.periodComparisonGroupBy.id !== currSettings.periodComparisonGroupBy.id) { count++; }
    return count;
  }

  giveShowBenchmarkDataSettingsChangeCount(prevSettings, currSettings) {
    let count = 0;
    if (prevSettings.showBenchmarkInGrid !== currSettings.showBenchmarkInGrid) { count++; }
    return count;
  }

  giveFiltersSettingsChangeCount(prevSettings, currSettings) {
    let count = 0;

    const iterateLimitOnFilters = Math.max(prevSettings.selected_filters.length, currSettings.selected_filters.length);
    for (let i = 0; i < iterateLimitOnFilters; i++) {
      if (!prevSettings.selected_filters[i] || !currSettings.selected_filters[i]) { count++; }
      else {
        if (prevSettings.selected_filters[i].title !== currSettings.selected_filters[i].title) { count++; }
        else {
          // filter is same at same position, now check if its selected values are changed or not
          const filterName = prevSettings.selected_filters[i].title; // since both title are same, anyone can be used here
          const filterValExist = prevSettings.selected_dimensions[filterName];
          const filterValCurr = currSettings.selected_dimensions[filterName];
          if ((filterValCurr && !filterValExist) || (!filterValCurr && filterValExist)) {
            // if any of 'filterValCurr' or 'filterValExist' is undefined when the other is defined, consider it as a change
            count++;
          } else {
            // both exist and their types will be same, so compare their values
            if (typeof filterValExist === 'string') {
              if (filterValExist !== filterValCurr) { count++; }
            } else if (Array.isArray(filterValExist)) {
              if (filterValExist.length !== filterValCurr.length) { count++; }
              else {
                if (typeof filterValExist[0] === 'string' || typeof filterValExist[0] === 'number') {
                  // check if contents of both arrays is same or not
                  // Since it is possible to have same elements in both arrays but orer of elements may differ
                  // Hence, we need to find if each element in first array exist in 2nd array or not
                  if (filterValExist.some(exist => !filterValCurr.includes(exist))) { count++; }
                }
                // Handle other types of `filterValExist[0]` here
              }
            }
            // Handle other types of `filterValExist` here
          }
        }
      }
    }
    return count;
  }

  giveRowsSettingsChangeCount(prevSettings, currSettings) {
    let count = 0;
    const iterateLimitOnRow = Math.max(prevSettings.selected_rows.length, currSettings.selected_rows.length);
    for (let i = 0; i < iterateLimitOnRow; i++) {
      if (!prevSettings.selected_rows[i] || !currSettings.selected_rows[i]) { count++; }
      else {
        if (prevSettings.selected_rows[i].title !== currSettings.selected_rows[i].title) { count++; }
      }
    }
    return count;
  }

  giveColsSettingsChangeCount(prevSettings, currSettings) {
    let count = 0;
    const iterateLimitOnCol = Math.max(prevSettings.selected_columns.length, currSettings.selected_columns.length);
    for (let i = 0; i < iterateLimitOnCol; i++) {
      if (!prevSettings.selected_columns[i] || !currSettings.selected_columns[i]) { count++; }
      else {
        if (prevSettings.selected_columns[i].title !== currSettings.selected_columns[i].title) { count++; }
      }
    }
    return count;
  }

  giveValuesSettingsChangeCount(prevSettings, currSettings) {
    let count = 0;
    const iterateLimitOnValues = Math.max(prevSettings.selected_values.length, currSettings.selected_values.length);
    for (let i = 0; i < iterateLimitOnValues; i++) {
      if (!prevSettings.selected_values[i] || !currSettings.selected_values[i]) { count++; }
      else {
        const prev = prevSettings.selected_values[i];
        const curr = currSettings.selected_values[i];
        if (prev.title !== curr.title
          || prev.default_action !== curr.default_action
          || (isCalculatedField(prev) && (prev.operation !== curr.operation || prev.type !== curr.type))
        ) { count++; }
      }
    }
    return count;
  }

  giveCondtionalFormattingSettingsChangeCount(prevSettings, currSettings) {
    let count = 0;
    const iterateLimitOnFormatting = Math.max(prevSettings.tempConditionalFormatting.length, currSettings.tempConditionalFormatting.length);
    for (let i = 0; i < iterateLimitOnFormatting; i++) {
      if (!prevSettings.tempConditionalFormatting[i] || !currSettings.tempConditionalFormatting[i]) { count++; }
      else {
        const current = currSettings.tempConditionalFormatting[i];
        const lastEx = prevSettings.tempConditionalFormatting[i];
        if (current.format_type && lastEx.format_type && (current.format_type.id !== lastEx.format_type.id)) { count++; break; }
        else if (current.cell_value.length !== lastEx.cell_value.length) { count++; break; }
        else if (current.cell_value.some((e, i) => e.id !== lastEx.cell_value[i].id)) { count++; break; }
        else if ((lastEx.condition === '' && current.condition !== '') || (current.condition !== '' && lastEx.condition !== '' && (current.condition.name !== lastEx.condition.name))) { count++; break; }
        else if (current.value1 !== lastEx.value1) { count++; break; }
        else if (current.value2 !== lastEx.value2) { count++; break; }
        else if (current.background !== lastEx.background) { count++; break; }
        else if (current.color !== lastEx.color) { count++; break; }
      }
    }
    return count;
  }
  /**END - SETTINGS CHANGE COUNT CALCULATION */

  giveSettingsChangeCount() {
    // return 0 untill panelEventLogs has some entry
    if (this.state.panelEventLogs.length === 0) { return 0; }

    const lastExecutedSettings = this.state.panelEventLastExecutedLog;
    const currentSettings = this.state.panelEventLogs[this.state.panelEventLogsIndex !== null ? this.state.panelEventLogsIndex : this.state.panelEventLogs.length - 1];
    let count = 0;

    // CHANGES RELATED TO VIEW_TYPE
    count += this.giveViewTypeSettingsChangeCount(lastExecutedSettings, currentSettings);

    // In some few initial rendering cycles, panelEventLogs may be  available but panelEventLastExecutedLog is null, handle that case.
    if (lastExecutedSettings === null) { return 0; }

    // CHANGES RELATED TO CALENDAR TAB
    count += this.giveDatesSettingsChangeCount(lastExecutedSettings, currentSettings);
    count += this.givePeriodComparisonGroupBySettingsChangeCount(lastExecutedSettings, currentSettings);
    // Check for change in 'showBenchmarkData' only when current period comparison is ON
    if (currentSettings.isPeriodComparisonEnabled) {
      count += this.giveShowBenchmarkDataSettingsChangeCount(lastExecutedSettings, currentSettings);
    }
    // CHANGES RELATED TO FILTER TAB
    count += this.giveFiltersSettingsChangeCount(lastExecutedSettings, currentSettings);
    count += this.giveRowsSettingsChangeCount(lastExecutedSettings, currentSettings);
    count += this.giveColsSettingsChangeCount(lastExecutedSettings, currentSettings);
    count += this.giveValuesSettingsChangeCount(lastExecutedSettings, currentSettings);

    // CHANGES RELATED TO CONDITIONAL FORMATTING TAB
    count += this.giveCondtionalFormattingSettingsChangeCount(lastExecutedSettings, currentSettings);
    return count;
  }

  // On settings RUN button
  handleAnalysisFiltersRun() {
    // handle special case -
    // Some error occured in initial /startAnalyis or /getAnalysisLData apis
    // in this case also, no previous settings to compare
    const { errorOccuredInStartOrGetAnalysis } = this.state;
    const lastExecutedSettings = this.state.panelEventLastExecutedLog;
    const currentSettings = this.state.panelEventLogs[this.state.panelEventLogsIndex !== null ? this.state.panelEventLogsIndex : this.state.panelEventLogs.length - 1];

    //if there is any change in view_type or period - call the analysis id api is required
    const isGetAnalysisIdCallRequired = () => {
      if (this.giveViewTypeSettingsChangeCount() > 0) { return true; }
      if (this.giveDatesSettingsChangeCount(lastExecutedSettings, currentSettings) > 0) { return true; }
      return false;
    };
    
    //if there is any change in filter, rows, columns, values, benchmark settings - call the analysis data api is required
    const isGetAnalysisDataCallRequired = () => {
      if (this.giveFiltersSettingsChangeCount(lastExecutedSettings, currentSettings) > 0) { return true; }
      if (this.giveRowsSettingsChangeCount(lastExecutedSettings, currentSettings) > 0) { return true; }
      if (this.giveColsSettingsChangeCount(lastExecutedSettings, currentSettings) > 0) { return true; }
      if (this.giveValuesSettingsChangeCount(lastExecutedSettings, currentSettings) > 0) { return true; }
      if (this.giveShowBenchmarkDataSettingsChangeCount(lastExecutedSettings, currentSettings) > 0) { return true; }
      return false;
    };

    const isFormattingRenderingRequired = () => {
      if (this.giveCondtionalFormattingSettingsChangeCount(lastExecutedSettings, currentSettings) > 0) { return true; }
      return false;
    }

    if (errorOccuredInStartOrGetAnalysis || isGetAnalysisIdCallRequired()) {
      this.getAnalysisID()
        .then(() => this.getAnalysisData(this.getAnalysisDataPayload(), performance.now()))
        .catch(err => {
          console.log('Error In GetAnalysis : ', err);
          this.appendTempPanelEventLogs();
        });

    } else if (isGetAnalysisDataCallRequired()) {
      this.getAnalysisData(this.getAnalysisDataPayload(), performance.now());

    } else if (isFormattingRenderingRequired()) {
      this.renderTempFormatting();
      this.saveSettingsToServer();
      // Note : renderTempFormatting will also called in above cases as well(called from within getAnalysisData)

    } else {
      // do nothing, ideally for this condition RUN button should have been disabled
    }
  }

  // On settings UNDO button
  handleAnalysisFiltersUndo() {
    // If already at the initial position in event logs, ignore the button click
    if (this.state.panelEventLogsIndex === 0 || this.state.panelEventLogs.length === 1) return;

    let logIndex;
    if (this.state.panelEventLogsIndex === null) {
      logIndex = this.state.panelEventLogs.length - 2;
    } else {
      logIndex = this.state.panelEventLogsIndex - 1;
    }

    const logVariables = this.state.panelEventLogs[logIndex];

    this.setState({
      ...logVariables,
      panelEventLogsIndex: logIndex
    });
  }

  // On settings REDO button
  handleAnalysisFiltersRedo() {
    // Ignore if a)No Undo opertion has been done already, b) Already at latest state, c) There is only one element in logs
    if (this.state.panelEventLogsIndex === null || this.state.panelEventLogsIndex === this.state.panelEventLogs.length - 1 || this.state.panelEventLogs.length === 1) return;

    const logIndex = this.state.panelEventLogsIndex + 1;
    const logVariables = this.state.panelEventLogs[logIndex];

    this.setState({
      ...logVariables,
      panelEventLogsIndex: logIndex
    });
  }

  // On settings RESET button
  handleAnalysisFiltersReset() {
    // On Reset btn, all variables which are being tracked in eventPanelLogs should be set to their initial values which is available in first element of eventPanelLogs
    // Also, eventPanelLogs itself should now have only one(first) element and discard all other
    let obj = {};
    obj = { ...this.state.panelEventLogs[0] };
    obj['panelEventLogs'] = this.state.panelEventLogs.slice(0, 1);
    obj['panelEventLogsIndex'] = null;

    this.setState(obj);
  }

  // On Drag Start of FliterPanle floating Div
  handleAnalysisFloatingPanelDragStart(e, id) {
    e.stopPropagation();

    // handle only the left mouse click(It has e.button = 0)
    if (e.button !== 0) { return }
    const filterPanelFloating = document.querySelector('#d-' + this.props.analysisSavedSettings.id + ' #analysis-filters-panel-floating');

    document.addEventListener('mousemove', handleMousemove);
    document.addEventListener('mouseup', handleMouseUp);

    // Take the reference of filterPanel as well as its position also need to be updated with filterPanelFloating
    const filterPanel = document.querySelector('#d-' + this.props.analysisSavedSettings.id + ' #analysis-filters-panel-new');

    let updatedPanelPosition = this.state.filterPanelPosition;
    let panelTop = filterPanelFloating.getBoundingClientRect().top;
    let panelLeft = filterPanelFloating.getBoundingClientRect().left;
    let panelRight = filterPanelFloating.getBoundingClientRect().right;
    let currentConsoleDragStartXY = { x: e.pageX, y: e.pageY };
    let consoleAttachedEleTop;

    if (filterPanel) {
      consoleAttachedEleTop = filterPanel.getBoundingClientRect().top;
    }

    //when console position is right
    let leftTransform = (currentConsoleDragStartXY.x - panelRight);
    let topTransform = (currentConsoleDragStartXY.y - panelTop);
    let attachedEleTopTransform;
    if (filterPanel) { attachedEleTopTransform = (currentConsoleDragStartXY.y - consoleAttachedEleTop); }

    if (leftTransform < 0) {
      leftTransform = window.innerWidth - currentConsoleDragStartXY.x;
    }

    //when console position is left
    if (updatedPanelPosition === 'left') {
      leftTransform = (currentConsoleDragStartXY.x - panelLeft);
    }

    // console.log('leftTransform-'+updatedPanelPosition, leftTransform+'--'+topTransform+'--'+e.pageX+'--'+consoleButtonRight+'--'+consoleButtonWidth/2);
    let that = this;
    function handleMousemove(e) {
      filterPanelFloating.style.top = (e.pageY - topTransform) + 'px';
      if (filterPanel) { filterPanel.style.top = (e.pageY - attachedEleTopTransform) + 'px'; }

      if (updatedPanelPosition === 'left') {
        filterPanelFloating.style.left = (e.pageX - leftTransform) + 'px';
        filterPanelFloating.style.right = 'auto';

        if (filterPanel) {
          filterPanel.style.left = (e.pageX - leftTransform) + 'px';
          filterPanel.style.right = 'auto';
        }
      } else {
        filterPanelFloating.style.right = (window.innerWidth - e.pageX - leftTransform) + 'px';
        filterPanelFloating.style.left = 'auto';

        if (filterPanel) {
          filterPanel.style.right = (window.innerWidth - e.pageX - leftTransform) + 'px'
          filterPanel.style.left = 'auto';
        }
      }

      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
    }

    function handleMouseUp(e) {
      e.stopPropagation();
      document.removeEventListener('mousemove', handleMousemove);
      document.removeEventListener('mouseup', handleMouseUp);

      // revert inline styles applied on panels and document
      filterPanelFloating.removeAttribute('style');
      document.body.style.userSelect = 'auto';
      document.body.style.cursor = 'default';

      if (filterPanel) {
        filterPanel.removeAttribute('style');
      }

      updatedPanelPosition = ((window.innerWidth - e.pageX) < window.innerWidth / 2) ? 'right' : 'left';
      that.handleFilterPanelPositionChange(updatedPanelPosition);
    }
  }



  /********************************
   * Table Functionalties
   */
  // On Table Sorting
  handleTableDataSorting(sortkey, order) {
    const data = JSON.parse(JSON.stringify(this.state.analysisOrgData));

    let total_row = null;
    total_row = data.slice(-1)[0];
    data.pop();

    data.sort(function (a, b) {
      let valueA, valueB;
      if (a[sortkey] && typeof a[sortkey] === 'object') {
        // applicable in case of period comparison
        valueA = a[sortkey].data;
        valueB = b[sortkey].data;
      } else {
        valueA = a[sortkey];
        valueB = b[sortkey];
      }

      if (order === 'desc') {
        if (typeof valueA === 'string') {
          return valueB.localeCompare(valueA);
        } else {
          if (valueB === null) return -1;
          if (valueA === null) return 1;
          return valueB - valueA;
        }
      } else {
        if (typeof valueA === 'string') {
          return valueA.localeCompare(valueB);
        } else {
          if (valueA === null) return -1;
          if (valueB === null) return 1;
          return valueA - valueB;
        }
      }
    });

    //add the total row
    data.push(total_row);

    //add empty cols and rows
    let updatedanalysisColsAndData = this.getModifiedDataWithBlankRowsColumns([...this.state.analysisOrgColumns], [...data]);
    
    this.setState({
      analysisData: updatedanalysisColsAndData.analysisData,
      analysisOrgData: data,
      updateColumnsWidthInChild: false, // no need to update columns width on fetching sublevel data
    });
  }

  //On click of exppand icon - fetch sub level data of analysis
  handleSubLevelDataFetch(level_details, row_index) {
    let levels = [];
    level_details.map((item, i) => (
      levels.push({ 'level': i, 'key': item })
    ));


    //Get Analysis Parameters
    let analysisPayLoad = {
      "analysisid": this.state.analysisid,
      "rows": this.generateSelectedRowsColsElements(this.state.selected_rows),
      "columns": this.generateSelectedRowsColsElements(this.state.selected_columns),
      "column_headers": this.state.analysisOrgColumns,
      "filters": this.state.selected_dimensions,
      "levels": levels,
      "show_benchmark_data": this.state.showBenchmarkInGrid ? 1 : 0
      // "levels": [{"level":parseInt(level) , "key":levelkeyval}]
    }

    // In values under column, we need to add the key 'show_data_as' in each field
    // First Reach upto the data related to clicked entry
    const rowIndexes = row_index.split('_').map(x => Number(x));
    let entry = this.state.analysisData;
    rowIndexes.forEach((ri, i) => {
      if (i === rowIndexes.length - 1) {
        entry = entry[ri];
      } else {
        entry = entry[ri].has_sub_level;
      }
    });
    const valuesColIndex = analysisPayLoad.columns.findIndex(x => typeof x === 'object');
    const valuesInPayload = analysisPayLoad.columns[valuesColIndex];
    const convertColNameListToColNameKey = (list) => {
      let key = "(";
      list.forEach((col, j) => {
        key += (j > 0) ? ', ' : '';
        key += "'" + col + "'";
      });
      key += ")";
      return key;
    }

    // In analysisPayLoad.columns.values, for each value which has default_action is one of ['percentage_of_column_total','percentage_of_row_total'], 'value.show_data_as.total_percentage' needs to be set, for all other values , it will be equal to default value(100)
    valuesInPayload.values.forEach(value => {
      if (value.default_action === 'percentage_of_column_total' || value.default_action === 'percentage_of_row_total') {
        // Now again, structire of value.show_data_as.total_percentage depends on the column lengeth
        if (analysisPayLoad.columns.length === 1) {

          // payload has only one column i.e 'values' column
          value.show_data_as.total_percentage = {};
          // special check for calculated field, for this column name should always starts with 'sum'
          const keyPayload = (isCalculatedField(value) ? 'sum' : value.default_action) + ' ' + value.id;
          const keyEntry = keyPayload;
          // In this case, 'value.show_data_as.total_percentage[keyPayload]' will be of type number which is basically the value of the cell in datagrid
          value.show_data_as.total_percentage[keyPayload] = entry[keyEntry];
        } else {
          // payload has other columns as well besides 'values' column
          // In this case, 'value.show_data_as.total_percentage[keyPayload]' will be of an object which will have keys as the array of other columns selected (e.g ["affiliate_display","affiliate"]) and value is the value of cell present in datagrid
          const keyPayload = (isCalculatedField(value) ? 'sum' : value.default_action) + ' ' + value.id;
          value.show_data_as.total_percentage = { [keyPayload]: {} };
          // filter out the columns realted to keyPayload, e.g filter out columns having 'sum revenue'
          const colsRelatedTokeyPayload = this.state.analysisColumns.filter(col => col.includes(keyPayload));
          colsRelatedTokeyPayload.forEach(colName => {
            const valueInsideTotalPerc = entry[convertColNameListToColNameKey(colName)]
            const keyInsideTotalPerc = [...colName.slice(0, valuesColIndex), ...colName.slice(valuesColIndex + 1)];
            value.show_data_as.total_percentage[keyPayload][JSON.stringify(keyInsideTotalPerc)] = valueInsideTotalPerc;
          });
        }
      }
    });
    this.setState({ collapseAllRows: false });
    this.getAnalysisSubLevelData(analysisPayLoad, row_index, level_details);
  }

  //On click of exppand icon - fetch sub level data of analysis
  handleSubLevelDataRemove(arr) {
    let clonedOrgObj = JSON.parse(JSON.stringify(this.state.analysisOrgData));
    var bytes = require('utf8-length');

    let dataSize = 0;
    if (arr.length > 0) {
      clonedOrgObj.forEach((item, i) => {
        if (!arr.includes(i.toString()) && item.has_sub_level) {
          dataSize = bytes(JSON.stringify(item.has_sub_level));
          delete item.has_sub_level;
        }
      })
      
      let updatedanalysisColsAndData = this.getModifiedDataWithBlankRowsColumns([...this.state.analysisOrgColumns], [...clonedOrgObj]);

      this.setState({
        analysisData: updatedanalysisColsAndData.analysisData,
        analysisOrgData: clonedOrgObj,
        updateColumnsWidthInChild: false,
        sublevel_content_length_reduce: parseInt(dataSize)
      });
    }
  }

  //Generate Rows/Columns Values
  getkeyValuesInArray(arr, keyname) {
    var newArr = [];
    for (var i = 0, len = arr.length; i < len; i++) {
      newArr[i] = arr[i][keyname];
    }
    return newArr;
  }

  //Genrate Values
  generateValues(arr) {
    return arr.map((item, index) => {
      // In api, default_action shud be 'calculated' for Any calculated field, so handle that
      const actionsToBeSentInShowDataAs = ['percentage_of_row_total', 'percentage_of_column_total'];
      const defaultAction = item.default_action === 'no_calculation' ? 'calculated' : actionsToBeSentInShowDataAs.includes(item.default_action) ? 'sum' : item.default_action;
      const value = {
        id: item.title,
        operation: item.operation,
        type: item.type,
        default_action: defaultAction, // api will use it for computation when defaultAction is something other than actionsToBeSentInShowDataAs
        precision: item.default_precision,
        show_data_as: {  // defaultAction is one of actionsToBeSentInShowDataAs, api will use show_data_as for computation 
          key: actionsToBeSentInShowDataAs.includes(item.default_action) ? item.default_action : 'no_calculation',
          total_percentage: { [defaultAction + ' ' + item.title]: this.state.selected_columns.length > 1 ? {} : 100 }
        },
      }

      // Now It might happen that a value item is one of the calculated fields and its operation includes another calculated field
      // So, in this case, we need to send another key 'needed_operations'@type Object, which includes all the used calculated field and their repective operations
      if (isCalculatedField(value)) {

        const needed_operations = this.giveNeededOperationsForGivenCalculatedFieldOperation(value.operation);
        // append needed_operations in 'value'
        if (needed_operations !== null) {
          value.needed_operations = needed_operations;
        }
      }

      return value;
    });
  }

  /**If an operation of a fields containes other calculated fields, this method will
   * return an @Object having those field names and corresponding operations. If no dependants found, returns null */
  giveNeededOperationsForGivenCalculatedFieldOperation(givenOp) {
    let needed_operations = {};
    const fieldsToSearch = this.state.all_items.filter(x => isCalculatedField(x));

    // recursive function
    const addNeededOperations = (sourceOp) => {
      fieldsToSearch.forEach(f => {
        // check if this calculated field's title is included in formula/operation of 'value' or not
        // to avoid partial title matches, prepend with '`' and append with '$'
        if (sourceOp.includes('`' + f.title + '$')) {
          needed_operations[f.title] = f.operation;
          addNeededOperations(f.operation);
        }
      })
    };
    addNeededOperations(givenOp);

    return !isEmptyObject(needed_operations) ? needed_operations : null;
  }

  openValuesOperationsList(item) {
    this.setState({
      'selected_value_field': item
    });
  }

  //Find and change operation value in values
  selectOperation(operationId) {
    const index = this.state.selected_values.findIndex(o => o.id === this.state.selected_value_field.id);
    const obj = this.state.selected_values[index];
    let updatedSelectedValues = [
      ...this.state.selected_values.slice(0, index),
      { ...obj, default_action: operationId },
      ...this.state.selected_values.slice(index + 1)
    ];

    // Update conditional formatting cell values dropdown options
    let defaultCellValues = [];
    updatedSelectedValues.forEach((item) => {
      let option_id = isCalculatedField(item) ? '' : item.default_action + ' '; //remove calculated word when it is under dropdown value to fix the conditional formattng issue
      defaultCellValues.push({ 'id': option_id + item.title, 'name': option_id + item.title });
    });
    
    this.setState({
      selected_values: updatedSelectedValues,
      selected_value_field: { ...obj, default_action: operationId },
      conditionalCellValues: defaultCellValues
    }, () => {
      //Update conditional formatting cell values dropdown options
      // let defaultCellValues = [];
      // this.state.selected_values.forEach((item) => {
      //   defaultCellValues.push({ 'id': item.default_action + ' ' + item.title, 'name': item.default_action + ' ' + item.title });
      // });

      // this.setState({
      //   'conditionalCellValues': defaultCellValues
      // }, () => this.setPanelEventLogs(this.giveCurrentValuesOfLoggedVariables()));
      console.log('conditionalCellValues', this.state.conditionalCellValues);

      this.setPanelEventLogs(this.giveCurrentValuesOfLoggedVariables());
    });
  }

  //On Filter Change
  handleFilterChange(filterKey, val, checked) {
    let updatedSelectedDimensions = { ...this.state.selected_dimensions };
    let filterValues = updatedSelectedDimensions[filterKey] ? [...updatedSelectedDimensions[filterKey]] : [];

    if (checked) {
      filterValues = [...filterValues, val];
      updatedSelectedDimensions[filterKey] = filterValues;
    } else {
      filterValues = filterValues.filter(v => v !== val);
      updatedSelectedDimensions[filterKey] = filterValues;
      // In case there filterValues is empty after removing the last value, remove the filterKey as well
      if (filterValues.length === 0) {
        delete updatedSelectedDimensions[filterKey];
      }
    }

    this.setState({
      selected_dimensions: updatedSelectedDimensions
    }, () => this.setPanelEventLogs(this.giveCurrentValuesOfLoggedVariables()))
  }

  //Find and change show_data_as value in values
  selectShowDataAs(showDataAsId) {
    const index = this.state.selected_values.findIndex(o => o.id === this.state.selected_value_field.id);
    const obj = this.state.selected_values[index];

    this.setState({
      selected_values: [
        ...this.state.selected_values.slice(0, index),
        { ...obj, default_show_as: showDataAsId },
        ...this.state.selected_values.slice(index + 1)
      ],
      selected_value_field: { ...obj, default_show_as: showDataAsId }
    }, () => {
      this.setPanelEventLogs(this.giveCurrentValuesOfLoggedVariables());
    });
  }

  //Find and change precision value in values
  selectPrecision(precision) {
    const index = this.state.selected_values.findIndex(o => o.id === this.state.selected_value_field.id);
    const obj = this.state.selected_values[index];
    // ignore click if precision is not btwn 0 and 9
    if (precision < 0 || precision > 9) { return; }
    this.setState({
      selected_values: [
        ...this.state.selected_values.slice(0, index),
        { ...obj, default_precision: precision },
        ...this.state.selected_values.slice(index + 1)
      ],
      selected_value_field: { ...obj, default_precision: precision }
    }, () => {
      this.setPanelEventLogs(this.giveCurrentValuesOfLoggedVariables());
    });
  }


  handleCalculatedFieldSummarizeClick(summItemId) {
    this.setState({
      calculated_expression_summarizeby: summItemId
    });
  }

  /**Calculated Fields Related Methods */
  handleNewCalculatedFieldBtn() {
    this.setState({
      showCalculatedFieldForm: true,
      // init calculated field related state variables
      calculated_expression_name: '',
      calculated_expression_formula: '',
      calculated_expression_type: CALCULATED_FIELD_TYPES[0],
      calculated_expression_access: CALCULATED_FIELD_ACCESS[1],
      calculated_expression_aggregation_list_opened_field_title: '',
      calculated_expression_fieldForEdit: null // clear any field selected for edit
    });
  }

  handleCalculatedFieldEdit(field) {
    // e.stopPropagation();
    this.setState({
      // panel_first_tab_current_subtab: 'Calculated Field',
      showCalculatedFieldForm: true,
      calculated_expression_fieldForEdit: field,
      // init calculated field related state variables
      calculated_expression_name: field.display_title,
      calculated_expression_formula: this.changeCalculatedFieldFormulaFormat(field.operation, 'client'),
      calculated_expression_type: CALCULATED_FIELD_TYPES.find(cf => cf.id === field.type) || CALCULATED_FIELD_TYPES[0],
      calculated_expression_access: field.is_user_specific ? CALCULATED_FIELD_ACCESS[0] : CALCULATED_FIELD_ACCESS[1],
    });
  }

  handleCalculatedExpressionCancelEdit() {
    this.setState({
      calculated_expression_fieldForEdit: null,
      // reset calculated field related state variables
      calculated_expression_name: '',
      calculated_expression_formula: '',
      calculated_expression_type: CALCULATED_FIELD_TYPES[0],
      calculated_expression_access: CALCULATED_FIELD_ACCESS[0],
    });
  }

  // Edit the value of  Calculated Field formula textarea when Some operator is clicked
  handleCalculatedFiedOperatorClick(operator) {
    let valueToInsert = '';
    if (operator.id === 'round') {
      valueToInsert = 'round( )';
    } else {
      valueToInsert = operator.id;
    }
    this.insertTextIntoFormulaBox(valueToInsert);
  }


  insertTextIntoFormulaBox(text) {
    const formulaBox = this.calculatedFieldFormulaRef.current;
    const selectionStartPos = formulaBox.selectionStart;
    const selectionEndPos = formulaBox.selectionEnd;

    const newValue = formulaBox.value.slice(0, selectionStartPos) + text + ' ' + formulaBox.value.slice(selectionEndPos);
    this.setState({
      calculated_expression_formula: newValue
    }, () => {
      // set the new cursor position
      formulaBox.setSelectionRange(selectionStartPos + text.length + 1, selectionStartPos + text.length + 1);
      formulaBox.focus();
    })

  }

  handleCalculatedFieldMouseDown(e, field) {
    e.stopPropagation();
    e.persist(); // Tell React to not nullify this event as it is being used inside mousemove and mouseup handlers

    const calculatedFieldFixedPanelTop = document.querySelector('#new-calculated-field-form').getBoundingClientRect().top;
    const dragElement = document.querySelector('#calculated-field-form-dragging-element');
    const editorElement = this.calculatedFieldFormulaRef.current;
    const dragElementMaxWidth = 300, dragElementHeight = 30;

    // insert the field info inside dragElement
    // for calculated fields, keep the aggregation='calculated', not 'no_calculation'(bcz this is what needed to send in api)
    const aggregation = this.state.calculated_expression_aggregations_by_field[field.title] === 'no_calculation' ? 'calculated' : this.state.calculated_expression_aggregations_by_field[field.title];
    dragElement.innerText = `${field.display_title} (${covertUnderscoreToSpaceInString(aggregation)})`;

    const editorElementCord = editorElement.getBoundingClientRect();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    const that = this;
    function handleMouseMove(e2) {
      dragElement.style.display = 'block';

      // calculate the position from where drag was started on field so that distance bw mouse postion and field edges is maintained for a better UX
      const fieldCord = e.target.getBoundingClientRect();
      const distBwFieldLeftEdgeAndMouseX = Math.min(e.pageX - fieldCord.left, dragElement.getBoundingClientRect().width - 10);
      const distBwFieldTopEdgeAndMouseY = dragElementHeight / 2; // keep cursor vertically centred while moving

      const mouseYRelativeToFixedPanel = e2.pageY - calculatedFieldFixedPanelTop;
      dragElement.style.top = (mouseYRelativeToFixedPanel - distBwFieldTopEdgeAndMouseY) + 'px';
      dragElement.style.left = (e2.pageX - distBwFieldLeftEdgeAndMouseX) + 'px';
      dragElement.style.maxWidth = dragElementMaxWidth + 'px';
      dragElement.style.height = dragElementHeight + 'px';
      dragElement.style.lineHeight = dragElementHeight + 'px';

      if (isElementInsideDroppableArea()) {
        editorElement.classList.add('dragging-over');
      } else {
        editorElement.classList.remove('dragging-over');
      }
    }

    function handleMouseUp() {
      if (isElementInsideDroppableArea()) {
        that.insertTextIntoFormulaBox(`[\`${aggregation}\`${field.title}]`);
      }
      dragElement.style.display = 'none';
      editorElement.classList.remove('dragging-over');

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    function isElementInsideDroppableArea() {
      const dragElementCord = dragElement.getBoundingClientRect();

      if (dragElementCord.left > editorElementCord.left && dragElementCord.right < editorElementCord.right && dragElementCord.top > editorElementCord.top && dragElementCord.bottom < editorElementCord.bottom) {
        return true;
      }
      return false;
    }

  }

  handleCalculatedFieldEditorDrop({ draggableId }) {
    const aggregation = this.state.calculated_expression_aggregations_by_field[draggableId] === 'no_calculation' ? 'calculated' : this.state.calculated_expression_aggregations_by_field[draggableId];
    this.insertTextIntoFormulaBox(`[\`${aggregation}\`${draggableId}]`);
  }

  //Creat and Save Custom Calculated Field
  handleCalculatedExpressionSaveAndEdit() {
    // do some validation before API 
    const calculated_expression_name = this.state.calculated_expression_name.trim();
    const calculated_expression_formula = this.state.calculated_expression_formula;
    if (calculated_expression_name === '' || calculated_expression_formula === '') {
      AlertService.showToast('error', 'Field name and Field expression must be provided');
      return;
    }

    const isEditing = this.state.calculated_expression_fieldForEdit !== null;

    //For new field, check if name is unique and not present in all dimensions list
    let nameAlreadyExistIndex = this.state.all_items.findIndex((e) => (e.title == calculated_expression_name.split(' ').join('_').toLowerCase() || e.display_title.toLowerCase() == calculated_expression_name.toLowerCase()));
    if (!isEditing && nameAlreadyExistIndex > -1) {
      AlertService.showToast('error', 'Field name already exists');
      return;
    }

    const payload = {
      display_title: this.state.calculated_expression_name,
      title: this.state.calculated_expression_name.split(' ').join('_').toLowerCase(),
      type: this.state.calculated_expression_type.id,
      data_source_id: this.state.data_sources.find(ds => ds.name === this.state.view_type).id,
    };
    // add other values in payload based on some conditions
    if (this.state.calculated_expression_access === CALCULATED_FIELD_ACCESS[0]) {
      payload.is_user_specific = 1;
      payload.user_id = this.user.id;
    } else {
      payload.is_organization_specific = 1;
      payload.organization_id = this.user.organization_id;
    }

    payload.operation = this.changeCalculatedFieldFormulaFormat(this.state.calculated_expression_formula, 'server');
    if (isEditing) {
      // do Validation for Cyclic dependency of Fields
      // e.g If F1 = F2 +3
      // and user edits F2 resulting in F2 = F1 +10
      // THIS IS NOT ALLOWED

      const fieldsToSearch = this.state.all_items.filter(x => isCalculatedField(x));
      let cyclicityFound = false;
      // recursive function
      const checkRecursively = (sourceOp) => {
        for (let i = 0; i < fieldsToSearch.length; i++) {
          const f = fieldsToSearch[i];
          if (sourceOp.includes('`' + f.title + '$')) {
            // Now check if the Field included in sourceOp is the same which is under Edit
            // If yes, cyclic dependency exist and hence break, Else keeping checking
            if (f.title === this.state.calculated_expression_fieldForEdit.title) {
              cyclicityFound = true;
              break;
            } else {
              checkRecursively(f.operation);
            }
          }
        }
      };
      checkRecursively(payload.operation);

      if (cyclicityFound) {
        AlertService.showToast('error', `Cyclic Dependency of Field ${this.state.calculated_expression_fieldForEdit.title} is not allowed`);
        return;
      }
      payload.id = this.state.calculated_expression_fieldForEdit.original_id;
    }

    this.setState({ calculated_expression_saving: true });
    APIService.apiRequest(Constants.API_BASE_URL + '/saveCalculatedMetric', payload, false, isEditing ? 'PUT' : 'POST', this.controller)
      .then(response => {
        if (response.status === 1) {
          const updatedStateObj = {
            calculated_expression_saving: false,
            // reset state variables
            // calculated_expression_name: '',
            // calculated_expression_formula: '',
            // calculated_expression_type: CALCULATED_FIELD_TYPES[0],
            // calculated_expression_access: CALCULATED_FIELD_ACCESS[0],
            // calculated_expression_fieldForEdit: null
          };
          if (isEditing) {
            // Find and Edit corresponding field in all_items list 
            const indexAllItem = this.state.all_items.findIndex(a => a.original_id === this.state.calculated_expression_fieldForEdit.original_id);
            const updatedFieldForAlItem = {
              ...this.state.calculated_expression_fieldForEdit,
              display_title: payload.display_title,
              title: payload.title,
              type: payload.type,
              operation: payload.operation,
            };
            updatedStateObj.all_items = this.giveSortedAllItems([...this.state.all_items.slice(0, indexAllItem), updatedFieldForAlItem, ...this.state.all_items.slice(indexAllItem + 1)]);
            // also insert the entry in 'calculated_expression_aggregations_by_field' for this new field
            updatedStateObj.calculated_expression_aggregations_by_field = { ...this.state.calculated_expression_aggregations_by_field, [payload.title]: 'no_calculation' };

            // Check if it this field also included in 'Values' block, if yes, find and edit there as well
            const indexSelectedValues = this.state.selected_values.findIndex(a => a.original_id === this.state.calculated_expression_fieldForEdit.original_id);
            if (indexSelectedValues > -1) {
              const updatedFieldForSelecedValues = {
                ...this.state.selected_values[indexSelectedValues],
                display_title: payload.display_title,
                title: payload.title,
                type: payload.type,
                operation: payload.operation,
              };
              updatedStateObj.selected_values = [...this.state.selected_values.slice(0, indexSelectedValues), updatedFieldForSelecedValues, ...this.state.selected_values.slice(indexSelectedValues + 1)];
            }
          } else {
            // add New field to all_items list
            updatedStateObj.all_items = this.giveSortedAllItems([...this.state.all_items, this.getAllListItem(response.data[0])]);
            // also insert the entry in 'calculated_expression_aggregations_by_field' for this new field
            updatedStateObj.calculated_expression_aggregations_by_field = { ...this.state.calculated_expression_aggregations_by_field, [payload.title]: 'no_calculation' };
          }
          this.setState(updatedStateObj, () => {
            // Just after creation, display this field in edit mode
            if (!isEditing) {
              this.handleCalculatedFieldEdit(this.getAllListItem(response.data[0]));
            }
          });
          AlertService.showToast('success', `Field ${isEditing ? 'Edited' : 'Created'} Successfully`);
        } else {
          this.setState({
            calculated_expression_saving: false,
          });
        }

      })
      .catch(err => {
        console.log(err);
        this.setState({
          calculated_expression_saving: false,
        });
      });
  }

  //Delete Custom Created Calculated Field
  handleCalculatedExpressionDelete() {
    this.setState({
      calculated_expression_deleting: true
    })
    const id = this.state.calculated_expression_fieldForEdit.original_id;
    APIService.apiRequest(Constants.API_BASE_URL + '/calculatedMetric/' + id, {}, false, 'DELETE', this.controller)
      .then(response => {
        if (response.status === 1) {
          const updatedStateObj = {
            calculated_expression_deleting: false,
            showCalculatedFieldForm: false
          };
          // Find and Remove this field from all_items list
          const index = this.state.all_items.findIndex(a => a.original_id === this.state.calculated_expression_fieldForEdit.original_id);
          updatedStateObj.all_items = [...this.state.all_items.slice(0, index), ...this.state.all_items.slice(index + 1)];

          // Check if it this field was also included in 'Values' block, if yes, find and remove from there as well
          const indexSelectedValues = this.state.selected_values.findIndex(a => a.original_id === this.state.calculated_expression_fieldForEdit.original_id);
          if (indexSelectedValues > -1) {
            updatedStateObj.selected_values = [...this.state.selected_values.slice(0, indexSelectedValues), ...this.state.selected_values.slice(indexSelectedValues + 1)];
          }
          this.setState(updatedStateObj);
          AlertService.showToast('success', `Field Deleted Successfully`);
        } else {
          this.setState({
            calculated_expression_deleting: false
          })
        }

      })
      .catch(err => {
        this.setState({
          calculated_expression_saving: false,
        });
        AlertService.showToast('error', err.message);
      });
  }

  /**Replaces some characters in formula with some other characters as needed by backend */
  changeCalculatedFieldFormulaFormat(formula, forServerOrClient) {
    let f = formula;
    if (forServerOrClient === 'server') {
      // do following replacements in forumla string
      // 1. replace '^' by '**'
      // 2. replace '[' by  '^'
      // 3. replace ']' by  '$' 
      f = f.replaceAll('^', '**');
      f = f.replaceAll('[', '^');
      f = f.replaceAll(']', '$');
      f = f.trim();
    } else {
      // do reverse replacements of the above ones
      f = f.replaceAll('^', '[');
      f = f.replaceAll('**', '^');
      f = f.replaceAll('$', ']');
      f = f.trim();
    }
    return f;
  }


  /*********************************
   * Filters Panel Functions
   */

  handleFilterPanelMainTabChange(tab) {
    // Changing the left position of hover header column on opening of panel
    if (document.getElementsByClassName(`hover-column-container-${this.props.analysisSavedSettings.id}`).length !== 0) {
      if (!document.getElementsByClassName(`hover-column-container-${this.props.analysisSavedSettings.id}`)[0].parentNode.classList.contains('panel-open')) {
        let left = parseInt(document.getElementsByClassName(`hover-column-container-${this.props.analysisSavedSettings.id}`)[0].style.left.split('p')[0]) + 365;
        document.getElementsByClassName(`hover-column-container-${this.props.analysisSavedSettings.id}`)[0].style.left = left.toString()+'px';
      }
    }
    this.setState({
      filter_panel_main_tab: tab,
      toggleFilterPanel: true
    }, () => {

      // Fetch Shared Users list when share tab is opened and list not fetched already
      if (tab === 'Share') {
        if (this.state.sharedUsers === null && !this.state.loadingSharedUsers) {
          this.getSharedUsersList();
        }
      }

      // Fetch Insights list when insight tab is opened and list not fetched already
      if (tab === 'Insights') {
        if (this.state.insightNotes === null && !this.state.loadingNotes) {
          this.getInsightNotes();
        }
      }
    });


  }

  handleConstructorPanelTabChange(tab) {
    this.setState({
      filter_panel_current_tab: tab,
    });
  }

  //show/hide analysis filter panel
  toggleFiltersPanel(e) {
    this.setState({
      toggleFilterPanel: !this.state.toggleFilterPanel,
    });
  }

  handleFilterPanelPositionChange(position) {
    this.setState({
      filterPanelPosition: position,
    }, ()=>{
      //update in user preference
      this.updateUserPreferences('datagrid_panel', this.state.filterPanelPosition);
    });
  }

  //update local storage and in db
  updateUserPreferences(key, value) {
    let sightSettings = localStorage.getItem(Constants.SITE_PREFIX + 'settings') ? JSON.parse(localStorage.getItem(Constants.SITE_PREFIX + 'settings')) : {};
    if (sightSettings && sightSettings['user_preference'] !== undefined) {
      sightSettings['user_preference'][key] = value;

      const requestType = 'PUT';
      const payload = { user_preference_json: sightSettings['user_preference'] };
      APIService.apiRequest(Constants.API_BASE_URL + '/user_preference', payload, false, requestType, null)
        .then(response => {
          localStorage.setItem(Constants.SITE_PREFIX + 'settings', JSON.stringify(sightSettings));
        })
        .catch(err => {
        });
    }
  }



  //Returns the dimensions list(items of type string) available in this.state.all_items as comma separated string
  getDimensionsStr() {
    return this.state.all_items.filter(item => item.is_dimension === 1 && item.type === 'string').map(item => item.title).join();
  }


  //Get Dimension using API
  getDimensionsForViewType(viewType) {
    // let dimension_filters = this.state.selected_dimensions;
    let dimension_filters = {};
    if (this.user.parent_organization_id > 1 && !isEmptyObject(this.state.selected_dimension)) {
      let filters = [];
      if (Array.isArray(this.user.attributes)) {
        this.user.attributes.forEach((item) => {
          if (item.site_name !== undefined) {
            filters.push(item.site_name);
          }
        });
      }
      dimension_filters = { "property": filters };
    }

    let view_type = viewType === 'performance' ? 'advertiser' : viewType;
    let api_url = Constants.API_BASE_URL + '/' + this.state.terminal_type + '/dimensions/?dimension=' + this.getDimensionsStr();
    let req_method = 'GET';
    let dimensionPayLoad = null;
    if (Object.keys(dimension_filters).length > 0) {
      api_url += '&dimension_filters=' + dimension_filters;
    }
    if (this.state.terminal_type !== 'klay_media') {
      api_url += '&client_id=' + this.state.client.id + '&view_type=' + view_type;
    }


    APIService.apiRequest(api_url, dimensionPayLoad, false, req_method, this.controller)
      .then(response => {
        if (response.status === 1 && response.data !== undefined) {
          let allDimensions = response.data;

          //check find the selected_dimension value under dimensions list then only set filter - if the account/clitn will different selected_dimsions won't get found under all list
          var default_selected_filters = [];
          var default_selected_dimensions = {};

          const savedConfig = this.state.savedAnalysisDetails.config;
          // console.log('savedConfig dimensions', savedConfig);

          if (savedConfig && savedConfig.filters !== undefined) {
            let isSelectedDimensionAvailable = false;
            // check if dimension value is available in global dimensions value list
            Object.keys(savedConfig.filters).forEach((key) => {
              isSelectedDimensionAvailable = allDimensions[key].some((el) => {
                let matching_name = (typeof el === 'object') ? el.name : el;
                return savedConfig.filters[key].includes(matching_name)
              })
            });

            //if selected filters key values available in all dimensions key value then only set selected_filters and selected_dimensions
            if (isSelectedDimensionAvailable) {
              default_selected_dimensions = savedConfig.filters;
              default_selected_filters = this.getSelectedFiltersList(savedConfig.filters, this.state.all_items);

              // this.state.all_items.forEach((el) => {
              //   Object.keys(savedConfig.filters).filter((item) => {
              //     if (el.title === item) {
              //       default_selected_filters.push(el);
              //     }
              //   });
              // });
            }
          }

          this.setState({
            dimensions: allDimensions,
            selected_dimensions: default_selected_dimensions,
            selected_filters: default_selected_filters
          });
        }
      })
      .catch(err => { });
  }


  getSelectedFiltersList(savedFilters, allItems){
    let selectedFiltersList = [];
    if(Object.keys(savedFilters).length > 0){
      allItems.forEach((el) => {
        Object.keys(savedFilters).filter((item) => {
          if (el.title === item) {
            selectedFiltersList.push(el);
          }
        });
      });
    }
    return selectedFiltersList;
  }



  //Replace Date with month or vice versa 
  handleReplaceDateField(event) {
    event.stopPropagation();

    let existing_element_title = this.state.replaceDateDimensionName;
    let replace_element_obj = (existing_element_title === 'date') ? this.state.all_items[1] : this.state.all_items[0];
    replace_element_obj['id'] = replace_element_obj['id'] + '_' + 1;

    let newSelectedColumns = [...this.state.selected_columns];
    let existingItemIndex = newSelectedColumns.findIndex(obj => obj.title === existing_element_title);
    if (existingItemIndex > -1) {
      newSelectedColumns.splice(existingItemIndex, 1);
    }
    newSelectedColumns.push(replace_element_obj);

    this.setState({
      selected_columns: newSelectedColumns,
      showReplaceDateDimensionMsg: false,
      replaceDateDimensionName: ''
    });

    // check which field is available in column block
    // remove it from there and add another date type field
  }



  //Get two dates difference
  getFilterDateObjDaysCount(item) {
    let startDate = '';
    let endDate = '';
    if (this.state.selected_filters_date_obj[item] !== undefined) {
      startDate = moment(this.state.selected_filters_date_obj[item][0], "MM/DD/YYYY");
      endDate = moment(this.state.selected_filters_date_obj[item][1], "MM/DD/YYYY");
      return endDate.diff(startDate, 'days');
    }
    return endDate;
  }

  //View Mode change
  handleFilterViewModeChange(){
    this.setState({ 
      dataTabView: this.state.dataTabView === '1' ? '2' : '1', 
      panel_first_tab_current_subtab: 'dataset' 
    }, ()=>{
      this.updateUserPreferences('datagrid_datatab_viewmode', this.state.dataTabView);
    });
  }


  giveAnalysisFilterPanelHTML() {
    // Disable Run,Undo,Redo,Reset buttons when a request is in progress
    const areActionButtonsDisabled = this.state.inprocess_last_updated || this.state.inprocess_start_analysis || this.state.inprocess_get_analysis;
    const runBtnCount = this.giveSettingsChangeCount();
    const panelMainSelectedTab = this.state.filter_panel_main_tab;
    const showUnsavedChangesMsg = panelMainSelectedTab === 'Constructor' && this.giveSettingsChangeCount() > 0;

    return (
      <ClickOutsideListner onOutsideClick={() => { }}>
        <div id="analysis-filters-panel-new" ref={node => { this.analysisFilterPanelNode = node; }}>
          <div className="panel-wrapper" id={`panel-${panelMainSelectedTab.toLowerCase()}`} >

            <div className="panel-header">
              <div className="title-wrapper">
                <h4 className="panel-title">{panelMainSelectedTab === 'Constructor' && !this.isAnalysisInEditMode() ? 'Controls' : panelMainSelectedTab}</h4>
                <div className='close-panel'>
                  {this.isAnalysisInEditMode() && this.state.filter_panel_current_tab === 'Transform' &&
                    <div className={'view-mode-button' + (this.state.dataTabView === '2' ? ' selected' : '')}
                      role="button" title="Change View Mode" onClick={() => this.handleFilterViewModeChange()}>
                      <span></span>
                    </div>
                  }
                  {showUnsavedChangesMsg && <span className="panel-change-count-msg">Unsaved Changes</span>}
                  <div className="panel-close-btn" >
                    <button onClick={() => {
                      // Changing left postion of hover header columns on closing of panel
                      let left = parseInt(document.getElementsByClassName(`hover-column-container-${this.props.analysisSavedSettings.id}`)[0].style.left.split('p')[0]) - 365;
                      document.getElementsByClassName(`hover-column-container-${this.props.analysisSavedSettings.id}`)[0].style.left = left.toString()+'px';
                      this.setState({ toggleFilterPanel: false });
                      }}></button>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel-main">
              {panelMainSelectedTab === 'Constructor' && this.giveConstructorPanelMainContent()}
              {panelMainSelectedTab === 'Share' && this.giveSharePanelMainContent()}
              {panelMainSelectedTab === 'Insights' && this.giveInsightPanelMainContent()}
            </div>


            {panelMainSelectedTab === 'Constructor' &&
              <div className="panel-footer">
                {this.state.panel_first_tab_current_subtab === 'dataset' &&
                  <div className="add-calculated-field-btn" onClick={this.handleNewCalculatedFieldBtn}>Calculated Field </div>
                }
                
                {this.givePaginationHtml()}

                <div className="console-action-buttons">
                  <button className="btn-with-icon btn-run btn-small" title="Run" disabled={areActionButtonsDisabled} onClick={this.handleAnalysisFiltersRun}>
                    <i></i><span>Run</span>{runBtnCount > 0 && <span className="change-count-badge">{runBtnCount}</span>}
                  </button>
                  <button className="btn-with-icon btn-reset btn-small" title="Reset" disabled={areActionButtonsDisabled} onClick={this.handleAnalysisFiltersReset}><i></i><span>Reset</span></button>
                </div>
              </div>
            }

            {panelMainSelectedTab === 'Share' &&
              <div className="panel-footer">
                {!this.state.shareShowNewForm &&
                  <button className="btn-with-icon btn-new btn-small" title="Invite" onClick={() => this.handleShareNewBtnClick()}>
                    <i></i><span>Invite</span>
                  </button>
                }
                {this.state.shareShowNewForm &&
                  <>
                    <button className="btn-with-icon btn-invite btn-small" title="Invite" disabled={this.state.shareOpertionInProgress} onClick={this.handleShareNewFormSubmit}>
                      <i></i><span>Invite</span>
                    </button>
                    <button className="btn-with-icon btn-reset btn-small" title="Reset" disabled={this.state.shareOpertionInProgress} onClick={this.handleShareNewFormReset}>
                      <i></i><span>Reset</span>
                    </button>
                    {this.state.sharedUsers && this.state.sharedUsers.length > 0 &&
                      <button className="btn-with-icon btn-cancel btn-small" disabled={this.state.shareOpertionInProgress} onClick={() => this.setState({ shareShowNewForm: false })}><i></i><span>Cancel</span></button>
                    }
                  </>
                }
              </div>
            }

          </div>
        </div>
      </ClickOutsideListner>
    );
  }

  giveConstructorPanelMainContent() {
    const currentTab = this.state.filter_panel_current_tab;
    let mainContent;

    if (this.isAnalysisInEditMode()) {
      if (currentTab === 'Transform') {
        const viewMode = this.state.dataTabView;
        const subtabList = viewMode === '1' ? ['dataset', 'rows', 'columns', 'period', 'values', 'filters'] : ['dataset', 'period'];
        const currentSubtab = this.state.panel_first_tab_current_subtab;
        const searchInput = this.state.panelConstructorSearchValue.trim().toLowerCase();
        const allItems = this.state.all_items.filter(item => item.title.includes(searchInput));

        const mostCommonFieldsForRowsAndCols = this.state.all_items.filter(item => item.type === 'string' || item.type === 'date');
        const otherFieldsForRowsAndCols = this.state.all_items.filter(item => !(item.type === 'string' || item.type === 'date'));

        const selectedRows = this.state.selected_rows.filter(item => item.title.includes(searchInput));
        const availableRows = mostCommonFieldsForRowsAndCols.filter(item => !selectedRows.some(r => r.title === item.title)).filter(item => item.title.includes(searchInput));
        const availableRowsOthers = otherFieldsForRowsAndCols.filter(item => !selectedRows.some(r => r.title === item.title)).filter(item => item.title.includes(searchInput));

        const selectedColumns = this.state.selected_columns.filter(item => item.title.includes(searchInput));
        const availableColumns = mostCommonFieldsForRowsAndCols.filter(item => !selectedColumns.some(c => c.title === item.title)).filter(item => item.title.includes(searchInput));
        const availableColumnsOthers = otherFieldsForRowsAndCols.filter(item => !selectedColumns.some(c => c.title === item.title)).filter(item => item.title.includes(searchInput));

        const selectedValues = this.state.selected_values.filter(item => item.title.includes(searchInput));
        const availableValues = this.state.all_items.filter(item => !selectedValues.some(v => v.title === item.title));// values can have all types of field.

        const selectedFilters = this.state.selected_filters.filter(item => item.title.includes(searchInput));
        const availableFilters = this.state.all_items.filter(item => item.type === 'string').filter(item => !selectedFilters.some(f => f.title === item.title)).filter(item => item.title.includes(searchInput));

        // content of dataset tab will depend on the view mode, hence separate function is created for this to have code clarity and html reuse
        const giveDatasetTabHTMLContent = () => {

          const allFieldsContent = (
            <div className="all_fields col">
              <h5 className="title">Available Fields</h5>
              <div className="field_list">
                {this.state.loading_all_items && <p>Loading ...</p>}
                {!this.state.loading_all_items &&
                  <>
                    {allItems.map(item => (
                      <DndDraggable key={item.title} draggableId={item.title} dragCloneText={item.display_title} dragCloneStyles={{ 'background-color': '#777', 'opacity': '0.8', 'font-weight': '600' }}>
                        {(draggableProps) => {
                          const isCalculated = isCalculatedField(item);
                          const isEditable = isCalculated && item.created_by === this.user.id;
                          return (
                            <div className={'field ' + item.type} {...draggableProps}  >
                              <div className="field_name">{item.display_title}</div>
                              {isEditable && <div className="field_edit_icon" onClick={(e) => this.handleCalculatedFieldEdit(item)}></div>}
                            </div>
                          );
                        }}
                      </DndDraggable>
                    ))}
                  </>
                }
              </div>
              {/* <div className="add-calculated-field-btn" onClick={this.handleNewCalculatedFieldBtn}>Calculated Field </div> */}
            </div>
          );

          return (
            <div id="dataset-content">
              {viewMode === '1' &&
                <div className="view_types col">
                  <h5 className='title'>Source</h5>
                  <RadioGroup name="dataset-source" selectedValue={this.state.view_type} onChange={(e) => this.handleViewTypeChange(e.target.value)} >
                    {this.state.data_sources.map(ds => {
                      return (
                        <Radio key={ds.name} value={ds.name} label={ds.display_name} disabled={this.state.loading_all_items} uniqueHtmlForKey={`d-${this.props.analysisSavedSettings.id}-view_type-${ds.name}`} />
                      );
                    })}
                  </RadioGroup>
                </div>
              }

              {viewMode === '1' &&
                allFieldsContent
              }

              {viewMode === '2' &&
                <div className="view_type-and-all_fields col">
                  <div className="view_type_dropdown">
                    {/* <label>Source</label> */}
                    <SpeedSelect
                      options={this.state.data_sources}
                      selectedOption={{ name: this.state.view_type, display_name: this.state.data_sources.find(ds => ds.name === this.state.view_type).display_name }}
                      onSelect={(op) => this.handleViewTypeChange(op.name)}
                      displayKey='display_name'
                      uniqueKey='name'
                      prominentLabel='Source'
                      selectLabel='Select'
                      maxHeight={200}
                      disabled={this.state.loading_all_items}
                      disableSearch={true}
                    />
                  </div>
                  {allFieldsContent}
                </div>
              }

              {viewMode === '2' &&
                <div className="other-blocks col">
                  <DndDroppable droppableId='view-2-rows' draggingOverClassName="dragging-over" isDroppable={(draggableId) => this.isFieldDroppable('view-2-rows', draggableId)}>
                    {(droppableProps) => (
                      <div id="rows-content" className="block" {...droppableProps} >
                        <label className="block-title">Add Rows</label>

                        <ReorderableList listId="rows-selected" listLength={selectedRows.length} onReorder={(oldIndex, newIndex) => this.handleRowsColValReordering('selected_rows', reorder(selectedRows, oldIndex, newIndex))}>
                          {(listProps, listItemProps) => {

                            return (
                              <div className="fields-selected" {...listProps} >
                                {
                                  selectedRows.map((field, index) => {
                                    return (
                                      <ReorderableListItem key={field.title} draggableId={field.title} shadowItemTextOnDrag={field.display_title} index={index}>
                                        {(itemProps) => {
                                          return (
                                            <div className={'field ' + field.type} {...listItemProps} {...itemProps} style={{ ...itemProps.style }}>
                                              <div className="field-text">{field.display_title} </div>
                                              <div className="field-action-btns">
                                                <button className="btn-close" onClick={() => { this.handleRowSelection(field, false) }}></button>
                                              </div>
                                            </div>
                                          );
                                        }}
                                      </ReorderableListItem>
                                    )
                                  })
                                }
                                {selectedRows.length === 0 &&
                                  <div className='no-field'>No field selected</div>
                                }
                              </div>
                            );
                          }}
                        </ReorderableList>

                      </div>
                    )}
                  </DndDroppable>

                  <DndDroppable droppableId='view-2-columns' draggingOverClassName="dragging-over" isDroppable={(draggableId) => this.isFieldDroppable('view-2-columns', draggableId)}>
                    {(droppableProps) => (
                      <div id="columns-content" className="block" {...droppableProps}>
                        <label className="block-title">Add Columns</label>

                        <ReorderableList listId="cols-selected" listLength={selectedColumns.length} onReorder={(oldIndex, newIndex) => this.handleRowsColValReordering('selected_columns', reorder(selectedColumns, oldIndex, newIndex))}>
                          {(listProps, listItemProps) => {
                            return (
                              <div className="fields-selected" {...listProps} >
                                {
                                  selectedColumns.map((field, index) => {
                                    return (
                                      <ReorderableListItem key={field.title} draggableId={field.title} shadowItemTextOnDrag={field.display_title} index={index}>
                                        {(itemProps) => {
                                          return (
                                            <div className={'field ' + field.type} {...listItemProps} {...itemProps} style={{ ...itemProps.style }}>
                                              <div className="field-text">{field.display_title} </div>
                                              <div className="field-action-btns">
                                                {field.title !== 'values' &&
                                                  <button className="btn-close" onClick={() => { this.handleColumnSelection(field, false) }}></button>
                                                }
                                              </div>
                                            </div>
                                          );
                                        }}
                                      </ReorderableListItem>
                                    )
                                  })
                                }
                              </div>
                            );
                          }}
                        </ReorderableList>

                      </div>
                    )}
                  </DndDroppable>

                  <DndDroppable droppableId='view-2-values' draggingOverClassName="dragging-over" isDroppable={(draggableId) => this.isFieldDroppable('view-2-values', draggableId)}>
                    {(droppableProps) => (
                      <div id="values-content" className="block" {...droppableProps}>
                        <label className="block-title">Add Values</label>

                        <ReorderableList listId="values-selected" listLength={selectedValues.length} onReorder={(oldIndex, newIndex) => this.handleRowsColValReordering('selected_values', reorder(selectedValues, oldIndex, newIndex))}>
                          {(listProps, listItemProps) => {
                            return (
                              <div className="fields-selected" {...listProps} >
                                {
                                  selectedValues.map((field, index) => {
                                    let fieldText = field.default_action !== 'no_calculation' ? OPERATIONS_FOR_VALUES.find(op => op.id === field.default_action).shortName + ' of' : '';
                                    fieldText += isCalculatedField(field) ? 'Calculated' : '';
                                    fieldText += ' ' + field.display_title;

                                    return (
                                      <ReorderableListItem key={field.title} draggableId={field.title} shadowItemTextOnDrag={fieldText} index={index}>
                                        {(itemProps) => {
                                          const possibleAggregations = givePossibleAggregationForField(field);
                                          return (
                                            <div key={field.title} className={'field ' + field.type} {...listItemProps} {...itemProps} style={{ ...itemProps.style }}>
                                              <div className="field-text">
                                                {field.default_action !== 'no_calculation' && <span>{OPERATIONS_FOR_VALUES.find(op => op.id === field.default_action).shortName}</span>}
                                                {field.default_action !== 'no_calculation' && ' of '}
                                                {isCalculatedField(field) && <span>Calculated</span>}
                                                <span>{' ' + field.display_title} </span>
                                              </div>

                                              <div className="field-action-btns">
                                                {possibleAggregations.length > 0 &&
                                                  <button className="btn-aggregation" onClick={() => { this.openValuesOperationsList(field) }}></button>
                                                }
                                                <button className="btn-close" onClick={() => { this.handleValueSelection(field, false) }}></button>
                                              </div>

                                              {this.state.selected_value_field && this.state.selected_value_field.title === field.title &&
                                                <ClickOutsideListner className="field-aggregation-wrapper" onOutsideClick={() => this.setState({ selected_value_field: null })}>
                                                  <div className="field-aggregation-options">
                                                    <ul className="option-list">
                                                      {possibleAggregations.map(op => {
                                                        const isSelected = op.id === field.default_action;
                                                        return <li key={op.id} className={'option' + (isSelected ? ' selected' : '')} onClick={(e) => {this.selectOperation(op.id)}}>{op.name}</li>
                                                      })}
                                                    </ul>
                                                  </div>
                                                </ClickOutsideListner>
                                              }
                                            </div>
                                          );
                                        }}
                                      </ReorderableListItem>
                                    )
                                  })
                                }
                                {selectedValues.length === 0 &&
                                  <div className='no-field'>No field selected</div>
                                }
                              </div>
                            );
                          }}
                        </ReorderableList>

                      </div>
                    )}
                  </DndDroppable>

                  <DndDroppable droppableId='view-2-filters' draggingOverClassName="dragging-over" isDroppable={(draggableId) => this.isFieldDroppable('view-2-filters', draggableId)} >
                    {(droppableProps) => (
                      <div id="filters-content" className="block" {...droppableProps}>
                        <label className="block-title">Add Filters</label>
                        <div className="fields-selected">
                          <>
                            {selectedFilters.map((field, index) => {
                              const isExpanded = this.state.currentSelectedFilter && this.state.currentSelectedFilter.title === field.title ? true : false;
                              return (
                                <div key={field.title} className={'field ' + field.type}>
                                  <div className="field-text">{field.display_title} </div>
                                  <div className="field-action-btns">
                                    <button className="btn-expand" onClick={() => this.setState({ currentSelectedFilter: field })}></button>
                                    <button className="btn-close" onClick={() => { this.handleFiltersSelection(field, false) }}></button>
                                  </div>

                                  {isExpanded &&
                                    <ClickOutsideListner className="filter-values-wrapper" onOutsideClick={() => this.setState({ currentSelectedFilter: null })}>
                                      <div className="filter-values-options">
                                        <ul className="option-list">
                                          {this.state.dimensions[this.state.currentSelectedFilter.title].map(op => {
                                            const isChecked = this.state.selected_dimensions[this.state.currentSelectedFilter.title] ? this.state.selected_dimensions[this.state.currentSelectedFilter.title].includes(op) : false;
                                            return <li key={op} className={'option'} >
                                              <Checkbox uniqueHtmlForKey={`d-${this.props.analysisSavedSettings.id}-filter-val-${op}`} label={op} checked={isChecked} onChange={(e) => this.handleFilterChange(field.title, op, e.target.checked)} />
                                            </li>
                                          })}
                                        </ul>
                                      </div>
                                    </ClickOutsideListner>
                                  }
                                </div>
                              )
                            })}

                            {selectedFilters.length === 0 &&
                              <div className='no-field'>No field selected</div>
                            }
                          </>
                        </div>
                      </div>
                    )}
                  </DndDroppable>
                </div>
              }
            </div>
          )
        };

        // forceDisplayDate For MultiPicker calculation : Set 1st date of Month prev to lastUpdated date's month
        const lastUpdated = this.state.lastUpdated;
        const forceDisplayDateForMultiPicker = lastUpdated ? new Date(lastUpdated.getFullYear(), lastUpdated.getMonth() - 1, 1) : null;

        const giveSelectedCount = (subtabName) => {
          switch (subtabName) {
            case 'rows': return this.state.selected_rows.length;
            case 'columns': return this.state.selected_columns.length;
            case 'values': return this.state.selected_values.length;
            // only count a filter atleast its opne value is checked( i.e some key with filterName is available in 'selected_dimensions')
            case 'filters': return this.state.selected_filters.reduce((count, filterField) => this.state.selected_dimensions[filterField.title] ? count + 1 : count, 0);

            default:
              break;
          }
        };

        mainContent = (
          <div id="tab-data" className={`main-content view-mode-${viewMode}`}>

            <DndContext onDragEnd={this.handleDatasetTabDndDrop}>
              <div className="data-tab-subtab-grid">
                {subtabList.map((subtab) => {
                  const isActive = subtab === currentSubtab;
                  if (['rows', 'columns', 'values', 'filters'].includes(subtab)) {
                    const selectedItemCount = giveSelectedCount(subtab);
                    return (
                      <DndDroppable key={subtab} droppableId={`view-1-${subtab}`} draggingOverClassName="dragging-over" isDroppable={(draggableId) => this.isFieldDroppable(`view-1-${subtab}`, draggableId)}>
                        {(droppableProps) => (
                          <div className={'subtab-grid-item ' + subtab + (isActive ? ' active' : '')} {...droppableProps} >
                            <div className={'subtab-grid-item-inner'}
                              onClick={(e) => this.setState({ panel_first_tab_current_subtab: subtab, panelConstructorSearchValue: '' })}>
                              <span>{covertUnderscoreToSpaceInString(subtab)}</span>
                              {selectedItemCount > 0 && <span className="icon-selection-count">{selectedItemCount}</span>}
                            </div>
                          </div>
                        )}
                      </DndDroppable>
                    );
                  }

                  return (
                    <div key={subtab} className={'subtab-grid-item ' + subtab + (isActive ? ' active' : '')}>
                      <div className={'subtab-grid-item-inner'}
                        onClick={(e) => this.setState({ panel_first_tab_current_subtab: subtab, panelConstructorSearchValue: '' })}>
                        <span>{covertUnderscoreToSpaceInString(subtab)}</span>
                        {/* <span className="icon-selection-count">{2}</span> */}
                      </div>
                    </div>
                  );
                })
                }
              </div>

              {currentSubtab !== 'period' &&
                <div className="gl-search">
                  <input placeholder="Search" value={this.state.panelConstructorSearchValue} onChange={e => this.setState({ panelConstructorSearchValue: e.target.value })} />
                </div>
              }

              <div className="data-tab-subtab-content">
                {currentSubtab === 'dataset' &&
                  giveDatasetTabHTMLContent()
                }

                {currentSubtab === 'rows' &&
                  <div id="rows-content">
                    <ReorderableList listId="rows-selected" listLength={selectedRows.length} onReorder={(oldIndex, newIndex) => this.handleRowsColValReordering('selected_rows', reorder(selectedRows, oldIndex, newIndex))}>
                      {(listProps, listItemProps) => {
                        return (
                          <div className="fields-selected" {...listProps} >
                            <h4>Selected Rows</h4>
                            {
                              selectedRows.map((field, index) => {
                                return (
                                  <ReorderableListItem key={field.title} draggableId={field.title} shadowItemTextOnDrag={field.display_title} index={index}>
                                    {(itemProps) => {
                                      return (
                                        <div className={'field ' + field.type} {...listItemProps} {...itemProps} style={{ ...itemProps.style }}>
                                          <div className="field-text">{field.display_title} </div>
                                          <div className="field-action-btns">
                                            <button className="btn-close" onClick={() => { this.handleRowSelection(field, false) }}></button>
                                          </div>
                                        </div>
                                      );
                                    }}
                                  </ReorderableListItem>
                                )
                              })
                            }
                            {selectedRows.length === 0 &&
                              <div className='no-field'> -- </div>
                            }
                          </div>
                        );
                      }}
                    </ReorderableList>

                    <div className="fields-available">
                      <h4>Suggested Rows</h4>
                      {availableRows.map((field, index) => {
                        // const isSelected = selectedRows.some(f => f.title === field.title);
                        const isAlreadySelectedInColumns = selectedColumns.some(f => f.title === field.title);
                        return (
                          <div key={field.title} className={'field ' + field.type + (isAlreadySelectedInColumns ? ' disabled' : '')} onClick={(e) => this.handleRowSelection(field, true)}>
                            <span >{field.display_title}{isAlreadySelectedInColumns ? ' (in columns)' : ''}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className='fields-others'>
                      <h4>Other Fields</h4>
                      {availableRowsOthers.map((field, index) => {
                        const isAlreadySelectedInColumns = selectedColumns.some(f => f.title === field.title);
                        return (
                          <div key={field.title} className={'field ' + field.type} onClick={(e) => this.handleRowSelection(field, true)}>
                            <span >{field.display_title}{isAlreadySelectedInColumns ? ' (in columns)' : ''}</span>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                }

                {currentSubtab === 'columns' &&
                  <div id="columns-content">

                    <ReorderableList listId="cols-selected" listLength={selectedColumns.length} onReorder={(oldIndex, newIndex) => this.handleRowsColValReordering('selected_columns', reorder(selectedColumns, oldIndex, newIndex))}>
                      {(listProps, listItemProps) => {
                        return (
                          <div className="fields-selected" {...listProps} >
                            <h4>Selected Columns</h4>
                            {
                              selectedColumns.map((field, index) => {
                                return (
                                  <ReorderableListItem key={field.title} draggableId={field.title} shadowItemTextOnDrag={field.display_title} index={index}>
                                    {(itemProps) => {
                                      return (
                                        <div className={'field ' + field.type} {...listItemProps} {...itemProps} style={{ ...itemProps.style }}>
                                          <div className="field-text">{field.display_title} </div>
                                          <div className="field-action-btns">
                                            {field.title !== 'values' &&
                                              <button className="btn-close" onClick={() => { this.handleColumnSelection(field, false) }}></button>
                                            }
                                          </div>
                                        </div>
                                      );
                                    }}
                                  </ReorderableListItem>
                                )
                              })
                            }
                          </div>
                        );
                      }}
                    </ReorderableList>


                    <div className="fields-available">
                      <h4>Suggested Columns</h4>
                      {availableColumns.map((field, index) => {
                        const isAlreadySelectedInRows = selectedRows.some(f => f.title === field.title);
                        return (
                          <div key={field.title} className={'field ' + field.type + (isAlreadySelectedInRows ? ' disabled' : '')} onClick={(e) => this.handleColumnSelection(field, true)}>
                            <span>{field.display_title}{isAlreadySelectedInRows ? ' (in rows)' : ''}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className={'fields-others'}>
                      <h4>Other Fields</h4>
                      {availableColumnsOthers.map((field, index) => {
                        const isAlreadySelectedInRows = selectedRows.some(f => f.title === field.title);
                        return (
                          <div key={field.title} className={'field ' + field.type} onClick={(e) => this.handleColumnSelection(field, true)}>
                            <span>{field.display_title}{isAlreadySelectedInRows ? ' (in rows)' : ''}</span>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                }

                {currentSubtab === 'values' &&
                  <div id="values-content">
                    <ReorderableList listId="values-selected" listLength={selectedValues.length} onReorder={(oldIndex, newIndex) => this.handleRowsColValReordering('selected_values', reorder(selectedValues, oldIndex, newIndex))}>
                      {(listProps, listItemProps) => {
                        return (
                          <div className="fields-selected" {...listProps} >
                            <h4>Selected Values</h4>
                            {selectedValues.map((field, index) => {
                              let fieldText = field.default_action !== 'no_calculation' ? OPERATIONS_FOR_VALUES.find(op => op.id === field.default_action).shortName + ' of' : '';
                              fieldText += isCalculatedField(field) ? 'Calculated' : '';
                              fieldText += ' ' + field.display_title;
                              return (
                                <ReorderableListItem key={field.title} draggableId={field.title} shadowItemTextOnDrag={fieldText} index={index}>
                                  {(itemProps) => {
                                    const possibleAggregations = givePossibleAggregationForField(field);
                                    return (
                                      <div key={field.title} className={'field ' + field.type} {...listItemProps} {...itemProps} style={{ ...itemProps.style }}>
                                        <div className="field-text">
                                          {field.default_action !== 'no_calculation' && <span>{OPERATIONS_FOR_VALUES.find(op => op.id === field.default_action).shortName}</span>}
                                          {field.default_action !== 'no_calculation' && ' of '}
                                          {isCalculatedField(field) && <span>Calculated</span>}
                                          <span>{' ' + field.display_title}</span>
                                        </div>

                                        <div className="field-action-btns">
                                          {possibleAggregations.length > 0 &&
                                            <button className="btn-aggregation" onClick={() => { this.openValuesOperationsList(field) }}></button>
                                          }
                                          <button className="btn-close" onClick={() => { this.handleValueSelection(field, false) }}></button>
                                        </div>

                                        {this.state.selected_value_field && this.state.selected_value_field.title === field.title &&
                                          <ClickOutsideListner className="field-aggregation-wrapper" onOutsideClick={() => this.setState({ selected_value_field: null })}>
                                            <div className="field-aggregation-options">
                                              <ul className="option-list">
                                                {possibleAggregations.map(op => {
                                                  const isSelected = op.id === field.default_action;
                                                  return <li key={op.id} className={'option' + (isSelected ? ' selected' : '')} onClick={(e) => { this.selectOperation(op.id) }}> {op.name}  </li>
                                                })}
                                              </ul>
                                            </div>
                                          </ClickOutsideListner>
                                        }
                                      </div>
                                    );
                                  }}
                                </ReorderableListItem>
                              )
                            })}

                            {selectedValues.length === 0 &&
                              <div className='no-field'> -- </div>
                            }
                          </div>
                        );
                      }}
                    </ReorderableList>


                    <div className="fields-available">
                      <h4>Suggested Fields</h4>
                      {availableValues.map((field, index) => {
                        return (
                          <div key={field.title} className={'field ' + field.type} onClick={(e) => this.handleValueSelection(field, true)}>
                            <span>{field.display_title}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                }

                {currentSubtab === 'filters' &&
                  <div id="filters-content">
                    <div className="fields-selected">
                      <>
                        <h4>Selected Filters</h4>
                        {selectedFilters.map((field, index) => {
                          const isExpanded = this.state.currentSelectedFilter && this.state.currentSelectedFilter.title === field.title ? true : false;
                          return (
                            <div key={field.title} className={'field ' + field.type + (isExpanded ? ' expanded' : '')} >
                              <div className="field-text">{field.display_title} </div>
                              <div className="field-action-btns">
                                <button className="btn-expand" onClick={() => this.setState({ currentSelectedFilter: isExpanded ? null : field })}></button>
                                <button className="btn-close" onClick={() => { this.handleFiltersSelection(field, false) }}></button>
                              </div>
                              {isExpanded &&
                                <div className="filter-values-wrapper">
                                  <div className="filter-values-options">
                                    <ul className="option-list">
                                      {(this.state.dimensions[this.state.currentSelectedFilter.title] || []/**Fallback as empty list if filters are not fetched yet */).map(op => {
                                        const isChecked = this.state.selected_dimensions[this.state.currentSelectedFilter.title] ? this.state.selected_dimensions[this.state.currentSelectedFilter.title].includes(op) : false;
                                        return <li key={op} className={'option'} >
                                          <Checkbox uniqueHtmlForKey={`d-${this.props.analysisSavedSettings.id}-filter-val-${op}`} label={op} checked={isChecked} onChange={(e) => this.handleFilterChange(field.title, op, e.target.checked)} />
                                        </li>
                                      })}
                                    </ul>
                                  </div>
                                </div>
                                // <ClickOutsideListner className="filter-values-wrapper" onOutsideClick={() => this.setState({ currentSelectedFilter: null })}>
                                //   <div className="filter-values-options">
                                //     <ul className="option-list">
                                //       {(this.state.dimensions[this.state.currentSelectedFilter.title] || []/**Fallback as empty list if filters are not fetched yet */).map(op => {
                                //         const isChecked = this.state.selected_dimensions[this.state.currentSelectedFilter.title] ? this.state.selected_dimensions[this.state.currentSelectedFilter.title].includes(op) : false;
                                //         return <li key={op} className={'option'} >
                                //           <Checkbox uniqueHtmlForKey={`d-${this.props.analysisSavedSettings.id}-filter-val-${op}`} label={op} checked={isChecked} onChange={(e) => this.handleFilterChange(field.title, op, e.target.checked)} />
                                //         </li>
                                //       })}
                                //     </ul>
                                //   </div>
                                // </ClickOutsideListner>
                              }
                            </div>
                          );
                        })}
                        {selectedFilters.length === 0 &&
                          <div className='no-field'> -- </div>
                        }
                      </>
                    </div>

                    <div className="fields-available">
                      <h4>Suggested Fields</h4>
                      {availableFilters.map((field, index) => {
                        return (
                          <div key={field.title} className={'field ' + field.type} onClick={(e) => this.handleFiltersSelection(field, true)}>
                            <span >{field.display_title}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                }

                {currentSubtab === 'period' &&
                  <div id="period-content">
                    <CalendarPanelInDataGrid
                      periods={this.state.selectedDateRanges}
                      periodBGColors={[this.colors[0], this.colors[1], this.colors[2], this.colors[3]]}
                      periodColors={['#000', '#fff', '#000', '#000']}
                      benchmarkIndex={this.state.benchmarkRangeIndex}
                      // disableBenchmarkChange={this.state.periodComparisonPreselect ? this.state.periodComparisonPreselect.id !== 'CUSTOM' : false}
                      forceDisplayDate={forceDisplayDateForMultiPicker}
                      dateForLastDaysCalculation={this.state.lastUpdatedDateObj}
                      onChange={this.handleAnalysisPeriodChange}
                      isPeriodComparisonEnabled={this.state.isPeriodComparisonEnabled}
                      onPeriodComaprisonChange={this.handlePeriodComaparisonToggle}
                      periodComparisonPreselect={this.state.periodComparisonPreselect.id}
                      onPeriodComparisonPreselectChange={this.handlePeriodComaprisonPreselect}
                      showBenchmarkInGrid={this.state.showBenchmarkInGrid}
                      onShowBenchmarkInGridChange={this.handleShowBenchmarkInGridChange}
                      periodComparisonGroupByOptions={this.state.all_items ? this.state.all_items.filter(item => item.type === 'date') : []}
                      periodComparisonGroupBy={this.state.periodComparisonGroupBy || {}}
                      onPeriodComparisonGroupByChange={(val) => this.setState({ periodComparisonGroupBy: val })}
                      disableFn={(dObj) => isDateGreater(dObj, this.state.lastUpdatedDateObj)}
                    />
                  </div>
                }
              </div>
            </DndContext>
          </div >
        );
      }

      if (currentTab === 'Conditional Formatting') {
        mainContent = (
          <div className="main-content" id="tab-format">
            <div className="conditions-wrapper">
              {this.state.tempConditionalFormatting.map((item, i) => {
                return (
                  <div key={i + 1} className="condition">
                    <div className="sno">{i + 1}</div>

                    <div className="field-group">
                      <div className="field-wrapper format_type">
                        <SpeedSelect
                          options={this.state.conditionalFormatTypes}
                          selectedOption={item.format_type}
                          onSelect={(e) => this.handleConditionalFormattingSelect(e, 'format_type', i)}
                          displayKey='name'
                          uniqueKey='id'
                          selectLabel='Format Type'
                          maxHeight={65}
                          disableSearch={true}
                        />
                      </div>

                      <div className="field-wrapper cell_value">
                        <SpeedSelect
                          options={this.state.conditionalCellValues}
                          selectedOption={item.cell_value}
                          onSelect={(e) => this.handleConditionalFormattingSelect(e, 'cell_value', i)}
                          displayKey='name'
                          uniqueKey='id'
                          selectLabel='Cell Value'
                          maxHeight={55}
                          multiple
                          hideOkCancelBtns={true}
                        />
                      </div>

                      <div className="field-wrapper condition">
                        <SpeedSelect
                          options={CONDITIONAL_FORMATTING_OPTIONS}
                          selectedOption={item.condition}
                          onSelect={(e) => this.handleConditionalFormattingSelect(e, 'condition', i)}
                          displayKey='name'
                          uniqueKey='id'
                          selectLabel='Condition'
                          maxHeight={65}
                        />
                      </div>

                      {(item && item.condition !== undefined && item.condition.id !== 'empty') &&
                        <div className="field-wrapper compare-val compare-val1">
                          <input type="text" id="txt-comparison-val1" name="txt-comparison-val1" className="form-control number" onChange={(e) => this.handleConditionalFormattingSelect(e, 'value1', i)} value={item.value1} placeholder={(item.condition.id === 'between') ? 'From' : 'Compare Value'} />
                          {(item.format_type !== undefined && item.format_type.id === 'period_comparison') &&
                            <div className="symbol">%</div>
                          }
                        </div>
                      }

                      {item && item.condition.id === 'between' &&
                        <div className="field-wrapper  compare-val compare-val2">
                          <input type="text" id="txt-comparison-val2" name="txt-comparison-val2" className="form-control number" onChange={(e) => this.handleConditionalFormattingSelect(e, 'value2', i)} value={item.value2} placeholder="To" />
                          {item.format_type.id === 'period_comparison' &&
                            <div className="symbol">%</div>
                          }
                        </div>
                      }
                    </div>

                    <div className="color-field-group" >
                      <div className="cell-preview" style={{ backgroundColor: (item.background !== '' ? item.background : '#000') }}>
                        <div className="cell-text" style={{ color: (item.color !== '' ? item.color : '#fff') }}>Cell Preview 123</div>
                      </div>

                      <div className="color-field" onClick={(e) => this.handleToggleColorPicker(e, 'background', i)}>
                        <div className="label">Fill</div>
                        {/* <input type="color" id={'txt-font-color' + i} name={'txt-font-color' + i} ref={this.state.conditionalColorsRefs[i]['bg']} className="form-control color-control" onChange={(e) => this.handleConditionalFormattingSelect(e, 'background', i)} value={item.background} /> */}

                        <div id={'txt-background-color' + i} className="color-control" style={{ backgroundColor: item.background }} onClick={(e) => this.handleToggleColorPicker(e, 'background', i)}></div>
                        {item && item.display_background_picker &&
                          <ClickOutsideListner onOutsideClick={(e) => this.handleToggleColorPicker(e, 'background', i)}>
                            <div className={'color-picker-wrapper'}>
                              <div className="color-picker">
                                {Object.keys(COLOR_PICKER_LIST).map((colorKey) => {
                                  return (<div key={colorKey} className="color-col">
                                    {COLOR_PICKER_LIST[colorKey].map((color) => {
                                      return (<div className="color" style={{ backgroundColor: color }} onClick={(e) => this.handleColorPickerSelect('background', i, color)}></div>)
                                    })}
                                  </div>)
                                })}
                              </div>
                            </div>
                          </ClickOutsideListner>
                        }
                      </div>

                      <div className="color-field" onClick={(e) => this.handleToggleColorPicker(e, 'fontcolor', i)}>
                        <div className="label">Text</div>
                        {/* <input type="color" id={'txt-background-color' + i} name={'txt-background-color' + i} ref={this.state.conditionalColorsRefs[i]['color']} className="form-control color-control" onChange={(e) => this.handleConditionalFormattingSelect(e, 'color', i)} value={(item.color !== '' ? item.color : '#ffffff')} /> */}

                        <div id={'txt-font-color' + i} className="form-control color-control" style={{ backgroundColor: (item.color !== '' ? item.color : '#ffffff') }} onClick={(e) => this.handleToggleColorPicker(e, 'font', i)}></div>
                        {item && item.display_fontcolor_picker &&
                          <ClickOutsideListner onOutsideClick={(e) => this.handleToggleColorPicker(e, 'fontcolor', i)}>
                            <div className="color-picker-wrapper">
                              <div className="color-picker">
                                {Object.keys(COLOR_PICKER_LIST).map((colorKey) => {
                                  return (<div key={colorKey} className="color-col">
                                    {COLOR_PICKER_LIST[colorKey].map((color) => {
                                      return (<div className="color" style={{ backgroundColor: color }} onClick={(e) => this.handleColorPickerSelect('color', i, color)}></div>)
                                    })}
                                  </div>)
                                })}
                              </div>
                            </div>
                          </ClickOutsideListner>
                        }
                      </div>
                      <button className="btn-remove-condition" onClick={(e) => this.handleRemoveNewConditionalFormatting(e, i)}></button>
                    </div>

                  </div>
                )
              })}

              <div className="condition-add-btn-wrapper">
                <button onClick={this.handleAddNewConditionalFormatting}></button>
              </div>
            </div>
          </div>
        );
      }

    } else {
      // forceDisplayDate For MultiPicker calculation : Set 1st date of Month prev to lastUpdated date's month
      const lastUpdated = this.state.lastUpdated;
      const forceDisplayDateForMultiPicker = lastUpdated ? new Date(lastUpdated.getFullYear(), lastUpdated.getMonth() - 1, 1) : null;
      const allFilters = this.state.analysisSettings.presentation_filters; //instead of this get all details as obj
      const appliedFiltersCount = Object.keys(this.state.selected_dimensions).length;
      
      let selectedVisibleFilters = [];
      if(allFilters.length > 0){
        allFilters.forEach((item)=>{
          if(item!=='period'){
            let matchingFilter = this.state.all_items.filter((e) => e.title===item);
            selectedVisibleFilters.push(matchingFilter[0]);
          }
        });
      }

      const showPeriodPanel = this.state.analysisSettings.presentation_filters.includes('period');
      const showFilterPanel = this.state.analysisSettings.presentation_filters.length > 0 && (this.state.analysisSettings.presentation_filters.length > 1 || this.state.analysisSettings.presentation_filters[0] !== 'period');

      mainContent = (
        <div id="tab-data" className={`main-content`}>
          <div className="data-tab-subtab-content">
            {showPeriodPanel &&
              <div id="period-content">
                <CalendarPanelInDataGrid
                  periods={this.state.selectedDateRanges}
                  periodBGColors={[this.colors[0], this.colors[1], this.colors[2], this.colors[3]]}
                  periodColors={['#000', '#fff', '#000', '#000']}
                  benchmarkIndex={this.state.benchmarkRangeIndex}
                  // disableBenchmarkChange={this.state.periodComparisonPreselect ? this.state.periodComparisonPreselect.id !== 'CUSTOM' : false}
                  forceDisplayDate={forceDisplayDateForMultiPicker}
                  dateForLastDaysCalculation={this.state.lastUpdatedDateObj}
                  onChange={this.handleAnalysisPeriodChange}
                  isPeriodComparisonEnabled={this.state.isPeriodComparisonEnabled}
                  onPeriodComaprisonChange={this.handlePeriodComaparisonToggle}
                  periodComparisonPreselect={this.state.periodComparisonPreselect.id}
                  onPeriodComparisonPreselectChange={this.handlePeriodComaprisonPreselect}
                  showBenchmarkInGrid={this.state.showBenchmarkInGrid}
                  onShowBenchmarkInGridChange={this.handleShowBenchmarkInGridChange}
                  periodComparisonGroupByOptions={this.state.all_items ? this.state.all_items.filter(item => item.type === 'date') : []}
                  periodComparisonGroupBy={this.state.periodComparisonGroupBy || {}}
                  onPeriodComparisonGroupByChange={(val) => this.setState({ periodComparisonGroupBy: val })}
                  disableFn={(dObj) => isDateGreater(dObj, this.state.lastUpdatedDateObj)}
                />
              </div>
            }

            {showFilterPanel && 
              <div id="filters-content" className='control-filter'>
                <div className="fields-selected">
                  <>
                    <h4>Filters {appliedFiltersCount > 0 ? appliedFiltersCount : ''}</h4>
                    
                    {selectedVisibleFilters.length > 0 && 
                      selectedVisibleFilters.map((field) => {
                      let isExpanded = false;
                      if(this.state.currentSelectedFilter && this.state.currentSelectedFilter.title!==undefined && this.state.currentSelectedFilter.title === field.title) {
                        isExpanded = true;
                      }

                      return (
                        <div key={field.title} className={'field ' + field.type + (isExpanded ? ' expanded' : '')} onClick={() => this.setState({ currentSelectedFilter: field })}>
                          <div className="field-text">{field.display_title} </div>
                          <div className="field-action-btns"><button className="btn-expand"></button></div>
                          {isExpanded &&
                            <ClickOutsideListner className="filter-values-wrapper" onOutsideClick={() => this.setState({ currentSelectedFilter: null })}>
                              <div className="filter-values-options">
                                <ul className="option-list">
                                  {(this.state.dimensions[this.state.currentSelectedFilter.title] || []).map(op => {
                                    const isChecked = this.state.selected_dimensions[this.state.currentSelectedFilter.title] ? this.state.selected_dimensions[this.state.currentSelectedFilter.title].includes(op) : false;
                                    return <li key={op} className={'option'} >
                                      <Checkbox uniqueHtmlForKey={`d-${this.props.analysisSavedSettings.id}-filter-val-${op}`} label={op} checked={isChecked} onChange={(e) => this.handleFilterChange(field.title, op, e.target.checked)} />
                                    </li>
                                  })}
                                </ul>
                              </div>
                            </ClickOutsideListner>
                          }
                        </div>
                      );
                    })}
                  </>
                </div>
              </div>
            }
          </div>
        </div>
      );

    }

    return (
      <>
        {this.isAnalysisInEditMode() &&
          <div className="main-title">
            <div className="tab-btns">
              <button className={'tab-btn' + (currentTab === 'Transform' ? ' active' : '')} onClick={() => this.handleConstructorPanelTabChange('Transform')} >Data</button>
              {this.isAnalysisInEditMode() && <button className={'tab-btn' + (currentTab === 'Conditional Formatting' ? ' active' : '')} onClick={() => this.handleConstructorPanelTabChange('Conditional Formatting')}>Format</button>}
            </div>
          </div>
        }
        {mainContent}
      </>
    );
  }

  giveSharePanelMainContent() {
    const orgSearchInput = this.state.shareNewOrgSearch.trim();
    const userSearchInput = this.state.shareNewUserSearch.trim();
    const orgList = orgSearchInput ? this.state.organisationList.filter(o => o.name.toLowerCase().includes(orgSearchInput.toLowerCase())) : this.state.organisationList;
    const userList = userSearchInput ? this.state.userList.filter(u => (u.first_name + '' + u.last_name).toLowerCase().includes(userSearchInput.toLowerCase())) : this.state.userList;

    // Note - In case sharedUser list has been fetched already and that list is empty, we want to restrict the user to be able to see only the inivite form
    // To avoid handling this restrictions from multiple places, this has been done in render method itself
    if (!this.state.shareShowNewForm && this.state.sharedUsers && !this.state.sharedUsers.length) {
      setTimeout(() => {
        this.handleShareNewBtnClick();
      });
      return;
    }

    return (
      <>
        <div className="main-title"><span>{this.state.shareShowNewForm ? 'Invite New Members' : 'Active Members'}</span></div>

        <div className="main-content">
          {this.state.loadingSharedUsers && <p>Loading Shared Users ...</p>}

          {!this.state.loadingSharedUsers && this.state.sharedUsers && !this.state.shareShowNewForm &&
            <>
              <div className="shared-users">
                {this.state.sharedUsers.map(shareInfo => {
                  const isEditing = this.state.shareEditUserInfo ? this.state.shareEditUserInfo.user.id === shareInfo.user.id : false;
                  return (
                    <div key={shareInfo.id} className={'shared-user' + (isEditing ? ' shared-user-editing' : '')}>
                      <div className="shared-user-info">
                        <UserAvatar user={shareInfo.user} />
                        <h4>{shareInfo.user.first_name + ' ' + (shareInfo.user.last_name || '')}</h4>
                      </div>
                      <div className="org-info">
                        <div className="label">Organisation : </div>
                        <div className="value">{shareInfo.user.organization}</div>
                      </div>
                      <div className="previleges">
                        <div className="label">Authorization : </div>
                        <ul>
                          {shareInfo.privileges.split(',').map(p => {
                            return <li key={p}><span className="item">{p.charAt(0) + p.slice(1).toLowerCase()}</span></li>
                          }

                          )}
                        </ul>
                      </div>


                      <span className="pop-over-btn menu-btn" onClick={() => this.setState({ shareEditPopupUserID: shareInfo.user.id })}>
                        {this.state.shareEditPopupUserID === shareInfo.user.id &&
                          <ClickOutsideListner onOutsideClick={() => this.setState({ shareEditPopupUserID: null })}>
                            <div className="pop-over-options-wrapper">
                              <ul className="pop-over-options">
                                <li className={this.state.shareOpertionInProgress ? 'disabled' : ''} onClick={(e) => { e.stopPropagation(); this.setState({ shareEditPopupUserID: null }); this.handleShareEditBtn(shareInfo) }}>Edit</li>
                                <li className={this.state.shareOpertionInProgress ? 'disabled' : ''} onClick={(e) => { e.stopPropagation(); this.handleShareEditDeleteBtn(shareInfo.id) }}>Revoke Access</li>
                              </ul>
                            </div>
                          </ClickOutsideListner>
                        }
                      </span>

                      {isEditing &&
                        <div className="edit-form">
                          <div className="panel-widget auths">
                            <div className="widget-header">
                              <div className="widget-title">Authorization</div>
                            </div>
                            <div className="widget-content">
                              <ul className="auth-list">
                                {['EDIT', 'COMMENT', 'SHARE', 'DELETE'].map(auth => {
                                  const checked = this.state.shareEditSelectedAuthorizations.includes(auth);
                                  // const disabled = auth === 'VIEW';
                                  return (
                                    <li key={auth} className={'auth-item'}>
                                      {/* <div className="option checkbox">
                                        <input id={`${this.props.analysisSavedSettings.id}-share-${auth}`} type="checkbox"
                                          checked={checked}
                                          // disabled={disabled}
                                          onChange={() => this.handleShareEditAuthSelect(auth)} />
                                        <label htmlFor={`${this.props.analysisSavedSettings.id}-share-${auth}`}>
                                          {auth[0] + auth.slice(1).toLowerCase()}</label>
                                      </div> */}
                                      <Checkbox uniqueHtmlForKey={`d-${this.props.analysisSavedSettings.id}-share-${auth}`} label={auth[0] + auth.slice(1).toLowerCase()} checked={checked}
                                        onChange={(e) => this.handleShareEditAuthSelect(auth)} />

                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          </div>
                          <div className="action-btns">
                            <button className="btn btn-small" onClick={this.handleShareEditSubmitBtn} disabled={this.state.shareOpertionInProgress}><i></i><span>Update 1</span></button>
                            <button className="btn btn-small" onClick={this.handleShareEditCancelBtn} disabled={this.state.shareOpertionInProgress}><i></i><span>Cancel</span></button>
                          </div>
                        </div>
                      }
                    </div>
                  );
                })}
              </div>
            </>
          }

          {this.state.shareShowNewForm &&
            <div className="share-new-form">
              {this.state.loadingOrganisations && <p>Loading Organisations ....</p>}
              {orgList &&
                <>
                  <div className="panel-widget orgs-list-container">
                    <div className="widget-header">
                      <div className="widget-title">Organisation</div>
                      <div className="gl-search">
                        <input value={this.state.shareNewOrgSearch} onChange={e => this.setState({ shareNewOrgSearch: e.target.value })} />
                      </div>
                    </div>
                    <div className="widget-content">
                      <div className="list orgs-list">
                        <RadioGroup name="org" selectedValue={this.state.shareNewFormSelectedOrganisationId} onChange={(e) => this.handleShareOrganisationSelect(Number(e.target.value))} >
                          {orgList.map((org) => {
                            return (
                              <Radio key={org.id} value={org.id} label={org.name} uniqueHtmlForKey={`d-${this.props.analysisSavedSettings.id}-org-${org.name}`} />
                            )
                          })}
                        </RadioGroup>

                        {orgSearchInput && !orgList.length && <p className="no-match-msg">No Match Found</p>}
                      </div>
                    </div>
                  </div>

                  {this.state.loadingUsers && this.state.userList === null && <p>Loading Users ....</p>}

                  {this.state.userList !== null && this.state.shareNewFormSelectedOrganisationId &&
                    <div className={'panel-widget user-list-container' + (this.state.loadingUsers ? ' disabled' : '')}>
                      <div className="widget-header">
                        <div className="widget-title">Users
                          {this.state.shareNewFormSelectedUsers.length ? <label>Selected <span>{this.state.shareNewFormSelectedUsers.length}</span></label> : null}
                        </div>
                        <div className="gl-search">
                          <input value={this.state.shareNewUserSearch} onChange={e => this.setState({ shareNewUserSearch: e.target.value })} />
                        </div>
                      </div>
                      <div className="widget-content">
                        <div className="list user-list">
                          <div key='all' className={'option checkbox'}>
                            <input id={`${this.props.analysisSavedSettings.id}-user-all`} type="checkbox" name="share-new-user" checked={this.state.shareNewFormSelectedUsers.length === this.state.userList.length} value={'all'} onChange={() => this.handleShareUsersSelect('all')} />
                            <label htmlFor={`${this.props.analysisSavedSettings.id}-user-all`}>
                              <div className="user-avtar"></div>
                              All
                            </label>
                          </div>

                          {userList.map((user) => {
                            const selected = this.state.shareNewFormSelectedUsers.length ? this.state.shareNewFormSelectedUsers.some(u => u.id === user.id) : false;
                            const alreadyShared = this.state.sharedUsers.some(s => s.user.id === user.id);
                            return (
                              <div key={user.id} className={'option checkbox' + (alreadyShared ? ' disabled' : '')}>
                                <input id={`${this.props.analysisSavedSettings.id}-user-${user.id}`} type="checkbox" name="share-new-user" value={user.id} checked={selected} onChange={() => this.handleShareUsersSelect(user)} />
                                <label htmlFor={`${this.props.analysisSavedSettings.id}-user-${user.id}`}>
                                  <div className="user-avtar"></div>
                                  {`${user.first_name} ${user.last_name || ''}`} {alreadyShared ? '(Already shared)' : ''}
                                </label>
                              </div>
                            )
                          })}
                          {userSearchInput && !userList.length && <p className="no-match-msg">No Match Found</p>}
                        </div>
                      </div>
                    </div>
                  }

                  {this.state.userList !== null &&
                    <div className="panel-widget auths">
                      <div className="widget-header">
                        <div className="widget-title">Authorization</div>
                      </div>
                      <div className="widget-content">
                        <ul className="auth-list">
                          {['EDIT', 'COMMENT', 'SHARE', 'DELETE'].map(auth => {
                            const checked = this.state.shareNewFormSelectedAuthorizations.includes(auth);
                            // const disabled = auth === 'VIEW';
                            return (
                              <li key={auth} className={'auth-item'}>
                                <div className="option checkbox">
                                  <input id={`${this.props.analysisSavedSettings.id}-share-${auth}`} type="checkbox"
                                    checked={checked}
                                    // disabled={disabled}
                                    onChange={() => this.handleShareNewAuthSelect(auth)} />
                                  <label htmlFor={`${this.props.analysisSavedSettings.id}-share-${auth}`}>{auth[0] + auth.slice(1).toLowerCase()}</label>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                      <span></span>
                    </div>
                  }
                </>
              }
            </div>
          }
        </div>
      </>
    );
  }

  giveInsightPanelMainContent() {
    const giveUsersOfNotes = (notes) => {
      let users = [];
      notes.forEach(n => {
        if (!users.some(u => u.id === n.created_by)) {
          users.push(n.user);
        }
      });
      return users;
    };

    const usersFilters = giveUsersOfNotes(this.state.insightNotes || []);
    const editorNode = this.insightAddFormQuillDOMRef.current;
    const isQuillEditorBlank = editorNode ? editorNode.editor.root.className.includes('ql-blank') : true;
    const canComment = this.props.analysisSavedSettings.privileges.includes('COMMENT');

    return (
      <>
        <div className="main-content">
          {this.state.loadingNotes && <p>Loading Notes ...</p>}

          {!this.state.loadingNotes && this.state.insightNotes &&
            <>
              {(usersFilters.length > 0 || canComment) &&
                <div className="sticky-editor">
                  {usersFilters.length > 0 &&
                    <div className="note-avatar">
                      <div className="users-filter">
                        {usersFilters.map(user => {
                          const isSelected = this.state.insightSelectedUsersIDs.includes(user.id);
                          return <UserAvatar key={user.id} user={user} isSelected={isSelected} onClick={this.handleInsightUserFilterSelect} />
                        })}
                      </div>
                    </div>
                  }

                  {canComment &&
                    <div className="note-add-form">
                      <div className={'editor' + (isQuillEditorBlank ? ' editor-blank' : '') + (this.state.insightNoteAddInputExpanded ? ' editor-focused' : '')}>
                        <ReactQuill
                          ref={this.insightAddFormQuillDOMRef}
                          readOnly={false}
                          value={this.state.insightNoteAddForm.text}
                          onChange={this.handleInsightFormInputChange}
                          // modules={quillEditorModules}
                          onFocus={this.handleInsightFormInputFocus}
                          // onBlur={() => this.setState({ insightNoteAddInputExpanded: false })}
                          placeholder={'Add a Note'}
                        />
                        {this.state.insightNoteAddInputExpanded &&
                          <div className="submit-cancel-btns">
                            <button className="btn btn-small" onClick={this.handleInsightFormAddTagsBtn}><span>Add Tags</span></button>
                            <button className="btn btn-small" disabled={isQuillEditorBlank || this.state.insightOpertionInProgress}
                              onClick={this.handleInsightNoteSaveBtn}>
                              <i></i><span>Save</span></button>
                            <button className="btn btn-small" disabled={this.state.insightOpertionInProgress} onClick={this.handleInsightFormCancelBtn}><i></i><span>Cancel</span></button>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
              <div className="notes">
                <>
                  {this.state.insightNotes.map((note, i) => {
                    const formattedCreatedDate = giveDateTimeInString(new Date(note.created_time));
                    const noteReplies = this.state.insightNotesReplies[note.id] || [];
                    const loadingChildNotes = this.state.insightNotesRepliesLoadings[note.id] || false;
                    const isExpanded = this.state.insightNotesExpanded[note.id] || false;
                    const isReplyExpanded = this.state.insightReplyNoteId === note.id;
                    const canEditComment = canComment && note.created_by === this.user.id;


                    return (
                      <div key={i} className={'note-widget-wrapper' + (isExpanded ? ' expanded' : '') + (note.child_notes === 0 ? ' no-replies' : '')}>
                        <span className="unread-indicator"></span>
                        <div className="note-widget">

                          <div className="header">
                            {/* <span className="id">{i + 1}</span> */}
                            <UserAvatar user={note.user} />
                            <span className="name">{note.user.first_name[0].toUpperCase() + note.user.first_name.slice(1) + ' ' + (note.user.last_name[0] ? note.user.last_name[0].toUpperCase() + note.user.last_name.slice(1) : '')}</span>
                            <span className="date">{formattedCreatedDate}</span>
                            {canEditComment &&
                              <div className="note-action-btn">
                                <span className="pop-over-btn" onClick={() => this.setState({ insightOpenedOptionsNoteId: note.id })}>
                                  {this.state.insightOpenedOptionsNoteId === note.id &&
                                    <ClickOutsideListner onOutsideClick={() => this.setState({ insightOpenedOptionsNoteId: null })}>
                                      <div className="pop-over-options-wrapper">
                                        <ul className="pop-over-options">
                                          <li className={this.state.chartOrDashboardSaveInProcess ? 'disabled' : ''} onClick={(e) => { e.stopPropagation(); this.handleInsightNoteEditBtn(note.id, null) }}>Edit</li>
                                          <li className={this.state.chartOrDashboardSaveInProcess ? 'disabled' : ''} onClick={(e) => { e.stopPropagation(); this.handleInsightNoteDeleteBtn(note.id, null) }}>Delete</li>
                                        </ul>
                                      </div>
                                    </ClickOutsideListner>
                                  }
                                </span>
                              </div>
                            }
                          </div>
                          {this.state.insightEditNoteId !== note.id && <div className="content" dangerouslySetInnerHTML={{ __html: note.note }}></div>}
                          {this.state.insightEditNoteId === note.id &&
                            <div className="note-edit-form">
                              <div className={'editor editor-focused'}>
                                <ReactQuill
                                  ref={this.insightEditFormQuillDOMRef}
                                  value={this.state.insightEditNoteForm.text}
                                  onChange={this.handleInsightEditFormInputChange}
                                  placeholder={'Edit Note'}
                                />
                                <div className="submit-cancel-btns">
                                  <button className="btn btn-small" disabled={this.state.insightOpertionInProgress}
                                    onClick={() => this.handleInsightNoteSaveChangesBtn(note.parent_note_id)}>
                                    <i></i><span>Save Changes</span></button>
                                  <button className="btn btn-small" disabled={this.state.insightOpertionInProgress} onClick={() => this.setState({ insightEditNoteId: null })}><i></i><span>Cancel</span></button>
                                </div>
                              </div>
                            </div>
                          }
                          <div className={'child-note-count' + (loadingChildNotes ? ' disabled' : '')} onClick={() => this.handleInsightViewThreadBtn(note.id)}>
                            <span className="count">{`${note.child_notes > 1 ? 'Replies' : 'Reply'}`} {note.child_notes || ''}</span>
                            {loadingChildNotes && <span className="loading"></span>}
                          </div>
                        </div>

                        <div className="note-collapsible-content" >
                          <div className="note-reply-form">
                            <div className={'editor' + (isReplyExpanded ? ' editor-focused' : '')}>
                              <ReactQuill
                                ref={(element) => this.insightReplyFormsQuillDOMRefs[note.id] = element}
                                value={note.id === this.state.insightReplyNoteId ? this.state.insightReplyNoteForm.text : ''}
                                onChange={this.handleInsightReplyFormInputChange}
                                onFocus={() => this.handleInsightReplyFormInputFocus(note.id)}
                                placeholder={'Reply'}
                              />
                              {isReplyExpanded &&
                                <div className="submit-cancel-btns">
                                  <button className="btn btn-small" disabled={this.state.insightOpertionInProgress}
                                    onClick={this.handleInsightNoteReplySaveBtn}>
                                    <i></i><span>Save</span></button>
                                  <button className="btn btn-small" disabled={this.state.insightOpertionInProgress} onClick={() => this.handleInsightReplyFormCancelBtn()}><i></i><span>Cancel</span></button>
                                </div>
                              }

                            </div>
                          </div>

                          {noteReplies.length > 0 &&
                            <div className="note-replies-wrapper">
                              {noteReplies.map(noteReply => {
                                const formattedCreatedDate = giveDateTimeInString(new Date(noteReply.created_time));
                                return (
                                  <div key={noteReply.id} className="note-widget">
                                    <div className="header">
                                      <UserAvatar user={noteReply.user} />
                                      <span className="name">{noteReply.user.first_name[0].toUpperCase() + noteReply.user.first_name.slice(1) + ' ' + (noteReply.user.last_name[0] ? noteReply.user.last_name[0].toUpperCase() + noteReply.user.last_name.slice(1) : '')}</span>
                                      <span className="date">{formattedCreatedDate}</span>
                                      <div className="note-action-btn">
                                        <span className="pop-over-btn" onClick={() => this.setState({ insightOpenedOptionsNoteId: noteReply.id })}>
                                          {this.state.insightOpenedOptionsNoteId === noteReply.id &&
                                            <ClickOutsideListner onOutsideClick={() => this.setState({ insightOpenedOptionsNoteId: null })}>
                                              <div className="pop-over-options-wrapper">
                                                <ul className="pop-over-options">
                                                  <li className={this.state.insightOpertionInProgress ? 'disabled' : ''} onClick={(e) => { e.stopPropagation(); this.handleInsightNoteEditBtn(noteReply.id, note.id) }}>Edit</li>
                                                  <li className={this.state.insightOpertionInProgress ? 'disabled' : ''} onClick={(e) => { e.stopPropagation(); this.handleInsightNoteDeleteBtn(noteReply.id, note.id) }}>Delete</li>
                                                </ul>
                                              </div>
                                            </ClickOutsideListner>
                                          }
                                        </span>
                                      </div>
                                    </div>
                                    {this.state.insightEditNoteId !== noteReply.id && <div className="content" dangerouslySetInnerHTML={{ __html: noteReply.note }}></div>}
                                    {this.state.insightEditNoteId === noteReply.id &&
                                      <div className="note-edit-form">
                                        <div className={'editor editor-focused'}>
                                          <ReactQuill
                                            ref={this.insightEditFormQuillDOMRef}
                                            value={this.state.insightEditNoteForm.text}
                                            onChange={this.handleInsightEditFormInputChange}
                                            placeholder={'Reply'}
                                          />
                                          <div className="submit-cancel-btns">
                                            <button className="btn btn-small" disabled={this.state.insightOpertionInProgress}
                                              onClick={() => this.handleInsightNoteSaveChangesBtn(noteReply.parent_note_id)}>
                                              <i></i><span>Save Changes </span></button>
                                            <button className="btn btn-small" disabled={this.state.insightOpertionInProgress} onClick={() => this.setState({ insightEditNoteId: null })}><i></i><span>Cancel</span></button>
                                          </div>
                                        </div>
                                      </div>
                                    }
                                  </div>
                                );
                              })}
                            </div>
                          }
                        </div>

                      </div>
                    )
                  })}
                  {!this.state.insightNotes.length &&
                    <div className="empty-list-widget">
                      <p>Notes added to Analysis will appear here</p>
                    </div>
                  }
                </>
              </div>
            </>
          }
        </div>
      </>
    );
  }

  handleRowSelection(field, checked) {
    let selectedRows = this.state.selected_rows;
    if (checked) {
      selectedRows = [...selectedRows, field];
    } else {
      selectedRows = selectedRows.filter(r => r.title !== field.title);
    }
    this.setState({
      selected_rows: selectedRows
    }, () => this.setPanelEventLogs(this.giveCurrentValuesOfLoggedVariables()));
  }

  handleColumnSelection(field, checked) {
    let selectedCols = this.state.selected_columns;
    if (checked) {
      selectedCols = [...selectedCols, field];
    } else {
      selectedCols = selectedCols.filter(r => r.title !== field.title);
    }
    this.setState({
      selected_columns: selectedCols
    }, () => this.setPanelEventLogs(this.giveCurrentValuesOfLoggedVariables()));
  }

  handleValueSelection(field, checked) {
    let selectedValues = this.state.selected_values;
    if (checked) {
      selectedValues = [...selectedValues, field];
    } else {
      selectedValues = selectedValues.filter(r => r.title !== field.title);
    }

    this.setState({
      selected_values: selectedValues
    }, () => this.setPanelEventLogs(this.giveCurrentValuesOfLoggedVariables()));
  }


  handleFiltersSelection(field, checked) {
    let selectedFilters = [...this.state.selected_filters];
    let updatedSelectedDimensions = { ...this.state.selected_dimensions };
    if (checked) {
      selectedFilters = [...selectedFilters, field];
    } else {
      //If checked=false, also remove the its entry(if present) in the 'selected_dimesnion'
      selectedFilters = selectedFilters.filter(r => r.title !== field.title);
      delete updatedSelectedDimensions[field.title];
    }

    this.setState({
      selected_filters: selectedFilters,
      selected_dimensions: updatedSelectedDimensions
    }, () => this.setPanelEventLogs(this.giveCurrentValuesOfLoggedVariables()));
  }

  handleRowsColValReordering(listStateName, reorderedList) {
    this.setState({ [listStateName]: reorderedList });
  }

  handleDatasetTabDndDrop(dropInfo) {
    if (dropInfo.droppableId === null) {
      // dropped outside some droppable element
      // you can show some toast/alert here if needed
      return;
    }

    const draggedField = this.state.all_items.find(item => item.title === dropInfo.draggableId);
    switch (dropInfo.droppableId) {
      case 'view-1-rows':
      case 'view-2-rows': this.handleRowSelection(draggedField, true);
        break;
      case 'view-1-columns':
      case 'view-2-columns': this.handleColumnSelection(draggedField, true);
        break;
      case 'view-1-values':
      case 'view-2-values': this.handleValueSelection(draggedField, true);
        break;
      case 'view-1-filters':
      case 'view-2-filters': this.handleFiltersSelection(draggedField, true);
        break;
      default:
        break;
    }
  }

  isFieldDroppable(droppableId, draggableId) {
    switch (droppableId) {
      /**Check if draggableId field is of type 'string' and then check if it is already added to selected filters or not */
      case 'view-1-filters':
      case 'view-2-filters': return this.state.all_items.find(a => a.title === draggableId).type === 'string' && !this.state.selected_filters.some(s => s.title === draggableId);

      /**Check if draggableId field is already added to selected values or not */
      case 'view-1-values':
      case 'view-2-values': return !this.state.selected_values.some(s => s.title === draggableId);

      /**Check if draggableId field is already added to selected rows or not */
      case 'view-1-rows':
      case 'view-2-rows': return !this.state.selected_rows.some(s => s.title === draggableId);

      /**Check if draggableId field is already added to selected columns or not */
      case 'view-1-columns':
      case 'view-2-columns': return !this.state.selected_columns.some(s => s.title === draggableId);

      default: return true;
    }
  }

  giveNewCalculatedFieldForm() {
    return (
      <div id="new-calculated-field-form">
        <div className="new-calculated-form-wrapper">
          <div className="form-header">
            <h4 className="form-title">Constructor <span></span> Calculated Field</h4>
            <div className="form-close-btn" onClick={() => this.setState({ showCalculatedFieldForm: false })}></div>
          </div>

          <div className="form-content">
            <div className="field-controls">
              <div className="field-name">
                <label>Name</label>
                <input placeholder="" spellCheck="false" autoComplete="false" value={this.state.calculated_expression_name} onChange={(e) => {
                  this.setState({ calculated_expression_name: e.target.value })
                }} />
              </div>

              <div className="type">
                <SpeedSelect
                  options={CALCULATED_FIELD_TYPES}
                  selectedOption={this.state.calculated_expression_type}
                  onSelect={(type) => this.setState({ calculated_expression_type: type })}
                  displayKey='name'
                  uniqueKey='id'
                  prominentLabel='Type'
                  selectLabel='Type'
                  disableSearch={true}
                />
              </div>
              <div className="access">
                <SpeedSelect
                  options={CALCULATED_FIELD_ACCESS}
                  selectedOption={this.state.calculated_expression_access}
                  onSelect={(access) => this.setState({ calculated_expression_access: access })}
                  prominentLabel='Visible to'
                  selectLabel='Visible To'
                  disableSearch={true}
                />
              </div>
            </div>

            <div className="field-drag-drop-area">
              <DndContext onDragEnd={this.handleCalculatedFieldEditorDrop}>
                <div className="field-list">
                  <h4 className="list-title">Available Fields</h4>
                  <div className='cal-field-list'>
                    {this.state.all_items.map(item => {
                      let possibleAggregations = isCalculatedField(item) ? [] : givePossibleAggregationForField(item);
                      // dragCloneText calculation
                      // for calculated fields, keep the aggregation='calculated', not 'no_calculation'(bcz this is what needed to send in api)
                      const aggregation = this.state.calculated_expression_aggregations_by_field[item.title] === 'no_calculation' ? 'calculated' : this.state.calculated_expression_aggregations_by_field[item.title];
                      const dragCloneText = `${item.display_title} (${covertUnderscoreToSpaceInString(aggregation)})`;
                      const dragCloneStyles = { 'display': 'block', 'line-height': '24px', 'overflow': 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap', 'background-color': '#777', 'opacity': '0.8', 'font-weight': '600' };
                      return (
                        <DndDraggable key={item.title} draggableId={item.title} dragCloneText={dragCloneText} dragCloneStyles={dragCloneStyles}>
                          {(draggableProps) => (
                            <div className="field-wrapper">
                              <div className={'field ' + item.type} {...draggableProps}>
                                <div className="field_name">{item.display_title}</div>
                                {possibleAggregations.length > 0 &&
                                  <div className="field_aggregation" onClick={() => this.setState({ calculated_expression_aggregation_list_opened_field_title: item.title })}>
                                    <span>{covertUnderscoreToSpaceInString(this.state.calculated_expression_aggregations_by_field[item.title])}</span>
                                  </div>
                                }
                              </div>
                              {this.state.calculated_expression_aggregation_list_opened_field_title === item.title &&
                                <ClickOutsideListner onOutsideClick={() => this.setState({ calculated_expression_aggregation_list_opened_field_title: '' })}>
                                  <div className="field-aggregation-options">
                                    <ul className="option-list">
                                      {possibleAggregations.map(op => {
                                        const isSelected = op.id === this.state.calculated_expression_aggregations_by_field[item.title];
                                        return <li key={op.id} className={'option' + (isSelected ? ' selected' : '')}
                                          onClick={(e) => { this.setState({ calculated_expression_aggregations_by_field: { ...this.state.calculated_expression_aggregations_by_field, [item.title]: op.id } }) }}>
                                          {op.name}
                                        </li>
                                      })}
                                    </ul>
                                  </div>
                                </ClickOutsideListner>
                              }
                            </div>
                          )}
                        </DndDraggable>
                      );
                    })}
                  </div>
                </div>

                <div className="field-formula-editor">
                  <div className="formula-editor-header">
                    <span className="title">Formula Editor</span>
                    <span className="operators">
                      <SpeedSelect
                        options={CALCULATED_FIELD_OPERATORS}
                        selectedOption={null}
                        onSelect={(operator) => this.handleCalculatedFiedOperatorClick(operator)}
                        displayKey='name'
                        uniqueKey='id'
                        selectLabel='Insert Operator'
                        disableSearch={true}
                        dropdownAlignment='right'
                      />
                    </span>
                  </div>

                  <div className="formula-editor-content">
                    <DndDroppable droppableId='calculated-field-editor' draggingOverClassName="dragging-over" >
                      {(droppableProps) => (
                        <textarea value={this.state.calculated_expression_formula} ref={this.calculatedFieldFormulaRef} {...droppableProps}
                          onChange={(e) => this.setState({ calculated_expression_formula: e.target.value })}
                        ></textarea>
                      )}
                    </DndDroppable>
                  </div>

                  <div className="formula-editor-action-btns-wrapper">
                    <button className="btn btn-save-green btn-with-icon btn-small" disabled={this.state.calculated_expression_saving} onClick={this.handleCalculatedExpressionSaveAndEdit}><i></i><span>{this.state.calculated_expression_saving ? 'Please Wait...' : this.state.calculated_expression_fieldForEdit !== null ? 'Edit' : 'Save'}</span></button>
                    <button className="btn btn-delete btn-with-icon btn-small" disabled={this.state.calculated_expression_saving} onClick={this.handleCalculatedExpressionDelete}><i></i><span>{this.state.calculated_expression_deleting ? 'Deleting...' : 'Delete'}</span></button>
                    <button className="btn btn-new btn-with-icon btn-small" disabled={this.state.calculated_expression_saving} onClick={this.handleNewCalculatedFieldBtn}><i></i><span>New</span></button>
                  </div>
                </div>
              </DndContext>
            </div>

          </div>
        </div>
      </div>
    );
  }


  giveAnalysisFormContent() {
    const isNewAnalysis = this.isNewAnalysis();
    const currentFormTab = this.state.newAnalysisFormCurrentTab;
    const allAnalyisFiltersList = {...this.state.allDataSourcesDimensionsList};
    const isAllPresentationFiltersToggleON = (this.state.analysisSettings.presentation_filters !== undefined && this.state.analysisSettings.presentation_filters.length === ['period', ...Object.keys(allAnalyisFiltersList)].length);

    return (
      <div id="new-analysis-form-container">
        <div className="form-wrapper">
          <div className="form-tabs">
            <div className="form-title">{isNewAnalysis ? 'File Settings' : 'File Settings'}</div>
            <div className="form-tab-list">
              <div className={'form-tab' + (currentFormTab === 'setting' ? ' selected' : '')} onClick={() => this.handleAnalysisFormTabSelect('setting')}>File Information</div>
              <div className={'form-tab' + (currentFormTab === 'presentation' ? ' selected' : '')} onClick={() => this.handleAnalysisFormTabSelect('presentation')}>View Mode</div>
            </div>
          </div>

          <div className="form-content">
            {currentFormTab === 'setting' &&
              <div className="content-setting">
                {this.isAnalysisInEditMode() &&
                  <>
                    <div className="name field-with-label">
                      <label>Name</label>
                      <input className="field-control"
                        value={this.state.analysisSettings.name}
                        onChange={(e) => this.handleAnalysisSettingsChange('name', e.target.value)}
                      />
                      <span className="char-count">{`${this.state.analysisSettings.name.length}/${MAX_NAME_CHAR}`}</span>
                    </div>

                    <div className="description field-with-label">
                      <label>Description</label>
                      <textarea rows="1" className="field-control textarea"
                        value={this.state.analysisSettings.description}
                        onChange={(e) => this.handleAnalysisSettingsChange('description', e.target.value)}
                      ></textarea>
                      <span className="char-count">{`${this.state.analysisSettings.description.length}/${MAX_DESCRIPTION_CHAR}`}</span>
                    </div>
                  </>
                }
              </div>
            }


            {currentFormTab === 'presentation' &&
              <div className="content-presentation">
                <div className="info-msg"><i></i> <span>Customise dashboard appears while viewing.</span></div>

                <div className="filters">
                  <h4>Filters</h4>
                  <div className="show-all-btn">
                    <Checkbox uniqueHtmlForKey={`d-${this.props.analysisSavedSettings.id}-showall-filters`} label={'Show All'} checked={isAllPresentationFiltersToggleON} onChange={(e) => { this.handleAnalysisPresentationFiltersShowAll(e.target.checked, ['period', ...Object.keys(allAnalyisFiltersList)]) }} />
                  </div>
                  
                  <div className="toggles">
                    {['period', ...Object.keys(allAnalyisFiltersList)].map((filter, i) => {
                      let displayName = filter === 'os' ? 'OS' : covertUnderscoreToSpaceInString(filter);
                      const selected = this.state.analysisSettings.presentation_filters.includes(filter);
                      return (
                        <div key={i} className={'switch-toggle small'}>
                          <div className="label">{displayName}</div>
                          <div className="switch">
                            <input type="checkbox" checked={selected} onChange={() => this.handleAnalysisPresentationFiltersToggle(filter)} />
                            <label></label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            }
          </div>

          {!isNewAnalysis && <div className="wrapper-close-btn" onClick={this.handleAnalysisFormCloseBtn}></div>}
        </div>

        <div className="form-bottom">
          <div className="save-next-btns">
            <button className="btn btn-large btn-save" disabled={this.state.analysisSettings.name.trim() === '' || this.state.analysisSaveInProcess} onClick={this.handleAnalysisSaveBtn}>{isNewAnalysis ? 'Create' : 'Save'}</button>
          </div>
        </div>
      </div>
    );
  }



  //Back to Home Button
  handleBackToAnalysisHome(event) {
    this.props.history.push('/' + this.state.terminal_type + '/datagrid');
  }

  //Convert Bytes to KB
  convertByteToKB(bytes) {
    return (bytes / 1024).toFixed(1);
  }

  //Get current date time for file to download
  getFormattedTime() {
    var today = new Date();
    var y = today.getFullYear();
    var m = today.getMonth() + 1;
    var d = today.getDate();
    var h = today.getHours();
    var mi = today.getMinutes();
    var s = today.getSeconds();
    return y + '' + m + '' + d + "-" + h + mi + s;
  }

  //Download Analysis View
  handleDownloadView_UNUSED(event, type) {
    event.preventDefault();
    var start_date = this.formatDate(this.state.selectedDateRanges[0][0], 'MM.DD.YYYY');
    var end_date = this.formatDate(this.state.selectedDateRanges[0][1], 'MM.DD.YYYY');
    var formatted_date_range = start_date + '-' + end_date;
    let report_name = this.state.view_type + '_' + formatted_date_range + '_' + Date.now();

    this.setState({ toggleDownloadOptions: false }, () => {
      if (type === 'filtered_data_inview') {
        let curr_datetime = this.getFormattedTime();
        let fileTitle = 'sight_analysis_' + curr_datetime; // or 'my-unique-title'

        this.exportCSVFile(this.state.analysisColumns, this.state.analysisData, fileTitle); // call the exportCSVFile() function to process the JSON and trigger the download

      } else if (type === 'unfiltered_data') {
        let download_api_url = Constants.API_BASE_URL + '/downloadAnalysisData/?analysisid=' + this.state.analysisid + '&reportname=' + report_name + '&type=unfiltered_data';
        this.handleDownloadReport(download_api_url);

      } else if (type === 'filtered_data_all') {
        let inputData = JSON.stringify({ ...this.getAnalysisDataPayload() });
        this.handleDownloadReport(Constants.API_BASE_URL + '/downloadAnalysisData/?inputdata=' + inputData + '&reportname=' + report_name + '&type=saved_format');
      }
    });

    return false;
  }

  //Download Report File
  handleDownloadReport(download_url) {
    APIService.apiRequest(download_url, null, false, 'GET', this.controller)
      .then(response => {
        if (response.status === 1 && response.url !== '') {
          var file_download_url = response.url + '&user_id=' + this.user.id;
          window.open(file_download_url, "_blank");
        }
      })
      .catch(err => { });
  }

  //Toggle Donwload Options
  handleDownloadToggle_UNUSED(event) {
    this.setState({ toggleDownloadOptions: !this.state.toggleDownloadOptions });
  }

  convertToCSV(objArray, isPeriodComparisonEnabled, showBenchmarkInGrid, selected_columns) {
    var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    var str = '';
    var filteredArr = [];

    //If show benchmark switch toggle is not on, skip benchmar columns
    if (!showBenchmarkInGrid) {
      array.forEach((row) => {
        let newRow = [];
        let colKeys = (typeof row === 'object') ? Object.keys(row) : row;
        if (!showBenchmarkInGrid) {
          colKeys = colKeys.filter((item) => !item.includes("benchmark"))
        }

        //append filterd columns (which doesn't include benchmark string)
        colKeys.forEach((item, i) => {
          newRow.push(row[item]);
        });

        filteredArr.push(newRow);
      });
    } else { //show all columns (including benchmark)
      filteredArr = array;
    }


    //generate row as string to generate csv
    for (var i = 0; i < filteredArr.length; i++) {
      var line = '';
      for (var index in filteredArr[i]) {
        if (line != '') line += ','
        if (isPeriodComparisonEnabled && typeof filteredArr[i][index] === 'object') {
          line += (typeof filteredArr[i][index].data === 'string' && filteredArr[i][index].data.includes(',')) ? '"' + filteredArr[i][index].data + '"' : filteredArr[i][index].data; //wrap string to double quotes if values contians comma
          if (showBenchmarkInGrid) {
            line += (!index.includes("benchmark") ? '  (' + filteredArr[i][index].change + '%)' : '');
          } else {
            line += '  (' + filteredArr[i][index].change + '%)';
          }
        } else {
          if (typeof filteredArr[i][index] === 'string' && filteredArr[i][index].includes(',')) {
            line += '"' + filteredArr[i][index] + '"';
          } else {
            line += filteredArr[i][index];
          }
        }
      }
      str += line + '\r\n';
    }

    return str;
  }

  exportCSVFile(headers, items, fileTitle) {
    let formattedHeader = [];
    let formattedRows = [];

    // Handle sub level nested rows
    items.forEach((item, i) => {
      addNestedLevel(item);
    });

    //Remove has_sub_lebel key after being used
    formattedRows.forEach((item, i) => {
      delete item['has_sub_level'];
    });

    function addNestedLevel(item) {
      formattedRows.push(item);

      if (item.has_sub_level !== undefined) {
        item.has_sub_level.forEach((subitem, j) => {
          addNestedLevel(subitem)
        });
      }
    }

    //Add headers
    if (headers) {
      if (Array.isArray(headers[0])) {
        headers.forEach((item, i) => {
          //Period Comparison Specific
          if (this.state.isPeriodComparisonEnabled) {
            if (!this.state.showBenchmarkInGrid && item[2] === 'benchmark') return;
            if (item[2] === 'benchmark') {
              item = [item[0], item[item.length - 1] + ' (Benchmark)'];
            } else {
              item = [item[0], item[item.length - 1]];
            }
          }

          item.forEach((subitem, j) => {
            if (formattedHeader[j] === undefined) formattedHeader[j] = [];
            let val = (subitem === '') ? ' ' : subitem;
            formattedHeader[j].push(val);
          });
        });

        formattedHeader.reverse();
        formattedHeader.forEach((item, i) => {
          formattedRows.unshift(item);
        });
      } else {
        formattedHeader = JSON.parse(JSON.stringify(headers));
        formattedRows.unshift(formattedHeader);
      }
    }


    // Convert Object to JSON
    var jsonObject = JSON.stringify(formattedRows);
    var csv = this.convertToCSV(jsonObject, this.state.isPeriodComparisonEnabled, this.state.showBenchmarkInGrid, this.state.selected_columns);
    var exportedFilenmae = fileTitle + '.csv' || 'export.csv';
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
      navigator.msSaveBlob(blob, exportedFilenmae);
    } else {
      var link = document.createElement("a");
      if (link.download !== undefined) { // feature detection
        // Browsers that support HTML5 download attribute
        var url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", exportedFilenmae);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  }

  //Swtich toggle for period comparision
  handlePeriodComaparisonToggle(checked) {
    let dateRanges;
    let updatedConditionalFormatTypes = [];
    if (checked) {
      // if period comparison has been swithed on, clear the dateRanges
      dateRanges = [this.state.selectedDateRanges[0], [null, null]];
      updatedConditionalFormatTypes = [{ 'id': 'standard', 'name': 'Standard' }, { 'id': 'period_comparison', 'name': 'Period Comparison' }];
    } else {
      // reset the dateRanges 
      // reset the selectedDateRanges with the range = last 30 days from last_update_date 
      // const strtDate = moment(this.state.lastUpdatedDateObj).subtract((29), 'days').toDate();
      // const dateRange = [strtDate, this.state.lastUpdatedDateObj];
      dateRanges = [this.state.selectedDateRanges[0]];
      updatedConditionalFormatTypes = [{ 'id': 'standard', 'name': 'Standard' }];
    }

    // keep only values and date
    const selectedCols = [
      { id: 'values', title: 'values', display_title: 'Values', type: 'string' },
      { id: 'date_1', title: 'date', display_title: 'Date', type: 'date' }
    ];

    let stateObj = {
      isPeriodComparisonEnabled: !this.state.isPeriodComparisonEnabled,
      periodComparisonPreselect: PERIOD_COMPARISON_PRESELECT_OPTIONS[0],
      selectedDateRanges: dateRanges,
      selected_columns: selectedCols,
      conditionalFormatTypes: updatedConditionalFormatTypes,
      benchmarkRangeIndex: checked ? 1 : 0
    };


    // keep first value which is not date or month
    if (this.state.terminal_type !== 'klay_media') {
      let selectedRows = this.state.all_items.find(item => item.type === 'string');
      selectedRows.id = selectedRows.id + '_1'; // change the id
      stateObj['selected_rows'] = [selectedRows];
    }

    this.setState(stateObj, () => {
      // Insert an entry in panelEventLogs
      this.setPanelEventLogs(this.giveCurrentValuesOfLoggedVariables());
    });
  }

  // Switch toggle for ShowBenchmarkInGrid 
  handleShowBenchmarkInGridChange() {
    this.setState({
      showBenchmarkInGrid: !this.state.showBenchmarkInGrid,
    }, () => {
      // Insert an entry in panelEventLogs
      this.setPanelEventLogs(this.giveCurrentValuesOfLoggedVariables());
    });
  }

  // Select the period comparison Preselect from dropdown
  handlePeriodComaprisonPreselect(preselectOption) {
    const ranges = this.state.selectedDateRanges;
    const firstRange = ranges[0];
    let secondRangeUpdated = null;

    this.setState({ periodComparisonPreselect: preselectOption });
    // Check if there is need of resetting the secondRange
    if (firstRange && firstRange[0] && firstRange[1]) {
      secondRangeUpdated = this.calculateSecondRangeOfPeriodComparison(firstRange, preselectOption.id);
      secondRangeUpdated = secondRangeUpdated || ranges[1] || [null, null];
      this.setState({ selectedDateRanges: [firstRange, secondRangeUpdated] });
    }
    // When any preselect other than 'CUSTOM' is selected, force benchmarkIndex to be 1 and benchmark checkbox will be disabled
    this.setState({
      benchmarkRangeIndex: preselectOption.id === 'CUSTOM' ? 1 : 1
    }, () => {
      // Insert an entry in panelEventLogs
      this.setPanelEventLogs(this.giveCurrentValuesOfLoggedVariables());
    });

  }

  calculateSecondRangeOfPeriodComparison(firstRange, preselect) {
    if (preselect === 'CUSTOM') return null;
    const dayCount = giveDaysCountInRange(firstRange[0], firstRange[1]);
    let dSrt, dEnd;
    switch (preselect) {
      case 'DOD':
        dSrt = new Date(firstRange[0].getFullYear(), firstRange[0].getMonth(), firstRange[0].getDate() - 1);
        dEnd = new Date(dSrt.getFullYear(), dSrt.getMonth(), dSrt.getDate() + dayCount - 1);
        break;
      case 'WOW':
        dSrt = new Date(firstRange[0].getFullYear(), firstRange[0].getMonth(), firstRange[0].getDate() - 7);
        dEnd = new Date(dSrt.getFullYear(), dSrt.getMonth(), dSrt.getDate() + dayCount - 1);
        break;
      case 'MOM': dSrt = new Date(firstRange[0].getFullYear(), firstRange[0].getMonth() - 1, firstRange[0].getDate());
        dEnd = new Date(dSrt.getFullYear(), dSrt.getMonth(), dSrt.getDate() + dayCount - 1);
        break;
      case 'QOQ':
        dSrt = new Date(firstRange[0].getFullYear(), firstRange[0].getMonth() - 3, firstRange[0].getDate());
        dEnd = new Date(dSrt.getFullYear(), dSrt.getMonth(), dSrt.getDate() + dayCount - 1);
        break;
      case 'YOY':
        dSrt = new Date(firstRange[0].getFullYear() - 1, firstRange[0].getMonth(), firstRange[0].getDate());
        dEnd = new Date(dSrt.getFullYear(), dSrt.getMonth(), dSrt.getDate() + dayCount - 1);
        break;
      default:
        // Should not be executed 
        dSrt = firstRange[0];
        dEnd = new Date(dSrt.getFullYear(), dSrt.getMonth(), dSrt.getDate() + dayCount);
        break;
    }
    return [dSrt, dEnd];
  }


  //Handle conditional formatting selection
  handleConditionalFormattingSelect(e, type, i) {
    let updatedConditionalFormatting = JSON.parse(JSON.stringify(this.state.tempConditionalFormatting));
    let selectFields = ['format_type', 'cell_value', 'condition'];
    if (selectFields.includes(type)) {
      updatedConditionalFormatting[i][type] = e;
    } else {
      let numTest = /^[0-9.\-\b]+$|^$/
      if ((type === 'value1' || type === 'value2') && !numTest.test(e.target.value)) {
        return;
      }
      updatedConditionalFormatting[i][type] = e.target.value;
    }

    //reset condition formatting input wrapper width to 0 so that you can get original changed width
    // let restCondtionalFormattingInputWrapperWidths = [0]
    // if (this.state.condtionalFormattingInputWrapperWidths.length > 0) {
    //   restCondtionalFormattingInputWrapperWidths = [...this.state.condtionalFormattingInputWrapperWidths];
    //   restCondtionalFormattingInputWrapperWidths[i] = 0;
    // }

    this.setState({
      tempConditionalFormatting: updatedConditionalFormatting,
      // condtionalFormattingInputWrapperWidths: restCondtionalFormattingInputWrapperWidths
    }, () => {
      //set condition formatting input wrapper width
      // let newCondtionalFormattingInputWrapperWidths = [...this.state.condtionalFormattingInputWrapperWidths];
      // newCondtionalFormattingInputWrapperWidths[i] = document.getElementById('col-inputs-' + i).offsetWidth;
      // this.setState({
      //   condtionalFormattingInputWrapperWidths: newCondtionalFormattingInputWrapperWidths
      // });

      // Insert an entry in panelEventLogs
      this.setPanelEventLogs(this.giveCurrentValuesOfLoggedVariables());
    });
  }

  //Handle color picker selection
  handleColorPickerSelect(type, i, color) {
    let updatedConditionalFormatting = JSON.parse(JSON.stringify(this.state.tempConditionalFormatting));
    updatedConditionalFormatting[i][type] = color;
    if (type === 'background') {
      updatedConditionalFormatting[i]['display_background_picker'] = false;
    } else {
      updatedConditionalFormatting[i]['display_fontcolor_picker'] = false;
    }

    this.setState({
      tempConditionalFormatting: updatedConditionalFormatting,
    }, () => {
      // Insert an entry in panelEventLogs
      this.setPanelEventLogs(this.giveCurrentValuesOfLoggedVariables());
    });
  }

  //Handle Add New Conditional Formatting
  handleAddNewConditionalFormatting(e) {
    let updatedConditionalFormatting = JSON.parse(JSON.stringify(this.state.tempConditionalFormatting));
    updatedConditionalFormatting.push({ 'format_type': this.defaultConditionalFormatTypes[0], 'cell_value': [], 'condition': '', 'value1': '', 'value2': '', 'color': '#ffffff', 'background': '#000000' });
    let updatedConditionalColorsRefs = [...this.state.conditionalColorsRefs];
    updatedConditionalColorsRefs.push({ 'bg': React.createRef(), 'color': React.createRef() });

    //set condition formatting input wrapper width
    // let newCondtionalFormattingInputWrapperWidths = JSON.parse(JSON.stringify(this.state.condtionalFormattingInputWrapperWidths));
    // let maxWidth = Math.max(...this.state.condtionalFormattingInputWrapperWidths);
    // newCondtionalFormattingInputWrapperWidths.push(maxWidth);

    this.setState({
      tempConditionalFormatting: updatedConditionalFormatting,
      conditionalColorsRefs: updatedConditionalColorsRefs,
      // condtionalFormattingInputWrapperWidths: newCondtionalFormattingInputWrapperWidths
    }, () => {
      // Insert an entry in panelEventLogs
      this.setPanelEventLogs(this.giveCurrentValuesOfLoggedVariables());
    });
  }

  //Handle Remove New Conditional Formatting
  handleRemoveNewConditionalFormatting(e, index) {
    let updatedConditionalFormatting = JSON.parse(JSON.stringify(this.state.tempConditionalFormatting));
    let updatedConditionalColorsRefs = [...this.state.conditionalColorsRefs];
    // let newCondtionalFormattingInputWrapperWidths = JSON.parse(JSON.stringify(this.state.condtionalFormattingInputWrapperWidths));
    updatedConditionalFormatting.splice(index, 1);
    updatedConditionalColorsRefs.splice(index, 1);
    // newCondtionalFormattingInputWrapperWidths.splice(index, 1);

    this.setState({
      tempConditionalFormatting: updatedConditionalFormatting,
      conditionalColorsRefs: updatedConditionalColorsRefs,
      // condtionalFormattingInputWrapperWidths: newCondtionalFormattingInputWrapperWidths
    }, () => {
      // Insert an entry in panelEventLogs
      this.setPanelEventLogs(this.giveCurrentValuesOfLoggedVariables());
    });
  }

  //Handle condition formatting submit
  renderTempFormatting() {
    // Filter and assign only the completely filled formattings
    this.setState({
      conditionalFormatting: this.state.tempConditionalFormatting.filter(frmt => {
        if (frmt.format_type === '' || frmt.cell_value.length === 0 || frmt.condition === '' || frmt.background === '' || frmt.color === '') { return false; }
        if (frmt.format_type.id === 'empty') { return true; }
        else if (frmt.format_type.id === 'between') { return frmt.value1 !== '' && frmt.value2 !== '' }
        else { return frmt.value1 !== ''; }
      }),
    });

    /**Clear unneeded logs from here bcz this method(renderTempFormatting) will be called every time RUN is pressed (except one case which is handled in 'handleAnalysisFiltersRun') */
    this.clearUnneededLogsAndUpdateLastExecutedLog();
    this.appendTempPanelEventLogs();
  }


  //Hanle Color Input Changes
  handleColorPickerClick(type, i) {
    this.state.conditionalColorsRefs[i][type].current.click();
  }

  //Handle BG/Font Color Picker show.hide
  handleToggleColorPicker(e, type, i) {
    if (e !== undefined && e.target.className === 'color') return;
    let updatedConditionalFormatting = JSON.parse(JSON.stringify(this.state.tempConditionalFormatting));
    updatedConditionalFormatting[i]['display_' + type + '_picker'] = !updatedConditionalFormatting[i]['display_' + type + '_picker'];

    this.setState({ tempConditionalFormatting: updatedConditionalFormatting })
  }

  giveISOFormattedDateRange([sDate, eDate]) {
    return [
      sDate.getFullYear() + '-' + (sDate.getMonth() + 1 < 10 ? '0' + (sDate.getMonth() + 1) : sDate.getMonth() + 1) + '-' + (sDate.getDate() < 10 ? '0' + sDate.getDate() : sDate.getDate()),
      eDate.getFullYear() + '-' + (eDate.getMonth() + 1 < 10 ? '0' + (eDate.getMonth() + 1) : eDate.getMonth() + 1) + '-' + (eDate.getDate() < 10 ? '0' + eDate.getDate() : eDate.getDate())
    ];
  }

  //Save Analysis Settings to DB
  saveSettingsToServer() {
    const saveConfig = this.giveConfig('current');
    console.log('---------SAVE CONFIG');
    console.log(saveConfig);

    // dynamic_time_period calculation to keep date ranges in desired format
    let firstRFormatted = this.state.selectedDateRanges[0] && this.state.selectedDateRanges[0][0] && this.state.selectedDateRanges[0][1] ? this.giveISOFormattedDateRange(this.state.selectedDateRanges[0]) : null;
    if (firstRFormatted === null) {
      // user might have not selected any range or cleared pre existing range
      // But,we can not save null dates in any of the ranges, hence save last 7 days from lastUpdatedDate
      const lastUpdated = this.state.lastUpdatedDateObj;
      const prev7thDate = new Date(lastUpdated.getFullYear(), lastUpdated.getMonth(), lastUpdated.getDate() - 6);
      firstRFormatted = this.giveISOFormattedDateRange([prev7thDate, lastUpdated]);
    }
    const dynamicTimePeriod = {
      is_dynamic: this.state.isSelectedDateRangeDynamic,
      value: {firstRange: firstRFormatted}
    };
    if (this.state.isPeriodComparisonEnabled) {
      let secondRFormatted = this.state.selectedDateRanges[1] && this.state.selectedDateRanges[1][0] && this.state.selectedDateRanges[1][1] ? this.giveISOFormattedDateRange(this.state.selectedDateRanges[1]) : null;
      if (secondRFormatted === null) {
        // Here calculate secondRange based on current selected preselect
        const preselect = saveConfig.period_comparison_preselect.id === 'CUSTOM' ? 'DOD' : saveConfig.period_comparison_preselect.id;
        const secondR = this.calculateSecondRangeOfPeriodComparison([new Date(firstRFormatted[0]), new Date(firstRFormatted[1])], preselect)
        secondRFormatted = this.giveISOFormattedDateRange(secondR);
      }
      dynamicTimePeriod['value']['secondRange'] = secondRFormatted;
    }
    const payload = {
      id: this.props.analysisSavedSettings.id,
      config: JSON.stringify({ saveConfig }),
      view_type: this.state.view_type,
      dynamic_time_period: JSON.stringify(dynamicTimePeriod),
    }


    APIService.apiRequest(Constants.API_BASE_URL + '/saveAnalysisView', payload, false, 'PUT', this.controller)
      .then(response => {
        if (response.status === 1) {
          console.log(`AUTO SAVE SUCCESS`);
        } else {
          console.log(`AUTO SAVE FAILED`);
          console.log('FAIL REASON : ', response.message);
        }
      })
      .catch(err => {
        console.log(`AUTO SAVE FAILED`);
        console.log('FAIL REASON : ', err.message);
      });

  }

  /**Returns the initial or current values of some state variables which are required to be saved in config
   * For this, panelEventLogs is used.
   */
  giveConfig(currentOrInitial = 'current') {
    // const logIndex = currentOrInitial === 'current' ? this.state.panelEventLogs.length - 1 : 0;
    // const stateObj = this.state.panelEventLogs[logIndex] || null;
    // if (stateObj === null) { return {} }
    const stateObj = {...this.state};
    return {
      rows: stateObj.selected_rows,
      columns: stateObj.selected_columns,
      values: stateObj.selected_values,
      filters: stateObj.selected_dimensions,
      view_type: stateObj.view_type,
      // calendar related settings
      selected_date_ranges: stateObj.selectedDateRanges,
      period_comparison_enabled: stateObj.isPeriodComparisonEnabled,
      period_comparison_preselect: stateObj.periodComparisonPreselect,
      period_comparison_groupby: stateObj.periodComparisonGroupBy,
      show_benchmark_period: stateObj.showBenchmarkInGrid,
      selected_benchmark_index: stateObj.benchmarkRangeIndex,
      conditional_formatting: stateObj.tempConditionalFormatting,
      presentation_filters: stateObj.analysisSettings.presentation_filters
    }
  }

  /**Based on the column name, add some prefix or post fix or commas to cellValue*/
  giveFormattedCellValueInReactDivTable(colNameKey, cellValue) {
    const selectedValues = this.state.selected_values;
    const selectedValueForCol = selectedValues.find(val => {
      const keyToSearchInColName = (isCalculatedField(val) ? 'sum' : val.default_action) + ' ' + val.title;
      return colNameKey.includes(keyToSearchInColName);
    })
    let formattedCellValue = cellValue;
    // apply 'selectedValueForCol' check as in some renders, selectedValueForCol may be undefined
    if (selectedValueForCol) {

      // Check for applying commas 
      if (selectedValueForCol.type === 'number' || selectedValueForCol.type === 'currency') {
        formattedCellValue = numberWithCommas(cellValue);
      }

      const action = selectedValueForCol.default_action;
      const show_as = selectedValueForCol.default_show_as;
      // Now, check for applying $(prefix) or %(postfix) 
      if (selectedValueForCol.type === 'currency' && show_as === 'no_calculation') {
        // But do check here if there are some cases( some values of val.default_action) for which '$' is not needed
        if (action !== 'count' && action !== 'nunique' && action !== 'var') {
          formattedCellValue = '$' + formattedCellValue;
        }
      } else if (selectedValueForCol.type === 'percent' && show_as === 'no_calculation') {
        formattedCellValue = formattedCellValue + '%';
      }

      // Now check for %(postfix) based on the other values of val.default_show_as
      if (selectedValueForCol.default_show_as === 'percentage_of_row_total' || selectedValueForCol.default_show_as === 'percentage_of_column_total' || selectedValueForCol.default_show_as === 'percentage_of_grand_total') {
        formattedCellValue = formattedCellValue + '%';
      }

    }
    return formattedCellValue;
  }


  /*******************************
   * Share - Functions
   */
  getSharedUsersList() {
    this.setState({ loadingSharedUsers: true });
    APIService.apiRequest(Constants.API_BASE_URL + `/data_grid/share/${this.props.analysisSavedSettings.id}`, {}, false, 'GET', this.controller)
      .then(response => {
        if (response.status === 1) {
          // remove self from sharedUser list
          this.setState({
            sharedUsers: response.data.filter(s => s.user.id !== this.user.id),
            loadingSharedUsers: false,
            shareShowNewForm: false
          });
        } else {
          this.setState({ loadingSharedUsers: false });
        }
      })
      .catch(err => {
        this.setState({ loadingSharedUsers: false })
        console.log('Error occured in fetching shared user list ' + err.message);
      });
  }

  handleShareNewBtnClick() {
    this.setState({ shareShowNewForm: true });
    if (!this.state.organisationList) {
      this.getOrganisationList();
    } else {
      // organisation list already available, just select the first organisation by default and fetch the user of that organisation
      this.setState({
        shareNewFormSelectedOrganisationId: this.state.organisationList[0].id
      });
      if (!this.state.userList) {
        this.getUserListOfOrganisation(this.state.organisationList[0].id);
      }
    }
  }

  getOrganisationList() {
    this.setState({ loadingOrganisations: true });
    APIService.apiRequest(Constants.API_BASE_URL + '/getOrganizationsList', {}, false, 'GET', this.controller)
      .then(response => {
        if (response.status === 1) {
          this.setState({ organisationList: response.data, shareNewFormSelectedOrganisationId: response.data[0].id, loadingOrganisations: false });
          this.getUserListOfOrganisation(response.data[0].id);
        } else {
          this.setState({ loadingOrganisations: false });
        }
      })
      .catch(err => {
        this.setState({ loadingOrganisations: false })
        console.log('Error occured in fetching organisation list ' + err.message);
      });
  }

  getUserListOfOrganisation(orgId) {
    this.setState({ loadingUsers: true });
    APIService.apiRequest(Constants.API_BASE_URL + `/getUsers/${orgId}`, {}, false, 'GET', this.controller)
      .then(response => {
        if (response.status === 1) {
          this.setState({
            loadingUsers: false,
            shareNewUserSearch: '',
            // remove self from user list
            userList: response.data.filter(u => u.id !== this.user.id),
          });
        } else {
          this.setState({ loadingUsers: false });
        }
      })
      .catch(err => {
        this.setState({ loadingUsers: false })
        console.log('Error occured in fetching organisation list: ' + err.message);
      });
  }

  handleShareOrganisationSelect(orgId) {
    this.setState({ shareNewFormSelectedOrganisationId: orgId, shareNewFormSelectedUsers: [] });
    // fetch the user for selected organisation 
    this.getUserListOfOrganisation(orgId);
  }

  handleShareUsersSelect(user) {
    const currSelectedUsers = this.state.shareNewFormSelectedUsers;
    let newSelectedUsers = [];
    if (user !== 'all') {
      newSelectedUsers = currSelectedUsers.some(u => u.id === user.id) ? currSelectedUsers.filter(u => u.id !== user.id) : [...currSelectedUsers, user];
    } else {
      newSelectedUsers = currSelectedUsers.length === this.state.userList.length ? [] : [...this.state.userList];
    }

    this.setState({ shareNewFormSelectedUsers: newSelectedUsers });
  }

  handleShareNewAuthSelect(auth) {
    const currAuths = this.state.shareNewFormSelectedAuthorizations;
    const newAuths = currAuths.includes(auth) ? currAuths.filter(a => a !== auth) : [...currAuths, auth];
    this.setState({ shareNewFormSelectedAuthorizations: newAuths });
  }

  handleShareNewFormSubmit() {
    if (!this.state.shareNewFormSelectedOrganisationId) {
      alertService.showToast('error', 'Please select an Organisation');
      return;
    }
    if (this.state.shareNewFormSelectedUsers.length === 0) {
      alertService.showToast('error', 'Users must be selected');
      return;
    }

    let payload = {
      analysis_id: this.props.analysisSavedSettings.id,
      privileges: this.state.shareNewFormSelectedAuthorizations.toString(),
      user_ids: this.state.shareNewFormSelectedUsers.map(user => user.id),
    };

    this.setState({ shareOpertionInProgress: true });
    APIService.apiRequest(Constants.API_BASE_URL + '/data_grid/share', payload, false, 'POST', this.controller)
      .then(response => {
        if (response.status === 1) {
          alertService.showToast('success', 'Analysis shared successfully');
          this.setState({
            shareOpertionInProgress: false,
            // reset form variables
            shareNewFormSelectedOrganisationId: null,
            shareNewFormSelectedUsers: [],
            shareNewFormSelectedAuthorizations: ['VIEW'],
          }, () => {
            // Refresh the share list
            this.getSharedUsersList();
          });
        } else {
          this.setState({ shareOpertionInProgress: false });
        }
      })
      .catch(err => {
        this.setState({ shareOpertionInProgress: false })
        console.log('Error occured in Sharing Analysis: ' + err.message);
      });
  }

  handleShareNewFormReset() {
    this.setState({
      // reset form variables
      shareNewFormSelectedOrganisationId: this.state.organisationList[0].id,
      shareNewFormSelectedUsers: [],
      shareNewFormSelectedAuthorizations: ['VIEW'],
      shareNewOrgSearch: '',
      shareNewUserSearch: '',
    });
  }

  handleShareEditBtn(shareInfo) {
    this.setState({
      shareEditUserInfo: shareInfo,
      shareEditSelectedAuthorizations: shareInfo.privileges.split(','),
    });
  }

  handleShareEditAuthSelect(auth) {
    const currAuths = this.state.shareEditSelectedAuthorizations;
    const newAuths = currAuths.includes(auth) ? currAuths.filter(a => a !== auth) : [...currAuths, auth];
    this.setState({ shareEditSelectedAuthorizations: newAuths });
  }

  handleShareEditCancelBtn() {
    this.setState({
      shareEditUserInfo: null,
    });
  }

  handleShareEditSubmitBtn() {
    let payload = {
      analysis_id: this.props.analysisSavedSettings.id,
      privileges: this.state.shareEditSelectedAuthorizations.toString(),
      user_ids: [this.state.shareEditUserInfo.user.id],
    };

    this.setState({ shareOpertionInProgress: true });
    APIService.apiRequest(Constants.API_BASE_URL + '/data_grid/share', payload, false, 'PUT', this.controller)
      .then(response => {
        if (response.status === 1) {
          alertService.showToast('success', 'Access edited successfully');
          const updatedState = {};
          // update the sharedInfo in sharedUser list
          updatedState.sharedUsers = this.state.sharedUsers.map(u => {
            if (u.user.id === payload.user_ids[0]) {
              return {
                ...u,
                privileges: payload.privileges,
              };
            }
            return u;
          });
          // reset some other variables
          updatedState.shareOpertionInProgress = false;
          updatedState.shareEditUserInfo = null;
          updatedState.shareEditSelectedAuthorizations = [];

          this.setState(updatedState);
        } else {
          this.setState({ shareOpertionInProgress: false });
        }
      })
      .catch(err => {
        this.setState({ shareOpertionInProgress: false })
        console.log('Error occured in Editing share config: ' + err.message);
      });
  }

  handleShareEditDeleteBtn(shareId) {
    this.setState({ shareOpertionInProgress: true });
    APIService.apiRequest(Constants.API_BASE_URL + `/data_grid/share/${shareId}`, {}, false, 'DELETE', this.controller)
      .then(response => {
        if (response.status === 1) {
          alertService.showToast('success', 'Access Revoked successfully');
          this.setState({
            sharedUsers: this.state.sharedUsers.filter(s => s.id !== shareId),
            shareOpertionInProgress: false,
            shareEditPopupUserID: null
          });
        } else {
          this.setState({ shareOpertionInProgress: false });
        }
      })
      .catch(err => {
        this.setState({ shareOpertionInProgress: false })
        console.log('Error occured in Revoking share : ' + err.message);
      });
  }

  /*******************************
   * Insights - Functions
   */
  getInsightNotes() {
    this.setState({ loadingNotes: true });

    APIService.apiRequest(Constants.API_BASE_URL + `/data_grid/note/${this.props.analysisSavedSettings.id}`, {}, false, 'GET', this.controller)
      .then(response => {
        if (response.status === 1) {
          this.setState({
            insightNotes: response.data,
            loadingNotes: false,
          });
        } else {
          this.setState({ loadingNotes: false });
        }
      })
      .catch(err => {
        this.setState({ loadingNotes: false });
      });
  }

  getInsightChildNotes(parentNoteId) {
    return new Promise((resolve, reject) => {
      this.setState({ insightNotesRepliesLoadings: { ...this.state.insightNotesRepliesLoadings, [parentNoteId]: true } });

      APIService.apiRequest(Constants.API_BASE_URL + `/data_grid/note/${this.props.analysisSavedSettings.id}?parent_note_id=${parentNoteId}`, {}, false, 'GET', this.controller)
        .then(response => {
          if (response.status === 1) {
            this.setState({
              insightNotesReplies: { ...this.state.insightNotesReplies, [parentNoteId]: response.data },
              insightNotesRepliesLoadings: { ...this.state.insightNotesRepliesLoadings, [parentNoteId]: false },
              insightNotesExpanded: { ...this.state.insightNotesExpanded, [parentNoteId]: true }

            });
            resolve();
          } else {
            this.setState({
              insightNotesRepliesLoadings: { ...this.state.insightNotesRepliesLoadings, [parentNoteId]: false }
            });
            reject();
          }
        })
        .catch(err => {
          this.setState({
            insightNotesRepliesLoadings: { ...this.state.insightNotesRepliesLoadings, [parentNoteId]: false }
          });
          reject();
        });
    });
  }

  handleInsightUserFilterSelect(user) {
    const alreadySelected = this.state.insightSelectedUsersIDs.includes(user.id);
    this.setState({
      insightSelectedUsersIDs: alreadySelected ? this.state.insightSelectedUsersIDs.filter(id => id !== user.id) : [...this.state.insightSelectedUsersIDs, user.id]
    });
  }

  handleInsightFormInputFocus() {
    this.setState({
      insightNoteAddInputExpanded: true,
      insightEditNoteId: null // close edit form input if opened
    });
  }

  handleInsightFormInputChange(val) {
    this.setState({ insightNoteAddForm: { ...this.state.insightNoteAddForm, text: val } })
  }

  handleInsightFormAddTagsBtn() { }

  clearAndCloseInsightInput() {
    this.insightAddFormQuillDOMRef.current.blur();
    this.setState({
      insightNoteAddForm: { text: '' },
      insightNoteAddInputExpanded: false
    });
    // again trigger a render by making  a dummy change so that proper classes(ql-blank) on quill gets applied
    setTimeout(() => {
      this.setState({
        insightNoteAddForm: { text: '' },
      })
    });
  }

  handleInsightFormCancelBtn() {
    this.clearAndCloseInsightInput();
  }

  handleInsightNoteSaveBtn() {
    const payload = {
      analysis_id: this.props.analysisSavedSettings.id,
      note: this.state.insightNoteAddForm.text,
    };

    this.setState({ insightOpertionInProgress: true });
    APIService.apiRequest(Constants.API_BASE_URL + `/data_grid/note`, payload, false, 'POST', this.controller)
      .then(response => {
        if (response.status === 1) {
          // add 'child_notes' key to response.data
          response.data.child_notes = 0;

          alertService.showToast('success', 'Note Added Successfully');
          this.clearAndCloseInsightInput();

          this.setState({
            insightOpertionInProgress: false,
            insightNotes: [...this.state.insightNotes, response.data]
          });
        } else {
          this.setState({ insightOpertionInProgress: false });
        }
      })
      .catch(err => {
        this.setState({ insightOpertionInProgress: false })
        console.log('Error occured in adding creating note: ' + err.message);
      });
  }

  handleInsightNoteSaveChangesBtn(parentNoteId) {
    let payload = {
      note: this.state.insightEditNoteForm.text,
    };

    this.setState({ insightOpertionInProgress: true });
    APIService.apiRequest(Constants.API_BASE_URL + `/data_grid/note/${this.state.insightEditNoteId}`, payload, false, 'PUT', this.controller)
      .then(response => {
        if (response.status === 1) {

          let updatedState = {
            insightOpertionInProgress: false,
            insightEditNoteId: null,
            insightEditNoteForm: { text: '' }
          };

          if (parentNoteId) {
            // child note is edited, update its info in replies list
            const updatedReplies = this.state.insightNotesReplies[parentNoteId].map(n => n.id !== this.state.insightEditNoteId ? n : { ...n, note: payload.note });
            updatedState.insightNotesReplies = { ...this.state.insightNotesReplies, [parentNoteId]: updatedReplies }
          } else {
            let updatedNoteList;
            updatedNoteList = this.state.insightNotes.map(n => n.id !== this.state.insightEditNoteId ? n : ({ ...n, note: payload.note }))
            updatedState.insightNotes = updatedNoteList;
          }

          this.setState(updatedState);
          alertService.showToast('success', 'Note Edited Successfully');

        } else {
          this.setState({ insightOpertionInProgress: false });
        }
      })
      .catch(err => {
        this.setState({ insightOpertionInProgress: false })
        console.log('Error occured in editing note: ' + err.message);
      });
  }

  handleInsightNoteReplySaveBtn() {
    const payload = {
      analysis_id: this.props.analysisSavedSettings.id,
      note: this.state.insightReplyNoteForm.text,
      parent_note_id: this.state.insightReplyNoteId
    };

    this.setState({ insightOpertionInProgress: true });
    APIService.apiRequest(Constants.API_BASE_URL + `/data_grid/note`, payload, false, 'POST', this.controller)
      .then(response => {
        if (response.status === 1) {
          let updatedNotesReplies = { ...this.state.insightNotesReplies };
          const newReplyNote = response.data;

          let updatedRepliesList = updatedNotesReplies[this.state.insightReplyNoteId] || [];
          updatedRepliesList.push(newReplyNote);
          updatedNotesReplies[this.state.insightReplyNoteId] = updatedRepliesList;

          // Also update the 'child_notes' property for parent note
          const updatedNotes = this.state.insightNotes.map(n => n.id !== this.state.insightReplyNoteId ? n : { ...n, child_notes: n.child_notes + 1 });;

          alertService.showToast('success', 'Note Added Successfully');

          // Remove Focus of note reply editor
          this.insightReplyFormsQuillDOMRefs[this.state.insightReplyNoteId].blur();

          this.setState({
            insightOpertionInProgress: false,
            insightNotesReplies: updatedNotesReplies,
            insightReplyNoteId: null,
            insightReplyNoteForm: { text: '' },
            insightNotes: updatedNotes
          });

        } else {
          this.setState({ insightOpertionInProgress: false });
        }
      })
      .catch(err => {
        this.setState({ insightOpertionInProgress: false })
        console.log('Error occured in adding note to chart: ' + err.message);
      });
  }

  handleInsightViewThreadBtn(noteId) {
    // first check if replies for noteId are empty or not, if empty, just expand and show the editor to add reply 
    if (this.state.insightNotes.find(n => n.id === noteId).child_notes === 0) {
      this.setState({
        insightNotesExpanded: { ...this.state.insightNotesExpanded, [noteId]: true },
        insightReplyNoteId: noteId
      });
      return;
    }

    // If replies are not empty and already fetched, expand those replies
    if (this.state.insightNotesReplies[noteId]) {
      // note replies already fetched, so just toggle the visibility of replies
      const isExpanded = this.state.insightNotesExpanded[noteId];
      this.setState({
        insightNotesExpanded: { ...this.state.insightNotesExpanded, [noteId]: !isExpanded }
      })
    } else {
      // check if thread/replied notes already available or not
      this.getInsightChildNotes(noteId);
    }
  }

  giveChartNotesById(chartId) {
    if (this.state.insightNotes && chartId !== null) {
      let notes = [];
      this.state.insightNotes.chart_notes.forEach(cn => {
        if (cn.chart_id === chartId) { notes.push(cn) };
      });
      return notes;
    }
    return null;
  }

  handleInsightNoteEditBtn(noteId, parentNoteId) {
    let noteInfo;
    if (parentNoteId) {
      // Note being edited is a child note, search for this in noteReplies map
      noteInfo = this.state.insightNotesReplies[parentNoteId].find(n => n.id === noteId);
    } else {
      noteInfo = this.state.insightNotes.find(n => n.id === noteId);
    }


    this.setState({
      insightNoteAddInputExpanded: false, // close add form input if opened
      insightOpenedOptionsNoteId: null,
      insightEditNoteId: noteId,
      insightEditNoteForm: { text: noteInfo.note }
    })

    setTimeout(() => {
      this.insightEditFormQuillDOMRef.current.focus();
    }, 100);
  }

  handleInsightEditFormInputChange(val) {
    this.setState({ insightEditNoteForm: { ...this.state.insightEditNoteForm, text: val } })
  }

  handleInsightReplyFormInputChange(val) {
    this.setState({ insightReplyNoteForm: { ...this.state.insightReplyNoteForm, text: val } })
  }

  handleInsightReplyFormInputFocus(noteId) {
    this.setState({
      insightReplyNoteId: noteId,
      insightReplyNoteForm: { text: '', chartInfo: null }
    });
  }

  handleInsightReplyFormCancelBtn() {
    const currentFocusedReplyNoteId = this.state.insightReplyNoteId;

    // remove the focus as well by calling .blur() function. It is done so that next time Focus event gets triggered properly.
    this.insightReplyFormsQuillDOMRefs[currentFocusedReplyNoteId].blur();
    this.setState({
      insightReplyNoteId: null,
      insightReplyNoteForm: { text: '', chartInfo: null },
    });
    // Check if Parent note has zero child note, in that case, we have to hide the reply editor as well, hence set expanded variable to false
    if (this.state.insightNotes.find(n => n.id === currentFocusedReplyNoteId).child_notes === 0) {
      this.setState({
        insightNotesExpanded: { ...this.state.insightNotesExpanded, [currentFocusedReplyNoteId]: false },
      });
    }
  }

  handleInsightNoteDeleteBtn(noteId, parentNoteId) {
    this.setState({ insightOpertionInProgress: true });
    APIService.apiRequest(Constants.API_BASE_URL + `/data_grid/note/${noteId}`, {}, false, 'DELETE', this.controller)
      .then(response => {
        if (response.status === 1) {
          let updatedState = {
            insightOpertionInProgress: false,
          };

          if (parentNoteId) {
            // child note is deleted, remove it from reply list
            const updatedReplies = this.state.insightNotesReplies[parentNoteId].filter(n => n.id !== noteId);
            updatedState.insightNotesReplies = { ...this.state.insightNotesReplies, [parentNoteId]: updatedReplies }
            // Also update the 'child_notes' property of parent note
            updatedState.insightNotes = this.state.insightNotes.map(n => n.id !== parentNoteId ? n : { ...n, child_notes: n.child_notes - 1 });
          } else {
            updatedState.insightNotes = this.state.insightNotes.filter(n => n.id !== noteId);
          }
          this.setState(updatedState);
          alertService.showToast('success', 'Note Deleted Successfully');
        } else {
          this.setState({ insightOpertionInProgress: false });
        }
      })
      .catch(err => {
        this.setState({ insightOpertionInProgress: false })
        console.log('Error occured in deleting note: ' + err.message);
      });
  }

  showSelectionValuesDropDown() {
    let selectedDataColumns = Object.keys(this.state.selectedData).length !== 0 ? Object.keys(this.state.selectedData) : [];

    return (
      <ClickOutsideListner onOutsideClick={() => this.setState({ isSelectionValueDropDownSelected: !this.state.isSelectionValueDropDownSelected })}>
        <div className='selected-values-container'>
          {selectedDataColumns.map((keyVar) => <div key={keyVar} className='tooltip-dropdown-item'><span key={keyVar}><i>{keyVar} :</i> {this.state.selectedData[keyVar]}</span></div>)}
        </div>
      </ClickOutsideListner>
    );
  }


  //Main Render Function
  render() {
    const hasInsightAccess = this.props.analysisSavedSettings.privileges.includes('COMMENT');
    const hasShareAccess = this.props.analysisSavedSettings.privileges.includes('SHARE');

    let selectedDataColumns = Object.keys(this.state.selectedData).length !== 0 ? Object.keys(this.state.selectedData) : [];

    return (
      <div id="analysis" className={'clearfix panel-' + this.state.filterPanelPosition + (this.state.toggleFilterPanel ? ' panel-open' : '') + (!this.isAnalysisInEditMode() ? ' view-mode' : '')}>
        {(this.state.showNewAnalysisForm && this.isAnalysisInEditMode()) && this.giveAnalysisFormContent()}
        {this.state.toggleFilterPanel && this.giveAnalysisFilterPanelHTML()}

        <div id="analysis-filters-panel-floating" onMouseDown={(e) => this.handleAnalysisFloatingPanelDragStart(e)}>
          <div className="panel-wrapper">
            <ul className="tab-list">
              <li className={this.state.filter_panel_main_tab === 'Constructor' ? 'active' : ''} >
                <button onClick={() => this.handleFilterPanelMainTabChange('Constructor')}>{this.isAnalysisInEditMode() ? 'Constructor' : 'Controls'}</button>
              </li>
              {hasInsightAccess &&
                <li className={(this.state.filter_panel_main_tab === 'Insights' ? 'active' : '')} >
                  <button onClick={() => this.handleFilterPanelMainTabChange('Insights')}>Insights</button>
                </li>
              }
              {hasShareAccess &&
                <li className={this.state.filter_panel_main_tab === 'Share' ? 'active' : ''} >
                  <button onClick={() => this.handleFilterPanelMainTabChange('Share')}>Share</button>
                </li>
              }
            </ul>
            <ul className="chart-tabs-icon">
              {this.isAnalysisInEditMode() &&
                <li><button className="btn-settings" onClick={this.handleAnalysisSettingsBtn}></button></li>
              }
              <li><button className="btn-fullscreen" onClick={this.handleAnalysisFullscreenBtn}></button></li>
            </ul>

          </div>
        </div>

        {this.state.showCalculatedFieldForm && this.giveNewCalculatedFieldForm()}

        <div id="analysis-wrapper" className={`analysis-view has-border analysis-${this.props.analysisSavedSettings.id}`}>
          <div id="col-resize-indicator"></div>
          {/* {(this.state.inprocess_last_updated || this.state.inprocess_get_analysis) &&
            <div id="bydata-loader-fixed-wrapper" className={(this.state.analysisData ? 'faded-bg' : '')}>
              <LoaderbyData />
            </div>
          } */}

          {(this.state.inprocess_last_updated || this.state.inprocess_get_analysis) &&
            <div id="bydata-progress-loader" className={this.state.filterPanelPosition}>
              <div className="loading-progress"></div>
            </div>
          }

          <div id="analysis-section">
            {this.state.analysisData && this.state.analysisData.length > 0 &&
              <ReactDivTable
                columns={this.state.analysisColumns}
                columns_display={this.state.analysisColumnsDisplay}
                columns_width={this.state.analysisColumnsWidth}
                columns_width_update_needed={this.state.updateColumnsWidthInChild}
                data={this.state.analysisData}
                orgDataLength={this.state.analysisOrgData.length}
                selected_rows={this.generateSelectedRowsColsElements(this.state.selected_rows)}
                selected_columns={this.generateSelectedRowsColsElements(this.state.selected_columns)}
                onSubLevelDataFetch={this.handleSubLevelDataFetch}
                onSubLevelDataRemove={this.handleSubLevelDataRemove}
                onTableDataSorting={this.handleTableDataSorting}
                collapseAllRows={this.state.collapseAllRows}
                sublevel_inprocess={this.state.inprocess_sublevel}
                conditionalFormatting={this.state.conditionalFormatting}
                terminal_type={this.state.terminal_type}
                periodComparisonEnabled={this.state.isPeriodComparisonEnabled}
                showBenchmarkForPeriodComparison={this.state.showBenchmarkInGrid}
                formatCellValue={this.giveFormattedCellValueInReactDivTable}
                analysisId={this.props.analysisSavedSettings.id}
                setSelectedData={(selectedData) => {this.setState({ selectedData: selectedData, isDataSelected: Object.keys(selectedData).length === 0 ? false : true })}}
                setDataToCopy={(datatoCopy) => {this.props.setDataToCopy(datatoCopy)}}
                handleSelectAll={() => this.props.handleSelectAll()}
              // filterToggleOpen={this.state.toggleFilterPanel} //to manage frame border
              // filterPanelPosition={this.state.filterPanelPosition} //to manage frame border
              />
            }
            {this.state.analysisData && this.state.analysisData.length === 0 &&
              <div className="no-data-msg">
                No data found for applied settings
              </div>
            }
            {/* {this.state.analysisData === '' &&
              <div className="no-data-msg">
                Apply some settings on console panel and press RUN button to see the data here
              </div>
            } */}
          </div>
        </div>
        {this.state.analysisColumns.length > 0 && (<div id="hover-column-container" className={`hover-column-container hover-column-container-${this.props.analysisSavedSettings.id}`}>
          <div className={`hover-column-group hover-column-group-${this.props.analysisSavedSettings.id}`}>
            {/* { data-index={1} data-sort_key={[...columnsFromProp[1]]} onClick={this.handleSortingColumn}>} */}
            {typeof this.state.analysisColumns[1] !== 'string' && this.state.analysisColumns[1].map((col, j) => <div key={j} className={`hover-column hover-column-${this.props.analysisSavedSettings.id}-${j}`}><span>{col}</span></div>)}
          </div>
        </div>)}

        {/* Floating Tooltip */}
        {this.state.isDataSelected ? (
          <div id="floating-tooltip">
            <div className={`floating-tooltip-inner${this.state.isSelectionValueDropDownSelected ? ' selected' : ''}`}>
              {selectedDataColumns.map((keyVar, j) => {
                if (j < 3) {
                  return <span key={keyVar}><i>{keyVar} :</i> {this.state.selectedData[keyVar]}</span>;
                } else {
                  return (<></>);
                }
              })}
              <span className={`icon-dropdown${this.state.isSelectionValueDropDownSelected ? ' disable' : ''}`} onClick={() => this.setState({ isSelectionValueDropDownSelected: !this.state.isSelectionValueDropDownSelected }, () => {console.log(this.state.isSelectionValueDropDownSelected)})}></span>
            </div>
            {this.state.isDataSelected && this.state.isSelectionValueDropDownSelected  ? (
                <div id='dropdown-container' className='dropdown-container'>
                    <ClickOutsideListner onOutsideClick={() => this.setState({ isSelectionValueDropDownSelected: !this.state.isSelectionValueDropDownSelected })}>
                    <div id="selected-values-container" className='selected-values-container'>
                      {selectedDataColumns.map((keyVar) => <div className='tooltip-dropdown-item'><span className="key" key={keyVar}><i>{keyVar} :</i></span> <span className="value">{this.state.selectedData[keyVar]}</span></div>)}
                    </div>
                  </ClickOutsideListner>
                </div>
              ) : (<></>)}
          </div>) : (<></>)}
      </div>
    );
  }
}

export default AnalysisView;
