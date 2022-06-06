import React, { useState } from 'react';
import LoaderbyData from '../../../components/LoaderbyData/LoaderbyData.js';
import '../../../styles/TrendMasterHomeTable.scss';
import { covertUnderscoreToSpaceInString } from '../../../utils/Common';
import TableComponent from '../../../components/table/TableComponent.js';

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

  const handleDescriptionBtnClick = (dId) => {
    const updatedList = visibleDescriptionDashboardIds.includes(dId) ? visibleDescriptionDashboardIds.filter(id => id !== dId) : [...visibleDescriptionDashboardIds, dId]
    setVisibleDescriptionDashboardIds(updatedList);
  };

  // //return  null when no records are available
  // if (!inprocess && (!dashboardList || (dashboardList && !dashboardList.length))) {
  //   return null;
  // }
  if (dashboardList === null) {
    return null;
  }

  if (inprocess && !dashboardList) {
    return (
      <div className="home-table">
        <LoaderbyData />;
      </div>
    )
  } else {
    let dashbaordListToShow = [];
    let totalLength = dashboardList === null ? 0 : dashboardList.length;

    if (totalLength < 9) {
      for (var i = 0; i < 9 - totalLength; i += 1) {
        dashbaordListToShow.push({})
      }
    }
    let dataArray = [];
    let dataRow = [];
    let data = {};
    let content;
    columns.map((col, i) => {
      const sortClassname = sortedColumnInfo && sortedColumnInfo.name === col.accessor ? sortedColumnInfo.isAscending ? 'sort_asc' : 'sort_desc' : '';
      content = <>
        <span className="text">{col.display_name}</span>
        <span className="bg"></span>
      </>
      let nameForClass = `${col.accessor}${sortClassname ? ' ' + sortClassname : ''}`;
      let colKey = col.accessor;
      data = {
        content,
        nameForClass,
        colKey
      }
      dataRow.push(data);
    })
    dataArray.push(dataRow);
    dataRow = [];

    

    dashboardList.map((item, i) => {
      const canEdit = item.privileges.includes('EDIT');
      const canDelete = item.privileges.includes('DELETE');
      const canShare = item.privileges.includes('SHARE');

      columns.map((col, j) => {
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
          content = <div><span className="text">{covertUnderscoreToSpaceInString(item[col.accessor] || '')}{isShared ? ' • Shared with you' : ''}</span></div>;
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
          content = <div><span className="text">{item[col.accessor]}</span></div>;
        }
        let nameForClass = 'col ' + col.accessor;
        data = {
          content,
          nameForClass
        }
        dataRow.push(data);
      })
      dataArray.push(dataRow);
      dataRow = [];
    })
    return (
      <div className="home-table">
        <TableComponent
          inprocess={inprocess}
          columns={columns}
          dataArray={dataArray}
          dataList={dashboardList}
          paginationInfo={dashboardPaginationInfo}
          scrollAPICall={dashboardAPICall}
          that={that}
          dashbaordListToShow={dashbaordListToShow}
          onColumnSort={onColumnSort}
        />
      </div>
    );
  }

  // let dashbaordListToShow = [];
  // let totalLength = dashboardList === null ? 0 : dashboardList.length;

  // if (totalLength < 9) {
  //   for(var i = 0; i < 9 - totalLength ; i += 1) {
  //     dashbaordListToShow.push({})
  //   }
  // }

  // return (
  //   <div className="trendmaster-home-table">
  //     <div className="asc-custom-table-wrapper" ref={scrollRef} onScroll={handleScroll} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
  //     {/* <div className="asc-custom-table-wrapper" ref={scrollRef} onScroll={handleScroll}> */}
  //       <table id="asc-custom-table" className="asc-custom-table">
  //         <thead>
  //           <tr>
  //             {columns.map((col, i) => {
  //               const sortClassname = sortedColumnInfo && sortedColumnInfo.name === col.accessor ? sortedColumnInfo.isAscending ? 'sort_asc' : 'sort_desc' : '';
  //               return (
  //                 // <th key={col.accessor} id={`col-head-${i}`} className={`col ${col.accessor}${sortClassname ? ' ' + sortClassname : ''}`} onClick={()=>onColumnSort(col.accessor)}>
  //                 <th style={{"width": columnsWidthInPer.length !== 0 ? columnsWidthInPer[i].toString()+"%" : "150px", "min-width": columnsMinWidth.length !== 0 ? columnsMinWidth[i].toString()+'px' : "100px"}} key={col.accessor} id={`col-head-${i}`} className={`col-head col ${col.accessor}${sortClassname ? ' ' + sortClassname : ''}`} onClick={()=>onColumnSort(col.accessor)}>

  //                   <span className="text">{col.display_name}</span>
  //                   <span className="bg"></span>
  //                   <div className="col-resize-handle" title="Drag to resize"
  //                     onMouseDown={(e) => handleMouseDown(e, i)}>
  //                     {/* *Below empty div shows the resize handler on hover. But should also be forced visible(by setting style property) if current column is being resized */}
  //                     <div style={{ display: resizingColumnIndex === i ? 'block' : '' }}></div>
  //                   </div>
  //                 </th>
  //               );
  //             })}
  //             {extraColumnWidth !== 0 && <th style={{"width": extraColumnWidth.toString()+'%'}}><span className="bg"></span></th>}
  //           </tr>
  //         </thead>

  //         <tbody>
  //           {dashboardList.map((item, i) => {
  //             const canEdit = item.privileges.includes('EDIT');
  //             const canDelete = item.privileges.includes('DELETE');
  //             const canShare = item.privileges.includes('SHARE');
  //             return (
  //               <tr key={i} data-num={i} valign="top">
  //                 {columns.map((col, j) => {

  //                   let content;
  //                   if (col.accessor === 'dashboard_name') {
  //                     const showDescription = visibleDescriptionDashboardIds.includes(item.id);
  //                     content = <>
  //                       <div className="home-table-desc">
  //                         <span onClick={() => onRowClick(item.id)} className="text dashboard-name"> {item[col.accessor]}  </span>
  //                         {item.dashboard_description.trim() !== '' && <span className="dashboard-desc-btn" onClick={() => handleDescriptionBtnClick(item.id)}>Description</span>}
  //                       </div>
  //                       {showDescription && <p className="text dashboard-desc">{item.dashboard_description}</p>}
  //                     </>;
  //                   } else if (col.accessor === 'user_name') {
  //                     const isShared = item.user_id !== userId && item.user_id.length !== 0;
  //                     content = <div><span className="text">{covertUnderscoreToSpaceInString(item[col.accessor] || '')}{isShared ? ' • Shared with you' : ''}</span></div>;
  //                   } else if (col.accessor === 'actions'){
  //                     const disableButtons = deletingDashboardId || copyingDashboardId || bookmarkingDashboardId;
  //                     content = <div className="recent-action">
  //                       <button className={'btn-download' + (disableButtons ? ' disabled' : '')}></button>
  //                       {canShare && <button className={'btn-share' + (disableButtons ? ' disabled' : '')} onClick={() => onRowShareClick(item.id)}></button>}
  //                       <button className={'btn-schedule' + (disableButtons ? ' disabled' : '')}></button>
  //                       {(!copyingDashboardId || (copyingDashboardId && item.id !== copyingDashboardId)) && <button className={'btn-copy' + (disableButtons ? ' disabled' : '')} onClick={() => onRowCopyClick(item.id)}></button>}
  //                       {canEdit && <button className={'btn-edit' + (disableButtons ? ' disabled' : '')} onClick={() => onRowEditClick(item.id)}></button>}
  //                       {canDelete && (!deletingDashboardId || (deletingDashboardId && item.id !== deletingDashboardId)) && <button className={'btn-delete' + (disableButtons ? ' disabled' : '')} onClick={() => onRowDeleteClick(item.id)}></button>}
  //                       {deletingDashboardId && item.id === deletingDashboardId && <span className="loading"></span>}
  //                       {copyingDashboardId && item.id === copyingDashboardId && <span className="loading"></span>}
  //                       {bookmarkingDashboardId !== item.id &&
  //                         <button className={'btn-bookmark' + (item.is_bookmark ? ' bookmarked' : '') + (disableButtons ? ' disable' : '')} onClick={() => onRowBookmarkClick(item.id)}></button>
  //                       }
  //                       {bookmarkingDashboardId === item.id &&
  //                         <span className="loading"></span>
  //                       }
  //                     </div>;
  //                   } else {
  //                     content = <div><span className="text">{item[col.accessor]}</span></div>;
  //                   }

  //                   return (
  //                     <td key={j} className={'col ' + col.accessor}>
  //                       {content}
  //                     </td>
  //                   )
  //                 })}
  //                 {extraColumnWidth !== 0 && <td></td>}
  //               </tr>
  //             )
  //           })}
  //           {totalLength < 9 && (<>
  //             {dashbaordListToShow.map((d, i) => (
  //             <tr key={i} data-num={i} valign="top">
  //               {columns.map((col, j) => (
  //                 <td key={col.accessor} className='col'></td>
  //               ))}
  //             </tr>))}
  //           </>)}
  //           {/* {dashboardList.length === 0 &&
  //             <tr valign="top">
  //               {columns.map((item) => {
  //                 return <td className="no-data">&nbsp;</td>
  //               })}
  //             </tr>
  //           } */}
  //         </tbody>
  //       </table>

  //       <div id="hover-line" className="hover-line" style={{ 'display': isMouseDown ? 'block' : 'none','left': hoverLinePosition.left }}></div>

  //       {inprocess && <div className="table-overlay-loading"> <h1>Loading ...</h1></div>}
  //     </div>
  //   </div>
  // );

}


