import React, { Component } from 'react';
import * as d3 from 'd3';
import moment from 'moment';
// import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import * as Constants from '../components/Constants.js';
import subjectObj from '../subjects/Subject1';

import '../styles/Global.scss';
// import '../styles/ReportViews.scss';
import '../styles/AnalysisViews.scss';

import ClickOutsideListner from '../components/ClickOutsideListner';
import NewAnalysisButton from '../components/views/NewAnalysisButton';
import DateRangeSelector from '../components/DateRangeSelector/DateRangeSelector';
import ReactDivTable from '../components/table/ReactDivTable';
import MultiSelectList from '../components/MultiSelectList';
import AnalysisViewSave from './AnalysisViewSave';

import { getKeyByValue, getClients, getUser, isEmptyObject } from '../utils/Common'; //Import Common Functions
import APIService from '../services/apiService'; //Import Services

/**************************************
 * Functions - Filters Drag and Drop
 */
// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

const uniqueID = () => {
  return Math.random().toString(36).substr(2, 9);
};

/* End - Filters Drag and Drop
 **************************************/

  
class AnalysisView3 extends Component {
  constructor(props) {
    super(props);
    // console.time('sight: Component - init');

    //Get Client & View Type & User
    this.client = getKeyByValue(getClients(), props.match.params.id);
    this.view_type = props.match.params.view_type;
    this.user = getUser();
    this.container = React.createRef();

    this.state = {
      inprocess: false,
      inprocess_percent: 0,
      inprocess_number: 0,
      total_content_length: 0,
      show_data_loading: false,
      data_request_status: '',
      data_requests_list: [],
      error: "",
      sublevel_inprocess: false,
      sublevel_error: "",
      selected_rows_count: 0,
      selected_columns_count: 0,
      filter_panel_tabs: [false, true],
      last_updated_date: '',
      last_updated_date_for_datepicker: '',
      selected_date_range: '',
      new_selected_date_range: '',
      selectedDateRange: {},
      selected_dimensions: {},

      analysisid: '',
      analysisColumns: '',
      analysisColumnsDisplay: '', // used for showing table header grouping
      analysisColumnsWidth: null, 
      analysisTableWidth: null,
      analysisData: '',
      selectedFilterItem: null,
      highlightedBlocks: [],
      all_items: this.getViewDimensionsAllList(this.view_type),
      selected_filters: [],
      selected_rows: [{id:'date',title:'date',type:'date'}],
      selected_columns: [{id:'values',title:'values',type:'string'}],
      selected_values: this.getMeasurementValuesList(this.view_type),
      current_number_operations_key: '',
      show_number_operations_list: false,
      toggleFilterPanel: false,
      filter_panel_date_period_change_msg: '',
      operation_list_pos_top: 0,
      dimensions: {},
      filtersSelectionBoxStatus: false, // Filters selection box stat
      currentSelectedFilter: '', // Selected Filter type
      currentSelectedFilterOptions: [], //Filters Select List Options
      collapseExpandedRow: false, //collapse all expanded rows and change icon on apply filter button click

      showSaveAnalysisDrawer: false,
      organizationsList: [],
      organizationsUsersList: [],
      isSavedView: (this.props.location.state!==undefined && this.props.location.state.isSavedView!==undefined) ? this.props.location.state.isSavedView : false,
      savedViewTitle: (this.props.location.state!==undefined && this.props.location.state.savedViewTitle!==undefined) ? this.props.location.state.savedViewTitle : false,
      savedAnalysisPeriod: (this.props.location.state!==undefined && this.props.location.state.analysisPeriod!==undefined) ?  this.props.location.state.analysisPeriod : false,
      savedAnalysisConfig: (this.props.location.state!==undefined && this.props.location.state.analysisConfig!==undefined) ?  JSON.parse(this.props.location.state.analysisConfig) : false
    }

    /** Drag and Drop
     * A semi-generic way to handle multiple lists. Matches
     * the IDs of the droppable container to the names of the
     * source arrays stored in the state.
     */
    this.id2List = {
      all_list: 'all_items',
      filters: 'selected_filters',
      rows: 'selected_rows',
      columns: 'selected_columns',
      values: 'selected_values',
    };
    
    //Event Bind
    this.getAllDimensions = this.getAllDimensions.bind(this);
    this.getAnalysisID = this.getAnalysisID.bind(this);
    this.getAnalysisData = this.getAnalysisData.bind(this);
    this.analysisPeriodChange = this.analysisPeriodChange.bind(this);
    this.openValuesOperationsList = this.openValuesOperationsList.bind(this);
    this.selectOperation = this.selectOperation.bind(this);
    this.handleAnalysisFilterSubmit = this.handleAnalysisFilterSubmit.bind(this);
    this.toggleFiltersPanel = this.toggleFiltersPanel.bind(this);
    this.handleAnalysisPeriodChange = this.handleAnalysisPeriodChange.bind(this);
    this.handleLoadDataWithAnalysisID = this.handleLoadDataWithAnalysisID.bind(this);
    this.handleAnalysisFiltersReset = this.handleAnalysisFiltersReset.bind(this);

    this.toggleSaveAnalysisDrawer = this.toggleSaveAnalysisDrawer.bind(this);
    this.handleBackToAnalysisHome = this.handleBackToAnalysisHome.bind(this);
    
    this.handleSubLevelDataFetch = this.handleSubLevelDataFetch.bind(this); //Table Sub level data fetch
    this.handleTableDataSorting = this.handleTableDataSorting.bind(this); //Table Sorting

    this.analysisFiltersPanel = this.analysisFiltersPanel.bind(this); //Analysis Filters Panel Component
    this.handleFilterTabChange = this.handleFilterTabChange.bind(this); //Analysis Filters Panel Component
    this.handleAnalysisFilter = this.handleAnalysisFilter.bind(this); //handle filter blocks item click
    this.handleMultiSelectFiltersClose = this.handleMultiSelectFiltersClose.bind(this); //handle multi select list close
    this.handleMultiSelectLFiltersSelection = this.handleMultiSelectLFiltersSelection.bind(this); //handle multi select list selection

    //Remove select filters element in rows/columns/values
    this.handleCloseSelectedFilter = this.handleCloseSelectedFilter.bind(this);

    //Check columns/rows count
    this.checkColumnsCount = this.checkColumnsCount.bind(this);
    this.checkRowsCount = this.checkRowsCount.bind(this);
    this.handleDownloadView = this.handleDownloadView.bind(this); //download view

    this.handleFilterClick = this.handleFilterClick.bind(this);
    this.handleSelectedFilter = this.handleSelectedFilter.bind(this);
    this.handleFilterOrder = this.handleFilterOrder.bind(this);
  }


  componentDidMount(){
    // console.timeEnd('sight: Component - init');
    this.handleLoadScripts();

  }

  //Reload the page if client id/name change from url
  componentDidUpdate(prev_props){
    if((prev_props.match.params.id!==this.props.match.params.id) || 
      (prev_props.match.params.view_type!==this.props.match.params.view_type) || 
      (prev_props.location.state!==undefined && this.props.location.state!==undefined && prev_props.location.state.isSavedView!==this.props.location.state.isSavedView) ){
      this.client = getKeyByValue(getClients(), this.props.match.params.id);
      this.view_type = this.props.match.params.view_type;

      //Update State Values
      this.setState({
        inprocess: false,
        inprocess_percent: 0,
        inprocess_number: 0,
        total_content_length: 0,
        show_data_loading: false,
        data_request_status: '',
        data_requests_list: [],
        error: "",
        sublevel_inprocess: false,
        sublevel_error: "",
        selected_rows_count: 0,
        selected_columns_count: 0,
        filter_panel_tabs: [false, true],
        last_updated_date: '',
        last_updated_date_for_datepicker: '',
        selected_date_range: '',
        new_selected_date_range: '',
        selectedDateRange: {},
        selected_dimensions: {},
        analysisid: '',
        analysisColumns: '',
        analysisColumnsDisplay: '', // used for showing table header grouping
        analysisColumnsWidth: null, 
        analysisTableWidth: null,
        analysisData: '',
        selectedFilterItem: null,
        highlightedBlocks: [],
        all_items: this.getViewDimensionsAllList(this.view_type),
        selected_filters: [],
        selected_rows: [{id:'date',title:'date',type:'date'}],
        selected_columns: [{id:'values',title:'values',type:'string'}],
        selected_values: this.getMeasurementValuesList(this.view_type),
        current_number_operations_key: '',
        show_number_operations_list: false,
        toggleFilterPanel: false,
        filter_panel_date_period_change_msg: '',
        operation_list_pos_top: 0,
        dimensions: {},
        filtersSelectionBoxStatus: false, // Filters selection box stat
        currentSelectedFilter: '', // Selected Filter type
        currentSelectedFilterOptions: [], //Filters Select List Options
        collapseExpandedRow: false, //collapse all expanded rows and change icon on apply filter button click
        showSaveAnalysisDrawer: false,
        organizationsList: [],
        organizationsUsersList: [],
        isSavedView: (this.props.location.state!==undefined && this.props.location.state.isSavedView!==undefined) ? this.props.location.state.isSavedView : false,
        savedAnalysisPeriod: (this.props.location.state!==undefined && this.props.location.state.analysisPeriod!==undefined) ?  this.props.location.state.analysisPeriod : false,
        savedAnalysisConfig: (this.props.location.state!==undefined && this.props.location.state.analysisConfig!==undefined) ?  JSON.parse(this.props.location.state.analysisConfig) : false,
        analysisSavePeriod: ""
      });

      if(this.client){
        this.handleLoadScripts();
      }
    }
  }

