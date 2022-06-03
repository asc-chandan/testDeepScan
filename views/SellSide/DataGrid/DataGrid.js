import React, { Component, useState, useEffect, useRef } from 'react';
import * as Constants from '../../../components/Constants.js';
import '../../../styles/DataGrid.scss';

import { getKeyByValue, getClients, getUser } from '../../../utils/Common'; //Import Common Functions
import APIService from '../../../services/apiService'; //Import Services
import DashboardTabs from '../TrendMaster/DashboardTabs.js';
import DataGridHomeTable from './DataGridHomeTable.js';
import AnalysisView from './AnalysisView.js';
import alertService from '../../../services/alertService.js';
import subjectObj from '../../../subjects/Subject1';
import moment from 'moment';
import subject2 from '../../../subjects/Subject2.js';

const ROWS_PER_PAGE_OPTIONS = [10, 20, 30, 50, 100, 200];
const DEFAULT_PAGE_SIZE = ROWS_PER_PAGE_OPTIONS[3];
const DATAGRID_FILTERS_TABS = ['All', 'Shared', 'Bookmarked', 'Deleted Items'];

class DataGrid extends Component {
    constructor(props) {
        super(props);

        //Get Client & View Type
        this.page_title = 'Data Grid';
        this.user = getUser();
        this.view_type = props.match.params.view_type;
        this.terminal_type = this.user.terminal_type.id;
        this.controller = new AbortController();

        this.state = this.getInitVariables();

        //Event Bind
        this.bindEvents([
            'getInitialSavedAnalysis', 'handleTabRemove', 'handleNewAnalysisBtn', 'openTab', 
            'handleAnalysisDelete', 'handleAnalysisBookmark', 'handleAnalysisDownload', 'handlePanelToggle',
            'handlePanelPositionChange', 'handleTabsOrderChange', 'handlePreferencesToggle', 'handlePreferenceAutoHidePlotterPanel',
            'handlePageChange', 'handleRowsPerPageChange', 'handleSearch', 'handleSearchReset', 'onPageScroll', 'copyFunction', 
            'handleSelectAll',  'handleKeyDownEvent']);
    }

    /**
     * For unify the bind and unbind listener
     */
    bindEvents(methodArray) {
        methodArray.forEach(method => {
            this[method] = this[method].bind(this);
        });
    }


    //Initial Variables
    getInitVariables() {
        let client_id = this.user.last_fetched_client;

        let initialObj = {
            inprocess: true,
            error: "",
            client: (client_id !== '' ? getKeyByValue(getClients(), client_id, 'id') : ''),
            terminal_type: this.user.terminal_type.id,

            searchInput: '',
            searching: false,
            searchModeOn: false, // to store wheather the current visible list is obtainer via search or from initial load

            savedAnalysis: null,
            savedAnalysisPaginationInfo: {pageCount: null, currentPage: null, rowsPerPage: DEFAULT_PAGE_SIZE, totalResultsCount: null},

            last_updated_date: '',
            last_updated_date_tz: '',
            selectedDateRange: {},
            analysisid: '',
            data_sources: [],

            savedAnalysisCurrentFilter: 'All',
            tabs: [{ id: 'home', name: 'home' }], // used to show the tab list of all current analysis(whose `is_current_tab` is 1), Home tab is present at client only
            newTabCounter: 1,
            showNewTabOptions: false,

            deletingAnalysisId: null,
            bookmarkingAnalysisId: null,
            downloadingAnalysisId: null,

            timeout: null,
            dataToCopy: '',
            previousKey: '',
        };
        return initialObj;
    }


    /*****************************
     * Life Cycle Methods
     */
    componentDidMount() {
        this.handleLoadScripts();
        document.addEventListener('copy', this.copyFunction);
        document.addEventListener('keydown', this.handleKeyDownEvent)
        // subscribing the subject2 to get the notification about the client change from header.
        subject2.subscribe(this.handleClientChange.bind(this));
    }

    componentDidUpdate(prev_props) {
        if (this.props.match.params.tab !== prev_props.match.params.tab) {
            this.addTabIfNeeded(prev_props);
        }

        if (this.props.match.params.tab === prev_props.match.params.tab
            && this.checkEditModeFromUrl(prev_props.location.search) !== this.checkEditModeFromUrl(this.props.location.search)) {
            this.updateTabEditMode(Number(this.getTabIdFromUrl()), this.checkEditModeFromUrl(this.props.location.search));
        }
    }

    componentWillUnmount() {
        //Cancel Previous API Requests
        console.log('cancel previous view running apis');
        APIService.abortAPIRequests(this.controller);
        document.removeEventListener('copy', this.copyFunction)
        document.removeEventListener('keydown', this.handleKeyDownEvent)
        subject2.unSubscribe(this.handleClientChange.bind(this));
    }

    /*****************************
     * On Load - Scripts
     */
    
    //Load Scripts on Page/View Load
    handleLoadScripts() {
        subjectObj.notify({
            page_title: this.page_title,
            client: this.state.client
        });

        this.getInitialSavedAnalysis();
        this.getOpenedTabsList();
    }

    handleClientChange(obj) {
        this.setState({
            client: obj.client,
        }, () => {
            this.handleLoadScripts();
        })
    }

