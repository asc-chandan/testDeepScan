import React, { Component } from 'react';

import '../../../styles/AnalysisViews.scss';
import LoaderbyData from '../../../components/LoaderbyData/LoaderbyData.js';
import Loader2 from '../../../components/Loader2.js';
import ClickOutsideListner from '../../../components/ClickOutsideListner.js';
import { covertUnderscoreToSpaceInString } from '../../../utils/Common';
import TableComponent from '../../../components/table/TableComponent';

class DataGridHomeTable extends Component {
  constructor(props) {
    super(props);

    this.scrollRef = React.createRef();

    this.state = {
      openeDownloadOptionsRowId: null, // stores the index for analysis for which download popup is opened
    };
  }


  componentDidMount() {
  }

  componentDidUpdate(prev_props) {
  }

  componentWillUnmount() {
  }


  render() {
    const columns = [
      { displayName: 'File Name', accessor: 'name' },
      { displayName: 'Data Source', accessor: 'view_type' },
      { displayName: 'Created By', accessor: 'user_name' },
      { displayName: 'Modified', accessor: 'updated_on' },
      { displayName: 'Actions', accessor: 'actions' }
    ];

    const { inprocess, anaylsisList, userId, downloadingAnalysisId, deletingAnalysisId, bookmarkingAnalysisId,
      onAnalysisClick, onAnalysisEdit, onAnalysisDownload, onAnalysisDelete, onAnalysisBookmark } = this.props;

    //return  null when no records are available
    // if (!inprocess && (!anaylsisList || (anaylsisList && !anaylsisList.length))) {
    //   return null;
    // }
    if (anaylsisList === null) {
      return null;
    }
    
    if (inprocess && !anaylsisList) {
      return (
        <div className="home-table">
          <LoaderbyData />
        </div>
      )
    } else {
      let dashbaordListToShow = [];
      let totalLength = anaylsisList === null ? 0 : anaylsisList.length;

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
        content = <>
          <span className="bg"></span>
          {col.displayName}
        </>
        let colKey = col.accessor
        let nameForClass = '';
        data = {
          content,
          nameForClass,
          colKey
        };
        dataRow.push(data);
      })

      dataArray.push(dataRow);
      dataRow = [];

