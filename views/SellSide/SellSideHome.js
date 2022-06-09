import React, { Component } from 'react';
// import moment from 'moment';
import * as d3 from 'd3';
import * as Constants from '../../components/Constants.js';

// import '../../styles/Dashboard.scss';
import '../../styles/ReportViews.scss';

import { getClients, getUser, getKeyByValue,
        convertDatePeriodPreselectsToRange } from '../../utils/Common'; //Import Common Functions
import { 
  formatChartData, drawDynamicChart, covertUnderscoreToSpaceInString,formatNumber, 
  chartSortingFormating, getDefaultChartFormat, isAbbrevationName, findChartOverlapping
} from './TrendMaster/ChartsUtils';
import APIService from '../../services/apiService'; //Import Services

import subjectObj from '../../subjects/Subject1';
import LoaderbyData from '../../components/LoaderbyData/LoaderbyData';
import ClickOutsideListener from '../../components/ClickOutsideListner';
import { isDateGreater } from '../../components/ReactCalendar/components/utils';
import RangePicker from '../../components/ReactCalendar/RangePicker';

const CHART_DIMENSIONS = {
  defaultWidth: 450,
  defaultHeight: 270,
  defaultSegmentWidth: 260,
  smWidth: 300,
  smHeight: 180,
  smSegmentWidth: 180,
  xsWidth: 200,
  xsHeight: 120,
  xsSegmentWidth: 140,
  defaultScorecardWidth: 130,
  defaultScorecardHeight: 80,
};


class SellSideHome extends Component {
  constructor(props) {
    super(props);

    //Get Client & View Type & User
    this.page_title = 'Terminal';
    this.user = getUser();
    this.controller = new AbortController();
    this.multiChartsScrollableWrapper = React.createRef();
    this.multiChartsWrapper = React.createRef();

    this.state = this.getInitVariables();

    // events
    this.getTrendDataSources = this.getTrendDataSources.bind(this);
    this.getDimensionsForAllDataSources = this.getDimensionsForAllDataSources.bind(this);
    this.getDefaultDashboard = this.getDefaultDashboard.bind(this);
    this.getExistingChartListOfDashboard = this.getExistingChartListOfDashboard.bind(this);
    this.getChartDataForAllCharts = this.getChartDataForAllCharts.bind(this);
    this.resizeChartsGridLayout = this.resizeChartsGridLayout.bind(this);
    this.storeChartData = this.storeChartData.bind(this);
    this.storeChartBandData = this.storeChartBandData.bind(this);
    this.renderChart = this.renderChart.bind(this);
    this.fetchChartData = this.fetchChartData.bind(this);
    this.onChartWidgetDragStart = this.onChartWidgetDragStart.bind(this);
    
    this.handleMoreButtonsDropDownToggle = this.handleMoreButtonsDropDownToggle.bind(this);
    this.adjustHeightOfMultiChartWrapper = this.adjustHeightOfMultiChartWrapper.bind(this);
  }

  //Get inital variables
  getInitVariables(){
    let client_id = this.user.last_fetched_client;

    //grids related settings
    let defaultGridCellWidth = 10;
    let defaultGridCellHeight = 10;
    let sidebarWidth = 0;
    let gridWrapperWidth = window.screen.width - sidebarWidth;
    let defaultGridsCount = Math.ceil(gridWrapperWidth/defaultGridCellWidth);

    return {
      inprocess: false, 
      error: '',
      message: '',
      sourceDimensionsInProcess: false,
      lastUpdatedDate: '',
      lastUpdatedDateObj: '',
      selectedDateRange: '',
      client: (client_id !== '' ? getKeyByValue(getClients(), client_id, 'id') : ''),
      terminal_type: this.user.terminal_type.id,
      defaultDashboard: {},
      chartsSettings: [], // to store all saved list of charts
      filteredChartsSettings: [],
      chartsLoadingsObj: {}, // stores chart ids as keys and true/false(To show loader or not) as values
      chartNoteCountObj: {},
      selectedChartIds: [],

      // Gird related variables
      // showMoreButtonsDropDownToggle: {},
      initialPlotterDrag: false,
      dashboardSettings: {},
      currentBreakpoint: 'lg',
      gridColWidth: defaultGridCellWidth,
      gridRowHeight: defaultGridCellHeight,
      defaultChartWidth: 46, //48 grids = 1 chart
      minChartWidth: Math.round(defaultGridsCount / 7), //24 grids = 1 chart
      defaultChartHeight: 14, //15 rows = 15*10+140=290 chart (15-1*10=140)
      minChartHeight: 7,
      chartSegmentWidth: 26,
      chartsGridLayoutWidth: gridWrapperWidth,
      chartsGridLayout: [],
      tempChartsGridLayout: [],
      gridCols: { lg: defaultGridsCount, md: 24, sm: 18, xs: 12, xxs: 6 }, //144
      compactType: 'vertical',
      gridLayouts: {},
      defaultYPlacements: [],

      chartFiltersSelected: false,
      chartsFormattedNetData: {},
      chartsFormattedData: {},
      chartsSegmentation: {},
      chartsBandData: {},
      data_sources: [],
      allDataSourcesDimensionsMetrics: {}, //store list of dimensions and metrics by datasource
      allDataSourcesDimensionsList: {}, //store dimensions list by datasource 
      chartWidgetLastDraggedZIndex: { zindex: 1, id: null },
    };
  }



  handleLoadScripts(){
    subjectObj.notify({
      page_title: this.page_title,
      client: this.state.client
    });


    this.resizeChartsGridLayout(); //set chart grid layout width
    window.addEventListener('resize', this.resizeChartsGridLayout);

    //Call Data Sources and Default Dashboard API calls
    this.setState({ inprocess: true, error: '' });

    this.getDefaultDashboard();

    this.getTrendDataSources()
      .then(() => {
        this.setState({ inprocess: false });
        this.getDimensionsForAllDataSources();
      })
      .catch(err => {
        this.setState({ inprocess: false, error: err });
      });
  }

  /**Searches for the chart present at bottom of chartWrapper and adjusts the height of wrapper according to that */
  adjustHeightOfMultiChartWrapper() {
    let bottomChartDOMElement, bottomChartDistFromWrapperTop = -1;
    const multiChartsWrapper = this.multiChartsScrollableWrapper.current.querySelector(`#multicharts-wrapper`);
    this.state.filteredChartsSettings.forEach(chart => {
      const chartDOMElement = multiChartsWrapper.querySelector(`#chart-${chart.id}`);
      const distFromTop = Number(chartDOMElement.style.top.replace('px', ''));
      if (distFromTop > bottomChartDistFromWrapperTop) {
        bottomChartDistFromWrapperTop = distFromTop;
        bottomChartDOMElement = chartDOMElement;
      }
    });

    // bottomChartDOMElement will not be found when 'this.state.chartsSettings' is empty array
    // This case may occur when last chart from dashbaord is deleted and after this method has been called
    if (!bottomChartDOMElement) { return; }

    const chartWrapperBottomPadding = 40;
    const bottomChartDOMElementHeight = bottomChartDOMElement.getBoundingClientRect().height;
    multiChartsWrapper.style.height = (bottomChartDistFromWrapperTop + bottomChartDOMElementHeight + chartWrapperBottomPadding) + 'px';
  }

