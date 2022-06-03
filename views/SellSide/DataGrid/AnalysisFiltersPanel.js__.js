import React, { Component } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import '../../styles/Global.scss';
import '../../styles/AnalysisViews.scss';

import DateRangeSelector from '../../components/DateRangeSelector/DateRangeSelector';
import MultiSelectList from '../../components/MultiSelectList';

import { getKeyByValue, getClients, getUser, isEmptyObject } from '../utils/Common'; //Import Common Functions
// import APIService from '../services/apiService'; //Import Services


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

/**
 * Moves an item from one list to another list.
 */
const move = (source, destination, droppableSource, droppableDestination) => {
  const sourceClone = Array.from(source);
  const destClone = Array.from(destination);
  
  const [removed] = sourceClone.splice(droppableSource.index, 1);
  const result = {};

  //IF destination is values block and element type is string - don't allow move
  if(droppableDestination.droppableId==='values' && removed.type==='string'){
    return false;
  }

  //IF destination is filter block and element type is number or calculated - don't allow move
  if(droppableDestination.droppableId==='filters' && (removed.type==='number' || removed.type==='calculated' || removed.title==='values') ){
    return false;
  }
  //IF source is filter block and destination id rows or columns - don't allow move
  if(droppableSource.droppableId==='filters' && (droppableDestination.droppableId==='rows' || droppableDestination.droppableId==='columns' || droppableDestination.droppableId==='values') ){
    return false;
  }

  //If source is values block and destination are rows or columns blocks and element type is number - don't allow move
  if((droppableDestination.droppableId==='rows' || droppableDestination.droppableId==='columns') && 
      droppableSource.droppableId==='values' && removed.type==='number'){
    return false;
  }

  //If source is all_list block and destination are rows or columns blocks and element type is number - don't allow move
  if((droppableDestination.droppableId==='rows' || droppableDestination.droppableId==='columns') && 
      droppableSource.droppableId==='all_list' && removed.type==='number'){
    return false;
  }

  if((droppableDestination.droppableId==='all_list') && 
      (droppableSource.droppableId==='rows' || droppableSource.droppableId==='columns') && 
      removed.title==='values'){
    return false;
  }

  if(removed.type==='number'){
    //Add the removed element again and add it to destination as well - in short copy element
    if(droppableSource.droppableId==='all_list'){
      sourceClone.splice(droppableSource.index, 0, removed);

      const obj = Object.assign({}, removed);
      obj['id'] = obj.id+'_'+uniqueID();
      destClone.splice(droppableDestination.index, 0, obj);
    }
    
    result[droppableSource.droppableId] = sourceClone;
    result[droppableDestination.droppableId] = destClone;
  } else {
    //If Source block is all_list and destination is filters - copy string element
    // if(droppableSource.droppableId==='all_list' && droppableDestination.droppableId==='filters'){
    if(droppableDestination.droppableId==='filters'){
      var elementAlreadyExists = false;
      if(destClone.length > 0){
        for(var i=0, len=destClone.length; i<len; i++){
          if(destClone[i]['title']===removed.title){
            elementAlreadyExists = true;
          }
        }
      }
      if(elementAlreadyExists) return false; //Don't allow to add same element more than once

      sourceClone.splice(droppableSource.index, 0, removed);

      const obj = Object.assign({}, removed);
      obj['id'] = obj.id+'_'+uniqueID();
      destClone.splice(droppableDestination.index, 0, obj);
    } else if(droppableSource.droppableId==='filters') {
      //If Source block is filters and destination is anyother - do nothing and let just remove the element
    } else {
      destClone.splice(droppableDestination.index, 0, removed);
    }

    result[droppableSource.droppableId] = sourceClone;
    result[droppableDestination.droppableId] = destClone;
  }
  
  return result;
};

const grid = 8;

const getItemStyle = (isDragging, draggableStyle) => ({
  // some basic styles to make the items look a bit nicer
  display: 'block',
  userSelect: 'none',
  padding: `4px ${grid}px`,
  margin: `0 2px ${grid}px 2px`,
  fontSize: '13px',
  background: isDragging ? 'white' : 'white',
  color: '#000',
  
  // styles we need to apply on draggables
  ...draggableStyle
});

const getListStyle = isDraggingOver => ({
  background: isDraggingOver ? '#dedede' : 'lightgrey',
  // padding: grid,
  padding: '0px .48vw',
  width: '100%',
  height: '18.40vw' //265px
  // height: '17.70vw' //255px
});

