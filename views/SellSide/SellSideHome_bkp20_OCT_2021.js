import React, { Component } from 'react';
import moment from 'moment';
import * as d3 from 'd3';
import * as Constants from '../../components/Constants.js';

import '../../styles/Dashboard.scss';
import { getClients, getUser, getKeyByValue, formatDate, drawLineChart,
         parseChartData, numberWithCommas, parseChartDate } from '../../utils/Common'; //Import Common Functions
import APIService from '../../services/apiService'; //Import Services

import subjectObj from '../../subjects/Subject1';
import SpeedSelect from '../../components/SpeedSelect/SpeedSelect';

import { isDateGreater } from '../../components/ReactCalendar/components/utils';
import RangePicker from '../../components/ReactCalendar/RangePicker';
import HideSubHeader from '../../components/HideSubHeader';

class SellSideHome extends Component {
  constructor(props) {
    super(props);

    //Get Client & View Type & User
    this.page_title = 'Terminal';
    this.user = getUser();
    this.view_type = 'advertiser';
    this.controller = new AbortController();

    this.chartsWrapper = {
      revenue: {chart: React.createRef(), tooltip: React.createRef()},
      impressions: {chart: React.createRef(), tooltip: React.createRef()},
      cpm: {chart: React.createRef(), tooltip: React.createRef()},
      page_views: {chart: React.createRef(), tooltip: React.createRef()},
      sessions: {chart: React.createRef(), tooltip: React.createRef()},
      users: {chart: React.createRef(), tooltip: React.createRef()},
      rpm: {chart: React.createRef(), tooltip: React.createRef()},
      rpmu: {chart: React.createRef(), tooltip: React.createRef()},
      rpms: {chart: React.createRef(), tooltip: React.createRef()}
    }

    this.state = this.getInitVariables();

    //events
    this.getDashboard = this.getDashboard.bind(this);
    this.handleDatePeriodChange = this.handleDatePeriodChange.bind(this);
    this.skeletonLoading = this.skeletonLoading.bind(this);
    this.getklayMediaTargetReport = this.getklayMediaTargetReport.bind(this);
  }

  //Get inital variables
  getInitVariables(){
    const client_id = this.user.last_fetched_client;

    return {
      inprocess: false, 
      error: '',
      message: '',
      lastUpdatedDate: '',
      lastUpdatedDateObj: '',
      selectedDateRange: '',
      dimensions: {},
      selectedDimensions: {},
      dashboardsData: {},
      client: (client_id !== '' ? getKeyByValue(getClients(), client_id, 'id') : ''),
      terminal_type: this.user.terminal_type.id,
      klayMediaChartsWrapper: {},
      klayMediaChartsData: {},
      klayMediaTargetReport: {},
      klayMediaRunRateReport: {}
    };
  }


  handleLoadScripts(){
    //Get Last Updated Date
    this.getLastUpdatedDate();

    if(this.state.terminal_type!=='klay_media'){
      //Get Dimensions of View Type
      this.getAllDimensions();
    }
  }
  
  componentDidMount(){
    subjectObj.notify({
      page_title: this.page_title
    });

    this.handleLoadScripts();
  }

  //Reload the page if client id/name change from url
  componentDidUpdate(prev_props, prevState){
    this.user = getUser();
    
    if((this.user.terminal_type.id!==this.state.terminal_type) || 
      (this.user.terminal_type.id==='sellside' && this.state.client!=='' && this.user.last_fetched_client!==this.state.client.id)){
      //Cancel Previous API Requests
      console.log('cancel previous view running apis');
      APIService.abortAPIRequests(this.controller);

      setTimeout(() => {
        this.view_type = 'advertiser';
        this.controller = new AbortController();
        this.setState(this.getInitVariables(), ()=>this.handleLoadScripts());
      }, 10);
    }
  }

  componentWillUnmount(){
    //Cancel Previous API Requests
    console.log('unmount - cancel previous view running apis');
    APIService.abortAPIRequests(this.controller);
  }