    //Fetch Saved Analysis List
    getInitialSavedAnalysis() {
        this.setState({ inprocess: true, error: '' });

        this.fetchSavedAnalysisList({ pageSize: DEFAULT_PAGE_SIZE, pageNo: 1 })
            .then(response => {
                this.setState({
                    savedAnalysis: response.data,
                    savedAnalysisPaginationInfo: { pageCount: response.num_pages, currentPage: 1, totalResultsCount: response.total_results, rowsPerPage: DEFAULT_PAGE_SIZE },
                    inprocess: false
                });
            })
            .catch(err => {
                console.log('Error on getting Saved dashboard list: ' + err.msg);
                this.setState({ inprocess: false, error: err.msg });
            });
    }

    //Fetch Opened Tabs List
    getOpenedTabsList() {
        const MAX_TAB_LIMIT = 50;
        this.fetchSavedAnalysisList({ pageSize: MAX_TAB_LIMIT, pageNo: 1, fetchOpened: true })
            .then(response => {
                const isEditModeOn = this.checkEditModeFromUrl(this.props.location.search);
                const editModeTabId = isEditModeOn ? this.getTabIdFromUrl() : null;
                this.setState({
                    // append the opened tabs in tab list (which contains only home tab intially)
                    tabs: [this.state.tabs[0], ...response.data].map(d => ({ ...d, editMode: editModeTabId === String(d.id), showPlotterPanel: editModeTabId === String(d.id), plotterPanelPosition: 'left' })),
                    inprocess: false
                }, () => {
                    this.addTabIfNeeded();
                });
            })
            .catch(err => {
                console.log('Error on getting Opened dashboard list: ' + err.msg);
            });
    }

    onPageScroll(pageSize, pageNo, that) {
        that.updateSavedAnalysisList(pageSize, pageNo);
    }


    //Fetch Saved Analysis API Function
    fetchSavedAnalysisList({ pageSize, pageNo, fetchOpened = false, fetchBookmarked = false, fetchShared = false, fetchArchived = false }) {
        return new Promise((resolve, reject) => {
            let query = `?page_size=${pageSize}&page_number=${pageNo}`;
            query += fetchOpened ? `&is_current=1` : '';
            query += fetchBookmarked ? `&is_bookmark=1` : '';
            query += fetchShared ? `&is_shared=1` : '';
            query += fetchArchived ? `&is_archived=1` : '';

            APIService.apiRequest(Constants.API_BASE_URL + `/data_grid/get_analysis_list/${this.state.terminal_type}${query}`, null, false, 'GET', this.controller)
                .then(response => {
                    if (response.status === 1 && response.data.length) {
                        // parse the dashboard's 'dynamic_time_period' value if not null.
                        // response.data.forEach(dash => { if (dash.dynamic_time_period) { dash.dynamic_time_period = dash.dynamic_time_period } });
                        resolve(response);
                    } else {
                        resolve({ data: [] });
                    }
                })
                .catch(err => {
                    reject(err)
                });
        });
    }



    /*********************************
     * Tab/URL Specific - Functions
     */

    //Returns the tabId present in Url. If param is of form 'd-{id}', only then it is considered as valid, otherwise null is returned
    getTabIdFromUrl() {
        const tabParam = this.props.match.params.tab.split('-');
        const isIdValid = tabParam.length === 2 && tabParam[0] === 'd';
        return isIdValid ? tabParam[1] : null;
    }

    //Check if analysis is in edit mode from url
    checkEditModeFromUrl(url) {
        const searchParams = new URLSearchParams(url);
        return searchParams.get('edit') === 'true' ? true : false;
    }

    //Get datasource from url
    // giveDataSourceFromUrl(url) {
    //     const searchParams = new URLSearchParams(url);
    //     return searchParams.get('dataSource');
    // }

    //On Tab Close
    handleTabRemove(tabId) {
        // Check New Tab case : when tab opened was 'New', no need to send api request in this case
        if (String(tabId).includes('new')) {
            this.setState({
                tabs: this.state.tabs.filter((t) => t.id !== tabId),
            });
        } else {
            // Remove the tab immediately from UI without waiting for API completion
            // Store the tab to be removed in a variable to reinsert it again if request fails
            const removedTabInfo = {
                index: this.state.tabs.findIndex((t) => t.id === tabId),
                data: this.state.tabs.find((t) => t.id === tabId)
            };;
            this.setState({
                tabs: this.state.tabs.filter((t) => t.id !== tabId),
            });
            // Send request to remove the tab
            this.informTabCloseToServer(removedTabInfo);
        }

        //In either case, redirect to 'home' tab after closing the tab
        setTimeout(() => {
            const newActiveTabId = 'home';
            this.openTab(newActiveTabId);
        });
    }

    //Update opened tabs list entry in DB
    informTabCloseToServer(removedTabInfo) {
        APIService.apiRequest(Constants.API_BASE_URL + '/data_grid/close_analysis_tab/' + removedTabInfo.data.id, null, false, 'PUT', this.controller)
            .then(response => {
                if (response.status === 1) {
                    // No need to do anything, as tab has been removed already in client side
                } else {
                    console.log('Couldn\'t close the tab at Backend');
                    // restore the tab at same position where it was
                    const tabsCurrent = this.state.tabs;
                    this.setState({
                        tabs: [...tabsCurrent.slice(0, removedTabInfo.index), { ...removedTabInfo.data }, ...tabsCurrent.slice(removedTabInfo.index)],
                    });
                }
            })
            .catch(err => {
                console.log('Error on getting data soruces list: ' + err.msg);
                // restore the tab at same position where it was
                const tabsCurrent = this.state.tabs;
                this.setState({
                    tabs: [...tabsCurrent.slice(0, removedTabInfo.index), { ...removedTabInfo.data }, ...tabsCurrent.slice(removedTabInfo.index + 1)],
                });
            });
    }

