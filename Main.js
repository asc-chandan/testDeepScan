import React, { Component, Suspense, lazy } from 'react';
import { Switch, Redirect } from "react-router-dom";
import * as Constants from './components/Constants';
import APIService from './services/apiService';
import PrivateRoute from './utils/PrivateRoute';
import LoaderbyData from './components/LoaderbyData/LoaderbyData';
import Header from './components/header/Header';
import Sidebar from './components/sidebar/Sidebar';
import Home from './views/Home';

const removeRootLoaderFromDOM = () => {
  const rootLoader = document.getElementById('root-bydata-loader-wrapper');
  if (rootLoader) {
    rootLoader.remove();
  }
};

const handleModuleDownload = (module) => {
  removeRootLoaderFromDOM();
  return Promise.resolve(module);
};

const SuspenseLoading = () => {
  if (document.getElementById('root-bydata-loader-wrapper')) {
    return null;
  }
  return (
    <div id="suspense-loading">
      <LoaderbyData />
    </div>
  );
};


const TrendMaster = lazy(() => import('./views/SellSide/TrendMaster/TrendMaster').then(handleModuleDownload));
const DataGrid = lazy(() => import('./views/SellSide/DataGrid/DataGrid').then(handleModuleDownload));

//SellSide Views Components
const SellSide = lazy(() => import('./views/SellSide/SellSideHome').then(handleModuleDownload));
const ReportView = lazy(() => import('./views/SellSide/TrendMaster/ReportView').then(handleModuleDownload));
// const AnalysisHome = lazy(() => import('./views/SellSide/DataGrid/AnalysisHome').then(handleModuleDownload));
// const AnalysisView = lazy(() => import('./views/SellSide/DataGrid/AnalysisView').then(handleModuleDownload));
const AccountsReceivable = lazy(() => import('./views/SellSide/Accounts/AccountsReceivable').then(handleModuleDownload));
const AccountsPayable = lazy(() => import('./views/SellSide/Accounts/AccountsPayable').then(handleModuleDownload));
const RevShare = lazy(() => import('./views/SellSide/Accounts/RevShare').then(handleModuleDownload));
const CustomReports = lazy(() => import('./views/SellSide/CustomReports/CustomReports').then(handleModuleDownload));
const CustomReportDetailed = lazy(() => import('./views/SellSide/CustomReports/CustomReportDetailed').then(handleModuleDownload));
const YieldDashboard = lazy(() => import('./views/SellSide/YieldDashboard').then(handleModuleDownload));
const DataStatus = lazy(() => import('./views/SellSide/api/DataStatus').then(handleModuleDownload));
const DataStream = lazy(() => import('./views/SellSide/DataStream/DataStream').then(handleModuleDownload));
const AdTagMap = lazy(() => import('./views/SellSide/AdTagMap/AdTagMap').then(handleModuleDownload));
const LoginAs = lazy(() => import('./views/IAM/LoginAs').then(handleModuleDownload));
const SelfRegister = lazy(() => import('./views/SelfRegister').then(handleModuleDownload));

//BuySide Views Components
const BuySide = lazy(() => import('./views/BuySide/BuySide').then(handleModuleDownload));
const BuySideCampaignLog = lazy(() => import('./views/BuySide/BuySideCampaignLog').then(handleModuleDownload));
const BuySideCampaignPublisherData = lazy(() => import('./views/BuySide/BuySideCampaignPublisherData').then(handleModuleDownload));
const BuySideCampaign = lazy(() => import('./views/BuySide/BuySideCampaign').then(handleModuleDownload));

//IAM Views Components
const Profile = lazy(() => import('./IAM/Profile').then(handleModuleDownload));
const CreateUser = lazy(() => import('./IAM/CreateUser').then(handleModuleDownload));
const UpdateUser = lazy(() => import('./IAM/UpdateUser').then(handleModuleDownload));
const CreateOrganization = lazy(() => import('./IAM/CreateOrganization').then(handleModuleDownload));
const Master = lazy(() => import('./IAM/Master').then(handleModuleDownload));

//404 Page
const PageNotFound = lazy(() => import('./views/404').then(handleModuleDownload));


class Main extends Component {
  constructor() {
    super();

    this.liveSightURL = Constants.LIVE_SIGHT_URL;
    this.oldSightURL = Constants.OLD_SIGHT_URL;
    this.isRedirectionRequired = window.location.origin.includes(this.liveSightURL);

    //set the local storage to 0 on refresh for let refresh token api working when flag stuck to 1
    localStorage.setItem(Constants.SITE_PREFIX + 'reset_token_inprocess', 0);

    this.state = {
      showData: false,
      showToggle: false
    };
    
    this.getUserPreferences = this.getUserPreferences.bind(this);
  }


  componentDidMount() {
    // Register for fullscreenchange event.
    /**
     * Note - Fullscreen feature has nothing to do with Main component. This is written here so that we can listen for this event 
     * globally at one place. Basically, we intend to apply a class 'full-screen-mode' to body element when any of its child  element is opened in full screen
     * and remove the class when fullscreen is exited. By doing so, any view in the application can update its or its children styles.
     */
    ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'msfullscreenchange']
      .forEach(event => document.addEventListener(event, this.handleFullscreenChange));

