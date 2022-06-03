import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { getToken, getUser, getClients, getKeyByValue } from './Common';


// handle the private routes
function PrivateRoute({ component: Component, ...rest }) {
  let userObj = getUser();
  let userPrivileges = [];
  let client_id = null;
  let default_terminal_type = '';

  // console.log('getToken()', getToken());
  // console.log('getUser()', getUser());
  
  if(userObj){
    userPrivileges = userObj.privileges;
    client_id = userObj.last_fetched_client;
    default_terminal_type = userObj.terminal_type.id;
  }
  
  return (
    <Route
      {...rest}
      render={(props) => {

        if(rest.redirectTo){
          return <Redirect to={{ pathname: rest.redirectTo, state: { from: props.location } }} />;  
        }

        if(getToken()){
          if(rest.access){
            //Check if param is set in url and it does not matches the client redirect to 404
            let client = getKeyByValue(getClients(), client_id, 'id');
            let hasAPEXPrivilege = (userPrivileges['sellside']!==undefined && userPrivileges['sellside'].indexOf('APEX') > -1);
            let hasBuySideAccess = (userPrivileges['buyside']!==undefined && userPrivileges['buyside'].indexOf(rest.access) > -1);
            
            //Check if login doesn't have access to client user is trying to access directly from url
            if(client_id && !client){
              return <Redirect to={{ pathname: '/404', state: { from: props.location } }} />;
            }
            //Check if login doesn't have access to perticular view_type and they are trying to access directly from url
            if( (props.match.params.view_type==='adserver' && userPrivileges[default_terminal_type].indexOf('VIEW_ADSERVER') < 0) ||
                (props.match.params.view_type==='webanalytics' && userPrivileges[default_terminal_type].indexOf('VIEW_WEBANALYTICS') < 0) ||
                (props.match.params.view_type==='performance' && userPrivileges[default_terminal_type].indexOf('VIEW_PERFORMANCE') < 0)
            ){
              return <Redirect to={{ pathname: '/404', state: { from: props.location } }} />;
            }

            //Check if user has privilege to access the page else redirect to 404
            if(hasBuySideAccess || userPrivileges[default_terminal_type].indexOf(rest.access) > -1 || hasAPEXPrivilege){
              return <Component {...props} />;
            } else {
              return <Redirect to={{ pathname: '/404', state: { from: props.location } }} />;
            }
          } else {
            return <Component {...props} />;
          }
          
        } else {
          return <Redirect to={{ pathname: '/login', state: { from: props.location } }} />;
        }
      }}
    />
  )
}

export default PrivateRoute;