  //On chart widget drag and drop
  onChartWidgetDragStart(e, id) {
    if (e.button !== 0) return;

    //to handle initial drag and drop
    if (this.state.initialPlotterDrag) {
      this.setState({ initialPlotterDrag: false });
      return;
    }

    const element = document.getElementById('chart-' + id);
    document.addEventListener('mousemove', chartMove);
    document.addEventListener('mouseup', chartDrop);
    element.classList.add('mousedown');

    const widgetCordinates = element.getBoundingClientRect();
    const distBwChartLeftEdgeAndMouseX = e.pageX - widgetCordinates.left;
    const distBwChartTopEdgeAndMouseY = e.pageY - widgetCordinates.top;

    // get maximum zindex of tempChartGridLayout
    let updatedTempGridLayouts = [...this.state.tempChartsGridLayout];
    let updatedZIndex = this.state.chartWidgetLastDraggedZIndex.zindex;
    let chartLayoutIndex = updatedTempGridLayouts.findIndex((e) => e.id === id);
    if (this.state.chartWidgetLastDraggedZIndex.id !== id) {
      let maxZIndex = Math.max.apply(Math, updatedTempGridLayouts.map((chart) => chart.zindex));
      updatedZIndex = maxZIndex + 1;
    }

    const colChartWrapperDiv = document.querySelector(`#col-charts-wrapper`);
    const multiChartsScrollableContainer = this.multiChartsScrollableWrapper.current;
    const multiChartsContainer = multiChartsScrollableContainer.querySelector('#multicharts-wrapper');
    const multiChartsContainerUsableWidth = multiChartsContainer.getBoundingClientRect().width - Number(window.getComputedStyle(multiChartsContainer).getPropertyValue('padding-right').replace('px', ''));
    let that = this;
    let mouseMoved = false; // to detect wheather mouse was moved/dragged before releasing the mouse. This will help ignoring the calculation and hence preventing bugs in 'mouseUp' event

    function chartMove(e) {
      let multiChartsContainerCord = multiChartsContainer.getBoundingClientRect();

      // compute mouse X and Y cordinates relative to chart container
      const mouseXRelative = e.pageX - multiChartsContainerCord.left;
      const mouseYRelative = e.pageY - multiChartsContainerCord.top;

      const canNotBeMovedFurtherLeft = (mouseXRelative - distBwChartLeftEdgeAndMouseX) < 0;
      const canNotBeMovedFurtherRight = (mouseXRelative - distBwChartLeftEdgeAndMouseX + widgetCordinates.width) > multiChartsContainerUsableWidth;
      const canNotBeMovedFurtherTop = mouseYRelative - distBwChartTopEdgeAndMouseY < 0;

      if (!canNotBeMovedFurtherLeft && !canNotBeMovedFurtherRight) {
        element.style.left = (mouseXRelative - distBwChartLeftEdgeAndMouseX) + 'px';
        if (canNotBeMovedFurtherTop) {
          element.style.top = 0 + 'px';
        }
      }
      if (!canNotBeMovedFurtherTop) {
        element.style.top = (mouseYRelative - distBwChartTopEdgeAndMouseY) + 'px';
        if (canNotBeMovedFurtherLeft) {
          element.style.left = 0 + 'px';
        }
        if (canNotBeMovedFurtherRight) {
          element.style.left = (multiChartsContainerUsableWidth - widgetCordinates.width) + 'px';
        }
      }
      if ((!canNotBeMovedFurtherLeft && !canNotBeMovedFurtherRight) || !canNotBeMovedFurtherTop) {
        mouseMoved = true;
        element.style.zIndex = updatedZIndex;
        document.body.style.userSelect = 'none'; // disable user select to avoid selection while dragging  
        // that.multiChartsWrapper.current.style.height = multiChartsWrapperScrollHeight + 'px';
      }


      /**SCROLL LOGIC STARTS */
      const scrollThreshold = 50;
      const bottomThresholdExcess = element.getBoundingClientRect().bottom - (window.innerHeight - scrollThreshold);
      // console.log('near',bottomThreshold);
      const topScrollExcess = (65 + scrollThreshold) - element.getBoundingClientRect().top;
      const leftScrollExcess = scrollThreshold - element.getBoundingClientRect().left;
      const rightScrollExcess = element.getBoundingClientRect().right - (window.innerWidth - 355 - scrollThreshold);

      const verticalScrollNeeded = bottomThresholdExcess > 0 || topScrollExcess > 0;
      const hotizontalScrollNeeded = leftScrollExcess > 0 || rightScrollExcess > 0;
      if (verticalScrollNeeded || hotizontalScrollNeeded) {

        // console.log('scroll- start');
        // window.scrollSpeed = bottomThresholdExcess > 0  ? bottomThresholdExcess/5 : topScrollExcess/5;
        window.scrollYSpeed = bottomThresholdExcess > 0 ? 20 : -20;
        window.scrollXSpeed = rightScrollExcess > 0 ? 10 : -10;
        // console.log('scroll- amount',window.scrollYSpeed);

        if (!window.isScrolling) {
          const scroll = () => {
            const currentYScroll = colChartWrapperDiv.scrollTop;
            const currentXScroll = multiChartsScrollableContainer.scrollLeft;
            let scrollYCompleted, scrollXCompleted;

            if (verticalScrollNeeded) {
              colChartWrapperDiv.scrollTop = currentYScroll + window.scrollYSpeed;
              scrollYCompleted = bottomThresholdExcess > 0 ? colChartWrapperDiv.scrollTop <= currentYScroll : colChartWrapperDiv.scrollTop === 0;
            }
            if (hotizontalScrollNeeded) {
              multiChartsScrollableContainer.scrollLeft = currentXScroll + window.scrollXSpeed;
              scrollXCompleted = rightScrollExcess > 0 ? multiChartsScrollableContainer.scrollLeft <= currentXScroll : that.multiChartsScrollableWrapper.current.scrollLeft === 0;
            }

            let requestScrollInNextFrame = false;
            if (window.isScrolling && verticalScrollNeeded && !scrollYCompleted) {
              // console.log('scroll- scrolling window ', window.scrollYSpeed);
              element.style.top = Number(element.style.top.replace('px', '')) + window.scrollYSpeed + 'px';
              requestScrollInNextFrame = true;
            }
            if (window.isScrolling && hotizontalScrollNeeded && !scrollXCompleted) {
              element.style.left = Number(element.style.left.replace('px', '')) + window.scrollXSpeed + 'px';
              requestScrollInNextFrame = true;
            }
            if (window.isScrolling && requestScrollInNextFrame) {
              window.requestAnimationFrame(scroll);
              return;
            }
            // console.log('scroll- scrolling stopped ');
            window.isScrolling = false;
          };

          window.isScrolling = true;
          window.requestAnimationFrame(scroll);
        }


      } else {
        window.isScrolling = false;
      }
      /**SCROLL LOGIC ENDS */
    }

    function chartDrop(e) {
      window.isScrolling = false;
      // that.multiChartsWrapper.current.style.height ='';
      e.stopPropagation();
      document.removeEventListener('mousemove', chartMove);
      document.removeEventListener('mouseup', chartDrop);
      element.classList.remove('mousedown');
      document.body.style.userSelect = 'auto';  // revert userSelect property

      // Do nothing if there was no mouse movement, it will be the case when chart is just clicked
      if (!mouseMoved) {
        that.handleChartSelection(chartLayoutIndex, id);
        return;
      }

      let gridMappedTop = Math.round(Number(element.style.top.replace('px', '')) / that.state.gridRowHeight);
      let gridMappedLeft = Math.round(Number(element.style.left.replace('px', '')) / that.state.gridColWidth);
      let posTop = (gridMappedTop * that.state.gridRowHeight);
      let posLeft = (gridMappedLeft * that.state.gridColWidth);

      if (isNaN(posTop)) return;

      element.style.top = posTop + 'px';
      element.style.left = posLeft + 'px';

      that.adjustHeightOfMultiChartWrapper();

      // let updatedTempChartsGridLayout = [...that.state.tempChartsGridLayout];
      updatedTempGridLayouts[chartLayoutIndex]['x'] = posLeft;
      updatedTempGridLayouts[chartLayoutIndex]['y'] = posTop;
      updatedTempGridLayouts[chartLayoutIndex]['zindex'] = updatedZIndex;

      that.setState({
        chartWidgetLastDraggedZIndex: { zindex: updatedZIndex, id: id },
        tempChartsGridLayout: updatedTempGridLayouts
      });
    }
  }

  
  componentDidMount(){
    this.handleLoadScripts();
  }

