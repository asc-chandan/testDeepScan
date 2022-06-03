import React, { Component } from 'react';
import { Link } from "react-router-dom";
import { getClients } from '../../utils/Common';

import '../../styles/Clients.scss';

class Clients extends Component {
  constructor(props) {
    super(props);

    this.state = {
      filtered_clients_list: getClients()
    };
    this.clients_list = getClients();
    this.handleChange = this.handleChange.bind(this);
    this.handleClientSwitch = this.handleClientSwitch.bind(this);
  }

  componentDidMount(){
    //Do Nothing
  }

  handleChange(e) {
    // Variable to hold the original version of the list
    let currentList = this.clients_list;

    // Variable to hold the filtered list before putting into state
    let newList = [];
        
    // If the search bar isn't empty
    if (e.target.value !== "") {
      // Assign the original list to currentList
      
      // Use .filter() to determine which items should be displayed
      // based on the search terms
      newList = currentList.filter(item => {
        // change current item to lowercase
        const lc = item.name.toLowerCase();
        // change search term to lowercase
        const filter = e.target.value.toLowerCase();
        // check to see if the current list item includes the search term
        // If it does, it will be added to newList. Using lowercase eliminates
        // issues with capitalization in search terms and search content
        return lc.includes(filter);
      });
    } else {
      // If the search bar is empty, set newList to original task list
      newList = this.clients_list;
    }
    // Set the filtered state based on what our rules added to newList
    this.setState({
      filtered_clients_list: newList
    });
  }

  handleClientSwitch(client){
    // e.preventDefault();
    let show_display_id = (this.props.show_display_client_id !== undefined) ? this.props.show_display_client_id : false;
    if(show_display_id){
      this.props.history.push('/trend/advertiser/'+client);
    } else {
      this.props.history.push('/trend/advertiser/'+client);
      setTimeout(()=>{
        this.props.onClose();
      },10);
      // let existing_client_name = window.location.pathname.split("/").pop();
      // window.location.href.replace(existing_client_name, client);
      // console.log(this.props);
      // this.props.history.push(window.location.href.replace(existing_client_name, client));
      // alert(window.location.href +'/'+window.location.href.substring(window.location.href.lastIndexOf('/') + 1));
    }
  }

  render() {
    let clientsList;
    let clients = this.state.filtered_clients_list;
    let show_display_id = (this.props.show_display_client_id !== undefined) ? this.props.show_display_client_id : false;
    
    if(clients){
      clientsList = clients.map(item => (
        <li key={item.id}>
          {/* <Link to={`/report/advertiser/${item.name}`}> */}
          <Link onClick={(e) => this.handleClientSwitch(item.name)}>
            {item.name}
            
            {show_display_id &&
              <span className="display_id">{item.display_client_id}</span>
            }
          </Link>
        </li>
      ));
    }
    
    return (
      <div className="clients-all-list">
        <input type="text" className="field-control" onChange={this.handleChange} placeholder="Search..." />
        <ul>
          {clientsList}
        </ul>
      </div>
    );
  }
}

export default Clients;