  //Load Scripts on Page/View Load
  handleLoadScripts(){
    //Get Last Updated Date
    // console.time('sight: getLastUpdatedDate - init');
    this.getLastUpdatedDate();

    //Load Organization List if it is not saved view
    if(this.state.isSavedView===undefined || this.state.isSavedView===false){
      //Get Org and Users List
      this.getOrganizationsAndUsersList();

      setTimeout(() => {
        this.toggleFiltersPanel();
      }, 1200);
    }
  }


  //Get Last Updated Date
  getLastUpdatedDate(){
    // console.timeEnd('sight: getLastUpdatedDate - init');

    //Input Validations
    this.setState({ 
      error: '', 
      inprocess: true
    });
        
    const datePayLoad = {
      "client_id": this.client.id,
      "view_type": this.view_type
    };

    // console.time('sight: getLastUpdatedDate - API call');
    APIService.apiRequest(Constants.API_BASE_URL+'/getLastUpdatedDate', datePayLoad)
      .then(response => {
        if(response.status===1 && response.data!==undefined){
          let lastupdateddate = JSON.parse(response.data);
          let defaultCount = 29; //6;
          let defaultFormat = 'days';

           //for saved views
          if(this.state.isSavedView){
            if(this.state.savedAnalysisPeriod && this.state.savedAnalysisPeriod!==''){
              if(this.state.savedAnalysisPeriod==='Last 7 Days'){ defaultCount = 6; }
              if(this.state.savedAnalysisPeriod==='Last 15 Days'){ defaultCount = 14; }
              if(this.state.savedAnalysisPeriod==='Last 30 Days'){ defaultCount = 29; }
              if(this.state.savedAnalysisPeriod==='Last Month'){ 
                defaultCount = 1;  
                defaultFormat = 'months';
              }
            }
          }

          //Set last updated date and last 30days date range under analysis period input box
          let formattedDate = moment(lastupdateddate[0]['last_updated_date'], moment.ISO_8601).format('MMM DD, YYYY');
          let formattedEndDate = moment(lastupdateddate[0]['last_updated_date'], moment.ISO_8601).toDate();
          let formattedStartDate = moment(formattedEndDate).subtract(defaultCount, defaultFormat).toDate();

          if(defaultFormat==='months'){ //for saved views
            formattedStartDate = moment(formattedEndDate).subtract(defaultCount, defaultFormat).startOf('month').toDate();
            formattedEndDate = moment(formattedEndDate).subtract(defaultCount, defaultFormat).endOf('month').toDate();
          } 

          // let formattedStartDate = moment(formattedEndDate).subtract(defaultCount, defaultFormat).toDate();
          let formattedDateRange = {startDate: formattedStartDate, endDate: formattedEndDate};
          this.setState({
            last_updated_date: formattedDate,
            last_updated_date_for_datepicker: formattedEndDate,
            selectedDateRange: formattedDateRange,
            // inprocess: false
          });
          
          //Pass LastUpdatedDate to Header Component
          subjectObj.notify({
            last_updated_date: this.state.last_updated_date,
            client: this.client
          });
          // console.timeEnd('sight: getLastUpdatedDate - API call');

          //Load Chart Data
          if(this.state.isSavedView){
            this.analysisPeriodChange(this.state.selectedDateRange);
          } else {
            this.getDataGrid(this.state.selectedDateRange); //Load data grid for faster data display
          }
        } else {
          this.setState({inprocess: false, error: response.msg});
        }
      })
      .catch(err => {
        this.setState({ error: err.msg });
      });
  }

