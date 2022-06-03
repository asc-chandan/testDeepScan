import React, { Component } from 'react';
import moment from 'moment';
import * as Constants from '../../components/Constants.js';
import subjectObj from '../../subjects/Subject1';
import Loader from '../../components/Loader';

import SpeedSelect from '../../components/SpeedSelect/SpeedSelect';
import Pagination from '../../components/Pagination/Pagination';

import { isDateGreater } from '../../components/ReactCalendar/components/utils';
import RangePicker from '../../components/ReactCalendar/RangePicker';

import '../../styles/Global.scss';
import '../../styles/BuySide.scss';

import { getKeyByValue, getClients, formatDate, getUser } from '../../utils/Common';
import APIService from '../../services/apiService';
import BuySideReactTable from './BuySideReactTable';
import HideSubHeader from '../../components/HideSubHeader';


class BuySide extends Component {
  constructor(props) {
    super(props);

    //Get Client & View Type & User
    this.page_title = 'BuySide';
    this.clients = getClients();
    this.user = getUser();
    this.controller = new AbortController();
    this.state = this.getInitVariables();

    this.datePeriodChange = this.datePeriodChange.bind(this);
    this.onOptionSelect = this.onOptionSelect.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
  }

  //Set Initial Variables
  getInitVariables(){
    let initialObj = {
      inprocess: false,
      error: false,
      message: "",
      last_updated_date: '',
      lastUpdatedDateObj: '',
      selectedDateRange: '',
      propertiesList: [],
      selected_property: [],
      campaignStages: [1,2,3,4,5,6],
      campaignFilters: [{'id': 'all', 'name': 'All'}, {'id': 'asc', 'name': 'ASC'},{'id': 'asc_trial', 'name': 'ASC Trail'}],
      selected_campaign_filters: '',
      selected_stages: [],
      buySideData: [],
      buySideSummary: {},
      totalRecords: 0,
      pageSizes: [10,20,50,100,200],
      pageSizeSelected: 50,
      currentPage: 1,
      client: getKeyByValue(this.clients, this.user.last_fetched_client, 'id')
    }
    return initialObj;
  }

  componentDidMount(){
    //Get Last Updated Date
    this.handleLoadScripts();
  }

  //Reload the page if client id/name change from url
  componentDidUpdate(prev_props){
    this.user = getUser();
    
    if(this.user.last_fetched_client!==this.state.client.id){
      //Update State Values
      this.setState(this.getInitVariables(), ()=>{
        if(this.state.client){
          this.handleLoadScripts();
        }
      });
    }
  }

  componentWillUnmount(){
    //Cancel Previous API Requests
    console.log('unmount - cancel previous view running apis');
    APIService.abortAPIRequests(this.controller);
  }

  handleLoadScripts(){
    subjectObj.notify({ 
      page_title: this.page_title,
      client: this.state.client
    });

    this.getLastUpdatedDate();
    this.getSitesList();
  }


  //Get Last Updated Date
  getLastUpdatedDate(){
    //Input Validations
    this.setState({ error: '', inprocess: true });
   
    APIService.apiRequest(Constants.API_BASE_URL+'/buyside/last_updated_date/?client_id='+this.state.client.id, null, false, 'GET', this.controller)
      .then(response => {
        if(response.status==404) {
          this.setState({ error: true, message: response.msg, buySideData: []});
          subjectObj.notify({ last_updated_date: '', client: this.state.client });
          return false;
        }

        if(response.last_updated_date!==undefined){
          let lastupdateddate = response.last_updated_date;
          let defaultCount = 6; //6;
          let defaultFormat = 'days';

          //Set last updated date and last 7days date range
          let formattedDate = moment(lastupdateddate).format('MMM DD, YYYY');
          let endDate = moment(lastupdateddate).toDate();
          let formattedEndDate = endDate;
          let formattedStartDate = moment(formattedEndDate).subtract(defaultCount, defaultFormat).toDate();
          let formattedDateRange = [formattedStartDate, formattedEndDate];
          
          //Pass LastUpdatedDate to Header Component
          subjectObj.notify({
            last_updated_date: formattedDate,
            client: this.state.client
          });

          this.setState({
            last_updated_date: formattedDate,
            lastUpdatedDateObj: formattedEndDate,
            selectedDateRange: formattedDateRange
          }, ()=>{
            this.getBuySideData();
          });

        } else {
          this.setState({error: response.msg});
        }
      })
      .catch(err => {
        this.setState({ error: err.msg });
      });
  }

