import React, { Component } from 'react';
import * as Constants from '../../../components/Constants.js';
import SpeedSelect from '../../../components/SpeedSelect/SpeedSelect';
import RangePicker from '../../../components/ReactCalendar/RangePicker';

//Import Services
import APIService from '../../../services/apiService';
import moment from 'moment';

class AccountsReceivableDimensions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      inprocess: false,
      error: '',
      dimensions: {},
      selected_dimensions: {},
      allFilters: [
        {'id':'year', 'val': this.props.defaultYear},
        {'id':'month', 'val':[]},
        {'id':'advertiser', 'val':''},
        {'id':'payment-expected-period', 'val':''},
        {'id':'payment-received', 'val':[]}
      ],
      selectedDateRange: []
    };
    this.client = this.props.client;
    this.onOptionSelect = this.onOptionSelect.bind(this);
    this.analysisPeriodChange = this.analysisPeriodChange.bind(this);
  }
  
  componentDidMount(){
    //Get Dimensions of View Type
    this.getAllDimensions();

    //On Payment Expected PEriod change
    // if($('#payment-expected-period').length > 0){
    //   var options = {
    //     autoUpdateInput: false,
    //     autoApply: true,
    //     ranges: {
    //       'Today': [moment(), moment()],
    //       'Yesterday': [moment().subtract(1, 'days'), moment()],
    //       'Last 7 Days': [moment().subtract(6, 'days'), moment()],
    //       'Last 30 Days': [moment().subtract(29, 'days'), moment()],
    //       'This Month': [moment().startOf('month'), moment().endOf('month')],
    //       'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
    //     }
    //   };
    //   $('#payment-expected-period').on('apply.daterangepicker', function(ev, picker) {
    //     $(this).val(picker.startDate.format('MM/DD/YYYY') + ' - ' + picker.endDate.format('MM/DD/YYYY'));
    //   });
    //   $('#payment-expected-period').on('cancel.daterangepicker', function(ev, picker) {
    //     $(this).val('');
    //   });
  
    //   $('#payment-expected-period').daterangepicker(options, function(start, end, label) {
    //     $('#payment-expected-period').attr('data-date-type', label);
    //     var item_type = 'payment-expected-period';
    //     var item_val = start.format('MM/DD/YYYY')+' - '+end.format('MM/DD/YYYY');
    //     var index = that.state.allFilters.findIndex(p => p.id == 'payment-expected-period')
    //     const obj = that.state.allFilters[index];
    //     that.setState({
    //       allFilters: [
    //         ...that.state.allFilters.slice(0, index),
    //         { ...obj, val: item_val},
    //         ...that.state.allFilters.slice(index + 1)
    //       ]
    //     });
    //     that.props.onDimensionsChanged(that.state.allFilters);
    //   });
    // }
  }

  componentDidUpdate(prev_props){
    if( (this.props.client.id!==prev_props.client.id) ||
        (this.props.view_type && prev_props.view_type!==this.props.view_type) ){
      //Get Dimensions of View Type
      this.getAllDimensions();
    }

    if(prev_props.defaultYear!==this.props.defaultYear){
      let updatedAllFilters = [...this.state.allFilters];
      updatedAllFilters[0]['val'] = this.props.defaultYear;

      this.setState({
        selected_dimensions: {
          ...this.state.selected_dimensions,
          'year': this.props.defaultYear
        },
        allFilters: updatedAllFilters
      });
    }
  }


  //Get Dimension using API
  getAllDimensions(evt) {
    //Input Validations and Send Fetch Request
    this.setState({ error: '', inprocess: true });

    const dimensionPayLoad = {
      "client_id": this.client.id,
      "view_type": "payment_summary",
      "dimension": "advertiser",
      "dimension_filter": "",
    };
    APIService.apiRequest(Constants.API_BASE_URL+'/getAllDimensions', dimensionPayLoad)
      .then(response => {
        if(response.status===1 && response.data!==undefined){
          let dimensions = JSON.parse(response.data[0]['data']);
          let allDimensions = [];
          Object.keys(dimensions).forEach(function(key) {
            let options = JSON.parse(dimensions[key]);
            allDimensions[key] = options;
          });
          this.setState({ dimensions: allDimensions });

          // setTimeout(() => {
          //   this.addDimensionsOptions(this.state.dimensions);
          // },0);
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
    let item_type = id;
    let item_val = event;
   
    let index = this.state.allFilters.findIndex(p => p.id == item_type);
    let obj = this.state.allFilters[index];
    let updated_selected_dimensions = {...this.state.selected_dimensions};
    updated_selected_dimensions[id] = event;

    this.setState({
      selected_dimensions: updated_selected_dimensions,
      allFilters: [
        ...this.state.allFilters.slice(0, index),
        { ...obj, val: item_val},
        ...this.state.allFilters.slice(index + 1)
      ]
    }, ()=>{
      this.props.onDimensionsChanged(this.state.allFilters); 
    });
  }

  //Only change the date range in state - don;t call the api
  analysisPeriodChange(date_range){
    var start_date = this.formatDate(date_range[0], 'MM/DD/YYYY');
    var end_date = this.formatDate(date_range[1], 'MM/DD/YYYY');
    var formatted_date_range = start_date+' - '+end_date;
    var filtered_date_range = [date_range[0], date_range[1]];

    //Input Validations and Send Fetch Request
    var index = this.state.allFilters.findIndex(p => p.id == 'payment-expected-period');
    const obj = this.state.allFilters[index];
   
    this.setState({
      selectedDateRange: filtered_date_range,
      allFilters: [
        ...this.state.allFilters.slice(0, index),
        { ...obj, val: formatted_date_range},
        ...this.state.allFilters.slice(index + 1)
      ]
    }, ()=>{
      this.props.onDimensionsChanged(this.state.allFilters);
    });
  }

  //Format Date
  formatDate(date, date_format){
    return moment(date).format(date_format);
  }


  render() {
    if(this.props.defaultYear===undefined) return false;
    let yearsList = [];
    let lastYear = 2018;
    let startYear = this.props.currentYear;

    for (var i = lastYear; i <= startYear; i++) { yearsList.push(i); }
    yearsList.reverse();

    let monthsList = [{id: 1, name:'January'}, {id: 2, name:'Feburary'}, {id: 3, name:'March'}, {id: 4, name:'April'}, {id: 5, name:'May'}, {id: 6, name:'June'}, {id: 7, name:'July'}, {id: 8, name:'August'}, {id: 9, name:'September'}, {id: 10, name:'October'}, {id: 11, name:'November'},  {id: 12, name:'December'}];
    let paymentReceivedList = [{id: "1", name:'Payment Received'}, {id: "0", name:'Payment Pending'}];

    return (
      <div className="header-filters-wrapper">
        <div className="col year">
          {yearsList!==undefined && 
            <div className="form-group">
              <SpeedSelect
                options={yearsList}
                selectedOption={(this.state.selected_dimensions['year']) ? this.state.selected_dimensions['year'] : []}
                onSelect={(e) => this.onOptionSelect(e, 'year')}
                displayKey='value'
                uniqueKey='year'
                multiple
                selectLabel='Year'
                maxHeight='120'
              />
            </div>
          }
        </div>

        <div className="col month">
          {monthsList!==undefined && 
            <div className="form-group">
              <SpeedSelect
                options={monthsList}
                selectedOption={(this.state.selected_dimensions['month']) ? this.state.selected_dimensions['month'] : []}
                onSelect={(e) => this.onOptionSelect(e, 'month')}
                displayKey='name'
                uniqueKey='id'
                multiple
                selectLabel='Month'
                maxHeight='174'
              />
            </div>
          }
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
                maxHeight='124'
              />
            </div>
          }
        </div>

        <div className="col payment-expected-period">
          <div className="form-group">
            <div className="payment-expected-period">
              <RangePicker picker="date"
                range={this.state.selectedDateRange}
                onChange={this.analysisPeriodChange}
                placeholder="Date"
                allowClear={false}
                showOkCancelBtns={true}
              />
            </div>
          </div>
        </div>

        <div className="col payment-received">
          {paymentReceivedList && 
            <div className="form-group">
              <SpeedSelect
                options={paymentReceivedList}
                selectedOption={(this.state.selected_dimensions['payment-received']) ? this.state.selected_dimensions['payment-received'] : []}
                onSelect={(e) => this.onOptionSelect(e, 'payment-received')}
                multiple
                displayKey='name'
                uniqueKey='id'
                selectLabel='Payment Status'
                maxHeight='124'
              />
            </div>
          }
        </div>
      </div>
    );
  }
}

export default AccountsReceivableDimensions;