  //Reload the page if client id/name change from url
  componentDidUpdate(){
    this.user = getUser();
    
    if((this.user.terminal_type.id!==this.state.terminal_type) || 
      (this.user.terminal_type.id==='sellside' && this.state.client!=='' && this.user.last_fetched_client!==this.state.client.id)){
      //Cancel Previous API Requests
      console.log('cancel previous view running apis');
      APIService.abortAPIRequests(this.controller);

      setTimeout(() => {
        this.view_type = 'advertiser';
        this.controller = new AbortController();
        this.setState(this.getInitVariables(), ()=>this.handleLoadScripts());
      }, 10);
    }
  }

  componentWillUnmount(){
    //Cancel Previous API Requests
    console.log('unmount - cancel previous view running apis');
    APIService.abortAPIRequests(this.controller);
    window.removeEventListener('resize', this.resizeChartsGridLayout);
  }


  getDashboardInitialSettings(data) {
    const otherSett = data.dashboard_other_settings ? JSON.parse(data.dashboard_other_settings) : null;
    return {
      name: data.dashboard_name,
      description: data.dashboard_description,
      id: data.id,
      is_default: data.is_default,
      dynamic_time_period: data.dynamic_time_period,
      filters: data.filters,
      layout: 'masonry',
      presentationLockOn: otherSett ? otherSett.presentation_lock_on : false, // In view mode, dashboard can be locked so that changing/resizing of grid is not allowed
      tags: data.tags || [],
      folders: [],
      presentationTabs: otherSett ? otherSett.presentation_tabs : ['controls', 'search', 'insights', 'share'],
      presentationFilters: otherSett ? otherSett.presentation_filters : ['period'],
      presentationWidgetShortcuts: otherSett ? otherSett.presentation_widget_shortcuts : ['legend', 'grid', 'notes', 'sort', 'layers', 'full_screen', 'move']
    };
  }

  //resize Charts Grid Layout
  resizeChartsGridLayout() {
    if (this.multiChartsScrollableWrapper.current) {
      let padding = 0;
      let gridWrapperWidth = window.innerWidth - padding;
      let defaultGridsCount = gridWrapperWidth / this.state.gridColWidth;
      let updatedGridCols = defaultGridsCount; //144

      this.setState({
        chartsGridLayoutWidth: gridWrapperWidth,
        gridCols: updatedGridCols,
        defaultChartWidth: CHART_DIMENSIONS.defaultWidth
      });
    }
  }


  //show/hide more buttons drop down toggle
  handleMoreButtonsDropDownToggle(index){
    let updatedShowMoreButtonsDropDownToggle = {...this.state.showMoreButtonsDropDownToggle};
    if(updatedShowMoreButtonsDropDownToggle[index]){
      updatedShowMoreButtonsDropDownToggle[index] = !updatedShowMoreButtonsDropDownToggle[index];
    } else {
      updatedShowMoreButtonsDropDownToggle = {[index]: true};
    }

    this.setState({showMoreButtonsDropDownToggle: updatedShowMoreButtonsDropDownToggle});
  }


  //Get Trend Data Sources
  getTrendDataSources() {
    return new Promise((resolve, reject) => {
      APIService.apiRequest(Constants.API_BASE_URL + '/trend_master/get_data_sources/' + this.state.terminal_type, null, false, 'GET', this.controller)
        .then(response => {
          console.log('response', response);
          if (response.status === 1 && response.data !== undefined && response.data.length > 0) {
            let filtered_data_sources = [];
            let allDataSourcesDimensionsMetrics = {};
            let viewTypes = [];
            
            //show datasources which user has privilege
            response.data.forEach((item) => {
              if (item.is_custom_trend === 0 && (this.user.privileges[this.state.terminal_type].includes(item.privilege) || (this.user.privileges['sellside'] !== undefined && this.user.privileges['sellside'].includes('APEX')))) {
                filtered_data_sources.push(item);
                viewTypes.push(item.name);
                allDataSourcesDimensionsMetrics[item.name] = this.getAllListItems(item.columns);
              }
            });

            
            this.setState({
              inprocess: false,
              data_sources: filtered_data_sources,
              allDataSourcesDimensionsMetrics: allDataSourcesDimensionsMetrics
            }, () => {
              resolve(viewTypes);
            });
          } else {
            reject();
            console.log('Error: ' + response.msg);
          }
        })
        .catch(err => {
          reject();
          console.log('Error on getting data sources list', err);
        });
    });
  }

  //Get Dimension using API
  getDimensionsForAllDataSources() {
    this.setState({
      sourceDimensionsInProcess: true
    });

    let dimension_filters = {};
    if (this.user.parent_organization_id > 1) {
      let filters = [];
      if (Array.isArray(this.user.attributes)) {
        this.user.attributes.forEach((item) => {
          filters.push(item.site_name);
        });
      }
      dimension_filters = { "property": filters };
    }

    const dimensionListUnion = this.getDimensionsStr(this.state.data_sources.map(ds => ds.name)).split(',');

    let dimensionLoadedCount = 0;
    const presentationFiltersSaved = this.state.dashboardSettings.presentationFilters;

    let promises = []; // to detect when all requests are completed and then doing some other tasks
    dimensionListUnion.forEach(dim => {
      const dimensionPayLoad = {
        "client_id": this.state.client.id,
        "view_type": this.state.data_sources.map(ds => ds.name).join(','),
        "dimension": dim,
        "dimension_filter": dimension_filters
      };

      const promise = APIService.apiRequest(Constants.API_BASE_URL + '/getAllDimensions', dimensionPayLoad, false, 'POST', this.controller)
      promises.push(promise);
      promise.then(response => {
        if (response.status === 1 && response.data !== undefined) {
          let allDimensions = { ...this.state.allDataSourcesDimensionsList };
          // console.log('all Dimensions -', allDimensions);
          response.data.forEach(ds => {
            const viewTypeDataParsed = ds.data;
            allDimensions[ds.view_type] = allDimensions[ds.view_type] || {};
            allDimensions[ds.view_type][dim] = viewTypeDataParsed[dim];
          });

          dimensionLoadedCount++;

          let updatedState = {
            sourceDimensionsInProcess: dimensionLoadedCount < dimensionListUnion.length,
            allDataSourcesDimensionsList: allDimensions,
          };

          // All the presentation filters need to be toggled Checked initially if they were not saved earlier
          if (!presentationFiltersSaved.length) {
            updatedState.dashboardSettings = { ...this.state.dashboardSettings, presentationFilters: [...this.state.dashboardSettings.presentationFilters, dim] }
          }

          this.setState(updatedState);
        } else {
          this.setState({ sourceDimensionsInProcess: false, error: response.msg });
        }
      })
        .catch(err => {
          this.setState({ sourceDimensionsInProcess: false, error: err.msg });
        });
    });

    // Promise.all(promises)
    //   .then(() => {
    //     // fetch the data required for other tabs in background
    //     !this.state.insightNotes && this.getDashboardInsightNotes();
    //     !this.state.sharedUsers && this.getSharedUsersList();
    //   });
  }

  //Get All Dimensions
  getDimensionsStr(view_types) {
    let dimensions_list_combined = new Set();
    view_types.forEach(vt => {
      this.state.allDataSourcesDimensionsMetrics[vt].forEach((item) => {
        if (item.is_dimension === 1 && item.type === 'string') {
          dimensions_list_combined.add(item.title)
        }
      });
    });

    return Array.from(dimensions_list_combined).join(',');
  }


  //Get Fitler panel all items list - dimensions, metrics, calculated metrics
  getAllListItems(results) {
    let allItems = [];
    if (results) {
      Object.keys(results).forEach((item) => {
        if (results[item].length > 0) {
          results[item].forEach((subitem) => {
            let obj = subitem;
            obj['id'] = subitem.title;
            if (subitem.is_dimension === 0) {
              obj['default_action'] = (subitem.operation !== undefined) ? 'calculated' : 'sum';
            }
            allItems.push(obj);
          });
        }
      });
    }
    return allItems;
  }


