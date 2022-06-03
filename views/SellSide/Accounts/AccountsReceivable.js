import React, { Component } from 'react';
import moment from 'moment';
import * as Constants from '../../../components/Constants.js';
import subjectObj from '../../../subjects/Subject1';
import '../../../styles/Accounts.scss';

import AccountsReceivableReactTable from './AccountsReceivableReactTable';
import AccountsReceivableDimensions from './AccountsReceivableDimensions';

//Import Common Functions
import { getKeyByValue, getClients, getUser, exportCSVFile } from '../../../utils/Common';

//Import Services
import APIService from '../../../services/apiService';
import LoaderbyData from '../../../components/LoaderbyData/LoaderbyData.js';
import HideSubHeader from '../../../components/HideSubHeader';


class AccountsReceivable extends Component {
  constructor(props) {
    super(props);
    this.page_title = 'Ad-Seller Receivable';
    this.user = getUser();
    this.controller = new AbortController();

    this.state = {
      inprocess: true,
      error: "",
      client: getKeyByValue(getClients(), this.user.last_fetched_client, 'id'),
      dimensions: [],
      paymentSummaryData: null,
      currentYear: '',
      defaultYear: [],
      payment_status: '',
      last_updated_date: '',
      lastUpdatedDateObj: ''
    };

    this.view_type = 'adseller_receivable';
    this.page_title = 'Ad-Seller Receivable';
    this.dimensions_str = "advertiser";

    this.getPaymentSumamry = this.getPaymentSumamry.bind(this);
    this.handleDimensionsChange = this.handleDimensionsChange.bind(this);
    this.handlePaymentStatusUpdate = this.handlePaymentStatusUpdate.bind(this);
    this.handleDownloadView = this.handleDownloadView.bind(this);
  }

  

  loadScripts() {
    //Get Last Updated Date
    this.getLastUpdatedDate();
  }

  componentDidMount() {
    subjectObj.notify({ page_title: this.page_title });

    this.loadScripts();
  }

  //Reload the page if client id/name change from url
  componentDidUpdate(prev_props) {
    this.user = getUser();
    if (this.user.last_fetched_client !== this.state.client.id || prev_props.match.params.view_type !== this.props.match.params.view_type) {
      this.setState({
        inprocess: false,
        error: "",
        client: getKeyByValue(getClients(), this.user.last_fetched_client, 'id'),
        dimensions: [],
        paymentSummaryData: [],
        currentYear: '',
        defaultYear: [],
        payment_status: '',
        last_updated_date: '',
        lastUpdatedDateObj: ''
      });

      //Get Last Updated Date
      this.loadScripts();
    }
  }

