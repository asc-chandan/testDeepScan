import React, { Component } from 'react';
import { CELL_MIN_WIDTH } from '../../utils/Common';
import Loader2 from '../Loader2';
const CELL_STYLES_ROW_NUMBER_COL = { minWidth: '25px', maxWidth: '25px' };

class ReactDivTable extends Component {
  constructor(props) {
    super(props);
    // Initially, column width is not available, hence assign the width of columns at client side
    // Column of each width can never be smaller than CELL_MIN_WIDTH at any point of time
    let colWidthList;
    let num_col_width = 25;

    if (this.props.columns_width && this.props.columns_width.length !== 0) {
      // This if condition is always false as of now, as in intial render widhts are not available, but written here to support future case
      colWidthList = this.props.columns_width;
      
      // Also, do check that total width should cover the width of screen, otherwise, just replace the all widths with equal value
      const totalWidth = colWidthList.reduce((acc, width) => acc + width, 0);
      if (totalWidth < (window.innerWidth - num_col_width)) {
        const eachColWidth = Math.floor((window.innerWidth - num_col_width) / this.props.columns.length);
        colWidthList = Array(this.props.columns.length).fill(eachColWidth);
      }
      // final check : Make each width atleast equal to CELL_MIN_WIDTH
      colWidthList = colWidthList.map(w => w > CELL_MIN_WIDTH ? w : CELL_MIN_WIDTH);

    } else {
      const w = Math.floor((window.innerWidth - num_col_width) / this.props.columns.length);
      colWidthList = Array(this.props.columns.length).fill(w > CELL_MIN_WIDTH ? w : CELL_MIN_WIDTH)
    }

    this.state = {
      toggleTableRows: {},
      columnsSorting: { col: '', order: '' },
      current_row_index: '', //used to track current click row index for show loading
      columnsWidth: colWidthList,
      tblPaddingLeft: 0,
      lastTwoExpandedRows: [],
      isAllCollapsed: true,
      currentActiveRow: null,

      mouseDown: false,
      startPoint: null,
      endPoint: null,
      selectionBox: null,
      selectedItems: [],
      appendMode: false,
      overlayWidth: 0,
      overlayHeight: 0,
      dragSelectIds: [],
      // columnsSorting: Array(this.props.columns.length).fill('')

      // column resize related state variables below
      resizingColumnIndex: -1,

      // selection points
      isMouseDown: false,
      inMotion: false,
      selectionStartPoints: [],
      selectionEndPoints: [],
      previousSelectedPointFirst: null,
      previousSelectedPointSecond: null,
      currentSelectedPointFirst: null,
      currentSelectedPointSecond: null,
      selectedData: [],
      copiedData: '',
      previousKey: 0,
      previousPoints: {},
      firstColWidth: 0,
      currentAnalysisId: 0,
    };

    this.rowNumber = 0; // used to show the row number in front of each row
    this.pageXOnResizeStart = null;
    this.selectClass = 'selected';
    this.startCell = null;
    this.dragging = false;
    // this.dragSelectIds = [];


    this.handleSortingColumn = this.handleSortingColumn.bind(this);
    this.handleRowToggle = this.handleRowToggle.bind(this);

    this.handleColumnResizeMouseDown = this.handleColumnResizeMouseDown.bind(this);
    this.handleColumnResizeMouseUp = this.handleColumnResizeMouseUp.bind(this);
    this.handleColumnResizeMouseMove = this.handleColumnResizeMouseMove.bind(this);

    this.setTableWidthInDOM = this.setTableWidthInDOM.bind(this);

    this.handleSelection = this.handleSelection.bind(this);
    this.handleShowSelection = this.handleShowSelection.bind(this);
    this.numberToCommaSeperatedString = this.numberToCommaSeperatedString.bind(this);
    this.handleDataToCopy = this.handleDataToCopy.bind(this);

    this.calculateTextWidth = this.calculateTextWidth.bind(this);
    this.setRequiredWidth = this.setRequiredWidth.bind(this);
    this.waitForData = this.waitForData.bind(this);
    this.handleColumnResizeOnLoad = this.handleColumnResizeOnLoad.bind(this);
    this.handleDefaultColumnResize = this.handleDefaultColumnResize.bind(this);
    this.handleRemovePreviousSelection = this.handleRemovePreviousSelection.bind(this);
    this.handleScrollingHeader = this.handleScrollingHeader.bind(this);
    this.handleScrollEventCreation = this.handleScrollEventCreation.bind(this);

    this.tblRef = React.createRef();
    this.tblOverlayRef = React.createRef();
    this.colResizeIndicator = document.querySelector(`#d-${this.props.analysisId} #col-resize-indicator`);
  }

  /**
   * On componentn mount
   */
  componentWillMount() {
    this.selectedChildren = {};
  }

  componentDidMount() {
    // this.adjustTableFrameHeight();
    this.setTableWidthInDOM();

    // register column resize MouseMove and MouseUp events
    document.addEventListener('mousemove', this.handleColumnResizeMouseMove)
    // document.addEventListener('mousemove', throttle(this.handleColumnResizeMouseMove, 150))
    document.addEventListener('mouseup', this.handleColumnResizeMouseUp)

    this.handleColumnResizeOnLoad();
    this.handleScrollEventCreation();
    
  }


  componentDidUpdate(prevProps) {
    let updateStateObj = {};

    if (prevProps.data !== this.props.data) {
      this.handleScrollEventCreation();
      setTimeout(() => this.handleColumnResizeOnLoad(), 1)
      // this.handleColumnResizeOnLoad();
      this.setState({ previousKey: 0 })
      if (this.props.columns_width_update_needed) {
        let colWidthNewList = this.props.columns_width;
        if(colWidthNewList){
          // Also, do check that total width should cover the width of screen, otherwise, just replace the all widths with equal value
          const totalWidth = colWidthNewList.reduce((acc, width) => acc + width, 0);
          if (totalWidth < (window.innerWidth - 48)) {
            const eachColWidth = Math.floor((window.innerWidth - 48) / this.props.columns.length);
            colWidthNewList = Array(this.props.columns.length).fill(eachColWidth);
          }
          // final check : Make each width atleast equal to CELL_MIN_WIDTH
          colWidthNewList = colWidthNewList.map(w => w > CELL_MIN_WIDTH ? w : CELL_MIN_WIDTH);
        }

        // const borRightEle = document.getElementsByClassName('bor-right')[0];
        updateStateObj['columnsWidth'] = colWidthNewList ? colWidthNewList : [];
        this.setTableWidthInDOM();
      }

      // updateStateObj['tblHeight'] = this.adjustTableFrameHeight(true);
    }
    // You don't have to do this check first, but it can help prevent an unneeded render
    if (prevProps.collapseAllRows !== this.props.collapseAllRows && this.props.collapseAllRows === true) {
      updateStateObj['toggleTableRows'] = {};
    }

    if (Object.keys(updateStateObj).length > 0) {
      this.setState(updateStateObj);
    }
  }


  shouldComponentUpdate(nextProps, nextState) {
    if ((nextProps.data !== this.props.data ||
      nextState.toggleTableRows !== this.state.toggleTableRows) ||
      (nextState.overlayWidth !== this.state.overlayWidth) ||
      (nextState.resizingColumnIndex !== this.state.resizingColumnIndex) ||
      (nextState.columnsWidth !== this.state.columnsWidth) ||
      (nextProps.conditionalFormatting !== this.props.conditionalFormatting)
    ) {
      return true;
    } else {
      return false;
    }
  }


  handleScrollEventCreation() {
    let tabs = document.getElementsByClassName(`tbl-row-${this.props.analysisId}`);
    let totalColumns = this.props.columns;
    let requiredColumns = [];
    for (let i = 0; i < totalColumns.length; i += 1) {
      if ((typeof totalColumns[i] === 'string') || totalColumns[i].includes('blank')) {
        break;
      }
      requiredColumns.push(totalColumns[i])
    }

    let firstColumnHeader = tabs[0].childNodes[2].childNodes[1].childNodes;
    // let firstColumnHeaderTopPos = tabs[0].childNodes[2].childNodes[1].childNodes[2].offsetTop;
    // firstColumnHeaderTopPos = firstColumnHeaderTopPos.toString() + 'px';

    if (requiredColumns.length !== 0) {
      for (let j = 0; j < requiredColumns[0].length; j += 1) {
        document.getElementsByClassName(`hover-column-${this.props.analysisId}-${j}`)[0].style.top = firstColumnHeader[j+2].offsetTop;
      }
    }

    let wrapper = document.getElementsByClassName(`analysis-${this.props.analysisId}`)
    wrapper[0].onscroll = (ev) => {this.handleScrollingHeader(ev, requiredColumns, tabs)}    
  }

