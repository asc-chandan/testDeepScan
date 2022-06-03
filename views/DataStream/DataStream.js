import React, { Component } from 'react';
import moment from 'moment';
import * as Constants from '../../components/Constants.js';
import subjectObj from '../../subjects/Subject1';
import Loader from '../../components/Loader';

import '../../styles/Global.scss';
import '../../styles/DataStream.scss';

import { getKeyByValue, getClients, formatDate, getUser } from '../../utils/Common';
import APIService from '../../services/apiService';
import DataStreamReactTable from './DataStreamReactTable';

class DataStream extends Component {
  constructor(props) {
    super(props);

    //Get Client & View Type
    this.client = getKeyByValue(getClients(), props.match.params.id);
    this.user = getUser();
    
    this.state = {
      inprocess: false,
      error: false,
      message: "",
      last_updated_date: '',
      last_updated_date_for_datepicker: ''
    }

    // this.handleToggleGenerateToken = this.handleToggleGenerateToken.bind(this);
    // this.handleTextBoxChange = this.handleTextBoxChange.bind(this);
    // this.handleCopyToken = this.handleCopyToken.bind(this);
    // this.handleRevokeToken = this.handleRevokeToken.bind(this);
    // this.handleGenerateToken = this.handleGenerateToken.bind(this);
  }

  componentDidMount(){
    //Get Last Updated Date
    console.time('sight: Components - init');
    // if(this.client){
      this.handleLoadScripts();
    // }
  }

  //Reload the page if client id/name change from url
  componentDidUpdate(prev_props){
    if(prev_props.match.params.id!==this.props.match.params.id){
      this.client = getKeyByValue(getClients(), this.props.match.params.id);
      
      //Update State Values
      this.setState({
        inprocess: false,
        error: false,
        message: "",
        last_updated_date: '',
        last_updated_date_for_datepicker: '',
        selectedDateRange: '',
        showGenerateTokenForm: false,
        user_name: this.user.user_name,
        user_password: ''
      });

      if(this.client){
        this.handleLoadScripts();
      }
    }
  }

  handleLoadScripts(){
    console.timeEnd('sight: Components - init');
  }


