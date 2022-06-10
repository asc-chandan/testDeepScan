// return the user data from the session storage
import * as d3 from 'd3';
import moment from 'moment';
import * as Constants from '../../../components/Constants.js';
import { DefaultColorsList, ColorPalettes } from '../../../components/ColorPalettes';

//HandPicked Colors
var chartColors = Constants.chartColors;
var lineColor = chartColors[0];

/************************************************
 * Get Chart Colors
 */
export const getChartColors = () => {
  return chartColors;
}


/************************************************
 * Order Object with expected keys order
 */
export const orderObjectKey = (obj, keyOrder) => {
  keyOrder.forEach((k) => {
    const v = obj[k]
    delete obj[k]
    obj[k] = v
  })
  return obj;
}


/************************************************
 * Format numbers with commas
 */
export const numberWithCommas = (x) => {
  const [integer, decimal] = x.toString().split('.');
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (decimal ? '.' + decimal : '');

}

/************************************************
 * Converts a underscore separated string to space separated string
 * @example converts 'view_type' to 'View Type'
 *************************************************/
export const covertUnderscoreToSpaceInString = (str) => {
  if (typeof str !== 'string') {
    throw Error('Parameter must be of type string');
  }
  if (str === '') { return ''; }
  return str.split('_').map(x => x[0].toUpperCase() + x.slice(1)).join(' ');
}


/************************************************
 * Parse Charts Data
 * data
 * segmentation
 * colx
 * coly
 * isComparisonEnabled=false
 * comparisonXAxisKey
 * comparisonDataKey
 */
export const parseChartData = (args) => {
  let arr = [];
  let isComparisonEnabled = args.isComparisonEnabled ? args.isComparisonEnabled : false;
  let colx = args.colx.toLowerCase();
  let coly = args.coly.toLowerCase();

  for (var key in args.data) {
    if (Object.prototype.hasOwnProperty.call(args.data, key)) {
      if (isComparisonEnabled) {
        let periodData = args.data[key];

        for (var subkey in periodData) {
          if (Object.prototype.hasOwnProperty.call(periodData, subkey)) {
            var date = (periodData[subkey][colx]) ? periodData[subkey][colx] : periodData[subkey][colx.charAt(0).toUpperCase() + colx.slice(1)];
            var indexDate = '';

            if (args.comparisonDataKey === 'period') {
              indexDate = (periodData[subkey][args.comparisonXAxisKey]) ? periodData[subkey][args.comparisonXAxisKey] : periodData[subkey][args.comparisonXAxisKey.charAt(0).toUpperCase() + args.comparisonXAxisKey.slice(1)];
            } else {
              indexDate = date;
            }

            var dataVal;
            var floatKeys = ['revenue', 'cpm', 'rpm', 'rps', 'rpms', 'rpu', 'rpmu', 'viewability', 'fill_rate', 'imp/pv', 'index'];
            if (floatKeys.includes(coly)) {
              dataVal = Number.parseFloat(periodData[subkey][coly]).toFixed(2);
            } else {
              dataVal = Number.parseInt(periodData[subkey][coly]);
            }

            //Format Date to YYYY-MM-DD
            var selectedDate = moment(date, 'YYYY-MM-DD');
            var formattedDate = moment.parseZone(selectedDate).format('YYYY-MM-DD');
            var selectedIndexDate = moment(indexDate, 'YYYY-MM-DD');
            var formattedIndexDate = moment.parseZone(selectedIndexDate).format('YYYY-MM-DD');
            var parsedData1 = {};
            parsedData1['id'] = key; //date
            parsedData1[colx] = formattedDate; //date
            parsedData1[coly] = +dataVal; //convert string to number
            parsedData1[args.comparisonXAxisKey] = formattedIndexDate; //index date
            parsedData1['change'] = Number.parseFloat(periodData[subkey]['change']).toFixed(2); //index date
            arr.push(parsedData1);
          }
        }

      } else {
        var segmentationModified = (args.segmentation && args.segmentation !== ' ') ? args.segmentation.charAt(0).toUpperCase() + args.segmentation.slice(1) : '';
        var parsedData2 = {};

        // Just copy the x and y values as it is, TODO : Refactor this later
        parsedData2[colx] = args.data[key][colx];
        parsedData2[coly] = args.data[key][coly];

        if (args.segmentation && args.segmentation !== '' && args.segmentation !== ' ' && args.segmentation !== 'all') {
          parsedData2[args.segmentation] = (args.data[key][args.segmentation]) ? args.data[key][args.segmentation] : args.data[key][segmentationModified];
        }
        arr.push(parsedData2);
      }

    }
  }
  return arr;
}

//Format Date to YYYY-MM-DD
export const parseChartDate = (date) => {
  var selectedDate = moment(date, 'YYYY-MM-DD');
  var formattedDate = moment.parseZone(selectedDate).format('YYYY-MM-DD');
  return formattedDate;
}


/************************************************
 * Calculate Lower and Upper Limit
 */
export const getMinMaxRange = (data, col_val, chart_type = null) => {
  let minmaxRange = {};
  let minVal = d3.min(data, function (d) { return Number(d[col_val]); });
  let maxVal = d3.max(data, function (d) { return Number(d[col_val]); });
  let range = (maxVal - minVal);
  let lowerLimitVal = minVal - (0.10 * range);
  let upperLimitVal = maxVal + (0.10 * range);

  // find the minimum between range and minVal and calculate 10% of that

  minmaxRange['lowerLimit'] = (chart_type && chart_type === 'bar') ? 0 : lowerLimitVal;
  minmaxRange['upperLimit'] = upperLimitVal;
  return minmaxRange;
}


/************************************************
 * Format Number
 */
export const formatNumber = (number) => {
  let formatNumber = d3.format(".3s");
  if (number < -999) return formatNumber(number).replace(/G/, "B");
  if (number < 999) {
    return (number % 1 === 0) ? number : parseFloat(number).toFixed(2);
  }
  return formatNumber(number).replace(/G/, "B");
}


/************************************************
 * Check if metric name is abbrevations
 */
export const isAbbrevationName = (key) => {
  let arr = ['cpm', 'rpm', 'rps', 'rpms', 'rpu', 'rpmu', 'imp/pv'];
  return arr.includes(key);
}


/************************************************
 * Order Array of objects by key val
 */
export const orderArrayObjects = (arr, key, order) => {
  arr.sort(function (a, b) {
    if (order === 'asc') {
      return new Date(a[key]).getTime() - new Date(b[key]).getTime();
    } else {
      return new Date(b[key]).getTime() - new Date(a[key]).getTime();
    }
  });
}


//Format Chart Data
export const formatChartData = (chartData, date_key) => {
  var parseDate = d3.timeParse("%Y-%m-%d");
  //Format Charts` Data
  if (chartData && chartData.length > 0 && date_key in chartData[0]) {
    chartData = chartData.map(cd => ({ ...cd, [date_key]: parseDate(cd[date_key]) }));
  }
  return chartData;
}

export const giveDateInString = (dateObj) => d3.timeFormat("%m.%d.%Y")(dateObj);
export const giveDateTimeInString = (dateObj) => d3.timeFormat("%b %d, %Y %H:%M:%S %Z")(dateObj);

//default chart format tab settings
export const getDefaultChartFormat = () => {
  return {
    xaxis: { min: '', max: '', tick: '' },
    yaxis: { min: '', max: '', tick: '' },
    color: { dropdown_open: false, dropdown_open2: false, single_color: '', second_color: '', palette: 'default' },
    sorting: { 0: [{ condition: '', val: '' }] },
    showLabel: false
  };
}

// Chart Sorting Formating - Chart format tab saved settings
export const chartSortingFormating = (chartConfig, data) => {
  if (chartConfig && data && Object.keys(chartConfig.format.sorting).length > 0) {
    Object.keys(chartConfig.format.sorting).forEach((item) => {
      if (chartConfig.format.sorting[item]) {
        chartConfig.format.sorting[item].forEach((subitem) => {
          if (subitem.condition !== '' && subitem.condition.id == 'greater_than' && subitem.val !== '') {
            data = data.filter((e) => e[chartConfig.metric] > parseFloat(subitem.val));
          }
          if (subitem.condition !== '' && subitem.condition.id == 'greater_than_equal_to' && subitem.val !== '') {
            data = data.filter((e) => e[chartConfig.metric] >= parseFloat(subitem.val));
          }
          if (subitem.condition !== '' && subitem.condition.id == 'less_than' && subitem.val !== '') {
            data = data.filter((e) => e[chartConfig.metric] < parseFloat(subitem.val));
          }
          if (subitem.condition !== '' && subitem.condition.id == 'less_than_equal_to' && subitem.val !== '') {
            data = data.filter((e) => e[chartConfig.metric] <= parseFloat(subitem.val));
          }
          if (subitem.condition !== '' && subitem.condition.id == 'equal_to' && subitem.val !== '') {
            data = data.filter((e) => e[chartConfig.metric] == parseFloat(subitem.val));
          }
          if (subitem.condition !== '' && subitem.condition.id == 'not_equal_to' && subitem.val !== '') {
            data = data.filter((e) => e[chartConfig.metric] != parseFloat(subitem.val));
          }
          if (subitem.condition !== '' && subitem.condition.id == 'between' && subitem.val !== '' && subitem.val2 !== '') {
            data = data.filter((e) => (e[chartConfig.metric] >= parseFloat(subitem.val) && e[chartConfig.metric] <= parseFloat(subitem.val2)));
          }
          if (subitem.condition !== '' && subitem.condition.id == 'top' && subitem.val !== '') {
            data = data.sort((a, b) => (a[chartConfig.metric] < b[chartConfig.metric] ? 1 : -1)).slice(0, parseInt(subitem.val)); //sorting in desc
          }
          if (subitem.condition !== '' && subitem.condition.id == 'bottom' && subitem.val !== '') {
            data = data.sort((a, b) => (a[chartConfig.metric] > b[chartConfig.metric] ? 1 : -1)).slice(0, parseInt(subitem.val)); //sorting in asc
          }
        });
      }
    });
  }

  return data;
}


/* 
Draw Dynamic Charts
---Parameters
i.    chartXAxisWrappe - to render x-axis,
ii.   chartWrapper - chart wrapper
iii.  chartsDataObj - chart data in object format
iv.   chartsNetData - chart net details in
v.    chartsSegmentationObj - chart segmentation details
vi.   insightnotesObj - insights (AI/Custom Notes)
vii.  isEmpty - render blank chart with no data
viii. dateRange - required to render blank charts to show x-axis dates
ix,   isSegmented - segmented or not to show all mouse hover value with same table formatting incase any chart is segmented 
x.    isComparisonEnabled - to render period comparison charts
xi.   comparisonXAxisKey: 'index_date', //x-axis Key 
xii.  comparisonDataKey: 'period', //data Key 
*/
export const drawDynamicChart = (args) => {
  //Clone Charts Data
  var chartData = args.chartData;
  var chartNetDetails = (args.chartNetData !== undefined) ? JSON.parse(JSON.stringify(args.chartNetData)) : {};
  var chartSegmentation = args.chartSegmentation;
  var chartConfig = args.chartConfig;
  if (!chartConfig) return;

  var chartConfigFormat = chartConfig.format;
  if (chartConfigFormat) {
    Object.keys(chartConfigFormat['xaxis']).forEach((key) => {
      if (chartConfigFormat['xaxis'][key] !== '') {
        chartConfigFormat['xaxis'][key] = parseInt(chartConfigFormat['xaxis'][key]);
      }
    });
    Object.keys(chartConfigFormat['yaxis']).forEach((key) => {
      if (chartConfigFormat['yaxis'][key] !== '') {
        chartConfigFormat['yaxis'][key] = parseInt(chartConfigFormat['yaxis'][key]);
      }
    });
  }

  function drawCharts() {
    let chart_ykey = chartConfig.metric;
    let chart_xkey = chartConfig.x_axis;
    // var parseDate = d3.timeParse("%Y-%m-%d");

    d3.select(chartConfig.ref.current).html(''); //make it empty first

    let chartParams = {
      chartWrapper: chartConfig.ref,
      chartType: chartConfig.chart_type,
      chartLegendWrapper: chartConfig.legendRef,
      yaxiskey: chart_ykey,
      xaxiskey: chart_xkey,
      data: chartData,
      chartSegmentation: chartSegmentation,
      chartsNetDetails: chartNetDetails[chart_ykey],
      show_grid: chartConfig.showGrid,
      show_legend: chartConfig.showLegend,
      unique_key: chartConfig.id,
      chartCurrencySymbol: args.chartCurrencySymbol,
      chartPercentSymbol: args.chartPercentSymbol,
      chartFormat: chartConfigFormat,
      chartSizeClass: args.chartSizeClass,
      screen: args.screen,
      isDashboardInEditMode: args.isDashboardInEditMode,
      viewModeType: args.viewModeType
    };

    //console.log(chartParams)
    chartParams['chartBandsData'] = args.chartBandsData;
    
    if (chartConfig.chart_type !== 'flat_table') {
      // chartParams['chartNotes'] = args.chartNotes;
      // While showing notes on chart, only one note is to be shown for a given value of x_axis_point, hence remove the duplicates
      let notesWithoutDuplicacy = [];
      if (args.chartNotes && args.chartNotes.length > 0) {
        const xPointIsDateObj = args.chartNotes[0].x_axis_point instanceof Date;
        args.chartNotes.forEach(cn => {
          if (!notesWithoutDuplicacy.some(nd => {
            return xPointIsDateObj ? giveDateInString(nd.x_axis_point) === giveDateInString(cn.x_axis_point) : nd.x_axis_point === cn.x_axis_point
          })) {
            notesWithoutDuplicacy.push(cn);
          }
        });
      }
      chartParams['chartNotes'] = args.chartNotes && args.chartNotes.length ? notesWithoutDuplicacy : null;
      chartParams['pointSelectionModeOn'] = args.pointSelectionModeOn;
      chartParams['pointSelectionClbk'] = args.pointSelectionClbk;
      chartParams['pointClickClbk'] = args.pointClickClbk;
    }
    if (args.xAxisTicksCount) {
      chartParams['xAxisTicksCount'] = args.xAxisTicksCount;
    }
    if (args.yAxisTicksCount) {
      chartParams['yAxisTicksCount'] = args.yAxisTicksCount;
    }
    if (args.excludeChartHeader !== undefined) { //remove header height if width is less than default width
      chartParams['excludeChartHeader'] = args.excludeChartHeader;
    }

    if (chartConfig.chart_type === 'bar') {
      drawBarChart(chartParams); //draw bar chart

    } else if (chartConfig.chart_type === 'line') {
      drawLineChartFreeCrossHair(chartParams);

    } else if (chartConfig.chart_type === 'scatter') {
      drawScatterChart2(chartParams) //draw scatter chart

    } else if (chartConfig.chart_type === 'flat_table') {
      drawTable(chartParams); //draw table

    } else if (chartConfig.chart_type === 'pie') {
      drawPieChart(chartParams, false); //draw pie chart
    } else if (chartConfig.chart_type === 'donut') {
      drawPieChart(chartParams, true); //draw pie chart
    } else if (chartConfig.chart_type === 'bubble') {
      drawBubbleChart(chartParams);// draw bubble chart
    } else if (chartConfig.chart_type === 'heatmap') {
      drawHeatMapChart(chartParams);// draw heatmap chart
    } else if (chartConfig.chart_type === 'spider') {
      drawSpiderChart(chartParams);// draw spider chart
    } else if (chartConfig.chart_type === 'waterfall') {
      drawWaterFallChart(chartParams);// draw waterfall chart
    } else if (chartConfig.chart_type === 'area') {
      drawAreaChart(chartParams);// draw area chart
    } else if (chartConfig.chart_type === 'box') {
      drawBoxPlot(chartParams);// draw box chart
    } else if (chartConfig.chart_type === 'density') {
      draw2DDensityChart(chartParams)
    } else if (chartConfig.chart_type === 'treemap') {
      drawTreeMapChart(chartParams)
    }
  }

  drawCharts();
}

//get charts standard config
function getInitialChartConfig(args = null) {
  if (args) {
    if (d3.select('#chart-' + args.unique_key).size() <= 0 || !args.chartWrapper) return;
    d3.select('#chart-' + args.unique_key).classed('table-wrapper', false); //remove table-wrapper class which has been set when chart type changed to table

    let isInViewModeFitToWidth = (!args.isDashboardInEditMode && (args.viewModeType !== undefined && args.viewModeType.name === 'Fit to Width') && args.screen);
    let chartHeadingSectionHeight = isInViewModeFitToWidth ? Math.round(40 * window.innerWidth / args.screen) : 40;
    let chartLeftPadding = isInViewModeFitToWidth ? Math.round(40 * window.innerWidth / args.screen) : 40;
    let chartRightPadding = 0;
    let chartBottomPadding = isInViewModeFitToWidth ? Math.round(40 * window.innerWidth / args.screen) : 40;
    let inbetweenChartAndXAxisPadding = isInViewModeFitToWidth ? Math.round(6 * window.innerWidth / args.screen) : 6;
    let inbetweenChartAndYAxisPadding = isInViewModeFitToWidth ? Math.round(8 * window.innerWidth / args.screen) : 8;
    let chartContentPaddingBottomOrg = 15;

    if (args.chartSizeClass === 'sm-grid-width') {
      chartRightPadding = 0;
      chartBottomPadding = isInViewModeFitToWidth ? Math.round(28 * window.innerWidth / args.screen) : 28;
      chartContentPaddingBottomOrg = (args.chartType !== 'scorecard' && args.chartType !== 'flat_table') ? 5 : 15;
    }
    if (args.chartSizeClass === 'xs-grid-width') {
      chartLeftPadding = 0;
      chartRightPadding = 0;
      chartBottomPadding = isInViewModeFitToWidth ? Math.round(15 * window.innerWidth / args.screen) : 15;
      inbetweenChartAndXAxisPadding = 0;
      inbetweenChartAndYAxisPadding = 0;
      chartContentPaddingBottomOrg = (args.chartType !== 'scorecard' && args.chartType !== 'flat_table') ? 5 : 15;
    }

    let initialObj = {
      padding: 70,
      chartInnerHeadingSectionHeightWithMargin: args.chartSizeClass !== '' ? 0 : isInViewModeFitToWidth ? Math.round(30 * window.innerWidth / args.screen) : 30,
      chartHeadingSectionHeight: chartHeadingSectionHeight, //32+11+17+8; 24 header, 32 inner header
      chartWidgetBottomPadding: isInViewModeFitToWidth ? Math.round(chartContentPaddingBottomOrg * window.innerWidth / args.screen) : chartContentPaddingBottomOrg,
      chartTopPadding: 0,
      chartLeftPadding: chartLeftPadding,
      chartBottomPadding: chartBottomPadding,
      chartRightPadding: chartRightPadding,
      inbetweenChartAndXAxisPadding: inbetweenChartAndXAxisPadding,
      inbetweenChartAndYAxisPadding: inbetweenChartAndYAxisPadding,
      tickSliderPadding: 2,
      tickHoverBoxHeight: isInViewModeFitToWidth ? Math.round(14 * window.innerWidth / args.screen) : 14,
      xTickSliderTopPadding: isInViewModeFitToWidth ? Math.round(10 * window.innerWidth / args.screen) : 10,
      xTickSliderHeight: isInViewModeFitToWidth ? Math.round(25 * window.innerWidth / args.screen) : 25,
      tooltipHeight: isInViewModeFitToWidth ? Math.round(14 * window.innerWidth / args.screen) : 14,
      maxTooltipWidth: isInViewModeFitToWidth ? Math.round(160 * window.innerWidth / args.screen) : 160,
      defaultXAxisTicksCount: 4,
      defaultYAxisTicksCount: 4,
      showXAxisTicks: args.chartSizeClass === 'xs-grid-width' ? false : true,
      showYAxisTicks: args.chartSizeClass === 'xs-grid-width' ? false : true,
      showLegendCount: 0
    }
    return initialObj;
  }

  return false;
}


//get colors with domains mapping
// function getColorDomains(chartData, chartSegmentation) {
//   let color = d3.scaleOrdinal(chartColors);
//   let domain = [];

//   chartData.forEach(data => {
//     if (!domain.includes(data[chartSegmentation])) {
//       domain.push(data[chartSegmentation]);
//     }
//   })
//   color.domain(domain);
//   return color;
// }


/**************************
 * Common d3 functions
 */
function getSVGElement(eleObj, width, height) {
  return d3.select(eleObj).append("svg")
    .attr("width", width)
    .attr("height", height);
}
function getGroupElement(svg, yaxiskey) {
  return svg.append("g")
    .attr("class", yaxiskey + "-chart")
    .attr("class", "chart")
    .attr("transform", "translate(0, 0)");
}

//get calculated x axis tick values
function getXAxisTickValues(initialConfig, xDomains, data, args, chart_type = null) {
  let x_steps = args.xAxisTicksCount !== undefined ? args.xAxisTicksCount : initialConfig.defaultXAxisTicksCount;
  let xAxisTickValues = [];

  if (initialConfig.showXAxisTicks) {
    if (args.xaxiskey === 'date' || typeof xDomains[0] === 'string') {
      if (args.chartFormat.xaxis.tick !== '' && args.chartFormat.xaxis.tick > 0) {
        x_steps = Math.floor(xDomains.length / args.chartFormat.xaxis.tick) + 1;
      }
      //   console.log('x_steps', x_steps);
      xAxisTickValues = x_steps > 0 ? getStringTickValues(xDomains, 0, xDomains.length, x_steps) : [];

    } else if (typeof xDomains[0] !== 'string') {
      var xScaleLimits = (!args.isEmpty) ? getMinMaxRange(data, args.xaxiskey) : { lowerLimit: 0, upperLimit: 10 };

      if (typeof xDomains[0] === 'number' && chart_type === 'scatterplot') {
        if (args.chartFormat.xaxis.min !== '') { xScaleLimits['lowerLimit'] = args.chartFormat.xaxis.min; }
        if (args.chartFormat.xaxis.max !== '') { xScaleLimits['upperLimit'] = args.chartFormat.xaxis.max; }

        let hasCustomFormat = (args.chartFormat.xaxis.tick || args.chartFormat.xaxis.min || args.chartFormat.xaxis.max) ? true : false;
        let customTickInterval = hasCustomFormat ? args.chartFormat.yaxis.tick : null;
        if (args.chartFormat.xaxis.tick !== '' && args.chartFormat.xaxis.tick > 0) {
          x_steps = Math.floor(xScaleLimits['upperLimit'] / args.chartFormat.xaxis.tick) + 1;
        }
        xAxisTickValues = x_steps > 1 ? getTickValues(xScaleLimits['lowerLimit'], xScaleLimits['upperLimit'], x_steps, hasCustomFormat, customTickInterval) : [];

      } else {
        if (args.chartFormat.xaxis.tick !== '' && args.chartFormat.xaxis.tick > 0) {
          x_steps = Math.floor(xScaleLimits['upperLimit'] / args.chartFormat.xaxis.tick) + 1;
        }
        xAxisTickValues = getTickValues(xScaleLimits['lowerLimit'], xScaleLimits['upperLimit'], x_steps);
      }
    }
  }

  return xAxisTickValues;
}

//get default or segment mapped color 
function getColor(args) {
  let color = [];
  var parsedDateString = d3.timeFormat("%d %b %Y");
  if (args.chartType === 'pie' || args.chartType === 'donut' || args.chartType === 'spider') {
    if (args.chartFormat.color && args.chartFormat.color.palette) {
      color = d3.scaleOrdinal(ColorPalettes[args.chartFormat.color.palette]);
      let xaxis_keys = [];
      // if ((chartSegmentation !== 'all' && chartSegmentation !== '')) {
      xaxis_keys = [...new Set(args.data.map(item => {
        if (args.xaxiskey === 'date') {
          let key = new Date(item[args.xaxiskey]);
          return parsedDateString(key);
        } else {
          return item[args.xaxiskey];
        }
      }))];
      color.domain(xaxis_keys);
      // }
    }
  } else {
    let chartSegmentation = (args.chartSegmentation && args.chartSegmentation !== '' && args.chartSegmentation !== ' ') ? args.chartSegmentation : '';

    if (args.chartFormat.color && args.chartFormat.color.palette) {
      color = d3.scaleOrdinal(ColorPalettes[args.chartFormat.color.palette]);
      let segmented_keys = [];
      if ((chartSegmentation !== 'all' && chartSegmentation !== '')) {
        segmented_keys = [...new Set(args.data.map(item => item[chartSegmentation]))];
        color.domain(segmented_keys);
      }
    }
  }

  return color;
}


//show segment aggreagted details in table format
function showAggregatedSegmentsDetails (args, initialConfig, color) {
  var parsedDateString = d3.timeFormat("%d %b %Y");
  let chartSegmentation = (args.chartSegmentation && args.chartSegmentation !== '' && args.chartSegmentation !== ' ') ? args.chartSegmentation : '';
  let isSegmented = (chartSegmentation !== 'all' && chartSegmentation !== '' && chartSegmentation !== ' ');
  let isTableRequriedForNonSegmentedChart = args.chartType === 'pie' || args.chartType === 'donut';
  var col_widths = [100, 30];
  var col_header1;
  // let currentCanvasWidth = (window.innerWidth - 10);
  // let isFitToWidthMode = (args.screen && !args.isDashboardInEditMode && (args.viewModeType !== undefined && args.viewModeType.name === 'Fit to Width'));
  // let tblFontSize = isFitToWidthMode ? Math.round(10 * currentCanvasWidth / args.screen) : 10;
  // let tdHeight = isFitToWidthMode ? Math.round(19 * currentCanvasWidth / args.screen) : 19;
  // let colorBlockWidth = isFitToWidthMode ? Math.round(2 * currentCanvasWidth / args.screen) : 2;
  // let colorBlockHeight = isFitToWidthMode ? Math.round(8 * currentCanvasWidth / args.screen) : 8;
  // let colorBlockMarginRight = isFitToWidthMode ? Math.round(5 * currentCanvasWidth / args.screen) : 5;
  
  if (args.chartType === 'spider') {
    let yAxisKeys = args.yaxiskey.split(',')
    let chartNetDetails = args.data;
    col_header1 = args.xaxiskey;

    var table_details = '';
    yAxisKeys.forEach((key)=>{
      table_details += '<table class="tooltip-table">';
        table_details += '<thead>';
          table_details += '<tr>';
            table_details += '<th width="' + col_widths[0] + '%"><span class="th-inner-wrapper">' + col_header1 + '<span class="sepeartor"></span> Total</span><span class="bg"></span></th>';
            table_details += '<th width="' + col_widths[1] + '%">' + key + '<span class="bg"></span></th>';
          table_details += '</tr>';
        table_details += '</head>';

        table_details += '<tbody>';
        chartNetDetails.forEach((dn) => {
          const col_0_color = color(args.xaxiskey === 'date' ? parsedDateString(dn[args.xaxiskey]) : dn[args.xaxiskey]);
          const col_1_val = args.xaxiskey === 'date' ? parsedDateString(dn[args.xaxiskey]) : dn[args.xaxiskey];
          const col_2_val = args.chartCurrencySymbol + numberWithCommas(dn[key]) + args.chartPercentSymbol;
  
          //For Period Comparison Only
          table_details += '<tr>';
            table_details += '<td width="' + col_widths[0] + '%">';
              table_details += '<span class="td-inner-wrapper">';
                table_details += '<span class="color" style="background:'+col_0_color+'"></span>';
                table_details += '<span class="key">'+col_1_val+'</span>';
              table_details += '</span>';
            table_details += '</td>';
            table_details += '<td width="' + col_widths[1] + '%"><span class="val">'+col_2_val+'</span></td>';
          table_details += '</tr>';
        });
        table_details += '</tbody>';

      table_details += '</table>';
    });
    
    //Append content in tooltip
    // let tooltipWrapperObj = args.chartLegendWrapper.current //((chartSegmentation !== 'all' && chartSegmentation !== '' && chartSegmentation !== ' ') || isTableRequriedForNonSegmentedChart) ? args.chartLegendWrapper.current : args.chartTooltipWrapper.current;
    let tooltipWrapperObj = document.getElementById('widget-legend-details');
    d3.select(tooltipWrapperObj).style("border", "0px").html(table_details);

  } else {
    //Show information of segmentated chart lines
    //Draw multi-lines (isSegmented is being used to draw segmented like table to show hover values)
    if (isSegmented || args.isComparisonEnabled || isTableRequriedForNonSegmentedChart) {
      chartSegmentation = args.isComparisonEnabled ? 'id' : chartSegmentation; //for period comparison

      //Display Cross Hair Values
      col_header1 = args.isComparisonEnabled ? args.comparisonDataKey : (isTableRequriedForNonSegmentedChart ? args.xaxiskey : chartSegmentation.replace("_", " "));
      
      var chartNetDetails = "";
      if (args.isComparisonEnabled) {
        chartNetDetails = (args.chartsNetDetails) ? args.chartsNetDetails['net_detail'] : '';
      } else {
        chartNetDetails = (args.chartsNetDetails) ? args.chartsNetDetails['segmented_net_details'] : '';
      }

      if (isTableRequriedForNonSegmentedChart) {
        chartNetDetails = args.data;
      }

      // While showing segmented_net_details will be an array
      if (chartNetDetails && chartNetDetails.length > initialConfig.showLegendCount) {
        // sort the list alphabatically by segmentation key
        !isTableRequriedForNonSegmentedChart && chartNetDetails.sort((a, b) => a[chartSegmentation] < b[chartSegmentation] ? -1 : 1);

        //Display Cross Hair Values
        var segmented_details = '';
        segmented_details += '<thead>';
        segmented_details += '<tr>';
        segmented_details += '<th width="' + col_widths[0] + '%"><span class="th-inner-wrapper">' + col_header1 + '<span class="sepeartor"></span> Total</span><span class="bg"></span></th>';
        segmented_details += '<th width="' + col_widths[1] + '%">' + args.yaxiskey + '<span class="bg"></span></th>';
        segmented_details += '</tr>';
        segmented_details += '</thead>';

        segmented_details += '<tbody>';
        chartNetDetails.forEach((dn, i) => {
          const col_0_color = (args.isComparisonEnabled) ? chartColors[i] : color(isTableRequriedForNonSegmentedChart ? (args.xaxiskey === 'date' ? parsedDateString(dn[args.xaxiskey]) : dn[args.xaxiskey]) : dn[args.chartSegmentation]);
          const col_1_val = isTableRequriedForNonSegmentedChart ? (args.xaxiskey === 'date' ? parsedDateString(dn[args.xaxiskey]) : dn[args.xaxiskey]) : dn[args.chartSegmentation];
          const col_2_val = args.chartCurrencySymbol + numberWithCommas(dn[args.yaxiskey]) + args.chartPercentSymbol;

          //For Period Comparison Only
          segmented_details += '<tr>';
          segmented_details += '<td width="' + col_widths[0] + '%">';
          segmented_details += '<span class="td-inner-wrapper">';
          segmented_details += '<span class="color" style="background: ' + col_0_color + '"></span>';
          segmented_details += '<span class="key">' + col_1_val + '</span>';
          segmented_details += '</span>';
          segmented_details += '</td>';
          segmented_details += '<td width="' + col_widths[1] + '%"><span class="val">' + col_2_val + '</span></td>';
          segmented_details += '</tr>';
        });
        segmented_details += '</tbody>';

        //Appened text into tooltip
        var tooltipContent = '<table class="tooltip-table">' + segmented_details + '</table>';

        //Append content in tooltip
        // let tooltipWrapperObj = ((chartSegmentation !== 'all' && chartSegmentation !== '' && chartSegmentation !== ' ') || isTableRequriedForNonSegmentedChart) ? args.chartLegendWrapper.current : args.chartTooltipWrapper.current;
        let tooltipWrapperObj = document.getElementById('widget-legend-details');
        d3.select(tooltipWrapperObj).html(tooltipContent);
      }
    }
  }
}

//show segment details in table format on mouse hover on chart
function showHoverSegmentDetails(args, initialConfig, data, d, xAxisVal, xValOnMouseMove, color, chart_type) {
  var parsedDateString = d3.timeFormat("%d %b %Y");
  var legendDetails = '';
  var col_widths = [100, 30];
  let chartSegmentation = (args.chartSegmentation && args.chartSegmentation !== '' && args.chartSegmentation !== ' ') ? args.chartSegmentation : '';

  // let currentCanvasWidth = (window.innerWidth - 10);
  // let isFitToWidthMode = (args.screen && !args.isDashboardInEditMode && (args.viewModeType !== undefined && args.viewModeType.name === 'Fit to Width'));
  // let tblFontSize = isFitToWidthMode ? Math.floor(10 * currentCanvasWidth / args.screen) : 10;
  // let tdHeight = isFitToWidthMode ? Math.floor(19 * currentCanvasWidth / args.screen) : 19;
  // let colorBlockWidth = isFitToWidthMode ? Math.floor(2 * currentCanvasWidth / args.screen) : 2;
  // let colorBlockHeight = isFitToWidthMode ? Math.floor(8 * currentCanvasWidth / args.screen) : 8;
  // let colorBlockMarginRight = isFitToWidthMode ? Math.floor(5 * currentCanvasWidth / args.screen) : 5;
  let isTableRequriedForNonSegmentedChart = args.chartType === 'pie' || args.chartType === 'donut' || args.chartType === 'spider';

  //Display Cross Hair Values
  var col_header1 = args.isComparisonEnabled ? args.comparisonDataKey : isTableRequriedForNonSegmentedChart ? args.xaxiskey.replace("_", " ") : chartSegmentation.replace("_", " ");

  if (data === undefined) return;
  if (data && data.length > initialConfig.showLegendCount) {
    if (args.chartType === 'spider') {
      let table_details = '<table class="tooltip-table">';
        let yAxisKeys = args.yaxiskey.split(',');
        yAxisKeys.forEach((key) => {
          table_details += '<thead>';
          table_details += '<tr>';
          table_details += '<th width="' + col_widths[0] + '%"><span class="th-inner-wrapper">' + col_header1 + ' <span class="sepeartor"></span>' + (args.xaxiskey === 'date' ? parsedDateString(xValOnMouseMove) : xValOnMouseMove) + ' </span><span class="bg"></span></th>';
          table_details += '<th width="' + col_widths[1] + '%">' + key + '<span class="bg"></span></th>';
          table_details += '</tr>';
          table_details += '</thead>';

          table_details += '<tbody>';
          data.forEach((dn) => {
            let col_color = args.xaxiskey === 'date' ? color(parsedDateString(dn[args.xaxiskey])) : color(dn[args.xaxiskey]);
            var col_key;
            var col_val;
            col_key = args.xaxiskey === 'date' ? parsedDateString(dn[args.xaxiskey]) : dn[args.xaxiskey];
            col_val = dn[key];

            // let row_span = dataNest.length;
            table_details += '<tr valign="top">';
            table_details += '<td width="' + col_widths[0] + '%">';
            table_details += '<span class="td-inner-wrapper">';
            table_details += '<span class="color" style="background: ' + col_color + ';"></span>';
            table_details += '<span class="key">' + col_key + '</span>';
            table_details += '</span>';
            table_details += '</td>';
            table_details += '<td width="' + col_widths[1] + '%"><span class="val">' + args.chartCurrencySymbol + numberWithCommas(col_val) + args.chartPercentSymbol + '</span></td>';
            table_details += '</tr>';
          });
          table_details += '</tbody>';
        });
      table_details += '</table>';

      let tooltipWrapperObj = document.getElementById('widget-legend-details');
      d3.select(tooltipWrapperObj).html(table_details);

    } else {

      var segmented_details = '';
      segmented_details += '<thead>';
      segmented_details += '<tr>';
      segmented_details += '<th width="' + col_widths[0] + '%"><span class="th-inner-wrapper">' + col_header1 + ' <span class="sepeartor"></span>' + (args.xaxiskey === 'date' ? parsedDateString(xValOnMouseMove) : xValOnMouseMove) + ' </span><span class="bg"></span></th>';
      segmented_details += '<th width="' + col_widths[1] + '%">' + args.yaxiskey + '<span class="bg"></span></th>';
      segmented_details += '</tr>';
      segmented_details += '</thead>';

      segmented_details += '<tbody>';
      data.forEach((dn) => {
        let col_color = isTableRequriedForNonSegmentedChart ? (args.xaxiskey === 'date' ? color(parsedDateString(dn[args.xaxiskey])) : color(dn[args.xaxiskey])) : color(dn[chartSegmentation]);
        var col_key;
        var col_val;

        if (chart_type === 'line') {
          var x1;
          if (dn.values.find(h => args.xaxiskey === 'date' ? parsedDateString(h[args.xaxiskey]) === xAxisVal : h[args.xaxiskey] === xAxisVal) !== undefined) {
            x1 = dn.values.find(h => args.xaxiskey === 'date' ? parsedDateString(h[args.xaxiskey]) === xAxisVal : h[args.xaxiskey] === xAxisVal)[args.yaxiskey];
          }
          col_color = color(dn.key);
          col_key = dn.key;
          col_val = (x1) ? x1 : 0;

        } else {
          col_color = isTableRequriedForNonSegmentedChart ? (args.xaxiskey === 'date' ? color(parsedDateString(dn[args.xaxiskey])) : color(dn[args.xaxiskey])) : color(dn[chartSegmentation]);
          col_key = isTableRequriedForNonSegmentedChart ? (args.xaxiskey === 'date' ? parsedDateString(dn[args.xaxiskey]) : dn[args.xaxiskey]) : dn[chartSegmentation];
          col_val = dn[args.yaxiskey];
        }


        // let row_span = dataNest.length;
        segmented_details += '<tr valign="top">';
        segmented_details += '<td width="' + col_widths[0] + '%">';
        segmented_details += '<span class="td-inner-wrapper">';
        segmented_details += '<span class="color" style="background: ' + col_color + ';"></span>';
        segmented_details += '<span class="key">' + col_key + '</span>';
        segmented_details += '</span>';
        segmented_details += '</td>';
        segmented_details += '<td width="' + col_widths[1] + '%"><span class="val">' + args.chartCurrencySymbol + numberWithCommas(col_val) + args.chartPercentSymbol + '</span></td>';
        segmented_details += '</tr>';
      });
      segmented_details += '<tbody>';
      legendDetails += segmented_details;

      //Append content in tooltip
      let tooltipWrapperObj = document.getElementById('widget-legend-details');
      d3.select(tooltipWrapperObj).html('<table class="tooltip-table">' + legendDetails + '</table>');
    }
  }
}

//sort the segmented data
function sortSegmentedData(args, data, xAxisVal) {
  var parsedDateString = d3.timeFormat("%d %b %Y");
  return data.sort((a, b) => {
    var x1 = 0; var x2 = 0;
    if (b.values.find(h => args.xaxiskey === 'date' ? parsedDateString(h[args.xaxiskey]) === xAxisVal : h[args.xaxiskey] === xAxisVal) !== undefined) {
      x1 = b.values.find(h => args.xaxiskey === 'date' ? parsedDateString(h[args.xaxiskey]) === xAxisVal : h[args.xaxiskey] === xAxisVal)[args.yaxiskey];
    }
    if (a.values.find(h => args.xaxiskey === 'date' ? parsedDateString(h[args.xaxiskey]) === xAxisVal : h[args.xaxiskey] === xAxisVal) !== undefined) {
      x2 = a.values.find(h => args.xaxiskey === 'date' ? parsedDateString(h[args.xaxiskey]) === xAxisVal : h[args.xaxiskey] === xAxisVal)[args.yaxiskey];
    }
    var val = x1 - x2;
    return (val) ? val : 0;
  });
}

//align x axis ticks - first and last using the dom
function alignXAxisTicks(width, unique_key, initialConfig, xAxisTickValues, xDomains, parseDate, tickFontSize, xAxisTickStartPos) {
  if (initialConfig.showXAxisTicks && xAxisTickValues.length > 1) {
    var xTicksGroup = document.querySelector('#chart-' + unique_key + ' .x-axis');
    var xTicksGNodes = xTicksGroup.getElementsByTagName('g');
    var xTicksGNodesLen = xTicksGNodes.length - 1;
    var xTickLastEleWidth = calculateTextWidth(parseDate(xAxisTickValues[xTicksGNodesLen]), tickFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica');

    d3.select(xTicksGNodes[0]).attr("transform", "translate(" + xAxisTickStartPos + ",0)"); //first element changed after getting the width of tick
    if (xAxisTickValues[xTicksGNodesLen] === xDomains[xDomains.length - 1]) {
      // console.log(unique_key)
      d3.select(xTicksGNodes[xTicksGNodesLen]).attr("transform", "translate(" + (width - xTickLastEleWidth / 2 - initialConfig.chartRightPadding + initialConfig.inbetweenChartAndYAxisPadding - 7) + ",0)");
    }
  }
}

//align y axis ticks - first and last using the dom
function alignYAxisTicks(height, unique_key, initialConfig, yAxisTickTopPos) {
  if (initialConfig.showYAxisTicks) {
    let yTicksGroup = document.querySelector('#chart-' + unique_key + ' .y-axis');
    let yTicksGNodes = yTicksGroup.getElementsByTagName('g');
    let yTicksGNodesLen = yTicksGNodes.length - 1;
    d3.select(yTicksGNodes[0]).attr("transform", "translate(0," + (height - 1) + ")"); //first element changed after getting the width of tick
    d3.select(yTicksGNodes[yTicksGNodesLen]).attr("transform", "translate(0, " + yAxisTickTopPos + ")");
  }
}

//get bar width 
function getBarWidth(innerWidth, data) {
  let multiplyBarWidth = .8;
  // let maxBarWidth = 120;
  let barOrgWidth = Math.round(parseFloat(innerWidth / (data.length + 1)).toFixed(2));
  // barOrgWidth = barOrgWidth > maxBarWidth ? maxBarWidth : barOrgWidth;
  let barWidthAfterPadding = parseFloat(barOrgWidth * multiplyBarWidth).toFixed(2);
  let barWidth = Math.round(barWidthAfterPadding);
  barWidth = (barWidth > 0 ? barWidth : 2);
  let barPadding = barOrgWidth - barWidth;
  return { width: barWidth, padding: barPadding };
}

//get box height
function getBoxHeight(innerHeight, data) {
  let multiplyBoxHeight = .8;
  let boxOrgHeight = Math.round(parseFloat(innerHeight / (data.length + 1)).toFixed(2));
  let boxHeightAfterPadding = parseFloat(boxOrgHeight * multiplyBoxHeight).toFixed(2);
  let boxHeight = Math.round(boxHeightAfterPadding);
  boxHeight = (boxHeight > 0 ? boxHeight : 2);
  let boxPadding = boxOrgHeight - boxHeight;
  return { height: boxHeight, padding: boxPadding };
}

/*************************
     * Draw TreeMap Chart
    - padding: padding,
    - width: width
    - height: height
    - indivisualChartHeight: indivisualChartHeight,
    - yaxiskey: chart_ykey,
    - xaxiskey: item.x_axis.id,
    - data: chartsData[chart_ykey],
    - chartSegmentation: chartsSegmentation[chart_ykey]
    */
const drawTreeMapChart = (args) => {
  // chart initial settings variables
  const initialConfig = getInitialChartConfig(args)
  if (!initialConfig) return

  //basic configurations
  let width = args.chartWrapper.current.offsetWidth;
  let innerWidth = width - (initialConfig.chartLeftPadding + initialConfig.chartRightPadding + initialConfig.inbetweenChartAndYAxisPadding);
  let chartWrapperHeight = d3.select('#chart-' + args.unique_key).node().getBoundingClientRect().height;
  let height = chartWrapperHeight - initialConfig.chartWidgetBottomPadding - initialConfig.chartHeadingSectionHeight;
  if (args.excludeChartHeader !== undefined) { // if chart width is less than default add removed chart header+margin heightto chart height
    height = height + initialConfig.chartInnerHeadingSectionHeightWithMargin + (initialConfig.chartWidgetBottomPadding - 5);
  }
  let innerHeight = (height - initialConfig.chartBottomPadding - initialConfig.chartTopPadding);
  // let xAxisBottomPos = (height - initialConfig.chartBottomPadding + initialConfig.inbetweenChartAndXAxisPadding);

  d3.select(args.chartWrapper.current).style("height", height + 'px'); //set chart height

  //Chart icons
  // let iconLock = '<g class="nc-icon-wrapper" fill="#ff0000" transform="translate(0, 0)"><path d="M21,10H18V6.01A5.96,5.96,0,0,0,12.1,0h-.09A5.94,5.94,0,0,0,6,5.9V10H3a1,1,0,0,0-1,1V23a1,1,0,0,0,1,1H21a1,1,0,0,0,1-1V11A1,1,0,0,0,21,10Zm-9,9a2,2,0,1,1,2-2A2,2,0,0,1,12,19Zm4-9H8V5.91A3.957,3.957,0,0,1,11.959,2h.131A3.957,3.957,0,0,1,16,6Z" fill="#ff0000"></path></g>';
  // let iconUnlock = '<g class="nc-icon-wrapper" fill="#00ff7f" transform="translate(0, 0)"><path d="M21,10H8V5.91A3.957,3.957,0,0,1,11.959,2h.131A3.955,3.955,0,0,1,16,5.99l2,.02A5.96,5.96,0,0,0,12.1,0h-.09A5.94,5.94,0,0,0,6,5.9V10H3a1,1,0,0,0-1,1V23a1,1,0,0,0,1,1H21a1,1,0,0,0,1-1V11A1,1,0,0,0,21,10Zm-9,9a2,2,0,1,1,2-2A2,2,0,0,1,12,19Z" fill="#00ff7f"></path></g>';
  // let currentCanvasWidth = (window.innerWidth - 10);
  // let isFitToWidthMode = (args.screen && !args.isDashboardInEditMode && (args.viewModeType !== undefined && args.viewModeType.name === 'Fit to Width'));
  
  //Define charts configs
  let isSegmented = (args.chartSegmentation && args.chartSegmentation !== '' && args.chartSegmentation !== 'all' && args.chartSegmentation !== ' ');
  // let chartSegmentation = isSegmented ? args.chartSegmentation : '';
  // let chartHoverLocked = false;
  let defaultColor = (args.chartFormat.color && args.chartFormat.color.single_color !== '') ? args.chartFormat.color.single_color : chartColors[0]; //pick selected color
  // let color = getColor(args);

  // let parseDate = d3.timeFormat("%m.%d.%Y"),
  //   parsedDateString = d3.timeFormat("%d %b %Y"),
  //   formatYNumber = d3.format("");

  // Data variable
  let chartMainData = [...args.data];

  //Define SVG and group element
  let svg = getSVGElement(args.chartWrapper.current, width, height);
  let chart = getGroupElement(svg, args.yaxiskey);

  
  // let xDomains;

  //return from here if data is not available
  if (!args.data || args.data.length === 0) return;
  // xDomains = args.data.map((d) => d[args.xaxiskey]);
  let bgBottomPadding = 2;
  chart.append('rect')
    .attr('width', innerWidth)
    .attr('height', innerHeight + bgBottomPadding)
    .attr('x', initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndYAxisPadding)
    .attr('y', initialConfig.chartTopPadding)
    .attr('class', 'chart-bg')

  // Hide the path(line) of x-axis so that only dummy x-axis line is visible
  chart.select('.x-axis').select('path').style('stroke-opacity', 0);

  // Hide the path(line) of y-axis so that only dummy x-axis line is visible
  chart.select('.y-axis').select('path').style('stroke-opacity', 0);

  chart.append('rect')
    .attr('width', innerWidth)
    .attr('height', innerHeight + 1)
    .attr('x', initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndYAxisPadding)
    .attr('y', initialConfig.chartTopPadding)
    .attr('opacity', 0)
    .attr('fill', 'red');

  var dataNest = []
  if (isSegmented) { return false }
  else {
    let scale = 10
    // base group parent
    dataNest.push({
      'name': args.xaxiskey,
      'value': '',
      'parent': ''
    })

    // make dataset array 
    chartMainData.forEach(item => {
      let obj = {};
      obj['name'] = typeof item[args.xaxiskey] == 'string' ? item[args.xaxiskey].substring(0, 10) : item[args.xaxiskey];
      obj['value'] = item[args.yaxiskey];
      obj['parent'] = args.xaxiskey;
      dataNest.push(obj);
    })

    // generate root dataset for tree
    let root = d3.stratify()
      .id((d) => { return d.name; })
      .parentId((d) => { return d.parent; })(dataNest);
    root.sum((d) => { return +d.value })

    d3.treemap()
      .size([innerWidth, innerHeight])
      .padding(2)(root)

    // console.log(root.leaves())  
    // draw treemap  
    chart
      .selectAll("rect")
      .data(root.leaves())
      .enter()
      .append("rect")
      .attr('x', (d) => { return d.x0; })
      .attr('y', (d) => { return d.y0; })
      .attr('width', (d) => {
        if (d.x1 - d.x0 > scale) return d.x1 - d.x0;
        else return 0
      })
      .attr('height', (d) => {
        if (d.y1 - d.y0 > scale) return d.y1 - d.y0
        else return 0

      })
      .style("stroke", "black")
      .style("fill", defaultColor);

    // and to add the text labels
    chart
      .selectAll("text")
      .data(root.leaves())
      .enter()
      .append("text")
      .attr("x", (d) => { return d.x0 + 10 })
      .attr("y", (d) => { return d.y0 + 20 })
      .text((d) => {
        if (d.x1 - d.x0 > 10 && d.y1 - d.y0 > 10)
          return d.data.name
      })
      .attr("font-size", "12px")
      .attr("fill", "#fff")
  }
}
/*************************
     * Draw 2D Density Chart
    - padding: padding,
    - width: width
    - height: height
    - indivisualChartHeight: indivisualChartHeight,
    - yaxiskey: chart_ykey,
    - xaxiskey: item.x_axis.id,
    - data: chartsData[chart_ykey],
    - chartSegmentation: chartsSegmentation[chart_ykey]
    */

const draw2DDensityChart = (args) => {
  // chart initial settings variables
  const initialConfig = getInitialChartConfig(args)
  if (!initialConfig) return

  //basic configurations
  let width = args.chartWrapper.current.offsetWidth;
  let innerWidth = width - (initialConfig.chartLeftPadding + initialConfig.chartRightPadding + initialConfig.inbetweenChartAndYAxisPadding);
  let chartWrapperHeight = d3.select('#chart-' + args.unique_key).node().getBoundingClientRect().height;
  let height = chartWrapperHeight - initialConfig.chartWidgetBottomPadding - initialConfig.chartHeadingSectionHeight;
  if (args.excludeChartHeader !== undefined) { // if chart width is less than default add removed chart header+margin heightto chart height
    height = height + initialConfig.chartInnerHeadingSectionHeightWithMargin + (initialConfig.chartWidgetBottomPadding - 5);
  }
  let innerHeight = (height - initialConfig.chartBottomPadding - initialConfig.chartTopPadding);
  let xAxisBottomPos = (height - initialConfig.chartBottomPadding + initialConfig.inbetweenChartAndXAxisPadding);

  d3.select(args.chartWrapper.current).style("height", height + 'px'); //set chart height

  //Chart icons
  let iconLock = '<g class="nc-icon-wrapper" fill="#ff0000" transform="translate(0, 0)"><path d="M21,10H18V6.01A5.96,5.96,0,0,0,12.1,0h-.09A5.94,5.94,0,0,0,6,5.9V10H3a1,1,0,0,0-1,1V23a1,1,0,0,0,1,1H21a1,1,0,0,0,1-1V11A1,1,0,0,0,21,10Zm-9,9a2,2,0,1,1,2-2A2,2,0,0,1,12,19Zm4-9H8V5.91A3.957,3.957,0,0,1,11.959,2h.131A3.957,3.957,0,0,1,16,6Z" fill="#ff0000"></path></g>';
  let iconUnlock = '<g class="nc-icon-wrapper" fill="#00ff7f" transform="translate(0, 0)"><path d="M21,10H8V5.91A3.957,3.957,0,0,1,11.959,2h.131A3.955,3.955,0,0,1,16,5.99l2,.02A5.96,5.96,0,0,0,12.1,0h-.09A5.94,5.94,0,0,0,6,5.9V10H3a1,1,0,0,0-1,1V23a1,1,0,0,0,1,1H21a1,1,0,0,0,1-1V11A1,1,0,0,0,21,10Zm-9,9a2,2,0,1,1,2-2A2,2,0,0,1,12,19Z" fill="#00ff7f"></path></g>';

  let currentCanvasWidth = (window.innerWidth - 10);
  let isFitToWidthMode = (args.screen && !args.isDashboardInEditMode && (args.viewModeType !== undefined && args.viewModeType.name === 'Fit to Width'));
  let tickFontSize = isFitToWidthMode ? Math.round(10 * currentCanvasWidth / args.screen) : 10;
  let xAxisTickStartPos = isFitToWidthMode ? Math.round(75 * currentCanvasWidth / args.screen) : 75;
  let yAxisTickTopPos = isFitToWidthMode ? Math.round(5 * currentCanvasWidth / args.screen) : 5;
  let tickSliderFontSize = isFitToWidthMode ? Math.round(11 * currentCanvasWidth / args.screen) : 11;
  let toolTipFontSize = isFitToWidthMode ? Math.round(11 * currentCanvasWidth / args.screen) : 11;
  // let circleSize = isFitToWidthMode ? Math.round(1.5 * currentCanvasWidth / args.screen) : 1.5;
  let highlighterCircleSize = isFitToWidthMode ? Math.round(4 * currentCanvasWidth / args.screen) : 4;
  // let noteCircleSize = isFitToWidthMode ? Math.round(5 * currentCanvasWidth / args.screen) : 5;

  //Define charts configs
  // let isSegmented = (args.chartSegmentation && args.chartSegmentation !== '' && args.chartSegmentation !== 'all' && args.chartSegmentation !== ' ');
  // let chartSegmentation = isSegmented ? args.chartSegmentation : '';
  let chartHoverLocked = false;
  let defaultColor = (args.chartFormat.color && args.chartFormat.color.single_color !== '') ? args.chartFormat.color.single_color : chartColors[0]; //pick selected color
  // let color = getColor(args);
  let parseDate = d3.timeFormat("%m.%d.%Y"),
    parsedDateString = d3.timeFormat("%d %b %Y"),
    formatYNumber = d3.format("");

  // Data variable
  let chartMainData = [...args.data];

  //Define SVG and group element
  let svg = getSVGElement(args.chartWrapper.current, width, height);
  let chart = getGroupElement(svg, args.yaxiskey);

  // Scaling Points - start and end
  let xStartPoint = initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndYAxisPadding;
  let xEndPoint = (width - initialConfig.chartRightPadding);
  let yStartPoint = xAxisBottomPos - initialConfig.inbetweenChartAndXAxisPadding - 1;
  let yEndPoint = initialConfig.chartTopPadding;
  let yScaleLimits;
  // let series;
  let xDomains

  //return from here if data is not available
  if (!args.data || args.data.length === 0) return;
  xDomains = args.data.map((d) => d[args.xaxiskey]);

  // var xAxisTickValues = getXAxisTickValues(initialConfig, args.data.map((d) => d[args.xaxiskey]), chartMainData, args); // get x axis calculated tick values

  //Define X-Axis for each chart - date/string
  let xScaleType = typeof xDomains[0] === 'number' ? 'linear' : 'point';

  let bgBottomPadding = 2;
  chart.append('rect')
    .attr('width', innerWidth)
    .attr('height', innerHeight + bgBottomPadding)
    .attr('x', initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndYAxisPadding)
    .attr('y', initialConfig.chartTopPadding)
    .attr('class', 'chart-bg')


  let densityWrap = chart.append('g').attr("clip-path", `url(#clip-${args.unique_key})`);
  densityWrap.attr('width', innerWidth)
    .attr('height', innerHeight)
    .attr('x', initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndYAxisPadding)
    .attr('y', initialConfig.chartTopPadding)
    .attr('class', 'chart-main')


  yScaleLimits = (args.isEmpty === undefined && args.data.length > 0) ? getMinMaxRange(chartMainData, args.yaxiskey, 'bar') : { lowerLimit: 0, upperLimit: 10 };
  if (args.chartFormat.yaxis.min !== '' && args.chartFormat.yaxis.min !== 0) { yScaleLimits['lowerLimit'] = args.chartFormat.yaxis.min; }
  if (args.chartFormat.yaxis.max !== '' && args.chartFormat.yaxis.max !== 0) { yScaleLimits['upperLimit'] = args.chartFormat.yaxis.max; }

  /* Define and create yScale, yAxis, ticks */
  let y_steps = args.yAxisTicksCount !== undefined ? args.yAxisTicksCount : initialConfig.defaultYAxisTicksCount;
  if (args.chartFormat.yaxis.tick !== '' && args.chartFormat.yaxis.tick > 0) {
    y_steps = Math.floor(yScaleLimits['upperLimit'] / args.chartFormat.yaxis.tick) + 1;
  }
  let xScaleLimits;
  let xScale;
  let xAxis;
  let xTickValuesDisplay = getXAxisTickValues(initialConfig, xDomains, chartMainData, args, 'scatterplot'); // get x axis calculated tick values
  const defineXScale = async () => {
    //Set the scales  
    if (xScaleType === 'linear') {
      xScaleLimits = (!args.isEmpty) ? getMinMaxRange(args.data, args.xaxiskey) : { lowerLimit: 0, upperLimit: 10 };
      xScale = d3.scaleLinear()
        .domain([xScaleLimits['lowerLimit'], xScaleLimits['upperLimit']])
        .range([xStartPoint, xEndPoint]);

    } else {
      xScale = d3.scalePoint()
        .domain(xDomains)
        .range([xStartPoint + initialConfig.chartLeftPadding, xEndPoint])
        .padding(.25);
    }
    //Define the ticks
    xAxis = d3.axisBottom(xScale)
      .tickValues(xTickValuesDisplay)
      .tickSize(0)
      .tickPadding(5)
      .tickFormat((args.xaxiskey === 'date' ? d3.timeFormat("%m.%d.%Y") : (d) => (typeof d === 'string') ? d.substring(0, 10) : d));

    //Draw x-axis
    chart.append("g")
      .attr("class", "axis x-axis")
      .attr("transform", "translate(0," + (xAxisBottomPos) + ")") //start with 10px instead of 0
      .call(xAxis)
      .attr('font-size', tickFontSize + 'px');
  }
  defineXScale().then(() => {
    //Change x axis first and last tick position
    alignXAxisTicks(width, args.unique_key, initialConfig, xTickValuesDisplay, xDomains, parseDate, tickFontSize, xAxisTickStartPos);
  })
  //Compute Y-axis tick values
  y_steps = args.yAxisTicksCount !== undefined ? args.yAxisTicksCount : initialConfig.defaultYAxisTicksCount;
  yScaleLimits = (args.isEmpty === undefined && args.data.length > 0) ? getMinMaxRange(args.data, args.yaxiskey) : { lowerLimit: 0, upperLimit: 10 };
  if (args.chartFormat.yaxis.min !== '') { yScaleLimits['lowerLimit'] = args.chartFormat.yaxis.min; }
  if (args.chartFormat.yaxis.max !== '') { yScaleLimits['upperLimit'] = args.chartFormat.yaxis.max; }

  if (args.chartFormat.yaxis.tick !== '' && args.chartFormat.yaxis.tick > 0) {
    y_steps = Math.floor(yScaleLimits['upperLimit'] / args.chartFormat.yaxis.tick) + 1;
  }

  let hasCustomFormat = (args.chartFormat.yaxis.tick || args.chartFormat.yaxis.min || args.chartFormat.yaxis.max) ? true : false;
  let customTickInterval = hasCustomFormat ? args.chartFormat.yaxis.tick : null;
  let yDomains = [];
  let yTickValues = [];
  if (y_steps > 1) {
    yDomains = getTickValues(yScaleLimits['lowerLimit'], yScaleLimits['upperLimit'], y_steps, hasCustomFormat, customTickInterval);
  }

  if (initialConfig.showYAxisTicks) {
    yTickValues = [...yDomains];
  }
  let yScale;
  let yAxis;


  async function defineYScale() {
    //Define y scale
    //console.log(yScaleLimits , yStartPoint , yEndPoint )
    let upperYLimit = args.chartSizeClass === "xs-grid-width" ? yScaleLimits['upperLimit'] : yDomains[yDomains.length - 1];
    yScale = d3.scaleLinear()
      .domain([yDomains[0], upperYLimit])
      .range([yStartPoint, yEndPoint]);

    //Define y axis ticks
    yAxis = d3.axisLeft(yScale)
      .tickValues(yTickValues)
      .tickSize(0)
      .tickFormat((d) => formatNumber(formatYNumber(d)))
      .tickPadding(3);

    //Draw y axis
    chart.append("g")
      .attr("class", "axis y-axis")
      .attr("transform", "translate(" + initialConfig.chartLeftPadding + ",0)")
      .call(yAxis)
      .attr('font-size', tickFontSize + 'px');
  }
  defineYScale().then(() => {
    alignYAxisTicks(innerHeight, args.unique_key, initialConfig, yAxisTickTopPos);
  });

  // Hide the path(line) of x-axis so that only dummy x-axis line is visible
  chart.select('.x-axis').select('path').style('stroke-opacity', 0);

  // Hide the path(line) of y-axis so that only dummy x-axis line is visible
  chart.select('.y-axis').select('path').style('stroke-opacity', 0);


  //x-axis tick slider elements
  let xAxisSliderGroup;
  let xHoverRect;
  let xHoverRectText;
  let xTickSliderWidth = isFitToWidthMode ? Math.round(60 * currentCanvasWidth / args.screen) : 60;
  let xTickSliderHeight = initialConfig.xTickSliderHeight;
  let xTickSliderTextPosLeft = isFitToWidthMode ? Math.round(3 * currentCanvasWidth / args.screen) : 3;
  let xTickSliderTextPosTop = isFitToWidthMode ? Math.round(4 * currentCanvasWidth / args.screen) : 4;
  let xAxisSliderRectWidthPadding = isFitToWidthMode ? Math.round(8 * currentCanvasWidth / args.screen) : 8;


  if (initialConfig.showXAxisTicks) {
    xAxisSliderGroup = chart.append("g").attr("class", "xaxis-slider-group").style("display", "none");
    xHoverRect = xAxisSliderGroup.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", xTickSliderWidth)
      .attr("height", xTickSliderHeight)
      .attr("rx", 1)
      .attr("class", 'hover-xaxis-bg')
      .style("display", "none");
    xHoverRectText = xAxisSliderGroup.append("text")
      .attr('font-size', tickSliderFontSize + 'px')
      .text('')
      .attr('x', xTickSliderTextPosLeft)
      .attr('y', xTickSliderTextPosTop)
      .attr("fill", "#fff")
      .attr("class", "hover-xaxis-tick-val")
      .style("display", "none");
  }

  //y-axis hover elements
  let yAxisSliderGroup;
  let yHoverRect;
  let yHoverRectText;
  let yTickSliderHeight = initialConfig.tickHoverBoxHeight + 3;
  let yTickSliderWidth = isFitToWidthMode ? Math.round(30 * currentCanvasWidth / args.screen) : 30;
  let yTickSliderRectPosLeft = isFitToWidthMode ? Math.round(5 * currentCanvasWidth / args.screen) : 5;
  let yTickSliderTextPosTop = isFitToWidthMode ? Math.round(5 * currentCanvasWidth / args.screen) : 5;

  if (initialConfig.showYAxisTicks) {
    yAxisSliderGroup = chart.append("g").attr("class", "yaxis-slider-group").style("display", "none");
    yHoverRect = yAxisSliderGroup.append("rect")
      .attr("x", yTickSliderRectPosLeft)
      .attr("y", 0)
      .attr("width", yTickSliderWidth)
      .attr("height", yTickSliderHeight)
      .attr("rx", 1)
      .attr("class", 'hover-yaxis-bg')
      .style("display", "none");
    yHoverRectText = yAxisSliderGroup.append("text")
      .attr('font-size', tickSliderFontSize + 'px')
      .text('')
      .attr('x', 0)
      .attr('y', 0)
      .attr("fill", "#fff")
      .attr("class", "hover-yaxis-tick-val")
      .style("display", "none");
  }

  //tooltip 
  let focus = chart.append("g").attr("class", "focus").style("display", "none");
  focus.append("circle")
    .attr("r", highlighterCircleSize)
    .attr('stroke', lineColor)
    .attr('fill', 'none')
    .attr('stroke-width', '1px');

  //hoverYAxisLine
  var hoverYGridLine = chart.append("g").attr("class", "hover-grid-y-line").style("display", "none");
  hoverYGridLine.append("line")
    .attr("class", "y-hover-line hover-line")
    .attr("x1", xStartPoint)
    .attr("x2", xEndPoint);
  var hoverXGridLine = chart.append("g").attr("class", "hover-grid-x-line").style("display", "none");
  hoverXGridLine.append("line")
    .attr("class", "x-hover-line hover-line")
    .attr("y1", 0)
    .attr("y2", innerHeight);

  //hoverXAxisLine
  let tooltip_text = '';
  let tooltip_text_width = 0;
  let tooltip_width = 0;
  let tooltip_top = 0;
  let tooltip_pos_adjustment = 0;

  let tooltip = chart.append("g")
    .attr("class", "tooltip1")
    .attr("transform", "translate(0, 0)");
  let tooltipRect = tooltip.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 0)
    .attr("height", (toolTipFontSize + 2))
    .attr('fill', '#dedede')
    .attr("rx", 2)
    .attr("class", 'tooltip-rect');
  let tooltipRectText = tooltip.append("text")
    .attr('font-size', toolTipFontSize + 'px')
    .text('')
    .attr('x', 0)
    .attr('y', 0)
    .attr("fill", "#000")
    .attr("class", "tooltip-text");

  var chartHoverTrackPad = chart.append('rect')
    .attr('width', innerWidth)
    .attr('height', innerHeight + 1)
    .attr('x', initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndYAxisPadding)
    .attr('y', initialConfig.chartTopPadding)
    .attr('opacity', 0)
    .attr('fill', 'red')
    .on("mouseout", handleChartMouseOut)
    .on("mousemove", handleChartMouseMove)
    .on("click", handleChartLock);


  function handleChartLock() {
    if (chartHoverLocked) {
      chartHoverLocked = false;
      if (xAxisSliderGroup) xAxisSliderGroup.select('.hover-line-status').html(iconUnlock);
      tooltip.style("display", null);
    } else {
      chartHoverLocked = true;
      if (xAxisSliderGroup) xAxisSliderGroup.select('.hover-line-status').html(iconLock);
    }
    if (args.pointSelectionModeOn && xValOnMouseMove !== null && xValOnMouseMove !== undefined) {
      const chartClickInfo = {
        id: args.unique_key,
        xPoint: args.xaxiskey === 'date' ? d3.timeFormat('%Y-%m-%d')(xValOnMouseMove) : xValOnMouseMove
      };
      args.pointSelectionClbk(chartClickInfo);
    }
  }
  //show on initial load - to show segmentation aggregated details
  handleChartMouseOut();

  //Remove tooltip on mouse out
  function handleChartMouseOut() {
    if (chartHoverLocked) return false; //if locked no hover allowed
    if (focus) focus.style("display", "none");
    if (hoverYGridLine) hoverYGridLine.style("display", "none");
    if (hoverXGridLine) hoverXGridLine.style("display", "none");
    if (xAxisSliderGroup) xAxisSliderGroup.style('display', 'none');
    if (yAxisSliderGroup) yAxisSliderGroup.style("display", 'none');
    if (tooltip) tooltip.style('display', 'none');

    // show aggregated table when not hovering the chart
    // showAggregatedSegmentsDetails(args, initialConfig, color);
  }
  // var pointToFocusOnMouseMove = null;
  var xValOnMouseMove = null;
  var maxTooltipWidth = args.screen ? Math.round((initialConfig.maxTooltipWidth * window.innerWidth) / args.screen) : initialConfig.maxTooltipWidth;
  let tooltipTextXPos = isFitToWidthMode ? Math.round(2 * currentCanvasWidth / args.screen) : 2;
  let tooltipTextYPos = isFitToWidthMode ? Math.floor(.2 * currentCanvasWidth / args.screen) : .2;
  let tooltipRectPadding = isFitToWidthMode ? Math.round(3 * currentCanvasWidth / args.screen) : 3;

  // const xHoveLineY2 = (height-(padding/2)+5); // used under draw Lines
  xScale.invert = function (x) {
    return d3.scaleQuantize().domain(this.range()).range(this.domain())(x);
  };
  yScale.invert = function (y) {
    return d3.scaleLinear().domain(this.range()).range(this.domain())(y);
  };

  //Show tooltip on mouse move
  function handleChartMouseMove() {
    if (chartHoverLocked) return false; //if locked no hover allowed
    var x0, y0, i, d1;
    var mouseX = d3.mouse(this)[0];
    var mouseY = d3.mouse(this)[1];

    //x0 - val, i= index, d0 - prev data obj, d1 - current data obj
    x0 = xScale.invert(mouseX);
    y0 = yScale.invert(mouseY);
    i = args.data.findIndex((e) => e[args.xaxiskey].toString() === x0.toString());
    d1 = args.data[i];

    try {
      var d = d1;
    } catch (e) { return; }

    var mouse = d3.mouse(chartHoverTrackPad.node());
    xValOnMouseMove = xScale.invert(mouse[0]);

    // var xAxisVal;
    // if (args.xaxiskey === 'date') {
    //   var date = new Date(d[args.xaxiskey]);
    //   xAxisVal = parsedDateString(date);
    // } else {
    //   xAxisVal = d[args.xaxiskey];
    // }

    //Generate tooltip details
    // var chartWidth = width - 80;
    // var chartXPos = 0;

    //show horizontal line on mouse hover on chart
    hoverYGridLine.style('display', 'block')
      .attr("transform", "translate(" + parseInt(initialConfig.chartLeftPadding) + "," + parseInt(mouseY) + ")");
    hoverYGridLine.select('.y-hover-line')
      .attr('x1', parseInt(-initialConfig.chartLeftPadding + xStartPoint))
      .attr('x2', parseInt(xEndPoint - initialConfig.chartLeftPadding));

    //show vertical line on mouse hover on chart
    hoverXGridLine.style('display', 'block')
      .attr("transform", "translate(" + parseInt(mouseX) + "," + parseInt(initialConfig.chartTopPadding) + ")");
    hoverXGridLine.select('.x-hover-line')
      .attr('y1', 0)
      .attr('y2', parseInt(innerHeight + 4));

    //x-axis - slider elements
    if (xAxisSliderGroup) {
      let max_xslider_width = innerWidth; //innerWidth
      let xaxis_text = args.xaxiskey === 'date' ? parsedDateString(d[args.xaxiskey]) : d[args.xaxiskey];
      let xaxis_box_width = calculateTextWidth(xaxis_text, tickSliderFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica') + xAxisSliderRectWidthPadding;
      xaxis_box_width = xaxis_box_width <= max_xslider_width ? xaxis_box_width : max_xslider_width;

      // let xAxisLeftPadding = (icon_width + 2);
      let xAxisLeftPadding = 0;
      let xTickValPosOrg = xScale(d[args.xaxiskey]);
      let xTickValPos = xTickValPosOrg;
      let xTickValAvailableWidth = (width - initialConfig.chartRightPadding - xTickValPosOrg);

      // adjust starting bars x slider left position
      let lockIconXPos = 0;
      let leftMouseXScrollPos = (mouseX - initialConfig.chartLeftPadding - (initialConfig.inbetweenChartAndYAxisPadding + 1));
      xTickValPos = xTickValPosOrg - xaxis_box_width / 2 - xAxisLeftPadding / 2; //default

      if (leftMouseXScrollPos <= xaxis_box_width / 2) { // left position
        let leftAvailableWidth = xTickValPosOrg - initialConfig.chartLeftPadding - initialConfig.inbetweenChartAndYAxisPadding;
        xTickValPos = xTickValPosOrg - leftAvailableWidth;
        xAxisLeftPadding = 0;
        lockIconXPos = xaxis_box_width + 2;
      }
      // adjust end bars x slider right position
      if (xTickValAvailableWidth <= xaxis_box_width / 2) { // adjust end bars x slider right position
        xTickValPos = (width - initialConfig.chartRightPadding - xaxis_box_width);
      }

      //x-axis slider tick elements
      if (xTickValPos > (innerWidth - xaxis_box_width / 2 + 5)) {
        xTickValPos = (innerWidth - xaxis_box_width / 2 + 5);
      } else if (xTickValPos < (initialConfig.chartLeftPadding + 5)) {
        xTickValPos = initialConfig.chartLeftPadding + 5;
      }
      xAxisSliderGroup.attr("transform", "translate(" + parseInt(xTickValPos) + "," + parseInt(xAxisBottomPos - xAxisSliderRectWidthPadding) + ")").style('display', 'block'); // bgBottomPadding is extra bg rect padding
      xAxisSliderGroup.select(".hover-line-status").attr("x", lockIconXPos).attr("y", initialConfig.tickSliderPadding); //lock icon position
      let xAxisSliderTextTopPos = isFitToWidthMode ? Math.round(9 * currentCanvasWidth / args.screen) : 9;
      let xAxisSliderTextLeftPos = (xAxisLeftPadding + (isFitToWidthMode ? Math.round(5 * currentCanvasWidth / args.screen) : 5));

      async function renderXSliderText() {
        xHoverRectText
          .text(xaxis_text)
          .attr("dy", "1em")
          .attr('x', xAxisSliderTextLeftPos)
          .attr('y', xAxisSliderTextTopPos)
          .style('text-align', 'center')
          .call(trimFromAnyCharacter, xaxis_box_width)
          .style('display', 'block');
      }
      renderXSliderText().then(() => {
        xHoverRect
          .attr('width', xaxis_box_width)
          .attr('height', xTickSliderHeight)
          .attr('x', xAxisLeftPadding)
          .attr('y', 4)
          .style('text-align', 'center')
          .style('display', 'block');
      });
    }
    // y-axis
    if (yAxisSliderGroup) {
      // let yval_digits_count = getDigitsCount(d[args.yaxiskey]);
      let yval_digits_count = getDigitsCount(y0);
      let round_var = yval_digits_count - 2;
      let rounded_val = Math.round(y0 * Math.pow(10, round_var) / Math.pow(10, round_var));
      let yaxis_text = formatNumber(rounded_val);
      let yaxis_box_width = calculateTextWidth(yaxis_text, tickSliderFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica') + 4 + 10;
      let yaxis_box_left_pos = 3;

      // let ySliderPos = yScale(d[args.yaxiskey]);
      let ySliderPos = (mouseY - 2);
      if (ySliderPos < 6) {
        ySliderPos = 6;
      } else if (ySliderPos > (innerHeight - 7)) {
        ySliderPos = innerHeight - 7;
      }
      // yAxisSliderGroup.attr("transform", "translate(" + yaxis_box_left_pos + "," + ySliderPos + ")"); // bgBottomPadding is extra bg rect padding
      yAxisSliderGroup.attr("transform", "translate(" + yaxis_box_left_pos + "," + ySliderPos + ")").style('display', 'block'); // bgBottomPadding is extra bg rect padding
      yHoverRect
        .attr('width', (initialConfig.chartLeftPadding + 5))
        .attr('x', 0)
        .attr('y', -(initialConfig.tickHoverBoxHeight / 2))
        .style('display', 'block');
      yHoverRectText.text(yaxis_text)
        .attr('x', (initialConfig.chartLeftPadding - yaxis_box_width + 5))
        .attr('y', yTickSliderTextPosTop)
        .style('display', 'block');
    }
    //show highlighted circle on hover
    //focus.attr("transform", "translate(" + xScale(d[args.xaxiskey]) + "," + yScale(d[args.yaxiskey]) + ")").style('display', 'block');;
    if (args.pointSelectionModeOn) {
      tooltip_text = 'Click to select';
    } else {
      tooltip_text = args.yaxiskey + ': ' + args.chartCurrencySymbol + numberWithCommas(d[args.yaxiskey]) + args.chartPercentSymbol; //details;
    }
    let tooltipPadding = isFitToWidthMode ? Math.round(4 * currentCanvasWidth / args.screen) : 4;
    tooltip_text_width = calculateTextWidth(tooltip_text, toolTipFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica');
    tooltip_width = parseInt(tooltip_text_width) + tooltipPadding;
    tooltip_width = tooltip_width <= maxTooltipWidth ? tooltip_width : maxTooltipWidth;
    tooltip_pos_adjustment = initialConfig.tooltipHeight + (initialConfig.inbetweenChartAndXAxisPadding < 5 ? 5 : initialConfig.inbetweenChartAndXAxisPadding);
    tooltip_top = (yScale(d[args.yaxiskey]) - tooltip_pos_adjustment); //if totalVal is set use that position else use individual bar/bar_block position
    tooltip_top = tooltip_top < 0 ? (yScale(d[args.yaxiskey]) + initialConfig.tooltipHeight / 2) : tooltip_top;

    // chartXPos = (xScale(xValOnMouseMove) + tooltip_width);
    // let tooltip_left = chartXPos > chartWidth ? Math.ceil(xScale(xValOnMouseMove) - tooltip_width) - 5 : Math.ceil(xScale(xValOnMouseMove)) + 5;

    //show tooltip in bottom on extra small widget size
    if (!initialConfig.showXAxisTicks) {
      // tooltip_left = 0;
      tooltip_top = xAxisBottomPos;
    }
    //show hover indicator and tooptip
    let textLinesCount = 1;
    // not required for density 
    // tooltip.style('display', 'block').attr("transform", "translate(" + parseInt(tooltip_left) + "," + parseInt(tooltip_top) + ")").style('display', 'block');
    async function renderTooltipText() {
      tooltipRectText
        .text(tooltip_text)
        .attr("dy", "1em")
        .attr('x', tooltipTextXPos)
        .attr('y', tooltipTextYPos)
        .attr('fill', (initialConfig.showXAxisTicks) ? '#000' : '#fff')
        .call(wrapFromAnyCharacter, tooltip_width)
        .style('display', 'block');
      textLinesCount = tooltipRectText.selectAll('tspan').size();
      textLinesCount = (textLinesCount === undefined || textLinesCount === 0) ? 1 : textLinesCount;
    }
    renderTooltipText().then(() => {
      tooltipRect
        .attr('width', tooltip_width)
        .attr('height', textLinesCount * (toolTipFontSize + tooltipRectPadding) + textLinesCount) //increase height of rectangle as per text
        .attr('x', 0)
        .attr('y', 0)
        .style('display', initialConfig.showXAxisTicks ? 'block' : 'none');
    });
  }

  // geopath object
  var densityData = d3.contourDensity()
    .x((d) => { return xScale(d[args.xaxiskey]); })
    .y((d) => { return yScale(d[args.yaxiskey]); })
    .size([width, height])
    .bandwidth(18)(args.data)

  // scale function to scale center/width/height
  const scale = (scaleFactor, width, height) => {
    return d3.geoTransform({
      point: function (x, y) {
        this.stream.point((x - width / 2) * scaleFactor + width / 2, (y - height / 2) * scaleFactor + height / 2);
      }
    });
  }

  //create path for projection and scale it 
  var path = d3.geoPath().projection(scale(0.8, innerWidth, innerHeight))

  // scale colors
  var colorScale = d3.scaleLinear()
    .domain([0, 1]) // Points per square pixel.
    .range(["#1d2024", defaultColor])

  densityWrap.selectAll(".chart-bg")
    .data(densityData)
    .enter().append("path")
    .attr("d", path)
    .attr("fill", (d) => { return colorScale(d.value); })
    .attr("stroke", defaultColor)
    .attr("stroke-linejoin", "round")

}
/*************************
 * Draw Box Plot
- padding: padding,
- width: width
- height: height
- indivisualChartHeight: indivisualChartHeight,
- yaxiskey: chart_ykey,
- xaxiskey: item.x_axis.id,
- data: chartsData[chart_ykey],
- chartSegmentation: chartsSegmentation[chart_ykey]
*/
const drawBoxPlot = (args) => {
  // chart initial settings variables
  const initialConfig = getInitialChartConfig(args)
  if (!initialConfig) return

  // basic configuration
  let width = args.chartWrapper.current.offsetWidth
  let innerWidth = width - (initialConfig.chartLeftPadding + initialConfig.chartRightPadding + initialConfig.inbetweenChartAndXAxisPadding)
  let chartWrapperHeight = d3.select('#chart-' + args.unique_key).node().getBoundingClientRect().height
  let height = chartWrapperHeight - initialConfig.chartWidgetBottomPadding - initialConfig.chartHeadingSectionHeight
  if (args.excludeChartHeader != undefined) {
    height = height + initialConfig.chartInnerHeadingSectionHeightWithMargin + (initialConfig.chartWidgetBottomPadding - 5)
  }
  //console.log(args.chartWrapper.current);
  let innerHeight = (height - initialConfig.chartBottomPadding - initialConfig.chartTopPadding)
  let xAxisBottomPos = (height - initialConfig.chartBottomPadding + initialConfig.inbetweenChartAndXAxisPadding)
  d3.select(args.chartWrapper.current).style("height", `${height}px`) // set chart height

  // chart icons
  // let iconLock = ''
  // let iconUnlock = ''

  let isFitToWidthMode = (args.screen && !args.isDashboardInEditMode && (args.viewModeType !== undefined && args.viewModeType.name === 'Fit to Width'))
  let tickFontSize = isFitToWidthMode ? Math.floor(10 * window.innerWidth / args.screen) : 10;
  let xAxisTickStartPos = isFitToWidthMode ? Math.floor(75 * window.innerWidth / args.screen) : 75;
  let yAxisTickTopPos = isFitToWidthMode ? Math.floor(5 * window.innerWidth / args.screen) : 5;
  // let tickSliderFontSize = isFitToWidthMode ? Math.floor(11 * window.innerWidth / args.screen) : 10;
  let toolTipFontSize = isFitToWidthMode ? Math.floor(11 * window.innerWidth / args.screen) : 11;


  //Define charts configs
  let isSegmented = (args.chartSegmentation && args.chartSegmentation !== '' && args.chartSegmentation !== 'all' && args.chartSegmentation !== ' ');
  let chartSegmentation = isSegmented ? args.chartSegmentation : '';
  let chartHoverLocked = false;
  let defaultColor = (args.chartFormat.color && args.chartFormat.color.single_color !== '') ? args.chartFormat.color.single_color : chartColors[0]; //pick selected color
  let color = getColor(args); //Set Color Scales
  let parseDate = d3.timeFormat("%m.%d.%Y"),
    // parsedDateString = d3.timeFormat("%d %b %Y"),
    formatYNumber = d3.format("");

  //Data variable
  let chartMainData = [...args.data];

  //Define SVG and group element
  let svg = getSVGElement(args.chartWrapper.current, width, height);
  let chart = getGroupElement(svg, args.yaxiskey);

  //Scaling Points - start and end
  let xStartPoint = initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndYAxisPadding;
  let xEndPoint = (width - initialConfig.chartRightPadding);
  let yStartPoint = xAxisBottomPos - initialConfig.inbetweenChartAndXAxisPadding - 1;
  let yEndPoint = initialConfig.chartTopPadding;

  let yScaleLimits;
  let xDomains;

  //return from here if data is not available
  if (!args.data || args.data.length === 0) return;
  // console.log(args.chartFormat)
  if (args.xaxiskey == 'date') {
    xDomains = d3.extent(args.data, (d) => { return d[args.xaxiskey]; })
  }
  else {
    xDomains = args.data.map((d) => d[args.xaxiskey]);
  }
  // console.log(xDomains)
  var xAxisTickValues = getXAxisTickValues(initialConfig, args.data.map((d) => d[args.xaxiskey]), chartMainData, args); // get x axis calculated tick values

  //Define X-Axis for each chart - date/string

  // let xDomains = args.data.map((d) => d[args.xaxiskey]);
  // let xAxisTickValues = getXAxisTickValues(initialConfig, args.data.map((d) => d[args.xaxiskey]), chartMainData, args); // get x axis calculated tick values

  let dataNest = [];

  let bgBottomPadding = 2;

  // let boxPlotWrapper = chart.append('g').attr("clip-path", `url(#clip-${args.unique_key})`);
  const quantile = (arr, q) => {
    const pos = (arr.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (arr[base + 1] !== undefined) {
      return arr[base] + rest * (arr[base + 1] - arr[base]);
    } else {
      return arr[base];
    }
  };

  if (isSegmented) {
    let minVal = 0
    let maxVal = 0
    dataNest = d3.nest().key((d) => d[chartSegmentation])
      .rollup((d) => {
        var revData = []
        d.forEach(item => {
          revData.push(item[args.yaxiskey])
        });
        var data_sorted = revData.sort(d3.ascending)
        var q1 = quantile(data_sorted, .25);

        var median = quantile(data_sorted, .50);

        var q3 = quantile(data_sorted, .75);

        var interQuantileRange = q3 - q1
        var min = data_sorted[0]

        var max = data_sorted[data_sorted.length - 1]
        if (min < minVal) minVal = min
        if (max > maxVal) maxVal = max
        return ({ q1: q1, median: median, q3: q3, interQuantileRange: interQuantileRange, min: min, max: max })
      })
      .entries(chartMainData);


    xDomains = dataNest.map((d) => {
      let isDate = Date.parse(d['key'])

      return !isNaN(isDate) ? new Date(d['key']) : d['key']
    })
    // if(args.xaxiskey == 'date'){
    //   xDomains = d3.extent(dataNest, (d)  =>{return  d['key']})  
    // }
    xAxisTickValues = getXAxisTickValues(initialConfig, xDomains, chartMainData, args);

    let range = (maxVal - minVal);
    yScaleLimits = { 'lowerLimit': 0, 'upperLimit': maxVal + (0.10 * range) };
    if (args.chartFormat.yaxis.min !== '' && args.chartFormat.yaxis.min !== 0) { yScaleLimits['lowerLimit'] = args.chartFormat.yaxis.min; }
    if (args.chartFormat.yaxis.max !== '' && args.chartFormat.yaxis.max !== 0) { yScaleLimits['upperLimit'] = args.chartFormat.yaxis.max; }
  }
  else {
    args.data.forEach(item => {
      dataNest.push(item[args.yaxiskey])
    })
    var data_sorted = dataNest.sort(d3.ascending)
    var q1 = quantile(data_sorted, .25);
    var median = quantile(data_sorted, .50);
    var q3 = quantile(data_sorted, .75);
    // var interQuantileRange = q3 - q1;
    var min = data_sorted[0]

    var max = data_sorted[data_sorted.length - 1]
    if (args.xaxiskey == 'date') {
      var maxXaxis = args.data.find(item => {
        return item[args.yaxiskey] == max
      })

      maxXaxis = Date.parse(maxXaxis[args.xaxiskey]) ? parseDate(maxXaxis[args.xaxiskey]) : maxXaxis[args.xaxiskey]
      var minXaxis = args.data.find(item => {
        return item[args.yaxiskey] == min
      })
      minXaxis = Date.parse(minXaxis[args.xaxiskey]) ? parseDate(minXaxis[args.xaxiskey]) : minXaxis[args.xaxiskey]

      var medianXaxis = args.data.find(item => {
        return item[args.yaxiskey] == median
      })

      medianXaxis = Date.parse(medianXaxis[args.xaxiskey]) ? parseDate(medianXaxis[args.xaxiskey]) : medianXaxis[args.xaxiskey]
    }
    yScaleLimits = (args.isEmpty === undefined && args.data.length > 0) ? getMinMaxRange(chartMainData, args.yaxiskey) : { lowerLimit: 0, upperLimit: 10 };
    if (args.chartFormat.yaxis.min !== '' && args.chartFormat.yaxis.min !== 0) { yScaleLimits['lowerLimit'] = args.chartFormat.yaxis.min; }
    if (args.chartFormat.yaxis.max !== '' && args.chartFormat.yaxis.max !== 0) { yScaleLimits['upperLimit'] = args.chartFormat.yaxis.max; }
  }

  /* Define and create yScale, yAxis, ticks */
  let y_steps = args.yAxisTicksCount !== undefined ? args.yAxisTicksCount : initialConfig.defaultYAxisTicksCount;
  if (args.chartFormat.yaxis.tick !== '' && args.chartFormat.yaxis.tick > 0) {
    y_steps = Math.floor(yScaleLimits['upperLimit'] / args.chartFormat.yaxis.tick) + 1;
  }

  let xScale;
  let xAxis;
  const defineXScale = async () => {
    //Set the scales  
    xScale = d3.scaleBand()
      .domain(xDomains)
      .range([xStartPoint, xEndPoint])

    //Define the ticks
    xAxis = d3.axisBottom(xScale)
      .tickValues(xAxisTickValues)
      .tickSize(0)
      .tickPadding(5)
      .tickFormat((args.xaxiskey === 'date' && !isSegmented ? d3.timeFormat("%m.%d.%Y") : (d) => (typeof d === 'string') ? d.substring(0, 10) : d));

    //Draw x-axis
    chart.append("g")
      .attr("class", "axis x-axis")
      .attr("id", `clip-${args.unique_key}`)
      .attr("transform", "translate(0, " + xAxisBottomPos + ")") //start with 10px instead of 0
      .call(xAxis)
      .attr('font-size', tickFontSize + 'px');
  }

  if (isSegmented) {
    defineXScale().then(() => {
      //Change x axis first and last tick position
      alignXAxisTicks(width, args.unique_key, initialConfig, xAxisTickValues, xDomains, parseDate, tickFontSize, xAxisTickStartPos);
    })
  }
  let hasCustomFormat = (args.chartFormat.yaxis.tick || args.chartFormat.yaxis.min || args.chartFormat.yaxis.max) ? true : false;
  let customTickInterval = hasCustomFormat ? args.chartFormat.yaxis.tick : null;
  let yDomains = (y_steps > 1) ? getTickValues(yScaleLimits['lowerLimit'], yScaleLimits['upperLimit'], y_steps, hasCustomFormat, customTickInterval) : [];
  let yTickValues = (initialConfig.showYAxisTicks) ? [...yDomains] : [];
  let yScale;
  let yAxis;
  async function defineYScale() {
    //Define y scale
    let upperYLimit = args.chartSizeClass === "xs-grid-width" ? yScaleLimits['upperLimit'] : yTickValues[yTickValues.length-1];
    yScale = d3.scaleLinear()
      .domain([yScaleLimits['lowerLimit'], upperYLimit])//yScaleLimits['upperLimit']])
      .range([yStartPoint, yEndPoint]);

    //Define y axis ticks
    yAxis = d3.axisLeft(yScale)
      .tickValues(yTickValues)
      .tickSize(0)
      .tickFormat((d) => formatNumber(formatYNumber(d)))
      .tickPadding(3);

    //Draw y axis
    chart.append("g")
      .attr("class", "axis y-axis")
      .attr("transform", "translate(" + initialConfig.chartLeftPadding + ",0)")
      .call(yAxis)
      .attr('font-size', tickFontSize + 'px');
  }
  defineYScale().then(() => {
    alignYAxisTicks(innerHeight, args.unique_key, initialConfig, yAxisTickTopPos);
  });

  var boxWidth = 10;
  if (isSegmented) {
    chart
      .selectAll("vertLines")
      .data(dataNest)
      .enter()
      .append("line")
      .attr("x1", (d) => {
        return (xScale(d.key))
      })
      .attr("x2", (d) => { return (xScale(d.key)) })
      .attr("y1", (d) => { return (yScale(d.value.min)) })
      .attr("y2", (d) => { return (yScale(d.value.max)) })
      .attr("stroke", defaultColor)
      .style("width", 40)

    // rectangle for the main box
    chart
      .selectAll("boxes")
      .data(dataNest)
      .enter()
      .append("rect")
      .attr("x", (d) => {
        return (xScale(d.key) - boxWidth / 2)
      })
      .attr("y", (d) => { return (yScale(d.value.q3)) })
      .attr("height", (d) => { return (yScale(d.value.q1) - yScale(d.value.q3)) })
      .attr("width", boxWidth)
      .attr("stroke", defaultColor)
      .style("fill", (d) => { return color(d.key) })

    // Show the median
    chart
      .selectAll("medianLines")
      .data(dataNest)
      .enter()
      .append("line")
      .attr("x1", (d) => { return (xScale(d.key) - boxWidth / 2) })
      .attr("x2", (d) => { return (xScale(d.key) + boxWidth / 2) })
      .attr("y1", (d) => { return (yScale(d.value.median)) })
      .attr("y2", (d) => { return (yScale(d.value.median)) })
      .attr("stroke", defaultColor)
      .style("width", 80)
  } else {
    var center = width / 2;
    boxWidth = innerWidth / 4;
    chart
      .append("line")
      .attr("x1", center)
      .attr("x2", center)
      .attr("y1", yScale(min))
      .attr("y2", yScale(max))
      .attr("stroke", color)

    // Show the box
    chart
      .append("rect")
      .attr("x", center - boxWidth / 2)
      .attr("y", yScale(q3))
      .attr("height", (yScale(q1) - yScale(q3)))
      .attr("width", boxWidth)
      .attr("stroke", lineColor)
      .style("fill", lineColor)

    // show median, min and max horizontal lines
    chart
      .selectAll("toto")
      .data([min, median, max])
      .enter()
      .append("line")
      .attr("x1", center - boxWidth / 2)
      .attr("x2", center + boxWidth / 2)
      .attr("y1", (d) => { return (yScale(d)) })
      .attr("y2", (d) => { return (yScale(d)) })
      .attr("stroke", color)
  }
  chart.append('rect')
    .attr('width', innerWidth)
    .attr('height', innerHeight + bgBottomPadding)
    .attr('x', initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndYAxisPadding)
    .attr('y', initialConfig.chartTopPadding)
    .attr('class', 'chart-bg')
    .attr('opacity', 0)
    .on('mousemove', () => handleChartMouseMove())
    .on("mouseout", handleChartMouseOut)

  let tooltipMax = chart.append("g")
    .attr("class", "tooltip1")
    .attr("transform", "translate(0, 0)");
  let tooltipMedian = chart.append("g")
    .attr("class", "tooltip1")
    .attr("transform", "translate(0, 0)");
  let tooltipMin = chart.append("g")
    .attr("class", "tooltip1")
    .attr("transform", "translate(0, 0)");
  let tooltipMaxRect = tooltipMax.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 0)
    .attr("height", (toolTipFontSize + 2))
    .attr('fill', '#dedede')
    .attr("rx", 2)
    .attr("class", 'tooltip-rect');

  let tooltipMaxRectText = tooltipMax.append("text")
    .attr('font-size', toolTipFontSize + 'px')
    .text('')
    .attr('x', 0)
    .attr('y', 0)
    .attr("fill", "#000")
    .attr("class", "tooltip-text");

  let tooltipMedianRect = tooltipMedian.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 0)
    .attr("height", (toolTipFontSize + 2))
    .attr('fill', '#dedede')
    .attr("rx", 2)
    .attr("class", 'tooltip-rect');

  let tooltipMedianRectText = tooltipMedian.append("text")
    .attr('font-size', toolTipFontSize + 'px')
    .text('')
    .attr('x', 0)
    .attr('y', 0)
    .attr("fill", "#000")
    .attr("class", "tooltip-text");

  let tooltipMinRect = tooltipMin.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 0)
    .attr("height", (toolTipFontSize + 2))
    .attr('fill', '#dedede')
    .attr("rx", 2)
    .attr("class", 'tooltip-rect');

  let tooltipMinRectText = tooltipMin.append("text")
    .attr('font-size', toolTipFontSize + 'px')
    .text('')
    .attr('x', 0)
    .attr('y', 0)
    .attr("fill", "#000")
    .attr("class", "tooltip-text");

  let tooltip_text_median = '';
  let tooltip_text_max = '';
  let tooltip_text_min = '';
  let tooltip_text_width = 0;
  let tooltip_width = 0;
  let tooltip_top = 0;
  let tooltip_left = 0;
  if (args.pointSelectionModeOn) {
    tooltip_text_median = 'Click to select';
    tooltip_text_max = 'Click to select';
    tooltip_text_min = 'Click to select';
  } else {
    tooltip_text_median = args.chartCurrencySymbol + numberWithCommas(parseFloat(median).toFixed(2)) + args.chartPercentSymbol + (args.xaxiskey == 'date' ? ", " + medianXaxis : ''); //details;
    tooltip_text_min = args.chartCurrencySymbol + numberWithCommas(parseFloat(min).toFixed(2)) + args.chartPercentSymbol + (args.xaxiskey == 'date' ? ", " + minXaxis : ''); //details;
    tooltip_text_max = args.chartCurrencySymbol + numberWithCommas(parseFloat(max).toFixed(2)) + args.chartPercentSymbol + (args.xaxiskey == 'date' ? ", " + maxXaxis : ''); //details;
  }
  tooltipMaxRectText.text(tooltip_text_max).call(wrapFromAnyCharacter, tooltip_text_width);
  tooltipMedianRectText.text(tooltip_text_median).call(wrapFromAnyCharacter, tooltip_text_width);
  tooltipMinRectText.text(tooltip_text_min).call(wrapFromAnyCharacter, tooltip_text_width);

  function calculateTooltipPositionAndWidth(tool, text, top) {
    tooltip_text_width = calculateTextWidth(text, toolTipFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica');
    tooltip_width = tooltip_text_width + 4;
    //tooltip_width = tooltip_width <= maxTooltipWidth ? tooltip_width : maxTooltipWidth;
    // tooltip_pos_adjustment = initialConfig.tooltipHeight + (initialConfig.inbetweenChartAndXAxisPadding < 5 ? 5 : initialConfig.inbetweenChartAndXAxisPadding);
    tooltip_top = yScale(top) - 6
    tooltip_left = center + boxWidth / 2 + 12

    if (tool == 'Max') {
      tooltipMax.style("display", "block").attr("transform", "translate(" + (tooltip_left) + "," + (tooltip_top) + ")");
      tooltipMaxRectText
        .text(tooltip_text_max)
        .attr("dy", "1em")
        .attr('x', 2)
        .attr('fill', initialConfig.showXAxisTicks ? '#000' : '#fff')
        .style('display', 'block');

      tooltipMaxRect
        .attr('width', tooltip_width)
        .attr('height', toolTipFontSize + 2) //increase height of rectangle as per text
        .attr('x', 0)
        .attr('y', 0)
        .style('display', initialConfig.showXAxisTicks ? 'block' : 'none');
    }
    else if (tool == 'Median') {
      tooltipMedian.style("display", "block").attr("transform", "translate(" + (tooltip_left) + "," + (tooltip_top) + ")");
      tooltipMedianRectText
        .text(tooltip_text_median)
        .attr("dy", "1em")
        .attr('x', 2)
        .attr('fill', initialConfig.showXAxisTicks ? '#000' : '#fff')
        .style('display', 'block');

      tooltipMedianRect
        .attr('width', tooltip_width)
        .attr('height', toolTipFontSize + 2) //increase height of rectangle as per text
        .attr('x', 0)
        .attr('y', 0)
        .style('display', initialConfig.showXAxisTicks ? 'block' : 'none');
    }
    else if (tool == 'Min') {
      tooltipMin.style("display", "block").attr("transform", "translate(" + (tooltip_left) + "," + (tooltip_top) + ")");
      tooltipMinRectText
        .text(tooltip_text_min)
        .attr("dy", "1em")
        .attr('x', 2)
        .attr('fill', initialConfig.showXAxisTicks ? '#000' : '#fff')
        .style('display', 'block');

      tooltipMinRect
        .attr('width', tooltip_width)
        .attr('height', toolTipFontSize + 2) //increase height of rectangle as per text
        .attr('x', 0)
        .attr('y', 0)
        .style('display', initialConfig.showXAxisTicks ? 'block' : 'none');
    }
  }
  function showLabelData() {
    calculateTooltipPositionAndWidth('Max', tooltip_text_max, max);
    calculateTooltipPositionAndWidth('Median', tooltip_text_median, median);
    calculateTooltipPositionAndWidth('Min', tooltip_text_min, min);
  }
  function hideLabelData() {
    tooltipMax.style('display', 'none')
    tooltipMedian.style('display', 'none')
    tooltipMin.style('display', 'none')
  }

  if (args.chartFormat.showLabel) {
    showLabelData()
  }
  // xScale.invert = function (x) {
  //   return d3.scaleQuantize().domain(this.range()).range(this.domain())(x);
  // };
  yScale.invert = function (y) {
    return d3.scaleLinear().domain(this.range()).range(this.domain())(y);
  };

  function handleChartMouseOut() {
    if (!args.chartFormat.showLabel) {
      hideLabelData()
    }
  }
  function handleChartMouseMove() {
    if (isSegmented) return false
    if (chartHoverLocked) return false; //if locked no hover allowed
    // var y0;

    // var mouseX = d3.mouse(args.chartWrapper.current)[0];
    // var mouseY = d3.mouse(args.chartWrapper.current)[1];
    // y0 = yScale.invert(mouseY);
    // var mouse = d3.mouse(args.chartWrapper.current)

    if (args.chartFormat.showLabel == false) {
      showLabelData()
    }
  }
}

/*************************
 * Draw Area Chart
- padding: padding,
- width: width
- height: height
- indivisualChartHeight: indivisualChartHeight,
- yaxiskey: chart_ykey,
- xaxiskey: item.x_axis.id,
- data: chartsData[chart_ykey],
- chartSegmentation: chartsSegmentation[chart_ykey]
*/
const drawAreaChart = (args) => {
  // chart initial settings variables
  const initialConfig = getInitialChartConfig(args)
  if (!initialConfig) return

  // basic configuration
  let width = args.chartWrapper.current.offsetWidth
  let innerWidth = width - (initialConfig.chartLeftPadding + initialConfig.chartRightPadding + initialConfig.inbetweenChartAndXAxisPadding)
  let chartWrapperHeight = d3.select('#chart-' + args.unique_key).node().getBoundingClientRect().height
  let height = chartWrapperHeight - initialConfig.chartWidgetBottomPadding - initialConfig.chartHeadingSectionHeight
  if (args.excludeChartHeader != undefined) {
    height = height + initialConfig.chartInnerHeadingSectionHeightWithMargin + (initialConfig.chartWidgetBottomPadding - 5)
  }
  let innerHeight = (height - initialConfig.chartBottomPadding - initialConfig.chartTopPadding)
  let xAxisBottomPos = (height - initialConfig.chartBottomPadding + initialConfig.inbetweenChartAndXAxisPadding)
  d3.select(args.chartWrapper.current).style("height", `${height}px`) // set chart height

  // chart icons
  let iconLock = ''
  let iconUnlock = ''

  let isFitToWidthMode = (args.screen && !args.isDashboardInEditMode && (args.viewModeType !== undefined && args.viewModeType.name === 'Fit to Width'))
  let tickFontSize = isFitToWidthMode ? Math.floor(10 * window.innerWidth / args.screen) : 10;
  let xAxisTickStartPos = isFitToWidthMode ? Math.floor(75 * window.innerWidth / args.screen) : 75;
  let yAxisTickTopPos = isFitToWidthMode ? Math.floor(5 * window.innerWidth / args.screen) : 5;
  let tickSliderFontSize = isFitToWidthMode ? Math.floor(11 * window.innerWidth / args.screen) : 10;
  let toolTipFontSize = isFitToWidthMode ? Math.floor(11 * window.innerWidth / args.screen) : 11;

  //Define charts configs
  let isSegmented = (args.chartSegmentation && args.chartSegmentation !== '' && args.chartSegmentation !== 'all' && args.chartSegmentation !== ' ');
  let chartSegmentation = isSegmented ? args.chartSegmentation : '';
  let chartHoverLocked = false;
  let defaultColor = (args.chartFormat.color && args.chartFormat.color.single_color !== '') ? args.chartFormat.color.single_color : chartColors[0]; //pick selected color
  let color = getColor(args); //Set Color Scales
  let parseDate = d3.timeFormat("%m.%d.%Y"),
    // parsedDateString = d3.timeFormat("%d %b %Y"),
    formatYNumber = d3.format("");

  //Data variable
  let chartMainData = [...args.data];
  //Define SVG and group element

  let svg = getSVGElement(args.chartWrapper.current, width, height);
  let chart = getGroupElement(svg, args.yaxiskey);

  //Scaling Points - start and end
  let xStartPoint = initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndYAxisPadding;
  let xEndPoint = (width - initialConfig.chartRightPadding);
  let yStartPoint = xAxisBottomPos - initialConfig.inbetweenChartAndXAxisPadding - 1;
  let yEndPoint = initialConfig.chartTopPadding;

  let yScaleLimits;
  let series;
  let xDomains
  // let xScaleType = args.xaxiskey === 'date' ? 'time' : 'band'
  xDomains = args.data.map((d) => d[args.xaxiskey]);
  let xAxisTickValues = getXAxisTickValues(initialConfig, args.data.map((d) => d[args.xaxiskey]), chartMainData, args); // get x axis calculated tick values
  let dataNest;
  // Individual Chart Elements - background rect, y axis line, x axis line to merge both x ans y axis corner
  let segments
  if (isSegmented) {
    chartSegmentation = args.isComparisonEnabled ? 'id' : chartSegmentation
    dataNest = d3.nest().key((d) => d[args.xaxiskey])
      .entries(chartMainData);

    let formattedData = [];
    dataNest.forEach((item) => {
      let obj = {};
      obj[args.xaxiskey] = item.values[0][args.xaxiskey];
      item.values.forEach((subitem) => {
        obj[subitem[chartSegmentation]] = subitem[args.yaxiskey];
      })
      formattedData.push(obj);
    });

    segments = [];
    if (formattedData.length > 0) {
      formattedData.forEach((item) => {
        Object.keys(item).forEach((subitem) => {
          if (!segments.includes(subitem)) {
            segments.push(subitem);
          }
        })
      });
    }

    let xaxis_key_index = segments.findIndex((x) => x === args.xaxiskey);
    if (xaxis_key_index > -1) {
      segments.splice(xaxis_key_index, 1);
    }
    const stack = d3.stack().keys(segments);
    series = stack(formattedData);

    //get y axis ticks
    let minVal = d3.min(series, (d) => d3.min(d, (d) => d[1]));
    let maxVal = d3.max(series, (d) => d3.max(d, (d) => d[1]));
    let range = (maxVal - minVal);
    yScaleLimits = { 'lowerLimit': 0, 'upperLimit': maxVal + (0.10 * range) };
    if (args.chartFormat.yaxis.min !== '' && args.chartFormat.yaxis.min !== 0) { yScaleLimits['lowerLimit'] = args.chartFormat.yaxis.min; }
    if (args.chartFormat.yaxis.max !== '' && args.chartFormat.yaxis.max !== 0) { yScaleLimits['upperLimit'] = args.chartFormat.yaxis.max; }
  }
  else {
    yScaleLimits = (args.isEmpty === undefined && args.data.length > 0) ? getMinMaxRange(chartMainData, args.yaxiskey, 'bar') : { lowerLimit: 0, upperLimit: 10 };
    if (args.chartFormat.yaxis.min !== '' && args.chartFormat.yaxis.min !== 0) { yScaleLimits['lowerLimit'] = args.chartFormat.yaxis.min; }
    if (args.chartFormat.yaxis.max !== '' && args.chartFormat.yaxis.max !== 0) { yScaleLimits['upperLimit'] = args.chartFormat.yaxis.max; }
  }
  /* Define and create xScale, xAxis, ticks */
  let xScale;
  let xAxis;
  
  //console.log(xDomains)
  const defineXScale = async () => {
    //Set the scales  
    xScale = d3.scaleBand()
      .domain(xDomains)
      .range([xStartPoint, xEndPoint])

    //Define the ticks
    xAxis = d3.axisBottom(xScale)
      .tickValues(xAxisTickValues)
      .tickSize(0)
      .tickPadding(5)
      .tickFormat((args.xaxiskey === 'date' ? d3.timeFormat("%m.%d.%Y") : (d) => (typeof d === 'string') ? d.substring(0, 10) : d));

    //Draw x-axis
    chart.append("g")
      .attr("class", "axis x-axis")
      .attr("id", `clip-${args.unique_key}`)
      .attr("transform", "translate(0, " + xAxisBottomPos + ")") //start with 10px instead of 0
      .call(xAxis)
      .attr('font-size', tickFontSize + 'px');
  }
  defineXScale().then(() => {
    //Change x axis first and last tick position
    alignXAxisTicks(width, args.unique_key, initialConfig, xAxisTickValues, xDomains, parseDate, tickFontSize, xAxisTickStartPos);
  })

  //reset after brusing 
  // const resetScale = async () =>{
  //   xScale
  //   .domain(xDomains)
  //   .range([xStartPoint , xEndPoint])

  //   xAxis = d3.axisBottom(xScale)
  //   .tickValues(xAxisTickValues)
  //   .tickSize(0)
  //   .tickPadding(5)
  //   .tickFormat((args.xaxiskey === 'date' ? d3.timeFormat("%m.%d.%Y") : (d) => (typeof d ==='string') ? d.substring(0,10) : d));

  // chart.selectAll('.x-axis').remove()
  // xAxisRegion = chart.append("g")
  // .attr("class", "axis x-axis")
  // .attr("clip-path", "url(#clip)")
  // .attr("transform", "translate(0, " + xAxisBottomPos + ")") //start with 10px instead of 0
  // .call(xAxis)
  // .attr('font-size', tickFontSize+'px')
  // }
  /* Define and create yScale, yAxis, ticks */
  let y_steps = args.yAxisTicksCount !== undefined ? args.yAxisTicksCount : initialConfig.defaultYAxisTicksCount;
  if (args.chartFormat.yaxis.tick !== '' && args.chartFormat.yaxis.tick > 0) {
    y_steps = Math.floor(yScaleLimits['upperLimit'] / args.chartFormat.yaxis.tick) + 1;
  }

  let hasCustomFormat = (args.chartFormat.yaxis.tick || args.chartFormat.yaxis.min || args.chartFormat.yaxis.max) ? true : false;
  let customTickInterval = hasCustomFormat ? args.chartFormat.yaxis.tick : null;
  let yDomains = (y_steps > 1) ? getTickValues(yScaleLimits['lowerLimit'], yScaleLimits['upperLimit'], y_steps, hasCustomFormat, customTickInterval) : [];
  let yTickValues = (initialConfig.showYAxisTicks) ? [...yDomains] : [];
  let yScale;
  let yAxis;
  async function defineYScale() {
    //Define y scale
    if (isSegmented) {
      let yaxisArray = []
      series.forEach(arr => {
        arr.forEach(item => {
          if (!isNaN(item[1])) {
            yaxisArray.push(item[1])
          }
        })
      })

      yScale = d3.scaleLinear()
        .domain([0, d3.max(yaxisArray)])
        .range([yStartPoint, yEndPoint]);
    }
    else {
      yScale = d3.scaleLinear()
        .domain([0, d3.max(args.data, (d) => {
          return +d[args.yaxiskey]
        })])
        .range([yStartPoint, yEndPoint]);
    }
    //Define y axis ticks   
    yAxis = d3.axisLeft(yScale)
      .tickValues(yTickValues)
      .tickSize(0)
      .tickFormat((d) => {
        //console.log(d)
        return formatNumber(formatYNumber(d))
      })
      .tickPadding(3);

    //Draw y axis
    chart.append("g")
      .attr("class", "axis y-axis")
      .attr("transform", "translate(" + initialConfig.chartLeftPadding + ",0)")
      .call(yAxis)
      .attr('font-size', tickFontSize + 'px');
  }
  defineYScale().then(() => {
    //Change x axis first and last tick position
    alignYAxisTicks(innerHeight, args.unique_key, initialConfig, yAxisTickTopPos);
  });
  //if no data available
  if (args.isEmpty) {
    chart.append("text")
      .attr("y", ((height / 2)))
      .attr("x", (width / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text('No data available')
      .style("fill", "#fff")
      .attr("class", "no-data");
  }

  //return from here if data is not available
  if (!args.data || args.data.length === 0) return;

  let areaPointWrapper = chart.append('g').attr("clip-path", `url(#clip-${args.unique_key})`);
  
  //x-axis tick slider elements
  let xAxisSliderGroup;
  let xHoverRect;
  let xHoverRectText;
  let xTickSliderWidth = isFitToWidthMode ? Math.round(60 * window.innerWidth / args.screen) : 60;
  let xTickSliderHeight = initialConfig.xTickSliderHeight;
  let xTickSliderTextPosLeft = isFitToWidthMode ? Math.round(3 * window.innerWidth / args.screen) : 3;
  let xTickSliderTextPosTop = isFitToWidthMode ? Math.round(4 * window.innerWidth / args.screen) : 4;
  let xAxisSliderRectWidthPadding = isFitToWidthMode ? Math.round(8 * window.innerWidth / args.screen) : 8;

  if (initialConfig.showXAxisTicks) {
    xAxisSliderGroup = chart.append("g").attr("class", "xaxis-slider-group").style("display", "none");
    xHoverRect = xAxisSliderGroup.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", xTickSliderWidth)
      .attr("height", xTickSliderHeight)
      .attr("rx", 1)
      .attr("class", 'hover-xaxis-bg')
      .style("display", "none");
    xHoverRectText = xAxisSliderGroup.append("text")
      .attr('font-size', tickSliderFontSize + 'px')
      .text('')
      .attr('x', xTickSliderTextPosLeft)
      .attr('y', xTickSliderTextPosTop)
      .attr("fill", "#fff")
      .attr("class", "hover-xaxis-tick-val")
      .style("display", "none");
  }
  //y-axis hover elements
  let yAxisSliderGroup;
  let yHoverRect;
  let yHoverRectText;
  let yTickSliderHeight = initialConfig.tickHoverBoxHeight + 3;
  let yTickSliderWidth = isFitToWidthMode ? Math.round(30 * window.innerWidth / args.screen) : 30;
  let yTickSliderRectPosLeft = isFitToWidthMode ? Math.round(5 * window.innerWidth / args.screen) : 5;
  let yTickSliderTextPosTop = isFitToWidthMode ? Math.round(5 * window.innerWidth / args.screen) : 5;

  if (initialConfig.showYAxisTicks) {
    yAxisSliderGroup = chart.append("g").attr("class", "yaxis-slider-group").style("display", "none");
    yHoverRect = yAxisSliderGroup.append("rect")
      .attr("x", yTickSliderRectPosLeft)
      .attr("y", 0)
      .attr("width", yTickSliderWidth)
      .attr("height", yTickSliderHeight)
      .attr("rx", 1)
      .attr("class", 'hover-yaxis-bg')
      .style("display", "none");
    yHoverRectText = yAxisSliderGroup.append("text")
      .attr('font-size', tickSliderFontSize + 'px')
      .text('')
      .attr('x', 0)
      .attr('y', 0)
      .attr("fill", "#fff")
      .attr("class", "hover-yaxis-tick-val")
      .style("display", "none");
  }
  //hoverYAxisLine
  var hoverYGridLine = chart.append("g").attr("class", "hover-grid-y-line").style("display", "none");
  hoverYGridLine.append("line")
    .attr("class", "y-hover-line hover-line")
    .attr("x1", xStartPoint)
    .attr("x2", xEndPoint);
  var hoverXGridLine = chart.append("g").attr("class", "hover-grid-x-line").style("display", "none");
  hoverXGridLine.append("line")
    .attr("class", "x-hover-line hover-line")
    .attr("y1", 0)
    .attr("y2", innerHeight);

  //hoverXAxisLine
  let tooltip_text = '';
  let tooltip_text_width = 0;
  let tooltip_width = 0;
  let tooltip_top = 0;
  let tooltip_pos_adjustment = 0;
  let tooltip_left = 0;

  d3.brushX()
    .extent([[initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndYAxisPadding, initialConfig.chartTopPadding], [innerWidth + initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndYAxisPadding, innerHeight]])
    .on("end", () => { return }) //  disabled brushing , call updateChart

  let tooltip = chart.append("g")
    .attr("class", "tooltip1")
    .attr("transform", "translate(0, 0)");
  let tooltipRect = tooltip.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 0)
    .attr("height", (toolTipFontSize + 2))
    .attr('fill', '#dedede')
    .attr("rx", 2)
    .attr("class", 'tooltip-rect');

  let tooltipRectText = tooltip.append("text")
    .attr('font-size', toolTipFontSize + 'px')
    .text('')
    .attr('x', 0)
    .attr('y', 0)
    .attr("fill", "#000")
    .attr("class", "tooltip-text");

  // remove for brushing
  chart.append('rect')
    .attr('width', innerWidth)
    .attr('height', innerHeight + 1)
    .attr('x', initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndYAxisPadding)
    .attr('y', initialConfig.chartTopPadding)
    .attr('opacity', 0)
    .on("mouseout", handleChartMouseOut)
    .on("mousemove", handleChartMouseMove)
    .on("click", handleChartLock);

  // Brushing code 

  // let brushgroup = chart.append("g")
  //   .attr("class", "brush")
  //   .attr("transform", "translate(0, 0)")
  //   .attr('width', innerWidth)
  //   .attr('height', innerHeight + 1)
  //   .attr('x', initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndYAxisPadding)
  //   .attr('y', initialConfig.chartTopPadding)
  //   .call(brush)

  // let brushClicpArea = areaPointWrapper.append("defs").append("clipPath")
  // .attr("id", `clip-${args.unique_key}`)
  // .append("rect")
  // .attr("width", innerWidth)
  // .attr("height", innerHeight)
  // .attr("x", initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndYAxisPadding)
  // .attr("y", initialConfig.chartTopPadding)  

  // brushgroup
  //   .on("mouseover", function () {
  //    // focus.style("display", null);
  //     hoverYGridLine.style("display", null);
  //     hoverXGridLine.style("display", null);
  //     xAxisSliderGroup.style('display', null);
  //     if (!chartSegmentation) yAxisSliderGroup.style('display', null);
  //     tooltip.style('display', null);
  //   })
  //   .on("mouseout",  handleChartMouseOut)
  //   .on("mousemove", handleChartMouseMove)
  //   .on("click", handleChartLock)

  if (isSegmented) {
    // color palette
    areaPointWrapper
      .selectAll("rect")
      .data(series)
      .enter()
      .append("path")
      .attr("class", (d) => {
        return "area " + d.key
      })
      .style("fill", (d) => { return color(d.key) })
      .attr("d", generateArea())
  }
  else {
    //draw chart here
    areaPointWrapper
      .append("path")
      .datum(chartMainData)
      .attr("class", 'area')
      .attr("fill", defaultColor)
      .attr("d", generateArea())
      .attr("stroke-width", 1)
      .attr("fill-opacity", .5)
      .attr("stroke", color)
  }
  // var idleTimeout
  // function idled() { idleTimeout = null; }
  // A function that update the chart for given boundaries
  // function updateChart() { 
  //   if(xScaleType !='time') return // can't scale band
  //   // What are the selected boundaries?
  //   let extent = d3.event.selection
  //  // If no selection, back to initial coordinate. Otherwise, update X axis domain
  //   if(!extent){
  //     if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
  //     xScale.domain(xDomains)
  //   }else{
  //     xScale.domain([ xScale.invert(extent[0]), xScale.invert(extent[1]) ])
  //     if(isSegmented)
  //     chart.selectAll(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
  //     else
  //     chart.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done 
  //   }
  //   if(isSegmented){
  //     xAxisRegion.transition().duration(1000).call(d3.axisBottom(xScale))
  //     areaPointWrapper
  //     .selectAll('.area')
  //     .transition()
  //     .duration(1000)
  //     .attr("d", generateArea())
  //   }
  //   else{
  //     xAxisRegion.transition().duration(1000).call(d3.axisBottom(xScale))
  //     areaPointWrapper
  //     .select('.area')
  //     .transition()
  //     .duration(1000)
  //     .attr("d", generateArea())
  //   }
  // }
  // reset brushing
  // chart.on("dblclick",() =>{
  //   resetScale().then(() => {
  //     if(!isSegmented){
  //       alignXAxisTicks(width, args.unique_key, initialConfig, xAxisTickValues,xDomains, parseDate, tickFontSize, xAxisTickStartPos);
  //     }
  //   })
  // })

  function generateArea() {
    if (isSegmented) {
      return d3.area()
        .x(d => {
          return xScale(d.data[args.xaxiskey])
        })
        .y1(d => {
          if (!isNaN(d[1])) return yScale(d[1])
          else return
        })
        .y0(d => {
          if (!isNaN(d[0])) return yScale(d[0])
          else return
        })
    }
    else {
      return d3.area()
        .x(d => {
          return xScale(d[args.xaxiskey])
        })
        .y1(d => {
          return yScale(d[args.yaxiskey])
        })
        .y0(yScale(0))
    }
  }

  function findNearesetPointToMouse(pointList, mousePos) {
    let np = null, npIndex = -1, nDistSq = Number.POSITIVE_INFINITY;
    pointList.forEach((p, i) => {
      const distSq = Math.pow(p.xPos - mousePos[0], 2) + Math.pow(p.yPos - mousePos[1], 2);
      if (distSq < nDistSq) { nDistSq = distSq; np = p; npIndex = i }
    });
    return [np, npIndex];
  }
  function handleChartLock() {
    var mouse = d3.mouse(this);
    var xValOnMouseMove = xScale.invert(mouse[0]);
    if (chartHoverLocked) {
      chartHoverLocked = false;
      if (xAxisSliderGroup) xAxisSliderGroup.select('.hover-line-status').html(iconUnlock);
      tooltip.style("display", null);
    } else {
      chartHoverLocked = true;
      if (xAxisSliderGroup) xAxisSliderGroup.select('.hover-line-status').html(iconLock);
    }
    if (args.pointSelectionModeOn && xValOnMouseMove !== null && xValOnMouseMove !== undefined) {
      const chartClickInfo = {
        id: args.unique_key,
        xPoint: args.xaxiskey === 'date' ? d3.timeFormat('%Y-%m-%d')(xValOnMouseMove) : xValOnMouseMove
      };
      args.pointSelectionClbk(chartClickInfo);
    }
  }
  //show on initial load - to show segmentation aggregated details
  handleChartMouseOut();
  //Remove tooltip on mouse out
  function handleChartMouseOut() {
    if (chartHoverLocked) return false; //if locked no hover allowed
    //if (focus) focus.style("display", "none");
    if (hoverYGridLine) hoverYGridLine.style("display", "none");
    if (hoverXGridLine) hoverXGridLine.style("display", "none");
    if (xAxisSliderGroup) xAxisSliderGroup.style('display', 'none');
    if (yAxisSliderGroup) yAxisSliderGroup.style("display", 'none');
    if (tooltip) tooltip.style('display', 'none');

    // show aggregated table when not hovering the chart
    showAggregatedSegmentsDetails(args, initialConfig, color);
  }
  xScale.invert = function (x) {
    return d3.scaleQuantize().domain(this.range()).range(this.domain())(x);
  };
  yScale.invert = function (y) {
    return d3.scaleLinear().domain(this.range()).range(this.domain())(y);
  };
  function handleChartMouseMove() {


    if (chartHoverLocked) return false; //if locked no hover allowed
    var x0, y0, i, d1, d;
    var mouseX = d3.mouse(this)[0];
    var mouseY = d3.mouse(this)[1];

    //x0 - val, i= index, d0 - prev data obj, d1 - current data obj
    x0 = xScale.invert(mouseX);
    y0 = yScale.invert(mouseY);
    //  console.log(x0 , y0 , 'x , y')
    if (x0 == undefined || y0 == undefined) return

    i = args.data.findIndex((e) => {
      if (args.xaxiskey == 'date') {
        return e[args.xaxiskey].toDateString() == x0.toDateString()
      }
      else {
        return e[args.xaxiskey] == x0
      }

    });
    d1 = args.data[i];
    try {
      d = d1
    } catch (error) {
      //do nothhing
    }

    var mouse = d3.mouse(this);
    var xValOnMouseMove = xScale.invert(mouse[0]);

    var xAxisVal;
    if (args.xaxiskey === 'date') {
      var date = new Date(xValOnMouseMove);
      xAxisVal = parseDate(date);
    } else {
      xAxisVal = xValOnMouseMove;
    }
    if (!d) return
    var yAxisValue = d[args.yaxiskey]

    var chartWidth = width - 80;
    var chartXPos = 0;

    //show horizontal line on mouse hover on chart
    hoverYGridLine.style('display', 'block')
      .attr("transform", "translate(" + initialConfig.chartLeftPadding + "," + mouseY + ")");
    hoverYGridLine.select('.y-hover-line')
      .attr('x1', -initialConfig.chartLeftPadding + xStartPoint)
      .attr('x2', (xEndPoint - initialConfig.chartLeftPadding));

    //show vertical line on mouse hover on chart
    hoverXGridLine.style('display', 'block')
      .attr("transform", "translate(" + mouseX + "," + initialConfig.chartTopPadding + ")");
    hoverXGridLine.select('.x-hover-line')
      .attr('y1', 0)
      .attr('y2', innerHeight + 4);

    //x-axis - slider elements
    if (xAxisSliderGroup) {
      let max_xslider_width = innerWidth; //innerWidth
      let xaxis_text = xAxisVal
      // let xaxis_box_width = calculateTextWidth(xaxis_text, tickSliderFontSize+'px Poppins, "Open Sans", sans-serif, helvetica');
      let xaxis_box_width = calculateTextWidth(xaxis_text, tickSliderFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica') + xAxisSliderRectWidthPadding;
      xaxis_box_width = xaxis_box_width <= max_xslider_width ? xaxis_box_width : max_xslider_width;

      // let xAxisLeftPadding = (icon_width + 2);
      let xAxisLeftPadding = 0;
      let xTickValPosOrg = xScale(d[args.xaxiskey]);
      // console.log(xTickValPosOrg)
      let xTickValPos = xTickValPosOrg;
      let xTickValAvailableWidth = (width - initialConfig.chartRightPadding - xTickValPosOrg);

      // adjust starting bars x slider left position
      let lockIconXPos = 0;
      let leftMouseXScrollPos = (mouseX - initialConfig.chartLeftPadding - (initialConfig.inbetweenChartAndYAxisPadding + 1));
      xTickValPos = xTickValPosOrg - xaxis_box_width / 2 - xAxisLeftPadding / 2; //default

      if (leftMouseXScrollPos <= xaxis_box_width / 2) { // left position
        let leftAvailableWidth = xTickValPosOrg - initialConfig.chartLeftPadding - initialConfig.inbetweenChartAndYAxisPadding;
        xTickValPos = xTickValPosOrg - leftAvailableWidth;
        xAxisLeftPadding = 0;
        lockIconXPos = xaxis_box_width + 2;
      }
      // adjust end bars x slider right position
      if (xTickValAvailableWidth <= xaxis_box_width / 2) { // adjust end bars x slider right position
        // xTickValPos = xTickValPosOrg - xaxis_box_width - chartRightPadding + inbetweenChartAndYAxisPadding + xTickValAvailableWidth;
        // xTickValPos = (width - chartRightPadding - (xaxis_box_width + xAxisLeftPadding - 1));
        xTickValPos = (width - initialConfig.chartRightPadding - xaxis_box_width);
      }

      //x-axis slider tick elements
      if (xTickValPos > (innerWidth - xaxis_box_width / 2 + 5)) {
        xTickValPos = (innerWidth - xaxis_box_width / 2 + 5);
      } else if (xTickValPos < (initialConfig.chartLeftPadding + 5)) {
        xTickValPos = initialConfig.chartLeftPadding + 5;
      }

      let xAxisSliderTextPos = (xAxisLeftPadding + 5);
      xAxisSliderGroup.attr("transform", "translate(" + parseInt(xTickValPos) + "," + parseInt(xAxisBottomPos - xAxisSliderRectWidthPadding) + ")").style('display', 'block'); // bgBottomPadding is extra bg rect padding
      xAxisSliderGroup.select(".hover-line-status").attr("x", lockIconXPos).attr("y", initialConfig.tickSliderPadding); //lock icon position

      async function renderXSliderText() {
        xHoverRectText
          .text(xaxis_text)
          .attr("dy", "1em")
          .attr('x', xAxisSliderTextPos)
          .attr('y', 10)
          .style('text-align', 'center')
          .call(trimFromAnyCharacter, xaxis_box_width)
          .style('display', 'block');
      }
      renderXSliderText().then(() => {
        xHoverRect
          .attr('width', xaxis_box_width)
          .attr('height', xTickSliderHeight)
          .attr('x', xAxisLeftPadding)
          .attr('y', 4)
          .style('text-align', 'center')
          .style('display', 'block');
      });
    }

    // y-axis
    if (yAxisSliderGroup) {
      // let yval_digits_count = getDigitsCount(d[args.yaxiskey]);
      let yval_digits_count = getDigitsCount(y0);
      let round_var = yval_digits_count - 2;
      let rounded_val = Math.round(y0 * Math.pow(10, round_var) / Math.pow(10, round_var));
      let yaxis_text = formatNumber(rounded_val);
      let yaxis_box_width = calculateTextWidth(yaxis_text, tickSliderFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica') + 4 + 10;
      let yaxis_box_left_pos = 3;

      let ySliderPos = (mouseY - 2);
      if (ySliderPos < 6) {
        ySliderPos = 6;
      } else if (ySliderPos > (innerHeight - 7)) {
        ySliderPos = innerHeight - 7;
      }

      yAxisSliderGroup.attr("transform", "translate(" + yaxis_box_left_pos + "," + ySliderPos + ")").style('display', 'block'); // bgBottomPadding is extra bg rect padding
      yHoverRect
        .attr('width', (initialConfig.chartLeftPadding + 5))
        .attr('x', 0)
        .attr('y', -(initialConfig.tickHoverBoxHeight / 2))
        .style('display', 'block');
      yHoverRectText.text(yaxis_text)
        .attr('x', (initialConfig.chartLeftPadding - yaxis_box_width + 5))
        .attr('y', yTickSliderTextPosTop)
        .style('display', 'block');
    }

    //Draw multi-lines (isSegmented is being used to draw segmented like table to show hover values)
    let textLinesCount;
    if (isSegmented) {
      let inViewPoints = [];
      var xPos, yPos
      areaPointWrapper.selectAll('.area')
        .each(() => {
          const pt = d3.select(this);
          xPos = mouseX
          yPos = mouseY
          const segment = pt.attr(`data-${chartSegmentation}`); // only available when segmentation is ON
          if (xPos >= 0 && xPos <= width && yPos >= 0 && yPos <= innerHeight) {
            inViewPoints.push({ xPos, yPos, segment, xVal: xScale.invert(xPos), yVal: yScale.invert(yPos), ptColor: pt.attr("fill") });
          }
        });
      let [pointToFocusOnMouseMove] = findNearesetPointToMouse(inViewPoints, d3.mouse(this));
      // If Segementation is ON,find the points which lie exactly at the same point as 'pointToFocusOnMouseMove'
      // const superImposingPoints = chartSegmentation ? inViewPoints.filter((p, i) => i !== pointToFocusOnMouseMoveIndex && p.xPos === pointToFocusOnMouseMove.xPos && p.yPos === pointToFocusOnMouseMove.yPos) : [];

      if (!pointToFocusOnMouseMove) return;
      let xAxisHoverGrpPos = pointToFocusOnMouseMove.xPos;
      let yAxisHoverGrpPos = pointToFocusOnMouseMove.yPos;

      //Sort segmentated values
      var dataValuesIndex = dataNest.findIndex((e) => args.xaxiskey === 'date' ? parseDate(e.values[0][args.xaxiskey]) === xAxisVal : e.values[0][args.xaxiskey] === xAxisVal);
      if (dataValuesIndex > -1) {
        var dataValues = dataNest[dataValuesIndex]['values'];

        //show legend information in table format
        showHoverSegmentDetails(args, initialConfig, dataValues, d, xAxisVal, xValOnMouseMove, color, 'bar');
      }

      //show legend information in table format
      //showHoverSegmentDetails(args, initialConfig, segData, d, xAxisVal, xValOnMouseMove, color, 'area');
      //Show Tooltip
      if (args.pointSelectionModeOn) {
        tooltip_text = 'Click to select';
      } else {
        tooltip_text = args.yaxiskey + ': ' + args.chartCurrencySymbol + numberWithCommas(parseFloat(pointToFocusOnMouseMove.yVal).toFixed(2)) + args.chartPercentSymbol; //details;
      }
      tooltip_text_width = calculateTextWidth(tooltip_text, toolTipFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica');
      tooltip_width = Math.min(tooltip_text_width + (2 * initialConfig.tickSliderPadding), initialConfig.maxTooltipWidth);
      const tooltipDistFromPoint = 4;
      const widthAvailableAtBottomOfPointInFocus = innerHeight - yAxisHoverGrpPos;
      const widthAvailableAtLeftOfPointInFocus = xAxisHoverGrpPos + initialConfig.inbetweenChartAndXAxisPadding;
      const widthAvailableAtRightOfPointInFocus = innerWidth + initialConfig.inbetweenChartAndXAxisPadding - widthAvailableAtLeftOfPointInFocus;

      // first just set the text so that we can count the lines produced
      tooltipRectText.text(tooltip_text).call(wrapFromAnyCharacter, tooltip_text_width);

      textLinesCount = tooltipRectText.selectAll('tspan').size();
      textLinesCount = (textLinesCount === undefined || textLinesCount === 0) ? 1 : textLinesCount;
      const tooltip_height = textLinesCount * initialConfig.tooltipHeight + textLinesCount;

      if (widthAvailableAtBottomOfPointInFocus < tooltip_height + tooltipDistFromPoint) {
        tooltip_top = - (tooltip_height + tooltipDistFromPoint);
      } else {
        tooltip_top = tooltipDistFromPoint;
      }

      chartXPos = (xScale(xValOnMouseMove) + tooltip_width);
      if (widthAvailableAtRightOfPointInFocus < tooltip_width + tooltipDistFromPoint) {
        tooltip_left = - (tooltip_width + tooltipDistFromPoint);
      } else {
        tooltip_left = tooltipDistFromPoint;
      }

      //show tooltip in bottom on extra small widget size
      if (!initialConfig.showXAxisTicks) {
        tooltip_left = 0;
        // tooltip_top = xAxisBottomPos;
        tooltip_top = 0;
        xAxisHoverGrpPos = 0;
        yAxisHoverGrpPos = xAxisBottomPos;
      }

      //show hover indicator and tooptip
      tooltip.style('display', 'block').attr('transform', `translate(${xAxisHoverGrpPos},${yAxisHoverGrpPos})`);
      tooltipRect.attr('x', tooltip_left)
        .attr('y', tooltip_top)
        .attr('width', tooltip_width)
        .attr('height', tooltip_height)
        .style('display', initialConfig.showXAxisTicks ? 'block' : 'none');
      tooltipRectText
        .attr('x', tooltip_left)
        .attr('y', tooltip_top)
        .attr('fill', (initialConfig.showXAxisTicks) ? '#000' : '#fff')
        .attr('dx', initialConfig.tickSliderPadding + (textLinesCount > 1 ? 2 : 0))
        .attr('dy', '1em')
        .style('display', 'block');

    } else {
      //show highlighted circle on hover
      yAxisValue = parseFloat(yScale.invert(mouseY)).toFixed(2)
      // Remove focus pointer
      // focus.attr("transform", "translate(" + xScale(d[args.xaxiskey]) + "," + yScale(yAxisValue) + ")");
      if (args.pointSelectionModeOn) {
        tooltip_text = 'Click to select';
      } else {
        tooltip_text = args.yaxiskey + ': ' + args.chartCurrencySymbol + numberWithCommas(yAxisValue) + args.chartPercentSymbol; //details;
      }
      tooltip_text_width = calculateTextWidth(tooltip_text, toolTipFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica');
      tooltip_width = tooltip_text_width + 4;
      tooltip_width = tooltip_width <= initialConfig.maxTooltipWidth ? tooltip_width : initialConfig.maxTooltipWidth;
      tooltip_pos_adjustment = initialConfig.tooltipHeight + (initialConfig.inbetweenChartAndXAxisPadding < 5 ? 5 : initialConfig.inbetweenChartAndXAxisPadding);
      tooltip_top = (yScale(yAxisValue) - tooltip_pos_adjustment); //if totalVal is set use that position else use individual bar/bar_block position
      tooltip_top = tooltip_top < 0 ? (yScale(yAxisValue) + initialConfig.tooltipHeight / 2) : tooltip_top;

      chartXPos = (xScale(xValOnMouseMove) + tooltip_width);
      tooltip_left = chartXPos > chartWidth ? Math.ceil(xScale(xValOnMouseMove) - tooltip_width) - 5 : Math.ceil(xScale(xValOnMouseMove)) + 5;

      //show tooltip in bottom on extra small widget size
      if (!initialConfig.showXAxisTicks) {
        tooltip_left = 0;
        tooltip_top = xAxisBottomPos;
      }

      //show hover indicator and tooptip
      let textLinesCount = 1;
      tooltip.style('display', 'block').attr("transform", "translate(" + (tooltip_left) + "," + (tooltip_top) + ")");
      async function renderTooltipText() {
        tooltipRectText
          .text(tooltip_text)
          .attr("dy", "1em")
          .attr('x', 2)
          .attr('fill', (initialConfig.showXAxisTicks) ? '#000' : '#fff')
          .call(wrapFromAnyCharacter, tooltip_width)
          .style('display', 'block');
        textLinesCount = tooltipRectText.selectAll('tspan').size();
        textLinesCount = (textLinesCount === undefined || textLinesCount === 0) ? 1 : textLinesCount;
      }
      renderTooltipText().then(() => {
        tooltipRect
          .attr('width', tooltip_width)
          .attr('height', textLinesCount * (toolTipFontSize + 2) + textLinesCount) //increase height of rectangle as per text
          .attr('x', 0)
          .attr('y', 0)
          .style('display', initialConfig.showXAxisTicks ? 'block' : 'none');
      });
    }
  }
}
/**************************
 * Draw Chart functions
 */

/* Draw bar chart
- padding: padding,
- width: width
- height: height
- indivisualChartHeight: indivisualChartHeight,
- yaxiskey: chart_ykey,
- xaxiskey: item.x_axis.id,
- data: chartsData[chart_ykey],
- chartSegmentation: chartsSegmentation[chart_ykey]
*/
function drawBarChart(args) {
  //chart initial settings variables
  const initialConfig = getInitialChartConfig(args);
  if (!initialConfig) return;

  //basic configurations
  let width = args.chartWrapper.current.offsetWidth;
  let innerWidth = width - (initialConfig.chartLeftPadding + initialConfig.chartRightPadding + initialConfig.inbetweenChartAndYAxisPadding);
  let chartWrapperHeight = d3.select('#chart-' + args.unique_key).node().getBoundingClientRect().height;
  let height = chartWrapperHeight - initialConfig.chartWidgetBottomPadding - initialConfig.chartHeadingSectionHeight;
  if (args.excludeChartHeader !== undefined) { // if chart width is less than default add removed chart header+margin heightto chart height
    height = height + initialConfig.chartInnerHeadingSectionHeightWithMargin + (initialConfig.chartWidgetBottomPadding - 5);
  }
  let innerHeight = (height - initialConfig.chartBottomPadding - initialConfig.chartTopPadding);
  let xAxisBottomPos = (height - initialConfig.chartBottomPadding + initialConfig.inbetweenChartAndXAxisPadding);
  d3.select(args.chartWrapper.current).style("height", height + 'px'); //set chart height

  //Chart icons
  let iconLock = '<g class="nc-icon-wrapper" fill="#ff0000" transform="translate(0, 0)"><path d="M21,10H18V6.01A5.96,5.96,0,0,0,12.1,0h-.09A5.94,5.94,0,0,0,6,5.9V10H3a1,1,0,0,0-1,1V23a1,1,0,0,0,1,1H21a1,1,0,0,0,1-1V11A1,1,0,0,0,21,10Zm-9,9a2,2,0,1,1,2-2A2,2,0,0,1,12,19Zm4-9H8V5.91A3.957,3.957,0,0,1,11.959,2h.131A3.957,3.957,0,0,1,16,6Z" fill="#ff0000"></path></g>';
  let iconUnlock = '<g class="nc-icon-wrapper" fill="#00ff7f" transform="translate(0, 0)"><path d="M21,10H8V5.91A3.957,3.957,0,0,1,11.959,2h.131A3.955,3.955,0,0,1,16,5.99l2,.02A5.96,5.96,0,0,0,12.1,0h-.09A5.94,5.94,0,0,0,6,5.9V10H3a1,1,0,0,0-1,1V23a1,1,0,0,0,1,1H21a1,1,0,0,0,1-1V11A1,1,0,0,0,21,10Zm-9,9a2,2,0,1,1,2-2A2,2,0,0,1,12,19Z" fill="#00ff7f"></path></g>';

  let currentCanvasSize = (window.innerWidth - 10);
  let isFitToWidthMode = (args.screen && !args.isDashboardInEditMode && (args.viewModeType !== undefined && args.viewModeType.name === 'Fit to Width'));
  let tickFontSize = isFitToWidthMode ? Math.round(10 * currentCanvasSize / args.screen) : 10;
  let xAxisTickStartPos = isFitToWidthMode ? Math.round(75 * currentCanvasSize / args.screen) : 75;
  let yAxisTickTopPos = isFitToWidthMode ? Math.round(5 * currentCanvasSize / args.screen) : 5;
  let tickSliderFontSize = isFitToWidthMode ? Math.round(11 * currentCanvasSize / args.screen) : 10;
  let toolTipFontSize = isFitToWidthMode ? Math.round(11 * currentCanvasSize / args.screen) : 11;

  //Define charts configs
  let isSegmented = (args.chartSegmentation && args.chartSegmentation !== '' && args.chartSegmentation !== 'all' && args.chartSegmentation !== ' ');
  let chartSegmentation = isSegmented ? args.chartSegmentation : '';
  let chartHoverLocked = false;
  let defaultBarColor = (args.chartFormat.color && args.chartFormat.color.single_color !== '') ? args.chartFormat.color.single_color : chartColors[0]; //pick selected color
  let color = getColor(args); //Set Color Scales
  let parseDate = d3.timeFormat("%m.%d.%Y"),
    parsedDateString = d3.timeFormat("%d %b %Y"),
    formatYNumber = d3.format("");

  //Data variable
  let chartMainData = [...args.data];
  let barWidthObj = getBarWidth(innerWidth, chartMainData);
  let barWidth = barWidthObj.width;
  let barPadding = barWidthObj.padding;

  //Define SVG and group element
  let svg = getSVGElement(args.chartWrapper.current, width, height);
  let chart = getGroupElement(svg, args.yaxiskey);

  //Scaling Points - start and end
  let xStartPoint = initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndYAxisPadding;
  let xEndPoint = (width - initialConfig.chartRightPadding);
  let yStartPoint = xAxisBottomPos - initialConfig.inbetweenChartAndXAxisPadding - 1;
  let yEndPoint = initialConfig.chartTopPadding;

  let yScaleLimits;
  let series;
  let segmentedBarHeights = {};
  let segmentedBarBlocksYPos = {};
  let segmentedBarBlocksHeight = {};

  //Define X-Axis for each chart - date/string
  let xDomains = args.data.map((d) => d[args.xaxiskey]);
  let xAxisTickValues = getXAxisTickValues(initialConfig, xDomains, chartMainData, args); // get x axis calculated tick values
  let dataNest;

  // Individual Chart Elements - background rect, y axis line, x axis line to merge both x ans y axis corner
  let bgBottomPadding = 2;
  chart.append('rect')
    .attr('width', innerWidth)
    .attr('height', innerHeight + bgBottomPadding)
    .attr('x', initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndYAxisPadding)
    .attr('y', initialConfig.chartTopPadding)
    .attr('class', 'chart-bg');

  //Add the chartHoverTrackPad before when it is segmented
  if (isSegmented) {
    var chartHoverTrackPad = chart.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight + 1)
      .attr('x', initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndYAxisPadding)
      .attr('y', initialConfig.chartTopPadding)
      .attr('opacity', 0)
      .on("mouseout", handleChartMouseOut)
      .on("mousemove", handleChartMouseMove)
      .on("click", handleChartLock);
  }

  // Nest the entries by symbol
  if (isSegmented) { //Draw stacked bar chart
    chartSegmentation = args.isComparisonEnabled ? 'id' : chartSegmentation
    dataNest = d3.nest().key((d) => d[args.xaxiskey])
      .entries(chartMainData);
    barWidthObj = getBarWidth(innerWidth, dataNest);
    barWidth = barWidthObj.width;
    barPadding = barWidthObj.padding;

    // console.log('nest data length: '+dataNest.length+', new bar org width: '+barOrgWidth+', bar width after padding: '+barWidthAfterPadding+', bar padding: '+barPadding);
    let formattedData = [];
    dataNest.forEach((item) => {
      let obj = {};
      obj[args.xaxiskey] = item.values[0][args.xaxiskey];
      item.values.forEach((subitem) => {
        obj[subitem[chartSegmentation]] = subitem[args.yaxiskey];
      })
      formattedData.push(obj);
    });

    let segments = [];
    if (formattedData.length > 0) {
      formattedData.forEach((item) => {
        Object.keys(item).forEach((subitem) => {
          if (!segments.includes(subitem)) {
            segments.push(subitem);
          }
        })
      });
    }

    let xaxis_key_index = segments.findIndex((x) => x === args.xaxiskey);
    if (xaxis_key_index > -1) {
      segments.splice(xaxis_key_index, 1);
    }

    // set up stack method
    const stack = d3.stack().keys(segments);
    series = stack(formattedData);

    //get x axis ticks
    xDomains = formattedData.map((d) => d[args.xaxiskey]);
    xAxisTickValues = getXAxisTickValues(initialConfig, xDomains, chartMainData, args);

    //get y axis ticks
    let minVal = d3.min(series, (d) => d3.min(d, (d) => d[1]));
    let maxVal = d3.max(series, (d) => d3.max(d, (d) => d[1]));
    let range = (maxVal - minVal);
    yScaleLimits = { 'lowerLimit': 0, 'upperLimit': maxVal + (0.10 * range) };
    if (args.chartFormat.yaxis.min !== '' && args.chartFormat.yaxis.min !== 0) { yScaleLimits['lowerLimit'] = args.chartFormat.yaxis.min; }
    if (args.chartFormat.yaxis.max !== '' && args.chartFormat.yaxis.max !== 0) { yScaleLimits['upperLimit'] = args.chartFormat.yaxis.max; }

  } else {
    yScaleLimits = (args.isEmpty === undefined && args.data.length > 0) ? getMinMaxRange(chartMainData, args.yaxiskey, 'bar') : { lowerLimit: 0, upperLimit: 10 };
    if (args.chartFormat.yaxis.min !== '' && args.chartFormat.yaxis.min !== 0) { yScaleLimits['lowerLimit'] = args.chartFormat.yaxis.min; }
    if (args.chartFormat.yaxis.max !== '' && args.chartFormat.yaxis.max !== 0) { yScaleLimits['upperLimit'] = args.chartFormat.yaxis.max; }
  }

  /* Define and create xScale, xAxis, ticks */
  let xScale;
  let xAxis;
  async function defineXScale() {
    //Set the scales
    xScale = d3.scaleBand()
      .domain(xDomains)
      .range([xStartPoint, xEndPoint])
      .paddingInner(.25)
      .paddingOuter(.25)
      .align(0.5);
    // .round(true);

    //Define the ticks
    xAxis = d3.axisBottom(xScale)
      .tickValues(xAxisTickValues)
      .tickSize(0)
      .tickPadding(5)
      .tickFormat((args.xaxiskey === 'date' ? d3.timeFormat("%m.%d.%Y") : (d) => (typeof d === 'string') ? d.substring(0, 10) : d));

    //Draw x-axis
    chart.append("g")
      .attr("class", "axis x-axis")
      .attr("transform", "translate(0, " + xAxisBottomPos + ")") //start with 10px instead of 0
      .call(xAxis)
      .attr('font-size', tickFontSize + 'px');
  }
  defineXScale().then(() => {
    //Change x axis first and last tick position
    alignXAxisTicks(width, args.unique_key, initialConfig, xAxisTickValues, xDomains, parseDate, tickFontSize, xAxisTickStartPos);
  });

  /* Define and create yScale, yAxis, ticks */
  let y_steps = args.yAxisTicksCount !== undefined ? args.yAxisTicksCount : initialConfig.defaultYAxisTicksCount;
  if (args.chartFormat.yaxis.tick !== '' && args.chartFormat.yaxis.tick > 0) {
    y_steps = Math.floor(yScaleLimits['upperLimit'] / args.chartFormat.yaxis.tick) + 1;
  }

  let hasCustomFormat = (args.chartFormat.yaxis.tick || args.chartFormat.yaxis.min || args.chartFormat.yaxis.max) ? true : false;
  let customTickInterval = hasCustomFormat ? args.chartFormat.yaxis.tick : null;
  let yDomains = (y_steps > 1) ? getTickValues(yScaleLimits['lowerLimit'], yScaleLimits['upperLimit'], y_steps, hasCustomFormat, customTickInterval) : [];
  let yTickValues = (initialConfig.showYAxisTicks) ? [...yDomains] : [];
  let yScale;
  let yAxis;

  async function defineYScale() {
    //Define y scale
    let upperYLimit = args.chartSizeClass === "xs-grid-width" ? yScaleLimits['upperLimit'] : yTickValues[yTickValues.length-1];
    yScale = d3.scaleLinear()
      .domain([yScaleLimits['lowerLimit'], upperYLimit])//yScaleLimits['upperLimit']])
      .range([yStartPoint, yEndPoint]);

    //Define y axis ticks
    yAxis = d3.axisLeft(yScale)
      .tickValues(yTickValues)
      .tickSize(0)
      .tickFormat((d) => formatNumber(formatYNumber(d)))
      .tickPadding(3);

    //Draw y axis
    chart.append("g")
      .attr("class", "axis y-axis")
      .attr("transform", "translate(" + initialConfig.chartLeftPadding + ",0)")
      .call(yAxis)
      .attr('font-size', tickFontSize + 'px');
  }
  defineYScale().then(() => {
    //Change x axis first and last tick position
    alignYAxisTicks(innerHeight, args.unique_key, initialConfig, yAxisTickTopPos);
  });

  //if no data available
  if (args.isEmpty) {
    chart.append("text")
      .attr("y", ((height / 2)))
      .attr("x", (width / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text('No data available')
      .style("fill", "#fff")
      .attr("class", "no-data");
  }


  //return from here if data is not available
  if (!args.data || args.data.length === 0) return;

  // Nest the entries by symbol
  if (isSegmented) { //Draw stacked bar chart
    // Add a group for each row of data
    const barWrapper = chart.selectAll("g.barwrapper").data(series).enter().append("g")
      .style("fill", (d) => {
        return (series.length > 1) ? color(d.key) : defaultBarColor;
      })
      .attr("transform", `translate(0,0)`);

    // Add a rect for each data value
    barWrapper.selectAll("rect").data((d) => d).enter().append("rect")
      // .attr("class", function(d){ return "barblock " + d.data[args.xaxiskey] }) // Add a class to each subgroup: their name
      .attr("class", 'bar-block')
      .attr("x", function (d) {
        return xScale(d.data[args.xaxiskey]);
      })
      .attr("y", function (d) {
        if (yScale(d[1]) === undefined) return;

        let y_pos = (series.length > 1) ? yScale(d[1]) : yScale(d[1]);
        if (series[0].length === 1) { // when there is only one element in select x-axis dimension
          y_pos = y_pos - initialConfig.chartTopPadding;
        }

        y_pos = parseFloat(y_pos).toFixed(2);
        segmentedBarBlocksYPos[d.data[args.xaxiskey]] = segmentedBarBlocksYPos[d.data[args.xaxiskey]] ? segmentedBarBlocksYPos[d.data[args.xaxiskey]] + ',' + y_pos : y_pos;
        return y_pos;
      })
      .attr("height", function (d) {
        if (yScale(d[1]) === undefined) return;

        let bar_height = 0;
        if (series.length > 1) {
          bar_height = yScale(d[0]) - yScale(d[1])
        } else {
          bar_height = Number.parseFloat(innerHeight + initialConfig.chartTopPadding - yScale(d[1])).toFixed(2);
        }
        if (series[0].length === 1) {  // when there is only one element in select x-axis dimension
          bar_height = yScale(d[0]) - yScale(d[1]);
        }
        bar_height = bar_height > 0 ? bar_height : 0;
        if (bar_height < 1) bar_height = .5;

        segmentedBarHeights[d.data[args.xaxiskey]] = segmentedBarHeights[d.data[args.xaxiskey]] ? segmentedBarHeights[d.data[args.xaxiskey]] + bar_height : bar_height;
        segmentedBarBlocksHeight[d.data[args.xaxiskey]] = segmentedBarBlocksHeight[d.data[args.xaxiskey]] ? segmentedBarBlocksHeight[d.data[args.xaxiskey]] + ',' + bar_height : bar_height;
        return bar_height;
      })
      .attr("width", barWidth)
      .on("mousemove", stackBarMouseMove)
      .on("mouseout", handleChartMouseOut)
      .on("click", handleChartLock);


    //convert values from string to arrray
    if (Object.keys(segmentedBarBlocksHeight).length > 0) {
      Object.keys(segmentedBarBlocksHeight).forEach((item) => {
        if (typeof segmentedBarBlocksHeight[item] === 'string') {
          segmentedBarBlocksHeight[item] = segmentedBarBlocksHeight[item].split(',');
        }
      });
    }

    if (Object.keys(segmentedBarBlocksYPos).length > 0) {
      Object.keys(segmentedBarBlocksYPos).forEach((item) => {
        if (typeof segmentedBarBlocksYPos[item] === 'string') {
          segmentedBarBlocksYPos[item] = segmentedBarBlocksYPos[item].split(',');
        }
      });
    }
    /* End Version 2 */

  } else {
    //draw chart here
    chart.selectAll("bar")
      .data(chartMainData)
      .enter()
      .append("rect")
      .style("fill", defaultBarColor)
      .attr("width", barWidth)
      .attr("class", function (d) {
        return 'bar ' + d[args.xaxiskey];
      })
      .attr("x", function (d) {
        return xScale(d[args.xaxiskey]) - ((barPadding / 2) / 2);
      })
      .attr("y", function (d) {
        let yVal = d[args.yaxiskey];
        if (args.chartFormat.yaxis.max && args.chartFormat.yaxis.max > 0 && yVal > args.chartFormat.yaxis.max) {
          yVal = args.chartFormat.yaxis.max;
        }
        if (args.chartFormat.yaxis.min && args.chartFormat.yaxis.min > 0 && yVal < args.chartFormat.yaxis.min) {
          yVal = args.chartFormat.yaxis.min;
        }
        let y = Number.parseFloat(innerHeight - Number.parseFloat(innerHeight - yScale(yVal)).toFixed(2)).toFixed(2);
        if (y < 0) y = 0;
        return y;
      })
      .attr("height", function (d) {
        let yVal = d[args.yaxiskey];
        if (args.chartFormat.yaxis.max && args.chartFormat.yaxis.max > 0 && yVal > args.chartFormat.yaxis.max) {
          yVal = args.chartFormat.yaxis.max;
        }
        if (args.chartFormat.yaxis.min && args.chartFormat.yaxis.min > 0 && yVal < args.chartFormat.yaxis.min) {
          yVal = args.chartFormat.yaxis.min;
        }
        let height = Number.parseFloat(innerHeight - yScale(yVal) + initialConfig.chartTopPadding).toFixed(2);
        if (height < 0) height = 0;
        return height;
      })
  }

  function stackBarMouseMove(d) {
    if (chartHoverLocked) return false; //if locked no hover allowed
    var y0;
    var mouseX = d3.mouse(this)[0];
    var mouseY = d3.mouse(this)[1];

    //x0 - val, i= index, d0 - prev data obj, d1 - current data obj
    // x0 = xScale.invert(mouseX);
    y0 = yScale.invert(mouseY);
    // i = args.data.findIndex((e) => e[args.xaxiskey] === x0);
    // d1 = args.data[i];

    var mouse = d3.mouse(this);
    xValOnMouseMove = xScale.invert(mouse[0]);

    var xAxisVal;
    if (args.xaxiskey === 'date') {
      var date = new Date(xValOnMouseMove);
      xAxisVal = parsedDateString(date);
    } else {
      xAxisVal = xValOnMouseMove;
    }

    var subgroupName = d3.select(this.parentNode).datum().key;
    var subgroupValue = d.data[subgroupName];

    // Reduce opacity of all rect to 0.2
    // d3.selectAll(".barblock").style("opacity", 0.2)
    // // Highlight all rects of this subgroup with opacity 0.8. It is possible to select them since they have a specific class = their name.
    // d3.selectAll("."+subgroupName)
    //   .style("opacity", 1)


    let tooltip_text = subgroupName + ': ' + subgroupValue;
    tooltip_text_width = calculateTextWidth(tooltip_text, toolTipFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica');
    var tooltip_width = tooltip_text_width + 2;
    tooltip_width = tooltip_width <= maxTooltipWidth ? tooltip_width : maxTooltipWidth;

    //show hover indicator
    let tooltip_left = parseInt(xScale(xValOnMouseMove));
    tooltip_left = (tooltip_left + tooltip_width) > innerWidth ? (tooltip_left - tooltip_width - barPadding / 2 / 2) : tooltip_left + parseInt(barWidth) + barPadding / 2 / 2;
    let textLinesCount = 1;
    let tooltip_top = (mouseY);
    if ((tooltip_top + initialConfig.tooltipHeight) > innerHeight) {
      tooltip_top = (mouseY - 4 - initialConfig.tooltipHeight);
    }

    if (!initialConfig.showXAxisTicks) {
      tooltip_left = 0;
      tooltip_top = xAxisBottomPos;
    }

    //show hover indicator and tooptip
    tooltip.style('display', 'block').attr("transform", "translate(" + (tooltip_left) + "," + (tooltip_top) + ")");
    async function renderTooltipText() {
      tooltipRectText
        .text(tooltip_text)
        .attr("dy", "1em")
        .attr('x', 2)
        .attr('fill', initialConfig.showXAxisTicks ? '#000' : '#fff')
        .call(wrapFromAnyCharacter, tooltip_width)
        .style('display', 'block');
      textLinesCount = tooltipRectText.selectAll('tspan').size();
      textLinesCount = (textLinesCount === undefined || textLinesCount === 0) ? 1 : textLinesCount;
    }
    renderTooltipText().then(() => {
      tooltipRect
        .attr('width', tooltip_width)
        .attr('height', textLinesCount * initialConfig.tooltipHeight + textLinesCount) //increase height of rectangle as per text
        .attr('x', 0)
        .attr('y', 0)
        .style('display', initialConfig.showXAxisTicks ? 'block' : 'none');
    });


    //show legend details
    //show horizontal cross hair
    //display tick sliders
    //x-axis
    let max_xslider_width = innerWidth; //innerWidth
    let xaxis_text = args.xaxiskey === 'date' ? parsedDateString(xValOnMouseMove) : xValOnMouseMove;
    // let xaxis_box_width = calculateTextWidth(xaxis_text, tickFontSize+'px Poppins, "Open Sans", sans-serif, helvetica');
    let xaxis_box_width = Math.round(calculateTextWidth(xaxis_text, tickSliderFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica') + xAxisSliderRectWidthPadding);
    xaxis_box_width = xaxis_box_width <= max_xslider_width ? xaxis_box_width : max_xslider_width;

    let xAxisLeftPadding = barPadding;
    let xTickValPosOrg = xScale(xValOnMouseMove);
    let xTickValPos = xTickValPosOrg;
    let xTickValAvailableWidth = (width - initialConfig.chartRightPadding) - xTickValPos - (barPadding / 2 / 2);

    if (barWidth < xaxis_box_width / 2) {
      xTickValPos = xTickValPos - (xaxis_box_width / 2) + (barWidth / 2);
    } else {
      xTickValPos = xTickValPos - (barPadding / 2 / 2) + (barWidth / 2) - (xaxis_box_width / 2);
    }

    // adjust starting bars x slider left position
    let lockIconXPos = 0;
    let leftMouseXScrollPos = (mouseX - initialConfig.chartLeftPadding - (initialConfig.inbetweenChartAndYAxisPadding + 1));
    xTickValPos = xTickValPosOrg - (barPadding / 2 + 1) - xaxis_box_width / 2 + xAxisLeftPadding / 2; //default
    if (leftMouseXScrollPos <= xaxis_box_width / 2) { // left position
      let leftAvailableWidth = xTickValPosOrg - initialConfig.chartLeftPadding - initialConfig.inbetweenChartAndYAxisPadding;
      xTickValPos = xTickValPosOrg - leftAvailableWidth;
      xAxisLeftPadding = 0;
      lockIconXPos = xaxis_box_width + 2;
    }

    // adjust end bars x slider right position
    if (xTickValAvailableWidth <= xaxis_box_width / 2) { // adjust end bars x slider right position
      xTickValPos = (width - initialConfig.chartRightPadding - (xaxis_box_width + xAxisLeftPadding - 1));
    }

    //x-axis slider tick elements
    if (xTickValPos > (innerWidth - xaxis_box_width / 2 + 5)) {
      xTickValPos = (innerWidth - xaxis_box_width / 2 + 5);
    } else if (xTickValPos < (initialConfig.chartLeftPadding + 5)) {
      xTickValPos = initialConfig.chartLeftPadding + 5;
    }

    if (xAxisSliderGroup !== undefined) {
      var xAxisSliderTextPos = (xAxisLeftPadding + 5);
      xAxisSliderGroup.attr("transform", "translate(" + parseInt(xTickValPos) + "," + parseInt(xAxisBottomPos - 8) + ")").style("display", "block");
      xAxisSliderGroup.select(".hover-line-status").attr("x", lockIconXPos).attr("y", initialConfig.tickSliderPadding); //lock icon position

      async function renderXSliderText() {
        xHoverRectText
          .text(xaxis_text)
          .attr("dy", "1em")
          .attr('x', xAxisSliderTextPos)
          .attr('y', 10)
          .style('text-align', 'center')
          .call(trimFromAnyCharacter, xaxis_box_width)
          .style('display', 'block');
      }
      renderXSliderText().then(() => {
        xHoverRect
          .attr('width', xaxis_box_width)
          .attr('height', xTickSliderHeight)
          .attr('x', xAxisLeftPadding)
          .attr('y', 4)
          .style('text-align', 'center')
          .style('display', 'block');
      });
    }


    //show mouse hover lines on chart
    hoverYGridLine.style('display', 'block')
      .attr("transform", "translate(" + initialConfig.padding + "," + (parseInt(mouseY) - 1) + ")");
    hoverYGridLine.select('.y-hover-line')
      .attr('x1', -initialConfig.padding + xStartPoint)
      .attr('x2', (xEndPoint - initialConfig.padding));

    // y-axis horizoantal line
    let yval_digits_count = getDigitsCount(y0);
    let round_var = yval_digits_count - 2;
    let rounded_val = Math.round(y0 * Math.pow(10, round_var) / Math.pow(10, round_var));
    let yaxis_text = formatNumber(rounded_val);
    let yaxis_box_width = calculateTextWidth(yaxis_text, tickFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica') + 4 + 10;
    let yaxis_box_left_pos = 3; //3 is gapping of 3px

    let ySliderPos = (mouseY - 2);
    if (ySliderPos < 6) {
      ySliderPos = 6;
    } else if (ySliderPos > (innerHeight - 7)) {
      ySliderPos = innerHeight - 7;
    }

    if (yAxisSliderGroup !== undefined) {
      yAxisSliderGroup
        .attr("transform", "translate(" + yaxis_box_left_pos + "," + ySliderPos + ")")
        .style("display", "block"); // bgBottomPadding is extra bg rect padding
      yHoverRect
        .attr('width', (initialConfig.chartLeftPadding - 5 + 10))
        .attr('x', 0)
        .attr('y', -(initialConfig.tickHoverBoxHeight / 2))
        .style('display', 'block');
      yHoverRectText.text(yaxis_text)
        .attr('x', (initialConfig.chartLeftPadding - yaxis_box_width + 6))
        .attr('y', 6)
        .style('display', 'block');
    }


    //show segments details on bar block hover
    if (isSegmented && window.currentSelectedWidget===args.unique_key) {
      dataNest = sortSegmentedData(args, dataNest, xAxisVal);

      //Display Cross Hair Values
      var dataValuesIndex = dataNest.findIndex((e) => args.xaxiskey === 'date' ? parsedDateString(e.values[0][args.xaxiskey]) === xAxisVal : e.values[0][args.xaxiskey] === xAxisVal);
      if (dataValuesIndex > -1) {
        dataValues = dataNest[dataValuesIndex]['values'];

        //show legend information in table format
        showHoverSegmentDetails(args, initialConfig, dataValues, d, xAxisVal, xValOnMouseMove, color, 'bar');
      }
    }
  }

  // function stackBarMouseLeave(d) {
  //   // if (chartHoverLocked) return false; //if locked no hover allowed
  //   // tooltip.style('display', 'none');
  //   handleChartMouseOut();
  // }

  //chart hover highter overlay 
  let barHighlighterOverlay = chart.append("rect")
    .style("fill", 'rgba(0,0,0,.4)')
    .attr("width", parseInt(Math.round(barWidth) + 2))
    .attr("class", 'bar-highlighter-overlay')
    .attr("x", 0)
    .attr("y", 0)
    .attr("height", innerHeight)
    .style('display', 'none');

  /**Draw the marker for notes if chartNotes are available */
  // Helper methods for calculating markers' posotions
  function giveXPositionOfNote(xPoint) {
    return xScale(xPoint) + barWidth / 2 + ((barPadding / 2) / 2) - calculateTextWidth('*', '12px Poppins, "Open Sans", sans-serif, helvetica') / 2 + 1
  }

  function giveYPositionOfNote(xPoint) {
    // Below condition is just to avoid error, actually 'xPoint' should never be null
    if (xPoint === null) { return 0; }

    let y;
    if (args.chartSegmentation) {
      const segmentsCorrespondingToNotePoint = chartMainData.filter(cd => {
        if (args.xaxiskey === 'date') {
          return parseDate(cd[args.xaxiskey]) === parseDate(xPoint)
        }
        return cd[args.xaxiskey] === xPoint
      });
      const segmentsTotal = segmentsCorrespondingToNotePoint.reduce((total, seg) => total + seg[args.yaxiskey], 0);
      y = yScale(segmentsTotal) + initialConfig.chartTopPadding;
    } else {
      const barCorrespondingToNotePoint = chartMainData.find(cd => {
        if (args.xaxiskey === 'date') {
          return parseDate(cd[args.xaxiskey]) === parseDate(xPoint)
        }
        return cd[args.xaxiskey] === xPoint
      });
      y = yScale(barCorrespondingToNotePoint[args.yaxiskey]) + initialConfig.chartTopPadding;
    }
    if (y < 0) y = 0;
    return y;
  }

  // Draw the marker for notes if chartNotes are available
  if (args.chartNotes) {
    var noteMarkersWrapper = chart.append('g').attr('class', 'note-markers');
    noteMarkersWrapper.selectAll('.note-marker')
      .data(args.chartNotes).enter().append('text')
      .text('*')
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('class', 'note-marker')
      .attr('fill', '#ff0000')
      .attr('x', function (d) {
        return giveXPositionOfNote(d.x_axis_point);
      })
      .attr('y', function (d) {
        return giveYPositionOfNote(d.x_axis_point);
      });

    // Append hover circle 
    var noteMarkerHover = noteMarkersWrapper.append('circle').attr('class', 'note-marker-hover').style('display', 'none');
  }


  //bar block hover highlighter element
  let barHoverHighlighter = chart.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', barWidth)
    .attr("height", 0)
    .attr('class', 'bar-highlighter')
    .attr('fill', 'none')
    .style('display', 'none');

  //hover lines
  var hoverYGridLine = chart.append("g").attr("class", "hover-grid-lines").style("display", "none");
  hoverYGridLine.append("line")
    .attr("class", "y-hover-line hover-line")
    .attr("x1", xStartPoint)
    .attr("x2", xEndPoint);

  //x-axis tick slider elements
  let xAxisSliderGroup;
  let xHoverRect;
  let xHoverRectText;
  let xTickSliderWidth = isFitToWidthMode ? Math.round(60 * currentCanvasSize / args.screen) : 60;
  let xTickSliderHeight = initialConfig.xTickSliderHeight;
  let xTickSliderTextPosLeft = isFitToWidthMode ? Math.round(3 * currentCanvasSize / args.screen) : 3;
  let xTickSliderTextPosTop = isFitToWidthMode ? Math.round(4 * currentCanvasSize / args.screen) : 4;
  let xAxisSliderRectWidthPadding = isFitToWidthMode ? Math.round(8 * currentCanvasSize / args.screen) : 8;

  if (initialConfig.showXAxisTicks) {
    xAxisSliderGroup = chart.append("g").attr("class", "xaxis-slider-group").style("display", "none");
    xHoverRect = xAxisSliderGroup.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", xTickSliderWidth)
      .attr("height", xTickSliderHeight)
      .attr("rx", 1)
      .attr("class", 'hover-xaxis-bg')
      .style("display", "none");
    xHoverRectText = xAxisSliderGroup.append("text")
      .attr('font-size', tickSliderFontSize + 'px')
      .text('')
      .attr('x', xTickSliderTextPosLeft)
      .attr('y', xTickSliderTextPosTop)
      .attr("fill", "#fff")
      .attr("class", "hover-xaxis-tick-val")
      .style("display", "none");
  }

  //y-axis hover elements
  let yAxisSliderGroup;
  let yHoverRect;
  let yHoverRectText;
  let yTickSliderHeight = initialConfig.tickHoverBoxHeight + 3;
  let yTickSliderWidth = isFitToWidthMode ? Math.round(30 * currentCanvasSize / args.screen) : 30;
  let yTickSliderRectPosLeft = isFitToWidthMode ? Math.round(5 * currentCanvasSize / args.screen) : 5;
  let yTickSliderTextPosTop = isFitToWidthMode ? Math.round(5 * currentCanvasSize / args.screen) : 5;

  if (initialConfig.showYAxisTicks) {
    yAxisSliderGroup = chart.append("g").attr("class", "yaxis-slider-group").style("display", "none");
    yHoverRect = yAxisSliderGroup.append("rect")
      .attr("x", yTickSliderRectPosLeft)
      .attr("y", 0)
      .attr("width", yTickSliderWidth)
      .attr("height", yTickSliderHeight)
      .attr("rx", 1)
      .attr("class", 'hover-yaxis-bg')
      .style("display", "none");
    yHoverRectText = yAxisSliderGroup.append("text")
      .attr('font-size', tickSliderFontSize + 'px')
      .text('')
      .attr('x', 0)
      .attr('y', 0)
      .attr("fill", "#fff")
      .attr("class", "hover-yaxis-tick-val")
      .style("display", "none");
  }

  //Tooltip 
  let tooltip_text = '';
  let tooltip_text_width = 0;
  let tooltip_top = 0;
  let tooltip_pos_adjustment = 0;
  let tooltip_left = 0;
  
  let tooltip = chart.append("g")
    .attr("class", "tooltip1")
    .attr("transform", "translate(0, 0)");
  let tooltipRect = tooltip.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 0)
    .attr("height", (toolTipFontSize + 2))
    // .attr('fill', '#2e323c')
    .attr('fill', '#dedede')
    .attr("rx", 2)
    .attr("class", 'tooltip-rect');
  let tooltipRectText = tooltip.append("text")
    .attr('font-size', toolTipFontSize + 'px')
    .text('')
    .attr('x', 0)
    .attr('y', 0)
    .attr("fill", "#000")
    .attr("class", "tooltip-text");


  // var hoverIndicator = chart.append("g").attr("class", "hover-indicator").style("display", "none");
  // hoverIndicator.append('svg')
  //   .attr('x', 0)
  //   .attr('y', 0)
  //   .attr("height", "32")
  //   .attr("width", "32")
  //   .attr("viewBox", "0 0 48 48")
  //   .html(iconRightPlainIndicator)
  //   .attr('fill', '#fff')
  //   .attr("class", "hover-indicator");

  if (!isSegmented) {
    chartHoverTrackPad = chart.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight + 1)
      .attr('x', initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndYAxisPadding)
      .attr('y', initialConfig.chartTopPadding)
      .attr('opacity', 0)
      .attr('class', 'trackpad')
      .on("mouseout", handleChartMouseOut)
      .on("mousemove", handleChartMouseMove)
      .on("click", handleChartLock);
  }


  function handleChartLock() {
    if(window.currentSelectedWidget===undefined || !window.currentSelectedWidget || window.currentSelectedWidget!==args.unique_key){
      window.currentSelectedWidget = args.unique_key;
      return;
    }

    if (chartHoverLocked) {
      chartHoverLocked = false;
      if (xAxisSliderGroup) xAxisSliderGroup.select('.hover-line-status').html(iconUnlock);
      tooltip.style("display", null);
    } else {
      chartHoverLocked = true;
      if (xAxisSliderGroup) xAxisSliderGroup.select('.hover-line-status').html(iconLock);
    }

    if (args.pointSelectionModeOn && xValOnMouseMove !== null && xValOnMouseMove !== undefined) {
      let segmentPoint = null, segmentName = null;
      if (chartSegmentation && dataValues && yPosIndex > -1 && dataValues[yPosIndex] && showBarBlockHighlighter) {
        segmentName = chartSegmentation;
        segmentPoint = dataValues[yPosIndex][chartSegmentation];
      }
      const chartClickInfo = {
        id: args.unique_key,
        xPoint: args.xaxiskey === 'date' ? d3.timeFormat('%Y-%m-%d')(xValOnMouseMove) : xValOnMouseMove,
        segmentName: segmentName,
        segmentValue: segmentPoint
      };
      args.pointSelectionClbk(chartClickInfo);
      return;
    }

    // Check if click is made on while hovering over some exisiting note marker, if Yes, trigger the appropriate callback
    if (hoveredNoteInfo !== null) {
      args.pointClickClbk(hoveredNoteInfo);
    }
  }

  xScale.invert = function (x) {
    return d3.scaleQuantize().domain(this.range()).range(this.domain())(x);
  };
  yScale.invert = function (y) {
    return d3.scaleLinear().domain(this.range()).range(this.domain())(y);
  };

  //call on initial load - to show aggregated segmented values
  handleChartMouseOut();
  
  //Remove tooltip on mouse out
  function handleChartMouseOut() {
    if (chartHoverLocked) return false; //if locked no hover allowed
    if (xAxisSliderGroup) xAxisSliderGroup.style("display", "none");
    if (yAxisSliderGroup) yAxisSliderGroup.style("display", "none");
    if (hoverYGridLine) hoverYGridLine.style("display", "none");
    if (tooltip) tooltip.style('display', 'none');
    if (barHoverHighlighter) barHoverHighlighter.style('display', 'none');
    if (barHighlighterOverlay) barHighlighterOverlay.style("display", 'none');

    // show aggregated table when not hovering the chart
    if(window.currentSelectedWidget===args.unique_key){
      showAggregatedSegmentsDetails(args, initialConfig, color);
    }
  }

  function giveHoveredNoteInfo(thisArg) {
    const mouseX = d3.mouse(thisArg)[0];
    const mouseY = d3.mouse(thisArg)[1];
    const closestNoteToMouse = args.chartNotes.find(function (cn) {
      const noteXPos = giveXPositionOfNote(cn.x_axis_point);
      const noteYPos = giveYPositionOfNote(cn.x_axis_point);

      if ((mouseX > noteXPos - 2) && mouseX < noteXPos + 2 && mouseY > noteYPos - 12 && mouseY < noteYPos + 2) {
        return true;
      }
      return false;
    });
    return closestNoteToMouse || null;
  }

  var xValOnMouseMove = null;
  var dataValues = null;
  var yPosIndex = null;
  var showBarBlockHighlighter = false;
  var hoveredNoteInfo = null;
  var maxTooltipWidth = isFitToWidthMode ? Math.round((initialConfig.maxTooltipWidth * currentCanvasSize) / args.screen) : initialConfig.maxTooltipWidth;
  let tooltipTextXPos = isFitToWidthMode ? Math.round(2 * currentCanvasSize / args.screen) : 2;
  let tooltipTextYPos = isFitToWidthMode ? Math.round(.2 * currentCanvasSize / args.screen) : .2;
  let tooltipRectPadding = isFitToWidthMode ? Math.round(3 * currentCanvasSize / args.screen) : 3;
  let tooltipPadding = isFitToWidthMode ? Math.round(4 * currentCanvasSize / args.screen) : 4;


  // Show tooltip on mouse move
  function handleChartMouseMove() {
    if (chartHoverLocked) return false; //if locked no hover allowed

    var x0, y0, i, d1;
    var mouseX = d3.mouse(this)[0];
    var mouseY = d3.mouse(this)[1];

    //x0 - val, i= index, d0 - prev data obj, d1 - current data obj
    x0 = xScale.invert(mouseX);
    y0 = yScale.invert(mouseY);
    i = args.data.findIndex((e) => e[args.xaxiskey] === x0);
    d1 = args.data[i];

    try {
      var d = d1;
    } catch (e) { return; }

    var mouse = d3.mouse(chartHoverTrackPad.node());
    xValOnMouseMove = xScale.invert(mouse[0]);

    var xAxisVal;
    if (args.xaxiskey === 'date') {
      var date = new Date(d[args.xaxiskey]);
      xAxisVal = parsedDateString(date);
    } else {
      xAxisVal = d[args.xaxiskey];
    }

    //Generate tooltip details
    var chartWidth = innerWidth;
    var chartXPos = 0;

    if (isSegmented) {
      //Sort segmentated values
      if(window.currentSelectedWidget===args.unique_key){
        dataNest = sortSegmentedData(args, dataNest, xAxisVal);

        //Display Cross Hair Values
        var dataValuesIndex = dataNest.findIndex((e) => args.xaxiskey === 'date' ? parsedDateString(e.values[0][args.xaxiskey]) === xAxisVal : e.values[0][args.xaxiskey] === xAxisVal);
        if (dataValuesIndex > -1) {
          dataValues = dataNest[dataValuesIndex]['values'];

          //show legend information in table format
          showHoverSegmentDetails(args, initialConfig, dataValues, d, xAxisVal, xValOnMouseMove, color, 'bar');
        }
      }

      // Show Tooltip
      var block_tooltip_text = '';
      var tooltip_width = 0;

      //show bar block highlighter on bar chart block hover
      // showBarBlockHighlighter = mouseY > (innerHeight - (Math.ceil(segmentedBarHeights[d[args.xaxiskey]]) - 10) - 1); // 10 is extra padding

      // //show individual block highlighter when showBarBlockHighlighter and segment lenght is greater than 1
      // if (showBarBlockHighlighter && segmentedBarBlocksYPos[d[args.xaxiskey]].length > 1) {
      //   //get index of segmentedBarBlocksYPos based on start and end y position on mouse hover
      //   yPosIndex = segmentedBarBlocksYPos[d[args.xaxiskey]].findIndex((e, i) => {
      //     let mousePos = mouseY;
      //     let startPos = e;
      //     let endPos = parseFloat(parseFloat(e) + parseFloat(segmentedBarBlocksHeight[d[args.xaxiskey]][i])).toFixed(2);
      //     return (mousePos >= startPos && mousePos <= endPos);
      //   });

      //   //show tooltip
      //   if (dataValues  && dataValues[yPosIndex] ) {
      //     if (args.pointSelectionModeOn) {
      //       block_tooltip_text = 'Click to Select -' + dataValues[yPosIndex][chartSegmentation];
      //     } else {
      //       block_tooltip_text = dataValues[yPosIndex][chartSegmentation] + ': ' + args.chartCurrencySymbol + numberWithCommas(dataValues[yPosIndex][args.yaxiskey]) + args.chartPercentSymbol; //details
      //     }
      //     tooltip_text = block_tooltip_text;
      //     tooltip_text_width = calculateTextWidth(block_tooltip_text, toolTipFontSize+'px Poppins, "Open Sans", sans-serif, helvetica');
      //     tooltip_width = tooltip_text_width + 4;
      //     var barblock_height = Math.round(segmentedBarBlocksHeight[d[args.xaxiskey]][yPosIndex]);
      //     var base_left = xScale(xValOnMouseMove);

      //     tooltip_top = parseFloat(segmentedBarBlocksYPos[d[args.xaxiskey]][yPosIndex]) - initialConfig.tooltipHeight/2 + barblock_height/2;
      //     if (tooltip_top <= 0) tooltip_top = initialConfig.tooltipHeight/2;

      //     tooltip_left = (base_left + parseInt(barWidth) + 2);
      //     tooltip_width = tooltip_width <= maxTooltipWidth ? tooltip_width : maxTooltipWidth;
      //     chartXPos = (tooltip_left + tooltip_width);
      //     if(chartXPos > chartWidth) tooltip_left = (base_left - tooltip_width - 2);

      //     //show bar blocked highlighted
      //     let bar_hightlighter_left = xScale(xValOnMouseMove);
      //     let bar_hightlighter_top = segmentedBarBlocksYPos[d[args.xaxiskey]][yPosIndex];
      //     barHoverHighlighter
      //       .attr('width', barWidth)
      //       .attr('height', barblock_height)
      //       .attr('x', bar_hightlighter_left)
      //       .attr('y', bar_hightlighter_top)
      //       .attr('fill', color(dataValues[yPosIndex][chartSegmentation])) // change color of overlay to hide hover overlay effect
      //       .style('display', 'block');
      //     barHighlighterOverlay
      //       .attr('x', (bar_hightlighter_left-1))
      //       .style("display", 'block');
      //   }

      // } else {
      //   // barHoverHighlighter.style("display", "none"); //hide highlighter
      //   //show bar blocked highlighted
      //   let bar_hightlighter_left = xScale(xValOnMouseMove);
      //   // let bar_highlighter_height = Math.ceil(segmentedBarHeights[d[args.xaxiskey]]) - 10;
      //   // let bar_hightlighter_top = innerHeight-bar_highlighter_height;

      //   barHoverHighlighter
      //     .attr('width', barWidth)
      //     .attr('height', 0)
      //     .attr('x', 0)
      //     .attr('y', 0)
      //     .style('display', 'block');
      //     // .attr('width', barWidth)
      //     // .attr('height', bar_highlighter_height)
      //     // .attr('x', bar_hightlighter_left)
      //     // .attr('y', bar_hightlighter_top)
      //     // .attr('stroke', '#fff')

      //   barHighlighterOverlay
      //     .attr('x', (bar_hightlighter_left-1))
      //     .style("display", 'block');

      //   let totalVal = dataValues ? parseFloat(dataValues.reduce((total, obj) => parseFloat(obj[args.yaxiskey]) + total, 0)).toFixed(2) : 0;
      //   if (args.pointSelectionModeOn) {
      //     block_tooltip_text = 'Click to Select';
      //   } else {
      //     block_tooltip_text = 'Total: ' + args.chartCurrencySymbol + numberWithCommas(totalVal) + args.chartPercentSymbol; //details
      //   }
      //   tooltip_text = block_tooltip_text;
      //   calculateTooltipPositionAndWidth(tooltip_text, totalVal);
      // }

    } else {
      if (args.pointSelectionModeOn) {
        block_tooltip_text = 'Click to Select';
      } else {
        block_tooltip_text = args.yaxiskey + ': ' + args.chartCurrencySymbol + numberWithCommas(d[args.yaxiskey]) + args.chartPercentSymbol; //details;
      }
      tooltip_text = block_tooltip_text;
      calculateTooltipPositionAndWidth(tooltip_text);

      //show bar blocked highlighted
      let yval = d[args.yaxiskey];
      if (args.chartFormat.yaxis.max && yval > args.chartFormat.yaxis.max) {
        yval = args.chartFormat.yaxis.max;
      }
      if (args.chartFormat.yaxis.min && yval < args.chartFormat.yaxis.min) {
        yval = args.chartFormat.yaxis.min;
      }
      let bar_hightlighter_left = xScale(xValOnMouseMove) - barPadding / 2 / 2;
      // let bar_hightlighter_top = yScale(yval);
      let bar_height = Number.parseFloat(innerHeight - yScale(yval) + initialConfig.chartTopPadding).toFixed(2);
      if (bar_height < 0) bar_height = 0;
      // barHoverHighlighter
      //   .attr('width', barWidth)
      //   .attr('height', bar_height)
      //   .attr('x', bar_hightlighter_left)
      //   .attr('y', bar_hightlighter_top)
      //   .attr('stroke', '#fff')
      //   .style('display', 'block');

      barHighlighterOverlay
        .attr('x', (bar_hightlighter_left - 1))
        .style('display', 'block');
    }

    function calculateTooltipPositionAndWidth(text, totalVal = null) {
      tooltip_text_width = calculateTextWidth(text, toolTipFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica');
      tooltip_width = parseInt(tooltip_text_width) + tooltipPadding;
      tooltip_width = tooltip_width <= maxTooltipWidth ? tooltip_width : maxTooltipWidth;
      tooltip_pos_adjustment = initialConfig.tooltipHeight + (initialConfig.inbetweenChartAndXAxisPadding < 5 ? 5 : initialConfig.inbetweenChartAndXAxisPadding);
      tooltip_top = (yScale(totalVal ? totalVal : d[args.yaxiskey]) - tooltip_pos_adjustment); //if totalVal is set use that position else use individual bar/bar_block position
      tooltip_top = tooltip_top < 0 ? (yScale(d[args.yaxiskey]) + initialConfig.tooltipHeight / 2) : tooltip_top;

      var base_left = xScale(xValOnMouseMove);
      chartXPos = (base_left + tooltip_width);

      if (tooltip_top <= 0) tooltip_top = initialConfig.tooltipHeight / 2;
      tooltip_left = (base_left + parseInt(barWidth) + 2);
      if (chartXPos > chartWidth) tooltip_left = (base_left - tooltip_width - 4);
    }

    if (!initialConfig.showXAxisTicks) {
      tooltip_left = 0;
      tooltip_top = xAxisBottomPos;
    }

    //show hover indicator and tooptip
    let textLinesCount = 1;
    tooltip.style('display', 'block').attr("transform", "translate(" + parseInt(tooltip_left) + "," + parseInt(tooltip_top) + ")");
    tooltipRectText
      .text(tooltip_text)
      .attr("dy", "1em")
      .attr('x', tooltipTextXPos)
      .attr('y', tooltipTextYPos)
      .attr('fill', initialConfig.showXAxisTicks ? '#000' : '#fff')
      .call(wrapFromAnyCharacter, tooltip_width)
      .style('display', 'block');
    textLinesCount = tooltipRectText.selectAll('tspan').size();
    textLinesCount = (textLinesCount === undefined || textLinesCount === 0) ? 1 : textLinesCount;
    tooltipRect
      .attr('width', tooltip_width)
      .attr('height', textLinesCount * (toolTipFontSize + tooltipRectPadding) + textLinesCount) //increase height of rectangle as per text
      .attr('x', 0)
      .attr('y', 0)
      .style('display', initialConfig.showXAxisTicks ? 'block' : 'none');

    //display tick sliders
    //x-axis
    if (xAxisSliderGroup) {
      let max_xslider_width = innerWidth; //innerWidth
      let xaxis_text = args.xaxiskey === 'date' ? parsedDateString(d[args.xaxiskey]) : d[args.xaxiskey];
      let xaxis_box_width = Math.round(calculateTextWidth(xaxis_text, tickSliderFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica') + xAxisSliderRectWidthPadding);
      xaxis_box_width = xaxis_box_width <= max_xslider_width ? xaxis_box_width : max_xslider_width;

      // let xAxisLeftPadding = (icon_width + 2); //icon padding
      let xAxisLeftPadding = barPadding;
      let xTickValPosOrg = xScale(d[args.xaxiskey]);
      let xTickValPos = xTickValPosOrg;
      let xTickValAvailableWidth = (width - initialConfig.chartRightPadding) - xTickValPos - (barPadding / 2 / 2);

      if (barWidth < xaxis_box_width / 2) {
        xTickValPos = xTickValPos - (xaxis_box_width / 2) + (barWidth / 2);
      } else {
        xTickValPos = xTickValPos - (barPadding / 2 / 2) + (barWidth / 2) - (xaxis_box_width / 2);
      }

      // adjust starting bars x slider left position
      let lockIconXPos = 0;
      let leftMouseXScrollPos = (mouseX - initialConfig.chartLeftPadding - (initialConfig.inbetweenChartAndYAxisPadding + 1));
      xTickValPos = xTickValPosOrg - (barPadding / 2 + 1) - xaxis_box_width / 2 + xAxisLeftPadding / 2; //default
      if (leftMouseXScrollPos <= xaxis_box_width / 2) { // left position
        let leftAvailableWidth = xTickValPosOrg - initialConfig.chartLeftPadding - initialConfig.inbetweenChartAndYAxisPadding;
        xTickValPos = xTickValPosOrg - leftAvailableWidth;
        xAxisLeftPadding = 0;
        lockIconXPos = xaxis_box_width + 2;
      }

      // adjust end bars x slider right position
      if (xTickValAvailableWidth <= xaxis_box_width / 2) { // adjust end bars x slider right position
        xTickValPos = (width - initialConfig.chartRightPadding - (xaxis_box_width + xAxisLeftPadding - 1));
      }

      //x-axis slider tick elements
      if (xTickValPos > (innerWidth - xaxis_box_width / 2 + 5)) {
        xTickValPos = (innerWidth - xaxis_box_width / 2 + 5);
      } else if (xTickValPos < (initialConfig.chartLeftPadding + 5)) {
        xTickValPos = initialConfig.chartLeftPadding + 5;
      }

      xAxisSliderGroup.attr("transform", "translate(" + parseInt(xTickValPos) + "," + parseInt(xAxisBottomPos - xAxisSliderRectWidthPadding) + ")").style("display", "block"); // bgBottomPadding is extra bg rect padding
      xAxisSliderGroup.select(".hover-line-status").attr("x", lockIconXPos).attr("y", initialConfig.tickSliderPadding); //lock icon position
      let xAxisSliderTextTopPos = isFitToWidthMode ? parseInt(10 * currentCanvasSize / args.screen) : 10;
      let xAxisSliderTextLeftPos = (xAxisLeftPadding + (isFitToWidthMode ? parseInt(5 * currentCanvasSize / args.screen) : 5));

      async function renderXSliderText() {
        xHoverRectText
          .text(xaxis_text)
          .attr("dy", "1em")
          .attr('x', xAxisSliderTextLeftPos)
          .attr('y', xAxisSliderTextTopPos)
          .style('text-align', 'center')
          .call(trimFromAnyCharacter, xaxis_box_width)
          .style('display', 'block');
      }
      renderXSliderText().then(() => {
        xHoverRect
          .attr('width', xaxis_box_width)
          .attr('height', xTickSliderHeight)
          .attr('x', xAxisLeftPadding)
          .attr('y', 4)
          .style('text-align', 'center')
          .style('display', 'block');
      });
    }

    //show mouse hover lines on chart
    hoverYGridLine.style('display', 'block')
      .attr("transform", "translate(" + initialConfig.padding + "," + (parseInt(mouseY) - 1) + ")");
    hoverYGridLine.select('.y-hover-line')
      .attr('x1', -initialConfig.padding + xStartPoint)
      .attr('x2', (xEndPoint - initialConfig.padding));

    // y-axis horizoantal line
    if (yAxisSliderGroup) {
      let yval_digits_count = getDigitsCount(y0);
      let round_var = yval_digits_count - 2;
      let rounded_val = Math.round(y0 * Math.pow(10, round_var) / Math.pow(10, round_var));
      let yaxis_text = formatNumber(rounded_val);

      let yaxis_box_width = calculateTextWidth(yaxis_text, tickSliderFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica') + 4 + 10;
      let yaxis_box_left_pos = 3; //3 is gapping of 3px

      let ySliderPos = (mouseY - 2);
      if (ySliderPos < 6) {
        ySliderPos = 6;
      } else if (ySliderPos > (innerHeight - 7)) {
        ySliderPos = innerHeight - 7;
      }

      yAxisSliderGroup.attr("transform", "translate(" + parseInt(yaxis_box_left_pos) + "," + parseInt(ySliderPos) + ")").style("display", "block"); // bgBottomPadding is extra bg rect padding
      yHoverRect
        .attr('width', (initialConfig.chartLeftPadding + 5))
        .attr('x', 0)
        .attr('y', -(initialConfig.tickHoverBoxHeight / 2))
        .style('display', 'block');
      yHoverRectText.text(yaxis_text)
        .attr('x', (initialConfig.chartLeftPadding - yaxis_box_width + 5))
        .attr('y', yTickSliderTextPosTop)
        .style('display', 'block');
    }


    // Check if Mouse is hovered over some Existing Note marker
    // First reset the variable and cursor on each hover
    hoveredNoteInfo = null;
    document.body.style.cursor = 'default';
    if (args.chartNotes) {
      noteMarkerHover.style('display', 'none');
      // Call @method giveHoveredNoteInfo, it will return the note which is being hovered, if none, will return null
      hoveredNoteInfo = giveHoveredNoteInfo(this);
      if (hoveredNoteInfo !== null) {
        document.body.style.cursor = 'pointer';
        noteMarkerHover
          .style('display', null)
          .attr('cx', giveXPositionOfNote(hoveredNoteInfo.x_axis_point))
          .attr('cy', giveYPositionOfNote(hoveredNoteInfo.x_axis_point) - 6)
          .attr('r', 5)
          .attr('fill', 'none')
          .attr('stroke', '#ff0000')
          .attr('stroke-width', '1');
      }
    }
  }
}


//line break based on character
function wrapFromAnyCharacter(text, max_width = 140) {
  text.each(function () {
    var text = d3.select(this),
      characters = text.text().split('').reverse(),
      character,
      line = [],
      lineNumber = 0,
      lineHeight = 1.1, // ems
      y = text.attr("y"),
      x = text.attr("x"),
      // dy = parseFloat(text.attr("dy")),
      dy = parseFloat(text.attr("dy") === null ? '1em' : text.attr("dy")),
      tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

    while (character = characters.pop()) {
      line.push(character);
      tspan.text(line.join(""));
      if (tspan.node().getComputedTextLength() >= max_width) {
        if (lineNumber < 1) {
          line.pop();
          tspan.text(line.join(""));
          line = [character];
          lineNumber++;
          tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", lineNumber * lineHeight + dy + "em").text(character);
        } else { // if it crosses 2nd line length trim characters
          line.pop();
          line.pop();
          line.pop(); //remove last three characters and add triple dots in the end
          line.push('...');
          tspan.text(line.join(""));
          return;
        }
      }
    }
  });
}

//show triple dot after defined max width
function trimFromAnyCharacter(text, max_width = 140) {
  text.each(function () {
    var text = d3.select(this),
      characters = text.text().split('').reverse(),
      character,
      line = [],
      y = text.attr("y"),
      x = text.attr("x"),
      dy = parseFloat(text.attr("dy")),
      tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

    while (character = characters.pop()) {
      line.push(character);
      tspan.text(line.join(""));
      if (tspan.node().getComputedTextLength() >= max_width) {
        line.pop();
        line.pop();
        line.pop(); //remove last three characters and add triple dots in the end
        line.push('...');
        tspan.text(line.join(""));
        return;
      }
    }
  });
}


//Formatted date pick
// function multiFormat(d, i, axis) {
//   var formatDay = d3.timeFormat("%d"),
//     formatMonth = d3.timeFormat("%d %b"),
//     formatYear = d3.timeFormat("%d \n %b \n %Y");

//   const ticks = axis.scale().ticks();
//   if (i > 0 && ticks[i - 1].getMonth() === d.getMonth()) {
//     return (formatDay)(d);
//   } if (i > 0 && ticks[i - 1].getYear() !== d.getYear()) {
//     return (formatYear)(d);
//   } else {
//     return (formatMonth)(d);
//   }
// }

// function onlyUnique(value, index, self) {
//   return self.indexOf(value) === index;
// }

//Draw line chart - crosshair free flow
function drawLineChartFreeCrossHair(args) {
  //chart initial settings variables
  const initialConfig = getInitialChartConfig(args);
  if (!initialConfig) return;

  //basic configurations
  let width = args.chartWrapper.current.offsetWidth;
  let innerWidth = width - (initialConfig.chartLeftPadding + initialConfig.chartRightPadding + initialConfig.inbetweenChartAndYAxisPadding);
  let chartWrapperHeight = d3.select('#chart-' + args.unique_key).node().getBoundingClientRect().height;
  let height = chartWrapperHeight - initialConfig.chartWidgetBottomPadding - initialConfig.chartHeadingSectionHeight;
  if (args.excludeChartHeader !== undefined) { // if chart width is less than default add removed chart header+margin heightto chart height
    height = height + initialConfig.chartInnerHeadingSectionHeightWithMargin + (initialConfig.chartWidgetBottomPadding - 5);
  }
  let innerHeight = (height - initialConfig.chartBottomPadding - initialConfig.chartTopPadding);
  let xAxisBottomPos = (height - initialConfig.chartBottomPadding + initialConfig.inbetweenChartAndXAxisPadding);
  d3.select(args.chartWrapper.current).style("height", height + 'px'); //set chart height

  //Chart icons
  let iconLock = '<g class="nc-icon-wrapper" fill="#ff0000" transform="translate(0, 0)"><path d="M21,10H18V6.01A5.96,5.96,0,0,0,12.1,0h-.09A5.94,5.94,0,0,0,6,5.9V10H3a1,1,0,0,0-1,1V23a1,1,0,0,0,1,1H21a1,1,0,0,0,1-1V11A1,1,0,0,0,21,10Zm-9,9a2,2,0,1,1,2-2A2,2,0,0,1,12,19Zm4-9H8V5.91A3.957,3.957,0,0,1,11.959,2h.131A3.957,3.957,0,0,1,16,6Z" fill="#ff0000"></path></g>';
  let iconUnlock = '<g class="nc-icon-wrapper" fill="#00ff7f" transform="translate(0, 0)"><path d="M21,10H8V5.91A3.957,3.957,0,0,1,11.959,2h.131A3.955,3.955,0,0,1,16,5.99l2,.02A5.96,5.96,0,0,0,12.1,0h-.09A5.94,5.94,0,0,0,6,5.9V10H3a1,1,0,0,0-1,1V23a1,1,0,0,0,1,1H21a1,1,0,0,0,1-1V11A1,1,0,0,0,21,10Zm-9,9a2,2,0,1,1,2-2A2,2,0,0,1,12,19Z" fill="#00ff7f"></path></g>';

  let currentCanvasSize = (window.innerWidth - 10);
  let isFitToWidthMode = (args.screen && !args.isDashboardInEditMode && (args.viewModeType !== undefined && args.viewModeType.name === 'Fit to Width'));
  let tickFontSize = isFitToWidthMode ? Math.round(10 * currentCanvasSize / args.screen) : 10;
  let xAxisTickStartPos = isFitToWidthMode ? Math.round(75 * currentCanvasSize / args.screen) : 75;
  let yAxisTickTopPos = isFitToWidthMode ? Math.round(5 * currentCanvasSize / args.screen) : 5;
  let tickSliderFontSize = isFitToWidthMode ? Math.round(11 * currentCanvasSize / args.screen) : 11;
  let toolTipFontSize = isFitToWidthMode ? Math.round(11 * currentCanvasSize / args.screen) : 11;
  let circleSize = isFitToWidthMode ? Math.round(1.5 * currentCanvasSize / args.screen) : 1.5;
  let highlighterCircleSize = isFitToWidthMode ? Math.round(4 * currentCanvasSize / args.screen) : 4;

  //Define charts configs
  let isSegmented = (args.chartSegmentation && args.chartSegmentation !== '' && args.chartSegmentation !== 'all' && args.chartSegmentation !== ' ');
  let chartSegmentation = isSegmented ? args.chartSegmentation : '';

  let chartHoverLocked = false;
  let lineColor = args.chartFormat.color.single_color !== '' ? args.chartFormat.color.single_color : chartColors[0]; //pick selected color
  let color = getColor(args);
  let parseDate = d3.timeFormat("%m.%d.%Y"),
    parsedDateString = d3.timeFormat("%d %b %Y"),
    formatYNumber = d3.format("");

  // Data variable
  let chartMainData = []// = [...args.data];

  //Define SVG and group element
  let svg = getSVGElement(args.chartWrapper.current, width, height);
  let chart = getGroupElement(svg, args.yaxiskey);

  // Scaling Points - start and end
  let xStartPoint = initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndYAxisPadding;
  let xEndPoint = (width - initialConfig.chartRightPadding);
  let yStartPoint = xAxisBottomPos - initialConfig.inbetweenChartAndXAxisPadding - 1;
  let yEndPoint = initialConfig.chartTopPadding;


    //Define Y-axis for each chart
    let yScaleLimits;
    if (args.chartBandsData && args.chartBandsData.length > 0) {
      let minOfLowerBands = Number.POSITIVE_INFINITY, maxOfUpperBands = Number.NEGATIVE_INFINITY;
      args.chartBandsData.forEach(bandData => {
        let min = d3.min(bandData.map(d => d.lower));
        let max = d3.max(bandData.map(d => d.upper));
        minOfLowerBands = Math.min(min, minOfLowerBands);
        maxOfUpperBands = Math.max(max, maxOfUpperBands);
      });
  
      const minOfData = d3.min(args.data.map(d => d[args.yaxiskey]));
      const maxOfData = d3.max(args.data.map(d => d[args.yaxiskey]));
      const minVal = Math.min(minOfLowerBands, minOfData);
      const maxVal = Math.max(maxOfUpperBands, maxOfData);
      let range = (maxVal - minVal);
  
      yScaleLimits = {
        lowerLimit: minVal - 0.10 * range,
        upperLimit: maxVal + 0.10 * range
      };
      if (args.chartFormat.yaxis.min !== '') { yScaleLimits['lowerLimit'] = args.chartFormat.yaxis.min; }
      if (args.chartFormat.yaxis.max !== '') { yScaleLimits['upperLimit'] = args.chartFormat.yaxis.max; }
  
    } else {
      yScaleLimits = (args.isEmpty === undefined && args.data.length > 0) ? getMinMaxRange(args.data, args.yaxiskey) : { lowerLimit: 0, upperLimit: 10 };
      if (args.chartFormat.yaxis.min !== '') { yScaleLimits['lowerLimit'] = args.chartFormat.yaxis.min; }
      if (args.chartFormat.yaxis.max !== '') { yScaleLimits['upperLimit'] = args.chartFormat.yaxis.max; }
    }

    
  args.data.map((d) => {
    if (d[args.yaxiskey] >= yScaleLimits['lowerLimit'] && d[args.yaxiskey] <= yScaleLimits['upperLimit']) {
      chartMainData.push(d);
    }
  });


  // Set the x/y scales
  let xDomains = chartMainData.map((d) => d[args.xaxiskey]);
  if (chartSegmentation !== 'all' && chartSegmentation !== '' && args.xaxiskey === 'date') { //Draw multi-lines
    let allXDomains = d3.nest().key((d) => d[args.xaxiskey]).entries(chartMainData);
    xDomains = [];
    allXDomains.forEach(function (d) {
      if (d.key) {
        d.key = new Date(d.key);
        xDomains.push(new Date(d.key));
      }
    })
  }

  if (args.xaxiskey !== 'date' && typeof xDomains[0] === 'string') {
    // xaxiskey is of type 'string'
    // In this case, sort the x axis values. Without segmentation it is not mandatory to sort, but to be consistent sort in both cases.
    xDomains = xDomains.sort();
  }


  let xAxisTickValues = getXAxisTickValues(initialConfig, xDomains, chartMainData, args); // get x axis calculated tick values

  /* Define and create xScale, xAxis, ticks */
  let xScale;
  let xAxis;
  async function defineXScale() {
    //Set the scales
    xScale = d3.scalePoint()
      .domain(xDomains)
      .range([xStartPoint, xEndPoint])
      .padding(.2);

    //Set the ticks
    xAxis = d3.axisBottom(xScale)
      .tickValues(xAxisTickValues)
      .tickSize(0)
      .tickPadding(5)
      .tickFormat((args.xaxiskey === 'date' ? d3.timeFormat("%m.%d.%Y") : (d) => (typeof d === 'string') ? d.substring(0, 10) : d));

    //Draw x-axis
    chart.append("g")
      .attr("class", "axis x-axis")
      .attr("transform", "translate(0, " + xAxisBottomPos + ")") //start with 10px instead of 0
      .call(xAxis)
      .attr('font-size', tickFontSize + 'px');
  }
  defineXScale().then(() => {
    //Change x axis first and last tick position
    alignXAxisTicks(width, args.unique_key, initialConfig, xAxisTickValues, xDomains, parseDate, tickFontSize, xAxisTickStartPos);
  });


  // Calculate y ticks values
  let y_steps = args.yAxisTicksCount !== undefined ? args.yAxisTicksCount : initialConfig.defaultYAxisTicksCount;
  if (args.chartFormat.yaxis.tick !== '' && args.chartFormat.yaxis.tick > 0) {
    y_steps = Math.floor(yScaleLimits['upperLimit'] / args.chartFormat.yaxis.tick) + 1;
  }

  let hasCustomFormat = (args.chartFormat.yaxis.tick || args.chartFormat.yaxis.min || args.chartFormat.yaxis.max) ? true : false;
  let customTickInterval = hasCustomFormat ? args.chartFormat.yaxis.tick : null;
  let yDomains = [];
  let yTickValues = [];
  if (y_steps > 1) {
    yDomains = getTickValues(yScaleLimits['lowerLimit'], yScaleLimits['upperLimit'], y_steps, hasCustomFormat, customTickInterval);
  }
  if (initialConfig.showYAxisTicks) {
    yTickValues = [...yDomains];
  }

  /* Define and create yScale, yAxis, ticks */
  let yScale;
  let yAxis;
  async function defineYScale() {
    //Set y scale
    let upperYLimit = args.chartSizeClass === "xs-grid-width" ? yScaleLimits['upperLimit'] : yTickValues[yTickValues.length-1];
    yScale = d3.scaleLinear()
      .domain([yScaleLimits['lowerLimit'], upperYLimit])//yScaleLimits['upperLimit']])
      .range([yStartPoint, (yEndPoint + highlighterCircleSize/2)]);

    //Set y ticks
    yAxis = d3.axisLeft(yScale)
      .tickValues(yTickValues)
      .tickSize(0)
      .tickFormat((d) => formatNumber(formatYNumber(d)))
      .tickPadding(3);

    //Draw y axis
    chart.append("g")
      .attr("class", "axis y-axis")
      .attr("transform", "translate(" + initialConfig.chartLeftPadding + ",0)")
      .call(yAxis)
      .attr('font-size', tickFontSize + 'px');
  }
  defineYScale().then(() => {
    //Change x axis first and last tick position
    alignYAxisTicks(innerHeight, args.unique_key, initialConfig, yAxisTickTopPos);
  });

  //if no data available
  if (args.isEmpty || !chartMainData || chartMainData.length === 0) {
    chart.append("text")
      .attr("y", ((height / 2)))
      .attr("x", (width / 2))
      .attr("dy", ".7em")
      .style("text-anchor", "middle")
      .text('No data available')
      .style("fill", "#fff")
      .attr("class", "no-data");
  }

  // d3.select(chart).remove();

  // Individual Chart Elements - background rect, y-axis line, x-axis line to merge the corners
  let bgBottomPadding = 2;
  chart.append('rect')
    .attr('width', innerWidth)
    .attr('height', innerHeight + bgBottomPadding)
    .attr('x', initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndYAxisPadding)
    .attr('y', initialConfig.chartTopPadding)
    .attr('class', 'chart-bg');

  //return from here if data is not available
  if (!chartMainData || chartMainData.length === 0) return;

  //x-axis tick slider elements
  let xAxisSliderGroup;
  let xHoverRect;
  let xHoverRectText;
  let xTickSliderWidth = isFitToWidthMode ? Math.round(60 * currentCanvasSize / args.screen) : 60;
  let xTickSliderHeight = initialConfig.xTickSliderHeight;
  let xTickSliderTextPosLeft = isFitToWidthMode ? Math.round(3 * currentCanvasSize / args.screen) : 3;
  let xTickSliderTextPosTop = isFitToWidthMode ? Math.round(4 * currentCanvasSize / args.screen) : 4;
  let xAxisSliderRectWidthPadding = isFitToWidthMode ? Math.round(8 * currentCanvasSize / args.screen) : 8;

  if (initialConfig.showXAxisTicks) {
    xAxisSliderGroup = chart.append("g").attr("class", "xaxis-slider-group").style("display", "none");
    xHoverRect = xAxisSliderGroup.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", xTickSliderWidth)
      .attr("height", xTickSliderHeight)
      .attr("rx", 1)
      .attr("class", 'hover-xaxis-bg')
      .style("display", "none");
    xHoverRectText = xAxisSliderGroup.append("text")
      .attr('font-size', tickSliderFontSize + 'px')
      .text('')
      .attr('x', xTickSliderTextPosLeft)
      .attr('y', xTickSliderTextPosTop)
      .attr("fill", "#fff")
      .attr("class", "hover-xaxis-tick-val")
      .style("display", "none");
  }

  //y-axis hover elements
  let yAxisSliderGroup;
  let yHoverRect;
  let yHoverRectText;
  let yTickSliderHeight = initialConfig.tickHoverBoxHeight + 3;
  let yTickSliderWidth = isFitToWidthMode ? Math.round(30 * currentCanvasSize / args.screen) : 30;
  let yTickSliderRectPosLeft = isFitToWidthMode ? Math.round(5 * currentCanvasSize / args.screen) : 5;
  let yTickSliderTextPosTop = isFitToWidthMode ? Math.round(5 * currentCanvasSize / args.screen) : 5;

  if (initialConfig.showYAxisTicks) {
    yAxisSliderGroup = chart.append("g").attr("class", "yaxis-slider-group").style("display", "none");
    yHoverRect = yAxisSliderGroup.append("rect")
      .attr("x", yTickSliderRectPosLeft)
      .attr("y", 0)
      .attr("width", yTickSliderWidth)
      .attr("height", yTickSliderHeight)
      .attr("rx", 1)
      .attr("class", 'hover-yaxis-bg')
      .style("display", "none");
    yHoverRectText = yAxisSliderGroup.append("text")
      .attr('font-size', tickSliderFontSize + 'px')
      .text('')
      .attr('x', 0)
      .attr('y', 0)
      .attr("fill", "#fff")
      .attr("class", "hover-yaxis-tick-val")
      .style("display", "none");
  }


  // Draw area if bandData is available
  if (args.chartBandsData !== null) {
    args.chartBandsData.forEach((band, index) => {
      const bandAreaFunction = d3.area()
        .x(function (d) { return xScale(d[args.xaxiskey]); })
        .y0(function (d) { return yScale(d.lower); })
        // .y0(function (d) { return innerHeight})
        .y1(function (d) { return yScale(d.upper); });

      // Add the band area
      chart.append("path")
        .datum(band)
        .attr("class", `line-band-${index}`)
        .attr("fill", "#69b3a2")
        .attr("fill-opacity", .3)
        .attr("stroke", "none")
        .attr("d", bandAreaFunction);

      const bandStrokeColor = '#39b3a2';
      //Add the band area top line (border)
      chart.append("path")
        .datum(band)
        .attr("class", `line-band-top-${index}`)
        .attr('stroke', bandStrokeColor)
        .attr("d", d3.line()
          .x(function (d) { return xScale(d[args.xaxiskey]); })
          .y(function (d) { return yScale(d.upper); }));
      //Add the band area bottom line (border)
      chart.append("path")
        .datum(band)
        .attr("class", `line-band-bottom-${index}`)
        .attr('stroke', bandStrokeColor)
        .attr("d", d3.line()
          .x(function (d) { return xScale(d[args.xaxiskey]); })
          .y(function (d) { return yScale(d.lower); }));
    });
  }

  // draw line graph
  var line = d3.line()
    .x(function (d) { return xScale(d[args.xaxiskey]); })
    .y(function (d) {
      let yVal = d[args.yaxiskey];
      if (args.chartFormat.yaxis.max && yVal > args.chartFormat.yaxis.max) {
        yVal = args.chartFormat.yaxis.max;
      }
      if (args.chartFormat.yaxis.min && yVal < args.chartFormat.yaxis.min) {
        yVal = args.chartFormat.yaxis.min;
      }

      return yScale(yVal);
    });

  const linePointsWrapper = chart.append('g').attr("clip-path", `url(#clip-${args.unique_key})`);
  if (isSegmented) { //Draw multi-lines
    var dataNest = d3.nest().key((d) => {
      return d[chartSegmentation];
    }).entries(chartMainData);

    let count = -1;

    // Loop through each symbol / key
    dataNest.forEach((d, i) => {
      //convert segmentation title into id
      var mapObj = { ' ': "_", '.com': "", '.org': "", '.net': "", '.in': "", '.us': "" };
      var re = new RegExp(Object.keys(mapObj).join("|"), "gi");
      var keyID = d.key;
      keyID.replace(re, (matched) => {
        return mapObj[matched];
      });

      // sort the data by x axis value as xDomain is also sorted
      d.values.sort((a, b) => a[args.xaxiskey] < b[args.xaxiskey] ? -1 : 1);

      //Draw Path - period0/index0
      let line_class = (d.key !== args.comparisonDataKey + '0' && args.isComparisonEnabled) ? 'thin' : '';
      chart.append("svg:path")
        .attr("d", line(d.values))
        .attr("class", 'line ' + line_class)
        .style("stroke", function () {
          let lcolor = lineColor;
          if (args.isComparisonEnabled) {
            lcolor = chartColors[i];
          } else {
            lcolor = d.color = color(d.key);
          }
          return lcolor;
        });
    });
    // Draw scatter plot circles 
    linePointsWrapper.selectAll('.scatter-pt')
    .data(dataNest.reduce((dataPts, dn) => dataPts.concat(dn.values), []))
    .enter()
    .append('circle')
    .attr('class', () => { count += 1; return `line-pt line-pt-${args.unique_key}-${count}` })
    .attr('cx', (d) => xScale(d[args.xaxiskey]))
    .attr('cy', (d) => yScale(d[args.yaxiskey]))
    .attr('r', circleSize)
    .attr(`data-${chartSegmentation}`, (d) => d[chartSegmentation])
    .attr('fill', (d) => { return color(d[chartSegmentation]); })
    .style('opacity', '0');

  } else {
    // sort the data by x axis value as xDomain is also sorted
    chartMainData.sort((a, b) => a[args.xaxiskey] < b[args.xaxiskey] ? -1 : 1);
    //Step 1: Single Line
    chart.append("path")
      .datum(chartMainData)
      .attr("class", "line")
      .attr("d", line)
      .attr('stroke', lineColor)
      .attr('fill', lineColor);
  }

  //when there is one data point draw a circle
  if (chartMainData.length === 1) {
    chart.selectAll('.line-pt')
      .data(chartMainData).enter().append('circle')
      .attr('cx', function (d) {
        let xVal = d[args.xaxiskey];
        return xScale(xVal);
      })
      .attr('cy', function (d) {
        let yVal = d[args.yaxiskey];
        if (args.chartFormat.yaxis.max && yVal > args.chartFormat.yaxis.max) {
          yVal = parseInt(args.chartFormat.yaxis.max);
        }
        if (args.chartFormat.yaxis.min && yVal < args.chartFormat.yaxis.min) {
          yVal = parseInt(args.chartFormat.yaxis.min);
        }
        return yScale(yVal);
      })
      .attr('r', circleSize)
      .attr('class', 'scatter-pt')
      .attr('fill', function () { return lineColor; });
  }

  // Draw the marker for notes if chartNotes are available
  if (args.chartNotes) {
    chart.selectAll('.note-marker')
      .data(args.chartNotes).enter().append('text')
      .text('*')
      .attr('text-anchor', 'middle')
      .attr('font-size', '1.5em')
      .attr('class', 'note-marker')
      .attr('fill', '#ff0000')
      .attr('x', function (d) { return xScale(d.x_axis_point); })
      .attr('y', function () { return innerHeight / 2 });
  }

  //tooltip 
  let focus = chart.append("g").attr("class", "focus").style("display", "none");
  focus.append("circle")
    .attr("r", highlighterCircleSize)
    .attr('stroke', lineColor)
    .attr('fill', 'none')
    .attr('stroke-width', '1px');

  //hoverYAxisLine
  var hoverYGridLine = chart.append("g").attr("class", "hover-grid-y-line").style("display", "none");
  hoverYGridLine.append("line")
    .attr("class", "y-hover-line hover-line")
    .attr("x1", xStartPoint)
    .attr("x2", xEndPoint);
  var hoverXGridLine = chart.append("g").attr("class", "hover-grid-x-line").style("display", "none");
  hoverXGridLine.append("line")
    .attr("class", "x-hover-line hover-line")
    .attr("y1", 0)
    .attr("y2", innerHeight);

  //hoverXAxisLine
  let tooltip_text = '';
  let tooltip_text_width = 0;
  let tooltip_width = 0;
  let tooltip_top = 0;
  let tooltip_pos_adjustment = 0;
  let tooltip_left = 0;

  let tooltip = chart.append("g")
    .attr("class", "tooltip1")
    .attr("transform", "translate(0, 0)");
  let tooltipRect = tooltip.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 0)
    .attr("height", (toolTipFontSize + 2))
    .attr('fill', '#dedede')
    .attr("rx", 2)
    .attr("class", 'tooltip-rect');
  let tooltipRectText = tooltip.append("text")
    .attr('font-size', toolTipFontSize + 'px')
    .text('')
    .attr('x', 0)
    .attr('y', 0)
    .attr("fill", "#000")
    .attr("class", "tooltip-text");

  var chartHoverTrackPad = chart.append('rect')
    .attr('width', innerWidth)
    .attr('height', innerHeight + 1)
    .attr('x', initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndYAxisPadding)
    .attr('y', initialConfig.chartTopPadding)
    .attr('opacity', 0)
    .attr('fill', 'red')
    .attr('class', 'trackpad')
    .on("mouseout", handleChartMouseOut)
    .on("mousemove", handleChartMouseMove)
    .on("click", handleChartLock);


  function handleChartLock() {
    if(window.currentSelectedWidget===undefined || !window.currentSelectedWidget || window.currentSelectedWidget!==args.unique_key){
      window.currentSelectedWidget = args.unique_key;
      return;
    }

    if (chartHoverLocked) {
      chartHoverLocked = false;
      if (xAxisSliderGroup) xAxisSliderGroup.select('.hover-line-status').html(iconUnlock);
      tooltip.style("display", null);
    } else {
      chartHoverLocked = true;
      if (xAxisSliderGroup) xAxisSliderGroup.select('.hover-line-status').html(iconLock);
    }
    if (args.pointSelectionModeOn && xValOnMouseMove !== null && xValOnMouseMove !== undefined) {
      const chartClickInfo = {
        id: args.unique_key,
        xPoint: args.xaxiskey === 'date' ? d3.timeFormat('%Y-%m-%d')(xValOnMouseMove) : xValOnMouseMove
      };
      args.pointSelectionClbk(chartClickInfo);
    }
  }


  //show on initial load - to show segmentation aggregated details
  handleChartMouseOut();

  //Remove tooltip on mouse out
  function handleChartMouseOut() {
    if (chartHoverLocked) return false; //if locked no hover allowed
    if (focus) focus.style("display", "none");
    if (hoverYGridLine) hoverYGridLine.style("display", "none");
    if (hoverXGridLine) hoverXGridLine.style("display", "none");
    if (xAxisSliderGroup) xAxisSliderGroup.style('display', 'none');
    if (yAxisSliderGroup) yAxisSliderGroup.style("display", 'none');
    if (tooltip) tooltip.style('display', 'none');

    // show aggregated table when not hovering the chart - show when chart is selected
    if(window.currentSelectedWidget===args.unique_key){
      showAggregatedSegmentsDetails(args, initialConfig, color);
    }
  }

  // function scalePointPosition(mousePos) {
  //   var domain = xScale.domain();
  //   var range = xScale.range();
  //   var rangePoints = d3.range(range[0], range[1], xScale.step());
  //   var xPos = mousePos;
  //   var yPos = domain[d3.bisect(rangePoints, xPos) - 1];
  //   // console.log('range', range[0]+'---'+range[1]+'---step: '+xScale.step()+'--x: '+xPos+'--y: '+yPos);
  //   return yPos;
  // }

  let inViewPoints = [];
  if (isSegmented) {
    linePointsWrapper.selectAll('.line-pt')
      .each(function (d, i) {
        const pt = d3.select(`.line-pt-${args.unique_key}-${i}`);
        const xPos = parseFloat(pt.attr("cx"));
        const yPos = parseFloat(pt.attr("cy"));

        const segment = pt.attr(`data-${chartSegmentation}`); // only available when segmentation is ON
        if (xPos >= 0 && xPos <= width && yPos >= 0 && yPos <= innerHeight) {
          inViewPoints.push({ xPos, yPos, segment, xVal: d[args.xaxiskey], yVal: d[args.yaxiskey], ptColor: pt.attr("fill") });
        }
      });
  }

  function findNearesetPointToMouse(pointList, mousePos) {
    let np = null, npIndex = -1, nDistSq = Number.POSITIVE_INFINITY;
    pointList.forEach((p, i) => {
      const distSq = Math.pow(p.xPos - mousePos[0], 2) + Math.pow(p.yPos - mousePos[1], 2);
      if (distSq < nDistSq) { nDistSq = distSq; np = p; npIndex = i }
    });
    return [np, npIndex];
  }

  // var pointToFocusOnMouseMove = null;
  var xValOnMouseMove = null;
  var maxTooltipWidth = args.screen ? Math.round((initialConfig.maxTooltipWidth * window.innerWidth) / args.screen) : initialConfig.maxTooltipWidth;
  let tooltipTextXPos = isFitToWidthMode ? Math.round(2 * currentCanvasSize / args.screen) : 2;
  let segmentedTooltipTextXPos = isFitToWidthMode ? Math.round(1 * currentCanvasSize / args.screen) : 1;
  let tooltipTextYPos = isFitToWidthMode ? Math.floor(.2 * currentCanvasSize / args.screen) : .2;
  let tooltipRectPadding = isFitToWidthMode ? Math.round(3 * currentCanvasSize / args.screen) : 3;
  let tooltipPadding = isFitToWidthMode ? Math.round(4 * currentCanvasSize / args.screen) : 4;

  // const xHoveLineY2 = (height-(padding/2)+5); // used under draw Lines
  xScale.invert = function (x) {
    return d3.scaleQuantize().domain(this.range()).range(this.domain())(x);
  };
  yScale.invert = function (y) {
    return d3.scaleLinear().domain(this.range()).range(this.domain())(y);
  };

  //Show tooltip on mouse move
  function handleChartMouseMove() {
    if (chartHoverLocked) return false; //if locked no hover allowed
    var x0, y0, i, d1;
    var mouseX = d3.mouse(this)[0];
    var mouseY = d3.mouse(this)[1];

    //x0 - val, i= index, d0 - prev data obj, d1 - current data obj
    x0 = xScale.invert(mouseX);
    y0 = yScale.invert(mouseY);
    i = chartMainData.findIndex((e) => e[args.xaxiskey].toString() === x0.toString());
    d1 = chartMainData[i];

    try {
      // if (d1[args.yaxiskey] < yScaleLimits['lowerLimit'] || d1[args.yaxiskey] > yScaleLimits['upperLimit']) {console.log('here'); return;}
      var d = d1;
    } catch (e) { return; }

    var mouse = d3.mouse(chartHoverTrackPad.node());
    xValOnMouseMove = xScale.invert(mouse[0]);

    var xAxisVal;
    if (args.xaxiskey === 'date') {
      var date = new Date(d[args.xaxiskey]);
      xAxisVal = parsedDateString(date);
    } else {
      xAxisVal = d[args.xaxiskey];
    }

    // pointToFocusOnMouseMove may be undefined in case there is no point inside view(when zoomed too much)
    //  if (!pointToFocusOnMouseMove) {
    //   xAxisSliderGroup.style('display', 'none');
    //   yAxisSliderGroup.style('display', 'none');
    //   tooltip.style('display', 'none');
    //   return;
    // }
    // xAxisSliderGroup.style('display', null);
    // yAxisSliderGroup.style('display', null);
    // tooltip.style('display', null);

    //Generate tooltip details
    var chartWidth = width - 80;
    var chartXPos = 0;

    //show horizontal line on mouse hover on chart
    hoverYGridLine.style('display', 'block')
      .attr("transform", "translate(" + parseInt(initialConfig.chartLeftPadding) + "," + parseInt(mouseY) + ")");
    hoverYGridLine.select('.y-hover-line')
      .attr('x1', parseInt(-initialConfig.chartLeftPadding + xStartPoint))
      .attr('x2', parseInt(xEndPoint - initialConfig.chartLeftPadding));

    //show vertical line on mouse hover on chart
    hoverXGridLine.style('display', 'block')
      .attr("transform", "translate(" + parseInt(mouseX) + "," + parseInt(initialConfig.chartTopPadding) + ")");
    hoverXGridLine.select('.x-hover-line')
      .attr('y1', 0)
      .attr('y2', parseInt(innerHeight + 4));

    //x-axis - slider elements
    if (xAxisSliderGroup) {
      let max_xslider_width = innerWidth; //innerWidth
      let xaxis_text = args.xaxiskey === 'date' ? parsedDateString(d[args.xaxiskey]) : d[args.xaxiskey];
      let xaxis_box_width = calculateTextWidth(xaxis_text, tickSliderFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica') + xAxisSliderRectWidthPadding;
      xaxis_box_width = xaxis_box_width <= max_xslider_width ? xaxis_box_width : max_xslider_width;

      // let xAxisLeftPadding = (icon_width + 2);
      let xAxisLeftPadding = 0;
      let xTickValPosOrg = xScale(d[args.xaxiskey]);
      let xTickValPos = xTickValPosOrg;
      let xTickValAvailableWidth = (width - initialConfig.chartRightPadding - xTickValPosOrg);

      // adjust starting bars x slider left position
      let lockIconXPos = 0;
      let leftMouseXScrollPos = (mouseX - initialConfig.chartLeftPadding - (initialConfig.inbetweenChartAndYAxisPadding + 1));
      xTickValPos = xTickValPosOrg - xaxis_box_width / 2 - xAxisLeftPadding / 2; //default

      if (leftMouseXScrollPos <= xaxis_box_width / 2) { // left position
        let leftAvailableWidth = xTickValPosOrg - initialConfig.chartLeftPadding - initialConfig.inbetweenChartAndYAxisPadding;
        xTickValPos = xTickValPosOrg - leftAvailableWidth;
        xAxisLeftPadding = 0;
        lockIconXPos = xaxis_box_width + 2;
      }
      // adjust end bars x slider right position
      if (xTickValAvailableWidth <= xaxis_box_width / 2) { // adjust end bars x slider right position
        // xTickValPos = xTickValPosOrg - xaxis_box_width - chartRightPadding + inbetweenChartAndYAxisPadding + xTickValAvailableWidth;
        // xTickValPos = (width - chartRightPadding - (xaxis_box_width + xAxisLeftPadding - 1));
        xTickValPos = (width - initialConfig.chartRightPadding - xaxis_box_width);
      }

      //x-axis slider tick elements
      if (xTickValPos > (innerWidth - xaxis_box_width / 2 + 5)) {
        xTickValPos = (innerWidth - xaxis_box_width / 2 + 5);
      } else if (xTickValPos < (initialConfig.chartLeftPadding + 5)) {
        xTickValPos = initialConfig.chartLeftPadding + 5;
      }


      xAxisSliderGroup.attr("transform", "translate(" + parseInt(xTickValPos) + "," + parseInt(xAxisBottomPos - xAxisSliderRectWidthPadding) + ")").style('display', 'block'); // bgBottomPadding is extra bg rect padding
      xAxisSliderGroup.select(".hover-line-status").attr("x", lockIconXPos).attr("y", initialConfig.tickSliderPadding); //lock icon position
      let xAxisSliderTextTopPos = isFitToWidthMode ? Math.round(9 * currentCanvasSize / args.screen) : 9;
      let xAxisSliderTextLeftPos = (xAxisLeftPadding + (isFitToWidthMode ? Math.round(5 * currentCanvasSize / args.screen) : 5));

      async function renderXSliderText() {
        xHoverRectText
          .text(xaxis_text)
          .attr("dy", "1em")
          .attr('x', xAxisSliderTextLeftPos)
          .attr('y', xAxisSliderTextTopPos)
          .style('text-align', 'center')
          .call(trimFromAnyCharacter, xaxis_box_width)
          .style('display', 'block');
      }
      renderXSliderText().then(() => {
        xHoverRect
          .attr('width', xaxis_box_width)
          .attr('height', xTickSliderHeight)
          .attr('x', xAxisLeftPadding)
          .attr('y', 4)
          .style('text-align', 'center')
          .style('display', 'block');
      });
    }

    // y-axis
    if (yAxisSliderGroup) {
      // let yval_digits_count = getDigitsCount(d[args.yaxiskey]);
      let yval_digits_count = getDigitsCount(y0);
      let round_var = yval_digits_count - 2;
      let rounded_val = Math.round(y0 * Math.pow(10, round_var) / Math.pow(10, round_var));
      let yaxis_text = formatNumber(rounded_val);
      let yaxis_box_width = calculateTextWidth(yaxis_text, tickSliderFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica') + 4 + 10;
      let yaxis_box_left_pos = 3;

      // let ySliderPos = yScale(d[args.yaxiskey]);
      let ySliderPos = (mouseY - 2);
      if (ySliderPos < 6) {
        ySliderPos = 6;
      } else if (ySliderPos > (innerHeight - 7)) {
        ySliderPos = innerHeight - 7;
      }

      // yAxisSliderGroup.attr("transform", "translate(" + yaxis_box_left_pos + "," + ySliderPos + ")"); // bgBottomPadding is extra bg rect padding
      yAxisSliderGroup.attr("transform", "translate(" + yaxis_box_left_pos + "," + ySliderPos + ")").style('display', 'block'); // bgBottomPadding is extra bg rect padding
      yHoverRect
        .attr('width', (initialConfig.chartLeftPadding + 5))
        .attr('x', 0)
        .attr('y', -(initialConfig.tickHoverBoxHeight / 2))
        .style('display', 'block');
      yHoverRectText.text(yaxis_text)
        .attr('x', (initialConfig.chartLeftPadding - yaxis_box_width + 5))
        .attr('y', yTickSliderTextPosTop)
        .style('display', 'block');
    }

    //Draw multi-lines (isSegmented is being used to draw segmented like table to show hover values)
    let textLinesCount;
    if (isSegmented) {
      let [pointToFocusOnMouseMove, pointToFocusOnMouseMoveIndex] = findNearesetPointToMouse(inViewPoints, d3.mouse(this));

      // If Segementation is ON,find the points which lie exactly at the same point as 'pointToFocusOnMouseMove'
      // const superImposingPoints = chartSegmentation ? inViewPoints.filter((p, i) => i !== pointToFocusOnMouseMoveIndex && p.xPos === pointToFocusOnMouseMove.xPos && p.yPos === pointToFocusOnMouseMove.yPos) : [];

      if (!pointToFocusOnMouseMove) return;
      let xAxisHoverGrpPos = pointToFocusOnMouseMove.xPos;
      let yAxisHoverGrpPos = pointToFocusOnMouseMove.yPos;

      //show highlighted circle on hover
      if (pointToFocusOnMouseMoveIndex > -1) {
        focus.attr("transform", "translate(" + xAxisHoverGrpPos + "," + yAxisHoverGrpPos + ")").style("display", "block");
        focus.selectAll('circle').attr('stroke', pointToFocusOnMouseMove.ptColor);
      }

      if(window.currentSelectedWidget===args.unique_key){
        //Sort segmentated values
        dataNest = sortSegmentedData(args, dataNest, xAxisVal);

        //show legend information in table format
        showHoverSegmentDetails(args, initialConfig, dataNest, d, xAxisVal, xValOnMouseMove, color, 'line');
      }
      

      //Show Tooltip
      if (args.pointSelectionModeOn) {
        tooltip_text = 'Click to select';
      } else {
        tooltip_text = args.yaxiskey + ': ' + args.chartCurrencySymbol + numberWithCommas(pointToFocusOnMouseMove.yVal) + args.chartPercentSymbol; //details;
      }

      tooltip_text_width = calculateTextWidth(tooltip_text, toolTipFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica');
      tooltip_width = parseInt(tooltip_text_width) + tooltipPadding;
      tooltip_width = tooltip_width <= maxTooltipWidth ? tooltip_width : maxTooltipWidth;
      const widthAvailableAtBottomOfPointInFocus = innerHeight - yAxisHoverGrpPos;
      const widthAvailableAtLeftOfPointInFocus = xAxisHoverGrpPos + initialConfig.inbetweenChartAndXAxisPadding;
      const widthAvailableAtRightOfPointInFocus = innerWidth + initialConfig.inbetweenChartAndXAxisPadding - widthAvailableAtLeftOfPointInFocus;

      // first just set the text so that we can count the lines produced
      tooltipRectText.text(tooltip_text).call(wrapFromAnyCharacter, tooltip_text_width);

      textLinesCount = tooltipRectText.selectAll('tspan').size();
      textLinesCount = (textLinesCount === undefined || textLinesCount === 0) ? 1 : textLinesCount;
      const tooltip_height = textLinesCount * initialConfig.tooltipHeight + textLinesCount;

      if (widthAvailableAtBottomOfPointInFocus < tooltip_height + tooltipPadding) {
        tooltip_top = - (tooltip_height + tooltipPadding);
      } else {
        tooltip_top = tooltipPadding;
      }

      chartXPos = (xScale(xValOnMouseMove) + tooltip_width);
      if (widthAvailableAtRightOfPointInFocus < tooltip_width + tooltipPadding) {
        tooltip_left = - (tooltip_width + tooltipPadding);
      } else {
        tooltip_left = tooltipPadding;
      }

      //show tooltip in bottom on extra small widget size
      if (!initialConfig.showXAxisTicks) {
        tooltip_left = 0;
        tooltip_top = 0;
        xAxisHoverGrpPos = 0;
        yAxisHoverGrpPos = xAxisBottomPos;
      }

      //show hover indicator and tooptip
      tooltip.style('display', 'block').attr('transform', `translate(${xAxisHoverGrpPos},${yAxisHoverGrpPos})`);
      tooltipRect.attr('x', tooltip_left)
        .attr('y', tooltip_top)
        .attr('width', tooltip_width)
        .attr('height', tooltip_height)
        .style('display', initialConfig.showXAxisTicks ? 'block' : 'none');
      tooltipRectText
        .attr('x', tooltip_left + segmentedTooltipTextXPos)
        .attr('y', tooltip_top)
        .attr('fill', (initialConfig.showXAxisTicks) ? '#000' : '#fff')
        .attr('dx', initialConfig.tickSliderPadding + (textLinesCount > 1 ? 2 : 0))
        .attr('dy', '1em')
        .style('display', 'block');

    } else {
      //show highlighted circle on hover
      focus.attr("transform", "translate(" + xScale(d[args.xaxiskey]) + "," + yScale(d[args.yaxiskey]) + ")").style('display', 'block');

      if (args.pointSelectionModeOn) {
        tooltip_text = 'Click to select';
      } else {
        tooltip_text = args.yaxiskey + ': ' + args.chartCurrencySymbol + numberWithCommas(d[args.yaxiskey]) + args.chartPercentSymbol; //details;
      }
      let tooltipPadding = isFitToWidthMode ? Math.round(4 * currentCanvasSize / args.screen) : 4;
      tooltip_text_width = calculateTextWidth(tooltip_text, toolTipFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica');
      tooltip_width = parseInt(tooltip_text_width) + tooltipPadding;
      tooltip_width = tooltip_width <= maxTooltipWidth ? tooltip_width : maxTooltipWidth;
      tooltip_pos_adjustment = initialConfig.tooltipHeight + (initialConfig.inbetweenChartAndXAxisPadding < 5 ? 5 : initialConfig.inbetweenChartAndXAxisPadding);
      tooltip_top = (yScale(d[args.yaxiskey]) - tooltip_pos_adjustment); //if totalVal is set use that position else use individual bar/bar_block position
      tooltip_top = tooltip_top < 0 ? (yScale(d[args.yaxiskey]) + initialConfig.tooltipHeight / 2) : tooltip_top;

      chartXPos = (xScale(xValOnMouseMove) + tooltip_width);
      tooltip_left = chartXPos > chartWidth ? Math.ceil(xScale(xValOnMouseMove) - tooltip_width) - 5 : Math.ceil(xScale(xValOnMouseMove)) + 5;

      //show tooltip in bottom on extra small widget size
      if (!initialConfig.showXAxisTicks) {
        tooltip_left = 0;
        tooltip_top = xAxisBottomPos;
      }

      //show hover indicator and tooptip
      let textLinesCount = 1;
      tooltip.style('display', 'block').attr("transform", "translate(" + parseInt(tooltip_left) + "," + parseInt(tooltip_top) + ")");
      async function renderTooltipText() {
        tooltipRectText
          .text(tooltip_text)
          .attr("dy", "1em")
          .attr('x', tooltipTextXPos)
          .attr('y', tooltipTextYPos)
          .attr('fill', (initialConfig.showXAxisTicks) ? '#000' : '#fff')
          .call(wrapFromAnyCharacter, tooltip_width)
          .style('display', 'block');
        textLinesCount = tooltipRectText.selectAll('tspan').size();
        textLinesCount = (textLinesCount === undefined || textLinesCount === 0) ? 1 : textLinesCount;
      }
      renderTooltipText().then(() => {
        tooltipRect
          .attr('width', tooltip_width)
          .attr('height', textLinesCount * (toolTipFontSize + tooltipRectPadding) + textLinesCount) //increase height of rectangle as per text
          .attr('x', 0)
          .attr('y', 0)
          .style('display', initialConfig.showXAxisTicks ? 'block' : 'none');
      });
    }
  }
}


function drawScatterChart2(args) {
  //chart initial settings variables
  const initialConfig = getInitialChartConfig(args);
  if (!initialConfig) return;

  //basic configurations
  let width = args.chartWrapper.current.offsetWidth;
  let innerWidth = width - (initialConfig.chartLeftPadding + initialConfig.chartRightPadding + initialConfig.inbetweenChartAndYAxisPadding);
  let chartWrapperHeight = d3.select('#chart-' + args.unique_key).node().getBoundingClientRect().height;
  let height = chartWrapperHeight - initialConfig.chartWidgetBottomPadding - initialConfig.chartHeadingSectionHeight;
  if (args.excludeChartHeader !== undefined) { // if chart width is less than default add removed chart header+margin heightto chart height
    height = height + initialConfig.chartInnerHeadingSectionHeightWithMargin + (initialConfig.chartWidgetBottomPadding - 5);
  }
  let innerHeight = (height - initialConfig.chartBottomPadding - initialConfig.chartTopPadding);
  let xAxisBottomPos = (height - initialConfig.chartBottomPadding + initialConfig.inbetweenChartAndXAxisPadding);
  d3.select(args.chartWrapper.current).style("height", height + 'px'); //set chart height

  //Chart icons
  let iconLock = '<g class="nc-icon-wrapper" fill="#ff0000" transform="translate(0, 0)"><path d="M21,10H18V6.01A5.96,5.96,0,0,0,12.1,0h-.09A5.94,5.94,0,0,0,6,5.9V10H3a1,1,0,0,0-1,1V23a1,1,0,0,0,1,1H21a1,1,0,0,0,1-1V11A1,1,0,0,0,21,10Zm-9,9a2,2,0,1,1,2-2A2,2,0,0,1,12,19Zm4-9H8V5.91A3.957,3.957,0,0,1,11.959,2h.131A3.957,3.957,0,0,1,16,6Z" fill="#ff0000"></path></g>';
  let iconUnlock = '<g class="nc-icon-wrapper" fill="#00ff7f" transform="translate(0, 0)"><path d="M21,10H8V5.91A3.957,3.957,0,0,1,11.959,2h.131A3.955,3.955,0,0,1,16,5.99l2,.02A5.96,5.96,0,0,0,12.1,0h-.09A5.94,5.94,0,0,0,6,5.9V10H3a1,1,0,0,0-1,1V23a1,1,0,0,0,1,1H21a1,1,0,0,0,1-1V11A1,1,0,0,0,21,10Zm-9,9a2,2,0,1,1,2-2A2,2,0,0,1,12,19Z" fill="#00ff7f"></path></g>';
  let iconZoomIn = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="16px" height="16px" viewBox="0 0 16 16"><g transform="translate(0, 0)"><path d="M12.7,11.3c0.9-1.2,1.4-2.6,1.4-4.2C14.1,3.2,11,0,7.1,0S0,3.2,0,7.1c0,3.9,3.2,7.1,7.1,7.1 c1.6,0,3.1-0.5,4.2-1.4l3,3c0.2,0.2,0.5,0.3,0.7,0.3s0.5-0.1,0.7-0.3c0.4-0.4,0.4-1,0-1.4L12.7,11.3z M7.1,12.1 C4.3,12.1,2,9.9,2,7.1S4.3,2,7.1,2s5.1,2.3,5.1,5.1S9.9,12.1,7.1,12.1z"></path> <polygon data-color="color-2" points="8,4 6,4 6,6 4,6 4,8 6,8 6,10 8,10 8,8 10,8 10,6 8,6 "></polygon></g></svg>';
  let iconZoomOut = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="16px" height="16px" viewBox="0 0 16 16"><g transform="translate(0, 0)"><path d="M12.7,11.3c0.9-1.2,1.4-2.6,1.4-4.2C14.1,3.2,11,0,7.1,0S0,3.2,0,7.1c0,3.9,3.2,7.1,7.1,7.1 c1.6,0,3.1-0.5,4.2-1.4l3,3c0.2,0.2,0.5,0.3,0.7,0.3s0.5-0.1,0.7-0.3c0.4-0.4,0.4-1,0-1.4L12.7,11.3z M7.1,12.1 C4.3,12.1,2,9.9,2,7.1S4.3,2,7.1,2s5.1,2.3,5.1,5.1S9.9,12.1,7.1,12.1z"></path> <rect data-color="color-2" x="4" y="6" width="6" height="2"></rect></g></svg>';

  let currentCanvasWidth = (window.innerWidth - 10);
  let isFitToWidthMode = (args.screen && !args.isDashboardInEditMode && (args.viewModeType !== undefined && args.viewModeType.name === 'Fit to Width'));
  let tickFontSize = isFitToWidthMode ? Math.round(10 * currentCanvasWidth / args.screen) : 10;
  let xAxisTickStartPos = isFitToWidthMode ? Math.round(75 * currentCanvasWidth / args.screen) : 75;
  let yAxisTickTopPos = isFitToWidthMode ? Math.round(5 * currentCanvasWidth / args.screen) : 5;
  let tickSliderFontSize = isFitToWidthMode ? Math.round(11 * currentCanvasWidth / args.screen) : 11;
  let toolTipFontSize = isFitToWidthMode ? Math.round(11 * currentCanvasWidth / args.screen) : 11;
  let circleSize = isFitToWidthMode ? Math.round(1.5 * currentCanvasWidth / args.screen) : 1.5;
  let highlighterCircleSize = isFitToWidthMode ? Math.round(4 * currentCanvasWidth / args.screen) : 4;
  // let noteCircleSize = isFitToWidthMode ? Math.round(5 * currentCanvasWidth / args.screen) : 5;

  //Define charts configs
  let isSegmented = (args.chartSegmentation && args.chartSegmentation !== '' && args.chartSegmentation !== 'all' && args.chartSegmentation !== ' ');
  let chartSegmentation = isSegmented ? args.chartSegmentation : '';
  let chartHoverLocked = false;
  let circleColor = args.chartFormat.color.single_color !== '' ? args.chartFormat.color.single_color : chartColors[0]; //pick selected color
  let color = getColor(args);
  let parseDate = d3.timeFormat("%m.%d.%Y"),
    parsedDateString = d3.timeFormat("%d %b %Y"),
    formatYNumber = d3.format("");

  // Data variable
  let chartMainData = []//[...args.data];

  //Define SVG and group element
  let svg = getSVGElement(args.chartWrapper.current, width, height);
  let chart = getGroupElement(svg, args.yaxiskey);

  //Compute Y-axis tick values
  let y_steps = args.yAxisTicksCount !== undefined ? args.yAxisTicksCount : initialConfig.defaultYAxisTicksCount;
  let yScaleLimits = (args.isEmpty === undefined && args.data.length > 0) ? getMinMaxRange(args.data, args.yaxiskey) : { lowerLimit: 0, upperLimit: 10 };
  if (args.chartFormat.yaxis.min !== '') { yScaleLimits['lowerLimit'] = args.chartFormat.yaxis.min; }
  if (args.chartFormat.yaxis.max !== '') { yScaleLimits['upperLimit'] = args.chartFormat.yaxis.max; }

  args.data.map((d) => {
    if (d[args.yaxiskey] >= yScaleLimits['lowerLimit'] && d[args.yaxiskey] <= yScaleLimits['upperLimit']) {
      chartMainData.push(d);
    }
  });

  //return from here if data is not available
  if (!chartMainData || chartMainData.length === 0) return;

  // Scaling Points - start and end
  let xStartPoint = initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndYAxisPadding;
  let xEndPoint = (width - initialConfig.chartRightPadding);
  let yStartPoint = xAxisBottomPos - initialConfig.inbetweenChartAndXAxisPadding - 1;
  let yEndPoint = initialConfig.chartTopPadding;

  let xDomains = chartMainData.map((d) => d[args.xaxiskey]);
  let xScaleType = typeof xDomains[0] === 'number' ? 'linear' : 'point';
  let x_steps = args.xAxisTicksCount !== undefined ? args.xAxisTicksCount : initialConfig.defaultXAxisTicksCount;
  if (chartSegmentation !== 'all' && chartSegmentation !== '' && args.xaxiskey === 'date') { //Draw multi-lines
    let allXDomains = d3.nest().key((d) => d[args.xaxiskey]).entries(chartMainData);
    xDomains = [];
    allXDomains.forEach(function (d) {
      if (d.key) {
        d.key = new Date(d.key);
        xDomains.push(new Date(d.key));
      }
    })
  }

  if (args.xaxiskey !== 'date' && typeof xDomains[0] === 'string') {
    // xaxiskey is of type 'string'
    // In this case, sort the x axis values. Without segmentation it is not mandatory to sort, but to be consistent sort in both cases.
    xDomains = xDomains.sort();
  } else if (args.xaxiskey !== 'date' && typeof xDomains[0] !== 'string') {
    xDomains.sort((a, b) => a - b);
  }

  /* Define and create xScale, xAxis, ticks */
  let xScaleLimits;
  let xScale;
  let xAxis;
  let xTickValuesDisplay = getXAxisTickValues(initialConfig, xDomains, chartMainData, args, 'scatterplot'); // get x axis calculated tick values

  async function defineXScale() {
    // Set x axis scale
    if (xScaleType === 'linear') {
      xScaleLimits = (!args.isEmpty) ? getMinMaxRange(chartMainData, args.xaxiskey) : { lowerLimit: 0, upperLimit: 10 };
      xScale = d3.scaleLinear()
        .domain([xScaleLimits['lowerLimit'], xScaleLimits['upperLimit']])
        .range([xStartPoint, xEndPoint]);

    } else {
      // xDomains = xDomains.sort((a, b) => a < b ? -1 : 1);

      xScale = d3.scalePoint()
        .domain(xDomains)
        .range([xStartPoint, xEndPoint])
        .padding(.25);
    }

    // Set x axis ticks
    xAxis = d3.axisBottom(xScale)
      .tickValues(xTickValuesDisplay)
      .tickSize(0)
      .tickPadding(5)
      .tickFormat((d) => {
        let val = args.xaxiskey === 'date' ? d3.timeFormat("%m.%d.%Y")(d) : xScaleType === 'linear' ? formatNumber(formatYNumber(d)) : d.substring(0, 10);
        return val;
      });

    //Draw x-axis
    chart.append("g")
      .attr("class", "axis x-axis")
      .attr("transform", "translate(0," + (xAxisBottomPos) + ")") //start with 10px instead of 0
      .call(xAxis)
      .attr('font-size', tickFontSize + 'px');
  }
  defineXScale().then(() => {
    //Change x axis first and last tick position
    alignXAxisTicks(width, args.unique_key, initialConfig, xTickValuesDisplay, xDomains, parseDate, tickFontSize, xAxisTickStartPos);
  });


  if (args.chartFormat.yaxis.tick !== '' && args.chartFormat.yaxis.tick > 0) {
    y_steps = Math.floor(yScaleLimits['upperLimit'] / args.chartFormat.yaxis.tick) + 1;
  }

  let hasCustomFormat = (args.chartFormat.yaxis.tick || args.chartFormat.yaxis.min || args.chartFormat.yaxis.max) ? true : false;
  let customTickInterval = hasCustomFormat ? args.chartFormat.yaxis.tick : null;
  let yDomains = [];
  let yTickValues = [];
  if (y_steps > 1) {
    yDomains = getTickValues(yScaleLimits['lowerLimit'], yScaleLimits['upperLimit'], y_steps, hasCustomFormat, customTickInterval);
  }
  if (initialConfig.showYAxisTicks) {
    yTickValues = [...yDomains];
  }


  /* Define and create yScale, yAxis, ticks */
  var yScale;
  var yAxis;
  let xAxisSliderGroup;
  async function defineYScale() {
    //Set y axis scale
    // console.log(yScaleLimits , yStartPoint , yEndPoint , 'scatter')
    let upperYLimit = args.chartSizeClass === "xs-grid-width" ? yScaleLimits['upperLimit'] : yTickValues[yTickValues.length-1];
    yScale = d3.scaleLinear()
      .domain([yScaleLimits['lowerLimit'], upperYLimit])//yScaleLimits['upperLimit']])
      .range([yStartPoint, (yEndPoint + highlighterCircleSize/2)]);

    //Set y axis ticks
    yAxis = d3.axisLeft(yScale)
      .tickValues(yTickValues)
      .tickSize(0)
      .tickFormat((d) => { return formatNumber(formatYNumber(d)); })
      .tickPadding(5);

    //Draw y axis
    chart.append("g")
      .attr("class", "axis y-axis")
      .attr("transform", "translate(" + initialConfig.chartLeftPadding + ", 0)")
      .call(yAxis)
      .attr('font-size', tickFontSize + 'px')
  }
  defineYScale().then(() => {
    //Change y axis first and last tick position
    alignYAxisTicks(innerHeight, args.unique_key, initialConfig, yAxisTickTopPos);
  });

  // Hide the path(line) of x-axis so that only dummy x-axis line is visible
  chart.select('.x-axis').select('path').style('stroke-opacity', 0);

  // Hide the path(line) of y-axis so that only dummy x-axis line is visible
  chart.select('.y-axis').select('path').style('stroke-opacity', 0);

  // Draw a colored background for chart, its purpose is just to give a background color to chart area
  let bgBottomPadding = 2;
  chart.append('rect')
    .attr('width', innerWidth)
    .attr('height', innerHeight + bgBottomPadding)
    .attr('x', initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndYAxisPadding)
    .attr('y', initialConfig.chartTopPadding)
    .attr('class', 'chart-bg');

  /**X-AXIS HOVER GRP ---- START */
  let xTickSliderWidth = isFitToWidthMode ? Math.round(60 * currentCanvasWidth / args.screen) : 60;
  let xAxisSliderRectWidthPadding = isFitToWidthMode ? Math.round(8 * currentCanvasWidth / args.screen) : 8
  let xTickSliderHeight = initialConfig.xTickSliderHeight;
  let xTickSliderTextPosTop = isFitToWidthMode ? Math.round(4 * currentCanvasWidth / args.screen) : 4;

  xAxisSliderGroup = chart.append('g').attr('class', 'xaxis-slider-group').attr('transform', `translate(0,0)`).style('display', 'none');
  if (initialConfig.showXAxisTicks) {
    xAxisSliderGroup.append('rect')
      .attr("x", 0)
      .attr('y', 0) // rest attrib like x,width,height will be assigned at mouse hover
      .attr("rx", 1)
      .attr("width", xTickSliderWidth)
      .attr("height", xTickSliderHeight)
      .attr("class", 'hover-xaxis-bg');
    xAxisSliderGroup.append('text')
      .text('')
      .attr('font-size', tickSliderFontSize + 'px')
      .attr('y', xTickSliderTextPosTop)
      .attr("fill", "#fff")
      .attr("class", "hover-xaxis-text")
      .attr('transform', `translate(0,${initialConfig.tickHoverBoxHeight - initialConfig.inbetweenChartAndXAxisPadding})`);
  }
  // xAxisSliderGroup.append("line")
  //   .attr("class", "hover-xaxis-line hover-line")
  //   .attr("x1", 0)
  //   .attr("x2", 0)
  //   .attr("y1", -xAxisBottomPos + chartTopPadding + 3)
  //   .attr("y2", 0);
  /**X-AXIS HOVER GRP ---- END */

  /**Y-AXIS HOVER GRP ---- START */
  let yTickSliderWidth = isFitToWidthMode ? Math.round(30 * currentCanvasWidth / args.screen) : 30;

  let yAxisSliderGroup = chart.append('g').attr('class', 'yaxis-slider-group').attr('transform', `translate(0,0)`).style('display', 'none');
  if (initialConfig.showYAxisTicks) {
    yAxisSliderGroup.append('rect')
      .attr('x', 0) // rest attrib like y,width,height will be assigned at mouse hover
      .attr("rx", 1)
      .attr("width", yTickSliderWidth)
      .attr("class", 'hover-yaxis-bg')
      .attr('transform', `translate(${-(initialConfig.inbetweenChartAndYAxisPadding + initialConfig.tickSliderPadding)},0)`);
    yAxisSliderGroup.append('text')
      .text('')
      .attr('font-size', tickSliderFontSize + 'px')
      .attr('x', 0)
      .attr("fill", "#fff")
      .attr("class", "hover-yaxis-text")
      .attr('transform', `translate(${-(initialConfig.inbetweenChartAndYAxisPadding + initialConfig.tickSliderPadding)}, ${initialConfig.tickSliderPadding})`);
  }
  // yAxisSliderGroup.append("line")
  //   .attr("class", "hover-yaxis-line hover-line")
  //   .attr("x1", 0)
  //   .attr("x2", innerWidth)
  //   .attr("y1", 0)
  //   .attr("y2", 0);
  /**Y-AXIS HOVER GRP ---- END */

  const scatterPointsWrapper = chart.append('g').attr("clip-path", `url(#clip-${args.unique_key})`);
  if (args.isEmpty) {
    chart.append("text")
      .attr("y", ((height / 2)))
      .attr("x", (width / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text('No data available')
      .style("fill", "#fff")
      .attr("class", "no-data");
    return;
  }

  // Draw scatter plot circles depending on segmentation on/off
  if (isSegmented) {
    // Group the data by segmentation value (e.g. Revenue vs Date Chart segmented by AdUnit) so that 
    // chart can be plotted for each group one by one, each group having a particular color
    var dataNest = d3.nest().key((d) => {
      return d[chartSegmentation];
    }).entries(chartMainData);


    // Draw scatter plot circles 
    scatterPointsWrapper.selectAll('.scatter-pt')
      .data(dataNest.reduce((dataPts, dn) => dataPts.concat(dn.values), []))
      .enter()
      .append('circle')
      .attr('class', (i) => `scatter-pt scatter-pt-${args.unique_key}-${i}`)
      .attr('cx', function (d) { return xScale(d[args.xaxiskey]); })
      .attr('cy', function (d) { return yScale(d[args.yaxiskey]); })
      .attr('r', circleSize)
      .attr(`data-${chartSegmentation}`, function (d) { return d[chartSegmentation]; })
      .attr('fill', function (d) { return color(d[chartSegmentation]); });

  } else {
    scatterPointsWrapper.selectAll('.scatter-pt')
      .data(chartMainData).enter().append('circle')
      .attr('cx', function (d) {
        let xVal = d[args.xaxiskey];
        if (xScaleType === 'linear') {
          if (args.chartFormat.xaxis.max && xVal > args.chartFormat.xaxis.max) {
            xVal = parseInt(args.chartFormat.xaxis.max);
          }
          if (args.chartFormat.xaxis.min && xVal < args.chartFormat.xaxis.min) {
            xVal = parseInt(args.chartFormat.xaxis.min);
          }
        }
        return xScale(xVal);
      })
      .attr('cy', function (d) {
        let yVal = d[args.yaxiskey];
        if (args.chartFormat.yaxis.max && yVal > args.chartFormat.yaxis.max) {
          yVal = parseInt(args.chartFormat.yaxis.max);
        }
        if (args.chartFormat.yaxis.min && yVal < args.chartFormat.yaxis.min) {
          yVal = parseInt(args.chartFormat.yaxis.min);
        }
        return yScale(yVal);
      })
      .attr('r', circleSize)
      .attr('class', (i) => `scatter-pt scatter-pt-${args.unique_key}-${i}`)
      .attr('fill', function () { return circleColor; });
  }

  // Draw the marker for notes if chartNotes are available
  if (args.chartNotes) {
    scatterPointsWrapper.selectAll('.note-marker')
      .data(args.chartNotes).enter().append('text')
      .text('*')
      .attr('text-anchor', 'middle')
      .attr('font-size', '1.5em')
      .attr('class', 'note-marker')
      .attr('fill', '#ff0000')
      .attr('x', function (d) { return xScale(d.x_axis_point); })
      .attr('y', function () { return innerHeight / 2 });
  }

  //tooltip
  let focus = chart.append("g").attr("class", "focus").style("display", "none");
  focus.append("circle")
    .attr("r", highlighterCircleSize)
    .attr('stroke', lineColor)
    .attr('fill', 'none')
    .attr('stroke-width', '1px');

  //cross hair lines
  var hoverYGridLine = chart.append("g").attr("class", "hover-grid-y-line").style("display", "none");
  hoverYGridLine.append("line")
    .attr("class", "y-hover-line hover-line")
    .attr("x1", xStartPoint)
    .attr("x2", xEndPoint);
  var hoverXGridLine = chart.append("g").attr("class", "hover-grid-x-line").style("display", "none");
  hoverXGridLine.append("line")
    .attr("class", "x-hover-line hover-line")
    .attr("y1", 0)
    .attr("y2", innerHeight);

  // Place tooltip to show on chart area showing detils of x and y dimensions
  const tooltip = chart.append("g")
    .attr("class", "tooltip")
    .style('display', 'none');
  const tooltipRect = tooltip.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 100)
    .attr('height', (toolTipFontSize + 2)) //increase height of rectangle as per text
    .attr('fill', '#dedede')
    .attr("rx", 2)
    .attr("class", 'tooltip-rect');
  const tooltipRectText = tooltip.append("text")
    .attr('font-size', toolTipFontSize + 'px')
    .text('')
    .attr('x', 0)
    .attr('y', 0)
    .attr("fill", "#000")
    .attr("class", "tooltip-text");


  //Place a hidden background of chart area just to listen the mouse events on it
  const chartTrackPadContainer = chart.append('g')
  .attr('x', initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndXAxisPadding)
  .attr('y', initialConfig.chartTopPadding)
  .attr('width', innerWidth)
  .attr('height', innerHeight + initialConfig.inbetweenChartAndYAxisPadding)
  .attr('class', 'trackpad-container');
  const chartHoverTrackPad = chartTrackPadContainer.append('rect')
    .attr('x', initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndXAxisPadding)
    .attr('y', initialConfig.chartTopPadding)
    .attr('width', innerWidth)
    .attr('height', innerHeight + initialConfig.inbetweenChartAndYAxisPadding)
    .style('opacity', '0')
    .attr('class', 'trackpad');

  // FOR SEGMENTED CHART, SHOW THE DEFAULT LEGEND DETAILS
  const handleChartMouseOut = function () {
    if (chartHoverLocked) return false; //if locked no hover allowed
    if (focus) focus.style("display", "none");
    if (hoverYGridLine) hoverYGridLine.style("display", "none");
    if (hoverXGridLine) hoverXGridLine.style("display", "none");
    xAxisSliderGroup.style('display', 'none');
    yAxisSliderGroup.style('display', 'none');
    tooltip.style('display', 'none');

    // show aggregated table when not hovering the chart
    if(window.currentSelectedWidget===args.unique_key){
      showAggregatedSegmentsDetails(args, initialConfig, color);
    }
  }

  if (chartSegmentation) {
    handleChartMouseOut();
  }

  function findNearesetPointToMouse(pointList, mousePos) {
    let np = null, npIndex = -1, nDistSq = Number.POSITIVE_INFINITY;
    pointList.forEach((p, i) => {
      const distSq = Math.pow(p.xPos - mousePos[0], 2) + Math.pow(p.yPos - mousePos[1], 2);
      if (distSq < nDistSq) { nDistSq = distSq; np = p; npIndex = i }
    });
    return [np, npIndex];
  }

  var pointToFocusOnMouseMove = null;
  var xValOnMouseMove = null;
  var maxTooltipWidth = isFitToWidthMode ? Math.round((initialConfig.maxTooltipWidth * currentCanvasWidth) / args.screen) : initialConfig.maxTooltipWidth;
  // let tooltipTextXPos = isFitToWidthMode ? Math.round(2 * currentCanvasWidth / args.screen) : 2;
  // let segmentedTooltipTextXPos = isFitToWidthMode ? Math.round(1 * currentCanvasWidth / args.screen) : 1;
  // let tooltipTextYPos = isFitToWidthMode ? Math.floor(.2 * currentCanvasWidth / args.screen) : .2;
  // let tooltipRectPadding = isFitToWidthMode ? Math.round(3 * currentCanvasWidth / args.screen) : 3;
  // let tooltipPadding = isFitToWidthMode ? Math.round(4 * currentCanvasWidth / args.screen) : 4;

  xScale.invert = function (x) {
    if (args.xaxiskey === 'date' || typeof xDomains[0] === 'string') {
      return d3.scaleQuantize().domain(this.range()).range(this.domain())(x);
    } else {
      return d3.scaleLinear().domain(this.range()).range(this.domain())(x);
    }
  };
  yScale.invert = function (y) {
    // console.log(this.domain())
    return d3.scaleLinear().domain(this.range()).range(this.domain())(y);
  };

  let inViewPoints = [];
  function trackAllScatterPoints() {
    if (inViewPoints.length !== 0) {
      inViewPoints = [];
    }
    scatterPointsWrapper.selectAll('.scatter-pt')
      .each(function (d, i) {
        const pt = d3.select(`.scatter-pt-${args.unique_key}-${i}`);
        const xPos = parseFloat(pt.attr("cx"));
        const yPos = parseFloat(pt.attr("cy"));
        const segment = pt.attr(`data-${chartSegmentation}`); // only available when segmentation is ON
        if (xPos >= 0 && xPos <= width && yPos >= 0 && yPos <= innerHeight) {
          inViewPoints.push({ xPos, yPos, segment, xVal: d[args.xaxiskey], yVal: d[args.yaxiskey] });
        }
      });
  }

  trackAllScatterPoints();

  const handleChartMouseMove = function () {
    if (chartHoverLocked) return false; //if locked no hover allowed
    var x0, y0, i, d1;
    var mouseX = d3.mouse(this)[0];
    var mouseY = d3.mouse(this)[1];

    //x0 - val, i= index, d0 - prev data obj, d1 - current data obj
    x0 = xScale.invert(mouseX);
    y0 = yScale.invert(mouseY);

    var d = {};

    if (args.xaxiskey === 'date' || typeof xDomains[0] === 'string') {
      i = chartMainData.findIndex((e) => { return e[args.xaxiskey].toString() === x0.toString() });
      d1 = chartMainData[i];
      try {
        d = d1;
      } catch (e) { return; }
    }

    var mouse = d3.mouse(chartHoverTrackPad.node());
    xValOnMouseMove = xScale.invert(mouse[0]);

    var xAxisVal;
    if (args.xaxiskey === 'date' || typeof xDomains[0] === 'string') {
      if (args.xaxiskey === 'date') {
        var date = new Date(d[args.xaxiskey]);
        xAxisVal = parsedDateString(date);
      } else {
        // console.log(d)
        xAxisVal = d[args.xaxiskey];
      }
    }

    // let inViewPoints = [];
    // scatterPointsWrapper.selectAll('.scatter-pt')
    //   .each(function (d, i) {
    //     const pt = d3.select(this);
    //     const xPos = parseFloat(pt.attr("cx"));
    //     const yPos = parseFloat(pt.attr("cy"));
    //     const segment = pt.attr(`data-${chartSegmentation}`); // only available when segmentation is ON
    //     if (xPos >= 0 && xPos <= width && yPos >= 0 && yPos <= innerHeight) {
    //       inViewPoints.push({ xPos, yPos, segment, xVal: d[args.xaxiskey], yVal: d[args.yaxiskey] });
    //     }
    //   });

    let pointToFocusOnMouseMoveIndex;
    [pointToFocusOnMouseMove, pointToFocusOnMouseMoveIndex] = findNearesetPointToMouse(inViewPoints, d3.mouse(this));

    // If Segementation is ON,find the points which lie exactly at the same point as 'pointToFocusOnMouseMove'
    const superImposingPoints = chartSegmentation ? inViewPoints.filter((p, i) => i !== pointToFocusOnMouseMoveIndex && p.xPos === pointToFocusOnMouseMove.xPos && p.yPos === pointToFocusOnMouseMove.yPos) : [];

    // pointToFocusOnMouseMove may be undefined in case there is no point inside view(when zoomed too much)
    if (!pointToFocusOnMouseMove) {
      xAxisSliderGroup.style('display', 'none');
      yAxisSliderGroup.style('display', 'none');
      tooltip.style('display', 'none');
      return;
    }
    xAxisSliderGroup.style('display', null);
    yAxisSliderGroup.style('display', null);
    tooltip.style('display', null);

    let xAxisHoverGrpPos = pointToFocusOnMouseMove.xPos;
    let yAxisHoverGrpPos = pointToFocusOnMouseMove.yPos;

    //show highlighted circle on hover
    if (pointToFocusOnMouseMoveIndex > -1) {
      focus.attr("transform", "translate(" + xAxisHoverGrpPos + "," + yAxisHoverGrpPos + ")").style("display", "block"); // bgBottomPadding is extra bg rect padding
    } else {
      focus.style('display', 'none');
      focus.attr("transform", "translate(-100%,-100%)"); // bgBottomPadding is extra bg rect padding
    }

    // Now set the positions of grp from above calculated positions
    // xAxisSliderGroup.attr("transform", `translate(${xAxisHoverGrpPos}, ${((xAxisBottomPos-4))})`); // bgBottomPadding is extra bg rect padding
    // yAxisSliderGroup.attr('transform', `translate(${chartLeftPadding + inbetweenChartAndXAxisPadding},${yAxisHoverGrpPos})`);

    // Now change the text of xaxis grp, adjust the position and size of the text and box - START
    let xaxis_text = args.xaxiskey === 'date' ? parsedDateString(new Date(pointToFocusOnMouseMove.xVal)) : pointToFocusOnMouseMove.xVal;
    // let xaxis_box_width = calculateTextWidth(xaxis_text, tickSliderFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica') + xAxisSliderRectWidthPadding;
    // let max_xslider_width = innerWidth + initialConfig.inbetweenChartAndXAxisPadding;
    // let xBoxWidth = Math.min(max_xslider_width, xaxis_box_width + (initialConfig.tickSliderPadding * 2));
    // xaxis_box_width = xaxis_box_width <= max_xslider_width ? xaxis_box_width : max_xslider_width;

    const widthAvailableAtLeftOfPointInFocus = xAxisHoverGrpPos + initialConfig.inbetweenChartAndXAxisPadding;
    const widthAvailableAtRightOfPointInFocus = innerWidth + initialConfig.inbetweenChartAndXAxisPadding - widthAvailableAtLeftOfPointInFocus;

    // let xBoxLeftPos;
    // if (widthAvailableAtLeftOfPointInFocus < xaxis_box_width / 2) {
    //   xBoxLeftPos = - widthAvailableAtLeftOfPointInFocus;
    // } else {
    //   // Enought space is available at left side
    //   // Now, further check if there is enough space at right side or not
    //   // if (widthAvailableAtRightOfPointInFocus < xaxis_box_width / 2) {
    //     // xBoxLeftPos = -  (xaxis_box_width - widthAvailableAtRightOfPointInFocus);
    //   // } else {
    //     // xBoxLeftPos = -  xaxis_box_width / 2;
    //   // }
    // }

    // Now change the text of xaxis grp, adjust the position and size of the text and box
    // START
    // const yval_digits_count = getDigitsCount(pointToFocusOnMouseMove.yVal);
    // const round_var = yval_digits_count - 2;
    // const rounded_val = Math.round(pointToFocusOnMouseMove.yVal * Math.pow(10, round_var) / Math.pow(10, round_var));
    // const yTxt = formatNumber(rounded_val);
    // const yTxtWidth = calculateTextWidth(yTxt, tickFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica');
    // const yBoxWidth = yTxtWidth + 4 + 10;
    // const yBoxLeftPos = 3;

    //show horizontal line on mouse hover on chart
    hoverYGridLine.style('display', 'block')
      .attr("transform", "translate(" + initialConfig.chartLeftPadding + "," + mouseY + ")");
    hoverYGridLine.select('.y-hover-line')
      .attr('x1', -initialConfig.chartLeftPadding + xStartPoint)
      .attr('x2', (xEndPoint - initialConfig.chartLeftPadding));

    //show vertical line on mouse hover on chart
    hoverXGridLine.style('display', 'block')
      .attr("transform", "translate(" + mouseX + "," + initialConfig.chartTopPadding + ")");
    hoverXGridLine.select('.x-hover-line')
      .attr('y1', 0)
      .attr('y2', innerHeight + 4);

    //x-axis - slider elements
    if (xAxisSliderGroup) {
      let max_xslider_width = innerWidth; //innerWidth
      let xaxis_text;
      let xaxis_box_width;
      let xAxisLeftPadding;
      let xTickValPosOrg;
      let xTickValPos;
      let xTickValAvailableWidth;
      if (args.xaxiskey === 'date' || typeof xDomains[0] === 'string') {
        xaxis_text = args.xaxiskey === 'date' ? parsedDateString(d[args.xaxiskey]) : d[args.xaxiskey];
        xaxis_box_width = calculateTextWidth(xaxis_text, tickSliderFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica') + xAxisSliderRectWidthPadding;
        xaxis_box_width = xaxis_box_width <= max_xslider_width ? xaxis_box_width : max_xslider_width;

        // let xAxisLeftPadding = (icon_width + 2);
        xAxisLeftPadding = 0;
        xTickValPosOrg = xScale(d[args.xaxiskey]);
        xTickValPos = xTickValPosOrg;
        xTickValAvailableWidth = (width - initialConfig.chartRightPadding - xTickValPosOrg);
      } else {
        let digits_count = getDigitsCount(x0);
        let round_var = digits_count - 2;
        let rounded_val = Math.round(x0 * Math.pow(10, round_var) / Math.pow(10, round_var));
        xaxis_text = formatNumber(rounded_val);
        xaxis_box_width = calculateTextWidth(xaxis_text, tickSliderFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica') + 4 + 10;
        xaxis_box_width = xaxis_box_width <= max_xslider_width ? xaxis_box_width : max_xslider_width;

        xAxisLeftPadding = 0;
        xTickValPosOrg = mouseX;
        xTickValPos = xTickValPosOrg;
        xTickValAvailableWidth = (width - initialConfig.chartRightPadding - xTickValPosOrg);
      }

      // adjust starting bars x slider left position
      // let lockIconXPos = 0;
      let leftMouseXScrollPos = (mouseX - initialConfig.chartLeftPadding - (initialConfig.inbetweenChartAndYAxisPadding + 1));
      xTickValPos = xTickValPosOrg - xaxis_box_width / 2 - xAxisLeftPadding / 2; //default

      if (leftMouseXScrollPos <= xaxis_box_width / 2) { // left position
        let leftAvailableWidth = xTickValPosOrg - initialConfig.chartLeftPadding - initialConfig.inbetweenChartAndYAxisPadding;
        xTickValPos = xTickValPosOrg - leftAvailableWidth;
        xAxisLeftPadding = 0;
        // lockIconXPos = xaxis_box_width + 2;
      }
      // adjust end bars x slider right position
      if (xTickValAvailableWidth <= xaxis_box_width / 2) { // adjust end bars x slider right position
        xTickValPos = (width - initialConfig.chartRightPadding - (xaxis_box_width + 8));
      }

      //x-axis slider tick elements
      if (xTickValPos > (innerWidth - xaxis_box_width / 2 + 5)) {
        xTickValPos = (innerWidth - xaxis_box_width / 2 + 5);
      } else if (xTickValPos < (initialConfig.chartLeftPadding + 5)) {
        xTickValPos = initialConfig.chartLeftPadding + 5;
      }

      xAxisSliderGroup.attr("transform", "translate(" + parseInt(xTickValPos) + "," + parseInt(xAxisBottomPos - xAxisSliderRectWidthPadding) + ")"); // bgBottomPadding is extra bg rect padding    
      let xAxisSliderTextLeftPos = (xAxisLeftPadding + (isFitToWidthMode ? parseInt(5 * currentCanvasWidth / args.screen) : 5));

      async function renderXSliderText() {
        xAxisSliderGroup.select('.hover-xaxis-text')
          .text(xaxis_text)
          .attr("dy", "1em")
          .attr('x', xAxisSliderTextLeftPos)
          .attr('y', 0)
          .style('text-align', 'center')
          .call(trimFromAnyCharacter, xaxis_box_width)
          .style('display', 'block');
      }
      renderXSliderText().then(() => {
        xAxisSliderGroup.select('.hover-xaxis-bg')
          .attr('width', xaxis_box_width)
          .attr('height', xTickSliderHeight)
          .attr('x', xAxisLeftPadding)
          .attr('y', 4)
          .style('text-align', 'center')
          .style('display', 'block');
      });
    }

    // y-axis
    if (yAxisSliderGroup) {
      let yval_digits_count = getDigitsCount(y0);
      let round_var = yval_digits_count - 2;
      let rounded_val = Math.round(y0 * Math.pow(10, round_var) / Math.pow(10, round_var));
      let yaxis_text = formatNumber(rounded_val);
      let yaxis_box_width = calculateTextWidth(yaxis_text, tickSliderFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica') + 4 + 10;
      let yaxis_box_left_pos = 3; //3 is gapping of 3px

      let ySliderPos = (mouseY - 2);
      if (ySliderPos < 6) {
        ySliderPos = 6;
      } else if (ySliderPos > (innerHeight - 7)) {
        ySliderPos = innerHeight - 7;
      }


      let yAxisSliderTextTopPos = isFitToWidthMode ? parseInt(4 * currentCanvasWidth / args.screen) : 4;
      yAxisSliderGroup.attr("transform", "translate(" + parseInt(yaxis_box_left_pos) + "," + parseInt(ySliderPos) + ")"); // bgBottomPadding is extra bg rect padding
      yAxisSliderGroup.select('.hover-yaxis-bg')
        .attr("x", 10)
        .attr('height', initialConfig.tickHoverBoxHeight + 3)
        .attr('y', -(initialConfig.tickHoverBoxHeight / 2))
        .attr('width', (initialConfig.chartLeftPadding + 5))
        .style('display', 'block');
      yAxisSliderGroup.select('.hover-yaxis-text')
        .text(yaxis_text)
        .attr('x', (initialConfig.chartLeftPadding - yaxis_box_width + 14))
        .attr('y', yAxisSliderTextTopPos)
        .style('display', 'block');
    }

    // Now change the text of tooltip, adjust the position and size 
    //START
    let tooltipText;
    if (args.pointSelectionModeOn) {
      tooltipText = 'Click to select'
    } else {
      tooltipText = superImposingPoints.length ? 'Multiple Points' : args.yaxiskey + ': ' + args.chartCurrencySymbol + numberWithCommas(pointToFocusOnMouseMove.yVal) + args.chartPercentSymbol;
    }
    const tooltipTxtWidth = calculateTextWidth(tooltipText, toolTipFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica');
    const tooltipBoxWidth = Math.min(tooltipTxtWidth + (2 * initialConfig.tickSliderPadding), maxTooltipWidth);
    const tooltipDistFromPoint = 4;

    // first just set the text so that we can count the lines produced
    tooltipRectText.text(tooltipText).call(wrapFromAnyCharacter, tooltipTxtWidth);

    let textLinesCount = tooltipRectText.selectAll('tspan').size();
    textLinesCount = (textLinesCount === undefined || textLinesCount === 0) ? 1 : textLinesCount;
    const tooltipBoxHeight = textLinesCount * (toolTipFontSize + 2) + textLinesCount;

    let tooltipBoxLeftPos, tooltipBoxTopPos;
    const widthAvailableAtBottomOfPointInFocus = innerHeight - yAxisHoverGrpPos;
    if (widthAvailableAtRightOfPointInFocus < tooltipBoxWidth + tooltipDistFromPoint) {
      tooltipBoxLeftPos = - (tooltipBoxWidth + tooltipDistFromPoint);
    } else {
      tooltipBoxLeftPos = tooltipDistFromPoint;
    }
    if (widthAvailableAtBottomOfPointInFocus < tooltipBoxHeight + tooltipDistFromPoint) {
      tooltipBoxTopPos = - (tooltipBoxHeight + tooltipDistFromPoint);
    } else {
      tooltipBoxTopPos = tooltipDistFromPoint;
    }

    if (!initialConfig.showXAxisTicks) {
      xAxisHoverGrpPos = 0;
      yAxisHoverGrpPos = xAxisBottomPos;
      tooltipBoxLeftPos = 0;
      tooltipBoxTopPos = 0;
    }

    // set the size and 
    tooltip.attr('transform', `translate(${xAxisHoverGrpPos},${yAxisHoverGrpPos})`);
    tooltipRect.attr('x', tooltipBoxLeftPos)
      .attr('y', tooltipBoxTopPos)
      .attr('width', tooltipBoxWidth)
      .attr('height', tooltipBoxHeight)
      .style('display', initialConfig.showXAxisTicks ? 'block' : 'none');
    tooltipRectText
      .attr('x', tooltipBoxLeftPos)
      .attr('y', tooltipBoxTopPos)
      .attr('fill', (initialConfig.showXAxisTicks) ? '#000' : '#fff')
      .attr('dx', initialConfig.tickSliderPadding + (textLinesCount > 1 ? 2 : 0))
      .attr('dy', '1em');
    //END


    // WHEN SEGMENTATION IS ON, CREATE THE LEGEND TABLE
    if (chartSegmentation && window.currentSelectedWidget===args.unique_key) {
      let dataPointsForHoveredXVal = chartMainData.filter((d) => args.xaxiskey === 'date' ? parsedDateString(d[args.xaxiskey]) === xaxis_text : d[args.xaxiskey] === xaxis_text);
      // sort to show the list in consistent order each time
      dataPointsForHoveredXVal.sort((dp1, dp2) => dp1[args.yaxiskey] > dp2[args.yaxiskey] ? - 1 : 1);

      //show legend information in table format
      showHoverSegmentDetails(args, initialConfig, dataPointsForHoveredXVal, d, xAxisVal, xValOnMouseMove, color, 'scatterplot');
    }
  }

  function handleChartLock() {
    if(window.currentSelectedWidget===undefined || !window.currentSelectedWidget || window.currentSelectedWidget!==args.unique_key){
      window.currentSelectedWidget = args.unique_key;
      return;
    }

    if (chartHoverLocked) {
      chartHoverLocked = false;
      xAxisSliderGroup.select('.hover-line-status').html(iconUnlock);
      tooltip.style("display", null);
    } else {
      chartHoverLocked = true;
      xAxisSliderGroup.select('.hover-line-status').html(iconLock);
    }

    if (args.pointSelectionModeOn && pointToFocusOnMouseMove) {
      const chartClickInfo = {
        id: args.unique_key,
        xPoint: args.xaxiskey === 'date' ? d3.timeFormat('%Y-%m-%d')(pointToFocusOnMouseMove.xVal) : pointToFocusOnMouseMove.xVal
      };
      args.pointSelectionClbk(chartClickInfo);
    }
  }

  // LISTEN FOR MOUSE EVENTS ON `chartHoverTrackPad`
  chartHoverTrackPad.attr('opacity', 0)
  .on("mouseout", handleChartMouseOut)
  .on("mousemove", handleChartMouseMove)
  .on("click", handleChartLock);

  //Place a  background of chart area just to hide the points which goes out of its boundary
  chart.append("defs").append("clipPath")
    .attr("id", `clip-${args.unique_key}`)
    .append("rect")
    .attr("width", innerWidth)
    .attr("height", innerHeight)
    .attr("x", initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndYAxisPadding)
    .attr("y", initialConfig.chartTopPadding);

  var idleTimeout
  function idled() { idleTimeout = null; }

  const handleBrushOnChart = () => {
    let extent = d3.event.selection;
    if (extent === null) {
      return;
    }

    if(window.currentSelectedWidget===undefined || !window.currentSelectedWidget || window.currentSelectedWidget!==args.unique_key){
      // window.currentSelectedWidget = args.unique_key;
      return;
    }

    chartHoverLocked = false;
    

    let xDomainNew;
      if(!extent){
        if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
        xDomainNew = [ 4,8];
        chart.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
      }else{
        xDomainNew =[ xScale.invert(extent[0]), xScale.invert(extent[1]) ]
        chart.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
      }

      let newXDomains = [];
      let firstVal = false;
      if (xScaleType === "linear") {
        newXDomains = xDomainNew;
      } else {
        for (var i = 0; i < xDomains.length; i += 1) {
          if (!firstVal) {
            if (xDomains[i] === xDomainNew[0]) {
              newXDomains.push(xDomains[i]);
              firstVal = true;
              continue;
            } else {
              continue;
            }
          } else {
            if (xDomains[i] === xDomainNew[1]) {
              newXDomains.push(xDomains[i]);
              break;
            } else {
              newXDomains.push(xDomains[i])
              continue;
            }
          }
        }
    }
      // xScaleNew = xScale.copy().domain(newXDomains);
      xScale.domain(newXDomains);
      

    scatterPointsWrapper
      .selectAll(".scatter-pt")
      .attr('cx', function (d) {
        return xScale(d[args.xaxiskey]); 
      })
      .attr('cy', function (d) { return yScale(d[args.yaxiskey]); });


    let newXTickValues = getStringTickValues(newXDomains, 0, newXDomains.length, x_steps);

    async function defineNewXAxis() {
      let newXAxis = d3.axisBottom(xScale)
        .tickValues(newXTickValues)
        .tickSize(0)
        .tickPadding(5)
        .tickFormat((d) => {
          if (typeof d !== 'string' && isNaN(d)) {
            return null;
          }
          let val = args.xaxiskey === 'date' ? d3.timeFormat("%m.%d.%Y")(d) : xScaleType === 'linear' ? formatNumber(formatYNumber(d)) : d.substring(0, 10);
          return val;
        });
      chart.select('.x-axis').call(newXAxis);
    }
    defineNewXAxis().then(() => {
      alignXAxisTicks(width, args.unique_key, initialConfig, newXTickValues, newXDomains, parseDate, tickFontSize, xAxisTickStartPos);
    });

    // Hide the tooltip while zoom is in progress, otherwise it will keep pointing to old location with old data
    xAxisSliderGroup.style('display', 'none');
    yAxisSliderGroup.style('display', 'none');
    tooltip.style('display', 'none');
    focus.style("display", "none");

    trackAllScatterPoints();
  }

  function resetChart(){
    chartHoverLocked = false;
    async function defineNewXAxis() {
      if(window.currentSelectedWidget===undefined || !window.currentSelectedWidget || window.currentSelectedWidget!==args.unique_key){
        // window.currentSelectedWidget = args.unique_key;
        return;
      }
      if (xScaleType === "linear") {
        xScale.domain([xScaleLimits['lowerLimit'], xScaleLimits['upperLimit']]);
      } else {
        xScale.domain(xDomains);
      }
      chart.select('.x-axis').call(xAxis);
    }
    defineNewXAxis().then(() => {
      alignXAxisTicks(width, args.unique_key, initialConfig, xTickValuesDisplay, xDomains, parseDate, tickFontSize, xAxisTickStartPos);
    })

    async function setPoints() {
    scatterPointsWrapper
      .selectAll(".scatter-pt")
      .attr('cx', function (d) {
          return xScale(d[args.xaxiskey]); 
      })
      .attr('cy', function (d) { return yScale(d[args.yaxiskey]); });
    }

    setPoints().then(() => {trackAllScatterPoints()});

    // Hide the tooltip while zoom is in progress, otherwise it will keep pointing to old location with old data
    xAxisSliderGroup.style('display', 'none');
    yAxisSliderGroup.style('display', 'none');
    tooltip.style('display', 'none');
    focus.style("display", "none");
  }

  // If user double click, reinitialize the chart
  chart.on("dblclick", resetChart);

  var brush = d3.brushX()
    .extent([[(initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndXAxisPadding), initialConfig.chartTopPadding], [(initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndXAxisPadding + innerWidth), (innerHeight + initialConfig.inbetweenChartAndYAxisPadding)]])
    .on("end", handleBrushOnChart)

    chartTrackPadContainer.append("g")
      .attr('x', initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndXAxisPadding)
      .attr('y', initialConfig.chartTopPadding)
      .attr('width', innerWidth)
      .attr('height', innerHeight + initialConfig.inbetweenChartAndYAxisPadding)
      .attr("class", "brush")
      .style("display", "none")
      .call(brush)
      .on("mouseout", handleChartMouseOut)
      .on("mousemove", handleChartMouseMove)
      .on("click", handleChartLock);

    chart.select(".selection").attr("fill", "#111").attr("stroke", "none")


  let zoomInDiv = d3.select(`#chart-${args.unique_key}`).select(".chart-inner-wrapper").select(".chart-content-wrapper").select(".chart-header-wrapper").select(".chart-main-header").select(".chart-menu").select(".zoom-icon-container");

  let isZoomOut = zoomInDiv._groups[0][0].classList[1] === 'zoom-out';
  zoomInDiv.html(isZoomOut ? iconZoomOut : iconZoomIn)

  zoomInDiv.on('click', () => {
    let toggleZoom = isZoomOut ? 'zoom-in' : 'zoom-out';
    zoomInDiv.attr("class", `zoom-icon-container ${toggleZoom}`)
    isZoomOut = !isZoomOut;
    zoomInDiv.html(isZoomOut ? iconZoomOut : iconZoomIn)
    if (isZoomOut) {
      chart.select(".brush").style("display", "block")
      chart.select(".trackpad").style("display", "none")
    } else {
      chart.select(".brush").style("display", "none")
      chart.select(".trackpad").style("display", "block")

      resetChart();
    }
  })
}

//Setting color pallet for Pie chart
// const colorScaleForPieChart = d3
//   .scaleSequential()
//   .interpolator(d3.interpolateCool);

//Draw Pie Chart
function drawPieChart(args, isDountChart) {
  //chart initial settings variables
  const initialConfig = getInitialChartConfig(args);
  if (!initialConfig) return;

  //basic configurations
  let width = args.chartWrapper.current.offsetWidth;
  // let innerWidth = width - (initialConfig.chartLeftPadding + initialConfig.chartRightPadding + initialConfig.inbetweenChartAndYAxisPadding);
  let chartWrapperHeight = d3.select('#chart-' + args.unique_key).node().getBoundingClientRect().height;
  let height = chartWrapperHeight - initialConfig.chartWidgetBottomPadding - initialConfig.chartHeadingSectionHeight;
  if (args.excludeChartHeader !== undefined) { // if chart width is less than default add removed chart header+margin heightto chart height
    height = height + initialConfig.chartInnerHeadingSectionHeightWithMargin + (initialConfig.chartWidgetBottomPadding - 5);
  }

  let isFitToWidthMode = (args.screen && !args.isDashboardInEditMode && (args.viewModeType !== undefined && args.viewModeType.name === 'Fit to Width'));
  let toolTipFontSize = isFitToWidthMode ? Math.floor(11 * window.innerWidth / args.screen) : 11;
  let tickFontSize = isFitToWidthMode ? Math.floor(10 * window.innerWidth / args.screen) : 10;

  // let innerHeight = (height - initialConfig.chartBottomPadding - initialConfig.chartTopPadding);
  // let xAxisBottomPos = (height - initialConfig.chartBottomPadding + initialConfig.inbetweenChartAndXAxisPadding);
  let widthForChart = width;
  let heightForChart = height // - (height - xAxisBottomPos)// - (headerFontSize * 2);//args.chartWrapper.current.offsetHeight === 0 ? innerHeight : args.chartWrapper.current.offsetHeight;
  let angleForEachArc = (Math.PI * 2) / args.data.length;
  let smallestArc = angleForEachArc;


  d3.select(args.chartWrapper.current).style("height", height + 'px'); //set chart height

  let chartHoverLocked = false;
  let parsedDateString = d3.timeFormat("%d %b %Y");

  //Chart icons
  // let iconLock = '<g class="nc-icon-wrapper" fill="#ff0000" transform="translate(0, 0)"><path d="M21,10H18V6.01A5.96,5.96,0,0,0,12.1,0h-.09A5.94,5.94,0,0,0,6,5.9V10H3a1,1,0,0,0-1,1V23a1,1,0,0,0,1,1H21a1,1,0,0,0,1-1V11A1,1,0,0,0,21,10Zm-9,9a2,2,0,1,1,2-2A2,2,0,0,1,12,19Zm4-9H8V5.91A3.957,3.957,0,0,1,11.959,2h.131A3.957,3.957,0,0,1,16,6Z" fill="#ff0000"></path></g>';
  // let iconUnlock = '<g class="nc-icon-wrapper" fill="#00ff7f" transform="translate(0, 0)"><path d="M21,10H8V5.91A3.957,3.957,0,0,1,11.959,2h.131A3.955,3.955,0,0,1,16,5.99l2,.02A5.96,5.96,0,0,0,12.1,0h-.09A5.94,5.94,0,0,0,6,5.9V10H3a1,1,0,0,0-1,1V23a1,1,0,0,0,1,1H21a1,1,0,0,0,1-1V11A1,1,0,0,0,21,10Zm-9,9a2,2,0,1,1,2-2A2,2,0,0,1,12,19Z" fill="#00ff7f"></path></g>';

  let firstText = args.xaxiskey[0].toUpperCase() + args.xaxiskey.substring(1, args.xaxiskey.length);
  let secondText = args.yaxiskey[0].toUpperCase() + args.yaxiskey.substring(1, args.yaxiskey.length);
  firstText = firstText.replace(/_/gi, " ");
  secondText = secondText.replace(/_/gi, " ");
  let textForChart = `Dimension: ${firstText} | Value: ${secondText}`
  let fontSizeForText = tickFontSize;
  let widthOfTextForChart = calculateTextWidth(textForChart, fontSizeForText + 'px Poppins, "Open Sans", sans-serif, helvetica');

  while(widthOfTextForChart > widthForChart) {
    fontSizeForText -= 1;
    widthOfTextForChart = calculateTextWidth(textForChart, fontSizeForText + 'px Poppins, "Open Sans", sans-serif, helvetica');
  }

  // If data is not available
  if (args.data.length === 0) {
    d3.select(args.chartWrapper.current)
      .append('div')
      .style('margin', '20px')
      .text(() => 'Please select different filters or time period as there is no data available for selected filters or time period.')
    return
  }

  // function handleChartClick() {
  //   let chartData = document.getElementById(`chart-${args.unique_key}`);
  //   chartData = chartData.getElementsByClassName('asc-chart pie');
  //   console.log(chartData[0].innerHTML);
  // }

  //Define SVG and group element
  let svg = getSVGElement(args.chartWrapper.current, widthForChart, heightForChart);

  svg.append('text')
    .attr("class", `chart-bottom-value-${args.unique_key}`)
    .attr("x", (widthForChart/2) - (widthOfTextForChart/2))
    .attr("y", heightForChart - fontSizeForText/4)
    .text(textForChart)
    .style("fill", "#abb3ad")
    .style("font-size", fontSizeForText)
    // .on('click', handleChartClick)


  heightForChart = heightForChart - fontSizeForText;

  let innerRadiusForChart;
  let outerRadiusForChart = heightForChart <= widthForChart ? heightForChart/2 : widthForChart/2;
  let fontSizeForChart = outerRadiusForChart/args.data.length < outerRadiusForChart/10 ? outerRadiusForChart/10 : outerRadiusForChart/args.data.length;
  if (fontSizeForChart > outerRadiusForChart/8) {
    fontSizeForChart = outerRadiusForChart/8;
  }

  let widthNeedToLeave = calculateTextWidth("100.00%", fontSizeForChart + 'px Poppins, "Open Sans", sans-serif, helvetica');
  outerRadiusForChart = heightForChart <= widthForChart ? (heightForChart / 2 - tickFontSize) : (widthForChart / 2 - widthNeedToLeave);

  if (heightForChart <= widthForChart) {
    if ((outerRadiusForChart + widthNeedToLeave) > widthForChart / 2) {
      outerRadiusForChart = outerRadiusForChart - ((outerRadiusForChart + widthNeedToLeave) - widthForChart / 2);
    }
  }

  if (isDountChart) {
    innerRadiusForChart = outerRadiusForChart / 2;
  } else {
    innerRadiusForChart = 0;
  }

  let yDomains = args.data.map((d) => d[args.yaxiskey]);
  let totalValue = 0;
  yDomains.map((value) => {
    totalValue = totalValue + value;
  })

  //Setting colors for pie chart as per data
  let colorScale = getColor(args);

  function handleChartLock() {
    if(window.currentSelectedWidget===undefined || !window.currentSelectedWidget || window.currentSelectedWidget!==args.unique_key){
      window.currentSelectedWidget = args.unique_key;
      return;
    }

    if (chartHoverLocked) {
      chartHoverLocked = false;
      tooltip.style("display", "none");
      d3.selectAll(`.path-pie_donut-chart-${args.unique_key}`).style("display", "none");
      showAggregatedSegmentsDetails(args, initialConfig, colorScale);
    } else {
      chartHoverLocked = true;
    }
  }

  svg.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', widthForChart)
    .attr('height', heightForChart)
    .style('opacity', '0')
    .on("click", () => chartHoverLocked ? handleChartLock() : () => { });

  //Creating the pie chart as per the values on y-axis
  let pieGenerator = d3.pie().padAngle(0).value((d) => d[args.yaxiskey])(args.data);

  for (let i = 0; i < pieGenerator.length; i += 1) {
    if ((pieGenerator[i]["endAngle"] - pieGenerator[i]["startAngle"]) < smallestArc) {
      smallestArc = pieGenerator[i]["endAngle"] - pieGenerator[i]["startAngle"];
    }
  }

  //Creating arcs with outer radius of half the value of height and width whichever is smaller
  let arcGenetrator = d3.arc().innerRadius(innerRadiusForChart).outerRadius(outerRadiusForChart * 0.78);
  let outerArcGenetrator = d3.arc().innerRadius(outerRadiusForChart * 0.8).outerRadius(outerRadiusForChart * 0.8);

  let arcGenetrator2 = d3.arc().innerRadius(outerRadiusForChart * 0.75).outerRadius(outerRadiusForChart * 0.85);

  // Creating g element for svg from which the chart will be created
  svg.append('g')
    .attr('transform', `translate(${widthForChart / 2}, ${heightForChart / 2})`)
    .selectAll('path')
    .data(pieGenerator)
    .join('path')
    .attr('d', arcGenetrator)
    .attr('fill', (d) => {
      let value = d.data[args.xaxiskey];
      if (args.xaxiskey === 'date') {
        value = new Date(value);
        value = parsedDateString(value)
      }
      return colorScale(value)
    })
    .attr('class', 'trackpad')
    .on('mousemove', (d) => handleChartMouseMove(d))
    .on('mouseout', (d) => handleChartMouseOut(d))
    .on("click", handleChartLock);

  svg.append('g')
    .attr('transform', `translate(${widthForChart / 2}, ${heightForChart / 2})`)
    .selectAll('path')
    .data(pieGenerator)
    .join('path')
    .attr('d', arcGenetrator2)
    .attr("class", (d) => `path-pie_donut-chart-${args.unique_key} path-pie_donut-chart-${args.unique_key}-${d.index}`)
    .attr('fill', (d) => {
      let value = d.data[args.xaxiskey];
      if (args.xaxiskey === 'date') {
        value = new Date(value);
        value = parsedDateString(value)
      }
      return colorScale(value)
    })
    // .style("fill-opacity", 0.9)
    .style("display", "none")
    .on('mousemove', (d) => handleChartMouseMove(d))
    .on('mouseout', (d) => handleChartMouseOut(d))
    .on("click", handleChartLock);

  // Add the polylines between chart and labels:
  svg.append('g')
    .attr('transform', `translate(${args.chartSizeClass === '' ? widthForChart / 2 - 3.5 : widthForChart / 2}, ${heightForChart / 2})`)
    .selectAll('allPolylines')
    .data(pieGenerator)
    .enter()
    .append('polyline')
    .attr("class", (d) => `polyline-pie_donut-chart-${args.unique_key} polyline-pie_donut-chart-${args.unique_key}-${d.index}`)
    .attr("stroke", "white")
    .style("display", (args.data.length > 10 || smallestArc <= Math.PI / 25) ? "none" : "block")
    .style("fill", "none")
    .attr("stroke-width", 1)
    .attr('points', function (d) {
      // var posA = arcGenetrator.centroid(d) // line insertion in the slice
      var angleSlice = (d.endAngle + d.startAngle) / 2;
      var posA = [outerRadiusForChart * 0.75 * Math.cos(angleSlice - Math.PI / 2), outerRadiusForChart * 0.75 * Math.sin(angleSlice - Math.PI / 2)];
      // if (args.data.length > 10) { // && args.data.length < 30 || smallestArc >= Math.PI/25) {
      //   var posB = [outerRadiusForChart * 0.8 * Math.cos(angleSlice - Math.PI / 2), outerRadiusForChart * 0.8 * Math.sin(angleSlice - Math.PI / 2)];
      //   var posC
      //   if (angleSlice > Math.PI) {
      //     posC = [outerRadiusForChart * 0.85 * Math.cos((angleSlice - (angleForEachArc * 0.15)) - Math.PI / 2), outerRadiusForChart * 0.85 * Math.sin((angleSlice - (angleForEachArc * 0.15)) - Math.PI / 2)];
      //   } else {
      //     posC = [outerRadiusForChart * 0.85 * Math.cos((angleSlice + (angleForEachArc * 0.15)) - Math.PI / 2), outerRadiusForChart * 0.85 * Math.sin((angleSlice + (angleForEachArc * 0.15)) - Math.PI / 2)];
      //   }
      // } else {
      var posB = outerArcGenetrator.centroid(d) // line break
      var posC = outerArcGenetrator.centroid(d); // Label position = almost the same as posB
      var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // angle to see if the X position will be at the extreme right or extreme left
      posC[0] = outerRadiusForChart * 0.85 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
      // }
      return [posA, posB, posC]
    })

  // Add the polylines between chart and labels:
  svg.append('g')
    .attr('transform', `translate(${args.chartSizeClass === '' ? widthForChart / 2 - 3.5 : widthForChart / 2}, ${heightForChart / 2})`)
    .selectAll('allLabels')
    .data(pieGenerator)
    .enter()
    .append('text')
    .attr("class", (d) => `text-pie_donut-chart-${args.unique_key} text-pie_donut-chart-${args.unique_key}-${d.index}`)
    .style("display", (args.data.length > 10 || smallestArc <= Math.PI / 25) ? "none" : "block")
    .text(function (d) {
      let value = ((d.value / totalValue) * 100).toString();
      if (value.includes(".")) {
        let [first, second] = value.split('.')
        return `${first}.${second[0]}${second[2]}%`;
      } else {
        return `${value}%`
      }
    })
    .attr('transform', function (d) {
      // if (args.data.length > 10) { //&& args.data.length < 30 && smallestArc >= Math.PI/25) {
      //   var angleSlice = (d.endAngle + d.startAngle) / 2;
      //   var pos;
      //   if (angleSlice > Math.PI) {
      //     pos = [outerRadiusForChart * 0.9 * Math.cos((angleSlice - (angleForEachArc * 0.25)) - Math.PI / 2), outerRadiusForChart * 0.9 * Math.sin((angleSlice - (angleForEachArc * 0.25)) - Math.PI / 2)];
      //   } else {
      //     pos = [outerRadiusForChart * 0.9 * Math.cos((angleSlice + (angleForEachArc * 0.25)) - Math.PI / 2), outerRadiusForChart * 0.9 * Math.sin((angleSlice + (angleForEachArc * 0.25)) - Math.PI / 2)];
      //   }
      //   pos[1] = pos[1] + (fontSizeForChart / 2);
      // } else {
      var pos = outerArcGenetrator.centroid(d);
      var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
      pos[0] = outerRadiusForChart * 0.9 * (midangle < Math.PI ? 1 : -1);
      // }
      return 'translate(' + pos + ')';
    })
    .style('text-anchor', function (d) {
      var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
      return (midangle < Math.PI ? 'start' : 'end')
    })
    .style("fill", "white")
    .style("font-size", fontSizeForChart);

  //Tooltip 
  // let tooltip_text = '';
  // let tooltip_text_width = 0;
  // let tooltip_top = 0;
  // let tooltip_pos_adjustment = 0;
  // let tooltip_left = 0;

  let tooltip = svg.append("g")
    .attr("class", "tooltip1")
    .attr("transform", "translate(0, 0)");
  tooltip.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 0)
    .attr("height", (toolTipFontSize + 2))
    // .attr('fill', '#2e323c')
    .attr('fill', '#dedede')
    .attr("rx", 2)
    .attr("class", 'tooltip-rect');
  tooltip.append("text")
    .attr('font-size', toolTipFontSize + 'px')
    .text('')
    .attr('x', 0)
    .attr('y', 0)
    .attr("fill", "#000")
    .attr("class", "tooltip-text");


  handleChartMouseOut({ index: null });

  //Remove tooltip on mouse out
  function handleChartMouseOut(d) {
    if (chartHoverLocked) return false; //if locked no hover allowed
    if (tooltip) tooltip.style('display', 'none');

    d3.select(`.path-pie_donut-chart-${args.unique_key}-${d.index}`).style("display", "none")

    if (args.data.length > 10 || smallestArc <= Math.PI / 25) {
      d3.select(`.text-pie_donut-chart-${args.unique_key}-${d.index}`).style("display", "none").style("font-size", fontSizeForChart)
      d3.select(`.polyline-pie_donut-chart-${args.unique_key}-${d.index}`).style("display", "none")
    }

    firstText = args.xaxiskey[0].toUpperCase() + args.xaxiskey.substring(1, args.xaxiskey.length);
    secondText = args.yaxiskey[0].toUpperCase() + args.yaxiskey.substring(1, args.yaxiskey.length);
    firstText = firstText.replace(/_/gi, " ");
    secondText = secondText.replace(/_/gi, " ");
    textForChart = `Dimension: ${firstText} | Value: ${secondText}`;
    widthOfTextForChart = calculateTextWidth(textForChart, fontSizeForText + 'px Poppins, "Open Sans", sans-serif, helvetica');

    while(widthOfTextForChart > widthForChart) {
      fontSizeForText -= 1;
      widthOfTextForChart = calculateTextWidth(textForChart, fontSizeForText + 'px Poppins, "Open Sans", sans-serif, helvetica');
    }

    d3.select(`.chart-bottom-value-${args.unique_key}`)
    .attr("x", (widthForChart/2) - (widthOfTextForChart/2))
    .text(textForChart)
    .style("font-size", fontSizeForText)

    //show legend information in table format
    if(window.currentSelectedWidget===args.unique_key){
      showAggregatedSegmentsDetails(args, initialConfig, colorScale);
    }
  }

  function handleChartMouseMove(d) {
    if (chartHoverLocked) return false; //if locked no hover allowed
    // const [x, y] = d3.mouse(args.chartWrapper.current);
    d3.select(`.path-pie_donut-chart-${args.unique_key}-${d.index}`).style("display", "block")

    if (args.data.length > 10 || smallestArc <= Math.PI / 25) {
      d3.select(`.text-pie_donut-chart-${args.unique_key}-${d.index}`).style("display", "block").style("font-size", fontSizeForChart)
      d3.select(`.polyline-pie_donut-chart-${args.unique_key}-${d.index}`).style("display", "block")
    }

    var xAxisVal;
    if (args.xaxiskey === 'date') {
      var date = new Date(d.data[args.xaxiskey]);
      xAxisVal = parsedDateString(date);
    } else {
      xAxisVal = d.data[args.xaxiskey];
    }

    //show legend information in table format
    if(window.currentSelectedWidget===args.unique_key){
      showHoverSegmentDetails(args, initialConfig, [d.data], d.data, xAxisVal, d.data[args.xaxiskey], colorScale, 'pie');
    }

    //Generate tooltip details
    // var chartXPos = 0;
    // var block_tooltip_text = '';
    // var tooltip_width = 0;

    let leftKey = args.xaxiskey[0].toUpperCase() + args.xaxiskey.substring(1, args.xaxiskey.length);
    let rightKey = args.yaxiskey[0].toUpperCase() + args.yaxiskey.substring(1, args.yaxiskey.length);
    if (args.xaxiskey === 'date') {
      date = new Date(d.data[args.xaxiskey]);
      firstText = parsedDateString(date);
    } else {
      firstText = d.data[args.xaxiskey][0].toUpperCase() + d.data[args.xaxiskey].substring(1, d.data[args.xaxiskey].length);
    }
    secondText = args.chartCurrencySymbol + d.data[args.yaxiskey];
    firstText = firstText.replace(/_/gi, " ");
    secondText = secondText.replace(/_/gi, " ");
    leftKey = leftKey.replace(/_/gi, " ");
    rightKey = rightKey.replace(/_/gi, " ");
    textForChart = `${leftKey}: ${firstText} | ${rightKey}: ${secondText}`;
    widthOfTextForChart = calculateTextWidth(textForChart, fontSizeForText + 'px Poppins, "Open Sans", sans-serif, helvetica');

    while(widthOfTextForChart > widthForChart) {
      fontSizeForText -= 1;
      widthOfTextForChart = calculateTextWidth(textForChart, fontSizeForText + 'px Poppins, "Open Sans", sans-serif, helvetica');
    }

    d3.select(`.chart-bottom-value-${args.unique_key}`)
      .attr("x", (widthForChart/2) - (widthOfTextForChart/2))
      .text(textForChart)
      .style("font-size", fontSizeForText);

  }
}

// Draw Bubble chart
function drawBubbleChart(args) {
  //chart initial settings variables
  const initialConfig = getInitialChartConfig(args);
  if (!initialConfig) return;

  // remove previous svg before creating a new one
  d3.select(args.chartWrapper.current).select('svg').remove();

  //basic configurations
  let width = args.chartWrapper.current.offsetWidth;
  let innerWidth = width - (initialConfig.chartLeftPadding + initialConfig.chartRightPadding + initialConfig.inbetweenChartAndYAxisPadding);
  let chartWrapperHeight = d3.select('#chart-' + args.unique_key).node().getBoundingClientRect().height;
  let height = chartWrapperHeight - initialConfig.chartWidgetBottomPadding - initialConfig.chartHeadingSectionHeight;
  if (args.excludeChartHeader !== undefined) { // if chart width is less than default add removed chart header+margin heightto chart height
    height = height + initialConfig.chartInnerHeadingSectionHeightWithMargin + (initialConfig.chartWidgetBottomPadding - 5);
  }
  let innerHeight = (height - initialConfig.chartBottomPadding - initialConfig.chartTopPadding);
  let xAxisBottomPos = (height - initialConfig.chartBottomPadding + initialConfig.inbetweenChartAndXAxisPadding);
  // let segmentedValues = [];

  //Data variable
  let chartMainData = [...args.data];

  //Chart icons
  // let iconLock = '<g class="nc-icon-wrapper" fill="#ff0000" transform="translate(0, 0)"><path d="M21,10H18V6.01A5.96,5.96,0,0,0,12.1,0h-.09A5.94,5.94,0,0,0,6,5.9V10H3a1,1,0,0,0-1,1V23a1,1,0,0,0,1,1H21a1,1,0,0,0,1-1V11A1,1,0,0,0,21,10Zm-9,9a2,2,0,1,1,2-2A2,2,0,0,1,12,19Zm4-9H8V5.91A3.957,3.957,0,0,1,11.959,2h.131A3.957,3.957,0,0,1,16,6Z" fill="#ff0000"></path></g>';
  // let iconUnlock = '<g class="nc-icon-wrapper" fill="#00ff7f" transform="translate(0, 0)"><path d="M21,10H8V5.91A3.957,3.957,0,0,1,11.959,2h.131A3.955,3.955,0,0,1,16,5.99l2,.02A5.96,5.96,0,0,0,12.1,0h-.09A5.94,5.94,0,0,0,6,5.9V10H3a1,1,0,0,0-1,1V23a1,1,0,0,0,1,1H21a1,1,0,0,0,1-1V11A1,1,0,0,0,21,10Zm-9,9a2,2,0,1,1,2-2A2,2,0,0,1,12,19Z" fill="#00ff7f"></path></g>';

  let isFitToWidthMode = (args.screen && !args.isDashboardInEditMode && (args.viewModeType !== undefined && args.viewModeType.name === 'Fit to Width'));
  let toolTipFontSize = isFitToWidthMode ? Math.floor(11 * window.innerWidth / args.screen) : 11;

  //Define charts configs
  let chartHoverLocked = false;
  let parsedDateString = d3.timeFormat("%d %b %Y");
  let widthForChart = args.chartWrapper.current.offsetWidth;
  let heightForChart = height - (height - xAxisBottomPos);//args.chartWrapper.current.offsetHeight === 0 ? innerHeight : args.chartWrapper.current.offsetHeight;;

  // Check segmentation
  let isSegmented = (args.chartSegmentation && args.chartSegmentation !== '' && args.chartSegmentation !== 'all' && args.chartSegmentation !== ' ');
  let chartSegmentation = isSegmented ? args.chartSegmentation : '';
  let defaultColor = (args.chartFormat.color && args.chartFormat.color.single_color !== '') ? args.chartFormat.color.single_color : chartColors[0]; //pick selected color
  let dataNestForHoverSegmentation = {};

  // Set color for segmented values
  let color = getColor(args);

  d3.select(args.chartWrapper.current).style("height", height + 'px'); //set chart height

  // If data is not available
  if (args.data.length === 0) {
    d3.select(args.chartWrapper.current)
      .append('div')
      .style('magin', '20px')
      .text(() => 'Please select different filters as there is no data available for selected filters')
    return
  }

  if (isSegmented) {
    dataNestForHoverSegmentation = d3.nest().key((d) => d[args.xaxiskey])
      .entries(chartMainData);
  }

  // Coverting data to dataset for bubble chart implementation
  let dataset = { "children": args.data };

  // creating pack as per the dataset
  let bubble = d3
    .pack(dataset)
    .size([innerWidth, innerHeight])
    .padding(1.5);

  //Define SVG and group element
  let svg = getSVGElement(args.chartWrapper.current, widthForChart, heightForChart);

  svg.append("rect")
    .attr("width", widthForChart)
    .attr("height", heightForChart)
    .attr('class', 'chart-bg')
    .on("click", () => {
      if (chartHoverLocked) {
        chartHoverLocked = false;
        tooltip.style("display", 'none')

        showAggregatedSegmentsDetails(args, initialConfig, color);
      }
    })

  // hierarchy for nodes
  let nodes = d3
    .hierarchy(dataset)
    .sum((d) => d[args.yaxiskey]);

  let node = svg
    .selectAll("g")
    .data(bubble(nodes).descendants())
    .enter()
    .filter((d) => !d.children)
    .append("g")
    .attr("transform", (d) => "translate(" + d.x + "," + d.y + ")");

  // create bubble circle per data
  node
    .append("circle")
    .attr("r", (d) => d.r)
    .attr("fill", (d) => {
      if (isSegmented) {
        return color(d.data[chartSegmentation]);
      } else {
        return defaultColor;
      }
    })
    .on("mousemove", (d) => handleChartMouseMove(d))
    .on("mouseout", handleChartMouseOut)
    .on('click', handleChartLock);

  node.append("text")
    .attr("dy", ".2em")
    .style("text-anchor", "middle")
    .text((d) => {
      if (args.xaxiskey === 'date') {
        const [p2, p3, p4] = String(d.data[args.xaxiskey]).split(' ');
        return `${isSegmented ? d.data[chartSegmentation].substring(0, d.r / 3.2) : `${p3} ${p2} ${p4}`}: `
      }
      return `${isSegmented ? d.data[chartSegmentation].substring(0, d.r / 3.2) : d.data[args.xaxiskey].substring(0, d.r / 3.2)}: `
    })
    .attr("font-family", "sans-serif")
    .attr("font-size", (d) => d.r / 5)
    .attr("fill", "white")
    .on("mousemove", (d) => handleChartMouseMove(d))
    .on("mouseout", handleChartMouseOut)
    .on('click', handleChartLock);

  node.append("text")
    .attr("dy", "1.3em")
    .style("text-anchor", "middle")
    .text((d) => `${args.yaxiskey === 'revenue' || args.yaxiskey === 'cpm' ? '$' : ''}${d.data[args.yaxiskey]}`)
    .attr("font-family", "sans-serif")
    .attr("font-size", (d) => d.r / 6)
    .attr("fill", "white")
    .attr('class', 'trackpad')
    .on("mousemove", (d) => handleChartMouseMove(d))
    .on("mouseout", handleChartMouseOut)
    .on('click', handleChartLock);

  //Tooltip 
  let tooltip_text = '';
  let tooltip_text_width = 0;
  let tooltip_top = 0;
  // let tooltip_pos_adjustment = 0;
  let tooltip_left = 0;

  let tooltip = svg.append("g")
    .attr("class", "tooltip1")
    .attr("transform", "translate(0, 0)");
  let tooltipRect = tooltip.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 0)
    .attr("height", (toolTipFontSize + 2))
    // .attr('fill', '#2e323c')
    .attr('fill', '#dedede')
    .attr("rx", 2)
    .attr("class", 'tooltip-rect');
  let tooltipRectText = tooltip.append("text")
    .attr('font-size', toolTipFontSize + 'px')
    .text('')
    .attr('x', 0)
    .attr('y', 0)
    .attr("fill", "#000")
    .attr("class", "tooltip-text");

  //call on initial load - to show aggregated segmented values
  handleChartMouseOut();

  //Remove tooltip on mouse out
  function handleChartMouseOut() {
    if (chartHoverLocked) return false; //if locked no hover allowed
    if (tooltip) tooltip.style('display', 'none');

    // show aggregated table when not hovering the chart
    if(window.currentSelectedWidget===args.unique_key){
      showAggregatedSegmentsDetails(args, initialConfig, color);
    }
  }

  function handleChartLock() {
    if(window.currentSelectedWidget===undefined || !window.currentSelectedWidget || window.currentSelectedWidget!==args.unique_key){
      window.currentSelectedWidget = args.unique_key;
      return;
    }

    if (chartHoverLocked) {
      chartHoverLocked = false;
      tooltip.style("display", null);
    } else {
      chartHoverLocked = true;
    }
  }

  var dataValues = null;

  function handleChartMouseMove(d) {
    if (chartHoverLocked) {
      return
    }
    const [x, y] = d3.mouse(args.chartWrapper.current);

    //Generate tooltip details
    // var chartXPos = 0;

    var xAxisVal;
    if (args.xaxiskey === 'date') {
      date = new Date(d.data[args.xaxiskey]);
      xAxisVal = parsedDateString(date);
    } else {
      xAxisVal = d.data[args.xaxiskey];
    }

    // Show Tooltip
    var block_tooltip_text = '';
    var tooltip_width = 0;
    if (isSegmented && window.currentSelectedWidget===args.unique_key) {
      // console.log('here', dataNest)
      //Sort segmentated values
      dataNestForHoverSegmentation = sortSegmentedData(args, dataNestForHoverSegmentation, d.data[args.xaxiskey]);

      //Display Cross Hair Values
      // console.log(parsedDateString(dataNest[0].values[0][args.xaxiskey]) === parsedDateString(d[args.xaxiskey]));
      var dataValuesIndex = dataNestForHoverSegmentation.findIndex((e) => args.xaxiskey === 'date' ? parsedDateString(e.values[0][args.xaxiskey]) === parsedDateString(d.data[args.xaxiskey]) : e.values[0][args.xaxiskey] === d.data[args.xaxiskey]);

      if (dataValuesIndex > -1) {
        dataValues = dataNestForHoverSegmentation[dataValuesIndex]['values'];

        //show legend information in table format
        showHoverSegmentDetails(args, initialConfig, dataValues, d.data, xAxisVal, d.data[args.xaxiskey], color, 'bubble');
      }
    }

    if (args.pointSelectionModeOn) {
      block_tooltip_text = 'Click to Select';
    } else {
      let text;
      if (args.xaxiskey === 'date') {
        var date = new Date(d.data[args.xaxiskey]);
        text = parsedDateString(date);
      } else {
        text = d.data[args.xaxiskey];
      }
      block_tooltip_text = (isSegmented ? `${d.data[chartSegmentation]}(${text})` : text) + ': ' + args.chartCurrencySymbol + numberWithCommas(d.data[args.yaxiskey]) + args.chartPercentSymbol; //details;
    }
    tooltip_text = block_tooltip_text;
    calculateTooltipPositionAndWidth(tooltip_text);

    function calculateTooltipPositionAndWidth(text) {
      tooltip_text_width = calculateTextWidth(text, toolTipFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica');
      tooltip_width = tooltip_text_width + 4;
      // tooltip_width = tooltip_width; //<= maxTooltipWidth ? tooltip_width : maxTooltipWidth;
      // tooltip_pos_adjustment = initialConfig.tooltipHeight + (initialConfig.inbetweenChartAndXAxisPadding < 5 ? 5 : initialConfig.inbetweenChartAndXAxisPadding);
      tooltip_top = y; //(y(totalVal ? totalVal : d[args.yaxiskey]) - tooltip_pos_adjustment); //if totalVal is set use that position else use individual bar/bar_block position
      var base_left = x; //(xValOnMouseMove);
      // chartXPos = (base_left + tooltip_width);
      var base_right = innerWidth - base_left;

      if (base_left > base_right && tooltip_width < base_left) {
        tooltip_left = base_left - tooltip_width - 10;
      } else if (base_right >= base_left && tooltip_width < base_right) {
        tooltip_left = base_left + 10;
      } else {
        tooltip_left = base_left - (tooltip_width / 2);
        tooltip_top = tooltip_top + 20;
      }
    }

    if (!initialConfig.showXAxisTicks) {
      tooltip_left = 0;
      tooltip_top = xAxisBottomPos;
    }

    let textLinesCount = 1;
    tooltip.style("display", "block").attr("transform", "translate(" + (tooltip_left) + "," + (tooltip_top) + ")");
    tooltipRectText
      .text(tooltip_text)
      .attr("dy", "1em")
      .attr('x', 2)
      .attr('fill', initialConfig.showXAxisTicks ? '#000' : '#fff')
      .style('display', 'block');
    textLinesCount = tooltipRectText.selectAll('tspan').size();
    textLinesCount = (textLinesCount === undefined || textLinesCount === 0) ? 1 : textLinesCount;
    tooltipRect
      .attr('width', tooltip_width)
      .attr('height', textLinesCount * (toolTipFontSize + 2) + textLinesCount) //increase height of rectangle as per text
      .attr('x', 0)
      .attr('y', 0)
      .style('display', initialConfig.showXAxisTicks ? 'block' : 'none');
  }
}

// Get red, green and blue values of rgb from hash color
// function hashToRgb(color) {
//   let red = parseInt(color[1] + color[2], 16);
//   let green = parseInt(color[3] + color[4], 16);
//   let blue = parseInt(color[5] + color[6], 16);
//   return { red, green, blue };
// }
//Get hash color value from red, green and blue values of rgb
// function rgbToHash(red, green, blue) {
//   let first = red.toString(16);
//   first = first.length === 1 ? "0" + first : first;
//   let second = green.toString(16);
//   second = second.length === 1 ? "0" + second : second;
//   let third = blue.toString(16);
//   third = third.length === 1 ? "0" + third : third;

//   return `#${first}${second}${third}`
// }

// Draw HeatMap chart
function drawHeatMapChart(args) {
  //chart initial settings variables
  const initialConfig = getInitialChartConfig(args);
  if (!initialConfig) return;

  //return from here if data is not available
  if (!args.data || args.data.length === 0) return;

  //Define X-Axis for each chart - date/string
  let isSegmented = (args.chartSegmentation && args.chartSegmentation !== '' && args.chartSegmentation !== 'all' && args.chartSegmentation !== ' ');
  let chartSegmentation = isSegmented ? args.chartSegmentation : '';
  let xDomains = {}; // = args.data.map((d) => d[args.xaxiskey]);
  let dataNest;
  let invertedYDomains = [];
  let yDomains = {};
  let measurementValue;
  let data = [];


  let currentCanvasSize = (window.innerWidth - 10);
  let isFitToWidthMode = (args.screen && !args.isDashboardInEditMode && (args.viewModeType !== undefined && args.viewModeType.name === 'Fit to Width'));
  let tickFontSize = isFitToWidthMode ? Math.round(10 * currentCanvasSize / args.screen) : 10;
  // let xAxisTickStartPos = isFitToWidthMode ? Math.round(75*currentCanvasSize/args.screen) : 75;
  // let yAxisTickTopPos = isFitToWidthMode ? Math.round(5 * currentCanvasSize / args.screen) : 5;
  let tickSliderFontSize = isFitToWidthMode ? Math.round(11 * currentCanvasSize / args.screen) : 10;
  let toolTipFontSize = isFitToWidthMode ? Math.round(11 * currentCanvasSize / args.screen) : 11;


  // let isFitToWidthMode = (args.screen && !args.isDashboardInEditMode && args.viewModeType.name === 'Fit to Width');
  // let tickFontSize = isFitToWidthMode ? Math.floor(10 * window.innerWidth / args.screen) : 10;

  args.data.map((d) => {
    xDomains = { ...xDomains, [d[args.xaxiskey]]: d[args.xaxiskey] };
  })
  xDomains = Object.values(xDomains);
  args.data.map((d) => {
    yDomains = { ...yDomains, [d[chartSegmentation]]: "" }
  });
  yDomains = Object.keys(yDomains);
  // yDomains = yDomains.sort((a, b) => a - b);
  for (let i = yDomains.length - 1; i >= 0; i -= 1) {
    invertedYDomains.push(yDomains[i]);
  }

  let widthForYaxisTicks = 0;

  for (let i = 0; i < yDomains.length; i += 1) {
    let value = calculateTextWidth(yDomains[i], tickFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica');
    // let availableWidth = calculateTextWidth(yDomains[i], tickFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica');

    if (value > widthForYaxisTicks) {
      widthForYaxisTicks = value;
    }
  }

  if (!initialConfig.showXAxisTicks) {
    widthForYaxisTicks = 0
  }

  let xAxisTickStartPos = widthForYaxisTicks + initialConfig.chartLeftPadding;

  //basic configurations
  let width = args.chartWrapper.current.offsetWidth;
  let innerWidth = width - (widthForYaxisTicks + initialConfig.chartRightPadding + initialConfig.inbetweenChartAndYAxisPadding);
  let chartWrapperHeight = d3.select('#chart-' + args.unique_key).node().getBoundingClientRect().height;
  let height = chartWrapperHeight - initialConfig.chartWidgetBottomPadding - initialConfig.chartHeadingSectionHeight;
  if (args.excludeChartHeader !== undefined) { // if chart width is less than default add removed chart header+margin heightto chart height
    height = height + initialConfig.chartInnerHeadingSectionHeightWithMargin + (initialConfig.chartWidgetBottomPadding - 5);
  }
  let innerHeight = (height - initialConfig.chartBottomPadding - initialConfig.chartTopPadding);
  let xAxisBottomPos = (height - initialConfig.chartBottomPadding + initialConfig.inbetweenChartAndXAxisPadding);
  d3.select(args.chartWrapper.current).style("height", height + 'px'); //set chart height

  //Chart icons
  // let iconLock = '<g class="nc-icon-wrapper" fill="#ff0000" transform="translate(0, 0)"><path d="M21,10H18V6.01A5.96,5.96,0,0,0,12.1,0h-.09A5.94,5.94,0,0,0,6,5.9V10H3a1,1,0,0,0-1,1V23a1,1,0,0,0,1,1H21a1,1,0,0,0,1-1V11A1,1,0,0,0,21,10Zm-9,9a2,2,0,1,1,2-2A2,2,0,0,1,12,19Zm4-9H8V5.91A3.957,3.957,0,0,1,11.959,2h.131A3.957,3.957,0,0,1,16,6Z" fill="#ff0000"></path></g>';
  // let iconUnlock = '<g class="nc-icon-wrapper" fill="#00ff7f" transform="translate(0, 0)"><path d="M21,10H8V5.91A3.957,3.957,0,0,1,11.959,2h.131A3.955,3.955,0,0,1,16,5.99l2,.02A5.96,5.96,0,0,0,12.1,0h-.09A5.94,5.94,0,0,0,6,5.9V10H3a1,1,0,0,0-1,1V23a1,1,0,0,0,1,1H21a1,1,0,0,0,1-1V11A1,1,0,0,0,21,10Zm-9,9a2,2,0,1,1,2-2A2,2,0,0,1,12,19Z" fill="#00ff7f"></path></g>';

  //Define charts configs
  let chartHoverLocked = false;
  let defaultColor = (args.chartFormat.color && args.chartFormat.color.single_color !== '') ? args.chartFormat.color.single_color : DefaultColorsList["green"][0]; //pick selected color
  let secondColor = (args.chartFormat.color && args.chartFormat.color.second_color !== '') ? args.chartFormat.color.second_color : DefaultColorsList["green"][4];
  // let color = getColor(args); //Set Color Scales
  let colorScale;
  // let colorForSegmentedChart = [];
  let parseDate = d3.timeFormat("%m.%d.%Y"),
    parsedDateString = d3.timeFormat("%d %b %Y");

  //Data variable
  let chartMainData = [...args.data];
  let barWidthObj = getBarWidth(innerWidth, chartMainData);
  let barWidth = barWidthObj.width;
  let barPadding = barWidthObj.padding;

  //Scaling Points - start and end
  let xStartPoint = widthForYaxisTicks + initialConfig.inbetweenChartAndYAxisPadding;
  let xEndPoint = (width - initialConfig.chartRightPadding);
  let yStartPoint = xAxisBottomPos - initialConfig.inbetweenChartAndXAxisPadding - 1;
  let yEndPoint = initialConfig.chartTopPadding;

  let yScaleLimits;
  let xAxisTickValues = getXAxisTickValues(initialConfig, xDomains, chartMainData, args, 'heatmap'); // get x axis calculated tick values

  //Define SVG and group element
  let svg = getSVGElement(args.chartWrapper.current, width, height);
  let chart = getGroupElement(svg, args.yaxiskey);

  let boxHeightObj = getBoxHeight(innerHeight, yDomains);
  let boxHeight = boxHeightObj.height;
  let boxPadding = boxHeightObj.padding;
  measurementValue = args.yaxiskey;

  dataNest = d3.nest().key((d) => d[args.xaxiskey])
    .entries(chartMainData);

  dataNest.map((d) => {
    let isAvailable = false;
    for (let i = 0; i < yDomains.length; i += 1) {
      // yDomains[i] === "Bolde_Connatix" && console.log('here1', yDomains[i])
      for (let j = 0; j < d.values.length; j += 1) {
        // d.values[j][chartSegmentation] === "Bolde_Connatix" && console.log('here2', d.values[j][chartSegmentation])
        if (yDomains[i] === d.values[j][chartSegmentation]) {
          // console.log('')
          isAvailable = true
          break;
        }
      }
      if (!isAvailable) {
        d.values.push({
          [args.xaxiskey]: d.values[0][args.xaxiskey],
          [args.yaxiskey]: 0,
          [chartSegmentation]: yDomains[i]
        })
      } else {
        isAvailable = false;
      }
    }
    data = [...data, ...d.values];
  })

  // Set color for chart
  let min = 0;
  let max = 0;
  args.data.map((d) => {
    if (d[measurementValue] < min) {
      min = d[measurementValue];
    }
    if (d[measurementValue] > max) {
      max = d[measurementValue];
    }
  });

  min = min === 0 ? min : Math.ceil(min) - 1;
  max = Math.ceil(max);

  colorScale = d3.scaleSequential()
    .interpolator(d3.interpolateRgb(defaultColor, secondColor))
    .domain([min, max]);

  chart.append('rect')
    .attr('x', 0) //initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndXAxisPadding)
    .attr('y', 0)// initialConfig.chartTopPadding)
    .attr('width', width)
    .attr('height', height)
    .style('opacity', '0')
    .on("click", () => chartHoverLocked ? handleChartLock() : () => { });

  /* Define and create xScale, xAxis, ticks */
  let xScale;
  let xAxis;
  async function defineXScale() {
    //Set the scales
    xScale = d3.scaleBand()
      .domain(xDomains)
      .range([xStartPoint, xEndPoint])
      .paddingInner(.25)
      .paddingOuter(.25)
      .align(0.5);
    // .round(true);

    //Define the ticks
    xAxis = d3.axisBottom(xScale)
      .tickValues(xAxisTickValues)
      .tickSize(0)
      .tickPadding(5)
      .tickFormat((args.xaxiskey === 'date' ? d3.timeFormat("%m.%d.%Y") : (d) => (typeof d === 'string') ? d.substring(0, innerWidth >= 505 ? 10 : 7) : d));

    //Draw x-axis
    chart.append("g")
      .attr("class", "axis x-axis")
      .attr("transform", "translate(" + 0 + ", " + xAxisBottomPos + ")") //start with 10px instead of 0
      .call(xAxis)
      .attr('font-size', tickFontSize + 'px');
  }
  defineXScale().then(() => {
    //Change x axis first and last tick position
    alignXAxisTicks(width, args.unique_key, initialConfig, xAxisTickValues, xDomains, parseDate, tickFontSize, xAxisTickStartPos);
  });

  /* Define and create yScale, yAxis, ticks */
  let y_steps = args.yAxisTicksCount !== undefined ? args.yAxisTicksCount : initialConfig.defaultYAxisTicksCount;
  if (yScaleLimits && args.chartFormat.yaxis.tick !== '' && args.chartFormat.yaxis.tick > 0) {
    y_steps = Math.floor(yScaleLimits['upperLimit'] / args.chartFormat.yaxis.tick) + 1;
  }

  function getTickValuesForYAxis() {
    let totalHeight = yStartPoint - yEndPoint;
    let dataLength = yDomains.length;
    let heightRequired = dataLength * 16;
    let leaveIndex = 1;
    let dataForY = [];
    let value;
    if (totalHeight <= 90) {
      value = yDomains[0].toString().split('.')[0];
      dataForY.push(value);
      value = yDomains[yDomains.length - 1].toString().split('.')[0];
      dataForY.push(value);
    } else {
      while (heightRequired > totalHeight) {
        heightRequired = (dataLength / 2) * 16;
        dataLength = dataLength / 2;
        leaveIndex = leaveIndex === 1 ? 2 : leaveIndex * 2;
      }
      for (let i = 0; i < yDomains.length; i += leaveIndex) {
        value = yDomains[i];
        dataForY.push(value);
      }
    }
    return dataForY;
  }

  // let hasCustomFormat = (args.chartFormat.yaxis.tick || args.chartFormat.yaxis.min || args.chartFormat.yaxis.max) ? true : false;
  // let customTickInterval = hasCustomFormat ? args.chartFormat.yaxis.tick : null;
  let yDomainsAxis = (y_steps > 1) ? getTickValuesForYAxis() : [];
  let yTickValues = (initialConfig.showYAxisTicks) ? [...yDomainsAxis] : [];
  let yScale;
  let yAxis;

  //Define y scale
  yScale = d3.scaleBand()
    .domain(yDomainsAxis)
    .range([yStartPoint, yEndPoint])
    .paddingInner(.25)

  //Define the ticks
  yAxis = d3.axisLeft(yScale)
    .tickValues(yTickValues)
    .tickSize(0)
    .tickPadding(3)

  //Draw y-axis
  chart.append("g")
    .attr("class", "axis y-axis")
    .attr("transform", "translate(" + (widthForYaxisTicks + 5) + ",0)") //start with 10px instead of 0
    .call(yAxis)
    .attr('font-size', tickFontSize + 'px');

  //if no data available
  if (args.isEmpty) {
    chart.append("text")
      .attr("y", ((height / 2)))
      .attr("x", (width / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text('No data available')
      .style("fill", "#fff")
      .attr("class", "no-data");
  }

  let y = d3.scaleBand()
    .domain(yDomains)
    .range([yStartPoint, yEndPoint])

  var g = chart.append("g")
    .attr('width', innerWidth)
    .attr('height', innerHeight + 1)

  g.selectAll()
    .data(data, (d) => `${d[args.xaxiskey]}: ${d[chartSegmentation]}`)
    .enter()
    .append("rect")
    .attr("class", (d, i) => `rect-heatmapchart-${args.unique_key} rect-heatmapchart-${args.unique_key}-${i}`)
    .attr("x", (d) => {
      return xScale(d[args.xaxiskey])
    })
    .attr("y", (d) => {
      return y(d[chartSegmentation]) + boxHeight / 2
    })
    .attr("rx", barWidth / 5 > 4 ? 4 : barWidth / 5)
    .attr("ry", barWidth / 5 > 4 ? 4 : barWidth / 5)
    .attr("width", xScale.bandwidth())
    .attr("height", boxHeight)
    .style("fill", (d) => colorScale(d[measurementValue] === 0 ? 0 : Math.ceil(d[measurementValue])))
    .style("stroke", "none")
    .style("stroke-width", boxPadding < 4 ? boxPadding : 4)
    .on("mousemove", (d, i) => handleValueMouseMove(d, i))
    .on("mouseout", (d, i) => handleValueMouseOut(i))
    .on("click", handleChartLock);

  function handleValueMouseOut(index) {
    if (chartHoverLocked) return false; //if locked no hover allowed

    d3.select(`.rect-heatmapchart-${args.unique_key}-${index}`)
      .style("stroke", "none")

    if (xAxisSliderGroup) xAxisSliderGroup.style("display", "none");
    if (yAxisSliderGroup) yAxisSliderGroup.style("display", "none");
    if (tooltip) {
      tooltip.style('display', 'none');
      tooltipRect.style('display', 'none');
      tooltipRectText.style('display', 'none');
    }
  }

  function handleValueMouseMove(d, index) {
    if (chartHoverLocked) return false; //if locked no hover allowed

    const [x, y] = d3.mouse(args.chartWrapper.current);

    //Generate tooltip details
    // var chartXPos = 0;

    // var xAxisVal;
    // if (args.xaxiskey === 'date') {
      // date = new Date(d[args.xaxiskey]);
      // xAxisVal = parsedDateString(date);
    // } else {
      // xAxisVal = d[args.xaxiskey];
    // }

    d3.select(`.rect-heatmapchart-${args.unique_key}-${index}`)
      .style("stroke", "white")// colorScale(d[measurementValue] === 0 ? 0 : Math.ceil(d[measurementValue])))

    // Show Tooltip
    var tooltip_width = 0;

    tooltip_text = measurementValue + ': ' + args.chartCurrencySymbol + numberWithCommas(d[measurementValue]) + args.chartPercentSymbol;
    calculateTooltipPositionAndWidth(tooltip_text);

    function calculateTooltipPositionAndWidth(text) {
      tooltip_text_width = calculateTextWidth(text, toolTipFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica');
      tooltip_width = tooltip_text_width + 4;
      //tooltip_width = tooltip_width <= maxTooltipWidth ? tooltip_width : maxTooltipWidth;
      // tooltip_pos_adjustment = initialConfig.tooltipHeight + (initialConfig.inbetweenChartAndXAxisPadding < 5 ? 5 : initialConfig.inbetweenChartAndXAxisPadding);
      tooltip_top = y//(y(totalVal ? totalVal : d[args.yaxiskey]) - tooltip_pos_adjustment); //if totalVal is set use that position else use individual bar/bar_block position

      var base_left = x//(xValOnMouseMove);
      // chartXPos = (base_left + tooltip_width);
      var base_right = innerWidth - base_left;

      if ((base_left - widthForYaxisTicks) > base_right && tooltip_width < (base_left - widthForYaxisTicks)) {
        tooltip_left = base_left - tooltip_width - 10;
      } else if (base_right >= (base_left - widthForYaxisTicks) && tooltip_width < base_right) {
        tooltip_left = base_left + 10;
      } else {
        tooltip_left = base_left - (tooltip_width / 2);
        tooltip_top = tooltip_top + 20;
      }
    }

    if (!initialConfig.showXAxisTicks) {
      tooltip_left = 0;
      tooltip_top = xAxisBottomPos;
    }

    tooltip.style("display", "block").attr("transform", "translate(" + (tooltip_left) + "," + (tooltip_top) + ")");
    tooltipRectText
      .text(tooltip_text)
      .attr("dy", "1em")
      .attr('x', 2)
      .attr('fill', initialConfig.showXAxisTicks ? '#000' : '#fff')
      .style('display', 'block');
    // textLinesCount = tooltipRectText.selectAll('tspan').size();
    // textLinesCount = (textLinesCount === undefined || textLinesCount === 0) ? 1 : textLinesCount;
    tooltipRect
      .attr('width', tooltip_width)
      .attr('height', toolTipFontSize + 2) //increase height of rectangle as per text
      .attr('x', 0)
      .attr('y', 0)
      .style('display', initialConfig.showXAxisTicks ? 'block' : 'none');

    //display tick sliders
    //x-axis
    if (xAxisSliderGroup) {
      let max_xslider_width = innerWidth; //innerWidth
      let xaxis_text = args.xaxiskey === 'date' ? parsedDateString(d[args.xaxiskey]) : d[args.xaxiskey];
      let xaxis_box_width = Math.round(calculateTextWidth(xaxis_text, tickSliderFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica') + xAxisSliderRectWidthPadding);
      xaxis_box_width = xaxis_box_width <= max_xslider_width ? xaxis_box_width : max_xslider_width;

      // let xAxisLeftPadding = (icon_width + 2); //icon padding
      let xAxisLeftPadding = barPadding;
      let xTickValPosOrg = x;//xScale(d[args.xaxiskey]);
      let xTickValPos = xTickValPosOrg;
      let xTickValAvailableWidth = (width - initialConfig.chartRightPadding) - xTickValPos - (barPadding / 2 / 2);

      if (barWidth < xaxis_box_width / 2) {
        // console.log('here1')
        xTickValPos = xTickValPos - (xaxis_box_width / 2) + (barWidth / 2);
      } else {
        // console.log('here2')
        xTickValPos = xTickValPos - (barPadding / 2 / 2) + (barWidth / 2) - (xaxis_box_width / 2);
      }

      // adjust starting bars x slider left position
      let lockIconXPos = 0;
      let leftMouseXScrollPos = (x - widthForYaxisTicks - (initialConfig.inbetweenChartAndYAxisPadding + 1));
      xTickValPos = xTickValPosOrg - (barPadding / 2 + 1) - xaxis_box_width / 2 + xAxisLeftPadding / 2; //default
      if (leftMouseXScrollPos <= xaxis_box_width / 2) { // left position
        let leftAvailableWidth = xTickValPosOrg - widthForYaxisTicks - initialConfig.inbetweenChartAndYAxisPadding;
        xTickValPos = xTickValPosOrg - leftAvailableWidth;
        xAxisLeftPadding = 0;
        lockIconXPos = xaxis_box_width + 2;
      }

      // adjust end bars x slider right position
      if (xTickValAvailableWidth <= xaxis_box_width / 2) { // adjust end bars x slider right position
        xTickValPos = (width - initialConfig.chartRightPadding - (xaxis_box_width + xAxisLeftPadding - 1));
      }

      //x-axis slider tick elements
      if (xTickValPos > ((innerWidth + (widthForYaxisTicks - initialConfig.chartRightPadding)) - xaxis_box_width / 2 + 5)) {
        xTickValPos = (innerWidth - xaxis_box_width / 2 + 5);
      } else if (xTickValPos < (widthForYaxisTicks + 5)) {
        xTickValPos = widthForYaxisTicks + 5;
      }

      xAxisSliderGroup.attr("transform", "translate(" + parseInt(xTickValPos) + "," + parseInt(xAxisBottomPos - xAxisSliderRectWidthPadding) + ")")
        .style("display", "block"); // bgBottomPadding is extra bg rect padding
      xAxisSliderGroup.select(".hover-line-status").attr("x", lockIconXPos).attr("y", initialConfig.tickSliderPadding); //lock icon position
      let xAxisSliderTextTopPos = isFitToWidthMode ? parseInt(10 * currentCanvasSize / args.screen) : 10;
      let xAxisSliderTextLeftPos = (xAxisLeftPadding + (isFitToWidthMode ? parseInt(5 * currentCanvasSize / args.screen) : 5));

      async function renderXSliderText() {
        xHoverRectText
          .text(xaxis_text)
          .attr("dy", "1em")
          .attr('x', xAxisSliderTextLeftPos)
          .attr('y', xAxisSliderTextTopPos)
          .style('text-align', 'center')
          .call(trimFromAnyCharacter, xaxis_box_width)
          .style('display', 'block');
      }
      renderXSliderText().then(() => {
        xHoverRect
          .attr('width', xaxis_box_width)
          .attr('height', xTickSliderHeight)
          .attr('x', xAxisLeftPadding)
          .attr('y', 4)
          .style('text-align', 'center')
          .style('display', 'block');
      });
    }

    // y-axis horizoantal line
    let yaxis_text = d[chartSegmentation];
    let yaxis_box_width = calculateTextWidth(yaxis_text, tickFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica');
    let yaxis_box_left_pos = 3; //3 is gapping of 3px

    let ySliderPos = (y - 2);
    if (ySliderPos < 6) {
      ySliderPos = 6;
    } else if (ySliderPos > (innerHeight - 7)) {
      ySliderPos = innerHeight - 7;
    }

    if (yAxisSliderGroup !== undefined) {
      yAxisSliderGroup
        .attr("transform", "translate(" + yaxis_box_left_pos + "," + ySliderPos + ")")
        .style("display", "block"); // bgBottomPadding is extra bg rect padding
      yHoverRect
        .attr('width', (yaxis_box_width + 5))
        .attr('height', xTickSliderHeight)
        .attr('x', (widthForYaxisTicks - yaxis_box_width))
        .attr('y', -(initialConfig.tickHoverBoxHeight / 2))
        .style('display', 'block');
      yHoverRectText.text(yaxis_text)
        .attr('x', (widthForYaxisTicks - yaxis_box_width))
        .attr('y', yTickSliderTextPosTop)
        .style('display', 'block');
    }
  }

  function handleChartLock() {
    if(window.currentSelectedWidget===undefined || !window.currentSelectedWidget || window.currentSelectedWidget!==args.unique_key){
      window.currentSelectedWidget = args.unique_key;
      return;
    }
    
    if (chartHoverLocked) {
      chartHoverLocked = false;
      tooltip.style("display", "none");
      xAxisSliderGroup.style("display", "none");
      yAxisSliderGroup.style("display", "none");

      d3.selectAll(`.rect-heatmapchart-${args.unique_key}`)
        .style("stroke", "none")
    } else {
      chartHoverLocked = true;
    }
  }

  //x-axis tick slider elements
  let xAxisSliderGroup;
  let xHoverRect;
  let xHoverRectText;
  let xTickSliderWidth = isFitToWidthMode ? Math.round(60 * window.innerWidth / args.screen) : 60;
  let xTickSliderHeight = initialConfig.xTickSliderHeight;
  let xTickSliderTextPosLeft = isFitToWidthMode ? Math.round(3 * window.innerWidth / args.screen) : 3;
  let xTickSliderTextPosTop = isFitToWidthMode ? Math.round(4 * window.innerWidth / args.screen) : 4;
  let xAxisSliderRectWidthPadding = isFitToWidthMode ? Math.round(8 * window.innerWidth / args.screen) : 8;
  if (initialConfig.showXAxisTicks) {
    xAxisSliderGroup = chart.append("g").attr("class", "xaxis-slider-group").style("display", "none");
    xHoverRect = xAxisSliderGroup.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", xTickSliderWidth)
      .attr("height", xTickSliderHeight)
      .attr("rx", 1)
      .attr("class", 'hover-xaxis-bg')
      .style("display", "none");
    xHoverRectText = xAxisSliderGroup.append("text")
      .attr('font-size', tickSliderFontSize + 'px')
      .text('')
      .attr('x', xTickSliderTextPosLeft)
      .attr('y', xTickSliderTextPosTop)
      .attr("fill", "#fff")
      .attr("class", "hover-xaxis-tick-val")
      .style("display", "none");
  }

  //y-axis hover elements
  let yAxisSliderGroup;
  let yHoverRect;
  let yHoverRectText;
  let yTickSliderHeight = args.screen ? initialConfig.tickHoverBoxHeight * window.innerWidth / args.screen : initialConfig.tickHoverBoxHeight;
  let yTickSliderWidth = isFitToWidthMode ? Math.round(30 * window.innerWidth / args.screen) : 30;
  let yTickSliderRectPosLeft = isFitToWidthMode ? Math.round(5 * window.innerWidth / args.screen) : 5;
  let yTickSliderTextPosTop = isFitToWidthMode ? Math.round(5 * window.innerWidth / args.screen) : 5;
  if (initialConfig.showYAxisTicks) {
    yAxisSliderGroup = chart.append("g").attr("class", "yaxis-slider-group").style("display", "none");
    yHoverRect = yAxisSliderGroup.append("rect")
      .attr("x", yTickSliderRectPosLeft)
      .attr("y", 0)
      .attr("width", yTickSliderWidth)
      .attr("height", yTickSliderHeight + 3)
      .attr("rx", 1)
      .attr("class", 'hover-yaxis-bg')
      .style("display", "none");
    yHoverRectText = yAxisSliderGroup.append("text")
      .attr('font-size', tickSliderFontSize + 'px')
      .text('')
      .attr('x', 0)
      .attr('y', 0)
      .attr("fill", "#fff")
      .attr("class", "hover-yaxis-tick-val")
      .style("display", "none");
  }

  //Tooltip 
  let tooltip_text = '';
  let tooltip_text_width = 0;
  let tooltip_top = 0;
  // let tooltip_pos_adjustment = 0;
  let tooltip_left = 0;

  let tooltip = chart.append("g")
    .attr("class", "tooltip1")
    .attr("transform", "translate(0, 0)");
  let tooltipRect = tooltip.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 0)
    .attr("height", (toolTipFontSize + 2))
    // .attr('fill', '#2e323c')
    .attr('fill', '#dedede')
    .attr("rx", 2)
    .attr("class", 'tooltip-rect');
  let tooltipRectText = tooltip.append("text")
    .attr('font-size', toolTipFontSize + 'px')
    .text('')
    .attr('x', 0)
    .attr('y', 0)
    .attr("fill", "#000")
    .attr("class", "tooltip-text");
}

// Draw Spider Chart
function drawSpiderChart(args) {
  //chart initial settings variables
  const initialConfig = getInitialChartConfig(args);
  if (!initialConfig) return;

  //basic configurations
  // let width = args.chartWrapper.current.offsetWidth;
  // let innerWidth = width - (initialConfig.chartLeftPadding + initialConfig.chartRightPadding + initialConfig.inbetweenChartAndYAxisPadding);
  let chartWrapperHeight = d3.select('#chart-' + args.unique_key).node().getBoundingClientRect().height;
  let height = chartWrapperHeight - initialConfig.chartWidgetBottomPadding - initialConfig.chartHeadingSectionHeight;
  if (args.excludeChartHeader !== undefined) { // if chart width is less than default add removed chart header+margin heightto chart height
    height = height + initialConfig.chartInnerHeadingSectionHeightWithMargin + (initialConfig.chartWidgetBottomPadding - 5);
  }
  // let innerHeight = (height - initialConfig.chartBottomPadding - initialConfig.chartTopPadding);
  let xAxisBottomPos = (height - initialConfig.chartBottomPadding + initialConfig.inbetweenChartAndXAxisPadding);
  d3.select(args.chartWrapper.current).style("height", height + 'px'); //set chart height

  //Chart icons
  // let iconLock = '<g class="nc-icon-wrapper" fill="#ff0000" transform="translate(0, 0)"><path d="M21,10H18V6.01A5.96,5.96,0,0,0,12.1,0h-.09A5.94,5.94,0,0,0,6,5.9V10H3a1,1,0,0,0-1,1V23a1,1,0,0,0,1,1H21a1,1,0,0,0,1-1V11A1,1,0,0,0,21,10Zm-9,9a2,2,0,1,1,2-2A2,2,0,0,1,12,19Zm4-9H8V5.91A3.957,3.957,0,0,1,11.959,2h.131A3.957,3.957,0,0,1,16,6Z" fill="#ff0000"></path></g>';
  // let iconUnlock = '<g class="nc-icon-wrapper" fill="#00ff7f" transform="translate(0, 0)"><path d="M21,10H8V5.91A3.957,3.957,0,0,1,11.959,2h.131A3.955,3.955,0,0,1,16,5.99l2,.02A5.96,5.96,0,0,0,12.1,0h-.09A5.94,5.94,0,0,0,6,5.9V10H3a1,1,0,0,0-1,1V23a1,1,0,0,0,1,1H21a1,1,0,0,0,1-1V11A1,1,0,0,0,21,10Zm-9,9a2,2,0,1,1,2-2A2,2,0,0,1,12,19Z" fill="#00ff7f"></path></g>';

  let isFitToWidthMode = (args.screen && !args.isDashboardInEditMode && (args.viewModeType !== undefined && args.viewModeType.name === 'Fit to Width'));
  let tickFontSize = isFitToWidthMode ? Math.floor(10 * window.innerWidth / args.screen) : 10;
  let toolTipFontSize = isFitToWidthMode ? Math.floor(11 * window.innerWidth / args.screen) : 11;

  //Define charts configs
  // let isSegmented = (args.chartSegmentation && args.chartSegmentation !== '' && args.chartSegmentation !== 'all' && args.chartSegmentation !== ' ');
  // let chartSegmentation = isSegmented ? args.chartSegmentation : '';
  let chartHoverLocked = false;
  // let defaultColor = (args.chartFormat.color && args.chartFormat.color.single_color !== '') ? args.chartFormat.color.single_color : chartColors[0]; //pick selected color
  let color = getColor(args); //Set Color Scales
  let parsedDateString = d3.timeFormat("%d %b %Y");
  let widthForChart = args.chartWrapper.current.offsetWidth;
  let heightForChart = height; //args.chartWrapper.current.offsetHeight;

  //return from here if data is not available
  if (!args.data || args.data.length === 0) return;

  //Define SVG and group element
  let svg = getSVGElement(args.chartWrapper.current, widthForChart, heightForChart);
  // let chart = getGroupElement(svg, args.yaxiskey);

  let minValues = {};
  let maxValues = {};
  let yDomains = {};
  let sortedYDomains = [];
  let measurements = args.yaxiskey.split(",");

  for (let i = 0; i < measurements.length; i += 1) {
    let max = 0;
    let min = 0;
    let values = args.data.map((d) => {
      if (max < d[measurements[i]]) {
        max = d[measurements[i]];
      }
      if (min > d[measurements[i]]) {
        min = d[measurements[i]];
      }
      return d[measurements[i]];
    });
    maxValues = { ...maxValues, [measurements[i]]: max };
    minValues = { ...minValues, [measurements[i]]: min };
    yDomains = { ...yDomains, [measurements[i]]: values };
  }
  for (let i = 0; i < measurements.length; i += 1) {
    let sortedValues = yDomains[measurements[i]].sort((a, b) => a - b);
    sortedYDomains = { ...sortedYDomains, [measurements[i]]: sortedValues };
  }

  let maxWidthAxisValue = 0;
  measurements.map((value) => {
    let width = calculateTextWidth(value, tickFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica');
    if (width > maxWidthAxisValue) {
      maxWidthAxisValue = width;
    }
  });

  let radius;
  if (args.chartSizeClass !== '') {
    radius = widthForChart <= heightForChart ? ((widthForChart / 2) - (widthForChart / 10)) : ((heightForChart / 2) - (heightForChart / 10));
  } else {
    radius = widthForChart <= heightForChart ? ((widthForChart / 2) - maxWidthAxisValue) : ((heightForChart / 2) - (heightForChart / 10));
  }
  let angleSlice = (Math.PI * 2) / measurements.length;
  let strokeWidth = 1;
  let dotRadius = radius / 50;
  let minimumDifference = (widthForChart < 150 || heightForChart < 150) ? 50 : widthForChart <= heightForChart ? (widthForChart / 5 > 50 ? widthForChart / 5 : 50) : (heightForChart / 5 > 50 ? heightForChart / 5 : 50);
  let levels;

  if (args.chartSizeClass === '') {
    levels = 4;
  } else {
    levels = parseInt((radius / minimumDifference).toString().split('.')[0]) + 1;
  }

  svg.append("rect")
    .attr("width", widthForChart)
    .attr("height", heightForChart)
    .attr('class', 'chart-bg')
    .on("click", () => chartHoverLocked && window.currentSelectedWidget===args.unique_key ? () => {handleChartLock()} : () => { })

  let rScales = {};
  for (let i = 0; i < measurements.length; i += 1) {
    let scale = d3.scaleLinear()
      .range([0, radius])
      .domain([minValues[measurements[i]], maxValues[measurements[i]]]);

    rScales = { ...rScales, [measurements[i]]: scale };
  }

  let g = svg.append("g")
    .attr("transform", "translate(" + widthForChart / 2 + ", " + heightForChart / 2 + ")");

  let axisGrid = g.append("g");

  axisGrid.selectAll()
    .data(d3.range(1, (levels + 1)).reverse())
    .enter()
    .append("circle")
    .attr("class", "gridCircle")
    .attr("r", function (d) { return (radius / levels) * d; })
    .style("fill", "#CDCDCD")
    .style("stroke", "#CDCDCD")
    .style("fill-opacity", "0.1")
    .on("click", () => {
      if (chartHoverLocked) {
        chartHoverLocked = false;
        tooltip.style("display", 'none');
      }
    });

  //Text indicating at what % each level is
  axisGrid.selectAll()
    .data(d3.range(1, (levels + 1)).reverse())
    .enter().append("text")
    .attr("class", "axisLabel")
    .attr("x", 4)
    .attr("y", function (d) { return -d * radius / levels; })
    .attr("dy", "0.4em")
    .style("font-size", tickFontSize)
    .attr("fill", "white")
    .text(function (d) {
      let value = (100 / levels) * d;
      if (value.toString().length > 5) {
        value = value.toString().split('.');
        value = value[0] + "." + value[1][0] + value[1][1];
      }
      return value + "%";
    });

  let axis = axisGrid.selectAll()
    .data(measurements)
    .enter();

  //Append the lines
  axis.append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", function (d, i) { return rScales[measurements[i]](maxValues[measurements[i]]) * Math.cos(angleSlice * i - Math.PI / 2); })
    .attr("y2", function (d, i) { return rScales[measurements[i]](maxValues[measurements[i]]) * Math.sin(angleSlice * i - Math.PI / 2); })
    .attr("class", "line")
    .style("stroke", "#CDCDCD");

  //Append the labels at each axis
  axis.append("text")
    .attr("class", "legend")
    .style("font-size", tickFontSize)
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .style("font-size", tickFontSize)
    .text(function (d) { return args.chartSizeClass !== '' ? '' : (d[0].toUpperCase() + d.substring(1, d.length)) })
    .attr("transform", (d, i) => {
      let scaleValueX = rScales[measurements[i]](maxValues[measurements[i]] * 1.1) * Math.cos(angleSlice * i - Math.PI / 2);
      let width;
      if (scaleValueX > 1) {
        width = calculateTextWidth(d, tickFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica');
        scaleValueX = scaleValueX + width / 2 + dotRadius * 4;
      } else if (scaleValueX < -1) {
        width = calculateTextWidth(d, tickFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica');
        scaleValueX = scaleValueX - width / 2 - dotRadius * 4;
      } else {
        // scaleValueX = scaleValueX;
      }

      let scaleValueY = rScales[measurements[i]](maxValues[measurements[i]] * 1.1) * Math.sin(angleSlice * i - Math.PI / 2) * 1.1;

      return `translate(${scaleValueX}, ${scaleValueY})`;
    })
    .style("fill", "white");

  //The radial line function
  var radarLine = d3.lineRadial()
    .radius((d, i) => { return i !== measurements.length ? rScales[measurements[i]](d) : rScales[measurements[0]](d) })//[measurements[i]]); })
    .angle((d, i) => { return i * angleSlice; })
  // .curve(d3.curveCardinalClosed)

  let pathValues = [];

  for (let i = 0; i < args.data.length; i += 1) {
    let pathValue = [];
    let arrayToSend = [];
    for (let j = 0; j < measurements.length; j += 1) {
      arrayToSend.push(args.data[i][measurements[j]]);
    }
    arrayToSend.push(args.data[i][measurements[0]]);
    pathValue = radarLine([...arrayToSend]);
    pathValues.push(pathValue);
  }

  //Create a wrapper for the blobs	
  var blobWrapper = g.selectAll()
    .data(args.data)
    .enter().append("g")
    .attr("class", "radarWrapper");

  blobWrapper
    .append("path")
    .attr("class", (i) => `radarArea-spiderchart-${args.unique_key} radarArea-spiderchart-${args.unique_key}-${i}`)
    .attr("d", function (i) { return pathValues[i]; })
    .style("fill", function (d) {
      let value = d[args.xaxiskey];
      if (args.xaxiskey === 'date') {
        value = new Date(value);
        value = parsedDateString(value);
      }
      return color(value);
    })
    .style("fill-opacity", 0.4)
    .on("mousemove", (d, i) => handleBlobMouseMove(d, i))
    .on("mouseout", handleBlobMouseOut)
    .on("click",  () => {if (window.currentSelectedWidget===args.unique_key){handleChartLock()}});

  blobWrapper.append("path")
    .attr("class", "radarStroke")
    .attr("d", (d, i) => pathValues[i])
    .style("stroke-width", strokeWidth + "px")
    .style("stroke", (d) => {
      let value = d[args.xaxiskey];
      if (args.xaxiskey === 'date') {
        value = new Date(value);
        value = parsedDateString(value);
      }
      return color(value);
    })
    .style("fill", "none")
    .on("mousemove", (d, i) => handleBlobMouseMove(d, i))
    .on("mouseout", handleBlobMouseOut)
    .on("click",  () => {if (window.currentSelectedWidget===args.unique_key){ handleChartLock() }});

  for (let i = 0; i < args.data.length; i += 1) {
    //Append the circles
    blobWrapper
      .selectAll()
      .data(measurements)
      .enter()
      .append("circle")
      .attr("class", "radarCircle")
      .attr("r", dotRadius)
      .attr("cx", function (d, k) { return rScales[d](args.data[i][d]) * Math.cos(angleSlice * k - Math.PI / 2); })
      .attr("cy", function (d, k) { return rScales[d](args.data[i][d]) * Math.sin(angleSlice * k - Math.PI / 2); })
      .style("fill", () => {
        let value = args.data[i][args.xaxiskey];
        if (args.xaxiskey === 'date') {
          value = new Date(value);
          value = parsedDateString(value);
        }
        return color(value);
      })
      .style("fill-opacity", "0.5")
      .attr('class', 'trackpad')
      .on('mousemove', (d) => handleChartMouseMove(d, args.data[i], i))
      .on('mouseout', () => handleChartMouseOut(i))
      // .on("click", () => {if (window.currentSelectedWidget===args.unique_key){console.log('here4', window.currentSelectedWidget, args.unique_key);handleChartLock()}});
  }

  //Tooltip 
  let tooltip_text = '';
  let tooltip_text_width = 0;
  let tooltip_top = 0;
  // let tooltip_pos_adjustment = 0;
  let tooltip_left = 0;

  let tooltip = svg.append("g")
    .attr("class", "tooltip1")
    .attr("transform", "translate(0, 0)");
  let tooltipRect = tooltip.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 0)
    .attr("height", (toolTipFontSize + 2))
    .attr('fill', '#dedede')
    .attr("rx", 2)
    .attr("class", 'tooltip-rect');
  let tooltipRectText = tooltip.append("text")
    .attr('font-size', toolTipFontSize + 'px')
    .text('')
    .attr('x', 0)
    .attr('y', 0)
    .attr("fill", "#000")
    .attr("class", "tooltip-text");


  function handleBlobMouseOut() {
    if (chartHoverLocked) return false; //if locked no hover allowed

    if(window.currentSelectedWidget===args.unique_key){
      showAggregatedSegmentsDetails(args, initialConfig, color);
    }

    d3.selectAll(`.radarArea-spiderchart-${args.unique_key}`)
      .style("fill-opacity", 0.4);
  }

  function handleBlobMouseMove(d, i) {
    if (chartHoverLocked) return false; //if locked no hover allowed
    if(window.currentSelectedWidget===args.unique_key){
      showHoverSegmentDetails(args, initialConfig, [d], d.data, d[args.xaxiskey], d[args.xaxiskey], color, 'spider');
    }

    d3.selectAll(`.radarArea-spiderchart-${args.unique_key}`)
      .style("fill-opacity", 0);
    d3.select(`.radarArea-spiderchart-${args.unique_key}-${i}`)
      .style("fill-opacity", 0.8);
  }

  //call on initial load - to show aggregated segmented values
  handleChartMouseOut();

  //Remove tooltip on mouse out
  function handleChartMouseOut() {
    if (chartHoverLocked) return false; //if locked no hover allowed
    d3.selectAll(`.radarArea-spiderchart-${args.unique_key}`)
      .style("fill-opacity", 0.4);

    if (chartHoverLocked) return false; //if locked no hover allowed
    if (tooltip) tooltip.style('display', 'none');

    // show aggregated table when not hovering the chart
    if(window.currentSelectedWidget===args.unique_key){
      showAggregatedSegmentsDetails(args, initialConfig, color);
    }
  }

  function handleChartLock() {
    if(window.currentSelectedWidget===undefined || !window.currentSelectedWidget || window.currentSelectedWidget!==args.unique_key){
      window.currentSelectedWidget = args.unique_key;
      return;
    }

    if (chartHoverLocked) {
      chartHoverLocked = false;
      tooltip.style("display", "none");
      d3.selectAll(`.radarArea-spiderchart-${args.unique_key}`).style("fill-opacity", 0.4);
      showAggregatedSegmentsDetails(args, initialConfig, color);
    } else {
      chartHoverLocked = true;
    }
  }

  // var dataValues = null;
  function handleChartMouseMove(measurement, d, index) {
    if (chartHoverLocked) return false; //if locked no hover allowed

    if(window.currentSelectedWidget===args.unique_key){
      showHoverSegmentDetails(args, initialConfig, [d], d.data, d[args.xaxiskey], d[args.xaxiskey], color, 'spider');
    }
    const [x, y] = d3.mouse(args.chartWrapper.current);

    d3.selectAll(`.radarArea-spiderchart-${args.unique_key}`)
      .style("fill-opacity", 0);
    d3.select(`.radarArea-spiderchart-${args.unique_key}-${index}`)
      .style("fill-opacity", 0.8);

    //Generate tooltip details
    // var chartXPos = 0;

    // Show Tooltip
    var block_tooltip_text = '';
    var tooltip_width = 0;
    if (args.pointSelectionModeOn) {
      block_tooltip_text = 'Click to Select';
    } else {
      let text;
      if (args.xaxiskey === 'date') {
        var date = new Date(d[args.xaxiskey]);
        text = parsedDateString(date);
      } else {
        text = d[args.xaxiskey];
      }
      block_tooltip_text = text + ': ' + args.chartCurrencySymbol + numberWithCommas(d[measurement]) + args.chartPercentSymbol; //details;
    }
    tooltip_text = block_tooltip_text;
    calculateTooltipPositionAndWidth(tooltip_text);

    function calculateTooltipPositionAndWidth(text) {
      tooltip_text_width = calculateTextWidth(text, toolTipFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica');
      tooltip_width = tooltip_text_width + 4;
      //tooltip_width = tooltip_width <= maxTooltipWidth ? tooltip_width : maxTooltipWidth;
      // tooltip_pos_adjustment = initialConfig.tooltipHeight + (initialConfig.inbetweenChartAndXAxisPadding < 5 ? 5 : initialConfig.inbetweenChartAndXAxisPadding);
      tooltip_top = y//(y(totalVal ? totalVal : d[args.yaxiskey]) - tooltip_pos_adjustment); //if totalVal is set use that position else use individual bar/bar_block position

      var base_left = x//(xValOnMouseMove);
      // chartXPos = (base_left + tooltip_width);
      var base_right = widthForChart - base_left;

      if (base_left > base_right && tooltip_width < base_left) {
        tooltip_left = base_left - tooltip_width - 10;
      } else if (base_right >= base_left && tooltip_width < base_right) {
        tooltip_left = base_left + 10;
      } else {
        tooltip_left = base_left - (tooltip_width / 2);
        tooltip_top = tooltip_top + 20;
      }
    }

    if (!initialConfig.showXAxisTicks) {
      tooltip_left = 0;
      tooltip_top = xAxisBottomPos;
    }

    let textLinesCount = 1;
    tooltip.style("display", "block").attr("transform", "translate(" + (tooltip_left) + "," + (tooltip_top) + ")");
    tooltipRectText
      .text(tooltip_text)
      .attr("dy", "1em")
      .attr('x', 2)
      .attr('fill', initialConfig.showXAxisTicks ? '#000' : '#fff')
      .style('display', 'block');
    textLinesCount = tooltipRectText.selectAll('tspan').size();
    textLinesCount = (textLinesCount === undefined || textLinesCount === 0) ? 1 : textLinesCount;
    tooltipRect
      .attr('width', tooltip_width)
      .attr('height', textLinesCount * (toolTipFontSize + 2) + textLinesCount) //increase height of rectangle as per text
      .attr('x', 0)
      .attr('y', 0)
      .style('display', initialConfig.showXAxisTicks ? 'block' : 'none');
  }
}

// Draw WaterFall Chart
function drawWaterFallChart(args) {
  //chart initial settings variables
  const initialConfig = getInitialChartConfig(args);
  if (!initialConfig) return;

  //basic configurations
  let width = args.chartWrapper.current.offsetWidth;
  let innerWidth = width - (initialConfig.chartLeftPadding + initialConfig.chartRightPadding + initialConfig.inbetweenChartAndYAxisPadding);
  let chartWrapperHeight = d3.select('#chart-' + args.unique_key).node().getBoundingClientRect().height;
  let height = chartWrapperHeight - initialConfig.chartWidgetBottomPadding - initialConfig.chartHeadingSectionHeight;
  if (args.excludeChartHeader !== undefined) { // if chart width is less than default add removed chart header+margin heightto chart height
    height = height + initialConfig.chartInnerHeadingSectionHeightWithMargin + (initialConfig.chartWidgetBottomPadding - 5);
  }
  let innerHeight = (height - initialConfig.chartBottomPadding - initialConfig.chartTopPadding);
  let xAxisBottomPos = (height - initialConfig.chartBottomPadding + initialConfig.inbetweenChartAndXAxisPadding);
  d3.select(args.chartWrapper.current).style("height", height + 'px'); //set chart height

  //Chart icons
  // let iconLock = '<g class="nc-icon-wrapper" fill="#ff0000" transform="translate(0, 0)"><path d="M21,10H18V6.01A5.96,5.96,0,0,0,12.1,0h-.09A5.94,5.94,0,0,0,6,5.9V10H3a1,1,0,0,0-1,1V23a1,1,0,0,0,1,1H21a1,1,0,0,0,1-1V11A1,1,0,0,0,21,10Zm-9,9a2,2,0,1,1,2-2A2,2,0,0,1,12,19Zm4-9H8V5.91A3.957,3.957,0,0,1,11.959,2h.131A3.957,3.957,0,0,1,16,6Z" fill="#ff0000"></path></g>';
  // let iconUnlock = '<g class="nc-icon-wrapper" fill="#00ff7f" transform="translate(0, 0)"><path d="M21,10H8V5.91A3.957,3.957,0,0,1,11.959,2h.131A3.955,3.955,0,0,1,16,5.99l2,.02A5.96,5.96,0,0,0,12.1,0h-.09A5.94,5.94,0,0,0,6,5.9V10H3a1,1,0,0,0-1,1V23a1,1,0,0,0,1,1H21a1,1,0,0,0,1-1V11A1,1,0,0,0,21,10Zm-9,9a2,2,0,1,1,2-2A2,2,0,0,1,12,19Z" fill="#00ff7f"></path></g>';

  let currentCanvasSize = (window.innerWidth - 10);
  let isFitToWidthMode = (args.screen && !args.isDashboardInEditMode && (args.viewModeType !== undefined && args.viewModeType.name === 'Fit to Width'));
  let tickFontSize = isFitToWidthMode ? Math.round(10 * currentCanvasSize / args.screen) : 10;
  let xAxisTickStartPos = isFitToWidthMode ? Math.round(75 * currentCanvasSize / args.screen) : 75;
  let yAxisTickTopPos = isFitToWidthMode ? Math.round(5 * currentCanvasSize / args.screen) : 5;
  let tickSliderFontSize = isFitToWidthMode ? Math.round(11 * currentCanvasSize / args.screen) : 10;
  let toolTipFontSize = isFitToWidthMode ? Math.round(11 * currentCanvasSize / args.screen) : 11;

  //Define charts configs
  let isSegmented = (args.chartSegmentation && args.chartSegmentation !== '' && args.chartSegmentation !== 'all' && args.chartSegmentation !== ' ');
  let chartSegmentation = isSegmented ? args.chartSegmentation : '';
  let chartHoverLocked = false;
  let defaultColor = (args.chartFormat.color && args.chartFormat.color.single_color !== '') ? args.chartFormat.color.single_color : chartColors[0]; //pick selected color
  let color = getColor(args); //Set Color Scales
  let parseDate = d3.timeFormat("%m.%d.%Y"),
    parsedDateString = d3.timeFormat("%d %b %Y"),
    formatYNumber = d3.format("");

  //Data variable
  let chartMainData = [...args.data];
  let barWidthObj = getBarWidth(innerWidth, chartMainData);
  let barWidth = barWidthObj.width;
  let barPadding = barWidthObj.padding;

  //Define SVG and group element
  let svg = getSVGElement(args.chartWrapper.current, width, height);
  let chart = getGroupElement(svg, args.yaxiskey);

  let dataForChart = [];

  let cumulative = 0;
  // if (isSegmented) {
  // } else {
  // for (var i = 0; i < args.data.length; i++) {
  //   dataForChart[i] = { ...dataForChart[i], start: cumulative };
  //   cumulative += args.data[i][args.yaxiskey];
  //   dataForChart[i] = { ...dataForChart[i], end: cumulative };

  //   dataForChart[i] = { ...dataForChart[i], [args.xaxiskey]: args.data[i][args.xaxiskey] };
  //   dataForChart[i] = { ...dataForChart[i], [args.yaxiskey]: args.data[i][args.yaxiskey] };

  //   if (chartSegmentation || chartSegmentation !== '') dataForChart[i] = { ...dataForChart[i], [chartSegmentation]: args.data[i][chartSegmentation] }

  //   dataForChart[i] = { ...dataForChart[i], class: (args.data[i][args.yaxiskey] >= 0) ? 'positive' : 'negative' }
  // }
  // dataForChart.push({
  //   [args.xaxiskey]: 'Total',
  //   [args.yaxiskey]: cumulative,
  //   end: cumulative,
  //   start: 0,
  //   class: cumulative >= 0 ? 'positive' : 'negative'
  // });
// }

  // console.log(args.data)
  // console.log(dataForChart);

  let xDomains = args.data.map((d) => d[args.xaxiskey]);
  // let yDomains = dataForChart.map((d) => d[args.yaxiskey]);

  let total = 0;
  let max = 0;
  let min = 0;

  //Scaling Points - start and end
  let xStartPoint = initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndYAxisPadding;
  let xEndPoint = (width - initialConfig.chartRightPadding);
  let yStartPoint = xAxisBottomPos - initialConfig.inbetweenChartAndXAxisPadding - 1;
  let yEndPoint = initialConfig.chartTopPadding;

  let yScaleLimits;
  let series;
  // let totalSegmentData = {};
  // let segmentedBarHeights = {};
  // let segmentedBarBlocksYPos = {};
  // let segmentedBarBlocksHeight = {};

  //Define X-Axis for each chart - date/string
  // let xDomains = args.data.map((d) => d[args.xaxiskey]);
  let xAxisTickValues = getXAxisTickValues(initialConfig, xDomains, chartMainData, args); // get x axis calculated tick values
  let dataNest;

  // Individual Chart Elements - background rect, y axis line, x axis line to merge both x ans y axis corner
  let bgBottomPadding = 2;
  chart.append('rect')
    .attr('width', innerWidth)
    .attr('height', innerHeight + bgBottomPadding)
    .attr('x', initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndYAxisPadding)
    .attr('y', initialConfig.chartTopPadding)
    .attr('class', 'chart-bg')
    .on('click', () => {
      if (chartHoverLocked) {
        chartHoverLocked = false;
        tooltip.style("display", 'none')
      }
    });

  //Add the chartHoverTrackPad before when it is segmented
  if (isSegmented) {
    chart.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight + 1)
      .attr('x', initialConfig.chartLeftPadding + initialConfig.inbetweenChartAndYAxisPadding)
      .attr('y', initialConfig.chartTopPadding)
      .attr('opacity', 0)
      .attr('class', 'trackpad')
      // .attr('fill', 'red')
      // .on("mouseover", () => {
      //   if(xAxisSliderGroup){ xAxisSliderGroup.style("display", null); }
      //   if(yAxisSliderGroup){ yAxisSliderGroup.style("display", null); }
      //   hoverYGridLine.style("display", null);
      //   tooltip.style("display", null);
      //   barHoverHighlighter.style("display", null);
      // barHighlighterOverlay.style("display", null);
      // })
      // .on("mouseout", handleChartMouseOut)
      // .on("mousemove", handleChartMouseMove)
      // .on("click", handleChartLock);
  }
  // console.log(dataForChart)

  // Nest the entries by symbol
  if (isSegmented) {
    // for (var i = 0; i < args.data.length; i += 0) {

    // }

    chartSegmentation = args.isComparisonEnabled ? 'id' : chartSegmentation
    dataNest = d3.nest().key((d) => d[args.xaxiskey])
      .entries(args.data);

    // console.log(dataNest, cumulative)

    let totalPositiveValues = 0, totalNegativeValues = 0, totalPositiveObjects = [], totalNegaticeObjects = [];

    for (var i = 0; i < dataNest.length; i += 1) {
      dataForChart[i] = { ...dataForChart[i], start: cumulative };
      dataForChart[i] = { ...dataForChart[i], key: dataNest[i].key };

      let totalPos = 0, totalNeg = 0;
      let pos = [], neg = [];

      dataNest[i].values.map((d) => {
        if (d[args.yaxiskey] < 0) {
          totalNeg += d[args.yaxiskey];
          neg.push(d);
        } else {
          totalPos += d[args.yaxiskey];
          pos.push(d);
        }
      });

      totalPositiveObjects = [ ...totalPositiveObjects, pos ];
      totalNegaticeObjects = [ ...totalNegaticeObjects, neg ];
      totalPositiveValues += totalPos;
      totalNegativeValues += totalNeg;

      cumulative = cumulative + (totalPos + totalNeg);
      dataForChart[i] = { ...dataForChart[i], end: cumulative }
      dataForChart[i] = { ...dataForChart[i], totalPositive: totalPos }
      dataForChart[i] = { ...dataForChart[i], totalNegative: totalNeg }
      dataForChart[i] = { ...dataForChart[i], positiveValues: pos }
      dataForChart[i] = { ...dataForChart[i], negativeValues: neg }

      if ((cumulative - totalPositiveValues) < min) {
        min = cumulative-totalPositiveValues;
      }
      if (cumulative > max) {
        max = cumulative
      }
    }

    dataForChart[dataForChart.length] = {
      key: 'Total',
      start: 0,
      end: totalPositiveValues,
      totalNegative: totalNegativeValues,
      totalPositive: totalPositiveValues,
      positiveValues: totalPositiveObjects,
      negativeValues: totalNegaticeObjects
    }

    //   dataForChart[i] = { ...dataForChart[i], start: cumulative };
    //   for (var j = 0; j < args.data.length; j += 1) {

    //   }
    //   dataForChart[i] = { ...dataForChart[i], start: cumulative };
    //   cumulative += args.data[i][args.yaxiskey];
    //   dataForChart[i] = { ...dataForChart[i], end: cumulative };
  
    //   dataForChart[i] = { ...dataForChart[i], [args.xaxiskey]: args.data[i][args.xaxiskey] };
    //   dataForChart[i] = { ...dataForChart[i], [args.yaxiskey]: args.data[i][args.yaxiskey] };
  
    //   dataForChart[i] = { ...dataForChart[i], class: (args.data[i][args.yaxiskey] >= 0) ? 'positive' : 'negative' }
    // }
    // dataForChart.push({
    //   [args.xaxiskey]: 'Total',
    //   [args.yaxiskey]: cumulative,
    //   end: cumulative,
    //   start: 0,
    //   class: cumulative >= 0 ? 'positive' : 'negative'
    // });


    // console.log(dataForChart)
    // args.data.map((d) => {
    //   totalSegmentData = { ...totalSegmentData, [d[chartSegmentation]]: (totalSegmentData[d[chartSegmentation]] ? totalSegmentData[d[chartSegmentation]] : 0) + d[args.yaxiskey] }
    // })

    
    barWidthObj = getBarWidth(innerWidth, dataNest);
    barWidth = barWidthObj.width;
    barPadding = barWidthObj.padding;
    
    let formattedData = [];
    dataNest.forEach((item) => {
      let obj = {};
      obj[args.xaxiskey] = item.values[0][args.xaxiskey];
      item.values.forEach((subitem) => {
        obj[subitem[chartSegmentation]] = subitem[args.yaxiskey];
      })
      formattedData.push(obj);
    });

    let segments = [];
    if (formattedData.length > 0) {
      formattedData.forEach((item) => {
        Object.keys(item).forEach((subitem) => {
          if (!segments.includes(subitem)) {
            segments.push(subitem);
          }
        })
      });
    }
    // console.log(formattedData)

    let xaxis_key_index = segments.findIndex((x) => x === args.xaxiskey);
    if (xaxis_key_index > -1) {
      segments.splice(xaxis_key_index, 1);
    }

    // set up stack method
    const stack = d3.stack().keys(segments);
    series = stack(formattedData);

    //get x axis ticks
    xDomains = formattedData.map((d) => d[args.xaxiskey]);

    //get y axis ticks
    let minVal = d3.min(series, (d) => d3.min(d, (d) => d[1]));
    let maxVal = d3.max(series, (d) => d3.max(d, (d) => d[1]));
    let range = (maxVal - minVal);
    yScaleLimits = { 'lowerLimit': 0, 'upperLimit': maxVal + (0.10 * range) };
    if (args.chartFormat.yaxis.min !== '' && args.chartFormat.yaxis.min !== 0) { yScaleLimits['lowerLimit'] = args.chartFormat.yaxis.min; }
    if (args.chartFormat.yaxis.max !== '' && args.chartFormat.yaxis.max !== 0) { yScaleLimits['upperLimit'] = args.chartFormat.yaxis.max; }

  } else {
    args.data.map((d) => {
      total += d[args.yaxiskey];
      // console.log("value: ", value)
      if (max < d[args.yaxiskey]) {
        max = d[args.yaxiskey];
      }
      if (max < total) {
        max = total;
      }
      if (min > total) {
        min = total;
      }
    });

    for (let i = 0; i < args.data.length; i++) {
      dataForChart[i] = { ...dataForChart[i], start: cumulative };
      cumulative += args.data[i][args.yaxiskey];
      dataForChart[i] = { ...dataForChart[i], end: cumulative };
      dataForChart[i] = { ...dataForChart[i], [args.xaxiskey]: args.data[i][args.xaxiskey] };
      dataForChart[i] = { ...dataForChart[i], [args.yaxiskey]: args.data[i][args.yaxiskey] };
      dataForChart[i] = { ...dataForChart[i], class: (args.data[i][args.yaxiskey] >= 0) ? 'positive' : 'negative' }
    }
    dataForChart.push({
      [args.xaxiskey]: 'Total',
      [args.yaxiskey]: cumulative,
      end: cumulative,
      start: 0,
      class: cumulative >= 0 ? 'positive' : 'negative'
    });

    // console.log(dataForChart)

    yScaleLimits = (args.isEmpty === undefined && args.data.length > 0) ? getMinMaxRange(chartMainData, args.yaxiskey, 'bar') : { lowerLimit: 0, upperLimit: 10 };
    if (args.chartFormat.yaxis.min !== '' && args.chartFormat.yaxis.min !== 0) { yScaleLimits['lowerLimit'] = args.chartFormat.yaxis.min; }
    if (args.chartFormat.yaxis.max !== '' && args.chartFormat.yaxis.max !== 0) { yScaleLimits['upperLimit'] = args.chartFormat.yaxis.max; }
  }

  xDomains.push('Total');
  xAxisTickValues = getXAxisTickValues(initialConfig, xDomains, chartMainData, args);

  /* Define and create xScale, xAxis, ticks */
  let xScale;
  let xAxis;
  async function defineXScale() {
    //Set the scales
    xScale = d3.scaleBand()
      .domain(xDomains)
      .range([xStartPoint, xEndPoint])
      .paddingInner(.25)
      .paddingOuter(.25)
      .align(0.5);
    // .round(true);

    //Define the ticks
    xAxis = d3.axisBottom(xScale)
      .tickValues(xAxisTickValues)
      .tickSize(0)
      .tickPadding(5)
      .tickFormat((d) => ((args.xaxiskey === 'date' && d !== 'Total') ? parsedDateString(d) : (typeof d === 'string') ? d.substring(0, 10) : d));

    //Draw x-axis
    chart.append("g")
      .attr("class", "axis x-axis")
      .attr("transform", "translate(0, " + xAxisBottomPos + ")") //start with 10px instead of 0
      .call(xAxis)
      .attr('font-size', tickFontSize + 'px');
  }
  defineXScale().then(() => {
    //Change x axis first and last tick position
    alignXAxisTicks(width, args.unique_key, initialConfig, xAxisTickValues, xDomains, parseDate, tickFontSize, xAxisTickStartPos);
  });

  /* Define and create yScale, yAxis, ticks */
  let y_steps = args.yAxisTicksCount !== undefined ? args.yAxisTicksCount : initialConfig.defaultYAxisTicksCount;
  if (args.chartFormat.yaxis.tick !== '' && args.chartFormat.yaxis.tick > 0) {
    y_steps = Math.floor(max / args.chartFormat.yaxis.tick) + 1;
  }

  let hasCustomFormat = (args.chartFormat.yaxis.tick || args.chartFormat.yaxis.min || args.chartFormat.yaxis.max) ? true : false;
  let customTickInterval = hasCustomFormat ? args.chartFormat.yaxis.tick : null;
  let yDomains = (y_steps > 1) ? getTickValues(min, max, y_steps, hasCustomFormat, customTickInterval) : [];
  let yTickValues = (initialConfig.showYAxisTicks) ? [...yDomains] : [];
  let yScale;
  let yAxis;

  async function defineYScale() {
    //Define y scale
    yScale = d3.scaleLinear()
      // .domain([yScaleLimits['lowerLimit'], yScaleLimits['upperLimit']])
      .domain([min, max])
      .range([yStartPoint, yEndPoint]);

    //Define y axis ticks
    yAxis = d3.axisLeft(yScale)
      .tickValues(yTickValues)
      .tickSize(0)
      .tickFormat((d) => formatNumber(formatYNumber(d)))
      .tickPadding(3);

    //Draw y axis
    chart.append("g")
      .attr("class", "axis y-axis")
      .attr("transform", "translate(" + initialConfig.chartLeftPadding + ",0)")
      .call(yAxis)
      .attr('font-size', tickFontSize + 'px');
  }
  defineYScale().then(() => {
    //Change x axis first and last tick position
    alignYAxisTicks(innerHeight, args.unique_key, initialConfig, yAxisTickTopPos);
  });

  //if no data available
  if (args.isEmpty) {
    chart.append("text")
      .attr("y", ((height / 2)))
      .attr("x", (width / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text('No data available')
      .style("fill", "#fff")
      .attr("class", "no-data");
  }


  //return from here if data is not available
  if (!args.data || args.data.length === 0) return;

  if (isSegmented) {
    // console.log('here')
    let heightArray = [];
    for (let i = 0; i < dataForChart.length; i += 1) {
      heightArray = [];
      let previousPoint = dataForChart[i].start;
      let point = dataForChart[i].start;
      if (i === dataForChart.length-1) {
        chart.append("rect")
            .attr("transform", `translate(${xScale(dataForChart[i].key)}, ${yScale(dataForChart[i-1].end)})`)
            .attr("height", Math.abs(yScale(0) - yScale(dataForChart[i-1].end)))
            .attr("width", xScale.bandwidth())
            .style("fill", dataForChart[i-1].end >= 0 ? defaultColor : "red" )

        continue;
      }
      if (dataForChart[i].totalNegative !== 0){
        // chart.append("rect")
        //   .attr("transform", (d, j) => `translate(${xScale(dataForChart[i].key)}, ${yScale(Math.max((point + dataForChart[i].totalNegative), point))})`)
        //   .attr("height", (d, j) => Math.abs(yScale(point) - yScale((point + dataForChart[i].totalNegative))))
        //   .attr("width", (dataForChart[i].totalPositive !== 0 ? (xScale.bandwidth())/2 : xScale.bandwidth()))
        //   .style("fill", "red")
        //   .style("fill-opacity", "50%")

        chart.selectAll("bar")
          .data(dataForChart[i].negativeValues)
          .enter()
          .append("rect")
            .attr("class", `negative-rect-${i}`)
            .attr("transform", (d) => {
              previousPoint = point;
              point += d[args.yaxiskey];
              heightArray.push(Math.abs(yScale(previousPoint) - yScale(point)));
              return `translate(${xScale(d[args.xaxiskey])}, ${yScale(Math.max(previousPoint, point))})`;
            })
            .attr("height", (j) => heightArray[j])
            .attr("width", (dataForChart[i].totalPositive !== 0 ? (xScale.bandwidth())/2 : xScale.bandwidth()))
            .style("fill", (d) => {
              // let colorValue = hashToRgb(color(d[chartSegmentation]));
              return color(d[chartSegmentation])
            })
        heightArray = []
      }

      if (dataForChart[i].totalPositive !== 0){
        // chart.append("rect")
        //   .attr("transform", (d, j) => `translate(${xScale(dataForChart[i].key) + (dataForChart[i].totalNegative !== 0 ? (xScale.bandwidth())/2 : 0)}, ${yScale(Math.max((point + dataForChart[i].totalPositive), point))})`)
        //   .attr("height", (d, j) => Math.abs(yScale(point) - yScale((point + dataForChart[i].totalPositive))))
        //   .attr("width", (dataForChart[i].totalNegative !== 0 ? (xScale.bandwidth())/2 : xScale.bandwidth()))
        //   .style("fill", "green")
        //   .style("fill-opacity", "50%")
        
        chart.selectAll("bar")
          .data(dataForChart[i].positiveValues)
          .enter()
          .append("rect")
            .attr("transform", (d) => {
              previousPoint = point;
              point += d[args.yaxiskey];
              heightArray.push(Math.abs(yScale(previousPoint) - yScale(point)));
              return `translate(${xScale(d[args.xaxiskey]) + (dataForChart[i].totalNegative !== 0 ? (xScale.bandwidth())/2 : 0)}, ${yScale(Math.max(previousPoint, point))})`;
            })
            .attr("height", (j) => {
              return heightArray[j];
            })
            .attr("width", (dataForChart[i].totalNegative !== 0 ? (xScale.bandwidth())/2 : xScale.bandwidth()))
            .style("fill", (d) => color(d[chartSegmentation]))
        heightArray = []
      }
    }
  } else {
    svg.selectAll("bar")
      .data(dataForChart)
      .enter()
      .append("rect")
      .attr("transform", (d) => {
        return `translate(${xScale(d[args.xaxiskey])}, ${yScale(Math.max(d.start, d.end))})`
      })
      .attr("height", (d) => Math.abs(yScale(d.start) - yScale(d.end)))
      .attr("width", xScale.bandwidth())
      .style("fill", (d) => d.class === 'negative' ? 'red' : defaultColor)
      .on('mousemove', (d) => handleChartMouseMove(d))
      .on('mouseout', handleChartMouseOut)
      .on('click', handleChartLock);
  }

  //x-axis tick slider elements
  let xAxisSliderGroup;
  let xHoverRect;
  let xHoverRectText;
  let xTickSliderWidth = isFitToWidthMode ? Math.round(60 * window.innerWidth / args.screen) : 60;
  let xTickSliderHeight = initialConfig.xTickSliderHeight;
  let xTickSliderTextPosLeft = isFitToWidthMode ? Math.round(3 * window.innerWidth / args.screen) : 3;
  let xTickSliderTextPosTop = isFitToWidthMode ? Math.round(4 * window.innerWidth / args.screen) : 4;
  let xAxisSliderRectWidthPadding = isFitToWidthMode ? Math.round(8 * window.innerWidth / args.screen) : 8;
  if (initialConfig.showXAxisTicks) {
    xAxisSliderGroup = chart.append("g").attr("class", "xaxis-slider-group").style("display", "none");
    xHoverRect = xAxisSliderGroup.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", xTickSliderWidth)
      .attr("height", xTickSliderHeight)
      .attr("rx", 1)
      .attr("class", 'hover-xaxis-bg')
      .style("display", "none");
    xHoverRectText = xAxisSliderGroup.append("text")
      .attr('font-size', tickSliderFontSize + 'px')
      .text('')
      .attr('x', xTickSliderTextPosLeft)
      .attr('y', xTickSliderTextPosTop)
      .attr("fill", "#fff")
      .attr("class", "hover-xaxis-tick-val")
      .style("display", "none");
  }

  //y-axis hover elements
  let yAxisSliderGroup;
  // let yHoverRect;
  // let yHoverRectText;
  let yTickSliderHeight = args.screen ? initialConfig.tickHoverBoxHeight * window.innerWidth / args.screen : initialConfig.tickHoverBoxHeight;
  let yTickSliderWidth = isFitToWidthMode ? Math.round(30 * window.innerWidth / args.screen) : 30;
  let yTickSliderRectPosLeft = isFitToWidthMode ? Math.round(5 * window.innerWidth / args.screen) : 5;
  // let yTickSliderTextPosTop = isFitToWidthMode ? Math.round(5 * window.innerWidth / args.screen) : 5;
  if (initialConfig.showYAxisTicks) {
    yAxisSliderGroup = chart.append("g").attr("class", "yaxis-slider-group").style("display", "none");
    yAxisSliderGroup.append("rect")
      .attr("x", yTickSliderRectPosLeft)
      .attr("y", 0)
      .attr("width", yTickSliderWidth)
      .attr("height", yTickSliderHeight + 3)
      .attr("rx", 1)
      .attr("class", 'hover-yaxis-bg')
      .style("display", "none");
    yAxisSliderGroup.append("text")
      .attr('font-size', tickSliderFontSize + 'px')
      .text('')
      .attr('x', 0)
      .attr('y', 0)
      .attr("fill", "#fff")
      .attr("class", "hover-yaxis-tick-val")
      .style("display", "none");
  }
  
  //Tooltip 
  let tooltip_text = '';
  let tooltip_text_width = 0;
  let tooltip_top = 0;
  // let tooltip_pos_adjustment = 0;
  let tooltip_left = 0;

  let tooltip = svg.append("g")
    .attr("class", "tooltip1")
    .attr("transform", "translate(0, 0)");
  let tooltipRect = tooltip.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 0)
    .attr("height", (toolTipFontSize + 2))
    // .attr('fill', '#2e323c')
    .attr('fill', '#dedede')
    .attr("rx", 2)
    .attr("class", 'tooltip-rect');
  let tooltipRectText = tooltip.append("text")
    .attr('font-size', toolTipFontSize + 'px')
    .text('')
    .attr('x', 0)
    .attr('y', 0)
    .attr("fill", "#000")
    .attr("class", "tooltip-text");

  //call on initial load - to show aggregated segmented values
  // handleChartMouseOut();

  //Remove tooltip on mouse out
  function handleChartMouseOut() {
    if (chartHoverLocked) return false; //if locked no hover allowed
    if (tooltip) tooltip.style('display', 'none');
    if (xAxisSliderGroup) xAxisSliderGroup.style("display", "none");
    if (yAxisSliderGroup) yAxisSliderGroup.style("display", "none");

    // show aggregated table when not hovering the chart
    // showAggregatedSegmentsDetails(args, initialConfig, color);
  }

  function handleChartLock() {
    if(window.currentSelectedWidget===undefined || !window.currentSelectedWidget || window.currentSelectedWidget!==args.unique_key){
      window.currentSelectedWidget = args.unique_key;
      return;
    }

    if (chartHoverLocked) {
      chartHoverLocked = false;
      tooltip.style("display", null);
    } else {
      chartHoverLocked = true;
    }
  }

  // var dataValues = null;
  // xScale.invert = function (x) {
  //   return d3.scaleQuantize().domain(this.range()).range(this.domain())(x);
  // };
  // yScale.invert = function (y) {
  //   return d3.scaleLinear().domain(this.range()).range(this.domain())(y);
  // };

  function handleChartMouseMove(d) {
    if (chartHoverLocked) {
      return
    }
    const [x, y] = d3.mouse(args.chartWrapper.current);

    //Generate tooltip details
    // var chartXPos = 0;
    var xAxisVal;
    if (args.xaxiskey === 'date') {
      if (d[args.xaxiskey] === 'Total') {
        xAxisVal = d[args.xaxiskey];
      } else {
        var date = new Date(d[args.xaxiskey]);
        xAxisVal = parsedDateString(date);
      }
    } else {
      xAxisVal = d[args.xaxiskey];
    }

    // Show Tooltip
    var block_tooltip_text = '';
    var tooltip_width = 0;
    // if (isSegmented) {
    //   // console.log('here', dataNest)
    //   //Sort segmentated values
    //   dataNestForHoverSegmentation = sortSegmentedData(args, dataNestForHoverSegmentation, d.data[args.xaxiskey]);

    //   //Display Cross Hair Values
    //   // console.log(parsedDateString(dataNest[0].values[0][args.xaxiskey]) === parsedDateString(d[args.xaxiskey]));
    //   var dataValuesIndex = dataNestForHoverSegmentation.findIndex((e) => args.xaxiskey === 'date' ? parsedDateString(e.values[0][args.xaxiskey]) === parsedDateString(d.data[args.xaxiskey]) : e.values[0][args.xaxiskey] === d.data[args.xaxiskey]);

    //   if (dataValuesIndex > -1) {
    //     dataValues = dataNestForHoverSegmentation[dataValuesIndex]['values'];

    //     //show legend information in table format
    //     showHoverSegmentDetails(args, initialConfig, dataValues, d.data, xAxisVal, d.data[args.xaxiskey], color, 'bubble');
    //   }
    // }

    if (args.pointSelectionModeOn) {
      block_tooltip_text = 'Click to Select';
    } else {
      // let text;
      // if (args.xaxiskey === 'date') {
      //   var date = new Date(d[args.xaxiskey]);
      //   text = parsedDateString(date);
      // } else {
      //   text = d[args.xaxiskey];
      // }
      block_tooltip_text = (isSegmented ? `${d[chartSegmentation]}(${xAxisVal})` : xAxisVal) + ': ' + args.chartCurrencySymbol + numberWithCommas(d[args.yaxiskey]) + args.chartPercentSymbol; //details;
    }
    tooltip_text = block_tooltip_text;
    calculateTooltipPositionAndWidth(tooltip_text);

    function calculateTooltipPositionAndWidth(text) {
      tooltip_text_width = calculateTextWidth(text, toolTipFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica');
      tooltip_width = tooltip_text_width + 4;
      // tooltip_pos_adjustment = initialConfig.tooltipHeight + (initialConfig.inbetweenChartAndXAxisPadding < 5 ? 5 : initialConfig.inbetweenChartAndXAxisPadding);
      tooltip_top = y; //(y(totalVal ? totalVal : d[args.yaxiskey]) - tooltip_pos_adjustment); //if totalVal is set use that position else use individual bar/bar_block position

      var base_left = x; //(xValOnMouseMove);
      // chartXPos = (base_left + tooltip_width);
      var base_right = innerWidth - base_left;

      if (base_left > base_right && tooltip_width < base_left) {
        tooltip_left = base_left - tooltip_width - 10;
      } else if (base_right >= base_left && tooltip_width < base_right) {
        tooltip_left = base_left + 10;
      } else {
        tooltip_left = base_left - (tooltip_width / 2);
        tooltip_top = tooltip_top + 20;
      }
    }

    if (!initialConfig.showXAxisTicks) {
      tooltip_left = 0;
      tooltip_top = xAxisBottomPos;
    }

    let textLinesCount = 1;
    tooltip.style("display", "block").attr("transform", "translate(" + (tooltip_left) + "," + (tooltip_top) + ")");
    tooltipRectText
      .text(tooltip_text)
      .attr("dy", "1em")
      .attr('x', 2)
      .attr('fill', initialConfig.showXAxisTicks ? '#000' : '#fff')
      .style('display', 'block');
    textLinesCount = tooltipRectText.selectAll('tspan').size();
    textLinesCount = (textLinesCount === undefined || textLinesCount === 0) ? 1 : textLinesCount;
    tooltipRect
      .attr('width', tooltip_width)
      .attr('height', textLinesCount * (toolTipFontSize + 2) + textLinesCount) //increase height of rectangle as per text
      .attr('x', 0)
      .attr('y', 0)
      .style('display', initialConfig.showXAxisTicks ? 'block' : 'none');


      //display tick sliders
    //x-axis
    if (xAxisSliderGroup) {
      let max_xslider_width = innerWidth; //innerWidth
      let xaxis_text = xAxisVal;//args.xaxiskey === 'date' ? parsedDateString(d[args.xaxiskey]) : d[args.xaxiskey];
      let xaxis_box_width = Math.round(calculateTextWidth(xaxis_text, tickSliderFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica') + xAxisSliderRectWidthPadding);
      xaxis_box_width = xaxis_box_width <= max_xslider_width ? xaxis_box_width : max_xslider_width;

      // let xAxisLeftPadding = (icon_width + 2); //icon padding
      let xAxisLeftPadding = barPadding;
      let xTickValPosOrg = x;//xScale(d[args.xaxiskey]);
      let xTickValPos = xTickValPosOrg;
      let xTickValAvailableWidth = (width - initialConfig.chartRightPadding) - xTickValPos - (barPadding / 2 / 2);

      if (barWidth < xaxis_box_width / 2) {
        // console.log('here1')
        xTickValPos = xTickValPos - (xaxis_box_width / 2) + (barWidth / 2);
      } else {
        // console.log('here2')
        xTickValPos = xTickValPos - (barPadding / 2 / 2) + (barWidth / 2) - (xaxis_box_width / 2);
      }

      // adjust starting bars x slider left position
      let lockIconXPos = 0;
      let leftMouseXScrollPos = (x - initialConfig.chartLeftPadding - (initialConfig.inbetweenChartAndYAxisPadding + 1));
      xTickValPos = xTickValPosOrg - (barPadding / 2 + 1) - xaxis_box_width / 2 + xAxisLeftPadding / 2; //default
      if (leftMouseXScrollPos <= xaxis_box_width / 2) { // left position
        let leftAvailableWidth = xTickValPosOrg - initialConfig.chartLeftPadding - initialConfig.inbetweenChartAndYAxisPadding;
        xTickValPos = xTickValPosOrg - leftAvailableWidth;
        xAxisLeftPadding = 0;
        lockIconXPos = xaxis_box_width + 2;
      }

      // adjust end bars x slider right position
      if (xTickValAvailableWidth <= xaxis_box_width / 2) { // adjust end bars x slider right position
        xTickValPos = (width - initialConfig.chartRightPadding - (xaxis_box_width + xAxisLeftPadding - 1));
      }

      //x-axis slider tick elements
      if (xTickValPos > ((innerWidth + (initialConfig.chartLeftPadding - initialConfig.chartRightPadding)) - xaxis_box_width / 2 + 5)) {
        xTickValPos = (innerWidth - xaxis_box_width / 2 + 5);
      } else if (xTickValPos < (initialConfig.chartLeftPadding + 5)) {
        xTickValPos = initialConfig.chartLeftPadding + 5;
      }

      xAxisSliderGroup.attr("transform", "translate(" + parseInt(xTickValPos) + "," + parseInt(xAxisBottomPos - xAxisSliderRectWidthPadding) + ")")
        .style("display", "block"); // bgBottomPadding is extra bg rect padding
      xAxisSliderGroup.select(".hover-line-status").attr("x", lockIconXPos).attr("y", initialConfig.tickSliderPadding); //lock icon position
      let xAxisSliderTextTopPos = isFitToWidthMode ? parseInt(10 * currentCanvasSize / args.screen) : 10;
      let xAxisSliderTextLeftPos = (xAxisLeftPadding + (isFitToWidthMode ? parseInt(5 * currentCanvasSize / args.screen) : 5));

      async function renderXSliderText() {
        xHoverRectText
          .text(xaxis_text)
          .attr("dy", "1em")
          .attr('x', xAxisSliderTextLeftPos)
          .attr('y', xAxisSliderTextTopPos)
          .style('text-align', 'center')
          .call(trimFromAnyCharacter, xaxis_box_width)
          .style('display', 'block');
      }
      renderXSliderText().then(() => {
        xHoverRect
          .attr('width', xaxis_box_width)
          .attr('height', xTickSliderHeight)
          .attr('x', xAxisLeftPadding)
          .attr('y', 4)
          .style('text-align', 'center')
          .style('display', 'block');
      });
    }
    // y-axis horizoantal line
    // if (yAxisSliderGroup) {
    //   let yval_digits_count = getDigitsCount(y0);
    //   let round_var = yval_digits_count - 2;
    //   let rounded_val = Math.round(y0 * Math.pow(10, round_var) / Math.pow(10, round_var));
    //   let yaxis_text = formatNumber(rounded_val);

    //   let yaxis_box_width = calculateTextWidth(yaxis_text, tickSliderFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica') + 4 + 10;
    //   let yaxis_box_left_pos = 3; //3 is gapping of 3px

    //   let ySliderPos = (y - 2);
    //   if (ySliderPos < 6) {
    //     ySliderPos = 6;
    //   } else if (ySliderPos > (innerHeight - 7)) {
    //     ySliderPos = innerHeight - 7;
    //   }

    //   yAxisSliderGroup.attr("transform", "translate(" + parseInt(yaxis_box_left_pos) + "," + parseInt(ySliderPos) + ")").style("display", "block"); // bgBottomPadding is extra bg rect padding
    //   yHoverRect
    //     .attr('width', (initialConfig.chartLeftPadding + 5))
    //     .attr('x', 0)
    //     .attr('y', -(initialConfig.tickHoverBoxHeight / 2))
    //     .style('display', 'block');
    //   yHoverRectText.text(yaxis_text)
    //     .attr('x', (initialConfig.chartLeftPadding - yaxis_box_width + 5))
    //     .attr('y', yTickSliderTextPosTop)
    //     .style('display', 'block');
    // }

    // y-axis horizoantal line
    // let yaxis_text = d[args.yaxiskey];
    // let yaxis_box_width = calculateTextWidth(yaxis_text, tickFontSize + 'px Poppins, "Open Sans", sans-serif, helvetica');
    // let yaxis_box_left_pos = 3; //3 is gapping of 3px

    // let ySliderPos = (y - 2);
    // if (ySliderPos < 6) {
    //   ySliderPos = 6;
    // } else if (ySliderPos > (innerHeight - 7)) {
    //   ySliderPos = innerHeight - 7;
    // }

    // if (yAxisSliderGroup !== undefined) {
    //   yAxisSliderGroup
    //     .attr("transform", "translate(" + yaxis_box_left_pos + "," + ySliderPos + ")")
    //     .style("display", "block"); // bgBottomPadding is extra bg rect padding
    //   yHoverRect
    //     .attr('width', (yaxis_box_width + 5))
    //     .attr('height', xTickSliderHeight)
    //     .attr('x', (initialConfig.chartLeftPadding - yaxis_box_width))
    //     .attr('y', -(initialConfig.tickHoverBoxHeight / 2))
    //     .style('display', 'block');
    //   yHoverRectText.text(yaxis_text)
    //     .attr('x', (initialConfig.chartLeftPadding - yaxis_box_width))
    //     .attr('y', yTickSliderTextPosTop)
    //     .style('display', 'block');
    // }
  }
}

//Draw Table 
function drawTable(args) {
  if (d3.select('#chart-' + args.unique_key).size() <= 0 || !args.chartWrapper) return;
  d3.select('#chart-' + args.unique_key).classed('table-wrapper', true);

  //chart initial settings variables
  const initialConfig = getInitialChartConfig(args);
  if (!initialConfig) return;

  var chartHeadingSectionHeight = initialConfig.chartHeadingSectionHeight;
  // var chartBottomPadding = 5;
  // var width = args.chartWrapper.current.offsetWidth;
  var chartWrapperHeight = d3.select('#chart-' + args.unique_key).node().getBoundingClientRect().height;
  var height = chartWrapperHeight - initialConfig.chartWidgetBottomPadding - chartHeadingSectionHeight; // 20 is reduced because sub header is not there in table
  if (args.excludeChartHeader !== undefined) { // if chart width is less than default add removed chart header+margin heightto chart height
    height = height + initialConfig.chartInnerHeadingSectionHeightWithMargin;
  }

  var parsedDateString = d3.timeFormat("%d %b %Y");

  //set chart height
  d3.select(args.chartWrapper.current).style("height", height + 'px');

  //show/hide sticky bottom border to give a frame to table
  d3.select(args.chartWrapper.current).classed('sticky-bottom-border', (args.data.length > 6 ? true : false));

  let tableWrapper = '';
  if (args && args.data !== undefined && args.data.length > 0) {
    let tempHeaders = Object.keys(args.data[0]);
    let headers = [];

    // check and display dimensions first and values in last
    let dimensions = args.xaxiskey.split(',');
    let values = args.yaxiskey.split(',');
    let allHeaders = [...dimensions, ...values];
    allHeaders.forEach((d) => {
      if (tempHeaders.includes(d)) {
        headers.push(d);
      }
    });

    let isInViewModeFitToWidth = (args.screen && !args.isDashboardInEditMode && (args.viewModeType !== undefined && args.viewModeType.name === 'Fit to Width'));
    let fontSize = isInViewModeFitToWidth ? Math.floor(11 * window.innerWidth / args.screen) : 11;
    let headerPaddingTop = isInViewModeFitToWidth ? Math.floor(10 * window.innerWidth / args.screen) : 10;
    let headerPaddingLeft = isInViewModeFitToWidth ? Math.floor(5 * window.innerWidth / args.screen) : 5;
    let tdPadding = isInViewModeFitToWidth ? Math.floor(5 * window.innerWidth / args.screen) : 5;

    tableWrapper = '<table class="asc-new-table" style="min-width: 450px; font-size: ' + fontSize + 'px">';
    tableWrapper += '<tr>';
    headers.forEach((header) => {
      tableWrapper += '<th style="padding: ' + headerPaddingTop + 'px ' + headerPaddingLeft + 'px;">';
      if (isAbbrevationName(header)) {
        tableWrapper += '<span class="allcaps">' + header.replaceAll('_', ' ') + '</span>';
      } else {
        tableWrapper += header.replaceAll('_', ' ');
      }
      tableWrapper += '</th>';
    });
    tableWrapper += '<tr>';

    //table body
    if (args.data.length > 0) {
      args.data.forEach((item) => {
        if (Object.keys(item).length > 0) {
          tableWrapper += '<tr>';
          headers.forEach((header) => {
            let col_val = (header === 'date') ? parsedDateString(item[header]) : item[header];
            let value_class = (values.includes(header) ? ' value' : '');
            tableWrapper += '<td style="padding: ' + tdPadding + 'px" class="' + (value_class) + '">' + col_val + '</td>';
          });
          tableWrapper += '<tr>';
        }
      });
    }

    tableWrapper += '</table>';
  } else {
    tableWrapper += 'No data available';
  }

  d3.select(args.chartWrapper.current).html(tableWrapper);
}


//get number digits count
function getDigitsCount(n) {
  var count = 0;
  if (n >= 1) ++count;
  while (n / 10 >= 1) {
    n /= 10;
    ++count;
  }
  return count;
}


//Get Ticks Values - params: min val, max val, increment step
function getStringTickValues(domains, min, max, steps = 4) {
  if (min === undefined || max === 0) return [];

  // let tickStep = Math.floor((max - min) / (steps-1));
  let tickStep = Math.round(domains.length / steps);
  let ranges = [];
  let newRanges = [];
  let maxRange = domains.length;

  if (tickStep > 0) {
    for (let i = 0; i < maxRange; i += tickStep) { //0, 3, 6, 9
      // let num = (min + (i * tickStep));
      // num = parseInt(min + (i * tickStep));
      // ranges.push(+num);
      ranges.push(i);
    }
  }
  if (tickStep == 0 && domains.length > 0) {
    domains.forEach((item, i) => {
      ranges.push(i);
    });
  }

  ranges.forEach((item) => {
    newRanges.push(domains[item]);
  });
  return newRanges;
}


//Get Numeric Ticks Values - params: min val, max val, increment step
function getTickValues(min, max, steps = 4, custom_format = false, customTickInterval = null) {
  if (min === undefined || max === 0) return [];
  let tickStep = customTickInterval ? customTickInterval : (max - min) / (steps - 1);
  let ranges = [];
  let newRanges = [];

  for (let i = 0; i < steps; i++) {
    let num = (min + (i * tickStep));
    if (num % 1 == 0) {
      num = parseInt(min + (i * tickStep));
    } else {
      num = parseFloat(min + (i * tickStep)).toFixed(2);
    }
    ranges.push(+num);
  }


  if (!custom_format) {
    //Implement rounding
    let maxVal = d3.max(ranges, function (d) { return Number(d); });
    let minVal = d3.min(ranges, function (d) { return Number(d); });

    //If type of chart is bar chart, force minVal = 0 
    let rangeVal = maxVal - minVal;
    let digits_count_before_decimal = getDigitsCount(maxVal);
    let round_var = (digits_count_before_decimal - 2);
    let roundMinVal = Math.round(minVal / Math.pow(10, round_var)) * Math.pow(10, round_var)
    for (let i = 0; i < steps; i++) {
      let tick_value = roundMinVal + i * Math.ceil(rangeVal / ((steps - 1) * Math.pow(10, round_var))) * Math.pow(10, round_var);
      newRanges.push(tick_value);
    }
  } else {
    newRanges = [...ranges];
  }
  return newRanges;
}


//get number round
// function getNumberRound(num, max_yval) {
//   let digits_count_before_decimal = getDigitsCount(max_yval);
//   let round_var = digits_count_before_decimal - 2;
//   let tick_value = Math.round(num);
//   return parseFloat(tick_value).toFixed(round_var);
// }

//get text width
// function calculateTextWidth(text, font) {
//   let canvas = calculateTextWidth.canvas || (calculateTextWidth.canvas = document.createElement("canvas"));
//   let context = canvas.getContext("2d");
//   context.font = font;
//   let metrics = context.measureText(text);
//   return Math.ceil(metrics.width);
// }

export const calculateTextWidth = (text, font) => {
  let canvas = calculateTextWidth.canvas || (calculateTextWidth.canvas = document.createElement("canvas"));
  let context = canvas.getContext("2d");
  context.font = font;
  let metrics = context.measureText(text);
  return Math.ceil(metrics.width);
};


//t = current time
//b = start value
//c = change in value
//d = duration
Math.easeInOutQuad = function (t, b, c, d) {
  t /= d / 2;
  if (t < 1) return c / 2 * t * t + b;
  t--;
  return -c / 2 * (t * (t - 2) - 1) + b;
};



//find chart overlapping
export const findChartOverlapping = (currentChartLayout, tempChartsGridLayout) => {
  let chartsBehindCurrent = [];
  if (currentChartLayout !== undefined) {
    let CX1 = currentChartLayout.x;
    let CY1 = currentChartLayout.y;
    let CX2 = currentChartLayout.x + currentChartLayout.w;
    let CY2 = currentChartLayout.y + currentChartLayout.h;

    tempChartsGridLayout.forEach((layout) => {
      if (layout.id === currentChartLayout.id) return;
      let X1 = layout.x;
      let Y1 = layout.y;
      let X2 = layout.x + layout.w;
      let Y2 = layout.y + layout.h;

      // if touching any one of four edges it will consider it overlapped
      // if( (
      //     (CX1 >= X1 && CX1 <= X2 && CY1 >= Y1 && CY1 <= Y2) ||
      //     (CX2 >= X1 && CX2 <= X2 && CY1 >= Y1 && CY1 <= Y2) ||
      //     (CX1 >= X1 && CX1 <= X2 && CY2 >= Y1 && CY2 <= Y2) ||
      //     (CX2 >= X1 && CX2 <= X2 && CY2 >= Y1 && CY2 <= Y2)
      //   ) && (layout.zindex < currentChartLayout.zindex)
      //   ){
      //   chartsBehindCurrent.push(layout);
      // }

      //consider 80% coverage as overlapped
      let x_overlap = Math.max(0, Math.min(CX2, X2) - Math.max(CX1, X1));
      let y_overlap = Math.max(0, Math.min(CY2, Y2) - Math.max(CY1, Y1));
      let SI = x_overlap * y_overlap;

      // let SU = (currentChartLayout.w*currentChartLayout.h) + (layout.w*layout.h) - SI; 
      let SU = (layout.w * layout.h);
      let overlappingPercentage = (SI / SU);

      // console.log(currentChartLayout.id+' chart vs '+ layout.id+' chart', x_overlap +'----'+(overlappingPercentage)+'--'+SI);
      if (overlappingPercentage > .8 && (layout.zindex < currentChartLayout.zindex)) {
        chartsBehindCurrent.push(layout);
      }
    });
  }

  return chartsBehindCurrent;
}