  //get default dashbaord
  getDefaultDashboard(){
    let query = `?is_default=1`;
    APIService.apiRequest(Constants.API_BASE_URL + '/trend_master/get_dashboard_list/' + this.state.terminal_type + `${query}`, null, false, 'GET', this.controller)
      .then(response => {
        if (response.status === 1 && response.data.length) {
          this.setState({defaultDashboard: response.data[0]}, ()=>{
            this.getDashboardInitialSettings(response.data[0]);
            this.getExistingChartListOfDashboard(this.state.defaultDashboard.id);
          });
        }
      })
      .catch(err => {
        console.log(err.message);
          // reject(err)
      });
  }

  getExistingChartListOfDashboard(dId) {
    APIService.apiRequest(Constants.API_BASE_URL + '/trend_master/open_dashboard_tab/' + dId, null, false, 'PUT', this.controller)
      .then(response => {
        if (response.status === 1) {
          // parse the chart's 'dynamic_time_period' value if not null.
          // response.data.forEach(chart => { if (chart.dynamic_time_period) { chart.dynamic_time_period = chart.dynamic_time_period } });

          let updatedChartsSettings = [];
          let savedDashboardOtherSettings = response.dashboard.dashboard_other_settings ? JSON.parse(response.dashboard.dashboard_other_settings) : null;
          let updateChartsGridLayout = savedDashboardOtherSettings && savedDashboardOtherSettings.chart_grid_layout ? savedDashboardOtherSettings.chart_grid_layout : [];
          //add div ref
          response.data.forEach((chart, i) => {
            let chartConfig = chart;
            // add some extra properties in each chart which are required at client side
            chartConfig['ref'] = React.createRef();
            chartConfig['legendRef'] = React.createRef();
            chartConfig['showLegend'] = 0; // save in config and get it from API
            chartConfig['showGrid'] = 0; // save in config and get it from API

            if (chartConfig && (!chartConfig.chart_format_parameters || chartConfig.chart_format_parameters === '')) { //if format is not saved add default
              chartConfig['format'] = getDefaultChartFormat();
            } else {
              chartConfig['format'] = JSON.parse(chartConfig['chart_format_parameters']);
            }
            updatedChartsSettings.push(chartConfig);

            //dashboard grid layout exist or not check
            let chart_grid_layout_index = savedDashboardOtherSettings.chart_grid_layout.findIndex((e) => e.id === chart.id);
            if (!savedDashboardOtherSettings || !savedDashboardOtherSettings.chart_grid_layout) {
              updateChartsGridLayout.push(this.getDefaultChartGridLayout(chart, i)); //use saved config here
            }
            //if chart is under list but chart grid layout does not exist
            if (chart_grid_layout_index === -1) {
              updateChartsGridLayout.splice(i, 0, this.getDefaultChartGridLayout(chart, i));
            }
          });

          //remove unmatching chart from saved grids layout
          let filteredUpdateChartsGridLayout = [];
          updateChartsGridLayout.forEach((item) => {
            let index = updatedChartsSettings.findIndex((e) => e.id === item.id);
            if (index > -1) {
              filteredUpdateChartsGridLayout.push(item);
            }
          });

          //adjust w, h, x, and y of chart layout as per current screen using saved sreen size. 
          if (filteredUpdateChartsGridLayout.length > 0) {
            filteredUpdateChartsGridLayout.forEach((layout) => {
              let chartMainCords = this.getCordinatesInRatioToScreenSize(layout);
              layout['w'] = chartMainCords.w;
              layout['h'] = chartMainCords.h;
              layout['x'] = chartMainCords.x;
              layout['y'] = chartMainCords.y;
            });
          }

          this.setState({
            chartsSettings: updatedChartsSettings,
            filteredChartsSettings: updatedChartsSettings,
            chartsGridLayout: filteredUpdateChartsGridLayout,
            tempChartsGridLayout: filteredUpdateChartsGridLayout,
            inprocess: false
          }, () => {
            this.getChartDataForAllCharts();
            this.adjustHeightOfMultiChartWrapper(); // set height of chart container first time so that it accomodates all the charts inside it.
          });
        } else {
          this.setState({ inprocess: false });
          console.log('Error while getting dashboard charts list', response.msg);
        }
      })
      .catch(err => {
        console.log('Error on getting dashboard charts list', err.msg);
      });
  }

  getCordinatesInRatioToScreenSize(chartLayout) {
    let savedScreenSize = chartLayout.screen !== undefined ? chartLayout.screen : window.innerWidth;
    console.log('screen ratio', window.innerWidth + '--' + chartLayout.screen);
    let chartCordinates = {
      w: Math.round(((chartLayout.w * window.innerWidth) / savedScreenSize) / this.state.gridColWidth) * this.state.gridColWidth,
      h: Math.round(((chartLayout.h * window.innerWidth) / savedScreenSize) / this.state.gridRowHeight) * this.state.gridRowHeight,
      x: Math.round(((chartLayout.x * window.innerWidth) / savedScreenSize) / this.state.gridColWidth) * this.state.gridColWidth,
      y: Math.round(((chartLayout.y * window.innerWidth) / savedScreenSize) / this.state.gridRowHeight) * this.state.gridRowHeight,
    }
    return chartCordinates;
  }

  getDefaultChartGridLayout(chart) {
    let default_chart_width = chart.segmentation !== '' ? (parseInt(CHART_DIMENSIONS.defaultWidth) + parseInt(CHART_DIMENSIONS.defaultSegmentWidth)) : CHART_DIMENSIONS.defaultWidth;

    // add y placement details
    let newDefaultXYPlacements = { ...this.state.defaultXYPlacements };
    let newDefaultXYPlacementsLen = Object.keys(newDefaultXYPlacements).length;

    let currentYIndex = newDefaultXYPlacementsLen > 0 ? (newDefaultXYPlacementsLen - 1) : 0;
    let total_widgets_width = newDefaultXYPlacements[currentYIndex] !== undefined ? newDefaultXYPlacements[currentYIndex].reduce((sum, current) => sum + current.w, 0) : 0;
    let available_width = window.innerWidth - total_widgets_width;

    // Decide x and y based on chart width and available window width
    // 0+450+750 = 1440-1200 = 240 available width; if current chart width is less than available width change the y index
    if (available_width < default_chart_width) {
      currentYIndex = currentYIndex + 1;
      newDefaultXYPlacements[currentYIndex] = [{ w: default_chart_width, h: CHART_DIMENSIONS.defaultHeight }];
    } else {
      if (newDefaultXYPlacements[currentYIndex]) {
        newDefaultXYPlacements[currentYIndex].push({ w: default_chart_width, h: CHART_DIMENSIONS.defaultHeight });
      } else {
        newDefaultXYPlacements[currentYIndex] = [{ w: default_chart_width, h: CHART_DIMENSIONS.defaultHeight }];
      }
    }

    //if space not available in right side to place the chart, change the yindex and xindex reset to 0
    let currentXIndex = total_widgets_width;
    if (available_width < default_chart_width) {
      currentXIndex = 0;
    }

    //add gap of one grid size (10px)
    if (currentXIndex > 0) { currentXIndex = currentXIndex + ((newDefaultXYPlacements[currentYIndex].length - 1) * this.state.gridColWidth); }
    this.setState({
      defaultXYPlacements: newDefaultXYPlacements
    });
    let updatedCurrentYIndex = currentYIndex > 0 ? ((currentYIndex * CHART_DIMENSIONS.defaultHeight) + (currentYIndex * this.state.gridRowHeight)) : (currentYIndex * CHART_DIMENSIONS.defaultHeight);

    return {
      w: default_chart_width,
      h: CHART_DIMENSIONS.defaultHeight,
      x: currentXIndex,
      y: updatedCurrentYIndex,
      sw: CHART_DIMENSIONS.defaultSegmentWidth,
      zindex: 1,
      screen: window.innerWidth,
      id: chart.id
    }
  }


