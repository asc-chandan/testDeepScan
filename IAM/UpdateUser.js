import React, { Component } from 'react';
import { getUser } from '../utils/Common';
import '../styles/Global.scss';


class Profile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: getUser() // Get User Details
    };
    this.page_title = "Update User";
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
        </div>
      </div>
    );
  }
  
}
 
export default Profile;