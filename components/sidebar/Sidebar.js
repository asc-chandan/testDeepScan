import React, { Component } from 'react';
import { Link } from "react-router-dom";
import * as Constants from '../Constants.js';
import { sitePages } from '../Navigation';
import { getUser } from '../../utils/Common';
import subjectObj from '../../subjects/Subject1';
import '../../styles/Sidebar.scss';
import ClickOutsideListner from '../ClickOutsideListner.js';

class Sidebar extends Component {
  constructor(props) {
    super(props)

    this.user = getUser();
    this.user_privileges = this.user.privileges;
    this.default_terminal_type = 'sellside';

    this.state = {
      isOpen: false,
      expandedOptionIDs: [], // store the IDs of options whose subOptions list is visible
      client: {},
      terminal_type: this.user.terminal_type.id !== 'sellside' ? this.user.terminal_type.id : this.default_terminal_type
    };

    this.handleToggleBtn = this.handleToggleBtn.bind(this);

    this.domRef = React.createRef();
  }

  componentWillUnmount() {
    subjectObj.unSubscribe(this.updateSidebarClientInfo.bind(this));
  }

  componentDidMount() {
    subjectObj.subscribe(this.updateSidebarClientInfo.bind(this));
  }

  componentDidUpdate(prev_props) {
    this.user = getUser();
    if (this.state.terminal_type !== this.user.terminal_type.id) {
      // console.log('prev terminal: '+this.state.terminal_type+'-- new terminal:'+this.user.terminal_type.id);
      this.setState({
        isOpen: false,
        client: {},
        terminal_type: this.user.terminal_type.id !== 'sellside' ? this.user.terminal_type.id : this.default_terminal_type
      });
    }
  }

  handleToggleBtn() {
    this.setState({ isOpen: !this.state.isOpen,expandedOptionIDs:[] })
  }

  handleExpandableOptionClick(optionId) {
    const updatedExpandedOptionIDs = this.state.expandedOptionIDs.includes(optionId) ? this.state.expandedOptionIDs.filter(id => id !== optionId) : [...this.state.expandedOptionIDs, optionId];
    this.setState({ expandedOptionIDs: updatedExpandedOptionIDs })
  }





  //Get the last selected client
  getLastSelectedClient() {
    //if user has last_fetched_client else return first client from client index
    let userStr = localStorage.getItem(Constants.SITE_PREFIX + 'user');
    userStr = (userStr) ? JSON.parse(userStr) : {};
    if (userStr.last_fetched_client !== undefined && userStr.last_fetched_client !== '') {
      let clientIndex = this.user.clients.findIndex(x => x.id === userStr.last_fetched_client);
      return this.user.clients[clientIndex].name;
    } else {
      return this.user.clients[0].name;
    }
  }

  updateSidebarClientInfo(obj) {
    this.setState({ client: obj.client });
  }



  navLink() {
    let sidePages = sitePages[this.state.terminal_type];

    if (this.user_privileges[this.state.terminal_type] !== undefined && sidePages && sidePages.length !== 0) {
      return (<ul className="nav flex-column">
        {sidePages.map((item, i) => {
          // let nav_class = (item.sub_pages) ? 'nav-item has-submenu' : 'nav-item';
          // let nav_icon_class = 'icon ';
          // let parent_nav_url = item.url;

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
          if (hasNavAccess) {
            const hasSuboptions = item.sub_pages.length;
            const isExpanded = this.state.expandedOptionIDs.includes(item.id);
            let list = <li key={`main-item-${i}`} id={(item.title.replace(' ', '-')).toLowerCase()} className={'nav-item' + (hasSuboptions ? ' has-submenu' : '') + (isExpanded ? ' expanded' : '')}>

              {/* <div className="nav-item-label"> */}
              {hasSuboptions ?
                <div className={'nav-link'} onClick={() => this.handleExpandableOptionClick(item.id)}  >
                  <span className={'icon'}></span>
                  <span className="text">{item.title}</span>
                  <span className={'icon-dropdown'}></span>
                </div> :
                <Link className="nav-link" to={item.url} onClick={this.handleToggleBtn} >
                  <span className={'icon'}></span>
                  <span className="text">{item.title}</span>
                </Link>
              }
              {/* </div> */}
              {!!hasSuboptions &&
                <div className="nav-item-suboptions-panel">
                  <div className="nav-item-suboptions">
                    {item.sub_pages.map(subpage => {
                      return (
                        <Link key={subpage.id} className="nav-link" to={subpage.url} onClick={this.handleToggleBtn} >
                          {/* <span className={'icon'}></span> */}
                          <span className="text">{subpage.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              }
            </li>
            return (list);
          } else {
            return '';
          }
        })
        }
      </ul >)
    }
  }

  render() {
    return (
      <div id="app-sidebar" className={this.state.isOpen ? 'sidebar-open' : ''} ref={this.domRef}>
        <div className="sidebar-toggle-btn-wrapper" onClick={this.handleToggleBtn}>
          <div className="toggle-btn"></div>
        </div>
        
        <ClickOutsideListner onOutsideClick={() => this.state.isOpen && this.setState({ isOpen: false })}>
          <div className="sidebar-menu-drawer">
            {this.navLink()}
          </div>
        </ClickOutsideListner>
      </div>
    );
  }
}

export default Sidebar;