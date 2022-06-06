import React, { Component, useState, useEffect, useRef } from 'react';
import * as Constants from '../../../components/Constants.js';
import '../../../styles/TrendMaster.scss';
import '../../../styles/Chart.scss';

import { getKeyByValue, getClients, getUser, convertDatePeriodPreselectsToRange, giveDotSeparatedDateRange } from '../../../utils/Common'; //Import Common Functions
import { formatChartData, drawDynamicChart, formatNumber,
    chartSortingFormating, getDefaultChartFormat, isAbbrevationName
} from './ChartsUtils';
import APIService from '../../../services/apiService'; //Import Services
import DashboardTabs from './DashboardTabs.js';
import TrendMasterHomeTable from './TrendMasterHomeTable.js';
import ReportView from './ReportView.js';
import alertService from '../../../services/alertService.js';
import subjectObj from '../../../subjects/Subject1';
import ClickOutsideListener from '../../../components/ClickOutsideListner';
import { UserAvatar } from '../../../components/UserAvatar/UserAvatar';
import subject2 from '../../../subjects/Subject2.js';

const ROWS_PER_PAGE_OPTIONS = [10, 20, 30, 50, 100, 200];
const DEFAULT_PAGE_SIZE = ROWS_PER_PAGE_OPTIONS[4];


// TODO - Use below method later when elastic search is implmented from backend
// const debouncedSearch = debounce(function (val) {
//     // console.log('Search handler called....', val);
//     if (val === '') {
//         this.setState({
//             searchedChartsInfo: null,
//         });
//         this.updateSavedDashboardList(ROWS_PER_PAGE_OPTIONS[0], 1);
//         return;
//     }

//     this.setState({ searching: true });
//     APIService.apiRequest(Constants.API_BASE_URL + `/trend_master/search/sellside?search_string=${val}&page_number=1&page_size=5`, null, false, 'GET', this.controller)
//         .then(response => {
//             this.setState({ searching: false });
//             if (response.status === 1) {
//                 this.setState({
//                     savedDashboards: response.data.dashboards,
//                     searchedChartsInfo: response.data.results_chart.map(result => {
//                         result.dynamic_time_period = result.dynamic_time_period ? JSON.parse(result.dynamic_time_period) : '';
//                         return { ...result, ref: React.createRef() }
//                     }),
//                     searchedChartsDataObj: {}
//                 });
//             }
//         })
//         .catch(err => {
//             this.setState({ searching: false });
//         });

// }, 225);

class TrendMaster extends Component {
    constructor(props) {
        super(props);

        //Get Client & View Type
        this.page_title = 'Trend Master';
        this.user = getUser();
        this.view_type = props.match.params.view_type;
        this.terminal_type = this.user.terminal_type.id;
        this.controller = new AbortController();

        this.state = this.getInitVariables();

        //Event Bind
        this.getInitialSavedDashboardList = this.getInitialSavedDashboardList.bind(this);
        this.handleTabRemove = this.handleTabRemove.bind(this);
        this.handleNewAnalysisBtn = this.handleNewAnalysisBtn.bind(this);
        this.openTab = this.openTab.bind(this);

        this.handleDashboardDelete = this.handleDashboardDelete.bind(this);
        this.handleDashboardShare = this.handleDashboardShare.bind(this);
        this.handleDashboardCopy = this.handleDashboardCopy.bind(this);
        this.handleDashboardBookmark = this.handleDashboardBookmark.bind(this);
        this.handleDashboardColumnSort = this.handleDashboardColumnSort.bind(this);

        this.handlePanelToggle = this.handlePanelToggle.bind(this);
        this.handlePanelPositionChange = this.handlePanelPositionChange.bind(this);
        this.handleTabsOrderChange = this.handleTabsOrderChange.bind(this);
        this.handlePreferencesToggle = this.handlePreferencesToggle.bind(this);
        this.handlepreferenceAutoHideConsolePanel = this.handlepreferenceAutoHideConsolePanel.bind(this);
        this.handlePageChange = this.handlePageChange.bind(this);
        this.handleRowsPerPageChange = this.handleRowsPerPageChange.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
        this.handleSearchReset = this.handleSearchReset.bind(this);
        this.handleIncludeChartResultsToggle = this.handleIncludeChartResultsToggle.bind(this);
        // this.handleChartMetaDrodDownToggle = this.handleChartMetaDrodDownToggle.bind(this);
        this.handleHideCreateMsg = this.handleHideCreateMsg.bind(this);

        this.onPageScroll = this.onPageScroll.bind(this);
    }

    getInitVariables() {
        let client_id = this.user.last_fetched_client;
        let sightSettings = JSON.parse(localStorage.getItem(Constants.SITE_PREFIX + 'settings'));
        let plotter_auto_hide = sightSettings && sightSettings['trend_master'] ? sightSettings['trend_master']['plotter_auto_hide'] : false;

        let initialObj = {
            inprocess: true,
            error: "",
            client: (client_id !== '' ? getKeyByValue(getClients(), client_id, 'id') : ''),
            terminal_type: this.user.terminal_type.id,

            searchInput: '',
            searching: false,
            searchModeOn: false, // to store wheather the current visible list is obtainer via search or from initial load
            includeChartsInSearch: false,
            searchedChartsInfo: null,
            searchedChartsDataObj: {},
            searchedChartsLoading: {},

            isDashboardAPICalled: false,
            savedDashboards: null,
            savedDashbaordsPaginationInfo: {
                pageCount: null,
                currentPage: null,
                rowsPerPage: DEFAULT_PAGE_SIZE,
                totalResultsCount: null,
            },
            savedDashboardCurrentFilter: 'All', // store what filters among 'All','Deleted Items','Shared' etc filters is applied currently
            savedDashboardCurrentSort: null, // store what sorting({name:<column name>,isAscending:true/false}) is applied
            tabs: [{ id: 'home', dashboard_name: 'home' }], // used to show the tab list of all current dashbaords(whose `is_current_tab` is 1), Home tab is present at client only
            newTabCounter: 1,
            deletingDashboardId: null,
            copyingDashboardId: null,
            sharingDashboardId: null,
            bookmarkingDashboardId: null,

            showDashboardCreatedMsg: false, // used to show Tooltip on plotter button inside dashboard for just created dashboard
            showPreferencesList: false,
            // showPreferencesList: false,
            preferenceAutoHideConsolePanel: plotter_auto_hide ? plotter_auto_hide : false,
            // showMetaDropDownToggle: {}
        };
        return initialObj;
    }

    componentDidMount() {
        this.handleLoadScripts();
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
        subject2.unSubscribe(this.handleClientChange.bind(this));
    }

    //Load Scripts on Page/View Load
    handleLoadScripts() {
        subjectObj.notify({
            page_title: this.page_title,
            client: this.state.client
        });

        this.getInitialSavedDashboardList();
        this.getOpenedTabsList();
    }

    handleClientChange(obj) {
        this.setState({
            client: obj.client,
        }, () => {
            this.handleLoadScripts();
        });
    }

    onPageScroll(pageSize, pageNo, that) {
        that.updateSavedDashboardList(pageSize, pageNo);
    }


