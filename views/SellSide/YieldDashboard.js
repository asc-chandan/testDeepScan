import React, { Component } from 'react';
import moment from 'moment';
import * as Constants from '../../components/Constants.js';
import subjectObj from '../../subjects/Subject1';
import Loader from '../../components/Loader';

import '../../styles/Global.scss';
import '../../styles/YieldDashboard.scss';

import { getKeyByValue, getClients, getUser, numberWithCommas, formatDate } from '../../utils/Common';
import APIService from '../../services/apiService';

import SpeedSelect from '../../components/SpeedSelect/SpeedSelect';
import { isDateGreater } from '../../components/ReactCalendar/components/utils';
import RangePicker from '../../components/ReactCalendar/RangePicker';
import HideSubHeader from '../../components/HideSubHeader';


class YieldDashboard extends Component {
  constructor(props) {
    super(props);

    //Get Client & View Type
    this.page_title = 'Yield Dashboard';
    this.user = getUser();
    this.controller = new AbortController();

    //Get Initial Variables Set
    this.state = this.getInitVariables();
    
    //Events
    this.loadYieldDashboardCharts = this.loadYieldDashboardCharts.bind(this);
    this.handleDatePeriodChange = this.handleDatePeriodChange.bind(this);
    this.onOptionSelect = this.onOptionSelect.bind(this);
  }

  //Get Initial Variables
  getInitVariables(){
    return {
      inprocess: false,
      error: "",
      client: getKeyByValue(getClients(), this.user.last_fetched_client, 'id'),
      terminal_type: this.user.terminal_type.id,
      last_updated_date: '',
      lastUpdatedDateObj: '',
      selectedDateRange: '',
      adtypeList: null,
      selected_adtype: '',
      yieldDashboardData: null,
      maxPotentialRevenue: null
    }
  }

  componentDidMount(){
    subjectObj.notify({ page_title: this.page_title });

    //Get Last Updated Date
    if(this.state.client){
      this.handleLoadScripts();
    }
  }

  //Reload the page if client id/name change from url
  componentDidUpdate(prev_props){
    this.user = getUser();
    if(this.user.last_fetched_client!==this.state.client.id){
      //Update State Values
      this.setState(this.getInitVariables(), ()=>{
        if(this.state.client){
          this.handleLoadScripts();
        }
      });
    }
  }

  componentWillUnmount(){
    //Cancel Previous API Requests
    console.log('unmount - cancel previous view running apis');
    APIService.abortAPIRequests(this.controller);
  }

  handleLoadScripts(){
    this.getLastUpdatedDate(); //Get Last Updated Date
  }

  //Get Last Updated Date
  getLastUpdatedDate(){
    //Input Validations
    this.setState({ error: '', inprocess: true});
        
    const datePayLoad = {
      "client_id": this.state.client.id,
      "view_type": 'advertiser'
    };

    APIService.apiRequest(Constants.API_BASE_URL+'/getLastUpdatedDates', datePayLoad, false, 'POST', this.controller)
      .then(response => {
        if(response.status===1 && response.data!==undefined){
          let lastupdateddate = JSON.parse(response.data);
          let defaultCount = 6;
          let defaultFormat = 'days';

          //Set last updated date and last 30days date range under analysis period input box
          let formattedDate = moment(lastupdateddate[0]['last_updated_date']).utc().format('MMM DD, YYYY');
          let endDate = moment(lastupdateddate[0]['last_updated_date']).utc().toDate();
          let formattedEndDate = moment(endDate.getTime() + endDate.getTimezoneOffset() * 60000).toDate(); //convert to utc time
          let formattedStartDate = moment(formattedEndDate).subtract(defaultCount, defaultFormat).toDate();
          let formattedDateRange = [formattedStartDate, formattedEndDate];

          this.setState({
            last_updated_date: formattedDate,
            lastUpdatedDateObj: formattedEndDate,
            selectedDateRange: formattedDateRange,
            inprocess: false
          }, ()=>{
            //Pass LastUpdatedDate to Header Component
            subjectObj.notify({
              last_updated_date: this.state.last_updated_date,
              client: this.state.client
            });

            //Get Yield Data
            this.getYieldDashboardData();
          });
          
        } else {
          this.setState({inprocess: false, error: response.msg});
        }
      })
      .catch(err => {
        this.setState({ error: err.msg });
      });
  }

  //Handle Date Period Change
  handleDatePeriodChange(date_range){
    //Input Validations and Send Fetch Request
    this.setState({
      selectedDateRange: date_range,
    }, ()=>{
      this.getYieldDashboardData();
    });
  }


  //On Select Change
  onOptionSelect(event, id){
    this.setState({
      selected_adtype: event
    }, ()=>{
      this.getYieldDashboardData();
    });
  }
  


  /*********************************
   * Analysis Saved View Functios
   */

