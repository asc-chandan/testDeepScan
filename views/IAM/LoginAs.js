import React, { Component } from 'react';
import * as Constants from '../../components/Constants.js';
import subjectObj from '../../subjects/Subject1';
import Loader from '../../components/Loader';
import { sitePages } from '../../components/Navigation';

import '../../styles/LoginAs.scss';

import { getKeyByValue, getClients, getUser, setLoginAsUserSession, getUserDetailsFromToken } from '../../utils/Common'; //Import Common Functions
import APIService from '../../services/apiService'; //Import Services

import LoginAsReactTable from './LoginAsReactTable';
import LoginAsFilters from './LoginAsFilters';

class Console extends Component {
  constructor(props) {
    super(props);

    //Get Client & View Type
    this.user = getUser();
    
    this.state = this.getInitVariables();

    this.handleFilterChange = this.handleFilterChange.bind(this);
    this.handleLoginAs = this.handleLoginAs.bind(this);
  }

  //Set initial state variables
  getInitVariables(){
    let initialObj = {
      inprocess: false,
      error: "",
      usersList: [],
      filteredUsersList: [],
      orgList: []
    }
    return initialObj;
  }

  componentDidMount(){
    this.handleLoadScripts();
  }

  //Reload the page if client id/name change from url
  componentDidUpdate(prev_props){
    if(prev_props.match.params.id!==this.props.match.params.id){
      // this.client = getKeyByValue(getClients(), this.props.match.params.id);
      this.user = getUser();

      //Update State Values
      this.setState(this.getInitVariables());
    }
  }

  handleLoadScripts(){
    this.getUsersOrgList();
  }


  getUsersOrgList(){
    //Input Validations
    this.setState({ error: '', inprocess: true});

    APIService.apiRequest(Constants.API_BASE_URL+'/getOrganizationAndUserList', null, false, 'GET')
      .then(response => {
        if(response.status===1 && response.organization!==undefined && response.user!==undefined){
          this.setState({
            inprocess: false, 
            orgList: JSON.parse(response.organization),
            filteredUsersList: JSON.parse(response.user),
            usersList: JSON.parse(response.user)
          });
        } else {
          this.setState({inprocess: false, error: response.msg});
        }
      })
      .catch(err => {
        this.setState({ inprocess: false, error: err.msg });
      });
  }

  getIdsArr(arr){
    let newArr = [];
    arr.forEach((item) => {
      newArr.push(item.id.toString());
    });
    return newArr;
  }

  handleFilterChange(args){
    let filteredUsers = [];
    
    if(args){
      this.state.usersList.forEach((item, i) => {
        const index = args.findIndex(ele => ele.id === item.organization_id);
        if(index > -1){
          filteredUsers.push(item);
        }
      });
    }

    this.setState({
      filteredUsersList: filteredUsers
    });
  }

  //Handle Login As Button Click
  handleLoginAs(args){
    if(args==='' && !args) return false;

    let apiPayload = {"username": args}
    this.setState({ error: '', inprocess: true});

    APIService.apiRequest(Constants.API_BASE_URL+'/auth/viewAs', apiPayload)
      .then(response => {
        if(response.status==1 && response.access_token!==undefined){
          // this.setState({ inprocess: false });

          //Redirect to home page after succcessful login
          let user_details = getUserDetailsFromToken(response.access_token);
          let user_info = user_details.identity;
          let terminal_type = {id: 'sellside', name: 'Sell Side'};
          if(user_info.clients.length===0 && user_info.organization_id > 1 && user_info.privileges['klay_media']!==undefined){
            terminal_type = {id: 'klay_media', name: 'Klay Media'};
          }
          user_info.terminal_type = terminal_type;
          
          if(user_info.clients.length > 0 && user_info.organization_id > 1){
            user_info.last_fetched_client = user_info.clients[0]['id'];
          } else {
            user_info.last_fetched_client = '';
          }
        

          // check available navigations and redirect there
          let sidePages = sitePages[terminal_type.id];
          let availablePages = [];
          let default_home_url = '/'+terminal_type.id;

          if(user_info.privileges[terminal_type.id]!==undefined){
            sidePages.forEach((item) => {
              let parent_nav_url = item.url;
              let hasNavAccess = false;
              if(typeof item.privilege==='object'){
                hasNavAccess = (item.privilege.some(r=> user_info.privileges[terminal_type.id].indexOf(r) >= 0) || (user_info.privileges['sellside'] && user_info.privileges['sellside'].indexOf('APEX') > -1));

                //Set first element url under parent nav
                let subPages = [];
                (item.sub_pages && item.sub_pages.forEach((subitem) => {
                  if(user_info.privileges[terminal_type.id].indexOf(subitem.privilege) > -1 || (user_info.privileges['sellside'] && user_info.privileges['sellside'].indexOf('APEX') > -1)){
                    subPages.push(subitem);
                  }
                }));
                if(subPages.length > 0){
                  parent_nav_url = subPages[0]['url']; //set first child element url as parent nav url
                }
              } else {
                hasNavAccess = (user_info.privileges[terminal_type.id].indexOf(item.privilege) > -1 || (user_info.privileges['sellside'] && user_info.privileges['sellside'].indexOf('APEX') > -1));
              }

              if(hasNavAccess){
                availablePages.push(parent_nav_url);
              }
            });
          }
 
          if(availablePages.length > 0){
            default_home_url = availablePages[0];
          }
 
          //set default home url under local storage for future redirection
          user_info['default_home_url'] = default_home_url;

          let originalUserToken = localStorage.getItem(Constants.SITE_PREFIX+'token');
          setLoginAsUserSession(originalUserToken, response.access_token, user_info); //Set token and user details in session
 
          //Redirect User to Last Select Client
          window.location.href = default_home_url;
        } else {
          this.setState({inprocess: false, error: response.msg});
        }
      })
      .catch(err => {
        this.setState({ inprocess: false, error: err.msg });
      });
  }


  render() {
    //Generate Columns to Display
    let columnsToDisplay = [];
    if(this.state.usersList.length > 0){
      let columns = Object.keys(this.state.usersList[0]);
      columns.forEach((item) => {
        if(item==='id') return;

        columnsToDisplay.push({
          Header: item.replace(/_/g, " "), 
          accessor: item
        });
      });

      columnsToDisplay.push({Header: 'Action', accessor: 'action'})
    }

    return (
      <div className="app-wrapper login-as-view">
        <div id="app-sub-header">
          <h2 className="page-title">Login As</h2>

          <div className="filters-wrapper">
            <LoginAsFilters 
              organizations={this.state.orgList}
              onFilterChanged={this.handleFilterChange}
            />
          </div>
        </div>

        {/* Analysis Landing View */}
        <div className="container">
          <div className="inner-wrapper">
            <div id="section" className="section">
              {this.state.inprocess && <Loader />}

              <div className="content">
                {this.state.filteredUsersList.length > 0 &&
                  <LoginAsReactTable 
                    columns={columnsToDisplay}
                    data={this.state.filteredUsersList}
                    onLoginAs={this.handleLoginAs}
                  />
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
 
export default Console;