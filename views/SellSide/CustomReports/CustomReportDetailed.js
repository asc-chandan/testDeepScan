import React, { Component } from 'react';
import moment from 'moment';
import * as Constants from '../../../components/Constants.js';
import subjectObj from '../../../subjects/Subject1';
import Loader from '../../../components/Loader';

import '../../../styles/Global.scss';
import '../../../styles/CustomReports.scss';

import { getKeyByValue, getClients, getUser, orderObjectKey } from '../../../utils/Common'; //Import Common Functions
import APIService from '../../../services/apiService'; //Import Services
import DateRangeSelector from '../../../components/DateRangeSelector/DateRangeSelector';
import CustomReportReactTable from './CustomReportReactTable';
import HideSubHeader from '../../../components/HideSubHeader';


class CustomReportDetailed extends Component {
  constructor(props) {
    super(props);

    //Get Client & View Type
    this.page_title = 'Custom Reports';
    this.user = getUser();
    this.controller = new AbortController();
    this.report_type = props.match.params.report_type;
    this.state = this.getInitVariables();
    this.datePeriodChange = this.datePeriodChange.bind(this);
    this.getDetailedReport = this.getDetailedReport.bind(this);
  }

  getInitVariables(){
    let defaultObj = {
      inprocess: false,
      error: "",
      client: getKeyByValue(getClients(), this.user.last_fetched_client, 'id'),
      last_updated_date_for_datepicker: '',
      selected_date_range: '',
      selectedDateRange: {},
      reportColumns: [],
      reportData: [],
      dateRangeRequired: (this.props.location.state !== undefined && this.props.location.state.dateRangeRequired !== undefined) ? this.props.location.state.dateRangeRequired : false,
      reportTitle: (this.props.location.state !== undefined && this.props.location.state.reportTitle !== undefined) ? this.props.location.state.reportTitle : false,
      reportConfig: (this.props.location.state !== undefined && this.props.location.state.reportConfig !== undefined) ? this.props.location.state.reportConfig : false,
      reportPeriod: (this.props.location.state !== undefined && this.props.location.state.reportPeriod !== undefined) ? this.props.location.state.reportPeriod : false,
    };
    return defaultObj;
  }

  componentDidMount() {
    subjectObj.notify({ page_title: this.page_title + ' - ' +this.state.reportTitle });

    //Get Last Updated Date
    if (this.state.dateRangeRequired && this.state.dateRangeRequired !== '' && this.state.dateRangeRequired !== 'false') {
      this.getLastUpdatedDate();
    } else {
      this.getDetailedReport();
    }
  }

  //Reload the page if client id/name change from url
  componentDidUpdate(prev_props) {
    this.user = getUser();
    if (this.user.last_fetched_client !== this.state.client.id || prev_props.match.params.report_type !== this.props.match.params.report_type) {
      this.report_type = this.props.match.params.report_type;

      //Update State Values
      this.setState(this.getInitVariables());

      //Get Last Updated Date
      if (this.state.dateRangeRequired && this.state.dateRangeRequired !== '' && this.state.dateRangeRequired !== 'false') {
        this.getLastUpdatedDate();
      } else {
        this.getDetailedReport();
      }
    }
  }

  componentWillUnmount(){
    //Cancel Previous API Requests
    console.log('unmount - cancel previous view running apis');
    APIService.abortAPIRequests(this.controller);
  }

  //Get Last Updated Date
  getLastUpdatedDate() {
    if (!this.state.reportConfig) return false;

    const reportConfig = JSON.parse(this.state.reportConfig);
    const datePayLoad = {
      "client_id": this.state.client.id,
      "view_type": reportConfig.view_type
    };

    APIService.apiRequest(Constants.API_BASE_URL + '/getLastUpdatedDates', datePayLoad, false, 'POST', this.controller)
      .then(response => {
        if (response.status === 1 && response.data !== undefined) {
          let lastupdateddate = JSON.parse(response.data);
          let defaultCount = 14; //6;
          let defaultFormat = 'days';

          //for saved views
          if (this.state.dateRangeRequired) {
            let selected_date_range = reportConfig.dynamic_time_period;
            if (selected_date_range && selected_date_range !== '') {
              if (selected_date_range === 'Last 7 Days') { defaultCount = 6; }
              if (selected_date_range === 'Last 15 Days') { defaultCount = 14; }
              if (selected_date_range === 'Last 30 Days') { defaultCount = 29; }
              if (selected_date_range === 'Last Month') {
                defaultCount = 1;
                defaultFormat = 'months';
              }
              if (selected_date_range === 'This Month') {
                defaultFormat = 'this_month';
              }
            }
          }

          //Set last updated date and last 30days date range under analysis period input box
          let formattedDate = moment(lastupdateddate[0]['last_updated_date']).utc().format('MMM DD, YYYY');
          let endDate = moment(lastupdateddate[0]['last_updated_date']).utc().toDate();
          let formattedEndDate = moment(endDate.getTime() + endDate.getTimezoneOffset() * 60000).toDate(); //convert to utc time
          let formattedStartDate = moment(formattedEndDate).subtract(defaultCount, defaultFormat).toDate();

          if (defaultFormat === 'months') { //for saved views
            formattedStartDate = moment(formattedEndDate).subtract(defaultCount, defaultFormat).startOf('month').toDate();
            formattedEndDate = moment(formattedEndDate).subtract(defaultCount, defaultFormat).endOf('month').toDate();
          }

          if (defaultFormat === 'this_month') {
            formattedStartDate = moment(formattedEndDate).startOf('month').toDate();
            formattedEndDate = formattedEndDate;
          }

          // let formattedStartDate = moment(formattedEndDate).subtract(defaultCount, defaultFormat).toDate();
          let formattedDateRange = { startDate: formattedStartDate, endDate: formattedEndDate };
          this.setState({
            last_updated_date: formattedDate,
            last_updated_date_for_datepicker: endDate,
            selectedDateRange: formattedDateRange,
            inprocess: false
          });

          //Pass LastUpdatedDate to Header Component
          subjectObj.notify({
            last_updated_date: this.state.last_updated_date,
            client: this.state.client
          });

          //Call Date Period Change
          this.datePeriodChange(this.state.selectedDateRange);
        } else {
          this.setState({ inprocess: false, error: response.msg });
        }
      })
      .catch(err => {
        this.setState({ error: err.msg });
      });
  }