    //Open new analysis tab on click of button
    handleNewAnalysisBtn(dataSource) {
        this.openTab(`new_${this.state.newTabCounter}`, true);
        this.setState({ newTabCounter: this.state.newTabCounter + 1 });
    }

    // To open new tab
    openTab(tabId, openInEditMode = false) {
        // console.log('here', tabId)
        clearTimeout(this.state.timeout);
        this.setState({ timeout: null }, () => {
            this.props.history.push(`/${this.terminal_type}/datagrid/d-${tabId}${openInEditMode ? '?edit=true' : ''}`);
        });
    }


    //Checks if tab corresponding to tabId in Url already exist in tab list. If No, adds a new tab to list. This method is called whenver tabId in url changes and also after initial data fetch
    addTabIfNeeded() {
        // check if tab being redirected to already available or not
        const alreadyAvailableTabInstance = this.state.tabs.find((t) => 'd-' + t.id === this.props.match.params.tab);
        if (!alreadyAvailableTabInstance) {
            // Add that tab to tablist, handle special case of new tab and any tab which is not available in savedDashboardList
            const tIdFromUrl = this.getTabIdFromUrl()
            let newTab, newTabUpdatedCounter = this.state.newTabCounter;
            if (tIdFromUrl.includes('new')) {
                newTab = { id: tIdFromUrl, name: 'D-New', privileges: '' };
                newTabUpdatedCounter = newTabUpdatedCounter + 1;
            } else {
                // search for tab in savedAnalysis List and if not found, just assign some id and name
                const t = this.state.savedAnalysis ? this.state.savedAnalysis.find(a => String(a.id) === tIdFromUrl) : null;
                if (t) newTab = t;
                else newTab = { id: tIdFromUrl, name: `D-${tIdFromUrl}`, privileges: '' }
            }
            // add some other info to tab and this to tab list
            const isOpenedinEditMode = !tIdFromUrl.includes('new') ? this.checkEditModeFromUrl(this.props.location.search) : true;
            newTab = { ...newTab, editMode: isOpenedinEditMode };
            this.setState({
                tabs: [...this.state.tabs, newTab],
                newTabCounter: newTabUpdatedCounter
            });
        }
        // If tab is already available. now check if its Edit mode has been changed or not
        if (alreadyAvailableTabInstance && (alreadyAvailableTabInstance.editMode === false && this.checkEditModeFromUrl(this.props.location.search) === true)) {
            this.updateTabEditMode(Number(this.getTabIdFromUrl()), this.checkEditModeFromUrl(this.props.location.search));
        }
    }

    //Adds the editMode key of a tab
    updateTabEditMode(tabId, newEditMode) {
        const i = this.state.tabs.findIndex(t => t.id === tabId);
        const updatedTab = { ...this.state.tabs[i], editMode: newEditMode };
        this.setState({
            tabs: [...this.state.tabs.slice(0, i), updatedTab, ...this.state.tabs.slice(i + 1)]
        });
    }


    //Add or Edit Analysis
    handleAnalysisAddOrEdit(tabId, aData) {
        let stateChanges = {};

        // Find the anlaysis in Tab list
        const tIndex = this.state.tabs.findIndex(t => t.id === tabId);
        if (String(tabId).includes('new')) {
            // A New anlaysis is saved, handle this case below

            // Remove the 'new' tab from list bcz now this tab should appear as saved tab and it will be added to tab list as soon as it is opened 
            const updatedTabs = [...this.state.tabs.slice(0, tIndex), ...this.state.tabs.slice(tIndex + 1)];
            stateChanges.tabs = updatedTabs;

            // append the analysisData to current list of savedAnlaysis
            // TO DECIDE - Where this new anlaysis should be added to anlaysislist, as now, dashboard list is paginated
            const updatedSavedAnalysis = [...this.state.savedAnalysis, aData];
            stateChanges.savedAnalysis = updatedSavedAnalysis;

            // // show the Tooltip 'Proceed to add charts' inside dashboard
            // stateChanges.showPlotterBtnTooltip = true;

        } else {
            // An Existing Analysis is edited, handle this case below
            // Update the edited tab's data 
            const updatedTabData = { ...this.state.tabs[tIndex], ...aData };
            const updatedTabs = [...this.state.tabs.slice(0, tIndex), updatedTabData, ...this.state.tabs.slice(tIndex + 1)];
            stateChanges.tabs = updatedTabs;

            // Analysis Edited may or may not be available in 'savedAnalysis'(Due to pagination)
            // Find the Analysis in list and if found, update its data with recieved data
            const aIndex = this.state.savedAnalysis.findIndex(d => d.id === tabId);
            if (aIndex > -1) {
                const updatedDashData = { ...this.state.savedAnalysis[aIndex], ...aData };
                const updatedSavedAnalysis = [...this.state.savedAnalysis.slice(0, aIndex), updatedDashData, ...this.state.savedAnalysis.slice(aIndex + 1)];
                stateChanges.savedAnalysis = updatedSavedAnalysis;
            }

        }
        this.setState({ ...stateChanges });
        // Redirect to url having the newly generated id
        if (String(tabId).includes('new')) {
            const newId = aData.id;
            setTimeout(() => {
                this.openTab(newId, true);
            });
        }
    }


