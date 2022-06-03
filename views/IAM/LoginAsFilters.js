import React, { Component } from 'react';
import * as Constants from '../../components/Constants.js';
import SpeedSelect from '../../components/SpeedSelect/SpeedSelect';

import { getClients, getUser } from '../../utils/Common'; //Import Common Functions

//Import Services
import APIService from '../../services/apiService';

class LoginAsFilters extends Component {
  constructor(props) {
    super(props);
    // this.clients = getClients();

    this.state = {
      inprocess: false,
      error: '',
      selected_org: []
    };
    this.onOptionSelect = this.onOptionSelect.bind(this);
  }
  
  componentDidMount(){
  }

  componentDidUpdate(prev_props){
  }


  //On Select Change
  onOptionSelect(event, id){
    var item_type = id;
    var item_val = event;
    
    this.setState({
      'selected_org': item_val
    });

    setTimeout(() => {
      this.props.onFilterChanged(item_val); 
    },0);
  }

  render() {
    return (
      <div className="header-filters-wrapper">
        <div className="col client">
          {this.props.organizations!==undefined && 
            <div className="form-group">
              <SpeedSelect
                options={this.props.organizations}
                selectedOption={this.state.selected_org}
                onSelect={(e) => this.onOptionSelect(e, 'org')}
                displayKey='name'
                uniqueKey='id'
                selectLabel='Organization'
                multiple
                maxHeight='140'
              />
            </div>
          }
        </div>
      </div>
    );
  }
}

export default LoginAsFilters;