  //On Date Period Change
  datePeriodChange(date_range) {
    var start_date = this.formatDate(date_range['startDate'], 'MM/DD/YYYY');
    var end_date = this.formatDate(date_range['endDate'], 'MM/DD/YYYY');
    var formatted_date_range = start_date + ' - ' + end_date;


    //Input Validations and Send Fetch Request
    this.setState({
      selected_date_range: formatted_date_range,
      selectedDateRange: date_range,
    });

    //Get Start Analysis
    this.getDetailedReport(formatted_date_range);
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

  getDetailedReport(date_range = null) {
    //Input Validations
    this.setState({ error: '', inprocess: true });

    let apiPayload = {
      id: this.report_type
    }

    //Check report requires additional inouts
    if (this.state.dateRangeRequired && this.state.dateRangeRequired === '[date_range]' && date_range) {
      apiPayload['date_range'] = date_range; //need to make dynamic
    }

    APIService.apiRequest(Constants.API_BASE_URL + '/getCustomReportData', apiPayload, false, 'POST', this.controller)
      .then(response => {
        if (response.status === 1 && response.data !== undefined) {
          // NOTE :  TEMP HACK, IN CASE OF SOURCE=DATAGRID, response.data comes in stringified form, otherwise not
          // Remove this hack later, when data for DATAGRID also is unstringified
          const isSourceDataGrid = response.level !== null && response.level !== undefined;
          this.setState({
            inprocess: false,
            reportColumns: response.columns,
            reportData: isSourceDataGrid ? JSON.parse(response.data) : response.data
          });
        } else {
          this.setState({ inprocess: false, error: response.msg });
        }

        subjectObj.notify({
          last_updated_date: 'NA',
          client: this.state.client
        });
      })
      .catch(err => {
        this.setState({ inprocess: false, error: err.msg });
      });
  }


  render() {
    //Generate Columns to Display
    let columnsToDisplay = [];
    if (this.state.reportColumns) {
      this.state.reportColumns.forEach((item) => {
        columnsToDisplay.push({ Header: item, accessor: item });
      });
    }

    let reportData = [];
    if (this.state.reportColumns) {
      this.state.reportData.map((item, i) => {
        let obj = orderObjectKey(item, this.state.reportColumns);
        reportData.push(obj)
      });
    }

    return (
      <div className="app-wrapper custom-report">
        <div id="app-sub-header">
          {/* <h2 className="page-title">Custom Report - {this.state.reportTitle}</h2> */}

          {/* Display Date Period Selection */}
          {(this.state.dateRangeRequired && this.state.dateRangeRequired !== '' && this.state.dateRangeRequired !== 'false') &&
            <div className="date-period-wrapper">
              <DateRangeSelector
                dateRange={this.state.selectedDateRange}
                lastUpdatedDate={this.state.last_updated_date_for_datepicker}
                onSelect={this.datePeriodChange}
                client={this.state.client} />
            </div>
          }

          {/* <HideSubHeader />*/}
        </div>


        {/* Analysis Landing View */}
        <div className="container">
          <div id="data-grids" className="inner-container">
            {/* <section className={'section '+(this.state.inprocess ? 'show-loading': '')}> */}
            <section className="section">
              {this.state.inprocess && <Loader />}

              {reportData.length > 0 &&
                <CustomReportReactTable
                  columns={columnsToDisplay}
                  data={reportData}
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

export default CustomReportDetailed;