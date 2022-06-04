import React, { Component } from 'react';
import { Link } from "react-router-dom";
import * as Constants from '../Constants.js';
import subjectObj from '../../subjects/Subject1';
import subject2 from '../../subjects/Subject2';
import { IAMPages } from '../Navigation';
import { getClients, getDefaultHomePageURL } from '../../utils/Common';
import SpeedSelect from '../SpeedSelect/SpeedSelect';
import APIService from '../../services/apiService';
import ClickOutsideListner from '../ClickOutsideListner';
import { sitePages } from '../../components/Navigation';

import moment from 'moment';

import '../../styles/Header.scss';
import { getUser, setUserSession, removeUserSession, getUserDetailsFromToken } from '../../utils/Common';

class Header extends Component {
  constructor(props) {
    super(props);

    if(this.props.isPublicView===undefined){ //if not public view
      this.site_release = window.SITE_VERSION;
      this.user = getUser();
      this.default_terminal_type = 'sellside';
      this.user_privileges = this.user.privileges;
      this.terminalTypes = [];
  
      //set the local storage to 0 on refresh for let refresh token api working when flag stuck to 1
      localStorage.setItem(Constants.SITE_PREFIX + 'reset_token_inprocess', 0);
  
      this.user.terminals.forEach((terminal) => {
        if (
          (this.user_privileges[terminal.display_name] !== undefined && this.user_privileges[terminal.display_name].length > 0) ||
          (this.user_privileges[this.default_terminal_type] !== undefined && this.user_privileges[this.default_terminal_type].indexOf('APEX') >= 0)
        ) {
          this.terminalTypes.push({ id: terminal.display_name, name: terminal.name }); //display_name is being used as id and name as display_name due to backend provision
        }
      });
  
      let current_terminal_type = this.getTerminalType();
      this.liveSightURL = Constants.LIVE_SIGHT_URL;
      this.oldSightURL = Constants.OLD_SIGHT_URL;
      this.isRedirectionRequired = window.location.origin.includes(this.liveSightURL);
  
      this.state = {
        page_title: '',
        showRedirectionToggle: this.props.showToggle && this.props.showToggle === 1,
        checkFromMain: this.props.checkFromMain ? this.props.checkFromMain : false,
        toggleForSightVersion: false,
        clientslistIsOpen: false,
        client: {},
        clientsList: getClients(),
        selected_client: '',
        terminalOptionsList: this.terminalTypes,
        selected_terminal: current_terminal_type,
        last_updated_date: '',
        last_updated_details: [],
        show_full_date_time: false,
        filtered_last_updated_details: [],
        toggleLastUpdatedDate: false,
        toggleProfileMenu: false,
        toggleSitesNavigation: false,
        switchToNewTab: false,
        switchToNextVersion: true,
        toggleInProcess: false,
        sites: [
          // {'name': 'AutoRun', 'url':'https://autorun.bydata.com', 'tagline':'Human resource management and team portal software'},
          { 'name': 'Operations', 'url': 'https://operations.bydata.com', 'tagline': 'Mission Control for process oriented teams' },
          { 'name': 'Sight', 'url': 'https://sight.bydata.com', 'tagline': 'Customized data visualization for decision makers' },
          { 'name': 'Union', 'url': 'https://union.bydata.com', 'tagline': 'Tracking and growth software for business networking' },
          { 'name': 'WorkForce', 'url': 'https://workforce.bydata.com', 'tagline': 'Employment standardization and management software' }
        ],
        themesList: ['dark', 'light'],
        selected_theme: localStorage.getItem(Constants.SITE_PREFIX+'settings') ? JSON.parse(localStorage.getItem(Constants.SITE_PREFIX+'settings')).theme || 'dark' : 'dark',
        userPreferencesJSON: null
      };
  
      this.updateGlobalThemeAttribute(this.state.selected_theme);
  
  
      //Get Client id, name, view_type from header component
      this.view_type = this.props.view_type;
  
      //Handle Logut and Client Toggle
      this.handleLogout = this.handleLogout.bind(this);
      this.toggleClientsList = this.toggleClientsList.bind(this);
      this.handleClientDropDownClose = this.handleClientDropDownClose.bind(this);
      this.onOptionSelect = this.onOptionSelect.bind(this);
      this.getLastSelectedClient = this.getLastSelectedClient.bind(this);
      this.handleToggleLastUpdatedDate = this.handleToggleLastUpdatedDate.bind(this);
      this.handleChange = this.handleChange.bind(this);
      this.handleViewMore = this.handleViewMore.bind(this);
  
      //Toggle Profile Sub Menu
      this.handleToggleSubMenu = this.handleToggleSubMenu.bind(this);
      this.handleBackToOriginalLogin = this.handleBackToOriginalLogin.bind(this);
      this.handleDropDownOpen = this.handleDropDownOpen.bind(this);
  
      //Sites Switch
      this.handleSitesListToggle = this.handleSitesListToggle.bind(this);
      this.handleSiteSwitch = this.handleSiteSwitch.bind(this);
      this.handleClickOutside = this.handleClickOutside.bind(this);
      this.handleDocumentClick = this.handleDocumentClick.bind(this);
      this.onSwitchToNewTab = this.onSwitchToNewTab.bind(this);
      this.handleSwitchToNextVersion = this.handleSwitchToNextVersion.bind(this);
    }
  }