/* End - Filters Drag and Drop
 **************************************/

  
class AnalysisFiltersPanel extends Component {
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
      error: "",
      filter_panel_tabs: [false, true],
      selected_date_range: '',
      new_selected_date_range: '',
      selectedDateRange: {},
      selected_dimensions: {},

      all_items: this.getViewDimensionsAllList(this.view_type),
      selected_filters: [],
      selected_rows: [{id:'date',title:'date',type:'date'}],
      selected_columns: [{id:'values',title:'values',type:'string'}],
      selected_values: this.getMeasurementValuesList(this.view_type),
      current_number_operations_key: '',
      show_number_operations_list: false,
      filter_panel_date_period_change_msg: '',
      operation_list_pos_top: 0,
      filtersSelectionBoxStatus: false, // Filters selection box stat
      currentSelectedFilter: '', // Selected Filter type
      currentSelectedFilterOptions: [], //Filters Select List Options
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
    this.analysisPeriodChange = this.analysisPeriodChange.bind(this);
    this.openValuesOperationsList = this.openValuesOperationsList.bind(this);
    this.selectOperation = this.selectOperation.bind(this);
    this.handleAnalysisFilterSubmit = this.handleAnalysisFilterSubmit.bind(this);
    this.handleAnalysisPeriodChange = this.handleAnalysisPeriodChange.bind(this);
    this.handleAnalysisFiltersReset = this.handleAnalysisFiltersReset.bind(this);

    this.analysisFiltersPanel = this.analysisFiltersPanel.bind(this); //Analysis Filters Panel Component
    this.handleFilterTabChange = this.handleFilterTabChange.bind(this); //Analysis Filters Panel Component
    this.handleAnalysisFilter = this.handleAnalysisFilter.bind(this); //handle filter blocks item click
    this.handleMultiSelectFiltersClose = this.handleMultiSelectFiltersClose.bind(this); //handle multi select list close
    this.handleMultiSelectLFiltersSelection = this.handleMultiSelectLFiltersSelection.bind(this); //handle multi select list selection