  render() {
    let queryParamsColumnsToDisplay = [
      {Header: 'S No',  accessor: 'id'},
      {Header: 'Parameter',  accessor: 'query_parameter'},
      {Header: 'Type', accessor: 'type'},
      {Header: 'Format', accessor: 'format'},  
      {Header: 'Example', accessor: 'example'},
      {Header: 'Possible Values', accessor: 'possible_values'},
    ];
    let queryParamsData = [
      {id: 1, query_parameter: 'start_date', type: 'required', format: 'YYYY-MM-DD', example: '2020-11-11', possible_values: 'all valid dates'},
      {id: 2, query_parameter: 'end_date', type: 'required', format: 'YYYY-MM-DD', example: '2020-11-11', possible_values: 'all valid dates'},
      {id: 3, query_parameter: 'data_type', type: 'required', format: 'string', example: 'advertiser', possible_values: 'advertiser | adserver | webanalytics'},
      {id: 4, query_parameter: 'segmentation', type: 'optional', format: 'comma separated string', example: 'property, advertiser', possible_values: ''},
    ];

    let segmentationColumnsToDisplay = [
      {Header: 'S No',  accessor: 'id', headerClassName: 'col' },
      {Header: 'Data Type',  accessor: 'data_type', headerClassName: 'col'},
      {Header: 'Possible Segmentation', accessor: 'possible_segmentation', headerClassName: 'col'},
    ];
    let segmentationData = [
      {id: 1, data_type: 'advertiser', possible_segmentation: 'property, advertiser, ad_unit, monetization_channel'},
      {id: 2, data_type: 'adserver', possible_segmentation: '<span>property</span>, <span>advertiser</span>, <span>ad_unit</span>, <span>monetization_channel</span>, <span>device_category</span>, <span>region</span>,  <span>os</span>'},
      // {id: 2, data_type: 'adserver', possible_segmentation: 'property, advertiser, ad_unit, monetization_channel, device_category, region, os'},
      {id: 3, data_type: 'webanalytics', possible_segmentation: 'property, region, device_category'},
    ];


    let accessTokenColumnsToDisplay = [
      {Header: 'Access Token',  accessor: 'access_token', headerClassName: 'col'},
      {Header: 'Authenticate',  accessor: 'authenticate', headerClassName: 'col'},
      {Header: '',  accessor: 'action', headerClassName: 'col'}
    ];
    let accessTokenData = [
      {access_token: 'Generate', authenticate: '', action: ''},
      {access_token: 'Revoke', authenticate: '', action: ''},
    ];


    return (
      <div className="app-wrapper">
        <div id="app-sub-header">
          <h2 className="page-title">Data Stream</h2>
        </div>

        {/* Analysis Landing View */}
        <div className="container">
          <div className="odin-view clearfix">

            <div className="api-details-wrapper">
              <div className="row">
                <div className="col-60">
                  <div id="query-parameter" className="section">
                    <div className="section-header">
                      <div className="section-title">Query Parameters</div>
                    </div>
                    <div className="section-content">
                      <DataStreamReactTable 
                        columns={queryParamsColumnsToDisplay}
                        data={queryParamsData} 
                        client={this.client}
                      />
                    </div>
                  </div>
                </div>

                <div className="col-40">
                  <div id="segmentation" className="section">
                    <div className="section-header">
                      <div className="section-title">Segmentation</div>
                    </div>
                    <div className="section-content">
                      {/* <table className="asc-table">
                        <thead>
                          <tr>
                            {segmentationColumnsToDisplay.map((item, i) => {
                              let colWidth = 0;
                              if(item.accessor==='id') colWidth = 52;
                              if(item.accessor==='data_type') colWidth = 102;
                              if(item.accessor==='possible_segmentation') colWidth = 335;
                              return <th width={colWidth > 0 ? colWidth : 'auto'}><span className="bg"></span>{item.Header}</th>
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {segmentationData.map((item, i) => {
                            return (
                              <tr>{
                                segmentationColumnsToDisplay.map((col, j) => {
                                  let colWidth = 0;
                                  if(col.accessor==='id') colWidth = 52;
                                  if(col.accessor==='data_type') colWidth = 102;
                                  if(col.accessor==='possible_segmentation') colWidth = 335;
                                  return <td width={colWidth > 0 ? colWidth : 'auto'}>{item[col.accessor]}</td>
                                })
                              }</tr>
                            )
                          })}
                        </tbody>
                      </table> */}

                      <DataStreamReactTable 
                        columns={segmentationColumnsToDisplay}
                        data={segmentationData} 
                        client={this.client}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>


            <div id="token-wrapper">
              {/* <div className="row">
                <div className="col-40"> */}
                  <div className="api-example">
                    <div className="header">
                      <div className="inner-wrapper">
                        <div className="label">Example API Query URL</div>
                      </div>
                    </div>
                    
                    <div className="details">
                      <div className="input-wrapper">
                        <span dangerouslySetInnerHTML={{ __html: Constants.API_BASE_URL+'?data_type=adserver&start_date=2020-11-01<br />&end_date=2020-11-02&segmentation=property,advertiser' }}></span>
                      </div>
                    </div>
                  </div>
                {/* </div>

                <div className="col-60"> */}
                  <div id="generate-token" className="section">
                    <div className="section-header">
                      <div className="section-title">Access Token</div>
                    </div>

                    <div className="section-content">
                      <DataStreamReactTable 
                        columns={accessTokenColumnsToDisplay}
                        data={accessTokenData} 
                        client={this.client}
                      />
                    </div>
                  </div>
                {/* </div>
              </div> */}
            </div>

          </div>
        </div>
      </div>
    );
  }
}
 
export default DataStream;