  //get chart grid cols count and classes
  getChartsGridDetails() {
    let display_charts_count = 3;
    let charts_wrapper_classes = 'full-width';
    if (this.props.showPlotterPanel) {
      charts_wrapper_classes = 'col-75 ' + this.state.plotterPanelPosition;
      display_charts_count = 2;
    }
    return { display_charts_count: display_charts_count, charts_wrapper_classes: charts_wrapper_classes };
  }

  /**Fetches/Refreshes the data for all charts in dashboard */
  getChartDataForAllCharts() {
    // this.setState({ inprocess: true });
    let chartLoadings = this.state.chartsLoadingsObj;
    this.state.chartsSettings.forEach((item) => {
      let payload = this.getFetchChartDataPayload(item);
      chartLoadings = { ...chartLoadings, [item.id]: true };
      this.fetchChartData(payload)
        .then((chartData) => {
          this.setState({ chartsLoadingsObj: { ...this.state.chartsLoadingsObj, [item.id]: false } })
          this.storeChartData(chartData, item);
          this.getChartBandDataIfApplicable(item);
          this.renderChart(item);
        })
        .catch(err => {
          this.setState({ chartsLoadingsObj: { ...this.state.chartsLoadingsObj, [item.id]: false } })
          // this.setState({ inprocess: false });
          console.log(err)
        });
    });
    // update the chartloadings in state
    this.setState({ chartsLoadingsObj: chartLoadings });
  }

  //Get new chart settings payload
  getFetchChartDataPayload(chartSettings) {
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


    let payload = {
      method: 'manual',
      client_id: this.state.client.id,
      terminal: this.state.terminal_type,
      view_type: chartSettings.view_type,
      daterange: this.giveDateRangeBasedOnPriority(chartSettings.dynamic_time_period, this.state.defaultDashboard.dynamic_time_period),
      filters: giveFiltersBasedOnPriority(chartSettings.filters, this.state.defaultDashboard.filters),
      segmentation: chartSettings.segmentation,
      metric: chartSettings.metric,
      x_axis: chartSettings.x_axis
    };
    // remove x_axis from payload for scorecard 
    if (chartSettings.chart_type === 'scorecard') {
      delete payload.x_axis;
    }
    return payload;
  }
  
  giveDateRangeBasedOnPriority(chartDynamicTimePeriod = '', dashboardDynamicTimePeriod = '') {
    let rangeToConsider = dashboardDynamicTimePeriod || chartDynamicTimePeriod;
    return rangeToConsider.is_dynamic === true
      ? [convertDatePeriodPreselectsToRange(rangeToConsider.value, rangeToConsider.custom_dates)]
      : [rangeToConsider.value];
  }

  // Fetch Chart data on Run button click
  fetchChartData(payload) {
    return new Promise((resolve, reject) => {
      APIService.apiRequest(Constants.API_BASE_URL + '/trend_master/get_chart_data', payload, false, 'POST', this.controller)
        .then(response => {
          if (response.status === 1) {
            let formattedData = formatChartData(response.data, 'date');
            resolve({ data: formattedData, other_details: response.other_details });
          } else { reject(response.message) }
        })
        .catch(err => {
          console.log('Error: ' + err.message);
          reject(err.message);
        });
    });
  }

  storeChartData(data, chartConfig) {
    let unique_key = chartConfig.id;
    const { formattedData, formattedNetData, segmentationData } = this.giveClientSideChartData(data, chartConfig);

    this.setState({
      chartsFormattedData: { ...this.state.chartsFormattedData, [unique_key]: formattedData },
      chartsFormattedNetData: { ...this.state.chartsFormattedNetData, [unique_key]: formattedNetData },
      chartsSegmentation: { ...this.state.chartsSegmentation, [unique_key]: segmentationData }
    });
  }

  storeChartBandData(bandData, chartConfig) {
    let unique_key = chartConfig.id;
    this.setState({
      chartsBandData: { ...this.state.chartsBandData, [unique_key]: bandData },
    });
  }

  /**Extracts the chart data into 3 seperate variables to be used at client side */
  giveClientSideChartData(chartData, chartConfig) {
    let cDataClient = { formattedData: [], formattedNetData: {}, segmentationData: '' };

    //define x and y axis
    // let colx = chartConfig.x_axis ? chartConfig.x_axis : 'date';
    cDataClient['formattedData'] = chartData.data;
    cDataClient['segmentationData'] = chartConfig.segmentation;

    for (let key in chartData.other_details) {
      cDataClient.formattedNetData[key] = {
        ...chartData.other_details[key],
        "symbol": '',
      }
    }
    return cDataClient;
  }

  giveBandSettingsFromChartPlottingParams(chartSett) {
    if (chartSett.chart_other_settings) {
      let params = JSON.parse(chartSett.chart_other_settings);
      return params.band_settings || [];
    }
    return [];
  }

  getChartBandDataIfApplicable(item) {
    const bandSettings = this.giveBandSettingsFromChartPlottingParams(item);
    if (bandSettings) {
      let promises = bandSettings.map(bandSett => {
        let payload = this.getFetchChartDataPayload(item);
        payload.segmentation = ''; // always empty, kept for api support 
        payload.band_params = { ...bandSett };
        delete payload.method;

        return this.fetchChartBandData(payload);
      });

      Promise.all(promises)
        .then((bandsData) => {
          let formattedBandsData = bandsData.map((b) => formatChartData(b, 'date'));
          this.storeChartBandData(formattedBandsData, item);
          this.renderChart(item);
        })
        .catch((err) => console.log(err));
    }
  }

  //get chart unique id for chart settings and chart data mapping
  getChartUniqueKey(chartConfig) {
    return (chartConfig.id && chartConfig.id !== '') ? chartConfig.id : 'new_chart_plotter';
  }

  //return x ticks count based on width
  getDynamicXTicksCount(currentChartWidth, defaultChartWidth, dynamicXTicksCount) {
    let newDynamicXTicksCount = dynamicXTicksCount;
    if (currentChartWidth > defaultChartWidth) {
      newDynamicXTicksCount = (currentChartWidth / defaultChartWidth) * dynamicXTicksCount;
      if (newDynamicXTicksCount % 1 > 0) {
        newDynamicXTicksCount = Math.round(newDynamicXTicksCount);
      }
    }
    if (currentChartWidth < defaultChartWidth) {
      newDynamicXTicksCount = (currentChartWidth / defaultChartWidth) * dynamicXTicksCount
      if (newDynamicXTicksCount % 1 > 0) {
        newDynamicXTicksCount = Math.floor(newDynamicXTicksCount);
      }
    }
    return newDynamicXTicksCount;
  }

  //return x ticks count based on width
  getDynamicYTicksCount(currentChartHeight, defaultChartHeight, dynamicYTicksCount) {
    let newDynamicYTicksCount = dynamicYTicksCount;
    if (currentChartHeight > defaultChartHeight) {
      newDynamicYTicksCount = (currentChartHeight / defaultChartHeight) * dynamicYTicksCount
      if (newDynamicYTicksCount % 1 > 0) {
        newDynamicYTicksCount = Math.ceil(newDynamicYTicksCount);
      }
    }
    if (currentChartHeight < defaultChartHeight) {
      newDynamicYTicksCount = (currentChartHeight / defaultChartHeight) * dynamicYTicksCount
      if (newDynamicYTicksCount % 1 > 0) {
        newDynamicYTicksCount = Math.ceil(newDynamicYTicksCount);
      }
    }

    return newDynamicYTicksCount;
  }


