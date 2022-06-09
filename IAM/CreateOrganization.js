import React, { useState, useEffect } from "react";
import * as Constants from '../components/Constants.js';
import '../styles/Global.scss';
import APIService from '../services/apiService'; //Import Services
import AscTable from '../components/AscTable/AscTable';

function CreateOrganization() {
  const [error, setError] = useState('');
  const [inprocess, setInprocess] = useState(false);
  const [orgData, setOrgData] = useState([]);
  const page_title = "Add/Edit Organization";

  const columnsToDisplay = [
    {'name': 'id', 'display_name': 'ID', 'sort': true},
    {'name': 'name', 'display_name': 'Name'},
    {'name': 'parent_organization_id', 'display_name': 'Parent Org', 'sort': true},
    {'name': 'rev_share_percent_l2', 'display_name': 'Rev Share L2'},
    {'name': 'attributes', 'display_name': 'Attributes'},
    {'name': 'is_active', 'display_name': 'Active'},
    {'name': 'created_at', 'display_name': 'Created at', 'sort': true},
    {'name': 'created_by', 'display_name': 'Created by', 'sort': true},
  ];

  useEffect(()=>{
    getOrganizationsList();
  },[orgData]);


  //Get Organizations
  function getOrganizationsList(){
    setError('');
    setInprocess(true);

    let api_url = '/organization';  
    let req_method = 'GET';
    let apiPayLoad = null;

    // console.time('sight: getLastUpdatedDate - API call');
    APIService.apiRequest(Constants.API_BASE_URL+api_url, apiPayLoad, false, req_method)
      .then(response => {
        if(response.status===1 && response.data!==undefined){
          setOrgData(response.data);
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

  return (
    <div className="app-wrapper iam">
      <div id="app-sub-header">
        <h2 className="page-title">{page_title}</h2>
      </div>
      
      <div className="container">
        {error && error}
        {inprocess && 'loading...'}
        
        <div id="iam-user" className="inner-container clearfix">
          <AscTable
            columns={columnsToDisplay}
            data={orgData}
          />
        </div>
      </div>
    </div>
  );
}

export default CreateOrganization;