  getYieldDashboardData(args=null){
    //Input Validations
    this.setState({ error: '', inprocess: true });

    var start_date = formatDate(this.state.selectedDateRange[0], 'YYYY-MM-DD');
    var end_date = formatDate(this.state.selectedDateRange[1], 'YYYY-MM-DD');

    let apiPayload = {
      'client_id': this.state.client.id,
      'start_date': start_date,
      'end_date': end_date,
      'ad_type': this.state.selected_adtype
    }
    
    APIService.apiRequest(Constants.API_BASE_URL+'/yieldDashboard', apiPayload, false, 'POST', this.controller)
      .then(response => {
        if(response.status===1 && response.data!==undefined){
          let stateObj = {
            inprocess: false,
            yieldDashboardData: JSON.parse(response.data),
            maxPotentialRevenue: JSON.parse(response.max_potential_revenue)
          }
          if(!this.state.adtypeList){
            let adtypeList = [];
            let adtypes = JSON.parse(response.ad_type);
            adtypes.forEach((item, i) => {
              adtypeList.push(item.name);
            });
            stateObj['adtypeList'] = adtypeList;
          }
          
          this.setState(stateObj);
        } else {
          this.setState({inprocess: false, error: response.message});
        }

        subjectObj.notify({
          last_updated_date: this.state.last_updated_date,
          client: this.state.client
        });
      })
      .catch(err => {
        this.setState({inprocess: false, error: err.message });
      });
  }

  
  //Round float number
  roundFloat(num) {
    return Number(Math.round(num+'e2')+'e-2'); //round number
  }

  removeNumberFormatting(num) {
    let step1 = num.toString();
    let step2 = step1.replace(/,/g, '');
    let step3 = parseFloat(step2.replace('$', ''));
    return step3;
  }

  getMax(num) {
    var range_max = num;
    return range_max;
  }

