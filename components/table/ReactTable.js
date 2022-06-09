import React, { useState } from 'react';
import { useTable } from 'react-table';
import * as Constants from '../Constants.js';
import ClickOutsideListner from '../ClickOutsideListner';
import Loader2 from '../Loader2';

function Table({ columns, data, props }) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow
  } = useTable({ columns, data });

  const [toggleOptionIndex, setToggleOptionIndex] = useState(null);

  //Load saved view on click of view button
  function handleViewLoad(reportUrl, reportData) {
    if (props.history !== undefined) {
      props.history.push(reportUrl, {
        isSavedView: true,
        savedReportData : reportData
      })

    }
  }

  //Return view id to parent component to remove saved view
  function handleViewDelete(event) {
    props.onViewDelete(event.target.dataset.id);
  }

  function handleToggleDownloadOptions(event, index) {
    setToggleOptionIndex(index);
  }

  function handleDownload(event, index, type) {
    props.onViewDownload(index, type);
    setToggleOptionIndex(null);
    return false;
  }


  // Render Data Table UI
  return (
    <table {...getTableProps()} className="custom-table">
      <thead>
        {headerGroups.map((headerGroup, i) => (
          <tr key={i} {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              <th key={column} {...column.getHeaderProps()}><span className="bg"></span>{column.render('Header')}</th>
            ))}
          </tr>
        ))}
      </thead>

      <tbody {...getTableBodyProps()}>
        {rows.map((row, i) => {
          prepareRow(row);
          return (
            <tr key={i} {...row.getRowProps()}>
              {row.cells.map((cell) => {
                let view_type = row.cells[1]['value'];
                const reportUrl = '/' + props.terminal_type + '/datagrid/analysis/' + view_type;
                if (cell.column.id == 'name') {
                  return (<td key={cell.column.id} {...cell.getCellProps()}>
                    <button className="btn-link icon-folder"
                      onClick={() => handleViewLoad(reportUrl, cell.row.original)} title="View">{cell.row.original.name}</button>
                  </td>)
                } else {
                  return (
                    <td key={cell.column.id} {...cell.getCellProps()}>
                      {cell.render('Cell')}

                      {/* Used for Analysis View Home Page Only */}
                      {cell.column.id === 'action' &&
                        <div className="action-buttons-wrapper">
                          <button className="btn outline xs btn-share" data-title={cell.row.original.name} data-url={'/' + props.terminal_type + '/datagrid/analysis/' + view_type} data-period={cell.row.original.dynamic_time_period} data-config={cell.row.original.config} onClick={handleViewLoad} title="Share">Share</button>

                          <div className="download-button-wrapper">
                            {(props.download_inprocess !== i) &&
                              <button className="btn outline xs btn-download" data-title={cell.row.original.name} data-url={Constants.API_BASE_URL + '/download/' + cell.row.original.id} onClick={(e) => handleToggleDownloadOptions(e, i)} title="Download">Download</button>
                            }
                            {(props.download_inprocess === i) &&
                              <Loader2 />
                            }
                          </div>

                          {(toggleOptionIndex === i && props.download_inprocess !== i) &&
                            <ClickOutsideListner onOutsideClick={() => setToggleOptionIndex(null)} className="outside-listener">
                              <div className="download-options-wrapper">
                                <ul>
                                  <li onClick={(e) => handleDownload(e, i, 'saved_format')}>Saved Format</li>
                                  <li onClick={(e) => handleDownload(e, i, 'unfiltered_data')}>Unfiltered Data</li>
                                </ul>
                              </div>
                            </ClickOutsideListner>
                          }
                          <button className="btn outline xs btn-schedule" data-title={cell.row.original.name} data-url={'/' + props.terminal_type + '/datagrid/analysis/' + view_type} data-period={cell.row.original.dynamic_time_period} data-config={cell.row.original.config} onClick={handleViewLoad} title="Schedule">Schedule</button>
                          <button className="btn outline xs btn-delete" data-id={cell.row.original.id} onClick={handleViewDelete} title="Delete">delete</button>
                        </div>
                      }
                    </td>
                  )
                }
              })}
            </tr>
          )
        })}

        {rows.length <= 0 &&
          <tr><td colSpan={props.columns.length}>No Data Available</td></tr>
        }
      </tbody>
    </table>
  )
}

const ReactTable = (props) => {
  if (!props.data) return;

  return (
    <div className="table-wrapper">
      <Table data={props.data} columns={props.columns} client={props.client} props={props} />
    </div>
  )
}

export default ReactTable;