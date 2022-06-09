import React, { Component } from 'react';
import SpeedSelect from '../../components/SpeedSelect/SpeedSelect';

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

  componentDidUpdate(){
  }


  //On Select Change
  onOptionSelect(event){
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
                onSelect={(e) => this.onOptionSelect(e)}
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