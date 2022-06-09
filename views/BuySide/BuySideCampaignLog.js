import React, { Component } from 'react';
import moment from 'moment';
import * as Constants from '../../components/Constants.js';
import subjectObj from '../../subjects/Subject1';
import Loader from '../../components/Loader';

import '../../styles/Global.scss';
import '../../styles/BuySide.scss';

import { getKeyByValue, getClients, getUser } from '../../utils/Common';
import { isDateGreater } from '../../components/ReactCalendar/components/utils';
import RangePicker from '../../components/ReactCalendar/RangePicker';
import APIService from '../../services/apiService';
import BuySideReactTable from './BuySideReactTable';

class BuySideCampaignLog extends Component {
  constructor(props) {
    super(props);

    //Get Client & View Type & User
    this.user = getUser();
    this.controller = new AbortController();
    this.campaign_id = props.match.params.campaign_id;
    this.state = this.getInitVariables();
    this.datePeriodChange = this.datePeriodChange.bind(this);
  }

  getInitVariables(){
    let defaultObj = {
      inprocess: false,
      error: false,
      message: "",
      page_title: 'BuySide Campaign -',
      client: getKeyByValue(getClients(), this.user.last_fetched_client, 'id'),
      last_updated_date: '',
      last_updated_date_for_datepicker: '',
      selectedDateRange: '',
      campaignData: [],
      campaignSummary: {}
    };
    return defaultObj;
  }

  componentDidMount(){
    //Get Last Updated Date
    this.handleLoadScripts();
  }

  //Reload the page if client id/name change from url
  componentDidUpdate(){
    this.user = getUser();

    if(this.user.last_fetched_client!==this.state.client.id){
      //Update State Values
      this.setState(this.getInitVariables());

      if(this.state.client){
        this.handleLoadScripts();
      }
    }
  }

  handleLoadScripts(){
    this.getLastUpdatedDate();
  }


  //Get Last Updated Date
  getLastUpdatedDate(){
    //Input Validations
    this.setState({ error: '', inprocess: true });
   
    // console.time('sight: getLastUpdatedDate - API call');
    APIService.apiRequest(Constants.API_BASE_URL+'/buyside/last_updated_date/?client_id='+this.state.client.id, null, false, 'GET', this.controller)
      .then(response => {
        if(response.last_updated_date!==undefined){
          let lastupdateddate = response.last_updated_date;
          let defaultCount = 29;
          let defaultFormat = 'days';

          //Set last updated date and last 30days date range under analysis period input box
          let formattedDate = moment(lastupdateddate).utc().format('MMM DD, YYYY');
          let endDate = moment(lastupdateddate).utc().toDate();
          let formattedEndDate = moment(endDate.getTime() + endDate.getTimezoneOffset() * 60000).toDate(); //convert to utc time
          let formattedStartDate = moment(formattedEndDate).subtract(defaultCount, defaultFormat).toDate();

          if(defaultFormat==='months'){//for saved views
            formattedStartDate = moment(formattedEndDate).subtract(defaultCount, defaultFormat).startOf('month').toDate();
            formattedEndDate = moment(formattedEndDate).subtract(defaultCount, defaultFormat).endOf('month').toDate();
          } 
          if(defaultFormat==='this_month'){
            formattedStartDate = moment(formattedEndDate).startOf('month').toDate();
          }

          let formattedDateRange = [formattedStartDate, formattedEndDate];
          this.setState({
            last_updated_date: formattedDate,
            last_updated_date_for_datepicker: formattedEndDate,
            selectedDateRange: formattedDateRange
          }, ()=>{
            this.getBuySideCampignLogData(true);
          });
          
          //Pass LastUpdatedDate to Header Component
          subjectObj.notify({
            last_updated_date: this.state.last_updated_date,
            client: this.state.client
          });

        } else {
          this.setState({error: response.msg});
        }
      })
      .catch(err => {
        this.setState({ error: err.msg });
      });
  }


