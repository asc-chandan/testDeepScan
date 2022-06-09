import React, { Component } from 'react';
import * as Constants from '../../../components/Constants.js';
import Loader from '../../../components/Loader';

import { getUser, exportCSVFile } from '../../../utils/Common'; //Import Common Functions
import APIService from '../../../services/apiService'; //Import Services

import DataStatusReactTable from './DataStatusReactTable';
import DataStatusFilters from './DataStatusFilters';

class Console extends Component {
  constructor(props) {
    super(props);

    this.user = getUser();
    this.controller = new AbortController();

    this.state = {
      inprocess: false,
      error: "",
      updatesData: [],
      advertisersList: []
    }
    this.handleFilterChange = this.handleFilterChange.bind(this);
    this.handleDownloadView = this.handleDownloadView.bind(this);
  }

  componentDidMount(){
    this.handleLoadScripts();
  }

  //Reload the page if client id/name change from url
  componentDidUpdate(prev_props){
    if(prev_props.match.params.id!==this.props.match.params.id){
      this.user = getUser();

      //Update State Values
      this.setState({
        inprocess: false,
        error: "",
        updatesData: [],
        advertisersList: []
      });
    }
  }

  componentWillUnmount(){
    //Cancel Previous API Requests
    console.log('unmount - cancel previous view running apis');
    APIService.abortAPIRequests(this.controller);
  }

  handleLoadScripts(){
    this.getUpdatesData({"client_id":"", "advertiser_id" : "", "status": ""});
  }

  getUpdatesData(apiPayload){
    //Input Validations
    this.setState({ error: '', inprocess: true});

    APIService.apiRequest(Constants.API_BASE_URL+'/console/advertiserTracking', apiPayload, false, 'POST', this.controller)
      .then(response => {
        if(response.status===1 && response.data!==undefined){
          this.setState({
            inprocess: false, 
            updatesData: response.data, 
            advertisersList: response.advertiser
          });
        } else {
          this.setState({inprocess: false, error: response.msg});
        }

        // subjectObj.notify({
        //   last_updated_date: 'NA',
        //   client: this.client
        // });
      })
      .catch(err => {
        this.setState({ inprocess: false, error: err.msg });
      });
  }

  getIdsArr(arr){
    let newArr = [];
    arr.forEach((item) => {
      newArr.push(item.id.toString());
    });
    return newArr;
  }

  handleFilterChange(arg){
    //Get Payment Summary Payload
    let apiPayLoad = {
      'client_id': (arg[0]['val']!=="") ? this.getIdsArr(arg[0]['val']) : "",
      'advertiser_id': (arg[1]['val']!=="") ? this.getIdsArr(arg[1]['val']) : "",
      'status': (arg[2]['val']!=="" && arg[2]['val']['name']!=="select") ? arg[2]['val']['name'] : ""
    }

    this.getUpdatesData(apiPayLoad);
  }

  //Handle Report Download
  handleDownloadView(event) {
    event.preventDefault();

    const cols = this.getColumnsToDisplay();
    const colsNameForCSV = cols.map(c => c.Header); // For Showing Column names in CSV
    // Extract the data having only those columns which are to be displayed
    let dataForCSV = [];
    this.state.updatesData.forEach(dataRow => {
      let rowForCSV = {};
      cols.forEach(col => rowForCSV[col.accessor] = dataRow[col.accessor]);
      dataForCSV.push(rowForCSV);
    });
    const dataWithHeader = [colsNameForCSV, ...dataForCSV]; // Concactinate Header with data
    exportCSVFile(dataWithHeader, 'sight_data_status_' + Date.now()) //formattedRows, file_name
  }

  //get columns names to display in table header
  getColumnsToDisplay() {
    let columnsToDisplay = [];
    if(this.state.updatesData.length > 0){
      let columns = Object.keys(this.state.updatesData[0]);
      columns.forEach((item) => {
        if(item==='csv_format_id' || item==='file_name' || item==='file_name') return;

        columnsToDisplay.push({
          Header: item.replace(/_/g, " "), 
          accessor: item
        });
      });
    }
    return columnsToDisplay;
  }


  render() {
    //Generate Columns to Display
    let columnsToDisplay = this.getColumnsToDisplay();

    return (
      <div className="app-wrapper custom-report">
        <div id="app-sub-header">
          <h2 className="page-title">Data Status</h2>

          <div className="filters-wrapper">
            <DataStatusFilters 
              advertisers={this.state.advertisersList}
              onFilterChanged={this.handleFilterChange}
            />
          </div>

          {/* Display Action Buttons */}
          <div className="action-button-wrapper">
            <div className="download-data-wrapper">
              <button className="btn-with-icon btn-download" onClick={this.handleDownloadView} title="Download View">Download</button>
            </div>
          </div>
        </div>


        {/* Analysis Landing View */}
        <div className="container">
          <div id="console" className="inner-container">
            <div id="section" className="section">
              {this.state.inprocess && <Loader />}

              <div className="content">
                {this.state.updatesData.length > 0 &&
                  <DataStatusReactTable 
                    columns={columnsToDisplay}
                    data={this.state.updatesData} 
                    client={this.client}
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
 
export default Console;