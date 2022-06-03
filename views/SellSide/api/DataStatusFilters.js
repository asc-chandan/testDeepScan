import React, { Component } from 'react';
import * as Constants from '../../../components/Constants.js';
import SpeedSelect from '../../../components/SpeedSelect/SpeedSelect';

import { getClients, getUser } from '../../../utils/Common'; //Import Common Functions

//Import Services
import APIService from '../../../services/apiService';
import moment from 'moment';

class ConsoleFilters extends Component {
  constructor(props) {
    super(props);

    this.clients = getClients();

    this.state = {
      inprocess: false,
      error: '',
      selected_client: null,
      advertiser_list: [],
      selected_advertiser: null,
      selected_status: null,
      allFilters: [
        {'id':'client', 'val':''},
        {'id':'advertiser', 'val':''},
        {'id':'status', 'val':''}
      ]
    };
    // this.client = this.props.client;
    this.onOptionSelect = this.onOptionSelect.bind(this);
  }
  
  componentDidMount(){
  }

  componentDidUpdate(prev_props){
    // if( (this.props.client.id!==prev_props.client.id) ||
    //     (this.props.view_type && prev_props.view_type!==this.props.view_type) ){
      
    // }
  }


  //On Select Change
  onOptionSelect(event, id){
    var item_type = id;
    var item_val = event;
    
    var index = this.state.allFilters.findIndex(p => p.id == item_type);
    const obj = this.state.allFilters[index];

    this.setState({
      ['selected_'+id]: item_val,
      allFilters: [
        ...this.state.allFilters.slice(0, index),
        { ...obj, val: item_val},
        ...this.state.allFilters.slice(index + 1)
      ]
    });

    setTimeout(() => {
      console.log(this.state.allFilters);
      this.props.onFilterChanged(this.state.allFilters); 
    },0);
  }

  render() {
    let statusList = [{id: "1", name:'select'}, {id: "2", name:'delayed'}, {id: "3", name:'updated'}];

    return (
      <div className="header-filters-wrapper">
        <div className="col client">
          {this.clients!==undefined && 
            <div className="form-group">
              <SpeedSelect
                options={this.clients}
                selectedOption={(this.state.selected_client) ? this.state.selected_client : []}
                onSelect={(e) => this.onOptionSelect(e, 'client')}
                displayKey='name'
                uniqueKey='id'
                selectLabel='Client'
                multiple
                maxHeight='140'
              />
            </div>
          }
        </div>

        <div className="col advertiser">
          {(this.props.advertisers!==undefined && this.props.advertisers.length > 0 ) && 
            <div className="form-group">
              <SpeedSelect
                options={this.props.advertisers}
                selectedOption={(this.state.selected_advertiser) ? this.state.selected_advertiser : []}
                onSelect={(e) => this.onOptionSelect(e, 'advertiser')}
                displayKey='name'
                uniqueKey='id'
                selectLabel='Advertiser'
                multiple
                maxHeight='140'
              />
            </div>
          }
        </div>

        <div className="col status">
          {statusList && 
            <div className="form-group">
              <SpeedSelect
                options={statusList}
                selectedOption={(this.state.selected_status) ? this.state.selected_status : ""}
                onSelect={(e) => this.onOptionSelect(e, 'status')}
                displayKey='name'
                uniqueKey='id'
                selectLabel='Status'
                // multiple
                maxHeight='140'
              />
            </div>
          }
        </div>
      </div>
    );
  }
}

export default ConsoleFilters;