  //Get Buy Side Data
  getBuySideCampignLogData(date_period=null){
    let api_url = Constants.API_BASE_URL+'/buyside/campaign_log/?campaign_id='+this.campaign_id;
    if(date_period){
      let start_date = this.formatDate(this.state.selectedDateRange[0], 'YYYY-MM-DD');
      let end_date = this.formatDate(this.state.selectedDateRange[1], 'YYYY-MM-DD');
      api_url += '&start_date='+start_date+'&end_date='+end_date;
    }

    APIService.apiRequest(api_url, null, false, 'GET', this.controller)
      .then(response => {
        if(response.data.length > 0){
          this.setState({
            inprocess: false,
            campaignData: response.data,
            campaignSummary: response.summary,
            page_title: 'BuySide Campaign - '+response.summary.campaign_name+' - Log'
          }, ()=>{
            subjectObj.notify({ page_title: this.state.page_title });
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

  handleNavChange(base_url){
    let nav_path = base_url+'/'+this.campaign_id;
    this.props.history.push(nav_path);
  }
  handleBackToPreviousView(url){
    let nav_path = url;
    this.props.history.push(nav_path);
  }

  //Date Range Period Change
  datePeriodChange(date_range){
    //Input Validations and Send Fetch Request
    this.setState({
      selectedDateRange: date_range,
      inprocess: true
    }, ()=>{
      this.getBuySideCampignLogData(true);
    });
  }


  render() {
    let columnsToDisplay = [
      {Header: 'Date',  accessor: 'date'},
      {Header: 'Budget',  accessor: 'budget'},
      {Header: 'Campaign Stage', accessor: 'campaign_stage'},
      {Header: 'CPC Percent Change', accessor: 'cpc_percent_change'},
      {Header: 'Is Active',  accessor: 'is_active'},
      {Header: 'Is Emergency Changed', accessor: 'is_emergency_changed'},
      {Header: 'Is Marketer Changed', accessor: 'is_marketer_changed'},
      {Header: 'Log Timestamp', accessor: 'log_timestamp'},
      {Header: 'Notes', accessor: 'notes'},
      // {Header: 'Publisher Bid Modifier', accessor: 'publisher_bid_modifier'}
    ];


    return (
      <div className="app-wrapper">
        <div id="app-sub-header">

          <div className="filters-wrapper">
            <div className="filter date-period-wraper">
              <RangePicker picker="date"
                range={this.state.selectedDateRange}
                onChange={this.datePeriodChange}
                disableFn={(dObj) => isDateGreater(dObj, this.state.lastUpdatedDateObj)}
                showOkCancelBtns={true}
              />
            </div>
          </div>

          <div className="action-button-wrapper">
            <button className="btn outline xs btn-log mar-r10" onClick={()=>this.handleNavChange('/buyside/campaign')}>back</button>
            <button className="btn outline xs btn-backtocampaigns" onClick={()=>this.handleBackToPreviousView('/buyside')}>back to campaigns</button>
          </div>

          {/* <HideSubHeader />*/}
        </div>

        {/* Analysis Landing View */}
        <div className="container">
          <div className="odin-view clearfix">
            <div className="buyside-wrapper">
              {this.state.inprocess && <Loader /> }

              <div className="summary-wrapper">
                {Object.keys(this.state.campaignSummary).length > 0 &&
                  <div className="inner-wrapper">
                    {
                    Object.keys(this.state.campaignSummary).map((item) => {
                      if(item=='campaign_id' || item=='campaign_name') return;
                      let label = item.replace(/_/g, ' ');
                      return (
                        <div key={item} className={'info '+item}>
                          <div className="number">{this.state.campaignSummary[item]}</div>
                          <div className="label">{label}</div>
                        </div>
                      )
                    })
                    }
                  </div>
                }
              </div>

              <div className="data-wrapper">
                {this.state.campaignData.length > 0 &&
                  <BuySideReactTable 
                    columns={columnsToDisplay}
                    data={this.state.campaignData} 
                    client={this.state.client}
                  />
                }
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }
}
 
export default BuySideCampaignLog;