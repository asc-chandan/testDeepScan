import React, { Component } from 'react';
import * as Constants from '../../../components/Constants.js';
import subjectObj from '../../../subjects/Subject1';

import '../../../styles/CustomReports.scss';

import { getKeyByValue, getClients, getUser } from '../../../utils/Common'; //Import Common Functions
import APIService from '../../../services/apiService'; //Import Services
import CustomReportReactTable from './CustomReportReactTable';
import LoaderbyData from '../../../components/LoaderbyData/LoaderbyData.js';


class CustomReports extends Component {
  constructor(props) {
    super(props);

    //Get Client & View Type
    this.page_title = 'Custom Reports';
    this.user = getUser();
    this.controller = new AbortController();
    this.view_type = props.match.params.view_type;

    this.state = {
      inprocess: true,
      error: "",
      client: getKeyByValue(getClients(), this.user.last_fetched_client, 'id'),
      reportsList: []
    }

    this.getReportLists = this.getReportLists.bind(this);
  }

  componentDidMount() {
    subjectObj.notify({ page_title: this.page_title });

    this.getReportLists();
  }

  //Reload the page if client id/name change from url
  componentDidUpdate(prev_props) {
    this.user = getUser();
    if (this.user.last_fetched_client !== this.state.client.id || prev_props.match.params.view_type !== this.props.match.params.view_type) {
      this.view_type = this.props.match.params.view_type;

      //Update State Values
      this.setState({
        inprocess: false,
        error: "",
        client: getKeyByValue(getClients(), this.user.last_fetched_client, 'id'),
        reportsList: []
      });
    }
  }

  componentWillUnmount(){
    //Cancel Previous API Requests
    console.log('unmount - cancel previous view running apis');
    APIService.abortAPIRequests(this.controller);
  }

  getReportLists(e) {
    //Input Validations
    this.setState({ error: '', inprocess: true });

    let apiPayload = {
      client_id: this.state.client.id
    }

    APIService.apiRequest(Constants.API_BASE_URL + '/getCustomReports', apiPayload, false, 'POST', this.controller)
      .then(response => {
        if (response.status === 1 && response.data !== undefined) {
          let customReportsList = {
            data_source: "custom",
            custom_url: 'yield_dashboard',
            description: "Yield Dashboard",
            id: 1,
            inputs_required: "",
            is_all_organization: 1,
            is_default: 0,
            is_organization_specific: 0,
            is_user_specific: 0,
            name: "Yield Dashboard",
            organization_id: 1
          };
          let finalReportsList = response.data;
          finalReportsList.unshift(customReportsList);

          this.setState({ inprocess: false, reportsList: finalReportsList });
        } else {
          this.setState({ inprocess: false, error: response.msg });
        }

        subjectObj.notify({
          last_updated_date: 'NA',
          client: this.state.client
        });
      })
      .catch(err => {
        this.setState({ error: err.msg });
      });
  }


  render() {
    let columnsToDisplay = [
      { Header: 'Report Name', accessor: 'name' },
      { Header: 'Report Description', accessor: 'description' },
      { Header: 'Data Source', accessor: 'data_source' },
      { Header: 'Action', accessor: 'action' }
    ];

    return (
      <div className="app-wrapper custom-report">
        <div id="app-sub-header">
          {/* <h2 className="page-title">Custom Reports</h2> */}
        </div>

        {/* Analysis Landing View */}
        <div className="container">
          <div id="custom-reports" className="inner-container">
            <div id="analysis-wrapper" className="section">
              {this.state.inprocess &&
                <div id="bydata-loader-fixed-wrapper">
                  <LoaderbyData />
                </div>
              }
              {!this.state.inprocess &&
                <div id="analysis-section" className="analysis-home">
                  <CustomReportReactTable
                    columns={columnsToDisplay}
                    data={this.state.reportsList}
                    client={this.state.client}
                    history={this.props.history}
                    detailed_url='custom_report'
                  />
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default CustomReports;