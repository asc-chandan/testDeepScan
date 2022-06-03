import React, { Component } from 'react';
import moment from 'moment';
import * as Constants from '../../components/Constants.js';
import subjectObj from '../../subjects/Subject1';
import Loader from '../../components/Loader';

import DefaultReactTable from '../../components/table/DefaultReactTable';
import { getKeyByValue, getClients, getUser, orderObjectKey } from '../../utils/Common';
import APIService from '../../services/apiService';

class ScoreCard extends Component {
  constructor(props) {
    super(props);
    this.user = getUser();
    this.controller = new AbortController();

    this.state = {
      inprocess: false,
      error: "",
      client: getKeyByValue(getClients(), this.user.last_fetched_client, 'id'),
      scoreCardColumns: null,
      scoreCardData: null,
      last_updated_date: '',
      last_updated_date_for_datepicker: ''
    }
    
    this.page_title = 'ScoreCard';
    this.getScoreCardData = this.getScoreCardData.bind(this);
  }

  //Reload the page if client id/name change from url
  componentDidUpdate(prev_props){
    this.user = getUser();
    if(this.user.last_fetched_client!==this.state.client.id || prev_props.match.params.view_type!==this.props.match.params.view_type){
      this.setState({
        inprocess: false,
        error: "",
        client: getKeyByValue(getClients(), this.user.last_fetched_client, 'id'),
        scoreCardColumns: null,
        scoreCardData: null,
        last_updated_date: '',
        last_updated_date_for_datepicker: ''
      });

      this.loadScripts();
    }
  }

  loadScripts(){
    this.getLastUpdatedDate();
    this.getScoreCardData();
  }

  componentDidMount(){
    this.loadScripts();
  }

  componentWillUnmount(){
    //Cancel Previous API Requests
    console.log('unmount - cancel previous view running apis');
    APIService.abortAPIRequests(this.controller);
  }
  
  //Get Last Updated Date
  getLastUpdatedDate(){
    this.setState({ error: '' });
        
    const datePayLoad = {
      "client_id": this.state.client.id,
      "view_type": this.view_type
    };
    APIService.apiRequest(Constants.API_BASE_URL+'/getLastUpdatedDates', datePayLoad, false, 'POST', this.controller)
      .then(response => {
        if(response.status===1 && response.data!==undefined){
          let lastupdateddate = JSON.parse(response.data);
          let formattedDate = moment(lastupdateddate[0]['last_updated_date']).utc().format('MMM DD, YYYY');
          let endDate = moment(lastupdateddate[0]['last_updated_date']).utc().toDate();
          let formattedEndDate = moment(endDate.getTime() + endDate.getTimezoneOffset() * 60000).toDate(); //convert to utc time

          this.setState({
            last_updated_date: formattedDate,
            last_updated_date_for_datepicker: formattedEndDate
          });

          setTimeout(()=>{
            //Pass LastUpdatedDate to Header Component
            subjectObj.notify({
              last_updated_date: this.state.last_updated_date,
              client: this.state.client,
            });
          },10);
        } else {
          this.setState({error: response.msg});
        }
      })
      .catch(err => {
        this.setState({ error: err.msg });
      });
  }

  //Get Payment Summary
  getScoreCardData(){
    //Input Validations and Send Fetch Request
    this.setState({ error: '', inprocess: true });

    let apiPayload = {
      'client_id': this.state.client.id
    }

    APIService.apiRequest(Constants.API_BASE_URL+'/getScorecard', apiPayload, false, 'POST', this.controller)
      .then(response => {
        if(response.status===1 && response.data!==undefined){
          //Remove Loading Icon
          console.log(response.columns);
          this.setState({inprocess: false, scoreCardColumns: response.columns, scoreCardData: response.data});
        } else {
          this.setState({inprocess: false, error: response.msg, scoreCardColumns:[], scoreCardData:[] });
        }
      })
      .catch(err => {
        this.setState({ inprocess: false, error: err.msg });
      });
  }



  render() {
    //Generate Columns to Display
    let columnsToDisplay = [];
    if(this.state.scoreCardColumns){
      this.state.scoreCardColumns.forEach((item) => {
        columnsToDisplay.push({Header: item, accessor: item});
      });
    }
   
    let scoreCardData = [];
    if(this.state.scoreCardColumns){
      this.state.scoreCardData.map((item, i) => {
        let obj = orderObjectKey(item, this.state.scoreCardColumns);
        scoreCardData.push(obj)
      });
    }
    
    return (
      <div className="app-wrapper">
        <div id="app-sub-header">
          <h2 className="page-title">{this.page_title}</h2>
        </div>

        <div className="container">
          <div className="data-grids">
            <section className="section">
              {this.state.inprocess && <Loader />}

              {scoreCardData &&
                <DefaultReactTable 
                  columns={columnsToDisplay}
                  data={scoreCardData} 
                  client={this.state.client}
                />
              }
            </section>
          </div>
        </div>
      </div>
    );
  }
}
 
export default ScoreCard;