  //Used under AnalysisViewSave
  getOrganizationsAndUsersList(){
    // console.timeEnd('sight: getOrganizationsAndUsersList - init');
    
    //Input Validations
    // console.time('sight: getOrganizationsAndUsersList - API call');
    APIService.apiRequest(Constants.API_BASE_URL+'/getOrganizationAndUserList', null)
      .then(response => {
        if(response.status===1 && (response.organization!==undefined || response.user!==undefined)){
          // console.timeEnd('sight: getOrganizationsAndUsersList - API call');

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
        console.log('Error on getting organizations list: '+ err.msg);
      });
  }

  //Format Date
  formatDate(date, date_format){
    return moment(date).format(date_format);
  }

  //Get Date Range - pass end_date, days_count, date_format, and seperator
  getDateRange(end_date, days_count, date_format, seperator){
    var start_date = moment(end_date).subtract((days_count-1), 'days').format(date_format);
    return (start_date + seperator + end_date);
  }

  //On Analysis Period Change
  analysisPeriodChange(date_range){
    // let formattedDate = moment(date_range[0], moment.ISO_8601).format('MMM DD, YYYY');
    var start_date = this.formatDate(date_range['startDate'], 'MM/DD/YYYY');
    var end_date = this.formatDate(date_range['endDate'], 'MM/DD/YYYY');
    var formatted_date_range = start_date+' - '+end_date;
    
    //Input Validations and Send Fetch Request
    this.setState({
      selected_date_range: formatted_date_range,
      selectedDateRange: date_range,
    });

    //Get Start Analysis
    // console.time('sight: getAnalysisID - init');
    // let start = this.state.isSavedView ? false : true;
    const chartsPayLoad = {...this.getAnalysisFilters(true), daterange:formatted_date_range};
    this.getAnalysisID(chartsPayLoad, this.state.isSavedView);
  }

  //Only change the date range in state - don;t call the api
  handleAnalysisPeriodChange(date_range){
    var start_date = this.formatDate(date_range['startDate'], 'MM/DD/YYYY');
    var end_date = this.formatDate(date_range['endDate'], 'MM/DD/YYYY');
    var formatted_date_range = start_date+' - '+end_date;
     
    //Input Validations and Send Fetch Request
    this.setState({
      new_selected_date_range: formatted_date_range,
      selectedDateRange: date_range
    });

    // console.timeEnd('sight: getAnalysisID - init');
    //   const chartsPayLoad = {...this.getAnalysisFilters(true), daterange:formatted_date_range};
    //   this.getAnalysisID(chartsPayLoad, this.state.isSavedView);
  }

  //Being called from new analysis - filter panel - on Load Data button click
  handleLoadDataWithAnalysisID(){
    const chartsPayLoad = {...this.getAnalysisFilters(true), daterange: this.state.new_selected_date_range};
    this.handleAnalysisFiltersReset(); //reset filters
    this.getAnalysisID(chartsPayLoad, this.state.isSavedView, true); //call start analysis
  }

  //Reset Selected Filters
  handleAnalysisFiltersReset(){
    let obj = {
      'all_items': this.getViewDimensionsAllList(this.view_type),
      'selected_filters': [],
      'selected_dimensions': {},
      'selected_rows': [{id:'date',title:'date',type:'date'}],
      'selected_columns': [{id:'values',title:'values',type:'string'}],
      'selected_values': this.getMeasurementValuesList(this.view_type),
      'current_number_operations_key': '',
      'show_number_operations_list': false,
      'operation_list_pos_top': 0,
      'filtersSelectionBoxStatus': false,
      'currentSelectedFilter': '',
      'currentSelectedFilterOptions': []
    }
    this.setState(obj);
  }


  //Get Analysis Filters
  getAnalysisFilters(start=false){
    let obj;
    
    if(start){
      obj = {
        "client_id": this.client.id,
        "view_type": this.view_type
      }; 
      if(this.view_type==='performance'){
        obj['data_source'] = 'advertiser';
      }
    } else {
      //Pass property names under dimensions if it is site specific login
      let dimension_filters = this.state.selected_dimensions;
      if(this.user.parent_organization_id > 1 && !isEmptyObject(this.state.selected_dimension) && this.state.selected_filters.length <= 0){
        let filters = [];
        if(Array.isArray(this.user.attributes)){
          this.user.attributes.forEach((item) => {
            if(item.site_name!==undefined){
              filters.push(item.site_name);
            }
          });
        }
        dimension_filters = {"property": filters};
      }

      let isSavedView = (this.state.isSavedView!==undefined && this.state.isSavedView===true) ? true : false;
      if(isSavedView){ //saved view
        //Load Saved View Filters Config
        this.setState({
          selected_rows: this.state.savedAnalysisConfig['rows'],
          selected_columns: this.state.savedAnalysisConfig['columns'],
          selected_values: this.state.savedAnalysisConfig['values'],
          selected_dimensions: (this.state.savedAnalysisConfig['filters']) ? this.state.savedAnalysisConfig['filters'] : dimension_filters
        });
      }

      obj = {
        "analysisid": this.state.analysisid,
        "rows": this.generateSelectedRowsColsElements(this.state.selected_rows),
        "columns": this.generateSelectedRowsColsElements(this.state.selected_columns), 
        "measurements": {},
        "filters": isSavedView ? this.state.selected_dimensions : dimension_filters
      }
    }
    return obj;
  }

  //Get Date Grid Initially for faster data grid display
  getDataGrid(date_range){
    // console.timeEnd('sight: getDataGrid - init');
    var start_date = this.formatDate(date_range['startDate'], 'MM/DD/YYYY');
    var end_date = this.formatDate(date_range['endDate'], 'MM/DD/YYYY');
    var formatted_date_range = start_date+' - '+end_date;
    
    //Input Validations and Send Fetch Request
    this.setState({
      selected_date_range: formatted_date_range,
      selectedDateRange: date_range,
      error: '',
      inprocess: true
    });

    let columns_order = ['revenue' , 'impressions', 'cpm'];
    if(this.view_type==='webanalytics'){ columns_order = ['page_views' , 'sessions', 'users'] }
    if(this.view_type==='performance'){ columns_order = ['rpm' , 'rps', 'rpu'] }
    const analysisPayLoad = {...this.getAnalysisFilters(true), daterange:formatted_date_range, column_order: columns_order};


    //Input Validations and Send Fetch Request
    // console.time('sight: getDataGrid - API call'); 
    APIService.apiRequest(Constants.API_BASE_URL+'/getDataGrid', analysisPayLoad)
      .then(response => {
        if(response.status===1 && response.data!==undefined){
          // console.timeEnd('sight: getDataGrid - API call'); 

          let results = JSON.parse(response.data);
          this.setState({
            inprocess: false, 
            analysisColumns: Object.keys(results[0]),
            analysisData: results
          });
          
          //Get Analysis ID
          // console.time('sight: getAnalysisID - init');
          const analysisIDPayLoad = {...this.getAnalysisFilters(true), daterange:formatted_date_range}
          this.getAnalysisID(analysisIDPayLoad, this.state.isSavedView);

        } else {
          this.setState({inprocess: false });
        }
      })
      .catch(err => {
        this.setState({ error: err.msg });
      });
  }


  //Get Analysis ID and then Get Analysis Data based on received analysis id
  getAnalysisID(analysisPayLoad, isSavedView, isCalledOnPeriodChange=false){
    // console.timeEnd('sight: getAnalysisID - init');

    this.checkColumnsCount();
    this.checkRowsCount();
    
    //Input Validations and Send Fetch Request
    let initState = { 
      error: '',
      // inprocess: false,
      inprocess_percent: 0,
      inprocess_number: 0,
      total_content_length: 0
    }
    if(isSavedView){
      initState['inprocess'] = true;
    }
    if(isCalledOnPeriodChange){
      initState['inprocess'] = true;
      initState['filter_panel_date_period_change_msg'] = '';
    }
    this.setState(initState);

    // console.time('sight: getAnalysisID - API call'); 
    APIService.apiRequest(Constants.API_BASE_URL+'/startAnalysis', analysisPayLoad)
      .then(response => {
        if(response.status===1 && response.analysisid!==undefined){
          // console.timeEnd('sight: getAnalysisID - API call'); 

          //If new analysis 
          if(!isSavedView){
            //Get Charts Date
            var updated_selected_date_range = this.state.new_selected_date_range;
            var objState = {
              inprocess: false,
              analysisid: response.analysisid,
              selected_date_range: updated_selected_date_range,
              new_selected_date_range: ''
            }

            //Load data on new analysis date period change and reset all filters to default
            if(isCalledOnPeriodChange){
              objState['filter_panel_date_period_change_msg'] = 'Date loaded successfully. You can proceed to apply filter';
              objState['analysisColumns'] = Object.keys(response.data[0]);
              objState['analysisData'] = response.data;
            }
            this.setState(objState);

            // this.getAnalysisData(false);

          } else { //saved view
            this.setState({
              // inprocess: false,
              analysisid: response.analysisid
            });

            let analysisSavedViewPayLoad = {...this.getAnalysisFilters(), analysisid:response.analysisid};

            setTimeout(() => {
              // console.time('sight: getAnalysisData - init');
              this.getAnalysisData(analysisSavedViewPayLoad, performance.now()); //analysis_payload, request initate time
            },10);
          }
        } else {
          this.setState({error: response.msg });
        }
      })
      .catch(err => {
        this.setState({ error: err.msg });
      });
  }

  //Get Analysis Data
  getAnalysisData(analysisPayLoad, request_send_time){
    // console.timeEnd('sight: getAnalysisData - init');
    
    let function_call_received_time = performance.now();
    let calc_request_time = (function_call_received_time - request_send_time).toFixed(2);
    let data_req_list = [
      {id: 1, name: 'Request sent', time: calc_request_time, status: 'completed'},
      {id: 2, name: 'Waiting for server response', time: 0, status: ''}
    ];

    //Input Validations and Send Fetch Request
    this.setState({ 
      error: '',
      inprocess: false,
      inprocess_percent: 0,
      inprocess_number: 0,
      total_content_length: 0,
      show_data_loading: true,
      data_requests_list: data_req_list
    });

    console.time('sight: getAnalysisData - API call');
    let api_request_time = performance.now();

    APIService.apiRequest(Constants.API_BASE_URL+'/getAnalysisLData', analysisPayLoad)
      .then(response => {
        // version 1.0
        let api_response_waiting_time = performance.now();
        let data_req_list = JSON.parse(JSON.stringify(this.state.data_requests_list));
        data_req_list[1]['time'] = (api_response_waiting_time-api_request_time).toFixed(2);
        data_req_list[1]['status'] = 'completed';

        this.setState({
          show_data_loading: false,
          data_requests_list: data_req_list,
          analysisColumns: response.columns,
          analysisColumnsDisplay: response.columns_display,
          analysisColumnsWidth: response.columns_width,
          analysisTableWidth: response.table_width,
          analysisData: JSON.parse(response.data)
        });

        console.timeEnd('sight: getAnalysisData - API call');
      })
      .catch(err => {
        this.setState({ error: err.msg });
      });
  }


  //Get Analysis Data
  getAnalysisSubLevelData(analysisPayLoad, row_index, level_details){
    // console.timeEnd('sight: getAnalysisSubLevelData - init');

    //Input Validations and Send Fetch Request
    this.setState({ sublevel_error: '', sublevel_inprocess: true });
    
    // console.time('sight: getAnalysisSubLevelData - API call');
    APIService.apiRequest(Constants.API_BASE_URL+'/getAnalysisLData', analysisPayLoad, true)
      .then(response => {
        const contentLength = response.total_len;
        let total = 0;
        let chunks = [];
        let that = this;
        
        response.reader.read().then(function processResult(result) {
          if (result.done) {
            // Step 4: concatenate chunks into single Uint8Array
            let chunksAll = new Uint8Array(total); // (4.1)
            let position = 0;
            for(let chunk of chunks) {
              chunksAll.set(chunk, position); // (4.2)
              position += chunk.length;
            }

            // Step 5: decode into a string
            let result = new TextDecoder("utf-8").decode(chunksAll);

            // We're done!
            let results = JSON.parse(result);
            // console.timeEnd('sight: getAnalysisSubLevelData - API call');

            let clonedObj = JSON.parse(JSON.stringify(that.state.analysisData));
            let data = JSON.parse(results.data);
            let rows = row_index.split('_');
            let obj;

            for(let i=0, len=rows.length; i<len; i++){
              obj = (obj) ? obj['has_sub_level'][rows[i]] : clonedObj[rows[i]];
              if(i === (len-1) && !obj['has_sub_level']){
                obj['has_sub_level'] = data;
              }
            }

            //Update rows count in sub header
            let current_rows_length = that.state.selected_rows_count;

            setTimeout(()=>{
              that.setState({
                total_content_length: parseInt(that.state.total_content_length+contentLength),
                sublevel_inprocess: false,
                analysisColumnsDisplay: results.columns_display,
                analysisData: clonedObj,
                selected_rows_count: (current_rows_length+data.length)
              });
            },0);
            
            return total;
          }

          const value = result.value;
          total += value.length;
          chunks.push(value); //get all the chunks

          return response.reader.read().then(processResult);
        })
      })
      .catch(err => {
        this.setState({ sublevel_inprocess: false, sublevel_error: err.msg });
      });
  }

  /********************************
   * Drag and Drop Functionalty 
   */

  //Get List - Drag and Drop
  getList = id => this.state[this.id2List[id]];


  //Check and give Max number of columns selection alert
  checkColumnsCount(){
    let selected_values_count = this.state.selected_values.length;
    let cells_count = 1;
    this.state.selected_columns.forEach((item) => {
      if(item.id!=="values" && item.id!=='date'){
        if(this.state.selected_dimensions[item.id]!==undefined && this.state.selected_dimensions[item.id].length > 0){
          cells_count = (cells_count * this.state.selected_dimensions[item.id].length);
        } else {
          cells_count = (cells_count * this.state.dimensions[item.id].length);
        }
      }
      if(item.id==='date'){
        let startDate = moment(this.state.selectedDateRange.startDate);
        let endDate = moment(this.state.selectedDateRange.endDate);
        let date_Range_count = (endDate.diff(startDate, 'days') + 1);
        cells_count = (cells_count * date_Range_count);
      }
    });
    cells_count = (cells_count*selected_values_count);
    this.setState({selected_columns_count: (cells_count+1)});
  }

  //Check Rows Count
  checkRowsCount(){
    let rows_count = 0;

    this.state.selected_rows.forEach((item, i) => {
      if(i===0){
        if(item.id!=="values" && item.id!=='date'){
          if(this.state.selected_dimensions[item.id]!==undefined && this.state.selected_dimensions[item.id].length > 0){
            rows_count = (rows_count + this.state.selected_dimensions[item.id].length);
          } else {
            rows_count = (rows_count + this.state.dimensions[item.id].length);
          }
        }
        if(item.id==='date'){
          let startDate = moment(this.state.selectedDateRange.startDate);
          let endDate = moment(this.state.selectedDateRange.endDate);
          let date_Range_count = (endDate.diff(startDate, 'days') + 1);
          rows_count = (rows_count + date_Range_count);
        }
      }
    });

    this.setState({selected_rows_count: rows_count});
  }


  //Get Values under Columns and Rows
  generateSelectedRowsColsElements(arr){
    var selected_values;
    var hasValues = arr.find((item, index) => {
      if(item.title === 'values') return true;
    });
    selected_values = this.getkeyValuesInArray(arr, 'title');

    if(hasValues){  
      var newValues = [];
      selected_values.map((item, index) => {
        if(item==='values'){
          newValues.push({'values': this.generateValues(this.state.selected_values)});
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


  //On Filters/Rows/Columns/Values Selection Submit
  handleAnalysisFilterSubmit(){
    //Get Charts Data
    //Get Analysis Parameters
    let analysisPayLoad = {
      ...this.getAnalysisFilters(),
      rows: this.generateSelectedRowsColsElements(this.state.selected_rows),
      columns: this.generateSelectedRowsColsElements(this.state.selected_columns)
    };
    // console.time('sight: getAnalysisData - init');
    this.getAnalysisData(analysisPayLoad, performance.now()); //analysis_payload, request initate time
    this.setState({collapseExpandedRow: true});
  }



  /********************************
   * Table Functionalties
   */
  // On Table Sorting
  handleTableDataSorting(sortkey, order){
    const data = JSON.parse(JSON.stringify(this.state.analysisData));
    // console.log(sortkey+'---'+order);

    data.sort(function (a,b) {
      if(order==='desc'){
        return d3.descending(a[sortkey], b[sortkey]);
      } else {
        return d3.ascending(a[sortkey], b[sortkey]);
      }
    });

    this.setState({ analysisData: data });
  }

  //On click of exppand icon - fetch sub level data of analysis
  handleSubLevelDataFetch(level_details, row_index){
    // console.time('sight: getAnalysisSubLevelData - init');
    // console.log('hello '+levelkeyval +'--'+index);
    let levels = [];
    level_details.map((item, i) => (
      levels.push({
        'level': i,
        'key': item
      })
    ));


    //Get Analysis Parameters
    let analysisPayLoad = {
      "analysisid": this.state.analysisid,
      "rows": this.generateSelectedRowsColsElements(this.state.selected_rows),
      "columns": this.generateSelectedRowsColsElements(this.state.selected_columns), 
      "column_headers": this.state.analysisColumns,
      "measurements": {},
      "filters": this.state.selected_dimensions,
      "levels": levels
      // "levels": [{"level":parseInt(level) , "key":levelkeyval}]
    }
    
    this.getAnalysisSubLevelData(analysisPayLoad, row_index, level_details);
  }


  //Generate Rows/Columns Values
  getkeyValuesInArray(arr, keyname){
    var newArr = [];
    for(var i=0, len=arr.length; i<len; i++){
      newArr[i] = arr[i][keyname];
    }
    return newArr;
  }

  //Genrate Values
  generateValues(arr){
    var newObj = [];
    arr.map((item, index) => (
      newObj.push({
        'id': item.title,
        'operation': item.operation,
        'type': item.type,
        'default_action': item.default_action,
      })
    ));
    return newObj;
  }

  openValuesOperationsList(event){
    var yPosition = event.clientY;
    var index = event.currentTarget.dataset.key;
    var value_type = event.currentTarget.dataset.type;
    var top = (index>1) ? (5*index) : 6;

    this.setState({
      'operation_list_pos_top': (yPosition-(yPosition-((30*index)+parseInt(top)))),
      'current_number_operations_key': value_type
    });
    if(this.state.show_number_operations_list===true){
      this.setState({'show_number_operations_list': false});
    } else {
      this.setState({'show_number_operations_list': true});
    }
  }

  //Find and change operation value in values
  selectOperation(event){
    const index = this.state.selected_values.findIndex(o => o.id === this.state.current_number_operations_key);
    const obj = this.state.selected_values[index];
    this.setState({
      selected_values: [
        ...this.state.selected_values.slice(0, index),
        { ...obj, default_action: event.currentTarget.textContent.toLowerCase() },
        ...this.state.selected_values.slice(index + 1)
      ]
    });
    setTimeout(() =>{
      this.setState({'show_number_operations_list': false});
    }, 0);
  }


  /*********************************
   * Filters Panel Functions
   */

  handleFilterTabChange(event, index){
    event.preventDefault();
    let tabs = JSON.parse(JSON.stringify(this.state.filter_panel_tabs));
    let newtabs = tabs.map((tab, i)=>{
      if(index===i) return true;
      return false;
    });

    this.setState({
      filter_panel_tabs: newtabs,
      filter_panel_date_period_change_msg: '' //reset msg to hide the progress box
    });
  }

  //show/hide analysis filter panel
  toggleFiltersPanel(e){
    if(Object.keys(this.state.dimensions).length < 1){
      //Get Dimensions of View Type
      // console.time('sight: getAllDimensions - init');
      this.getAllDimensions();
    }

    this.setState({
      toggleFilterPanel: !this.state.toggleFilterPanel,
      showSaveAnalysisDrawer: false // close save analysis view side drawer
    });
  }


  //Get List of all dimensions of view type
  getViewDimensionsAllList(viewtype){
    let result;
    if(viewtype==='advertiser'){
      result = [
        {id:'property',title:'property',type: 'string'}, 
        {id:'advertiser',title:'advertiser',type: 'string'}, 
        {id:'monetization_channel',title:'monetization_channel',type: 'string'}, 
        {id:'ad_unit',title:'ad_unit',type:'string'}, 
        {id:'revenue',title:'revenue', type:'number', default_action:'sum',operation:'^revenue$'}, 
        {id:'impressions',title:'impressions', type:'number', default_action:'sum',operation:'^impressions$'}, 
        {id:'cpm',title:'cpm',type:'number', default_action:'calculated',operation:'round(^revenue$/^impressions$*1000,2)'}
      ];
    } else if(viewtype==='adserver'){
      result = [
        {id:'property',title:'property',type: 'string'}, 
        {id:'advertiser',title:'advertiser',type: 'string'}, 
        {id:'monetization_channel',title:'monetization_channel',type: 'string'}, 
        {id:'ad_unit',title:'ad_unit',type:'string'}, 
        {id:'region',title:'region',type:'string'}, 
        {id:'device_category',title:'device_category',type:'string'}, 
        {id:'os',title:'os',type:'string'}, 
        {id:'revenue',title:'revenue', type:'number', default_action:'sum',operation:'^revenue$'}, 
        {id:'impressions',title:'impressions', type:'number', default_action:'sum',operation:'^impressions$'}, 
        {id:'viewable_impressions',title:'viewable_impressions', type:'number', default_action:'sum',operation:'^viewable_impressions$'}, 
        {id:'measurable_impressions',title:'measurable_impressions', type:'number', default_action:'sum',operation:'^measurable_impressions$'}, 
        {id:'cpm',title:'cpm',type:'number', default_action:'calculated',operation:'round(^revenue$/^impressions$*1000,2)'},
        {id:'viewability',title:'viewability',type:'number', default_action:'calculated',operation:'round(^viewable_impressions$/^measurable_impressions$*100,2)'}
      ];
    } else if(viewtype==='webanalytics'){ //Need to change
      result = [
        {id:'property',title:'property',type: 'string'}, 
        {id:'region',title:'region',type: 'string'}, 
        {id:'device_category',title:'device_category',type:'string'}, 
        {id:'page_views',title:'page_views', type:'number', default_action:'sum',operation:'^page_views$'}, 
        {id:'users',title:'users', type:'number', default_action:'sum',operation:'^users$'}, 
        {id:'sessions',title:'sessions',type:'number', default_action:'sum',operation:'^sessions$'}
      ];
    } else if(viewtype==='performance'){ //Need to change
      result = [
        {id:'property',title:'property',type: 'string'}, 
        {id:'monetization_channel',title:'monetization_channel',type: 'string'}, 
        {id:'rpm',title:'rpm',type:'number', default_action:'calculated',operation:'round(^revenue$/^page_views$*1000,2)'},
        {id:'rps',title:'rps',type:'number', default_action:'calculated',operation:'round(^revenue$/^sessions$*100,2)'},
        {id:'rpu',title:'rpu',type:'number', default_action:'calculated',operation:'round(^revenue$/^users$*100,2)'}
      ];
    }
    return result;
  }

  //Get Measurement Values List to display under filters
  getMeasurementValuesList(view_type){
    let result;
    if(view_type==='webanalytics'){
      result = [
        {id:'page_views',title:'page_views',type:'number', default_action:'sum', operation:'^page_views$'}, 
        {id:'users',title:'users',type: 'number', default_action:'sum', operation:'^users$'},
        {id:'sessions',title:'sessions',type: 'number', default_action:'sum', operation:'^sessions$'}
      ];
    } else if(view_type==='performance'){
      result = [
        {id:'rpm',title:'rpm',type:'number', default_action:'calculated',operation:'round(^revenue$/^page_views$*1000,2)'},
        {id:'rps',title:'rps',type:'number', default_action:'calculated',operation:'round(^revenue$/^sessions$*100,2)'},
        {id:'rpu',title:'rpu',type:'number', default_action:'calculated',operation:'round(^revenue$/^users$*100,2)'}
      ];
    } else {
      result = [
        {id:'revenue_1',title:'revenue',type:'number', default_action:'sum', operation:'^revenue$'}, 
        {id:'impressions_1',title:'impressions',type: 'number', default_action:'sum', operation:'^impressions$'},
        {id:'cpm_1',title:'cpm',type: 'number', default_action:'calculated', operation:'round(^revenue$/^impressions$*1000,2)'}
      ];
    }
    return result;
  }


  //Get dimensions as string - using to get dimension options
  getDimensionsStr(viewtype){
    let result;
    if(viewtype==='advertiser'){
      result = "property,monetization_channel,advertiser,ad_unit";
    } else if(viewtype==='adserver'){
      result = "property,monetization_channel,advertiser,ad_unit,region,device_category,os";
    } else if(viewtype==='webanalytics'){
      result = "property,region,device_category";
    } else if(viewtype==='performance'){
      result = "property,monetization_channel";
    }
    return result;
  }


  //Get Dimension using API
  getAllDimensions(evt) {
    // console.timeEnd('sight: getAllDimensions - init');

    //Pass property names under dimensions if it is site specific login
    let dimension_filters = this.state.selected_dimensions;
    if(this.user.parent_organization_id > 1 && !isEmptyObject(this.state.selected_dimension)){
      let filters = [];
      if(Array.isArray(this.user.attributes)){
        this.user.attributes.forEach((item) => {
          if(item.site_name!==undefined){
            filters.push(item.site_name);
          }
        });
      }
      dimension_filters = {"property": filters};
    }

    // console.log('site specific');
    // console.log(dimension_filters);

    //Input Validations and Send Fetch Request
    this.setState({ error: '' });

    const dimensionPayLoad = {
      "client_id": this.client.id,
      "view_type": this.view_type,
      "dimension": this.getDimensionsStr(this.view_type),
      "dimension_filter": dimension_filters
    };
    if(this.view_type==='performance'){
      dimensionPayLoad['data_source'] = 'advertiser';
    }
    // console.time('sight: getAllDimensions - API call');
    APIService.apiRequest(Constants.API_BASE_URL+'/getAllDimensions', dimensionPayLoad)
      .then(response => {
        if(response.status===1 && response.data!==undefined){
          // console.timeEnd('sight: getAllDimensions - API call');

          let dimensions = JSON.parse(response.data);
          let allDimensions = [];
          Object.keys(dimensions).forEach(function(key) {
            let options = JSON.parse(dimensions[key]);
            allDimensions[key] = options;
          });
          
          this.setState({ dimensions: allDimensions });
        } else {
          this.setState({error: response.msg });
        }
      })
      .catch(err => {
        this.setState({ error: err.msg });
      });
  }


  /*********************************
   * Filters Multiselect functions
   */

  //Handle Filters Block Item Click
  handleAnalysisFilter(event){
    event.stopPropagation();
    let filter_type = event.currentTarget.dataset.title;

    this.setState({
      filtersSelectionBoxStatus: (this.state.currentSelectedFilter===filter_type) ? !this.state.filtersSelectionBoxStatus : true,
      currentSelectedFilter: filter_type,
      currentSelectedFilterOptions: this.state.dimensions[filter_type]
    });
  }
  
  //Filters Close
  handleMultiSelectFiltersClose(event){
    this.setState({filtersSelectionBoxStatus: !this.state.filtersSelectionBoxStatus});
  }

  //Filters Options Selection and Apply
  handleMultiSelectLFiltersSelection(args){
    let list = this.state.selected_dimensions[args.dimension_key] || [];

    if(args.dimension_val==='ALL_CHECK'){
      list = [...this.state.currentSelectedFilterOptions]
    } else if(args.dimension_val==='ALL_UNCHECK'){
      list = []
    } else {
      let index = list.indexOf(args.dimension_val);
      if(index > -1){
        list = [...list.slice(0, index), ...list.slice(index+1)];
      } else {
        list = [...list, args.dimension_val];
      }
    }

    this.setState({
      // selected_dimensions: {...this.state.selected_dimensions, [args.dimension_key]:args.dimension_val} 
      selected_dimensions: {...this.state.selected_dimensions, [args.dimension_key]:list} 
    });

    //Check max column cells selection alert
    setTimeout(() => {
      this.checkColumnsCount();
    },0);
  }


  //Remove Selected element under filters panel  - filters, rows, columns, values
  handleCloseSelectedFilter(event){
    event.stopPropagation();
    let type = event.currentTarget.dataset.type;
    let source_id = event.currentTarget.dataset.source;
    let putBacktoAllList = null;
    let updatedSelectedBlock;

    // console.log(this.getList(source_id));
    // console.log(this.getList(destination_id));

    if(source_id==='rows'){
      putBacktoAllList = this.state.selected_rows.filter(item => (item.id) === type);
      updatedSelectedBlock = this.state.selected_rows.filter(item => (item.id) !== type);
    } 
    if(source_id==='columns'){
      putBacktoAllList = this.state.selected_columns.filter(item => (item.id) === type);
      updatedSelectedBlock = this.state.selected_columns.filter(item => (item.id) !== type);
    }
    if(source_id==='values'){
      putBacktoAllList = this.state.selected_values.filter(item => (item.id) === type);
      updatedSelectedBlock = this.state.selected_values.filter(item => (item.id) !== type);
    }
    if(source_id==='filters'){
      putBacktoAllList = this.state.selected_filters.filter(item => (item.id) === type);
      updatedSelectedBlock = this.state.selected_filters.filter(item => (item.id) !== type);
    }

    // console.log(putBacktoAllList);
    if(!putBacktoAllList) return false;
    
    //Get Existing All List values and insert the removed element there
    let existingAllList = this.state.all_items.filter(item => (item.id) !== type);
    existingAllList.splice(0, 0, putBacktoAllList[0]);

    //Updated State Values
    if(source_id==='rows'){
      setTimeout(()=>{
        this.setState({
          selected_rows: updatedSelectedBlock,
          all_items: existingAllList  
        });
      },10);
    }

    //Updated State Values
    if(source_id==='columns'){
      setTimeout(()=>{
        this.setState({
          selected_columns: updatedSelectedBlock,
          all_items: existingAllList
        });
      },10);
    }

    //Updated State Values
    if(source_id==='values'){
      setTimeout(()=>{
        this.setState({selected_values: updatedSelectedBlock});
      },10);
    }

    //Updated State Filters
    if(source_id==='filters'){
      let obj = {'dimension_key': putBacktoAllList[0]['title'], 'dimension_val': []};
      setTimeout(()=>{
        this.setState({
          filtersSelectionBoxStatus: false, //close the fileter options block
          selected_dimensions: {...this.state.selected_dimensions, [obj.dimension_key]:obj.dimension_val}, //update the selected dimension as blank
          selected_filters: updatedSelectedBlock,
        });
      },10);
    }

    //Check max columns cell count
    if(source_id==='filters' || source_id==='columns' || source_id==='values'){
      setTimeout(() => {
        this.checkColumnsCount();
      }, 20);
    }
  }


  //Toggle Save Analysis Drawer
  toggleSaveAnalysisDrawer() {  
    this.setState({
      showSaveAnalysisDrawer: !this.state.showSaveAnalysisDrawer,
      toggleFiltersPanel: false
    });  
  }  


  //Filter Panel - Block's element click
  handleFilterClick(event, index, item, source){
    event.stopPropagation();
    let highlightedCols = [];

    if(item.type==='number'){
      highlightedCols.push('values');
    } else {
      highlightedCols.push('rows', 'columns');
      if(item.type!=='date' && item.id!=='values'){
        highlightedCols.push('filters');
      }
    }

    //Remove the source block from highlighted list
    let colindex = highlightedCols.indexOf(source);
    if(colindex > -1){
      highlightedCols.splice(colindex, 1);
    }

    //Set Current Selected Item and Source
    //Highlight the block where selected item can be dropped
    this.setState({
      selectedFilterItem: {'item': item, 'source': source},
      highlightedBlocks: highlightedCols
    });
  }

  //Order Analysis Filter Selection Drop Click
  handleSelectedFilter(event, destination){
    event.stopPropagation();
    // console.log('drop selected element under '+destination);

    //Do nothing when it matches the below conditions
    if(
    (this.state.selectedFilterItem===undefined || !this.state.selectedFilterItem || this.state.selectedFilterItem==='') || 
    (destination===undefined) ||
    (this.state.selectedFilterItem.source=== destination) ||
    (this.state.selectedFilterItem.item.type==='string' && (destination==='values' || destination==='all_items')) ||
    (this.state.selectedFilterItem.item.id==='values' && (destination==='filters' || destination==='all_items')) ||
    (this.state.selectedFilterItem.item.type==='date' && (destination==='filters' || destination==='values' || destination==='all_items')) ||
    (this.state.selectedFilterItem.item.type==='number' && (destination==='rows' || destination==='columns' || destination==='filters'))
    ){
      this.setState({
        selectedFilterItem: null,
        highlightedBlocks: []
      })
      return false;
    }

    //remove it from source end 
    let currentSelectedItem = this.state.selectedFilterItem.item;
    let currentSelectedSource = this.state.selectedFilterItem.source;
    let sourceEnd = (currentSelectedSource!=='all_items') ? 'selected_'+currentSelectedSource : currentSelectedSource;
    let sourceList = JSON.parse(JSON.stringify(this.state[sourceEnd]));
    let itemIndex = sourceList.findIndex(obj => obj.id===currentSelectedItem.id);

    //add it to destination end
    let destinationEnd = (destination!=='all_items') ? 'selected_'+destination : destination;
    let destinationList = JSON.parse(JSON.stringify(this.state[destinationEnd]));

    // console.log(currentSelectedItem.type+'---'+destination);
    // console.log(destinationEnd);
    // console.log(destinationList);

    if(currentSelectedItem.type==='string' && destination==='filters'){
      const obj = Object.assign({}, currentSelectedItem);
      obj['id'] = obj.id+'_'+uniqueID();
      let destItemIndex = destinationList.findIndex(obj => obj.title===currentSelectedItem.title);
      if(destItemIndex > -1) return false;
      destinationList.push(obj);
    } else if(currentSelectedItem.type==='string' && this.state.selectedFilterItem.source==='filters'){
      //If selecte item source is filters and all_items have the selected item remove it from all_items and place under destination block
      sourceEnd = 'all_items';
      sourceList = JSON.parse(JSON.stringify(this.state[sourceEnd]));
      let srcItemIndex = sourceList.findIndex(obj => obj.title===currentSelectedItem.title);
      let selectedItem = sourceList[srcItemIndex];
      if(srcItemIndex > -1){
        sourceList.splice(srcItemIndex, 1);
        destinationList.push(selectedItem);
      }
      
    } else if(currentSelectedItem.type==='number' && destination==='values'){
      const valObj = Object.assign({}, currentSelectedItem);
      valObj['id'] = valObj.id+'_'+uniqueID();
      destinationList.push(valObj);
    } else {
      sourceList.splice(itemIndex, 1);
      destinationList.push(currentSelectedItem);
    }

    this.setState({
      [sourceEnd]: sourceList,
      [destinationEnd]: destinationList,
      selectedFilterItem: null,
      highlightedBlocks: []
    });

    //Check rows/columns count
    setTimeout(() => {
      this.checkColumnsCount();
      this.checkRowsCount();
    },0);
  }

  //Order Analysis Filter Panel Elements
  handleFilterOrder(event, index, item, source){
    event.stopPropagation();
    // console.log(index+'-'+source);
    if(index<=0) return false;

    let sourceList = JSON.parse(JSON.stringify(this.state['selected_'+source]));
    let currentIndex = index;
    let newIndex = (index-1);
    let newSourceList = reorder(sourceList, currentIndex, newIndex);

    this.setState({
      ['selected_'+source]: newSourceList
    });
  }


  //Analysis Filters Panel Component
  analysisFiltersPanel(){
    let num_operations_list_class = (this.state.show_number_operations_list) ? 'open' : '';
    
    return (
      <ClickOutsideListner onOutsideClick={() => this.setState({ toggleFilterPanel: false })}>
        <div id="analysis-filters-panel" className={this.state.toggleFilterPanel ? 'open' : ''}>
          {/* Show Max Columns Cell Count Selection Message */}
          {/* {this.state.selected_columns_count > 6000 &&
            <div className="analysis-filter-msg">
              You are hitting maximum columns` cells rendering limit. Current selection will render <strong>{this.state.selected_columns_count}</strong> columns` cells which may cause latency on browser response.
            </div>
          } */}
          
          <div className="analysis-filter-header clearfix">
            {!this.state.isSavedView &&
              <div className="header-inner">
                <ul className="tabs">
                  <li className={'tab calender '+(this.state.filter_panel_tabs[0] ? 'active' : '')} onClick={(e) => this.handleFilterTabChange(e, 0)}><button className="btn-calender" title="Calendar">Calendar</button></li>
                  <li className={'tab filters '+(this.state.filter_panel_tabs[1] ? 'active' : '')} onClick={(e) => this.handleFilterTabChange(e, 1)}><button className="btn-filter" title="Filters">Filters</button></li>
                </ul>

                {this.state.filter_panel_tabs[0] &&
                  <div className="buttons-wrapper">
                    <button className="btn-with-icon btn-run" title="Load Data" onClick={this.handleLoadDataWithAnalysisID}>Apply</button>
                    {/* <button className="btn-with-icon btn-cancel" title="Cancel">Cancel</button> */}
                  </div>
                }
                {this.state.filter_panel_tabs[1] &&
                  <div className="buttons-wrapper">
                    {/* <button className="btn-with-icon btn-run" title="Run" onClick={this.handleAnalysisFilterSubmit} disabled={this.state.selected_columns_count > 6000 ? 'disabled' : null}>Apply</button> */}
                    <button className="btn-with-icon btn-run" title="Run" onClick={this.handleAnalysisFilterSubmit}>Apply</button>
                    <button className="btn-with-icon btn-reset" title="Reset" onClick={this.handleAnalysisFiltersReset}>Reset</button>
                  </div>
                }
              </div>
            }
          </div>

          <div className="analysis-filter-content clearfix">
            {/* Analysis Period Tab Content */}
            <div id="data-period" className={'tab-content clearfix '+(this.state.filter_panel_tabs[0] ? 'active' : '')}>
              <div className="analysis-period-field">
                <DateRangeSelector 
                  dateRange={this.state.selectedDateRange} 
                  showByDefault={true}
                  lastUpdatedDate={this.state.last_updated_date_for_datepicker}
                  onSelect={this.handleAnalysisPeriodChange}
                  client={this.client}
                  showApplyCancelButtons='false'
                />
              </div>
              <div className="process-wrapper">
                <div className={'progress-wrapper clearfix '+(this.state.inprocess ? 'show-loading' : '')}>
                  <div className={'msg '+(this.state.filter_panel_date_period_change_msg!=='' ? 'show': '')}>{this.state.filter_panel_date_period_change_msg}</div>
                  <div className={'buttons-wrapper '+(this.state.filter_panel_date_period_change_msg!=='' ? 'show': '')}><button className="btn-with-icon btn-run" title="Apply Filters" onClick={(e) => this.handleFilterTabChange(e, 1)}>Apply Filters</button></div>
                </div>
              </div>
            </div>

            {/* Filter Tab Content */}
            <div id="data-filters" className={'tab-content clearfix '+(this.state.filter_panel_tabs[1] ? 'active' : '')}>
              <div className="col-dnd-wrapper">
              
                <div className={'all-lists-wrapper variable clearfix '+(this.state.highlightedBlocks.includes('add_items') ? 'highlight' : '')}>
                  <h3 className="title">All Lists</h3>
                  <div className="content" onClick={(e) => this.handleSelectedFilter(e, 'all_items')}>
                      <div className="content-inner">
                        {this.state.all_items.map((item, index) => (
                          <div key={item.id+'-'+index} className={'element '+item.type+' '+((this.state.selectedFilterItem && this.state.selectedFilterItem.item['id']==item.id) ? 'selected' : '')} onClick={(e) => this.handleFilterClick(e, index, item, 'all_items')}>
                            {item.title}
                          </div>
                        ))}
                      </div>
                  </div>
                </div>

                {/* Filters Block */}
                <div className={'filters-wrapper variable clearfix '+(this.state.highlightedBlocks.includes('filters') ? 'highlight' : '')}>
                  <h3 className="title">Filters</h3>
                  <div className="content" onClick={(e) => this.handleSelectedFilter(e, 'filters')}>
                    <div className="content-inner">
                      {this.state.selected_filters.map((item, index) => (
                        <div  className={'element filter-element '+item.type+' '+((this.state.selectedFilterItem && this.state.selectedFilterItem.item['id']==item.id) ? 'selected' : '')} onClick={(e) => this.handleFilterClick(e, index, item, 'filters')}>
                          {item.title}

                          {/* Show Selected Dimensions Count */}
                          <span className="count">
                            {(this.state.selected_dimensions!==undefined && this.state.currentSelectedFilter!==undefined && this.state.selected_dimensions[item.title]!==undefined) &&
                              '+'+this.state.selected_dimensions[item.title].length
                            }
                          </span>

                          <button className="btn-toggle-list" data-title={item.title} onClick={this.handleAnalysisFilter}></button>
                          <button className="btn-close" data-key={(index+1)} data-type={item.id} data-source="filters" onClick={this.handleCloseSelectedFilter}></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Filters Selection Options Block */}
                {/* <div className={'selected-filters-wrapper variable clearfix '+(this.state.filtersSelectionBoxStatus ? 'open' : '')}  ref={node => { this.node = node; }}> */}
                <div className={'selected-filters-wrapper variable clearfix '+(this.state.filtersSelectionBoxStatus ? 'open' : '')}>
                  <div className="content">
                    <MultiSelectList 
                      data={this.state.currentSelectedFilterOptions}
                      filter={this.state.currentSelectedFilter}
                      selectedOptions={this.state.selected_dimensions}
                      onMultiSelectFiltersClose={this.handleMultiSelectFiltersClose} 
                      onMultiSelectLFiltersSelection={this.handleMultiSelectLFiltersSelection} 
                    />
                  </div>
                </div>

                {/* Rows Block */}
                <div className={'rows-wrapper variable clearfix '+(this.state.highlightedBlocks.includes('rows') ? 'highlight' : '')}>
                  <h3 className="title">Rows</h3>
                  <div className="content" onClick={(e) => this.handleSelectedFilter(e, 'rows')}>
                    <div className="content-inner">
                      {this.state.selected_rows.map((item, index) => (
                        <div className={'element '+item.type+' '+((this.state.selectedFilterItem && this.state.selectedFilterItem.item['id']==item.id) ? 'selected' : '')} onClick={(e) => this.handleFilterClick(e, index, item, 'rows')}>
                          {item.title}
                          
                          {/* Don't show close button if it is values element */}
                          {item.title!=='values' &&
                            <button className="btn-close" data-key={(index+1)} data-type={item.id} data-source="rows" onClick={this.handleCloseSelectedFilter}></button>
                          }
                          <button className="btn-order" data-key={(index+1)} onClick={(e) => this.handleFilterOrder(e,index,item,'rows')}></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Columns Block */}
                <div className={'columns-wrapper variable clearfix '+(this.state.highlightedBlocks.includes('columns') ? 'highlight' : '')}>
                  <h3 className="title">Columns</h3>
                  {this.state.selected_columns_count > 6000 &&
                    <div className="warning">
                      <span>{this.state.selected_columns_count}</span> | Max 6000
                    </div>
                  }
                  <div className="content" onClick={(e) => this.handleSelectedFilter(e, 'columns')}>
                    <div className="content-inner">
                      {this.state.selected_columns.map((item, index) => (
                        <div className={'element '+item.type+' '+((this.state.selectedFilterItem && this.state.selectedFilterItem.item['id']==item.id) ? 'selected' : '')} onClick={(e) => this.handleFilterClick(e, index, item, 'columns')}>
                          {item.title}

                          {/* Don't show close button if it is values element */}
                          {item.title!=='values' &&
                            <button className="btn-close" data-key={(index+1)} data-type={item.id} data-source="columns" onClick={this.handleCloseSelectedFilter}></button>
                          }
                          <button className="btn-order" data-key={(index+1)} onClick={(e) => this.handleFilterOrder(e,index,item,'columns')}></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Values Block */}
                <div className={'values-wrapper variable clearfix '+(this.state.highlightedBlocks.includes('values') ? 'highlight' : '')}>
                  <h3 className="title">Values</h3>
                  <div className="content" onClick={(e) => this.handleSelectedFilter(e, 'values')}>
                    <div className="content-inner">
                      {this.state.selected_values.map((item, index) => (
                        <div className={item.type+' element'}>
                          <span>{item.default_action} </span> {(item.default_action!='calculated') && ' of ' }
                          <span> {item.title}</span>
                          { item.default_action!='calculated' &&
                            <button className="btn-select-operation" data-key={(index+1)} data-type={item.id} onClick={this.openValuesOperationsList}></button>
                          }
                          
                          <button className="btn-close" data-key={(index+1)} data-type={item.id} data-source="values" onClick={this.handleCloseSelectedFilter}></button>
                          <button className="btn-order" data-key={(index+1)} onClick={(e) => this.handleFilterOrder(e,index,item,'values')}></button>
                        </div>
                      ))}
                    </div>

                    <div className={'operations-list '+num_operations_list_class} style={{top: this.state.operation_list_pos_top}}>
                      <ul>
                        <li onClick={this.selectOperation}>Sum</li>
                        <li onClick={this.selectOperation}>Count</li>
                        <li onClick={this.selectOperation}>Min</li>
                        <li onClick={this.selectOperation}>Max</li>
                        <li onClick={this.selectOperation}>Mean</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
          {/* End of analysis-filter-content */}
        </div>
      </ClickOutsideListner>
    );
  }

  //Back to Home Button
  handleBackToAnalysisHome(event){
    this.props.history.push('/datagrid/'+this.client.name);
  }

  //Convert Bytes to KB
  convertByteToKB(bytes){
    return (bytes/1024).toFixed(1);
  }

  //Download Analysis View
  handleDownloadView(event){
    event.preventDefault();
    let download_url = 'https://api.bydata.com/data_stream/download/'+this.state.analysisid;
    // let download_url = 'https://api.bydata.com/data_stream/referrer';
    window.open(download_url, "_blank");
  }

  render() {
    const AnalysisFiltersPanel = (this.analysisFiltersPanel) ? this.analysisFiltersPanel : '';
    let savedViewClass = (this.state.isSavedView!==undefined && this.state.isSavedView==true) ? 'saved-view' : '';
    let saveConfig = {
      all_items: this.state.all_items,
      selected_rows: this.state.selected_rows,
      selected_columns: this.state.selected_columns,
      selected_values: this.state.selected_values,
      measurements: {},
      selected_dimensions: this.state.selected_dimensions
    };

    return (
      <div className={'app-wrapper '+savedViewClass}>
        <div id="app-sub-header">
          <h2 className="page-title link" onClick={this.handleBackToAnalysisHome}>Data Grid</h2>
          
          {/* Display Saved View Title */}
          {this.state.isSavedView &&
            <div className="saved-view-title-wrapper">
              <div className="label">Report Name</div>
              <div className="saved-view-title">{this.state.savedViewTitle}</div>
            </div>
          }

          {/* Display Data Size */}
          {this.state.total_content_length > 0 &&
            <div className="data-size-wrapper">
              <div className="data-size"><span>{this.convertByteToKB(this.state.total_content_length)+'KB'}</span></div>
              <div className="data-details">
                {(this.state.data_requests_list && this.state.data_requests_list.length > 0) &&
                  this.state.data_requests_list.map((item, i) => <div key={'info'+i} className={'info '+(item.status==='completed' ? 'completed' : '')}>{item.name} - {item.time}ms</div>)
                }
              </div>
            </div>
          }

          {this.state.selected_columns_count > 0 &&
            <div className="meta-info">
              <div className="info">Rows: <span>{this.state.selected_rows_count}</span></div>
              <div className="info">Columns: <span>{this.state.selected_columns_count}</span></div>
            </div>
          }

          {/* Display Date Period Selection */}
          {this.state.isSavedView &&
            <div className="analysis-period-field">
              <DateRangeSelector 
                dateRange={this.state.selectedDateRange} 
                lastUpdatedDate={this.state.last_updated_date_for_datepicker}
                onSelect={this.analysisPeriodChange} 
                client={this.client} />
            </div>
          }


          {/* Display Action Buttons */}
          <div className="action-button-wrapper">
            <NewAnalysisButton client={this.client} history={this.props.history} />

            <button className="btn-with-icon btn-download" onClick={this.handleDownloadView} title="Download View">Download</button>

            {/* Save Analysis View */}
            {!this.state.isSavedView &&
              <button className="btn-with-icon btn-save-view" onClick={this.toggleSaveAnalysisDrawer} title="Save View">Save View</button>
            }
            
            {/* Analysis Filters Button */}
            {!this.state.isSavedView &&
              <button className="btn-with-icon btn-toggle-filters" onClick={this.toggleFiltersPanel} title="Filters">Filters</button>
            }
          </div>
        </div>


        {/* Analysis Pivot View */}
        <div className="container">
          <div className="odin-view odin-analysis clearfix" data-client="" data-type="advertiser" data-lastupdated="">
            {this.state.showSaveAnalysisDrawer && 
              <ClickOutsideListner onOutsideClick={() => this.setState({ showSaveAnalysisDrawer: false })}>
                <AnalysisViewSave
                  client={this.client}
                  view_type={this.view_type}
                  user={this.user}
                  config={saveConfig}
                  organizationsList={this.state.organizationsList}
                  organizationsUsersList={this.state.organizationsUsersList}
                />
              </ClickOutsideListner>
            } 

            {/* {this.state.toggleFilterPanel &&  */}
              {/* <ClickOutsideListner onOutsideClick={() => this.setState({ toggleFilterPanel: false })}> */}
                <AnalysisFiltersPanel />
              {/* </ClickOutsideListner> */}
            {/* }  */}

            <div id="analysis-wrapper" className={'analysis-view has-border '+(this.state.inprocess ? 'show-loading': '')}>
              <div id="analysis-section">
                {/* Show Progress Bar */}
                {this.state.show_data_loading &&
                  <div className="progress-wrapper">
                    <div className="progress-inner">
                      <div className="progress-meter">
                        <div className="progress-status">{(this.state.inprocess_percent ? this.state.inprocess_percent+'%' : '0%')}</div>
                        <span style={{ width: (this.state.inprocess_percent > 0 ? this.state.inprocess_percent+'%' : '0%')}}><span className="progress"></span></span>
                      </div>

                      <div className="requests-details">
                        {(this.state.data_requests_list && this.state.data_requests_list.length > 0) &&
                          this.state.data_requests_list.map((item, i) => <div key={'info'+i} className={'info '+(item.status==='completed' ? 'completed' : '')}>{item.id}. {item.name} - {item.time}ms</div>)
                        }
                      </div>

                      <div className="progress-info">
                        <ul>
                          <li>Data Size: {this.convertByteToKB(this.state.total_content_length)+'KB'}</li>
                          <li>Data Downloaded: {this.convertByteToKB(this.state.inprocess_number) +'KB'}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                }

                {this.state.analysisData && 
                  <ReactDivTable 
                    columns={this.state.analysisColumns} 
                    columns_display={this.state.analysisColumnsDisplay}
                    columns_width={this.state.analysisColumnsWidth}
                    table_width={this.state.analysisTableWidth}
                    data={this.state.analysisData} 
                    selected_rows={this.generateSelectedRowsColsElements(this.state.selected_rows)} 
                    selected_columns={this.generateSelectedRowsColsElements(this.state.selected_columns)} 
                    onSubLevelDataFetch={this.handleSubLevelDataFetch}
                    onTableDataSorting={this.handleTableDataSorting}
                    collapseExpandedRow={this.state.collapseExpandedRow}
                    sublevel_inprocess={this.state.sublevel_inprocess}
                  />
                }
                {/* {console.timeEnd('sight: getAnalysisData - render')} */}
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }
}
 
export default AnalysisView3;