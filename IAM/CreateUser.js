import React, { useState, useEffect } from "react";
import * as d3 from 'd3';
import * as Constants from '../components/Constants.js';
import '../styles/Global.scss';

import { getUser } from '../utils/Common'; //Import Common Functions
import APIService from '../services/apiService'; //Import Services
import AscTable from '../components/AscTable/AscTable';

function CreateUser() {
  const [error, setError] = useState('');
  const [inprocess, setInprocess] = useState(false);
  const user = useState(getUser());
  const [usersData, setUserData] = useState([]);
  const [usersFilteredData, setUserFilteredData] = useState([]);
  const page_title = "Add/Edit User";

  const columnsToDisplay = [
    {'name': 'id', 'display_name': 'ID', 'sort':true, 'editable':false, 'field_type': 'text'},
    {'name': 'first_name', 'display_name': 'First Name', 'sort':false, 'editable':true, 'field_type': 'text'},
    {'name': 'last_name', 'display_name': 'Last Name', 'sort':false, 'editable':true, 'field_type': 'text'},
    {'name': 'user_name', 'display_name': 'User Name', 'sort':true, 'editable':true, 'field_type': 'text'},
    {'name': 'email', 'display_name': 'Email', 'sort':true, 'editable':true, 'field_type': 'text'},
  ];

  //Call Api to fetch users list
  useEffect(()=>{
    if(usersData.length <= 0){
      getUsersList();
    }
  },[usersData]);

  //Get Users
  function getUsersList(){
    setError('');
    setInprocess(true);

    let api_url = '/user';  
    let req_method = 'GET';
    let apiPayLoad = null;

    // console.time('sight: getLastUpdatedDate - API call');
    APIService.apiRequest(Constants.API_BASE_URL+api_url, apiPayLoad, false, req_method)
      .then(response => {
        if(response.status===1 && response.data!==undefined){
          setUserData(response.data);
          setUserFilteredData(response.data);
          setInprocess(false);
        } else {
          setInprocess(false);
          setError(response.msg);
        }
      })
      .catch(err => {
        setInprocess(false);
        setError(err.msg);
      });
  }

  //On Table Search
  function onSearchChange(val){
    if(val!==''){
      let filteredUsersData = usersData.filter((e) => {
        return ((e.user_name && e.user_name.includes(val)) || (e.email && e.email.includes(val)) || (e.first_name && e.first_name.includes(val)) || (e.last_name && e.last_name.includes(val)))
      });
      setUserFilteredData(filteredUsersData);
    } else {
      setUserFilteredData(usersData);
    }
  }

  //On Table Sort
  function onColumnSort(val){
    let sortkey = Object.keys(val);
    if(sortkey.length <= 0) return;

    const sortedData = JSON.parse(JSON.stringify(usersFilteredData));
    sortedData.sort(function (a, b) {
      let valueA, valueB;
      valueA = a[sortkey[0]];
      valueB = b[sortkey[0]];
    
      if (val[sortkey[0]] === 'desc') {
        return d3.descending(valueA, valueB);
      } else {
        return d3.ascending(valueA, valueB);
      }
    });

    setUserFilteredData(sortedData);
  }


  function handleSaveEditedChanges(){
    //to do
  }

  
  return (
    <div className="app-wrapper iam">
      <div id="app-sub-header">
        <h2 className="page-title">{page_title}</h2>

        <div className="action-button-wrapper">
          <button className="btn outline xs btn-add-new">Add New</button>
          <button className="btn outline xs btn-add-save mar-l15" onClick={handleSaveEditedChanges}>Save</button>
        </div>
      </div>
      
      <div className="container">
        {error && error}
        {inprocess && 'loading...'}
        
        <div id="iam-user" className="inner-container clearfix">
          <AscTable
            columns={columnsToDisplay}
            data={usersFilteredData}
            onSearch={onSearchChange}
            onSort={onColumnSort}
            user={user}
          />
        </div>
      </div>
    </div>
  );
}

export default CreateUser;