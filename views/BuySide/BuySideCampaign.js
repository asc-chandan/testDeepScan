import React, { Component } from 'react';
import moment from 'moment';
import * as Constants from '../../components/Constants.js';
import subjectObj from '../../subjects/Subject1';
import Loader from '../../components/Loader';

import '../../styles/Global.scss';
import '../../styles/BuySide.scss';

import { getKeyByValue, getClients, formatDate, getUser } from '../../utils/Common';
import APIService from '../../services/apiService';
import BuySideReactTable from './BuySideReactTable';
import HideSubHeader from '../../components/HideSubHeader';


class BuySideCampaign extends Component {
  constructor(props) {
    super(props);

    //Get Client & View Type & User
    this.user = getUser();
    this.controller = new AbortController();
    this.campaign_id = props.match.params.campaign_id;
    this.state = this.getInitVariables();
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
  componentDidUpdate(prev_props){
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
    subjectObj.notify({ 
      page_title: this.page_title,
      client: this.state.client
    });
    
    this.getLastUpdatedDate();
    this.getBuySideCampignData();
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
          let defaultCount = 6; //6;
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
              if(this.state.savedAnalysisPeriod==='This Month'){ 
                defaultFormat = 'this_month';
              }
            }
          }

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
            formattedEndDate = formattedEndDate;
          }

          // let formattedStartDate = moment(formattedEndDate).subtract(defaultCount, defaultFormat).toDate();
          let formattedDateRange = {startDate: formattedStartDate, endDate: formattedEndDate};
          this.setState({
            last_updated_date: formattedDate,
            last_updated_date_for_datepicker: formattedEndDate,
            selectedDateRange: formattedDateRange
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
  getBuySideCampignData(){
    APIService.apiRequest(Constants.API_BASE_URL+'/buyside/campaign/?campaign_id='+this.campaign_id, null, false, 'GET', this.controller)
      .then(response => {
        if(response.data.length > 0){
          this.setState({
            inprocess: false,
            campaignData: response.data,
            campaignSummary: response.summary,
            page_title: 'BuySide Campaign - '+response.summary.campaign_name
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


  render() {
    let columnsToDisplay = [
      {Header: 'Date',  accessor: 'date'},
      {Header: 'Clicks',  accessor: 'clicks'},
      {Header: 'Conversions', accessor: 'conversions'},
      {Header: 'Revenue', accessor: 'revenue'},
      {Header: 'Impressions',  accessor: 'impressions'},
      {Header: 'Margin', accessor: 'margin'},
      {Header: 'ROI', accessor: 'roi'},
      {Header: 'Spent', accessor: 'spent'},
      {Header: 'Total Served Impressions', accessor: 'total_served_impressions'},
      {Header: 'Visible Impressions', accessor: 'visible_impressions'},
    ];

    // console.log('data');
    // console.log(this.state.campaignData);

    return (
      <div className="app-wrapper">
        <div id="app-sub-header">
          <div className="action-button-wrapper">
            <button className="btn outline xs btn-log mar-r10" onClick={()=>this.handleNavChange('/buyside/campaign/log')}>Log</button>
            <button className="btn outline xs btn-publisher-data mar-r10" onClick={()=>this.handleNavChange('/buyside/campaign/publisher_data')}>Publisher Data </button>
            <button className="btn outline xs btn-backtocampaigns" onClick={()=>this.handleBackToPreviousView('/buyside')}>Back</button>
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
                    Object.keys(this.state.campaignSummary).map((item, i) => {
                      if(item=='campaign_id' || item=='campaign_name') return;
                      let label = item.replace(/_/g, ' ');
                      return (
                        <div className={'info '+item}>
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
 
export default BuySideCampaign;