  //renders a single chart
  renderChart(chartConfig, pointSelectionModeOn = false, runTimeLayout = null, chartClassOnResize = '') {
    let chartsInputData = {};
    let chartWidthClass = '';

    if (this.state.chartsFormattedData && this.state.chartsFormattedData[chartConfig.id]) {
      let sortedData = [...this.state.chartsFormattedData[chartConfig.id]];
      if (chartConfig.format) {
        sortedData = chartSortingFormating(chartConfig, sortedData);
      }

      // chartsInputData['chartData'] = this.state.chartsFormattedData[chartConfig.id];
      chartsInputData['chartData'] = sortedData;
      chartsInputData['chartNetData'] = this.state.chartsFormattedNetData[chartConfig.id];
      chartsInputData['chartSegmentation'] = this.state.chartsSegmentation[chartConfig.id];
      chartsInputData['chartBandsData'] = this.state.chartsBandData[chartConfig.id] || null;
      chartsInputData['chartConfig'] = chartConfig;
    }

    // Add some other properties 
    chartsInputData['pointSelectionModeOn'] = pointSelectionModeOn;
    chartsInputData['pointSelectionClbk'] = pointSelectionModeOn ? this.handlePointSelectionOnChart : null;
    chartsInputData['pointClickClbk'] = this.handlePointClickOnChart;
    // Add chart Notes to chartsInputData if available 
    const showChartNotes = false;
    chartsInputData['chartNotes'] = showChartNotes ? this.giveChartNotesById(chartConfig.id) : null;

    chartsInputData['chartCurrencySymbol'] = '';
    chartsInputData['chartPercentSymbol'] = '';

    let dynamicXTicksCount = 4;
    let dynamicYTicksCount = 4;
    let defaultChartWidth = (chartConfig.segmentation != '') ? (CHART_DIMENSIONS.defaultWidth + CHART_DIMENSIONS.defaultSegmentWidth) : CHART_DIMENSIONS.defaultWidth;
    let smChartWidth = (chartConfig.segmentation != '') ? (CHART_DIMENSIONS.smWidth + CHART_DIMENSIONS.smSegmentWidth) : CHART_DIMENSIONS.smWidth;
    // let xsChartWidth = (chartConfig.segmentation != '') ? (CHART_DIMENSIONS.xsWidth + CHART_DIMENSIONS.xsSegmentWidth) : CHART_DIMENSIONS.xsWidth;

    //find index of gridLayout and 
    let gridLayoutIndex = this.state.tempChartsGridLayout.findIndex((e) => e.id === chartConfig.id);
    if (gridLayoutIndex > -1) {
      //dynamic chart x/y ticks
      let currentChartWidth = runTimeLayout ? runTimeLayout['w'] : this.state.tempChartsGridLayout[gridLayoutIndex]['w'];
      let currentChartHeight = runTimeLayout ? runTimeLayout['h'] : this.state.tempChartsGridLayout[gridLayoutIndex]['h'];

      //X Ticks
      dynamicXTicksCount = this.getDynamicXTicksCount(currentChartWidth, defaultChartWidth, dynamicXTicksCount);
      chartsInputData['xAxisTicksCount'] = dynamicXTicksCount;
      if (currentChartWidth < defaultChartWidth) {
        chartsInputData['excludeChartHeader'] = true;
      }

      // Y Ticks
      dynamicYTicksCount = this.getDynamicYTicksCount(currentChartHeight, CHART_DIMENSIONS.defaultHeight, dynamicYTicksCount);
      chartsInputData['yAxisTicksCount'] = dynamicYTicksCount;

      //check size classes and pass to dra chart function to manage spacings and ticks show/hide
      if (chartClassOnResize !== '') {
        chartWidthClass = chartClassOnResize;
      } else {
        if ((this.state.tempChartsGridLayout[gridLayoutIndex] && (this.state.tempChartsGridLayout[gridLayoutIndex]['w'] < defaultChartWidth) && (this.state.tempChartsGridLayout[gridLayoutIndex]['w'] >= smChartWidth))) {
          chartWidthClass = 'sm-grid-width';
        }
        if ((this.state.tempChartsGridLayout[gridLayoutIndex] && (this.state.tempChartsGridLayout[gridLayoutIndex]['w'] < smChartWidth))) {
          chartWidthClass = 'xs-grid-width';
        }
      }
    }

    chartsInputData['chartSizeClass'] = chartWidthClass; // used for controlling charts padding and hiding ticks and sliding ticks

    //for showing symbol before/after number
    let chartDimensionMetricsList = this.state.allDataSourcesDimensionsMetrics[chartConfig['view_type']];
    if (chartDimensionMetricsList) {
      let metricIndex = chartDimensionMetricsList.findIndex((e) => e.id === chartConfig['metric']);
      if (metricIndex > -1) {
        if (chartDimensionMetricsList[metricIndex]['type'] === 'currency') { chartsInputData['chartCurrencySymbol'] = '$'; }
        if (chartDimensionMetricsList[metricIndex]['type'] === 'percent') { chartsInputData['chartPercentSymbol'] = '%'; }
      }

      console.log('chartsInputData', chartsInputData);
      drawDynamicChart(chartsInputData);
    }
  }



