import React, { Component } from 'react';
import moment from 'moment';
import ReactTable from '../../../components/table/ReactTable';
import * as Constants from '../../../components/Constants.js';
import subjectObj from '../../../subjects/Subject1';

import '../../../styles/Global.scss';
import '../../../styles/Accounts.scss';

import { isDateGreater } from '../../../components/ReactCalendar/components/utils';
import RangePicker from '../../../components/ReactCalendar/RangePicker';
import SpeedSelect from '../../../components/SpeedSelect/SpeedSelect';

//Import Common Functions
import { getKeyByValue, getClients, getUser, exportCSVFile } from '../../../utils/Common';

//Import Services
import APIService from '../../../services/apiService';
import LoaderbyData from '../../../components/LoaderbyData/LoaderbyData';


class AccountsPayable extends Component {
  constructor(props) {
    super(props);

    this.page_title = 'Ad-Buyer Payable';
    this.user = getUser();
    this.controller = new AbortController();

    this.state = this.getInitVariables();
    this.view_type = 'adbuyer_payable';
    this.page_title = 'Ad-Buyer Payable';
    this.dimensions_str = "property";
    this.allDimensions = {};

    this.fetchDimensions = this.fetchDimensions.bind(this);
    this.getAccountsPayable = this.getAccountsPayable.bind(this);
    this.analysisPeriodChange = this.analysisPeriodChange.bind(this);
    this.onOptionSelect = this.onOptionSelect.bind(this);
    this.handlePropertyFilterChange = this.handlePropertyFilterChange.bind(this);

    this.handleDownloadView = this.handleDownloadView.bind(this);
  }

  getInitVariables(){
    let defaultObj = {
      inprocess: false,
      error: "",
      client: getKeyByValue(getClients(), this.user.last_fetched_client, 'id'),
      accountsPayableData: [],
      last_updated_date: '',
      lastUpdatedDateObj: '',
      selectedDateRange: [],
      group_by: 'date',
      propertyFilters: []
    }
    return defaultObj;
  }

  //Reload the page if client id/name change from url
  //Reload the page if client id/name change from url
  componentDidUpdate(prev_props) {
    this.user = getUser();
    if (this.user.last_fetched_client !== this.state.client.id || prev_props.match.params.view_type !== this.props.match.params.view_type) {
      this.setState(this.getInitVariables());

      //Get Last Updated Date
      this.loadScripts();
    }
  }

  loadScripts() {
    //Get Last Updated Date
    this.getLastUpdatedDate();
    this.fetchDimensions();
  }

  componentDidMount() {
    subjectObj.notify({ page_title: this.page_title });
    this.loadScripts();
  }

  componentWillUnmount(){
    //Cancel Previous API Requests
    console.log('unmount - cancel previous view running apis');
    APIService.abortAPIRequests(this.controller);
  }

  fetchDimensions() {
    const dimensionPayLoad = {
      "client_id": this.state.client.id,
      // "view_type": this.view_type,
      "view_type": 'advertiser',
      "dimension": this.dimensions_str,
      "dimension_filter": ""
    };

    APIService.apiRequest(Constants.API_BASE_URL + '/getAllDimensions', dimensionPayLoad, false, 'POST', this.controller)
      .then(response => {
        if (response.status === 1 && response.data !== undefined) {

          let dimensions = JSON.parse(response.data);

          let allDimensions = {};
          Object.keys(dimensions).forEach(function (key) {
            let options = JSON.parse(dimensions[key]);
            allDimensions[key] = options;
          });
          this.allDimensions = allDimensions;
          this.setState({ propertyFilters: [] });
        } else {
          this.setState({ error: response.msg });
        }
      })
      .catch(err => {
        this.setState({ error: err.msg });
      });
  }


