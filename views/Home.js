import React, { Component } from 'react';
import { Link } from "react-router-dom";
import { sitePages } from '../components/Navigation';
import subjectObj from '../subjects/Subject1';
import subject2 from '../subjects/Subject2';
import { getKeyByValue, getClients, getUser } from '../utils/Common';
import '../styles/Home.scss';
import ClickOutsideListener from '../components/SpeedSelect/components/ClickOutsideListener';
import * as Constants from '../components/Constants.js';
import '../styles/Dashboard.scss';

class Home extends Component {
  constructor(props) {
    super(props);
    this.user = getUser();
    this.user_privileges = this.user.privileges;
    this.default_terminal_type = 'sellside';
    this.page_title = 'Home';
    let client_id = this.user.last_fetched_client;

    this.state = {
      isOpen: false,
      expandedOptionIDs: [], // store the IDs of options whose subOptions list is visible
      client: (client_id !== '' ? getKeyByValue(getClients(), client_id, 'id') : ''),
      terminal_type: this.user.terminal_type.id !== 'sellside' ? this.user.terminal_type.id : this.default_terminal_type,
      terminal: this.user.terminal_type
    };

    this.handleToggleBtn = this.handleToggleBtn.bind(this);
    this.handleLoadScripts = this.handleLoadScripts.bind(this);

    this.domRef = React.createRef();
  }

  componentDidMount() {
    this.handleLoadScripts()
    subject2.subscribe(this.updateTerminalInfo.bind(this));
  }

  componentDidUpdate() {
    if (this.state.terminal !== this.getTerminalType()) {
      this.user = getUser();
      this.user_privileges = this.user.privileges;
    }
  }

  componentWillUnmount() {
    subjectObj.unSubscribe(this.updateTerminalInfo.bind(this));
  }

  getTerminalType() {
    let terminal_type;
    let userStr = localStorage.getItem(Constants.SITE_PREFIX + 'user');
    userStr = (userStr) ? JSON.parse(userStr) : {};
    terminal_type = userStr['terminal_type'];
    return terminal_type;
  }

  updateTerminalInfo(obj) {
    let stateObj = {
      terminal: obj.terminal,
      terminal_type: obj.terminal.id !== undefined ? obj.terminal.id : this.default_terminal_type,
    };
    this.setState(stateObj);
  }

  //Load Scripts on Page/View Load
  handleLoadScripts() {
    subjectObj.notify({
      page_title: this.page_title,
      client: this.state.client
    });
  }

  handleToggleBtn() {
    this.setState({ isOpen: !this.state.isOpen,expandedOptionIDs:[] })
  }

  handleExpandableOptionClick(optionId) {
    const updatedExpandedOptionIDs = this.state.expandedOptionIDs.includes(optionId) ? this.state.expandedOptionIDs.filter(id => id !== optionId) : [...this.state.expandedOptionIDs, optionId];
    this.setState({ expandedOptionIDs: updatedExpandedOptionIDs })
  }

  navLink() {
    let sidePages = sitePages[this.state.terminal_type];
    let terminalName;
    if (this.state.terminal_type === 'buyside') {
      terminalName = 'Buy Side'
    } else if (this.state.terminal_type === 'klay_media') {
      terminalName = 'Klay Media'
    }

    if (this.user_privileges[this.state.terminal_type] !== undefined && sidePages && sidePages.length !== 0) {
      return (<>
        {sidePages.map((item, i) => {
          // if item.privilege is string use inclues to check user privilege and else check array elements in array
          let hasNavAccess = false;
          if (typeof item.privilege === 'object') {
            hasNavAccess = (item.privilege.some(r => this.user_privileges[this.state.terminal_type].indexOf(r) >= 0) || (this.user_privileges[this.default_terminal_type] && this.user_privileges[this.default_terminal_type].indexOf('APEX') > -1));

            //Set first element url under parent nav
            let subPages = [];
            (item.sub_pages && item.sub_pages.forEach((subitem) => {
              if (this.user_privileges[this.state.terminal_type].indexOf(subitem.privilege) > -1 || (this.user_privileges[this.default_terminal_type] && this.user_privileges[this.default_terminal_type].indexOf('APEX') > -1)) {
                subPages.push(subitem);
              }
            }));
          } else {
            hasNavAccess = (this.user_privileges[this.state.terminal_type].indexOf(item.privilege) > -1 || (this.user_privileges[this.default_terminal_type] && this.user_privileges[this.default_terminal_type].indexOf('APEX') > -1));
          }

          //check if user has privilege to see the menu
          const hasSuboptions = item.sub_pages.length;
          const isExpanded = this.state.expandedOptionIDs.includes(item.id);
          let list = 
          <div key={`main-item-${i}`} id={(item.title.replace(' ', '-')).toLowerCase()} className={'nav-item' + (hasSuboptions ? ' has-submenu' : '') + (isExpanded ? ' expanded' : '')}>

            <div className={'nav-item-container' + (hasNavAccess ? '': ' disabled')}>
              {hasSuboptions ?
                <div className={'nav-link'} onClick={hasNavAccess ? () => this.handleExpandableOptionClick(item.id) : () => {}}  >
                  <span className={`icon${hasNavAccess ? '' : ' disable'}`}></span>
                  <span className={`text${hasNavAccess ? '' : ' disable'}`}>{item.title === 'Home' ? terminalName : item.title}</span>
                  <span className={`icon-dropdown${hasNavAccess ? '' : ' disable'}`}></span>
                </div> :
                <Link className="nav-link" to={hasNavAccess ? item.url : ''} onClick={hasNavAccess ? () => this.handleToggleBtn() : () => {}} >
                  <span className={`icon${hasNavAccess ? '' : ' disable'}`}></span>
                  <span className={`text${hasNavAccess ? '' : ' disable'}`}>{item.title === 'Home' ? terminalName : item.title}</span>
                </Link>
              }
            </div>

            {this.state.expandedOptionIDs.length > 0 && this.state.expandedOptionIDs[0] === item.id && hasSuboptions &&
              <ClickOutsideListener onOutsideClick={() => this.handleExpandableOptionClick(item.id)}>
                <div className="nav-item-suboptions-panel">
                  <div className="nav-item-suboptions">
                    {item.sub_pages.map(subpage => {
                      return (
                        <Link key={subpage.id} className="nav-link-options" to={subpage.url} onClick={this.handleToggleBtn} >
                          <span className="text">{subpage.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
                </ClickOutsideListener>
              }
            </div>
            return (list);
        })
        }
      </>)
    }
  }
  
  render(){
    return (
      <div className="app-wrapper">
        {/* <div id='app-sub-header' className='home-header'></div> */}
        <div className="home-page-container">
          <div className="home-page-data">
            <div className="main-header">Welcome to <span className="sight-container">Sight</span></div>
            <div className="sub-header"><span>Customized data visualization for decision makers</span></div>
            <div className="navigation-title-container">
              <span className="navigation-title">Primary Navigation</span>
            </div>
            <div className="navigation-container">
              {this.navLink()}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
}

 
export default Home;