  giveIndividualChartHtml(chart, chartIndex) {
    let chartMetric = chart.metric;
    let minVal = 0;
    let maxVal = 0;
    let unique_key = chart.id;
    let chartData = this.state.chartsFormattedData[unique_key];
    let chartNetData = this.state.chartsFormattedNetData[unique_key];
    if (chartNetData) {
      chartNetData = this.state.chartsFormattedNetData[unique_key][chart.metric];
    }
    let xaxis_val = chart.x_axis;
    let yaxis_val = chart.metric;
    let chartLayoutIndex = this.state.tempChartsGridLayout.findIndex((e) => e.id === unique_key);
    let isSelectedChart = this.state.selectedChartIds.includes(unique_key);


    //for showing symbol before/after number
    let currencySymbol = '';
    let percentSymbol = '';
    let chartDimensionMetricsList = this.state.allDataSourcesDimensionsMetrics[chart['view_type']];
    if (chartDimensionMetricsList) {
      let metricIndex = chartDimensionMetricsList.findIndex((e) => e.id === chart['metric']);
      if (metricIndex > -1) {
        if (chartDimensionMetricsList[metricIndex]['type'] === 'currency') { currencySymbol = '$'; }
        if (chartDimensionMetricsList[metricIndex]['type'] === 'percent') { percentSymbol = '%'; }
      }
    }
    
    //min/max values
    if (chartData) {
      minVal = d3.min(chartData, (d) => Number(d[chartMetric]));
      maxVal = d3.max(chartData, (d) => Number(d[chartMetric]));
    }

    let chartWidthClass = '';
    //if less than default chart width and greater than small chart width - add sm-grid-width class
    //if less than small chart width and greater than xs chart width - add xs-grid-width class
    let defaultChartWidth = (chart.segmentation != '') ? (CHART_DIMENSIONS.defaultWidth + CHART_DIMENSIONS.defaultSegmentWidth) : CHART_DIMENSIONS.defaultWidth;
    let smChartWidth = (chart.segmentation != '') ? (CHART_DIMENSIONS.defaultWidth + CHART_DIMENSIONS.defaultSegmentWidth) : CHART_DIMENSIONS.smWidth;

    if ((this.state.tempChartsGridLayout[chartLayoutIndex] && (this.state.tempChartsGridLayout[chartLayoutIndex]['w'] < defaultChartWidth) && (this.state.tempChartsGridLayout[chartLayoutIndex]['w'] >= smChartWidth))) {
      chartWidthClass = 'sm-grid-width';
    }
    if ((this.state.tempChartsGridLayout[chartLayoutIndex] && (this.state.tempChartsGridLayout[chartLayoutIndex]['w'] < smChartWidth))) {
      chartWidthClass = 'xs-grid-width';
    }

    let chartSegmentWidth = CHART_DIMENSIONS.defaultSegmentWidth;
    if (chartWidthClass === 'sm-grid-width') { chartSegmentWidth = CHART_DIMENSIONS.smSegmentWidth; }
    if (chartWidthClass === 'xs-grid-width') { chartSegmentWidth = CHART_DIMENSIONS.xsSegmentWidth; }

    const showChartLoading = !!this.state.chartsLoadingsObj[unique_key];
   
    //date period
    let chartDateRangeToShow = chart['dynamic_time_period'];
    if(chartDateRangeToShow){
      chartDateRangeToShow = chartDateRangeToShow.is_dynamic ? convertDatePeriodPreselectsToRange(chartDateRangeToShow.value, chartDateRangeToShow.custom_dates) : chartDateRangeToShow.value;
    } else {
      chartDateRangeToShow = this.giveDateRangeBasedOnPriority(chart.dynamic_time_period, this.state.defaultDashboard.dynamic_time_period)[0];
    }


    //plotting specifications of chart widgets
    let chartCordToBind = {
      'minW': chart['chart_type'] !== 'scorecard' ? CHART_DIMENSIONS.xsWidth : CHART_DIMENSIONS.defaultScorecardWidth,
      'minH': chart['chart_type'] !== 'scorecard' ? CHART_DIMENSIONS.xsHeight : CHART_DIMENSIONS.defaultScorecardHeight
    }, storedCord;
    if (chartIndex !== null) {
      storedCord = this.state.tempChartsGridLayout[chartLayoutIndex];
      let chartPosY = storedCord !== undefined ? storedCord['y'] : 0;
      chartCordToBind['x'] = storedCord['x'];
      chartCordToBind['y'] = chartPosY > 0 ? chartPosY : (chartPosY * storedCord['h']);
      chartCordToBind['w'] = storedCord['w'];
      chartCordToBind['h'] = storedCord['h'];
      // 'sw'(segment width) may not be available in some cases(consider it as 0, when not available)
      chartCordToBind['sw'] = ((storedCord['sw'] || 0) * 100) / storedCord['w'] + '%';
      chartCordToBind['cw'] = (100 - Number(chartCordToBind['sw'].replace('%', ''))) + '%';
      chartCordToBind['zindex'] = storedCord['zindex'] !== undefined ? storedCord['zindex'] : 1;

    } else {
      // For PREVIEW_CHART, resizing and repostion is not allowed, hence just assign the default layout settings
      // storedCord = this.state.newChartLayoutSettingsLastExecuted;
      // For Plotter chart, x and y has to be null as it will alwasy be at center(both vertically and horizontally)
      chartCordToBind = { ...storedCord, ...this.getNewChartInitialLayoutSettings() };
      // Adjust the width in case of segmentation
      if (chart.segmentation !== '') {
        chartCordToBind['w'] = CHART_DIMENSIONS.defaultWidth + CHART_DIMENSIONS.defaultSegmentWidth;
      }
      // Adjust the height in case of scorecard
      if (chart.chart_type === 'scorecard') {
        chartCordToBind['w'] = CHART_DIMENSIONS.defaultScorecardWidth;
        chartCordToBind['h'] = CHART_DIMENSIONS.defaultScorecardHeight;
      }
    }

    // find overlappign charts
    let chartsOverlappingMessage = '';
    if (chartIndex !== null) {
      let chartsBehindCurrent = findChartOverlapping(this.state.tempChartsGridLayout[chartLayoutIndex], this.state.tempChartsGridLayout);
      if (chartsBehindCurrent.length > 0) {
        chartsOverlappingMessage += chartsBehindCurrent.length + ' chart' + (chartsBehindCurrent.length > 1 ? 's' : '') + ' overlapped';
      }
    }
    
    return (
      <div id={'chart-' + unique_key}
        className={'asc-chart-wrapper ' + 'chart-' + chart.chart_type + (' ' + chartWidthClass) + ((chart.showLegend === 1 && chart.chart_type !== 'flat_table') ? ' show-legends' : '') + (isSelectedChart ? ' selected' : '')}
        // key={unique_key}
        style={{
          top: chartCordToBind.y,
          left: chartCordToBind.x,
          width: chartCordToBind.w,
          height: chartCordToBind.h,
          minWidth: chartCordToBind.minW,
          minHeight: chartCordToBind.minH,
          zIndex: chartCordToBind.zindex
        }}
        onMouseDown={e => {
          chartIndex !== null && this.onChartWidgetDragStart(e, unique_key)
        }}
      >
        <div className="grid-size"></div>

        {chartsOverlappingMessage != '' &&
          <div className="overlapping-msg">{chartsOverlappingMessage}</div>
        }

        {chart.chart_type !== 'scorecard' &&
          <div className="chart-inner-wrapper">
            <div className="asc-chart-main-header">
              <div className="title-wrapper">
                {chartIndex !== null && <label className="chart-number"> {'ID ' + (chartIndex + 1)}</label>}
                <h3 className="title" title={chart.name}>{chart.name}</h3>
                {(chartWidthClass !== 'sm-grid-width' && chartWidthClass !== 'xs-grid-width') &&
                  <div className="date-range" title={chartDateRangeToShow}>{chartDateRangeToShow}</div>
                }
              </div>
            </div>

            {/* {chartIndex !== null &&
              <>
                <button className="btn-asc-chart-meta" onClick={() => this.handleChartMetaDrodDownToggle(chartIndex)} onMouseDown={e => e.stopPropagation()}>info</button>
                {this.state.showMetaDropDownToggle[chartIndex] &&
                  <ClickOutsideListener onOutsideClick={(e) => this.handleChartMetaDrodDownToggle(chartIndex)}>
                    <div className="meta-info-wrapper">
                      <div className="date-range info">{chartDateRangeToShow}</div>

                      {chartData &&
                        <div className="axis info">
                          <div className="x-axis-label">x <span className={isAbbrevationName(xaxis_val) ? 'allcaps' : ''}>{xaxis_val}</span></div>
                          <div className="y-axis-label">Y <span className={isAbbrevationName(yaxis_val) ? 'allcaps' : ''}>{yaxis_val}</span></div>
                        </div>
                      }

                      {chartNetData &&
                        <div className="min-max-wrapper info">
                          {(minVal > 0 || maxVal > 0) &&
                            <div className="min-max">
                              <div className="chart-values">
                                <span className="label">Min</span>
                                <span className="val">{currencySymbol + formatNumber(minVal) + percentSymbol}</span>
                              </div>
                              <div className="chart-values">
                                <span className="label">Max</span>
                                <span className="val">{currencySymbol + formatNumber(maxVal) + percentSymbol}</span>
                              </div>
                            </div>
                          }
                          <div className="aggregated chart-values">
                            <span className="label">Total</span>
                            <span className="val">{currencySymbol + formatNumber(chartNetData.net_details) + percentSymbol}</span>
                          </div>
                        </div>
                      }
                    </div>
                  </ClickOutsideListener>
                }

                <button className="btn-asc-chart-more" onClick={(e) => this.handleMoreButtonsDropDownToggle(chartIndex)} onMouseDown={e => e.stopPropagation()}></button>
                {this.state.showMoreButtonsDropDownToggle[chartIndex] &&
                  <ClickOutsideListener onOutsideClick={(e) => this.handleMoreButtonsDropDownToggle(chartIndex)}>
                    <div className="more-buttons-wrapper" onMouseDown={e => e.stopPropagation()}>
                      {(this.isDashboardInEditMode() && chartIndex !== null) &&
                        <ul>
                          <li><button className="btn-copy" title="Copy" disabled={this.state.chartOrDashboardSaveInProcess} onClick={() => this.handleChartCopyBtn(unique_key)}>Copy</button></li>
                          <li><button className="btn-edit" title="Edit" disabled={this.state.chartOrDashboardSaveInProcess} onClick={() => this.handleChartEditBtn(unique_key)}>Edit</button></li>
                          <li><button className="btn-delete" title="Delete" disabled={this.state.chartOrDashboardSaveInProcess} onClick={() => this.handleChartDeleteBtn(unique_key)}>Delete</button></li>
                        </ul>
                      }

                      {(!this.isDashboardInEditMode()) &&
                        this.getWidgetHeaderActionButtons(chart, chartIndex, unique_key)
                      }
                    </div>
                  </ClickOutsideListener>
                }
              </>
            } */}

            <div className={'chart-content-wrapper' + (chart.segmentation !== '' ? ' show-legend' : '')}>
              <>
                <div className="chart-content"
                  style={{ minWidth: chart.segmentation !== '' ? CHART_DIMENSIONS.defaultWidth : '', width: chart.segmentation !== '' ? chartCordToBind.cw : '' }}>
                  {chart.chart_type !== 'flat_table' &&
                    <div className="asc-chart-header">
                      {chartData &&
                        <>
                          <div className="x-axis-label" title={`X : ${isAbbrevationName(xaxis_val) ? xaxis_val.toUpperCase() : covertUnderscoreToSpaceInString(xaxis_val)}`}>x <span className={isAbbrevationName(xaxis_val) ? 'allcaps' : ''}>{xaxis_val}</span></div>
                          <div className="y-axis-label" title={`Y : ${isAbbrevationName(yaxis_val) ? yaxis_val.toUpperCase() : covertUnderscoreToSpaceInString(yaxis_val)}`}>Y <span className={isAbbrevationName(yaxis_val) ? 'allcaps' : ''}>{yaxis_val}</span></div>
                        </>
                      }

                      {chartNetData &&
                        <>
                          <div className="seperator"></div>
                          {(minVal > 0 || maxVal > 0) &&
                            <>
                              <div className="chart-values" title={`Min : ${currencySymbol + formatNumber(minVal) + percentSymbol}`}>
                                <span className="label">Min</span>
                                <span className="val">{currencySymbol + formatNumber(minVal) + percentSymbol}</span>
                              </div>
                              <div className="chart-values" title={`Max : ${currencySymbol + formatNumber(maxVal) + percentSymbol}`}>
                                <span className="label">Max</span>
                                <span className="val">{currencySymbol + formatNumber(maxVal) + percentSymbol}</span>
                              </div>
                            </>
                          }
                          <div className="aggregated chart-values" title={`Total : ${currencySymbol + formatNumber(chartNetData.net_details) + percentSymbol}`}>
                            <span className="label">Total</span>
                            <span className="val">{currencySymbol + formatNumber(chartNetData.net_details) + percentSymbol}</span>
                          </div>
                        </>
                      }
                    </div>
                  }

                  <div className={'asc-chart ' + chart.chart_type} ref={chart.ref} data-ref={chart.ref}></div>
                </div>

                {chart.segmentation !== '' &&
                  <div className="legends-container" style={{ minWidth: (chartSegmentWidth - 10), width: chartCordToBind.sw, height: (chartCordToBind.h - 24) }} >
                    <div className="legends-resizer" onMouseDown={e => chartIndex !== null && this.handleSegmentaionResizeStart(e, chartIndex, unique_key)} ></div>
                    <div id={'legends-wrapper-' + unique_key} className="legends-wrapper" ref={chart.legendRef}></div>
                  </div>
                }
              </>
            </div>

            {showChartLoading &&
              <div className="chart-loading">
                <div className="loading-progress"></div>
              </div>
            }
          </div>
        }
        
        {chart.chart_type === 'scorecard' &&
          <div className="chart-inner-wrapper">
            <div className="asc-chart-main-header">
              <div className="title-wrapper">
                {chartIndex !== null && <label className="chart-number"> {'ID ' + (chartIndex + 1)}</label>}
                <h3 className="title">{chart.name}</h3>
              </div>
            </div>

            <div className="score-info">
              <label className="label">{covertUnderscoreToSpaceInString(chart.metric)}</label>
              <div className="right-grp" onMouseDown={e => e.stopPropagation()}>
                <span className="info-icon" onClick={() => this.setState({ clickedScorecardInfo: chart })}>
                </span>
                {this.isDashboardInEditMode() && chartIndex !== null &&
                  <span className="more-icon" onClick={() => this.handleMoreButtonsDropDownToggle(chartIndex)}></span>
                }
              </div>

            </div>
            {chartData && <h2 className="score">{currencySymbol + formatNumber(chartData[0][chart.metric]) + percentSymbol}</h2>}
            <div className="score-variation down"><span className="icon"></span>21%</div>

            {this.state.showMoreButtonsDropDownToggle[chartIndex] &&
              <ClickOutsideListener onOutsideClick={() => this.handleMoreButtonsDropDownToggle(chartIndex)}>
                <div className="more-buttons-wrapper">
                  <ul>
                    <li><button className="btn-copy" title="Copy" disabled={this.state.chartOrDashboardSaveInProcess} onClick={() => this.handleChartCopyBtn(unique_key)}>Copy</button></li>
                    <li><button className="btn-edit" title="Edit" disabled={this.state.chartOrDashboardSaveInProcess} onClick={() => this.handleChartEditBtn(unique_key)}>Edit</button></li>
                    <li><button className="btn-delete" title="Delete" disabled={this.state.chartOrDashboardSaveInProcess} onClick={() => this.handleChartDeleteBtn(unique_key)}>Delete</button></li>
                  </ul>
                </div>
              </ClickOutsideListener>
            }

            {showChartLoading &&
              <div className="chart-loading">
                <div className="loading-progress"></div>
              </div>
            }
          </div>
        }

        {chartIndex !== null &&
          <>
            <div className="chart-resizer-corner" onMouseDown={(e) => this.handleMultiChartResizeStart(e, unique_key, 'corner')}></div>
            <div className="chart-resizer-edge edge-left" onMouseDown={(e) => this.handleMultiChartResizeStart(e, unique_key, 'left')}>
              <span className="marker"></span>
              <span className="marker"></span>
              <span className="marker"></span>
            </div>
            <div className="chart-resizer-edge edge-right" onMouseDown={(e) => this.handleMultiChartResizeStart(e, unique_key, 'right')}>
              <span className="marker"></span>
              <span className="marker"></span>
              <span className="marker"></span>
            </div>
            <div className="chart-resizer-edge edge-top" onMouseDown={(e) => this.handleMultiChartResizeStart(e, unique_key, 'top')}>
              <span className="marker"></span>
            </div>
            <div className="chart-resizer-edge edge-bottom" onMouseDown={(e) => this.handleMultiChartResizeStart(e, unique_key, 'bottom')}>
              <span className="marker"></span>
            </div>
          </>
        }
      </div>
    )
  }


