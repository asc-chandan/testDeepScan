import React, { Component } from 'react';
import moment from 'moment';
import * as Constants from '../../../components/Constants.js';
import subjectObj from '../../../subjects/Subject1';
import SpeedSelect from '../../../components/SpeedSelect/SpeedSelect';
import Loader from '../../../components/Loader';
import AlertBox from '../../../components/AlertBox';
import '../../../styles/AdTagMap.scss';

import AdTagMapReactTable from './AdTagMapReactTable';
import { getKeyByValue, getClients, getUser } from '../../../utils/Common';
import APIService from '../../../services/apiService';

class AdTagMap extends Component {
  constructor(props) {
    super(props);
    this.user = getUser();

    this.state = {
      inprocess: false,
      message: "",
      error: "",
      client: getKeyByValue(getClients(), this.user.last_fetched_client, 'id'),
      showAlert: false,
      adtagmapData: null,
      last_updated_date: '',
      last_updated_date_for_datepicker: '',
      data_types_list: [{id:'advertiser', name:'Advertiser'},{id:'adserver', name:'Adserver'}],
      dimensions: {},
      selected_dimensions: {},
      view_type_advertisers: {}, //used under table
      selected_advertisers: {}, //used under table
      allFilters: [
        {'id':'data_type', 'val':[{id:'advertiser', name:'Advertiser'}]},
        {'id':'property', 'val':''},
        {'id':'advertiser', 'val':''},
        {'id':'monetization_channel', 'val':''},
        {'id':'ad_type', 'val':''},
        {'id':'integration_type', 'val':''},
        {'id':'ad_unit', 'val':''}
      ],
      showAddNewRow: false,
      updatedData: [],
      show_missing_adunits: false
    }
    this.view_type = 'advertiser';
    this.page_title = 'Ad Tag Map';
    this.dimensions_str = "advertiser";
    
    this.getAdTagMap = this.getAdTagMap.bind(this);
    this.handleDimensionsChange = this.handleDimensionsChange.bind(this);
    this.onOptionSelect = this.onOptionSelect.bind(this);
    this.onSwitchSelect = this.onSwitchSelect.bind(this);
    this.handleAddNewRow = this.handleAddNewRow.bind(this);
    this.handleOnAddNewRevShare = this.handleOnAddNewRevShare.bind(this);
    this.handleUpdateRevShareData = this.handleUpdateRevShareData.bind(this);
    this.handleSaveUpdates = this.handleSaveUpdates.bind(this);
    this.handleAlertClose = this.handleAlertClose.bind(this);
  }

  //Reload the page if client id/name change from url
  componentDidUpdate(){
    this.user = getUser();
    if(this.user.last_fetched_client!==this.state.client.id){
      this.setState({
        inprocess: false,
        message: "",
        error: "",
        client: getKeyByValue(getClients(), this.user.last_fetched_client, 'id'),
        showAlert: false,
        adtagmapData: null,
        last_updated_date: '',
        last_updated_date_for_datepicker: '',
        data_types_list: [{id:'advertiser', name:'Advertiser'},{id:'adserver', name:'Adserver'}],
        dimensions: {},
        selected_dimensions: {},
        view_type_advertisers: {}, //used under table
        selected_advertisers: {}, //used under table
        allFilters: [
          {'id':'data_type', 'val':[{id:'advertiser', name:'Advertiser'}]},
          {'id':'property', 'val':''},
          {'id':'advertiser', 'val':''},
          {'id':'monetization_channel', 'val':''},
          {'id':'ad_type', 'val':''},
          {'id':'integration_type', 'val':''},
          {'id':'ad_unit', 'val':''}
        ],
        showAddNewRow: false,
        updatedData: [],
        show_missing_adunits: false
      });

      //Get Last Updated Date
      this.loadScripts();
    }
  }

  loadScripts(){
    this.getLastUpdatedDate();
    this.getAllDimensions();
    this.getAdTagMap();
  }

  componentDidMount(){
    this.loadScripts();
  }

  handleAlertClose(){
    this.setState({ showAlert: false });
  }
  