      anaylsisList.map((row, i) => {
        const canEdit = row.privileges.includes('EDIT');
        const canDelete = row.privileges.includes('DELETE');
        const canShare = row.privileges.includes('SHARE');
        
        columns.map((col, j) => {
          if (col.accessor === 'name') {
            content = <button className="btn-link icon-folder" onClick={() => onAnalysisClick(row.id)} >{row[col.accessor]}</button>;
          } else if (col.accessor === 'user_name') {
            const isShared = row.user_id !== userId;
            content = <span className="text">{covertUnderscoreToSpaceInString(row[col.accessor] || '')}{isShared ? ' • Shared with you' : ''}</span>;
          } else if (col.accessor === 'actions') {
            const disableButtons = deletingAnalysisId || downloadingAnalysisId || bookmarkingAnalysisId;
            
            content = (
              // <div className="action-buttons-wrapper">
              <div className="recent-action">

                {(this.state.openeDownloadOptionsRowId === row.id && downloadingAnalysisId !== row.id) &&
                  <ClickOutsideListner onOutsideClick={() => this.setState({ openeDownloadOptionsRowId: null })} className="outside-listener">
                    <div className="download-options-wrapper">
                      <ul>
                        <li onClick={(e) => onAnalysisDownload(row.id, 'saved_format')}>Saved Format</li>
                        <li onClick={(e) => onAnalysisDownload(row.id, 'unfiltered_data')}>Unfiltered Data</li>
                      </ul>
                    </div>
                  </ClickOutsideListner>
                }

                {canShare && <button className={'btn-share' + (disableButtons ? ' disable' : '')} onClick={() => { }} title="Share"></button>}

                {/* <button className={'btn-download' + (disableButtons ? ' disabled' : '')} onClick={() => this.setState({ openeDownloadOptionsRowId: row.id })} title="Download"></button> */}

                <div className="download-button-wrapper">
                  {downloadingAnalysisId !== row.id &&
                    <button className={'btn-download' + (disableButtons ? ' disable' : '')} onClick={() => this.setState({ openeDownloadOptionsRowId: row.id })} title="Download"></button>
                  }
                  {downloadingAnalysisId === row.id &&
                    <Loader2 />
                  }
                </div>
                
                <button className={'btn-schedule'+ (disableButtons ? ' disable' : '')} onClick={() => { }} title="Schedule"></button>
                {canEdit && <button className={'xs btn-edit'+ (disableButtons ? ' disable' : '')} onClick={() => onAnalysisEdit(row.id)} title="Schedule"></button>}
                {/* {canDelete && (!deletingAnalysisId || (deletingAnalysisId && row.id !== deletingAnalysisId)) && <button className={'btn-delete' + (disableButtons ? ' disabled' : '')} onClick={() => onAnalysisDelete(row.id)}></button>} */}
                {canDelete &&
                  <div className="delete-button-wrapper">
                    {deletingAnalysisId !== row.id &&
                      <button className={'btn-delete'+ (disableButtons ? ' disable' : '')} onClick={() => onAnalysisDelete(row.id)} title="Delete"></button>
                    }
                    {deletingAnalysisId === row.id &&
                      <Loader2 />
                    }
                  </div>
                }
                <>
                  {bookmarkingAnalysisId !== row.id &&
                    <button  className={'btn-bookmark'+(row.is_bookmark === 1?' bookmarked':'') +(disableButtons ? ' disable' : '')} onClick={() => onAnalysisBookmark(row.id)} title="Bookmark"></button>
                  }
                  {bookmarkingAnalysisId === row.id &&
                    <Loader2 />
                  }
                </>
              </div>
            );
          } else {
            content = row[col.accessor];
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
          dataList={anaylsisList}
          paginationInfo={this.props.savedAnalysisPaginationInfo}
          scrollAPICall={this.props.analysisAPICall}
          that={this.props.that}
          dashbaordListToShow={dashbaordListToShow}
        />
      </div>
      );
    }

  //   let dashbaordListToShow = [];
  // let totalLength = anaylsisList === null ? 0 : anaylsisList.length;

  // if (totalLength < 9) {
  //   for(var i = 0; i < 9 - totalLength ; i += 1) {
  //     dashbaordListToShow.push({})
  //   }
  // }


    // return (
    //   <div className="datagrid-home-table">
    //     <div className="table-wrapper" ref={this.scrollRef} onScroll={this.handleScroll}>
    //       <table className="custom-table">
    //         <thead>
    //           <tr >
    //             {columns.map((col) => {
    //               return (
    //                 <th key={col.accessor}>
    //                   <span className="bg"></span>
    //                   {col.displayName}
    //                 </th>
    //               );
    //             })}
    //           </tr>
    //         </thead>

    //         <tbody>
    //           {anaylsisList.map((row, i) => {
    //             const canEdit = row.privileges.includes('EDIT');
    //             const canDelete = row.privileges.includes('DELETE');
    //             const canShare = row.privileges.includes('SHARE');
    //             return (
    //               <tr key={i}>
    //                 {columns.map((col, j) => {
    //                   let content;

    //                   if (col.accessor === 'name') {
    //                     content = <button className="btn-link icon-folder" onClick={() => onAnalysisClick(row.id)} >{row[col.accessor]}</button>;
    //                   } else if (col.accessor === 'user_name') {
    //                     const isShared = row.user_id !== userId;
    //                     content = <span className="text">{covertUnderscoreToSpaceInString(row[col.accessor] || '')}{isShared ? ' • Shared with you' : ''}</span>;
    //                   } else if (col.accessor === 'actions') {
    //                     const disableButtons = deletingAnalysisId || downloadingAnalysisId || bookmarkingAnalysisId;
                        
    //                     content = (
    //                       <div className="action-buttons-wrapper">
    //                         {canShare && <button className={'btn outline xs btn-share'+ (disableButtons ? ' disable' : '')} onClick={() => { }} title="Share">Share</button>}

    //                         <div className="download-button-wrapper">
    //                           {downloadingAnalysisId !== row.id &&
    //                             <button className={'btn outline xs btn-download'+ (disableButtons ? ' disable' : '')} onClick={() => this.setState({ openeDownloadOptionsRowId: row.id })} title="Download">Download</button>
    //                           }
    //                           {downloadingAnalysisId === row.id &&
    //                             <Loader2 />
    //                           }
    //                         </div>

    //                         {(this.state.openeDownloadOptionsRowId === row.id && downloadingAnalysisId !== row.id) &&
    //                           <ClickOutsideListner onOutsideClick={() => this.setState({ openeDownloadOptionsRowId: null })} className="outside-listener">
    //                             <div className="download-options-wrapper">
    //                               <ul>
    //                                 <li onClick={(e) => onAnalysisDownload(row.id, 'saved_format')}>Saved Format</li>
    //                                 <li onClick={(e) => onAnalysisDownload(row.id, 'unfiltered_data')}>Unfiltered Data</li>
    //                               </ul>
    //                             </div>
    //                           </ClickOutsideListner>
    //                         }
    //                         <button className={'btn outline xs btn-schedule'+ (disableButtons ? ' disable' : '')} onClick={() => { }} title="Schedule">Schedule</button>
    //                         {canEdit && <button className={'btn outline xs btn-edit'+ (disableButtons ? ' disable' : '')} onClick={() => onAnalysisEdit(row.id)} title="Schedule">Edit</button>}
    //                         {canDelete &&
    //                           <div className="delete-button-wrapper">
    //                             {deletingAnalysisId !== row.id &&
    //                               <button className={'btn outline xs btn-delete'+ (disableButtons ? ' disable' : '')} onClick={() => onAnalysisDelete(row.id)} title="Delete">delete</button>
    //                             }
    //                             {deletingAnalysisId === row.id &&
    //                               <Loader2 />
    //                             }
    //                           </div>
    //                         }
    //                         <>
    //                           {bookmarkingAnalysisId !== row.id &&
    //                             <button  className={'btn outline xs btn-bookmark'+(row.is_bookmark === 1?' bookmarked':'') +(disableButtons ? ' disable' : '')} onClick={() => onAnalysisBookmark(row.id)} title="Bookmark"></button>
    //                           }
    //                           {bookmarkingAnalysisId === row.id &&
    //                             <Loader2 />
    //                           }
    //                         </>
    //                       </div>
    //                     );
    //                   } else {
    //                     content = row[col.accessor];
    //                   }

    //                   return (
    //                     <td key={j} className={'col ' + col.accessor}>
    //                       {content}
    //                     </td>
    //                   )
    //                 })}
    //               </tr>
    //             )
    //           })}

    //           {totalLength < 9 && (<>
    //             {dashbaordListToShow.map((d, i) => {
    //               return (
    //               <tr key={i}>
    //                 {columns.map((col, j) => (
    //                   <td className='col'></td>
    //                 ))}
    //               </tr>)})}
    //           </>)}

    //           {/* {anaylsisList.length === 0 &&
    //             <tr><td colSpan={columns.length}>No Data Available</td></tr>
    //           } */}
    //         </tbody>
    //       </table>

    //       {inprocess && <div className="table-overlay-loading"> <h1>Loading ...</h1></div>}
    //     </div>

    //   </div>
    // );
  }
}

export default DataGridHomeTable;