    //Remove select filters element in rows/columns/values
    this.handleCloseSelectedFilter = this.handleCloseSelectedFilter.bind(this);
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
        error: "",
        filter_panel_tabs: [false, true],
        selected_date_range: '',
        new_selected_date_range: '',
        selectedDateRange: {},
        selected_dimensions: {},
        all_items: this.getViewDimensionsAllList(this.view_type),
        selected_filters: [],
        selected_rows: [{id:'date',title:'date',type:'date'}],
        selected_columns: [{id:'values',title:'values',type:'string'}],
        selected_values: this.getMeasurementValuesList(this.view_type),
        current_number_operations_key: '',
        show_number_operations_list: false,
        filter_panel_date_period_change_msg: '',
        operation_list_pos_top: 0,
        dimensions: {},
        filtersSelectionBoxStatus: false, // Filters selection box stat
        currentSelectedFilter: '', // Selected Filter type
        currentSelectedFilterOptions: [], //Filters Select List Options
      });

      if(this.client){
        this.handleLoadScripts();
      }
    }
  }

  //Load Scripts on Page/View Load
  handleLoadScripts(){
  
  }



  //Reset Selected Filters
  handleAnalysisFiltersReset(){
    let obj = {
      'all_items': this.getViewDimensionsAllList(this.view_type),
      'selected_filters': [],
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


  /********************************
   * Drag and Drop Functionalty 
   */

  //Get List - Drag and Drop
  getList = id => this.state[this.id2List[id]];

  //On Drag End
  onDragEnd = result => {
    const { source, destination } = result;

    // dropped outside the list
    if (!destination) { return; }

    if (source.droppableId === destination.droppableId) {
      const items = reorder(
        this.getList(source.droppableId),
        source.index,
        destination.index
      );

      let state = { items };
      if (source.droppableId === 'rows') {
        state = { selected_rows: items };
      } else if (source.droppableId === 'columns') {
        state = { selected_columns: items };
      } else if (source.droppableId === 'values') {
        state = { selected_values: items };
      }
      this.setState(state);
      
    } else {
      // console.log('on change ----------');
      // console.log(source.droppableId);
      // console.log(destination.droppableId);
      
      const result = move(
        this.getList(source.droppableId),
        this.getList(destination.droppableId),
        source,
        destination
      );
      if(!result) return false;

      if( (source.droppableId==='columns' || source.droppableId==='rows')  && 
          (destination.droppableId==='rows' || destination.droppableId==='columns') ){
        this.setState({
          selected_columns: result.columns,
          selected_rows: result.rows
        });
        
      } else if(source.droppableId==='rows' && destination.droppableId==='all_list'){
        this.setState({
          selected_rows: result.rows,
          all_items: result.all_list
        });
      } else if(source.droppableId==='columns' && destination.droppableId==='all_list'){
        this.setState({
          selected_columns: result.columns,
          all_items: result.all_list
        });
      } else if( (source.droppableId==='all_list' || source.droppableId==='values') &&
        (destination.droppableId==='all_list' || destination.droppableId==='values') ){
        this.setState({
          all_items: result.all_list,
          selected_values: result.values
        });
        
      } else if( (destination.droppableId==='filters' || source.droppableId==='filters') ){
        if(destination.droppableId=='all_list'){
          this.setState({all_items: result.all_list});
        } else if(destination.droppableId=='rows'){
          this.setState({rows: result.rows});
        } else if(destination.droppableId=='columns'){
          this.setState({columns: result.columns});
        }
        this.setState({ selected_filters: result.filters });
        
      } else {
        if(destination.droppableId==='columns'){
          this.setState({
            all_items: result.all_list,
            selected_columns: result.columns
          });
        }
        if(destination.droppableId==='rows'){
          this.setState({
            all_items: result.all_list,
            selected_rows: result.rows
          });
        }
      }
    }
  };


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
  
    this.setState({
      'operation_list_pos_top': (yPosition-(yPosition-(30*index))),
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


  /*********************************
   * Filters Multiselect functions
   */

  //Handle Filters Block Item Click
  handleAnalysisFilter(event){
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
  }


  //Remove Selected element under filters panel  - filters, rows, columns, values
  handleCloseSelectedFilter(event){
    event.stopPropagation();
    let type = event.currentTarget.dataset.type;
    let source_id = event.currentTarget.dataset.source;
    let putBacktoAllList;
    let updatedSelectedBlock;

    // console.log(key+'---'+type+'---'+source_id);
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
  }


  //Analysis Filters Panel Component
  analysisFiltersPanel(){
    let num_operations_list_class = (this.state.show_number_operations_list) ? 'open' : '';
    
    return (
    <div id="analysis-filters-panel" className={this.state.toggleFilterPanel ? 'open' : ''}>
      <div className="analysis-filter-header clearfix">
        {!this.state.isSavedView &&
          <div className="header-inner">
            <ul className="tabs">
              <li className={'tab calender '+(this.state.filter_panel_tabs[0] ? 'active' : '')} onClick={(e) => this.handleFilterTabChange(e, 0)}><button className="btn-calender" title="Calendar">Calendar</button></li>
              <li className={'tab filters '+(this.state.filter_panel_tabs[1] ? 'active' : '')} onClick={(e) => this.handleFilterTabChange(e, 1)}><button className="btn-filter" title="Filters">Filters</button></li>
              {/* <li className="tab run"><button className="btn-run" disabled={(this.state.filter_panel_tabs[1] ? '' : 'disabled')} title="Run" onClick={this.handleAnalysisFilterSubmit}>Run</button></li> */}
            </ul>
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
            <div className="buttons-wrapper">
              <button className="btn-with-icon btn-run" title="Load Data" onClick={this.handleLoadDataWithAnalysisID}>Load Data</button>
              <button className="btn-with-icon btn-cancel" title="Cancel">Cancel</button>
            </div>

            <div className={'progress-wrapper clearfix '+(this.state.inprocess ? 'show-loading' : '')}>
              <div className={'msg '+(this.state.filter_panel_date_period_change_msg!=='' ? 'show': '')}>{this.state.filter_panel_date_period_change_msg}</div>
              <div className={'buttons-wrapper '+(this.state.filter_panel_date_period_change_msg!=='' ? 'show': '')}><button className="btn-with-icon btn-run" title="Apply Filters" onClick={(e) => this.handleFilterTabChange(e, 1)}>Apply Filters</button></div>
            </div>
          </div>
        </div>

        {/* Filter Tab Content */}
        <div id="data-filters" className={'tab-content clearfix '+(this.state.filter_panel_tabs[1] ? 'active' : '')}>
          <div className="buttons-wrapper">
            <button className="btn-with-icon btn-run" title="Run" onClick={this.handleAnalysisFilterSubmit}>Apply</button>
            <button className="btn-with-icon btn-reset" title="Reset" onClick={this.handleAnalysisFiltersReset}>Reset</button>
          </div>

          <div className="col-dnd-wrapper">
            <DragDropContext onDragEnd={this.onDragEnd}>
              <div className="all-lists-wrapper variable clearfix">
                <h3 className="title">All Lists</h3>
                <div className="content">
                  <Droppable droppableId="all_list">
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} style={getListStyle(snapshot.isDraggingOver)} className="content-inner">
                        {this.state.all_items.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div className={item.type} ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={getItemStyle( snapshot.isDragging, provided.draggableProps.style )}>
                                  {item.title}
                                  { (item.type=='number' || item.type=='calculated') && 
                                    <i className="icon icon-sigma"></i>
                                  }
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>

              {/* Filters Block */}
              <div className="filters-wrapper variable clearfix">
                <h3 className="title">Filters</h3>
                <div className="content">
                  <Droppable droppableId="filters">
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} style={getListStyle(snapshot.isDraggingOver)} className="content-inner">
                        {this.state.selected_filters.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={getItemStyle( snapshot.isDragging, provided.draggableProps.style )} 
                                data-title={item.title}
                                onClick={this.handleAnalysisFilter}
                                className="element filter-element">
                                {item.title}

                                {/* Show Selected Dimensions Count */}
                                <span className="count">
                                  {(this.state.selected_dimensions!==undefined && this.state.currentSelectedFilter!==undefined && this.state.selected_dimensions[item.title]!==undefined) &&
                                    '+'+this.state.selected_dimensions[item.title].length
                                  }
                                </span>

                                <button className="btn-close" data-key={(index+1)} data-type={item.id} data-source="filters" onClick={this.handleCloseSelectedFilter}>x</button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
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
              <div className="rows-wrapper variable clearfix">
                <h3 className="title">Rows</h3>
                <div className="content">
                  <Droppable droppableId="rows">
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} style={getListStyle(snapshot.isDraggingOver)} className="content-inner">
                        {this.state.selected_rows.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={getItemStyle(snapshot.isDragging, provided.draggableProps.style )}
                                className="element">
                                {item.title}
                                
                                {/* Don't show close button if it is values element */}
                                {item.title!=='values' &&
                                  <button className="btn-close" data-key={(index+1)} data-type={item.id} data-source="rows" onClick={this.handleCloseSelectedFilter}>x</button>
                                }
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>

              {/* Columns Block */}
              <div className="columns-wrapper variable clearfix">
                <h3 className="title">Columns</h3>
                <div className="content">
                  <Droppable droppableId="columns">
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} style={getListStyle(snapshot.isDraggingOver)} className="content-inner">
                        {this.state.selected_columns.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
                                className="element">
                                {item.title}

                                {/* Don't show close button if it is values element */}
                                {item.title!=='values' &&
                                  <button className="btn-close" data-key={(index+1)} data-type={item.id} data-source="columns" onClick={this.handleCloseSelectedFilter}>x</button>
                                }
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>

              {/* Values Block */}
              <div className="values-wrapper variable clearfix">
                <h3 className="title">Values</h3>
                
                <div className="content">
                  <Droppable droppableId="values">
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} style={getListStyle(snapshot.isDraggingOver)} className="content-inner">
                        {this.state.selected_values.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
                                className={item.type+' element'}>
                                <span>{item.default_action} </span>
                                {(item.default_action!='calculated') && ' of ' }
                                <span> {item.title}</span>
                                { item.default_action!='calculated' &&
                                  <button className="btn-select-operation" data-key={(index+1)} data-type={item.id} onClick={this.openValuesOperationsList}></button>
                                }
                                {/* <i className="icon icon-sigma"></i> */}
                                <button className="btn-close" data-key={(index+1)} data-type={item.id} data-source="values" onClick={this.handleCloseSelectedFilter}>x</button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

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
            </DragDropContext>
          </div>
          
        </div>
      </div>
      {/* End of analysis-filter-content */}
    </div>
    );
  }


  render() {
    const AnalysisFiltersPanel = (this.analysisFiltersPanel) ? this.analysisFiltersPanel : '';

    return (
      <AnalysisFiltersPanel />
    );
  }
}
 
export default AnalysisFiltersPanel;