  handleColumnResizeOnLoad() {
    let tabs = document.getElementsByClassName(`tbl-row-${this.props.analysisId}`);
    let row = tabs[1].childNodes;
    for (let i = 1; i < row.length; i += 1) {
      let text = row[i].textContent;
      if (text.length === 0) {
        break;
      }
      this.handleDefaultColumnResize(i-1, true);
    }
  }

  calculateTextWidth (text, font) {
    let canvas = this.calculateTextWidth.canvas || (this.calculateTextWidth.canvas = document.createElement("canvas"));
    let context = canvas.getContext("2d");
    context.font = font;
    let metrics = context.measureText(text);
    return Math.ceil(metrics.width);
  };

  setRequiredWidth(widthRecieved, colIndex, start, end, isResizeDefault) {
    let tabs = document.getElementsByClassName(`tbl-row-${this.props.analysisId}`);
    let requiredWidth = widthRecieved;
    let widthforText = 0;
    for (let i = start; i < end; i += 1) {
      let rowData = tabs[i].childNodes;
      let colElement = rowData[1].childNodes[rowData[1].childNodes.length-1];
      if (colIndex === 0) {
        colElement = rowData[1].childNodes[rowData[1].childNodes.length-1].childNodes[0];
      }
      if (rowData[1].textContent.length === 0) {
        break;
      }
      widthforText = this.calculateTextWidth(rowData[colIndex + 1].textContent, '11px Poppins, "Open Sans", sans-serif, helvetica');
      let paddingLeftValue = colElement.style.paddingLeft.length > 0 ? colElement.style.paddingLeft.split('p')[0] : 0
      widthforText += parseInt(paddingLeftValue);
      widthforText += 16
      if (widthforText > requiredWidth) {
        requiredWidth = widthforText;
      }
    }
    let allColumnsWidth = this.state.columnsWidth;
    allColumnsWidth[colIndex] = requiredWidth;
    this.setState({ resizingColumnIndex: isResizeDefault ? colIndex : this.state.resizingColumnIndex, columnsWidth: allColumnsWidth, firstColWidth: colIndex === 0 ? requiredWidth : this.state.firstColWidth }, () => {this.setState({ resizingColumnIndex: isResizeDefault ? -1 : this.state.resizingColumnIndex })});
  }

  handleDefaultColumnResize(colIndex, isResizeDefault) {
    let requiredWidth = 0, widthforText = 0;
    let tabs = document.getElementsByClassName(`tbl-row-${this.props.analysisId}`);
    let headerRow = tabs[0].childNodes;
    let headerColContainer = headerRow[colIndex + 1]
    let headerCol = headerColContainer.childNodes[headerColContainer.childNodes.length - 1];
    for (let j = 2; j < headerCol.childNodes.length; j += 1) {
      let header = headerCol.childNodes[j];
      let text = header.textContent;
      widthforText = this.calculateTextWidth(text, '11px Poppins, "Open Sans", sans-serif, helvetica');

      if (j === 2) {
        if (j === headerCol.childNodes.length - 1) {
          widthforText = widthforText + 25;
        }
        requiredWidth = widthforText;
      } else {
        if (j === headerCol.childNodes.length - 1) {
          widthforText = widthforText + 25;
        }
        if (widthforText > requiredWidth) {
          requiredWidth = widthforText;
        }
      }
    }
    requiredWidth += 16;
    this.setRequiredWidth(requiredWidth, colIndex, 1, tabs.length, isResizeDefault);
  }

  /**Coloumn Resizing related methods */
  handleColumnResizeMouseDown(ev, colIndex) {
    // console.log('mouse down', colIndex);
    ev.preventDefault();
    ev.stopPropagation();
    // store the current mouse position and width of column being resized,
    // this info will be used in MouseUp handler
    if (ev.detail === 2) {
      this.handleDefaultColumnResize(colIndex, false)
    }
    this.setState({
      resizingColumnIndex: colIndex,
    });
    this.pageXOnResizeStart = ev.pageX;
    this.colResizeIndicator.style.display = 'block';
    // console.log('table height',this.tblRef.current.clientHeight);
    const analysisWrapperHeight = document.querySelector(`#d-${this.props.analysisId} #analysis-wrapper`).offsetHeight;
    const tableHeight = this.tblRef.current.clientHeight;
    this.colResizeIndicator.style.height = tableHeight < analysisWrapperHeight ? tableHeight + 'px' : analysisWrapperHeight + 'px';
    this.colResizeIndicator.style.left = (ev.pageX - 1) + 'px';
  }

  handleColumnResizeMouseUp(ev) {
    // console.log('mouse up event triggered');
    ev.preventDefault();
    ev.stopPropagation();
    // ignore mouse up event if there is not column to resize
    if (this.state.resizingColumnIndex === -1) { return; }

    const colIndex = this.state.resizingColumnIndex;
    const pageXDiff = ev.pageX - this.pageXOnResizeStart;
    const colsWidthsCurrent = [...this.state.columnsWidth];
    let colUnderResizeWidthNew = colsWidthsCurrent[colIndex] + pageXDiff;
    // Min widht check and then update the col-resize indicator
    colUnderResizeWidthNew = colUnderResizeWidthNew > CELL_MIN_WIDTH ? colUnderResizeWidthNew : CELL_MIN_WIDTH;
    const colsWidthsNew = [...colsWidthsCurrent.slice(0, colIndex), colUnderResizeWidthNew, ...colsWidthsCurrent.slice(colIndex + 1)];

    this.setState({
      columnsWidth: colsWidthsNew
    });
    // reset the info so that MouseMove handler does not run unnecessarily
    this.pageXOnResizeStart = null;
    this.colResizeIndicator.style.display = 'none';
    this.setTableWidthInDOM();
    // reset resizingColumnIndex after a delay(200ms), it is to ignore click event triggering just after MouseUp event
    setTimeout(() => {
      this.setState({
        resizingColumnIndex: -1,
      });
    }, 200);

  }

  handleColumnResizeMouseMove(ev) {
    const colIndex = this.state.resizingColumnIndex;
    // console.log('mouse move',colIndex);
    if (colIndex > -1) {
      const colCurrentWidth = this.state.columnsWidth[colIndex];

      // Indicator should not go beyond(towards left) the minWidth limit of column
      const leftLimitOfIndicator = this.pageXOnResizeStart - (colCurrentWidth - CELL_MIN_WIDTH);
      this.colResizeIndicator.style.left = Math.max(ev.pageX,leftLimitOfIndicator) + 'px';
    }
  }


  setTableWidthInDOM() {
    setTimeout(() => {
      if (this.tblRef && this.tblRef.current) {
        this.tblRef.current.style.width = this.giveTableTotalWidth() + 'px';
      }
    }, 100);
  }

  /**Returns the total width of table being rendered */
  giveTableTotalWidth() {
    return this.state.columnsWidth.reduce((acc, width) => acc + width, 0)
  }


  /* Hanle Sorting Column
   * Pass the column and sort order to props function back to parent component */
  handleSortingColumn(event) {
    if (this.state.resizingColumnIndex > -1) {
      return;
    }
    // console.log('sort click fired');
    var sortOnKey = event.currentTarget.dataset.sort_key;
    var updatedColSorting;

    if (this.state.columnsSorting.col === sortOnKey) {
      var neworder = this.state.columnsSorting.order === 'asc' ? 'desc' : 'asc';
      updatedColSorting = { col: sortOnKey, order: neworder }
    } else {
      updatedColSorting = { col: sortOnKey, order: 'asc' }
    }

    //Update column sorting object - column name and order
    this.setState({ columnsSorting: updatedColSorting });

    //On Sort close all toggle row status - need to be done
    this.collapseExpandedRows();

    //Sort Data based on passed parameters
    this.props.onTableDataSorting(updatedColSorting.col, updatedColSorting.order);
  }

