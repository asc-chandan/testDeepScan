import React, { Component } from 'react';
import ReactQuill from 'react-quill';

import 'react-quill/dist/quill.snow.css';
import '../../../styles/ReportViews.scss';
import ImgLegend from '../../../images/icon-legend.svg';

import moment from 'moment';
import * as d3 from 'd3';
import * as Constants from '../../../components/Constants.js';
import subjectObj from '../../../subjects/Subject1';
import LoaderbyData from '../../../components/LoaderbyData/LoaderbyData';

import SpeedSelect from '../../../components/SpeedSelect/SpeedSelect';
import { UserAvatar } from '../../../components/UserAvatar/UserAvatar';
import ClickOutsideListener from '../../../components/ClickOutsideListner';
import { MultiPeriodPickerPanel } from '../../../components/MultiPeriodPicker/MultiPeriodPicker';
import { givePrevNthDate, giveDaysCountInRange } from '../../../components/MultiPeriodPicker/components/utils';
import APIService from '../../../services/apiService';
import {
  getKeyByValue, getClients, getUser, giveDotSeparatedDateRange, convertDatePeriodPreselectsToRange, giveDateInMMDDYYY
} from '../../../utils/Common';

import {
  formatChartData, drawDynamicChart, giveDateInString, giveDateTimeInString,
  formatNumber, covertUnderscoreToSpaceInString, getChartColors,
  chartSortingFormating, getDefaultChartFormat, isAbbrevationName, findChartOverlapping, calculateTextWidth, numberWithCommas
} from './ChartsUtils';
import { Checkbox } from '../../../components/ReactCheckbox/ReactCheckbox.js';
import alertService from '../../../services/alertService.js';
import { DefaultColorsList, ColorPalettes } from '../../../components/ColorPalettes';
import subject2 from '../../../subjects/Subject2';

const DATE_PERIOD_PRESELECTS = ['Yesterday', 'Today', 'Last 7 Days', 'Last 15 Days', 'Last 30 Days', 'Last Month', 'This Month', 'Last Year', 'This Year', 'Custom'];
const MAX_NAME_CHAR = 50;
const MAX_DESCRIPTION_CHAR = 150;
const CONDITIONAL_FORMATTING_OPTIONS = [
  { 'id': 'greater_than', 'name': 'Greater than' },
  { 'id': 'greater_than_equal_to', 'name': 'Greater than or equal to' },
  { 'id': 'less_than', 'name': 'Less than' },
  { 'id': 'less_than_equal_to', 'name': 'Less than or equal to' },
  { 'id': 'equal_to', 'name': 'Equal to' },
  { 'id': 'not_equal_to', 'name': 'Not equal to' },
  { 'id': 'top', 'name': 'Top' },
  { 'id': 'bottom', 'name': 'Bottom' },
  { 'id': 'between', 'name': 'Between' },
  // { 'id': 'empty', 'name': 'Empty' },
];

const CHART_DIMENSIONS = {
  defaultWidth: 450,
  defaultHeight: 270,
  defaultSegmentWidth: 260,
  smWidth: 300,
  smHeight: 180,
  smSegmentWidth: 170,
  xsWidth: 200,
  xsHeight: 120,
  xsSegmentWidth: 115,
  defaultScorecardWidth: 200,
  defaultScorecardHeight: 120,
  xsScorecardWidth: 125,
  xsScorecardHeight: 75,
  showLegendCount: 0
};
const NEW_CHART_DEFAULT_X = (window.innerWidth / 2 - 10 - CHART_DIMENSIONS.defaultWidth / 2);
const NEW_CHART_DEFAULT_Y = (window.innerHeight / 2 - 70 - CHART_DIMENSIONS.defaultHeight / 2);
const DEFAULT_CHART_COLOR = getChartColors()[0];
const NEW_CHART_ID = 'new_chart_constructor';
const PREVIEW_CHART_ID = 'preview_chart_constructor';
const FALLBACK_TIME_PERIOD_FOR_CHARTS = { is_dynamic: true, value: 'Last 30 Days' };

/**Used to show the applied filters list in Scorecard Popup */
const giveAppliedFiltersInString = (chartFiltersObject) => {
  return Object.keys(chartFiltersObject).reduce((filterStr, filterKey) => {
    return filterStr + (filterStr !== '' ? ' | ' : '') + covertUnderscoreToSpaceInString(filterKey);
  }, '');
};

class ReportView extends Component {
  constructor(props) {
    super(props);

    this.user = getUser();
    this.viewModes = [{'id': 1, 'name': 'Actual Width'}, {'id': 2, 'name': 'Fit to Width'}];

    this.state = this.getInitVariables();
    this.controller = new AbortController();
    this.callbackAfterDiscardScreen = null; // stores the additional task(function) to call after user either clicks on 'Discard' or 'Save'
    this.maxZIndexAmongCharts = { zindex: 1, id: null };

    this.chartsColWrapper = React.createRef();
    this.multiChartsScrollableWrapper = React.createRef();
    this.multiChartsWrapper = React.createRef();
    this.consolePanelRef = React.createRef();
    this.ascHProgressBar = React.createRef();
    this.ascHAnchor = React.createRef();
    this.ascVProgressBar = React.createRef();
    this.ascVAnchor = React.createRef();
    this.chartWidgetsScrollableWrapper = React.createRef();

    this.insightAddFormQuillDOMRef = React.createRef();
    this.insightEditFormQuillDOMRef = React.createRef();
    this.insightReplyFormsQuillDOMRefs = {}; // stores DOM refs of reply editores for each note
    this.newTextBoxWidgetRef = React.createRef(); // stores DOM refs of text widget

    this.currentURL = window.location.href.split('?')[0];

    //Bind View Events
    this.bindEvents([
      //Charts Grids Layout
      'handleGridToggle',
      'handleMoreButtonsDropDownToggle',
      'getCordinatesInRatioToScreenSize',

      // Dashboard Form event handlers
      'handleDashboardFormCloseBtn',
      'handleDashboardFormOpenConsoleBtn',
      'handleDashboardLayoutSettingChange',
      'getDefaultLayoutSettings',
      'getResizedChartDimensions',

      //Console Panel Events
      'handleConsolePanelTabChange', // constructor tabs click
      'onNewConstructorSettingsChange', // On new constructor settings change
      'handleFilterOptionsList',
      'discardExistingNewChartSettings',
      'getFetchChartDataPayload',
      'renderChart',
      'handleConsolePanelOutsideClick',
      'showConsoleMinimizedButton',
      'onChartWidgetDragStart',
      'handleWidgetLegendDetails', //console panel widget legend details
      'handleWidgetMetaInfo',  //console panel widget info details
      'showAggregatedSegmentsDetails', //console panel widget legend details
      'getWidgetInfo',  //console panel widget info details
      'getWidgetLegendDetails',  //console panel widget legend details

      'handleChartCreateOrUpdate', // for chart
      'handleChartResetBtn',
      'handleChartAddBtn', //used when there is no chart in dashbaord under console panel index tab
      'handleShowHideChart',
      'handleAddNewWidgetBtn',
      'handleChartsSettingsSearch',
      'saveNewChartToExistingDashboard',
      'handleDashboardSaveBtn',
      'handleDashboardResetBtn', //used under view mode
      'handleDashboardRunBtn',
      'navigateToDashboardSettings',
      'handleDashboardTagInputChange',
      'handleChartsSettingsFilters',
      'handleDashboardSetDefaultToggle', // not being used as of now but it is for home page of sight

      'getChartTitleHTML',
      'handleNewConstructorBandAddBtn',
      'handleNewConstructorBandRemoveBtn',
      'handleNewConstructorTrendAddBtn', // not being used right now
      'handleNewConstructorTrendRemoveBtn', // not being used right now
      'handleMinimizeConsolePanel',
      'handleNewChartPlaceholderMouseMove',
      'handleZIndexSwitch',

      //Constructor format
      'handleToggleLabel',
      'handleToggleColorPicker',
      'handleColorPickerSelect',
      'handleColorPaletteSelect',
      'handleChartFormatInputChange',
      'handleAddSortingCondition',
      'handleRemoveSortingCondition',
      'handleSortingConditionChange',

      'handleInsightFormNoteForChange',
      'handleInsightFormNoteTypeChange',
      'handleInsightFormInputFocus',
      'handleInsightFormInputChange',
      'handleInsightFormCancelBtn',
      'handlePointSelectionOnChart',
      'handlePointClickOnChart',
      'handleInsightNoteSaveBtn',
      'handleInsightNoteSaveChangesBtn',
      'handleInsightEditFormInputChange',
      'handleInsightReplyFormInputChange',
      'handleInsightNoteReplySaveBtn',
      'handleInsightViewThreadBtn',
      'handleInsightUserFilterSelect',

      'handleShareOrganisationSelect',
      'handleShareUsersSelect',
      'handleShareNewFormSubmit',
      'handleShareNewFormReset',
      'handleShareEditCancelBtn',
      'handleShareEditSubmitBtn',
      'handleShareEditDeleteBtn',
      'getShareInviteForm',
      'handleDashboardMakePublic',

      'handleChartFullScreen',
      'handleChartLegendDrodDownToggle',
      'handleChartMetaDrodDownToggle',
      'handleMultiChartResizeStart', //chart resize

      // discard changes screen btn handlers
      'handleDiscardScreenDiscardBtn',
      'handleDiscardScreenSaveBtn',
      'handleDiscardScreenCloseBtn',

      'handleDashboardChartLayoutSave', //add, edit, drag, and resize dashboard charts layout
      'handleCustomProgressBarHorizontalScroll',
      'handleCustomProgressBarVerticalScroll',
      'onWindowResize'
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

  //Initial Variables
  getInitVariables() {
    const client_id = (this.props.clientId!==undefined) ? this.props.clientId : this.user.last_fetched_client;
    const chart_types = ['line', 'bar', 'scatter', 'pie', 'donut', 'bubble', 'heatmap', 'spider', 'waterfall', 'flat_table', 'scorecard', 'area', 'box', 'density', 'treemap'];
    const chart_type_tabs = {};
    chart_types.forEach((item) => {
      let tabs;
      if (item === 'flat_table') {
        tabs = ['dataset', 'dimension', 'value', 'period', 'filter', 'segment'];
      } else if (item === 'pie' || item === 'donut' || item === 'bubble') {
        tabs = ['dataset', 'dimension', 'value', 'period', 'filter', 'segment'];
      } else if (item === 'scorecard') {
        tabs = ['dataset', 'metric', 'period', 'filter'];
      } else if (item === 'heatmap') {
        tabs = ['dataset', 'x_axis', 'y_axis', 'period', 'filter', 'measurement'];
      } else if (item === 'spider') {
        tabs = ['dataset', 'dimension', 'measurements', 'period', 'filter', 'segment'];
      } else if (item === 'box') {
        tabs = ['dataset', 'x_axis', 'y_axis', 'period', 'filter', 'distribution'];
      } else if (item === 'treemap') {
        tabs = ['dataset', 'entity', 'value', 'period', 'filter', 'group']
      } else {
        tabs = ['dataset', 'x_axis', 'y_axis', 'period', 'filter', 'segment'];
      }
      chart_type_tabs[item] = tabs;
    });

    //default view mode
    let sightSettings = localStorage.getItem(Constants.SITE_PREFIX + 'settings') ? JSON.parse(localStorage.getItem(Constants.SITE_PREFIX + 'settings')) : {};
    let defaultViewMode = this.viewModes[0];
    if (sightSettings && sightSettings['user_preference'] !== undefined && sightSettings['user_preference']['trendmaster_default_view_mode'] !== undefined) {
      defaultViewMode = sightSettings['user_preference']['trendmaster_default_view_mode'];
    }

    //grids related settings
    let defaultGridCellWidth = 5;
    let defaultGridCellHeight = 5;
    let defaultConsolePanelSelectedTab = 'index';
    if (String(this.getDashboardID()).includes('new') || this.props.showDashboardCreatedMsg) {
      defaultConsolePanelSelectedTab = 'dashboard_settings';
    }

    let dashboardInitialSettings = this.getDashboardInitialSettings({ gridColWidth: defaultGridCellWidth, gridRowHeight: defaultGridCellHeight });

    let client = (this.props.clientId!==undefined) ? {id: parseInt(this.props.clientId), display_client_id: '', name: ''} : (client_id !== '' ? getKeyByValue(getClients(), client_id, 'id') : '');
    
    const defaultObj = {
      inprocess: false,
      sourceDimensionsInProcess: false,
      error: "",
      message: "",
      dashboardErrObj: { error: false, msg: '' },
      client: client,
      terminal_type: (this.props.clientId!==undefined) ? 'sellside' : this.user.terminal_type.id,
      chartTypes: chart_types,
      data_sources: [],
      allDataSourcesDimensionsMetrics: {}, //store list of dimensions and metrics by datasource
      allDataSourcesDimensionsList: {}, //store dimensions list by datasource 
      currentViewModeType: defaultViewMode,
      chart_dimensions: CHART_DIMENSIONS,
      chartsFormattedNetData: {},
      chartsFormattedData: {},
      chartsSegmentation: {},
      chartsBandData: {},
      newChartData: { formattedData: [], formattedNetData: {}, segmentationData: '' },

      // Dashboard Form related variables
      authroisedDashboardAccess: this.props.isPublicView ? false : true,
      dashboardSettings: dashboardInitialSettings,
      dashboardSettingsLastSaved: JSON.parse(JSON.stringify(dashboardInitialSettings)),
      dashboardFormShowTimePresets: this.props.dashboardData.dynamic_time_period && this.props.dashboardData.dynamic_time_period.is_dynamic === false ? false : true,
      dashboardOpenedFilterName: '',
      dashboardFilterSearchInput: '',
      dashboardSubFilterSearchInput: '',

      // Gird related variables
      showMoreButtonsDropDownToggle: {},
      showMetaDropDownToggle: {},
      clickedScorecardInfo: null, // recheck

      chartOrDashboardSaveInProcess: false, // to disable buttons while request is in progress
      gridColWidth: defaultGridCellWidth,
      gridRowHeight: defaultGridCellHeight,

      chartsGridLayout: [],
      tempChartsGridLayout: [],
      defaultXYPlacements: {}, //recheck

      consolePanelSelectedTab: defaultConsolePanelSelectedTab,
      showWidgetInfo: false,
      showWidgetLegendDetails: false,
      showNewDashboardForm: String(this.getDashboardID()).includes('new') || this.props.showDashboardCreatedMsg,
      newDashboardFormExpandedItemByTab: { presentation: 'console', data: 'period' }, // It is an object with key as name of currentTab and value as name of expanded item
      newDashboardFormCurrentTab: 'setting',

      preferenceAutoHideConsolePanel: this.props.preferenceAutoHideConsolePanel,

      // settings for tab 'constructor'
      initialConstructorDrag: false,
      editableChartTitle: false,
      constructorSelectedSubtab: 'first',
      constructorSettingsCurrentSubtab: 'dataset',
      constructorTransitionScreenVisible: false, // Transition screen refers to the screen where user can either select the chart type OR copy the existing chart while creating new chart
      constructorTransitionScreenCurrentSubtab: 'create',
      newChartSettings: this.getNewChartInitialSettings(),
      newChartSettingsLastExecuted: { ...this.getNewChartInitialSettings() }, // to count the changes made and show that count on RUN button
      chartFormShowTimePresets: true,
      chartFormSearchInput: '',
      chartFormOpenedFilterId: '', // store the filter which is opened to select its suboptions
      currentChartEditId: null,
      showNewSettingsDiscardMessage: false,
      showChartSettingsAddBtnMenu: false,
      constructorTransitionScreenCopyFiles: 'All Files',
      previewChartSettings: null,
      previewChartData: null,
      constructorSettingsTabs: chart_type_tabs,
      constructorAnalysisMetadata: null,
      loadingConstructorAnalyisMetadata: false,
      newChartBandSettings: [], // other properties are dynamic and will be added after fetching 'constructorAnalysisMetadata'
      newChartBandSettingsLastExecuted: [],
      newChartTrendSettings: [],
      selectedChartIds: [],

      // settings for tab 'chart'
      chartsSettings: [], // to store all saved list of charts
      filteredChartsSettings: [],
      chartsLoadingsObj: {}, // stores chart ids as keys and true/false(To show loader or not) as values
      chartNoteCountObj: {},
      chartsSettingsFromOtherDashboards: null, // to store chart list of other dashboards 
      constructorAllChartSearchFilteredChartsSettings: [],
      chartTabSearchInput: '',
      chartFromOtherDashboardLoading: false, // to show loader while request for searching chart in other dashboars is in progeess
      chartTabSourceFilter: 'Source',
      chartTabChartTypeFilter: 'Widget',
      chartFiltersSelected: false,
      chartOpenedOptionsID: null,
      tempCopyedChat: null,

      //settings for tab 'controls'
      isAutoRunFilters: false,

      // settings for tab 'insight'
      insightNoteAddForm: { text: '', chartInfo: null },
      insightNoteAddInputExpanded: false,
      insightFormNoteFor: 'Dashboard',
      insightFormNoteType: 'User Notes',
      insightSelectedUsersIDs: [], // store the id's of user selected for fitlering notes
      insightNotes: null, // Notes list :fetched from server,
      insightOpenedOptionsNoteId: null,
      insightEditNoteId: null,
      insightEditNoteForm: { text: '', chartInfo: null },
      insightNotesReplies: {}, // Map of parent note as a key and corresponding reply notes as value.
      insightNotesRepliesLoadings: {},
      insightNotesExpanded: {},
      insightReplyNoteId: null,
      insightReplyNoteForm: { text: '', chartInfo: null },
      insightClickedNoteInfo: null,
      insightPointSelectionModeON: false,
      loadingNotes: false,

      //settings for tab 'share'
      loadingOrganisations: false,
      loadingUsers: false,
      organisationList: null,
      userList: null,
      shareShowNewForm: false,
      shareNewFormSelectedOrganisation: null,
      shareNewFormSelectedUsers: [],
      shareNewFormSelectedAuthorizations: ['VIEW'],
      shareNewOrgSearch: '',
      shareNewUserSearch: '',
      shareNewChartSearch: '',
      shareNewChartsIDsSelected: [],
      loadingSharedUsers: false,
      sharedUsers: null,
      shareEditPopupUserID: null,
      shareEditUserInfo: null,
      shareEditSelectedAuthorizations: [],
      shareEditChartsIDsSelected: [],
      shareEditChartSearch: '',

      //state to track if the new chart placeholder is placed on screen
      isNewChartPlacedOnScreen: false,
      //state to track the data of new text widget on screen
      // newTextBoxWidgetData: {text: '', chartInfo: ''},

      // legend
      legendOpen: null,
    }
    return defaultObj;
  }


  /******************************************
  * Initial Settings - NewChart/Dashboard *
  ******************************************/
  getNewChartInitialSettings() {
    return {
      id: null,
      chart_type: '',
      view_type: 'advertiser',
      segmentation: '',
      x_axis: '',
      metric: '',
      filters: {},
      showLegend: 0,
      showLabel: false,
      showGrid: 0,
      showBands: 0,
      name: '',
      description: '',
      dynamic_time_period: null,
      chart_other_settings: null,
      chart_format_parameters: null,
      updated_on: '',
      format: getDefaultChartFormat(),
      ref: React.createRef(),
      legendRef: React.createRef()
    };
  }

  getNewChartInitialLayoutSettings() {
    return {
      'x': null,
      'y': null,
      'w': this.state.chart_dimensions.defaultWidth,
      'h': this.state.chart_dimensions.defaultHeight,
      'sw': this.state.chart_dimensions.defaultSegmentWidth,
      'zindex': 1
    };
  }

  getDashboardInitialSettings(grid_size = null) {
    let otherSett = this.props.dashboardData.dashboard_other_settings ? JSON.parse(this.props.dashboardData.dashboard_other_settings) : null;
    let isNewDashbord = String(this.getDashboardID()).includes('new');

    if (!otherSett || otherSett.layout_setting === undefined || isNewDashbord) {
      otherSett = {
        'chart_grid_layout': [],
        'layout_setting': this.getDefaultLayoutSettings(grid_size),
        'presentation_filters': ['period'],
        'presentation_lock_on': false,
      };
    }

    return {
      name: isNewDashbord ? '' : this.props.dashboardData.dashboard_name,
      description: this.props.dashboardData.dashboard_description || '',
      id: isNewDashbord ? null : this.getDashboardID(),
      is_default: isNewDashbord ? 0 : this.props.dashboardData.is_default,
      dynamic_time_period: this.props.dashboardData.dynamic_time_period,
      filters: this.props.dashboardData.filters || {},
      presentationLockOn: otherSett ? otherSett.presentation_lock_on : false, // In view mode, dashboard can be locked so that changing/resizing of grid is not allowed
      tags: this.props.dashboardData.tags || [],
      folders: [],
      presentationFilters: otherSett ? otherSett.presentation_filters : ['period'],
      dashboard_other_settings: otherSett ? otherSett : {}
    };
  }

  isDashboardInEditMode() {
    return this.props.isDashboardInEditMode;
  }

  //custom content horizontal scroll
  handleCustomProgressBarHorizontalScroll() {
    if (this.props.showConsolePanel && this.ascHAnchor.current) {
      let panelWidth = this.consolePanelRef.current.offsetWidth; //360px
      let totalContectArea = (window.innerWidth - 10);
      let totalPageWidth = totalContectArea + panelWidth;
      let scrollWidth = totalPageWidth - totalContectArea;
      // let debounceResize;

      let srollWrapperWidth = (totalContectArea + 5 - scrollWidth);
      let srollAnchorWidth = (srollWrapperWidth - panelWidth);
      this.ascHAnchor.current.style.width = srollAnchorWidth + 'px'; //set initial scroll anchor width

      let that = this;
      that.multiChartsScrollableWrapper.current.addEventListener("scroll", () => {
        if (!that.ascHAnchor.current) return;
        that.ascHAnchor.current.style.left = that.multiChartsScrollableWrapper.current.scrollLeft + 'px';
      });
    } else {
      this.multiChartsScrollableWrapper.current.removeEventListener("scroll", ()=>{});
    }
  }

  //custom content vertical scroll
  handleCustomProgressBarVerticalScroll() {
    let availableContenAreaHeight = this.chartsColWrapper.current.offsetHeight; //header height, 5px+5px padding from top and bottom
    let contentHeight = this.multiChartsScrollableWrapper.current.offsetHeight;

    if (contentHeight > availableContenAreaHeight && this.ascVAnchor.current) {
      // this.ascVProgressBar.current.style.display = 'block';
      let scrollAnchorHeight = Math.floor((availableContenAreaHeight / contentHeight) * availableContenAreaHeight);
      this.ascVAnchor.current.style.height = scrollAnchorHeight + 'px'; //set initial scroll anchor width
      let that = this;

      that.chartsColWrapper.current.addEventListener("scroll", () => {
        if (!that.ascVAnchor.current) return;
        let top = (availableContenAreaHeight / contentHeight) * that.chartsColWrapper.current.scrollTop;
        that.ascVAnchor.current.style.top = top + 'px';
      }, false);
    } else {
      // this.ascVProgressBar.current.style.display = 'none';
      this.chartsColWrapper.current.removeEventListener("scroll", () => { });
    }
  }


  /***************************************
  * Life Cycle Methods and APIs Calls *
  ***************************************/

  componentDidMount() {
    this.loadScriptsIfTabBecomesActive();
    window.addEventListener('resize', this.onWindowResize);

    // subscribing the subject2 to get the notification about the client change from header.
    subject2.subscribe(this.handleClientChange.bind(this));

    //Pass Client to Header Component
    subjectObj.notify({
      client: this.state.client
    });

    //bind custom scrollbar    
    this.handleCustomProgressBarHorizontalScroll();
    this.handleCustomProgressBarVerticalScroll();

    //deselect the chart on list div clicks
    document.addEventListener('click', (e) => {
      let classes = ['app-header-inner', 'sub-header-tabs-container', 'tab-title', 'tab-mode']
      if (classes.includes(e.target.className) || e.target.id === 'multicharts') {
        d3.select('#chart-'+window.currentSelectedWidget+' .trackpad').dispatch('click'); // remove lock on chart widget
        d3.select('#chart-'+window.currentSelectedWidget+' .trackpad').dispatch('mouseout'); // remove lock on chart widget
        d3.select('#chart-'+window.currentSelectedWidget+' .zoom-out').dispatch('click'); // remove lock on chart widget
       
        //close the panel
        if (this.props.dashboardData.showConsolePanel && (this.state.showWidgetInfo || this.state.showWidgetLegendDetails)) {
          this.props.onPanelToggle(this.getDashboardID(), 'showConsolePanel');
        }

        this.setState({
          selectedChartIds: [],
          currentChartEditId: null,
          newChartSettings: this.getNewChartInitialSettings(),
          newChartSettingsLastExecuted: { ...this.getNewChartInitialSettings() },
          // initialConstructorDrag: true,
          initialConstructorDrag: false,
          consolePanelSelectedTab:  (!this.state.showWidgetInfo && !this.state.showWidgetLegendDetails) ? 'index' : '',
          constructorSelectedSubtab: (!this.state.showWidgetInfo && !this.state.showWidgetLegendDetails) ? 'first' : '', // force set the selected subtab in case something else was selected
          constructorTransitionScreenVisible: false,
          showWidgetInfo: false,
          showWidgetLegendDetails: false
        }, () => {
          window.currentSelectedWidget = null;
        });
      }
    });
    document.addEventListener('keydown', this.keyDownEventsHandler);
  }

  keyDownEventsHandler = (e) => {
    e.stopPropagation();
    let { shiftKey, ctrlKey, keyCode, metaKey } = e;
    
    if((keyCode === 37 || keyCode === 39) && !shiftKey)
      this.switchChart(e);

    if((keyCode === 37 || keyCode === 38 || keyCode === 39 || keyCode === 40) && shiftKey)
      this.shiftChart(e);

    if(!this.isDashboardInEditMode())
      return;

    if( (metaKey || ctrlKey) && keyCode === 67 )
      this.copyAChartOnControlPlusC();

    if( (metaKey || ctrlKey) && keyCode === 86 )
      this.pastChartOnControlPlusV();

    if(keyCode === 46 || keyCode === 8)
      this.deleteChartOnKeyPress();
    
    if(keyCode === 27)
      this.escapePastingChat();
  }

  escapePastingChat = () => {
    const { filteredChartsSettings } = this.state
    const i = filteredChartsSettings.findIndex(chart => chart.id === "new_chart_constructor");

    if(!filteredChartsSettings || i === -1)
      return;
    
    this.setState({renderCopiedChartOnDrop: false})

    filteredChartsSettings.splice(i,1);
    const mousedown = new Event('mousedown');
    document.dispatchEvent(mousedown);
  }

  
  deleteChartOnKeyPress = (e) => {
    const { selectedChartIds } = this.state;
    if(!selectedChartIds.length) return;
    this.handleChartDeleteBtn(e, selectedChartIds[0]);
  }

  copyAChartOnControlPlusC = () => {
    const id = this.state.selectedChartIds[0];
    const chart = this.state.filteredChartsSettings.find(chart => chart.id === id);
    if(id) this.setState({tempCopyedChat: {...chart}});
  }
  
  pastChartOnControlPlusC() {
    let {tempCopyedChat} = this.state;
    if( !tempCopyedChat) return;
    
    tempCopyedChat.id = Math.floor(Math.random() * 10000);
    this.handleChartSettingsCopyBtn(tempCopyedChat);
    this.setState({tempCopyedChat: null})
  }

  switchChart(e){ 
    e.preventDefault();
    const { selectedChartIds,filteredChartsSettings } = this.state;
    let currentChartSettingIndex = filteredChartsSettings.findIndex(chartSetting =>chartSetting.id === selectedChartIds[0]);
    if(currentChartSettingIndex === -1) return;
    
    if(currentChartSettingIndex === filteredChartsSettings.length-1 && e.keyCode === 39)
      currentChartSettingIndex = 0;
    else if(currentChartSettingIndex === 0 && e.keyCode === 37)
      currentChartSettingIndex = filteredChartsSettings.length-1;
    else if(e.keyCode === 39 )
      currentChartSettingIndex++;
    else
      currentChartSettingIndex--;

    this.setState({selectedChartIds: [filteredChartsSettings[currentChartSettingIndex].id]});
  }

  shiftChart(e){
    const {tempChartsGridLayout, selectedChartIds, gridColWidth, gridRowHeight, dashboardSettings: {dashboard_other_settings: { layout_setting }}} = this.state;
    const {keyCode} = e;
    const chartGrid = tempChartsGridLayout.findIndex(chartGrid => chartGrid.id === selectedChartIds[0] );
    if(chartGrid === -1) return;

    switch(keyCode){
      case 37:
        tempChartsGridLayout[chartGrid].x = Math.max(tempChartsGridLayout[chartGrid].x - gridColWidth, 0);
        break;
      case 38:
        tempChartsGridLayout[chartGrid].y = Math.max(tempChartsGridLayout[chartGrid].y - gridRowHeight, 0);        
        break;
      case 39:
        tempChartsGridLayout[chartGrid].x = Math.min(tempChartsGridLayout[chartGrid].x + gridColWidth, layout_setting.width - tempChartsGridLayout[chartGrid].w -10);
        break;
      case 40:
        tempChartsGridLayout[chartGrid].y = Math.min(tempChartsGridLayout[chartGrid].y + gridRowHeight, layout_setting.height - tempChartsGridLayout[chartGrid].h -10);
        break;

      default:
        return;
    }

    this.setState({tempChartsGridLayout}, ()=>{
      if (this.isDashboardInEditMode()) {
        this.handleDashboardChartLayoutSave(); //save the layout
      }
    });
  }

  //Reload the page if client id/name change from url
  componentDidUpdate(prev_props, prev_state) {
    const scriptsAlreadyLoaded = this.state.data_sources.length > 0;
    if (!prev_props.isActiveTab && this.props.isActiveTab && !scriptsAlreadyLoaded) {
      //Cancel Previous API Requests
      console.log('cancel previous view running apis');
      APIService.abortAPIRequests(this.controller);

      setTimeout(() => {
        this.controller = new AbortController();
        this.loadScriptsIfTabBecomesActive();
      }, 100);
    }

    if (this.props.isActiveTab) {
      // If mode has been changed by pressing from either Edit to View or Vice-versa, set the variables accordingly
      if ((prev_props.isDashboardInEditMode !== this.props.isDashboardInEditMode)) {
        let defaultConsolePanelSelectedTab = 'index';
        if (this.isDashboardInEditMode() && (String(this.getDashboardID()).includes('new') || this.props.showDashboardCreatedMsg)) {
          defaultConsolePanelSelectedTab = 'dashboard_settings';
        }
        this.setState({
          consolePanelSelectedTab: defaultConsolePanelSelectedTab,
          showWidgetInfo: false,
          showWidgetLegendDetails: false
        });

        //resize the charts when switching from view mode to edit mode
        this.onWindowResize(true);
      }

      // Whenever NewDashboard Popup is opened, Make sure that for certain form tabs, atleast one accordian is expanded
      if (!prev_state.showNewDashboardForm && this.state.showNewDashboardForm) {
        if (this.state.newDashboardFormCurrentTab === 'presentation' && this.state.newDashboardFormExpandedItemByTab['presentation'] === '') {
          this.setState({ newDashboardFormExpandedItemByTab: { ...this.state.newDashboardFormExpandedItemByTab, 'presentation': 'console' } });
        }
        if (this.state.newDashboardFormCurrentTab === 'data' && this.state.newDashboardFormExpandedItemByTab['data'] === '') {
          this.setState({ newDashboardFormExpandedItemByTab: { ...this.state.newDashboardFormExpandedItemByTab, 'data': 'period' } });
        }
      }
    }

    /**Any side effect we want to have on any state update. Do that here */
    if (prev_props.preferenceAutoHideConsolePanel !== this.props.preferenceAutoHideConsolePanel) {
      this.setState({ preferenceAutoHideConsolePanel: this.props.preferenceAutoHideConsolePanel });
    }


    //Show/hide vertical scrollbar
    if (this.multiChartsScrollableWrapper.current.offsetHeight > window.innerHeight && this.ascVProgressBar.current && prev_state.filteredChartsSettings !== this.state.filteredChartsSettings.length) {
      if (this.multiChartsScrollableWrapper.current.offsetHeight < (window.innerHeight - 70)) {
        this.ascVProgressBar.current.style.display = 'none';
      } else {
        this.ascVProgressBar.current.style.display = 'block';
      }
    } else if (this.ascVProgressBar.current) {
      this.ascVProgressBar.current.style.display = 'none';
    }


    //hide scrollbar when there is not mouse movement
    if (prev_props.showConsolePanel !== this.props.showConsolePanel || prev_state.filteredChartsSettings !== this.state.filteredChartsSettings.length) {
      this.handleCustomProgressBarHorizontalScroll();

      //auto hide scrollbars when mouse is not activ
      let timeout;
      setTimeout(() => {
        document.onmousemove = function () {
          clearTimeout(timeout);

          let hScrollBar = document.querySelector('.asc-progressbar-wrapper.horizontal');
          let vScrollBar = document.querySelector('.asc-progressbar-wrapper.vertical');

          if (hScrollBar) {
            hScrollBar.style.bottom = '0px';
          }
          if (vScrollBar) {
            if (vScrollBar.classList.contains('right')) {
              vScrollBar.style.left = '0px';
              vScrollBar.style.right = 'auto';
            } else {
              vScrollBar.style.right = '0px';
              vScrollBar.style.left = 'auto';
            }
          }

          timeout = setTimeout(() => {
            if (hScrollBar) {
              hScrollBar.style.bottom = '-10px';
            }

            if (vScrollBar) {
              if (vScrollBar.classList.contains('right')) {
                vScrollBar.style.left = '-10px';
                vScrollBar.style.right = 'auto';
              } else {
                vScrollBar.style.right = '-10px';
                vScrollBar.style.left = 'auto';
              }
            }
          }, 3000);
        }
      });
    }

    this.handleCustomProgressBarVerticalScroll();
  }

  componentWillUnmount() {
    //Cancel Previous API Requests
    // console.log('unmount - cancel previous view running apis');
    APIService.abortAPIRequests(this.controller);
    subject2.unSubscribe(this.handleClientChange.bind(this));
    window.removeEventListener('resize', this.onWindowResize);
    this.multiChartsScrollableWrapper.current.removeEventListener("scroll", ()=>{});
  }

  loadScriptsIfTabBecomesActive() {
    if (this.props.isActiveTab) {
      this.handleLoadScripts();
    }
  }
 
  handleLoadScripts() {
    //Call Data Sources API
    this.setState({ inprocess: true, error: '' });
    if(this.props.isPublicView){
      this.getExistingChartListOfDashboard(this.getDashboardID()).then(() => {
        this.setState({ inprocess: false });
        this.getChartDataForAllCharts();
      });

    } else {
      this.getTrendDataSources()
      .then(() => {
        (!String(this.getDashboardID()).includes('new') ? this.getExistingChartListOfDashboard(this.getDashboardID()) : Promise.resolve())
          .then(() => {
            this.setState({ inprocess: false });
            this.getChartDataForAllCharts()
              .then(() => {
                this.getDimensionsForAllDataSources();
                // this.getChartNoteCountForAllCharts();
              });
          })
          .catch(err => {
            this.setState({ inprocess: false, error: err });
          });
      })
      .catch(err => {
        this.setState({ inprocess: false, error: err });
      });
    }
  }

  handleClientChange(obj) {
    this.setState({
      client: obj.client,
    }, () => {
      console.log('loading chart data');
      this.loadScriptsIfTabBecomesActive();
    });
  }

  roundToMultipleOfGridSize(num, gridsize){
    return (Math.ceil(num/gridsize)*gridsize);
  }

  //get dashboard id
  getDashboardID(){
    return this.props.dashboardData.id;
  }

  //get dashboard data key val
  getDashboardDataKeyVal(key=null){
    if(!key){
      return this.props.dashboardData;
    } else {
      if(this.props.dashboardData[key]!==undefined){
        return this.props.dashboardData[key];
      } else {
        return null;
      }
    }
  }


  getResizedChartDimensions(initialSavedCanvasWidth = null) {
    let savedCanvasWidth = initialSavedCanvasWidth ? initialSavedCanvasWidth : this.getSavedCanvasWidth();
    let defaultViewCanvasWidth = this.getDefaultViewModeCanvsWidth();

    let updatedChartDimensions = {
      defaultWidth: this.roundToMultipleOfGridSize(((CHART_DIMENSIONS.defaultWidth * defaultViewCanvasWidth) / savedCanvasWidth), this.state.gridColWidth),
      defaultHeight: this.roundToMultipleOfGridSize(((CHART_DIMENSIONS.defaultHeight * defaultViewCanvasWidth) / savedCanvasWidth), this.state.gridRowHeight),
      defaultSegmentWidth: this.roundToMultipleOfGridSize(((CHART_DIMENSIONS.defaultSegmentWidth * defaultViewCanvasWidth) / savedCanvasWidth), this.state.gridColWidth),
      smWidth: this.roundToMultipleOfGridSize(((CHART_DIMENSIONS.smWidth * defaultViewCanvasWidth) / savedCanvasWidth), this.state.gridColWidth),
      smHeight: this.roundToMultipleOfGridSize(((CHART_DIMENSIONS.smHeight * defaultViewCanvasWidth) / savedCanvasWidth), this.state.gridRowHeight),
      smSegmentWidth: this.roundToMultipleOfGridSize(((CHART_DIMENSIONS.smSegmentWidth * defaultViewCanvasWidth) / savedCanvasWidth), this.state.gridColWidth),
      xsWidth: this.roundToMultipleOfGridSize(((CHART_DIMENSIONS.xsWidth * defaultViewCanvasWidth) / savedCanvasWidth), this.state.gridColWidth),
      xsHeight: this.roundToMultipleOfGridSize(((CHART_DIMENSIONS.xsHeight * defaultViewCanvasWidth) / savedCanvasWidth), this.state.gridRowHeight),
      xsSegmentWidth: this.roundToMultipleOfGridSize(((CHART_DIMENSIONS.xsSegmentWidth * defaultViewCanvasWidth) / savedCanvasWidth), this.state.gridColWidth),
      defaultScorecardWidth: this.roundToMultipleOfGridSize(((CHART_DIMENSIONS.defaultScorecardWidth * defaultViewCanvasWidth) / savedCanvasWidth), this.state.gridColWidth),
      defaultScorecardHeight: this.roundToMultipleOfGridSize(((CHART_DIMENSIONS.defaultScorecardHeight * defaultViewCanvasWidth) / savedCanvasWidth), this.state.gridRowHeight),
      xsScorecardWidth: this.roundToMultipleOfGridSize(((CHART_DIMENSIONS.xsScorecardWidth * defaultViewCanvasWidth) / savedCanvasWidth), this.state.gridColWidth),
      xsScorecardHeight: this.roundToMultipleOfGridSize(((CHART_DIMENSIONS.xsScorecardHeight * defaultViewCanvasWidth) / savedCanvasWidth), this.state.gridRowHeight),
      showLegendCount: 0
    };

    // let updatedChartDimensions = {
    //   defaultWidth: Math.round(((CHART_DIMENSIONS.defaultWidth * defaultViewCanvasWidth) / savedCanvasWidth / this.state.gridColWidth) * this.state.gridColWidth),
    //   defaultHeight: Math.round(((CHART_DIMENSIONS.defaultHeight * defaultViewCanvasWidth) / savedCanvasWidth / this.state.gridRowHeight) * this.state.gridRowHeight),
    //   defaultSegmentWidth: Math.round(((CHART_DIMENSIONS.defaultSegmentWidth * defaultViewCanvasWidth) / savedCanvasWidth / this.state.gridColWidth) * this.state.gridColWidth),
    //   smWidth: Math.round(((CHART_DIMENSIONS.smWidth * defaultViewCanvasWidth) / savedCanvasWidth / this.state.gridColWidth) * this.state.gridColWidth),
    //   smHeight: Math.round(((CHART_DIMENSIONS.smHeight * defaultViewCanvasWidth) / savedCanvasWidth / this.state.gridRowHeight) * this.state.gridRowHeight),
    //   smSegmentWidth: Math.round(((CHART_DIMENSIONS.smSegmentWidth * defaultViewCanvasWidth) / savedCanvasWidth / this.state.gridColWidth) * this.state.gridColWidth),
    //   xsWidth: Math.round(((CHART_DIMENSIONS.xsWidth * defaultViewCanvasWidth) / savedCanvasWidth / this.state.gridColWidth) * this.state.gridColWidth),
    //   xsHeight: Math.round(((CHART_DIMENSIONS.xsHeight * defaultViewCanvasWidth) / savedCanvasWidth / this.state.gridRowHeight) * this.state.gridRowHeight),
    //   xsSegmentWidth: Math.round(((CHART_DIMENSIONS.xsSegmentWidth * defaultViewCanvasWidth) / savedCanvasWidth / this.state.gridColWidth) * this.state.gridColWidth),
    //   defaultScorecardWidth: Math.round(((CHART_DIMENSIONS.defaultScorecardWidth * defaultViewCanvasWidth) / savedCanvasWidth / this.state.gridColWidth) * this.state.gridColWidth),
    //   defaultScorecardHeight: Math.round(((CHART_DIMENSIONS.defaultScorecardHeight * defaultViewCanvasWidth) / savedCanvasWidth / this.state.gridRowHeight) * this.state.gridRowHeight),
    //   xsScorecardWidth: Math.round(((CHART_DIMENSIONS.xsScorecardWidth * defaultViewCanvasWidth) / savedCanvasWidth / this.state.gridColWidth) * this.state.gridColWidth),
    //   xsScorecardHeight: Math.round(((CHART_DIMENSIONS.xsScorecardHeight * defaultViewCanvasWidth) / savedCanvasWidth / this.state.gridRowHeight) * this.state.gridRowHeight),
    //   showLegendCount: 0
    // };

    // if (updatedChartDimensions['defaultWidth'] % this.state.gridColWidth !== 0) {
    //   updatedChartDimensions['defaultWidth'] = Math.round(updatedChartDimensions['defaultWidth'] / this.state.gridColWidth) * this.state.gridColWidth;
    // }
    // if (updatedChartDimensions['defaultHeight'] % this.state.gridRowHeight !== 0) {
    //   updatedChartDimensions['defaultHeight'] = Math.round(updatedChartDimensions['defaultHeight'] / this.state.gridRowHeight) * this.state.gridRowHeight;
    // }
    // if (updatedChartDimensions['defaultSegmentWidth'] % this.state.gridColWidth !== 0) {
    //   updatedChartDimensions['defaultSegmentWidth'] = Math.round(updatedChartDimensions['defaultSegmentWidth'] / this.state.gridColWidth) * this.state.gridColWidth;
    // }
    // if (updatedChartDimensions['smWidth'] % this.state.gridColWidth !== 0) {
    //   updatedChartDimensions['smWidth'] = Math.round(updatedChartDimensions['smWidth'] / this.state.gridColWidth) * this.state.gridColWidth;
    // }
    // if (updatedChartDimensions['smHeight'] % this.state.gridRowHeight !== 0) {
    //   updatedChartDimensions['smHeight'] = Math.round(updatedChartDimensions['smHeight'] / this.state.gridRowHeight) * this.state.gridRowHeight;
    // }
    // if (updatedChartDimensions['smSegmentWidth'] % this.state.gridColWidth !== 0) {
    //   updatedChartDimensions['smSegmentWidth'] = Math.round(updatedChartDimensions['smSegmentWidth'] / this.state.gridColWidth) * this.state.gridColWidth;
    // }
    // if (updatedChartDimensions['xsWidth'] % this.state.gridColWidth !== 0) {
    //   updatedChartDimensions['xsWidth'] = Math.round(updatedChartDimensions['xsWidth'] / this.state.gridColWidth) * this.state.gridColWidth;
    // }
    // if (updatedChartDimensions['xsHeight'] % this.state.gridRowHeight !== 0) {
    //   updatedChartDimensions['xsHeight'] = Math.round(updatedChartDimensions['xsHeight'] / this.state.gridRowHeight) * this.state.gridRowHeight;
    // }
    // if (updatedChartDimensions['xsSegmentWidth'] % this.state.gridColWidth !== 0) {
    //   updatedChartDimensions['xsSegmentWidth'] = Math.round(updatedChartDimensions['xsSegmentWidth'] / this.state.gridColWidth) * this.state.gridColWidth;
    // }
    // if (updatedChartDimensions['defaultScorecardWidth'] % this.state.gridColWidth !== 0) {
    //   updatedChartDimensions['defaultScorecardWidth'] = Math.round(updatedChartDimensions['defaultScorecardWidth'] / this.state.gridColWidth) * this.state.gridColWidth;
    // }
    // if (updatedChartDimensions['defaultScorecardHeight'] % this.state.gridRowHeight !== 0) {
    //   updatedChartDimensions['defaultScorecardHeight'] = Math.round(updatedChartDimensions['defaultScorecardHeight'] / this.state.gridRowHeight) * this.state.gridRowHeight;
    // }
    // if (updatedChartDimensions['xsScorecardWidth'] % this.state.gridColWidth !== 0) {
    //   updatedChartDimensions['xsScorecardWidth'] = Math.round(updatedChartDimensions['xsScorecardWidth'] / this.state.gridColWidth) * this.state.gridColWidth;
    // }
    // if (updatedChartDimensions['xsScorecardHeight'] % this.state.gridRowHeight !== 0) {
    //   updatedChartDimensions['xsScorecardHeight'] = Math.round(updatedChartDimensions['xsScorecardHeight'] / this.state.gridRowHeight) * this.state.gridRowHeight;
    // }
    return updatedChartDimensions;
  }


  //update chart widget size as per saved ratio
  onWindowResize(renderChart = null) {
    let updatedTempGridLayouts = JSON.parse(JSON.stringify(this.state.chartsGridLayout));
    let stateObj = {};

    if (!this.isDashboardInEditMode() && this.state.currentViewModeType.name === 'Fit to Width') {
      // console.log('window size', window.innerWidth);
      if (this.state.tempChartsGridLayout.length > 0 && updatedTempGridLayouts.length > 0) {
        let chartMainCords;
        // let updatedChartDimensions = this.getResizedChartDimensions(updatedTempGridLayouts);
        let updatedChartDimensions = this.getResizedChartDimensions();

        stateObj['chart_dimensions'] = updatedChartDimensions;
        updatedTempGridLayouts.forEach((layout) => {
          chartMainCords = this.getCordinatesInRatioToScreenSize(layout);
          layout['w'] = chartMainCords.w;
          layout['h'] = chartMainCords.h;
          layout['x'] = chartMainCords.x;
          layout['y'] = chartMainCords.y;
          if (chartMainCords.sw !== undefined) {
            layout['sw'] = chartMainCords.sw;
          }
        });
      }
    } else {
      stateObj['chart_dimensions'] = { ...CHART_DIMENSIONS };
    }
    stateObj['tempChartsGridLayout'] = updatedTempGridLayouts;

    this.setState(stateObj, () => {
      //re-render charts when it is in view mode - 
      if ((!this.isDashboardInEditMode() && this.state.currentViewModeType.name === 'Fit to Width') || renderChart === true) {
        this.state.filteredChartsSettings.forEach((item) => {
          this.renderChart(item);
        });
      }
    });
  }


  /**************************
  * Global functions *
  ***************************/
  //Handle any tabs click - event, type (state variable name), index
  handleConsolePanelTabChange(tab) {
    const doCoreTask = () => {
      let state = {
        consolePanelSelectedTab: tab,
        previewChartSettings: null, // close the ChartPreview overlay
        constructorSettingsCurrentSubtab: 'dataset',
        showWidgetInfo: false,
        showWidgetLegendDetails: false
      };
      const unsavedNewChartAvailable = this.state.filteredChartsSettings.some((e) => e.id === NEW_CHART_ID);
      //Remove the earlier unsaved chart if it already exists
      if (unsavedNewChartAvailable) {
        this.removeUnsavedChartFromList();
      }

      if (tab === 'constructor') {
        state.constructorTransitionScreenVisible = true;
        state.constructorTransitionScreenCurrentSubtab = 'create';
      } else {
        state.currentChartEditId = null;
        state.selectedChartIds = [];
      }
      this.getInitVariables()
      //console.log(this.state.constructorSettingsCurrentSubtab );
      this.setState(state);

      // do needed side effects
      if (!this.props.dashboardData.showConsolePanel) {
        this.props.onPanelToggle(this.getDashboardID(), 'showConsolePanel');
      }

      // Fetch notes list when insight tab is opened and list not fetched already(might happen when somehow earlier request was failed)
      if (tab === 'insight' && this.state.insightNotes === null && !this.state.loadingNotes) {
        this.getDashboardInsightNotes();
      }
      // Fetch Organisation list when share tab is opened and list not fetched already
      if (tab === 'share') {
        // In case sharedList is not fetched yet, fetch the list
        if (this.state.sharedUsers === null && !this.state.loadingSharedUsers) {
          this.getSharedUsersList();
        }
      }

      //hide the new dahsboard create chart msg
      if(tab==='dashboard_settings' && this.props.showDashboardCreatedMsg && this.state.filteredChartsSettings.length > 0){
        this.props.hideDashboardCreatedMsg();
      }
    };

    const chartFormChangeCount = this.giveConstructorSettingsChangeCount() + this.giveConstructorBandSettingsChangeCount() + this.giveConstructorFormatSettingsChangeCount();
    if (chartFormChangeCount === 0) {
      doCoreTask();
    } else {
      this.callbackAfterDiscardScreen = doCoreTask;
      this.setState({ showNewSettingsDiscardMessage: true });
    }
  }

  /**Instantiate newChartSettings with passed chart type and triggers movement of chart placeholder on mouse move */
  handleInitialChartTypeSelect(cType) {
    let newChartSettings = { ...this.getNewChartInitialSettings() };
    newChartSettings['chart_type'] = cType;
    this.instantiateNewChartWithGivenSettings(newChartSettings);
  }

  /**Creates a new Chart placeholder DIV and triggers attaching mouse events on this */
  instantiateNewChartWithGivenSettings(chartSett) {
    let updatedChartSett = { ...chartSett };
    const originalCId = updatedChartSett.id; // will be available, when chart is being copied
    // Assign the new id = NEW_CHART_ID
    updatedChartSett['id'] = NEW_CHART_ID;

    let updatedFilteredChartsSettings = [...this.state.filteredChartsSettings];
    updatedFilteredChartsSettings.push(updatedChartSett);

    //add new layout settings, if chart is being copied, use the width and height of original chart
    let updatedNewChartLayoutSettings = { ...this.getNewChartInitialLayoutSettings() };
    if (updatedChartSett['chart_type'] === 'scorecard') {
      updatedNewChartLayoutSettings.w = this.state.chart_dimensions.xsScorecardWidth;
      updatedNewChartLayoutSettings.h = this.state.chart_dimensions.xsScorecardHeight;
    }

    let otherSettings = this.giveDashboardOtherSettings();
    let saved_layout_width;
    if (otherSettings.layout_setting.type === 'preset' && Constants.DevicesSizes[otherSettings.layout_setting.device_category] !== undefined) {
      let presetindex = Constants.DevicesSizes[otherSettings.layout_setting.device_category].findIndex((e) => e.name === otherSettings.layout_setting.device);
      if (presetindex > -1) {
        let deviceInfo = Constants.DevicesSizes[otherSettings.layout_setting.device_category][presetindex];
        let deviceSize = deviceInfo.size.split('*');
        saved_layout_width = deviceSize[0];
      }
    } else {
      saved_layout_width = otherSettings.layout_setting.width;
    }

    //reset to default widget size to small widget size
    if (updatedChartSett['chart_type'] !== 'scorecard' && saved_layout_width <= CHART_DIMENSIONS.defaultWidth) {
      updatedNewChartLayoutSettings.w = this.state.chart_dimensions.smWidth;
      updatedNewChartLayoutSettings.h = this.state.chart_dimensions.smHeight;
    } else if (updatedChartSett['chart_type'] === 'scorecard') {
      updatedNewChartLayoutSettings.w = this.state.chart_dimensions.xsScorecardWidth;
      updatedNewChartLayoutSettings.h = this.state.chart_dimensions.xsScorecardHeight;
    } else {
      updatedNewChartLayoutSettings.w = this.state.chart_dimensions.defaultWidth;
      updatedNewChartLayoutSettings.h = this.state.chart_dimensions.defaultHeight;
    }

    if (originalCId !== null) {
      const originalCLayout = this.state.tempChartsGridLayout.find(c => c.id === originalCId) || {};
      updatedNewChartLayoutSettings = { ...updatedNewChartLayoutSettings, ...originalCLayout };
    }
    updatedNewChartLayoutSettings['id'] = updatedChartSett['id'];
    // Reset the position to instantiate at a particular position
    updatedNewChartLayoutSettings['x'] = NEW_CHART_DEFAULT_X;
    updatedNewChartLayoutSettings['y'] = NEW_CHART_DEFAULT_Y;

    //update zindex of new constructor widget
    if (this.state.tempChartsGridLayout.length > 0) {
      let maxZIndex = Math.max.apply(Math, this.state.tempChartsGridLayout.map((chart) => chart.zindex)) + 1;
      updatedNewChartLayoutSettings['zindex'] = maxZIndex;
    }

    let newTempGridLayoutSettings = [...this.state.tempChartsGridLayout];
    newTempGridLayoutSettings.push(updatedNewChartLayoutSettings);

    window.currentSelectedWidget = null;
    this.setState({
      initialConstructorDrag: true,
      selectedChartIds: [], //reset all selected charts
      filteredChartsSettings: updatedFilteredChartsSettings,
      chartsSettings: updatedFilteredChartsSettings,
      newChartSettings: { ...updatedChartSett },
      newChartSettingsLastExecuted: { ...updatedChartSett },
      tempChartsGridLayout: newTempGridLayoutSettings,
      constructorSelectedSubtab: 'first', // force set the selected subtab in case something else was selected
      constructorTransitionScreenVisible: false
    }, () => {
      setTimeout(() => {
        this.handleNewChartPlaceholderMouseMove(updatedChartSett['id']);
      });
    });
  }

  handleNewChartPlaceholderMouseMove(chartId) {
    let that = this;
    let element = document.querySelector('#d-' + that.props.dashboardData.id + ' #chart-' + chartId);
    document.addEventListener('mousemove', chartPlaceholderMove);
    document.addEventListener('mousedown', chartPlaceholderDrop);
    element.classList.add('selected');

    let widgetCordinates = element.getBoundingClientRect();
    const distBwChartLeftEdgeAndMouseX = 20;
    const distBwChartTopEdgeAndMouseY = 20;

    element.style.top = NEW_CHART_DEFAULT_Y + 'px';
    element.style.left = NEW_CHART_DEFAULT_X + 'px';

    // Get the maxZindex so that it can be assigned to new chart
    let updatedZIndex = this.updateAndGiveMaxZIndexAmongCharts(chartId);

    const colChartWrapperDiv = document.querySelector(`#d-${this.getDashboardID()} #col-charts-wrapper`);
    const multiChartsScrollableContainer = this.multiChartsScrollableWrapper.current;
    const multiChartsContainer = multiChartsScrollableContainer.querySelector('#multicharts-wrapper');
    const multiChartsContainerUsableWidth = multiChartsContainer.getBoundingClientRect().width - Number(window.getComputedStyle(multiChartsContainer).getPropertyValue(`padding-${this.props.consolePanelPosition}`).replace('px', ''));


    function chartPlaceholderMove(e) {
      let multiChartsCord = multiChartsContainer.querySelector('#multicharts').getBoundingClientRect();

      // compute mouse X and Y cordinates relative to chart container
      const mouseXRelative = e.pageX - multiChartsCord.left;
      const mouseYRelative = e.pageY - multiChartsCord.top;
      let canNotBeMovedFurtherLeft = (mouseXRelative - distBwChartLeftEdgeAndMouseX < 0);
      let canNotBeMovedFurtherRight = (mouseXRelative - distBwChartLeftEdgeAndMouseX + widgetCordinates.width) > multiChartsContainerUsableWidth;
      let canNotBeMovedFurtherTop = (mouseYRelative - distBwChartTopEdgeAndMouseY < 0);


      if (!canNotBeMovedFurtherLeft && !canNotBeMovedFurtherRight) {
        element.style.left = (mouseXRelative - distBwChartLeftEdgeAndMouseX - 0) + 'px';
        if (canNotBeMovedFurtherTop) {
          element.style.top = 0 + 'px';
        }
      }
      if (!canNotBeMovedFurtherTop) {
        element.style.top = (mouseYRelative - distBwChartTopEdgeAndMouseY - 0) + 'px';
        if (canNotBeMovedFurtherLeft) {
          element.style.left = 0 + 'px';
        }
        if (canNotBeMovedFurtherRight) {
          element.style.left = (multiChartsContainerUsableWidth - widgetCordinates.width) + 'px';
        }
      }
      if ((!canNotBeMovedFurtherLeft && !canNotBeMovedFurtherRight) || !canNotBeMovedFurtherTop) {
        element.style.zIndex = updatedZIndex;
        document.body.style.userSelect = 'none'; // disable user select to avoid selection while dragging  
      }

      // calling below method will handle the auto scroll of charts wrapper if needed
      that.autoScrollChartWrapperIfNeeded(element, colChartWrapperDiv, multiChartsScrollableContainer, multiChartsContainerUsableWidth, that, window.isScrolling);
    }

    function chartPlaceholderDrop(e) {
      window.isScrolling = false;
      // that.multiChartsWrapper.current.style.height ='';
      e.stopPropagation();
      document.removeEventListener('mousemove', chartPlaceholderMove);
      document.removeEventListener('mousedown', chartPlaceholderDrop);
      // element.classList.remove('mousedown');
      document.body.style.userSelect = 'auto';  // revert userSelect property

      // Do nothing if there was no mouse movement, it will be the case when chart is just clicked
      let gridMappedTop = Math.round(Number(element.style.top.replace('px', '')) / that.state.gridRowHeight);
      let gridMappedLeft = Math.round(Number(element.style.left.replace('px', '')) / that.state.gridColWidth);
      let posTop = (gridMappedTop * that.state.gridRowHeight);
      let posLeft = (gridMappedLeft * that.state.gridColWidth);

      if (isNaN(posTop)) return;

      element.style.top = posTop + 'px';
      element.style.left = posLeft + 'px';

      //make the new chart widget selected      
      let uniqueKey = chartId;
      let selectedCIds = [uniqueKey];
      let updateTempChartsGridLayout = [...that.state.tempChartsGridLayout];
      let updateGridLayoutIndex = updateTempChartsGridLayout.findIndex((e) => e.id === uniqueKey);
      updateTempChartsGridLayout[updateGridLayoutIndex] = { ...updateTempChartsGridLayout[updateGridLayoutIndex], x: posLeft, y: posTop, zindex: updatedZIndex };
      that.setState({
        selectedChartIds: selectedCIds,
        currentChartEditId: uniqueKey,
        tempChartsGridLayout: updateTempChartsGridLayout,
        isNewChartPlacedOnScreen: true,
      });
      
      if (that.state.renderCopiedChartOnDrop) {
        // Settings were copied at client side, now on drop we have to create the chart on server as well
        // Hence, trigger the same method which is called on Create/Update button
        that.handleChartCreateOrUpdate();
        that.setState({ renderCopiedChartOnDrop: false });
      }
    }
  }

  updateAndGiveMaxZIndexAmongCharts(chartId) {
    if (this.maxZIndexAmongCharts.id && this.maxZIndexAmongCharts.id === chartId && this.maxZIndexAmongCharts.zindex && !isNaN(this.maxZIndexAmongCharts.zindex)) {
      return this.maxZIndexAmongCharts.zindex;
    }

    this.maxZIndexAmongCharts = {
      zindex: (this.maxZIndexAmongCharts.id && this.maxZIndexAmongCharts.zindex && !isNaN(this.maxZIndexAmongCharts.zindex)) ? (parseInt(this.maxZIndexAmongCharts.zindex) + 1) : (this.getHighestChartZIndex() + 1),
      id: chartId,
    };
    return this.maxZIndexAmongCharts.zindex;
  }

  getHighestChartZIndex() {
    if (this.state.tempChartsGridLayout.length > 0) {
      return Math.max.apply(Math, this.state.tempChartsGridLayout.map(function (e) { return e.zindex; }))
    }
  }

  handleAddNewWidgetBtn() {
    const doCoreTask = () => {
      this.setState({
        constructorTransitionScreenVisible: true,
        constructorTransitionScreenCurrentSubtab: 'create',
        currentChartEditId: null,
        selectedChartIds: []
      });
    };

    const chartFormChangeCount = this.giveConstructorSettingsChangeCount() + this.giveConstructorBandSettingsChangeCount() + this.giveConstructorFormatSettingsChangeCount();
    if (chartFormChangeCount === 0) {
      doCoreTask();
    } else {
      this.callbackAfterDiscardScreen = doCoreTask;
      this.setState({ showNewSettingsDiscardMessage: true });
    }
  }

  //Format Date
  formatDate(date, date_format) {
    return moment(date).format(date_format);
  }

  formatDateRange(dateRange, date_format) {
    return this.formatDate(dateRange[0], date_format) + ' - ' + this.formatDate(dateRange[1], date_format);
  }


  //Get Date Range - pass end_date, days_count, date_format, and seperator
  getDateRange(end_date, days_count, date_format, seperator) {
    var start_date = moment(end_date).subtract((days_count - 1), 'days').format(date_format);
    return (start_date + seperator + end_date);
  }

  //Get All Dimensions
  getDimensionsStr(view_types) {
    let dimensions_list_combined = new Set();
    view_types.forEach(vt => {
      this.state.allDataSourcesDimensionsMetrics[vt].forEach((item) => {
        if (item.is_dimension === 1 && item.type === 'string') {
          dimensions_list_combined.add(item.title)
        }
      });
    });

    return Array.from(dimensions_list_combined).join(',');
  }

  //Convert obj to arr
  getValues(obj) {
    var arr = [];
    Object.keys(obj).forEach((item) => {
      arr.push({ 'id': item, 'name': obj[item] });
    });
    return arr;
  }


  //Get Fitler panel all items list - dimensions, metrics, calculated metrics
  getAllListItems(results) {
    let allItems = [];
    if (results) {
      Object.keys(results).forEach((item) => {
        if (results[item].length > 0) {
          results[item].forEach((subitem) => {
            let obj = subitem;
            obj['id'] = subitem.title;
            if (subitem.is_dimension === 0) {
              obj['default_action'] = (subitem.operation !== undefined) ? 'calculated' : 'sum';
            }
            allItems.push(obj);
          });
        }
      });
    }
    return allItems;
  }


  /***************************************
  * APIs and Chart Specific Functions *
  ***************************************/

  //Get Trend Data Sources
  getTrendDataSources() {
    return new Promise((resolve, reject) => {
      APIService.apiRequest(Constants.API_BASE_URL + '/trend_master/get_data_sources/' + this.state.terminal_type, null, false, 'GET', this.controller)
        .then(response => {
          if (response.status === 1 && response.data !== undefined && response.data.length > 0) {
            let filtered_data_sources = [];
            let allDataSourcesDimensionsMetrics = {};
            let viewTypes = [];

            //show datasources which user has privilege
            response.data.forEach((item) => {
              if (item.is_custom_trend === 0 && (this.user && (this.user.privileges[this.state.terminal_type].includes(item.privilege) || (this.user.privileges['sellside'] !== undefined && this.user.privileges['sellside'].includes('APEX'))))) {
                filtered_data_sources.push(item);
                viewTypes.push(item.name);
                allDataSourcesDimensionsMetrics[item.name] = this.getAllListItems(item.columns);
              }
            });

            this.setState({
              data_sources: filtered_data_sources,
              allDataSourcesDimensionsMetrics: allDataSourcesDimensionsMetrics
            }, () => {
              resolve(viewTypes);
            });
          } else {
            reject();
            console.log('Error: ' + response.msg);
          }
        })
        .catch(err => {
          reject();
          console.log('Error on getting data sources list: ' + err.msg);
        });
    });
  }

  //Default layout settings size, width, height
  getDefaultLayoutSettings(grid_size = null) {
    let defaultViewCanvasWidth = this.getDefaultViewModeCanvsWidth();
    let defaultWidth = grid_size ? (Math.round(defaultViewCanvasWidth / grid_size.gridColWidth) * grid_size.gridColWidth) : CHART_DIMENSIONS.defaultWidth;
    let defaultHeight = grid_size ? (Math.round(((defaultWidth * 9) / 16) / grid_size.gridColWidth) * grid_size.gridColWidth) : CHART_DIMENSIONS.defaultHeight;
    return { 'type': 'auto', 'width': defaultWidth, 'height': defaultHeight };
  }

  //Fetch dashboard charts list
  getExistingChartListOfDashboard(dId) {
    return new Promise((resolve, reject) => {
      let API_URL = Constants.API_BASE_URL + '/trend_master/open_dashboard_tab/' + dId;
      let method = 'PUT';
      if(this.props.isPublicView && this.props.isActiveTab){
        API_URL = Constants.API_BASE_URL +'/trend_master/open_public_dashboard/'+parseInt(this.props.isActiveTab)+'?token='+this.props.publicToken;
        method = 'GET';
      }

      APIService.apiRequest(API_URL, null, false, method, this.controller)
        .then(response => {
          if (response.status === 1) {
            //only for shareable dashboard - open_public_dashboard
            if(response.msg==='Failed'){
              this.setState({ inprocess: false, authroisedDashboardAccess: false });
              reject();
            }

            let updatedChartsSettings = [];
            let savedDashboardOtherSettings = response.dashboard.dashboard_other_settings ? JSON.parse(response.dashboard.dashboard_other_settings) : null;
            let updateChartsGridLayout = savedDashboardOtherSettings && savedDashboardOtherSettings.chart_grid_layout ? savedDashboardOtherSettings.chart_grid_layout : [];
            // let updateChartsGridLayout = [];

            //if not saved for earlier 
            if (savedDashboardOtherSettings && savedDashboardOtherSettings.layout_setting === undefined) {
              savedDashboardOtherSettings['layout_setting'] = this.getDefaultLayoutSettings({ gridColWidth: this.state.gridColWidth, gridRowHeight: this.state.gridRowHeight });
            }

            let updatedDashboardSettings = JSON.parse(JSON.stringify(this.state.dashboardSettings));
            let updatedDashboardSettingsLastSaved = JSON.parse(JSON.stringify(this.state.dashboardSettingsLastSaved));
            updatedDashboardSettings['dashboard_other_settings'] = { ...savedDashboardOtherSettings };
            updatedDashboardSettingsLastSaved['dashboard_other_settings'] = { ...savedDashboardOtherSettings };

            //add div ref
            response.data.forEach((chart, i) => {
              let chartConfig = chart;
              let chartOtherSettings = chartConfig.chart_other_settings ? JSON.parse(chartConfig.chart_other_settings) : {};
              // if(chartOtherSettings['band_settings'] === undefined){
              //   chartOtherSettings['band_settings'] = [this.giveChartBandInitSettings()];
              // }

              // add some extra properties in each chart which are required at client side
              chartConfig['ref'] = React.createRef();
              chartConfig['legendRef'] = React.createRef();
              chartConfig['showLegend'] = chartOtherSettings.showLegend !== undefined ? chartOtherSettings.showLegend : 0; // save in config and get it from API
              chartConfig['showGrid'] = 0; // save in config and get it from API

              if (!chartConfig.chart_format_parameters || chartConfig.chart_format_parameters === '') { //if format is not saved add default
                chartConfig['format'] = { ...getDefaultChartFormat() };
              } else {
                chartConfig['format'] = { ...JSON.parse(chartConfig['chart_format_parameters']) };
              }

              updatedChartsSettings.push(chartConfig);

              //dashboard grid layout exist or not check
              let chart_grid_layout_index = savedDashboardOtherSettings.chart_grid_layout.findIndex((e) => e.id === chart.id);
              if (!savedDashboardOtherSettings || !savedDashboardOtherSettings.chart_grid_layout) {
                updateChartsGridLayout.push(this.getDefaultChartGridLayout(chart)); //use saved config here
              }

              //if chart is under list but chart grid layout does not exist
              if (chart_grid_layout_index === -1) {
                updateChartsGridLayout.splice(i, 0, this.getDefaultChartGridLayout(chart));
              }
            });

            //remove unmatching chart from saved grids layout
            let filteredUpdateChartsGridLayout = [];
            updateChartsGridLayout.forEach((item) => {
              let index = updatedChartsSettings.findIndex((e) => e.id === item.id);
              if (index > -1) {
                filteredUpdateChartsGridLayout.push(item);
              }
            });


            //adjust w, h, x, and y of chart layout as per current screen using saved sreen size. 
            // also find the max zIndex and its chartId to assign to class variable 'maxZIndexAmongCharts'
            // let maxZIndexChart = { zindex: Number.NEGATIVE_INFINITY, id: null };
            let maxZIndexChart = { zindex: 1, id: null };
            let resizedChartsGridLayout = JSON.parse(JSON.stringify(filteredUpdateChartsGridLayout));
            let isRatioResizeRequired = (resizedChartsGridLayout.length > 0 && !this.isDashboardInEditMode() && this.state.currentViewModeType.name === 'Fit to Width');
            let updatedChartDimensions;

            // console.log('filtered chart layout', filteredUpdateChartsGridLayout);
            if (isRatioResizeRequired) {
              let savedCanvasWidth = this.getSavedCanvasWidth(updatedDashboardSettingsLastSaved);
              updatedChartDimensions = this.getResizedChartDimensions(savedCanvasWidth); //change default dimensions

              resizedChartsGridLayout.forEach((layout) => {
                let chartMainCords = this.getCordinatesInRatioToScreenSize(layout, savedCanvasWidth);
                layout['w'] = chartMainCords.w;
                layout['h'] = chartMainCords.h;
                layout['x'] = chartMainCords.x;
                layout['y'] = chartMainCords.y;
                layout['zindex'] = (layout.zindex!==null && layout.zindex!==undefined) ? layout['zindex'] : 1;
                
                if (chartMainCords.sw !== undefined) {
                  layout['sw'] = chartMainCords.sw;
                }
                if (layout.zindex > maxZIndexChart.zindex) {
                  maxZIndexChart = { zindex: layout.zindex, id: layout.id };
                }
              });
            }

            let stateObj = {
              chartsSettings: updatedChartsSettings,
              filteredChartsSettings: updatedChartsSettings,
              chartsGridLayout: filteredUpdateChartsGridLayout,
              tempChartsGridLayout: resizedChartsGridLayout,
              dashboardSettings: updatedDashboardSettings,
              dashboardSettingsLastSaved: updatedDashboardSettingsLastSaved,
              inprocess: false
            };

            if (isRatioResizeRequired) {
              stateObj['chart_dimensions'] = updatedChartDimensions;
            }

            //only for public sharable dashboard
            if(this.props.isPublicView){
              stateObj['authroisedDashboardAccess'] = true;
            }

            this.setState(stateObj, () => {
              this.maxZIndexAmongCharts = maxZIndexChart;
              resolve();
            });

          } else {
            this.setState({ inprocess: false });
            reject();
            console.log('Error while getting chart list: ' + response.msg);
          }
        })
        .catch(err => {
          reject();
          console.log('Error on getting data sources list: ' + err.msg);
        });
    });
  }


  getDefaultChartGridLayout(chart) {
    let showLegend = chart.showLegend !== undefined ? chart.showLegend : 0;
    let default_chart_width = (chart.segmentation !== '' && showLegend) ? (parseInt(this.state.chart_dimensions.defaultWidth) + parseInt(this.state.chart_dimensions.defaultSegmentWidth)) : this.state.chart_dimensions.defaultWidth;

    // add y placement details
    let newDefaultXYPlacements = { ...this.state.defaultXYPlacements };
    let newDefaultXYPlacementsLen = Object.keys(newDefaultXYPlacements).length;

    let currentYIndex = newDefaultXYPlacementsLen > 0 ? (newDefaultXYPlacementsLen - 1) : 0;
    let total_widgets_width = newDefaultXYPlacements[currentYIndex] !== undefined ? newDefaultXYPlacements[currentYIndex].reduce((sum, current) => sum + current.w, 0) : 0;
    let available_width = window.innerWidth - total_widgets_width;

    // Decide x and y based on chart width and available window width
    // 0+450+750 = 1440-1200 = 240 available width; if current chart width is less than available width change the y index
    if (available_width < default_chart_width) {
      currentYIndex = currentYIndex + 1;
      newDefaultXYPlacements[currentYIndex] = [{ w: default_chart_width, h: this.state.chart_dimensions.defaultHeight }];
    } else {
      if (newDefaultXYPlacements[currentYIndex]) {
        newDefaultXYPlacements[currentYIndex].push({ w: default_chart_width, h: this.state.chart_dimensions.defaultHeight });
      } else {
        newDefaultXYPlacements[currentYIndex] = [{ w: default_chart_width, h: this.state.chart_dimensions.defaultHeight }];
      }
    }

    //if space not available in right side to place the chart, change the yindex and xindex reset to 0
    let currentXIndex = total_widgets_width;
    if (available_width < default_chart_width) {
      currentXIndex = 0;
    }

    //add gap of one grid size (10px)
    if (currentXIndex > 0) { currentXIndex = currentXIndex + ((newDefaultXYPlacements[currentYIndex].length - 1) * this.state.gridColWidth); }
    this.setState({
      defaultXYPlacements: newDefaultXYPlacements
    });
    let updatedCurrentYIndex = currentYIndex > 0 ? ((currentYIndex * this.state.chart_dimensions.defaultHeight) + (currentYIndex * this.state.gridRowHeight)) : (currentYIndex * this.state.chart_dimensions.defaultHeight);

    return {
      w: default_chart_width,
      h: this.state.chart_dimensions.defaultHeight,
      x: currentXIndex,
      y: updatedCurrentYIndex,
      sw: showLegend ? this.state.chart_dimensions.defaultSegmentWidth : 0,
      zindex: 1,
      // screen: window.innerWidth,
      id: chart.id
    }
  }

  /**Fetches/Refreshes the data for all charts in dashboard */
  getChartDataForAllCharts() {
    let chartLoadings = this.state.chartsLoadingsObj;
    let promises = [];

    this.state.filteredChartsSettings.forEach((item) => {
      let payload = this.getFetchChartDataPayload(item);
      chartLoadings = { ...chartLoadings, [item.id]: true };

      let apiRequest = this.fetchChartData(payload);
      promises.push(apiRequest);

      apiRequest
        .then((chartData) => {
          this.setState({
            chartsLoadingsObj: { ...this.state.chartsLoadingsObj, [item.id]: false },
            dashboardSettingsLastSaved: { ...this.state.dashboardSettings } // added later because the when date period selected in dashboard level, on period change on view mode not showing the selected date period
          });
          
          this.storeChartData(chartData, item);
          this.getChartBandDataIfApplicable(item);
          this.renderChart(item);
        })
        .catch(err => {
          this.setState({ chartsLoadingsObj: { ...this.state.chartsLoadingsObj, [item.id]: false } })
          console.log(err);
        });
    });
    // update the chartloadings in state
    this.setState({ chartsLoadingsObj: chartLoadings });

    return Promise.allSettled(promises);
  }

  getChartBandDataIfApplicable(item) {
    const bandSettings = this.giveBandSettingsFromChartPlottingParams(item);
    if (bandSettings.length) {
      let promises = bandSettings.map(bandSett => {
        let payload = this.getFetchChartDataPayload(item);
        payload.segmentation = ''; // always empty, kept for api support 
        payload.band_params = { ...bandSett };
        delete payload.method;

        return this.fetchChartBandData(payload);
      });

      this.setState({ chartsLoadingsObj: { ...this.state.chartsLoadingsObj, [item.id]: true } });

      Promise.all(promises)
        .then((bandsData) => {
          this.setState({ chartsLoadingsObj: { ...this.state.chartsLoadingsObj, [item.id]: false } });
          let formattedBandsData = bandsData.map((b) => formatChartData(b, 'date'));
          this.storeChartBandData(formattedBandsData, item);
          this.renderChart(item);
        })
        .catch((err) => {
          this.setState({ chartsLoadingsObj: { ...this.state.chartsLoadingsObj, [item.id]: false } });
          console.log(err)
        });

    }
  }

  // getChartNoteCountForAllCharts() {
  //   // this.setState({ inprocess: true });
  //   this.state.chartsSettings.forEach((item) => {
  //     this.getChartNotesForIndividualChart(item.id)
  //       .then((noteCount) => {
  //         this.setState({ chartNoteCountObj: { ...this.state.chartNoteCountObj, [item.id]: noteCount } })
  //       })
  //       .catch(err => {
  //         console.log(err)
  //       });
  //   });
  // }


  getChartNotesForIndividualChart(chartId) {
    return new Promise((resolve, reject) => {
      APIService.apiRequest(Constants.API_BASE_URL + `/trend_master/note?type=chart&id=${chartId}`, {}, false, 'GET', this.controller)
        .then(response => {
          if (response.status === 1 && response.data !== undefined) {
            resolve(response.data.length)
          } else {
            resolve(0)
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  //Get Dimension using API
  getDimensionsForAllDataSources() {
    this.setState({
      sourceDimensionsInProcess: true
    });

    let dimension_filters = {};
    if (this.user && this.user.parent_organization_id > 1) {
      let filters = [];
      if (Array.isArray(this.user.attributes)) {
        this.user.attributes.forEach((item) => {
          filters.push(item.site_name);
        });
      }
      dimension_filters = { "property": filters };
    }

    const dimensionListUnion = this.getDimensionsStr(this.state.data_sources.map(ds => ds.name)).split(',');

    let dimensionLoadedCount = 0;
    const presentationFiltersSaved = this.state.dashboardSettings.presentationFilters;

    let promises = []; // to detect when all requests are completed and then doing some other tasks
    dimensionListUnion.forEach(dim => {
      const dimensionPayLoad = {
        "client_id": this.state.client.id,
        "view_type": this.state.data_sources.map(ds => ds.name).join(','),
        "dimension": dim,
        "dimension_filter": dimension_filters
      };

      // if (view_type === 'performance') {
      //   dimensionPayLoad['data_source'] = 'advertiser';
      // }
      const promise = APIService.apiRequest(Constants.API_BASE_URL + '/getAllDimensions', dimensionPayLoad, false, 'POST', this.controller)
      promises.push(promise);
      promise.then(response => {
        if (response.status === 1 && response.data !== undefined) {
          let allDimensions = { ...this.state.allDataSourcesDimensionsList };

          response.data.forEach(ds => {
            const viewTypeDataParsed = ds.data;
            allDimensions[ds.view_type] = allDimensions[ds.view_type] || {};
            allDimensions[ds.view_type][dim] = viewTypeDataParsed[dim];
          });

          dimensionLoadedCount++;

          let updatedState = {
            sourceDimensionsInProcess: dimensionLoadedCount < dimensionListUnion.length,
            allDataSourcesDimensionsList: allDimensions,
          };

          // All the presentation filters need to be toggled Checked initially if they were not saved earlier
          if (!presentationFiltersSaved.length) {
            updatedState.dashboardSettings = { ...this.state.dashboardSettings, presentationFilters: [...this.state.dashboardSettings.presentationFilters, dim] }
          }

          this.setState(updatedState);
        } else {
          this.setState({ sourceDimensionsInProcess: false, error: response.msg });
        }
      })
        .catch(err => {
          this.setState({ sourceDimensionsInProcess: false, error: err.msg });
        });
    });

    Promise.all(promises)
      .then(() => {
        // fetch the data required for other tabs in background
        const isNewDashboard = this.state.dashboardSettings.id === null;
        !isNewDashboard && !this.state.insightNotes && this.getDashboardInsightNotes();
        !isNewDashboard && !this.state.sharedUsers && this.getSharedUsersList();
      }).catch(e => {
        console.log('Some error occured in fetching one of the dimensions', e);
      });
  }

  getDashboardInsightNotes() {
    this.setState({ loadingNotes: true });

    APIService.apiRequest(Constants.API_BASE_URL + `/trend_master/note?type=dashboard&id=${this.getDashboardID()}`, {}, false, 'GET', this.controller)
      .then(response => {
        if (response.status === 1) {
          // change the structure of 'chart_notes' in response before saving to state
          const chartNotes = [].concat(...response.data.chart_notes.map(c => c.notes.map(n => ({ ...n, chart_name: c.chart_name }))));
          response.data.chart_notes = chartNotes;
          // Also change the date format in chart notes if dates are there
          response.data.chart_notes = formatChartData(response.data.chart_notes, 'x_axis_point');
          this.setState({
            insightNotes: response.data,
            loadingNotes: false,
          });
          setTimeout(() => {
            // redraw all charts in pointSelectionMode ON
            this.state.chartsSettings.forEach(cs => {
              this.renderChart(cs);
            });
          });
        } else {
          this.setState({ loadingNotes: false });
        }
      })
      .catch(err => {
        this.setState({ loadingNotes: false });
        console.log('error insights', err);
      });
  }

  getDashboardInsightChildNotes(parentNoteId) {
    return new Promise((resolve, reject) => {
      this.setState({ insightNotesRepliesLoadings: { ...this.state.insightNotesRepliesLoadings, [parentNoteId]: true } });

      APIService.apiRequest(Constants.API_BASE_URL + `/trend_master/note?type=dashboard&id=${this.getDashboardID()}&parent_note_id=${parentNoteId}`, {}, false, 'GET', this.controller)
        .then(response => {
          if (response.status === 1) {
            this.setState({
              insightNotesReplies: { ...this.state.insightNotesReplies, [parentNoteId]: response.data.dashboard_notes },
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
          console.log('error', err);
          reject();
        });
    });
  }


  /*******************************
  * Console Panel Functions *
  ******************************/

  //show/hide grids on chart
  handleGridToggle(e, index) {
    let updatedChartConfig = {};
    let newShowGridVal;
    if (index !== null) {
      let chartsSettings = [...this.state.chartsSettings];
      newShowGridVal = chartsSettings[index]['showGrid'] === 1 ? 0 : 1;
      chartsSettings[index]['showGrid'] = newShowGridVal;
      updatedChartConfig['chartsSettings'] = chartsSettings;
    } else {
      let tempNewChartSettings = { ...this.state.newChartSettings };
      tempNewChartSettings['showGrid'] = tempNewChartSettings['showGrid'] === 1 ? 0 : 1;
      updatedChartConfig['newChartSettings'] = tempNewChartSettings;
    }
    this.setState(updatedChartConfig, () => {
      // this.renderChart(this.state.newChartSettings, 'single');
    });
  }

  handleBandToggle(chartIndex) {
    if (chartIndex !== null) { return }
    if (this.state.newChartSettings.x_axis !== 'date') {
      alertService.showToast('error', 'Band can only be applied on "Date" X-Axis ');
      return;
    }

    this.fetchChartBandDataForLineChart(this.state.newChartSettings);
  }

  //On filter dropdown icon click show list of that filter's options
  handleFilterOptionsList(filter) {
    this.setState({ chartFormOpenedFilterId: filter, chartFormSearchInput: '' });
  }

  giveDashboardFilters() {
    const filtersByDataSource = this.state.allDataSourcesDimensionsList;
    let dashboardAllFiltersAndDimensions = {};
    for (let dataSource in filtersByDataSource) {
      for (let filterName in filtersByDataSource[dataSource]) {
        if (filterName in dashboardAllFiltersAndDimensions) {
          filtersByDataSource[dataSource][filterName].forEach(filterVal => {
            if (!dashboardAllFiltersAndDimensions[filterName].includes(filterVal)) {
              dashboardAllFiltersAndDimensions[filterName].push(filterVal);
            }
          });
        } else {
          dashboardAllFiltersAndDimensions[filterName] = [];
          dashboardAllFiltersAndDimensions[filterName].push(...filtersByDataSource[dataSource][filterName]);
        }
      }
    }
    return dashboardAllFiltersAndDimensions;
  }


  //on Minimize Console Panel
  handleMinimizeConsolePanel(e) {
    // change custom scroll left to 0

    //minimize the console panel
    const doCoreTask = () => {
      e.preventDefault();

      const unsavedNewChartAvailable = this.state.filteredChartsSettings.some((e) => e.id === NEW_CHART_ID);
      //Remove the earlier unsaved chart if it already exists
      if (unsavedNewChartAvailable) {
        this.removeUnsavedChartFromList();
      }
      this.setState({
        currentChartEditId: null,
        selectedChartIds: [],
        previewChartSettings: null
      });

      this.props.onPanelToggle(this.getDashboardID(), 'showConsolePanel');
    };

    const chartFormChangeCount = this.giveConstructorSettingsChangeCount() + this.giveConstructorBandSettingsChangeCount() + this.giveConstructorFormatSettingsChangeCount();
    if (chartFormChangeCount === 0) {
      doCoreTask();
    } else {
      this.callbackAfterDiscardScreen = doCoreTask;
      this.setState({ showNewSettingsDiscardMessage: true });
    }
  }

  //show console minimized button
  showConsoleMinimizedButton() {
    let showButton = true;
    if (this.state.dashboardSettings.id === null) {
      showButton = false;
    }
    return showButton;
  }

  getConsolePanelHeader(title) {
    return (<div className="tabs-header-wrapper">
      <div className="header-title">
        <h4>{title}</h4>
        <div className="constructor-type">
          {title==='Constructor' && <div className="status">Unsaved Changes</div>}

          {(!this.state.preferenceAutoHideConsolePanel && this.showConsoleMinimizedButton()) &&
            <div className="panel-close-options">
              <button className={"btn-panel-minimize" + (!this.props.dashboardData.showConsolePanel ? " panel-closed" : "")} title="Minimize Panel" onClick={(e) => this.handleMinimizeConsolePanel(e)}></button>
            </div>
          }
        </div>
      </div>

      {(title==='Constructor' && this.state.constructorTransitionScreenVisible) &&
        <div className="constructor-transition-header">
          <button className={'btn-create-new btn btn-medium' + (this.state.constructorTransitionScreenCurrentSubtab === 'create' ? ' selected' : '')} onClick={() => this.handleConstructorTransitionSubtabChange('create')}>Create New</button>
          <button className={'btn-copy btn btn-medium' + (this.state.constructorTransitionScreenCurrentSubtab === 'copy' ? ' selected' : '')} onClick={() => this.handleConstructorTransitionSubtabChange('copy')}>Copy Widget</button>
        </div>
      }

      {title==='Index' &&
        <div className="tabs-top-settings">
          <button className={'total-widget'} ><span>{`${this.state.chartsSettings.length}`}</span>Widgets</button>
          
          {!this.isDashboardInEditMode() &&
            <div className="view-mode-control">
              <SpeedSelect
                options={this.viewModes}
                selectedOption={this.state.currentViewModeType}
                onSelect={(e) => this.handleViewModeChange(e)}
                displayKey='name'
                uniqueKey='id'
                selectLabel='View Mode'
                maxHeight={65}
              />
            </div>
          }
        </div>
      }

      {title==='Share' &&
        <div className="share-header sticky-div">
          <div className="share-title">{this.state.shareShowNewForm ? 'Invite New Members' : 'Active Members'} </div>
        </div>
      }
    </div>);
  }


  //Get console panel tab content
  getConsolePanelTabContent() {
    const selectedTab = this.state.consolePanelSelectedTab;
    const disableActionBtns = this.state.chartOrDashboardSaveInProcess;
    const constructorChangeCount = this.giveConstructorSettingsChangeCount();
    const constructorBandChangeCount = this.giveConstructorBandSettingsChangeCount();
    const constructorFormatChangeCount = this.giveConstructorFormatSettingsChangeCount();
    let changeCount = (constructorChangeCount + constructorBandChangeCount + constructorFormatChangeCount);

    let consolePanelTitle = '';
    if(this.state.showWidgetInfo){ consolePanelTitle = 'Widget Information' }
    if(this.state.showWidgetLegendDetails){ consolePanelTitle = 'Chart Legend' }
    if(selectedTab === 'dashboard_settings'){ consolePanelTitle = 'Settings' }
    if(selectedTab === 'constructor'){ consolePanelTitle = 'Constructor' }
    if(selectedTab === 'index' || selectedTab === 'search'){ consolePanelTitle = 'Index' }
    if(selectedTab === 'insight') { consolePanelTitle = 'Insight' }
    if(selectedTab === 'share') { consolePanelTitle = 'Share' }
    if(selectedTab === 'controls') { consolePanelTitle = 'controls' }

    return (
      <div className="console-content-wrapper">
        <div className="console-inner-wrapper">
          {this.getConsolePanelHeader(consolePanelTitle) }

          <div className="tabs-content-wrapper">
            <div className="tab-content">
              {selectedTab!=='' && this.getConsolePanelTabMainContent(selectedTab)}
              {this.state.showWidgetInfo && this.getWidgetInfo()}
              {this.state.showWidgetLegendDetails && this.getWidgetLegendDetails()}
            </div>
          </div>

          <div className="console-btn-wrapper">
            {selectedTab === 'dashboard_settings' &&
              <div className="action-btns">
                <button className="btn-with-icon btn-save-green btn-small" disabled={this.state.dashboardSettings.name.trim() === '' || this.state.chartOrDashboardSaveInProcess} onClick={this.handleDashboardSaveBtn}><i></i><span>{this.state.dashboardSettings.id === null ? 'Create' : 'Save'}</span></button>
              </div>
            }

            {selectedTab === 'controls' &&
              <div className="action-btns">
                <div className='auto-run-btn-container'>
                <div className={'switch-toggle small run-switch'}>
                  <div className="switch">
                    <input type="checkbox" checked={this.state.isAutoRunFilters} onChange={() => {this.setState({ isAutoRunFilters: !this.state.isAutoRunFilters })}} />
                    <label></label>
                  </div>
                </div>
                  <button className={`btn-with-icon btn-run btn-small ${this.state.isAutoRunFilters ? 'auto' : ''}`} title="Auto Run" disabled={disableActionBtns} onClick={this.state.isAutoRunFilters ? () => {} : this.handleDashboardRunBtn}><span>{this.state.isAutoRunFilters ? 'Auto Run' : 'Run'}</span></button>
                </div>
                <button className="btn-with-icon btn-reset btn-small" title="Reset" disabled={disableActionBtns} onClick={this.handleDashboardResetBtn}><i></i><span>Reset</span></button>
              </div>
            }

            {selectedTab === 'constructor' && !this.state.constructorTransitionScreenVisible &&
              <div className="action-btns">
                {this.state.currentChartEditId !== null &&
                  <>
                    <button className="btn-with-icon btn-create btn-small" title={this.state.currentChartEditId === NEW_CHART_ID ? 'Create' : 'Update'} disabled={((disableActionBtns || (changeCount === 0 && (this.state.currentChartEditId !== NEW_CHART_ID))) ? true : false)} onClick={this.handleChartCreateOrUpdate}><i></i><span>{this.state.currentChartEditId === NEW_CHART_ID ? 'Create' : 'Update'}{(changeCount) > 0 && <span className="change-count">{(constructorChangeCount + constructorBandChangeCount + constructorFormatChangeCount)}</span>}</span></button>
                    {this.state.currentChartEditId === NEW_CHART_ID && <button className="btn-with-icon btn-reset btn-small" title="Reset" disabled={disableActionBtns} onClick={this.handleChartResetBtn}><i></i><span>Reset</span></button>}
                    {this.state.currentChartEditId !== NEW_CHART_ID && <button className="btn-with-icon btn-delete btn-small" title="Delete" disabled={disableActionBtns || this.state.currentChartEditId === NEW_CHART_ID} onClick={() => this.handleChartDeleteBtn(this.state.newChartSettings.id)}><i></i><span>Delete</span></button>}
                    {this.state.currentChartEditId !== NEW_CHART_ID && <button className="btn btn-with-icon btn-new btn-small" onClick={this.handleAddNewWidgetBtn}><i></i><span>New</span></button>}
                  </>
                }
              </div>
            }

            {selectedTab === 'share' &&
              <>
                {this.state.shareShowNewForm &&
                  <div className="action-btns">
                    <button className="btn-with-icon btn-invite btn-small" disabled={this.state.chartOrDashboardSaveInProcess} onClick={this.handleShareNewFormSubmit}><i></i><span>Invite</span></button>
                    <button className="btn-with-icon btn-reset btn-small" disabled={this.state.chartOrDashboardSaveInProcess} onClick={this.handleShareNewFormReset}><i></i><span>Reset</span></button>
                    {this.state.sharedUsers && this.state.sharedUsers.length > 0 &&
                      <button className="btn-with-icon btn-cancel btn-small" disabled={this.state.chartOrDashboardSaveInProcess} onClick={() => this.setState({ shareShowNewForm: false })}><i></i><span>Cancel</span></button>
                    }
                  </div>
                }
                {(this.isDashboardInEditMode() && !this.state.shareShowNewForm) &&
                  <div className="action-btns">
                    <button className="btn-with-icon btn-new btn-small" onClick={() => this.handleShareNewBtnClick()}><i></i><span>Invite</span></button>
                  </div>
                }
              </>
            }
          </div>
        </div>
      </div>
    );
  }

  //get console action buttons
  getConsolePanelTabList() {
    const selectedTab = this.state.consolePanelSelectedTab;
    const dashboarPrivileges = this.getDashboardDataKeyVal('privileges');
    const hasInsightTabAccess = dashboarPrivileges ? dashboarPrivileges.includes('COMMENT') : false;
    const hasShareTabAccess = dashboarPrivileges ? dashboarPrivileges.includes('SHARE') : false;
    const hasControlTabAccess = this.state.dashboardSettings.presentationFilters && this.state.dashboardSettings.presentationFilters.length > 0;
    const activeClass = 'active';

    const handleFullscreenBtnClick = () => {
      const ele = document.getElementById('trendmaster');
      const fullScreenFunc = ele.requestFullscreen || ele.webkitRequestFullscreen || ele.msRequestFullscreen;
      fullScreenFunc.call(ele).catch(err => console.log('Some error occured while opening full-screen mode', err));
    }

    return (
      <div className="console-tabs">
        <ul className="chart-tabs-btns">
          {this.isDashboardInEditMode() ?
            <>
              <li className={selectedTab === 'index' ? activeClass : ''}>
                <button onClick={() => this.handleConsolePanelTabChange('index')} className="btn btn-medium">Index</button>
              </li>
              <li className={(selectedTab === 'constructor' ? activeClass : '')}>
                <button onClick={() => this.handleConsolePanelTabChange('constructor')} className="btn btn-medium">Constructor</button>
              </li>
              {hasInsightTabAccess && <li className={(selectedTab === 'insight' ? activeClass : '')}><button className="btn btn-insight" onClick={() => this.handleConsolePanelTabChange('insight')}>Insight</button></li>}
              {hasShareTabAccess && <li className={(selectedTab === 'share' ? activeClass : '')}><button className="btn btn-share" onClick={() => this.handleConsolePanelTabChange('share')}>Share</button></li>}
            </>
            :
            <>
              <li className={(selectedTab === 'search' ? activeClass : '')}><button onClick={() => this.handleConsolePanelTabChange('search')} className="btn btn-medium">Index</button></li>
              {hasControlTabAccess && <li className={selectedTab === 'controls' ? activeClass : ''} ><button onClick={() => this.handleConsolePanelTabChange('controls')} className="btn btn-medium">Controls</button></li>}
              {hasInsightTabAccess && <li className={(selectedTab === 'insight' ? activeClass : '')}><button className="btn btn-insight" onClick={() => this.handleConsolePanelTabChange('insight')}>Insight</button></li>}
              {hasShareTabAccess && <li className={(selectedTab === 'share' ? activeClass : '')}><button className="btn btn-share" onClick={() => this.handleConsolePanelTabChange('share')}>Share</button></li>}
            </>
          }
        </ul>

        <div className="chart-tabs-right">
          <ul className="chart-tabs-icon">
            {this.isDashboardInEditMode() &&
              <li className={'chart-tab-setting'}><button className={'btn-settings'} onClick={() => this.handleConsolePanelTabChange('dashboard_settings')} /*onClick={() => this.setState({ showNewDashboardForm: true })}*/ ></button></li>
            }
            <li><button className="btn-fullscreen" onClick={handleFullscreenBtnClick}></button></li>
          </ul>
        </div>
      </div>
    );
  }

  handleToggleLabel(field, val) {
    let updatedConstructorFormat = { ...this.state.newChartSettings, format: JSON.parse(JSON.stringify(this.state.newChartSettings.format)) };
    updatedConstructorFormat['format']['showLabel'] = val
    // console.log( updatedConstructorFormat['format']['showLabel'] )
    this.setState({ newChartSettings: updatedConstructorFormat });
  }

  //Console Panel - Constructor Format
  handleToggleColorPicker(e, colorPoints, position) {
    if (e !== undefined && e.target.className === 'color') return;
    let updatedConstructorFormat = { ...this.state.newChartSettings, format: JSON.parse(JSON.stringify(this.state.newChartSettings.format)) };
    if (colorPoints === 'multiple') {
      updatedConstructorFormat['format']['color']['dropdown_open' + position] = !updatedConstructorFormat['format']['color']['dropdown_open' + position];
    } else {
      updatedConstructorFormat['format']['color']['dropdown_open'] = !updatedConstructorFormat['format']['color']['dropdown_open'];
    }
    this.setState({ newChartSettings: updatedConstructorFormat });
  }

  handleColorPickerSelect(type, color, chart, position) {
    let updatedConstructorFormat = { ...this.state.newChartSettings, format: JSON.parse(JSON.stringify(this.state.newChartSettings.format)) };
    if (chart === 'heatmap') {
      updatedConstructorFormat['format']['color'][position + '_color'] = color;
    } else {
      updatedConstructorFormat['format']['color']['single_color'] = color;
    }

    this.setState({
      newChartSettings: updatedConstructorFormat,
    });
  }
  handleColorPaletteSelect(type, palette) {
    let updatedConstructorFormat = { ...this.state.newChartSettings, format: JSON.parse(JSON.stringify(this.state.newChartSettings.format)) };
    updatedConstructorFormat['format']['color']['palette'] = palette;

    this.setState({
      newChartSettings: updatedConstructorFormat,
    });
  }

  isNumber(n) {
    return /^[0-9-\b]+$/.test(n);
  }

  //on change of chart format tab input
  handleChartFormatInputChange(e, key, subkey) {
    // if value is not blank, then test the regex
    if (e.target.value[e.target.value.length - 1] === '-' && e.target.value.length > this.state.newChartSettings.format[key][subkey].length && (this.state.newChartSettings.format[key][subkey].includes('-') || this.state.newChartSettings.format[key][subkey].length !== 0)) {
      return;
    }
    let updatedFormat = { ...this.state.newChartSettings, format: JSON.parse(JSON.stringify(this.state.newChartSettings.format)) };
    if (e.target.value === '' || this.isNumber(e.target.value)) {
      updatedFormat['format'][key][subkey] = e.target.value;
    } else {
      if (key === 'show_full_number') {
        updatedFormat['format'][key] = updatedFormat['format'][key] === 1 ? 0 : 1;
      }
    }

    this.setState({
      newChartSettings: updatedFormat
    });
  }

  //constructor format - sorting
  handleAddSortingCondition(type, parentIndex = null) {
    let newUpdatedChartSettings = { ...this.state.newChartSettings, format: JSON.parse(JSON.stringify(this.state.newChartSettings.format)) };
    if (type === 'or') {
      let newIndex = ((Object.keys(newUpdatedChartSettings['format']['sorting']).length - 1) + 1);
      newUpdatedChartSettings['format']['sorting'][newIndex] = [{ condition: '', val: '' }];
    } else {
      newUpdatedChartSettings['format']['sorting'][parentIndex].push({ condition: '', val: '' });
    }
    this.setState({ newChartSettings: newUpdatedChartSettings });
  }

  //remove sorting and/or conditions
  handleRemoveSortingCondition(type, parentIndex = null, currentIndex = null) {
    let newUpdatedChartSettings = { ...this.state.newChartSettings, format: JSON.parse(JSON.stringify(this.state.newChartSettings.format)) };
    if (type === 'or') {
      delete newUpdatedChartSettings['format']['sorting'][parentIndex];
    } else {
      newUpdatedChartSettings['format']['sorting'][parentIndex].splice(currentIndex, 1);
    }
    this.setState({ newChartSettings: newUpdatedChartSettings });
  }

  //constructor format - sorting condition change
  handleSortingConditionChange(e, field_key, parent_index, index) {
    let newUpdatedChartSettings = { ...this.state.newChartSettings, format: JSON.parse(JSON.stringify(this.state.newChartSettings.format)) };
    if (field_key === 'val' || field_key === 'val2') {
      if (e.target.value === '' || this.isNumber(e.target.value)) {
        newUpdatedChartSettings['format']['sorting'][parent_index][index][field_key] = e.target.value;
      }
    } else {
      newUpdatedChartSettings['format']['sorting'][parent_index][index][field_key] = e;
    }
    // console.log(newUpdatedChartSettings)
    this.setState({ newChartSettings: newUpdatedChartSettings });
  }

  formatLastSavedDate(timestamp) {
    if (!timestamp) return '';
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var date = new Date(timestamp);

    return months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear() +
      ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
  }

  //remove edit mode of title
  handleRemoveTitleEditMode() {
    if (this.state.newChartSettings.name.length > 1) {
      this.setState({ editableChartTitle: false });
    }
  }

  //get Chart Title wrapper in constructor
  getChartTitleHTML() {
    let inEditMode = ((this.state.newChartSettings.id === NEW_CHART_ID && this.state.newChartSettings.name === '') || this.state.editableChartTitle);
    let mode_class = inEditMode ? 'field-with-label' : 'viewmode';

    if(inEditMode){
      document.removeEventListener('keydown', this.keyDownEventsHandler);
    }else{
      document.addEventListener('keydown', this.keyDownEventsHandler);
    }

    return (
      <>
        {
          inEditMode ?
            <div className={'constructor title ' + (mode_class)}>
              <div className="label">Name :</div>
              <input type="text" name="chart-title" value={this.state.newChartSettings.name} className="field-control" onChange={(e) => this.onNewConstructorSettingsChange('name', e.target.value)} onBlur={() => this.handleRemoveTitleEditMode()} />
            </div>
            :
            <>
              <div className={'constructor title ' + (mode_class)} onClick={() => this.setState({ editableChartTitle: true })}>
                <div className="label">Name :</div>
                <div className="val">{this.state.newChartSettings.name}</div>
              </div>
            </>
        }
      </>
    );
  }


  //Get Constructor/Dashboard Tab Content by id
  getConsolePanelTabMainContent(id) {
    switch (id) {
      case 'constructor':
        return this.giveConsoleContentHtmlForConstructorTab();

      case 'controls':
        return this.giveConsoleContentHtmlForControlsTab();

      case 'index':
        return (<div id="dashboard-settings" className="dashboaord-tab-content">{this.giveChartsListContent()}</div>);
        
      case 'search':
        return (<div id="search-settings" className="dashboaord-tab-content">{this.giveChartsListContent()}</div>);
        
      case 'insight':
        return this.giveConsoleContentHtmlForInsightsTab();
        
      case 'share':
        return this.giveConsoleContentHtmlForShareTab();
        
      case 'dashboard_settings':
        return this.giveConsoleContentHtmlForDashboardSettings();

      default:
        return (<div id="no-access" className="dashboaord-tab-content">Control panel disabled for View Mode</div>);
    }
  }

  //get selected widget meta information
  getWidgetInfo(){
    let net_details, previous_period, previous_period_change, 
    previous_period_net_details, previous_period_start_date, previous_period_end_date = null;

    if(this.state.showWidgetInfo.type === 'scorecard'){
      let netDetails = this.state.chartsFormattedNetData[this.state.showWidgetInfo.id][this.state.showWidgetInfo.yaxis_val];
      if(netDetails) {
        net_details = netDetails['net_details'];
        previous_period = netDetails['previous_period'].split('-');
        previous_period_start_date = previous_period[1]+'.'+previous_period[2]+'.'+previous_period[0];
        previous_period_end_date = previous_period[4]+'.'+previous_period[5]+'.'+previous_period[3];
        previous_period_change = netDetails['previous_period_change'];
        previous_period_net_details = netDetails['previous_period_net_details'];
      }
    }
    
    return (
      <div id="widget-info">
        {this.state.showWidgetInfo.type &&
          <div className="info type">
            <div className={'widget-icon '+this.state.showWidgetInfo.type}></div>
            <div className="val">{this.state.showWidgetInfo.type}</div>
          </div>
        }

        {this.state.showWidgetInfo.name &&
          <div className="info name">
            <div className="label">Name :</div>
            <div className="val">{this.state.showWidgetInfo.name}</div>
          </div>
        }
      
        {this.state.showWidgetInfo.period &&
          <div className="info date-range">
            <div className="label">Date Range :</div>
            <div className="val">{this.state.showWidgetInfo.period}</div>
          </div>
        }
          
        {this.state.showWidgetInfo.xaxis_val &&
          <div className="info xaxis">
            <div className="label">X Axis :</div>
            <div className="val"><span className={isAbbrevationName(this.state.showWidgetInfo.xaxis_val) ? 'allcaps' : ''}>{this.state.showWidgetInfo.xaxis_val}</span></div>
          </div>
        }

        {this.state.showWidgetInfo.yaxis_val &&
          <div className="info yaxis">
            <div className="label">{this.state.showWidgetInfo.type!=='scorecard' ? 'Y Axis' : 'Metric'} :</div>
            <div className="val"><span className={isAbbrevationName(this.state.showWidgetInfo.yaxis_val) ? 'allcaps' : ''}>{this.state.showWidgetInfo.yaxis_val}</span></div>
          </div>
        }

        {(this.state.showWidgetInfo.chartNetData && this.state.showWidgetInfo.type!=='scorecard') &&
          <>
            {this.state.showWidgetInfo.minVal >= 0 &&
              <div className="info min">
                <div className="label">Minimum :</div>
                <div className="val">{this.state.showWidgetInfo.currencySymbol + formatNumber(this.state.showWidgetInfo.minVal) + this.state.showWidgetInfo.percentSymbol}</div>
              </div>
            }

            {this.state.showWidgetInfo.maxVal >= 0 &&
              <div className="info max">
                <div className="label">Maximum :</div>
                <div className="val">{this.state.showWidgetInfo.currencySymbol + formatNumber(this.state.showWidgetInfo.maxVal) + this.state.showWidgetInfo.percentSymbol}</div>
              </div>
            }

            <div className="info total">
              <div className="label">Total :</div>
              <div className="val">{this.state.showWidgetInfo.currencySymbol + formatNumber(this.state.showWidgetInfo.chartNetData.net_details) + this.state.showWidgetInfo.percentSymbol}</div>
            </div>
          </>
        }

        {Object.keys(this.state.showWidgetInfo.filters).length > 0 &&
          <div className="info applied-filters">
            <div className="label">Applied Filters :</div>
            <div className="val">{Object.keys(this.state.showWidgetInfo.filters).map((item, i) => ((i>0) ? ', ' : '') + item)}</div>
          </div>
        }

        {(this.state.showWidgetInfo.type==='scorecard') &&
          <>
            {net_details &&
              <div className="info net-details">
                <div className="label">Net Details :</div>
                <div className="val">{this.state.showWidgetInfo.currencySymbol + formatNumber(net_details) + this.state.showWidgetInfo.percentSymbol}</div>
              </div>
            }

            {previous_period &&
              <div className="info previous-period">
                <div className="label">Previous Period :</div>
                <div className="val">{previous_period_start_date+ ' - '+previous_period_end_date}</div>
              </div>
            }

            {previous_period_change &&
              <div className="info previous-period">
                <div className="label">Previous Period Change :</div>
                <div className="val">{previous_period_change}%</div>
              </div>
            }

            {previous_period_net_details &&
              <div className="info previous-period">
                <div className="label">Previous Period Net Details :</div>
                <div className="val">{previous_period_net_details}</div>
              </div>
            }
          </>
        }
      </div>
    )
  }

  //get selected widget legend details
  getWidgetLegendDetails(){
    return (
      <div id="widget-legend-details" className={"chart-"+this.state.showWidgetLegendDetails.id}>
        {this.showAggregatedSegmentsDetails(this.state.showWidgetLegendDetails)}
      </div>
    )
  }

  giveConsoleContentHtmlForDashboardSettings() {
    return this.getDashboardFormContent();
  }

  giveConsoleContentHtmlForConstructorTab() {
    let isRequiredInfoFilled = (this.state.newChartSettingsLastExecuted.chart_type !== '' && this.state.newChartSettingsLastExecuted.view_type !== '' && this.state.newChartSettingsLastExecuted.x_axis !== '' && this.state.newChartSettingsLastExecuted.metric !== '') ? true : false;
    if (this.state.newChartSettingsLastExecuted.chart_type === 'scorecard' && this.state.newChartSettingsLastExecuted.view_type !== '' && this.state.newChartSettingsLastExecuted.metric !== '') {
      isRequiredInfoFilled = true;
    }
    const isFormatTabDisabled = (!isRequiredInfoFilled || (isRequiredInfoFilled && (this.state.newChartSettingsLastExecuted.chart_type === 'flat_table' || this.state.newChartSettingsLastExecuted.chart_type === 'text'))) ? true : false;
    const isTechnicalTabDisabled = (!isRequiredInfoFilled || (isRequiredInfoFilled && (this.state.newChartSettings.chart_type !== 'line'))) ? true : false;

    const colors = getChartColors();
    let colorFunc = [];
    let color_palette = 'default';
    if (this.state.newChartSettings.format) {
      color_palette = this.state.newChartSettingsLastExecuted.format.color.palette;
    }
    colorFunc = d3.scaleOrdinal(ColorPalettes[color_palette]);

    let colorsForHeatMapChart = this.state.newChartSettings.chart_type === 'heatmap' ? [
      DefaultColorsList["green"][0],
      DefaultColorsList["green"][4]
    ] : '';

    let segmented_keys = [];
    let xaxis_keys = [];
    var parsedDateString = d3.timeFormat("%d %b %Y");
    if (this.state.chartsFormattedData[this.state.newChartSettings.id] && (this.state.newChartSettings.chart_type === "pie" || this.state.newChartSettings.chart_type === "donut" || this.state.newChartSettings.chart_type === "spider" || this.state.newChartSettings.segmentation !== '')) {
      if (this.state.newChartSettings.chart_type === "pie" || this.state.newChartSettings.chart_type === "donut" || this.state.newChartSettings.chart_type === "spider") {
        xaxis_keys = [...new Set(this.state.chartsFormattedData[this.state.newChartSettings.id].map(item => {
          if (this.state.newChartSettings.x_axis === 'date') {
            let date = new Date(item[this.state.newChartSettings.x_axis]);
            return parsedDateString(date);
          } else {
            return item[this.state.newChartSettings.x_axis];
          }
        }))]; // [ 'A', 'B']
        colorFunc.domain(xaxis_keys);
      } else {
        segmented_keys = [...new Set(this.state.chartsFormattedData[this.state.newChartSettings.id].map(item => item[this.state.newChartSettings.segmentation]))]; // [ 'A', 'B']
        colorFunc.domain(segmented_keys);
      }
    }

    /**Used to differentiate design of the Tab for which some value has been selected  */
    const isConstructorTabValueSelected = (tab) => {
      const settings = this.state.newChartSettings;

      switch (tab) {
        case 'chart': return settings.chart_type !== '';
        case 'dataset': return settings.view_type !== '';
        case 'segment': return settings.segmentation !== '';
        case 'measurement': return settings.metric !== '';
        case 'measurements': {
          if (!settings.metric.includes(',')) {
            return false
          } else {
            let measurementValues = settings.metric.split(',')
            if (measurementValues.length < 3) {
              return false;
            } else {
              return true;
            }
          }
        }
        case 'x_axis':
        case 'dimension':
          return settings.x_axis !== '';
          
        case 'category':
        case 'y_axis': {
          if (this.state.newChartSettings.chart_type === 'heatmap') {
            return settings.segmentation !== '';
          } else {
            return settings.metric !== ''
          }
        }
        case 'value':
        case 'metric':
          return settings.metric !== '';
        case 'period': {
          if (settings.dynamic_time_period !== null) {
            return settings.dynamic_time_period.value !== '';
          } else if (this.state.dashboardSettings.dynamic_time_period !== null) {
            return this.state.dashboardSettings.dynamic_time_period.value !== '';
          } else {
            return false
          }
        }
        default: return false;
      }
    };

    const giveConstructorTabFilterSelectedCount = () => {
      const filtersGlobal = this.state.dashboardSettings.filters;
      const filtersLocal = this.state.newChartSettings.filters;
      let count = 0;
      // first count the globally applied filters
      for (let x in filtersGlobal) {
        if (Object.prototype.hasOwnProperty.call(filtersGlobal, x)) {
          if (filtersGlobal[x].length > 0) { count++; }
        }
      }
      // now count locally applied but include only those which are not applied gloabally to avoid double counting
      for (let x in filtersLocal) {
        if (Object.prototype.hasOwnProperty.call(filtersLocal, x)) {
          if ((!filtersGlobal[x] || !filtersGlobal[x].length) && filtersLocal[x].length > 0) { count++; }
        }
      }
      return count;
    };

    if (this.state.constructorTransitionScreenVisible) {
      return (
        <div id="constructor-transition-screen" className="dashboaord-tab-content">
          {this.state.constructorTransitionScreenCurrentSubtab === 'create' &&
            <div className="panel-widget type">
              <div className="widget-content">
                <div className="widget-types">
                  {
                    this.state.chartTypes.map((cType) => {
                      const displayName = covertUnderscoreToSpaceInString(cType);
                      return (
                        <div key={cType} className="widget-type">
                          <div key={cType} title={displayName} className={'widget-icon widget-type-btn ' + cType} onClick={() => this.handleInitialChartTypeSelect(cType)}>
                          </div>
                        </div>
                      )
                    })

                  }
                </div>
              </div>
            </div>
          }

          {this.state.constructorTransitionScreenCurrentSubtab === 'copy' &&
            <div className="chart-list-wrapper-for-copy">
              {this.giveChartsListContent(true)}
            </div>
          }
        </div>
      );
    }

    const chartTypeAndNameHTML = (
      <>
        <div className="panel-widget name-desc-info">
          {/* New Constructor Widget - Name */}
          <div className="chart-title-info">
            {this.getChartTitleHTML()}
          </div>
        </div>
      </>
    );

    const constructorSubtabHTML = (
      <div className="constructor-subtabs">
        <div className="constructor-btns tabbar">
          <button className={'' + (this.state.constructorSelectedSubtab === 'first' ? ' selected' : '')} onClick={() => this.handleConstructorSubtabChange('first')}>Type</button>
         
          <button className={'btn-constructor' + (this.state.constructorSelectedSubtab === 'second' ? ' selected' : '')} onClick={() => this.handleConstructorSubtabChange('second')}>Data</button>
          <button disabled={isFormatTabDisabled} className={'btn-chart-format' + (this.state.constructorSelectedSubtab === 'third' ? ' selected' : '')} onClick={() => this.handleConstructorSubtabChange('third')}>Format</button>
          <button disabled={isTechnicalTabDisabled} className={'btn-chart-analyze' + (this.state.constructorSelectedSubtab === 'fourth' ? ' selected' : '')} onClick={() => this.handleConstructorSubtabChange('fourth')}>Technical</button>
        </div>
      </div>
    );

    //console.log(this.state.constructorSelectedSubtab , 'selected')
    // 'type' tab content
    if (this.state.constructorSelectedSubtab === 'first') {
      return (
        <>
          <div id="constructor-charttype" className="dashboaord-tab-content">
            {chartTypeAndNameHTML}
            {constructorSubtabHTML}

            <div className="panel-widget type">
              <div className="widget-content">
                <div className="widget-types">
                  {
                    this.state.chartTypes.map((cType) => {
                      const isSelected = cType === this.state.newChartSettings.chart_type;
                      const displayName = covertUnderscoreToSpaceInString(cType);
                      return (
                        <div key={cType} className="widget-type">
                          <div key={cType} title={displayName} className={'widget-icon widget-type-btn ' + cType + (isSelected ? ' selected' : '')} onClick={() => this.onNewConstructorSettingsChange('chart_type', cType)}>
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
            </div>
          </div>
        </>
      );
    }

    // 'format' tab content
    if (this.state.constructorSelectedSubtab === 'third') {
      let isXAxisNumeric = false;
      if (this.state.chartsFormattedData[this.state.newChartSettingsLastExecuted.id]) {
        isXAxisNumeric = (typeof this.state.chartsFormattedData[this.state.newChartSettingsLastExecuted.id][0][this.state.newChartSettingsLastExecuted.x_axis] === 'number') ? true : false;
      }

      return (
        <div id="constructor-format" className="dashboaord-tab-content">
          {chartTypeAndNameHTML}
          {constructorSubtabHTML}

          {(this.state.newChartSettingsLastExecuted.chart_type === 'scorecard') &&
            <div className="panel-widget chart-format-scorecard">
              <div className="widget-header">
                <div className="widget-title">Value Format</div>
              </div>

              <div className="widget-content">
                <div className={'switch-toggle small'}>
                  <div className="label">Show full number</div>
                  <div className="switch">
                    <input type="checkbox" checked={this.state.newChartSettings.format.show_full_number ? true : false} onChange={(e) => this.handleChartFormatInputChange(e, 'show_full_number')} />
                    <label></label>
                  </div>
                </div>
              </div>
            </div>
          }

          {(this.state.newChartSettingsLastExecuted.chart_type !== 'scorecard') &&
            <>
            {(this.state.newChartSettingsLastExecuted.chart_type !== 'pie' && this.state.newChartSettingsLastExecuted.chart_type !== 'donut' && this.state.newChartSettingsLastExecuted.chart_type !== 'spider' && this.state.newChartSettingsLastExecuted.chart_type !== 'heatmap' && this.state.newChartSettingsLastExecuted.chart_type !== 'bubble') &&
              <div className="panel-widget chart-format-axis">
                <div className="widget-header">
                  <div className="widget-title">Axis</div>
                </div>

                <div className="widget-content">
                  <div className="info">
                    <div className='axis-name'>X</div>
                    <div className="options">
                      <div className="field-group">
                        <label htmlFor="xaxis-min-val">Minimum</label>
                        <input type="text" id="xaxis-min-val" name="xaxis-min-val" placeholder="0" disabled={!isXAxisNumeric} value={this.state.newChartSettings.format.xaxis.min} onChange={(e) => this.handleChartFormatInputChange(e, 'xaxis', 'min')} className="field-control" />
                      </div>

                      <div className="field-group">
                        <label htmlFor="xaxis-max-val">Maximum</label>
                        <input type="text" id="xaxis-max-val" name="xaxis-max-val" placeholder="0" disabled={!isXAxisNumeric} value={this.state.newChartSettings.format.xaxis.max} onChange={(e) => this.handleChartFormatInputChange(e, 'xaxis', 'max')} className="field-control" />
                      </div>

                      <div className="field-group">
                        <label htmlFor="xaxis-tick-interval-val">Tick Interval</label>
                        <input type="text" id="xaxis-tick-interval-val" name="xaxis-tick-interval-val" value={this.state.newChartSettings.format.xaxis.tick} onChange={(e) => this.handleChartFormatInputChange(e, 'xaxis', 'tick')} placeholder="0" className="field-control" />
                      </div>
                    </div>
                  </div>

                  <div className="info">
                    <div className='axis-name'>Y</div>
                    <div className="options">
                      <div className="field-group">
                        <label htmlFor="yaxis-min-val">Minimum</label>
                        <input type="text" id="yaxis-min-val" name="yaxis-min-val" placeholder="0" value={this.state.newChartSettings.format.yaxis.min} onChange={(e) => this.handleChartFormatInputChange(e, 'yaxis', 'min')} className="field-control" />
                      </div>
                      <div className="field-group">
                        <label htmlFor="yaxis-max-val">Maximum</label>
                        <input type="text" id="yaxis-max-val" name="yaxis-max-val" placeholder="0" value={this.state.newChartSettings.format.yaxis.max} onChange={(e) => this.handleChartFormatInputChange(e, 'yaxis', 'max')} className="field-control" />
                      </div>
                      <div className="field-group">
                        <label htmlFor="yaxis-tick-interval-val">Tick Interval</label>
                        <input type="text" id="yaxis-tick-interval-val" placeholder="0" name="yaxis-tick-interval-val" value={this.state.newChartSettings.format.yaxis.tick} onChange={(e) => this.handleChartFormatInputChange(e, 'yaxis', 'tick')} className="field-control" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }

              <div className="panel-widget chart-format-color">
                <div className="widget-header">
                  <div className="widget-title">Color</div>
                </div>

                <div className="widget-content">
                  {/* Single Color Picker - For Normal Chart */}
                  {((this.state.newChartSettings.chart_type !== 'pie' && this.state.newChartSettings.chart_type !== 'donut' && this.state.newChartSettings.chart_type !== 'spider' && this.state.newChartSettings.chart_type !== 'heatmap') && this.state.newChartSettings.segmentation === '') &&
                    <div className="non-segmented">
                      <div className="single-color-picker-wrapper">
                        <div className="single-color-picker-inner">
                          <div className="label">{this.state.newChartSettings.metric} {this.state.newChartSettings.chart_type}</div>
                          <div className="color-picker-select" onClick={(e) => this.handleToggleColorPicker(e, 'single')}><span className="color-block" style={{ backgroundColor: this.state.newChartSettings.format.color.single_color !== '' ? this.state.newChartSettings.format.color.single_color : DEFAULT_CHART_COLOR }}></span></div>
                        </div>

                        {this.state.newChartSettings.format.color.dropdown_open &&
                          <ClickOutsideListener onOutsideClick={(e) => this.handleToggleColorPicker(e, 'single')}>
                            <div className={'color-picker-wrapper'}>
                              <div className="color-picker">
                                {Object.keys(DefaultColorsList).map((colorKey) => {
                                  return (<div key={colorKey} className="color-col">
                                    {DefaultColorsList[colorKey].map((color) => {
                                      return (<div key={color} className="color" style={{ backgroundColor: color }} onClick={() => this.handleColorPickerSelect('background', color)}></div>)
                                    })}
                                  </div>)
                                })}
                              </div>
                            </div>
                          </ClickOutsideListener>
                        }
                      </div>
                    </div>
                  }

                  {/* 2 color selectors for start and end point of heatmap chart */}
                  {(this.state.newChartSettings.chart_type === 'heatmap') &&
                    <div className="non-segmented">
                      <div className="single-color-picker-wrapper">
                        <div className="single-color-picker-inner">
                          <div className="label">Starting point {this.state.newChartSettings.chart_type}</div>
                          <div className="color-picker-select" onClick={(e) => this.handleToggleColorPicker(e, 'multiple', '')}><span className="color-block" style={{ backgroundColor: this.state.newChartSettings.format.color.single_color !== '' ? this.state.newChartSettings.format.color.single_color : colorsForHeatMapChart[0] }}></span></div>
                        </div>

                        {this.state.newChartSettings.format.color.dropdown_open &&
                          <ClickOutsideListener onOutsideClick={(e) => this.handleToggleColorPicker(e, 'multiple', '')}>
                            <div className={'color-picker-wrapper'}>
                              <div className="color-picker">
                                {Object.keys(DefaultColorsList).map((colorKey) => {
                                  return (<div key={colorKey} className="color-col">
                                    {DefaultColorsList[colorKey].map((color) => {
                                      return (<div key={`first_${color}`} className="color" style={{ backgroundColor: color }} onClick={() => this.handleColorPickerSelect('background', color, this.state.newChartSettings.chart_type, 'single')}></div>)
                                    })}
                                  </div>)
                                })}
                              </div>
                            </div>
                          </ClickOutsideListener>
                        }
                      </div>
                      <div className="single-color-picker-wrapper">
                        <div className="single-color-picker-inner">
                          <div className="label">End point {this.state.newChartSettings.chart_type}</div>
                          <div className="color-picker-select" onClick={(e) => this.handleToggleColorPicker(e, 'multiple', '2')}><span className="color-block" style={{ backgroundColor: this.state.newChartSettings.format.color.second_color !== '' ? this.state.newChartSettings.format.color.second_color : colorsForHeatMapChart[1] }}></span></div>
                        </div>

                        {this.state.newChartSettings.format.color.dropdown_open2 &&
                          <ClickOutsideListener onOutsideClick={(e) => this.handleToggleColorPicker(e, 'multiple', '2')}>
                            <div className={'color-picker-wrapper'}>
                              <div className="color-picker">
                                {Object.keys(DefaultColorsList).map((colorKey) => {
                                  return (<div key={colorKey} className="color-col">
                                    {DefaultColorsList[colorKey].map((color) => {
                                      return (<div key={`last_${color}`} className="color" style={{ backgroundColor: color }} onClick={() => this.handleColorPickerSelect('background', color, this.state.newChartSettings.chart_type, 'second')}></div>)
                                    })}
                                  </div>)
                                })}
                              </div>
                            </div>
                          </ClickOutsideListener>
                        }
                      </div>
                    </div>
                  }

                  {/* Color Palette - For Segmented Chart */}
                  {(this.state.newChartSettings.chart_type !== 'heatmap' && (this.state.newChartSettings.segmentation !== '' || (this.state.newChartSettings.chart_type === 'pie' || this.state.newChartSettings.chart_type === 'donut' || this.state.newChartSettings.chart_type === 'spider'))) &&
                    <div className="segmented">
                      <div className="segmented-color-palette-wrapper">
                        <div className="color-palette-select" onClick={(e) => this.handleToggleColorPicker(e, 'segmented')}>
                          <div className="label">Palette</div>
                          {this.state.newChartSettings.format.color.palette !== '' &&
                            <div className="selected-palette">
                              {
                                ColorPalettes[this.state.newChartSettings.format.color.palette].map((color, i) => {
                                  if (i > 10) return;
                                  return <span key={i} className="color-block" style={{ backgroundColor: color }}></span>
                                })
                              }
                            </div>
                          }
                        </div>

                        {/* Color Palettes Dropdown */}
                        {this.state.newChartSettings.format.color.dropdown_open &&
                          <ClickOutsideListener onOutsideClick={(e) => this.handleToggleColorPicker(e, 'segmented')}>
                            <div className="color-palette-dropdown-wrapper">
                              {Object.keys(ColorPalettes).map((palette) => {
                                return (
                                  <div key={palette} className={'color-palette-inner ' + (this.state.newChartSettings.format.color.palette === palette ? 'active' : '')} onClick={(e) => this.handleColorPaletteSelect(e, palette)}>
                                    <div className="color-palette">
                                      <div className="label">{palette}</div>
                                      <div className="selected-palette">
                                        {
                                          ColorPalettes[palette].map((color, i) => {
                                            if (i > 10) return;
                                            return <span key={i} className="color-block" style={{ backgroundColor: color }}></span>
                                          })
                                        }
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </ClickOutsideListener>
                        }
                      </div>

                      <div className="segmented-list">
                        {(this.state.newChartSettings.chart_type === 'pie' || this.state.newChartSettings.chart_type === 'donut' || this.state.newChartSettings.chart_type === 'spider') ? (
                          xaxis_keys.length > 0 &&
                          xaxis_keys.map((xaxis) => {
                            return (<div key={xaxis} className="segment"><span>{xaxis}</span> <span className="color-block" style={{ backgroundColor: colorFunc(xaxis) }}></span></div>)
                          })
                        ) : (
                          segmented_keys.length > 0 &&
                          segmented_keys.map((segment) => {
                            return (<div key={segment} className="segment"><span>{segment}</span> <span className="color-block" style={{ backgroundColor: colorFunc(segment) }}></span></div>)
                          })
                        )}
                      </div>
                    </div>
                  }
                </div>
              </div>

              <div className="panel-widget chart-format-sorting">
                <div className="widget-header">
                  <div className="widget-title">Sorting</div>
                  <button className="btn-add-new" onClick={() => this.handleAddSortingCondition('or')}>Add New</button>
                </div>

                <div className="widget-content">
                  {
                    Object.keys(this.state.newChartSettings.format.sorting).map((item, i) => {
                      return (
                        <>
                          {i > 0 && <div className="seperator">Or</div>}

                          <div className="sorting-condition-wrapper">
                            <div className="title">{this.state.newChartSettings.metric}</div>
                            {i > 0 &&
                              <button className="btn-remove" onClick={() => this.handleRemoveSortingCondition('or', item)}>Remove</button>
                            }

                            {this.state.newChartSettings.format.sorting[item].map((subitem, j) => {
                              return (
                                <>
                                  {j > 0 && <div className="seperator">And</div>}
                                  <div className="condition">
                                    <div className="field-wrapper">
                                      <SpeedSelect
                                        options={CONDITIONAL_FORMATTING_OPTIONS}
                                        selectedOption={subitem.condition}
                                        onSelect={(e) => this.handleSortingConditionChange(e, 'condition', i, j)}
                                        displayKey='name'
                                        uniqueKey='id'
                                        selectLabel='Condition'
                                        maxHeight={65}
                                      />
                                    </div>
                                    <div className="field-wrapper">
                                      <input type="text" name="txt-sorting-condition" className="field-control" onChange={(e) => this.handleSortingConditionChange(e, 'val', i, j)} value={subitem.val} />
                                    </div>

                                    {subitem.condition.id === 'between' &&
                                      <div className="field-wrapper">
                                        <input type="text" name="txt-sorting-condition1" className="field-control" onChange={(e) => this.handleSortingConditionChange(e, 'val2', i, j)} value={subitem.val2} />
                                      </div>
                                    }

                                    <div className="action-buttons">
                                      {(j === (this.state.newChartSettings.format.sorting[item].length - 1)) &&
                                        <button className="btn-add-new" onClick={() => this.handleAddSortingCondition('and', i)}>Add New</button>
                                      }
                                      {j > 0 &&
                                        <button className="btn-remove" onClick={() => this.handleRemoveSortingCondition('and', item, j)}>Remove</button>
                                      }
                                    </div>
                                  </div>
                                </>
                              )
                            })}
                          </div>
                        </>
                      )
                    })
                  }

                </div>
              </div>

              {/* chart label switch */}
              {
                this.state.newChartSettings.chart_type === 'box' &&
                <div className="panel-widget chart-format-label">
                  <div className="widget-header">
                    <div className="widget-title">Chart Label</div>
                  </div>

                  <div className="widget-content">
                    <div className={'switch-toggle small legend-toggle'}>
                      <div className="label">Show Labels</div>
                      <div className="switch">
                        <input type="checkbox" checked={this.state.newChartSettings.format.showLabel} onChange={() => this.handleToggleLabel('showLabel', !this.state.newChartSettings.format.showLabel)} />
                        <label></label>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </>
          }
        </div>
      );
    }

    //show 'technical' tab content
    if (this.state.constructorSelectedSubtab === 'fourth') {
      if (this.state.loadingConstructorAnalyisMetadata) {
        return (
          <div id="constructor-analyze" className="dashboaord-tab-content">
            {chartTypeAndNameHTML}
            {constructorSubtabHTML}
            <p>Loading Data for Analysis...</p>
          </div>
        )
      }

      if (this.state.constructorAnalysisMetadata === null) {
        return <div id="constructor-analyze" className="dashboaord-tab-content">
          {chartTypeAndNameHTML}
          {constructorSubtabHTML}
        </div>
      }

      let bandMetadata = (this.state.constructorAnalysisMetadata !== null && this.state.constructorAnalysisMetadata.length > 0) ? this.state.constructorAnalysisMetadata.filter(meta => meta.is_band) : [];

      return (
        <div id="constructor-analyze" className="dashboaord-tab-content">
          {chartTypeAndNameHTML}
          {constructorSubtabHTML}

          {/* Band Panel */}
          <div className="panel-widget band-widget">
            <div className="widget-header">
              <div className="widget-title">Band</div>
              <button onClick={this.handleNewConstructorBandAddBtn}>+</button>
            </div>

            <div className="widget-content">
              {(this.state.newChartBandSettings && this.state.newChartBandSettings.length > 0) &&
                this.state.newChartBandSettings.map((band, bandIndex) => {
                  const metaForSelectedBandType = bandMetadata.find(b => b.name === this.state.newChartBandSettings[bandIndex].band_type) || null;
                  const isApplicable = this.isBandOrTrendTypeApplicable(metaForSelectedBandType);
                  const bandParams = isApplicable ? metaForSelectedBandType.parameters : {};

                  return (
                    <div key={bandIndex} className="settings">
                      <div className="row">
                        <span className="seq-no">{bandIndex + 1}</span>
                        <div className="dd-with-label band-type">
                          <label className="dd-label">Type</label>
                          <SpeedSelect
                            options={[{ id: 'Select', name: 'Select', display_name: 'Select' }, ...bandMetadata]}
                            displayKey='display_name'
                            uniqueKey='id'
                            selectedOption={metaForSelectedBandType}
                            onSelect={val => this.handleNewConstructorBandSettingChange(bandIndex, 'band_type', val.name)}
                            disableSearch
                          />
                        </div>
                        {bandIndex > 0 && <button onClick={() => this.handleNewConstructorBandRemoveBtn(bandIndex)}>X</button>}
                      </div>

                      {isApplicable &&
                        <div className="dropdowns">
                          {Object.keys(bandParams).map((param, i) => {
                            const paramName = param[0].toUpperCase() + param.slice(1);
                            const paramRange = bandParams[param].split('-').map(x => +x);
                            return (
                              <div key={param+'-'+i} className="fields-group">
                                <div key={param} className={`dd-with-label band-dd-${param}`}>
                                  <label className="dd-label">{paramName}</label>
                                  <div className="dd-input">{this.state.newChartBandSettings[bandIndex][param]}</div>
                                </div>

                                <div className="range-slider-wrapper">
                                  <input type="range" min={paramRange[0]} max={paramRange[1]} value={this.state.newChartBandSettings[bandIndex][param]} className="range-slider" id={'band-dd-range-' + param} onChange={(e) => this.handleNewConstructorBandSettingChange(bandIndex, param, +e.target.value)} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      }

                      {/* Alert Enable */}
                      {/* {isApplicable &&
                        <div className="channel-alert">
                          <div className="alert-toggle">
                            <div className="switch-toggle small">
                              <div className="label">Alert</div>
                              <div className="switch" htmlFor={`${this.getDashboardID()}-band-alert-toggle-${bandIndex}`}>
                                <input id={`${this.getDashboardID()}-band-alert-toggle-${bandIndex}`} type="checkbox" checked={currentAlertChannel !== ''} onChange={(e) => this.handleNewConstructorBandSettingChange(bandIndex, 'alertChannel', currentAlertChannel === '' ? [] : '')} />
                                <label></label>
                              </div>
                            </div>
                          </div>
                          {['Sight', 'Slack', 'Email'].map(alertCh => {
                            const disabled = currentAlertChannel === '';
                            const selected = currentAlertChannel === '' ? false : currentAlertChannel.includes(alertCh);
                            const newAlertChannel = selected ? currentAlertChannel.filter(c => c !== alertCh) : [...currentAlertChannel, alertCh];
                            return <div key={alertCh} className={`alert-toggle-option checkbox` + (disabled ? ' disabled' : '')}>
                              <input id={`${this.getDashboardID()}-band-alert-${alertCh}-${bandIndex}`} type="checkbox" checked={selected} disabled={disabled} onChange={(e) => this.handleNewConstructorBandSettingChange(bandIndex, 'alertChannel', newAlertChannel)} />
                              <label htmlFor={`${this.getDashboardID()}-band-alert-${alertCh}-${bandIndex}`}>{alertCh}</label>
                            </div>
                          })}
                        </div>
                      } */}
                      {!isApplicable && band.band_type !== 'Select' && <p style={{ color: 'red' }}>This Band is not applicable for selected chart settings</p>
                      }
                    </div>
                  );
                })
              }
            </div>
          </div>

          {/* Trend Panel */}
          {/* <div className="panel-widget trend-widget">
            <div className="widget-header">
              <div className="widget-title">Trend</div>
              <button onClick={this.handleNewConstructorTrendAddBtn}>+</button>
            </div>
            <div className="widget-content">

              {this.state.newChartTrendSettings.map((trend, trendIndex) => {
                const metaForSelectedTrendType = trendMetadata.find(b => b.name === this.state.newChartTrendSettings[trendIndex].type);
                const isApplicable = this.isBandOrTrendTypeApplicable(metaForSelectedTrendType);
                return (
                  <div key={trendIndex} className="settings">
                    <div className="row">
                      <span className="seq-no">{trendIndex + 1})</span>
                      <div className="dd-with-label type">
                        <label className="dd-label">Type</label>
                        <SpeedSelect
                          options={trendMetadata}
                          displayKey='display_name'
                          uniqueKey='id'
                          selectedOption={metaForSelectedTrendType}
                          onSelect={val => this.handleNewConstructorTrendSettingChange(trendIndex, 'type', val.name)}
                          disableSearch
                        />
                      </div>
                      {this.state.newChartTrendSettings.length > 1 && <button onClick={() => this.handleNewConstructorTrendRemoveBtn(trendIndex)}>X</button>}
                    </div>
                    {!isApplicable && <p style={{ color: 'red' }}>This Trend is not applicable for selected chart settings</p>
                    }
                  </div>
                );
              })}

            </div>
          </div> */}

        </div>
      );

    }


    //Else show 'data' tab content
    const constructorSettingsCurrentTab = this.state.constructorSettingsCurrentSubtab;
    //console.log(constructorSettingsCurrentTab , 'current:')

    // filter the content of each tab based on search input to render only the matched results
    const chartFormSearchInput = this.state.chartFormSearchInput.toLowerCase().trim();

    const filteredDataSources = this.state.data_sources.filter(x => x.display_name.toLowerCase().includes(chartFormSearchInput));
    const filteredDimensionMetrics = this.state.newChartSettings.view_type === '' ? [] : (this.state.allDataSourcesDimensionsMetrics[this.state.newChartSettings.view_type] || []).filter(x => x.display_title.toLowerCase().includes(chartFormSearchInput));
    const openedFilterName = this.state.chartFormOpenedFilterId === '' ? '' : this.state.allDataSourcesDimensionsMetrics[this.state.newChartSettings.view_type].find(item => item.id === this.state.chartFormOpenedFilterId).display_title;
    const filteredFirstLevelFilters = filteredDimensionMetrics.filter(item => item.type === 'string');
    const filteredSecondLevelFilters = this.state.chartFormOpenedFilterId === '' ? [] : this.state.allDataSourcesDimensionsList[this.state.newChartSettings.view_type][this.state.chartFormOpenedFilterId].filter(x => x.toLowerCase().includes(chartFormSearchInput));

    const subOptionSelectedCount = this.state.newChartSettings.filters[this.state.chartFormOpenedFilterId] ? this.state.newChartSettings.filters[this.state.chartFormOpenedFilterId].length : 0;
    const isAllSuboptionsChecked = (subOptionSelectedCount === filteredSecondLevelFilters.length && this.state.newChartSettings.filters[this.state.chartFormOpenedFilterId]) ? this.state.newChartSettings.filters[this.state.chartFormOpenedFilterId].every(f => filteredSecondLevelFilters.includes(f)) : false;
    const globalFilterCount = Object.keys(this.state.dashboardSettings.filters).reduce((count, filterKey) => this.state.dashboardSettings.filters[filterKey] && this.state.dashboardSettings.filters[filterKey].length ? count + 1 : count, 0);

    const globalPeriod = this.state.dashboardSettings.dynamic_time_period;
    const periodToConsiderBasedonPriority = globalPeriod || this.state.newChartSettings.dynamic_time_period;
    const showTimePresetsToConsider = globalPeriod ? globalPeriod.is_dynamic : this.state.chartFormShowTimePresets;
    const calendarSelectedRanges = periodToConsiderBasedonPriority && periodToConsiderBasedonPriority.is_dynamic === false ? [this.convertDateRangeInStringToRangeInObject(periodToConsiderBasedonPriority.value)] : null;


    return (
      <div id="constructor-settings" className="dashboaord-tab-content">
        {chartTypeAndNameHTML}
        {constructorSubtabHTML}

        {/* New Constructor Widget - Filters */}
        <div className="panel-widget constructor settings">
          <div className="widget-content">
            <div className={'constructor-settings-tabs-wrapper chart-' + this.state.newChartSettings.chart_type}>
              <div className="constructor-settings-tabs">
                {this.state.constructorSettingsTabs[this.state.newChartSettings.chart_type] !== undefined &&
                  this.state.constructorSettingsTabs[this.state.newChartSettings.chart_type].map((tab) => {
                    // Disable all other tabs(Except Chart tab) if data source is not seleted yet, disable segment tab if chart type is flat_table, pie chart, donut chart or spider chart , density chart
                    const isDisabled = (this.state.newChartSettings.view_type === '' && this.state.constructorSettingsTabs[this.state.newChartSettings.chart_type].slice(2).includes(tab)) || ((this.state.newChartSettings.chart_type === 'flat_table' || this.state.newChartSettings.chart_type === 'pie' || this.state.newChartSettings.chart_type === 'donut' || this.state.newChartSettings.chart_type === 'spider' || this.state.newChartSettings.chart_type === 'density') && tab === 'segment');
                    const isActive = tab === constructorSettingsCurrentTab;

                    return <div key={tab} className={"constructor-settings-tabs-grid " + tab}>
                      <div data-id={tab + '-content'} className={'tab ' + (isActive ? 'active' : '') + (isDisabled ? ' disabled' : '')}
                        onClick={() => this.setState({ constructorSettingsCurrentSubtab: tab, chartFormSearchInput: '' })}>
                        <div>
                          {tab.replaceAll("_", " ")}
                          {tab !== 'filter' && isConstructorTabValueSelected(tab) &&
                            <span className="icon-selection-done"></span>
                          }
                          {tab === 'filter' && giveConstructorTabFilterSelectedCount() > 0 &&
                            <span className="icon-selection-count">{giveConstructorTabFilterSelectedCount()}</span>
                          }
                        </div>
                      </div>
                    </div>
                  })
                }
              </div>
            </div>

            <div className="constructor-settings-content">
              {globalFilterCount > 0 && constructorSettingsCurrentTab === 'filter' &&
                <div className="global-filter-count">
                  <span>{globalFilterCount}</span>
                  <p>Dashboard level filters applied, to edit click</p>
                  <button className="btn-settings" onClick={() => this.navigateToDashboardSettings('data', 'filters')}>settings</button>
                </div>
              }
              {constructorSettingsCurrentTab !== 'period' &&
                <div className="gl-search">
                  <input placeholder="Search" value={this.state.chartFormSearchInput} onChange={e => this.setState({ chartFormSearchInput: e.target.value })} />
                </div>
              }

              {constructorSettingsCurrentTab === 'dataset' &&
                <div id="dataset-content-wrapper">
                  <div id="view-types" className="constructor-settings-tabcontent col">
                    <h4 className="title">Source</h4>
                    <div className="details sources-list">
                      {filteredDataSources.map((item) => {
                        if (this.user && (this.user.privileges[this.state.terminal_type].includes(item.privilege) || this.user.privileges['sellside'].includes('APEX'))) {
                          return (
                            <div key={item.display_name} className="option radio">
                              <input id={`${this.getDashboardID()}-chart-source-${item.display_name}`} type="radio" name={`${this.getDashboardID()}-chart-source`} value={item.name} checked={this.state.newChartSettings.view_type === item.name} onChange={(e) => this.onNewConstructorSettingsChange('view_type', e.target.value)} />
                              <label htmlFor={`${this.getDashboardID()}-chart-source-${item.display_name}`}>{item.display_name}</label>
                            </div>
                          )
                        }
                      })}
                      {chartFormSearchInput && !filteredDataSources.length && <p className="no-match-msg">No Match Found</p>}
                    </div>
                  </div>

                  <div id="all-fields" className="constructor-settings-tabcontent col">
                    <h4 className="title">Available Fields</h4>
                    <div className="details fields-list">
                      {this.state.allDataSourcesDimensionsMetrics[this.state.newChartSettings.view_type].map((item) => {
                        return (
                          <div key={item.display_title} className={'field ' + (item.type)}><div className="field-name">{item.display_title}</div></div>)
                      })}
                    </div>
                  </div>
                </div>
              }

              {(constructorSettingsCurrentTab === 'segment' && this.state.newChartSettings.chart_type !== 'heatmap') &&
                <div id="segment-content" className="constructor-settings-tabcontent">
                  {/* <div className={'switch-toggle small legend-toggle' + (this.state.newChartSettings.segmentation === '' ? ' disabled' : '')}>
                    <div className="label">Show Legend</div>
                    <div className="switch">
                      <input type="checkbox" disabled={this.state.newChartSettings.segmentation !== '' ? false : true} checked={this.state.newChartSettings.segmentation !== '' ? this.state.newChartSettings.showLegend : false} onChange={(e) => this.onNewConstructorSettingsChange('showLegend', null)} />
                      <label></label>
                    </div>
                  </div>
                  <br /> */}

                  {filteredDimensionMetrics.map((item) => {
                    if (item.type === 'string') {
                      let isDisabledForAdserverDataset = ((item.display_title === 'Advertiser' || item.display_title === 'Monetization Channel'/* || item.display_title === 'Ad Type' || item.display_title === 'Integration Type'*/) && this.state.newChartSettings.metric === 'fill_rate') ? true : false;
                      return (
                        <div key={item.id} className="option radio">
                          <input id={`${this.getDashboardID()}-chart-segment-${item}`} type="radio" name={`${this.getDashboardID()}-chart-segment`} value={item.id} disabled={(this.state.newChartSettings.x_axis === item.id || isDisabledForAdserverDataset) ? true : false} checked={this.state.newChartSettings.segmentation === item.id} onClick={(e) => this.onNewConstructorSettingsChange('segmentation', e.target.value)} />
                          <label htmlFor={`${this.getDashboardID()}-chart-segment-${item}`}>{item.display_title}</label>
                        </div>
                      )
                    }
                  })}
                  {chartFormSearchInput && !filteredDimensionMetrics.length && <p className="no-match-msg">No Match Found</p>}
                </div>
              }

              {/* Show measurement with y axis values instead of segmentation for heat map chart */}
              {(constructorSettingsCurrentTab === 'measurement' && this.state.newChartSettings.chart_type === 'heatmap') &&
                <div id="segment-content" className="constructor-settings-tabcontent">
                  {filteredDimensionMetrics.map((item) => {
                    if (item.is_dimension === 0) {
                      let isDisabledForAdserverDataset = (item.display_title === 'Fill Rate' && ((this.state.newChartSettings.x_axis === 'advertiser' || this.state.newChartSettings.x_axis === 'monetization_channel'/* || this.state.newChartSettings.x_axis === 'ad_type' || this.state.newChartSettings.x_axis === 'integration_type'*/) || (this.state.newChartSettings.segmentation === 'advertiser' || this.state.newChartSettings.segmentation === 'monetization_channel'/* || this.state.newChartSettings.x_axis === 'ad_type' || this.state.newChartSettings.x_axis === 'integration_type'*/))) ? true : false;
                      return (<div key={item.id} className="option radio">
                        <input id={`${this.getDashboardID()}-chart-filter-${item.display_title}}`} type="radio" value={item.id} disabled={isDisabledForAdserverDataset} checked={this.state.newChartSettings.metric.includes(item.id)} onChange={(e) => this.onNewConstructorSettingsChange('metric', e.target.value)} />
                        <label htmlFor={`${this.getDashboardID()}-chart-filter-${item.display_title}}`}>{item.display_title}</label>
                      </div>
                      )
                    }
                  })}

                  {chartFormSearchInput && !filteredDimensionMetrics.length && <p className="no-match-msg">No Match Found</p>}
                </div>
              }

              {/* Show distribution with y axis values instead of segmentation for box chart */}
              {(constructorSettingsCurrentTab === 'distribution' && this.state.newChartSettings.chart_type === 'box') &&
                <div id="segment-content" className="constructor-settings-tabcontent">
                  {filteredDimensionMetrics.map((item) => {
                    if (item.type === 'string') {
                      let isDisabledForAdserverDataset = ((item.display_title === 'Advertiser' || item.display_title === 'Monetization Channel' || item.display_title === 'Ad Type' || item.display_title === 'Integration Type') && this.state.newChartSettings.metric === 'fill_rate') ? true : false;
                      return (
                        <div key={item.id} className="option radio">
                          <input id={`${this.getDashboardID()}-chart-segment-${item}`} type="radio" name={`${this.getDashboardID()}-chart-segment`} value={item.id} disabled={(this.state.newChartSettings.x_axis === item.id || isDisabledForAdserverDataset) ? true : false} checked={this.state.newChartSettings.segmentation === item.id} onClick={(e) => this.onNewConstructorSettingsChange('segmentation', e.target.value)} />
                          <label htmlFor={`${this.getDashboardID()}-chart-segment-${item}`}>{item.display_title}</label>
                        </div>
                      )
                    }
                  })}
                  {chartFormSearchInput && !filteredDimensionMetrics.length && <p className="no-match-msg">No Match Found</p>}
                </div>
              }

              {/* Show group with y axis values instead of segmentation for treemap chart */}
              {(constructorSettingsCurrentTab === 'group' && this.state.newChartSettings.chart_type === 'treemap') &&
                <div id="segment-content" className="constructor-settings-tabcontent">
                  {filteredDimensionMetrics.map((item) => {
                    if (item.type === 'string') {
                      let isDisabledForAdserverDataset = ((item.display_title === 'Advertiser' || item.display_title === 'Monetization Channel' || item.display_title === 'Ad Type' || item.display_title === 'Integration Type') && this.state.newChartSettings.metric === 'fill_rate') ? true : false;
                      return (
                        <div key={item.id} className="option radio">
                          <input id={`${this.getDashboardID()}-chart-segment-${item}`} type="radio" name={`${this.getDashboardID()}-chart-segment`} value={item.id} disabled={(this.state.newChartSettings.x_axis === item.id || isDisabledForAdserverDataset) ? true : false} checked={this.state.newChartSettings.segmentation === item.id} onClick={(e) => this.onNewConstructorSettingsChange('segmentation', e.target.value)} />
                          <label htmlFor={`${this.getDashboardID()}-chart-segment-${item}`}>{item.display_title}</label>
                        </div>
                      )
                    }
                  })}
                  {chartFormSearchInput && !filteredDimensionMetrics.length && <p className="no-match-msg">No Match Found</p>}
                </div>
              }

              {/* Show radio button if current tab is x_axis - show radio buttons */}
              {(constructorSettingsCurrentTab === 'x_axis') &&
                <div id="xaxis-content" className="constructor-settings-tabcontent">
                  {
                    filteredDimensionMetrics.map((item) => {
                      if (this.state.newChartSettings.chart_type === 'scatter' || item.is_dimension === 1) {
                        let isDisabledForAdserverDataset = ((item.display_title === 'Advertiser' || item.display_title === 'Monetization Channel'/* || item.display_title === 'Ad Type' || item.display_title === 'Integration Type'*/) && this.state.newChartSettings.metric === 'fill_rate') ? true : false;
                        return (
                          <div key={item.id} className="option radio">
                            <input id={`${this.getDashboardID()}-chart-xaxis-${item.display_title}`} type="radio" name={`${this.getDashboardID()}-chart-xaxis`} value={item.id} disabled={(this.state.newChartSettings.segmentation === item.id || isDisabledForAdserverDataset) ? true : this.state.newChartSettings.metric === item.id ? true : false} checked={this.state.newChartSettings.x_axis === item.id} onChange={(e) => this.onNewConstructorSettingsChange('x_axis', e.target.value)} />
                            <label htmlFor={`${this.getDashboardID()}-chart-xaxis-${item.display_title}`}>{item.display_title}</label>
                          </div>
                        )
                      }
                    })
                  }
                  {chartFormSearchInput && !filteredDimensionMetrics.length && <p className="no-match-msg">No Match Found</p>}
                </div>
              }

              {/* Show radio button if current tab is entity - show radio buttons */}
              {(constructorSettingsCurrentTab === 'entity') &&
                <div id="xaxis-content" className="constructor-settings-tabcontent">
                  {
                    filteredDimensionMetrics.map((item) => {
                      if (this.state.newChartSettings.chart_type === 'treemap') {
                        let isDisabledForAdserverDataset = ((item.display_title === 'Advertiser' || item.display_title === 'Monetization Channel'/* || item.display_title === 'Ad Type' || item.display_title === 'Integration Type'*/) && this.state.newChartSettings.metric === 'fill_rate') ? true : false;
                        return (
                          <div key={item.id} className="option radio">
                            <input id={`${this.getDashboardID()}-chart-xaxis-${item.display_title}`} type="radio" name={`${this.getDashboardID()}-chart-xaxis`} value={item.id} disabled={(this.state.newChartSettings.segmentation === item.id || isDisabledForAdserverDataset) ? true : this.state.newChartSettings.metric === item.id ? true : false} checked={this.state.newChartSettings.x_axis === item.id} onChange={(e) => this.onNewConstructorSettingsChange('x_axis', e.target.value)} />
                            <label htmlFor={`${this.getDashboardID()}-chart-xaxis-${item.display_title}`}>{item.display_title}</label>
                          </div>
                        )
                      }
                    })
                  }
                  {chartFormSearchInput && !filteredDimensionMetrics.length && <p className="no-match-msg">No Match Found</p>}
                </div>
              }
              {/* Show radio button if current tab is dimension for pie, donut or spider chart - show radio buttons */}
              {(constructorSettingsCurrentTab === 'dimension' && (this.state.newChartSettings.chart_type === 'pie' || this.state.newChartSettings.chart_type === 'donut' || this.state.newChartSettings.chart_type === 'spider' || this.state.newChartSettings.chart_type === 'bubble')) &&
                <div id="xaxis-content" className="constructor-settings-tabcontent">
                  {
                    filteredDimensionMetrics.map((item) => {
                      if (this.state.newChartSettings.chart_type === 'scatter' || item.is_dimension === 1) {
                        let isDisabledForAdserverDataset = ((item.display_title === 'Advertiser' || item.display_title === 'Monetization Channel'/* || item.display_title === 'Ad Type' || item.display_title === 'Integration Type'*/) && this.state.newChartSettings.metric.includes('fill_rate')) ? true : false;
                        return (
                          <div key={item.id} className="option radio">
                            <input id={`${this.getDashboardID()}-chart-xaxis-${item.display_title}`} type="radio" name={`${this.getDashboardID()}-chart-xaxis`} value={item.id} disabled={(this.state.newChartSettings.segmentation === item.id || isDisabledForAdserverDataset) ? true : false} checked={this.state.newChartSettings.x_axis === item.id} onChange={(e) => this.onNewConstructorSettingsChange('x_axis', e.target.value)} />
                            <label htmlFor={`${this.getDashboardID()}-chart-xaxis-${item.display_title}`}>{item.display_title}</label>
                          </div>
                        )
                      }
                    })
                  }
                  {chartFormSearchInput && !filteredDimensionMetrics.length && <p className="no-match-msg">No Match Found</p>}
                </div>
              }
              {/* Show checkbox button if current tab is dimension - show multiselect checkboxes */}
              {(constructorSettingsCurrentTab === 'dimension' && (this.state.newChartSettings.chart_type !== 'pie' && this.state.newChartSettings.chart_type !== 'donut' && this.state.newChartSettings.chart_type !== 'spider' && this.state.newChartSettings.chart_type !== 'bubble')) &&
                <div id="dimension-content" className="constructor-settings-tabcontent">
                  {
                    filteredDimensionMetrics.map((item) => {
                      if (item.is_dimension === 1) {
                        let isDisabledForAdserverDataset = ((item.display_title === 'Advertiser' || item.display_title === 'Monetization Channel'/* || item.display_title === 'Ad Type' || item.display_title === 'Integration Type'*/) && this.state.newChartSettings.metric.includes('fill_rate')) ? true : false;
                        return (
                          <div key={item.id} className="option checkbox">
                            <input id={`${this.getDashboardID()}-chart-dimension-${item.display_title}}`} type="checkbox" value={item.id} disabled={(this.state.newChartSettings.segmentation === item.id || isDisabledForAdserverDataset) ? true : false} checked={this.state.newChartSettings.x_axis.includes(item.id)} onChange={(e) => this.onNewConstructorSettingsChange('dimension', e.target.value)} />
                            <label htmlFor={`${this.getDashboardID()}-chart-dimension-${item.display_title}}`}>{item.display_title}</label>
                          </div>
                        )
                      }
                    })
                  }
                  {chartFormSearchInput && !filteredDimensionMetrics.length && <p className="no-match-msg">No Match Found</p>}
                </div>
              }

              {/* Y-axis keys for heat map chart will be passed through segment for api */}
              {(constructorSettingsCurrentTab === 'y_axis' && this.state.newChartSettings.chart_type === 'heatmap') &&
                <div id="yaxis-content" className="constructor-settings-tabcontent">
                  {
                    filteredDimensionMetrics.map((item) => {
                      if (item.is_dimension === 1 && item.display_title !== 'Date') {
                        let isDisabledForAdserverDataset = ((item.display_title === 'Advertiser' || item.display_title === 'Monetization Channel'/* || item.display_title === 'Ad Type' || item.display_title === 'Integration Type'*/) && this.state.newChartSettings.metric === 'fill_rate') ? true : false;
                        return (
                          <div key={item.id} className="option radio">
                            <input id={`${this.getDashboardID()}-chart-segment-${item}`} type="radio" name={`${this.getDashboardID()}-chart-segment`} value={item.id} disabled={(this.state.newChartSettings.x_axis === item.id || isDisabledForAdserverDataset) ? true : false} checked={this.state.newChartSettings.segmentation === item.id} onChange={(e) => this.onNewConstructorSettingsChange('segmentation', e.target.value)} />
                            <label htmlFor={`${this.getDashboardID()}-chart-segment-${item}`}>{item.display_title}</label>
                          </div>
                        )
                      }
                    })
                  }
                  {chartFormSearchInput && !filteredDimensionMetrics.length && <p className="no-match-msg">No Match Found</p>}
                </div>
              }

              {/* Show radio button if current tab is y_axis - show radio buttons */}
              {(this.state.newChartSettings.chart_type !== 'heatmap' && (constructorSettingsCurrentTab === 'y_axis' || constructorSettingsCurrentTab === 'metric')) &&
                <div id="yaxis-content" className="constructor-settings-tabcontent">
                  {
                    filteredDimensionMetrics.map((item) => {
                      if (item.is_dimension === 0) {
                        let isDisabledForAdserverDataset = (item.display_title === 'Fill Rate' && ((this.state.newChartSettings.x_axis === 'advertiser' || this.state.newChartSettings.x_axis === 'monetization_channel'/* || this.state.newChartSettings.x_axis === 'ad_type' || this.state.newChartSettings.x_axis === 'integration_type'*/) || (this.state.newChartSettings.segmentation === 'advertiser' || this.state.newChartSettings.segmentation === 'monetization_channel' /*|| this.state.newChartSettings.segmentation === 'ad_type' || this.state.newChartSettings.segmentation === 'integration_type'*/))) ? true : false;
                        return (
                          <div key={item.id} className="option radio">
                            <input id={`${this.getDashboardID()}-chart-yaxis-${item.display_title}}`} type="radio" name={`${this.getDashboardID()}-chart-yaxis}`} value={item.id} disabled={this.state.newChartSettings.x_axis === item.id ? true : isDisabledForAdserverDataset ? true : false} checked={this.state.newChartSettings.metric === item.id} onChange={(e) => this.onNewConstructorSettingsChange('metric', e.target.value)} />
                            <label htmlFor={`${this.getDashboardID()}-chart-yaxis-${item.display_title}}`}>{item.display_title}</label>
                          </div>
                        )
                      }
                    })
                  }
                  {chartFormSearchInput && !filteredDimensionMetrics.length && <p className="no-match-msg">No Match Found</p>}
                </div>
              }

              {/* Show radio button if current tab is value for pie and donut chart - show radio buttons */}
              {(constructorSettingsCurrentTab === 'value' && (this.state.newChartSettings.chart_type === 'pie' || this.state.newChartSettings.chart_type === 'donut' || this.state.newChartSettings.chart_type === 'bubble' || this.state.newChartSettings.chart_type == 'treemap')) &&
                <div id="segment-content" className="constructor-settings-tabcontent">
                  {/* <div className={'switch-toggle small legend-toggle' + (this.state.newChartSettings.metric === '' ? ' disabled' : '')}>
                    <div className="label">Show Legend</div>
                    <div className="switch">
                      <input type="checkbox" disabled={this.state.newChartSettings.metric !== '' ? false : true} checked={this.state.newChartSettings.metric !== '' ? this.state.newChartSettings.showLegend : false} onChange={(e) => this.onNewConstructorSettingsChange('showLegend', null)} />
                      <label></label>
                    </div>
                  </div>
                  <br /> */}

                  {filteredDimensionMetrics.map((item) => {
                    if (item.is_dimension === 0) {
                      let isDisabledForAdserverDataset = (item.display_title === 'Fill Rate' && ((this.state.newChartSettings.x_axis === 'advertiser' || this.state.newChartSettings.x_axis === 'monetization_channel'/* || this.state.newChartSettings.x_axis === 'ad_type' || this.state.newChartSettings.x_axis === 'integration_type'*/) || (this.state.newChartSettings.segmentation === 'advertiser' || this.state.newChartSettings.segmentation === 'monetization_channel'/* || this.state.newChartSettings.segmentation === 'ad_type' || this.state.newChartSettings.segmentation === 'integration_type'*/))) ? true : false;
                      return (
                        <div key={item.id} className="option radio">
                          <input id={`${this.getDashboardID()}-chart-value-${item.display_title}}`} type="radio" name={`${this.getDashboardID()}-chart-value}`} value={item.id} disabled={this.state.newChartSettings.x_axis === item.id || isDisabledForAdserverDataset ? true : false} checked={this.state.newChartSettings.metric === item.id} onChange={(e) => this.onNewConstructorSettingsChange('metric', e.target.value)} />
                          <label htmlFor={`${this.getDashboardID()}-chart-value-${item.display_title}}`}>{item.display_title}</label>
                        </div>
                      )
                    }
                  })
                  }
                  {chartFormSearchInput && !filteredDimensionMetrics.length && <p className="no-match-msg">No Match Found</p>}
                </div>
              }

              {/* if current tab is value for other than pie or donut chart - show multiselect checkboxes */}
              {(constructorSettingsCurrentTab === 'value' && (this.state.newChartSettings.chart_type !== 'pie' && this.state.newChartSettings.chart_type !== 'donut' && this.state.newChartSettings.chart_type !== 'bubble' && this.state.newChartSettings.chart_type !== 'treemap')) &&
                <div id="yaxis-content" className="constructor-settings-tabcontent">
                  {filteredDimensionMetrics.map((item) => {
                    if (item.is_dimension === 0) {
                      let isDisabledForAdserverDataset = (item.display_title === 'Fill Rate' && ((this.state.newChartSettings.x_axis.includes('advertiser') || this.state.newChartSettings.x_axis.includes('monetization_channel')/* || this.state.newChartSettings.x_axis.includes('ad_type') || this.state.newChartSettings.x_axis.includes('integration_type')*/) || (this.state.newChartSettings.segmentation.includes('advertiser') || this.state.newChartSettings.segmentation.includes('monetization_channel')/* || this.state.newChartSettings.segmentation.includes('ad_type') || this.state.newChartSettings.segmentation.includes('integration_type')*/))) ? true : false;
                      return (<div key={item.id} className="option checkbox">
                        <input id={`${this.getDashboardID()}-chart-filter-${item.display_title}}`} type="checkbox" value={item.id} disabled={isDisabledForAdserverDataset} checked={this.state.newChartSettings.metric.includes(item.id)} onChange={(e) => this.onNewConstructorSettingsChange('value', e.target.value)} />
                        <label htmlFor={`${this.getDashboardID()}-chart-filter-${item.display_title}}`}>{item.display_title}</label>
                      </div>
                      )
                    }
                  })
                  }
                  {chartFormSearchInput && !filteredDimensionMetrics.length && <p className="no-match-msg">No Match Found</p>}
                </div>
              }

              {/* Show multiselect check box for spider chart in measurements instead of y axis values */}
              {(constructorSettingsCurrentTab === 'measurements' && this.state.newChartSettings.chart_type === 'spider') &&
                <div id="yaxis-content" className="constructor-settings-tabcontent">
                  {/* <div className={'switch-toggle small legend-toggle' + (this.state.newChartSettings.metric === '' ? ' disabled' : '')}>
                    <div className="label">Show Legend</div>
                    <div className="switch">
                      <input type="checkbox" disabled={this.state.newChartSettings.metric !== '' ? false : true} checked={this.state.newChartSettings.metric !== '' ? this.state.newChartSettings.showLegend : false} onChange={(e) => this.onNewConstructorSettingsChange('showLegend', null)} />
                      <label></label>
                    </div>
                  </div>
                  <br /> */}

                  {filteredDimensionMetrics.map((item) => {
                    if (item.is_dimension === 0) {
                      let isDisabledForAdserverDataset = (item.display_title === 'Fill Rate' && ((this.state.newChartSettings.x_axis === 'advertiser' || this.state.newChartSettings.x_axis === 'monetization_channel'/* || this.state.newChartSettings.x_axis === 'ad_type' || this.state.newChartSettings.x_axis === 'integration_type'*/) || (this.state.newChartSettings.segmentation === 'advertiser' || this.state.newChartSettings.segmentation === 'monetization_channel'/* || this.state.newChartSettings.segmentation === 'ad_type' || this.state.newChartSettings.segmentation === 'integration_type'*/))) ? true : false;
                      return (<div key={item.id} className="option checkbox">
                        <input id={`${this.getDashboardID()}-chart-filter-${item.display_title}}`} type="checkbox" value={item.id} disabled={isDisabledForAdserverDataset} checked={this.state.newChartSettings.metric.includes(item.id)} onChange={(e) => this.onNewConstructorSettingsChange('value', e.target.value)} />
                        <label htmlFor={`${this.getDashboardID()}-chart-filter-${item.display_title}}`}>{item.display_title}</label>
                      </div>
                      )
                    }
                  })
                  }
                  {chartFormSearchInput && !filteredDimensionMetrics.length && <p className="no-match-msg">No Match Found</p>}
                </div>
              }

              {constructorSettingsCurrentTab === 'filter' &&
                <div id="filters-content" className="constructor-settings-tabcontent">
                  {this.state.sourceDimensionsInProcess && <h4>Loading Filter List ...</h4>}

                  {!this.state.sourceDimensionsInProcess &&
                    <>
                      {this.state.chartFormOpenedFilterId === ''
                        && filteredFirstLevelFilters.map((item) => {
                          const isAppliedAtGlobalLevel = this.state.dashboardSettings.filters[item.id] && !!this.state.dashboardSettings.filters[item.id].length;
                          const subItemCheckedCount = this.state.newChartSettings.filters[item.id] ? this.state.newChartSettings.filters[item.id].length : 0;

                          return (
                            <div key={item.id} className={'option' + (isAppliedAtGlobalLevel ? ' disabled' : '')}>
                              <div className="option-inner" onClick={() => this.handleFilterOptionsList(item.id)}>
                                <label >{item.display_title}</label>
                                {subItemCheckedCount > 0 && <span className="option-count" >{subItemCheckedCount}</span>}
                              </div>
                            </div>
                          )
                        })
                      }
                      {this.state.chartFormOpenedFilterId !== '' &&
                        <>
                          <div className={'option sub-option-heading'}>
                            <div className="option-inner">
                              {/* <input type="checkbox" id={`${this.getDashboardID()}-chart-filter-opened`} checked={true}
                                value={this.state.chartFormOpenedFilterId}
                                onChange={(e) => { this.setState({ chartFormOpenedFilterId: '' }); this.onNewConstructorSettingsChange('filters', e.target.value) }} />
                              <label htmlFor={`${this.getDashboardID()}-chart-filter-opened`} >
                                {openedFilterName}
                              </label>
                              <button className="btn btn-filter-ok" onClick={(e) => this.handleFilterOptionsList(e, '')}>Ok</button> */}
                              <span className="back-btn" onClick={() => this.handleFilterOptionsList('')}></span>
                              <label> {openedFilterName}</label>
                            </div>
                          </div>

                          <div className={'option checkbox sub-option select-all' + (chartFormSearchInput !== '' && filteredSecondLevelFilters.length === 0 ? ' disabled' : '')}>
                            <input id={`dash-${this.getDashboardID()}-filter-lev2-select-all`} type="checkbox" checked={isAllSuboptionsChecked} onChange={() => this.handleNewConstructorFilterSelectAllClick(this.state.chartFormOpenedFilterId, !isAllSuboptionsChecked, filteredSecondLevelFilters)} />
                            <label htmlFor={`dash-${this.getDashboardID()}-filter-lev2-select-all`}>Select All</label>
                          </div>

                          {filteredSecondLevelFilters.map((subitem) => {
                            let isSubOptionChecked = this.state.newChartSettings.filters[this.state.chartFormOpenedFilterId] ? this.state.newChartSettings.filters[this.state.chartFormOpenedFilterId].includes(subitem) : false;

                            return (
                              <div key={subitem} className={'option checkbox sub-option'}>
                                <input id={`${this.getDashboardID()}-chart-filter-lev2-${subitem}`} type="checkbox" value={subitem} checked={isSubOptionChecked} onChange={(e) => this.onNewConstructorSettingsChange('filters', e.target.value, this.state.chartFormOpenedFilterId)} />
                                <label htmlFor={`${this.getDashboardID()}-chart-filter-lev2-${subitem}`}>{subitem}</label>
                              </div>
                            )
                          })}
                        </>
                      }
                      {chartFormSearchInput !== '' &&
                        ((this.state.chartFormOpenedFilterId === '' && filteredFirstLevelFilters.length === 0) || (this.state.chartFormOpenedFilterId !== '' && filteredSecondLevelFilters.length === 0)) &&
                        <p className="no-match-msg">No Match Found</p>}
                    </>
                  }
                </div>
              }

              {/* Period */}
              {constructorSettingsCurrentTab === 'period' &&
                <div id="period-content" className="constructor-settings-tabcontent panel-widget constructor period">
                  {globalPeriod &&
                    <div className="global-range">
                      <p>Dashboard level period applied, to edit click</p>
                      <button className="btn-settings" onClick={() => this.navigateToDashboardSettings('data', 'period')}>settings</button>
                    </div>
                  }
                  <div className="widget-header">
                    <div className={'switch-toggle small period-toggle' + (globalPeriod ? ' disabled' : '')}>
                      <div className="label">Dynamic</div>
                      <div className="switch">
                        <input type="checkbox" checked={showTimePresetsToConsider} onChange={() => this.setState({ chartFormShowTimePresets: !this.state.chartFormShowTimePresets })} />
                        <label></label>
                      </div>
                    </div>
                  </div>

                  <div className="widget-content">
                    {showTimePresetsToConsider &&
                      <>
                        <div className="date-preselect-wrapper">
                          {DATE_PERIOD_PRESELECTS.map(pre => {
                            // const periodToMatch = globalPeriod || this.state.newChartSettings.dynamic_time_period || FALLBACK_TIME_PERIOD_FOR_CHARTS;
                            const periodToMatch = globalPeriod || this.state.newChartSettings.dynamic_time_period;
                            const isSelected = pre === (periodToMatch ? periodToMatch.value : '');
                            const isDisabled = globalPeriod;

                            return <div key={pre} className="preselect-grid">
                              <div className={'preselect' + (isSelected ? ' selected' : '') + (isDisabled ? ' disabled' : '')} onClick={() => this.onNewConstructorSettingsChange('dynamic_time_period', pre)}>{pre}</div>
                            </div>
                          })}
                        </div>

                        {periodToConsiderBasedonPriority && periodToConsiderBasedonPriority.value === 'Custom' &&
                          <div className={'custom-period-setting' + (globalPeriod ? ' disabled' : '')}>
                            <div className="custom-date">
                              <label>Start Date :</label>
                              <input type="number" min="0" className="field-control"
                                value={periodToConsiderBasedonPriority.custom_dates.start_date}
                                onChange={e => this.handleNewConstructorCustomPeriodChange('start_date', e.target.value ? Number(e.target.value) : '')}
                              />
                              <div className="custom-date-dropdown">
                                <SpeedSelect
                                  options={['days before yesterday', 'weeks before yesterday', 'months before yesterday', 'quarters before yesterday', 'years before yesterday']}
                                  selectedOption={periodToConsiderBasedonPriority.custom_dates.start_date_preselect}
                                  onSelect={val => this.handleNewConstructorCustomPeriodChange('start_date_preselect', val)}
                                  // selectLabel='Chart Type'
                                  disableSearch
                                />
                              </div>
                            </div>
                            <div className="custom-date">
                              <label>End Date :</label>
                              <input type="number" min="0" className="field-control"
                                value={periodToConsiderBasedonPriority.custom_dates.end_date}
                                onChange={e => this.handleNewConstructorCustomPeriodChange('end_date', e.target.value ? Number(e.target.value) : '')}
                              />
                              <div className="custom-date-dropdown">
                                <SpeedSelect
                                  options={['days before today', 'weeks before today', 'months before today', 'quarters before today', 'years before today']}
                                  selectedOption={periodToConsiderBasedonPriority.custom_dates.end_date_preselect}
                                  onSelect={val => this.handleNewConstructorCustomPeriodChange('end_date_preselect', val)}
                                  // selectLabel='Chart Type'
                                  disableSearch
                                />
                              </div>
                            </div>
                          </div>
                        }
                      </>
                    }

                    {!showTimePresetsToConsider &&
                      <MultiPeriodPickerPanel
                        periods={calendarSelectedRanges}
                        periodBGColors={[colors[0], colors[1], colors[2], colors[3]]}
                        periodColors={['#000', '#fff', '#000', '#000']}
                        onChange={(dateRange) => this.onNewConstructorSettingsChange('dynamic_time_period', dateRange)}
                        singleRangeonly={true}
                        disableFn={(dObj) => globalPeriod ? true : dObj > new Date()}
                      />
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    )
  }

  //Switch toggle
  handlePeriodSwitchToggle(){
    this.setState({ dashboardFormShowTimePresets: !this.state.dashboardFormShowTimePresets });
  }

  giveConsoleContentHtmlForControlsTab() {
    const colors = getChartColors();
    const calendarSelectedRanges = this.state.dashboardSettings.dynamic_time_period && this.state.dashboardSettings.dynamic_time_period.is_dynamic === false ? [this.convertDateRangeInStringToRangeInObject(this.state.dashboardSettings.dynamic_time_period.value)] : null;

    // Period panel, filter panel are to be shown conditionally in view mode
    const showPeriodPanel = this.isDashboardInEditMode() ? true : this.state.dashboardSettings.presentationFilters.includes('period');
    const showFilterPanel = this.isDashboardInEditMode() ? true : this.state.dashboardSettings.presentationFilters.length > 0 && (this.state.dashboardSettings.presentationFilters.length > 1 || this.state.dashboardSettings.presentationFilters[0] !== 'period');
    const dashboardFitersObject = this.giveDashboardFilters();
    let dashboardFitersListFirstLevel = Object.keys(dashboardFitersObject).filter(fname => fname.split('_').join(' ').toLocaleLowerCase().includes(this.state.dashboardFilterSearchInput.trim().toLocaleLowerCase()));
    if (!this.isDashboardInEditMode()) { dashboardFitersListFirstLevel = dashboardFitersListFirstLevel.filter(fn => this.state.dashboardSettings.presentationFilters.includes(fn)) }
    const dashboardOpenedFilterName = this.state.dashboardOpenedFilterName;
    let dashboardFitersListSecondLevel = (dashboardFitersObject[dashboardOpenedFilterName] || []).filter(f => f.toLowerCase().includes(this.state.dashboardFilterSearchInput.toLowerCase().trim()));

    const noMatchFound = dashboardOpenedFilterName === '' ? this.state.dashboardFilterSearchInput.trim() !== '' && dashboardFitersListFirstLevel.length === 0 : this.state.dashboardFilterSearchInput.trim() !== '' && dashboardFitersListSecondLevel.length === 0;
    const subOptionSelectedCount = this.state.dashboardSettings.filters[dashboardOpenedFilterName] ? this.state.dashboardSettings.filters[dashboardOpenedFilterName].length : 0;
    const isAllSuboptionsChecked = (subOptionSelectedCount === dashboardFitersListSecondLevel.length && this.state.dashboardSettings.filters[dashboardOpenedFilterName]) ? this.state.dashboardSettings.filters[dashboardOpenedFilterName].every(f => dashboardFitersListSecondLevel.includes(f)) : false;

    return (
      <div id="dashboard-settings" className="dashboaord-tab-content">
        {/* Dashboard Widget - Period */}
        {showPeriodPanel &&
          <div className="panel-widget dashboard period">
            <div className="widget-header">
              <div className="widget-title">
                <div className={'switch-toggle small'}>
                  <div className="label">Dynamic</div>
                  <div className="switch">
                    {/* <input type="checkbox" checked={this.state.dashboardFormShowTimePresets} onChange={(val) => this.handlePeriodSwitchToggle(val)} /> */}
                    <input type="checkbox" checked={this.state.dashboardFormShowTimePresets} onChange={()=>this.handlePeriodSwitchToggle()} />
                    <label></label>
                  </div>
                </div>

              </div>
            </div>

            <div className="widget-content">
              {this.state.dashboardFormShowTimePresets &&
                <>
                  <div className="date-preselect-wrapper">
                    {DATE_PERIOD_PRESELECTS.map(pre => {
                      const isSelected = pre === (this.state.dashboardSettings.dynamic_time_period ? this.state.dashboardSettings.dynamic_time_period.value : null);
                      return <div key={pre} className="preselect-grid"><div className={'preselect' + (isSelected ? ' selected' : '')} onClick={() => this.handleDashboardSettingsChange('dynamic_time_period', pre)}>{pre}</div></div>
                    })}
                  </div>

                  {this.state.dashboardSettings.dynamic_time_period && this.state.dashboardSettings.dynamic_time_period.value === 'Custom' &&
                    <div className="custom-period-setting">
                      <div className="custom-date">
                        <label>Start Date :</label>
                        <input type="number" min="0" className="field-control"
                          value={this.state.dashboardSettings.dynamic_time_period.custom_dates.start_date}
                          onChange={e => this.handleDashboardCustomPeriodChange('start_date', Number(e.target.value))}
                        />
                        <div className="custom-date-dropdown">
                          <SpeedSelect
                            options={['days before yesterday', 'weeks before yesterday', 'months before yesterday', 'quarters before yesterday', 'years before yesterday']}
                            selectedOption={this.state.dashboardSettings.dynamic_time_period.custom_dates.start_date_preselect}
                            onSelect={val => this.handleDashboardCustomPeriodChange('start_date_preselect', val)}
                            // selectLabel='Chart Type'
                            disableSearch
                          />
                        </div>
                      </div>

                      <div className="custom-date">
                        <label>End Date :</label>
                        <input type="number" min="0" className="field-control"
                          value={this.state.dashboardSettings.dynamic_time_period.custom_dates.end_date}
                          onChange={e => this.handleDashboardCustomPeriodChange('end_date', Number(e.target.value))}
                        />
                        <div className="custom-date-dropdown">
                          <SpeedSelect
                            options={['days before today', 'weeks before today', 'months before today', 'quarters before today', 'years before today']}
                            selectedOption={this.state.dashboardSettings.dynamic_time_period.custom_dates.end_date_preselect}
                            onSelect={val => this.handleDashboardCustomPeriodChange('end_date_preselect', val)}
                            // selectLabel='Chart Type'
                            disableSearch
                          />
                        </div>
                      </div>
                    </div>
                  }
                </>
              }

              {!this.state.dashboardFormShowTimePresets &&
                <MultiPeriodPickerPanel
                  periods={calendarSelectedRanges}
                  periodBGColors={[colors[0], colors[1], colors[2], colors[3]]}
                  periodColors={['#000', '#fff', '#000', '#000']}
                  onChange={(dateRange) => this.handleDashboardSettingsChange('dynamic_time_period', dateRange)}
                  singleRangeonly={true}
                  disableFn={(dObj) => dObj > new Date()}
                />
              }
            </div>
          </div>
        }

        {/* Dashboard Widget - Filters */}
        {showFilterPanel &&
          <div className="panel-widget dashboard filters">
            <div className="widget-header">
              <div className="widget-title">Filters <span>{dashboardFitersListFirstLevel.length}</span></div>
              <div className="action-buttons">

              </div>
            </div>

            <div className={'widget-content ' + (dashboardOpenedFilterName !== '' ? 'filter-opened' : '')} >
              {dashboardOpenedFilterName === '' &&
                <>
                  <div className="gl-search-wrapper">
                    <div className="gl-search">
                      <input type="text" name="search" className="search" placeholder=""
                        value={this.state.dashboardFilterSearchInput}
                        onChange={(e) => this.setState({ dashboardFilterSearchInput: e.target.value })} />
                    </div>
                  </div>


                  {dashboardFitersListFirstLevel.map((fName) => {
                    const formattedName = fName === 'os' ? 'OS' : covertUnderscoreToSpaceInString(fName);
                    const selectedCount = this.state.dashboardSettings.filters[fName] ? this.state.dashboardSettings.filters[fName].length : 0;
                    const optionUniqueId = `dash-${this.getDashboardID()}-filter-lev1-${fName}`;

                    return (
                      <div key={fName} id={optionUniqueId} className={'option' + (selectedCount > 0 ? ' selected' : '')}>
                        <div className="option-inner" onClick={() => this.handleDashboardFirstLevelFilterClick(fName)} >
                          <label >{formattedName}</label>
                          {selectedCount > 0 && <span className="option-count" >{selectedCount}</span>}
                        </div>
                      </div>
                    )
                  })
                  }
                </>
              }

              {dashboardOpenedFilterName !== '' &&
                <>
                  <div className={'option sub-option-heading'}>
                    <div className="option-inner">
                      <span className="back-btn" onClick={() => this.handleDashboardFirstLevelFilterClick('')}></span>
                      <label> {dashboardOpenedFilterName === 'os' ? 'OS' : covertUnderscoreToSpaceInString(dashboardOpenedFilterName)}</label>
                    </div>
                  </div>

                  <div className="gl-search-wrapper">
                    <div className="gl-search">
                      <input type="text" name="search" className="search" placeholder=""
                        value={this.state.dashboardFilterSearchInput}
                        onChange={(e) => this.setState({ dashboardFilterSearchInput: e.target.value })} />
                    </div>
                  </div>

                  {dashboardFitersListSecondLevel.lenght > 0 &&
                    <div className={'option checkbox sub-option select-all' + (noMatchFound ? ' disabled' : '')}>
                      <input id={`dash-${this.getDashboardID()}-filter-lev2-select-all`} type="checkbox" checked={isAllSuboptionsChecked} onChange={() => this.handleDashboardFilterSelectAllClick(dashboardOpenedFilterName, !isAllSuboptionsChecked, dashboardFitersListSecondLevel)} />
                      <label htmlFor={`dash-${this.getDashboardID()}-filter-lev2-select-all`}>Select All</label>
                    </div>
                  }
                
                  {dashboardFitersListSecondLevel.map((subitem) => {
                    const subOptionUniqueId = `dash-${this.getDashboardID()}-filter-lev2-${subitem}`;
                    const isChecked = this.state.dashboardSettings.filters[this.state.dashboardOpenedFilterName] ? this.state.dashboardSettings.filters[this.state.dashboardOpenedFilterName].includes(subitem) : false;
                    return (
                      <div key={subitem} className={'option checkbox sub-option'}>
                        <input id={subOptionUniqueId} type="checkbox" checked={isChecked} onChange={() => this.handleDashboardSettingsChange('filters', subitem, this.state.dashboardOpenedFilterName)} />
                        <label htmlFor={subOptionUniqueId}>{subitem}</label>
                      </div>
                    )
                  })}
                </>
              }

              {noMatchFound &&
                <p className="no-match-msg">No Match Found</p>
              }


              {this.state.sourceDimensionsInProcess && <h4>Loading Filters ...</h4>}
            </div>
          </div>
        }
      </div>
    )
  }

  giveConsoleContentHtmlForInsightsTab() {
    const giveUsersOfNotes = (notes) => {
      let users = [];
      notes.forEach(n => {
        if (!users.some(u => u.id === n.created_by)) {
          users.push(n.user);
        }
      });
      return users;
    };

    const chartSelectedForNoteAdditionIndex = this.state.insightNoteAddForm.chartInfo ? this.state.chartsSettings.findIndex(c => c.id === this.state.insightNoteAddForm.chartInfo.id) : -1;
    const chartSelectedForNoteAddition = chartSelectedForNoteAdditionIndex > -1 ? this.state.chartsSettings[chartSelectedForNoteAdditionIndex] : null;
    let chartNotes = this.state.insightNotes ? this.state.insightNotes.chart_notes : [];
    let dashboardNotes = this.state.insightNotes ? this.state.insightNotes.dashboard_notes : [];
    const totalChartNotesCount = chartNotes.length;

    const usersFilters = giveUsersOfNotes(this.state.insightFormNoteFor === 'Dashboard' ? dashboardNotes : chartNotes);
    chartNotes = this.state.insightFormNoteFor === 'Chart' && this.state.insightSelectedUsersIDs.length ? chartNotes.filter(cn => this.state.insightSelectedUsersIDs.includes(cn.created_by)) : chartNotes;
    dashboardNotes = this.state.insightFormNoteFor === 'Dashboard' && this.state.insightSelectedUsersIDs.length ? dashboardNotes.filter(cn => this.state.insightSelectedUsersIDs.includes(cn.created_by)) : dashboardNotes;

    // If some note is in clicked state, then filter the chart list so that only notes specific to that chart and x_axis value are visible
    if (this.state.insightFormNoteFor === 'Chart' && chartNotes.length && this.state.insightClickedNoteInfo) {
      var xPointIsDateObj = chartNotes[0].x_axis_point instanceof Date;
      chartNotes = chartNotes.filter(cn => {
        if (cn.chart_id === this.state.insightClickedNoteInfo.chart_id && (xPointIsDateObj ? giveDateInString(cn.x_axis_point) === giveDateInString(this.state.insightClickedNoteInfo.x_axis_point) : cn.x_axis_point === this.state.insightClickedNoteInfo.x_axis_point)) {
          return true
        }
        return false;
      });
    }
    const editorNode = this.insightAddFormQuillDOMRef.current;
    const isQuillEditorBlank = editorNode ? editorNode.editor.root.className.includes('ql-blank') : true;

    // const emptyNoteList = this.state.insightFormNoteFor === 'Dashboard' ? this.state.insightNotes && dashboardNotes.length === 0 : this.state.insightNotes && totalChartNotesCount === 0;
    // const forceFocusInput = !this.state.insightNoteAddInputExpanded && emptyNoteList;
    // if (forceFocusInput) {
    //   setTimeout(() => {
    //     this.setState({ insightNoteAddInputExpanded: true });

    //   });
    //   return;
    // }
    // const disableCancelBtn =  (this.state.insightFormNoteFor === 'Dashboard' ? isQuillEditorBlank : !this.state.insightPointSelectionModeON);
    const disableCancelBtn = false;
    const dashboarPrivileges = this.getDashboardDataKeyVal('privileges');
    const canComment = this.state.dashboardSettings.id !== null ? dashboarPrivileges && dashboarPrivileges.includes('COMMENT') : false;

    return (
      <div id="insight-settings" className="dashboaord-tab-content">
        {this.state.loadingNotes &&
          <p>Loading Notes ...</p>
        }

        {!this.state.loadingNotes && this.state.insightNotes &&
          <>
            <div className="sticky-div">
              <div className="insight-filter-list">
                <div className="left">
                  <div className="dd-with-label filter-note-for">
                    <label className="dd-label">For</label>
                    <SpeedSelect
                      options={['Dashboard', 'Chart']}
                      selectedOption={this.state.insightFormNoteFor}
                      onSelect={this.handleInsightFormNoteForChange}
                      disableSearch
                    />
                  </div>
                  <div className="dd-with-label filter-note-type">
                    <label className="dd-label">Type</label>
                    <SpeedSelect
                      options={['AI Generated', 'User Notes']}
                      selectedOption={this.state.insightFormNoteType}
                      onSelect={this.handleInsightFormNoteTypeChange}
                      disableSearch
                    />
                  </div>
                </div>

                <div className="right">
                  <button className="search-btn"></button>
                </div>
              </div>

              <div className="note-avtar">
                {usersFilters.length > 0 &&
                  <div className="users-filter">
                    {usersFilters.map(user => {
                      const isSelected = this.state.insightSelectedUsersIDs.includes(user.id);
                      return <UserAvatar key={user.id} user={user} isSelected={isSelected} onClick={this.handleInsightUserFilterSelect} />
                    })}
                  </div>
                }
                {dashboardNotes.length > 0 &&
                  <div className="note-count">
                    <p>Unread</p>
                    <span>{dashboardNotes.length}</span>
                  </div>
                }
              </div>

              {canComment &&
                <div className="note-add-form">
                  {this.state.insightFormNoteFor === 'Chart' && chartSelectedForNoteAddition &&
                    <div className="cursor-lock-msg">
                      <p className="msg">{chartSelectedForNoteAdditionIndex + 1}) {chartSelectedForNoteAddition.name}</p>
                      <p className="msg">{chartSelectedForNoteAddition.x_axis.toUpperCase()}: {this.state.insightNoteAddForm.chartInfo.xPoint}</p>
                      {this.state.insightNoteAddForm.chartInfo.segmentName && <p className="msg">{this.state.insightNoteAddForm.chartInfo.segmentName.toUpperCase()}: {this.state.insightNoteAddForm.chartInfo.segmentValue}</p>}
                    </div>
                  }
                  <div className={'editor' + (isQuillEditorBlank ? ' editor-blank' : '') + (this.state.insightNoteAddInputExpanded ? ' editor-focused' : '')}>
                    <ReactQuill
                      ref={this.insightAddFormQuillDOMRef}
                      readOnly={this.state.insightEditNoteId === null && this.state.insightFormNoteFor === 'Chart' && this.state.insightNoteAddInputExpanded && !chartSelectedForNoteAddition}
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
                        <button className="btn btn-small" disabled={isQuillEditorBlank || this.state.chartOrDashboardSaveInProcess}
                          onClick={this.handleInsightNoteSaveBtn}>
                          <i></i><span>Save</span></button>
                        <button className="btn btn-small" disabled={disableCancelBtn} onClick={this.handleInsightFormCancelBtn}><i></i><span>Cancel</span></button>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <div className="notes">
              {this.state.insightFormNoteFor === 'Dashboard' &&
                <React.Fragment>
                  {dashboardNotes.map((note, i) => {
                    const formattedCreatedDate = giveDateTimeInString(new Date(note.created_time));
                    const noteReplies = this.state.insightNotesReplies[note.id] || [];
                    const loadingChildNotes = this.state.insightNotesRepliesLoadings[note.id] || false;
                    const isExpanded = this.state.insightNotesExpanded[note.id] || false;
                    const isReplyExpanded = this.state.insightReplyNoteId === note.id;
                    const canEditComment = canComment && note.created_by === this.user ? this.user.id : 0;
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
                                    <ClickOutsideListener onOutsideClick={() => this.setState({ insightOpenedOptionsNoteId: null })}>
                                      <div className="pop-over-options-wrapper">
                                        <ul className="pop-over-options">
                                          <li className={this.state.chartOrDashboardSaveInProcess ? 'disabled' : ''} onClick={(e) => { e.stopPropagation(); this.handleInsightNoteEditBtn('Dashboard', note.id, null) }}>Edit</li>
                                          <li className={this.state.chartOrDashboardSaveInProcess ? 'disabled' : ''} onClick={(e) => { e.stopPropagation(); this.handleInsightNoteDeleteBtn('Dashboard', note.id, null) }}>Delete</li>
                                        </ul>
                                      </div>
                                    </ClickOutsideListener>
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
                                  <button className="btn btn-small" disabled={this.state.chartOrDashboardSaveInProcess}
                                    onClick={() => this.handleInsightNoteSaveChangesBtn(note.parent_note_id)}>
                                    <i></i><span>Save Changes</span></button>
                                  <button className="btn btn-small" disabled={this.state.chartOrDashboardSaveInProcess} onClick={() => this.setState({ insightEditNoteId: null })}><i></i><span>Cancel</span></button>
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
                                  <button className="btn btn-small" disabled={this.state.chartOrDashboardSaveInProcess}
                                    onClick={this.handleInsightNoteReplySaveBtn}>
                                    <i></i><span>Save</span></button>
                                  <button className="btn btn-small" disabled={this.state.chartOrDashboardSaveInProcess} onClick={() => this.handleInsightReplyFormCancelBtn()}><i></i><span>Cancel</span></button>
                                </div>
                              }

                            </div>
                          </div>

                          {noteReplies.length > 0 &&
                            <div className="note-replies-wrapper">
                              {noteReplies.map(noteReply => {
                                const formattedCreatedDate = giveDateTimeInString(new Date(noteReply.created_time));
                                return (
                                  <div key={noteReply.user.id} className="note-widget">
                                    <div className="header">
                                      <UserAvatar user={noteReply.user} />
                                      <span className="name">{noteReply.user.first_name[0].toUpperCase() + noteReply.user.first_name.slice(1) + ' ' + (noteReply.user.last_name[0] ? noteReply.user.last_name[0].toUpperCase() + noteReply.user.last_name.slice(1) : '')}</span>
                                      <span className="date">{formattedCreatedDate}</span>
                                      <div className="note-action-btn">
                                        <span className="pop-over-btn" onClick={() => this.setState({ insightOpenedOptionsNoteId: noteReply.id })}>
                                          {this.state.insightOpenedOptionsNoteId === noteReply.id &&
                                            <ClickOutsideListener onOutsideClick={() => this.setState({ insightOpenedOptionsNoteId: null })}>
                                              <div className="pop-over-options-wrapper">
                                                <ul className="pop-over-options">
                                                  <li className={this.state.chartOrDashboardSaveInProcess ? 'disabled' : ''} onClick={(e) => { e.stopPropagation(); this.handleInsightNoteEditBtn('Dashboard', noteReply.id, note.id) }}>Edit</li>
                                                  <li className={this.state.chartOrDashboardSaveInProcess ? 'disabled' : ''} onClick={(e) => { e.stopPropagation(); this.handleInsightNoteDeleteBtn('Dashboard', noteReply.id, note.id) }}>Delete</li>
                                                </ul>
                                              </div>
                                            </ClickOutsideListener>
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
                                            <button className="btn btn-small" disabled={this.state.chartOrDashboardSaveInProcess}
                                              onClick={() => this.handleInsightNoteSaveChangesBtn(noteReply.parent_note_id)}>
                                              <i></i><span>Save Changes </span></button>
                                            <button className="btn btn-small" disabled={this.state.chartOrDashboardSaveInProcess} onClick={() => this.setState({ insightEditNoteId: null })}><i></i><span>Cancel</span></button>
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
                  {!dashboardNotes.length &&
                    <div className="empty-list-widget">
                      <p>Notes added to Dashboard will appear here</p>
                    </div>
                  }
                </React.Fragment>
              }
            </div>

            {this.state.insightFormNoteFor === 'Chart' &&
              <React.Fragment>
                {this.state.insightClickedNoteInfo &&
                  <p>
                    Showing charts for &lsquo;{this.state.insightClickedNoteInfo.chart_name}&rsquo; for &lsquo;{xPointIsDateObj ? giveDateInString(this.state.insightClickedNoteInfo.x_axis_point) : this.state.insightClickedNoteInfo.x_axis_point}&rsquo;
                    <span style={{ border: '1px solid #fff', padding: '0px 2px' }} onClick={() => this.setState({ insightClickedNoteInfo: null })}>Show All</span>
                  </p>
                }

                {chartNotes.map((note, i) => {
                  const formattedCreatedDate = new Date(note.created_time).toISOString().slice(0, 10);
                  const segmentInfo = note.segmentation ? JSON.parse(note.segmentation) : null;
                  return <div key={i} className="note-widget">
                    <span className="unread-indicator"></span>
                    <div className="header chart-note">
                      <UserAvatar user={note.user} />
                      <div className="chart-note-title">
                        <span className="name">{note.user.first_name[0].toUpperCase() + note.user.first_name.slice(1) + ' ' + (note.user.last_name[0] ? note.user.last_name[0].toUpperCase() + note.user.last_name.slice(1) : '')}</span>
                        <span className="date">{formattedCreatedDate}</span>
                        {segmentInfo && <span className="segment">{segmentInfo.name} : {segmentInfo.value}</span>}
                        <div className="chart-info">
                          <label className="chart-number">Widget ID {note.chart_id}</label>
                          <span className="chart-name">{note.chart_name}</span>
                        </div>
                      </div>
                      <div className="note-action-btn">
                        <span className="pop-over-btn" onClick={() => this.setState({ insightOpenedOptionsNoteId: note.id })} >
                          {this.state.insightOpenedOptionsNoteId === note.id &&
                            <ClickOutsideListener onOutsideClick={() => this.setState({ insightOpenedOptionsNoteId: null })}>
                              <div className="pop-over-options-wrapper">
                                <ul className="pop-over-options">
                                  <li className={this.state.chartOrDashboardSaveInProcess ? 'disabled' : ''} onClick={() => this.handleInsightNoteEditBtn('Chart', note.id)}>Edit</li>
                                  <li className={this.state.chartOrDashboardSaveInProcess ? 'disabled' : ''} onClick={() => this.handleInsightNoteDeleteBtn('Chart', note.id)}>Delete</li>
                                </ul>
                              </div>
                            </ClickOutsideListener>
                          }
                        </span>
                      </div>
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
                            <button className="btn btn-small" disabled={this.state.chartOrDashboardSaveInProcess}
                              onClick={this.handleInsightNoteSaveChangesBtn}>
                              <i></i><span>Save Changes </span></button>
                            <button className="btn btn-small" disabled={this.state.chartOrDashboardSaveInProcess} onClick={() => this.setState({ insightEditNoteId: null })}><i></i><span>Cancel</span></button>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                })}
                {!totalChartNotesCount &&
                  <div className="empty-list-widget">
                    <p>Notes added to Charts will appear here</p>
                  </div>
                }
              </React.Fragment>
            }
          </>
        }

      </div>
    );
  }

  giveConsoleContentHtmlForShareTab() {
    const orgSearchInput = this.state.shareNewOrgSearch.trim();
    const userSearchInput = this.state.shareNewUserSearch.trim();
    const chartSearchInputForEdit = this.state.shareEditChartSearch.trim();
    const chartSearchInputForNew = this.state.shareNewChartSearch.trim();
    const orgList = orgSearchInput ? this.state.organisationList.filter(o => o.name.toLowerCase().includes(orgSearchInput.toLowerCase())) : this.state.organisationList;
    const userList = userSearchInput ? this.state.userList.filter(u => (u.first_name + '' + u.last_name).toLowerCase().includes(userSearchInput.toLowerCase())) : this.state.userList;
    const chartListForEdit = chartSearchInputForEdit ? this.state.chartsSettings.filter(c => (c.name || String(c.id)).toLowerCase().includes(chartSearchInputForEdit.toLowerCase())) : this.state.chartsSettings;
    const chartListForNew = chartSearchInputForNew ? this.state.chartsSettings.filter(c => (c.name || String(c.id)).toLowerCase().includes(chartSearchInputForNew.toLowerCase())) : this.state.chartsSettings;
    const chartSelectAllStatusForEdit = this.state.chartsSettings.length === this.state.shareEditChartsIDsSelected.length;
    const chartSelectAllStatusForNew = this.state.chartsSettings.length === this.state.shareNewChartsIDsSelected.length;

    // Note - In case sharedUser list has been fetched already and that list is empty, we want to restrict the user to be able to see only the inivite form
    // To avoid handling this restrictions from multiple places, this has been done in render method itself
    if (!this.state.shareShowNewForm && this.state.sharedUsers && !this.state.sharedUsers.length) {
      this.handleShareNewBtnClick();
      return;
    }

    const dashboarPrivileges = this.getDashboardDataKeyVal('privileges');

    return (
      <div id="share-settings" className="dashboaord-tab-content">
        {this.state.loadingSharedUsers && <p>Loading Shared Users ...</p>}

        {!this.state.loadingSharedUsers && this.state.sharedUsers && !this.state.shareShowNewForm &&
          <>
            <div className="shared-users">
              {this.state.sharedUsers.map(shareInfo => {
                const isEditing = this.state.shareEditUserInfo ? this.state.shareEditUserInfo.user.id === shareInfo.user.id : false;

                return (
                  <div key={shareInfo.user.id} className={'shared-user' + (isEditing ? ' shared-user-editing' : '')}>
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
                        {shareInfo.privileges.split(',').map((p, i) =>
                          <li key={i}><span className="item">{p[0] + p.slice(1).toLowerCase()}</span></li>
                        )}
                      </ul>
                    </div>

                    <div className="selected-charts">
                      <div className="label">Access : </div>
                      {!!shareInfo.is_full_dashboard===true ?
                        <span className="full-dash-msg"> Full Dashboard</span>
                        :
                        <ul>
                          {shareInfo.dashboard_config.split(',').map(p =>
                            <li key={p}><span className="item">{p}</span></li>
                          )}
                        </ul>
                      }
                    </div>

                    {(this.isDashboardInEditMode() && dashboarPrivileges && dashboarPrivileges.includes('SHARE')) &&
                      <span className="pop-over-btn menu-btn" onClick={() => this.setState({ shareEditPopupUserID: shareInfo.user.id })}>
                        {this.state.shareEditPopupUserID === shareInfo.user.id &&
                          <ClickOutsideListener onOutsideClick={() => this.setState({ shareEditPopupUserID: null })}>
                            <div className="pop-over-options-wrapper">
                              <ul className="pop-over-options">
                                <li className={this.state.chartOrDashboardSaveInProcess ? 'disabled' : ''} onClick={(e) => { e.stopPropagation(); this.setState({ shareEditPopupUserID: null }); this.handleShareEditBtn(shareInfo) }}>Edit</li>
                                <li className={this.state.chartOrDashboardSaveInProcess ? 'disabled' : ''} onClick={(e) => { e.stopPropagation(); this.handleShareEditDeleteBtn(shareInfo.id) }}>Revoke Access</li>
                              </ul>
                            </div>
                          </ClickOutsideListener>
                        }
                      </span>
                    }

                    {(isEditing && dashboarPrivileges && dashboarPrivileges.includes('SHARE')) &&
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
                                    <div className="option checkbox">
                                      <input id={`${this.getDashboardID()}-share-${auth}`} type="checkbox"
                                        checked={checked}
                                        onChange={() => this.handleShareEditAuthSelect(auth)} />
                                      <label htmlFor={`${this.getDashboardID()}-share-${auth}`}>
                                        {auth[0] + auth.slice(1).toLowerCase()}</label>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </div>

                        <div className={'panel-widget chart-list-container'}>
                          <div className="widget-header">
                            <div className="widget-title">Dashboard
                              {this.state.shareEditChartsIDsSelected.length ? <label>Selected <span>{this.state.shareEditChartsIDsSelected.length}</span></label> : null}
                            </div>
                            <div className="gl-search">
                              <input value={this.state.shareEditChartSearch} onChange={e => this.setState({ shareEditChartSearch: e.target.value })} />
                            </div>
                          </div>
                          <div className="widget-content">
                            <div className="list chart-list">
                              <div className="option checkbox select-all">
                                <input id={`${this.getDashboardID()}-chart-select-all`} type="checkbox" checked={chartSelectAllStatusForEdit} onChange={(e) => this.handleShareEditChartSelectAll(e.target.checked)} />
                                <label htmlFor={`${this.getDashboardID()}-chart-select-all`}>Select All</label>
                              </div>
                              {chartListForEdit.map((chart) => {
                                const selected = this.state.shareEditChartsIDsSelected.includes(chart.id);
                                return (
                                  <div key={chart.id} className="option checkbox">
                                    <input id={`${this.getDashboardID()}-chart-${chart.id}`} type="checkbox" checked={selected} onChange={() => this.handleShareEditChartSelect(chart.id)} />
                                    <label htmlFor={`${this.getDashboardID()}-chart-${chart.id}`}>{chart.id} : {chart.name}</label>
                                  </div>
                                )
                              })}
                              {chartSearchInputForEdit && !chartListForEdit.length && <p className="no-match-msg">No Match Found</p>}
                            </div>
                          </div>
                        </div>
                        <div className="action-btns">
                          <button className="btn btn-small" onClick={this.handleShareEditSubmitBtn} disabled={this.state.chartOrDashboardSaveInProcess}><i></i><span>Update 1</span></button>
                          <button className="btn btn-small" onClick={this.handleShareEditCancelBtn} disabled={this.state.chartOrDashboardSaveInProcess}><i></i><span>Cancel</span></button>
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
          this.getShareInviteForm(orgList, orgSearchInput, userList, userSearchInput, chartSelectAllStatusForNew, chartListForNew, chartSearchInputForNew)
        }
      </div>
    );
  }

  giveChartsListContent(renderInsideConstructor = false) {
    const searchInp = this.state.chartTabSearchInput.toLowerCase().trim();
    let chartListToRender;
    const selectedFileList = this.state.constructorTransitionScreenCopyFiles;
    const giveFilteredChartSettingsFromOtherDashboards = () => {
      return this.state.chartsSettingsFromOtherDashboards ? this.state.chartsSettingsFromOtherDashboards.filter(chart => {
        const { name, chart_type, view_type } = chart;
        if ((searchInp === '' || name.toLowerCase().includes(searchInp))
          && (this.state.chartTabChartTypeFilter === 'Widget' ? true : chart_type === this.state.chartTabChartTypeFilter.toLowerCase())
          && (this.state.chartTabSourceFilter === 'Source' ? true : view_type === this.state.chartTabSourceFilter.toLowerCase())) {
          return true;
        }
        return false;
      }) : [];
    };

    // let filteredChartListFromOtherDashboards; // only to be shown when 'renderInsideConstructor' is true
    if (!renderInsideConstructor || (renderInsideConstructor && selectedFileList === 'This File')) {
      chartListToRender = [...this.state.filteredChartsSettings];
    } else if (selectedFileList === 'Other Files') {
      chartListToRender = giveFilteredChartSettingsFromOtherDashboards();
    } else {
      chartListToRender = [...this.state.constructorAllChartSearchFilteredChartsSettings, ...giveFilteredChartSettingsFromOtherDashboards()];
    }


    // To show/hide options for Copy,Edit,Delete chart, check if user has the privilege or not
    const dashboarPrivileges = this.getDashboardDataKeyVal('privileges');
    const canEditDashboard = (this.state.dashboardSettings.id !== null && dashboarPrivileges) ? dashboarPrivileges.includes('EDIT') : false;

    return (
      <div className="chart-list-with-filters">
        <div className="chart-list-filters sticky-div">
          <div className="gl-search">
            <input placeholder="Search" value={this.state.chartTabSearchInput} onChange={(e) => this.handleChartsSettingsSearch(e, !(renderInsideConstructor && selectedFileList !== 'This File'))} />
          </div>

          {renderInsideConstructor &&
            <SpeedSelect
              options={['All Files', 'This File', 'Other Files']}
              selectedOption={selectedFileList}
              onSelect={(val) => this.handleCopyFilesListChange(val)}
              selectLabel='Files'
              dropdownAlignment='right'
              disableSearch
            />
          }
          <SpeedSelect
            options={['Widget', ...this.state.chartTypes.map(c => c[0].toUpperCase() + c.slice(1))]}
            selectedOption={this.state.chartTabChartTypeFilter}
            onSelect={(val) => this.handleChartsSettingsFilters('chart_type', val, !(renderInsideConstructor && selectedFileList !== 'This File'))}
            selectLabel='Chart Type'
            disableSearch
          />
          <SpeedSelect
            options={['Source', ...this.state.data_sources.map(ds => ds.name[0].toUpperCase() + ds.name.slice(1))]}
            selectedOption={this.state.chartTabSourceFilter}
            onSelect={(val) => this.handleChartsSettingsFilters('view_type', val, !(renderInsideConstructor && selectedFileList !== 'This File'))}
            selectLabel='Source'
            disableSearch
            dropdownAlignment='right'
          />
        </div>
        <div className="chart-list" ref={this.chartWidgetsScrollableWrapper}>
          {renderInsideConstructor && this.state.chartFromOtherDashboardLoading && <p>Loading Charts ....</p>}

          {!this.state.chartFromOtherDashboardLoading &&
            chartListToRender.map((chart, i) => {
              // style the widget as selected in case it is selected for Previewing
              const isPreviewingChartForCopy = this.state.previewChartSettings && this.state.previewChartSettings.copiedChartId === chart.id;
              const isClickable = !this.isDashboardInEditMode();
              const isSelectedInViewMode = !this.isDashboardInEditMode() && this.state.selectedChartIds.includes(chart.id);
              const appliedFiltersStr = isSelectedInViewMode ? giveAppliedFiltersInString(chart.filters) : '';

              return (
                <div key={chart.id} id={`chart-widget-${chart.id}`} className={'chart-widget' + (isPreviewingChartForCopy ? ' previewing' : '') + (isSelectedInViewMode ? ' selected' : '') + (isClickable ? ' clickable' : '')}
                  onClick={(e) => isClickable && this.handleChartWidgetClick(e, chart.id)}
                >
                  <div className="widget-list-chart">
                    <div className={'widget-icon ' + chart.chart_type}></div>
                  </div>

                  <div className="chart-widget-info">
                    <div className="chart-details">
                      {renderInsideConstructor && (selectedFileList === 'Other Files' || selectedFileList === 'All Files') &&
                        <div className="info">
                          <div className="label">File : </div>
                          <div className="value">{chart.dashboard_name || this.props.dashboardData.dashboard_name}</div>
                        </div>
                      }
                      <div className="info">
                        <div className="label">Widget : </div>
                        <div className="value title">
                          <label className="chart-number"> {'ID ' + (i + 1)}</label>
                          <p>{chart.name !== '' ? chart.name : chart.metric}</p>
                        </div>
                      </div>
                      <div className="info">
                        <div className="label">Source : </div>
                        <div className="value">{chart.view_type}</div>
                      </div>
                      {appliedFiltersStr &&
                        <div className="info">
                          <div className="label">Filters : </div>
                          <div className="value">{appliedFiltersStr}</div>
                        </div>
                      }
                    </div>

                    {renderInsideConstructor &&
                      <div className="preview-copy-btns">
                        <button className="btn-preview btn btn-small" onClick={() => this.handleChartPreviewBtn(chart)}>Preview</button>
                        <button className="btn-copy btn btn-small" onClick={() => this.handleChartSettingsCopyBtn(chart)}>Copy</button>
                      </div>
                    }
                  </div>

                  <div className="widget-btn-opt">
                    {!renderInsideConstructor &&
                      <div className="hide-toggle checkbox">
                        <input type="checkbox" onChange={() => this.handleShowHideChart(chart.id)} />
                        <label></label>
                      </div>
                    }
                    {this.isDashboardInEditMode() && canEditDashboard && !renderInsideConstructor &&
                      <span className="pop-over-btn" onClick={() => this.setState({ chartOpenedOptionsID: chart.id })}>
                        {this.state.chartOpenedOptionsID === chart.id &&
                          <ClickOutsideListener onOutsideClick={() => this.setState({ chartOpenedOptionsID: null })}>
                            <div className="pop-over-options-wrapper">
                              <ul className="pop-over-options">
                                <li className={this.state.chartOrDashboardSaveInProcess ? 'disabled' : ''} onClick={() => this.handleChartCopyBtn(chart.id)}>Copy</li>
                                <li className={this.state.chartOrDashboardSaveInProcess ? 'disabled' : ''} onClick={() => this.handleChartEditBtn(chart.id)}>Edit</li>
                                <li className={this.state.chartOrDashboardSaveInProcess ? 'disabled' : ''} onClick={() => this.handleChartDeleteBtn(chart.id)}>Delete</li>
                              </ul>
                            </div>
                          </ClickOutsideListener>
                        }
                      </span>
                    }
                  </div>
                </div>
              )
            })
          }

          {!renderInsideConstructor && !this.state.chartsSettings.length &&
            <div className="add-chart-msg">
              Charts Added to this Dashboard will appear here
              {this.isDashboardInEditMode() && <button className="btn btn-medium" onClick={this.handleChartAddBtn}>Add Chart</button>}
            </div>
          }

          {!this.state.chartFromOtherDashboardLoading && renderInsideConstructor && chartListToRender.length === 0 &&
            (
              (selectedFileList === 'This File' && this.state.chartsSettings.length === 0) ||
              (selectedFileList === 'Other Files' && this.state.chartsSettingsFromOtherDashboards && this.state.chartsSettingsFromOtherDashboards.length === 0) ||
              (selectedFileList === 'All Files' && this.state.chartsSettings.length === 0 && this.state.chartsSettingsFromOtherDashboards && this.state.chartsSettingsFromOtherDashboards.length === 0)
            ) &&
            <div className="chart-list-empty">No Chart Available to Copy</div>
          }

          {!this.state.chartFromOtherDashboardLoading && chartListToRender.length === 0 &&
            (
              ((!renderInsideConstructor || (renderInsideConstructor && selectedFileList === 'This File')) && this.state.chartsSettings.length > 0) ||
              (renderInsideConstructor && selectedFileList === 'Other Files' && this.state.chartsSettingsFromOtherDashboards && this.state.chartsSettingsFromOtherDashboards.length > 0) ||
              (renderInsideConstructor && selectedFileList === 'All Files' && (this.state.chartsSettings.length > 0 || (this.state.chartsSettingsFromOtherDashboards && this.state.chartsSettingsFromOtherDashboards.length > 0)))
            ) &&
            <div className="chart-list-empty">No Match Found</div>
          }
        </div>
      </div>
    );
  }



  //get Share Invite Form
  getShareInviteForm(orgList, orgSearchInput, userList, userSearchInput, chartSelectAllStatusForNew, chartListForNew, chartSearchInputForNew) {
    return (
      <div className="share-new-form">
        {this.state.loadingOrganisations && <p>Loading Organisations ....</p>}
        {/* {!this.state.loadingOrganisations && orgList && */}
        {orgList &&
          <>
            <div className="panel-widget make-public-wrapper">
              {this.isDashboardInEditMode() &&
                <div className="make-public mt-10">
                  <div className={'switch-toggle small'}>
                    <div className="label">Make Dashboard Public</div>
                    <div className="switch">
                      <input type="checkbox" checked={(this.state.dashboardSettings.dashboard_other_settings.is_public!==undefined) ? this.state.dashboardSettings.dashboard_other_settings.is_public : false} onChange={this.handleDashboardMakePublic} />
                      <label></label>
                    </div>
                  </div>

                  {(this.state.dashboardSettings.dashboard_other_settings.public_token!==undefined && this.state.dashboardSettings.dashboard_other_settings.public_token!=='') &&
                    <div id="public-url" onClick={() => this.handleCopytoClipboard('public-url', 'Copied public url.')}>
                      {this.currentURL+'/'+this.state.client.id+'/'+this.state.dashboardSettings.dashboard_other_settings.public_token}
                    </div>
                  }
                </div>
              }
            </div>

            <div className="panel-widget orgs-list-container">
              <div className="widget-header">
                <div className="widget-title">Organisation</div>
                <div className="gl-search">
                  <input value={this.state.shareNewOrgSearch} onChange={e => this.setState({ shareNewOrgSearch: e.target.value })} />
                </div>
              </div>
              <div className="widget-content">
                <div className="list orgs-list">
                  {orgList.map((org) => {
                    const selected = this.state.shareNewFormSelectedOrganisation ? this.state.shareNewFormSelectedOrganisation.id === org.id : false;
                    return (
                      <div key={org.id} className="option radio">
                        <input id={`${this.getDashboardID()}-org-${org.id}`} type="radio" name="share-new-org" value={org.id} checked={selected} onChange={() => this.handleShareOrganisationSelect(org)} />
                        <label htmlFor={`${this.getDashboardID()}-org-${org.id}`}>{org.name}</label>
                      </div>
                    )
                  })}
                  {orgSearchInput && !orgList.length && <p className="no-match-msg">No Match Found</p>}
                </div>
              </div>
            </div>

            {this.state.loadingUsers && this.state.userList === null && <p>Loading Users ....</p>}

            {this.state.userList !== null && this.state.shareNewFormSelectedOrganisation &&
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
                      <input id={`${this.getDashboardID()}-user-all`} type="checkbox" name="share-new-user" checked={this.state.shareNewFormSelectedUsers.length === this.state.userList.length} value={'all'} onChange={() => this.handleShareUsersSelect('all')} />
                      <label htmlFor={`${this.getDashboardID()}-user-all`}>
                        <div className="user-avtar"></div>
                        All
                      </label>
                    </div>

                    {userList.map((user) => {
                      const selected = this.state.shareNewFormSelectedUsers.length ? this.state.shareNewFormSelectedUsers.some(u => u.id === user.id) : false;
                      const alreadyShared = this.state.sharedUsers.some(s => s.user.id === user.id);
                      return (
                        <div key={user.id} className={'option checkbox' + (alreadyShared ? ' disabled' : '')}>
                          <input id={`${this.getDashboardID()}-user-${user.id}`} type="checkbox" name="share-new-user" value={user.id} checked={selected} onChange={() => this.handleShareUsersSelect(user)} />
                          <label htmlFor={`${this.getDashboardID()}-user-${user.id}`}>
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
                    {/* {['EDIT', 'COMMENT', 'SHARE', 'DELETE', 'MAKE_PUBLIC'].map(auth => { */}
                    {[{id: 'EDIT', name: 'Edit'}, {id: 'COMMENT', name: 'Comment'}, {id: 'SHARE', name: 'Share'}, {id: 'DELETE', name: 'Delete'}, {id: 'MAKE_PUBLIC', name: 'Make Public'}].map(auth => {
                      const checked = this.state.shareNewFormSelectedAuthorizations.includes(auth.id);
                      // const disabled = auth === 'VIEW';
                      return (
                        <li key={auth.id} className={'auth-item'}>
                          <div className="option checkbox">
                            <input id={`${this.getDashboardID()}-share-${auth.id}`} type="checkbox"
                              checked={checked}
                              // disabled={disabled}
                              onChange={() => this.handleShareNewAuthSelect(auth.id)} />
                            <label htmlFor={`${this.getDashboardID()}-share-${auth.id}`}>{auth['name']}</label>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <span></span>
              </div>
            }

            {this.state.userList !== null &&
              <div className={'panel-widget chart-list-container'}>
                <div className="widget-header">
                  <div className="widget-title">Dashboard
                    {this.state.shareNewChartsIDsSelected.length ? <label>Selected <span>{this.state.shareNewChartsIDsSelected.length}</span></label> : null}
                  </div>
                  <div className="gl-search">
                    <input value={this.state.shareNewChartSearch} onChange={e => this.setState({ shareNewChartSearch: e.target.value })} />
                  </div>
                </div>
                <div className="widget-content">
                  <div className="list chart-list">
                    <div className="option checkbox select-all">
                      <input id={`${this.getDashboardID()}-chart-select-all`} type="checkbox" checked={chartSelectAllStatusForNew} onChange={(e) => this.handleShareNewChartSelectAll(e.target.checked)} />
                      <label htmlFor={`${this.getDashboardID()}-chart-select-all`}>All</label>
                    </div>
                    {chartListForNew.map((chart) => {
                      const selected = this.state.shareNewChartsIDsSelected.length ? this.state.shareNewChartsIDsSelected.includes(chart.id) : false;
                      return (
                        <div key={chart.id} className="option checkbox">
                          <input id={`${this.getDashboardID()}-chart-${chart.id}`} type="checkbox" value={chart.id} checked={selected} onChange={() => this.handleShareNewChartSelect(chart.id)} />
                          <label htmlFor={`${this.getDashboardID()}-chart-${chart.id}`}>{`${chart.id} : ${chart.name}`}</label>
                        </div>
                      )
                    })}
                    {chartSearchInputForNew && !chartListForNew.length && <p className="no-match-msg">No Match Found</p>}
                    {this.state.chartsSettings.length === 0 && <p className="no-match-msg">No chart available for this Dashboard</p>}

                  </div>
                </div>
              </div>
            }
          </>
        }
      </div>
    );
  }

  //make dashboard public
  handleDashboardMakePublic(){
    let newDashboardSettings = {...this.state.dashboardSettings};
    let updatedDashboardOtherSettings = this.giveDashboardOtherSettings();
    updatedDashboardOtherSettings['is_public'] = updatedDashboardOtherSettings['is_public']!==undefined ? !updatedDashboardOtherSettings['is_public'] : true;
    newDashboardSettings['dashboard_other_settings'] = updatedDashboardOtherSettings;
    
    this.setState({
      dashboardSettings: newDashboardSettings
    }, ()=>{
      let chart_ids = '';
      this.state.chartsSettings.forEach((chart,i) => {
        if(i > 0) chart_ids += ',';
        chart_ids += chart.id;
      })
      let payload = {
        "charts": chart_ids,
        "client_id": this.state.client.id
      }

      let API_ACTION =  newDashboardSettings['dashboard_other_settings']['is_public']===false ? 'remove_public' : 'make_public';
      let API_URL = Constants.API_BASE_URL + '/trend_master/'+API_ACTION+'/'+this.getDashboardID();

      APIService.apiRequest(API_URL, payload, false, 'POST', this.controller)
      .then(response => {
        if (response.status === 1) {
          let updatedDashboardSettings = {...this.state.dashboardSettings};
          updatedDashboardSettings['dashboard_other_settings']['public_token'] = updatedDashboardSettings['dashboard_other_settings']['is_public'] ? response.token : '';
          this.setState({
            dashboardSettings: updatedDashboardSettings
          }, ()=>{
            this.editDashboard({dashboard_other_settings: JSON.stringify(updatedDashboardSettings['dashboard_other_settings'])}, '');
          });
          alertService.showToast('success', response.message);

        } else {
          // save the current public url settings to server
          let updatedDashboardSettings1 = {...this.state.dashboardSettings};
          updatedDashboardSettings1['dashboard_other_settings']['public_token'] = '';
          this.setState({
            dashboardSettings: updatedDashboardSettings1
          }, ()=>{
            this.editDashboard({dashboard_other_settings: JSON.stringify(updatedDashboardSettings1['dashboard_other_settings'])}, '');
          });
        }
      })
      .catch(err => {
        console.log('Error: ' + err.message);
        alertService.showToast('error', err.message);
      });
    });
  }


  //copy element text to clipboard
  handleCopytoClipboard(id, msg){
    var copyText = document.getElementById(id);
    navigator.clipboard.writeText(copyText.innerHTML).then(() => {
      alertService.showToast('success', msg);
    });
  }


  getDashboardFormContent() {
    const colors = getChartColors();
    const calendarSelectedRanges = this.state.dashboardSettings.dynamic_time_period && this.state.dashboardSettings.dynamic_time_period.is_dynamic === false ? [this.convertDateRangeInStringToRangeInObject(this.state.dashboardSettings.dynamic_time_period.value)] : null;
    const dashboardFitersObject = this.giveDashboardFilters();

    // Variables for Presentation tab 
    const isAllPresentationFiltersToggleON = (this.state.dashboardSettings.presentationFilters !== undefined && this.state.dashboardSettings.presentationFilters.length === ['period', ...Object.keys(dashboardFitersObject)].length);
    const currentFormTab = this.state.newDashboardFormCurrentTab;
    const expandedFormItemForCurrenFormTab = this.state.newDashboardFormExpandedItemByTab[currentFormTab];

    // Period panel and filter panel are to be shown conditionally in view mode
    const showPeriodPanel = this.isDashboardInEditMode() ? true : (this.state.dashboardSettings.presentationFilters !== undefined ? this.state.dashboardSettings.presentationFilters.includes('period') : false);
    const showFilterPanel = this.isDashboardInEditMode() ? true : (this.state.dashboardSettings.presentationFilters !== undefined ? (this.state.dashboardSettings.presentationFilters.length > 0 && (this.state.dashboardSettings.presentationFilters.length > 1 || this.state.dashboardSettings.presentationFilters[0] !== 'period')) : false);


    // Variables for Data tab - Filter panel
    let dashboardFitersListFirstLevel = Object.keys(dashboardFitersObject).filter(fname => fname.split('_').join(' ').toLocaleLowerCase().includes(this.state.dashboardFilterSearchInput.trim().toLocaleLowerCase()));
    if (!this.isDashboardInEditMode()) { dashboardFitersListFirstLevel = dashboardFitersListFirstLevel.filter(fn => this.state.dashboardSettings.presentationFilters.includes(fn)) }
    const dashboardOpenedFilterName = this.state.dashboardOpenedFilterName;
    let dashboardFitersListSecondLevel = (dashboardFitersObject[dashboardOpenedFilterName] || []).filter(f => f.toLowerCase().includes(this.state.dashboardFilterSearchInput.toLowerCase().trim()));

    const noMatchFound = dashboardOpenedFilterName === '' ? this.state.dashboardFilterSearchInput.trim() !== '' && dashboardFitersListFirstLevel.length === 0 : this.state.dashboardFilterSearchInput.trim() !== '' && dashboardFitersListSecondLevel.length === 0;
    const subOptionSelectedCount = this.state.dashboardSettings.filters[dashboardOpenedFilterName] ? this.state.dashboardSettings.filters[dashboardOpenedFilterName].length : 0;
    const isAllSuboptionsChecked = (subOptionSelectedCount === dashboardFitersListSecondLevel.length && this.state.dashboardSettings.filters[dashboardOpenedFilterName]) ? this.state.dashboardSettings.filters[dashboardOpenedFilterName].every(f => dashboardFitersListSecondLevel.includes(f)) : false;

    const giveDashboardFilterSelectedCount = () => {
      const filtersObj = this.state.dashboardSettings.filters;
      let count = 0;
      for (let x in filtersObj) {
        if (Object.prototype.hasOwnProperty.call(filtersObj, x)) {
          if (filtersObj[x].length > 0) { count++; }
        }
      }
      return count;
    };

    let hasNewLayoutSettings = this.state.dashboardSettings.dashboard_other_settings.layout_setting;
    let defaultLayoutSettingsAuto = this.getDefaultLayoutSettings({ gridColWidth: this.state.gridColWidth, gridRowHeight: this.state.gridRowHeight });

    return (
      <div id="new-dashboard-form-container">
        <div className="new-dashboard-form-wrapper">
          <div className="form-tabs">
            {/* <div className="form-title">{isNewDashboard ? 'File Settings' : 'File Settings'}</div> */}
            <div className="form-tab-list">
              <div className={'form-tab' + (currentFormTab === 'setting' ? ' selected' : '')} onClick={() => this.handleDashboardFormTabSelect('setting')}>File Information</div>
              <div className={'form-tab' + (currentFormTab === 'presentation' ? ' selected' : '')} onClick={() => this.handleDashboardFormTabSelect('presentation')}>View Mode</div>
              <div className={'form-tab' + (currentFormTab === 'data' ? ' selected' : '')} onClick={() => this.handleDashboardFormTabSelect('data')}>Data</div>
              <div className={'form-tab' + (currentFormTab === 'layout' ? ' selected' : '')} onClick={() => this.handleDashboardFormTabSelect('layout')}>Screen Size</div>
            </div>
          </div>

          {!this.props.showDashboardCreatedMsg &&
            <div className="form-content">
              {currentFormTab === 'setting' &&
                <div className="content-setting">
                  {/* Basic infromation */}
                  {this.isDashboardInEditMode() &&
                    <>
                      <div className='info-msg'>
                        <i></i>
                        <span>Files is a collection of one or more charts and components put together to create a data visualisation</span>
                      </div>
                      {/* Dashboard Widget - Name */}
                      <div className="name field-with-label">
                        <label>File Name</label>
                        <input type="text" name="dashboard-name" className="field-control" placeholder=""
                          value={this.state.dashboardSettings.name}
                          onChange={(e) => this.handleDashboardSettingsChange('name', e.target.value)}
                        />
                        {/* <span className="char-count">{`${this.state.dashboardSettings.name.length}/${MAX_NAME_CHAR}`}</span> */}
                      </div>

                      {/* Dashboard Widget - Description */}
                      <div className="description field-with-label">
                        <label>Description</label>
                        <textarea name="dashboard-description" rows="1" className="field-control textarea" placeholder=""
                          value={this.state.dashboardSettings.description}
                          onChange={(e) => this.handleDashboardSettingsChange('description', e.target.value)}
                        ></textarea>
                        <span className="char-count">{`${this.state.dashboardSettings.description.length}/${MAX_DESCRIPTION_CHAR}`}</span>
                      </div>
                    </>
                  }

                  {/* {this.isDashboardInEditMode() &&
                    <div className="is-default mt-10">
                      <div className={'switch-toggle small'}>
                        <div className="label">Set as default</div>
                        <div className="switch">
                          <input type="checkbox" checked={this.state.dashboardSettings.is_default ? true : false} onChange={this.handleDashboardSetDefaultToggle} />
                          <label></label>
                        </div>
                      </div>
                    </div>
                  } */}

                  {/* Tag Input Field */}
                  {/* <div className="tags mt-10">
                    <div className="tag-field field-with-label">
                      <label>Tags</label>
                      <div className="tags-container">
                        {this.state.dashboardSettings.tags.map((t, index) => {
                          return (
                            <div key={index} className="tag-item">
                              <span className="tag-text">{t}</span>
                              <span className="tag-remove" onClick={() => this.handleDashboardTagRemoveBtn(index)}></span>
                            </div>
                          );
                        })}
                        <input className="tag-input" placeholder="Add Tag" onKeyUp={this.handleDashboardTagInputChange} />
                      </div>
                    </div>
                  </div>

                  // Folder Input Field
                  <div className={'folder collapsible-panel' + (expandedFormItemForCurrenFormTab === 'folder' ? ' expanded' : '')}>
                    <div className="collapsible-panel-title" onClick={() => this.toggleNewDashboardFormExpandedItem('folder')}>File Location</div>
                    <div className="collapsible-panel-content">
                      <div className="folder-content">
                        <div className="folder-checkbox checkbox">
                          <input id={`dash-folder-${this.getDashboardID()}`} type="checkbox" checked={this.state.dashboardSettings.folders.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                this.setState({ dashboardSettings: { ...this.state.dashboardSettings, folders: ['F1'] } })
                              } else {
                                this.setState({ dashboardSettings: { ...this.state.dashboardSettings, folders: [] } })
                              }
                            }} />
                          <label htmlFor={`dash-folder-${this.getDashboardID()}`}>Save this file in a Folder</label>
                        </div>
                        <div className="widget-content"
                          style={{ opacity: this.state.dashboardSettings.folders.length > 0 ? 1 : 0.5, pointerEvents: this.state.dashboardSettings.folders.length > 0 ? 'all' : 'none' }}>
                          <div className="add-folder">
                            <div className="gl-search">
                              <input type="text" placeholder="Search or Add new folder" />
                            </div>
                            <button>Add</button>
                          </div>
                          <div className="option checkbox">
                            <input type="checkbox" name="folder" value="folder" />
                            <label>Folder-1</label>
                          </div>
                          <div className="option checkbox">
                            <input type="checkbox" name="folder" value="folder" />
                            <label>Folder-2</label>
                          </div>
                          <div className="option checkbox">
                            <input type="checkbox" name="folder" value="folder" />
                            <label>Folder-3</label>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div> */}
                </div>
              }

              {currentFormTab === 'presentation' &&
                <div className="content-presentation">
                  <div className="info-msg">
                    <i></i>
                    <span>Customise your viewing mode experience.</span>
                  </div>


                  <div className={'presentation-filters'}>
                    <p className="title">Filters</p>
                    <div className="show-all-btn">
                      <Checkbox uniqueHtmlForKey={`d-${this.getDashboardID()}-showall-filters`} label={'Show All'} checked={isAllPresentationFiltersToggleON} onChange={(e) => this.handleDashboardPresentationFiltersShowAll(e.target.checked, ['period', ...Object.keys(dashboardFitersObject)])} />
                    </div>
                    <div className="toggles">
                      {['period', ...Object.keys(dashboardFitersObject)].map(filter => {
                        let displayName = filter === 'os' ? 'OS' : covertUnderscoreToSpaceInString(filter);
                        const selected = this.state.dashboardSettings.presentationFilters.includes(filter);
                        return (
                          <div key={filter} className={'switch-toggle small'}>
                            <div className="label">{displayName}</div>
                            <div className="switch">
                              <input type="checkbox" checked={selected} onChange={() => this.handleDashboardPresentationFiltersToggle(filter)} />
                              <label></label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>


                </div>
              }

              {currentFormTab === 'data' &&
                <div className="content-data">
                  {this.isDashboardInEditMode() &&
                    <div className="info-msg">
                      <i></i>
                      <span>Define dataset that applies globally on this file</span>
                    </div>
                  }

                  {showPeriodPanel &&
                    <div className="period">
                      <div className={'console collapsible-panel' + (expandedFormItemForCurrenFormTab === 'period' ? ' expanded' : '')}>
                        <div className="collapsible-panel-title" onClick={() => this.toggleNewDashboardFormExpandedItem('period')}>Period</div>

                        <div className="collapsible-panel-content">
                          <div className="period-content">
                            <div className={'switch-toggle small period-toggle'}>
                              <div className="label">Dynamic</div>
                              <div className="switch">
                                <input type="checkbox" checked={this.state.dashboardFormShowTimePresets} onChange={() => this.setState({ dashboardFormShowTimePresets: !this.state.dashboardFormShowTimePresets })} />
                                <label></label>
                              </div>
                            </div>

                            {this.state.dashboardFormShowTimePresets &&
                              <>
                                <div className="date-preselect-wrapper">
                                  {DATE_PERIOD_PRESELECTS.map(pre => {
                                    const isSelected = pre === (this.state.dashboardSettings.dynamic_time_period ? this.state.dashboardSettings.dynamic_time_period.value : null);
                                    return <div key={pre} className="preselect-grid"><div className={'preselect' + (isSelected ? ' selected' : '')} onClick={() => this.handleDashboardSettingsChange('dynamic_time_period', pre)}>{pre}</div></div>
                                  })}
                                </div>

                                {this.state.dashboardSettings.dynamic_time_period && this.state.dashboardSettings.dynamic_time_period.value === 'Custom' &&
                                  <div className="custom-period-setting">
                                    <div className="custom-date">
                                      <label>Start Date :</label>
                                      <input type="number" min="0" className="field-control"
                                        value={this.state.dashboardSettings.dynamic_time_period.custom_dates.start_date}
                                        onChange={e => this.handleDashboardCustomPeriodChange('start_date', Number(e.target.value))}
                                      />
                                      <div className="custom-date-dropdown">
                                        <SpeedSelect
                                          options={['days before yesterday', 'weeks before yesterday', 'months before yesterday', 'quarters before yesterday', 'years before yesterday']}
                                          selectedOption={this.state.dashboardSettings.dynamic_time_period.custom_dates.start_date_preselect}
                                          onSelect={val => this.handleDashboardCustomPeriodChange('start_date_preselect', val)}
                                          // selectLabel='Chart Type'
                                          disableSearch
                                        />
                                      </div>
                                    </div>
                                    <div className="custom-date">
                                      <label>End Date :</label>
                                      <input type="number" min="0" className="field-control"
                                        value={this.state.dashboardSettings.dynamic_time_period.custom_dates.end_date}
                                        onChange={e => this.handleDashboardCustomPeriodChange('end_date', Number(e.target.value))}
                                      />
                                      <div className="custom-date-dropdown">
                                        <SpeedSelect
                                          options={['days before today', 'weeks before today', 'months before today', 'quarters before today', 'years before today']}
                                          selectedOption={this.state.dashboardSettings.dynamic_time_period.custom_dates.end_date_preselect}
                                          onSelect={val => this.handleDashboardCustomPeriodChange('end_date_preselect', val)}
                                          // selectLabel='Chart Type'
                                          disableSearch
                                        />
                                      </div>
                                    </div>
                                  </div>
                                }
                              </>
                            }

                            {!this.state.dashboardFormShowTimePresets &&
                              <MultiPeriodPickerPanel
                                periods={calendarSelectedRanges}
                                periodBGColors={[colors[0], colors[1], colors[2], colors[3]]}
                                periodColors={['#000', '#fff', '#000', '#000']}
                                onChange={(dateRange) => this.handleDashboardSettingsChange('dynamic_time_period', dateRange)}
                                singleRangeonly={true}
                                disableFn={(dObj) => dObj > new Date()}
                              />
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  }

                  {showFilterPanel &&
                    <div className="filters">
                      <div className={'filters collapsible-panel' + (expandedFormItemForCurrenFormTab === 'filters' ? ' expanded' : '')}>
                        <div className="collapsible-panel-title" onClick={() => this.toggleNewDashboardFormExpandedItem('filters')}>Filters {giveDashboardFilterSelectedCount() > 0 && <span>{giveDashboardFilterSelectedCount()}</span>}</div>
                        <div className="collapsible-panel-content">
                          <div className="filters-content">
                            <div className="gl-search-wrapper">
                              <div className="gl-search">
                                <input type="text" name="search" className="search" placeholder=""
                                  value={this.state.dashboardFilterSearchInput}
                                  onChange={(e) => this.setState({ dashboardFilterSearchInput: e.target.value })} />
                              </div>
                            </div>

                            <div className="filter-list" >

                              {dashboardOpenedFilterName === '' &&
                                dashboardFitersListFirstLevel.map((fName) => {
                                  const formattedName = fName === 'os' ? 'OS' : covertUnderscoreToSpaceInString(fName);
                                  const selectedCount = this.state.dashboardSettings.filters[fName] ? this.state.dashboardSettings.filters[fName].length : 0;
                                  const optionUniqueId = `dash-${this.getDashboardID()}-filter-lev1-${fName}`;

                                  return (
                                    <div key={fName} id={optionUniqueId} className={'option' + (selectedCount > 0 ? ' selected' : '')}>
                                      <div className="option-inner" onClick={() => this.handleDashboardFirstLevelFilterClick(fName)} >
                                        <label >{formattedName}</label>
                                        {selectedCount > 0 && <span className="option-count" >{selectedCount}</span>}
                                      </div>
                                    </div>
                                  )
                                })

                              }

                              {dashboardOpenedFilterName !== '' &&
                                <>
                                  <div className={'option sub-option-heading'}>
                                    <div className="option-inner">
                                      <span className="back-btn" onClick={() => this.handleDashboardFirstLevelFilterClick('')}></span>
                                      <label > {dashboardOpenedFilterName === 'os' ? 'OS' : covertUnderscoreToSpaceInString(dashboardOpenedFilterName)}</label>
                                    </div>
                                  </div>

                                  <div className={'option checkbox sub-option select-all' + (noMatchFound ? ' disabled' : '')}>
                                    <input id={`dash-${this.getDashboardID()}-filter-lev2-select-all`} type="checkbox" checked={isAllSuboptionsChecked} onChange={() => this.handleDashboardFilterSelectAllClick(dashboardOpenedFilterName, !isAllSuboptionsChecked, dashboardFitersListSecondLevel)} />
                                    <label htmlFor={`dash-${this.getDashboardID()}-filter-lev2-select-all`}>Select All</label>
                                  </div>

                                  {dashboardFitersListSecondLevel.map((subitem) => {
                                    const subOptionUniqueId = `dash-${this.getDashboardID()}-filter-lev2-${subitem}`;
                                    const isChecked = this.state.dashboardSettings.filters[this.state.dashboardOpenedFilterName] ? this.state.dashboardSettings.filters[this.state.dashboardOpenedFilterName].includes(subitem) : false;
                                    return (
                                      <div key={subitem} className={'option checkbox sub-option'}>
                                        <input id={subOptionUniqueId} type="checkbox" checked={isChecked} onChange={() => this.handleDashboardSettingsChange('filters', subitem, this.state.dashboardOpenedFilterName)} />
                                        <label htmlFor={subOptionUniqueId}>{subitem}</label>
                                      </div>
                                    )
                                  })}
                                </>
                              }

                              {noMatchFound &&
                                <p className="no-match-msg">No Match Found</p>
                              }


                              {this.state.sourceDimensionsInProcess && <h4>Loading Filters ...</h4>}
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  }

                </div>
              }

              {currentFormTab === 'layout' &&
                <div className="content-layout">
                  {this.isDashboardInEditMode() &&
                    <>
                      <div className="layout-wrapper">
                        <div className="layout-options-type">
                          <div className='option radio'>
                            <input type="radio" id="rdo-auto" name="layout-type" checked={hasNewLayoutSettings && this.state.dashboardSettings.dashboard_other_settings.layout_setting.type === 'auto'} value="auto" onChange={(e) => this.handleDashboardLayoutSettingChange(e, 'type')} />
                            <label>Auto</label>
                          </div>
                          <div className='option radio'>
                            <input type="radio" id="rdo-preset" name="layout-type" checked={hasNewLayoutSettings && this.state.dashboardSettings.dashboard_other_settings.layout_setting.type === 'preset'} value="preset" onChange={(e) => this.handleDashboardLayoutSettingChange(e, 'type')} />
                            <label>Preset</label>
                          </div>

                          <div className='option radio'>
                            <input type="radio" id="rdo-custom" name="layout-type" checked={hasNewLayoutSettings && this.state.dashboardSettings.dashboard_other_settings.layout_setting.type === 'custom'} value="custom" onChange={(e) => this.handleDashboardLayoutSettingChange(e, 'type')} />
                            <label>Custom</label>
                          </div>
                        </div>

                        {hasNewLayoutSettings && this.state.dashboardSettings.dashboard_other_settings.layout_setting.type === 'preset' &&
                          <>
                            {this.state.dashboardErrObj.error &&
                              <div className="alert error">{this.state.dashboardErrObj.msg}</div>
                            }

                            <div className="device-categories">
                              {Object.keys(Constants.DevicesSizes).map((category) => {
                                return (<div key={category} className={category + ' cat ' + (hasNewLayoutSettings ? this.state.dashboardSettings.dashboard_other_settings.layout_setting.device_category === category ? 'selected' : '' : '')} onClick={(e) => this.handleDashboardLayoutSettingChange(e, 'device_category', category)}><i></i><span>{category}</span></div>);
                              })}
                            </div>

                            {hasNewLayoutSettings && this.state.dashboardSettings.dashboard_other_settings.layout_setting.device_category &&
                              <div className="category-devices">
                                {Constants.DevicesSizes[this.state.dashboardSettings.dashboard_other_settings.layout_setting.device_category].map((device) => {
                                  let formattedSize = device.size.split('*');
                                  return (
                                    <div key={device.name} className="option radio" onClick={(e) => this.handleDashboardLayoutSettingChange(e, 'device', device.name)}>
                                      <input type="radio" name="device" checked={hasNewLayoutSettings && this.state.dashboardSettings.dashboard_other_settings.layout_setting.device === device.name} value={device.name} className="rdo-box" />
                                      <label>
                                        <span className="name">{device.name}</span>
                                        <span>{formattedSize[0] + 'px*' + formattedSize[1] + 'px'}</span>
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>
                            }

                          </>
                        }

                        {hasNewLayoutSettings && (this.state.dashboardSettings.dashboard_other_settings.layout_setting.type === 'auto' || this.state.dashboardSettings.dashboard_other_settings.layout_setting.type === 'custom') &&
                          <>
                            {this.state.dashboardErrObj.error &&
                              <div className="alert error">{this.state.dashboardErrObj.msg}</div>
                            }
                            {(this.state.dashboardSettingsLastSaved.dashboard_other_settings.layout_setting.type === 'auto' && this.state.dashboardSettingsLastSaved.dashboard_other_settings.layout_setting.width !== defaultLayoutSettingsAuto['width']) &&
                              <div className="alert warning">We have detected a change in screen size, do you want to update the screen size to the new values. Saved auto canvas width and height was: {this.state.dashboardSettingsLastSaved.dashboard_other_settings.layout_setting.width}px * {this.state.dashboardSettingsLastSaved.dashboard_other_settings.layout_setting.height}px</div>
                            }

                            <div className='field-wrapper-outer'>
                              <div className="field-wrapper width">
                                <label htmlFor="layout-width">Width (px)</label>
                                {this.state.dashboardSettings.dashboard_other_settings.layout_setting.type === 'auto' &&
                                  <input type="text" disabled={true} name="layout-width" id="layout-width" className="field-control" value={defaultLayoutSettingsAuto['width']} onChange={(e) => this.handleDashboardLayoutSettingChange(e, 'width')} />
                                }

                                {this.state.dashboardSettings.dashboard_other_settings.layout_setting.type === 'custom' &&
                                  <input type="text" name="layout-width" id="layout-width" className="field-control" value={hasNewLayoutSettings ? this.state.dashboardSettings.dashboard_other_settings.layout_setting.width : ''} onChange={(e) => this.handleDashboardLayoutSettingChange(e, 'width')} placeholder="2000" />
                                }
                              </div>

                              <div className="field-wrapper height">
                                <label htmlFor="layout-height">Height (px)</label>
                                {this.state.dashboardSettings.dashboard_other_settings.layout_setting.type === 'auto' &&
                                  <input type="text" disabled={true} name="layout-height" id="layout-height" className="field-control" value={defaultLayoutSettingsAuto['height']} onChange={(e) => this.handleDashboardLayoutSettingChange(e, 'height')} />
                                }
                                {this.state.dashboardSettings.dashboard_other_settings.layout_setting.type === 'custom' &&
                                  <input type="text" name="layout-height" id="layout-height" className="field-control" value={hasNewLayoutSettings ? this.state.dashboardSettings.dashboard_other_settings.layout_setting.height : ''} onChange={(e) => this.handleDashboardLayoutSettingChange(e, 'height')} placeholder="1200" />
                                }
                              </div>
                            </div>
                          </>
                        }
                      </div>
                    </>
                  }
                </div>
              }
            </div>
          }

          {this.props.showDashboardCreatedMsg  &&
            <div className="form-content">
              <div className="new-dashboard-creation-msg-wrapper">
                <div className="dashboard-msg">
                  <div className="info-msg">
                    <i></i>
                    <span>File Created Successfully</span>
                  </div>
                  <p className="dash-name">File Name : <span>{this.props.dashboardData.dashboard_name}</span></p>
                </div>

                <div className="content">
                  {/* <h3>Use Constructor to start creating new widgets</h3> */}
                  <h3>Add widgets to this file using constructor</h3>
                  <button className="btn btn-large btn-constructor" onClick={this.handleDashboardFormOpenConsoleBtn}></button>
                </div>
              </div>
            </div>
          }

          {/* {!isNewDashboard && <div className="wrapper-close-btn" onClick={this.handleDashboardFormCloseBtn}></div>} */}
        </div>

        {/* <div className="form-bottom">
          <div className="save-next-btns">
            <button className="btn btn-large btn-save" disabled={this.state.dashboardSettings.name.trim() === '' || this.state.chartOrDashboardSaveInProcess} onClick={this.handleDashboardSaveBtn}>{isNewDashboard ? 'Create' : 'Save'}</button>
          </div>
        </div> */}
      </div>
    );
  }


  toggleNewDashboardFormExpandedItem(itemName) {
    const currentTabName = this.state.newDashboardFormCurrentTab;
    const currentItemName = this.state.newDashboardFormExpandedItemByTab[currentTabName] || '';
    const newItemName = currentItemName !== itemName ? itemName : '';
    this.setState({ newDashboardFormExpandedItemByTab: { ...this.state.newDashboardFormExpandedItemByTab, [currentTabName]: newItemName } });
  }

  giveConstructorSettingsChangeCount() {
    const currSettings = this.state.newChartSettings;
    const lastSettings = this.state.newChartSettingsLastExecuted;
    let count = 0;
    // Detect if there is some change in each setting of chart or not
    if (currSettings.name !== lastSettings.name) { count += 1; }
    if (currSettings.description !== lastSettings.description) { count += 1; }
    if (currSettings.chart_type !== lastSettings.chart_type) { count += 1; }
    if (currSettings.view_type !== lastSettings.view_type) { count += 1; }
    if (currSettings.segmentation !== lastSettings.segmentation) { count += 1; }
    if (currSettings.showLegend !== lastSettings.showLegend) { count += 1; }
    if (currSettings.x_axis !== lastSettings.x_axis) { count += 1; }
    if (currSettings.metric !== lastSettings.metric) { count += 1; }
    // if (currSettings.format.color.single_color !== lastSettings.format.color.single_color) { count += 1; }

    // Do some extra stuff for detecting change in Date period
    if ((currSettings.dynamic_time_period && lastSettings.dynamic_time_period === null) || (currSettings.dynamic_time_period === null && lastSettings.dynamic_time_period)) {
      // if one is available and other is not, count it as a change
      count += 1;
    } else if (currSettings.dynamic_time_period && lastSettings.dynamic_time_period) {
      //both are available, compare their values now
      if (currSettings.dynamic_time_period.value !== lastSettings.dynamic_time_period.value) {
        count += 1;
      }
      // TODO  : Handle special case of value = 'Custom'
    }


    // Do some extra stuff for detecting change in filters
    if (lastSettings.filters) {
      const filterKeysLast = Object.keys(lastSettings.filters);
      const filterKeysCurr = Object.keys(currSettings.filters);
      //console.log(filterKeysLast , filterKeysCurr)
      const iterateLimitOnFilters = Math.max(filterKeysLast.length, filterKeysCurr.length);
      for (let i = 0; i < iterateLimitOnFilters; i++) {
        // if at same index, either list has missing entry, consider it is a change
        if (!filterKeysLast[i] || !filterKeysCurr[i]) { count++; }
        else {
          // Here, both has some entry for this index, compare those

          // Case A : This filter is applied in both settings, then further compare their values
          // Case B : This filter is applied in only settings, then it can be counted as a change
          if (!filterKeysLast.includes(filterKeysCurr[i])) {
            // Case B
            count++;
          } else {
            // Case A, now compare their values
            const filterValuesLast = lastSettings.filters[filterKeysLast[i]];
            const filterValuesCurr = currSettings.filters[filterKeysCurr[i]];
            // filterValuesLast and filterValuesCurr are arrays of containing filters values
            // If length is different, no need to check the values
            if (filterValuesLast.length !== filterValuesCurr.length) { count++; }
            else {
              // check if contents of both arrays is same or not
              // Since it is possible to have same elements in both arrays but order of elements may differ
              // Hence, we need to find if each element in first array exist in 2nd array or not
              if (filterValuesLast.some(exist => !filterValuesCurr.includes(exist))) { count++; }
            }
          }
        }
      }
    }

    return count;
  }

  giveConstructorBandSettingsChangeCount() {
    // ignore calculation untill analysis data is availble
    if (this.state.constructorAnalysisMetadata === null) return 0;
    let count = 0;
    const currSettings = this.state.newChartBandSettings;
    const lastSettings = this.state.newChartBandSettingsLastExecuted;
    const iterateLimit = Math.max(currSettings.length, lastSettings.length);
    const bandMetadata = this.state.constructorAnalysisMetadata.filter(meta => meta.is_band);

    for (let i = 0; i < iterateLimit; i++) {
      const currBandSett = currSettings[i];
      const lastBandSett = lastSettings[i];
      if (!currBandSett && lastBandSett) {
        count++; continue;
      }
      if (currBandSett && !lastBandSett) {
        const isApplicableBand = this.isBandOrTrendTypeApplicable(bandMetadata.find(b => b.name === currBandSett.band_type));
        if (isApplicableBand) { count++; }
        continue;
      }

      // compare band band_type
      if (currBandSett.band_type !== lastBandSett.band_type) {
        count++; continue;
      }
      // compare band's other parameters
      const meta = bandMetadata.find(b => b.name === currBandSett.band_type);
      if (!meta) { continue; }
      for (let x in meta.parameters) {
        if (currBandSett[x] !== lastBandSett[x]) {
          count++;
        }
      }

    }
    return count;
  }

  giveConstructorFormatSettingsChangeCount() {
    let count = 0;
    const currFormatSettings = { ...this.state.newChartSettings.format };
    const lastFormatSettings = { ...this.state.newChartSettingsLastExecuted.format };

    // detect change in x-axis, y-axis and color settings
    if (currFormatSettings) {
      if (currFormatSettings.xaxis.min !== lastFormatSettings.xaxis.min || currFormatSettings.xaxis.max !== lastFormatSettings.xaxis.max || currFormatSettings.xaxis.tick !== lastFormatSettings.xaxis.tick) { count += 1; }
      if (currFormatSettings.yaxis.min !== lastFormatSettings.yaxis.min || currFormatSettings.yaxis.max !== lastFormatSettings.yaxis.max || currFormatSettings.yaxis.tick !== lastFormatSettings.yaxis.tick) { count += 1; }
      if (currFormatSettings.color.single_color !== lastFormatSettings.color.single_color) { count += 1; }
      if (currFormatSettings.color.second_color !== lastFormatSettings.color.second_color) { count += 1; }
      if (currFormatSettings.color.palette !== lastFormatSettings.color.palette) { count += 1; }
      if (currFormatSettings.show_full_number !== lastFormatSettings.show_full_number) { count += 1; }
      //    console.log(currFormatSettings , lastFormatSettings)
      if (currFormatSettings.showLabel !== lastFormatSettings.showLabel) { count += 1 }
      // detect change in sortings settings
      const sortingIndexesCurr = Object.keys(currFormatSettings.sorting);
      const sortingIndexesLast = Object.keys(lastFormatSettings.sorting);
      const iterateLimit = Math.max(sortingIndexesLast.length, sortingIndexesCurr.length);
      for (let i = 0; i < iterateLimit; i++) {
        const currSett = currFormatSettings.sorting[i];
        const lastSett = lastFormatSettings.sorting[i];
        if (!currSett && lastSett) {
          count++; continue;
        }
        if (currSett && !lastSett) {
          // const curr
          // Count only when all the sub details are filled
          if (currSett.every(cond => cond.condition !== '' && cond.val !== '')) { count++; }
          continue;
        }

        // compare details of both
        for (let j = 0; j < currSett.length; j++) {
          // Just increment count if any one the sub sorting is not available
          if ((currSett[j] && !lastSett[j]) || (!currSett[j] && lastSett[j])) {
            count++;
          } else {
            const conditionChanged = (currSett[j].condition !== '' && lastSett[j].condition === '') || (currSett[j].condition === '' && lastSett[j].condition !== '') || (currSett[j].condition.id !== lastSett[j].condition.id);
            const valueChanged = currSett[j].val !== lastSett[j].val;
            if (conditionChanged || valueChanged) {
              count++;
            }
          }
        }
      }
    }

    return count;
  }

  giveDashboardSettingsChangeCount() {
    const currSettings = this.state.dashboardSettings;
    const lastSettings = this.state.dashboardSettingsLastSaved;
    let count = 0;

    // Detect change in name and description
    if (currSettings.name !== lastSettings.name) { count += 1; }
    if (currSettings.description !== lastSettings.description) { count += 1; }

    // Detect change in tags
    if (currSettings.tags.length !== lastSettings.tags.length) {
      count += 1;
    } else if (currSettings.tags.toString() !== lastSettings.tags.toString()) {
      count += 1;
    }

    // Detect change in lock layout toggle
    if (currSettings.presentationLockOn !== lastSettings.presentationLockOn) { count += 1; }

    // Detect change in Presentation Filters
    if (currSettings.presentationFilters.length !== lastSettings.presentationFilters.length) {
      count += 1;
    } else if (currSettings.presentationFilters.toString() !== lastSettings.presentationFilters.toString()) {
      count += 1;
    }


    // Detect change in Filters and Date period
    count += this.giveDashboardFiltersChangeCount();
    count += this.giveDashboardPeriodChangeCount();

    return count;
  }

  giveDashboardPeriodChangeCount() {
    let count = 0;
    const currSettings = this.state.dashboardSettings;
    const lastSettings = this.state.dashboardSettingsLastSaved;

    // Do some extra stuff for detecting change in Date period
    if ((currSettings.dynamic_time_period && lastSettings.dynamic_time_period === null) || (currSettings.dynamic_time_period === null && lastSettings.dynamic_time_period)) {
      // if one is available and other is not, count it as a change
      count += 1;
    } else if (currSettings.dynamic_time_period && lastSettings.dynamic_time_period) {
      //both are available, compare their values now
      if (currSettings.dynamic_time_period.value !== lastSettings.dynamic_time_period.value) {
        count += 1;
      }
      // TODO  : Handle special case of value = 'Custom'
    }
    return count;
  }

  giveDashboardFiltersChangeCount() {
    let count = 0;
    const currSettings = this.state.dashboardSettings;
    const lastSettings = this.state.dashboardSettingsLastSaved;

    const filterKeysLast = Object.keys(lastSettings.filters);
    const filterKeysCurr = Object.keys(currSettings.filters);
    const iterateLimitOnFilters = Math.max(filterKeysLast.length, filterKeysCurr.length);
    for (let i = 0; i < iterateLimitOnFilters; i++) {
      // if at same index, either list has missing entry, consider it is a change
      if (!filterKeysLast[i] || !filterKeysCurr[i]) { count++; }
      else {
        // Here, both has some entry for this index, compare those

        // Case A : This filter is applied in both settings, then further compare their values
        // Case B : This filter is applied in only one settings, then it can be counted as a change
        if (!filterKeysLast.includes(filterKeysCurr[i])) {
          // Case B
          count++;
        } else {
          // Case A, now compare their values
          const filterValuesLast = lastSettings.filters[filterKeysLast[i]];
          const filterValuesCurr = currSettings.filters[filterKeysCurr[i]];
          // filterValuesLast and filterValuesCurr are arrays of containing filters values
          // If length is different, no need to check the values
          if (filterValuesLast.length !== filterValuesCurr.length) { count++; }
          else {
            // check if contents of both arrays is same or not
            // Since it is possible to have same elements in both arrays but order of elements may differ
            // Hence, we need to find if each element in first array exist in 2nd array or not
            if (filterValuesLast.some(exist => !filterValuesCurr.includes(exist))) { count++; }
          }
        }
      }
    }
    return count;
  }

  // Handle change in Dashboard name,description, time period etc.
  /** filterKey is used only in case of filters */
  handleDashboardSettingsChange(settingName, value, filterKey) {
    const currSettings = this.state.dashboardSettings;

    if (settingName === 'filters') {
      // For filters settings
      const updatedSettings = { ...currSettings, filters: { ...currSettings.filters } };

      // add filterKey if not already present
      updatedSettings['filters'][filterKey] = updatedSettings['filters'][filterKey] || [];
      let filterValues = [...updatedSettings['filters'][filterKey]];
      // calculate the filterValues to be assigned to filterKey
      filterValues = filterValues.includes(value) ? filterValues.filter(v => v !== value) : [...filterValues, value];
      updatedSettings['filters'][filterKey] = filterValues;
      // In case there filterValues is empty, remove the filterKey as well
      if (updatedSettings['filters'][filterKey].length === 0) {
        delete updatedSettings['filters'][filterKey];
      }

      this.setState({
        dashboardSettings: updatedSettings
      }, () => {
        if (this.state.isAutoRunFilters) {
          this.handleDashboardRunBtn();
        }
      });
    } else if (settingName === 'dynamic_time_period') {
      if (this.state.dashboardFormShowTimePresets) {
        const currentVal = this.state.dashboardSettings.dynamic_time_period ? this.state.dashboardSettings.dynamic_time_period.value : null;
        let updatedPeriod = currentVal === value ? null : { is_dynamic: true, value: value };
        if (updatedPeriod && value === 'Custom') { updatedPeriod['custom_dates'] = { start_date: 0, start_date_preselect: 'days before yesterday', end_date: 0, end_date_preselect: 'days before today' } }
        this.setState({
          dashboardSettings: { ...currSettings, 'dynamic_time_period': updatedPeriod }
        }, () => {
          if (this.state.isAutoRunFilters) {
            this.handleDashboardRunBtn();
          }
        });
      } else {
        let updatedSettings = { ...currSettings };
        // construct the value of `dynamic_time_period` from calendar outputs
        const range = value.ranges[0];
        // Assign only when both dates(start and end) have been selected on calendar
        if (range[0] && range[1]) {
          updatedSettings['dynamic_time_period'] = { is_dynamic: false, value: giveDateInMMDDYYY(range[0]) + ' - ' + giveDateInMMDDYYY(range[1]) };
          this.setState({
            dashboardSettings: updatedSettings
          }, () => {
            if (this.state.isAutoRunFilters) {
              this.handleDashboardRunBtn();
            }
          });
        }
      }

    } else {
      // For other settings
      // Apply char count restriction in case of 'description' and 'name'
      if (settingName === 'description') {
        value = value.slice(0, MAX_DESCRIPTION_CHAR);
      }
      if (settingName === 'name') {
        value = value.slice(0, MAX_NAME_CHAR);
      }
      this.setState({
        dashboardSettings: { ...currSettings, [settingName]: value }
      });
    }
  }

  // Handle change in Dashboard's Custom Period settings.
  handleDashboardCustomPeriodChange(customSettingName, value) {
    let dtp = this.state.dashboardSettings.dynamic_time_period;
    dtp = { ...dtp, custom_dates: { ...dtp.custom_dates, [customSettingName]: value } };
    this.setState({ dashboardSettings: { ...this.state.dashboardSettings, dynamic_time_period: dtp } });
  }


  handleDashboardFirstLevelFilterClick(filterName) {
    this.setState({
      dashboardOpenedFilterName: filterName,
      dashboardFilterSearchInput: ''
    });
  }

  handleDashboardFilterSelectAllClick(filterName, checked, subFilters) {
    let updatedFilters;
    if (checked) {
      updatedFilters = { ...this.state.dashboardSettings.filters, [filterName]: subFilters };
    } else {
      updatedFilters = { ...this.state.dashboardSettings.filters };
      delete updatedFilters[filterName];
    }
    this.setState({
      dashboardSettings: { ...this.state.dashboardSettings, filters: updatedFilters }
    })
  }


  handleDashboardTagInputChange(e) {
    const val = e.target.value;
    if (e.key === 'Enter' && val.trim() !== '') {
      // check if tag already present or not
      const presentTags = this.state.dashboardSettings.tags;
      if (presentTags.includes(val)) {
        alertService.showToast('error', 'Tag already added');
        return;
      }
      // add the tag to list and clear the input
      this.setState({
        dashboardSettings: { ...this.state.dashboardSettings, tags: [...this.state.dashboardSettings.tags, val] },
      });
      e.target.value = '';
      return;
    }
  }

  //set/remove dashbaord as default
  handleDashboardSetDefaultToggle() {
    let updatedDashboardSettings = { ...this.state.dashboardSettings };
    updatedDashboardSettings['is_default'] = updatedDashboardSettings['is_default'] === 1 ? 0 : 1;
    this.setState({
      dashboardSettings: updatedDashboardSettings
    });
  }

  handleDashboardTagRemoveBtn(tagIndex) {
    const currentTags = this.state.dashboardSettings.tags;
    const updatedTags = currentTags.filter((t, i) => i !== tagIndex);
    this.setState({ dashboardSettings: { ...this.state.dashboardSettings, tags: updatedTags } });
  }


  handleDashboardPresentationFiltersToggle(filterName) {
    const currentFilters = this.state.dashboardSettings.presentationFilters;
    const updatedFilters = currentFilters.includes(filterName) ? currentFilters.filter(t => t !== filterName) : [...currentFilters, filterName];
    this.setState({ dashboardSettings: { ...this.state.dashboardSettings, presentationFilters: updatedFilters } });
  }


  handleDashboardPresentationFiltersShowAll(checked, allFilterList) {
    const updatedFilters = checked ? allFilterList : [];
    this.setState({ dashboardSettings: { ...this.state.dashboardSettings, presentationFilters: updatedFilters } });
  }
  //On new charts settings change
  onNewConstructorSettingsChange(field, val, filterkey = null) {
    let updatedSettings = { ...this.state.newChartSettings };
    if (field === 'filters') {
      updatedSettings = { ...updatedSettings, filters: { ...updatedSettings.filters } };
      updatedSettings['filters'][filterkey] = updatedSettings['filters'][filterkey] || [];
      let filterExistingValues = [...updatedSettings['filters'][filterkey]];
      if (filterExistingValues.includes(val)) {
        filterExistingValues = filterExistingValues.filter(v => v !== val);
      } else {
        filterExistingValues.push(val); //add to values array
      }
      if (filterExistingValues.length) {
        updatedSettings['filters'][filterkey] = filterExistingValues;
      } else {
        delete updatedSettings['filters'][filterkey];
      }


    } else if (field === 'dynamic_time_period') {
      // console.log('calendarSelectedRanges', this.state.calendarSelectedRanges);

      if (this.state.chartFormShowTimePresets) {
        const currentVal = this.state.newChartSettings.dynamic_time_period ? this.state.newChartSettings.dynamic_time_period.value : null;
        const updatedPeriod = currentVal === val ? null : { is_dynamic: true, value: val };
        if (updatedPeriod && val === 'Custom') { updatedPeriod['custom_dates'] = { start_date: 0, start_date_preselect: 'days before yesterday', end_date: 0, end_date_preselect: 'days before today' } }
        updatedSettings[field] = updatedPeriod;
      } else {
        // construct the value of `dynamic_time_period` from calendar outputs
        // NOTE : Since we only want to set our state when both dates are selected by user. Hence, only update the state when both dates are available, otherwise calendar will behave unexpectedly.
        const range = val.ranges[0];
        // Assign only when both dates(start and end) have been selected on calendar
        if (range[0] && range[1]) {
          updatedSettings[field] = { is_dynamic: false, value: giveDateInMMDDYYY(range[0]) + ' - ' + giveDateInMMDDYYY(range[1]) };
          this.setState({
            newChartSettings: updatedSettings,
          });
        } else { return; }
      }
    } else if (field === 'segmentation') {
      const currentVal = this.state.newChartSettings.segmentation;
      updatedSettings[field] = currentVal === val ? '' : val;

    } else if (field === 'showLegend') {
      // updatedSettings[field] = this.state.newChartSettings.showLegend === 1 ? 0 : 1;

    } else if (field === 'showLabel') {
      updatedSettings[field] = this.state.newChartSettings.showLabel === true ? false : true;
    } else if (field === 'dimension') {
      // field = 'dimensions' is basically a different name for field='x_axis' when chart_type='flat_table'
      if (updatedSettings['x_axis'].includes(val)) {
        updatedSettings['x_axis'] = updatedSettings['x_axis'].split(',').filter(v => v !== val).join(',');
      } else {
        updatedSettings['x_axis'] = updatedSettings['x_axis'] === '' ? `${val}` : updatedSettings['x_axis'] + `,${val}`;

      }
    }
    // else if(field === 'x_axis') {
    //   updatedSettings['x_axis'] = val;
    //   console.log(updatedSettings['x_axis'])
    // }
    else if (field === 'value') {
      // field = 'value' is basically a different name for field='metric' when chart_type='flat_table'
      if (updatedSettings['metric'].includes(val)) {
        updatedSettings['metric'] = updatedSettings['metric'].split(',').filter(v => v !== val).join(',');
      } else {
        updatedSettings['metric'] = updatedSettings['metric'] === '' ? `${val}` : updatedSettings['metric'] + `,${val}`;
      }

    } else {
      // Apply char count restriction in case of 'description'
      if (field === 'description') {
        val = val.slice(0, MAX_DESCRIPTION_CHAR);
      }

      updatedSettings[field] = val;
      
      // Some Special checks below : 
      // 1. For source change, reset the filters,x_axis(If not compatible with new source) and metric(If not compatible with new source)
      if (field === 'view_type') {
        updatedSettings['filters'] = {};
        const metricOptionsForNewSource = this.state.allDataSourcesDimensionsMetrics[val].filter(x => x.is_dimension === 0);
        // Reset 'metric' only if current value is not available in new list
        if (!metricOptionsForNewSource.some(op => op.id === updatedSettings['metric'])) {
          updatedSettings['metric'] = '';
        }
        const xAxisOptionsForNewSource = this.state.allDataSourcesDimensionsMetrics[val].filter(x => updatedSettings['chart_type'] === 'scatter' ? true : x.is_dimension === 1);
        // Reset 'x_axis' only if current value is not available in new list
        if (!xAxisOptionsForNewSource.some(op => op.id === updatedSettings['x_axis'])) {
          updatedSettings['x_axis'] = '';
        }
        const segmentOptionsForNewSource = this.state.allDataSourcesDimensionsMetrics[val].filter(x => x.type === 'string');
        // Reset 'segmentation' only if current value is not available in new list
        if (!segmentOptionsForNewSource.some(op => op.id === updatedSettings['segmentation'])) {
          updatedSettings['segmentation'] = '';
        }
      }

      // 2. For Chart type change
      if (field === 'chart_type') {
        // Reset the xAxis,metric and segmentation when 
        // 1. New chart type is FlatTable or Scorcard OR
        // 2. Previous chart type was not one of ('line', 'bar', 'scatter') and new is one of those. 
        const currentVal = this.state.newChartSettings.chart_type;
        if (val === 'flat_table' || val === 'scorecard' || (!['line', 'bar', 'scatter'].includes(currentVal) && ['line', 'bar', 'scatter'].includes(val))) {
          updatedSettings['x_axis'] = '';
          updatedSettings['metric'] = '';
          updatedSettings['segmentation'] = '';
          updatedSettings['filters'] = {};
        }
        updatedSettings['x_axis'] = '';
        updatedSettings['y_axis'] = '';
        updatedSettings['metric'] = '';
        updatedSettings['segmentation'] = '';
        updatedSettings['filters'] = {};

        // If chart type is same as of original settings(when it was last saved), set all the values from that state
        if (val === this.state.newChartSettingsLastExecuted.chart_type) {
          updatedSettings['view_type'] = this.state.newChartSettingsLastExecuted.view_type;
          updatedSettings['x_axis'] = this.state.newChartSettingsLastExecuted.x_axis;
          updatedSettings['metric'] = this.state.newChartSettingsLastExecuted.metric;
          updatedSettings['segmentation'] = this.state.newChartSettingsLastExecuted.segmentation;
          updatedSettings['filters'] = this.state.newChartSettingsLastExecuted.filters;
        }
      }
    }

    let stateObj = {
      newChartSettings: updatedSettings,
    };
    if (field === 'name') {
      stateObj['editableChartTitle'] = true;
    }
    if (field === 'chart_type') { //reset sub tab to dataset
      stateObj['constructorSettingsCurrentSubtab'] = 'dataset';
    }
    this.setState(stateObj);
  }

  // Handle change in new chart's Custom Period settings.
  handleNewConstructorCustomPeriodChange(customSettingName, value) {
    let dtp = this.state.newChartSettings.dynamic_time_period;
    dtp = { ...dtp, custom_dates: { ...dtp.custom_dates, [customSettingName]: value } };
    this.setState({ newChartSettings: { ...this.state.newChartSettings, dynamic_time_period: dtp } });
  }

  handleNewConstructorFilterSelectAllClick(filterName, checked, subFilters) {
    let updatedFilters;
    if (checked) {
      updatedFilters = { ...this.state.newChartSettings.filters, [filterName]: subFilters };
    } else {
      updatedFilters = { ...this.state.newChartSettings.filters };
      delete updatedFilters[filterName];
    }
    this.setState({
      newChartSettings: { ...this.state.newChartSettings, filters: updatedFilters }
    })
  }

  handleConstructorTransitionSubtabChange(subtab) {
    this.setState({
      constructorTransitionScreenCurrentSubtab: subtab,
      previewChartSettings: subtab === 'create' ? null : this.state.previewChartSettings
    });
    if (subtab === 'copy' && !this.state.chartsSettingsFromOtherDashboards && !this.state.chartFromOtherDashboardLoading) {
      // trigger the API to fetch the chartsSettingsFromOtherDashboards 
      this.setState({ chartFromOtherDashboardLoading: true });
      APIService.apiRequest(Constants.API_BASE_URL + `/trend_master/get_chart_list/sellside`, {}, false, 'GET', this.controller)
        .then(response => {
          if (response.status === 1) {
            this.setState({
              chartsSettingsFromOtherDashboards: response.data.filter(c => c.dashboard_id !== this.getDashboardID()),
              chartFromOtherDashboardLoading: false
            });
          }
        })
        .catch(err => {
          this.setState({ chartFromOtherDashboardLoading: false })
          console.log('error', err);
        });
    }
  }

  handleConstructorSubtabChange(subtab) {
    this.setState({ constructorSelectedSubtab: subtab }, () => {
      // if (subtab === 'third' && this.state.constructorAnalysisMetadata === null) {
      if (subtab === 'fourth' && !this.state.loadingConstructorAnalyisMetadata && this.state.constructorAnalysisMetadata === null) {
        this.fetchConstructorAnalysisMetadata();
      }
    });
  }

  fetchConstructorAnalysisMetadata() {
    this.setState({ loadingConstructorAnalyisMetadata: true });
    APIService.apiRequest(Constants.API_BASE_URL + '/trend_master/get_analyze_metadata', {}, false, 'GET', this.controller)
      .then(response => {
        if (response.status === 1) {
          this.setState({
            constructorAnalysisMetadata: response.data,
            newChartBandSettings: this.state.newChartBandSettings.length ? this.state.newChartBandSettings : [this.giveChartBandInitSettings(response.data)],
            newChartBandSettingsLastExecuted: this.state.newChartBandSettings.length ? this.state.newChartBandSettings : [this.giveChartBandInitSettings(response.data)],
            loadingConstructorAnalyisMetadata: false
          });
        } else {
          this.setState({ loadingConstructorAnalyisMetadata: false });
        }
      })
      .catch(err => {
        this.setState({ loadingConstructorAnalyisMetadata: false })
        console.log('Error occured in Loading  Analysis metadata : ' + err.message);
      });
  }

  giveChartBandInitSettings() {
    let initSett = {};
    initSett['band_type'] = 'Select';
    initSett['alertChannel'] = '';
    // add other keys and their init values
    initSett = { ...initSett, ...this.giveBandParamInitSettings(null) };
    return initSett;
  }

  giveBandParamInitSettings(bandMetadata) {
    if (!bandMetadata) { return {}; }
    let params = {};
    Object.keys(bandMetadata.parameters).forEach(param => {
      // const minValOfParam = bandMetadata.parameters[param].split('-').map(x => +x)[0];
      params[param] = 0;
      // params[param] = minValOfParam;
    });
    return params;
  }

  giveBandSettingsFromChartPlottingParams(chartSett, isEditSelection = false) {
    if (chartSett.chart_other_settings) {
      let params = JSON.parse(chartSett.chart_other_settings);
      let result = [];

      // band_settings exists return the existing else return initial
      if (params.band_settings !== undefined && params.band_settings.length > 0 && Object.keys(params.band_settings[0]).length > 0) {
        result = params.band_settings;
      } else {
        result = (isEditSelection ? [this.giveChartBandInitSettings()] : []);
      }
      return result;
    }
    return isEditSelection ? [this.giveChartBandInitSettings()] : [];
  }

  handleNewConstructorBandAddBtn() {
    let updatedNewChartBandSettings = (this.state.newChartBandSettings && this.state.newChartBandSettings.length > 0) ? [...this.state.newChartBandSettings, this.giveChartBandInitSettings()] : [this.giveChartBandInitSettings()];
    this.setState({ newChartBandSettings: updatedNewChartBandSettings });
  }

  handleNewConstructorBandRemoveBtn(index) {
    this.setState({ newChartBandSettings: this.state.newChartBandSettings.filter((sett, i) => i !== index) });
  }

  giveChartTrendInitSettings(analysisMetadata) {
    let initSett = {};
    const firstBandMetadata = analysisMetadata.find(meta => meta.is_trend);
    initSett['band_type'] = firstBandMetadata.name;
    // initSett['alertChannel'] = '';
    // // add other keys and their init values
    // initSett = { ...initSett, ...this.giveBandParamInitSettings(firstBandMetadata) };
    return initSett;
  }

  handleNewConstructorTrendAddBtn() {
    this.setState({ newChartTrendSettings: [...this.state.newChartTrendSettings, this.giveChartTrendInitSettings(this.state.constructorAnalysisMetadata)] });
  }

  handleNewConstructorTrendRemoveBtn(index) {
    this.setState({ newChartTrendSettings: this.state.newChartTrendSettings.filter((sett, i) => i !== index) });
  }


  handleNewConstructorBandSettingChange(index, settingName, value) {
    this.setState({
      newChartBandSettings: this.state.newChartBandSettings.map((sett, i) => {
        if (i !== index) return sett;
        if (settingName !== 'band_type') {
          return { ...sett, [settingName]: value };
        }
        const bandMetadataOfSelectedType = this.state.constructorAnalysisMetadata.find(meta => meta.is_band && meta.name === value);
        return { ...sett, [settingName]: value, ...this.giveBandParamInitSettings(bandMetadataOfSelectedType) }
      })
    });
  }

  handleNewConstructorTrendSettingChange(index, settingName, value) {
    this.setState({
      newChartTrendSettings: this.state.newChartTrendSettings.map((sett, i) => {

        if (i !== index) return sett;
        // if (settingName !== 'type') {
        return { ...sett, [settingName]: value };
        // }
        // const bandMetadataOfSelectedType = this.state.constructorAnalysisMetadata.find(meta => meta.is_band && meta.name === value);
        // return { ...sett, [settingName]: value, ...this.giveBandParamInitSettings(bandMetadataOfSelectedType) }
      })
    });
  }

  isBandOrTrendTypeApplicable(metadataForType) {
    if (!metadataForType) { return false; }
    return Object.keys(metadataForType.limitations).every(key => {
      if (Array.isArray(metadataForType.limitations[key])) {
        return metadataForType.limitations[key].includes(this.state.newChartSettings[key]);
      }
      return this.state.newChartSettings[key] === metadataForType.limitations[key]
    });
  }


  convertDateRangeInStringToRangeInObject(dateRangeStr) {
    const [startDateStr, endDateStr] = dateRangeStr.split(' - ');
    const d1 = startDateStr.split('/').map(x => +x); // d1 and d2 will be in form [mm,dd,yyyyÎ]
    const d2 = endDateStr.split('/').map(x => +x);
    return [new Date(d1[2], d1[0] - 1, d1[1]), new Date(d2[2], d2[0] - 1, d2[1])];
  }

  givePreviousDateRangeOfSameDuration(dateRangeObjects) {
    const [start, end] = [...dateRangeObjects];
    const daysCount = giveDaysCountInRange(start, end);
    const startPrevRange = givePrevNthDate(start, daysCount);
    const endPrevRange = givePrevNthDate(start, 1);
    return giveDateInMMDDYYY(startPrevRange) + ' - ' + giveDateInMMDDYYY(endPrevRange);
  }



  handleDiscardScreenSaveBtn() {
    this.handleChartCreateOrUpdate()
      .then(() => {
        this.setState({ showNewSettingsDiscardMessage: false });
        if (this.callbackAfterDiscardScreen) {
          this.callbackAfterDiscardScreen();
          this.callbackAfterDiscardScreen = null;
        }
      })
      .catch(err => {
        if (err === 'INVALID_FORM') {
          // just close the discard screen so that user can see the Constructor form and hence make the form valid
          this.handleDiscardScreenCloseBtn();
        }
        if (err === 'API_FAIL') {
          // Fetch chart data api failed due to some reason
          // For now, ignore this  and do the needed task(callbackAfterDiscardScreen)
          this.setState({ showNewSettingsDiscardMessage: false });
          if (this.callbackAfterDiscardScreen) {
            this.callbackAfterDiscardScreen();
            this.callbackAfterDiscardScreen = null;
          }
        }
      });
  }

  handleDiscardScreenDiscardBtn() {
    this.discardExistingNewChartSettings();
    this.setState({ showNewSettingsDiscardMessage: false });
    if (this.callbackAfterDiscardScreen) {
      this.callbackAfterDiscardScreen();
      this.callbackAfterDiscardScreen = null;
    }
  }

  handleDiscardScreenCloseBtn() {
    this.setState({ showNewSettingsDiscardMessage: false });
    this.callbackAfterDiscardScreen = null;
  }

  //Discard new chart settings form changes
  discardExistingNewChartSettings() {
    this.setState({
      newChartSettings: this.getNewChartInitialSettings(),
      newChartSettingsLastExecuted: { ...this.getNewChartInitialSettings() },
      newChartBandSettings: [this.giveChartBandInitSettings()],
      newChartBandSettingsLastExecuted: [this.giveChartBandInitSettings()],
    });
  }


  handleCopyFilesListChange(tab) {
    this.setState({ constructorTransitionScreenCopyFiles: tab });
    if (tab === 'This File' && this.state.chartTabChartTypeFilter !== 'Widget') {
      this.handleChartsSettingsFilters('chart_type', this.state.chartTabChartTypeFilter);
    } else if (tab === 'This File' && this.state.chartTabSourceFilter !== 'Source') {
      this.handleChartsSettingsFilters('view_type', this.state.chartTabSourceFilter);
    } else if (tab === 'This File' && this.state.chartTabSearchInput !== '') {
      let obj = {};
      obj['filteredChartsSettings'] = this.giveFilteredChartsSettings(this.state.chartTabSearchInput, 'Widget', 'Source')
      this.setState(obj, () => {
        setTimeout(() => {
          this.state.filteredChartsSettings.forEach(cs => {
            this.renderChart(cs);
          });
        });
      });
    }
    if (tab !== 'This File') {
      let obj = {};
      obj['filteredChartsSettings'] = this.giveFilteredChartsSettings('', 'Widget', 'Source')
      this.setState(obj, () => {
        setTimeout(() => {
          this.state.filteredChartsSettings.forEach(cs => {
            this.renderChart(cs);
          });
        });
      });
      this.handleChartsSettingsFilters('chart_type', this.state.chartTabChartTypeFilter, false);
      this.handleChartsSettingsFilters('view_type', this.state.chartTabSourceFilter, false);
    }
  }

  handleChartSettingsCopyBtn(chartSett) {
    if (!chartSett['dynamic_time_period'] && !this.state.dashboardSettings['dynamic_time_period']) {
      alertService.showToast('error', 'Please select a Period at Dashboard level');
      return;
    }

    this.setState({
      previewChartSettings: null,
      renderCopiedChartOnDrop: true,
      // also remove any filter/search applied while performing search on chart list
      chartTabChartTypeFilter: 'Widget',
      chartTabSourceFilter: 'Source',
      chartTabSearchInput: '',
      filteredChartsSettings: this.giveFilteredChartsSettings('', 'Widget', 'Source')
    });
    this.instantiateNewChartWithGivenSettings({ ...this.getNewChartInitialSettings(), ...chartSett });
  }

  handleChartPreviewBtn(chartSett) {
    if (!chartSett['dynamic_time_period'] && !this.state.dashboardSettings['dynamic_time_period']) {
      alertService.showToast('error', 'Please select a Period at Dashboard level');
      return;
    }

    const payload = this.getFetchChartDataPayload(chartSett);
    this.setState({
      previewChartSettings: { ...this.getNewChartInitialSettings(), ...chartSett, id: PREVIEW_CHART_ID, copiedChartId: chartSett.id },
      chartsLoadingsObj: { ...this.state.chartsLoadingsObj, [PREVIEW_CHART_ID]: true }
    });

    this.fetchChartData(payload)
      .then((chartData) => {
        const { formattedData, formattedNetData, segmentationData } = this.giveClientSideChartData(chartData, chartSett);

        this.setState({
          chartsLoadingsObj: { ...this.state.chartsLoadingsObj, [PREVIEW_CHART_ID]: false },
          // insert the chart data for preview in the same state variables used to store the chart data for all other charts to keep the logic consistent
          chartsFormattedData: { ...this.state.chartsFormattedData, [PREVIEW_CHART_ID]: formattedData },
          chartsFormattedNetData: { ...this.state.chartsFormattedNetData, [PREVIEW_CHART_ID]: formattedNetData },
          chartsSegmentation: { ...this.state.chartsSegmentation, [PREVIEW_CHART_ID]: segmentationData },
          // no need to update the layout state variables 
        }, () => {
          setTimeout(() => {
            this.renderChart(this.state.previewChartSettings);
          }, 200);
        });
      })
      .catch(err => {
        this.setState({
          chartsLoadingsObj: { ...this.state.chartsLoadingsObj, [PREVIEW_CHART_ID]: false },
        });
        console.log(err);
      });
  }


  /********************************
  * Charts Functions *
  **********************************/

  //Chart fullscreen
  handleChartFullScreen(e, chartIndex, unique_key) {
    let chartDom = document.getElementById('chart-' + unique_key);
    let newChartIndexDetails = null;

    // if chart fullscreen is clicked store current chart index, prev width, prev height
    if (!this.state.fullScreenChartIndexDetails) {
      var transFormStyle = window.getComputedStyle(chartDom);
      var metrix = new DOMMatrixReadOnly(transFormStyle.transform);

      newChartIndexDetails = { 'chartIndex': chartIndex, 'width': chartDom.offsetWidth, 'height': chartDom.offsetHeight, 'transform': 'translate(' + metrix.m41 + 'px,' + metrix.m42 + 'px)' };
      chartDom.style["position"] = 'fixed';
      chartDom.style["top"] = '65px';
      chartDom.style["left"] = '5px';
      chartDom.style["bottom"] = '0px';
      chartDom.style["right"] = '0px';
      chartDom.style["width"] = 'calc(100% - 40px)';
      chartDom.style["height"] = 'calc(100vh - 70px)';
      chartDom.style["transform"] = 'translate(10px, 0)';
      chartDom.style["z-index"] = 99999;

    } else { // else set fullScreenChartIndexDetails as null
      chartDom.style["position"] = 'absolute';
      chartDom.style["top"] = 'auto';
      chartDom.style["left"] = 'auto';
      chartDom.style["bottom"] = 'auto';
      chartDom.style["right"] = 'auto';
      chartDom.style["width"] = this.state.fullScreenChartIndexDetails.width + 'px';
      chartDom.style["height"] = this.state.fullScreenChartIndexDetails.height + 'px';
      chartDom.style["transform"] = this.state.fullScreenChartIndexDetails.transform;
      chartDom.style["z-index"] = 1;
      newChartIndexDetails = null; //reset fullScreenChartIndexDetails when widget resized to normal
    }

    this.setState({ fullScreenChartIndexDetails: newChartIndexDetails }, () => {
      this.renderChart(this.state.chartsSettings[chartIndex]);
    });
  }

  //Chart legend dropdown toggle
  handleChartLegendDrodDownToggle(e, id) {
    document.querySelector('#legends-main-wrapper-' + id).classList.add('visible');
  }

  //Chart Meta Info Mouse Hover
  handleChartMetaDrodDownToggle(e, id) {
    let updatedShowMetaDropDownToggle = { ...this.state.showMetaDropDownToggle };
    if (updatedShowMetaDropDownToggle[id]) {
      updatedShowMetaDropDownToggle[id] = !updatedShowMetaDropDownToggle[id];
    } else {
      updatedShowMetaDropDownToggle = { [id]: true };
    }
    this.setState({ showMetaDropDownToggle: updatedShowMetaDropDownToggle });
    if(!this.props.showConsolePanel) {
      this.props.onPanelToggle(this.props.dashboardData.id, 'showConsolePanel');
    }
  }

  //display widget meta information in console panel
  handleWidgetMetaInfo(e, id, chart, chartDateRangeToShow, xaxis_val, yaxis_val, chartNetData, minVal, maxVal, currencySymbol, percentSymbol){
    e.stopPropagation();

    let selectedWidgetInfo = {
      id: id,
      name: chart.name,
      type: chart.chart_type,
      period: chartDateRangeToShow,
      xaxis_val: xaxis_val,
      yaxis_val: yaxis_val,
      chartNetData: chartNetData,
      minVal: minVal,
      maxVal: maxVal,
      currencySymbol: currencySymbol,
      percentSymbol: percentSymbol,
      filters: Object.keys(chart.filters).length ? chart.filters : this.state.dashboardSettingsLastSaved.filters
    };

    this.handleChartSelection(id, 'metainfo', selectedWidgetInfo);
  }

  //display widget legend details in console panel
  handleWidgetLegendDetails(e, id, chart){
    e.stopPropagation();
    this.setState({
      showWidgetInfo: false,
      showWidgetLegendDetails: false
    }, ()=>{
      this.handleChartSelection(id, 'legendinfo', chart);
    })
  }



//show segment aggreagted details in table format
showAggregatedSegmentsDetails (chart) {
  var parsedDateString = d3.timeFormat("%d %b %Y");
  let chartSegmentation = (chart.segmentation && chart.segmentation !== '' && chart.segmentation !== ' ') ? chart.segmentation : '';
  let isSegmented = (chartSegmentation !== 'all' && chartSegmentation !== '' && chartSegmentation !== ' ');
  let isTableRequriedForNonSegmentedChart = chart.chart_type === 'pie' || chart.chart_type === 'donut';
  let color = '';
  let chartFormat = chart.format//JSON.parse(chart.chart_format_parameters);
  let chartData = this.state.chartsFormattedData[chart.id];
  let col_widths = [70, 30];

  if (this.state.legendOpen !== chart.id) {
    this.setState({ legendOpen: chart.id });
  }

  //Show information of segmentated chart lines
  if (chart.chart_type === 'spider') {
    let yAxisKeys = chart.metric.split(',')
    let chartNetDetails = chartData;

    if (chartFormat.color && chartFormat.color.palette) {
      color = d3.scaleOrdinal(ColorPalettes[chartFormat.color.palette]);
      let segmented_keys = [];
      if ((chartSegmentation !== 'all' && chartSegmentation !== '')) {
        segmented_keys = [...new Set(chartNetDetails.map(item => item[chartSegmentation]))];
        color.domain(segmented_keys);
      }
    }

    const LegendTable = yAxisKeys.map((key) => {
      var col_header1 = chart.x_axis;

      let chartDimensionMetricsList = this.state.allDataSourcesDimensionsMetrics[chart.view_type];
      let chartCurrencySymbol = '';
      let chartPercentSymbol = '';
      if (chartDimensionMetricsList) {
        let metricIndex = chartDimensionMetricsList.findIndex((e) => e.id === key);
        if (metricIndex > -1) {
          if (chartDimensionMetricsList[metricIndex]['type'] === 'currency') { chartCurrencySymbol = '$'; }
          if (chartDimensionMetricsList[metricIndex]['type'] === 'percent') { chartPercentSymbol = '%'; }
        }
      }

      return (
        <table key={key} className="tooltip-table">
          <thead>
            <tr>
              <th width={col_widths[0]+'%'}><span className="th-inner-wrapper">{col_header1}<span className="sepeartor"></span> Total</span><span className="bg"></span></th>
              <th width={col_widths[1]+'%'}>{key}<span className="bg"></span></th>
            </tr>
          </thead>

          <tbody>
            {
              chartNetDetails.map((dn, i) => {
                const col_0_color = color(chart.x_axis === 'date' ? parsedDateString(dn[chart.x_axis]) : dn[chart.x_axis]);
                const col_1_val = chart.x_axis === 'date' ? parsedDateString(dn[chart.x_axis]) : dn[chart.x_axis];
                const col_2_val = chartCurrencySymbol + numberWithCommas(dn[key]) + chartPercentSymbol;
  
                //For Period Comparison Only
                return (
                  <tr key={i}>
                    <td width={col_widths[0]+'%'}>
                      <span className="td-inner-wrapper">
                        <span className="color" style={{backgroundColor: col_0_color}}></span>
                        <span className="key">{col_1_val}</span>
                      </span>
                    </td>
                    <td width={col_widths[1]}><span className="val">{col_2_val}</span></td>
                  </tr>
                )
              })
            }
          </tbody>
        </table>
      )
    });
    return LegendTable;

  } else {
    if (isSegmented || isTableRequriedForNonSegmentedChart) {
      let chartSegmentationCopy = chartSegmentation; //for period comparison
  
      //Display Cross Hair Values
      var col_header1 = (isTableRequriedForNonSegmentedChart ? chart.x_axis : chartSegmentationCopy.replace("_", " "));
      
      var chartNetDetails = (this.state.chartsFormattedNetData[chart.id][chart.metric]) ? this.state.chartsFormattedNetData[chart.id][chart.metric]['segmented_net_details'] : [];
      if (isTableRequriedForNonSegmentedChart) {
        chartNetDetails = chartData;
      }

      if (chartFormat.color && chartFormat.color.palette) {
        color = d3.scaleOrdinal(ColorPalettes[chartFormat.color.palette]);
        let segmented_keys = [];
        if ((chartSegmentation !== 'all' && chartSegmentation !== '')) {
          segmented_keys = [...new Set(chartNetDetails.map(item => item[chartSegmentation]))];
          color.domain(segmented_keys);
        }
      }
  
      let chartDimensionMetricsList = this.state.allDataSourcesDimensionsMetrics[chart.view_type];
      let chartCurrencySymbol = '';
      let chartPercentSymbol = '';
      if (chartDimensionMetricsList) {
        let metricIndex = chartDimensionMetricsList.findIndex((e) => e.id === chart['metric']);
        if (metricIndex > -1) {
          if (chartDimensionMetricsList[metricIndex]['type'] === 'currency') { chartCurrencySymbol = '$'; }
          if (chartDimensionMetricsList[metricIndex]['type'] === 'percent') { chartPercentSymbol = '%'; }
        }
      }
  
      // While showing segmented_net_details will be an array
      if (chartNetDetails && chartNetDetails.length > 0) {
        // sort the list alphabatically by segmentation key
        !isTableRequriedForNonSegmentedChart && chartNetDetails.sort((a, b) => a[chartSegmentation] < b[chartSegmentation] ? -1 : 1);
        
        return (
          <table className="tooltip-table">
            <thead>
              <tr>
                <th width={col_widths[0]+'%'}><span className="th-inner-wrapper">{col_header1}<span className="sepeartor"></span> Total</span><span className="bg"></span></th>
                <th width={col_widths[1]+'%'}>{chart.metric}<span className="bg"></span></th>
              </tr>
            </thead>
            
            <tbody>
              {chartNetDetails.map((dn, i) => {
                const col_0_color = color(isTableRequriedForNonSegmentedChart ? (chart.x_axis === 'date' ? parsedDateString(dn[chart.x_axis]) : dn[chart.x_axis]) : dn[chart.segmentation]);
                const col_1_val = isTableRequriedForNonSegmentedChart ? (chart.x_axis === 'date' ? parsedDateString(dn[chart.x_axis]) : dn[chart.x_axis]) : dn[chart.segmentation];
                const col_2_val = chartCurrencySymbol + numberWithCommas(dn[chart.metric]) + chartPercentSymbol;
              
                return (<tr key={i}>
                  <td key={i} width={col_widths[0]+'%'}>
                    <span className="td-inner-wrapper">
                      <span className="color" style={{backgroundColor: col_0_color}}></span>
                      <span className="key">{col_1_val}</span>
                    </span>
                  </td>
                  <td width={col_widths[1]+'%'}><span className="val">{col_2_val}</span></td>
                </tr>)
              })}
            </tbody>
          </table>
        )
      }
    }
  }
  
}


//show/hide more buttons drop down toggle
handleMoreButtonsDropDownToggle(e, id) {
  let updatedShowMoreButtonsDropDownToggle = { ...this.state.showMoreButtonsDropDownToggle };
  if (updatedShowMoreButtonsDropDownToggle[id]) {
    updatedShowMoreButtonsDropDownToggle[id] = !updatedShowMoreButtonsDropDownToggle[id];
  } else {
    updatedShowMoreButtonsDropDownToggle = { [id]: true };
  }
  this.setState({ showMoreButtonsDropDownToggle: updatedShowMoreButtonsDropDownToggle });
  this.handleChartSelection(id, 'more');
}


  // Function to generate random number 
  randomNumber(min, max) {
    // console.log('random', Math.random() * (max - min) + min);
    return Math.random() * (max - min) + min;
  }

  /* Randomize array in-place using Durstenfeld shuffle algorithm */
  shuffleArray(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
  }


  //get table structure for chart hover value display
  getChartHoverTableStructure(chart_type, isAnyChartSegmented = false) {
    let hover_chart_value = '';
    let chart_selector = chart_type.replace("/", ""); //using for performance impr/pv chart only

    if (this.state.isPeriodComparisonEnabled) {
      hover_chart_value += '<table class="crosshover-table ' + chart_selector + '">';
      hover_chart_value += '<tr>';
      hover_chart_value += '<th width="4%"><span class="color"></span><span class="bg"></span></th>';
      hover_chart_value += '<th width="46%">Period <span class="bg"></span></th>';
      hover_chart_value += '<th width="30%"><span class="value">' + chart_type.replace("_", " ") + '</span><span class="bg"></span></th>';
      hover_chart_value += '<th width="20%"><span class="change">Change</span><span class="bg"></span></th>';
      hover_chart_value += '</tr>';
      hover_chart_value += '</table>';
    } else {
      if (isAnyChartSegmented) {
        hover_chart_value += '<table class="crosshover-table ' + chart_selector + '">';
        hover_chart_value += '<tr>';
        hover_chart_value += '<th width="7.5%"><span class="color"></span><span class="bg"></span></th>';
        hover_chart_value += '<th width="52.5%">' + chart_type.replace("_", " ") + '<span class="bg"></span></th>';
        hover_chart_value += '<th width="40%"><span class="value"></span><span class="bg"></span></th>';
        hover_chart_value += '</tr>';
        hover_chart_value += '</table>';
      } else {
        hover_chart_value += '<div class="crosshover-table div ' + chart_selector + '">';
        hover_chart_value += '<div class="info">';
        hover_chart_value += '<div class="label">' + chart_type.replace("_", " ") + '</div>';
        hover_chart_value += '<div class="val"><span class="value"></span></div>';
        hover_chart_value += '</div>';
        hover_chart_value += '</div>';
      }
    }
    return hover_chart_value;
  }

  giveNewChartSettingsInfo() {
    let chartSettings = { ...this.state.newChartSettings };
    // chartSettings['showLegend'] = chartSettings['segmentation'] !== '' ? 1 : 0;
    // console.log(chartSettings.format , 'PAYLOAD')
    let info = {
      name: chartSettings.name,
      description: chartSettings.description,
      view_type: chartSettings.view_type,
      chart_type: chartSettings.chart_type,
      metric: chartSettings.metric,
      x_axis: chartSettings.x_axis,
      dynamic_time_period: chartSettings.dynamic_time_period,
      segmentation: chartSettings.segmentation,
      filters: chartSettings.filters,
      showLegend: chartSettings.showLegend,
      showGrid: chartSettings.showGrid,
      chart_other_settings: chartSettings.chart_other_settings,
      chart_format_parameters: JSON.stringify(chartSettings.format)
    };
    if (chartSettings.id && chartSettings.id !== '') {
      info['id'] = chartSettings.id;
    }
    // this.setState({ newChartSettings: chartSettings });
    return info;
  }

  // Fetch Chart data on Run button click
  fetchChartData(payload) {
    return new Promise((resolve, reject) => {
      APIService.apiRequest(Constants.API_BASE_URL + '/trend_master/get_chart_data', payload, false, 'POST', this.controller)
        .then(response => {
          if (response.status === 1) {
            let formattedData = formatChartData(response.data, 'date');
            resolve({ data: formattedData, other_details: response.other_details });
          } else { reject(response.message) }
        })
        .catch(err => {
          console.log('Error: ' + err.message);
          reject(err.message);
        });
    });
  }

  fetchChartBandDataForLineChart(chartSettings) {
    const payload = {
      client_id: this.state.client.id,
      terminal: this.user ? this.user.terminal_type.id : 'sellside',
      segmentation: '', // always empty, kept for api support
      view_type: chartSettings.view_type,
      daterange: this.giveDateRangeBasedOnPriority(chartSettings.dynamic_time_period, this.state.dashboardSettings.dynamic_time_period),
      metric: chartSettings.metric,
      x_axis: chartSettings.x_axis,
      band_params: {
        band_type: this.state.newChartBandSettings.type.toLowerCase().split(' ').join('_'),
        periods: Number(this.state.newChartBandSettings.period)
      }
    };

    APIService.apiRequest(Constants.API_BASE_URL + '/trend_master/get_bands', payload, false, 'POST', this.controller)
      .then(response => {
        if (response.status === 1) {
          let dataWithFormattedDate = formatChartData(response.data, 'date');
          const currentChartBandsData = this.state.newChartData.chartBandsData || [];
          this.setState({
            newChartData: { ...this.state.newChartData, chartBandsData: [...currentChartBandsData, dataWithFormattedDate] }
          }, () => {
            this.renderChart(chartSettings);
          })
        }
      })
      .catch(err => {
        console.log('Error: ' + err.message);
      });

  }

  //get chart unique id for chart settings and chart data mapping
  getChartUniqueKey(chartConfig) {
    return (chartConfig.id && chartConfig.id !== '') ? chartConfig.id : NEW_CHART_ID;
  }

  //return x ticks count based on width
  getDynamicXTicksCount(currentChartWidth, defaultChartWidth, dynamicXTicksCount) {
    let newDynamicXTicksCount = dynamicXTicksCount;
    if (currentChartWidth > defaultChartWidth) {
      newDynamicXTicksCount = (currentChartWidth / defaultChartWidth) * dynamicXTicksCount;
      if (newDynamicXTicksCount % 1 > 0) {
        newDynamicXTicksCount = Math.round(newDynamicXTicksCount);
      }
    }
    if (currentChartWidth < defaultChartWidth) {
      newDynamicXTicksCount = (currentChartWidth / defaultChartWidth) * dynamicXTicksCount
      if (newDynamicXTicksCount % 1 > 0) {
        newDynamicXTicksCount = Math.floor(newDynamicXTicksCount);
      }
    }
    return newDynamicXTicksCount;
  }

  //return x ticks count based on width
  getDynamicYTicksCount(currentChartHeight, defaultChartHeight, dynamicYTicksCount) {
    let newDynamicYTicksCount = dynamicYTicksCount;
    if (currentChartHeight > defaultChartHeight) {
      newDynamicYTicksCount = (currentChartHeight / defaultChartHeight) * dynamicYTicksCount
      if (newDynamicYTicksCount % 1 > 0) {
        newDynamicYTicksCount = Math.ceil(newDynamicYTicksCount);
      }
    }
    if (currentChartHeight < defaultChartHeight) {
      newDynamicYTicksCount = (currentChartHeight / defaultChartHeight) * dynamicYTicksCount
      if (newDynamicYTicksCount % 1 > 0) {
        newDynamicYTicksCount = Math.ceil(newDynamicYTicksCount);
      }
    }

    return newDynamicYTicksCount;
  }


  //renders a single chart
  renderChart(chartConfig, pointSelectionModeOn = false, runTimeLayout = null, chartClassOnResize = '') {
    let chartsInputData = {};
    let chartWidthClass = '';

    if (this.state.chartsFormattedData && this.state.chartsFormattedData[chartConfig.id]) {
      let sortedData = [...this.state.chartsFormattedData[chartConfig.id]];
      if (chartConfig.format) {
        sortedData = chartSortingFormating(chartConfig, sortedData);
      }

      chartsInputData['chartData'] = sortedData;
      chartsInputData['chartNetData'] = this.state.chartsFormattedNetData[chartConfig.id];
      chartsInputData['chartSegmentation'] = this.state.chartsSegmentation[chartConfig.id];
      chartsInputData['chartBandsData'] = this.state.chartsBandData[chartConfig.id] || null;
      chartsInputData['chartConfig'] = chartConfig;
    }

    // Add some other properties 
    chartsInputData['pointSelectionModeOn'] = pointSelectionModeOn;
    chartsInputData['pointSelectionClbk'] = pointSelectionModeOn ? this.handlePointSelectionOnChart : null;
    chartsInputData['pointClickClbk'] = this.handlePointClickOnChart;
    // Add chart Notes to chartsInputData if available 
    const showChartNotes = this.state.consolePanelSelectedTab === 'insight';
    chartsInputData['chartNotes'] = showChartNotes ? this.giveChartNotesById(chartConfig.id) : null;

    chartsInputData['chartCurrencySymbol'] = '';
    chartsInputData['chartPercentSymbol'] = '';

    let dynamicXTicksCount = 4;
    let dynamicYTicksCount = 4;
    let showLegend = chartConfig.showLegend !== undefined ? chartConfig.showLegend : 0;
    let defaultChartWidth = (chartConfig.segmentation !== '' && showLegend) ? (this.state.chart_dimensions.defaultWidth + this.state.chart_dimensions.defaultSegmentWidth) : this.state.chart_dimensions.defaultWidth;
    let smChartWidth = (chartConfig.segmentation !== '' && showLegend) ? (this.state.chart_dimensions.smWidth + this.state.chart_dimensions.smSegmentWidth) : this.state.chart_dimensions.smWidth;

    //find index of gridLayout and 
    let gridLayoutIndex = this.state.tempChartsGridLayout.findIndex((e) => e.id === chartConfig.id);
    if (gridLayoutIndex > -1) {
      //dynamic chart x/y ticks
      let currentChartWidth = runTimeLayout ? runTimeLayout['w'] : this.state.tempChartsGridLayout[gridLayoutIndex]['w'];
      let currentChartHeight = runTimeLayout ? runTimeLayout['h'] : this.state.tempChartsGridLayout[gridLayoutIndex]['h'];
      let defaultChartHeight = this.state.chart_dimensions.defaultHeight;

      //X Ticks
      dynamicXTicksCount = this.getDynamicXTicksCount(currentChartWidth, defaultChartWidth, dynamicXTicksCount);
      chartsInputData['xAxisTicksCount'] = dynamicXTicksCount;

      // Y Ticks
      dynamicYTicksCount = this.getDynamicYTicksCount(currentChartHeight, defaultChartHeight, dynamicYTicksCount);
      chartsInputData['yAxisTicksCount'] = dynamicYTicksCount;

      //check size classes and pass to dra chart function to manage spacings and ticks show/hide
      if (chartClassOnResize !== '') {
        chartWidthClass = chartClassOnResize;
      } else {
        if ((this.state.tempChartsGridLayout[gridLayoutIndex] && (this.state.tempChartsGridLayout[gridLayoutIndex]['w'] < defaultChartWidth) && (this.state.tempChartsGridLayout[gridLayoutIndex]['w'] >= smChartWidth))) {
          chartWidthClass = 'sm-grid-width';
        }
        if ((this.state.tempChartsGridLayout[gridLayoutIndex] && (this.state.tempChartsGridLayout[gridLayoutIndex]['w'] < smChartWidth))) {
          chartWidthClass = 'xs-grid-width';
        }
      }
    }


    chartsInputData['chartSizeClass'] = chartWidthClass; // used for controlling charts padding and hiding ticks and sliding ticks
    chartsInputData['screen'] = this.getSavedCanvasWidth(); // used for controlling charts padding and hiding ticks and sliding ticks
    chartsInputData['isDashboardInEditMode'] = this.isDashboardInEditMode();
    chartsInputData['viewModeType'] = this.state.currentViewModeType;

    //for showing symbol before/after number
    if(this.props.isPublicView) {
      drawDynamicChart(chartsInputData);
      
    } else {
      let chartDimensionMetricsList = this.state.allDataSourcesDimensionsMetrics[chartConfig['view_type']];
      if (chartDimensionMetricsList) {
        let metricIndex = chartDimensionMetricsList.findIndex((e) => e.id === chartConfig['metric']);
        if (metricIndex > -1) {
          if (chartDimensionMetricsList[metricIndex]['type'] === 'currency') { chartsInputData['chartCurrencySymbol'] = '$'; }
          if (chartDimensionMetricsList[metricIndex]['type'] === 'percent') { chartsInputData['chartPercentSymbol'] = '%'; }
        }
        drawDynamicChart(chartsInputData);
      }
    }
  }

  //used incase of add/edit chart data
  syncChartData(chartId) {
    this.setState({
      chartsFormattedData: { ...this.state.chartsFormattedData, [chartId]: this.state.newChartData.formattedData },
      chartsFormattedNetData: { ...this.state.chartsFormattedNetData, [chartId]: this.state.newChartData.formattedNetData },
      chartsSegmentation: { ...this.state.chartsSegmentation, [chartId]: this.state.newChartData.segmentationData },
      chartsBandData: { ...this.state.chartsBandData, [chartId]: this.state.newChartData.chartsBandData },
    });
  }


  storeChartData(data, chartConfig) {
    let unique_key = chartConfig.id;
    const { formattedData, formattedNetData, segmentationData } = this.giveClientSideChartData(data, chartConfig);

    this.setState({
      chartsFormattedData: { ...this.state.chartsFormattedData, [unique_key]: formattedData },
      chartsFormattedNetData: { ...this.state.chartsFormattedNetData, [unique_key]: formattedNetData },
      chartsSegmentation: { ...this.state.chartsSegmentation, [unique_key]: segmentationData }
    });
  }

  storeChartBandData(bandData, chartConfig) {
    let unique_key = chartConfig.id;
    this.setState({
      chartsBandData: { ...this.state.chartsBandData, [unique_key]: bandData },
    });
  }


  giveDateRangeBasedOnPriority(chartDynamicTimePeriod = '', dashboardDynamicTimePeriod = '') {
    let rangeToConsider = dashboardDynamicTimePeriod || chartDynamicTimePeriod;

    // In case, range is not set neither at chart level nor at Dashboard level, use the Fallback data range
    rangeToConsider = rangeToConsider || FALLBACK_TIME_PERIOD_FOR_CHARTS;

    return rangeToConsider.is_dynamic === true
      ? [convertDatePeriodPreselectsToRange(rangeToConsider.value, rangeToConsider.custom_dates)]
      : [rangeToConsider.value];
  }

  //Get new chart settings payload
  getFetchChartDataPayload(chartSettings) {
    const giveFiltersBasedOnPriority = (chartFilters = {}, dashboardFilters = {}) => {
      let payloadFilters = {};
      // Override the chart filter values which are also applied in dashboard filters
      for (let cf in chartFilters) {
        payloadFilters[cf] = dashboardFilters[cf] && dashboardFilters[cf].length ? dashboardFilters[cf] : chartFilters[cf];
      }

      // Now append the dashboard filter values which are applicable to selected view type
      // e.g, 'device_category' filter is not applicable when view_type='adverstiser'
      const filtersPossibleForSelectedViewType = this.state.allDataSourcesDimensionsMetrics[chartSettings.view_type] || [];
      for (let df in dashboardFilters) {
        const isApplicable = filtersPossibleForSelectedViewType.findIndex(f => f.id === df) > -1;
        if (!payloadFilters[df] && isApplicable) {
          payloadFilters[df] = dashboardFilters[df];
        }
      }

      //for property level login and when not filter is selected
      if (this.user && this.user.parent_organization_id > 1 && (Object.keys(chartSettings.filters).length === 0 || chartSettings.filters.property===undefined)) {
        let filters = [];
        if (Array.isArray(this.user.attributes)) {
          this.user.attributes.forEach((item) => {
            if (item.site_name !== undefined) {
              filters.push(item.site_name);
            }
          });
        }
        payloadFilters['property'] = filters;
      }

      return payloadFilters;
    };


    let payload = {
      id: chartSettings.id,
      show_period_comparison: chartSettings.chart_type==='scorecard' ? 1 : 0,
      method: 'manual',
      client_id: this.state.client.id,
      terminal: this.state.terminal_type,
      view_type: chartSettings.view_type,
      daterange: this.giveDateRangeBasedOnPriority(chartSettings.dynamic_time_period, this.state.dashboardSettings.dynamic_time_period),
      filters: giveFiltersBasedOnPriority(chartSettings.filters, this.state.dashboardSettings.filters),
      segmentation: chartSettings.segmentation,
      metric: chartSettings.metric,
      x_axis: chartSettings.x_axis,
      showLegend: chartSettings.showLegend,
    };
    // remove x_axis from payload for scorecard 
    if (chartSettings.chart_type === 'scorecard') {
      delete payload.x_axis;
      delete payload.showLegend;
    }

    //for sharable dashbaord only
    if(this.props.isPublicView && this.props.publicToken){
      payload['token'] = this.props.publicToken;
    }
    return payload;
  }


  // Used to set the set the chart Info for which note is being added
  handlePointSelectionOnChart(clickInfo) {
    this.setState({ insightNoteAddForm: { ...this.state.insightNoteAddForm, chartInfo: clickInfo } });
    this.insightAddFormQuillDOMRef.current.getEditor().root.dataset.placeholder = 'Add a Note';
  }

  handlePointClickOnChart(clickedNoteInfo) {
    this.setState({ insightClickedNoteInfo: clickedNoteInfo });
  }


  /**Check if all required fields filled or not
   * @returns error Message if some required field is not filled,else returns ''
   */
  isChartSettingsValid() {
    const settings = this.state.newChartSettings;
    let errMsg = '';

    if (!settings['chart_type']) {
      errMsg = 'Please provide Chart Type';
    }
    if (!settings['view_type']) {
      errMsg = 'Please provide Source';
    }
    if (!settings['metric']) {
      errMsg = (settings.chart_type === 'heatmap') ? 'Please provide Measurement' : 'Please provide Y Axis';
    }
    if (settings.chart_type !== 'scorecard' && !settings['x_axis']) {
      errMsg = 'Please provide X Axis';
    }
    if (!this.state.dashboardSettings['dynamic_time_period'] && !settings['dynamic_time_period']) {
      errMsg = 'Please select a Period';
    }
    if (settings.chart_type === 'spider') {
      if (!settings.metric.includes(',')) {
        errMsg = "Please select minimum of 3 Measurements";
      } else {
        let measurements = settings.metric.split(',');
        if (measurements.length < 3) {
          errMsg = "Please select minimum of 3 Measurements";
        }
      }
    }
    if (parseInt(settings.format.yaxis.max) <= parseInt(settings.format.yaxis.min) || parseInt(settings.format.xaxis.max) <= parseInt(settings.format.xaxis.min)) {
      errMsg = "Maximum should be more than Minimum in format axis";
    }
    if (settings.format.yaxis.min === '-' || settings.format.yaxis.max === '-' || settings.format.xaxis.min === '-' || settings.format.xaxis.max === '-') {
      errMsg = "Please input number after negative sign in format axis tab";
    }

    return errMsg;
  }

  /**Extracts the chart data into 3 seperate variables to be used at client side */
  giveClientSideChartData(chartData, chartConfig) {
    let cDataClient = { formattedData: [], formattedNetData: {}, segmentationData: '' };
    cDataClient['formattedData'] = chartData.data;
    cDataClient['segmentationData'] = chartConfig.segmentation;

    for (let key in chartData.other_details) {
      cDataClient.formattedNetData[key] = {
        ...chartData.other_details[key],
        "symbol": '',
      }
    }

    return cDataClient;
  }


  //On Run and Save Button Click
  handleChartCreateOrUpdate() {
    const validationErrMsg = this.isChartSettingsValid();
    if (validationErrMsg !== '') {
      alertService.showToast('error', validationErrMsg);
      this.setState({ chartOrDashboardSaveInProcess: false });
      return Promise.reject('INVALID_FORM');
    }

    // 1. Call fetchChartData, if successful then call fetchBandData
    // 2. Simultaneously Call saveChart - if it fails show message
    // 3. There are some state variables which are only to be updated when both the request have completed or failed, hence use Promise.all to handle this case
    const isNewChart = this.state.currentChartEditId === NEW_CHART_ID;
    const req1Promise = this.saveOrEditChartToExistingDashboard(!isNewChart);
    const req2Promise = this.fetchChartDataAndRender();

    // Below proimise will resolve when both apis have completed successfully
    return new Promise((resolve, reject) => {
      this.setState({
        chartOrDashboardSaveInProcess: true
      });
      Promise.all([req1Promise, req2Promise])
        .then((responses) => {
          // partialNewChartSett is an Object which includes the chart setting which are to be updated after the chart is saved to server
          // These settings may include id, name,chart_other_settings etc.
          const saveOrEditAPIResponse = responses[0];
          let updatedNewChSett = { ...this.state.newChartSettings, ...saveOrEditAPIResponse };
          this.setState({
            newChartSettings: updatedNewChSett,
            newChartSettingsLastExecuted: { ...updatedNewChSett },
            newChartBandSettingsLastExecuted: JSON.parse(JSON.stringify(this.state.newChartBandSettings)),
            chartOrDashboardSaveInProcess: false
          });
          this.syncNewChartSettingsWithChartsSettingsList(saveOrEditAPIResponse.id, !isNewChart);
          // Fetch the bands data also if bands are applicable to this chart
          this.fetchChartBandsData()
            .then(bandsData => {
              let bandsDataWithFormattedDate = bandsData.map(bd => formatChartData(bd, 'date'));
              // Promise will resolve immediately if band is not applicable OR there is no band applied
              const chartId = this.state.newChartSettings.id;
              this.setState({
                chartsBandData: { ...this.state.chartsBandData, [chartId]: bandsDataWithFormattedDate }
              }, () => {
                this.renderChart(this.state.newChartSettings);
              });
              resolve();
            })
            .catch();
        })
        .catch(e => {
          this.setState({
            chartOrDashboardSaveInProcess: false
          });
          console.log('error', e);
          reject('API_FAILED')
        });
    });
  }


  fetchChartDataAndRender() {
    return new Promise((resolve, reject) => {
      const chartInfo = this.giveNewChartSettingsInfo();
      const payload = this.getFetchChartDataPayload(chartInfo);

      this.setState({
        chartsLoadingsObj: { ...this.state.chartsLoadingsObj, [chartInfo.id]: true },
      });
      this.fetchChartData(payload)
        .then((chartData) => {
          let updatedState = {
            chartsLoadingsObj: { ...this.state.chartsLoadingsObj, [chartInfo.id]: false },
          };
          const { formattedData, formattedNetData, segmentationData } = this.giveClientSideChartData(chartData, this.state.newChartSettings);

          // update the chartSettings of chart being edited in the settings list
          const updatedChartsSettings = this.state.filteredChartsSettings.map(c => {
            if (c.id !== this.state.currentChartEditId) { return c; }
            return { ...this.state.newChartSettings, ref: c.ref, legendRef: c.legendRef };
          });

          // Similarly, update the layout settings of chart being edited - commented by Chandan - 08/02/2022 - it was updating the tempChartsGridLayout unnecessary
          // Note : This mainly includes updating the width and height of chart in case segmentation is selected or Chart type=Scorecard
          // const updatedChartsLayoutSettings = this.state.tempChartsGridLayout.map(cl => {
          //   if (cl.id !== this.state.currentChartEditId) { return cl; }

          //   const updatedCSett = this.state.newChartSettings;
          //   const earlierSett = this.state.filteredChartsSettings.find(fc => fc.id === cl.id);

          //   // Update width if either segmentation is selected OR chart_type=scorecard 
          //   // Update height if char_type=scorecard
          //   // Note : Update only if different from previous settings, i.e. don't change if earlier segmentation was there and now also there
          //   let clNew = { ...cl };
          //   if (updatedCSett.chart_type === 'scorecard') {
          //     if (earlierSett.chart_type !== 'scorecard') {
          //       clNew.w = CHART_DIMENSIONS.xsScorecardWidth;
          //       clNew.h = CHART_DIMENSIONS.xsScorecardHeight;
          //     }
          //   } else if (updatedCSett.segmentation !== '') {
          //     if (earlierSett.segmentation === '') {
          //       // clNew.w = CHART_DIMENSIONS.defaultWidth + CHART_DIMENSIONS.defaultSegmentWidth;
          //       clNew.w = CHART_DIMENSIONS.defaultWidth;
          //       clNew.h = CHART_DIMENSIONS.defaultHeight;
          //     }
          //   } else {
          //     // Now, reset chart width and height to standard values if either Scorecard type has been removed OR segmentation has been removed
          //     if (
          //       (earlierSett.chart_type === 'scorecard' && updatedCSett.chart_type !== 'scorecard')
          //       || (earlierSett.segmentation !== '' && updatedCSett.segmentation === '')
          //     ) {
          //       clNew.w = CHART_DIMENSIONS.defaultWidth;
          //       clNew.h = CHART_DIMENSIONS.defaultHeight;
          //     }
          //     // else, do nothing, let the 'w' and 'h' remain as it is.
          //   }

          //   return clNew;
          // })

          updatedState = {
            ...updatedState,
            // update the chart data
            chartsFormattedData: { ...this.state.chartsFormattedData, [this.state.newChartSettings.id]: formattedData },
            chartsFormattedNetData: { ...this.state.chartsFormattedNetData, [this.state.newChartSettings.id]: formattedNetData },
            chartsSegmentation: { ...this.state.chartsSegmentation, [this.state.newChartSettings.id]: segmentationData },
            // also update the settings and layout settings immediately so that it gets reflected on the next chart render
            chartsSettings: updatedChartsSettings,
            filteredChartsSettings: updatedChartsSettings,
            // tempChartsGridLayout: updatedChartsLayoutSettings
          };

          this.setState(updatedState, () => {
            setTimeout(() => {
              const updatedChartSett = this.state.filteredChartsSettings.find(c => c.id === this.state.currentChartEditId);
              this.renderChart(updatedChartSett);
              resolve();
            }, 100);
          });
        })
        .catch(e => {
          this.setState({
            chartsLoadingsObj: { ...this.state.chartsLoadingsObj, [chartInfo.id]: false },
          });
          reject(e)
        });
    });
  }


  saveChart() {
    const isNewChart = this.state.currentChartEditId === NEW_CHART_ID;
    if (isNewChart) {
      this.saveNewChartToExistingDashboard();
    } else {
      // If editing a chart in existing dashboard, call chart edit api
      this.editChartToExistingDashboard();
    }
  }

  syncNewChartSettingsWithChartsSettingsList(chartId, isEdit, updated_on = null) {
    let updateChartsSettings = [...this.state.chartsSettings];
    let updateFilteredChartsSettings = [...this.state.filteredChartsSettings];

    let stateObj = {};
    let existingSettingsIndex = updateChartsSettings.findIndex((e) => e.id === this.state.currentChartEditId);
    let existingFilteredSettingsIndex = updateFilteredChartsSettings.findIndex((e) => e.id === this.state.currentChartEditId);

    let updateTempChartsGridLayout = [...this.state.tempChartsGridLayout];
    let tempGridLayoutIndex = updateTempChartsGridLayout.findIndex((e) => e.id === this.state.currentChartEditId);

    if (isEdit) {
      // In case of edit, only chart settings need to be synced
      let tempRef = updateChartsSettings[existingSettingsIndex]['ref'];
      let tempLegendRef = updateChartsSettings[existingSettingsIndex]['legendRef'];
      let tempFilteredRef = updateFilteredChartsSettings[existingFilteredSettingsIndex]['ref'];
      let tempFilteredLegendRef = updateFilteredChartsSettings[existingFilteredSettingsIndex]['legendRef'];

      updateChartsSettings[existingSettingsIndex] = { ...this.state.newChartSettings, ref: tempRef, legendRef: tempLegendRef };
      updateFilteredChartsSettings[existingSettingsIndex] = { ...this.state.newChartSettings, ref: tempFilteredRef, legendRef: tempFilteredLegendRef };

      // Also update the band settings if applicable
      const bandSettings = this.giveNewChartValidBandSettings().map(band => this.giveBandValidParams(band));
      if (bandSettings.length) {
        updateChartsSettings[existingSettingsIndex].chart_other_settings = updateChartsSettings[existingSettingsIndex].chart_other_settings ? JSON.parse(updateChartsSettings[existingSettingsIndex].chart_other_settings) : {};
        updateChartsSettings[existingSettingsIndex].chart_other_settings['band_settings'] = bandSettings;
        updateChartsSettings[existingSettingsIndex].chart_other_settings = JSON.stringify(updateChartsSettings[existingSettingsIndex].chart_other_settings);

        updateFilteredChartsSettings[existingFilteredSettingsIndex].chart_other_settings = updateFilteredChartsSettings[existingFilteredSettingsIndex].chart_other_settings ? JSON.parse(updateFilteredChartsSettings[existingFilteredSettingsIndex].chart_other_settings) : {};
        updateFilteredChartsSettings[existingFilteredSettingsIndex].chart_other_settings['band_settings'] = bandSettings;
        updateFilteredChartsSettings[existingFilteredSettingsIndex].chart_other_settings = JSON.stringify(updateFilteredChartsSettings[existingFilteredSettingsIndex].chart_other_settings);
      }

      stateObj = {
        chartsSettings: updateChartsSettings,
        filteredChartsSettings: updateFilteredChartsSettings,
      };

      //change chart tempgridlayout when showLegend is on
      if (tempGridLayoutIndex > -1) {
        if (updateFilteredChartsSettings[existingFilteredSettingsIndex]['showLegend']) {
          if (updateTempChartsGridLayout[tempGridLayoutIndex]['sw'] === 0) {
            updateTempChartsGridLayout[tempGridLayoutIndex]['sw'] = this.getSegmentWidth(this.state.chart_dimensions.defaultSegmentWidth);
          }

          //change position to little left when there is no space available in right side to adjust the segment width
          let edit_current_total_width = (updateTempChartsGridLayout[tempGridLayoutIndex]['x'] + updateTempChartsGridLayout[tempGridLayoutIndex]['w']);
          if (edit_current_total_width > (window.innerWidth - 10)) {
            let updated_edit_x = updateTempChartsGridLayout[tempGridLayoutIndex]['x'] - (edit_current_total_width - (window.innerWidth - 10));
            updateTempChartsGridLayout[tempGridLayoutIndex]['x'] = updated_edit_x;
          }
        } else {
          // updateTempChartsGridLayout[tempGridLayoutIndex]['w'] = updateTempChartsGridLayout[tempGridLayoutIndex]['w'];
          updateTempChartsGridLayout[tempGridLayoutIndex]['sw'] = 0;
        }
        stateObj['tempChartsGridLayout'] = updateTempChartsGridLayout;
        stateObj['chartsGridLayout'] = [...updateTempChartsGridLayout];
      }

    } else {
      // In case of New, Sync chart settings and update the id of the chart in layout settings and chartsData as well
      //RESET new_chart_constructor id to chartId obtained from server
      updateChartsSettings[existingSettingsIndex] = { ...this.state.newChartSettings, id: chartId, updated_on: updated_on };
      updateFilteredChartsSettings[existingFilteredSettingsIndex] = { ...this.state.newChartSettings, id: chartId, updated_on: updated_on };
      updateTempChartsGridLayout[tempGridLayoutIndex] = { ...updateTempChartsGridLayout[tempGridLayoutIndex], id: chartId };

      if (updateFilteredChartsSettings[existingFilteredSettingsIndex]['showLegend']) {
        updateTempChartsGridLayout[tempGridLayoutIndex]['w'] = updateTempChartsGridLayout[tempGridLayoutIndex]['w'] + this.state.chart_dimensions.defaultSegmentWidth;

        //change position to little left when there is no space available in right side to adjust the segment width
        let new_current_total_width = (updateTempChartsGridLayout[tempGridLayoutIndex]['x'] + updateTempChartsGridLayout[tempGridLayoutIndex]['w']);
        if (new_current_total_width > (window.innerWidth - 10)) {
          let updated_x = updateTempChartsGridLayout[tempGridLayoutIndex]['x'] - (new_current_total_width - (window.innerWidth - 10));
          updateTempChartsGridLayout[tempGridLayoutIndex]['x'] = updated_x;
        }
      } else {
        updateTempChartsGridLayout[tempGridLayoutIndex]['sw'] = 0;
      }

      // Make new entry for updated id and copy the data stored against KEY 'NEW_CHART_ID' into this and then delete the key 'NEW_CHART_ID'
      let updatedChartsFormattedData = { ...this.state.chartsFormattedData };
      let updatedchartsFormattedNetData = { ...this.state.chartsFormattedNetData };
      let updatedchartsSegmentation = { ...this.state.chartsSegmentation };
      let updatedChartsLoadingsObj = { ...this.state.chartsLoadingsObj };

      //new entry for updated id
      updatedChartsFormattedData[chartId] = updatedChartsFormattedData[this.state.currentChartEditId];
      updatedchartsFormattedNetData[chartId] = updatedchartsFormattedNetData[this.state.currentChartEditId];
      updatedchartsSegmentation[chartId] = updatedchartsSegmentation[this.state.currentChartEditId];
      updatedChartsLoadingsObj[chartId] = false;

      //remove entry for id new_chart_constructor
      delete updatedChartsFormattedData[this.state.currentChartEditId];
      delete updatedchartsFormattedNetData[this.state.currentChartEditId];
      delete updatedchartsSegmentation[this.state.currentChartEditId];
      delete updatedChartsLoadingsObj[this.state.currentChartEditId];

      stateObj = {
        chartsSettings: updateChartsSettings,
        filteredChartsSettings: updateFilteredChartsSettings,
        currentChartEditId: chartId,
        selectedChartIds: [chartId],
        chartsFormattedData: updatedChartsFormattedData,
        chartsFormattedNetData: updatedchartsFormattedNetData,
        chartsSegmentation: updatedchartsSegmentation,
        chartsGridLayout: [...updateTempChartsGridLayout],
        tempChartsGridLayout: updateTempChartsGridLayout,
        chartsLoadingsObj: updatedChartsLoadingsObj
      };
    }


    this.setState(stateObj, () => {
      //update grid layouts under dashboard config
      this.handleDashboardChartLayoutSave();
    });
  }

  //Update charts layout
  handleDashboardChartLayoutSave() {
    // save the current grid layout settings to server
    const updatedDashboardSettings = { dashboard_other_settings: JSON.stringify(this.giveDashboardOtherSettings()) };
    this.editDashboard(updatedDashboardSettings, '');
  }


  // Helper method
  giveNewChartValidBandSettings() {
    if (!this.state.constructorAnalysisMetadata) { return []; }

    const bandMetadata = this.state.constructorAnalysisMetadata.filter(meta => meta.is_band);
    return this.state.newChartBandSettings.filter(sett => {
      const meta = bandMetadata.find(b => b.name === sett.band_type);
      return this.isBandOrTrendTypeApplicable(meta);
    });
  }

  // Helper method
  giveBandValidParams(band) {
    //Collect the values of keys related to band.band_type, this is needed as band may have extra keys than required to send in payload, but we need to send only what is needed
    const bandMetadata = this.state.constructorAnalysisMetadata.filter(meta => meta.is_band);
    const meta = bandMetadata.find(b => b.name === band.band_type);
    let validPrams = { band_type: band.band_type };
    for (let x in meta.parameters) {
      validPrams[x] = band[x];
    }
    return validPrams;
  }

  fetchChartBandsData() {
    const validBands = this.giveNewChartValidBandSettings();
    if (validBands.length === 0) { return Promise.resolve([]); }

    return new Promise((resolve, reject) => {
      let bandPromises = [];
      // Now construct the payload for /get_bands, since its payload contains most of the keys similar to /get_chart_data, hence, reuse the method and do needed changes
      let commonPayload = this.getFetchChartDataPayload(this.state.newChartSettings);
      commonPayload.segmentation = ''; // always empty, kept for api support 
      // delete commonPayload.filters;
      delete commonPayload.method;

      // let bandPromiseDatas = [];
      validBands.forEach(band => {
        let payload = {
          ...commonPayload,
          // append the keys related to band
          band_params: this.giveBandValidParams(band)
        };

        let bandPromise = this.fetchChartBandData(payload);
        bandPromises.push(bandPromise);

        // trigger the request
        // bandPromise
        //   .then(bandData => {
        //     let dataWithFormattedDate = formatChartData(bandData, 'date');
        //     const currentChartBandsData = this.state.newChartData.chartBandsData || [];
        //     bandPromiseDatas.push(dataWithFormattedDate);
        //     this.setState({
        //       newChartData: { ...this.state.newChartData, chartBandsData: [...currentChartBandsData, dataWithFormattedDate] },
        //     }, () => {
        //       this.renderChart(cSett);
        //     })

        //   })
        //   .catch(err => {
        //     console.log('Error: ' + err.message);
        //   });
      });

      const chartId = this.state.newChartSettings.id;
      this.setState({
        chartOrDashboardSaveInProcess: true,
        chartsLoadingsObj: { ...this.state.chartsLoadingsObj, [chartId]: true },
      })
      Promise.all(bandPromises)
        .then((bandsData) => {
          this.setState({
            chartOrDashboardSaveInProcess: false,
            chartsLoadingsObj: { ...this.state.chartsLoadingsObj, [chartId]: false },
          }, () => resolve(bandsData))
        })
        .catch(reject);
    });
  }

  fetchChartBandData(payload) {
    return new Promise((resolve, reject) => {
      APIService.apiRequest(Constants.API_BASE_URL + '/trend_master/get_bands', payload, false, 'POST', this.controller)
        .then(response => {
          if (response.status === 1) {
            resolve(response.data);
          } else {
            reject({});
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  handleDashboardSaveBtn() {
    if (this.state.dashboardSettings.id === null) {
      this.saveDashboardWithCharts([]);
    } else {
      this.editDashboard();
    }
  }


  handleDashboardArchiveBtn() {
    // TODO after api
  }


  handleDashboardRunBtn() {
    this.getChartDataForAllCharts();
  }

  handleDashboardResetBtn() {
    this.setState({ dashboardSettings: this.getDashboardInitialSettings() });
  }

  handleDashboardFormTabSelect(tabName) {
    this.setState({
      newDashboardFormCurrentTab: tabName,
    });
    this.props.hideDashboardCreatedMsg();
  }

  handleDashboardFormCloseBtn() {
    this.setState({
      showNewDashboardForm: false
    });
    if (this.props.showDashboardCreatedMsg) {
      this.props.hideDashboardCreatedMsg();
    }
  }

  handleDashboardFormOpenConsoleBtn() {
    this.handleDashboardFormCloseBtn();
    this.handleConsolePanelTabChange('constructor');
  }

  //on change of dashboard layout settings - canvas size, width, height
  handleDashboardLayoutSettingChange(e, type, custom_val) {
    let updatedDashboardSettings = JSON.parse(JSON.stringify(this.state.dashboardSettings));
    let savedDashboardSettings = JSON.parse(JSON.stringify(this.state.dashboardSettingsLastSaved));
    let value = type === 'size' ? e : e.target.value;

    //if layout type field is changed
    if (type === 'type') {
      if (value === 'preset') {
        updatedDashboardSettings['dashboard_other_settings']['layout_setting'] = {
          'type': value,
          'device_category': '',
          'device': ''
        };

      } else if (value === 'auto') {
        updatedDashboardSettings['dashboard_other_settings']['layout_setting'] = this.getDefaultLayoutSettings({ gridColWidth: this.state.gridColWidth, gridRowHeight: this.state.gridRowHeight });

      } else {
        updatedDashboardSettings['dashboard_other_settings']['layout_setting'] = {
          'type': value,
          'width': '',
          'height': ''
        };
      }

    } else {
      if (type === 'width' && (value > 5000 || (value !== '' && !this.isNumber(value)))) return;
      if (type === 'height' && (value > 10000 || (value !== '' && !this.isNumber(value)))) return;

      if (type === 'device_category' || type === 'device') {
        updatedDashboardSettings['dashboard_other_settings']['layout_setting'][type] = custom_val;
      } else {
        updatedDashboardSettings['dashboard_other_settings']['layout_setting'][type] = value;
      }
    }

    //if the saved option is selected again show the saved setting by default
    if (type === 'type' && value !== 'auto' && value === savedDashboardSettings['dashboard_other_settings']['layout_setting']['type']) {
      updatedDashboardSettings['dashboard_other_settings']['layout_setting'] = { ...savedDashboardSettings['dashboard_other_settings']['layout_setting'] };
    }

    this.setState({
      dashboardSettings: updatedDashboardSettings,
      dashboardErrObj: { error: false, msg: '' }
    });
  }

  //navigate to perticular tab after opening dashboard dialog
  navigateToDashboardSettings(tab, activeAccordion) {
    let updatedNewDashboardFormExpandedItemByTab = { ...this.state.newDashboardFormExpandedItemByTab };
    updatedNewDashboardFormExpandedItemByTab[tab] = activeAccordion;

    this.setState({
      showNewDashboardForm: true,
      newDashboardFormExpandedItemByTab: updatedNewDashboardFormExpandedItemByTab,
      newDashboardFormCurrentTab: tab,
    });
  }

  saveOrEditChartToExistingDashboard(toEdit) {
    return new Promise((resolve, reject) => {
      const payload = { ...this.giveNewChartSettingsInfo() };
      const chartIndex = this.state.filteredChartsSettings.findIndex((e) => e.id === this.state.currentChartEditId);
      payload.name = payload.name.trim() || (payload.chart_type !== 'scorecard' ? `Untitled Chart ${chartIndex + 1}` : '');
      payload.id = toEdit ? payload.id : null;

      let dashboardId = this.getDashboardID();
      let chartId = null;
      if (toEdit) {
        chartId = this.state.currentChartEditId;
      }

      // Now to save any band settings(if available), we need to save that in 'chart_plotting_parameters'
      const bandSettings = this.giveNewChartValidBandSettings().map(band => this.giveBandValidParams(band));

      payload.chart_other_settings = payload.chart_other_settings ? JSON.parse(payload.chart_other_settings) : {};
      payload.chart_other_settings['showLegend'] = payload.showLegend;
      payload.chart_other_settings['band_settings'] = (bandSettings.length > 0) ? bandSettings : [{}];
      payload.chart_other_settings = JSON.stringify(payload.chart_other_settings);

      delete payload.showLegend;
      delete payload.showGrid;

      let APIRequestCount = 1;
      let that = this;
      let successMsg = toEdit ? 'Chart Edited Successfully' : 'Chart saved to Dashboard';
      let errorMsg = toEdit ? 'Some error occured while editing chart' : 'Some error occured while saving chart';
      APICall();

      function APICall() {
        let request = toEdit ? APIService.apiRequest(Constants.API_BASE_URL + `/trend_master/edit_chart/${chartId}`, payload, false, 'PUT') : APIService.apiRequest(Constants.API_BASE_URL + `/trend_master/add_chart/${dashboardId}`, payload, false, 'POST', that.controller);
        request.then(response => {
          if (response.status === 1) {
            // chart added/edited to server successfully
            const updatedChartId = toEdit ? chartId : Number(response.new_chart_id);

            alertService.showToast('success', successMsg);

            resolve({ id: updatedChartId, name: payload.name, updated_on: response.updated_on });
          } else {
            if (APIRequestCount === 1) {
              APICall();
              APIRequestCount = APIRequestCount + 1;
            } else {
              alertService.showToast('error', errorMsg + ' : ' + response.message);
              reject(response.message);
            }
          }
        }).catch(e => {
          if (APIRequestCount === 1) {
            APICall();
            APIRequestCount = APIRequestCount + 1;
          } else {
            alertService.showToast('error', errorMsg + ' : ' + e.message);
            reject(e.message);
          }
        });
      }
    });
  }


  saveNewChartToExistingDashboard() {
    const dashboardId = this.getDashboardID();
    const payload = this.giveNewChartSettingsInfo();
    payload.id = null;
    payload.name = payload.name.trim() || `Untitled Chart ${this.state.chartsSettings.length + 1}`;

    // Now to save any band settings(if available), we need to save that in 'chart_plotting_parameters'
    const bandSettings = this.giveNewChartValidBandSettings().map(band => this.giveBandValidParams(band));

    payload.chart_other_settings = payload.chart_other_settings ? JSON.parse(payload.chart_other_settings) : {};
    payload.chart_other_settings['showLegend'] = payload.showLegend;
    if (bandSettings.length) {
      payload.chart_other_settings['band_settings'] = bandSettings;
    }
    payload.chart_other_settings = JSON.stringify(payload.chart_other_settings);
    delete payload.showLegend;
    delete payload.showGrid;

    this.setState({ chartOrDashboardSaveInProcess: true });
    let saveAPIRequestCount = 1;
    let that = this;
    saveAPICall();

    function saveAPICall() {
      APIService.apiRequest(Constants.API_BASE_URL + `/trend_master/add_chart/${dashboardId}`, payload, false, 'POST', that.controller)
        .then(response => {
          if (response.status === 1) {
            // Chart added to dashboard successfully at server

            let newChartId = Number(response.new_chart_id);
            let updatedNewChSett = { ...that.state.newChartSettings, name: payload.name, id: Number(response.new_chart_id) };
            if (bandSettings.length) {
              updatedNewChSett.chart_other_settings = payload.chart_other_settings;
            }
            if (response.updated_on) {
              updatedNewChSett['updated_on'] = response.updated_on;
            }

            that.setState({
              newChartSettings: updatedNewChSett,
              newChartSettingsLastExecuted: { ...updatedNewChSett },
              chartOrDashboardSaveInProcess: false
            }, () => {
              that.syncNewChartSettingsWithChartsSettingsList(newChartId, false, response.updated_on);
              // this.syncChartData(newChartId);
              // this.storeChartBandData(chartBanddata, this.state.newChartSettings);

              // Newly added chart is available in chart list and its data also has been saved
              // hence, now render this chart in the list
              // setTimeout(() => {
              //   this.renderChart(this.state.filteredChartsSettings.find(c => c.id === newChartId), 'multiple');
              // }, 100);
            });

            // Now add this chart settings to Dashboard's chart list
            alertService.showToast('success', 'Chart saved to Dashboard');
          } else {
            if (saveAPIRequestCount === 1) {
              saveAPICall();
              saveAPIRequestCount = saveAPIRequestCount + 1;
            } else {
              that.setState({ chartOrDashboardSaveInProcess: false });
              alertService.showToast('error', 'Error occured in saving chart to dashboard' + response.message);
            }
          }
        })
        .catch(err => {
          if (saveAPIRequestCount === 1) {
            saveAPICall();
            saveAPIRequestCount = saveAPIRequestCount + 1;
          } else {
            that.setState({ chartOrDashboardSaveInProcess: false });
            console.log('Error occured in saving chart to dashboard: ' + err.message);
          }
        });
    }

  }

  saveDashboardWithCharts(charts) {
    // check if charts are being saved with dashboard, then  either dashboard or chart must have dynamic_time_period
    if (charts.length) {
      if (!this.state.dashboardSettings.dynamic_time_period && !charts[0].dynamic_time_period) {
        alertService.showToast('error', 'Date period must be selected either at Dashboard or Chart level');
        return;
      }
    }
    // timestamp calculation for dashboard_name in case none has been entered
    const tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -5);

    //validate if custom layout width is not empty
    let otherSettings = this.giveDashboardOtherSettings();
    let hasLayoutSizeInputError = false;
    let error_msg = '';

    if (otherSettings.layout_setting.type === 'custom' && (otherSettings.layout_setting.width === '' || otherSettings.layout_setting.height === '')) {
      error_msg = 'Please enter canvas width and height in pixel.';
      hasLayoutSizeInputError = true;
      if (otherSettings.layout_setting.width === '' && otherSettings.layout_setting.height !== '') error_msg = 'Please enter the canvas width in pixel.';
      if (otherSettings.layout_setting.width !== '' && otherSettings.layout_setting.height === '') error_msg = 'Please enter the canvas height in pixel.';

    } else if (otherSettings.layout_setting.type === 'preset' && (otherSettings.layout_setting.device_category === '' || otherSettings.layout_setting.device === '')) {
      hasLayoutSizeInputError = true;
      error_msg = 'Please select the preset device category and device.';

    } else if (otherSettings.layout_setting.type === 'auto' && otherSettings.layout_setting.width !== this.getDefaultViewModeCanvsWidth()) {
      otherSettings['layout_setting'] = this.getDefaultLayoutSettings({ gridColWidth: this.state.gridColWidth, gridRowHeight: this.state.gridRowHeight });
    }

    this.setState({
      dashboardErrObj: { error: hasLayoutSizeInputError, msg: error_msg }
    });
    if (hasLayoutSizeInputError) { return false; }
    if (otherSettings['layout_settings']) delete otherSettings['layout_settings']; //delete older key

    let payload = {
      terminal: this.state.terminal_type,
      dashboard_name: this.state.dashboardSettings.name || `D-Untitled_${localISOTime}`,
      dashboard_description: this.state.dashboardSettings.description,
      dynamic_time_period: this.state.dashboardSettings.dynamic_time_period,
      filters: this.state.dashboardSettings.filters,
      is_default: this.state.dashboardSettings.is_default,
      dashboard_config: charts || [],
      dashboard_other_settings: JSON.stringify(otherSettings)
    };
    // add 'tag' key in payload only if tags were added
    if (this.state.dashboardSettings.tags.length) {
      payload.tags = this.state.dashboardSettings.tags;
    }

    this.setState({ chartOrDashboardSaveInProcess: true });
    APIService.apiRequest(Constants.API_BASE_URL + '/trend_master/save_dashboard', payload, false, 'POST', this.controller)
      .then(response => {
        if (response.status === 1) {
          const successMsg = payload.dashboard_config.length ? 'Dashboard Created and Charts saved successfully' : 'Dashboard Created Successfully';
          alertService.showToast('success', successMsg);

          let updatedDashboardSettings = { ...this.state.dashboardSettings };

          //update the size of auto width and height settings
          if (otherSettings.layout_setting.type === 'auto' && otherSettings.layout_setting.width !== this.getDefaultViewModeCanvsWidth()) {
            updatedDashboardSettings['dashboard_other_settings']['layout_setting'] = this.getDefaultLayoutSettings({ gridColWidth: this.state.gridColWidth, gridRowHeight: this.state.gridRowHeight });
          }

          let stateObj = {
            chartOrDashboardSaveInProcess: false,
            dashboardSettings: updatedDashboardSettings,
            dashboardSettingsLastSaved: { ...updatedDashboardSettings }
          };

          //reset to default widget size to small widget size
          // if(saved_layout_width <= CHART_DIMENSIONS.defaultWidth){
          //   updatedChartDimensions['defaultWidth'] = updatedChartDimensions['smWidth'];
          //   updatedChartDimensions['defaultHeight'] = updatedChartDimensions['smHeight'];
          //   stateObj['chart_dimensions'] = updatedChartDimensions; 
          // } else {
          //   stateObj['chart_dimensions'] = {...CHART_DIMENSIONS}; //reset to default widget size
          // }

          this.setState(stateObj);

          // Update the parent component about addition of dashboard so that dashboard list in Home tab can be updated
          // Also this tab will now appear in Edit mode and hence be reloaded by parent component, so no need to update any variables here
          let newDashData = response.dashboard[0];
          // delete newDashData.dashboard_config;
          this.props.onDashboardSaveOrEdit(newDashData);

        } else {
          this.setState({ chartOrDashboardSaveInProcess: false });
        }
      })
      .catch(err => {
        this.setState({ chartOrDashboardSaveInProcess: false });
        console.log('Error: ' + err.message);
      });
  }

  editDashboard(keySpecificPayload = null, msg = null) {
    // Do some validations
    let otherSettings = this.giveDashboardOtherSettings();
    const dSettings = this.state.dashboardSettings;
    if (dSettings.name.trim() === '') {
      alertService.showToast('error', 'Dashboard name cannot be blank');
      return;
    }

    let payload = {};
    if (keySpecificPayload) {
      payload = keySpecificPayload;
    } else {
      //validate if custom layout width is not empty
      let hasLayoutSizeInputError = false;
      let error_msg = '';

      if (otherSettings.layout_setting.type === 'custom' && (otherSettings.layout_setting.width === '' || otherSettings.layout_setting.height === '')) {
        error_msg = 'Please enter canvas width and height in pixel.';
        hasLayoutSizeInputError = true;
        if (otherSettings.layout_setting.width === '' && otherSettings.layout_setting.height !== '') error_msg = 'Please enter the canvas width in pixel.';
        if (otherSettings.layout_setting.width !== '' && otherSettings.layout_setting.height === '') error_msg = 'Please enter the canvas height in pixel.';

      } else if (otherSettings.layout_setting.type === 'preset' && (otherSettings.layout_setting.device_category === '' || otherSettings.layout_setting.device === '')) {
        hasLayoutSizeInputError = true;
        error_msg = 'Please select the preset device and size.';

      } else if (otherSettings.layout_setting.type === 'auto' && otherSettings.layout_setting.width !== this.getDefaultViewModeCanvsWidth()) {
        otherSettings['layout_setting'] = this.getDefaultLayoutSettings({ gridColWidth: this.state.gridColWidth, gridRowHeight: this.state.gridRowHeight });
      }

      this.setState({
        dashboardErrObj: { error: hasLayoutSizeInputError, msg: error_msg }
      });
      if (hasLayoutSizeInputError) { return false; }
      if (otherSettings['layout_settings']) delete otherSettings['layout_settings']; //delete older key

      payload = {
        dashboard_name: dSettings.name,
        dashboard_description: dSettings.description,
        dynamic_time_period: dSettings.dynamic_time_period,
        is_default: dSettings.is_default,
        filters: this.state.dashboardSettings.filters,
        dashboard_other_settings: JSON.stringify(otherSettings)
      };
    }

    // construct tags payload
    const prevTags = this.props.dashboardData.tags || [];
    const currTags = this.state.dashboardSettings.tags;
    const addedTags = currTags.filter(t => !prevTags.includes(t));
    const deletedTags = prevTags.filter(t => !currTags.includes(t));
    // add 'tags' key in payload only if tags were changed
    if (addedTags.length || deletedTags.length) {
      payload.tags = { add: addedTags, delete: deletedTags };
    }

    this.setState({ chartOrDashboardSaveInProcess: true });
    APIService.apiRequest(Constants.API_BASE_URL + `/trend_master/edit_dashboard/${dSettings.id}`, payload, false, 'PUT', this.controller)
      .then(response => {
        if (response.status === 1) {
          if (msg === null || msg !== '') {
            alertService.showToast('success', 'Dashboard Edited Successfully');
          }

          const filtersEdited = this.giveDashboardFiltersChangeCount() > 0;
          const periodEdited = this.giveDashboardPeriodChangeCount() > 0;
          let updatedDashboardSettings = { ...this.state.dashboardSettings };

          //update the size of auto width and height settings
          if (otherSettings.layout_setting.type === 'auto' && otherSettings.layout_setting.width !== this.getDefaultViewModeCanvsWidth()) {
            updatedDashboardSettings['dashboard_other_settings']['layout_setting'] = this.getDefaultLayoutSettings({ gridColWidth: this.state.gridColWidth, gridRowHeight: this.state.gridRowHeight });
          }


          let stateObj = {
            chartOrDashboardSaveInProcess: false,
            dashboardSettings: updatedDashboardSettings,
            dashboardSettingsLastSaved: { ...updatedDashboardSettings }
          };

          //change the default width to small width when canvas size is smaller than default width
          // let updatedChartDimensions = {...this.state.chart_dimensions};
          // let saved_layout_width;
          // if (otherSettings.layout_setting.type === 'preset' && Constants.DevicesSizes[otherSettings.layout_setting.device_category] !== undefined) {
          //   let presetindex = Constants.DevicesSizes[otherSettings.layout_setting.device_category].findIndex((e) => e.name === otherSettings.layout_setting.device);
          //   if (presetindex > -1) {
          //     let deviceInfo = Constants.DevicesSizes[otherSettings.layout_setting.device_category][presetindex];
          //     let deviceSize = deviceInfo.size.split('*');
          //     saved_layout_width = deviceSize[0];
          //   }
          // } else {
          //   saved_layout_width = otherSettings.layout_setting.width;
          // }

          //reset to default widget size to small widget size
          // if(saved_layout_width <= CHART_DIMENSIONS.defaultWidth){
          //   updatedChartDimensions['defaultWidth'] = updatedChartDimensions['smWidth'];
          //   updatedChartDimensions['defaultHeight'] = updatedChartDimensions['smHeight'];
          //   stateObj['chart_dimensions'] = updatedChartDimensions; 
          // } else {
          //   stateObj['chart_dimensions'] = {...CHART_DIMENSIONS}; //reset to default widget size
          // }

          this.setState(stateObj);

          // Update the parent component about edition of dashboard so that dashboard list in Home tab can also be updated
          let newDashData = { ...payload };
          // change the format of payload.tags if present
          if (newDashData.tags) {
            newDashData.tags = this.state.dashboardSettings.tags;
          }
          // Refresh the data for all charts if either Dashboard's period OR filters have changed
          if (filtersEdited || periodEdited) {
            this.getChartDataForAllCharts();
          }
          this.props.onDashboardSaveOrEdit(newDashData);
        } else {
          this.setState({ chartOrDashboardSaveInProcess: false });
        }
      })
      .catch(err => {
        this.setState({ chartOrDashboardSaveInProcess: false });
        console.log('Error: ' + err.message);
      });
  }

  editChartToExistingDashboard() {
    const payload = this.giveNewChartSettingsInfo();
    let editedChartIndex = this.state.filteredChartsSettings.findIndex((e) => e.id === this.state.currentChartEditId);
    payload.name = payload.name.trim() || `Untitled Chart ${editedChartIndex + 1}`;

    const chartId = this.state.currentChartEditId;

    // Now to save any band settings(if available), we need to save that in 'chart_plotting_parameters'
    const bandSettings = this.giveNewChartValidBandSettings().map(band => this.giveBandValidParams(band));
    payload.chart_other_settings = payload.chart_other_settings ? JSON.parse(payload.chart_other_settings) : {};
    payload.chart_other_settings['showLegend'] = payload.showLegend;
    if (bandSettings.length) {
      payload.chart_other_settings['band_settings'] = bandSettings;
    }
    payload.chart_other_settings = JSON.stringify(payload.chart_other_settings);
    delete payload.showLegend;
    delete payload.showGrid;

    let apiRequestCount = 1;
    let that = this;
    editAPICall();

    function editAPICall() {
      that.setState({ chartOrDashboardSaveInProcess: true }, () => {
        APIService.apiRequest(Constants.API_BASE_URL + `/trend_master/edit_chart/${chartId}`, payload, false, 'PUT')
          .then(response => {
            if (response.status === 1) {
              // TODO - Below code is needed or not, check later
              let updatedNewChSett = { ...payload, name: payload.name };
              if (bandSettings.length) {
                updatedNewChSett.chart_other_settings = payload.chart_other_settings;
              }
              //    console.log(payload.chart_format_parameters)
              updatedNewChSett['format'] = JSON.parse(payload.chart_format_parameters);
              // updatedNewChSett['ref'] = this.state.newChartSettings.ref;
              // updatedNewChSett['legendRef'] = this.state.newChartSettings.legendRef;
              updatedNewChSett['showLegend'] = updatedNewChSett['segmentation'] !== '' ? 1 : 0;
              updatedNewChSett['showGrid'] = 0;
              if (response.updated_on) {
                updatedNewChSett['updated_on'] = response.updated_on;
              }

              that.setState({
                chartOrDashboardSaveInProcess: false,
                newChartSettings: updatedNewChSett,
                newChartSettingsLastExecuted: { ...updatedNewChSett }
              });
              that.syncNewChartSettingsWithChartsSettingsList(chartId, true);
              // this.storeChartData(chartData, this.state.newChartSettings);
              // this.storeChartBandData(chartBanddata, this.state.newChartSettings);
              // this.syncChartData(chartId);

              //Now render this chart again in the list so that its get updated there as well
              // setTimeout(() => {
              //   this.renderChart(this.state.chartsSettings.find(c => c.id === chartId), 'multiple');
              // }, 100);

              // Now add this chart settings to Dashboard's chart list
              alertService.showToast('success', 'Chart Edited Successfully');
            } else {
              if (apiRequestCount === 1) {
                editAPICall();
                apiRequestCount = apiRequestCount + 1;
              } else {
                that.setState({ chartOrDashboardSaveInProcess: false });
                alertService.showToast('error', 'Error occured in saving chart to dashboard ' + response.message);
              }
            }
          })
          .catch(err => {
            if (apiRequestCount === 1) {
              editAPICall();
              apiRequestCount = apiRequestCount + 1;
            } else {
              that.setState({ chartOrDashboardSaveInProcess: false });
              alertService.showToast('error', 'Error occured in saving chart to dashboard');
              console.log('Error occured in saving chart to dashboard: ' + err.message);
            }
          });
      });
    }
  }

  giveDashboardOtherSettings() {
    let otherSett = {};
    // add view mode dashboardLock status
    otherSett['presentation_lock_on'] = this.state.dashboardSettings.presentationLockOn;
    // add presentation toggles 
    otherSett['presentation_filters'] = this.state.dashboardSettings.presentationFilters;
    // add grid layout settings
    otherSett['chart_grid_layout'] = this.state.tempChartsGridLayout;
    // canvas size related settings
    otherSett['layout_setting'] = this.state.dashboardSettings.dashboard_other_settings.layout_setting;
    otherSett['is_public'] = this.state.dashboardSettings.dashboard_other_settings.is_public!==undefined ? this.state.dashboardSettings.dashboard_other_settings.is_public : false;
    otherSett['public_token'] = this.state.dashboardSettings.dashboard_other_settings.public_token!==undefined ? this.state.dashboardSettings.dashboard_other_settings.public_token : '';
    return otherSett;
  }


  handleChartsSettingsSearch(e, changeChartRender = false) {
    if (!changeChartRender) {
      this.setState({
        chartFiltersSelected: true,
        chartTabSearchInput: e.target.value,
        constructorAllChartSearchFilteredChartsSettings: this.giveFilteredChartsSettings(e.target.value.trim(), this.state.chartTabChartTypeFilter, this.state.chartTabSourceFilter)
      });
    } else {
      this.setState({
        chartFiltersSelected: true,
        chartTabSearchInput: e.target.value,
        filteredChartsSettings: this.giveFilteredChartsSettings(e.target.value.trim(), this.state.chartTabChartTypeFilter, this.state.chartTabSourceFilter)
      }, () => {
        setTimeout(() => {
          this.state.filteredChartsSettings.forEach(cs => {
            this.renderChart(cs);
          });
        });
      });
    }
  }

  handleChartsSettingsFilters(type, val, changeChartRender = true) {
    let obj = {};
    obj['chartFiltersSelected'] = true;
    if (type === 'chart_type') { obj['chartTabChartTypeFilter'] = val; }
    if (type === 'view_type') { obj['chartTabSourceFilter'] = val; }

    const typeFilter = type === 'chart_type' ? val : this.state.chartTabChartTypeFilter;
    const sourceFilter = type === 'view_type' ? val : this.state.chartTabSourceFilter;
    if (!changeChartRender) {
      obj['constructorAllChartSearchFilteredChartsSettings'] = this.giveFilteredChartsSettings(this.state.chartTabSearchInput, typeFilter, sourceFilter);

      this.setState(obj);
    } else {
      obj['filteredChartsSettings'] = this.giveFilteredChartsSettings(this.state.chartTabSearchInput, typeFilter, sourceFilter);

      this.setState(obj, () => {
        setTimeout(() => {
          this.state.filteredChartsSettings.forEach(cs => {
            this.renderChart(cs);
          });
        });
      });
    }
  }

  giveFilteredChartsSettings(searchInp, typeFilter, sourceFilter) {
    return this.state.chartsSettings.filter(chart => {
      const { name, chart_type, view_type } = chart;
      if ((searchInp === '' || name.toLowerCase().includes(searchInp.toLowerCase())) &&
        (typeFilter === 'Widget' ? true : chart_type === typeFilter.toLowerCase())
        && (sourceFilter === 'Source' ? true : view_type === sourceFilter.toLowerCase())) {
        return true;
      }
      return false;
    });
  }

  // Copy Widget
  handleChartCopyBtn(chartId) {
    const chartSettTopCopy = this.state.filteredChartsSettings.find(c => c.id === chartId);
    const copiedSettings = { ...this.getNewChartInitialSettings(), ...chartSettTopCopy };

    this.instantiateNewChartWithGivenSettings(copiedSettings);

    // Now trigger the api for copying chart at server
    this.setState({ chartsLoadingsObj: { ...this.state.chartsLoadingsObj, [copiedSettings.id]: true } });

    const payload = { chart_id: chartId, dashboard_id: this.getDashboardID() };
    APIService.apiRequest(Constants.API_BASE_URL + `/trend_master/copy_chart`, payload, false, 'PUT', this.controller)
      .then(response => {
        if (response.status === 1) {
          // chart copy creatd at backend
          const updatedChartId = Number(response.chart_id);
          // Now update the id at client side in various places - chart settings, chartLayout settings, newChartSettings and newChartSettingsLastExecuted
          const updatedChartsSettings = this.state.filteredChartsSettings.map(c => c.id !== NEW_CHART_ID ? c : { ...c, id: updatedChartId });
          const updatedChartsLayoutSettings = this.state.tempChartsGridLayout.map(c => c.id !== NEW_CHART_ID ? c : { ...c, id: updatedChartId });
          const updatedNewChartSettings = { ...this.state.newChartSettings, id: updatedChartId };
          const updatedNewChartSettingsLastExecuted = { ...this.state.newChartSettingsLastExecuted, id: updatedChartId };

          // Now create a new entry in chartData related state variables and copy the data
          let chartDataToCopy = {
            formattedData: this.state.chartsFormattedData[chartId],
            formattedNetData: this.state.chartsFormattedNetData[chartId],
            segmentationData: this.state.chartsSegmentation[chartId]
          };

          // Format date x-axis if needed
          if (chartDataToCopy.formattedData && chartDataToCopy.formattedData[0]) {
            if (chartDataToCopy.formattedData[0]['date'] != undefined) {
              chartDataToCopy.formattedData.map(item => {
                var temp = Object.assign({}, item);
                temp['date'] = new Date(item['date'])
                return temp
              })
            }
          }
          
          const updatedChartsFormattedData = { ...this.state.chartsFormattedData, [updatedChartId]: [...chartDataToCopy.formattedData] };
          const updatedChartsFormattedNetData = { ...this.state.chartsFormattedNetData, [updatedChartId]: { ...chartDataToCopy.formattedNetData } };
          const updatedChartsSegmentationData = { ...this.state.chartsSegmentation, [updatedChartId]: chartDataToCopy.segmentationData };

          this.setState({
            chartsLoadingsObj: { ...this.state.chartsLoadingsObj, [copiedSettings.id]: false },
            chartsSettings: updatedChartsSettings,
            filteredChartsSettings: updatedChartsSettings,
            tempChartsGridLayout: updatedChartsLayoutSettings,
            newChartSettings: updatedNewChartSettings,
            newChartSettingsLastExecuted: updatedNewChartSettingsLastExecuted,
            chartsFormattedData: updatedChartsFormattedData,
            chartsFormattedNetData: updatedChartsFormattedNetData,
            chartsSegmentation: updatedChartsSegmentationData,
          }, () => {

            this.renderChart(this.state.filteredChartsSettings.find(c => c.id === updatedChartId));
          });
          alertService.showToast('success', 'Chart Copied Successfully');
        } else {
          this.setState({ chartsLoadingsObj: { ...this.state.chartsLoadingsObj, [copiedSettings.id]: false } });
        }
      })
      .catch(err => {
        this.setState({ chartsLoadingsObj: { ...this.state.chartsLoadingsObj, [copiedSettings.id]: false } });
        console.log('error', err);
      });
  }

  handleChartEditBtn(chartId) {
    // copy chart data of clicked index to newChartSettings and open the constructor tab
    const cIndex = this.state.filteredChartsSettings.findIndex(c => c.id === chartId);
    const cSettings = { ...this.state.filteredChartsSettings[cIndex] };

    this.setState({
      selectedChartIds: [cSettings.id],
      currentChartEditId: chartId,
      newChartSettings: cSettings,
      newChartSettingsLastExecuted: { ...cSettings },
      newChartBandSettings: this.giveBandSettingsFromChartPlottingParams(cSettings, true),
      newChartBandSettingsLastExecuted: this.giveBandSettingsFromChartPlottingParams(cSettings, true),
      chartFormShowTimePresets: cSettings.dynamic_time_period && cSettings.dynamic_time_period.is_dynamic === false ? false : true,
      consolePanelSelectedTab: 'constructor',
      constructorSelectedSubtab: 'first',
      constructorTransitionScreenVisible: false,
      constructorTransitionScreenCurrentSubtab: 'create',
      showWidgetInfo: false,
      showWidgetLegendDetails: false
    });
    if (!this.props.showConsolePanel) { this.props.onPanelToggle(this.getDashboardID(), 'showConsolePanel'); }
  }

  //Remove Chart
  handleChartDeleteBtn(e, chartId) {
    if(chartId===undefined) return;
    if (this.state.legendOpen === chartId) {
      this.handleMinimizeConsolePanel(e);
      this.setState({ legendOpen: null });
    }
    const dashboardId = this.state.dashboardSettings.id;
    const toastId = alertService.showToast('process', 'Please wait ...');

    this.setState({ chartOrDashboardSaveInProcess: true });
    APIService.apiRequest(Constants.API_BASE_URL + `/trend_master/delete_chart/${dashboardId}/${chartId}`, {}, false, 'POST', this.controller)
      .then(response => {
        if (response.status === 1) {
          // Remove the chart from the list
          // Also reset the newChartSettings if chart just deleted was also the chart being edited
          const wasBeingEdited = chartId === this.state.currentChartEditId;
          // let orgChartsGridLayout = this.state.chartsGridLayout.filter(c => c.id !== chartId); //remove deleted chart setting layout
          let updatedTempGridLayouts = this.state.tempChartsGridLayout.filter(c => c.id !== chartId);

          let updatedChartsSettings = this.state.chartsSettings.filter(c => c.id !== chartId);
          let updatedFilteredChartsSettings = this.state.filteredChartsSettings.filter(c => c.id !== chartId);

          let updatedChartsFormattedData = JSON.parse(JSON.stringify(this.state.chartsFormattedData));
          let updatedChartsFormattedNetData = JSON.parse(JSON.stringify(this.state.chartsFormattedNetData));
          let updatedChartsSegmentation = JSON.parse(JSON.stringify(this.state.chartsSegmentation));
          let updatedChartsBandData = JSON.parse(JSON.stringify(this.state.chartsBandData));
          let updatedChartsLoadingsObj = { ...this.state.chartsLoadingsObj };

          delete updatedChartsFormattedData[chartId];
          delete updatedChartsFormattedNetData[chartId];
          delete updatedChartsSegmentation[chartId];
          delete updatedChartsBandData[chartId];
          delete updatedChartsLoadingsObj[chartId];

          let updatedState = {
            chartsSettings: updatedChartsSettings,
            filteredChartsSettings: updatedFilteredChartsSettings,
            chartOrDashboardSaveInProcess: false,
            tempChartsGridLayout: updatedTempGridLayouts,
            chartsFormattedData: updatedChartsFormattedData,
            chartsFormattedNetData: updatedChartsFormattedNetData,
            chartsSegmentation: updatedChartsSegmentation,
            chartsBandData: updatedChartsBandData,
            chartsLoadingsObj: updatedChartsLoadingsObj
          };

          if (wasBeingEdited) {
            updatedState['newChartSettings'] = this.getNewChartInitialSettings();
            updatedState['newChartSettingsLastExecuted'] = { ...this.getNewChartInitialSettings() };
            updatedState['currentChartEditId'] = null;
          }

          //on delete remove constructor state to create
          if (this.state.consolePanelSelectedTab === 'constructor' && wasBeingEdited) {
            updatedState['constructorTransitionScreenVisible'] = true;
            updatedState['constructorTransitionScreenCurrentSubtab'] = 'create';
            updatedState['currentChartEditId'] = null;
          }

          this.setState(updatedState, () => {
            //update grid layouts under dashboard config
            this.handleDashboardChartLayoutSave();
          });
          alertService.hideToast(toastId);
          alertService.showToast('success', 'Chart Deleted Successfully');
        } else {
          this.setState({ chartOrDashboardSaveInProcess: false });
        }
      })
      .catch(err => {
        this.setState({ chartOrDashboardSaveInProcess: false })
        console.log('Error occured in saving chart to dashboard: ' + err.message);
      });
  }

  //handle chart show and hide from index list
  handleShowHideChart(id) {
    let updatedFilteredChartSettings = [...this.state.filteredChartsSettings];
    let chartIndex = updatedFilteredChartSettings.findIndex(c => c.id === id);
    updatedFilteredChartSettings[chartIndex]['show'] = updatedFilteredChartSettings[chartIndex]['show'] !== undefined ? !updatedFilteredChartSettings[chartIndex]['show'] : false;

    this.setState({ filteredChartsSettings: updatedFilteredChartSettings }, () => {
      setTimeout(() => {
        this.renderChart(updatedFilteredChartSettings[chartIndex]);
      });
    });
  }


  handleChartResetBtn() {
    if (this.giveConstructorSettingsChangeCount() > 0 || this.giveConstructorBandSettingsChangeCount() > 0) {
      this.setState({ showNewSettingsDiscardMessage: true });
    } else {
      this.discardExistingNewChartSettings();
    }
  }

  handleChartSelection(uniqueKey, actionButtonClicked=false, detailsObj=null) {//toggle check and trigger
    // console.log('widget click triggered');

    const doCoreTask = () => {
      // const selectedCIds = this.state.selectedChartIds.includes(uniqueKey) ? this.state.selectedChartIds.filter(id => id !== uniqueKey) : [uniqueKey];
      const selectedCIds = this.state.selectedChartIds.includes(uniqueKey) ? [...this.state.selectedChartIds] : [uniqueKey];

      // In case of 'click', make the zIndex of chart greater than all charts so that it gets visible above all others
      const maxZIndex = this.updateAndGiveMaxZIndexAmongCharts(uniqueKey);
      let updatedChartsLayout = this.state.tempChartsGridLayout.map(c => c.id !== uniqueKey ? c : { ...c, zindex: maxZIndex });
      
      //for checking and allowing lock on chart on 2nd click when variable is set
      let currentChartIndex = this.state.filteredChartsSettings.findIndex(c => c.id === uniqueKey);
      if(currentChartIndex > -1 && (window.currentSelectedWidget && window.currentSelectedWidget!==uniqueKey)){
        //remove the existing chart lock and then update the window variable
        d3.select('#chart-'+window.currentSelectedWidget+' .trackpad').dispatch('click'); // remove lock on chart widget
        d3.select('#chart-'+window.currentSelectedWidget+' .trackpad').dispatch('mouseout'); // remove lock on chart widget
       
        window.currentSelectedWidget = null;
      }

      //Update the flag so that don't need to click twice to lock the chart
      if(actionButtonClicked){
        window.currentSelectedWidget = uniqueKey;
      }

      //close the panel - if previous and current widget selection was different
      if (window.currentSelectedWidget !== uniqueKey && this.props.dashboardData.showConsolePanel && (this.state.showWidgetInfo || this.state.showWidgetLegendDetails)) {
        this.props.onPanelToggle(this.getDashboardID(), 'showConsolePanel');
      }

      let stateObj = {
        selectedChartIds: selectedCIds,
        tempChartsGridLayout: updatedChartsLayout
      }

      //widget action icon clicked
      if(actionButtonClicked && detailsObj){
        stateObj['consolePanelSelectedTab'] = '';
        stateObj['showWidgetInfo'] = actionButtonClicked==='metainfo' ? detailsObj : false;
        stateObj['showWidgetLegendDetails'] = actionButtonClicked==='legendinfo' ? detailsObj : false;
      }
      
      this.setState(stateObj, () => {
        // this.doChartSelectionAfterTask();
        //open the panel
        if(actionButtonClicked && detailsObj){
          if (!this.props.dashboardData.showConsolePanel) {
            this.props.onPanelToggle(this.getDashboardID(), 'showConsolePanel');
          }
        }
      });
    };

    const chartFormChangeCount = this.giveConstructorSettingsChangeCount() + this.giveConstructorBandSettingsChangeCount() + this.giveConstructorFormatSettingsChangeCount();
    if (chartFormChangeCount === 0) {
      doCoreTask();
    } else {
      this.callbackAfterDiscardScreen = doCoreTask;
      this.setState({ showNewSettingsDiscardMessage: true });
    }
  }

  // doChartSelectionAfterTask() {
  //   // console.log('calling after selection');
  //   // Handle the logic depending on Edit/View mode
  //   const selectedCIds = this.state.selectedChartIds;
  //   if (this.isDashboardInEditMode()) {
  //     // Don't do anything 
      
  //     // Older Version
  //     // Change selected widget as editing one and open console panel
  //     // if (selectedCIds.length === 1) {
  //     //   this.handleChartEditBtn(selectedCIds[0]);
  //     // } else {
  //     //   this.discardExistingNewChartSettings();
  //     //   if (this.props.showConsolePanel) {
  //     //     this.props.onPanelToggle(this.getDashboardID(), 'showConsolePanel');
  //     //   }
  //     // }
  //   } else {
  //     // Don't do anything 

  //     // if (selectedCIds.length === 1) {
  //     //   if (!this.props.showConsolePanel) {
  //     //     this.props.onPanelToggle(this.getDashboardID(), 'showConsolePanel');
  //     //   }
  //     //   this.setState({
  //     //     consolePanelSelectedTab: 'search'
  //     //   }, () => {
  //     //     // scroll the selected widget in the console panel within view
  //     //     const widgetScrollableWrapper = this.chartWidgetsScrollableWrapper.current;
  //     //     const widgetDistanceFromWrapperTop = widgetScrollableWrapper.querySelector(`#chart-widget-${selectedCIds[0]}`).offsetTop;
  //     //     this.animateVerticalScrolling(widgetScrollableWrapper, widgetDistanceFromWrapperTop, 10);
  //     //   });
  //     // } else {
  //     //   this.props.onPanelToggle(this.getDashboardID(), 'showConsolePanel');
  //     // }
  //   }
  // }

  handleChartWidgetClick(e, chartId) {
    if (e.target.type === 'checkbox') return; //allow show/hide view icon click instead of this
    const selectedCIds = this.state.selectedChartIds.includes(chartId) ? this.state.selectedChartIds.filter(id => id !== chartId) : [chartId];

    this.setState({
      selectedChartIds: selectedCIds,
    }, () => {
      const chartsVerticalScrollableWrapper = document.querySelector(`#d-${this.getDashboardID()} #col-charts-wrapper`);
      const chartDistanceFromContainerTop = Number(document.getElementById('chart-' + chartId).style.top.replace('px', ''));
      // scroll the vertical container so that chart clicked comes within view
      this.animateVerticalScrolling(chartsVerticalScrollableWrapper, chartDistanceFromContainerTop, 20);
    });
  }

  animateVerticalScrolling(scrollElement, finalScrollPos, scrollSpeed) {
    // decide the scroll direction by assigning a Sign(+/-) to scrollSpeed
    scrollSpeed = finalScrollPos > scrollElement.scrollTop ? scrollSpeed : -scrollSpeed;
    const scroll = () => {
      if ((scrollSpeed > 0 && scrollElement.scrollTop <= finalScrollPos) || (scrollSpeed < 0 && scrollElement.scrollTop >= finalScrollPos)) {
        const currentScrollTop = scrollElement.scrollTop;
        scrollElement.scrollTop = scrollElement.scrollTop + scrollSpeed;
        const noMoreScrollPossible = currentScrollTop === scrollElement.scrollTop;
        if (!noMoreScrollPossible) {
          requestAnimationFrame(scroll);
        }
      }
    };
    requestAnimationFrame(scroll);
  }

  handleChartAddBtn() {
    this.setState({ consolePanelSelectedTab: 'constructor', showWidgetInfo: false, showWidgetLegendDetails: false });
    this.handleAddNewWidgetBtn();
  }

  removeUnsavedChartFromList() {
    // delete the entry corresponding to 'NEW_CHART_ID' from ChartSetting list and ChartLayoutSettings list
    const updatedCSettList = this.state.filteredChartsSettings.filter(c => c.id !== NEW_CHART_ID);
    const updatedCLayoutSettList = this.state.tempChartsGridLayout.filter(c => c.id !== NEW_CHART_ID);

    this.setState({
      filteredChartsSettings: updatedCSettList,
      chartsSettings: updatedCSettList,
      tempChartsGridLayout: updatedCLayoutSettList
    })

  }

  // Insight related methods
  renderChartsInPointSelectionMode(selectionModeON) {
    this.setState({ insightPointSelectionModeON: selectionModeON });
    setTimeout(() => {
      // redraw all charts in pointSelectionModeON(true) or  pointSelectionModeOFF(false)
      this.state.chartsSettings.forEach(cs => {
        this.renderChart(cs, selectionModeON);
      });
    });
  }

  handleInsightFormNoteForChange(val) {
    this.clearAndCloseInsightInput();

    setTimeout(() => {
      this.setState({ insightFormNoteFor: val });
      if (val === 'Dashboard') {
        // update the placeholder value
        this.insightAddFormQuillDOMRef.current.getEditor().root.dataset.placeholder = 'Add a Note';
        if (this.state.insightPointSelectionModeON) {
          this.renderChartsInPointSelectionMode(false);
        }
      }
    });
  }

  handleInsightFormNoteTypeChange(val) {
    this.setState({ insightFormNoteType: val });
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
    if (this.state.insightFormNoteFor === 'Chart' && this.state.insightNoteAddForm.chartInfo === null) {
      this.insightAddFormQuillDOMRef.current.getEditor().root.dataset.placeholder = 'Select a point on some chart to write note here';
      this.renderChartsInPointSelectionMode(true);
    }
  }

  handleInsightFormInputChange(val) {
    this.setState({ insightNoteAddForm: { ...this.state.insightNoteAddForm, text: val } })
  }

  handleInsightFormAddTagsBtn() {

  }

  clearAndCloseInsightInput() {

    this.insightAddFormQuillDOMRef.current.blur();
    this.setState({
      insightNoteAddForm: { text: '', chartInfo: null },
      insightNoteAddInputExpanded: false
    });
    // again trigger a render by making  a dummy change so that proper classes(ql-blank) on quill gets applied
    setTimeout(() => {
      this.setState({
        insightNoteAddForm: { text: '', chartInfo: null },
      })
    });
  }


  handleInsightFormCancelBtn() {
    this.clearAndCloseInsightInput();
    setTimeout(() => {
      if (this.state.insightFormNoteFor === 'Chart') {
        this.insightAddFormQuillDOMRef.current.getEditor().root.dataset.placeholder = 'Add a Note';
        this.renderChartsInPointSelectionMode(false);
      }
    }, 200);
  }

  handleInsightNoteSaveBtn() {
    let payload;
    // Check if saving for Dashbaord or for Chart
    if (this.state.insightFormNoteFor === 'Dashboard') {
      payload = {
        dashboard_id: this.getDashboardID(),
        note: this.state.insightNoteAddForm.text,
      };
    } else {
      payload = {
        chart_id: this.state.insightNoteAddForm.chartInfo.id,
        note: this.state.insightNoteAddForm.text,
        x_axis_point: this.state.insightNoteAddForm.chartInfo.xPoint
      };
      if (this.state.insightNoteAddForm.chartInfo.segmentName && this.state.insightNoteAddForm.chartInfo.segmentValue) {
        payload.segmentation = JSON.stringify({ name: this.state.insightNoteAddForm.chartInfo.segmentName, value: this.state.insightNoteAddForm.chartInfo.segmentValue });
      }
    }


    this.setState({ chartOrDashboardSaveInProcess: true });
    APIService.apiRequest(Constants.API_BASE_URL + `/trend_master/note`, payload, false, 'POST', this.controller)
      .then(response => {
        if (response.status === 1) {
          let updatedNotes = this.state.insightNotes;
          if (this.state.insightFormNoteFor === 'Dashboard') {
            // add 'child_notes' key to response.data
            response.data.child_notes = 0;
            updatedNotes['dashboard_notes'] = [...updatedNotes['dashboard_notes'], response.data];
          } else {
            // before storing notes data, format the date if x axis is date
            const chartSetting = this.state.chartsSettings.find(cs => cs.id === payload.chart_id);
            response.data = chartSetting.x_axis === 'date' ? formatChartData([response.data], 'x_axis_point')[0] : response.data;
            updatedNotes['chart_notes'] = [...updatedNotes['chart_notes'], response.data];
          }

          alertService.showToast('success', 'Note Added Successfully');
          this.clearAndCloseInsightInput();

          this.setState({
            chartOrDashboardSaveInProcess: false,
            insightNotes: updatedNotes
          });
          // Rerender the charts if note was added on a chart
          if (this.state.insightFormNoteFor === 'Chart') {
            this.renderChartsInPointSelectionMode(false);
          }
        } else {
          this.setState({ chartOrDashboardSaveInProcess: false });
        }
      })
      .catch(err => {
        this.setState({ chartOrDashboardSaveInProcess: false })
        console.log('Error occured in adding note to chart: ' + err.message);
      });
  }

  handleInsightNoteSaveChangesBtn(parentNoteId) {
    let payload = {
      note: this.state.insightEditNoteForm.text,
    };

    this.setState({ chartOrDashboardSaveInProcess: true });
    APIService.apiRequest(Constants.API_BASE_URL + `/trend_master/note/${this.state.insightEditNoteId}`, payload, false, 'PUT', this.controller)
      .then(response => {
        if (response.status === 1) {

          let updatedState = {
            chartOrDashboardSaveInProcess: false,
            insightEditNoteId: null,
            insightEditNoteForm: { text: '', chartInfo: null }
          };

          if (parentNoteId) {
            // child note is edited, update its info in replies list
            const updatedReplies = this.state.insightNotesReplies[parentNoteId].map(n => n.id !== this.state.insightEditNoteId ? n : { ...n, note: payload.note });
            updatedState.insightNotesReplies = { ...this.state.insightNotesReplies, [parentNoteId]: updatedReplies }
          } else {
            let updatedNoteList;
            if (this.state.insightFormNoteFor === 'Dashboard') {
              updatedNoteList = this.state.insightNotes.dashboard_notes.map(n => n.id !== this.state.insightEditNoteId ? n : ({ ...n, note: payload.note }))
              updatedState.insightNotes = { ...this.state.insightNotes, dashboard_notes: updatedNoteList };
            } else {
              updatedNoteList = this.state.insightNotes.chart_notes.map(n => n.id !== this.state.insightEditNoteId ? n : ({ ...n, note: payload.note }))
              updatedState.insightNotes = { ...this.state.insightNotes, chart_notes: updatedNoteList };
            }
          }

          this.setState(updatedState);
          alertService.showToast('success', 'Note Edited Successfully');

        } else {
          this.setState({ chartOrDashboardSaveInProcess: false });
        }
      })
      .catch(err => {
        this.setState({ chartOrDashboardSaveInProcess: false })
        console.log('Error occured in editing note: ' + err.message);
      });
  }

  handleInsightNoteReplySaveBtn() {
    let payload;
    // Check if saving for Dashbaord or for Chart
    if (this.state.insightFormNoteFor === 'Dashboard') {
      payload = {
        dashboard_id: this.getDashboardID(),
        note: this.state.insightReplyNoteForm.text,
        parent_note_id: this.state.insightReplyNoteId
      };
    } else {
      payload = {
        chart_id: this.state.insightReplyNoteForm.chartInfo.id,
        note: this.state.insightReplyNoteForm.text,
        x_axis_point: this.state.insightReplyNoteForm.chartInfo.xPoint,
        parent_note_id: this.state.insightReplyNoteId
      };
      if (this.state.insightReplyNoteForm.chartInfo.segmentName && this.state.insightReplyNoteForm.chartInfo.segmentValue) {
        payload.segmentation = JSON.stringify({ name: this.state.insightReplyNoteForm.chartInfo.segmentName, value: this.state.insightReplyNoteForm.chartInfo.segmentValue });
      }
    }


    this.setState({ chartOrDashboardSaveInProcess: true });
    APIService.apiRequest(Constants.API_BASE_URL + `/trend_master/note`, payload, false, 'POST', this.controller)
      .then(response => {
        if (response.status === 1) {
          let updatedNotesReplies = { ...this.state.insightNotesReplies };
          let newReplyNote;
          if (this.state.insightFormNoteFor === 'Dashboard') {
            newReplyNote = response.data;
          } else {
            // before storing notes data, format the date if x axis is date
            const chartSetting = this.state.chartsSettings.find(cs => cs.id === payload.chart_id);
            response.data = chartSetting.x_axis === 'date' ? formatChartData([response.data], 'x_axis_point')[0] : response.data;
            newReplyNote = response.data;
          }

          let updatedRepliesList = updatedNotesReplies[this.state.insightReplyNoteId] || [];
          updatedRepliesList.push(newReplyNote);
          updatedNotesReplies[this.state.insightReplyNoteId] = updatedRepliesList;

          // Also update the 'child_notes' property for parent note
          let updatedNotes = this.state.insightNotes;
          if (this.state.insightFormNoteFor === 'Dashboard') {
            updatedNotes['dashboard_notes'] = updatedNotes['dashboard_notes'].map(n => n.id !== this.state.insightReplyNoteId ? n : { ...n, child_notes: n.child_notes + 1 });
          } else {
            updatedNotes['chart_notes'] = updatedNotes['chart_notes'].map(n => n.id !== this.state.insightReplyNoteId ? n : { ...n, child_notes: n.child_notes + 1 });
          }

          alertService.showToast('success', 'Note Added Successfully');

          // Remove Focus of note reply editor
          this.insightReplyFormsQuillDOMRefs[this.state.insightReplyNoteId].blur();

          this.setState({
            chartOrDashboardSaveInProcess: false,
            insightNotesReplies: updatedNotesReplies,
            insightReplyNoteId: null,
            insightReplyNoteForm: { text: '', chartInfo: null },
            insightNotes: updatedNotes
          });

        } else {
          this.setState({ chartOrDashboardSaveInProcess: false });
        }
      })
      .catch(err => {
        this.setState({ chartOrDashboardSaveInProcess: false })
        console.log('Error occured in adding note to chart: ' + err.message);
      });
  }

  handleInsightViewThreadBtn(noteId) {
    if (this.state.insightNotes.dashboard_notes.find(n => n.id === noteId).child_notes === 0) {
      this.setState({
        insightNotesExpanded: { ...this.state.insightNotesExpanded, [noteId]: true },
        insightReplyNoteId: noteId
      });
      return;
    }
    if (this.state.insightNotesReplies[noteId]) {
      // note replies already fetched, so just toggle the visibility of replies
      const isExpanded = this.state.insightNotesExpanded[noteId];
      this.setState({
        insightNotesExpanded: { ...this.state.insightNotesExpanded, [noteId]: !isExpanded }
      })
    } else {
      // check if thread/replied notes alrady available or not
      this.getDashboardInsightChildNotes(noteId);
    }
  }

  giveChartNotesById(chartId) {
    if (this.state.insightNotes && chartId !== null) {
      let notes = [];
      this.state.insightNotes.chart_notes.forEach(cn => {
        if (cn.chart_id === chartId) { notes.push(cn) }
      });
      return notes;
    }
    return null;
  }

  handleInsightNoteEditBtn(charOrDashbaord, noteId, parentNoteId) {
    let noteInfo;
    if (parentNoteId) {
      // Note being edited is a child note, search for this in noteReplies map
      noteInfo = this.state.insightNotesReplies[parentNoteId].find(n => n.id === noteId);
    } else {
      // Note being edited is a parent note
      if (charOrDashbaord === 'Dashboard') {
        noteInfo = this.state.insightNotes.dashboard_notes.find(n => n.id === noteId);
      } else {
        noteInfo = this.state.insightNotes.chart_notes.find(n => n.id === noteId);
      }
    }


    this.setState({
      insightNoteAddInputExpanded: false, // close add form input if opened
      insightOpenedOptionsNoteId: null,
      insightEditNoteId: noteId,
      insightEditNoteForm: { text: noteInfo.note, chartInfo: null }
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
    if (this.state.insightNotes.dashboard_notes.find(n => n.id === currentFocusedReplyNoteId).child_notes === 0) {
      this.setState({
        insightNotesExpanded: { ...this.state.insightNotesExpanded, [currentFocusedReplyNoteId]: false },
      });
    }
  }

  handleInsightNoteDeleteBtn(charOrDashbaord, noteId, parentNoteId) {
    this.setState({ chartOrDashboardSaveInProcess: true });
    APIService.apiRequest(Constants.API_BASE_URL + `/trend_master/note/${noteId}`, {}, false, 'DELETE', this.controller)
      .then(response => {
        if (response.status === 1) {
          let updatedState = {
            chartOrDashboardSaveInProcess: false,
          };

          if (parentNoteId) {
            // child note is deleted, remove it from reply list
            const updatedReplies = this.state.insightNotesReplies[parentNoteId].filter(n => n.id !== noteId);
            updatedState.insightNotesReplies = { ...this.state.insightNotesReplies, [parentNoteId]: updatedReplies }
            // Also update the 'child_notes' property of parent note
            if (charOrDashbaord === 'Dashboard') {
              updatedState.insightNotes = { ...this.state.insightNotes, dashboard_notes: this.state.insightNotes.dashboard_notes.map(n => n.id !== parentNoteId ? n : { ...n, child_notes: n.child_notes - 1 }) };
            } else {
              updatedState.insightNotes = { ...this.state.insightNotes, chart_notes: this.state.insightNotes.chart_notes.map(n => n.id !== parentNoteId ? n : { ...n, child_notes: n.child_notes - 1 }) };
            }
          } else {
            if (charOrDashbaord === 'Dashboard') {
              updatedState.insightNotes = { ...this.state.insightNotes, dashboard_notes: this.state.insightNotes.dashboard_notes.filter(n => n.id !== noteId) }
            } else {
              updatedState.insightNotes = { ...this.state.insightNotes, chart_notes: this.state.insightNotes.chart_notes.filter(n => n.id !== noteId) }
            }

            if (!parentNoteId && charOrDashbaord === 'Chart') {
              // Rerender the charts so that note deleted gets removed from Chart as well
              this.renderChartsInPointSelectionMode(false);
            }
          }
          this.setState(updatedState);
          alertService.showToast('success', 'Note Deleted Successfully');
        } else {
          this.setState({ chartOrDashboardSaveInProcess: false });
        }
      })
      .catch(err => {
        this.setState({ chartOrDashboardSaveInProcess: false })
        console.log('Error occured in adding note to chart: ' + err.message);
      });
  }

  // share related methods
  getSharedUsersList() {
    this.setState({ loadingSharedUsers: true });
    APIService.apiRequest(Constants.API_BASE_URL + `/trend_master/share/${this.getDashboardID()}`, {}, false, 'GET', this.controller)
      .then(response => {
        if (response.status === 1) {
          // remove self from sharedUser list
          this.setState({
            sharedUsers: this.user ? response.data.filter(s => s.user.id !== this.user.id) : response.data,
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
        shareNewFormSelectedOrganisation: this.state.organisationList[0]
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
          this.setState({ organisationList: response.data, shareNewFormSelectedOrganisation: response.data[0], loadingOrganisations: false });
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
            userList: this.user ? response.data.filter(u => u.id !== this.user.id) : response.data,
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

  handleShareOrganisationSelect(org) {
    this.setState({ shareNewFormSelectedOrganisation: org, shareNewFormSelectedUsers: [] });
    // fetch the user for selected organisation 
    this.getUserListOfOrganisation(org.id);
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
    if (!this.state.shareNewFormSelectedOrganisation) {
      alertService.showToast('error', 'Please select an Organisation');
      return;
    }
    if (this.state.shareNewFormSelectedUsers.length === 0) {
      alertService.showToast('error', 'Users must be selected');
      return;
    }
    if (this.state.shareNewChartsIDsSelected.length === 0) {
      alertService.showToast('error', 'Charts for access must be selected');
      return;
    }

    let payload = {
      dashboard_id: this.getDashboardID(),
      privileges: this.state.shareNewFormSelectedAuthorizations.toString(),
      user_ids: this.state.shareNewFormSelectedUsers.map(user => user.id),
      is_full_dashboard: 1,
      chart_ids: []
    };

    if (this.state.shareNewChartsIDsSelected.length === this.state.chartsSettings.length) {
      payload.is_full_dashboard = 1;
      payload.chart_ids = [];
    } else {
      payload.is_full_dashboard = 0;
      payload.chart_ids = this.state.shareNewChartsIDsSelected;
    }

    this.setState({ chartOrDashboardSaveInProcess: true });
    APIService.apiRequest(Constants.API_BASE_URL + '/trend_master/share', payload, false, 'POST', this.controller)
      .then(response => {
        if (response.status === 1) {
          alertService.showToast('success', 'Dashboard shared successfully');
          this.setState({
            chartOrDashboardSaveInProcess: false,
            // reset form variables
            shareNewFormSelectedOrganisation: null,
            shareNewFormSelectedUsers: [],
            shareNewFormSelectedAuthorizations: ['VIEW'],
            shareNewChartSearch: '',
            shareNewChartsIDsSelected: [],
            // shareShowNewForm: false
          }, () => {
            // Refresh the share list
            this.getSharedUsersList();
          });
        } else {
          this.setState({ chartOrDashboardSaveInProcess: false });
        }
      })
      .catch(err => {
        this.setState({ chartOrDashboardSaveInProcess: false })
        console.log('Error occured in Sharing dashboard: ' + err.message);
      });
  }

  handleShareNewFormReset() {
    this.setState({
      // reset form variables
      shareNewFormSelectedOrganisation: this.state.organisationList[0],
      shareNewFormSelectedUsers: [],
      shareNewFormSelectedAuthorizations: ['VIEW'],
      shareNewChartsIDsSelected: [],
      shareNewOrgSearch: '',
      shareNewUserSearch: '',
      shareNewChartSearch: '',
    });
  }

  handleShareEditBtn(shareInfo) {
    let chartIDs = [];
    if (shareInfo.is_full_dashboard) {
      chartIDs = this.state.chartsSettings.map(c => c.id)
    } else {
      chartIDs = shareInfo.dashboard_config.split(',').filter(x => x !== '').map(x => +x);
    }
    this.setState({
      shareEditUserInfo: shareInfo,
      shareEditSelectedAuthorizations: shareInfo.privileges.split(','),
      shareEditChartsIDsSelected: chartIDs,
      shareEditChartSearch: ''
    });
  }

  handleShareEditAuthSelect(auth) {
    const currAuths = this.state.shareEditSelectedAuthorizations;
    const newAuths = currAuths.includes(auth) ? currAuths.filter(a => a !== auth) : [...currAuths, auth];
    this.setState({ shareEditSelectedAuthorizations: newAuths });
  }

  handleShareEditChartSelect(chartID) {
    const currChartIds = this.state.shareEditChartsIDsSelected;
    const newChartIds = currChartIds.includes(chartID) ? currChartIds.filter(c => c !== chartID) : [...currChartIds, chartID];
    this.setState({ shareEditChartsIDsSelected: newChartIds });
  }

  handleShareEditChartSelectAll(checked) {
    const currChartIds = checked ? this.state.chartsSettings.map(c => c.id) : [];
    this.setState({ shareEditChartsIDsSelected: currChartIds });
  }

  handleShareNewChartSelect(chartID) {
    const currChartIds = this.state.shareNewChartsIDsSelected;
    const newChartIds = currChartIds.includes(chartID) ? currChartIds.filter(c => c !== chartID) : [...currChartIds, chartID];
    this.setState({ shareNewChartsIDsSelected: newChartIds });
  }

  handleShareNewChartSelectAll(checked) {
    const currChartIds = checked ? this.state.chartsSettings.map(c => c.id) : [];
    this.setState({ shareNewChartsIDsSelected: currChartIds });
  }

  handleShareEditCancelBtn() {
    this.setState({
      shareEditUserInfo: null,
      shareEditChartsIDsSelected: [],
      shareEditChartSearch: ''
    });
  }

  handleShareEditSubmitBtn() {
    let payload = {
      dashboard_id: this.getDashboardID(),
      privileges: this.state.shareEditSelectedAuthorizations.toString(),
      user_ids: [this.state.shareEditUserInfo.user.id],
    };

    if (this.state.shareEditChartsIDsSelected.length === 0) {
      alertService.showToast('error', 'Charts for access must be selected');
      return;
    }

    // check full dashboard access
    if (this.state.shareEditChartsIDsSelected.length === this.state.chartsSettings.length) {
      payload.is_full_dashboard = 1;
    } else {
      payload.is_full_dashboard = 0;
    }
    payload.chart_ids = this.state.shareEditChartsIDsSelected;

    this.setState({ chartOrDashboardSaveInProcess: true });
    APIService.apiRequest(Constants.API_BASE_URL + '/trend_master/share', payload, false, 'PUT', this.controller)
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
                is_full_dashboard: payload.is_full_dashboard,
                dashboard_config: payload.chart_ids.toString()
              };
            }
            return u;
          });
          // reset some other variables
          updatedState.chartOrDashboardSaveInProcess = false;
          updatedState.shareEditUserInfo = null;
          updatedState.shareEditChartSearch = '';
          updatedState.shareEditChartsIDsSelected = [];
          updatedState.shareEditSelectedAuthorizations = [];

          this.setState(updatedState);
        } else {
          this.setState({ chartOrDashboardSaveInProcess: false });
        }
      })
      .catch(err => {
        this.setState({ chartOrDashboardSaveInProcess: false })
        console.log('Error occured in Editing share config: ' + err.message);
      });
  }

  handleShareEditDeleteBtn(shareId) {
    this.setState({ chartOrDashboardSaveInProcess: true });
    APIService.apiRequest(Constants.API_BASE_URL + `/trend_master/share/${shareId}`, {}, false, 'DELETE', this.controller)
      .then(response => {
        if (response.status === 1) {
          alertService.showToast('success', 'Access Revoked successfully');
          this.setState({
            sharedUsers: this.state.sharedUsers.filter(s => s.id !== shareId),
            chartOrDashboardSaveInProcess: false,
            shareEditPopupUserID: null
          });
        } else {
          this.setState({ chartOrDashboardSaveInProcess: false });
        }
      })
      .catch(err => {
        this.setState({ chartOrDashboardSaveInProcess: false })
        console.log('Error occured in Revoking share : ' + err.message);
      });
  }


  //get chart grid cols count and classes
  getChartsGridDetails() {
    let display_charts_count = 3;
    let charts_wrapper_classes = 'full-width';
    if (this.props.showConsolePanel) {
      charts_wrapper_classes = 'col-75 ' + this.props.consolePanelPosition;
      display_charts_count = 2;
    }
    return { display_charts_count: display_charts_count, charts_wrapper_classes: charts_wrapper_classes };
  }


  //On Console Button Drag/Drop Start
  handleConsolePanelDragStart(e, id) {
    e.stopPropagation();
    e.preventDefault();
    if(e.button !== 0) return;

    let element = document.querySelector('#d-' + this.getDashboardID() + ' #' + id);
    document.addEventListener('mousemove', consolePanelMove);
    document.addEventListener('mouseup', consolePanelDrop);
    element.classList.add('mousedown');

    let attached_element = null;
    if (id === 'console-content-wrapper') {
      attached_element = document.querySelector('#d-' + this.getDashboardID() + ' #console-tabs-wrapper');
    } else {
      if (document.querySelector('#d-' + this.getDashboardID() + ' #console-content-wrapper')) {
        attached_element = document.querySelector('#d-' + this.getDashboardID() + ' #console-content-wrapper');
      }
    }

    let updatedConstructorPanelPosition = this.props.consolePanelPosition;
    let consoleButtonTop = element.getBoundingClientRect().top;
    let consoleButtonLeft = element.getBoundingClientRect().left;
    let consoleButtonRight = element.getBoundingClientRect().right;
    let currentConsoleDragStartXY = { x: e.pageX, y: e.pageY };
    let consoleAttachedEleTop;

    if (attached_element) {
      consoleAttachedEleTop = attached_element.getBoundingClientRect().top;
    }

    //when console position is right
    let leftTransform = (currentConsoleDragStartXY.x - consoleButtonRight);
    let topTransform = (currentConsoleDragStartXY.y - consoleButtonTop);
    let attachedEleTopTransform;
    if (attached_element) { attachedEleTopTransform = (currentConsoleDragStartXY.y - consoleAttachedEleTop); }
    if (leftTransform < 0) {
      leftTransform = window.innerWidth - currentConsoleDragStartXY.x;
    }

    //when console position is left
    if (updatedConstructorPanelPosition === 'left') {
      leftTransform = (currentConsoleDragStartXY.x - consoleButtonLeft);
    }

    let that = this;
    function consolePanelMove(e) {
      element.style.top = (e.pageY - topTransform) + 'px';
      if (attached_element) { attached_element.style.top = (e.pageY - attachedEleTopTransform) + 'px'; }

      if (updatedConstructorPanelPosition === 'left') {
        element.style.left = (e.pageX - leftTransform) + 'px';
        element.style.right = 'auto';

        if (attached_element) {
          attached_element.style.left = (e.pageX - leftTransform) + 'px';
          attached_element.style.right = 'auto';
        }
      } else {
        element.style.right = (window.innerWidth - e.pageX - leftTransform) + 'px';
        element.style.left = 'auto';

        if (attached_element) {
          attached_element.style.right = (window.innerWidth - e.pageX - leftTransform) + 'px'
          attached_element.style.left = 'auto';
        }
      }

      element.style.userSelect = 'none';
      if (attached_element) { attached_element.style.userSelect = 'none'; }
      document.body.style.userSelect = 'none';
      // that.consoleDrag = true; // used for tracking and preventing child element click
    }

    function consolePanelDrop(e) {
      e.stopPropagation();

      document.removeEventListener('mousemove', consolePanelMove);
      document.removeEventListener('mouseup', consolePanelDrop);
      element.classList.remove('mousedown');

      if (id === 'console-content-wrapper') {
        element.style.top = that.props.isPublicView!==undefined ? '35px' : '65px';
        attached_element.style.top = 'auto';
        attached_element.style.bottom = '5px';
      } else {
        element.style.top = 'auto';
        if (attached_element) { 
          attached_element.style.top = that.props.isPublicView!==undefined ? '35px' : '65px';
        }
      }

      if ((window.innerWidth - e.pageX) < window.innerWidth / 2) { // right
        updatedConstructorPanelPosition = 'right';
        element.style.left = 'auto';
        element.style.right = 0;

        if (attached_element) {
          attached_element.style.left = 'auto';
          attached_element.style.right = 0;
        }
      } else { // left
        updatedConstructorPanelPosition = 'left';
        element.style.left = '0';
        element.style.right = 'auto';

        if (attached_element) {
          attached_element.style.left = '0';
          attached_element.style.right = 'auto';
        }
      }

      that.props.onPanelPositionChange(that.props.dashboardData.id, updatedConstructorPanelPosition);
    }
  }


  autoScrollChartWrapperIfNeeded(movingElementRef, colChartWrapperDivRef, multiChartsScrollableContainerRef, multiChartsContainerUsableWidth, thisRef) {
    const scrollThreshold = 5;
    const bottomThresholdExcess = movingElementRef.getBoundingClientRect().bottom - (window.innerHeight - scrollThreshold);
    // console.log('near',bottomThreshold);
    const topScrollExcess = (65 + scrollThreshold) - movingElementRef.getBoundingClientRect().top;
    const leftScrollExcess = thisRef.props.consolePanelPosition === 'right' ? scrollThreshold - movingElementRef.getBoundingClientRect().left : (scrollThreshold + 355 - movingElementRef.getBoundingClientRect().left);
    const rightScrollExcess = thisRef.props.consolePanelPosition === 'right' ? movingElementRef.getBoundingClientRect().right - (window.innerWidth - 355 - scrollThreshold) : movingElementRef.getBoundingClientRect().right - (window.innerWidth - scrollThreshold);

    const verticalScrollNeeded = bottomThresholdExcess > 0 || topScrollExcess > 0;
    const hotizontalScrollNeeded = leftScrollExcess > 0 || rightScrollExcess > 0;


    if (verticalScrollNeeded || hotizontalScrollNeeded) {
      window.scrollYSpeed = bottomThresholdExcess > 0 ? 10 : -10;
      window.scrollXSpeed = rightScrollExcess > 0 ? 10 : -10;

      if (!window.isScrolling) {
        const scroll = () => {
          const currentYScroll = colChartWrapperDivRef.scrollTop;
          const currentXScroll = multiChartsScrollableContainerRef.scrollLeft;
          let scrollYCompleted, scrollXCompleted;

          if (verticalScrollNeeded) {
            colChartWrapperDivRef.scrollTop = currentYScroll + window.scrollYSpeed;
            scrollYCompleted = bottomThresholdExcess > 0 ? colChartWrapperDivRef.scrollTop <= currentYScroll : colChartWrapperDivRef.scrollTop === 0;
          }
          if (hotizontalScrollNeeded) {
            multiChartsScrollableContainerRef.scrollLeft = currentXScroll + window.scrollXSpeed;
            scrollXCompleted = rightScrollExcess > 0 ? multiChartsScrollableContainerRef.scrollLeft <= currentXScroll : thisRef.multiChartsScrollableWrapper.current.scrollLeft === 0;
          }

          let requestScrollInNextFrame = false;
          if (window.isScrolling && verticalScrollNeeded && !scrollYCompleted) {
            // console.log('scroll- scrolling window ', window.scrollYSpeed);
            movingElementRef.style.top = Math.max(0, Number(movingElementRef.style.top.replace('px', '')) + window.scrollYSpeed) + 'px';
            requestScrollInNextFrame = true;
          }
          if (window.isScrolling && hotizontalScrollNeeded && !scrollXCompleted) {
            movingElementRef.style.left = Math.max(0, Math.min(Number(movingElementRef.style.left.replace('px', '')) + window.scrollXSpeed, multiChartsContainerUsableWidth - movingElementRef.getBoundingClientRect().width)) + 'px';
            requestScrollInNextFrame = true;
          }
          if (window.isScrolling && requestScrollInNextFrame) {
            window.requestAnimationFrame(scroll);
            return;
          }
          // console.log('scroll- scrolling stopped ');
          window.isScrolling = false;
        };

        window.isScrolling = true;
        window.requestAnimationFrame(scroll);
      }
    } else {
      window.isScrolling = false;
    }
  }



  //On chart widget drag and drop
  onChartWidgetDragStart(e, id) {
    //console.log('drag start');
    e.stopPropagation();

    if (e.button !== 0) return;
    //to handle initial drag and drop
    if (this.state.initialConstructorDrag) {
      this.setState({ initialConstructorDrag: false });
      return;
    }

    let element = document.getElementById('chart-' + id);
    document.addEventListener('mousemove', chartWidgetMove);
    document.addEventListener('mouseup', chartWidgetDrop);
    element.classList.add('mousedown');

    this.handleChartSelection(id); // add selection

    const widgetCordinates = element.getBoundingClientRect();
    const distBwChartLeftEdgeAndMouseX = e.pageX - widgetCordinates.left;
    const distBwChartTopEdgeAndMouseY = e.pageY - widgetCordinates.top;

    let updatedTempGridLayouts = [...this.state.tempChartsGridLayout];
    let chartLayoutIndex = updatedTempGridLayouts.findIndex((e) => e.id === id);
    let updatedZIndex = this.updateAndGiveMaxZIndexAmongCharts(id);

    const colChartWrapperDiv = document.querySelector(`#d-${this.getDashboardID()} #col-charts-wrapper`);
    const multiChartsScrollableContainer = this.multiChartsScrollableWrapper.current;
    const multiChartsContainer = multiChartsScrollableContainer.querySelector('#multicharts-wrapper');
    const multiChartsContainerUsableWidth = multiChartsContainer.getBoundingClientRect().width - Number(window.getComputedStyle(multiChartsContainer).getPropertyValue(`padding-${this.props.consolePanelPosition}`).replace('px', ''));
    const multiChartsContainerUsableHeight = multiChartsContainer.getBoundingClientRect().height;
    let that = this;
    let mouseMoved = false; // to detect wheather mouse was moved/dragged before releasing the mouse. This will help ignoring the calculation and hence preventing bugs in 'mouseUp' event

    function chartWidgetMove(e) {
      let multiChartsCord = multiChartsContainer.querySelector('#multicharts').getBoundingClientRect();

      // compute mouse X and Y cordinates relative to chart container
      const mouseXRelative = e.pageX - multiChartsCord.left;
      const mouseYRelative = e.pageY - multiChartsCord.top;

      const canNotBeMovedFurtherLeft = (mouseXRelative - distBwChartLeftEdgeAndMouseX) < 0;
      const canNotBeMovedFurtherRight = (mouseXRelative - distBwChartLeftEdgeAndMouseX + widgetCordinates.width) > multiChartsContainerUsableWidth;
      const canNotBeMovedFurtherTop = mouseYRelative - distBwChartTopEdgeAndMouseY < 0;
      const canNotBeMovedFurtherBottom = (mouseYRelative - distBwChartTopEdgeAndMouseY + widgetCordinates.height) > multiChartsContainerUsableHeight;

      if (!canNotBeMovedFurtherLeft && !canNotBeMovedFurtherRight) {
        element.style.left = (mouseXRelative - distBwChartLeftEdgeAndMouseX) + 'px';
        if (canNotBeMovedFurtherTop) {
          element.style.top = 0 + 'px';
        } else if (canNotBeMovedFurtherBottom) {
          element.style.top = (multiChartsContainerUsableHeight - widgetCordinates.height) + 'px';
        }
      }
      if (!canNotBeMovedFurtherTop && !canNotBeMovedFurtherBottom) {
        element.style.top = (mouseYRelative - distBwChartTopEdgeAndMouseY) + 'px';
        if (canNotBeMovedFurtherLeft) {
          element.style.left = 0 + 'px';
        }
        if (canNotBeMovedFurtherRight) {
          element.style.left = (multiChartsContainerUsableWidth - widgetCordinates.width) + 'px';
        }
      }
      if ((!canNotBeMovedFurtherLeft && !canNotBeMovedFurtherRight) || (!canNotBeMovedFurtherTop && !canNotBeMovedFurtherBottom)) {
        mouseMoved = true;
        element.style.zIndex = updatedZIndex;
        document.body.style.userSelect = 'none'; // disable user select to avoid selection while dragging  
      }

      // calling below method will handle the auto scroll of charts wrapper if needed
      that.autoScrollChartWrapperIfNeeded(element, colChartWrapperDiv, multiChartsScrollableContainer, multiChartsContainerUsableWidth, that);
    }

    function chartWidgetDrop(e) {
      window.isScrolling = false;
      // that.multiChartsWrapper.current.style.height ='';
      e.stopPropagation();
      document.removeEventListener('mousemove', chartWidgetMove);
      document.removeEventListener('mouseup', chartWidgetDrop);
      element.classList.remove('mousedown');
      document.body.style.userSelect = 'auto';  // revert userSelect property

      // Do nothing if there was no mouse movement, it will be the case when chart is just clicked
      if (!mouseMoved) return;

      let gridMappedTop = Math.round(Number(element.style.top.replace('px', '')) / that.state.gridRowHeight);
      let gridMappedLeft = Math.round(Number(element.style.left.replace('px', '')) / that.state.gridColWidth);
      let posTop = (gridMappedTop * that.state.gridRowHeight);
      let posLeft = (gridMappedLeft * that.state.gridColWidth);

      if (isNaN(posTop)) return;

      element.style.top = posTop + 'px';
      element.style.left = posLeft + 'px';

      updatedTempGridLayouts[chartLayoutIndex]['x'] = posLeft;
      updatedTempGridLayouts[chartLayoutIndex]['y'] = posTop;
      updatedTempGridLayouts[chartLayoutIndex]['zindex'] = updatedZIndex;

      let stateObj = {
        tempChartsGridLayout: updatedTempGridLayouts
      }
      if (that.isDashboardInEditMode()) {
        stateObj['chartsGridLayout'] = updatedTempGridLayouts;
      }

      that.setState(stateObj, () => {
        if (that.isDashboardInEditMode()) {
          that.handleDashboardChartLayoutSave(); //save the layout
        }
      });
    }
  }


  //return chart coordinates in ratio
  getCordinatesInRatioToScreenSize(chartLayout, onLoadSavedScreenSize = null) {
    // let savedScreenSize = chartLayout.screen !== undefined ? chartLayout.screen : window.innerWidth;
    let savedScreenSize = onLoadSavedScreenSize ? onLoadSavedScreenSize : this.getSavedCanvasWidth();
    let defaultViewCanvasWidth = this.getDefaultViewModeCanvsWidth();

    let org_width = this.roundToMultipleOfGridSize(((chartLayout.w * defaultViewCanvasWidth) / savedScreenSize), this.state.gridColWidth);
    let org_height = this.roundToMultipleOfGridSize(((chartLayout.h * defaultViewCanvasWidth) / savedScreenSize), this.state.gridRowHeight);
    let org_segment_width = chartLayout.sw ? this.roundToMultipleOfGridSize(((chartLayout.sw * defaultViewCanvasWidth) / savedScreenSize), this.state.gridColWidth) : 0;

    let width = org_width;
    let height = org_height;
    let segment_width = org_segment_width;
    let x_pos = this.roundToMultipleOfGridSize(((chartLayout.x * defaultViewCanvasWidth) / savedScreenSize), this.state.gridColWidth);
    let y_pos = this.roundToMultipleOfGridSize(((chartLayout.y * defaultViewCanvasWidth) / savedScreenSize), this.state.gridRowHeight);
   
    let chartCordinates = {
      w: width,
      h: height,
      x: x_pos,
      y: y_pos,
    }
    if (segment_width > 0) {
      chartCordinates['sw'] = segment_width;
    }

    return chartCordinates;
  }

  //hide legend block on outsideclick
  handleHideLegendBlock(e, id) {
    if (e.target.className) {
      document.querySelector('#legends-main-wrapper-' + id).classList.remove('visible');
    }
  }

  //switch charts zindex when overlapping
  handleZIndexSwitch(currentChartLayout, behindChartLayouts){
    //put the current chartZIndex higher than current one
    let updatedTempGridLayouts = [...this.state.tempChartsGridLayout];
    let currentLayoutIndex = updatedTempGridLayouts.findIndex((e)=>e.id===currentChartLayout.id);
    if(currentLayoutIndex > -1 && behindChartLayouts.length > 0){
      behindChartLayouts.forEach((layout)=>{
        let layoutIndex = updatedTempGridLayouts.findIndex((e)=>e.id===layout.id);
        if(layoutIndex > -1){
          updatedTempGridLayouts[layoutIndex]['zindex'] = updatedTempGridLayouts[currentLayoutIndex]['zindex'];
          updatedTempGridLayouts[currentLayoutIndex]['zindex'] = (updatedTempGridLayouts[currentLayoutIndex]['zindex']-1);
        }
      });
      this.setState({'tempChartsGridLayout': updatedTempGridLayouts});
    }
  }


  giveIndividualChartHtml(chart, chartIndex) {
    let chartMetric = chart.metric;
    let minVal = 0;
    let maxVal = 0;
    let unique_key = chartIndex === null ? PREVIEW_CHART_ID : chart.id;
    let chartData = this.state.chartsFormattedData[unique_key];
    let chartNetData = this.state.chartsFormattedNetData[unique_key];
    if (chartNetData) {
      chartNetData = this.state.chartsFormattedNetData[unique_key][chart.metric];
    }

    let xaxis_val = chart.x_axis;
    if (chart.chart_type === 'bubble') {
      xaxis_val = chart.x_axis !== '' && "Dimension: " + chart.x_axis[0].toUpperCase() + chart.x_axis.substring(1, chart.x_axis.length) + " | " + "Value: " + chart.metric[0].toUpperCase() + chart.metric.substring(1, chart.metric.length) + `${chart.segmentation !== '' ? ` | Segment: ${chart.segmentation}` : ''}`;
    }

    // Because in place of "segment" there is "measurement" and "measurement" have the values of y axis and y axis have the values of segmentation
    let yaxis_val = chart.chart_type === 'heatmap' ? chart.segmentation : chart.metric;
    let showLegend = chart.showLegend;
    let isPlaceholder = (unique_key === NEW_CHART_ID && !chartData);
    let isSelectedChart = this.state.selectedChartIds.includes(unique_key);
    let chartLayoutIndex = this.state.tempChartsGridLayout.findIndex((e) => e.id === unique_key);

    //find unique segmentation values count to not display the legend block when legends count is less than equals to 5
    let segmentation = this.state.chartsSegmentation[unique_key];
    let segmentationValues = [];
    if (chartData && segmentation !== '') {
      segmentationValues = [...new Set(chartData.map(item => item[segmentation]))];
    }
    
    //for showing symbol before/after number
    let currencySymbol = '';
    let percentSymbol = '';
    let chartDimensionMetricsList = this.state.allDataSourcesDimensionsMetrics[chart['view_type']];
    if (chartDimensionMetricsList) {
      let metricIndex = chartDimensionMetricsList.findIndex((e) => e.id === chart['metric']);
      if (metricIndex > -1) {
        if (chartDimensionMetricsList[metricIndex]['type'] === 'currency') { currencySymbol = '$'; }
        if (chartDimensionMetricsList[metricIndex]['type'] === 'percent') { percentSymbol = '%'; }
      }
    }

    //min/max values
    if (chartData && chartData.length > 0) {
      minVal = Math.min.apply(Math, chartData.map(function (o) { return o[chartMetric]; }));
      maxVal = Math.max.apply(Math, chartData.map(function (o) { return o[chartMetric]; }));
    }

    let chartWidthClass = '';
    //if less than default chart width and greater than small chart width - add sm-grid-width class
    //if less than small chart width and greater than xs chart width - add xs-grid-width class
    // used when we were showing legend as permanent
    let defaultChartWidth = (chart.segmentation !== '' && showLegend) ? (this.state.chart_dimensions.defaultWidth + this.state.chart_dimensions.defaultSegmentWidth) : this.state.chart_dimensions.defaultWidth;
    let smChartWidth = (chart.segmentation !== '' && showLegend) ? (this.state.chart_dimensions.defaultWidth + this.state.chart_dimensions.defaultSegmentWidth) : this.state.chart_dimensions.smWidth;
    let defaultChartHeight = this.state.chart_dimensions.defaultHeight;
    let smChartHeight = this.state.chart_dimensions.smHeight;

    //override width for scorecard
    if (chart['chart_type'] === 'scorecard') {
      defaultChartWidth = this.state.chart_dimensions.defaultScorecardWidth;
      smChartWidth = this.state.chart_dimensions.defaultScorecardWidth - ((this.state.chart_dimensions.defaultScorecardWidth - this.state.chart_dimensions.xsScorecardWidth) / 2);
      defaultChartHeight = this.state.chart_dimensions.defaultScorecardHeight;
      smChartHeight = this.state.chart_dimensions.defaultScorecardHeight - ((this.state.chart_dimensions.defaultScorecardHeight - this.state.chart_dimensions.xsScorecardHeight) / 2);
    }

    if ((this.state.tempChartsGridLayout[chartLayoutIndex] && (this.state.tempChartsGridLayout[chartLayoutIndex]['w'] < defaultChartWidth) && (this.state.tempChartsGridLayout[chartLayoutIndex]['w'] >= smChartWidth))) {
      chartWidthClass = 'sm-grid-width';
    }
    if ((this.state.tempChartsGridLayout[chartLayoutIndex] && (this.state.tempChartsGridLayout[chartLayoutIndex]['w'] < smChartWidth))) {
      chartWidthClass = 'xs-grid-width';
    }

    if (chart['chart_type'] === 'scorecard') {
      if ((this.state.tempChartsGridLayout[chartLayoutIndex] && (this.state.tempChartsGridLayout[chartLayoutIndex]['h'] < defaultChartHeight) && (this.state.tempChartsGridLayout[chartLayoutIndex]['h'] >= smChartHeight))) {
        chartWidthClass = 'sm-grid-width';
      }
      if ((this.state.tempChartsGridLayout[chartLayoutIndex] && (this.state.tempChartsGridLayout[chartLayoutIndex]['h'] < smChartHeight))) {
        chartWidthClass = 'xs-grid-width';
      }
    }

    const showChartLoading = !!this.state.chartsLoadingsObj[unique_key];
    let chartDateRangeToShow = (chart['dynamic_time_period'] || this.state.dashboardSettingsLastSaved.dynamic_time_period);

    if (unique_key === NEW_CHART_ID) {
      chartDateRangeToShow = this.giveDateRangeBasedOnPriority('', this.state.dashboardSettings.dynamic_time_period);
    }

    // Fallback period is to be used if period is niether set for chart nor for dashboard
    if (chartDateRangeToShow === null) {
      chartDateRangeToShow = FALLBACK_TIME_PERIOD_FOR_CHARTS;
    }

    chartDateRangeToShow = (chartDateRangeToShow.is_dynamic) ? convertDatePeriodPreselectsToRange(chartDateRangeToShow.value, chartDateRangeToShow.custom_dates) : chartDateRangeToShow.value;
    chartDateRangeToShow = giveDotSeparatedDateRange(chartDateRangeToShow);

    //plotting specifications of chart widgets
    let chartCordToBind = {
      'minW': chart['chart_type'] !== 'scorecard' ? this.state.chart_dimensions.xsWidth : this.state.chart_dimensions.xsScorecardWidth,
      'minH': chart['chart_type'] !== 'scorecard' ? this.state.chart_dimensions.xsHeight : this.state.chart_dimensions.xsScorecardHeight
    }, storedCord;

    if (chartIndex !== null) {
      storedCord = { ...this.state.tempChartsGridLayout[chartLayoutIndex] };
      let chartPosY = storedCord !== undefined ? storedCord['y'] : 0;
      chartCordToBind['x'] = storedCord['x'];
      chartCordToBind['y'] = chartPosY > 0 ? chartPosY : (chartPosY * storedCord['h']);
      chartCordToBind['w'] = storedCord['w'];
      chartCordToBind['h'] = storedCord['h'];
      // 'sw'(segment width) may not be available in some cases(consider it as 0, when not available)
      chartCordToBind['sw'] = '36.62%';
      if (chart.segmentation !== '' && showLegend) {
        chartCordToBind['sw'] = (storedCord['w'] > defaultChartWidth) ? ((storedCord['sw'] || 0) * 100) / storedCord['w'] + '%' : '36.62%';
      }
      chartCordToBind['cw'] = (100 - Number(chartCordToBind['sw'].replace('%', ''))) + '%';
      chartCordToBind['zindex'] = (storedCord['zindex'] !== null && storedCord['zindex'] !== undefined) ? parseInt(storedCord['zindex']) : 1;

    } else {
      // For PREVIEW_CHART, resizing and repostion is not allowed, hence just assign the default layout settings
      // storedCord = this.state.newChartLayoutSettingsLastExecuted;
      // For Constructor chart, x and y has to be null as it will always be at center(both vertically and horizontally)
      chartCordToBind = { ...storedCord, ...this.getNewChartInitialLayoutSettings() };
      // Adjust the width in case of segmentation
      if (chart.segmentation !== '' && showLegend && segmentationValues.length > this.state.chart_dimensions.showLegendCount) {
        chartCordToBind['w'] = this.state.chart_dimensions.defaultWidth + this.state.chart_dimensions.defaultSegmentWidth;
      }
      // Adjust the height in case of scorecard
      if (chart.chart_type === 'scorecard') {
        chartCordToBind['w'] = this.state.chart_dimensions.xsScorecardWidth;
        chartCordToBind['h'] = this.state.chart_dimensions.xsScorecardHeight;
      }
    }

    // find overlappign charts
    let chartsOverlappingMessage = '';
    let chartsBehindCurrent = null;
    if (!isPlaceholder && chartIndex !== null) {
      chartsBehindCurrent = findChartOverlapping(this.state.tempChartsGridLayout[chartLayoutIndex], this.state.tempChartsGridLayout);
      if (chartsBehindCurrent.length > 0) {
        chartsOverlappingMessage += chartsBehindCurrent.length + ' chart' + (chartsBehindCurrent.length > 1 ? 's' : '') + ' overlapped';
      }
    }


    let isInViewModeFitToWidth = (!this.isDashboardInEditMode() && this.state.currentViewModeType.name === 'Fit to Width' && this.state.tempChartsGridLayout[chartLayoutIndex]);
    let savedCanvasWidth = this.getSavedCanvasWidth();
    let defaultViewCanvasWidth = this.getDefaultViewModeCanvsWidth();

    let chartHeaderPaddingLeftOrg = (chart.chart_type !== 'scorecard' && chart.chart_type !== 'flat_table' && chart.chart_type !== 'pie' && chart.chart_type !== 'donut' && chart.chart_type !== 'spider' && chart.chart_type !== 'bubble') ? 22 : 15;
    let chartContentPaddingLeftOrg = (chart.chart_type !== 'scorecard' && chart.chart_type !== 'flat_table' && chart.chart_type !== 'pie' && chart.chart_type !== 'donut' && chart.chart_type !== 'spider' && chart.chart_type !== 'bubble') ? 22 : 15;
    let chartContentPaddingBottomOrg = 15;
    if (chartWidthClass === 'sm-grid-width') {
      chartHeaderPaddingLeftOrg = 15;
      chartContentPaddingLeftOrg = (chart.chart_type !== 'scorecard' && chart.chart_type !== 'flat_table' && chart.chart_type !== 'pie' && chart.chart_type !== 'donut' && chart.chart_type !== 'spider' && chart.chart_type !== 'bubble') ? 5 : 15;
      chartContentPaddingBottomOrg = (chart.chart_type !== 'scorecard' && chart.chart_type !== 'flat_table' && chart.chart_type !== 'pie' && chart.chart_type !== 'donut' && chart.chart_type !== 'spider' && chart.chart_type !== 'bubble') ? 5 : 15;
    }
    if (chartWidthClass === 'xs-grid-width') {
      chartHeaderPaddingLeftOrg = 15;
      chartContentPaddingLeftOrg = 15;
      chartContentPaddingBottomOrg = (chart.chart_type !== 'scorecard') ? 5 : 15;
    }

    let dropdownPanelWidth = (chart.segmentation !== '' && showLegend) ? (((storedCord['sw'] + 8) * 100) / storedCord['w']) + '%' : 'auto';
    let headerButtonMarLeft = (isInViewModeFitToWidth ? Math.round(10 * defaultViewCanvasWidth / savedCanvasWidth) : 10) + 'px';
    let titleFontSize = (isInViewModeFitToWidth ? Math.round(11 * defaultViewCanvasWidth / savedCanvasWidth) : 11) + 'px';
    let axisLabelFontSize = (isInViewModeFitToWidth ? Math.round(10 * defaultViewCanvasWidth / savedCanvasWidth) : 10) + 'px';
    let axisLabelLineHeight = (isInViewModeFitToWidth ? Math.round(10 * defaultViewCanvasWidth / savedCanvasWidth) : 10) + 'px';
    let chartHeaderHeight = (isInViewModeFitToWidth ? Math.round(40 * defaultViewCanvasWidth / savedCanvasWidth) : 40) + 'px';
    let chartContentPaddingBottom = (isInViewModeFitToWidth ? Math.round(chartContentPaddingBottomOrg * defaultViewCanvasWidth / savedCanvasWidth) : chartContentPaddingBottomOrg) + 'px';
    let chartHeaderPaddingLeft = (isInViewModeFitToWidth ? Math.round(chartHeaderPaddingLeftOrg * defaultViewCanvasWidth / savedCanvasWidth) : chartHeaderPaddingLeftOrg) + 'px';
    let chartContentPaddingLeft = (isInViewModeFitToWidth ? Math.round(chartContentPaddingLeftOrg * defaultViewCanvasWidth / savedCanvasWidth) : chartContentPaddingLeftOrg) + 'px';
    let chartContentPaddingRight = (isInViewModeFitToWidth ? Math.round(15 * defaultViewCanvasWidth / savedCanvasWidth) : 15) + 'px';

    // xaxis label position
    let xAxisLabelBottomPos = (isInViewModeFitToWidth ? Math.round(14 * defaultViewCanvasWidth / savedCanvasWidth) : 14) + 'px';
    let xAxisLabelLeftPos = (isInViewModeFitToWidth ? Math.round(35 * defaultViewCanvasWidth / savedCanvasWidth) : 35) + 'px';
    let xAxisLabelRightPos = (isInViewModeFitToWidth ? Math.round(5 * defaultViewCanvasWidth / savedCanvasWidth) : 5) + 'px';

    // yaxis label position
    let yAxisLabelBottomPos = (isInViewModeFitToWidth ? Math.round(45 * defaultViewCanvasWidth / savedCanvasWidth) : 45) + 'px';
    let yAxisLabelLeftPos = (isInViewModeFitToWidth ? Math.round(14 * defaultViewCanvasWidth / savedCanvasWidth) : 14) + 'px';

    // header icons size
    let otherIconSize = (isInViewModeFitToWidth ? Math.round(12 * defaultViewCanvasWidth / savedCanvasWidth) : 12) + 'px';
    let metaInfoIconMaskSize = (isInViewModeFitToWidth ? (2.5 * defaultViewCanvasWidth / savedCanvasWidth).toFixed(1) : 2.5) + 'px';
    let moreIconWidth = (isInViewModeFitToWidth ? Math.round(12 * defaultViewCanvasWidth / savedCanvasWidth) : 12) + 'px';
    // let metaInfoLineHeight = (isInViewModeFitToWidth ? Math.round(20 * defaultViewCanvasWidth / savedCanvasWidth) : 20) + 'px';
    // let metaInfoPadding = (isInViewModeFitToWidth ? Math.round(5 * defaultViewCanvasWidth / savedCanvasWidth) : 5) + 'px';

    // legendwrapper position
    let legendWrapperTopPos = (isInViewModeFitToWidth ? Math.round(35 * defaultViewCanvasWidth / savedCanvasWidth) : 35) + 'px';
    let headerActionOptionsPaddingTop = (isInViewModeFitToWidth ? Math.round(8 * defaultViewCanvasWidth / savedCanvasWidth) : 8) + 'px';
    let headerActionOptionsPaddingLeft = (isInViewModeFitToWidth ? Math.round(10 * defaultViewCanvasWidth / savedCanvasWidth) : 10) + 'px';

    let defaultScoreFontSize = 42;
    let defaultScoreVariationFontSize = 18;
    if (chartWidthClass === 'sm-grid-width') { defaultScoreFontSize = 33; defaultScoreVariationFontSize = 14; }
    if (chartWidthClass === 'xs-grid-width') { defaultScoreFontSize = 15; defaultScoreVariationFontSize = 12; }

    let scoreFontSize = (isInViewModeFitToWidth ? Math.round(defaultScoreFontSize * defaultViewCanvasWidth / savedCanvasWidth) : defaultScoreFontSize) + 'px';
    if(chartData && chart.chart_type === 'scorecard'){
      scoreFontSize = this.decideScorecardFontSize(
        (currencySymbol + numberWithCommas(chartData[0][chart.metric]) + percentSymbol),
        (this.state.tempChartsGridLayout[chartIndex] !== undefined ? this.state.tempChartsGridLayout[chartIndex]['w'] : 0),
        (this.state.tempChartsGridLayout[chartIndex] !== undefined ? this.state.tempChartsGridLayout[chartIndex]['h'] : 0),
        scoreFontSize,
        chartContentPaddingLeft,
        (isInViewModeFitToWidth ? Math.round(defaultScoreVariationFontSize * defaultViewCanvasWidth / savedCanvasWidth) : defaultScoreVariationFontSize) + 'px'
      ) + 'px';
    }

    let marginFactor = 0
    let variationFactor = 0
    if (this.state.tempChartsGridLayout[chartIndex] !== undefined) {
      let scale = 5
      let new_width = (this.state.tempChartsGridLayout[chartIndex]['w'] - parseInt(chartContentPaddingLeft.replace('px', '')) * 2);
      let area = this.state.tempChartsGridLayout[chartIndex]['h'] * new_width
      if (Math.sqrt(area / scale) > 100) {
        marginFactor = Math.sqrt(parseInt(scoreFontSize.replace('px', '') / 2))
        variationFactor = parseInt(scoreFontSize.replace('px', '')) / 6
      }
    }
    let scoreVariationFontSize = (isInViewModeFitToWidth ? variationFactor + Math.round(defaultScoreVariationFontSize * defaultViewCanvasWidth / savedCanvasWidth) : defaultScoreVariationFontSize + variationFactor) + 'px';
    let scoreBottomMargin = (isInViewModeFitToWidth ? marginFactor + Math.round(5 * defaultViewCanvasWidth / savedCanvasWidth) : 5 + marginFactor) + 'px';
    let scroreFullTextSize = ((chartData && chart.chart_type === 'scorecard') ?
      this.decideScorecardFontSize(
        (currencySymbol + numberWithCommas(chartData[0][chart.metric]) + percentSymbol),
        (this.state.tempChartsGridLayout[chartIndex] !== undefined ? this.state.tempChartsGridLayout[chartIndex]['w'] : 0),
        (this.state.tempChartsGridLayout[chartIndex] !== undefined ? this.state.tempChartsGridLayout[chartIndex]['h'] : 0),
        scoreFontSize,
        chartContentPaddingLeft,
        (isInViewModeFitToWidth ? Math.round(defaultScoreVariationFontSize * defaultViewCanvasWidth / savedCanvasWidth) : defaultScoreVariationFontSize) + 'px'
      ) : 0) + 'px';

    return (
      <div id={'chart-' + unique_key}
        className={'asc-chart-wrapper chart-' + chart.chart_type + ' ' + chartWidthClass + (isPlaceholder ? ' chart-placeholder' : '') + (isSelectedChart ? ' selected' + (this.isDashboardInEditMode() ? ' edit-selection' : ' view-selection') : '')}
        key={unique_key}
        data-grid={storedCord}
        style={{
          top: chartCordToBind.y,
          left: chartCordToBind.x,
          width: chartCordToBind.w,
          height: chartCordToBind.h,
          minWidth: chartCordToBind.minW,
          minHeight: chartCordToBind.minH,
          zIndex: chartCordToBind.zindex
        }}
        onMouseDown={e => {
          chartIndex !== null && this.onChartWidgetDragStart(e, unique_key)
        }}
      >
        <div className="grid-size"></div>

        {chartsOverlappingMessage !== '' &&
          <button className="overlapping-msg" onClick={()=>this.handleZIndexSwitch(this.state.tempChartsGridLayout[chartLayoutIndex], chartsBehindCurrent)}>{chartsOverlappingMessage}</button>
        }

        {chart.chart_type !== 'scorecard' &&
          <div className="chart-inner-wrapper">

            {/* More buttons dropdown */}
            {this.state.showMoreButtonsDropDownToggle[unique_key] &&
              <ClickOutsideListener onOutsideClick={(e) => this.handleMoreButtonsDropDownToggle(e, unique_key)}>
                <div className="more-buttons-wrapper" onMouseDown={e => e.stopPropagation()} style={{ fontSize: titleFontSize, width: dropdownPanelWidth, top: legendWrapperTopPos, paddingTop: headerActionOptionsPaddingTop, paddingBottom: headerActionOptionsPaddingTop, paddingLeft: headerActionOptionsPaddingLeft, paddingRight: headerActionOptionsPaddingLeft }}>
                  {(this.isDashboardInEditMode() && chartIndex !== null) &&
                    <ul>
                      <li><button className="btn-delete" title="Delete" disabled={this.state.chartOrDashboardSaveInProcess} onClick={(e) => this.handleChartDeleteBtn(e, unique_key)}><i></i></button></li>
                      <li><button className="btn-copy" title="Copy" disabled={this.state.chartOrDashboardSaveInProcess} onClick={() => this.handleChartCopyBtn(unique_key)}><i></i></button></li>
                      <li><button className="btn-edit" title="Edit" disabled={this.state.chartOrDashboardSaveInProcess} onClick={() => this.handleChartEditBtn(unique_key)}><i></i></button></li>
                    </ul>
                  }
                </div>
              </ClickOutsideListener>
            }

            <div className={'chart-content-wrapper'}
              style={{ paddingTop: chartHeaderHeight, width: '100%', height: '100%' }}>
              <div className="chart-header-wrapper">
                {/* Main header */}
                <div className="chart-main-header" style={{ height: chartHeaderHeight, paddingLeft: chartHeaderPaddingLeft, paddingRight: chartContentPaddingRight }}>
                  <div className="title-wrapper">
                    {!isPlaceholder &&
                      <h3 className="title" title={chart.name} style={{ fontSize: titleFontSize }}>{chart.name}</h3>
                    }
                  </div>

                  {!isPlaceholder && chartIndex !== null &&
                    <div className='chart-menu'>
                      <div className="btn-action zoom-icon-container zoom-in"></div>
                      {((((chart.segmentation !== '' && chart.chart_type !== 'heatmap') && segmentationValues.length > this.state.chart_dimensions.showLegendCount) || (chart.chart_type === 'pie' || chart.chart_type === 'donut' || chart.chart_type === 'spider')) && !showLegend) &&
                        <button className="btn-action btn-asc-chart-legend" style={{ width: otherIconSize, height: otherIconSize, maskSize: otherIconSize, WebkitMaskSize: otherIconSize }} onClick={(e) => this.handleWidgetLegendDetails(e, unique_key, chart)} onMouseDown={e => e.stopPropagation()}>
                          <img src={ImgLegend} className="legend"/>
                        </button>
                      }
                      <button className="btn-action btn-asc-chart-meta" style={{ width: otherIconSize, height: otherIconSize, maskSize: metaInfoIconMaskSize, WebkitMaskSize: metaInfoIconMaskSize, marginLeft: headerButtonMarLeft }} onClick={(e) => this.handleWidgetMetaInfo(e, unique_key, chart, chartDateRangeToShow, xaxis_val, yaxis_val, chartNetData, minVal, maxVal, currencySymbol, percentSymbol)} onMouseDown={e => e.stopPropagation()}>info</button>

                      {this.isDashboardInEditMode() && chartIndex !== null &&
                        <button className="btn-action btn-asc-chart-more" style={{ width: moreIconWidth, height: otherIconSize, maskSize: moreIconWidth, WebkitMaskSize: moreIconWidth, marginLeft: headerButtonMarLeft }} onClick={(e) => this.handleMoreButtonsDropDownToggle(e, unique_key)} onMouseDown={e => e.stopPropagation()}></button>
                      }
                    </div>
                  }
                </div>
              </div>

              {!isPlaceholder &&
                <>
                  <div className="chart-content" style={{ paddingBottom: chartContentPaddingBottom, paddingRight: chartContentPaddingRight, paddingLeft: chartContentPaddingLeft, height: '100%' }}>
                    {((chart.chart_type !== 'flat_table' && chart.chart_type !== 'pie' && chart.chart_type !== 'donut' && chart.chart_type !== 'spider') && chartData) &&
                      <>
                        <div className="x-axis-label" style={{ fontSize: axisLabelFontSize, lineHeight: axisLabelLineHeight, bottom: xAxisLabelBottomPos, left: xAxisLabelLeftPos, right: xAxisLabelRightPos }}><span className={isAbbrevationName(xaxis_val) ? 'allcaps' : ''}>{xaxis_val}</span></div>
                        {(chart.chart_type !== 'pie' && chart.chart_type !== 'donut' && chart.chart_type !== 'bubble') &&
                          <div className="y-axis-label" style={{ fontSize: axisLabelFontSize, lineHeight: axisLabelLineHeight, bottom: yAxisLabelBottomPos, left: yAxisLabelLeftPos }}><span className={isAbbrevationName(yaxis_val) ? 'allcaps' : ''}>{yaxis_val}</span></div>
                        }
                      </>
                    }
                    <div className={'asc-chart ' + chart.chart_type} ref={chart.ref} data-ref={chart.ref}></div>
                  </div>
                </>
              }

              {isPlaceholder &&
                <>
                  <div className="chart-content">
                    <div className="placeholder-text">Place this widget at the desired location and click to drop</div>
                  </div>
                </>
              }
            </div>

            {showChartLoading &&
              <div className="chart-loading">
                <div className="loading-progress"></div>
              </div>
            }
          </div>
        }

        {chart.chart_type === 'scorecard' &&
          <div className="chart-inner-wrapper">
            {!isPlaceholder &&
              <>
                <div className="chart-header-wrapper">
                  <div className="chart-main-header" style={{ height: chartHeaderHeight, paddingLeft: chartHeaderPaddingLeft, paddingRight: chartContentPaddingRight }}>
                    <div className="title-wrapper">
                      <h3 className="title" style={{ fontSize: titleFontSize }}>{chart.name !== '' ? chart.name : covertUnderscoreToSpaceInString(chart.metric)}</h3>
                    </div>
                    
                    <div className="chart-menu" onMouseDown={e => e.stopPropagation()}>
                      <button className="btn-action btn-asc-chart-meta" style={{ width: otherIconSize, height: otherIconSize, maskSize: metaInfoIconMaskSize, WebkitMaskSize: metaInfoIconMaskSize }} onClick={(e) => this.handleWidgetMetaInfo(e, unique_key, chart, chartDateRangeToShow, xaxis_val, yaxis_val, chartNetData, minVal, maxVal, currencySymbol, percentSymbol)} onMouseDown={e => e.stopPropagation()}>info</button>
                      {this.isDashboardInEditMode() && chartIndex !== null &&
                        <button className="btn-action btn-asc-chart-more" style={{ width: moreIconWidth, height: otherIconSize, maskSize: moreIconWidth, WebkitMaskSize: moreIconWidth, marginLeft: headerButtonMarLeft }} onClick={(e) => this.handleMoreButtonsDropDownToggle(e, unique_key)} onMouseDown={e => e.stopPropagation()}></button>
                      }
                    </div>
                  </div>
                </div>

                {/* More buttons dropdown */}
                {isSelectedChart && this.state.showMoreButtonsDropDownToggle[unique_key] &&
                  <ClickOutsideListener onOutsideClick={(e) => this.handleMoreButtonsDropDownToggle(e, unique_key)}>
                    <div className="more-buttons-wrapper" onMouseDown={e => e.stopPropagation()} style={{ width: (chart.segmentation !== '' && showLegend) ? chartCordToBind.sw : 'auto', fontSize: titleFontSize, top: legendWrapperTopPos, paddingTop: headerActionOptionsPaddingTop, paddingBottom: headerActionOptionsPaddingTop, paddingLeft: headerActionOptionsPaddingLeft, paddingRight: headerActionOptionsPaddingLeft }}>
                      {(this.isDashboardInEditMode() && chartIndex !== null) &&
                        <ul>
                          <li><button className="btn-delete" title="Delete" disabled={this.state.chartOrDashboardSaveInProcess} onClick={() => this.handleChartDeleteBtn(unique_key)}><i></i></button></li>
                          <li><button className="btn-copy" title="Copy" disabled={this.state.chartOrDashboardSaveInProcess} onClick={() => this.handleChartCopyBtn(unique_key)}><i></i></button></li>
                          <li><button className="btn-edit" title="Edit" disabled={this.state.chartOrDashboardSaveInProcess} onClick={() => this.handleChartEditBtn(unique_key)}><i></i></button></li>
                        </ul>
                      }
                    </div>
                  </ClickOutsideListener>
                }
              </>
            }

            {!isPlaceholder &&
              <>
                <div className="chart-content-wrapper scorecard" style={{ paddingTop: chartHeaderHeight, paddingRight: chartContentPaddingRight, paddingLeft: chartContentPaddingLeft, height: 'calc(100% - ' + chartHeaderHeight + ')' }}>
                  {(chartData && !chart.format.show_full_number) && <h2 className="score" style={{ fontSize: scoreFontSize, lineHeight: scoreFontSize, marginBottom: scoreBottomMargin }}>{currencySymbol + formatNumber(chartData[0][chart.metric]) + percentSymbol}</h2>}
                  {(chartData && Boolean(chart.format.show_full_number)) && <h2 style={{ fontSize: scroreFullTextSize, lineHeight: scroreFullTextSize, marginBottom: scoreBottomMargin }} className="score">{currencySymbol + numberWithCommas(chartData[0][chart.metric]) + percentSymbol}</h2>}
                  {chartNetData !== undefined && <div style={{ fontSize: scoreVariationFontSize }} className={'score-variation ' + (chartNetData['previous_period_change'] > 0 ? 'up' : 'down')}><span className="icon" style={{ width: parseInt(scoreFontSize.replace('px', '') / 3) + 'px', height: parseInt(scoreFontSize.replace('px', '') / 3) + 'px', maskSize: parseInt(scoreFontSize.replace('px', '') / 3) + 'px', WebkitMaskSize: parseInt(scoreFontSize.replace('px', '') / 3) + 'px', marginRight: scoreBottomMargin }}></span>{chartNetData['previous_period_change']}%</div>}
                </div>
              </>
            }

            {isPlaceholder &&
              <div className="chart-content">
                <div className="placeholder-text">Move your cursor to place the widget.</div>
              </div>
            }

            {showChartLoading &&
              <div className="chart-loading">
                <div className="loading-progress"></div>
              </div>
            }
          </div>
        }

       
        {chartIndex !== null &&
          <>
            <div className="chart-resizer-corner" onMouseDown={(e) => this.handleMultiChartResizeStart(e, unique_key, 'corner')}></div>
            <div className="chart-resizer-edge edge-left" onMouseDown={(e) => this.handleMultiChartResizeStart(e, unique_key, 'left')}></div>
            <div className="chart-resizer-edge edge-right" onMouseDown={(e) => this.handleMultiChartResizeStart(e, unique_key, 'right')}></div>
            <div className="chart-resizer-edge edge-top" onMouseDown={(e) => this.handleMultiChartResizeStart(e, unique_key, 'top')}></div>
            <div className="chart-resizer-edge edge-bottom" onMouseDown={(e) => this.handleMultiChartResizeStart(e, unique_key, 'bottom')}></div>
          </>
        }

        <span className="border top"></span>
        <span className="border left"></span>
        <span className="border right"></span>
        <span className="border bottom"></span>
      </div>
    )
  }


  autoFontSizeAdjustment(text, size, width) {
    let updatedSize = size;
    if (calculateTextWidth(text, updatedSize + 'px Poppins, "Open Sans", sans-serif, helvetica') >= width) {
      updatedSize = updatedSize - 2;
      updatedSize = this.autoFontSizeAdjustment(text, updatedSize, width);
    }
    return updatedSize;
  }

  //set the scorecard dynamic font size
  decideScorecardFontSize(metric_val, width, height, fontsize, chartContentPaddingLeft, scoreVariationFontSize) {
    scoreVariationFontSize = parseInt(scoreVariationFontSize.replace('px', ''))
    let font_class = '';
    let scale = 5
    if (width === 0 || height === 0) return font_class;
    let new_width = (width - parseInt(chartContentPaddingLeft.replace('px', '')) * 2);

    let area = new_width * height
    let fontSize = parseInt(fontsize.replace('px', ''));
    let floorsize = Math.sqrt(area / scale)

    // console.log(floorsize , '1')
    if (floorsize > 90 && height <= 120) { // edge case where area is 120 * base/fullwidth
      let x = height - (scoreVariationFontSize + floorsize / 6) // calc % height wrt text

      fontSize = (floorsize * (x / height)) - floorsize / 6 - scoreVariationFontSize * 3 //remove % height and remove 2* fontsize wrt floorsize
    }

    if (floorsize > 90 && height > 120) {
      let x = height - (scoreVariationFontSize + floorsize / 6) // calc % height wrt text

      fontSize = (floorsize * (x / height)) - floorsize / 6 - scoreVariationFontSize * 2 //remove % height and remove 2* fontsize wrt floorsize
    }

    fontSize = this.autoFontSizeAdjustment(metric_val, fontSize, new_width);

    return fontSize;
  }

  // set scorecard variation
  decideScorecardVariationFontSize(metric_val, width, height, fontsize, chartContentPaddingLeft) {
    let font_class = '';
    let scale = 5
    if (width === 0 || height === 0) return font_class;
    let new_width = (width - parseInt(chartContentPaddingLeft.replace('px', '')) * 2);
    let area = new_width * height

    let fontSize = parseInt(fontsize.replace('px', ''));
    if (Math.sqrt(area / scale) > 100) {
      fontSize = fontSize / 4
    }

    fontSize = this.autoFontSizeAdjustment(metric_val, fontSize, new_width);

    return fontSize;
  }

  //On constructor panel outside click
  handleConsolePanelOutsideClick(e) {
    // e.preventDefault();
    if (this.state.preferenceAutoHideConsolePanel && this.showConsoleMinimizedButton()) {
      if (e.target.classList.contains('tab-menu')) return; // stop conflict if clicked on tab penel icon click
      this.handleMinimizeConsolePanel(e);
    }
    //this.props.onPanelToggle(this.props.dashboardData.id, 'showConsolePanel');
  }

  handleSinglePanelCloseBtn() {
    this.discardExistingNewChartSettings();
    this.setState({ consolePanelSelectedTab: 'index', showWidgetInfo: false, showWidgetLegendDetails: false });
  }

  getSegmentWidth(chartWidth) {
    return parseInt(chartWidth * 36.62 / 100);
  }

  //dashboard charts resize
  handleMultiChartResizeStart(e, id, resizerName) {
    e.preventDefault();
    e.stopPropagation();

    const chartDiv = document.querySelector('#chart-' + id);
    const chartWrapperDiv = this.multiChartsScrollableWrapper.current.querySelector('#multicharts-wrapper');
    const chartWrapperDivUsableWidth = chartWrapperDiv.getBoundingClientRect().width - Number(window.getComputedStyle(chartWrapperDiv).getPropertyValue('padding-right').replace('px', ''));

    let chartSettingIndex = this.state.filteredChartsSettings.findIndex((e) => e.id === id);
    let chartLayoutIndex = this.state.tempChartsGridLayout.findIndex((e) => e.id === id);
    let showLegend = this.state.filteredChartsSettings[chartSettingIndex]['showLegend'];

    const isSegmented = this.state.filteredChartsSettings[chartSettingIndex]['segmentation'] !== '';
    const isScorecard = this.state.filteredChartsSettings[chartSettingIndex]['chart_type'] === 'scorecard';

    let chartWidthClass = '';
    let defaultChartWidth = (isSegmented && showLegend) ? (this.state.chart_dimensions.defaultWidth + this.state.chart_dimensions.defaultSegmentWidth) : this.state.chart_dimensions.defaultWidth;
    let smChartWidth = (isSegmented && showLegend) ? (this.state.chart_dimensions.smWidth + this.state.chart_dimensions.smSegmentWidth) : this.state.chart_dimensions.smWidth;

    let defaultChartHeight = this.state.chart_dimensions.defaultHeight;
    let smChartHeight = this.state.chart_dimensions.smHeight;
    let updatedZIndex = this.updateAndGiveMaxZIndexAmongCharts(id);
    // console.log('updatedZIndex', updatedZIndex);

    //override width for scorecard
    if (isScorecard) {
      defaultChartWidth = this.state.chart_dimensions.defaultScorecardWidth;
      smChartWidth = this.state.chart_dimensions.defaultScorecardWidth - ((this.state.chart_dimensions.defaultScorecardWidth - this.state.chart_dimensions.xsScorecardWidth) / 2);
      defaultChartHeight = this.state.chart_dimensions.defaultScorecardHeight;
      smChartHeight = this.state.chart_dimensions.defaultScorecardHeight - ((this.state.chart_dimensions.defaultScorecardHeight - this.state.chart_dimensions.xsScorecardHeight) / 2);
    }

    let heightOnResizeStart, widthOnResizeStart, topOnResizeStart, leftOnResizeStart, mouseYOnResizeStart, mouseXOnResizeStart;
    heightOnResizeStart = Number(chartDiv.style.height.replace('px', ''));
    widthOnResizeStart = Number(chartDiv.style.width.replace('px', ''));
    topOnResizeStart = Number(chartDiv.style.top.replace('px', ''));
    leftOnResizeStart = Number(chartDiv.style.left.replace('px', ''));
    mouseYOnResizeStart = e.pageY;
    mouseXOnResizeStart = e.pageX;

    // Calculation of minChartWidth,minChartHeight, maxChartWidth and maxChartHeight:
    const minChartWidth = (isSegmented && showLegend) ? (this.state.chart_dimensions.xsWidth + this.state.chart_dimensions.xsSegmentWidth) : isScorecard ? this.state.chart_dimensions.xsScorecardWidth : this.state.chart_dimensions.xsWidth;
    const minChartHeight = isScorecard ? this.state.chart_dimensions.xsScorecardHeight : this.state.chart_dimensions.xsHeight;

    // 'maxChartWidth' will depend on the 'resizerName'(From where the chart is being dragged i.e. from corner OR from one of the edges)
    // const maxChartWidth = (isScorecard) ? this.state.chart_dimensions.defaultScorecardWidth : (resizerName === 'corner' || resizerName === 'right') ? chartWrapperDivUsableWidth - leftOnResizeStart : chartWrapperDivUsableWidth;
    // const maxChartHeight = (isScorecard) ? this.state.chart_dimensions.defaultScorecardHeight :(resizerName === 'corner' || resizerName === 'bottom') ? chartWrapperDiv.getBoundingClientRect().height - topOnResizeStart : chartWrapperDiv.getBoundingClientRect().height;
    const maxChartWidth = (resizerName === 'corner' || resizerName === 'right') ? chartWrapperDivUsableWidth - leftOnResizeStart : chartWrapperDivUsableWidth;
    const maxChartHeight = (resizerName === 'corner' || resizerName === 'bottom') ? chartWrapperDiv.getBoundingClientRect().height - topOnResizeStart : chartWrapperDiv.getBoundingClientRect().height;

    // Calculation of maxChartTop,minChartTop,maxChartLeft and minChartLeft:
    // These will depened on the min and max values of chart height and width
    const maxChartTop = topOnResizeStart + heightOnResizeStart - minChartHeight;
    const minChartTop = Math.max(0, topOnResizeStart - (maxChartHeight - heightOnResizeStart));
    const maxChartLeft = leftOnResizeStart + widthOnResizeStart - minChartWidth;
    const minChartLeft = Math.max(0, leftOnResizeStart - (maxChartWidth - widthOnResizeStart));

    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);

    let updatedTempGridLayouts = [...this.state.tempChartsGridLayout];

    // Initialize variables with current top,left,width,height values, some of these will be updated on resizing, some will remain unchanged depending on value of 'resizerName'
    let updatedWidth = updatedTempGridLayouts[chartLayoutIndex]['w'];
    let updatedHeight = updatedTempGridLayouts[chartLayoutIndex]['h'];
    let updatedLeft = updatedTempGridLayouts[chartLayoutIndex]['x'];
    let updatedTop = updatedTempGridLayouts[chartLayoutIndex]['y'];
    let updatedSW = updatedTempGridLayouts[chartLayoutIndex]['sw'];

    // Start showing the height and width at bottom right corner
    chartDiv.querySelector('.grid-size').style.display = 'block';
    chartDiv.querySelector('.grid-size').innerHTML = widthOnResizeStart + 'px * ' + heightOnResizeStart + 'px';

    const that = this;
    let mouseMove = false; // to detect in 'mouseup' event, wheather user just clicked or actually dragged the chart.
    function resize(e) {
      e.stopPropagation();

      // const width = widthOnResizeStart + (e.pageX - mouseXOnResizeStart);
      chartDiv.style.zIndex = updatedZIndex;
      document.body.style.pointerEvents = 'none'; // to disable trigger of mouse-hover event on any element while resizing

      // set Chart Height
      if (resizerName === 'corner' || resizerName === 'bottom') {
        const height = heightOnResizeStart + (e.pageY - mouseYOnResizeStart);
        const heightToSet = Math.max(minChartHeight, Math.min(maxChartHeight, height));
        updatedHeight = Math.round(heightToSet / that.state.gridRowHeight) * that.state.gridRowHeight;
        chartDiv.style.height = updatedHeight + 'px';
      }

      // set Chart Height and Top
      if (resizerName === 'top') {
        const top = topOnResizeStart + (e.pageY - mouseYOnResizeStart);
        const topToSet = Math.max(minChartTop, Math.min(maxChartTop, top));
        updatedTop = Math.round(topToSet / that.state.gridRowHeight) * that.state.gridRowHeight;

        const heightToSet = heightOnResizeStart + (topOnResizeStart - topToSet);
        updatedHeight = Math.round(heightToSet / that.state.gridRowHeight) * that.state.gridRowHeight;

        chartDiv.style.top = updatedTop + 'px';
        chartDiv.style.height = updatedHeight + 'px';
      }

      // set Chart Width
      if (resizerName === 'corner' || resizerName === 'right') {
        const width = widthOnResizeStart + (e.pageX - mouseXOnResizeStart);
        const widthToSet = Math.max(minChartWidth, Math.min(maxChartWidth, width));
        updatedWidth = Math.round(widthToSet / that.state.gridColWidth) * that.state.gridColWidth;
        chartDiv.style.width = updatedWidth + 'px';
      }

      // set Chart Width and Left
      if (resizerName === 'left') {
        const left = leftOnResizeStart + (e.pageX - mouseXOnResizeStart);
        const leftToSet = Math.max(minChartLeft, Math.min(maxChartLeft, left));
        updatedLeft = Math.round(leftToSet / that.state.gridRowHeight) * that.state.gridRowHeight;

        const widthToSet = widthOnResizeStart + (leftOnResizeStart - leftToSet);
        updatedWidth = Math.round(widthToSet / that.state.gridColWidth) * that.state.gridColWidth

        chartDiv.style.left = updatedLeft + 'px';
        chartDiv.style.width = updatedWidth + 'px';
      }

      //check size to add class
      chartWidthClass = '';
      if (updatedWidth < defaultChartWidth) chartWidthClass = 'sm-grid-width';
      if (updatedWidth < smChartWidth) chartWidthClass = 'xs-grid-width';

      if (isScorecard) {
        if (updatedHeight < defaultChartHeight) chartWidthClass = 'sm-grid-width';
        if (updatedHeight < smChartHeight) chartWidthClass = 'xs-grid-width';
      }

      if (chartWidthClass !== 'sm-grid-width') { chartDiv.classList.remove('sm-grid-width'); }
      if (chartWidthClass !== 'xs-grid-width') { chartDiv.classList.remove('xs-grid-width'); }
      if (chartWidthClass !== '') { chartDiv.classList.add(chartWidthClass); }

      // update the text showing height and width
      let gridSizeText = '<span>Format: Default</span>';
      if (chartWidthClass === 'sm-grid-width') gridSizeText = '<span>Format: Medium</span>';
      if (chartWidthClass === 'xs-grid-width') gridSizeText = '<span>Format: Small</span>';
      gridSizeText += updatedWidth + 'px * ' + updatedHeight + 'px';
      chartDiv.querySelector('.grid-size').innerHTML = gridSizeText;
      updatedSW = (isSegmented && showLegend) ? that.getSegmentWidth(updatedWidth) : 0;

      let updatedLayout = {
        'w': updatedWidth,
        'h': updatedHeight,
        'x': updatedLeft,
        'y': updatedTop,
        'zindex': updatedZIndex,
        'sw': updatedSW,
        'id': updatedTempGridLayouts[chartLayoutIndex]['id']
      };

      mouseMove = true;
      that.renderChart(that.state.filteredChartsSettings[chartSettingIndex], false, updatedLayout, chartWidthClass);
    }

    function stopResize(e) {
      e.stopPropagation();
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
      document.body.style.pointerEvents = 'auto';
      chartDiv.querySelector('.grid-size').style.display = 'none';
      chartDiv.querySelector('.grid-size').innerHTML = '';

      if (!mouseMove) return;
      updatedTempGridLayouts[chartLayoutIndex]['w'] = updatedWidth;
      updatedTempGridLayouts[chartLayoutIndex]['h'] = updatedHeight;
      updatedTempGridLayouts[chartLayoutIndex]['x'] = updatedLeft;
      updatedTempGridLayouts[chartLayoutIndex]['y'] = updatedTop;
      updatedTempGridLayouts[chartLayoutIndex]['sw'] = updatedSW;
      updatedTempGridLayouts[chartLayoutIndex]['zindex'] = updatedZIndex;

      let stateObj = {
        tempChartsGridLayout: updatedTempGridLayouts
      };

      //update the original chartsGridLayout satte variable only when it is in edit mode
      if (that.isDashboardInEditMode()) {
        stateObj['chartsGridLayout'] = [...updatedTempGridLayouts]
      }

      that.setState(stateObj, () => {
        // setTimeout(()=>{
        that.renderChart(that.state.filteredChartsSettings[chartSettingIndex]);
        // },10);

        if (that.isDashboardInEditMode()) {
          that.handleDashboardChartLayoutSave(); //save the layout
        }
      });
    }
  }


  handleSegmentaionResizeStart(e, index, id) {
    e.preventDefault();
    e.stopPropagation();

    let showLegend = this.state.filteredChartsSettings[index]['showLegend'];
    let legend_wrapper = !showLegend ? '.legends-main-wrapper' : '.legends-container';

    const chartDiv = document.querySelector('#chart-' + id);
    const chartContentWrapperDiv = chartDiv.querySelector('.chart-content-wrapper');
    const chartLegendDiv = chartDiv.querySelector(legend_wrapper);
    const chartDivWidth = Number(chartDiv.style.width.replace('px', ''));

    //don't allow segment resize when segmented chart width is less than default chart width
    if (showLegend) {
      if (chartDivWidth < (this.state.chart_dimensions.defaultWidth + this.state.chart_dimensions.defaultSegmentWidth)) return false;
    }

    let legendWidthOnResizeStart, mouseXOnResizeStart;
    if (!showLegend) {
      legendWidthOnResizeStart = chartLegendDiv.style.width;
    } else {
      legendWidthOnResizeStart = Number(chartLegendDiv.style.width.replace('%', '')) * chartDivWidth / 100;
    }
    mouseXOnResizeStart = e.pageX;

    const maxLegendWidth = !showLegend ? (chartDivWidth - 2) : (chartDivWidth - this.state.chart_dimensions.defaultWidth);
    const minLegendWidth = !showLegend ? (this.state.chart_dimensions.defaultSegmentWidth / 2) : this.state.chart_dimensions.defaultSegmentWidth;

    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);

    const that = this;
    let legendWidthToSet = legendWidthOnResizeStart;
    let legendTable = chartLegendDiv.querySelector('.tooltip-table');

    function resize(e) {
      e.stopPropagation();
      document.body.style.pointerEvents = 'none'; // to disable trigger of mouse-hover event on any element while resizing
      document.body.style.userSelect = 'none';

      // const width = legendWidthOnResizeStart - (e.pageX - mouseXOnResizeStart);
      let width = 0;
      if (!showLegend) {
        width = Number(legendWidthOnResizeStart.replace('px', '')) - (e.pageX - mouseXOnResizeStart);
        legendWidthToSet = Math.max(minLegendWidth, Math.min(width, maxLegendWidth));
        chartLegendDiv.style.width = legendWidthToSet + 'px';
        legendTable.style.minWidth = legendWidthToSet + 'px';
        legendTable.style.width = 'auto';

      } else {
        width = Number(legendWidthOnResizeStart - (e.pageX - mouseXOnResizeStart));
        legendWidthToSet = Math.max(minLegendWidth, Math.min(width, maxLegendWidth));
        const widthPercentage = legendWidthToSet * 100 / chartDivWidth;
        chartLegendDiv.style.width = widthPercentage + '%';
        chartContentWrapperDiv.style.width = (100 - widthPercentage) + '%';
        legendTable.style.minWidth = widthPercentage + '%';
        legendTable.style.width = 'auto';
      }

      that.renderChart(that.state.filteredChartsSettings[index], false);
    }

    function stopResize(e) {
      e.stopPropagation();
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
      document.body.style.pointerEvents = 'auto';
      document.body.style.userSelect = 'auto';

      // update the legendWidth in state variable
      let updatedLayout = { ...that.state.tempChartsGridLayout[index], sw: legendWidthToSet };
      that.setState({
        tempChartsGridLayout: that.state.tempChartsGridLayout.map((l, i) => i !== index ? l : updatedLayout)
      }, () => {
        that.renderChart(that.state.filteredChartsSettings[index], false);

        if (that.isDashboardInEditMode()) {
          that.handleDashboardChartLayoutSave(); //save the layout
        }
      });
    }
  }

  //get canvas width to calculate the ratio
  getSavedCanvasWidth(intialDashboardSettingOnLoad = null) {
    let canvasWidth;
    let dashboardSettings = intialDashboardSettingOnLoad ? intialDashboardSettingOnLoad : this.state.dashboardSettingsLastSaved;

    let device_category = dashboardSettings.dashboard_other_settings.layout_setting.device_category;
    if (dashboardSettings.dashboard_other_settings.layout_setting.type === 'preset' && Constants.DevicesSizes[device_category] !== undefined) {
      let presetindex = Constants.DevicesSizes[device_category].findIndex((e) => e.name === dashboardSettings.dashboard_other_settings.layout_setting.device);
      if (presetindex > -1) {
        let deviceInfo = Constants.DevicesSizes[device_category][presetindex];
        let deviceSize = deviceInfo.size.split('*');
        canvasWidth = deviceSize[0];
      }
    } else {
      canvasWidth = (dashboardSettings.dashboard_other_settings.layout_setting.width);
    }
    return canvasWidth;
  }

  //get default canvas for view mode - fit to width
  getDefaultViewModeCanvsWidth() {
    return parseInt(window.innerWidth);
  }

  //get multicharts wrapper width
  getWrapperWidth() {
    let width;
    let actualWidth;
    let consolePanelWidth = (this.props.dashboardData.showConsolePanel ? 360 : 0);

    if (this.state.dashboardSettingsLastSaved.dashboard_other_settings.layout_setting.type === 'preset' && Constants.DevicesSizes[this.state.dashboardSettingsLastSaved.dashboard_other_settings.layout_setting.device_category] !== undefined) {
      let presetindex = Constants.DevicesSizes[this.state.dashboardSettingsLastSaved.dashboard_other_settings.layout_setting.device_category].findIndex((e) => e.name === this.state.dashboardSettingsLastSaved.dashboard_other_settings.layout_setting.device);
      if (presetindex > -1) {
        let deviceInfo = Constants.DevicesSizes[this.state.dashboardSettingsLastSaved.dashboard_other_settings.layout_setting.device_category][presetindex];
        let deviceSize = deviceInfo.size.split('*');
        actualWidth = deviceSize[0];
      }
    } else {
      actualWidth = (this.state.dashboardSettingsLastSaved.dashboard_other_settings.layout_setting.width);
    }

    let adjustWidth = actualWidth >= window.innerWidth ? (parseInt(actualWidth) - 10) : parseInt(actualWidth);
    if (this.isDashboardInEditMode() || this.state.currentViewModeType.name === 'Actual Width') {
      width = adjustWidth + consolePanelWidth + 'px';
    } else {
      width = parseInt(window.innerWidth) - 10 + consolePanelWidth + 'px';
    }
    return width;
  }

  //get multicharts wrapper height
  getWrapperHeight() {
    let height;
    let actualHeight;
    if (this.state.dashboardSettingsLastSaved.dashboard_other_settings.layout_setting.type === 'preset' && Constants.DevicesSizes[this.state.dashboardSettingsLastSaved.dashboard_other_settings.layout_setting.device_category] !== undefined) {
      let presetindex = Constants.DevicesSizes[this.state.dashboardSettingsLastSaved.dashboard_other_settings.layout_setting.device_category].findIndex((e) => e.name === this.state.dashboardSettingsLastSaved.dashboard_other_settings.layout_setting.device);
      if (presetindex > -1) {
        let deviceInfo = Constants.DevicesSizes[this.state.dashboardSettingsLastSaved.dashboard_other_settings.layout_setting.device_category][presetindex];
        let deviceSize = deviceInfo.size.split('*');
        actualHeight = deviceSize[1];
      }

    } else {
      actualHeight = (this.state.dashboardSettingsLastSaved.dashboard_other_settings.layout_setting.height);
    }

    if (this.isDashboardInEditMode() || this.state.currentViewModeType.name === 'Actual Width') {
      height = (parseInt(actualHeight) - 10) + 'px';
    } else {
      height = Math.round((parseInt(actualHeight) - 10) * this.getDefaultViewModeCanvsWidth() / this.getSavedCanvasWidth()) + 'px';
    }
    return height;
  }

  //change current view mode
  handleViewModeChange(e) {
    this.setState({ currentViewModeType: e }, () => {
      if (this.state.currentViewModeType.name === 'Fit to Width') {
        this.onWindowResize();
      } else {
        this.onWindowResize(true);
      }

      //save the preference
      this.updateUserPreferences('trendmaster_default_view_mode', this.state.currentViewModeType);
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
          if(!response) return;
          localStorage.setItem(Constants.SITE_PREFIX + 'settings', JSON.stringify(sightSettings));
        })
        .catch(err => {
          console.log('error', err);
        });
    }
  }


  render() {
    let chart_grid_details = this.getChartsGridDetails();
    let charts_wrapper_classes = chart_grid_details['charts_wrapper_classes'];

    // Decide content and  position of Scorecard's fixed info popup, if it is to be shown for some scorecard( it is shown when info btn of some scorecard has been clicked)
    let scoreCardClickedInfo = this.state.clickedScorecardInfo;
    if (scoreCardClickedInfo) {
      scoreCardClickedInfo['chartDateRangeToShow'] = (scoreCardClickedInfo['dynamic_time_period'] || this.state.dashboardSettingsLastSaved.dynamic_time_period);
      if (scoreCardClickedInfo['chartDateRangeToShow'] === null) {
        scoreCardClickedInfo['chartDateRangeToShow'] = FALLBACK_TIME_PERIOD_FOR_CHARTS;
      }
      scoreCardClickedInfo['chartDateRangeToShow'] = scoreCardClickedInfo['chartDateRangeToShow'].is_dynamic ? convertDatePeriodPreselectsToRange(scoreCardClickedInfo['chartDateRangeToShow'].value, scoreCardClickedInfo['chartDateRangeToShow'].custom_dates) : scoreCardClickedInfo['chartDateRangeToShow'].value;
      scoreCardClickedInfo['chartDateRangeToShow'] = giveDotSeparatedDateRange(scoreCardClickedInfo['chartDateRangeToShow']);
    }

    // let chartSegmentWidth = this.state.chart_dimensions.defaultSegmentWidth;
    // let chartWidthClass = '';
    // if (chartWidthClass === 'sm-grid-width') { chartSegmentWidth = this.state.chart_dimensions.smSegmentWidth; }
    // if (chartWidthClass === 'xs-grid-width') { chartSegmentWidth = this.state.chart_dimensions.xsSegmentWidth; }

    return (
      <div className="trend-view-wrapper">
        <div className={`trend-view odin-multicharts clearfix panel-${this.props.consolePanelPosition} console-${this.props.showConsolePanel ? 'open' : 'minimized'}`}>
          {this.props.dashboardData.showConsolePanel &&
            <ClickOutsideListener onOutsideClick={(e) => this.handleConsolePanelOutsideClick(e)}>
              <div id="console-content-wrapper"
                className={'col-view ' + (this.state.consolePanelSelectedTab === 'dashboard_settings' ? 'panel-large ' : '') + (this.props.consolePanelPosition) + (this.props.isPublicView!==undefined ? ' pos-t30' : '')}
                ref={this.consolePanelRef}>

                {this.getConsolePanelTabContent()}
              </div>

              {/* Show discard message  */}
              {this.state.showNewSettingsDiscardMessage &&
                <div className={'discard-message-wrapper ' + (this.props.consolePanelPosition)}>
                  <button className="btn-close" disabled={this.state.chartOrDashboardSaveInProcess} onClick={this.handleDiscardScreenCloseBtn}></button>
                  <div className="discard-message-inner">
                    <div className="message">Do you want to discard the existing settings?</div>
                    <button className="btn btn-medium" disabled={this.state.chartOrDashboardSaveInProcess} onClick={this.handleDiscardScreenSaveBtn}>{this.state.chartOrDashboardSaveInProcess ? 'Saving...' : 'Save'}</button>
                    <button className="btn btn-medium" disabled={this.state.chartOrDashboardSaveInProcess} onClick={this.handleDiscardScreenDiscardBtn}>Discard</button>
                  </div>
                </div>
              }
            </ClickOutsideListener>
          }

          {this.state.authroisedDashboardAccess &&
            <div id="console-tabs-wrapper"
              className={this.props.consolePanelPosition}
              onMouseDown={(e) => this.handleConsolePanelDragStart(e, 'console-tabs-wrapper')}>
              {this.getConsolePanelTabList()}
            </div>
          }
          

          {/* Charts - Panel */}
          <div id="col-charts-wrapper" ref={this.chartsColWrapper} className={'col-view ' + (charts_wrapper_classes) + (this.props.isPublicView!==undefined ? ' pos-t30' : '')}>
            {this.state.inprocess && <LoaderbyData />}

            <div id="chart-section">
              <div id="multicharts-wrapper-scrollable" ref={this.multiChartsScrollableWrapper} className={this.state.chartsSettings.length === 0 ? ' empty-chart-list' : ''}>
                {!this.state.inprocess &&
                  <div id="multicharts-wrapper" ref={this.multiChartsWrapper} style={{ width: this.getWrapperWidth(), height: this.getWrapperHeight() }}>
                    <div id="multicharts">
                      {this.state.filteredChartsSettings.length > 0 &&
                        this.state.filteredChartsSettings.map((chart, i) => {
                          if (chart.show !== undefined && chart.show === false) return null;
                          return this.giveIndividualChartHtml(chart, i)
                        })
                      }

                      {this.isDashboardInEditMode() &&
                        <div className="grid-lines">
                          <svg width={window.innerWidth} height={window.innerHeight - 70} xmlns="http://www.w3.org/2000/svg">
                            <defs>
                              <pattern id={`multiple-smallGrid-${this.getDashboardID()}`} width="5" height="5" patternUnits="userSpaceOnUse">
                                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#222222" strokeWidth="1" strokeOpacity="1" />
                              </pattern>
                              <pattern id={`multiple-grid-${this.getDashboardID()}`} width="5" height="5" patternUnits="userSpaceOnUse">
                                <rect width="5" height="5" fill={`url(#multiple-smallGrid-${this.getDashboardID()})`} />
                              </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill={`url(#multiple-grid-${this.getDashboardID()})`} />
                          </svg>
                        </div>
                      }

                      {/* When no chart is available in dashboard */}
                      {this.state.chartsSettings.length === 0 &&
                        <div id="no-chart-msg" className={(this.state.dashboardSettingsLastSaved.dashboard_other_settings.layout_setting.width + 360) > window.innerWidth ? 'pad-r360' : ''}>
                          <div className="msg-wrapper">
                            {(!this.isDashboardInEditMode() && this.state.authroisedDashboardAccess) && 'You do not have any widgets added to this file. Go to edit mode to add widgets.'}
                            {!this.state.authroisedDashboardAccess ? 'Page not found.' : ''}
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }

                {/* Custom Scrollbars - Vertical/Horizontal */}
                {(this.props.showConsolePanel && this.state.filteredChartsSettings.length > 0) &&
                  <div className={'asc-progressbar-wrapper horizontal ' + this.props.consolePanelPosition} ref={this.ascHProgressBar}>
                    <div className="asc-anchor" ref={this.ascHAnchor}></div>
                  </div>
                }
                {(this.state.filteredChartsSettings.length > 0) &&
                  <div className={'asc-progressbar-wrapper vertical ' + this.props.consolePanelPosition} ref={this.ascVProgressBar}>
                    <div className="asc-anchor" ref={this.ascVAnchor}></div>
                  </div>
                }
              </div>

              {this.state.previewChartSettings !== null &&
                <div id="chart-preview-container">
                  <div className="chart-preview-msg">You are previewing widget - <span>ID {this.state.previewChartSettings.id}</span> {this.state.previewChartSettings.name}</div>
                  <div className="chart-preview-wrapper">
                    {this.giveIndividualChartHtml(this.state.previewChartSettings, null)}
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export default ReportView;