  //Get Last Updated Date
  getLastUpdatedDate(){
    //Input Validations
    this.setState({ error: '', inprocess: true});
        
    const datePayLoad = {
      "client_id": this.state.client.id,
      "view_type": this.view_type
    };
    APIService.apiRequest(Constants.API_BASE_URL+'/getLastUpdatedDate', datePayLoad)
      .then(response => {
        if(response.status===1 && response.data!==undefined){
          //Set last updated date and last 30days date range under analysis period input box
          let lastupdateddate = JSON.parse(response.data);
          let formattedDate = moment(lastupdateddate[0]['last_updated_date']).utc().format('MMM DD, YYYY');
          let endDate = moment(lastupdateddate[0]['last_updated_date']).utc().toDate();
          let formattedEndDate = moment(endDate.getTime() + endDate.getTimezoneOffset() * 60000).toDate(); //convert to utc time
          
          this.setState({
            last_updated_date: formattedDate,
            last_updated_date_for_datepicker: formattedEndDate,
            inprocess: false
          });

          setTimeout(()=>{
            //Pass LastUpdatedDate to Header Component
            subjectObj.notify({
              last_updated_date: this.state.last_updated_date,
              client: this.state.client,
            });
          },10);
        } else {
          this.setState({inprocess: false, error: response.msg});
        }
      })
      .catch(err => {
        this.setState({ error: err.msg });
      });
  }

  //Format Date
  formatDate(date, date_format){
    return moment(date).format(date_format);
  }

  //Get Date Range - pass end_date, days_count, date_format, and seperator
  getDateRange(end_date, days_count, date_format, seperator){
    var start_date = moment(end_date).subtract((days_count-1), 'days').format(date_format);
    return (start_date + seperator + end_date);
  }

  //Get Dimension using API
  getAllDimensions() {
    //Input Validations and Send Fetch Request
    this.setState({ error: '', inprocess: true });

    const dimensionPayLoad = {
      "client_id": this.state.client.id,
      "view_type": "advertiser,adserver",
      "dimension": "property,monetization_channel,advertiser,ad_unit,ad_type,integration_type",
      "dimension_filter": "",
    };
    APIService.apiRequest(Constants.API_BASE_URL+'/getAllDimensions', dimensionPayLoad)
      .then(response => {
        if(response.status===1 && response.data!==undefined){
          let parsedDimensions = [];

          response.data.forEach((item) => {
            let newData = {};
            let parsedData = JSON.parse(item['data']);
            
            Object.keys(parsedData).forEach((item) => {
              newData[item] = JSON.parse(parsedData[item]);
            });
            parsedDimensions.push(newData);
          });
          
          this.setState({ 
            dimensions: parsedDimensions[0],
            view_type_advertisers: {'advertiser': parsedDimensions[0]['advertiser'], 'adserver': parsedDimensions[1]['advertiser']}
          });
        } else {
          this.setState({inprocess: false, error: response.msg });
        }
      })
      .catch(err => {
        this.setState({ error: err.msg });
      });
  }

  //On wwitch box changes
  onSwitchSelect(event){
    this.setState({show_missing_adunits: event.target.checked});

    setTimeout(() => {
      let apiPayload = {
        "client_id": this.state.client.id,
        "missing_units": (this.state.show_missing_adunits ? 1 : 0)
      };
  
      //Get Ad Tag Map Data
      this.getAdTagMap(apiPayload);
    }, 0);
  }

  //On Select Change
  onOptionSelect(event, id){
    var item_type = id;
    var item_val = event;

    var index = this.state.allFilters.findIndex(p => p.id == item_type);
    const obj = this.state.allFilters[index];
    this.setState({
      selected_dimensions: {
        ...this.state.selected_dimensions,
        [id]: event
      },
      allFilters: [
        ...this.state.allFilters.slice(0, index),
        { ...obj, val: item_val},
        ...this.state.allFilters.slice(index + 1)
      ]
    });

    setTimeout(() => {
      //Update Global Advertiser Dimension
      if(id==='data_type'){
        let updatedDimenions = JSON.parse(JSON.stringify(this.state.dimensions));
        
        //get combined list of advertiser for both view types
        if(item_val.length > 1){
          let updatedAdvertiser = [];
          item_val.forEach((item) => {
            if(updatedAdvertiser.length === 0){
              updatedAdvertiser = this.state.view_type_advertisers[item['id']];
            } else {
              let newAdvertiser = updatedAdvertiser.concat(this.state.view_type_advertisers[item['id']]);
              updatedAdvertiser = newAdvertiser.filter((item, pos) => newAdvertiser.indexOf(item) === pos)
            }
          });
          updatedDimenions['advertiser'] = updatedAdvertiser;
          
        } else { //get individual view type advertisers list
          updatedDimenions['advertiser'] = this.state.view_type_advertisers[item_val[0]['id']];
        }
        
        this.setState({
          dimensions: updatedDimenions
        });
      }

      this.handleDimensionsChange(this.state.allFilters); 
    },0);
  }

  getAdTagMapFilters(){
    let obj = {
      "client_id": this.state.client.id,
      // "data_type": ["advertiser"],
      // "advertiser_id": [],
    };
    return obj;
  }