  //Get Last Updated Date
  getLastUpdatedDate(){
    //Input Validations
    this.setState({ error: '', inprocess: true});
    
    let api_url = '/getLastUpdatedDates';
    let req_method = 'POST';
    let apiPayLoad = null;

    if (this.state.terminal_type === 'klay_media') {
      api_url = `/klay_media/last_updated_date/impact`;
      apiPayLoad = null;
      req_method = 'GET';
    } else {
      apiPayLoad = { "client_id": this.state.client.id, "view_type": this.view_type };
    }

    APIService.apiRequest(Constants.API_BASE_URL + api_url, apiPayLoad, false, req_method, this.controller)
      .then(response => {
        if(response.status===1 && response.data!==undefined){
          let lastupdateddate = JSON.parse(response.data);
          let defaultCount = 6;
          let defaultFormat = 'days';
          
          if(!lastupdateddate[0]['last_updated_date']) return false;

          //Set last updated date and last 30days date range under analysis period input box
          let formattedDate = moment(lastupdateddate[0]['last_updated_date']).utc().format('MMM DD, YYYY');
          let endDate = moment(lastupdateddate[0]['last_updated_date']).utc().toDate();
          let formattedEndDate = moment(endDate.getTime() + endDate.getTimezoneOffset() * 60000).toDate(); //convert to utc time
          let formattedStartDate = moment(formattedEndDate).subtract(defaultCount, defaultFormat).toDate();
          let formattedDateRange = [formattedStartDate, formattedEndDate];

          this.setState({
            lastUpdatedDate: formattedDate,
            lastUpdatedDateObj: formattedEndDate,
            selectedDateRange: formattedDateRange,
            inprocess: false
          }, ()=>{
            subjectObj.notify({
              last_updated_date: this.state.lastUpdatedDate,
              client: this.state.client
            });
  
            //Load Chart Data
            if(this.state.terminal_type==='klay_media'){
              this.getklayMediaTargetReport(this.state.selectedDateRange);
            } else {
              this.getDashboard(this.state.selectedDateRange);
            }
          });
          
        } else {
          this.setState({inprocess: false, error: response.msg});
        }
      })
      .catch(err => {
        this.setState({inprocess: false, error: err.msg });
      });
  }

  //Get Dimension using API
  getAllDimensions(evt) {
    //Input Validations and Send Fetch Request
    //For Site Specific Access - Fetch tha perticular dimensions only
    let dimension_filters = "";
    if(this.user.parent_organization_id > 1 ){
      let filters = [];
      if(Array.isArray(this.user.attributes)){
        this.user.attributes.forEach((item) => {
          filters.push(item.site_name);
        });
      }
      dimension_filters = {"property": filters};
    }

    const dimensionPayLoad = {
      "client_id": this.state.client.id,
      "view_type": "advertiser",
      "dimension": "property",
      "dimension_filter": dimension_filters,
    };

    APIService.apiRequest(Constants.API_BASE_URL+'/getAllDimensions', dimensionPayLoad, false, 'POST', this.controller)
      .then(response => {
        if(response.status===1 && response.data!==undefined){
          let dimensions = JSON.parse(response.data);
          let allDimensions = [];
          Object.keys(dimensions).forEach(function(key) {
            let options = JSON.parse(dimensions[key]);
            allDimensions[key] = options;
          });
          this.setState({ dimensions: allDimensions });
        } else {
          this.setState({inprocess: false, error: response.msg });
        }
      })
      .catch(err => {
        this.setState({inprocess: false, error: err.msg });
      });
  }

  //Handle Date Period Change
  handleDatePeriodChange(date_range){
    //Input Validations and Send Fetch Request
    this.setState({
      selectedDateRange: date_range,
    }, ()=> {
      if(this.state.terminal_type==='klay_media'){
        this.getklayMediaTargetReport(this.state.selectedDateRange);
      } else {
        this.getDashboard(this.state.selectedDateRange);
      }
    });
  }

