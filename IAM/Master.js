import React, { Component } from 'react';
import { getUser } from '../utils/Common';
import '../styles/Global.scss';

class Profile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: getUser() // Get User Details
    };
    this.page_title = "Master";
  }
  
  componentDidMount(){
    //Do Nothing
  }

  render(){
    return (
      <div className="app-wrapper">
        <div id="app-sub-header">
          <h2 className="page-title">{this.page_title}</h2>
        </div>
        
        <div className="container">
          <h2>Master</h2>
        </div>
      </div>
    );
  }
  
}
 
export default Profile;