  //Get Sites List
  getSitesList(){
    let apiPayload = 'client_id='+this.state.client.id;

    APIService.apiRequest(Constants.API_BASE_URL+'/buyside/sites/?'+apiPayload, null, false, 'GET', this.controller)
      .then(response => {
        if(response.status==404) {
          this.setState({ propertiesList: [] });
        }

        if(response.sites.length > 0){
          this.setState({ propertiesList: response.sites });
        }
      })
      .catch(err => {
        this.setState({ inprocess: false });
        console.log(err.msg);
      });
  }


  //Get Buy Side Data
  getBuySideData(){
    //Input Validations
    var start_date = this.formatDate(this.state.selectedDateRange[0], 'YYYY-MM-DD');
    var end_date = this.formatDate(this.state.selectedDateRange[1], 'YYYY-MM-DD');
    let apiPayload = '?start_date='+start_date+'&end_date='+end_date+'&client_id='+this.state.client.id+'&source=taboola&page_number='+this.state.currentPage+'&page_size='+this.state.pageSizeSelected;
    
    if(this.state.selected_property.length > 0){
      let site_ids = [];
      this.state.selected_property.forEach((item, i) => {
        site_ids.push(item.id);
      });
      apiPayload += '&site_id='+site_ids;
    }
    if(this.state.selected_stages.length > 0){
      apiPayload += '&campaign_stage='+this.state.selected_stages;
    }
    if(this.state.selected_campaign_filters!==''){
      apiPayload += '&campaign_filter='+this.state.selected_campaign_filters.id;
    }

    APIService.apiRequest(Constants.API_BASE_URL+'/buyside/'+apiPayload, null, false, 'GET', this.controller)
      .then(response => {
        if(response.data){
          this.setState({
            inprocess: false,
            buySideData: response.data,
            buySideSummary: response.summary,
            totalRecords: response.meta.total_results,
            // totalPages: Math.ceil(response.meta.total_results/this.state.pageSizeSelected)
          });
        }
      })
      .catch(err => {
        this.setState({ inprocess: false });
        console.log(err.msg);
      });
  }


  //Format Date
  formatDate(date, date_format){
    return moment(date).format(date_format);
  }

  //Date Range Period Change
  datePeriodChange(date_range){
    //Input Validations and Send Fetch Request
    this.setState({
      selectedDateRange: date_range,
      inprocess: true
    }, ()=>{
      this.getBuySideData();
    });
  }


  //On Select Change
  onOptionSelect(event, id){
    let stateObj = {
      inprocess: true,
    }
    if(id==='property'){
      stateObj['selected_property'] = event;
    }
    if(id==='campaign_stage'){
      stateObj['selected_stages'] = event;
    }
    if(id==='campaign_filter'){
      if(this.state.selected_campaign_filters===event) return;
      stateObj['selected_campaign_filters'] = event;
      stateObj['currentPage'] = 1;
      stateObj['totalRecords'] = 0;
    }
    // if(id==='pagination'){
    //   stateObj['pageSizeSelected'] = event;
    // }

    this.setState(stateObj, ()=>{
      this.getBuySideData();
    });
  }


  //Handle Page Change
  handlePageChange(args){
    if(args){
      args['inprocess'] = true;
      this.setState(args);

      //Get Buy Side Data
      setTimeout(() => { this.getBuySideData(); }, 10);
    }
  }