  componentWillUnmount(){
    //Cancel Previous API Requests
    console.log('unmount - cancel previous view running apis');
    APIService.abortAPIRequests(this.controller);
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
          //Set last updated date and last 30days date range under analysis period input box
          let lastupdateddate = JSON.parse(response.data);
          let formattedDate = moment(lastupdateddate[0]['last_updated_date']).utc().format('MMM DD, YYYY');
          let endDate = moment(lastupdateddate[0]['last_updated_date']).utc().toDate();
          let formattedEndDate = moment(endDate.getTime() + endDate.getTimezoneOffset() * 60000).toDate(); //convert to utc time
          let currentYear = moment(formattedEndDate).year();
          let defaultYear = moment(formattedEndDate).subtract(1, 'month').year();

          this.setState({
            last_updated_date: formattedDate,
            lastUpdatedDateObj: formattedEndDate,
            currentYear: currentYear,
            defaultYear: [defaultYear],
          }, () => {
            //Pass LastUpdatedDate to Header Component
            subjectObj.notify({
              last_updated_date: this.state.last_updated_date,
              client: this.state.client,
            });

            this.getPaymentSumamry(); //load payment summary data
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

  getPaymentSummaryFilters() {
    let obj = {
      "client_id": this.state.client.id,
      "year": this.state.defaultYear,
      "advertiser": "",
      "revenue_generate_period": "",
      "payment_received": ""
    };
    return obj;
  }


  //Get Payment Summary
  getPaymentSumamry(paymentSummaryPayload) {
    if (!paymentSummaryPayload) {
      paymentSummaryPayload = this.getPaymentSummaryFilters();
    }
    //Input Validations and Send Fetch Request
    this.setState({ error: '', inprocess: true });

    APIService.apiRequest(Constants.API_BASE_URL + '/getPaymentSummary', paymentSummaryPayload, false, 'POST', this.controller)
      .then(response => {
        if (response.status === 1 && response.data !== undefined) {
          //Remove Loading Icon
          this.setState({ inprocess: false, paymentSummaryData: response.data });
        } else {
          this.setState({ inprocess: false, error: response.msg });
        }
      })
      .catch(err => {
        this.setState({ error: err.msg });
      });
  }


  handleDimensionsChange(arg) {
    if(arg[0]['val'][0]!==''){
      this.setState({defaultYear: arg[0]['val']});
    }

    //Get Payment Summary Payload
    let paymentSummaryPayLoad = {
      ...this.getPaymentSummaryFilters(),
      'year': this.state.defaultYear,
      'advertiser': (arg[2]['val'] !== '') ? arg[2]['val'] : "",
      'revenue_generate_period': (arg[3]['val'] != '') ? arg[3]['val'] : "",
      'payment_received': (arg[4]['val'] != '') ? arg[4]['val'].map((x) => x.id) : "",
    }

    var month_index = arg.findIndex(p => p.id == "month");
    if (month_index > -1) {
      let months = arg[month_index]['val'];
      let monthIds = [];
      if (months.length > 0) {
        months.forEach((item, i) => {
          monthIds.push(item.id);
        });
        paymentSummaryPayLoad['month'] = monthIds;
      }
    }

    // console.log(paymentSummaryPayLoad);
    this.getPaymentSumamry(paymentSummaryPayLoad);
  }

  //Update Payment Status on Checkbox selection
  handlePaymentStatusUpdate(payment_details) {
    const statusPayLoad = {
      "payment_id": payment_details.payment_id,
      "is_checked": payment_details.is_checked
    };

    APIService.apiRequest(Constants.API_BASE_URL + '/updatePaymentSummary', statusPayLoad, false, 'POST', this.controller)
      .then(response => {
        if (response.status === 1) {
          this.setState({ payment_status: response.message });
        } else {
          this.setState({ payment_status: response.message });
        }
      })
      .catch(err => {
        this.setState({ payment_status: err.msg });
      });
  }

  //Handle Report Download
  handleDownloadView(event) {
    event.preventDefault();

    const cols = this.getColumnsToDisplay();
    const colsNameForCSV = cols.map(c => c.Header); // For Showing Column names in CSV
    // Extract the data having only those columns which are to be displayed
    let dataForCSV = [];
    this.state.paymentSummaryData.forEach(dataRow => {
      let rowForCSV = {};
      cols.forEach(col => rowForCSV[col.accessor] = dataRow[col.accessor]);
      dataForCSV.push(rowForCSV);
    });
    const dataWithHeader = [colsNameForCSV, ...dataForCSV]; // Concactinate Header with data
    exportCSVFile(dataWithHeader, 'adseller_receivable_' + Date.now()) //formattedRows, file_name
  }

  //get columns names to display in table header
  getColumnsToDisplay() {
    return [
      { Header: 'Year', accessor: 'year' },
      { Header: 'Month', accessor: 'month' },
      { Header: 'Advertiser', accessor: 'advertiser' },
      { Header: 'Payment Term', accessor: 'payment_term' },
      { Header: 'Payment Expected', accessor: 'payment_expected' },
      { Header: 'Amount', accessor: 'amount' },
      { Header: 'Currency', accessor: 'currency' },
      { Header: 'Is Settled', accessor: 'is_settled' },
      { Header: 'Settled by', accessor: 'settled_by' }
    ];
  }

  
  render() {
    let columnsToDisplay = this.getColumnsToDisplay();

    return (
      <div className="app-wrapper accounts-view">
        <div id="app-sub-header">
          {/* <h2 className="page-title">{this.page_title}</h2> */}

          <div className="filters-wrapper">
            <AccountsReceivableDimensions
              client={this.state.client}
              onDimensionsChanged={this.handleDimensionsChange}
              lastUpdatedDate={this.state.lastUpdatedDateObj}
              currentYear={this.state.currentYear}
              defaultYear={this.state.defaultYear}
            />
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
          <div id="accounts-receivable" className="inner-container">
            <section className="section">
              {this.state.inprocess &&
                <div id="bydata-loader-fixed-wrapper">
                  <LoaderbyData />
                </div>
              }

              {this.state.payment_status !== '' &&
                <div class={'alert ' + (this.state.payment_status === 'Updated' ? 'success' : 'error')}>{this.state.payment_status}</div>
              }

              {!this.state.inprocess && this.state.paymentSummaryData &&
                <AccountsReceivableReactTable
                  onPaymentStatusUpdate={this.handlePaymentStatusUpdate}
                  columns={columnsToDisplay}
                  data={this.state.paymentSummaryData}
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

export default AccountsReceivable;