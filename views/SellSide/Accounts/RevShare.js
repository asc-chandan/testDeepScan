import React, { Component } from 'react';
import moment from 'moment';
import * as Constants from '../../../components/Constants.js';
import subjectObj from '../../../subjects/Subject1';
import SpeedSelect from '../../../components/SpeedSelect/SpeedSelect';
import Loader from '../../../components/Loader';
import AlertBox from '../../../components/AlertBox';
import '../../../styles/Accounts.scss';
import '../../../styles/RevShare.scss';

import RevShareReactTable from './RevShareReactTable';
import { getKeyByValue, getClients, getUser } from '../../../utils/Common';
import APIService from '../../../services/apiService';

class RevShare extends Component {
  constructor(props) {
    super(props);

    this.page_title = 'Revenue Share';
    this.user = getUser();
    this.controller = new AbortController();
    this.state = this.getInitVariables();

    this.view_type = 'rev_share';
    this.dimensions_str = "advertiser";
    
    this.getRevShare = this.getRevShare.bind(this);
    this.handleDimensionsChange = this.handleDimensionsChange.bind(this);
    this.onOptionSelect = this.onOptionSelect.bind(this);
    this.handleAddNewRow = this.handleAddNewRow.bind(this);
    this.handleOnAddNewRevShare = this.handleOnAddNewRevShare.bind(this);
    this.handleUpdateRevShareData = this.handleUpdateRevShareData.bind(this);
    this.handleSaveUpdates = this.handleSaveUpdates.bind(this);
    this.handleAlertClose = this.handleAlertClose.bind(this);
  }

  //Set intial state variables
  getInitVariables(){
    let client_id = this.user.last_fetched_client;
    if(client_id===''){
      client_id = this.user.clients[0]['id'];
    }

    let initObj = {
      inprocess: false,
      message: "",
      error: "",
      client: (client_id !== '' ? getKeyByValue(getClients(), client_id, 'id') : ''),
      showAlert: false,
      revShareData: null,
      last_updated_date: '',
      last_updated_date_for_datepicker: '',
      data_types_list: [{id:'advertiser', name:'Advertiser'},{id:'adserver', name:'Adserver'}],
      dimensions: {},
      selected_dimensions: {},
      view_type_advertisers: {}, //used under table
      selected_advertisers: {}, //used under table
      allFilters: [
        {'id':'data_type', 'val':[{id:'advertiser', name:'Advertiser'}]},
        {'id':'advertiser', 'val':''}
      ],
      showAddNewRow: false,
      updatedData: []
    }
    return initObj;
  }

  loadScripts(){
    this.getLastUpdatedDate();
    this.getAllDimensions();
    this.getRevShare();
  }

  componentDidMount(){
    subjectObj.notify({ page_title: this.page_title });
    
    this.loadScripts();
  }

  //Reload the page if client id/name change from url
  componentDidUpdate(prev_props){
    this.user = getUser();
    if(this.user.last_fetched_client!==this.state.client.id || prev_props.match.params.view_type!==this.props.match.params.view_type){
      this.setState(this.getInitVariables(), ()=>{
        //Get Last Updated Date
        this.loadScripts();
      });
    }
  }

  componentWillUnmount(){
    //Cancel Previous API Requests
    console.log('unmount - cancel previous view running apis');
    APIService.abortAPIRequests(this.controller);
  }

  handleAlertClose(){
    this.setState({ showAlert: false });
  }
  