  //Close all expanded rows and change icons
  collapseExpandedRows(excludeIndexes = null) {
    let clonedToggleTableRowsObj = JSON.parse(JSON.stringify(this.state.toggleTableRows));
    let toggleObj = clonedToggleTableRowsObj;
    let toggleObjKeys = Object.keys(toggleObj);

    //Collapse Rows
    toggleObjKeys.forEach((item, i) => {
      if (excludeIndexes && excludeIndexes.includes(item)) {
        // console.log(item+'---'+excludeIndexes.includes(item)); //do nothing
      } else {
        toggleObj[item] = false;
      }
    });

    this.setState({
      toggleTableRows: clonedToggleTableRowsObj
    });
  }

  waitForData(row_index, timeout) {
    let isDataAvailable;
    let checkPoints = row_index.split('_');
    let data = [];
    if (row_index.length === 1) {
      isDataAvailable = this.props.data[row_index].has_sub_level;
      data = this.props.data[row_index].has_sub_level;
    } else {
      data = this.props.data[checkPoints[0]].has_sub_level;
      for (let i = 1; i < checkPoints.length; i += 1) {
        if (i === checkPoints.length - 1) {
          isDataAvailable = data[checkPoints[i]].has_sub_level
        } else {
          data = data[checkPoints[i]].has_sub_level
          isDataAvailable = false
        }
      }
    }
    if (!isDataAvailable) {
      timeout = setTimeout(() => {
        this.waitForData(row_index, timeout)
      }, 200);
    } else {
      if (timeout !== null) { clearTimeout(timeout); }
      let startPoint = parseInt(row_index) + 2;
      let endPoint = parseInt(row_index) + 2 + data.length;
      setTimeout(() => {this.setRequiredWidth(this.state.firstColWidth, 0, startPoint, endPoint, true);}, 100)
    }
  }

  /* Handle Row Toggle 
  * Row Toggle to get sub level data on first click append data under main analysis data clicked index
  * From next click it will show data directly from variable instead of making api request */
  handleRowToggle(event, index) {
    event.stopPropagation();
    // let level_details = event.currentTarget.dataset.level_details; //Pick the clicked row column key
    let level_details = JSON.parse(event.currentTarget.dataset.level_details); //Pick the clicked row column key
    let row_index = event.currentTarget.dataset.row_index; //Pick the clicked row column key
    let rows = row_index.split('_');

    let obj;
    for (let i = 0, len = rows.length; i < len; i++) {
      obj = (obj) ? obj['has_sub_level'][rows[i]] : this.props.data[rows[i]];
      if (i === (len - 1) && !obj['has_sub_level']) {
        this.props.onSubLevelDataFetch(level_details, row_index);
      }
    }


    this.waitForData(row_index, null);

    //Handle Expand and Collapse 
    let clonedToggleTableRowsObj = JSON.parse(JSON.stringify(this.state.toggleTableRows));
    let toggleObj = clonedToggleTableRowsObj;
    for (let i = 0, len = rows.length; i < len; i++) {
      if (i < (len - 1)) { // reach untill the last index
        toggleObj = toggleObj[rows[i]];
      } else {
        // for last index, check :
        // 1. if already exists, then change it to false
        // 2. if not exists, asssign it to {}
        if (toggleObj[rows[i]]) {
          toggleObj[rows[i]] = false;
          setTimeout(() => {this.handleDefaultColumnResize(0, true);}, 200);
        } else {
          toggleObj[rows[i]] = {};
        }
      }
    }

    let objState = {
      current_row_index: row_index,
      show_loading: true,
      toggleTableRows: clonedToggleTableRowsObj
    };

    //Check if all row span are collapsed
    let isAllCollapsed = true;
    for (const item in clonedToggleTableRowsObj) {
      if (clonedToggleTableRowsObj[item] !== false) {
        isAllCollapsed = false;
      }
    }

    objState['isAllCollapsed'] = (isAllCollapsed) ? true : false;

    // after this set the state 
    this.setState(objState);

    //To close all other expanded rows except the last two - new
    if (isNaN(row_index) || clonedToggleTableRowsObj[row_index] === false) return false; //Don't trigger close on sub level heirachy

    setTimeout(() => {
      let updatedLastTwoExpandedRows = JSON.parse(JSON.stringify(this.state.lastTwoExpandedRows));
      updatedLastTwoExpandedRows.push(row_index);

      if (updatedLastTwoExpandedRows.length > 2) {
        updatedLastTwoExpandedRows.shift();

        //Close all except last two indexes
        this.collapseExpandedRows(updatedLastTwoExpandedRows);
        this.props.onSubLevelDataRemove(updatedLastTwoExpandedRows);
      }

      this.setState({
        currentActiveRow: row_index, //To display current clicked row
        lastTwoExpandedRows: updatedLastTwoExpandedRows, //new
      });
    }, 100);
  }

  //Match conditional formatting condition
  isMatchingCondition(col_value, item) {
    if (item.condition.id === 'greater_than') {
      return col_value > parseFloat(item.value1);
    } else if (item.condition.id === 'greater_than_equal_to') {
      return col_value >= parseFloat(item.value1);
    } else if (item.condition.id === 'less_than') {
      return col_value < parseFloat(item.value1);
    } else if (item.condition.id === 'less_than_equal_to') {
      return col_value <= parseFloat(item.value1);
    } else if (item.condition.id === 'equal_to') {
      return col_value === parseFloat(item.value1);
    } else if (item.condition.id === 'not_equal_to') {
      return col_value !== parseFloat(item.value1);
    } else if (item.condition.id === 'between') {
      return ((col_value >= parseFloat(item.value1) && col_value <= parseFloat(item.value2)) || (col_value >= parseFloat(item.value2) && col_value <= parseFloat(item.value1)));
    }
  }