    //Delete Analysis
    handleAnalysisDelete(aId) {
        this.setState({ deletingAnalysisId: aId });
        APIService.apiRequest(Constants.API_BASE_URL + `/data_grid/analysis/${aId}`, {}, false, 'DELETE', this.controller)
            .then(response => {
                if (response.status === 1) {
                    const deletedAnalysis =  this.state.savedAnalysis.find(a=>a.id===aId);
                    const isDeletedPermanently = deletedAnalysis.is_archived===1;

                    alertService.showToast('success', `Analysis '${deletedAnalysis.name}' Deleted ${isDeletedPermanently?' Permanently':''}`);
                    this.setState({
                        deletingAnalysisId: null,
                        savedAnalysis: this.state.savedAnalysis.filter(a => a.id !== aId),
                        tabs: this.state.tabs.filter(t => t.id !== aId),
                    });
                } else {
                    console.log(response.msg);
                    alertService.showToast('error', response.msg);
                }

            })
            .catch(err => {
                console.log(err);
                this.setState({ deletingAnalysisId: null });
            });
    }

    //Bookmark Analysis
    handleAnalysisBookmark(aId) {
        this.setState({ bookmarkingAnalysisId: aId });

        const alreadyBookmarked = this.state.savedAnalysis.find(a => a.id === aId).is_bookmark === 1 ? true : false;
        const apiPath = alreadyBookmarked ? `/data_grid/remove_bookmark/${aId}` : `/data_grid/bookmark/${aId}`;
        APIService.apiRequest(Constants.API_BASE_URL + apiPath, {}, false, 'PUT', this.controller)
            .then(response => {
                if (response.status === 1) {
                    alertService.showToast('success', `Analysis ${alreadyBookmarked ? 'removed from bookmarked' : 'bookmarked'}`);
                    this.setState({
                        bookmarkingAnalysisId: null,
                        // update the bookmark info in savedAnalysis list and tabs list
                        savedAnalysis: this.state.savedAnalysis.map(a => a.id !== aId ? a : { ...a, is_bookmark: alreadyBookmarked ? 0 : 1 }),
                        tabs: this.state.tabs.map(t => t.id !== aId ? t : { ...t, is_bookmark: alreadyBookmarked ? 0 : 1 }),
                    });
                } else {
                    console.log(response.msg);
                    alertService.showToast('error', response.msg);
                }

            })
            .catch(err => {
                console.log(err);
                this.setState({ bookmarkingAnalysisId: null });
            });
    }

