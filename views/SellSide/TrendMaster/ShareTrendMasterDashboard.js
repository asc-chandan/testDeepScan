import React, { Component } from 'react';
// import * as Constants from '../../../components/Constants.js';
import '../../../styles/TrendMaster.scss';
import '../../../styles/Chart.scss';
import Header from '../../../components/header/Header';
import APIService from '../../../services/apiService'; //Import Services
import ReportView from './ReportView.js';

class ShareTrendMasterDashboard extends Component {
    constructor(props) {
        super(props);

        this.page_title = 'Trend Master';
        this.view_type = props.match.params.view_type;
        this.dashboard_id = this.props.match.params.id.split('-')[1];
        this.client_id = this.props.match.params.client_id;
        this.public_token = this.props.match.params.public_token;
        this.controller = new AbortController();

        this.state = this.getInitVariables();
        this.handlePanelToggle = this.handlePanelToggle.bind(this);
        this.handlePanelPositionChange = this.handlePanelPositionChange.bind(this);
    }

    getInitVariables() {
        let initialObj = {
            inprocess: true,
            error: "",
            isPublicDashboard: false,
            showConsolePanel: false,
            consolePanelPosition: 'right'
        };
        return initialObj;
    }

    componentDidMount() {
        this.handleLoadScripts();
    }

    componentDidUpdate() {
    }

    componentWillUnmount() {
        //Cancel Previous API Requests
        console.log('cancel previous view running apis');
        APIService.abortAPIRequests(this.controller);
    }

    //Load Scripts on Page/View Load
    handleLoadScripts() {
        // this.checkDashboardPublicStatus();
    }

    // checkDashboardPublicStatus(){
    //     APIService.apiRequest(Constants.API_BASE_URL + '/trend_master/share/'+this.dashboard_id+'?client_id='+this.client_id, null, false, 'GET', this.controller)
    //     .then(response => {
    //         if (response.status === 1) {
    //             this.setState({isPublicDashboard: true});
    //         } else {
    //             alertService.showToast('error', err.msg);
    //         }
    //     })
    //     .catch(err => {
    //         alertService.showToast('error', err.msg);
    //     });
    // }

    handlePanelToggle() {
        this.setState({
            showConsolePanel: !this.state.showConsolePanel
        });
    }

    handlePanelPositionChange(tabId, position) {
        this.setState({
            consolePanelPosition: position
        });
    }

    render() {
        return (
            <div id="app-main-wrapper">
                <Header isPublicView={true} />
                
                <div className="app-wrapper trendmaster">
                    <div className="container">
                        <div id="trendmaster" className="inner-container">
                            <div id="analysis-wrapper">
                                {this.dashboard_id && this.public_token &&
                                    <div id={'d-'+this.dashboard_id}>
                                        <ReportView
                                            isActiveTab={this.dashboard_id}
                                            isPublicView={true}
                                            publicToken={this.public_token}
                                            clientId = {this.client_id}
                                            dashboardData={{id: this.dashboard_id, showConsolePanel: this.state.showConsolePanel}}
                                            onDashboardSaveOrEdit={false}
                                            showDashboardCreatedMsg={false}
                                            hideDashboardCreatedMsg={false}
                                            showConsolePanel={this.state.showConsolePanel}
                                            consolePanelPosition={this.state.consolePanelPosition}
                                            onPanelToggle={this.handlePanelToggle}
                                            onPanelPositionChange={this.handlePanelPositionChange}
                                            isDashboardInEditMode={false}
                                            onDashboardDelete={false}
                                            onDashboardEdit={false}
                                            onDashboardPublish={false}
                                            preferenceAutoHideConsolePanel={false}
                                        />
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default ShareTrendMasterDashboard;