  componentDidMount() {
    if(this.props.isPublicView===undefined){ //if not public view
      subjectObj.subscribe(this.updateHeaderClientInfo.bind(this));
      document.addEventListener('mousedown', this.handleDocumentClick, false);
    }
  }

  componentDidUpdate() {
    if (this.props.isPublicView===undefined && this.state.selected_terminal !== this.getTerminalType()) {
      this.user = getUser();
    }
  }

  componentWillUnmount() {
    if(this.props.isPublicView===undefined){ //if not public view
      subjectObj.unSubscribe(this.updateHeaderClientInfo.bind(this));
      document.removeEventListener('mousedown', this.handleDocumentClick, false);
    }
  }

  getUserPreferences() {
    // console.time('user_preference');
    APIService.apiRequest(Constants.API_BASE_URL + '/user_preference', null, false, 'GET', null)
      .then(response => {
        if (response.version_switch !== undefined) {
          if (this.isRedirectionRequired) {
            if (response.version === 'sight0') {
              window.location.replace(this.oldSightURL);
            }
            this.setState({
              showRedirectionToggle: response.version_switch
            })
          }
        

          if (response.status === 1) {
            this.setState({ 
              userPreferencesJSON: response.data.user_preference_json,
              selected_theme : response.data.user_preference_json.theme

            },()=>{
              this.updateGlobalThemeAttribute(this.state.selected_theme);

              //update local storage
              let sightSettings = localStorage.getItem(Constants.SITE_PREFIX+'settings');
              if(sightSettings && sightSettings['user_preference']!==undefined){
                let updatesPreference = JSON.parse(sightSettings);
                updatesPreference['user_preference'] = response.data.user_preference_json;
                sightSettings = updatesPreference;
              } else {
                sightSettings = {'user_preference': response.data.user_preference_json}
              }
              localStorage.setItem(Constants.SITE_PREFIX+'settings', JSON.stringify(sightSettings));
            });
          } else {
            this.setState({ userPreferencesJSON: '' }, ()=>{
              localStorage.setItem(Constants.SITE_PREFIX+'settings', JSON.stringify({'user_preference': {}}));
            })
          }
        }
      })
      .catch(err => {
        console.log('Error:Couldn\'t fetch user preferences');
      });
  }

  handleDocumentClick(e) {
    e.stopPropagation();
    if (e.target.matches('.btn-hamburger')) { return; } // check for save view toggle button click 
    if (this.sitesListNode && this.sitesListNode.contains(e.target)) { return; }
    this.handleClickOutside();
  }

  handleClickOutside() {
    this.setState({ toggleSitesNavigation: false });
  }

  //hack to handle sub header zindex so that select dropdown got visible
  handleDropDownOpen(isSelectOpen) {
    let subHeader = document.getElementById('app-sub-header');
    if (subHeader !== null) {
      if (isSelectOpen) {
        document.getElementById('app-sub-header').classList.add('lower-zIndex');
      } else {
        this.removeSubHeaderZIndexClass();
      }
    }
  }


  // handle click event of logout button
  handleLogout() {
    removeUserSession();
    // this.props.history.push('/login');
  }

  //Show/Hide Dropdown Menu
  handleToggleSubMenu(e) {
    e.preventDefault();
    this.setState({ toggleProfileMenu: !this.state.toggleProfileMenu }, () => {
      if (this.state.toggleProfileMenu) {
        const subheaderAvailable = document.getElementById('app-sub-header');
        if(subheaderAvailable){
          subheaderAvailable.classList.add('lower-zIndex');
        }
      } else {
        this.removeSubHeaderZIndexClass();
      }
    });
  }