  //Get Last Updated Date
  getLastUpdatedDate(){
    //Input Validations
    this.setState({ error: '', inprocess: true});
        
    const datePayLoad = {
      "client_id": this.state.client.id,
      "view_type": this.view_type
    };
    APIService.apiRequest(Constants.API_BASE_URL+'/getLastUpdatedDates', datePayLoad, false, 'POST', this.controller)
      .then(response => {
        if(response.status===1 && response.data!==undefined){
          //Set last updated date and last 30days date range under analysis period input box
          let lastupdateddate = JSON.parse(response.data);
          let formattedDate = moment(lastupdateddate[0]['last_updated_date']).utc().format('MMM DD, YYYY');
          let endDate = moment(lastupdateddate[0]['last_updated_date']).utc().toDate();
          let formattedEndDate = moment(endDate.getTime() + endDate.getTimezoneOffset() * 60000).toDate(); //convert to utc time
          
          this.setState({
            last_updated_date: formattedDate,
            last_updated_date_for_datepicker: formattedEndDate,
            inprocess: false
          }, ()=>{
            //Pass LastUpdatedDate to Header Component
            subjectObj.notify({
              last_updated_date: this.state.last_updated_date,
              client: this.state.client,
            });
          });
        } else {
          this.setState({inprocess: false, error: response.msg});
        }
      })
      .catch(err => {
        this.setState({ error: err.msg });
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

  //Get Dimension using API
  getAllDimensions(evt) {
    //Input Validations and Send Fetch Request
    this.setState({ error: '', inprocess: true });

    const dimensionPayLoad = {
      "client_id": this.state.client.id,
      "view_type": "revenue_share_settings",
      "dimension": "advertiser",
      "dimension_filter": "",
    };
    APIService.apiRequest(Constants.API_BASE_URL+'/getAllDimensions', dimensionPayLoad, false, 'POST', this.controller)
      .then(response => {
        if(response.status===1 && response.data!==undefined){
          // let dimensions = JSON.parse(response.data);
          let allDimensions = [];
          let parsedDimensions = [];

          response.data.forEach((item, i) => {
            let newData = {};
            let parsedData = JSON.parse(item['data']);
            let list = JSON.parse(parsedData['advertiser']);
            newData['advertiser'] = list;
            parsedDimensions.push(newData);
          });

          this.setState({ 
            dimensions: parsedDimensions[0],
            view_type_advertisers: {'advertiser': parsedDimensions[0]['advertiser'], 'adserver': parsedDimensions[0]['advertiser']}
          });
        } else {
          this.setState({inprocess: false, error: response.msg });
        }
      })
      .catch(err => {
        this.setState({ error: err.msg });
      });
  }

  //On Select Change
  onOptionSelect(event, id){
    var item_type = id;
    var item_val = event;
  
    var index = this.state.allFilters.findIndex(p => p.id == item_type);
    const obj = this.state.allFilters[index];
    this.setState({
      selected_dimensions: {
        ...this.state.selected_dimensions,
        [id]: event
      },
      allFilters: [
        ...this.state.allFilters.slice(0, index),
        { ...obj, val: item_val},
        ...this.state.allFilters.slice(index + 1)
      ]
    });

    setTimeout(() => {
      //Update Global Advertiser Dimension
      if(id==='data_type'){
        let updatedDimenions = JSON.parse(JSON.stringify(this.state.dimensions));
        
        //get combined list of advertiser for both view types
        if(item_val.length > 1){
          let updatedAdvertiser = [];
          item_val.forEach((item, i) => {
            if(updatedAdvertiser.length === 0){
              updatedAdvertiser = this.state.view_type_advertisers[item['id']];
            } else {
              let newAdvertiser = updatedAdvertiser.concat(this.state.view_type_advertisers[item['id']]);
              updatedAdvertiser = newAdvertiser.filter((item, pos) => newAdvertiser.indexOf(item) === pos)
            }
          });
          updatedDimenions['advertiser'] = updatedAdvertiser;
          
        } else { //get individual view type advertisers list
          updatedDimenions['advertiser'] = this.state.view_type_advertisers[item_val[0]['id']];
        }
        
        this.setState({
          dimensions: updatedDimenions
        });
      }

      this.handleDimensionsChange(this.state.allFilters); 
    },0);
  }

  getRevShareFilters(){
    let obj = {
      "client_id": this.state.client.id,
      "data_type": ["advertiser"],
      // "advertiser_id": [],
    };
    return obj;
  }


  //Get Payment Summary
  getRevShare(apiPayload){
    if(!apiPayload){
      apiPayload = this.getRevShareFilters();
    }
    //Input Validations and Send Fetch Request
    this.setState({ error: '', inprocess: true });

    APIService.apiRequest(Constants.API_BASE_URL+'/getAdvertiserRevShare', apiPayload, false, 'POST', this.controller)
      .then(response => {
        if(response.status===1 && response.data!==undefined){
          //Remove Loading Icon
          this.setState({inprocess: false, revShareData: response.data});
        } else {
          this.setState({inprocess: false, error: response.msg });
        }
      })
      .catch(err => {
        this.setState({ error: err.msg });
      });
  }


  handleDimensionsChange(arg){
    let dataTypes = [];
    arg[0]['val'].forEach((item) => {
      dataTypes.push(item.id);
    });

    //Get Payment Summary Payload
    let apiPayLoad = {
      ...this.getRevShareFilters(),
      'data_type': (dataTypes) ? dataTypes: [],
      'advertiser': (arg[1]['val']!=='') ? arg[1]['val'] : []
    }
    
    this.getRevShare(apiPayLoad);
  }

  //Add New Row to RevShare Table
  handleAddNewRow(){
    this.setState({
      showAddNewRow: true
    })
  }

  //Add New RevShare Saved entry to existing data set
  handleOnAddNewRevShare(args){
    let updatedData = JSON.parse(JSON.stringify(this.state.revShareData));
    updatedData.push(args);

    this.setState({
      showAddNewRow: false,
      revShareData: updatedData
    })
  }

  //Update exiting rev share row details
  handleUpdateRevShareData(args, index, updatedRevShareData){
    let updatedData = JSON.parse(JSON.stringify(this.state.revShareData));
    for (const [key, value] of Object.entries(args)) {
      updatedData[index][key] = value;
    }
    this.setState({
      showAddNewRow: false,
      revShareData: updatedData,
      updatedData: updatedRevShareData
    });
  }

  //Save Rev share edited changes
  handleSaveUpdates(){
    // console.log('updated changes');
    // console.log(this.state.updatedData);

    if(this.state.updatedData.length > 0){
      this.setState({
        showAlert: false,
        inprocess: true,
        error: ''
      });

      APIService.apiRequest(Constants.API_BASE_URL+'/editRevShare', this.state.updatedData, false, 'PUT', this.controller)
        .then(response => {
          if(response.status===1){
            //Remove Loading Icon
            this.setState({ inprocess: false, showAlert: true, message: response.msg, updatedData: [] });
          } else {
            this.setState({ inprocess: false, showAlert: true, message: response.msg, error: true });
          }
        })
        .catch(err => {
          this.setState({ inprocess: false, showAlert: true, message: err.msg, error: true });
        });
    }
  }


  render() {
    let columnsToDisplay = [
      { Header: 'Client', accessor: 'client_name' },
      { Header: 'Data Type', accessor: 'data_type' },
      { Header: 'Advertiser', accessor: 'advertiser_name' },
      { Header: 'Start Date', accessor: 'effective_start_date' },
      { Header: 'End Date', accessor: 'effective_end_date' },
      { Header: 'Is Net', accessor: 'is_net' },
      { Header: 'Revenue Share Percent', accessor: 'revenue_share_percent' },
      { Header: 'Action', accessor: 'action' }
    ];

    return (
      <div className="app-wrapper accounts-view revshare-view">
        <div id="app-sub-header">
          {/* <h2 className="page-title">{this.page_title}</h2> */}

          <div className="filters-wrapper">
            <div className="header-filters-wrapper">
              <div className="col date-type">
                <div className="form-group">
                  <SpeedSelect
                    options={this.state.data_types_list}
                    selectedOption={(this.state.allFilters[0]['val']) ? this.state.allFilters[0]['val']: []}
                    onSelect={(e) => this.onOptionSelect(e, 'data_type')}
                    displayKey='name'
                    uniqueKey='id'
                    multiple
                    selectLabel='DataType'
                    maxHeight={120}
                  />
                </div>
              </div>

              <div className="col advertiser">
                {this.state.dimensions['advertiser']!==undefined && 
                  <div className="form-group">
                    <SpeedSelect
                      options={this.state.dimensions['advertiser']}
                      selectedOption={(this.state.selected_dimensions['advertiser']) ? this.state.selected_dimensions['advertiser'] : []}
                      onSelect={(e) => this.onOptionSelect(e, 'advertiser')}
                      multiple
                      displayKey='value'
                      uniqueKey='advertiser'
                      selectLabel='Advertiser'
                      maxHeight={120}
                    />
                  </div>
                }
              </div>
            </div>
          </div>

          {(this.user.organization_id===1 && this.user.privileges['sellside'].indexOf('REVENUE_SHARE_SETTINGS') > -1) &&
            <div className="action-button-wrapper">
              <button className="btn outline xs btn-save" onClick={this.handleSaveUpdates}>Save</button>
              <button className="btn outline xs btn-add-new" onClick={this.handleAddNewRow}>Add New</button>
            </div>
          }
        </div>
        
        <div className="container">
          <div id="revenue-share" className="inner-container">
            <section className="section">
              {this.state.inprocess && <Loader />}
              
              {this.state.showAlert &&
                <AlertBox
                  error={this.state.error}
                  message={this.state.message}
                  onAlertClose={this.handleAlertClose}
                  autoHide={true}
                />
              }
              
              {(this.state.revShareData && Object.keys(this.state.dimensions).length > 0) &&
                <RevShareReactTable 
                  columns={columnsToDisplay}
                  data={this.state.revShareData} 
                  client={this.state.client}
                  showAddNewRow={this.state.showAddNewRow}
                  advertisers={this.state.view_type_advertisers}
                  onAddNewRevShare={this.handleOnAddNewRevShare}
                  onUpdateRevShareData={this.handleUpdateRevShareData}
                  user={this.user}
                />
              }
            </section>
          </div>
        </div>
      </div>
    );
  }
}
 
export default RevShare;