  //Get Dashboard
  getDashboard(date_range){
    var start_date = formatDate(date_range[0], 'MM/DD/YYYY');
    var end_date = formatDate(date_range[1], 'MM/DD/YYYY');
    var formatted_date_range = start_date+' - '+end_date;
    let metrics = "revenue,impressions,cpm,page_views,sessions,users,rpm,rpms,rpmu";
    
    //Input Validations and Send Fetch Request
    this.setState({
      error: '',
      inprocess: true
    });

    let apiPayload = {
      "data_source": "advertiser",
      "client_id": this.state.client.id,
      "daterange": formatted_date_range, 
      "dimensions": "",
      "metrics": metrics
    };
    if(Object.keys(this.state.selectedDimensions).length > 0 && this.state.selectedDimensions.property.length > 0){
      apiPayload['dimensions'] = this.state.selectedDimensions;
    }

    let API_URL = Constants.API_BASE_URL+'/getDashboard';
    
    //Input Validations and Send Fetch Request
    APIService.apiRequest(API_URL, apiPayload, false, 'POST', this.controller)
      .then(response => {
        if(response.status===1 && response.data!==undefined){
          d3.selectAll('.widget .chart').selectAll("*").remove();

          let data = response.data;
          let metrics_list = metrics.split(",");
          if(response.data===undefined || response.data.length === 0){
            metrics_list.forEach((item) => {
              data.push({data: [], key:item, net_details: null, period_comparison_change: null, period_comparison_net_details: null, prev_date_range: null});
            });
          }

          this.setState({ 
            dashboardsData: data 
          }, ()=>{
            this.setState({ inprocess: false });
            
            //Parse Chart Data & draw line chart
            this.state.dashboardsData.forEach((item, i) => {
              var chart_name = item.key;
              var colx = 'date';
              var coly = item.key;

              if(item.data.length > 0){
                var parsedData = parseChartData({
                  'data': item.data, 
                  'segmentation': '',
                  'colx': colx,
                  'coly': coly
                });

                setTimeout(() => {
                  drawLineChart(
                    this.chartsWrapper[chart_name]['chart'], 
                    this.chartsWrapper[chart_name]['tooltip'], 
                    parsedData, 
                    chart_name
                  );
                },0);
                

              } else {
                let minDate = parseChartDate(this.state.selectedDateRange['startDate']);
                let maxDate = parseChartDate(this.state.selectedDateRange['endDate']);

                //Draw Empty Chart
                setTimeout(() => {
                  drawLineChart(
                    this.chartsWrapper[chart_name]['chart'], 
                    this.chartsWrapper[chart_name]['tooltip'], 
                    [], 
                    chart_name,
                    true,
                    [minDate, maxDate]
                  );
                },0);
              }
            });
          });

        } else {
          this.setState({inprocess: false });
        }
      })
      .catch(err => {
        this.setState({ inprocess: false, error: err.msg });
      });
  }


  //Get the klay media summary report
  getklayMediaTargetReport(date_range){
    var start_date = formatDate(date_range[0], 'MM/DD/YYYY');
    var end_date = formatDate(date_range[1], 'MM/DD/YYYY');
    var formatted_date_range = start_date+' - '+end_date;

    //Input Validations and Send Fetch Request
    this.setState({error: '', inprocess: true});

    let apiPayload = {"daterange": formatted_date_range};
    let API_URL = Constants.API_BASE_URL+'/klay_media/get_dashboard/';
    
    //Input Validations and Send Fetch Request
    APIService.apiRequest(API_URL, apiPayload, false, 'POST', this.controller)
      .then(response => {
        if(response.status===1 && response.data!==undefined){
          // d3.selectAll('.widget .chart').selectAll("*").remove();
          // revenue: {chart: React.createRef(), tooltip: React.createRef()},
          let newKlayMediaChartsWrapper = {};
          response.graph_data.forEach((item, i) => {
            let unique_key = item.display_name.replace(/ /g, '_').toLowerCase();
            newKlayMediaChartsWrapper[unique_key] = {chart: React.createRef(), tooltip: React.createRef()}
          });

          this.setState({ 
            inprocess: false,
            klayMediaTargetReport: response.data,
            klayMediaChartsWrapper: newKlayMediaChartsWrapper,
            klayMediaChartsData: response.graph_data,
            klayMediaRunRateReport: response.run_rate_data
          }, ()=>{
            this.state.klayMediaChartsData.forEach((item, i) => {
              var chart_name = item.key;
              var colx = 'date';
              var coly = item.key;
              let unique_key = item.display_name.replace(/ /g, '_').toLowerCase();

              if(item.data.length > 0){
                var parsedData = parseChartData({
                  'data': item.data, 
                  'segmentation': '',
                  'colx': colx,
                  'coly': coly
                });

                setTimeout(() => {
                  drawLineChart(
                    this.state.klayMediaChartsWrapper[unique_key]['chart'], 
                    this.state.klayMediaChartsWrapper[unique_key]['tooltip'], 
                    parsedData, 
                    chart_name
                  );
                },0);
              }
            });
          });
        } else {
          this.setState({inprocess: false });
        }
      })
      .catch(err => {
        this.setState({ inprocess: false, error: err.msg });
      });
  }


  //On Select Change
  onOptionSelect(event, id){
    this.setState({
      selectedDimensions: {
        ...this.state.selectedDimensions,
        [id]: event
      }
    });

    setTimeout(() => {
      this.getDashboard(this.state.selectedDateRange);
    },0);
  }


