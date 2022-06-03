import React, { Component } from 'react';
import { Switch, BrowserRouter as Router } from "react-router-dom";
import './styles/Global.scss';

import Toast from './components/Toast/Toast';
import { getToken } from './utils/Common';
import PrivateRoute from './utils/PrivateRoute';
import PublicRoute from './utils/PublicRoute';
import Main from './Main';
import LoginRegister from './views/LoginRegister';
import ShareTrendMasterDashboard from './views/SellSide/TrendMaster/ShareTrendMasterDashboard';


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      authLoading: true
    }
  }

  componentDidMount() {
    const token = getToken();
    if (!token) { return; }
    this.setState({ authLoading: false });
  }

  render() {
    if (this.state.authLoading && getToken()) {
      return <div className="content">Checking Authentication...</div>
    }

    return (
      <div>
        <Router>
          <Toast />
          <Switch>
            <PublicRoute path="/login" component={LoginRegister} />
            <PublicRoute path="/register" component={LoginRegister} />
            <PublicRoute exact path="/sellside/datatrend/:id/:client_id/:public_token" component={ShareTrendMasterDashboard} norestriction={true} />
            <PrivateRoute path="/" component={Main} />
          </Switch>
        </Router>
      </div>
    );
  }
}

export default App;