  /* Recursive Table 
  * data - run a loop throught data array 
  * counter - being used to generate level key which is being used to fetch sub level data
  * key - this is also being used for generating level details 
  * row_index - this is being used to genrate row index so that we can track which row is expandaded or collapsed */
  recursiveTable(data, counter, key, row_index, nesting_level) {
    let selectedRows = this.props.selected_rows;
    let selectedColumns = this.props.selected_columns;
    let selectedRowsLen = selectedRows.length;

    return data.map((item, i) => {
      let level_details = [];
      //Generate level key to pick key's value - Used for multi columns selection
      let level_key = "";

      if (selectedColumns.length > 1) {
        // debugger;
        level_key += "(";
        selectedColumns.map((col, j) => {
          level_key += (j > 0) ? ', ' : '';
          level_key += (col !== '' && j === 0) ? "'" + selectedRows[counter] + "'" : "''";
        });
        if (this.props.periodComparisonEnabled) {
          // special check for period comparison as in this case, there are 4 elements in each key
          level_key += ", '', ''";
        }
        level_key += ")";
      } else {
        level_key = selectedRows[counter];
      }

      // level_details = (key) ? key.concat(item[level_key]) : [item[level_key]];
      if (key) {
        level_details = JSON.parse(key);
        level_details.push(item[level_key]);
      } else {
        level_details = [item[level_key]];
      }
      level_details = JSON.stringify(level_details);
      let parsed_level_details = JSON.parse(level_details);
      
      let updated_row_index = (row_index !== null && row_index !== undefined) ? row_index + '_' + i : i.toString();
      let updated_row_index_arr = updated_row_index.split('_');
      let updated_row_index_len = updated_row_index_arr.length;

      // console.log('updated_row_index_arr', updated_row_index_arr);
      // console.log('level_details '+(typeof parsed_level_details), parsed_level_details);

      let obj = this.state.toggleTableRows;
      for (let i = 0, len = updated_row_index_arr.length; i < len; i++) {
        obj = obj[updated_row_index_arr[i]];
      }

      let is_expanded = (obj) ? true : false;

      //Add selected class to top level row
      let in_process = (this.props.sublevel_inprocess && this.state.current_row_index === updated_row_index) ? 'inprocess' : '';
      let current_clicked_class = (this.state.currentActiveRow && this.state.currentActiveRow == updated_row_index) ? 'selected' : '';
      let colsInRow = Object.keys(item);

      if (this.props.periodComparisonEnabled && !this.props.showBenchmarkForPeriodComparison) {
        colsInRow = colsInRow.filter(c => !c.includes('benchmark'));
      }


      // set row number
      this.rowNumber = this.rowNumber + 1;
      let rowNum = this.rowNumber;

      if (item.has_sub_level) {
        return (
          <div key={'row-' + i} id={'nest-'+nesting_level+'-row-item-' + i}
            className={'rows-group ' + (selectedRowsLen > updated_row_index_len ? ' has-subrows' : '') + (is_expanded ? ' expanded' : '') + ' ' + (current_clicked_class)}>
            <div className={`tbl-row tbl-row-${this.props.analysisId}`}>
              <div className="cell row-number" style={CELL_STYLES_ROW_NUMBER_COL}>{this.rowNumber}</div>
              {
                colsInRow.map((col_key, index) => {
                  if (col_key !== 'has_sub_level') {
                    let col = item[col_key]; // col can be either null,String type,Number type or Object type{data: Number, change: Number}
                    let col_val = '', col_val_change = '';

                    if (col === null || col === undefined) {
                      // col_val  and col_val_change should be '', which are already initiliazed
                    } else if (typeof col === 'number') {
                      // set col_val, col_val_change will still be ''
                      col_val = this.props.formatCellValue(col_key, col);
                    } else if (typeof col === 'object') {
                      // This condition only applicable when period comparison is Enabled
                      // set col_val && col_val_change. Don't show(set as '') the change when col_val itself is ''
                      col_val = col.data !== null ? this.props.formatCellValue(col_key, col.data) : '';
                      col_val_change = col.change !== null && col_val !== '' ? col.change : ''; // no need to parse and apply commas in col_change
                      // Dont' show the col_val_change for benchmark column
                      if (col_key.includes('benchmark')) {
                        col_val_change = '';
                      }
                    } else {
                      // type of col can be string here
                      col_val = col;
                    }

                    let col_change_color = (col_val_change !== '' && col_val_change !== 0) ? col_val_change > 0 ? 'green' : 'red' : '';
                    let col_width = (index === 0 ? this.state.columnsWidth[index]+1 : this.state.columnsWidth[index])  + 'px';
                    if(col_width.includes('undefined')){
                      col_width = '140px';
                    }

                    let col_hover_title = (index === 0) ? col_val : '';
                    let canClick = (selectedRowsLen > updated_row_index_len && index === 0) ? true : false;
                    // don't show expand button on empty rows
                    if(parsed_level_details[0]==='' || parsed_level_details[0]===null){
                      canClick = false;
                    }

                    let cell_styles = { minWidth: col_width, maxWidth: col_width };
                    let cell_inner_styles = {};
                    let cell_change_styles = {};

                    // Calculate paddingLeft and left for first column's text and toggle button respectively
                    const paddingLeftText = 18 * (nesting_level > 0 ? 1 : (canClick ? 1 : 0)) + 12 * (canClick ? nesting_level : Math.max(nesting_level - 1, 0));
                    const leftToggleBtn = 8 + 12 * nesting_level;

                    this.props.conditionalFormatting.forEach((format, k) => {
                      if (format && format.cell_value !== undefined && format.cell_value.length > 0) {
                        let hasCondition = format.cell_value.some(e => col_key.includes(e.name.toLowerCase()));
                        let conditional_formatting_col_value = '';
                        if (format.format_type.id === 'period_comparison') {
                          conditional_formatting_col_value = (typeof item[col_key] === 'object' && item[col_key] !== null) ? item[col_key].change : 0;
                        } else if (format.format_type.id === 'standard') {
                          conditional_formatting_col_value = (typeof item[col_key] === 'object' && item[col_key] !== null) ? item[col_key].data : item[col_key];
                        }

                        if (hasCondition && this.isMatchingCondition(conditional_formatting_col_value, format)) {
                          if (format.format_type.id === 'standard') {
                            cell_inner_styles['backgroundColor'] = format.background;
                            cell_inner_styles['color'] = format.color;
                          }
                          if (format.format_type.id === 'period_comparison') {
                            cell_change_styles['backgroundColor'] = format.background;
                            cell_change_styles['color'] = format.color;
                          }
                        }
                      }
                    });

                    return (
                      <div id={'nest-'+nesting_level+'-td-' + i + '-' + index + '-row-' + this.rowNumber} key={'subcell-' + index}
                        className={'cell'}
                        style={cell_styles} data-row_index={updated_row_index} data-level_details={level_details}
                        onClick={(e) => canClick ? this.handleRowToggle(e, i) : false}
                      // onMouseDown={(e) => this.onMouseDown('td-'+i+'-'+index)} onMouseEnter={(e) => this.onMouseEnter('td-'+i+'-'+index)}
                        onMouseDown={() => {
                          let pointsToRemove = this.state.previousPoints;
                          this.setState({
                            isMouseDown: true, inMotion: false, selectionStartPoints: [rowNum, index], selectionEndPoints: [], previousSelectedPointFirst: rowNum, previousSelectedPointSecond: index, currentSelectedPointFirst: rowNum, currentSelectedPointSecond: index }, () => {this.handleRemovePreviousSelection(pointsToRemove)})
                        }}
                        onMouseUp={() => {this.setState({ isMouseDown: false, selectionEndPoints: [rowNum, index] }, () => {this.handleSelection()})}}
                        onMouseOver={() => { this.state.isMouseDown && this.setState({ previousSelectedPointFirst: this.state.currentSelectedPointFirst === null ? rowNum : this.state.currentSelectedPointFirst, previousSelectedPointSecond: this.state.currentSelectedPointSecond === null ? index : this.state.currentSelectedPointSecond, currentSelectedPointFirst: rowNum, currentSelectedPointSecond: index }, () => this.handleShowSelection())}}
                      >
                        { canClick &&
                          // <span className={'btn-toggle'} data-row_index={updated_row_index} data-level_details={level_details} onClick={(e) => this.handleRowToggle(e, i)}></span>
                          <span className={'btn-toggle'} style={index === 0 ? { left: leftToggleBtn } : {}}></span>
                        }
                        {index === 0 ? (<div className="text-container"><span className='cell_text' style={{ ...cell_inner_styles, paddingLeft: index === 0 && paddingLeftText > 0 ? paddingLeftText : '' }} title={col_hover_title} >{col_val}</span></div>) : (<span className='cell_text' style={{ ...cell_inner_styles, paddingLeft: index === 0 && paddingLeftText > 0 ? paddingLeftText : '' }} title={col_hover_title} >{col_val}</span>)}
                        
                        {col_val_change !== '' &&
                          <span className='cell_change' style={{ color: col_change_color, ...cell_change_styles }}>{col_val_change + '%'}</span>
                        }
                      </div>
                    );
                  }
                })
              }
            </div>

            {is_expanded &&
              <div className={(selectedRowsLen > updated_row_index_len ? 'sub-level-table' : '')}>
                {this.recursiveTable(item.has_sub_level, (counter + 1), level_details, updated_row_index, nesting_level + 1)}
              </div>
            }
          </div>
        );

      } else {
        
        return (
          <div key={'row-' + i} id={'nest-'+nesting_level+'-row-item-' + i} className={'rows-group ' + (selectedRowsLen > updated_row_index_len ? ' has-subrows' : '') + (is_expanded ? ' expanded' : '') + ' ' + (current_clicked_class) + ' ' + (in_process)}>
            <div className={`tbl-row tbl-row-${this.props.analysisId}`}>
              <div className="cell row-number" style={CELL_STYLES_ROW_NUMBER_COL}>{this.rowNumber}</div>
              {
                colsInRow.map((col_key, index) => {
                  if (col_key !== 'has_sub_level') {
                    let col = item[col_key]; // col can be either null,String type,Number type or Object type{data: Number, change: Number}
                    let col_val = '', col_val_change = '';

                    if (col === null || col === undefined) {
                      // col_val  and col_val_change should be '', which are already initiliazed
                    } else if (typeof col === 'number') {
                      // set col_val, col_val_change will still be ''
                      col_val = this.props.formatCellValue(col_key, col);
                    } else if (typeof col === 'object') {
                      // This condition only applicable when period comparison is Enabled
                      // set col_val && col_val_change. Don't show(set as '') the change when col_val itself is ''
                      col_val = col.data !== null ? this.props.formatCellValue(col_key, col.data) : '';
                      col_val_change = col.change !== null && col_val !== '' ? col.change : ''; // no need to parse and apply commas in col_change
                      // Dont' show the col_val_change for benchmark column
                      if (col_key.includes('benchmark')) {
                        col_val_change = '';
                      }
                    } else {
                      // type of col can be string here, no need of calling 'formatCellValue' here
                      col_val = col;
                    }

                    let col_change_color = (col_val_change !== '' && col_val_change !== 0) ? col_val_change > 0 ? 'green' : 'red' : '';
                    let col_width = (index === 0 ? this.state.columnsWidth[index]+1 : this.state.columnsWidth[index])  + 'px';
                    if(col_width.includes('undefined')){
                      col_width = '140px';
                    }

                    let col_hover_title = (index === 0) ? col_val : '';
                    let canClick = (selectedRowsLen > updated_row_index_len && index === 0 && col_val !== 'Total') ? true : false;
                    // don't show expand button on empty rows
                    if(parsed_level_details[0]==='' || parsed_level_details[0]===null){
                      canClick = false;
                    }

                    let cell_styles = { minWidth: col_width, maxWidth: col_width };
                    let cell_inner_styles = {};
                    let cell_change_styles = {};

                    // Calculate paddingLeft adn left for first column's text and toggle button respectively
                    const paddingLeftText = 18 * (nesting_level > 0 ? 1 : (canClick ? 1 : 0)) + 12 * (canClick ? nesting_level : Math.max(nesting_level - 1, 0));
                    const leftToggleBtn = 8 + 12 * nesting_level;

                    this.props.conditionalFormatting.forEach((format, k) => {
                      if (format && format.cell_value !== undefined && format.cell_value.length > 0) {
                        let hasCondition = format.cell_value.some(e => col_key.includes(e.name.toLowerCase()));
                        // if (this.props.terminal_type === 'klay_media') {
                        //   hasCondition = true; //for default datagrid data because key is date (e.g. 2021-03-02)
                        // }
                        let conditional_formatting_col_value = '';
                        if (format.format_type.id === 'period_comparison') {
                          conditional_formatting_col_value = (typeof item[col_key] === 'object' && item[col_key] !== null) ? item[col_key].change : 0;
                        } else if (format.format_type.id === 'standard') {
                          conditional_formatting_col_value = (typeof item[col_key] === 'object' && item[col_key] !== null) ? item[col_key].data : item[col_key];
                        }

                        // console.log('format type - else -- '+ col_key +'---'+format.format_type.id+'---'+hasCondition+'---'+this.isMatchingCondition(conditional_formatting_col_value, format)+'--'+conditional_formatting_col_value);
                        if (hasCondition && this.isMatchingCondition(conditional_formatting_col_value, format)) {
                          if (format.format_type.id === 'standard') {
                            cell_inner_styles['backgroundColor'] = format.background;
                            cell_inner_styles['color'] = format.color;
                          }
                          if (format.format_type.id === 'period_comparison') {
                            cell_change_styles['backgroundColor'] = format.background;
                            cell_change_styles['color'] = format.color;
                          }
                        }
                      }
                    });

                    return (
                      <div id={'nest-'+nesting_level+'-td-' + i + '-' + index + '-row-' + this.rowNumber} key={'cell-' + index}
                        className={'cell'}
                        style={cell_styles} data-row_index={updated_row_index} data-level_details={level_details} onClick={(e) => canClick ? this.handleRowToggle(e, i) : false}
                      // onMouseDown={(e) => this.onMouseDown('td-'+i+'-'+index)} onMouseEnter={(e) => this.onMouseEnter('td-'+i+'-'+index)}
                        // onMouseOut={() => {document.getElementById(`td-${i}-${index}`).classList.remove('selected');}}
                        onMouseDown={() => {
                          let pointsToRemove = this.state.previousPoints;
                          this.setState({
                            isMouseDown: true, inMotion: false, selectionStartPoints: [rowNum, index], selectionEndPoints: [], previousSelectedPointFirst: rowNum, previousSelectedPointSecond: index, currentSelectedPointFirst: rowNum, currentSelectedPointSecond: index }, () => {this.handleRemovePreviousSelection(pointsToRemove)})
                        }}
                        onMouseUp={() => {this.setState({ isMouseDown: false, selectionEndPoints: [rowNum, index] }, () => {this.handleSelection()})}}
                        onMouseOver={() => { this.state.isMouseDown && this.setState({ previousSelectedPointFirst: this.state.currentSelectedPointFirst === null ? rowNum : this.state.currentSelectedPointFirst, previousSelectedPointSecond: this.state.currentSelectedPointSecond === null ? index : this.state.currentSelectedPointSecond, currentSelectedPointFirst: rowNum, currentSelectedPointSecond: index }, () => this.handleShowSelection())}}
                      >
                        {canClick &&
                          <span className={'btn-toggle'} style={index === 0 ? { left: leftToggleBtn } : {}}></span>
                        }
                        {/* Sub level loader */}
                        {index === 0 && this.props.sublevel_inprocess && this.state.current_row_index === updated_row_index &&
                          <div className="showloading2-wrapper" style={index === 0 ? { left: leftToggleBtn - 5  } : {}}>
                            <Loader2 />
                          </div>
                        }

                        {index === 0 ? (<div className="text-container"><span className='cell_text' style={{ ...cell_inner_styles, paddingLeft: index === 0 && paddingLeftText > 0 ? paddingLeftText : '' }} title={col_hover_title} >{col_val}</span></div>) : (<span className='cell_text' style={{ ...cell_inner_styles, paddingLeft: index === 0 && paddingLeftText > 0 ? paddingLeftText : '' }} title={col_hover_title} >{col_val}</span>)}
                        {/* <span className='cell_text' style={{ ...cell_inner_styles, paddingLeft: index === 0 && paddingLeftText > 0 ? paddingLeftText : '' }} title={col_hover_title} >{col_val}</span> */}
                        {col_val_change !== '' &&
                          <span className='cell_change' style={{ color: col_change_color, ...cell_change_styles }}>{col_val_change + '%'}</span>
                        }
                      </div>
                    );
                  }
                })
              }
            </div>
          </div>
        )
      }
    })
  }