  loadYieldDashboardCharts(){
    if(!this.state.yieldDashboardData) {
      return(
        <div className="yield-main-wrapper">No Records Found.</div>
      )
    };

    return (
      <div className="yield-main-wrapper">
        {
          Object.keys(this.state.yieldDashboardData).map((key, index) => {
            let data = JSON.parse(this.state.yieldDashboardData[key]);
            let data_len = Object.keys(data).length;
            let max_cpm = 0;
            
            if(data_len>0){
              //Add Title
              let chart_wrapper_id = key.toLowerCase();
              chart_wrapper_id = chart_wrapper_id.split(' ').join('-');
              let grand_totals = {
                'total_impressions': 0,
                'total_cpm': 0,
                'total_revenue': 0,
                'total_records_count': data_len
              };

              Object.keys(data).forEach((level1key,index) => {
                let total_impressions = data[level1key]['total_impressions'];
                let total_cpm = this.roundFloat(data[level1key]['cpm']); //round number
                let total_revenue = this.roundFloat(data[level1key]['total_revenue']); //round number

                //Calculate Grand Total
                max_cpm = (max_cpm > total_cpm) ? max_cpm : total_cpm;
                grand_totals['total_impressions'] = (grand_totals['total_impressions']!='') ? (parseFloat(total_impressions) + parseFloat(grand_totals['total_impressions'])) : parseInt(total_impressions);
                grand_totals['total_cpm'] = (grand_totals['total_cpm']!='') ? (parseFloat(total_cpm) + parseFloat(grand_totals['total_cpm'])) : parseFloat(total_cpm);
                grand_totals['total_revenue'] = (grand_totals['total_revenue']!='') ? (parseFloat(total_revenue) + parseFloat(grand_totals['total_revenue']))  : parseFloat(total_revenue);
              })

              //Get Maximum CPM to show correct percentage on grant total
              let total_cpm = this.roundFloat(grand_totals['total_cpm']/grand_totals['total_records_count']);
              max_cpm = (total_cpm > max_cpm) ? total_cpm : max_cpm;
              
              let total_revenue_width_percentage = this.roundFloat((grand_totals['total_revenue']*100)/grand_totals['total_revenue']);
              let total_impressions_width_percentage = this.roundFloat((grand_totals['total_impressions']*100)/grand_totals['total_impressions']);
              let total_cpm_width_percentage = this.roundFloat((total_cpm*100)/max_cpm);
              
              return (
                <div id={chart_wrapper_id} className="yield-chart-wrapper">
                  <div className="chart-title">{key} <span className="max-potential-revenue"><span className="label">Max Potential Revenue: </span><span className="val">${numberWithCommas(this.roundFloat(this.state.maxPotentialRevenue[key]))}</span></span></div>

                  {/* Add Columns */}
                  <div className="headings-wrapper">
                    <div className="col-wrapper">
                      <div className="col"><div className="col-val-wrapper"><div className="col-title">Line Item Types</div></div></div>
                      <div className="col"><div className="col-val-wrapper"><div className="col-title">Impressions</div></div></div>
                      <div className="col"><div className="col-val-wrapper"><div className="col-title">CPM</div></div></div>
                      <div className="col"><div className="col-val-wrapper"><div className="col-title">Revenue</div></div></div>
                    </div>
                  </div>
              
                  <div className="values-wrapper">
                    {
                      Object.keys(data).map((level1key,index) => {
                        let total_impressions = data[level1key]['total_impressions'];
                        let total_cpm = this.roundFloat(data[level1key]['cpm']); //round number
                        let total_revenue = this.roundFloat(data[level1key]['total_revenue']); //round number
                        let cpm = '$'+total_cpm;
                        let revenue = '$'+numberWithCommas(total_revenue);

                        let revenue_width_percentage = this.roundFloat((total_revenue*100)/grand_totals['total_revenue']);
                        let impressions_width_percentage = this.roundFloat((total_impressions*100)/grand_totals['total_impressions']);
                        let cpm_width_percentage = this.roundFloat((total_cpm*100)/grand_totals['total_cpm']);

                        let class_name = level1key.replace(' ', '_');
                        
                        return (
                          <div className={'value-wrapper '+(class_name)}>
                            <div className="col-wrapper">
                              <div className="col">
                                <div className="col-val-wrapper"><div className="col-label">{level1key}</div></div>
                              </div>

                              <div className="col">
                                <div className="col-val-wrapper total_impressions">
                                  <div className="col-val"><span className="number">{numberWithCommas(total_impressions)}</span><span className="change">{impressions_width_percentage}%</span></div>
                                  <div className="col-chart" style={{width: impressions_width_percentage+'%'}}></div>
                                </div>
                              </div>

                              <div className="col">
                                <div className="col-val-wrapper cpm">
                                  <div className="col-val"><span className="number">{cpm}</span></div>
                                  <div className="col-chart" style={{width: cpm_width_percentage+'%'}}></div>
                                </div>
                              </div>

                              <div className="col">
                                <div className="col-val-wrapper total_revenue">
                                  <div className="col-val"><span className="number">{revenue}</span><span className="change">{revenue_width_percentage}%</span></div>
                                  <div className="col-chart" style={{width: revenue_width_percentage+'%'}}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    }

                    <div className="value-wrapper grand-total">
                      <div className="col-wrapper">
                        <div className="col"><div className="col-val-wrapper"><div className="col-label">Grand Total</div></div></div>

                        <div className="col">
                          <div className="col-val-wrapper total_impressions">
                            <div className="col-val"><span className="number">{numberWithCommas(grand_totals['total_impressions'])}</span><span className="change">100%</span></div>
                            <div className="col-chart" style={{width: total_impressions_width_percentage+'%'}}></div>
                          </div>
                        </div>

                        <div className="col">
                          <div className="col-val-wrapper cpm">
                            <div className="col-val"><span className="number">$'{this.roundFloat(grand_totals['total_cpm']/grand_totals['total_records_count'])}</span></div>
                            <div className="col-chart" style={{width: total_cpm_width_percentage+'%'}}></div>
                          </div>
                        </div>

                        <div className="col">
                          <div className="col-val-wrapper total_revenue">
                            <div className="col-val"><span className="number">$'{numberWithCommas(this.roundFloat(grand_totals['total_revenue']))}</span><span className="change">100%</span></div>
                            <div className="col-chart" style={{width: total_revenue_width_percentage+'%'}}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )
            }
          })
        }
      </div>
    )
  }


  render() {
    const YieldCharts = (this.loadYieldDashboardCharts) ? this.loadYieldDashboardCharts : '';

    return (
      <div className="app-wrapper yield-dashbord-view">
        <div id="app-sub-header">
          {/* <h2 className="page-title">Yield Dashboard</h2> */}

          <div className="date-period-wrapper">
            {this.state.client && 
              <div className="form-group">
                <RangePicker picker="date"
                  range={this.state.selectedDateRange}
                  dateForLastDaysCalculation={this.state.lastUpdatedDateObj}
                  onChange={this.handleDatePeriodChange}
                  disableFn={(dObj) => isDateGreater(dObj, this.state.lastUpdatedDateObj)}
                  allowClear={false}
                  showOkCancelBtns={true}
                />
              </div>
            }
          </div>

          <div className="filters-wrapper">
            {this.state.adtypeList && 
              <div className="form-group">
                <SpeedSelect
                  options={this.state.adtypeList}
                  selectedOption={(this.state.selected_adtype) ? this.state.selected_adtype : ''}
                  onSelect={(e) => this.onOptionSelect(e, 'ad_type')}
                  displayKey='value'
                  uniqueKey='ad_type'
                  selectLabel='ad_type'
                  maxHeight='175'
                />
              </div>
            }
          </div>
        
          {/* <HideSubHeader />*/}
        </div>


        {/* Analysis Landing View */}
        <div className="container">
          <div className="inner-wrapper clearfix">
            <div id="yield-dashbord-wrapper">
              {this.state.inprocess && <Loader />}

              <div id="yield-dashboard">
                <YieldCharts />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
 
export default YieldDashboard;