  //Get Ad Tag Map Data
  getAdTagMap(apiPayload){
    if(!apiPayload){
      apiPayload = this.getAdTagMapFilters();
    }
    //Input Validations and Send Fetch Request
    this.setState({ error: '', inprocess: true });

    APIService.apiRequest(Constants.API_BASE_URL+'/getAdTagMap', apiPayload)
      .then(response => {
        if(response.status===1 && response.data!==undefined){
          //Remove Loading Icon
          this.setState({inprocess: false, adtagmapData: response.data});
        } else {
          this.setState({inprocess: false, error: response.msg });
        }
      })
      .catch(err => {
        this.setState({ error: err.msg });
      });
  }


  handleDimensionsChange(args){
    let dataTypes = [];
    args[0]['val'].forEach((item) => {
      dataTypes.push(item.id);
    });

    //Get AdTagMap Payload
    let apiPayLoad = {
      ...this.getAdTagMapFilters(),
      'data_type': (dataTypes) ? dataTypes: [],
      'property': (args[1]['val']!=='') ? args[1]['val'] : [],
      'advertiser': (args[2]['val']!=='') ? args[2]['val'] : [],
      'monetization_channel': (args[3]['val']!=='') ? args[3]['val'] : [],
      'ad_type': (args[4]['val']!=='') ? args[4]['val'] : [],
      'integration_type': (args[5]['val']!=='') ? args[5]['val'] : [],
      'ad_unit': (args[6]['val']!=='') ? args[6]['val'] : []
    }
    
    this.getAdTagMap(apiPayLoad);
  }

  //Add New Row to RevShare Table
  handleAddNewRow(){
    this.setState({
      showAddNewRow: true
    })
  }

  //Add New RevShare Saved entry to existing data set
  handleOnAddNewRevShare(args){
    let updatedData = JSON.parse(JSON.stringify(this.state.revShareData));
    updatedData.push(args);

    this.setState({
      showAddNewRow: false,
      revShareData: updatedData
    })
  }

  //Update exiting rev share row details
  handleUpdateRevShareData(args, index, updatedRevShareData){
    let updatedData = JSON.parse(JSON.stringify(this.state.revShareData));
    for (const [key, value] of Object.entries(args)) {
      updatedData[index][key] = value;
    }
    this.setState({
      showAddNewRow: false,
      revShareData: updatedData,
      updatedData: updatedRevShareData
    });
  }

  //Save Rev share edited changes
  handleSaveUpdates(){
    // console.log('updated changes');
    // console.log(this.state.updatedData);

    if(this.state.updatedData.length > 0){
      this.setState({
        showAlert: false,
        inprocess: true,
        error: ''
      });

      APIService.apiRequest(Constants.API_BASE_URL+'/editRevShare', this.state.updatedData, false, 'PUT')
        .then(response => {
          if(response.status===1){
            //Remove Loading Icon
            this.setState({ inprocess: false, showAlert: true, message: response.msg, updatedData: [] });

            // setTimeout(() => {
            //   this.setState({ showAlert: false });
            // }, 4000);
            
          } else {
            this.setState({ inprocess: false, showAlert: true, message: response.msg, error: true });
          }
        })
        .catch(err => {
          this.setState({ inprocess: false, showAlert: true, message: err.msg, error: true });
        });
    }
  }