  convertAbbrToAllCaps(col_val) {
    let allCapsArr = ["cpm", "rpm", "rps", "rpu", "rpms", "rpmu", "imp/pv", "cpc", "cpa", "rpa", "ctr", "cvr", "cv", ""];
    let new_col_val = col_val.replace(/_/g, ' ');
    let col_arr = new_col_val.split(' ');
    let updated_col = '';

    col_arr.forEach((item, i) => {
      let index = allCapsArr.indexOf(item);
      if (index > -1) {
        item = item.replace(allCapsArr[index], '<span class="caps">' + item + '</span>');
      }
      updated_col += (i > 0) ? ' ' : '';
      updated_col += item;
    });

    return updated_col;
  }

  handleScrollingHeader(ev, columns, tabs) {
    if (columns.length !== 0) {
      let leftSpaceToLeave = this.state.columnsWidth[0] + 30;
      if (document.getElementsByClassName(`hover-column-container-${this.props.analysisId}`)[0].parentNode.classList.contains('panel-open')) {
        leftSpaceToLeave += 365;
      }
      document.getElementsByClassName(`hover-column-container-${this.props.analysisId}`)[0].style.left = (leftSpaceToLeave).toString()+'px'
      let previousKey = this.state.previousKey;
      if (ev.target.scrollLeft === 0) {
        document.getElementsByClassName(`hover-column-container-${this.props.analysisId}`)[0].style.display = 'none';
        columns[0].map((col, i) => {
          tabs[0].childNodes[2].childNodes[1].childNodes[i + 2].classList.remove('hide');
          if (tabs[0].childNodes[3].childNodes[1].childNodes[i + 2].classList.contains('hide')) {
            tabs[0].childNodes[3].childNodes[1].childNodes[i + 2].classList.remove('hide');
          }
        })
        this.setState({ previousKey: 0 });
        return;
      }
      let totalWidth = 0;
      this.state.columnsWidth.map((colWidth) => totalWidth += colWidth);
      let columnsWidth = this.state.columnsWidth;
      let position = ev.target.scrollLeft + columnsWidth[0] + 26;
      if (position < totalWidth) {
        let texts = [];
        let i = 0, j = 0;
        let checkPosition = columnsWidth[0];
        for (i = 1; i < columnsWidth.length; i += 1) {
          if (position > checkPosition+26) {
            checkPosition += columnsWidth[i];
          } else {
            texts = columns[i - 1].map((col) => col);
            break;
          }
        }

        if (texts.length === 0) {
          texts = columns[columns.length - 1].map((col) => col);
          i = columns.length;
          previousKey = i - 1;
        }

        let skipForAll = false;

        for (j = 0; j < texts.length; j += 1) {
          let textVal = ''
          if (texts[j].includes('_')) {
            let textArr = texts[j].split('_');
            textArr.map((text, i) => {
              if (i !== textArr.length - 1) {
                textVal = textVal + text + ' ';
              } else {
                textVal = textVal + text;
              }
            })
          } else {
            textVal = texts[j];
          }
          let widthforText = this.calculateTextWidth(textVal, '11px Poppins, "Open Sans", sans-serif, helvetica');
          widthforText += 6;
          let extraSpaceToLeave = (j === texts.length - 1) ? 30 : 12;
          if ((position + widthforText + 4) >= (checkPosition - extraSpaceToLeave) || skipForAll) {
            if (i === columns.length) {
              widthforText = widthforText < (checkPosition+26)-(position+extraSpaceToLeave+4) ? widthforText : ((checkPosition+26)-(position+extraSpaceToLeave+4))
              if (j !== texts.length-1) {
                skipForAll = true;
              }
              if (widthforText < 0 || widthforText < 10) {
                widthforText = 0
              }
            }
            // if (columns[i] !== undefined && (j === texts.length-1 || texts[j] !== columns[i][j] || skipForAll)) {
            //   j===3 && console.log('here1', widthforText, (checkPosition+26)-(position+extraSpaceToLeave+4))
            //   widthforText = widthforText < (checkPosition+26)-(position+extraSpaceToLeave+4) ? widthforText : ((checkPosition+26)-(position+extraSpaceToLeave+4))
            //   if (j !== texts.length-1) {
            //     skipForAll = true;
            //   }
            //   if (widthforText < 0 || widthforText < 10) {
            //     widthforText = 0
            //   }
            // }
          }

          if (columns[i] !== undefined && (j === texts.length-1 || texts[j] !== columns[i][j] || skipForAll)) {
            widthforText = widthforText < (checkPosition+26)-(position+extraSpaceToLeave+4) ? widthforText : ((checkPosition+26)-(position+extraSpaceToLeave+4))
            if (j !== texts.length-1) {
              skipForAll = true;
            }
            if (widthforText < 0 || widthforText < 10) {
              widthforText = 0
            }
          }

          // if (previousKey !== i && (columns[i] !== undefined && (j === texts.length-1 || texts[j] !== columns[i][j]))) {
          //   if (j !== texts.length-1) {
          //     skipForAll = true;
          //     console.log('here', j,  texts[j])
          //   }
          // }

          if (previousKey !== i) {
            previousKey !== 0 && tabs[0].childNodes[previousKey].childNodes[1].childNodes[j + 2].classList.remove('hide');
            if (previousKey > i && previousKey !== columns.length) {
              if ((i !== columns.length - 1)) {
                if (tabs[0].childNodes[previousKey + 1].childNodes[1].childNodes[j + 2].classList.contains('hide')) {
                  tabs[0].childNodes[previousKey + 1].childNodes[1].childNodes[j + 2].classList.remove('hide');
                }
              }
            }
            tabs[0].childNodes[i].childNodes[1].childNodes[j + 2].classList.add('hide');
            if (i !== columns.length && tabs[0].childNodes[i + 1].childNodes[1].childNodes[j + 2].classList.contains('blank')) {
              tabs[0].childNodes[i + 1].childNodes[1].childNodes[j + 2].classList.add('hide');
            }
          }

          document.getElementsByClassName(`hover-column-${this.props.analysisId}-${j}`)[0].style.width = (widthforText).toString()+'px';
          if (previousKey !== i) {
            document.getElementsByClassName(`hover-column-${this.props.analysisId}-${j}`)[0].textContent = textVal;
          }
          
        }
        document.getElementsByClassName(`hover-column-container-${this.props.analysisId}`)[0].style.display = 'block';
        this.setState({ previousKey: previousKey !== i ? i : previousKey })
      } else {
        document.getElementsByClassName(`hover-column-container-${this.props.analysisId}`)[0].style.display = 'none';
      }
    }
  }