    //Download Analysis
    handleAnalysisDownload(aId, type) {
        const analysisToDownload = this.state.savedAnalysis.find(a => a.id === aId);
        let formattedStartDate;
        let formattedEndDate;

        console.log('analysisToDownload', analysisToDownload);

        let dynamicTimePeriod = JSON.parse(analysisToDownload['dynamic_time_period']);
        if(dynamicTimePeriod.is_dynamic){
            let defaultFormat = 'days';
            let defaultCount = 29;
            if (dynamicTimePeriod.value === 'Last 7 Days') { defaultCount = 6; }
            if (dynamicTimePeriod.value === 'Last 15 Days') { defaultCount = 14; }
            if (dynamicTimePeriod.value === 'Last 30 Days') { defaultCount = 29; }
            if (dynamicTimePeriod.value === 'Last Month') { defaultCount = 1; defaultFormat = 'months'; }
            if (dynamicTimePeriod.value === 'This Month') { defaultCount = 1; defaultFormat = 'this_month'; }

            let endDate = moment(this.state.last_updated_date).utc().toDate();
            let formattedEndDate = endDate;

            // let formattedEndDate = moment(endDate.getTime() + endDate.getTimezoneOffset() * 60000).toDate(); //convert to utc time
            formattedStartDate = moment(formattedEndDate).subtract(defaultCount, defaultFormat).toDate();

            if (defaultFormat === 'months') {//for saved views
                formattedStartDate = moment(formattedEndDate).subtract(defaultCount, defaultFormat).startOf('month').toDate();
                formattedEndDate = moment(formattedEndDate).subtract(defaultCount, defaultFormat).endOf('month').toDate();
            }
            if (defaultFormat === 'this_month') {
                formattedStartDate = moment(formattedEndDate).startOf('month').toDate();
            }

        } else {
            formattedStartDate = moment(dynamicTimePeriod.value.firstRange[0]).utc().toDate();
            formattedEndDate = moment(dynamicTimePeriod.value.firstRange[1]).utc().toDate();
        }
        
        var start_date = this.formatDate(formattedStartDate, 'MM/DD/YYYY');
        var end_date = this.formatDate(formattedEndDate, 'MM/DD/YYYY');
        var formatted_date_range = start_date + ' - ' + end_date;
        var inputData = null;

        let apiPayload = {
            "client_id": this.state.client.id,
            "view_type": analysisToDownload['view_type'],
            "daterange": formatted_date_range
        };
        if (analysisToDownload['view_type'] === 'performance') {
            apiPayload['data_source'] = 'advertiser';
        }

        if (type === 'saved_format') {
            let savedConfig = JSON.parse(analysisToDownload['config'])['saveConfig'];
            inputData = {
                "analysisid": null,
                "rows": this.generateSelectedRowsColsElements(savedConfig.rows, savedConfig.values),
                "columns": this.generateSelectedRowsColsElements(savedConfig.columns, savedConfig.values),
                "measurements": {},
                "filters": savedConfig.filters
            }
        }

        let report_name = analysisToDownload['name'].replace(/ /g, "_");
        let download_report_name = report_name + '_' + apiPayload['daterange'].replace(/ /g, "").replace(/\//g, ".") + '_' + Date.now();
        this.getAnalysisID(apiPayload, type, download_report_name, inputData, aId);
        return false;
    }

    //Get Analysis ID and then Get Analysis Data based on received analysis id
    getAnalysisID(analysisPayLoad, type, report_name, input_data, aId) {
        this.setState({ downloadingAnalysisId: aId });

        let api_url = '/startAnalysis';
        let req_method = 'POST';


        if (this.state.terminal_type === 'klay_media') {
            let dateRange = analysisPayLoad['daterange'].split(' - ');
            let start_date = dateRange[0];
            let end_date = dateRange[1];
            api_url = '/' + this.state.terminal_type + '/start_analysis/?start_date=' + start_date + '&end_date=' + end_date + '&view_type=' + this.view_type;

            req_method = 'GET';
            analysisPayLoad = null;
        }

        // console.time('sight: getAnalysisID - API call'); 
        /* API Request parameters -  API_URL, data, showProgress=false, req_method='POST', signal=null */
        APIService.apiRequest(Constants.API_BASE_URL + api_url, analysisPayLoad, false, req_method, this.controller)
            .then(response => {
                if (response.status === 1 && response.analysisid !== undefined) {
                    this.setState({
                        analysisid: response.analysisid,
                        downloadingAnalysisId: null
                    }, () => {
                        if (type === 'unfiltered_data') {
                            this.downloadReport(Constants.API_BASE_URL + '/downloadAnalysisData/?analysisid=' + this.state.analysisid + '&reportname=' + report_name + '&type=unfiltered_data');

                        } else if (type === 'saved_format') {
                            let analysisSavedViewPayLoad = { ...input_data, analysisid: response.analysisid };
                            let inputData = JSON.stringify(analysisSavedViewPayLoad);
                            this.downloadReport(Constants.API_BASE_URL + '/downloadAnalysisData/?inputdata=' + inputData + '&reportname=' + report_name + '&type=saved_format');
                        }
                    });
                } else {
                    this.setState({ error: response.msg, downloadingAnalysisId: null });
                }
            })
            .catch(err => {
                this.setState({ error: err.msg, downloadingAnalysisId: null });
            });
    }

    //Get Values under Columns and Rows
    generateSelectedRowsColsElements(arr, valuesArr) {
        var selected_values;
        var hasValues = arr.find((item, index) => {
            if (item.title === 'values') return true;
        });
        selected_values = this.getkeyValuesInArray(arr, 'title');

        if (hasValues) {
            var newValues = [];
            selected_values.map((item, index) => {
                if (item === 'values') {
                    newValues.push({ 'values': this.generateValues(valuesArr) });
                } else {
                    newValues.push(item);
                }
            });
            return newValues;
        }

        return selected_values;
    }

    //Generate Rows/Columns Values
    getkeyValuesInArray(arr, keyname) {
        var newArr = [];
        for (var i = 0, len = arr.length; i < len; i++) {
            newArr[i] = arr[i][keyname];
        }
        return newArr;
    }

    //Genrate Values
    generateValues(arr) {
        var newObj = [];
        arr.map((item, index) => (
            newObj.push({
                'id': item.title,
                'operation': item.operation,
                'type': item.type,
                'default_action': item.default_action,
            })
        ));
        return newObj;
    }

    //Format Date
    formatDate(date, date_format) {
        return moment(date).format(date_format);
    }

    //Download Report File
    downloadReport(download_url) {
        APIService.apiRequest(download_url, null, false, 'GET', this.controller)
            .then(response => {
                if (response.status === 1 && response.url !== '') {
                    var file_download_url = response.url + '&user_id=' + this.user.id;
                    window.open(file_download_url, "_blank");

                } else {
                    let error_msg = (response.msg !== undefined) ? response.msg : 'Unknown error!';
                    this.setState({
                        inprocess: false,
                        error: error_msg,
                        showAlert: true,
                        message: error_msg
                    });
                }
            })
            .catch(err => {
                this.setState({ inprocess: false, error: err.msg });
            });
    }

    // Handle Refresh Data Click
    handleRefreshData(isCalledOnLoad = false) {
        //Input Validations
        this.setState({ error: '', inprocess: true });

        let api_url = '/refresh_data';
        let req_method = 'POST';
        let apiPayLoad = null;

        if (this.state.terminal_type === 'klay_media') {
            api_url = `/klay_media/refresh_data/${this.state.data_sources[0].name}`;
            apiPayLoad = null;
            req_method = 'GET';
        }

        APIService.apiRequest(Constants.API_BASE_URL + api_url, apiPayLoad, false, req_method, this.controller)
            .then(response => {
                if (isCalledOnLoad) {
                    this.setState({ inprocess: false }, () => {
                        this.handleLoadScripts();
                    });
                } else {
                    this.setState({ inprocess: false });
                    if (response.status === 1 && response.status_batch === 99 && response.msg !== 'latest refresh already') {
                        this.handleLoadScripts();
                    }
                }
            })
            .catch(err => {
                this.setState({ inprocess: false, error: err.msg });
            });
    }

    //Handle console panel toggle
    handlePanelToggle(tabId, panelType) {
        this.setState({
            tabs: this.state.tabs.map(t => t.id !== tabId ? t : { ...t, [panelType]: !t[panelType] })
        });
    }

    // Handle console panel position left/right
    handlePanelPositionChange(tabId, position) {
        this.setState({
            tabs: this.state.tabs.map(t => t.id !== tabId ? t : { ...t, plotterPanelPosition: position })
        });
    }

    // Tabs order change
    handleTabsOrderChange(newTabs) {
        this.setState({ tabs: newTabs });
    }

    // show/hide Preference List
    handlePreferencesToggle() {
        this.setState({ showPreferencesList: !this.state.showPreferencesList });
    }

    //Make the auto hide preferences selection working
    handlePreferenceAutoHidePlotterPanel() {
        this.setState({
            preferenceAutoHidePlotterPanel: !this.state.preferenceAutoHidePlotterPanel
        }, () => {
            let sightSettings = localStorage.getItem(Constants.SITE_PREFIX + 'settings');
            sightSettings = (!sightSettings) ? {} : JSON.parse(sightSettings);
            sightSettings.trend_master = { ...sightSettings.trend_master, plotter_auto_hide: this.state.preferenceAutoHidePlotterPanel };
            localStorage.setItem(Constants.SITE_PREFIX + 'settings', JSON.stringify(sightSettings));
        });
    }

    /*****************************
     * Pagination - Functions
     */
    handlePageChange(pageNo) {
        if (this.state.searchModeOn) {
            this.updateSavedAnalysisListWithSearch(this.state.savedAnalysisPaginationInfo.rowsPerPage, pageNo, this.state.searchInput.trim());
        } else {
            this.updateSavedAnalysisList(this.state.savedAnalysisPaginationInfo.rowsPerPage, pageNo);
        }
    }

    handleRowsPerPageChange(pageSize) {
        if (this.state.searchModeOn) {
            this.updateSavedAnalysisListWithSearch(pageSize, 1, this.state.searchInput.trim());
        } else {
            this.updateSavedAnalysisList(pageSize, 1);
        }
    }

    // On Filters Selection
    handleAnalysisFilterClick(type) {
        this.setState({
            savedAnalysisCurrentFilter: type
        });

        // trigger api request
        let params = { pageSize: DEFAULT_PAGE_SIZE, pageNo: 1 };
        if (type === 'Bookmarked') {
            params.fetchBookmarked = true;
        } else if (type === 'Shared') {
            params.fetchShared = true;
        } else if (type === 'Deleted Items') {
            params.fetchArchived = true;
        }

        this.setState({ inprocess: true, error: '' });
        this.fetchSavedAnalysisList(params)
            .then(response => {
                this.setState({
                    savedAnalysis: response.data,
                    savedAnalysisPaginationInfo: { pageCount: response.num_pages, currentPage: 1, totalResultsCount: response.total_results, rowsPerPage: DEFAULT_PAGE_SIZE },
                    inprocess: false
                });
            })
            .catch(err => {
                console.log(`Error on getting ${type} dashboard list: ` + err.msg);
                this.setState({ inprocess: false, error: err.msg });
            });
    }

    //On Search
    handleSearch(e) {
        e.preventDefault();
        const searchVal = this.state.searchInput;
        if (searchVal.trim() === '') {
            this.setState({
                searchModeOn: false
            });
            this.updateSavedAnalysisList(DEFAULT_PAGE_SIZE, 1);
            return;
        }

        let requests = []; // collect the request promises in array to show/hide loading only when both request are completed
        requests.push(this.searchDashboards(searchVal, 1, DEFAULT_PAGE_SIZE));

        // handle logic for show/hide of search loading
        this.setState({ searching: true });
        Promise.all(requests)
            .then(() => { })
            .catch(() => { })
            .then(() => this.setState({ searching: false, searchModeOn: true }));
        // debouncedSearch.call(this, e.target.value);
    }

    //Reset Search
    handleSearchReset() {
        this.setState({
            searchModeOn: false,
            searchInput: ''
        });
        this.updateSavedAnalysisList(DEFAULT_PAGE_SIZE, 1);
    }

    
    searchDashboards(searchStr, pageNo, pageSize) {
        const searchDashboardsReq = APIService.apiRequest(Constants.API_BASE_URL + `/trend_master/search/sellside?search_string=${searchStr}&search_type=dashboard&page_number=${pageNo}&page_size=${pageSize}`, null, false, 'GET', this.controller);
        searchDashboardsReq.then(response => {
            if (response.status === 1) {
                this.setState({
                    savedDashboards: response.data,
                    savedAnalysisPaginationInfo: { pageCount: response.num_pages, currentPage: 1, totalResultsCount: response.total_results, rowsPerPage: DEFAULT_PAGE_SIZE },
                });
            }
        }).catch(err => {
            console.log('Error occured in searching Dashbaords', err);
        });
        return searchDashboardsReq;
    }

    copyFunction(e) {
        e.preventDefault();
        let copyData = this.state.dataToCopy;
        e.clipboardData.setData('text/plain', copyData);
    }

    handleDataToCopy(selectedData) {
        let dataToCopy = '';
        let dataRow = '';
        for (let i = 0; i < selectedData.length; i += 1) {
          dataRow = '';
          for (let j = 0; j < selectedData[i].length; j += 1) {
            dataRow += `${selectedData[i][j]}\t`
          }
          dataToCopy += `${dataRow}\n`;
        }
        this.setState({ dataToCopy: dataToCopy });
      }

    handleSelectAll() {
        let allTabs = document.getElementsByClassName('cell')
        for (let i = 0; i < allTabs.length; i += 1) {
            if (allTabs[i].classList.contains('selected')) {
                allTabs[i].classList.remove('selected');
            }
        }

        let activeTabId = this.getTabIdFromUrl()
        let selectedData = [];

        let tabs = document.getElementsByClassName(`tbl-row-${activeTabId}`)
        for (let k = 2; k <= tabs[0].childNodes.length; k += 1) {
            let row = tabs[0].childNodes[k];
            if (row && row.childNodes.length === 2) {
                let col = row.childNodes[1];
                let rowData = [];
                for (let l = 2; l < col.childNodes.length; l += 1) {
                    let data = col.childNodes[l].textContent;
                    if (k == 2) {
                        rowData.push("");
                        selectedData.push(rowData)
                        rowData = [];
                    } 
                    rowData = selectedData[l-2];
                    rowData.push(data);
                    selectedData[l-2] = rowData
                    rowData = [];
                }
            }
        }

        for (let i = 1; i < tabs.length; i += 1) {
            let row = tabs[i].childNodes;
            let rowData = [];
            if (row[1].textContent.length === 0) {
                break;
            }
            for (let j = 1; j < row.length; j += 1) {
                let col = row[j];
                let data = col.textContent;
                if (data.length === 0) {
                    break;
                }
                col.classList.add('selected');
                rowData.push(data);
            }
            selectedData.push(rowData)
        }
        this.handleDataToCopy(selectedData);
    }

    handleKeyDownEvent(e) {
        e.key !== 'a' && this.setState({ previousKey: e.key });
        if ((this.state.previousKey.includes('Meta') || this.state.previousKey.includes('Ctrl')) && e.code === 'KeyA') {
          e.preventDefault();
          this.handleSelectAll();
        }
      }



    updateSavedAnalysisList(pageSize, pageNo) {
        this.setState({ inprocess: true });

        let params = { pageSize, pageNo };
        const currentListFilter = this.state.savedAnalysisCurrentFilter;
        if (currentListFilter === 'Bookmarked') {
            params.fetchBookmarked = true;
        } else if (currentListFilter === 'Shared') {
            params.fetchShared = true;
        } else if (currentListFilter === 'Deleted Items') {
            params.fetchArchived = true;
        }
        this.fetchSavedAnalysisList(params)
            .then(response => {
                this.setState({
                    savedAnalysis: [ ...this.state.savedAnalysis, ...response.data ],
                    savedAnalysisPaginationInfo: { pageCount: response.num_pages, currentPage: pageNo, totalResultsCount: response.total_results, rowsPerPage: pageSize },
                    inprocess: false
                });
            })
            .catch(err => {
                console.log('Error on getting Saved dashboard list: ' + err.msg);
                this.setState({ inprocess: false, error: err.msg });
            });
    }


    updateSavedAnalysisListWithSearch(pageSize, pageNo, searchStr) {
        this.setState({ inprocess: true });

        this.searchDashboards(searchStr, pageNo, pageSize)
            .then(response => {
                this.setState({
                    savedDashboards: response.data,
                    savedAnalysisPaginationInfo: { pageCount: response.num_pages, currentPage: pageNo, totalResultsCount: response.total_results, rowsPerPage: pageSize },
                    inprocess: false
                });
            })
            .catch(err => {
                console.log('Error on getting serched dashboard list: ' + err.msg);
                this.setState({ inprocess: false, error: err.msg });
            });
    }



    render() {
        const activeTabId = this.getTabIdFromUrl() || 'home';

        return (
            <div className="app-wrapper datagrid">
                <div id="app-sub-header">
                    <DashboardTabs tabs={this.state.tabs}
                        activeTabId={activeTabId}
                        onOpen={this.openTab}
                        onRemove={this.handleTabRemove}
                        onEdit={tId => this.openTab(tId, true)}
                        onPublish={tId => this.openTab(tId, false)}
                        onPanelToggle={this.handlePanelToggle}
                        onTabsOrderChange={this.handleTabsOrderChange}
                        onTabAddBtn={this.handleNewAnalysisBtn}
                    />
                </div>

                <div className="container">
                    <div id="datagrid" className="inner-container">
                        <div className="d-tab-content-wrapper" id="d-home" style={{ display: activeTabId === 'home' ? 'block' : 'none' }}>
                            <div className="datagrid-home">
                                {this.state.savedAnalysis &&
                                    <div className="datagrid-home-filters">
                                        <div className="filters">
                                            {DATAGRID_FILTERS_TABS.map((f,i) => {
                                                const isSelected = this.state.savedAnalysisCurrentFilter === f;
                                                return (
                                                    <button key={i} className={'btn' + (isSelected ? ' selected' : '')} onClick={() => this.handleAnalysisFilterClick(f)}>{f}</button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                }

                                {/* {this.state.savedAnalysis && this.state.savedAnalysis.length === 0 &&
                                    <div className="no-data-msg">No Data Available</div>
                                } */}

                                <DataGridHomeTable
                                    inprocess={this.state.inprocess}
                                    userId={this.user.id}
                                    anaylsisList={this.state.savedAnalysis}
                                    analysisAPICall={this.onPageScroll}
                                    that={this}
                                    savedAnalysisPaginationInfo={this.state.savedAnalysisPaginationInfo}
                                    downloadingAnalysisId={this.state.downloadingAnalysisId}
                                    deletingAnalysisId={this.state.deletingAnalysisId}
                                    bookmarkingAnalysisId={this.state.bookmarkingAnalysisId}
                                    onAnalysisClick={(aId) => this.openTab(aId, false)}
                                    onAnalysisEdit={(aId) => this.openTab(aId, true)}
                                    onAnalysisDelete={this.handleAnalysisDelete}
                                    onAnalysisDownload={this.handleAnalysisDownload}
                                    onAnalysisBookmark={this.handleAnalysisBookmark}
                                />

                                {/* {this.state.savedAnalysis && this.state.savedAnalysis.length > 0 &&
                                    <Pagination
                                        pageCount={this.state.savedAnalysisPaginationInfo.pageCount}
                                        currentPage={this.state.savedAnalysisPaginationInfo.currentPage}
                                        onPageChange={this.handlePageChange}
                                        rowsPerPage={this.state.savedAnalysisPaginationInfo.rowsPerPage}
                                        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                                        onRowsPerPageChange={this.handleRowsPerPageChange}
                                        totalRowsCount={this.state.savedAnalysisPaginationInfo.totalResultsCount}
                                        disabled={this.state.inprocess}
                                    />
                                } */}
                            </div>
                        </div>

                        {this.state.tabs.length > 1 &&
                            <React.Fragment>
                                {this.state.tabs.slice(1).map((t, i) => {
                                    const isActiveAnalysis = String(t.id) === activeTabId;

                                    // return <div key={t.id} className="d-tab-content-wrapper" style={{ visibility: isActiveAnalysis ? 'visible' : 'hidden',height :isActiveAnalysis ? 'auto' : 0,zIndex : isActiveAnalysis  ? 1 : -1  }}>
                                    return <div key={t.id} className="d-tab-content-wrapper" id={`d-${t.id}`} style={{ display: isActiveAnalysis ? 'block' : 'none' }}>
                                        <AnalysisView
                                            isActiveTab={isActiveAnalysis}
                                            analysisSavedSettings={t}
                                            isAnalysisInEditMode={this.checkEditModeFromUrl(this.props.location.search)}
                                            onAnalysisSaveOrEdit={(data) => this.handleAnalysisAddOrEdit(t.id, data)}
                                            setTimeoutVar={(timeoutVar) => this.setState({ timeout: timeoutVar })}
                                            timeoutVar={this.state.timeout}
                                            setDataToCopy={(dataToCopy) => this.setState({ dataToCopy: dataToCopy })}
                                            handleSelectAll={this.handleSelectAll}
                                        // showConsolePanel={t.showConsolePanel}
                                        // panelPosition={t.plotterPanelPosition}
                                        // onPanelPositionChange={this.handlePanelPositionChange}
                                        />
                                    </div>
                                })}
                            </React.Fragment>
                        }

                    </div>
                </div>
            </div>
        );
    }
}

export default DataGrid;


const Pagination = ({ totalRowsCount, pageCount, currentPage, onPageChange, rowsPerPage, rowsPerPageOptions, onRowsPerPageChange, disabled }) => {
    const [pageInput, setPageInput] = useState(currentPage);

    const handlePageInputBlur = () => {
        // check if pageInput has a valid value or not
        let newPage = Number(pageInput);
        const isValidInput = !Number.isNaN(newPage) && Number.isInteger(newPage);
        // adjust the newPage value if goes out of range
        newPage = newPage < 1 ? 1 : newPage > pageCount ? pageCount : newPage;
        if (isValidInput && newPage !== currentPage) {
            onPageChange(newPage);
        } else {
            setPageInput(currentPage);
        }

    };

    useEffect(() => {
        setPageInput(currentPage);
    }, [currentPage]);

    return (
        <div className={'pagination-wrapper' + (disabled ? ' disabled' : '')}>
            <div className="total-pages">{'Total Pages ' + pageCount}</div>
            <ul className="pagination-buttons">
                <li className={'page-btn page-btn-first' + (currentPage === 1 ? ' disabled' : '')}>
                    <button onClick={() => onPageChange(1)}></button>
                </li>
                <li className={'page-btn page-btn-prev' + (currentPage === 1 ? ' disabled' : '')}>
                    <button onClick={() => onPageChange(currentPage - 1)}></button>
                </li>
                <li className={'page-input'}>
                    <input value={pageInput} onChange={(e) => setPageInput(e.target.value)} onBlur={handlePageInputBlur} />
                </li>
                <li className={'page-btn page-btn-next' + (currentPage === pageCount ? ' disabled' : '')}>
                    <button onClick={() => onPageChange(currentPage + 1)}></button>
                </li>
                <li className={'page-btn page-btn-last' + (currentPage === pageCount ? ' disabled' : '')}>
                    <button onClick={() => onPageChange(pageCount)}></button>
                </li>
            </ul>

            <div className="rows-per-page">
                <span>Entries Per Page</span>
                <span className="dropdown">
                    <select value={rowsPerPage} onChange={(e) => onRowsPerPageChange(e.target.value)}>
                        {rowsPerPageOptions.map(op => (
                            <option key={op} value={op} >{op}</option>
                        ))}
                    </select>
                </span>
            </div>

            <div className="visible-rows-info">
                {`Showing ${(currentPage - 1) * rowsPerPage + 1} - ${Math.min(totalRowsCount, (currentPage - 1) * rowsPerPage + rowsPerPage)} of ${totalRowsCount}`}
            </div>
        </div>
    );
};



