import React, { useState, useRef, useEffect } from 'react';
import LoaderbyData from '../../../components/LoaderbyData/LoaderbyData.js';
import '../../../styles/TrendMasterHomeTable.scss';
import { covertUnderscoreToSpaceInString } from '../../../utils/Common';

export default function TrendMasterHomeTable({
  inprocess, userId, deletingDashboardId, copyingDashboardId, bookmarkingDashboardId,
  dashboardList, dashboardPaginationInfo, dashboardAPICall, that, onRowClick, onRowEditClick, onRowDeleteClick, onRowCopyClick, onRowShareClick, onRowBookmarkClick,
  sortedColumnInfo, onColumnSort
}) {
  const columns = [
    { accessor: 'dashboard_name', display_name: 'Dashboard' },
    // { accessor: 'dashboard_description', display_name: 'Description' },
    { accessor: 'user_name', display_name: 'Created By' },
    { accessor: 'updated_on', display_name: 'Modified' },
    { accessor: 'actions', display_name: 'Actions' },
  ];

  const [visibleDescriptionDashboardIds, setVisibleDescriptionDashboardIds] = useState([]);
  // const [hoverLinePosition, setHoverLinePosition] = useState({})
  // const [isMouseDown, setIsMouseDown] = useState(false);
  // const [resizingColumnIndex, setResizingColumnIndex] = useState(-1);
  // const [columnsWidth, setColumnsWidth] = useState([])
  const scrollRef = useRef();

  const handleDescriptionBtnClick = (dId) => {
    const updatedList = visibleDescriptionDashboardIds.includes(dId) ? visibleDescriptionDashboardIds.filter(id => id !== dId) : [...visibleDescriptionDashboardIds, dId]
    setVisibleDescriptionDashboardIds(updatedList);
  };

  // useEffect(() => {
  //   console.log('here')
  //   let left = 0;
  //   let height = 0;// document.getElementsByClassName("trendmaster-home-table")[0].offsetHeight
  //   // console.log(document.getElementsByClassName("trendmaster-home-table")[0]);
  //   setHoverLinePosition({
  //     left,
  //     height
  //   });
  // }, []);

  const handleScroll = () => {
    if (dashboardList !== null && dashboardPaginationInfo.totalResultsCount !== dashboardList.length && !inprocess) {
      // if (dashboardList !== null && !inprocess) {
      let pointToCallApi = scrollRef.current.scrollHeight - (document.documentElement.offsetHeight - (scrollRef.current.offsetTop + 60))
      if (scrollRef.current.scrollTop === pointToCallApi) {
        dashboardAPICall(100, dashboardPaginationInfo.currentPage + 1, that);
      }
    }
  }

  // const handleMouseDown = (e, index) => {
  //   // console.log('here', e.screenX)
  //   let left, height;
  //   height = document.getElementsByClassName("trendmaster-home-table")[0].offsetHeight;
  //   left = e.screenX-150;
  //   setHoverLinePosition({
  //     left,
  //     height
  //   })
  //   setIsMouseDown(true);
  //   setResizingColumnIndex(index);
  // }

  // const handleMouseMove = (e) => {
  //   if (isMouseDown) {
  //     let left = e.screenX-150;
  //     setHoverLinePosition({ ...hoverLinePosition, left });
  //   }
  // }

  // const handleMouseUp = (e) => {
  //   setIsMouseDown(false);
  //   setResizingColumnIndex(-1)
  // }

  // //return  null when no records are available
  // if (!inprocess && (!dashboardList || (dashboardList && !dashboardList.length))) {
  //   return null;
  // }
  if (dashboardList === null) {
    return null;
  }

  if (inprocess && !dashboardList) {
    return (
      <div className="trendmaster-home-table">
        <LoaderbyData />;
      </div>
    )
  };

  let dashbaordListToShow = [];
  let totalLength = dashboardList === null ? 0 : dashboardList.length;

  if (totalLength < 9) {
    for(var i = 0; i < 9 - totalLength ; i += 1) {
      dashbaordListToShow.push({})
    }
  }

  return (
    <div className="trendmaster-home-table">
      {/* <div className="asc-custom-table-wrapper" ref={scrollRef} onScroll={handleScroll} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}> */}
      <div className="asc-custom-table-wrapper" ref={scrollRef} onScroll={handleScroll}>
        <table className="asc-custom-table">
          <thead>
            <tr>
              {columns.map((col, i) => {
                const sortClassname = sortedColumnInfo && sortedColumnInfo.name === col.accessor ? sortedColumnInfo.isAscending ? 'sort_asc' : 'sort_desc' : '';
                return (
                  <th key={col.accessor} id={`col-head-${i}`} className={`col ${col.accessor}${sortClassname ? ' ' + sortClassname : ''}`} onClick={()=>onColumnSort(col.accessor)}>
                  {/* // <th key={col.accessor} id={`col-head-${i}`} className={`col ${col.accessor}${sortClassname ? ' ' + sortClassname : ''}`} onClick={()=>//onColumnSort(col.accessor)//}> */}

                    <span className="text">{col.display_name}</span>
                    <span className="bg"></span>
                    {/* <div className="col-resize-handle" title="Drag to resize" */}
                      {/* // onMouseDown={(e) => handleMouseDown(e, i)}> */}
                      {/**Below empty div shows the resize handler on hover. But should also be forced visible(by setting style property) if current column is being resized */}
                      {/* <div style={{ display: resizingColumnIndex === i ? 'block' : '' }}></div> */}
                    {/* </div>; */}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {dashboardList.map((item, i) => {
              const canEdit = item.privileges.includes('EDIT');
              const canDelete = item.privileges.includes('DELETE');
              const canShare = item.privileges.includes('SHARE');
              return (
                <tr key={i} data-num={i} valign="top">
                  {columns.map((col, j) => {

                    let content;
                    if (col.accessor === 'dashboard_name') {
                      const showDescription = visibleDescriptionDashboardIds.includes(item.id);
                      content = <>
                        <div className="home-table-desc">
                          <span onClick={() => onRowClick(item.id)} className="text dashboard-name"> {item[col.accessor]}  </span>
                          {item.dashboard_description.trim() !== '' && <span className="dashboard-desc-btn" onClick={() => handleDescriptionBtnClick(item.id)}>Description</span>}
                        </div>
                        {showDescription && <p className="text dashboard-desc">{item.dashboard_description}</p>}
                      </>;
                    } else if (col.accessor === 'user_name') {
                      const isShared = item.user_id !== userId && item.user_id.length !== 0;
                      content = <span className="text">{covertUnderscoreToSpaceInString(item[col.accessor] || '')}{isShared ? ' • Shared with you' : ''}</span>;
                    } else if (col.accessor === 'actions'){
                      const disableButtons = deletingDashboardId || copyingDashboardId || bookmarkingDashboardId;
                      content = <div className="recent-action">
                        <button className={'btn-download' + (disableButtons ? ' disabled' : '')}></button>
                        {canShare && <button className={'btn-share' + (disableButtons ? ' disabled' : '')} onClick={() => onRowShareClick(item.id)}></button>}
                        <button className={'btn-schedule' + (disableButtons ? ' disabled' : '')}></button>
                        {(!copyingDashboardId || (copyingDashboardId && item.id !== copyingDashboardId)) && <button className={'btn-copy' + (disableButtons ? ' disabled' : '')} onClick={() => onRowCopyClick(item.id)}></button>}
                        {canEdit && <button className={'btn-edit' + (disableButtons ? ' disabled' : '')} onClick={() => onRowEditClick(item.id)}></button>}
                        {canDelete && (!deletingDashboardId || (deletingDashboardId && item.id !== deletingDashboardId)) && <button className={'btn-delete' + (disableButtons ? ' disabled' : '')} onClick={() => onRowDeleteClick(item.id)}></button>}
                        {deletingDashboardId && item.id === deletingDashboardId && <span className="loading"></span>}
                        {copyingDashboardId && item.id === copyingDashboardId && <span className="loading"></span>}
                        {bookmarkingDashboardId !== item.id &&
                          <button className={'btn-bookmark' + (item.is_bookmark ? ' bookmarked' : '') + (disableButtons ? ' disable' : '')} onClick={() => onRowBookmarkClick(item.id)}></button>
                        }
                        {bookmarkingDashboardId === item.id &&
                          <span className="loading"></span>
                        }
                      </div>;
                    } else {
                      content = <span className="text">{item[col.accessor]}</span>;
                    }

                    return (
                      <td key={j} className={'col ' + col.accessor}>
                        {content}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
            {totalLength < 9 && (<>
              {dashbaordListToShow.map((d, i) => (
              <tr key={i} data-num={i} valign="top">
                {columns.map((col, j) => (
                  <td key={col.accessor} className='col'></td>
                ))}
              </tr>))}
            </>)}
            {/* {dashboardList.length === 0 &&
              <tr valign="top">
                {columns.map((item) => {
                  return <td className="no-data">&nbsp;</td>
                })}
              </tr>
            } */}
          </tbody>
        </table>

        {/* <div id="hover-line" className="hover-line" style={{ 'position': 'absolute', 'top': '0px', 'left': hoverLinePosition.left ,'width': '2px', 'height': hoverLinePosition.height, 'backgroundColor': 'blue' }}></div> */}

        {inprocess && <div className="table-overlay-loading"> <h1>Loading ...</h1></div>}
      </div>
    </div>
  );

}