  skeletonLoading(){
    return (
      <div className="widgets-wrapper skeleton-wrapper">
        {
          Object.keys(this.chartsWrapper).map((item,i) => {
            return (
              <div key={'widget-'+i} className="widget skeleton">
                <div className="widget-header">
                  <div className="title-wrapper"><div className="title"></div></div>
                  <div className="total-wrapper"></div>
                </div>
                <div className="chart"></div>
              </div>
            )
          })
        }
      </div>
    );
  }

  

  render(){
    const amountCols = ['revenue', 'cpm', 'rpm', 'rpms', 'rpmu'];
    const SkeletonLoading = (this.skeletonLoading) ? this.skeletonLoading : '';

    return (
      <div className="app-wrapper sellside-home">
        <div id="app-sub-header">
          {/* <h2 className="page-title">Terminal</h2> */}

          <div className="date-period-wrapper">
            {this.state.client && 
              <RangePicker picker="date"
              range={this.state.selectedDateRange}
              dateForLastDaysCalculation={this.state.lastUpdatedDateObj}
              onChange={this.handleDatePeriodChange}
              disableFn={(dObj) => isDateGreater(dObj, this.state.lastUpdatedDateObj)}
              allowClear={false}
              showOkCancelBtns={true}
            />
            }
          </div>

          <div className="filters-wrapper">
            {this.state.dimensions['property']!==undefined && 
              <div className="form-group">
                <SpeedSelect
                  options={this.state.dimensions['property']}
                  selectedOption={(this.state.selectedDimensions['property']) ? this.state.selectedDimensions['property'] : []}
                  onSelect={(e) => this.onOptionSelect(e, 'property')}
                  multiple
                  displayKey='value'
                  uniqueKey='property'
                  selectLabel='Property'
                  maxHeight='162'
                />
              </div>
            }
          </div>
        
          {/* <HideSubHeader /> */}
        </div>

        <div className="container">
          <div className="summary-reports-wrapper">
            {/* Target Report */}
            {(!this.state.inprocess && Object.keys(this.state.klayMediaTargetReport).length > 0) &&
              <SummaryReport data={this.state.klayMediaTargetReport} title="Target Report" />
            }

            {/* Monthly Run Rate Report */}
            {(!this.state.inprocess && Object.keys(this.state.klayMediaRunRateReport).length > 0) &&
              <SummaryReport data={this.state.klayMediaRunRateReport} title="Monthly Run Rate Report" />
            }
          </div>

          {/* Line Charts Wrapper */}
          <div className="widgets-wrapper">
            {this.state.inprocess && <SkeletonLoading />}
            
            {(!this.state.inprocess && this.state.dashboardsData.length > 0) &&
              this.state.dashboardsData.map((item, i) => {
                let symbol = '';
                let symbol_name = '';
                if(amountCols.includes(item.key)){
                  symbol = '$';
                  symbol_name = 'dollar';
                }
                let change_class = '';
                if(item.period_comparison_change=='Incomputable'){
                  change_class = '';
                } else {
                  change_class = (item.period_comparison_change > 0 ? 'up' : 'down');
                }
                
                return (
                  <div key={'widget-'+i} className="widget">
                    <div className="widget-header">
                      <div className={'title-wrapper '+((i>2 && i<6) ? 'webanalytics' : '')}>
                        <div className="title">{item.key.replace('_',' ')}</div>
                      </div>

                      <div className="total-wrapper">
                        {item.period_comparison_change &&
                          <div className="comparison">
                            <span className={change_class}>{item.period_comparison_change}%</span>
                            <div className="period-comparison-details">
                              <div className="info"><span className="label">Period:</span> {item.prev_date_range}</div>
                              <div className="info"><span className="label">Sum Total: </span> {(symbol!=='' ? symbol : '')}
                                {(item.period_comparison_net_details!==null && item.period_comparison_change!='Incomputable') &&
                                  numberWithCommas(item.period_comparison_net_details)
                                }
                              </div>                              
                            </div>
                          </div>
                        }

                        {item.net_details && 
                          <div className="overall">
                            <div className={'val '+(symbol !=='' ? 'has-symbol' : '')}><span className={'symbol '+(symbol!=='' ? symbol_name : '')}>{(symbol!=='' ? symbol : '')}</span> {numberWithCommas(item.net_details)}</div>
                          </div>
                        }
                      </div>
                    </div>

                    {item.data.length > 0 &&
                      <div id={'tooltip-'+(item.key)} className="tooltip" ref={this.chartsWrapper[item.key]['tooltip']}></div>
                    }
                    
                    <div className={'chart '+(item.key)} ref={this.chartsWrapper[item.key]['chart']}></div>
                  </div>
                )
              })
            }

            {/* Klay Media Chart */}
            {(!this.state.inprocess && this.state.klayMediaChartsData.length > 0) &&
              this.state.klayMediaChartsData.map((item, i) => {
                let unique_key = item.display_name.replace(/ /g, '_').toLowerCase();
                let symbol = '';
                let symbol_name = '';
                if(amountCols.includes(item.key)){
                  symbol = '$';
                  symbol_name = 'dollar';
                }
                let change_class = '';
                if(item.period_comparison_change=='Incomputable'){
                  change_class = '';
                } else {
                  change_class = (item.period_comparison_change > 0 ? 'up' : 'down');
                }
                
                return (
                  <div key={'widget-'+i} className="widget">
                    <div className="widget-header">
                      <div className="title-wrapper">
                        <div className="title">{item.display_name}</div>
                      </div>

                      <div className="total-wrapper">
                        {item.period_comparison_change &&
                          <div className="comparison">
                            <span className={change_class}>{item.period_comparison_change}%</span>
                            <div className="period-comparison-details">
                              <div className="info"><span className="label">Period:</span> {item.prev_date_range}</div>
                              <div className="info"><span className="label">Sum Total: </span> {(symbol!=='' ? symbol : '')}
                                {(item.period_comparison_net_details!==null && item.period_comparison_change!='Incomputable') &&
                                  numberWithCommas(item.period_comparison_net_details)
                                }
                              </div>                              
                            </div>
                          </div>
                        }

                        {item.net_details && 
                          <div className="overall">
                            <div className={'val '+(symbol !=='' ? 'has-symbol' : '')}><span className={'symbol '+(symbol!=='' ? symbol_name : '')}>{(symbol!=='' ? symbol : '')}</span> {numberWithCommas(item.net_details)}</div>
                          </div>
                        }
                      </div>
                    </div>

                    {item.data.length > 0 &&
                      <div id={'tooltip-'+(unique_key)} className="tooltip" ref={this.state.klayMediaChartsWrapper[unique_key]['tooltip']}></div>
                    }
                    
                    <div className={'chart '+(unique_key)} ref={this.state.klayMediaChartsWrapper[unique_key]['chart']}></div>
                  </div>
                )
              })
            }
          </div>
        </div>
      </div>
    );
  }
}