  render(){
    return (
      <div className="app-wrapper trend-view-wrapper sellside-home">
        <div id="app-sub-header">
          <div className="date-period-wrapper">
            {this.state.client && 
              <RangePicker picker="date"
              range={this.state.selectedDateRange}
              dateForLastDaysCalculation={this.state.lastUpdatedDateObj}
              onChange={this.handleDatePeriodChange}
              disableFn={(dObj) => isDateGreater(dObj, this.state.lastUpdatedDateObj)}
              allowClear={false}
              showOkCancelBtns={true}
            />
            }
          </div>
        </div>

        <div className={`trend-view odin-multicharts clearfix`}>
          {/* Charts - Panel */}
          <div id="col-charts-wrapper" className={'col-view full-width'}>
            {this.state.inprocess && <LoaderbyData />}

            <div id="chart-section">
              <div id="multicharts-wrapper-scrollable" ref={this.multiChartsScrollableWrapper}>
                {!this.state.inprocess &&
                  <div id="multicharts-wrapper" ref={this.multiChartsWrapper}>
                    {this.state.filteredChartsSettings.length > 0 &&
                      this.state.filteredChartsSettings.map((chart, i) => {
                        return this.giveIndividualChartHtml(chart, i)
                      })
                    }
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


export default SellSideHome;