  handleRemovePreviousSelection(pointsToRemove) {
    let tabs = document.getElementsByClassName(`tbl-row-${this.props.analysisId}`)
    let columnsToNeglect = this.props.columns[0].length;
    if (typeof this.props.columns[0] === 'string') {
      columnsToNeglect = 1;
    }

    let previousPoints = pointsToRemove;
    let totalKeys = Object.keys(previousPoints);
    
    if (previousPoints.rowStart === -1) {
      return;
    }

    if (totalKeys.length !== 0) {
      for (let i = previousPoints.rowStart; i <= previousPoints.rowEnd; i += 1) {
        let highlightedRow = tabs[i - columnsToNeglect];
        for (let j = previousPoints.colStart; j <= previousPoints.colEnd; j += 1) {
          highlightedRow.childNodes[j + 1].classList.remove('selected');
        }
      }
    } else {
      let allTabs = document.getElementsByClassName('cell')
      for (let i = 0; i < allTabs.length; i += 1) {
        if (allTabs[i].classList.contains('selected')) {
          allTabs[i].classList.remove('selected');
        }
      }
    }
  }

  handleShowSelection() {
    if (this.state.selectionStartPoints.length !== 0 && this.state.selectionEndPoints.length === 0 && (this.state.previousSelectedPointFirst !== this.state.currentSelectedPointFirst || this.state.previousSelectedPointSecond !== this.state.currentSelectedPointSecond)) {
      let selectedData = [];
      let columnsToNeglect = this.props.columns[0].length;

      if (typeof this.props.columns[0] === 'string') {
        columnsToNeglect = 1;
      }

      let tabs = document.getElementsByClassName(`tbl-row-${this.props.analysisId}`)

      let rowStart = this.state.selectionStartPoints[0] <= this.state.currentSelectedPointFirst ? this.state.selectionStartPoints[0] : this.state.currentSelectedPointFirst;
      let rowEnd = this.state.selectionStartPoints[0] >= this.state.currentSelectedPointFirst ? this.state.selectionStartPoints[0] : this.state.currentSelectedPointFirst;
      let colStart = this.state.selectionStartPoints[1] <= this.state.currentSelectedPointSecond ? this.state.selectionStartPoints[1] : this.state.currentSelectedPointSecond;
      let colEnd = this.state.selectionStartPoints[1] >= this.state.currentSelectedPointSecond ? this.state.selectionStartPoints[1] : this.state.currentSelectedPointSecond;

      let previousPoints = this.state.previousPoints;
      let totalKeys = Object.keys(previousPoints);

      if (totalKeys.length !== 0 && previousPoints.rowStart !== -1) {
        if (rowEnd < previousPoints.rowEnd) {
          for (let i = rowEnd; i <= previousPoints.rowEnd; i += 1) {
            let highlightedRow = tabs[i - columnsToNeglect];
            for (let j = previousPoints.colStart; j <= previousPoints.colEnd; j += 1) {
              highlightedRow.childNodes[j + 1].classList.remove('selected');
            }
          }
        }
        if (rowStart > previousPoints.rowStart) {
          for (let i = previousPoints.rowStart; i <= rowStart; i += 1) {
            let highlightedRow = tabs[i - columnsToNeglect];
            for (let j = previousPoints.colStart; j <= colEnd; j += 1) {
              highlightedRow.childNodes[j + 1].classList.remove('selected');
            }
          }
        }
        if (colEnd < previousPoints.colEnd) {
          for (let i = previousPoints.rowStart; i <= previousPoints.rowEnd; i += 1) {
            let highlightedRow = tabs[i - columnsToNeglect];
            for (let j = colEnd + 1; j <= previousPoints.colEnd; j += 1) {
              highlightedRow.childNodes[j + 1].classList.remove('selected');
            }
          }
        }
        if (colStart > previousPoints.colStart) {
          for (let i = previousPoints.rowStart; i <= previousPoints.rowEnd; i += 1) {
            let highlightedRow = tabs[i - columnsToNeglect];
            for (let j = previousPoints.colStart; j <= colStart - 1; j += 1) {
              highlightedRow.childNodes[j + 1].classList.remove('selected');
            }
          }
        }
      }

      


      for (let i = rowStart; i <= rowEnd; i += 1) {
        let highlightRow = tabs[i-columnsToNeglect];
        let rowData = []
        for (let j = colStart; j <= colEnd; j += 1) {
          highlightRow.childNodes[j+1].classList.add('selected');
          rowData.push(highlightRow.childNodes[j+1].textContent);
        }
        selectedData.push(rowData)
      }
      let previousPointsObject = {
        rowStart,
        rowEnd,
        colStart,
        colEnd
      };
      this.setState({ selectedData: selectedData, previousPoints: previousPointsObject, inMotion: true });
    }
  }