  //Get Last Updated Date
  getLastUpdatedDate() {
    //Input Validations
    this.setState({ error: '', inprocess: true });

    const datePayLoad = {
      "client_id": this.state.client.id,
      "view_type": this.view_type
    };
    APIService.apiRequest(Constants.API_BASE_URL + '/getLastUpdatedDates', datePayLoad, false, 'POST', this.controller)
      .then(response => {
        if (response.status === 1 && response.data !== undefined) {
          let lastupdateddate = JSON.parse(response.data);
          let formattedDate = moment(lastupdateddate[0]['last_updated_date']).utc().format('MMM DD, YYYY');
          let endDate = moment(lastupdateddate[0]['last_updated_date']).utc().toDate();
          let formattedEndDate = moment(endDate.getTime() + endDate.getTimezoneOffset() * 60000).toDate(); //convert to utc time
          let formattedStartDate = moment(formattedEndDate).subtract((29), 'days').toDate();
          let formattedDateRange = [formattedStartDate, formattedEndDate];

          this.setState({
            last_updated_date: formattedDate,
            lastUpdatedDateObj: formattedEndDate,
            selectedDateRange: formattedDateRange
          }, () => {
            //Pass LastUpdatedDate to Header Component
            subjectObj.notify({
              last_updated_date: this.state.last_updated_date,
              client: this.state.client,
            });

            //Load Chart Data
            this.analysisPeriodChange(this.state.selectedDateRange);
          });

        } else {
          this.setState({ inprocess: false, error: response.msg });
        }
      })
      .catch(err => {
        this.setState({ error: err.msg });
      });
  }


  //Format Date
  formatDate(date, date_format) {
    return moment(date).format(date_format);
  }

  //Get Date Range - pass end_date, days_count, date_format, and seperator
  getDateRange(end_date, days_count, date_format, seperator) {
    var start_date = moment(end_date).subtract((days_count - 1), 'days').format(date_format);
    return (start_date + seperator + end_date);
  }


  //On Analysis Period Change
  analysisPeriodChange(date_range) {
    // var start_date = this.formatDate(date_range[0], 'MM/DD/YYYY');
    // var end_date = this.formatDate(date_range[1], 'MM/DD/YYYY');
    // var formatted_date_range = start_date+' - '+end_date;

    //Input Validations and Send Fetch Request
    this.setState({
      selectedDateRange: date_range,
    }, () => {
      this.getAccountsPayable(); //date_range, load charts Data
    });
  }

  getAccountsPayableFilters() {
    var start_date = this.formatDate(this.state.selectedDateRange[0], 'MM/DD/YYYY');
    var end_date = this.formatDate(this.state.selectedDateRange[1], 'MM/DD/YYYY');
    var formatted_date_range = start_date + ' - ' + end_date;

    let obj = {
      "client_id": this.state.client.id,
      "daterange": formatted_date_range,
      "groupby": this.state.group_by
    };
    if (this.state.propertyFilters.length > 0) {
      obj["dimensions"] = { property: this.state.propertyFilters }
    }
    return obj;
  }


  //Get Payment Summary
  getAccountsPayable() {

    const paymentSummaryPayload = this.getAccountsPayableFilters();
    //Input Validations and Send Fetch Request
    this.setState({ error: '', inprocess: true });

    APIService.apiRequest(Constants.API_BASE_URL + '/getPayables', paymentSummaryPayload, false, 'POST', this.controller)
      .then(response => {
        if (response.status === 1 && response.data !== undefined) {
          //Remove Loading Icon
          this.setState({
            inprocess: false,
            accountsPayableData: response.data || []
          });
        }
      })
      .catch(err => {
        this.setState({ error: err.msg });
      });
  }

  //On Select Change
  onOptionSelect(event) {
    this.setState({ group_by: event.target.checked ? 'month' : 'date' });

    setTimeout(() => {
      this.getAccountsPayable(); //date_range, load charts Data
    }, 0);
  }

  //Handle Report Download
  handleDownloadView(event) {
    event.preventDefault();

    const cols = this.getColumnsToDisplay(this.state.group_by);
    const colsNameForCSV = cols.map(c => c.Header); // For Showing Column names in CSV
    // Extract the data having only those columns which are to be displayed
    let dataForCSV = [];
    this.state.accountsPayableData.forEach(dataRow => {
      let rowForCSV = {};
      cols.forEach(col => rowForCSV[col.accessor] = dataRow[col.accessor]);
      dataForCSV.push(rowForCSV);
    });
    const dataWithHeader = [colsNameForCSV, ...dataForCSV]; // Concactinate Header with data
    exportCSVFile(dataWithHeader, 'ad_buyer_payable_' + Date.now()) //formattedRows, file_name
  }