  removeSubHeaderZIndexClass() {
    if(document.getElementById('app-sub-header')){
      document.getElementById('app-sub-header').classList.remove('lower-zIndex');
    }
  }


  IAMNavigation() {
    if (this.user_privileges[this.state.selected_terminal.id] !== undefined) {
      const user_privileges = this.user_privileges[this.state.selected_terminal.id];

      return (<ul className="nav">
        {IAMPages.map((item, i) => {
          let nav_class = (item.sub_pages) ? 'nav-item has-submenu' : 'nav-item';
          let default_icon_class = 'icon ';
          let nav_icon_class = (item.icon) ? default_icon_class.concat(item.icon) : 'icon';
          let list = '';

          //check if user has privilege to see menu
          if (user_privileges.indexOf(item.privilege) >= 0) {
            list = <li key={`main-item-${i}`} className={nav_class}>
              <Link className="nav-link" to={item.url} onClick={this.handleToggleSubMenu}>
                <span className={nav_icon_class}></span>
                <span className="text">{item.title}</span>
              </Link>

              {this.state.toggleProfileMenu &&
                <ClickOutsideListner onOutsideClick={() => this.setState({ toggleProfileMenu: false }, () => this.removeSubHeaderZIndexClass())}>
                  <div className="sub-menu-wrapper">
                    <span className="nav-text">{item.title}</span>
                    <ul className="sub-nav">
                      {item.sub_pages && 
                        item.sub_pages.map((subitem, index) => {
                          //check if user has privilege to see sub menu
                          if (user_privileges.indexOf(subitem.privilege) >= 0) {
                            return <li key={`sub-item-${index}`}><Link className="nav-link" to={subitem.url}>{subitem.title}</Link></li>
                          }
                        })
                      }
                      <li key="sub-item-logout"><Link className="nav-link" to="" onClick={this.handleLogout}>Logout</Link></li>
                    </ul>
                  </div>
                </ClickOutsideListner>
              }
            </li>
          }

          return list;
        })}
      </ul>)
    }
  }

  updateHeaderClientInfo(obj) {
    let stateObj = {
      last_updated_date: obj.last_updated_date,
      show_full_date_time: (obj.show_full_date_time !== undefined) ? obj.show_full_date_time : false,
      last_updated_details: obj.last_updated_details,
      filtered_last_updated_details: obj.last_updated_details,
      selected_client: obj.client,
      client: obj.client
    };
    if (obj.page_title && obj.page_title !== '') {
      stateObj['page_title'] = obj.page_title;

      if (!this.state.checkFromMain) {
        this.getUserPreferences();
      } else {
        this.setState({ checkFromMain: false });
      }
    }

    this.setState(stateObj, () => {
      document.getElementById('app-main-wrapper').setAttribute('class', this.state.page_title.replaceAll(' ', '-').toLowerCase()); // add class to parent wrapper
    });
  }


  //Show/Hide Switch Apps Navigation
  handleSitesListToggle() {
    if (this.user.organization_id > 1) return;
    this.setState({ toggleSitesNavigation: !this.state.toggleSitesNavigation });
  }

  //Open clicked site in new/same tab
  handleSiteSwitch(e, url) {
    e.preventDefault();
    if (this.state.switchToNewTab) {
      window.open(url);
    } else {
      window.location.href = url;
    }
  }

  //On Switch Tab
  onSwitchToNewTab(event, id) {
    this.setState({ switchToNewTab: event.target.checked });
  }

  //Switch to beta version of site
  handleSwitchToNextVersion(e) {
    this.setState({
      switchToNextVersion: !this.state.switchToNextVersion
    }, () => {
      setTimeout(() => {
        if (!this.state.switchToNextVersion) {
          window.location.href = 'https://sight.bydata.com/';
        }
      }, 10);
    });
  }

  toggleClientsList() {
    if (this.user.organization_id !== 1) return false;
    this.setState({ clientslistIsOpen: !this.state.clientslistIsOpen });
  }

  handleClientDropDownClose() {
    this.toggleClientsList();
  }

  //Handle toggle last updated date
  handleToggleLastUpdatedDate() {
    this.setState({ toggleLastUpdatedDate: !this.state.toggleLastUpdatedDate });
  }