  numberToCommaSeperatedString(value) {
    value = value.toString().split('');
    let count = 0, sum = '';

    for (let i = value.length-1; i >= 0; i -= 1 ) {
      count += 1;
      if (count === 3 && (value.length-i) !== value.length) {
        sum += `${value[i]},`;
        count = 0;
      } else {
        sum += value[i];
      }
    }
    return sum.split('').reverse().join('');
  }

  handleDataToCopy() {
    let selectedData = this.state.selectedData;
    let dataToCopy = '';
    let dataRow = '';
    for (let i = 0; i < selectedData.length; i += 1) {
      dataRow = '';
      for (let j = 0; j < selectedData[i].length; j += 1) {
        dataRow += `${selectedData[i][j]}\t`
      }
      dataToCopy += `${dataRow}\n`;
    }
    this.setState({ selectedData: [] });
    this.props.setDataToCopy(dataToCopy);
  }

  handleSelection() {
    let rowStartingPoint = this.state.selectionStartPoints[0];
    let rowEndPoint = this.state.selectionEndPoints[0];
    let columnStartingPoint = this.state.selectionStartPoints[1];
    let columnEndPoint = this.state.selectionEndPoints[1];
    let numberOfRows = Math.abs(rowStartingPoint - rowEndPoint) + 1;
    let numberOfColumns = Math.abs(columnStartingPoint - columnEndPoint) + 1;

    let selectedData = this.state.selectedData;
    let columnsToNeglect = this.props.columns[0].length;
    if (typeof this.props.columns[0] === 'string') {
      columnsToNeglect = 1;
    }

    if (rowStartingPoint === rowEndPoint && columnStartingPoint === columnEndPoint) {
      let tabs = document.getElementsByClassName(`tbl-row-${this.props.analysisId}`);
      let totalPreviousKeys = Object.keys(this.state.previousPoints);
      if (totalPreviousKeys.length === 0) {
        let allTabs = document.getElementsByClassName('cell')
        for (let i = 0; i < allTabs.length; i += 1) {
          if (allTabs[i].classList.contains('selected')) {
            allTabs[i].classList.remove('selected');
          }
        }
      }
      if (rowStartingPoint === this.state.previousPoints.rowStart && columnStartingPoint === this.state.previousPoints.colStart && !this.state.inMotion) {
        let previousPointsObject = {
          rowStart: -1,
          rowEnd: -1,
          colStart: -1,
          colEnd: -1
        }
        this.props.setSelectedData({});
        this.setState({ selectedData: [], previousPoints: previousPointsObject })
        return;
      }
      if (!this.state.inMotion) {
        tabs[rowStartingPoint-columnsToNeglect].childNodes[columnStartingPoint+1].classList.add('selected')
        let rowData = []
        rowData.push(tabs[rowStartingPoint-columnsToNeglect].childNodes[columnStartingPoint+1].textContent)
        selectedData.push(rowData);
        let previousPointsObject = {
          rowStart: rowStartingPoint,
          rowEnd: rowStartingPoint,
          colStart: columnStartingPoint,
          colEnd: columnStartingPoint
        }
        this.setState({ previousPoints: previousPointsObject });
      }
    }

    if (selectedData.length === 0) {return;}

    let totalSum = 0, average = 0, min = 0, max = 0;
    let toolTipData = {};
    let updateSelectedData = [];

    let tabs = document.getElementsByClassName(`tbl-row-${this.props.analysisId}`)
    for (let k = columnStartingPoint + 1; k <= columnEndPoint + 1; k += 1) {
      let row = tabs[0].childNodes[k];
      if (row && row.childNodes.length === 2) {
        let col = row.childNodes[1];
        let rowData = [];
        for (let l = 2; l < col.childNodes.length; l += 1) {
          let data = col.childNodes[l].textContent;
          if (k == 1) {
            rowData.push("");
            updateSelectedData.push(rowData)
            rowData = [];
          } else {
            if (k === columnStartingPoint + 1) {
              rowData.push(data);
              updateSelectedData.push(rowData)
              rowData = [];
            } else {
              rowData = updateSelectedData[l - 2];
              rowData.push(data);
              updateSelectedData[l - 2] = rowData
              rowData = [];
            }
          }
        }
      }
    }
    
    updateSelectedData = [ ...updateSelectedData, ...selectedData ]
    this.setState({ selectedData: updateSelectedData }, () => this.handleDataToCopy())

    if (columnStartingPoint !== 0) {
      let forNan = 0;
      let numOfCols = Math.abs(columnEndPoint - columnStartingPoint) + 1;

      selectedData.map((row, i) => {
        row.map((data, j) => {
          let rowData = '';
          if (data.includes(',')) {
            let dataSpilt = data.split(',')
            dataSpilt.map((d) => {rowData += d});
          } else {
            rowData = data;
          }
          rowData = parseFloat(rowData);
          if (!isNaN(rowData)) {
            if (i === 0) {
              min = rowData;
              max = rowData;
            } else {
              if (rowData > max) {
                max = rowData;
              }
              if (rowData < min) {
                min = rowData;
              }
            }
            totalSum += rowData;
          } else {
            forNan += 1;
          }
        })
      })
      average = totalSum / ((numberOfRows * numOfCols) - forNan);

      if (totalSum.toString().includes('.')) {
        let splitTotalSum = totalSum.toString().split('.');
        splitTotalSum[0] = this.numberToCommaSeperatedString(splitTotalSum[0]);
        totalSum = splitTotalSum[0] + '.' + splitTotalSum[1].substring(0,2);
      } else {
        totalSum = this.numberToCommaSeperatedString(totalSum);
      }
      if (average.toString().includes('.')) {
        let splitAverage = average.toString().split('.');
        splitAverage[0] = this.numberToCommaSeperatedString(splitAverage[0]);
        average = splitAverage[0] + '.' + splitAverage[1].substring(0,2);
      } else {
        average = this.numberToCommaSeperatedString(average);
      }

      if (totalSum === '0') {
        toolTipData = {
          "Count": numberOfRows * numOfCols
        }
      } else {
        toolTipData = {
          "Sum": totalSum,
          "Average": average,
          "Count": ((numberOfRows * numOfCols) - forNan),
          "Min": min,
          "Max": max
        }
      }

      this.props.setSelectedData(toolTipData)
    }

    if (numberOfColumns === 1) {
      if (columnStartingPoint === 0) {
        if (selectedData.length === 1) {
          toolTipData = {
            "Count": numberOfRows
          };
        } else {
          let from = selectedData[0][0].substring(0,15);
          let to = selectedData[selectedData.length - 1][0].substring(0,15);
          if (from.length !==0 && to.length === 0) {
            let checkForTo = '';
            let checkedPoint = selectedData.length - 1;
            while(checkForTo.length === 0) {
              checkedPoint -= 1;
              checkForTo = selectedData[checkedPoint][0].substring(0,15);
            }
            toolTipData = {
              "From": from,
              "To": checkForTo,
              "Count": numberOfRows - ((selectedData.length - 1) - checkedPoint)
            }
          } else {
            if (from.length === 0 || to.length === 0) {
              toolTipData = {
                "Count": numberOfRows
              }
            } else {
              toolTipData = {
                "From": from,
                "To": to,
                "Count": numberOfRows
              }
            }
          }
        }
      }
      this.props.setSelectedData(toolTipData);
    } else if (columnStartingPoint === 0 && columnEndPoint !== 0) {
      this.props.setSelectedData({});
    }
  }