  //Handle Site Filter change
  handlePropertyFilterChange(selections) {

    this.setState({ propertyFilters: selections });
    setTimeout(() => {
      this.getAccountsPayable(); //date_range, load charts Data
    }, 0);
  }


  getColumnsToDisplay(firstColName) {
    return [
      firstColName === 'month' ? { Header: 'Month', accessor: 'month' } : { Header: 'Date', accessor: 'date' },
      { Header: 'Site', accessor: 'site' },
      { Header: 'Revenue', accessor: 'revenue' },
      { Header: 'Rev Share L1', accessor: 'rev_share_l1' },
      { Header: 'Revenue L1', accessor: 'revenue_l1' },
      { Header: 'Remainder L1', accessor: 'remainder_l1' },
      { Header: 'Rev Share L2', accessor: 'rev_share_l2' },
      { Header: 'Revenue L2', accessor: 'revenue_l2' },
      { Header: 'Publisher Revenue', accessor: 'publisher_revenue' },
      { Header: 'Impressions', accessor: 'impressions' },
      { Header: 'Page Views', accessor: 'page_views' },
      { Header: 'Sessions', accessor: 'sessions' },
      { Header: 'Users', accessor: 'users' },
      { Header: 'RPM', accessor: 'RPM' },
      { Header: 'Session/Users', accessor: 'session/users' },
      { Header: 'PV/Session', accessor: 'pv/session' },
      { Header: 'Bounce Rate', accessor: 'bounce_rate' },
      { Header: 'Avg Session Duration', accessor: 'avg_session_duration' }
    ];
  }


  render() {
    const columnsToDisplay = this.getColumnsToDisplay(this.state.group_by);

    return (
      <div className="app-wrapper accounts-view">
        <div id="app-sub-header">
          {/* <h2 className="page-title">{this.page_title}</h2> */}

          <div className="filters-wrapper">
            <div className="col analysis-period">
              <RangePicker picker="date"
                range={this.state.selectedDateRange}
                dateForLastDaysCalculation={this.state.lastUpdatedDateObj}
                onChange={this.analysisPeriodChange}
                disableFn={(dObj) => isDateGreater(dObj, this.state.lastUpdatedDateObj)}
                allowClear={false}
                showOkCancelBtns={true}
              />
            </div>

            {this.allDimensions.property && this.allDimensions.property.length &&
              <div className="col filter-property">
                <SpeedSelect
                  options={this.allDimensions.property}
                  selectedOption={this.state.propertyFilters}
                  onSelect={this.handlePropertyFilterChange}
                  multiple
                  selectLabel='Site'
                  maxHeight='120'
                />
              </div>
            }

            <div className="col month">
              <div id="group-by-wrapper" className="form-group">
                <div className="switch-toggle small">
                  <div className="switch">
                    <input type="checkbox" id="group-by" onChange={this.onOptionSelect} />
                    <label htmlFor="group-by">Toggle</label>
                  </div>
                  <div className="label">Group by Month</div>
                </div>
              </div>
            </div>
          </div>

          {/* Display Action Buttons */}
          <div className="action-button-wrapper">
            <div className="download-data-wrapper">
              <button className="btn-with-icon btn-download" onClick={this.handleDownloadView} title="Download View">Download</button>
            </div>
          </div>

          {/* <HideSubHeader />*/}
        </div>

        <div className="container">
          <div id="accounts-payable" className="inner-container">
            <section className="section">
              {this.state.inprocess &&
                <div id="bydata-loader-fixed-wrapper">
                  <LoaderbyData />
                </div>
              }
              {!this.state.inprocess &&
                <ReactTable
                  columns={columnsToDisplay}
                  data={this.state.accountsPayableData}
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

export default AccountsPayable;