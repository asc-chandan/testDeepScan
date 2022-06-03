import React, { Component } from 'react';
// import * as Constants from '../components/Constants.js';

import '../styles/Dashboard.scss';
import {getUser} from '../utils/Common'; //Import Common Functions

class Home extends Component {
  constructor(props) {
    super(props);
    this.user = getUser();
  }

  componentDidMount(){
    // this.props.history.push('/'+this.user.terminal_type.id);
    let base_url = '/'+this.user.terminal_type.id;
    let default_url = this.user.terminal_type.id==='sellside' ? base_url+'/datatrend' : '';

    this.props.history.push(this.user.default_home_url!=='' ? this.user.default_home_url : default_url); //redirect to home - check and update from 404 page
  }
  
  render(){
    return false;
  }
  
}

 
export default Home;