    fetchSavedDashboardList({ pageSize, pageNo, fetchOpened = false, fetchBookmarked = false, fetchShared = false, fetchArchived = false, sortInfo = null }) {
        return new Promise((resolve, reject) => {
            let query = `?page_size=${pageSize}&page_number=${pageNo}`;
            query += fetchOpened ? `&is_current=1` : '';
            query += fetchBookmarked ? `&is_bookmark=1` : '';
            query += fetchShared ? `&is_shared=1` : '';
            query += fetchArchived ? `&is_archived=1` : '';
            query += sortInfo ? `&sort_by={column:${sortInfo.name},ascending:${sortInfo.isAscending}}` : '';

            APIService.apiRequest(Constants.API_BASE_URL + `/trend_master/get_dashboard_list/${this.state.terminal_type}${query}`, null, false, 'GET', this.controller)
                .then(response => {
                    if (response.status === 1 && response.data.length) {
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

    getInitialSavedDashboardList() {
        this.setState({ inprocess: true, error: '' });

        this.fetchSavedDashboardList({ pageSize: DEFAULT_PAGE_SIZE, pageNo: 1 })
            .then(response => {
                this.setState({
                    savedDashboards: response.data,
                    savedDashbaordsPaginationInfo: { pageCount: response.num_pages, currentPage: 1, totalResultsCount: response.total_results, rowsPerPage: DEFAULT_PAGE_SIZE },
                    inprocess: false
                });
            })
            .catch(err => {
                console.log('Error on getting Saved dashboard list: ' + err.msg);
                this.setState({ inprocess: false, error: err.msg });
            });
    }

    getOpenedTabsList() {
        const MAX_TAB_LIMIT = 50;
        this.fetchSavedDashboardList({ pageSize: MAX_TAB_LIMIT, pageNo: 1, fetchOpened: true })
            .then(response => {
                const isEditModeOn = this.checkEditModeFromUrl(this.props.location.search);
                const editModeTabId = isEditModeOn ? this.getTabIdFromUrl() : null;
                
                this.setState({
                    // append the opened tabs in tab list (which contains only home tab intially)
                    tabs: [this.state.tabs[0], ...response.data].map(d => ({ ...d, editMode: editModeTabId === String(d.id), showConsolePanel: false, consolePanelPosition: 'right' })),
                    inprocess: false
                }, () => {
                    this.addTabIfNeeded();
                    // Check if current tab in url is in Edit mode and if that is allowed to be opened in Edit mode or not
                    if (editModeTabId) {
                        // Check if current dashboardId in url(if any) is allowed to be opened in Edit mode or not
                        const canBeOpenedInEditMode = editModeTabId.includes('new') ? true : response.data.find(d => editModeTabId === String(d.id)).privileges.includes('EDIT');
                        if (!canBeOpenedInEditMode) {
                            // Restricted Route , hence redirect to View mode
                            this.openTab(editModeTabId, false);
                            return;
                        }
                    }
                });
            })
            .catch(err => {
                console.log('Error on getting Opened dashboard list: ' + err.msg);
            });
    }

    /**Returns the tabId present in Url. If param is of form 'd-{id}', only then it is considered as valid, otherwise null is returned */
    getTabIdFromUrl() {
        const tabParam = this.props.match.params.tab.split('-');
        const isIdValid = tabParam.length === 2 && tabParam[0] === 'd';
        return isIdValid ? tabParam[1] : null;
    }

    checkEditModeFromUrl(url) {
        const searchParams = new URLSearchParams(url);
        return searchParams.get('edit') === 'true' ? true : false;
    }


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

        //In either case, redirect to some other tab('home' as of now)
        setTimeout(() => {
            const newActiveTabId = 'home';
            this.openTab(newActiveTabId);
        });
    }

    informTabCloseToServer(removedTabInfo) {
        APIService.apiRequest(Constants.API_BASE_URL + '/trend_master/close_dashboard_tab/' + removedTabInfo.data.id, null, false, 'PUT', this.controller)
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

    handleNewAnalysisBtn() {
        this.openTab(`new_${this.state.newTabCounter}`, true);
        this.setState({ newTabCounter: this.state.newTabCounter + 1 });
    }

    openTab(tabId, editMode = false) {
        this.props.history.push(`/${this.terminal_type}/datatrend/d-${tabId}` + (editMode ? '?edit=true' : ''));
    }


    /**Checks if tab corresponding to tabId in Url already exist in tab list. If No, adds a new tab to list. This method is called whenver tabId in url changes and also after initial data fetch */
    addTabIfNeeded(prevRouteProps = null) {
        // check if tab being redirected to already available or not
        const alreadyAvailableTabInstance = this.state.tabs.find((t) => 'd-' + t.id === this.props.match.params.tab);
        if (!alreadyAvailableTabInstance) {
            // Add that tab to tablist, handle special case of new tab and any tab which is not available in savedDashboardList
            const tIdFromUrl = this.getTabIdFromUrl()
            let newTab;
            if (tIdFromUrl.includes('new')) {
                newTab = { id: tIdFromUrl, dashboard_name: 'D-New', privileges: '' };
            } else {
                // search for tab in savedDashboard List and if not found, just assign some id and dashboard_name
                const t = this.state.savedDashboards.find(d => String(d.id) === tIdFromUrl);
                if (t) newTab = t;
                else newTab = { id: tIdFromUrl, dashboard_name: `D-${tIdFromUrl}` }
            }
            // add some other info to tab and this to tab list
            const isOpenedinEditMode = !tIdFromUrl.includes('new') ? this.checkEditModeFromUrl(this.props.location.search) : true;
            newTab = { ...newTab, editMode: isOpenedinEditMode, showConsolePanel: isOpenedinEditMode, consolePanelPosition: 'right' };
            this.setState({
                tabs: [...this.state.tabs, newTab],
            });
        }
        // If tab is already available. now check if its Edit mode has been changed or not
        if (alreadyAvailableTabInstance && (alreadyAvailableTabInstance.editMode === false && this.checkEditModeFromUrl(this.props.location.search) === true)) {
            this.updateTabEditMode(Number(this.getTabIdFromUrl()), this.checkEditModeFromUrl(this.props.location.search));
        }
    }

    /**Adds the editMode key of a tab */
    updateTabEditMode(tabId, newEditMode) {
        const i = this.state.tabs.findIndex(t => t.id === tabId);
        const updatedTab = { ...this.state.tabs[i], editMode: newEditMode };
        this.setState({
            tabs: [...this.state.tabs.slice(0, i), updatedTab, ...this.state.tabs.slice(i + 1)]
        });
    }


    handleDashboardAddOrEdit(tabId, dashData) {
        let stateChanges = {};

        // Find the dashboard in Tab list
        const tIndex = this.state.tabs.findIndex(t => t.id === tabId);
        if (String(tabId).includes('new')) {
            // A New Dashboard is saved, handle this case below

            // Remove the 'new' tab from list bcz now this tab should appear as saved tab and it will be added to tab list as soon as it is opened 
            const updatedTabs = [...this.state.tabs.slice(0, tIndex), ...this.state.tabs.slice(tIndex + 1)];
            stateChanges.tabs = updatedTabs;

            // append the dashData to current list of savedDashboard
            // TO DECIDE - Where this new dashboard should be added to dashboardlist, as now, dashboard list is paginated
            const updatedSavedDashboards = [...this.state.savedDashboards, dashData];
            stateChanges.savedDashboards = updatedSavedDashboards;

            // show the Tooltip 'Proceed to add charts' inside dashboard
            stateChanges.showDashboardCreatedMsg = true;

        } else {
            // An Existing Dashboard is edited, handle this case below
            // Update the edited tab's data 
            const updatedTabData = { ...this.state.tabs[tIndex], ...dashData };
            const updatedTabs = [...this.state.tabs.slice(0, tIndex), updatedTabData, ...this.state.tabs.slice(tIndex + 1)];
            stateChanges.tabs = updatedTabs;

            // Dashboard Edited may or may not be available in 'savedDashboards'
            // Find the dashboard in list and if found, update its data with recieved data
            const dIndex = this.state.savedDashboards.findIndex(d => d.id === tabId);
            if (dIndex > -1) {
                const updatedDashData = { ...this.state.savedDashboards[dIndex], ...dashData };
                const updatedSavedDashboards = [...this.state.savedDashboards.slice(0, dIndex), updatedDashData, ...this.state.savedDashboards.slice(dIndex + 1)];
                stateChanges.savedDashboards = updatedSavedDashboards;
            }

        }
        this.setState({ ...stateChanges });
        // Redirect to url having the newly generated id
        if (String(tabId).includes('new')) {
            const newId = dashData.id;
            setTimeout(() => {
                this.openTab(newId, true);
            });
        }
    }

    handleDashboardDelete(dId) {
        this.setState({ deletingDashboardId: dId });
        APIService.apiRequest(Constants.API_BASE_URL + '/trend_master/dashboard/' + dId, null, false, 'DELETE', this.controller)
            .then(response => {
                this.setState({ deletingDashboardId: null });
                if (response.status === 1) {
                    const dName = this.state.savedDashboards.find(d => d.id === dId).dashboard_name;
                    const deletedPermanently = this.state.savedDashboards.find(d => d.id === dId).is_archived === 1;
                    alertService.showToast('success', `Dashboard '${dName}' Deleted${deletedPermanently ? ' Permanently' : ''}`);
                    // remove the dashboard from savedDashboard list and tab list
                    this.setState({
                        savedDashboards: this.state.savedDashboards.filter(d => d.id !== dId),
                        tabs: this.state.tabs.filter(t => t.id !== dId),
                    });
                }
            })
            .catch(err => {
                this.setState({ deletingDashboardId: null });
            });
    }

    handleDashboardCopy(dId) {
        const payload = { dashboard_id: dId, copy_type: 'full' };
        this.setState({ copyingDashboardId: dId });
        APIService.apiRequest(Constants.API_BASE_URL + '/trend_master/copy_dashboard', payload, false, 'PUT', this.controller)
            .then(response => {
                this.setState({ copyingDashboardId: null });
                if (response.status === 1) {
                    const dName = this.state.savedDashboards.find(d => d.id === dId).dashboard_name;
                    alertService.showToast('success', `Dashboard '${dName}' Copied Successfully`);

                    this.setState({
                        savedDashboards: [response.dashboard, ...this.state.savedDashboards],
                        savedDashbaordsPaginationInfo: { ...this.state.savedDashbaordsPaginationInfo, totalResultsCount: this.state.savedDashbaordsPaginationInfo.totalResultsCount + 1 }
                    }, () => this.openTab(Number(response.dashboard.id), true));
                }
            })
            .catch(err => {
                this.setState({ copyingDashboardId: null });
            });
    }

    handleDashboardShare(dId) {
        this.setState({ sharingDashboardId: dId });
    }

    handleDashboardBookmark(dId) {
        this.setState({ bookmarkingDashboardId: dId });

        const alreadyBookmarked = this.state.savedDashboards.find(d => d.id === dId).is_bookmark === 1 ? true : false;
        const apiPath = alreadyBookmarked ? `/trend_master/remove_bookmark/${dId}` : `/trend_master/bookmark/${dId}`;
        APIService.apiRequest(Constants.API_BASE_URL + apiPath, {}, false, 'PUT', this.controller)
            .then(response => {
                if (response.status === 1) {
                    alertService.showToast('success', `Dashboard ${alreadyBookmarked ? 'removed from bookmarked' : 'bookmarked'}`);
                    this.setState({
                        bookmarkingDashboardId: null,
                        // update the bookmark info in savedDashboards list and tabs list
                        savedDashboards: this.state.savedDashboards.map(d => d.id !== dId ? d : { ...d, is_bookmark: alreadyBookmarked ? 0 : 1 }),
                        tabs: this.state.tabs.map(t => t.id !== dId ? t : { ...t, is_bookmark: alreadyBookmarked ? 0 : 1 }),
                    });
                } else {
                    console.log(response.msg);
                    alertService.showToast('error', response.msg);
                }

            })
            .catch(err => {
                console.log(err);
                this.setState({ bookmarkingDashboardId: null });
            });
    }


    handlePanelToggle(tabId, panelType) {
        this.setState({
            tabs: this.state.tabs.map(t => t.id !== tabId ? t : { ...t, [panelType]: !t[panelType] })
        });
    }

    handlePanelPositionChange(tabId, position) {
        this.setState({
            tabs: this.state.tabs.map(t => t.id !== tabId ? t : { ...t, consolePanelPosition: position })
        });
    }


    handleTabsOrderChange(newTabs) {
        this.setState({ tabs: newTabs });
    }

    //show/hide Preference List
    handlePreferencesToggle() {
        this.setState({ showPreferencesList: !this.state.showPreferencesList });
    }

    //Make the auto hide preferences selection working
    handlepreferenceAutoHideConsolePanel() {
        this.setState({
            preferenceAutoHideConsolePanel: !this.state.preferenceAutoHideConsolePanel
        }, () => {
            let sightSettings = localStorage.getItem(Constants.SITE_PREFIX + 'settings');
            sightSettings = (!sightSettings) ? {} : JSON.parse(sightSettings);
            sightSettings.trend_master = { ...sightSettings.trend_master, plotter_auto_hide: this.state.preferenceAutoHideConsolePanel };
            localStorage.setItem(Constants.SITE_PREFIX + 'settings', JSON.stringify(sightSettings));
        });
    }

    handlePageChange(pageNo) {
        if (this.state.searchModeOn) {
            this.updateSavedDashboardListWithSearch(this.state.savedDashbaordsPaginationInfo.rowsPerPage, pageNo, this.state.searchInput.trim());
        } else {
            this.updateSavedDashboardList(this.state.savedDashbaordsPaginationInfo.rowsPerPage, pageNo);
        }
    }

    handleRowsPerPageChange(pageSize) {
        if (this.state.searchModeOn) {
            this.updateSavedDashboardListWithSearch(pageSize, 1, this.state.searchInput.trim());
        } else {
            this.updateSavedDashboardList(pageSize, 1);
        }
    }


    handleDashboardFilterClick(type) {
        this.setState({
            savedDashboardCurrentFilter: type
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
        params.sortInfo = null;

        this.setState({ inprocess: true, error: '' });
        this.fetchSavedDashboardList(params)
            .then(response => {
                this.setState({
                    savedDashboards: response.data,
                    savedDashbaordsPaginationInfo: { pageCount: response.num_pages, currentPage: 1, totalResultsCount: response.total_results, rowsPerPage: DEFAULT_PAGE_SIZE },
                    savedDashboardCurrentSort:null,
                    inprocess: false
                });
            })
            .catch(err => {
                console.log(`Error on getting ${type} dashboard list: ` + err.msg);
                this.setState({ inprocess: false, error: err.msg });
            });
    }

    handleDashboardColumnSort(colName) {
        const currentSortInfo = this.state.savedDashboardCurrentSort;
        // this.setState({
        //     savedDashboardCurrentSort: currentSortInfo && currentSortInfo.name === colName ? { name: colName, isAscending: !currentSortInfo.isAscending } : { name: colName, isAscending: true }
        // });

        // set other pagination and currently applied filter related variables
        let params = { pageSize: DEFAULT_PAGE_SIZE, pageNo: 1 };
        const currentFilter = this.state.savedDashboardCurrentFilter;
        if (currentFilter === 'Bookmarked') {
            params.fetchBookmarked = true;
        } else if (currentFilter === 'Shared') {
            params.fetchShared = true;
        } else if (currentFilter === 'Deleted Items') {
            params.fetchArchived = true;
        }
        params.sortInfo = currentSortInfo && currentSortInfo.name === colName ? { name: colName, isAscending: !currentSortInfo.isAscending } : { name: colName, isAscending: true };

        this.setState({ inprocess: true, error: '' });
        this.fetchSavedDashboardList(params)
            .then(response => {
                this.setState({
                    savedDashboards: response.data,
                    savedDashbaordsPaginationInfo: { pageCount: response.num_pages, currentPage: 1, totalResultsCount: response.total_results, rowsPerPage: DEFAULT_PAGE_SIZE },
                    savedDashboardCurrentSort : params.sortInfo,
                    inprocess: false
                });
            })
            .catch(err => {
                console.log(`Error on getting sorted dashboard list: ` + err.msg);
                this.setState({ inprocess: false, error: err.msg });
            });
    }


    handleSearch(e) {
        e.preventDefault();
        const searchVal = this.state.searchInput;
        if (searchVal.trim() === '') {
            this.setState({
                searchedChartsInfo: null,
                searchModeOn: false
            });
            this.updateSavedDashboardList(DEFAULT_PAGE_SIZE, 1);
            return;
        }

        let requests = []; // collect the request promises in array to show/hide loading only when both request are completed
        requests.push(this.searchDashboards(searchVal, 1, DEFAULT_PAGE_SIZE));

        // only send the request for chart search if Checkbox for the same is checked
        if (this.state.includeChartsInSearch) {
            requests.push(this.searchCharts(searchVal));
        } else {
            this.setState({
                searchedChartsInfo: null,
                searchedChartsDataObj: {}
            });
        }

        // handle logic for show/hide of search loading
        this.setState({ searching: true });
        Promise.all(requests)
            .then(() => { })
            .catch(() => { })
            .then(() => this.setState({ searching: false, searchModeOn: true }));
        // debouncedSearch.call(this, e.target.value);
    }

    handleSearchReset() {
        this.setState({
            searchedChartsInfo: null,
            searchModeOn: false,
            searchInput: ''
        });
        this.updateSavedDashboardList(DEFAULT_PAGE_SIZE, 1);
    }

    searchCharts(searchStr) {
        const searchChartsReq = APIService.apiRequest(Constants.API_BASE_URL + `/trend_master/search/sellside?search_string=${searchStr}&search_type=chart&page_number=1&page_size=3`, null, false, 'GET', this.controller);
        searchChartsReq.then(response => {
            if (response.status === 1) {
                this.setState({
                    searchedChartsInfo: response.data.map(result => {
                        // result.dynamic_time_period = result.dynamic_time_period ? JSON.parse(result.dynamic_time_period) : '';
                        return { ...result, ref: React.createRef(), legendRef: React.createRef() }
                    }),
                    searchedChartsDataObj: {}
                }, () => this.fetchSearchedChartsDataForAll());
            }
        }).catch(err => {
            console.log('Error occured in searching Charts', err);
        });
        return searchChartsReq;
    }

    searchDashboards(searchStr, pageNo, pageSize) {
        const searchDashboardsReq = APIService.apiRequest(Constants.API_BASE_URL + `/trend_master/search/sellside?search_string=${searchStr}&search_type=dashboard&page_number=${pageNo}&page_size=${pageSize}`, null, false, 'GET', this.controller);
        searchDashboardsReq.then(response => {
            if (response.status === 1) {
                this.setState({
                    savedDashboards: response.data,
                    savedDashbaordsPaginationInfo: { pageCount: response.num_pages, currentPage: 1, totalResultsCount: response.total_results, rowsPerPage: DEFAULT_PAGE_SIZE },
                });
            }
        }).catch(err => {
            console.log('Error occured in searching Dashbaords', err);
        });
        return searchDashboardsReq;
    }



    handleIncludeChartResultsToggle(e) {
        this.setState({ includeChartsInSearch: e.target.checked });
    }

    fetchSearchedChartsDataForAll() {
        let chartLoadings = this.state.searchedChartsLoading;
        this.state.searchedChartsInfo.forEach(cInfo => {
            chartLoadings = { ...chartLoadings, [cInfo.id]: true };
            this.fetchSearchedChartData(cInfo);
        })
        this.setState({ searchedChartsLoading: chartLoadings });
    }



    fetchSearchedChartData(chartSett) {
        const giveDateRangeBasedOnPriority = (chartDynamicTimePeriod = '', dashboardDynamicTimePeriod = '') => {
            let rangeToConsider = dashboardDynamicTimePeriod || chartDynamicTimePeriod;
            return rangeToConsider.is_dynamic === true
                ? [convertDatePeriodPreselectsToRange(rangeToConsider.value, rangeToConsider.custom_dates)]
                : [rangeToConsider.value];
        }

        const giveFiltersBasedOnPriority = (chartFilters = {}, dashboardFilters = {}) => {
            let payloadFilters = {};
            // Override the chart filter values which are also applied in dashboard filters
            for (let cf in chartFilters) {
                payloadFilters[cf] = dashboardFilters[cf] && dashboardFilters[cf].length ? dashboardFilters[cf] : chartFilters[cf];
            }
            // Now append the dashboard filter values
            for (let df in dashboardFilters) {
                if (!payloadFilters[df]) {
                    payloadFilters[df] = dashboardFilters[df];
                }
            }
            return payloadFilters;
        };

        const dashboardSettOfChart = chartSett.dashboard;
        // dashboardSettOfChart.dynamic_time_period = dashboardSettOfChart.dynamic_time_period ? JSON.parse(dashboardSettOfChart.dynamic_time_period) : dashboardSettOfChart.dynamic_time_period;
        const payload = {
            method: 'manual',
            client_id: this.state.client.id,
            terminal: this.state.terminal_type,
            view_type: chartSett.view_type,
            daterange: giveDateRangeBasedOnPriority(chartSett.dynamic_time_period, dashboardSettOfChart.dynamic_time_period),
            filters: giveFiltersBasedOnPriority(chartSett.filters, dashboardSettOfChart.filters),
            segmentation: chartSett.segmentation,
            metric: chartSett.metric,
            x_axis: chartSett.x_axis
        };

        APIService.apiRequest(Constants.API_BASE_URL + '/trend_master/get_chart_data', payload, false, 'POST', this.controller)
            .then((response) => {
                if (response.status === 1) {
                    let updatedChartSettings = { ...chartSett };
                    let chart_format_parameters = chartSett.chart_format_parameters ? JSON.parse(chartSett.chart_format_parameters) : chartSett.chart_format_parameters;
                    // let chart_plotting_parameters =  chartSett.chart_plotting_parameters ? JSON.parse(chartSett.chart_plotting_parameters) : chartSett.chart_plotting_parameters;
                    updatedChartSettings['format'] = chart_format_parameters ? chart_format_parameters : getDefaultChartFormat();
                    updatedChartSettings['ref'] = chartSett.ref;
                    updatedChartSettings['legendRef'] = chartSett.legendRef;
                    updatedChartSettings['showLegend'] = chartSett['segmentation'] !== '' ? 1 : 0;
                    updatedChartSettings['showGrid'] = 0;

                    let basicChartFormattedData = formatChartData(response.data, chartSett.x_axis); //basic formatting 
                    let chartSortingFormattedData = basicChartFormattedData;
                    if (updatedChartSettings['format'] && Object.keys(updatedChartSettings['format']['sorting']).length > 0 && updatedChartSettings['format']['sorting'][0]['condition'] !== '') {
                        chartSortingFormattedData = chartSortingFormating(updatedChartSettings, basicChartFormattedData);//chart format tab saved formatting  
                    }

                    const chartData = { data: chartSortingFormattedData, other_details: response.other_details };
                    const chartDataFinal = this.giveClientSideChartData(chartData, updatedChartSettings);
                    const chartsDataObj = this.state.searchedChartsDataObj || {};

                    this.setState({
                        searchedChartsDataObj: { ...chartsDataObj, [chartSett.id]: chartDataFinal },
                        searchedChartsLoading: { ...this.state.searchedChartsLoading, [chartSett.id]: true }
                    }, () => {
                        setTimeout(() => {
                            this.renderChartFromSearchResults(updatedChartSettings, chartDataFinal);

                            const giveBandSettingsFromChartPlottingParams = (updatedChartSettings) => {
                                if (updatedChartSettings.chart_other_settings) {
                                    let params = JSON.parse(updatedChartSettings.chart_other_settings);
                                    return params.band_settings || [];
                                }
                                return [];
                            }

                            // Check if chart has band settings,If yes, fetch band data as well
                            const bandSettings = giveBandSettingsFromChartPlottingParams(updatedChartSettings);
                            if (bandSettings && bandSettings.length > 0 && Object.keys(bandSettings[0]).length > 0) {
                                let promises = bandSettings.map(bandSett => {
                                    let payloadForBand = payload;
                                    payloadForBand.segmentation = ''; // always empty, kept for api support 
                                    payloadForBand.band_params = { ...bandSett };
                                    delete payloadForBand.method;

                                    return this.fetchChartBandData(payloadForBand);
                                });

                                Promise.all(promises)
                                    .then((bandsData) => {
                                        let formattedBandsData = bandsData.map((b) => formatChartData(b, 'date'));
                                        let chartMainData = this.state.searchedChartsDataObj[updatedChartSettings.id];
                                        chartMainData.chartBandsData = formattedBandsData;
                                        this.setState({
                                            searchedChartsDataObj: { ...chartsDataObj, [updatedChartSettings.id]: chartMainData },
                                        });

                                        this.renderChartFromSearchResults(updatedChartSettings, chartDataFinal);
                                    })
                                    .catch((err) => console.log(err));
                            }
                        }, 100);
                    });

                } else {
                    this.setState({
                        searchedChartsLoading: { ...this.state.searchedChartsLoading, [chartSett.id]: false }
                    });
                }

            })
            .catch(err => {
                this.setState({
                    searchedChartsLoading: { ...this.state.searchedChartsLoading, [chartSett.id]: false }
                });
                console.log(err);
            });
    }

    fetchChartBandData(payload) {
        return new Promise((resolve, reject) => {
            APIService.apiRequest(Constants.API_BASE_URL + '/trend_master/get_bands', payload, false, 'POST', this.controller)
                .then(response => {
                    if (response.status === 1) {
                        resolve(response.data);
                    } else {
                        reject({});
                    }
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    renderChartFromSearchResults(chartConfig, chartData) {
        let chartsInputData = {};
        chartsInputData['chartData'] = chartData.formattedData;
        chartsInputData['chartNetData'] = chartData.formattedNetData;
        chartsInputData['chartSegmentation'] = chartData.segmentationData;
        chartsInputData['chartBandsData'] = chartData.chartBandsData || null;
        chartsInputData['chartConfig'] = chartConfig;
        chartsInputData['chartCurrencySymbol'] = '';
        chartsInputData['chartPercentSymbol'] = '';

        // console.log('chartConfig', chartConfig);
        // console.log('chartsInputData', chartsInputData);
        drawDynamicChart(chartsInputData);
    }

    // TODO : This method is just copied from ReportView for temporary implmentation, since this method may no longer be needed there as well
    // Later, figure out some other way for getting the chart data in desired format
    /**Extracts the chart data into 3 seperate variables to be used at client side */
    giveClientSideChartData(chartData, chartConfig) {
        let cDataClient = { formattedData: [], formattedNetData: {}, segmentationData: '' };

        // let colx = chartConfig.x_axis ? chartConfig.x_axis : 'date';

        // cDataClient['formattedData'] = parseChartData(parseDataObj1);
        cDataClient['formattedData'] = chartData.data;
        cDataClient['segmentationData'] = chartConfig.segmentation;

        for (let key in chartData.other_details) {
            cDataClient.formattedNetData[key] = {
                // "title": key,
                ...chartData.other_details[key],
                "symbol": '',
            }
        }
        return cDataClient;
    }

    updateSavedDashboardList(pageSize, pageNo) {
        this.setState({ inprocess: true });

        let params = { pageSize, pageNo };
        const currentListFilter = this.state.savedDashboardCurrentFilter;
        if (currentListFilter === 'Bookmarked') {
            params.fetchBookmarked = true;
        } else if (currentListFilter === 'Shared') {
            params.fetchShared = true;
        } else if (currentListFilter === 'Deleted Items') {
            params.fetchArchived = true;
        }
        params.sortInfo = this.state.savedDashboardCurrentSort

        this.fetchSavedDashboardList(params)
            .then(response => {
                this.setState({
                    savedDashboards: [...this.state.savedDashboards, ...response.data],
                    savedDashbaordsPaginationInfo: { pageCount: response.num_pages, currentPage: pageNo, totalResultsCount: response.total_results, rowsPerPage: pageSize },
                    inprocess: false
                });
            })
            .catch(err => {
                console.log('Error on getting Saved dashboard list: ' + err.msg);
                this.setState({ inprocess: false, error: err.msg });
            });
    }


    updateSavedDashboardListWithSearch(pageSize, pageNo, searchStr) {
        this.setState({ inprocess: true });

        this.searchDashboards(searchStr, pageNo, pageSize)
            .then(response => {
                this.setState({
                    savedDashboards: response.data,
                    savedDashbaordsPaginationInfo: { pageCount: response.num_pages, currentPage: pageNo, totalResultsCount: response.total_results, rowsPerPage: pageSize },
                    inprocess: false
                });
            })
            .catch(err => {
                console.log('Error on getting serched dashboard list: ' + err.msg);
                this.setState({ inprocess: false, error: err.msg });
            });
    }


    handleHideCreateMsg(){
        this.setState({ showDashboardCreatedMsg: false })
    }


    render() {
        const activeTabId = this.getTabIdFromUrl() || 'home';
        const sharingDashboardInfo = this.state.sharingDashboardId !== null ? this.state.savedDashboards.find(d => d.id === this.state.sharingDashboardId) : null;

        return (
            <div className="app-wrapper trendmaster">
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


                {/* Analysis Landing View */}
                <div className="container">

                    <div id="trendmaster" className="inner-container">
                        <div id="analysis-wrapper">
                            <div className="d-tab-content-wrapper" id="d-home" style={{ display: activeTabId === 'home' ? 'block' : 'none' }}>
                                {/* <div className="d-tab-content-wrapper" style={{ visibility: activeTabId === 'home' ? 'visible' : 'hidden',height : activeTabId === 'home' ? 'auto' : 0,zIndex : activeTabId === 'home' ? 1 : -1  }}> */}
                                <div className="trendmaster-home trend-view">

                                    <div className="trendmaster-preferences-container">
                                        <div className="trendmaster-preferences-wrapper">
                                            <button className="btn-preference btn-small btn-with-icon" onClick={this.handlePreferencesToggle}><i></i><span>Preferences</span></button>
                                            {this.state.showPreferencesList &&
                                                <ClickOutsideListener onOutsideClick={() => this.setState({ showPreferencesList: false })}>
                                                    <div className="preferences-list">
                                                        <div className="preference">
                                                            <div className="switch-toggle small">
                                                                <div className="label">Close plotter panel on outside click</div>
                                                                <div className="switch">
                                                                    <input type="checkbox" checked={this.state.preferenceAutoHideConsolePanel} onChange={(e) => this.handlepreferenceAutoHideConsolePanel()} />
                                                                    <label></label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </ClickOutsideListener>
                                            }
                                        </div>
                                    </div>


                                    {this.state.savedDashboards &&
                                        <div className="trendmaster-home-search">
                                            <div className="search-center-container">
                                                <div className="search-wrapper">
                                                    <div className="search-box">
                                                        <form onSubmit={this.handleSearch}>
                                                            <input type="text" value={this.state.searchInput} onChange={(e) => this.setState({ searchInput: e.target.value })} className="search-field" />
                                                        </form>
                                                        <div className="search-btns">
                                                            {this.state.searchModeOn &&
                                                                <div className="search-reset-btn">
                                                                    <span onClick={this.handleSearchReset}>Reset</span>
                                                                </div>
                                                            }
                                                            <div className="search-btn">
                                                                <button type="button btn-medium" onClick={this.handleSearch} >Search</button>
                                                            </div>
                                                        </div>

                                                        {/* {this.state.searching && <div className="search-loading"></div>} */}
                                                    </div>
                                                    <div className="show-chart-toggle checkbox">
                                                        <input type="checkbox" id="trend-home-show-charts-toggle" checked={this.state.includeChartsInSearch} onChange={this.handleIncludeChartResultsToggle} />
                                                        <label htmlFor="trend-home-show-charts-toggle">Show Charts</label>
                                                    </div>
                                                </div>

                                                {this.state.searchModeOn &&
                                                    <div className="search-result-info">
                                                        <p>
                                                            {this.state.searchedChartsInfo &&
                                                                <>
                                                                    {`${this.state.searchedChartsInfo.length} Charts Found`}<br />
                                                                </>}
                                                            {this.state.savedDashbaordsPaginationInfo.totalResultsCount !== null &&
                                                                <>
                                                                    {`${this.state.savedDashbaordsPaginationInfo.totalResultsCount} Dashboards Found`}
                                                                </>
                                                            }</p>
                                                    </div>
                                                }
                                            </div>

                                        </div>
                                    }


                                    {this.state.searchedChartsInfo && this.state.searchedChartsInfo.length > 0 &&
                                        <TrendMasterHomeCharts
                                            chartsSettings={this.state.searchedChartsInfo}
                                            chartsLoadingsObj={this.state.searchedChartsLoading}
                                            chartsDataObj={this.state.searchedChartsDataObj}
                                        />
                                    }

                                    {this.state.savedDashboards &&
                                        <div className="trendmaster-home-filters">
                                            <div className="filters">
                                                {['All', 'Shared', 'Bookmarked', 'Deleted Items'].map((f,i) => {
                                                    const isSelected = this.state.savedDashboardCurrentFilter === f;
                                                    return (
                                                        <button key={i} className={'btn' + (isSelected ? ' selected' : '')} onClick={() => this.handleDashboardFilterClick(f)}>{f}</button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    }

                                    {/* {this.state.savedDashboards && this.state.savedDashboards.length === 0 &&
                                        <div className="no-data-msg">No Data Available</div>
                                    } */}

                                    <TrendMasterHomeTable
                                        inprocess={this.state.inprocess}
                                        userId={this.user.id}
                                        deletingDashboardId={this.state.deletingDashboardId}
                                        copyingDashboardId={this.state.copyingDashboardId}
                                        bookmarkingDashboardId={this.state.bookmarkingDashboardId}
                                        dashboardList={this.state.savedDashboards}
                                        dashboardPaginationInfo={this.state.savedDashbaordsPaginationInfo}
                                        dashboardAPICall={this.onPageScroll}
                                        that={this}
                                        onRowClick={this.openTab}
                                        onRowEditClick={(tId) => this.openTab(tId, true)}
                                        onRowDeleteClick={this.handleDashboardDelete}
                                        onRowCopyClick={this.handleDashboardCopy}
                                        onRowShareClick={this.handleDashboardShare}
                                        onRowBookmarkClick={this.handleDashboardBookmark}
                                        sortedColumnInfo={this.state.savedDashboardCurrentSort}
                                        onColumnSort={this.handleDashboardColumnSort}
                                    />
                                    {/* {this.state.savedDashboards && this.state.savedDashboards.length > 0 &&
                                        <Pagination
                                            pageCount={this.state.savedDashbaordsPaginationInfo.pageCount}
                                            currentPage={this.state.savedDashbaordsPaginationInfo.currentPage}
                                            onPageChange={this.handlePageChange}
                                            rowsPerPage={this.state.savedDashbaordsPaginationInfo.rowsPerPage}
                                            rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                                            onRowsPerPageChange={this.handleRowsPerPageChange}
                                            totalRowsCount={this.state.savedDashbaordsPaginationInfo.totalResultsCount}
                                            disabled={this.state.inprocess}
                                        />
                                    } */}
                                    {sharingDashboardInfo &&
                                        <ShareDashbaord dashboardData={sharingDashboardInfo} userId={this.user.id}
                                            onShareCancel={() => this.setState({ sharingDashboardId: null })} />
                                    }
                                </div>
                            </div>

                            {this.state.tabs.length > 1 &&
                                <React.Fragment>
                                    {this.state.tabs.slice(1).map((t, i) => {
                                        const isActiveDashboard = String(t.id) === activeTabId;

                                        return <div key={t.id} className="d-tab-content-wrapper" id={`d-${t.id}`} style={{ display: isActiveDashboard ? 'block' : 'none' }}>
                                            <ReportView
                                                isActiveTab={isActiveDashboard}
                                                dashboardData={t}
                                                onDashboardSaveOrEdit={(data) => this.handleDashboardAddOrEdit(t.id, data)}
                                                showDashboardCreatedMsg={this.state.showDashboardCreatedMsg}
                                                hideDashboardCreatedMsg={() => this.handleHideCreateMsg}
                                                showConsolePanel={t.showConsolePanel}
                                                consolePanelPosition={t.consolePanelPosition}
                                                onPanelToggle={this.handlePanelToggle}
                                                onPanelPositionChange={this.handlePanelPositionChange}
                                                isDashboardInEditMode={this.checkEditModeFromUrl(this.props.location.search)}
                                                onDashboardDelete={this.handleDashboardDelete}
                                                onDashboardEdit={tId => this.openTab(tId, true)}
                                                onDashboardPublish={tId => this.openTab(tId, false)}
                                                preferenceAutoHideConsolePanel={this.state.preferenceAutoHideConsolePanel}
                                            />
                                        </div>
                                    })}
                                </React.Fragment>
                            }
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default TrendMaster;


const TrendMasterHomeCharts = ({ chartsSettings, chartsLoadingsObj, chartsDataObj }) => {
    const [dummy, setDummy] = useState(0); // for rendering whenever scrolling happens so that left/right scroll buttons' enabled/disabled status can be updated
    const scrollContainerRef = useRef(null);

    const handleChartsAreaScroll = () => setDummy(dummy + 1);
    const handleSlideLeftBtnClick = () => scrollSmoothly('left');
    const handleSlideRightBtnClick = () => scrollSmoothly('right');
    const scrollSmoothly = (direction) => {
        const scrollAmount = scrollContainerRef.current ? Math.max(100, (scrollContainerRef.current.scrollWidth - scrollContainerRef.current.offsetWidth) / 4) : 0;
        const speed = scrollAmount / 400; // speed in pixels/ms
        const finalScrollPos = direction === 'right' ? Math.min(scrollContainerRef.current.scrollLeft + scrollAmount, scrollContainerRef.current.scrollWidth - scrollContainerRef.current.offsetWidth) : Math.max(scrollContainerRef.current.scrollLeft - scrollAmount, 0);
        let id = setInterval(() => {
            if ((direction === 'right' && scrollContainerRef.current.scrollLeft >= finalScrollPos) || (direction === 'left' && scrollContainerRef.current.scrollLeft <= finalScrollPos)) {
                clearInterval(id);
                setDummy(dummy + 1);
                return;
            }
            if (direction === 'right') {
                scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollLeft + speed * 16;
            } else {
                scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollLeft - speed * 16;
            }
        }, 16);
    }

    const showSlideBtns = scrollContainerRef.current ? scrollContainerRef.current.scrollWidth > scrollContainerRef.current.offsetWidth : false;
    const showLeftSlideBtn = showSlideBtns && scrollContainerRef.current.scrollLeft > 0;
    const showRightSlideBtn = showSlideBtns && scrollContainerRef.current.scrollLeft < scrollContainerRef.current.scrollWidth - scrollContainerRef.current.offsetWidth;

    return (
        <div className="trendmaster-home-charts">
            <div className="trendmaster-home-charts-center-wrapper">
                {showLeftSlideBtn && <div className="charts-scroll-left-btn"><button onClick={handleSlideLeftBtnClick}></button></div>}
                {showRightSlideBtn && <div className="charts-scroll-right-btn"><button onClick={handleSlideRightBtnClick}></button></div>}

                <div className="charts-scroll-area" ref={scrollContainerRef} onScroll={handleChartsAreaScroll}>
                    {chartsSettings.map(chart => {
                        const cData = chartsDataObj && chartsDataObj[chart.id];
                        if (cData) {
                            return <div key={chart.id} className="chart-box">
                                <GiveIndividualChartHtml chart={chart} chartData={cData} />
                            </div>;

                        } else {
                            const isLoading = chartsLoadingsObj[chart.id] || false;
                            return (
                                <div key={chart.id} className="chart-box">
                                    <div className="chart-placeholder" id={`chart-${chart.id}`}>
                                        {/* {chart.name} */}
                                        {isLoading && <div className="chart-loader">Loading...</div>}
                                    </div>
                                </div>
                            );
                        }
                    })}
                </div>
            </div>
        </div>
    );
};


const CHART_DIMENSIONS = {
    defaultWidth: 450, //15:9 - 
    defaultHeight: 270,
    defaultSegmentWidth: 260,
    defaultScorecardWidth: 200,
    defaultScorecardHeight: 120,
};
const FALLBACK_TIME_PERIOD_FOR_CHARTS = { is_dynamic: true, value: 'Last 30 Days' };

const GiveIndividualChartHtml = ({ chart, chartData }) => {
    let chartMetric = chart.metric;
    let minVal = 0;
    let maxVal = 0;
    let unique_key = chart.id;
    let chartData1 = chartData.formattedData;
    let chartNetData = chartData.formattedNetData;
    if (chartNetData) {
        chartNetData = chartData.formattedNetData[chart.metric];
    }
    let currencySymbol = '';
    let percentSymbol = '';
    let xaxis_val = chart.x_axis;
    let yaxis_val = chart.metric;
    let [showMetaDropDownToggle, setShowMetaDropDownToggle] = useState({});

    //min/max values
    if (chartData1) {
        minVal = Math.min.apply(Math, chartData1.map(function (o) { return o[chartMetric]; }));
        maxVal = Math.max.apply(Math, chartData1.map(function (o) { return o[chartMetric]; }));
    }

    let chartDateRangeToShow = (chart.dynamic_time_period || chart.dashboard.dynamic_time_period);
    // Fallback period is to be used if period is niether set for chart nor for dashboard
    if (chartDateRangeToShow === null) { chartDateRangeToShow = FALLBACK_TIME_PERIOD_FOR_CHARTS; }
    chartDateRangeToShow = chartDateRangeToShow.is_dynamic === true ? [convertDatePeriodPreselectsToRange(chartDateRangeToShow.value, chartDateRangeToShow.custom_dates)] : [chartDateRangeToShow.value];
    chartDateRangeToShow = giveDotSeparatedDateRange(chartDateRangeToShow[0]);

    const showChartLoading = false;
    let segmentationValues = [];
    if (chartData && chart.segmentation !== '') {
      segmentationValues = [...new Set(chartData.map(item => item[chart.segmentation]))];
    }


    //Chart Meta Info Mouse Hover
    const handleChartMetaDrodDownToggle = (id) => {
        let updatedShowMetaDropDownToggle = { ...showMetaDropDownToggle };
        if (updatedShowMetaDropDownToggle[id]) {
            updatedShowMetaDropDownToggle[id] = !updatedShowMetaDropDownToggle[id];
        } else {
            updatedShowMetaDropDownToggle = { [id]: true };
        }
        setShowMetaDropDownToggle(updatedShowMetaDropDownToggle);
    }

    return (
        <div key={unique_key} id={'chart-' + unique_key} className={'asc-chart-wrapper ' +chart.chart_type+' '+ ((chart.showLegend === 1 && chart.chart_type !== 'flat_table') ? ' show-legends' : '')}>
            <div className={'chart-inner-wrapper' + ((chart.segmentation !== '' || (chart.chart_type === 'pie' || chart.chart_type === 'donut' || chart.chart_type === 'spider')) && chart.showLegend ? ' show-legend' : '')}>
                {/* Meta info dropdown */}
                {(showMetaDropDownToggle[unique_key]!==undefined && showMetaDropDownToggle[unique_key]) &&
                    <ClickOutsideListener onOutsideClick={() => handleChartMetaDrodDownToggle(unique_key)}>
                        <div className="meta-info-wrapper">
                            <div className="info date-range">
                                <div className="label">Date Period</div>
                                <div className="val">{chartDateRangeToShow}</div>
                            </div>

                            {chartData &&
                                <>
                                    <div className="info xaxis">
                                        <div className="label">X Axis</div>
                                        <div className="val"><span className={isAbbrevationName(xaxis_val) ? 'allcaps' : ''}>{xaxis_val}</span></div>
                                    </div>

                                    <div className="info yaxis">
                                        <div className="label">Y Axis</div>
                                        <div className="val"><span className={isAbbrevationName(yaxis_val) ? 'allcaps' : ''}>{yaxis_val}</span></div>
                                    </div>
                                </>
                            }

                            {chartNetData &&
                                <>
                                    {minVal >= 0 &&
                                        <div className="info min">
                                        <div className="label">Minimum</div>
                                        <div className="val">{currencySymbol + formatNumber(minVal) + percentSymbol}</div>
                                        </div>
                                    }

                                    {maxVal >= 0 &&
                                        <div className="info max">
                                        <div className="label">Maximum</div>
                                        <div className="val">{currencySymbol + formatNumber(maxVal) + percentSymbol}</div>
                                        </div>
                                    }

                                    <div className="info total">
                                        <div className="label">Total</div>
                                        <div className="val">{currencySymbol + formatNumber(chartNetData.net_details) + percentSymbol}</div>
                                    </div>
                                </>
                            }
                        </div>
                    </ClickOutsideListener>
                }


                <div className={'chart-content-wrapper'} style={{ height: CHART_DIMENSIONS.defaultHeight, minWidth: chart.segmentation !== '' ? CHART_DIMENSIONS.defaultWidth : '', width: CHART_DIMENSIONS.defaultWidth }}>
                    <div className="chart-header-wrapper">
                        {/* Main header */}
                        <div className="chart-main-header">
                            <div className="title-wrapper">
                                <h3 className="title" title={chart.name}>{chart.name}</h3>
                            </div>

                            <div className='chart-menu'>
                                {/* {(((chart.segmentation !== '' && segmentationValues.length > this.state.chart_dimensions.showLegendCount) || (chart.chart_type === 'pie' || chart.chart_type === 'donut' || chart.chart_type === 'spider')) && !chart.showLegend) &&
                                    <button className="btn-asc-chart-legend" onClick={(e) => this.handleChartLegendDrodDownToggle(e, unique_key)} onMouseDown={e => e.stopPropagation()}>legend</button>
                                } */}
                                <button className="btn-asc-chart-meta" onClick={() => handleChartMetaDrodDownToggle(unique_key)} onMouseDown={e => e.stopPropagation()}>info</button>
                                {/* <button className="btn-asc-chart-more" onClick={(e) => this.handleMoreButtonsDropDownToggle(e, unique_key)} onMouseDown={e => e.stopPropagation()}></button> */}
                            </div>
                        </div>
                    </div>
                
                    <div className="chart-content">
                        {((chart.chart_type !== 'flat_table' && chart.chart_type !== 'spider') && chartData) &&
                            <>
                                <div className="x-axis-label"><span className={isAbbrevationName(xaxis_val) ? 'allcaps' : ''}>{xaxis_val}</span></div>
                                {(chart.chart_type !== 'pie' && chart.chart_type !== 'donut' && chart.chart_type !== 'bubble') &&
                                    <div className="y-axis-label"><span className={isAbbrevationName(yaxis_val) ? 'allcaps' : ''}>{yaxis_val}</span></div>
                                }
                            </>
                        }
                        <div className={'asc-chart ' + chart.chart_type} ref={chart.ref} data-ref={chart.ref}></div>
                    </div>
                </div>

                {((chart.segmentation !== '' || (chart.chart_type === 'pie' || chart.chart_type === 'donut' || chart.chart_type === 'spider')) && chart.showLegend) &&
                    <div className="legends-container" style={{ minWidth: (CHART_DIMENSIONS.defaultSegmentWidth - 10), width: CHART_DIMENSIONS.defaultSegmentWidth, height: CHART_DIMENSIONS.defaultHeight }}>
                        <div id={'legends-wrapper-' + unique_key} className="legends-wrapper" ref={chart.legendRef}></div>
                    </div>
                }

                {showChartLoading &&
                    <div className="chart-loading">
                        <div className="loading-progress"></div>
                    </div>
                }
            </div>
        </div>
    )
}


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
            <div className="total-pages">
                {'Total Pages ' + pageCount}
            </div>
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

const ShareDashbaord = ({ dashboardData, userId, onShareCancel }) => {

    const [loadingSharedUsers, setLoadingSharedUsers] = useState(false);
    const [loadingChartList, setLoadingChartList] = useState(false);
    const [loadingOrganisations, setLoadingOrganisations] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [organisationList, setOrganisationList] = useState(null);
    const [usersOfSelectedOrganisation, setUsersOfSelectedOrganisation] = useState(null);
    const [savingInProcess, setSavingInProcess] = useState(null);

    const [showNewForm, setShowNewForm] = useState(false);
    const [newFormSelectedOrganisation, setNewFormSelectedOrganisation] = useState(null);
    const [newFormSelectedUser, setNewFormSelectedUser] = useState([]);
    const [newFormSelectedAuthorizations, setNewFormSelectedAuthorizations] = useState(['VIEW']);
    const [newFormOrgSearch, setNewFormOrgSearch] = useState('');
    const [newFormUserSearch, setNewFormUserSearch] = useState('');
    const [newFormChartSearch, setNewFormChartSearch] = useState('');
    const [newFormChartsIDsSelected, setNewFormChartsIDsSelected] = useState([]);

    const [chartsList, setChartsList] = useState(null);


    const [sharedUsers, setSharedUsers] = useState(null);
    const [editPopupUserID, setEditPopupUserID] = useState(null);
    const [editUserInfo, setEditUserInfo] = useState(null);
    const [editSelectedAuthorizations, setEditSelectedAuthorizations] = useState([]);
    const [editSelectedChartIDs, setEditSelectedChartIDs] = useState([]);
    const [editChartSearch, setEditChartSearch] = useState('');


    useEffect(() => {
        getSharedUsersList();
        getChartsList();
    }, []);

    const getChartsList = () => {
        setLoadingChartList(true);
        APIService.apiRequest(Constants.API_BASE_URL + `/trend_master/get_chart_list/sellside?dashboard_id=${dashboardData.id}`, {}, false, 'GET')
            .then(response => {
                if (response.status === 1) {
                    setChartsList(response.data);
                    setLoadingChartList(false);
                } else {
                    setLoadingChartList(false);
                }
            })
            .catch(err => {
                setLoadingChartList(false);
                console.log('Error occured in fetching chart list ' + err.message);
            });
    }

    const getSharedUsersList = () => {
        setLoadingSharedUsers(true);
        APIService.apiRequest(Constants.API_BASE_URL + `/trend_master/share/${dashboardData.id}`, {}, false, 'GET')
            .then(response => {
                if (response.status === 1) {
                    // remove self from sharedUser list
                    setSharedUsers(response.data.filter(s => s.user.id !== userId));
                    setLoadingSharedUsers(false);
                } else {
                    setLoadingSharedUsers(false);
                }
            })
            .catch(err => {
                setLoadingSharedUsers(false);
                console.log('Error occured in fetching shared user list ' + err.message);
            });
    }

    const getOrganisationList = () => {
        setLoadingOrganisations(true);
        APIService.apiRequest(Constants.API_BASE_URL + '/getOrganizationsList', {}, false, 'GET')
            .then(response => {
                if (response.status === 1) {
                    setOrganisationList(response.data);
                    setNewFormSelectedOrganisation(response.data[0]);
                    setLoadingOrganisations(false);
                    getUserListOfOrganisation(response.data[0].id);
                } else {
                    setLoadingOrganisations(false);
                }
            })
            .catch(err => {
                setLoadingOrganisations(false);
                console.log('Error occured in fetching organisation list ' + err.message);
            });
    }

    const getUserListOfOrganisation = (orgId) => {
        setLoadingUsers(true);
        APIService.apiRequest(Constants.API_BASE_URL + `/getUsers/${orgId}`, {}, false, 'GET')
            .then(response => {
                if (response.status === 1) {
                    setNewFormUserSearch('');
                    setUsersOfSelectedOrganisation(response.data.filter(u => u.id !== userId));
                    setLoadingUsers(false);
                } else {
                    setLoadingUsers(false);
                }
            })
            .catch(err => {
                setLoadingUsers(false);
                console.log('Error occured in fetching organisation list: ' + err.message);
            });
    }


    const handleShareNewBtnClick = () => {
        setShowNewForm(true);
        if (!organisationList) {
            getOrganisationList();
        } else {
            // organisation list already available, just select the first organisation by default and fetch the user of that organisation
            setNewFormSelectedOrganisation(organisationList[0]);
            getUserListOfOrganisation(organisationList[0].id);
        }
    };

    const handleShareOrganisationSelect = (org) => {
        setNewFormSelectedOrganisation(org);
        setNewFormSelectedUser([]);
        getUserListOfOrganisation(org.id);
    };

    const handleShareUsersSelect = (user) => {
        const currSelectedUsers = newFormSelectedUser;
        const newSelectedUsers = currSelectedUsers.some(u => u.id === user.id) ? currSelectedUsers.filter(u => u.id !== user.id) : [...currSelectedUsers, user];
        setNewFormSelectedUser(newSelectedUsers);
    };
    const handleShareNewAuthSelect = (auth) => {
        const currAuths = newFormSelectedAuthorizations;
        const newAuths = currAuths.includes(auth) ? currAuths.filter(a => a !== auth) : [...currAuths, auth];
        setNewFormSelectedAuthorizations(newAuths);
    };

    const handleShareNewFormSubmit = () => {
        if (!newFormSelectedOrganisation) {
            alertService.showToast('error', 'Please select an Organisation');
            return;
        }
        if (newFormSelectedUser.length === 0) {
            alertService.showToast('error', 'Users must be selected');
            return;
        }
        if (newFormChartsIDsSelected.length === 0) {
            alertService.showToast('error', 'Charts for access must be selected');
            return;
        }

        let payload = {
            dashboard_id: dashboardData.id,
            privileges: newFormSelectedAuthorizations.toString(),
            user_ids: newFormSelectedUser.map(user => user.id),
            is_full_dashboard: 1,
            chart_ids: []
        };

        if (newFormChartsIDsSelected.length === chartsList.length) {
            payload.is_full_dashboard = 1;
            payload.chart_ids = [];
        } else {
            payload.is_full_dashboard = 0;
            payload.chart_ids = newFormChartsIDsSelected;
        }

        setSavingInProcess(true);
        APIService.apiRequest(Constants.API_BASE_URL + '/trend_master/share', payload, false, 'POST')
            .then(response => {
                if (response.status === 1) {
                    alertService.showToast('success', 'Dashboard shared successfully');
                    setSavingInProcess(false);
                    // reset form variables
                    setNewFormSelectedOrganisation(null);
                    setNewFormSelectedUser([]);
                    setNewFormSelectedAuthorizations(['VIEW']);
                    setNewFormChartSearch('');
                    setNewFormChartsIDsSelected([]);
                    setShowNewForm(false);
                    // Refresh the share list
                    getSharedUsersList();
                } else {
                    setSavingInProcess(false);
                }
            })
            .catch(err => {
                setSavingInProcess(false);
                console.log('Error occured in Sharing dashboard: ' + err.message);
            });
    };
    const handleShareNewFormReset = () => {
        setNewFormSelectedOrganisation(organisationList[0]);
        setNewFormSelectedUser([]);
        setNewFormSelectedAuthorizations(['VIEW']);
        setNewFormChartsIDsSelected([]);
        setNewFormUserSearch('');
        setNewFormOrgSearch('');
        setNewFormChartSearch('');
    };

    const handleShareEditBtn = (shareInfo) => {
        let chartIDs = [];
        if (shareInfo.is_full_dashboard) {
            chartIDs = chartsList.map(c => c.id)
        } else {
            chartIDs = shareInfo.dashboard_config.split(',').filter(x => x !== '').map(x => +x);
        }
        setEditUserInfo(shareInfo);
        setEditSelectedAuthorizations(shareInfo.privileges.split(','));
        setEditSelectedChartIDs(chartIDs);
        setEditChartSearch('');
    };

    const handleShareEditAuthSelect = (auth) => {
        const currAuths = editSelectedAuthorizations;
        const newAuths = currAuths.includes(auth) ? currAuths.filter(a => a !== auth) : [...currAuths, auth];
        setEditSelectedAuthorizations(newAuths);
    };

    const handleShareEditChartSelect = (chartID) => {
        const currChartIds = editSelectedChartIDs;
        const newChartIds = currChartIds.includes(chartID) ? currChartIds.filter(a => a !== chartID) : [...currChartIds, chartID];
        setEditSelectedChartIDs(newChartIds);
    };
    const handleShareEditChartSelectAll = (checked) => {
        const currChartIds = checked ? chartsList.map(c => c.id) : [];
        setEditSelectedChartIDs(currChartIds);
    };

    const handleShareNewChartSelect = (chartID) => {
        const currChartIds = newFormChartsIDsSelected;
        const newChartIds = currChartIds.includes(chartID) ? currChartIds.filter(a => a !== chartID) : [...currChartIds, chartID];
        setNewFormChartsIDsSelected(newChartIds);
    };

    const handleShareNewChartSelectAll = (checked) => {
        const currChartIds = checked ? chartsList.map(c => c.id) : [];
        setNewFormChartsIDsSelected(currChartIds);
    };

    const handleShareEditCancelBtn = () => {
        setEditUserInfo(null);
        setEditSelectedChartIDs([]);
        setEditChartSearch('');
    };

    const handleShareEditSubmitBtn = () => {
        let payload = {
            dashboard_id: dashboardData.id,
            privileges: editSelectedAuthorizations.toString(),
            user_ids: [editUserInfo.user.id],
        };

        if (editSelectedChartIDs.length === 0) {
            alertService.showToast('error', 'Charts for access must be selected');
            return;
        }

        // check full dashboard access
        if (editSelectedChartIDs.length === chartsList.length) {
            payload.is_full_dashboard = 1;
        } else {
            payload.is_full_dashboard = 0;
        }
        payload.chart_ids = editSelectedChartIDs;

        setSavingInProcess(true);
        APIService.apiRequest(Constants.API_BASE_URL + '/trend_master/share', payload, false, 'PUT')
            .then(response => {
                if (response.status === 1) {
                    alertService.showToast('success', 'Access edited successfully');
                    // update the sharedInfo in sharedUser list
                    const newSharedUsers = sharedUsers.map(u => {
                        if (u.user.id === payload.user_ids[0]) {
                            return {
                                ...u,
                                privileges: payload.privileges,
                                is_full_dashboard: payload.is_full_dashboard,
                                dashboard_config: payload.chart_ids.toString()
                            };
                        }
                        return u;
                    });
                    setSharedUsers(newSharedUsers);
                    // reset some other variables
                    setEditUserInfo(null);
                    setEditChartSearch('');
                    setEditSelectedChartIDs([]);
                    setEditSelectedAuthorizations([]);
                    setSavingInProcess(false);
                } else {
                    setSavingInProcess(false);
                }
            })
            .catch(err => {
                setSavingInProcess(false);
                console.log('Error occured in Editing share config: ' + err.message);
            });
    };

    const handleShareEditDeleteBtn = (shareId) => {
        setSavingInProcess(true);
        APIService.apiRequest(Constants.API_BASE_URL + `/trend_master/share/${shareId}`, {}, false, 'DELETE')
            .then(response => {
                if (response.status === 1) {
                    alertService.showToast('success', 'Access Revoked successfully');
                    setSavingInProcess(false);
                    setSharedUsers(sharedUsers.filter(s => s.id !== shareId));
                    setEditPopupUserID(null);

                } else {
                    setSavingInProcess(false);
                }
            })
            .catch(err => {
                setSavingInProcess(false);
                console.log('Error occured in Revoking share : ' + err.message);
            });
    };



    const orgSearchInput = newFormOrgSearch.trim();
    const userSearchInput = newFormUserSearch.trim();
    const chartSearchInputForEdit = editChartSearch.trim();
    const chartSearchInputForNew = newFormChartSearch.trim();
    const orgList = orgSearchInput ? organisationList.filter(o => o.name.toLowerCase().includes(orgSearchInput.toLowerCase())) : organisationList;
    const userList2 = userSearchInput ? usersOfSelectedOrganisation.filter(u => (u.first_name + '' + u.last_name).toLowerCase().includes(userSearchInput.toLowerCase())) : usersOfSelectedOrganisation;
    const chartListForEdit = chartSearchInputForEdit ? (chartsList || []).filter(c => (c.name || String(c.id)).toLowerCase().includes(chartSearchInputForEdit.toLowerCase())) : (chartsList || []);
    const chartListForNew = chartSearchInputForNew ? (chartsList || []).filter(c => (c.name || String(c.id)).toLowerCase().includes(chartSearchInputForNew.toLowerCase())) : (chartsList || []);
    const chartSelectAllStatusForEdit = chartsList ? chartsList.length === editSelectedChartIDs.length : false;
    const chartSelectAllStatusForNew = chartsList ? chartsList.length === newFormChartsIDsSelected.length : false;

    return (
        <div className="share-panel col-view" id="col-charts-values">

            <div className="chart-panel">
                <div className="share-panel-header">
                    <p>{dashboardData.dashboard_name}</p>
                    <button onClick={onShareCancel} >X Close</button>
                </div>
                <div className='share-panel-content tabs-wrapper'>
                    <div className="share-panel-content-wrapper tabs-content-wrapper">
                        <div className="tab-content">
                            <div id="share-settings" className="dashboaord-tab-content">
                                <div className="share-header sticky-div">
                                    <div className="share-title">{showNewForm ? 'Invite New Members' : 'Active Members'} </div>
                                    {!showNewForm && <span className="add-btn" onClick={handleShareNewBtnClick}></span>}
                                </div>

                                {loadingSharedUsers && <p>Loading Shared Users ...</p>}

                                {!loadingSharedUsers && sharedUsers && !showNewForm &&
                                    <>

                                        <div className="shared-users">
                                            {sharedUsers.map(shareInfo => {

                                                const isEditing = editUserInfo ? editUserInfo.user.id === shareInfo.user.id : false;
                                                return (
                                                    <div key={shareInfo.user.id} className={'shared-user' + (isEditing ? ' shared-user-editing' : '')}>
                                                        <UserAvatar user={shareInfo.user} />
                                                        <h4>{shareInfo.user.first_name + ' ' + (shareInfo.user.last_name || '')}</h4>
                                                        <div className="org-info">
                                                            <div className="label">Organisation : </div>
                                                            <div className="value">{shareInfo.user.organization}</div>
                                                        </div>
                                                        <div className="previleges">
                                                            <div className="label">Authorization : </div>
                                                            <ul>
                                                                {shareInfo.privileges.split(',').map((p,i) =>
                                                                    <li key={i}><span className="item">{p[0] + p.slice(1).toLowerCase()}</span></li>
                                                                )}
                                                            </ul>
                                                        </div>



                                                        <div className="selected-charts">
                                                            <div className="label">Access : </div>
                                                            {!!shareInfo.is_full_dashboard ?
                                                                <span className="full-dash-msg"> Full Dashboard</span>
                                                                :
                                                                <ul>
                                                                    {shareInfo.dashboard_config.split(',').map((p, i) =>
                                                                        <li key={i}><span className="item">{p}</span></li>
                                                                    )}
                                                                </ul>
                                                            }
                                                        </div>

                                                        <span className="pop-over-btn menu-btn" onClick={() => setEditPopupUserID(shareInfo.user.id)}>
                                                            {editPopupUserID === shareInfo.user.id &&
                                                                <ClickOutsideListener onOutsideClick={() => setEditPopupUserID(null)}>
                                                                    <div className="pop-over-options-wrapper">
                                                                        <ul className="pop-over-options">
                                                                            <li className={(savingInProcess || chartsList === null) ? 'disabled' : ''} onClick={(e) => { e.stopPropagation(); setEditPopupUserID(null); handleShareEditBtn(shareInfo) }}>Edit</li>
                                                                            <li className={savingInProcess ? 'disabled' : ''} onClick={(e) => { e.stopPropagation(); handleShareEditDeleteBtn(shareInfo.id) }}>Revoke Access</li>
                                                                        </ul>
                                                                    </div>
                                                                </ClickOutsideListener>
                                                            }
                                                        </span>

                                                        {
                                                            isEditing &&
                                                            <div className="edit-form">
                                                                <div className="panel-widget auths">
                                                                    <div className="widget-header">
                                                                        <div className="widget-title">Authorization</div>
                                                                    </div>
                                                                    <div className="widget-content">
                                                                        <ul className="auth-list">
                                                                            {['VIEW', 'EDIT', 'COMMENT', 'SHARE', 'DELETE'].map(auth => {
                                                                                const checked = editSelectedAuthorizations.includes(auth);
                                                                                const disabled = auth === 'VIEW';
                                                                                return (
                                                                                    <li key={auth} className={'auth-item' + (disabled ? ' disabled' : '')}>
                                                                                        <div className="option checkbox">
                                                                                            <input id={`${dashboardData.id}-share-${auth}`} type="checkbox"
                                                                                                checked={checked}
                                                                                                disabled={disabled}
                                                                                                onChange={() => handleShareEditAuthSelect(auth)} />
                                                                                            <label htmlFor={`${dashboardData.id}-share-${auth}`}>
                                                                                                {auth[0] + auth.slice(1).toLowerCase()}</label>
                                                                                        </div>
                                                                                    </li>
                                                                                );
                                                                            })}
                                                                        </ul>
                                                                    </div>
                                                                </div>


                                                                <div className={'panel-widget chart-list-container'}>
                                                                    <div className="widget-header">
                                                                        <div className="widget-title">Dashboard
                                                                            {editSelectedChartIDs.length ? <label>Selected <span>{editSelectedChartIDs.length}</span></label> : null}
                                                                        </div>
                                                                        <div className="gl-search">
                                                                            <input value={editChartSearch} onChange={e => setEditChartSearch(e.target.value)} />
                                                                        </div>
                                                                    </div>
                                                                    <div className="widget-content">
                                                                        <div className="list chart-list">
                                                                            <div className="option checkbox select-all">
                                                                                <input id={`${dashboardData.id}-chart-select-all`} type="checkbox" checked={chartSelectAllStatusForEdit} onChange={(e) => handleShareEditChartSelectAll(e.target.checked)} />
                                                                                <label htmlFor={`${dashboardData.id}-chart-select-all`}>Select All</label>
                                                                            </div>
                                                                            {chartListForEdit.map((chart) => {
                                                                                const selected = editSelectedChartIDs.includes(chart.id);
                                                                                return (
                                                                                    <div key={chart.id} className="option checkbox">
                                                                                        <input id={`${dashboardData.id}-chart-${chart.id}`} type="checkbox" checked={selected} onChange={() => handleShareEditChartSelect(chart.id)} />
                                                                                        <label htmlFor={`${dashboardData.id}-chart-${chart.id}`}>{chart.id} : {chart.name}</label>
                                                                                    </div>
                                                                                )
                                                                            })}
                                                                            {chartSearchInputForEdit && !chartListForEdit.length && <p className="no-match-msg">No Match Found</p>}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="action-btns">
                                                                    <button className="btn btn-with-icon btn-small btn-save" onClick={handleShareEditSubmitBtn} disabled={savingInProcess}><i></i><span>Update</span></button>
                                                                    <button className="btn btn-with-icon btn-small btn-cancel" onClick={handleShareEditCancelBtn} disabled={savingInProcess}><i></i><span>Cancel</span></button>
                                                                </div>
                                                            </div>
                                                        }
                                                    </div>
                                                );
                                            })}
                                            
                                            {!sharedUsers.length &&
                                                <div>Not shared with anyone yet</div>
                                            }
                                        </div>
                                    </>
                                }

                                {
                                    showNewForm &&
                                    <div className="share-new-form">
                                        {loadingOrganisations && <p>Loading Organisations ....</p>}
                                        {!loadingOrganisations && orgList &&
                                            <>
                                                <div className="panel-widget orgs-list-container">
                                                    <div className="widget-header">
                                                        <div className="widget-title">Organisation</div>
                                                        <div className="gl-search">
                                                            <input value={newFormOrgSearch} onChange={e => setNewFormOrgSearch(e.target.value)} />
                                                        </div>
                                                    </div>
                                                    <div className="widget-content">
                                                        <div className="list orgs-list">
                                                            {orgList.map((org) => {
                                                                const selected = newFormSelectedOrganisation ? newFormSelectedOrganisation.id === org.id : false;
                                                                return (
                                                                    <div key={org.id} className="option radio">
                                                                        <input id={`${dashboardData.id}-org-${org.id}`} type="radio" name="share-new-org" value={org.id} checked={selected} onChange={() => handleShareOrganisationSelect(org)} />
                                                                        <label htmlFor={`${dashboardData.id}-org-${org.id}`}>{org.name}</label>
                                                                    </div>
                                                                )
                                                            })}
                                                            {orgSearchInput && !orgList.length && <p className="no-match-msg">No Match Found</p>}
                                                        </div>
                                                    </div>
                                                </div>

                                                {loadingUsers && usersOfSelectedOrganisation === null && <p>Loading Users ....</p>}

                                                {usersOfSelectedOrganisation !== null && newFormSelectedOrganisation &&
                                                    <div className={'panel-widget user-list-container' + (loadingUsers ? ' disabled' : '')}>
                                                        <div className="widget-header">
                                                            <div className="widget-title">Users
                                                                {newFormSelectedUser.length ? <label>Selected <span>{newFormSelectedUser.length}</span></label> : null}
                                                            </div>
                                                            <div className="gl-search">
                                                                <input value={newFormUserSearch} onChange={e => setNewFormUserSearch(e.target.value)} />
                                                            </div>
                                                        </div>
                                                        <div className="widget-content">
                                                            <div className="list user-list">
                                                                {userList2.map((user) => {
                                                                    const selected = newFormSelectedUser.length ? newFormSelectedUser.some(u => u.id === user.id) : false;
                                                                    const alreadyShared = sharedUsers.some(s => s.user.id === user.id);
                                                                    return (
                                                                        <div key={user.id} className={'option checkbox' + (alreadyShared ? ' disabled' : '')}>
                                                                            <input id={`${dashboardData.id}-user-${user.id}`} type="checkbox" name="share-new-user" value={user.id} checked={selected} onChange={() => handleShareUsersSelect(user)} />
                                                                            <label htmlFor={`${dashboardData.id}-user-${user.id}`}>
                                                                                <div className="user-avtar"></div>
                                                                                {`${user.first_name} ${user.last_name || ''}`} {alreadyShared ? '(Already shared)' : ''}
                                                                            </label>
                                                                        </div>
                                                                    )
                                                                })}
                                                                {userSearchInput && !userList2.length && <p className="no-match-msg">No Match Found</p>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                }

                                                {usersOfSelectedOrganisation !== null &&
                                                    <div className="panel-widget auths">
                                                        <div className="widget-header">
                                                            <div className="widget-title">Authorization</div>
                                                        </div>
                                                        <div className="widget-content">
                                                            <ul className="auth-list">
                                                                {['VIEW', 'EDIT', 'COMMENT', 'SHARE', 'DELETE'].map(auth => {
                                                                    const checked = newFormSelectedAuthorizations.includes(auth);
                                                                    const disabled = auth === 'VIEW';
                                                                    return (
                                                                        <li key={auth} className={'auth-item' + (disabled ? ' disabled' : '')}>
                                                                            <div className="option checkbox">
                                                                                <input id={`${dashboardData.id}-share-${auth}`} type="checkbox"
                                                                                    checked={checked}
                                                                                    disabled={disabled}
                                                                                    onChange={() => handleShareNewAuthSelect(auth)} />
                                                                                <label htmlFor={`${dashboardData.id}-share-${auth}`}>{auth[0] + auth.slice(1).toLowerCase()}</label>
                                                                            </div>
                                                                        </li>
                                                                    );
                                                                })}
                                                            </ul>
                                                        </div>
                                                        <span></span>
                                                    </div>
                                                }

                                                {loadingChartList && <p>Loading Charts ...</p>}

                                                {!loadingChartList && usersOfSelectedOrganisation !== null &&
                                                    <div className={'panel-widget chart-list-container'}>
                                                        <div className="widget-header">
                                                            <div className="widget-title">Dashboard
                                                                {newFormChartsIDsSelected.length ? <label>Selected <span>{newFormChartsIDsSelected.length}</span></label> : null}
                                                            </div>
                                                            <div className="gl-search">
                                                                <input value={newFormChartSearch} onChange={e => setNewFormChartSearch(e.target.value)} />
                                                            </div>
                                                        </div>
                                                        <div className="widget-content">
                                                            <div className="list chart-list">
                                                                <div className="option checkbox select-all">
                                                                    <input id={`${dashboardData.id}-chart-select-all`} type="checkbox" checked={chartSelectAllStatusForNew} onChange={(e) => handleShareNewChartSelectAll(e.target.checked)} />
                                                                    <label htmlFor={`${dashboardData.id}-chart-select-all`}>Full Access</label>
                                                                </div>
                                                                {chartListForNew.map((chart) => {
                                                                    const selected = newFormChartsIDsSelected.length ? newFormChartsIDsSelected.includes(chart.id) : false;
                                                                    return (
                                                                        <div key={chart.id} className="option checkbox">
                                                                            <input id={`${dashboardData.id}-chart-${chart.id}`} type="checkbox" value={chart.id} checked={selected} onChange={() => handleShareNewChartSelect(chart.id)} />
                                                                            <label htmlFor={`${dashboardData.id}-chart-${chart.id}`}>{`${chart.id} : ${chart.name}`}</label>
                                                                        </div>
                                                                    )
                                                                })}
                                                                {chartSearchInputForNew && !chartListForNew.length && <p className="no-match-msg">No Match Found</p>}
                                                                {chartsList && chartsList.length === 0 && <p className="no-match-msg">No chart available for this Dashboard</p>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                }
                                            </>
                                        }
                                    </div>
                                }
                            </div>
                        </div>
                    </div>

                    {showNewForm &&
                        <div className="share-panel-footer console-btn-wrapper">
                            <div className="action-btns">
                                <button className="btn-with-icon btn-save" disabled={savingInProcess} onClick={handleShareNewFormSubmit}><i></i><span>Save</span></button>
                                <button className="btn-with-icon btn-reset" disabled={savingInProcess} onClick={handleShareNewFormReset}><i></i><span>Reset</span></button>
                                <button className="btn-with-icon btn-cancel" disabled={savingInProcess} onClick={() => setShowNewForm(false)}><i></i><span>Cancel</span></button>
                            </div>
                        </div>
                    }
                </div>
            </div>

        </div>
    );
};