  formatLastUpdatedDate(lastupdateddate, date_format) {
    // let newDate = moment(lastupdateddate, moment.ISO_8601).format('MMM DD, YYYY');
    let formattedDate = moment(lastupdateddate, moment.ISO_8601).toDate();
    return moment(formattedDate).format(date_format);
  }

  formatDate(date, date_format) {
    return moment(date).format(date_format);
  }

  //On Client Select Change
  onOptionSelect(event, type) {
    if (type === 'client') {
      this.setState({ selected_client: event });

      //Update the last selected client in local storage
      let userStr = localStorage.getItem(Constants.SITE_PREFIX + 'user');
      userStr = (userStr) ? JSON.parse(userStr) : {};
      if (event.id === userStr['last_fetched_client']) return false; //if last selected client and currenct selected client id is same return false

      userStr['last_fetched_client'] = event.id;
      localStorage.setItem(Constants.SITE_PREFIX + 'user', JSON.stringify(userStr));

      //Update the last selected client in db
      this.updateLastSelectedClient(event);

      //notify the downward components about the client change
      setTimeout(() => {
        subject2.notify({
          client: this.state.selected_client,
        })
      });
    }

    //set terminal type
    if (type === 'terminal_type') {
      //Update the last selected client in local storage
      let userStr = localStorage.getItem(Constants.SITE_PREFIX + 'user');
      userStr = (userStr) ? JSON.parse(userStr) : {};
      userStr['terminal_type'] = event;
      // userStr['default_home_url'] = '/' + event.id;
      userStr['default_home_url'] = '/';
      localStorage.setItem(Constants.SITE_PREFIX + 'user', JSON.stringify(userStr));

      this.setState({ selected_terminal: event }, () => {
        //if default home url contains selcted terminal id, use default_home_url as redirect url
        // let default_url = userStr.default_home_url.includes(event.id) ? userStr.default_home_url : '/' + event.id;
        subject2.notify({
          terminal: this.state.selected_terminal,
        })

        let default_url = '/';
        this.props.history.push(default_url);
      });
    }

    //set terminal type
    if (type === 'terminal_type') {
      let terminal_type = event;
      this.setState({ selected_terminal: terminal_type });

      //Update the last selected client in local storage
      let user_info = localStorage.getItem(Constants.SITE_PREFIX + 'user');
      user_info = (user_info) ? JSON.parse(user_info) : {};
      user_info['terminal_type'] = event;

      //used in login component as well - optimized it 
      // let default_home_url = getDefaultHomePageURL(sitePages, terminal_type, user_info);
      let default_home_url = '/';

      user_info.default_home_url = default_home_url;
      localStorage.setItem(Constants.SITE_PREFIX + 'user', JSON.stringify(user_info));
      this.setState({
        default_home_url: default_home_url
      }, () => {
        //if default home url contains selcted terminal id, use default_home_url as redirect url
        // let default_url = default_home_url.includes(terminal_type.id) ? user_info.default_home_url : '/' + terminal_type.id;
        subject2.notify({
          terminal: this.state.selected_terminal,
        })

        let default_url = '/';
        this.props.history.push(default_url);
      });
    }

    //set theme
    if (type === 'theme') {
      this.setState({ selected_theme: event }, () => {
        this.updateGlobalThemeAttribute(this.state.selected_theme);
        this.updateGlobalThemeInDB(this.state.selected_theme);
        // update the theme preference in localstorage as well
        let sightSettings = localStorage.getItem(Constants.SITE_PREFIX+'settings') ? JSON.parse(localStorage.getItem(Constants.SITE_PREFIX+'settings')) : {};
        if(sightSettings){
          sightSettings['user_preference']['theme'] = this.state.selected_theme;
        } else {
          sightSettings = {'user_preference': {'theme': this.state.selected_theme}};
        }
        
        localStorage.setItem('sight_settings', JSON.stringify(sightSettings));
      });
    }
  }

  updateGlobalThemeAttribute(theme) {
    document.getElementsByTagName("body")[0].setAttribute("data-theme", theme);
  }

  updateGlobalThemeInDB(theme) {
    // do nothing if current preferences have not been fetched yet
    if (this.state.userPreferencesJSON === null) { return }
    const requestType = this.state.userPreferencesJSON === '' ? 'PUT' : 'POST';
    const payload = { user_preference_json : {...this.state.userPreferencesJSON, theme: theme }};

    APIService.apiRequest(Constants.API_BASE_URL + '/user_preference', payload, false, requestType, null)
      .then(response => {
      })
      .catch(err => {
      });
  }