  render() {
    let columnsToDisplay = [
      { Header: 'Data Type', accessor: 'data_type' },
      { Header: 'Adserver', accessor: 'adserver' },
      { Header: 'Advertiser', accessor: 'advertiser' },
      { Header: 'Monetization Channel', accessor: 'monetization_channel' },
      { Header: 'Ad Type', accessor: 'ad_type' },
      { Header: 'Integration Type', accessor: 'integration_type' },
      { Header: 'API Ad Unit', accessor: 'api_ad_unit' },
      { Header: 'AD Unit', accessor: 'ad_unit' },
      { Header: 'property', accessor: 'property' },
      { Header: 'Created at', accessor: 'created_at' },
      { Header: 'Action', accessor: 'action' }
    ];

    return (
      <div className="app-wrapper accounts">
        {/* <Header client={this.client} data_source={this.data_source} last_updated_date={this.state.last_updated_date} /> */}
        <div id="app-sub-header">
          <h2 className="page-title">{this.page_title}</h2>

          <div className="filters-wrapper">
            <div className="header-filters-wrapper">

              <div className="col missing-adunit">
                <div id="missing-adunit-wrapper" className="form-group">
                  <div className="switch-toggle small">
                    <div className="switch">
                      <input type="checkbox" id="missing-adunit" onChange={this.onSwitchSelect} />
                      <label htmlFor="missing-adunit">Toggle</label>
                    </div>
                    <div className="label">Show Missing Adunits</div>
                  </div>
                </div>
              </div>

              <div className="col date-type">
                <div className="form-group">
                  <SpeedSelect
                    options={this.state.data_types_list}
                    selectedOption={(this.state.allFilters[0]['val']) ? this.state.allFilters[0]['val']: []}
                    onSelect={(e) => this.onOptionSelect(e, 'data_type')}
                    displayKey='name'
                    uniqueKey='id'
                    multiple
                    selectLabel='DataType'
                    maxHeight={120}
                  />
                </div>
              </div>

              <div className="col property">
                {this.state.dimensions['property']!==undefined && 
                  <div className="form-group">
                    <SpeedSelect
                      options={this.state.dimensions['property']}
                      selectedOption={(this.state.selected_dimensions['property']) ? this.state.selected_dimensions['property'] : []}
                      onSelect={(e) => this.onOptionSelect(e, 'property')}
                      multiple
                      displayKey='value'
                      uniqueKey='property'
                      selectLabel='Property'
                      maxHeight={120}
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
                      maxHeight={120}
                    />
                  </div>
                }
              </div>

              <div className="col monetization_channel">
                {this.state.dimensions['monetization_channel']!==undefined && 
                  <div className="form-group">
                    <SpeedSelect
                      options={this.state.dimensions['monetization_channel']}
                      selectedOption={(this.state.selected_dimensions['monetization_channel']) ? this.state.selected_dimensions['monetization_channel'] : []}
                      onSelect={(e) => this.onOptionSelect(e, 'monetization_channel')}
                      multiple
                      displayKey='value'
                      uniqueKey='monetization_channel'
                      selectLabel='Monetization Channel'
                      maxHeight={120}
                    />
                  </div>
                }
              </div>

              <div className="col ad_type">
                {this.state.dimensions['ad_type']!==undefined && 
                  <div className="form-group">
                    <SpeedSelect
                      options={this.state.dimensions['ad_type']}
                      selectedOption={(this.state.selected_dimensions['ad_type']) ? this.state.selected_dimensions['ad_type'] : []}
                      onSelect={(e) => this.onOptionSelect(e, 'ad_type')}
                      multiple
                      displayKey='value'
                      uniqueKey='ad_type'
                      selectLabel='Ad Type'
                      maxHeight={120}
                    />
                  </div>
                }
              </div>

              <div className="col integration_type">
                {this.state.dimensions['integration_type']!==undefined && 
                  <div className="form-group">
                    <SpeedSelect
                      options={this.state.dimensions['integration_type']}
                      selectedOption={(this.state.selected_dimensions['integration_type']) ? this.state.selected_dimensions['integration_type'] : []}
                      onSelect={(e) => this.onOptionSelect(e, 'integration_type')}
                      multiple
                      displayKey='value'
                      uniqueKey='integration_type'
                      selectLabel='Integration Type'
                      maxHeight={120}
                    />
                  </div>
                }
              </div>

              <div className="col ad_unit">
                {this.state.dimensions['ad_unit']!==undefined && 
                  <div className="form-group">
                    <SpeedSelect
                      options={this.state.dimensions['ad_unit']}
                      selectedOption={(this.state.selected_dimensions['ad_unit']) ? this.state.selected_dimensions['ad_unit'] : []}
                      onSelect={(e) => this.onOptionSelect(e, 'ad_unit')}
                      multiple
                      displayKey='value'
                      uniqueKey='ad_unit'
                      selectLabel='Ad Unit'
                      maxHeight={120}
                    />
                  </div>
                }
              </div>

            </div>
          </div>

          {/* {(this.user.organization_id===1 && this.user.privileges['Sellside'].indexOf('REVENUE_SHARE_SETTINGS') > -1) &&
            <div className="action-button-wrapper">
              <button className="btn outline xs btn-save" onClick={this.handleSaveUpdates}>Save</button>
              <button className="btn outline xs btn-add-new" onClick={this.handleAddNewRow}>Add New</button>
            </div>
          } */}
        </div>
        
        <div className="container">
          <div id="adtagmap" className="inner-container">
            <section className="section">
              {this.state.inprocess && <Loader />}
              
              {this.state.showAlert &&
                <AlertBox
                  error={this.state.error}
                  message={this.state.message}
                  onAlertClose={this.handleAlertClose}
                  autoHide={true}
                />
              }
              
              {this.state.adtagmapData &&
                <AdTagMapReactTable 
                  columns={columnsToDisplay}
                  data={this.state.adtagmapData} 
                  client={this.state.client}
                  showAddNewRow={this.state.showAddNewRow}
                  advertisers={this.state.view_type_advertisers}
                  onAddNewRevShare={this.handleOnAddNewRevShare}
                  onUpdateRevShareData={this.handleUpdateRevShareData}
                  user={this.user}
                />
              }
            </section>
          </div>
        </div>
      </div>
    );
  }
}
 
export default AdTagMap;