import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { getToken } from './Common';

// handle the public routes
function PublicRoute({ component: Component, ...rest }) {
  let hasToken = getToken();
  let isRestrictedPublicRoute = (rest.norestriction===undefined || rest.norestriction===false);

  return (
    <Route
      {...rest}
      render={(props) => {
        if(!isRestrictedPublicRoute){
          return <Component {...props} /> 
        } else {
          return !hasToken ? <Component {...props} /> : <Redirect to={{ pathname: '/' }} /> 
        }
      }}
      // render={(props) => !hasToken ? <Component {...props} /> : <Redirect to={{ pathname: '/' }} />}
      // render={(props) => ((hasToken && !isRestrictedPublicRoute) || (!hasToken && !isRestrictedPublicRoute)) ? <Component {...props} /> : <Redirect to={{ pathname: '/' }} />}
    />
  )
}

export default PublicRoute;