      this.getUserPreferences();
  }

  componentWillUnmount() {
    ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'msfullscreenchange']
      .forEach(event => document.removeEventListener(event, this.handleFullscreenChange));
  }

  getUserPreferences() {
    APIService.apiRequest(Constants.API_BASE_URL + '/user_preference', null, false, 'GET', null)
      .then(response => {
        if (response.version_switch !== undefined) {
          if (this.isRedirectionRequired) {
            if (response.version === 'sight0') {
              window.location.replace(this.oldSightURL);
              this.setState({ showData: false })
            } else {
              this.setState({ showData: true, showToggle: response.version_switch })
            }
          } else {
            this.setState({ showData: true, showToggle: response.version_switch });
          }
        }
      })
      .catch(err => {
        console.log('Error:Couldn\'t fetch user preferences', err.msg);
      });
  }

  handleFullscreenChange() {
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullscreenElement || document.msFullscreenElement;
    if (!fullscreenElement) {
      // Full screen mode has been exited, hence remove the class from body
      document.body.classList.remove('fullscreen-mode');
    } else {
      document.body.classList.add('fullscreen-mode');

    }
  }


  render() {
    return (
      <div id="app-main-wrapper">
        {this.state.showData && <>
        <Header history={this.props.history} checkFromMain={this.state.showData} showToggle={this.state.showToggle} />
        <Sidebar />
        <Suspense fallback={<SuspenseLoading />}>
          <Switch>
            <PrivateRoute exact path="/" component={Home} history={this.props.history} />
            {/* <PrivateRoute exact path="/mainhome" component={MainHome} history={this.props.history} /> */}
            <PrivateRoute path="/self_register/welcome" component={SelfRegister} access="" />
            {/* <PrivateRoute exact path="/sellside" component={SellSide} access="SIGHT_HOME" /> */}
            
            <PrivateRoute path="/iam/profile" component={Profile} access="UPDATE_PROFILE" />
            <PrivateRoute path="/iam/create_user" component={CreateUser} access="APEX" />
            <PrivateRoute path="/iam/update_user" component={UpdateUser} access="APEX" />
            <PrivateRoute path="/iam/create_organization" component={CreateOrganization} access="APEX" />
            <PrivateRoute path="/iam/master" component={Master} access="APEX" />
            <PrivateRoute path="/iam/login_as" component={LoginAs} access="APEX" />

            <PrivateRoute exact path="/sellside/datatrend" redirectTo="/sellside/datatrend/d-home" component={TrendMaster} access="VIEW_ADVERTISER" />
            <PrivateRoute exact path="/sellside/datatrend/:tab" component={TrendMaster} access="VIEW_ADVERTISER" />
            <PrivateRoute exact  path="/sellside/datagrid" redirectTo="/sellside/datagrid/d-home"  component={DataGrid} access="ANALYSIS_HOME" />
            <PrivateRoute exact path="/sellside/datagrid/:tab" component={DataGrid} access="ANALYSIS_HOME" />
            
            <PrivateRoute path="/sellside/adseller_receivable" component={AccountsReceivable} access="ACCOUNTS_RECEIVABLE" />
            <PrivateRoute path="/sellside/adbuyer_payable" component={AccountsPayable} access="ACCOUNTS_RECEIVABLE" />
            <PrivateRoute path="/sellside/rev_share_settings" component={RevShare} access="REVENUE_SHARE" />
            <PrivateRoute path="/sellside/yield_dashboard" component={YieldDashboard} access="VIEW_YIELD_DASHBOARD" />

            <PrivateRoute path="/sellside/custom_reports" component={CustomReports} access="CUSTOM_REPORTS" />
            <PrivateRoute path="/sellside/custom_report/:report_type" component={CustomReportDetailed} access="CUSTOM_REPORTS" />
            <PrivateRoute path="/sellside/api/data_status" component={DataStatus} access="DATA_CONNECTIONS" />
            <PrivateRoute path="/sellside/datastream" component={DataStream} access="UPDATE_PROFILE" />
            <PrivateRoute path="/sellside/adtagmap" component={AdTagMap} access="VIEW_ADTAGMAP" />
            
            <PrivateRoute exact path="/buyside" component={BuySide} access="BUYSIDE" />
            <PrivateRoute path="/buyside/campaign/log/:campaign_id" component={BuySideCampaignLog} access="BUYSIDE" />
            <PrivateRoute path="/buyside/campaign/publisher_data/:campaign_id" component={BuySideCampaignPublisherData} access="BUYSIDE" />
            <PrivateRoute path="/buyside/campaign/:campaign_id" component={BuySideCampaign} access="BUYSIDE" />

            <PrivateRoute exact path="/buyside/datatrend" redirectTo="/buyside/datatrend/d-home" component={TrendMaster} access="VIEW_ADVERTISER" />
            <PrivateRoute exact path="/buyside/datatrend/:tab" component={TrendMaster} access="VIEW_ADVERTISER" />
            <PrivateRoute exact path="/buyside/datagrid" redirectTo="/buyside/datagrid/d-home" component={DataGrid} access="ANALYSIS_HOME" />
            <PrivateRoute exact path="/buyside/datagrid/:tab" component={DataGrid} access="ANALYSIS_HOME" />

            {/* Klay Media Terminal */}
            <PrivateRoute exact path="/klay_media" component={SellSide} access="SIGHT_HOME" />
            <PrivateRoute path="/klay_media/datatrend/:view_type" component={ReportView} access="TREND_MASTER" />
            <PrivateRoute path="/klay_media/datatrend/:view_type/:period_comparison" component={ReportView} access="TREND_MASTER" />
            <PrivateRoute exact path="/klay_media/datagrid" component={DataGrid} access="KLAY_MEDIA" />
            <PrivateRoute exact path="/klay_media/datagrid/:tab" component={DataGrid} access="KLAY_MEDIA" />

            <PrivateRoute path="/404" component={PageNotFound} access="UPDATE_PROFILE" />
            <Redirect to="/404" />
          </Switch>
        </Suspense>
        </>
  }
      </div>
    );
  }
}

export default Main;