  //Update Last Selected Client in DB
  updateLastSelectedClient(client) {
    let apiPayload = { client_id: client.id };

    //Send original logged in token on client account switch (on login as)
    let authToken = null;
    if (localStorage.getItem(Constants.SITE_PREFIX + 'init_token')) {
      authToken = 'Bearer ' + localStorage.getItem(Constants.SITE_PREFIX + 'init_token');
    }

    setTimeout(() => {
      APIService.apiRequest(Constants.API_BASE_URL + '/changeClient', apiPayload, false, 'PUT', null, authToken)
        .then(response => {
          if (response.status === 1) {
            console.log('Client saved successfully');
          } else {
            console.log('Error1: Client didn\'t save');
          }
        })
        .catch(err => {
          console.log('Error2: Client didn\'t save');
        });
    }, 0);
  }

  //Terminal Type
  getTerminalType() {
    let terminal_type;
    let userStr = localStorage.getItem(Constants.SITE_PREFIX + 'user');
    userStr = (userStr) ? JSON.parse(userStr) : {};
    terminal_type = userStr['terminal_type'];
    return terminal_type;
  }

  //Get the last selected client
  getLastSelectedClient() {
    if (this.state.clientsList.length === 0) {
      return;
    }
    //if client is not selected in state
    if (this.state.selected_client !== undefined && this.state.selected_client !== '') {
      return this.state.selected_client.name;
    } else {
      //if user has last_fetched_client else return first client from client index
      if (this.user.last_fetched_client !== undefined && this.user.last_fetched_client !== '') {
        let clientIndex = this.state.clientsList.findIndex(x => x.id === this.user.last_fetched_client);
        return this.state.clientsList[clientIndex].name;
      } else {
        return this.state.clientsList[0].name;
      }
    }
  }

  //Filter Last Updated Date
  handleChange(e) {
    // Variables to hold the original and new version of the list
    let currentList = this.state.last_updated_details;
    let newList = [];

    // If the search bar isn't empty
    if (e.target.value !== "") {
      // based on the search terms
      newList = currentList.filter(item => {
        const lc = item.name.toLowerCase(); // change current item to lowercase
        const filter = e.target.value.toLowerCase(); // change search term to lowercase
        // check to see if the current list item includes the search term
        // If it does, it will be added to newList. Using lowercase eliminates
        // issues with capitalization in search terms and search content
        return lc.includes(filter);
      });
    } else {
      newList = this.state.last_updated_details; // If the search bar is empty, set newList to original task list
    }
    // Set the filtered state based on what our rules added to newList
    this.setState({
      filtered_last_updated_details: newList
    });
  }

  //Check if login as is active
  isLoginAsActive() {
    let user_token = localStorage.getItem(Constants.SITE_PREFIX + 'init_token');
    if (user_token !== undefined && user_token && user_token !== '') {
      return user_token;
    }
    return false;
  }

  //Back to user's original login
  handleBackToOriginalLogin() {
    let access_token = this.isLoginAsActive();
    if (access_token === undefined || !access_token || access_token === '') return;

    //Update existing access token and user info with original one
    let user_details = getUserDetailsFromToken(access_token);
    let user_info = user_details.identity;
    user_info.terminal_type = { id: 'sellside', name: 'Sell Side' };

    setUserSession(access_token, user_info); //Set token and user details in session

    //Remove init token to hide back to your login button
    localStorage.removeItem(Constants.SITE_PREFIX + 'init_token');

    //Redirect user to last selected client
    window.location.href = '/sellside';
  }

  handleViewMore(e) {
    e.preventDefault();
    this.setState({ toggleLastUpdatedDate: false });
    this.props.history.push('/sellside/api/data_status');
  }

  handleSightVersionChange(e) {
    this.setState({ toggleInProcess: true, toggleForSightVersion: !this.state.toggleForSightVersion }, () => {
      APIService.apiRequest(Constants.API_BASE_URL + '/user_sight_version', { "version": "sight0" }, false, 'PUT')
      .then((response) => {
        if (response) {
          window.location.replace(this.oldSightURL);
        }
      })
      .catch(err => {
        this.setState({ toggleInProcess: false, toggleForSightVersion: !this.state.toggleForSightVersion })
        console.log('Error: Couldn\'t set version');
      });
    })
  }