//get total of perticular key value
function getTotalOfKeyValue(data, key){
  let sum = 0;
  Object.keys(data).forEach((item) => {
    if(data[item][key]!==undefined){
      sum = sum+data[item][key]['data'];
    }
  });
  return sum;
}

//Component to render target report and monthly run rate report
const SummaryReport=(props)=> {
  let reportData = props.data;
  let title = props.title;

  if(Object.keys(reportData).length > 0){
    return (
      <div className="summary-report-wrapper">
        <div className="chart-title">{title}</div>

        <div className="headings-wrapper">
          <div className="col-wrapper"><div className="col-title">Business Unit</div></div>
          <div className="col-wrapper"><div className="col-title">Profit</div></div>
          <div className="col-wrapper"><div className="col-title">Revenue</div></div>
        </div>

        <div className="values-wrapper">
          {Object.keys(reportData).map((key, index) => {
            return (
              <div key={key} className="value-wrapper">
                <div className="col">
                  <div className="col-val"><div className="col-label">{key}</div></div>
                </div>
                {
                  Object.keys(reportData[key]).map((item) => {
                    let coldetails = reportData[key][item];
                    let total_mark = getTotalOfKeyValue(reportData, item);
                    total_mark = total_mark+(total_mark*5/100);

                    let value_width = (coldetails.data*100)/total_mark;
                    let target_width = (coldetails.target*100)/total_mark;

                    return (
                      <div key={item} className={'col '+(item)} data-val={value_width} data-target={target_width}>
                        <div className="col-val-wrapper">
                          <div className="col-val">
                            <span className="number">{coldetails.data}</span>
                            <span className="change">{parseFloat(coldetails.percentage).toFixed(2)+'%'}</span>
                            {/* <span className="target">{coldetails.target}</span> */}
                          </div>
                          <div className="col-chart">
                            <span className="bar" style={{width: value_width+'%'}}></span>
                            <span className="target" style={{width: target_width+'%'}}></span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            )
          })}
        </div>
      </div>
    )
  }
}
 
export default SellSideHome;