  render() {
    // console.log('insidde render', this.tblRef.current);
    let totalRecordsLen = Object.keys(this.props.data).length;
    if (this.props.data.length === undefined) return;
    let cols_len = (this.props.columns_width) ? this.props.selected_columns.length : 1;
    let colheight = 20;

    // console.log('width: '+ this.state.overlayWidth+', height: '+this.state.overlayHeight);
    let columnsFromProp = this.props.columns;
    if (this.props.periodComparisonEnabled && !this.props.showBenchmarkForPeriodComparison) {
      // filter out columns with benchmark
      // each column will have 2nd index indicating wheather that column represents data or benchmark
      // 2nd index value can be either 'a_data' or 'benchmark'
      columnsFromProp = columnsFromProp.filter(c => c[2] !== 'benchmark');
    }
    this.rowNumber = 0;

    const headerRowNumbering = Array(1 + cols_len).fill(null).map((x, i) => {
      if (i === 0) return ''; // Row showing the column number is not to be counted
      this.rowNumber = this.rowNumber + 1;
      return this.rowNumber;
    });

    return (
      // <>
      <div className="table-grids-wrapper">
        <div className={'table-grids ' + (this.props.selected_columns ? 'col-group-' + cols_len : '')} ref={this.tblRef}>
          <div className="tbl-header-group">
            {columnsFromProp  &&
            <>
              <div className={`tbl-row tbl-row-${this.props.analysisId}`} key="header">
                {/* First render the column showing the row numbers of header rows */}
                <div className="header-cell header-group">
                  {headerRowNumbering.map(rNumber => {
                    if (rNumber === '') { 
                      return <div key={rNumber} className="select-all-button-container">
                        <button onClick={() => {this.setState({ previousPoints: {} }); this.props.handleSelectAll()}}></button>
                      </div> 
                    } else {
                      return (
                        <div key={rNumber} className="cell row-number" style={{ ...CELL_STYLES_ROW_NUMBER_COL, height: colheight + 'px' }}>
                          {rNumber}
                        </div>
                      )
                    }
                  })}
                </div>

                {/* Render the actula columns */}
                {
                  columnsFromProp.map((col, i) => {
                    let col_width = i === 0 ? (this.state.columnsWidth[i]) + 'px' : this.state.columnsWidth[i] + 'px';
                    if(col_width.includes('undefined')){ col_width = '140px'; }

                    const resizeHandle = <div className="col-resize-handle" title="Drag to resize"
                      onMouseDown={(e) => this.handleColumnResizeMouseDown(e, i)}>
                      {/**Below empty div shows the resize handler on hover. But should also be forced visible(by setting style property) if current column is being resized */}
                      <div style={{ display: this.state.resizingColumnIndex === i ? 'block' : '' }}></div>
                    </div>;

                    if (col instanceof Array) {
                      //Generate Column Header Key
                      let col_key = '';
                      if (col.length > 1) {
                        col_key += "(";
                        col.map((item, k) => {
                          col_key += (k > 0) ? ', ' : '';
                          col_key += (item !== '') ? "'" + item + "'" : "''";
                        });
                        col_key += ")";
                      }

                      if (this.props.periodComparisonEnabled) {
                        // example of 'col' is : ["sum revenue","2020-11-13","benchmark","2020-11-06"]
                        // 2nd and 3rd position have metaColumns, only 1st and 4th position contains columns name to be shown
                        // In case of benchmark col, show the 'Benchmark' text instead of benchmark date
                        if (col[2] === 'benchmark') {
                          col = [col[0], col[col.length - 1] + '<span class="benchmark">Benchmark</span>'];
                        } else {
                          col = [col[0], col[col.length - 1]];
                        }
                      }

                      //Sort header first column to reder actual value in the end
                      let columns = '';
                      if (i === 0) {
                        columns = JSON.parse(JSON.stringify(col));
                        columns.sort((a, b) => {
                          if (a > b) return 1;
                          if (a < b) return -1;
                          return 0;
                        })
                      }

                      return (
                        <div key={'key-' + i} className={'header-cell header-group ' + (this.state.columnsSorting.col === col_key ? this.state.columnsSorting.order : '')} data-index={i} data-sort_key={col_key} onClick={this.handleSortingColumn}
                          style={{ minWidth: col_width, maxWidth: col_width }}>
                          <span className="sort"></span>
                          
                          <div className="sub-columns-group">
                            {resizeHandle}
                            {i === 0 &&
                              <React.Fragment>
                                <div className="sub-column col-number" style={{ height: colheight + 'px' }}>
                                  <span className="highlight">{i + 1}</span>
                                </div>
                                {columns.map((subcol, j) => {
                                  return <div key={'subcol' + j} className={'sub-column' + (columns.length === 1 ? ' only-child' : '')}>
                                    {subcol != '' ? <span className="highlight">{subcol}</span> : subcol}
                                  </div>
                                })}
                              </React.Fragment>
                            }

                            {i > 0 &&
                              <React.Fragment>
                                <div className="sub-column col-number">
                                  <span className="highlight">{i + 1}</span>
                                </div>

                                {col.map((subcol, j) => {
                                  let updated_subcol = this.convertAbbrToAllCaps(subcol);
                                  
                                  //Display header grouping
                                  for (let k = 0, len = Object.keys(this.props.columns_display).length; k < len; k++) {
                                    if (this.props.columns_display['level' + k].indexOf(i) >= 0 && j === k) {
                                      return <div key={'subcol' + j} className={'sub-column pad-r8' + (col.length === 1 ? ' only-child' : '')} dangerouslySetInnerHTML={{ __html: updated_subcol }} />
                                    }
                                    if (this.props.columns_display['level' + k].indexOf(i) === -1 && j === k) {
                                      //we can keep this blank to show empty just like col span. right now it is cell text is being hidden using css
                                      return <div key={'subcol-empty-' + j} className={'sub-column blank' + (col.length === 1 ? ' only-child' : '')} dangerouslySetInnerHTML={{ __html: updated_subcol }} />
                                    }
                                  }

                                  //Display default column
                                  if (j >= col.length - 1) {
                                    return <div key={'subcol-' + j} className={'sub-column' + (col.length === 1 ? ' only-child' : '')} dangerouslySetInnerHTML={{ __html: updated_subcol }} />
                                  }
                                })}
                              </React.Fragment>
                            }
                          </div>
                        </div>
                      );

                    } else {
                      let updated_col = !col.includes('blank_') ? this.convertAbbrToAllCaps(col) : '';

                      return (
                        <div key={'key-' + i} className={'header-cell ' + (this.state.columnsSorting.col === col ? this.state.columnsSorting.order : '')} data-index={i} data-sort_key={col} onClick={this.handleSortingColumn}
                          style={{ minWidth: col_width, maxWidth: col_width }}>
                          {!col.includes('blank_') &&
                            <span className="sort"></span>
                          }
                          
                          {/* To display empty blank column cells when columns has only one element */}
                          {(col !== '' || col.includes('blank_')) && this.props.selected_columns.length === 1 &&
                            <div className="sub-columns-group">
                              {resizeHandle}
                              <div className="sub-column col-number" >
                                <span className="highlight">{i + 1}</span>
                              </div>
                              <div className={'sub-column only-child '+(col.includes('blank_') ? 'no-bg' : '')}>
                                <div className="cell-text" dangerouslySetInnerHTML={{ __html: updated_col }} />
                              </div>
                            </div>
                          } 

                          {/* To display empty blank column cells when columns has more than one element */}
                          {col.includes('blank_') && (this.props.selected_columns.length > 1) &&
                            <div>
                              <div className="sub-columns-group">
                                {resizeHandle}
                                <div className="sub-column col-number">
                                  <span className="highlight">{i + 1}</span>
                                </div>

                                {this.props.selected_columns.map((col) => {
                                  return(<div className={'sub-column no-bg'}>
                                    <div className="cell-text"></div>
                                  </div>)
                                })}
                              </div>
                            </div>
                          }
                        </div>
                      );
                    }
                  })
                }
              </div>
              </>
            }
          </div>

          <div className="tbl-body">
            {this.props.data && totalRecordsLen !== 0 &&
              this.recursiveTable(this.props.data, 0, null, null, 0)
            }

          </div>
        </div>
      </div>
      // {/* <div className={`hover-column-container hover-column-container-${this.props.analysisId}`}>
                // <div className={`hover-column-group hover-column-group-${this.props.analysisId}`}>
                // {/* { data-index={1} data-sort_key={[...columnsFromProp[1]]} onClick={this.handleSortingColumn}>} */}
                // {typeof columnsFromProp[1] !== 'string' && columnsFromProp[1].map((col, j) => <div className={`hover-column hover-column-${this.props.analysisId}-${j}`}>{col}</div>)}
                // </div>
              // </div>
      // </> */}
    );
  }
}

export default ReactDivTable;