  //redirect to login page
  handleLoginPageRedirect(){
    window.location.href = '/login';
  }

  render() {
    let lastUpdatedDate = '';
    let clientInfo = '';
    // let terminal_type = '';
    let clients_dropdown_class = '';
    
    if(this.props.isPublicView===undefined){
      lastUpdatedDate = (this.state.last_updated_date) ? this.state.last_updated_date : '';
      clientInfo = '';
      // terminal_type = this.getTerminalType();
      clients_dropdown_class = (this.user.organization_id !== 1) ? "na" : "";
      
      clientInfo = <div className={'global-filters-wrapper ' + clients_dropdown_class}>
        <div id="client-filter-wrapper" className="mar-r15">
          {(this.state.client) &&
            <div id="client-filter" className="client-filter">
              <div className="filters">
                <SpeedSelect
                  options={this.state.clientsList} // required
                  selectedOption={(this.state.selected_client) ? this.state.selected_client : ""} // required
                  onSelect={(e) => this.onOptionSelect(e, 'client')} // required
                  displayKey='name' // required if options is an array of objects, 
                  uniqueKey='id' // required if options is an array of objects
                  selectLabel='Select' // optional, Default='Select'. It is always visible in case of multiple and visible untill a selection is made in case of single
                  maxHeight={210} // optional, in pixel, Default is 450px
                  prominentLabel='Account'
                  isLabelClickable={true}
                  dropdownAlignment='right'
                  onDropDownOpen={this.handleDropDownOpen}
                />
              </div>
            </div>
          }
        </div>

        <div id="terminal-filter">
          <div className="filters">
            <SpeedSelect
              options={this.state.terminalOptionsList} // required
              selectedOption={(this.state.selected_terminal) ? this.state.selected_terminal : ""} // required
              onSelect={(e) => this.onOptionSelect(e, 'terminal_type')} // required
              displayKey='name' // required if options is an array of objects, 
              uniqueKey='id' // required if options is an array of objects
              selectLabel='Select' // optional, Default='Select'. It is always visible in case of multiple and visible untill a selection is made in case of single
              maxHeight={210} // optional, in pixel, Default is 450px
              prominentLabel='Terminal'
              isLabelClickable={true}
              dropdownAlignment='right'
              onDropDownOpen={this.handleDropDownOpen}
            />
          </div>
        </div>
      </div>
    }

    return (
      <header id="app-header" className={this.props.isPublicView ? 'pad-l10' : ''}>
        <div className="app-header-inner">
          <div className="app-header-left">
            <h1 className="site-title">
              <a href='/' className="logo"><span>Sight</span></a>
            </h1>

            {this.props.isPublicView===undefined && this.state.page_title !== '' &&
              <div className="breadcrumb">
                <ul>
                  <li>{this.state.page_title}</li>
                </ul>
              </div>
            }

            {this.props.isPublicView===undefined && this.state.showRedirectionToggle ? (
              <div className={'switch-toggle small'}>
                <div className="switch">
                  <input type="checkbox" checked={this.state.toggleForSightVersion} onChange={this.state.toggleInProcess ? () => { } : (e) => this.handleSightVersionChange(e)} />
                  <label></label>
                </div>
                <div className="label">Old</div>
              </div>
            ) : (<></>)}
          </div>

          <div className="app-header-right">
            {this.props.isPublicView===undefined &&
              <>
                {this.isLoginAsActive() &&
                  <button className="btn outline xs btn-switch-user" onClick={this.handleBackToOriginalLogin}>back to your login</button>
                }

                {clientInfo}

                <div className="sites-list-opener">
                  <button className="btn-support"></button>
                  {(lastUpdatedDate !== 'NA' && lastUpdatedDate !== '') &&
                    <div className="last-updated-wrapper">
                      <span className="last-updated" onClick={this.handleToggleLastUpdatedDate}>{this.formatDate(this.state.last_updated_date, (this.state.show_full_date_time ? 'MM/DD/YYYY HH:mm:ss' : 'MM/DD/YYYY'))}</span>

                      {this.state.toggleLastUpdatedDate &&
                        <ClickOutsideListner onOutsideClick={() => this.setState({ toggleLastUpdatedDate: false })}>
                          <div className={'last-updated-details' + (this.state.show_full_date_time ? ' full_date_time' : '')}>
                            <div className="title-wrapper">
                              <div className="title"><span className="name">Last Updated Date</span> <span className="date">{this.formatDate(this.state.last_updated_date, (this.state.show_full_date_time ? 'MM/DD/YYYY HH:mm:ss' : 'MM/DD/YYYY'))}</span></div>

                              {(this.state.last_updated_details && this.state.last_updated_details.length > 0) &&
                                <input type="text" id="search-client" className="field-control" onChange={this.handleChange} placeholder="Search..." />
                              }
                            </div>

                            {(this.state.last_updated_details && this.state.last_updated_details.length > 0) &&
                              <div className="list">
                                <ul>
                                  {
                                    this.state.filtered_last_updated_details.map((item, i) => {
                                      return <li key={i} className={(item.last_updated_date_text === 'Delayed') ? 'delayed' : ''}><span className="name">{item.name}</span> <span className="date">{this.formatLastUpdatedDate(item.last_updated_date, 'MM/DD/YYYY')}</span></li>
                                    })
                                  }
                                </ul>
                              </div>
                            }

                            {(this.user.organization_id === 1 && this.state.last_updated_details && this.state.last_updated_details.length > 0) &&
                              <button className="btn-view-more" onClick={this.handleViewMore}>View more</button>
                            }
                          </div>
                        </ClickOutsideListner>
                      }
                    </div>
                  }
                  <div className="profile-nav-wrapper">{this.IAMNavigation()}</div>
                  <button className="btn-hamburger" onClick={this.handleSitesListToggle}></button>
                </div>

                {/* {(this.state.toggleSitesNavigation && this.user.organization_id == 1) && */}
                {(this.state.toggleSitesNavigation) &&
                  <div className="sites-list-wrapper" ref={node => { this.sitesListNode = node; }}>
                    <div className="app-details">
                      <div className="app-details-inner">
                        <h2>Sight byData</h2>
                        <div className="site-version">{this.site_release}</div>
                      </div>
                    </div>
                    
                    <div className="site-menu-settings">
                      <div className="site-settings">
                        <div className="ui-settings-wrapper">
                          <div className="theme-changer">
                            <SpeedSelect
                              options={this.state.themesList} // required
                              selectedOption={(this.state.selected_theme) ? this.state.selected_theme : "dark"} // required
                              onSelect={(e) => this.onOptionSelect(e, 'theme')} // required
                              displayKey='name' // required if options is an array of objects, 
                              uniqueKey='id' // required if options is an array of objects
                              selectLabel='Select' // optional, Default='Select'. It is always visible in case of multiple and visible untill a selection is made in case of single
                              maxHeight={210} // optional, in pixel, Default is 450px
                              prominentLabel='Theme'
                              disableSearch
                            />
                          </div>
                        </div>
                        <div className="menubar-settings">
                          <div className="menubar-title">
                            <h2>Menubar Settings</h2>
                            <span>Auto hide</span>
                          </div>
                          <div className="switch-toggle small">
                            <div className="label">Controlbar 2</div>
                            <div className="switch">
                              <input type="checkbox" id="controlbar-2" />
                              <label for="controlbar-2">Toggle</label>
                            </div>
                          </div>
                          <div className="switch-toggle sidebar small">
                            <div className="label">Sidebar</div>
                            <div className="switch">
                              <input type="checkbox" id="sidebar" />
                              <label for="sidebar">Toggle</label>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="sites-list">
                        <div className="heading-wrapper">
                          <div className="heading"><span>Switch App</span></div>

                          <div className="open-tab-option">
                            <div className="switch-toggle small">
                              <div className="label">New Tab</div>
                              <div className="switch">
                                <input type="checkbox" id="switch-tab" onChange={this.onSwitchToNewTab} />
                                <label htmlFor="switch-tab">Toggle</label>
                              </div>
                            </div>
                          </div>
                        </div>

                        {
                          this.state.sites.map((item, i) => {
                            return (
                              <div key={i} className="site" onClick={(e) => this.handleSiteSwitch(e, item.url)}>
                                <h3 className="site-name">{item.name}</h3>
                                <p className="site-tagline">{item.tagline}</p>
                              </div>
                            )
                          })
                        }
                      </div>
                    </div>
                  </div>
                }
              </>
            }

            {this.props.isPublicView!==undefined &&
              <button className='btn btn-small btn-login' onClick={this.handleLoginPageRedirect}>Login</button>
            }
          </div>
        </div>
      </header>
    );
  }
}

export default Header;