import React, { Component } from 'react';
import { getUser, getClients } from '../utils/Common';

import '../styles/Global.scss';
import Header from '../components/header/Header';
import Sidebar from '../components/sidebar/Sidebar';
import Footer from '../components/footer/Footer';

class PageNotFound extends Component {
  constructor(props) {
    super(props);

    this.user = getUser();
    this.state = {
      counter: 3
    };
  }
  
  componentDidMount(){
    //Do Nothing
    this.startRedirectionTimer();
  }

  componentDidUpdate(){
    if (this.state.counter !== 0) {
      this.startRedirectionTimer();
    }
    
    if (this.state.counter === 0) {
      let base_url = '/'+this.user.terminal_type.id;
      let default_url = this.user.terminal_type.id==='sellside' ? base_url+'/datatrend' : '';

      // this.props.history.push(this.user.default_home_url!=='' ? this.user.default_home_url : '/'); //redirect to home
      // this.props.history.push(this.user.default_home_url!=='' ? this.user.default_home_url : default_url); //redirect to home
      this.props.history.push('/'); //redirect to home

      return;
    }
  }

  startRedirectionTimer(){
    let timer = setTimeout(() => {
      this.setState({counter: (this.state.counter-1)})
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }


  render(){
    return (
      <div className="app-wrapper">
        <Header />
        <Sidebar />
        
        <div className="container">
          <div className="pagenotfound">
            <h2>Invalid Navigation</h2>
            <div className="redirecting-timer-wrapper">
              <div className="text">Redirecting to home</div>
              
              <div className="countdown-wrap">
                <div className="countdown">
                  <div className="mask full"><div className="fill"></div></div>
                  <div className="mask half"><div className="fill"></div></div>
                  <div className="inside-count">{this.state.counter}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <Footer />
      </div>
    );
  }
  
}
 
export default PageNotFound;