  render() {
    let columnsToDisplay = [
      {Header: 'Campaign Name',  accessor: 'campaign_name'},
      {Header: 'Stage',  accessor: 'campaign_stage'},
      {Header: 'UTM',  accessor: 'utm_campaign'},
      {Header: 'Spent', accessor: 'spent'},
      {Header: 'Clicks', accessor: 'clicks'},  
      {Header: 'Total Revenue', accessor: 'revenue'},
      {Header: 'Served Impressions', accessor: 'served_impressions'},
      {Header: 'Margin', accessor: 'margin'},
    ];


    return (
      <div className="app-wrapper buy-side-wrapper">
        <div id="app-sub-header">
          {/* <h2 className="page-title">BuySide</h2> */}

          <div className="filters-wrapper">
            <div className="filter date-period-wraper" ref={node => {this.datePickerNode = node;}}>
              <RangePicker picker="date"
                range={this.state.selectedDateRange}
                onChange={this.datePeriodChange}
                disableFn={(dObj) => isDateGreater(dObj, this.state.lastUpdatedDateObj)}
                showOkCancelBtns={true}
              />
            </div>

            <div className="filter property">
              {this.state.propertiesList && 
                <SpeedSelect
                  options={this.state.propertiesList} // required
                  selectedOption={(this.state.selected_property) ? this.state.selected_property : []} // required
                  onSelect={(e) => this.onOptionSelect(e, 'property')} 
                  displayKey='name'
                  uniqueKey='id'
                  multiple 
                  selectLabel='Properties' 
                  maxHeight={120}
                />
              }
            </div>

            <div className="filter stage">
              {this.state.campaignStages && 
                <SpeedSelect
                  options={this.state.campaignStages} // required
                  selectedOption={(this.state.selected_stages) ? this.state.selected_stages : []} // required
                  onSelect={(e) => this.onOptionSelect(e, 'campaign_stage')} 
                  displayKey='name'
                  uniqueKey='id'
                  multiple 
                  selectLabel='Stage' 
                  maxHeight={120}
                />
              }
            </div>

            <div className="filter campaign_filter">
              {this.state.campaignFilters && 
                <SpeedSelect
                  options={this.state.campaignFilters} // required
                  selectedOption={(this.state.selected_campaign_filters) ? this.state.selected_campaign_filters : ''} // required
                  onSelect={(e) => this.onOptionSelect(e, 'campaign_filter')} 
                  displayKey='name'
                  uniqueKey='id'
                  // multiple 
                  selectLabel='Filter' 
                  maxHeight={120}
                />
              }
            </div>
          </div>
        
          {/* <HideSubHeader />*/}
        </div>

        {/* Analysis Landing View */}
        <div className="container">
          <div className="buyside-wrapper">
            {this.state.inprocess && <Loader /> }
            
            <div className="summary-wrapper">
              {Object.keys(this.state.buySideSummary).length > 0 &&
                <div className="inner-wrapper">
                  {
                    Object.keys(this.state.buySideSummary).map((item, i) => {
                      let label = item.replace(/_/g, ' ');
                      label = label.replace('roi', 'ROI');

                      return (
                        <div key={i} className={'info '+item}>
                          <div className="number">{this.state.buySideSummary[item]}</div>
                          <div className="label">{label}</div>
                        </div>
                      )
                    })
                  }
                </div>
              }
            </div>

            <div className="data-wrapper">
              {this.state.buySideData &&
                <BuySideReactTable 
                  columns={columnsToDisplay}
                  data={this.state.buySideData} 
                  client={this.state.client}
                />
              }

              {this.state.buySideData.length > 0 &&
                <Pagination
                  totalRecords={this.state.totalRecords}
                  pageSizes={this.state.pageSizes}
                  pageSizeSelected={this.state.pageSizeSelected}
                  currentPage={this.state.currentPage}
                  onPageChange={this.handlePageChange}
                />
              }
            </div>
          </div>
        </div>
      </div>
    );
  }
}
 
export default BuySide;