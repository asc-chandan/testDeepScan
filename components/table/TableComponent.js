import React, { useState, useRef, useEffect } from 'react';
import '../../styles/Table.scss'
import { calculateTextWidth } from '../../views/SellSide/TrendMaster/ChartsUtils';

const TableComponent = ({
  inprocess, columns, dataArray, dataList, paginationInfo, scrollAPICall, that, dashbaordListToShow
}) => {
  const [hoverLinePosition, setHoverLinePosition] = useState({ left: 0 })
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [resizingColumnIndex, setResizingColumnIndex] = useState(-1);
  const [columnsWidth, setColumnsWidth] = useState([]);
  const [columnsWidthInPer, setColumnsWidthInPer] = useState([]);
  const [columnsMinWidth, setColumnsMinWidth] = useState([])
  const [resizerStartPos, setResizerStartPos] = useState(0);
  const [minWidthForTable, setMinWidthForTable] = useState(0);
  const [extraColumnWidth, setExtraColumnWidth] = useState(0);
  const scrollRef = useRef();

  useEffect(() => {
    let screenSize = document.body.offsetWidth - 300;
    setMinWidthForTable(screenSize);

    let colHeadersValue = [];
    let colHeadersMinWidth = [];
    columns.map((col) => {
      colHeadersValue.push(col.display_name);
      colHeadersMinWidth.push(calculateTextWidth(col.display_name, '11px Poppins, "Open Sans", sans-serif, helvetica') + 20);
    });
    let colWidthsInPercentage = [];
    colHeadersValue.map(() => colWidthsInPercentage.push(100 / colHeadersValue.length));

    setColumnsMinWidth(colHeadersMinWidth);
    setColumnsWidthInPer(colWidthsInPercentage);

    setTimeout(() => {
      let colHeaders = document.getElementsByClassName("col-head");
      let colWidths = []
      if (colHeaders.length !== 0) {
        for (let i = 0; i < colHeaders.length; i += 1) {
          colWidths.push(colHeaders[i].offsetWidth);
        }
        let totalTableWidth = 0;
        colWidths.map((colWidth) => totalTableWidth += colWidth);
        // let colWidthsInPercentage = [];
        // colWidths.map((colWidth) => {
        //   colWidthsInPercentage.push((colWidth/totalTableWidth) * 100)
        // })
        setColumnsWidth(colWidths);
        // setColumnsWidthInPer(colWidthsInPercentage)
      }
    }, 500);
    // console.log(document.getElementsByClassName("col-head")[1].offsetWidth)

  }, [inprocess]);

  const handleScroll = () => {
    if (dataList !== null && paginationInfo.totalResultsCount !== dataList.length && !inprocess) {
      // if (dataList !== null && !inprocess) {
      let pointToCallApi = scrollRef.current.scrollHeight - (document.documentElement.offsetHeight - (scrollRef.current.offsetTop + 60))
      if (scrollRef.current.scrollTop === pointToCallApi) {
        scrollAPICall(100, paginationInfo.currentPage + 1, that);
      }
    }
  }

  const handleMouseDown = (e, index) => {
    let scrollLeftVal = document.getElementsByClassName("asc-custom-table-wrapper")[0].scrollLeft;
    let left;
    left = e.screenX - 150 + scrollLeftVal;
    setHoverLinePosition({
      left
    })
    setIsMouseDown(true);
    setResizingColumnIndex(index);
    setResizerStartPos(e.screenX);
  }

  const handleMouseMove = (e) => {
    if (isMouseDown) {
      let scrollLeftVal = document.getElementsByClassName("asc-custom-table-wrapper")[0].scrollLeft;
      let resizeVal = e.screenX - resizerStartPos;
      let colWidths = columnsWidth;
      let left = 0;
      if (columnsMinWidth[resizingColumnIndex] <= colWidths[resizingColumnIndex] + resizeVal) {
        left = e.screenX - 150;
        left += scrollLeftVal
      } else {
        for (let i = 0; i < resizingColumnIndex; i += 1) {
          left += colWidths[i]
        }
        left += columnsMinWidth[resizingColumnIndex]
      }
      setHoverLinePosition({ ...hoverLinePosition, left });
    }
  }

  const handleMouseUp = (e) => {
    let resizeVal = e.screenX - resizerStartPos;
    // if (resizerStartPos > e.screenX) {
    //   resizeVal = resizerStartPos - e.screenX;
    // } else {
    //   resizeVal = e.screenX - resizerStartPos;
    // }
    // console.log(resizingColumnIndex, resizerStartPos, e.screenX, resizeVal)
    let colWidths = columnsWidth;
    if (columnsMinWidth[resizingColumnIndex] <= colWidths[resizingColumnIndex] + resizeVal) {
      colWidths[resizingColumnIndex] = colWidths[resizingColumnIndex] + resizeVal;
    } else {
      colWidths[resizingColumnIndex] = columnsMinWidth[resizingColumnIndex];
    }
    let totalTableWidth = 0;
    colWidths.map((colWidth) => totalTableWidth += colWidth);
    if (totalTableWidth < minWidthForTable) {
      setExtraColumnWidth(((minWidthForTable - totalTableWidth) / minWidthForTable) * 100);
      totalTableWidth = minWidthForTable
    } else {
      setExtraColumnWidth(0);
    }
    // console.log(document.getElementById("asc-custom-table").style)
    document.getElementById("asc-custom-table").style.width = totalTableWidth.toString() + 'px';

    let colWidthsInPercentage = [];
    colWidths.map((colWidth) => {
      colWidthsInPercentage.push((colWidth / totalTableWidth) * 100)
    })

    // console.log(colWidthsInPercentage, colWidths, totalTableWidth)


    // console.log(colWidths)
    setColumnsWidth(colWidths);
    setColumnsWidthInPer(colWidthsInPercentage);

    setIsMouseDown(false);
    setResizingColumnIndex(-1)
    setResizerStartPos(0);
  }

  let totalLength = dataList === null ? 0 : dataList.length;

  return (
    <div className="asc-custom-table-wrapper" ref={scrollRef} onScroll={handleScroll} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      {/* <div className="asc-custom-table-wrapper"> */}
      <table id="asc-custom-table" className="asc-custom-table">
        <thead>
          <tr key="row0">
            {dataArray[0].map((col, i) => {
              return (
                <th style={{ "width": columnsWidthInPer.length !== 0 ? columnsWidthInPer[i].toString() + "%" : "150px", "minWidth": columnsMinWidth.length !== 0 ? columnsMinWidth[i].toString() + 'px' : "100px" }} key={`${col.colKey}${i}`} id={`col-head-${i}`} className={`col-head col ${col.nameForClass}`} onClick={() => {/*onColumnSort(col.colKey)*/}}>
                  {col.content}
                  <div className="col-resize-handle" title="Drag to resize"
                    onMouseDown={(e) => handleMouseDown(e, i)}
                    >
                    {/* *Below empty div shows the resize handler on hover. But should also be forced visible(by setting style property) if current column is being resized */}
                    <div style={{ display: resizingColumnIndex === i ? 'block' : '' }}></div>
                  </div>
                </th>
              )
            })}
            {extraColumnWidth !== 0 && <th style={{ "width": extraColumnWidth.toString() + '%' }}><span className="bg"></span></th>}
          </tr>
        </thead>
        <tbody>
          {dataArray.map((row, i) => {
            if (i === 0) {
              return <></>
            } else {
              return (<tr key={`row${i}`} data-num={i} valign="top">
                {row.map((col, j) => {
                  return (<td key={`row${i}-col${j}`} className={col.nameForClass}>
                    {col.content}
                  </td>)
                })}
                {extraColumnWidth !== 0 && <td></td>}
              </tr>)
            }
          })}
          {totalLength < 9 && (<>
            {dashbaordListToShow.map((d, i) => (
              <tr key={`row${i}`} data-num={i} valign="top">
                {columns.map((col, j) => (
                  <td key={`row${i}-${col.accessor}${j}`} className='col'></td>
                ))}
                {extraColumnWidth !== 0 && <td></td>}
              </tr>))}
          </>)}
        </tbody>
      </table>

      <div id="hover-line" className="hover-line" style={{ 'display': isMouseDown ? 'block' : 'none','left': hoverLinePosition.left }}></div>
      {inprocess && <div className="table-overlay-loading"> <h1>Loading ...</h1></div>}
    </div>
  );
};

export default TableComponent;