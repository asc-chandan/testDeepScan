import React, { useState } from 'react';
import {useTable} from 'react-table';

function Table({columns, data, client, props}) {
  const {
    getTableProps, 
    getTableBodyProps, 
    headerGroups, 
    rows, 
    prepareRow
  } = useTable({columns, data});

  //Load Report on View button click
  function handleReportLoad(event){
    if(props.history !== undefined){
      props.history.push(event.target.dataset.url)
    }
  }


  // Render Data Table UI
  return (
    <table {...getTableProps()} className="custom-table">
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column,i) => {
              return <th key={column.id} {...column.getHeaderProps()}><span className="bg"></span>{column.render('Header')}</th>
            })}
          </tr>
        ))}
      </thead>
              
      <tbody {...getTableBodyProps()}>
        {rows.map((row, i) => {
          prepareRow(row);
          
          let highlight_class = ( (row.values.VIEW==='VIDEO' && row.values.Metric==='VIDEO') || (row.values.VIEW==='DISPLAY' && row.values.Metric==='DISPLAY') ) ? 'highlighted' : '';

          return (
            <tr className={highlight_class} {...row.getRowProps()}>
              {row.cells.map(cell => {
                return (
                  <td {...cell.getCellProps()}>
                    {cell.column.id!=='action' &&
                      cell.render('Cell')
                    }
                    {cell.column.id==='action' &&
                      <div className="action-buttons-wrapper">
                        <button className="btn outline xs btn-view" data-title={cell.row.original.name} data-url={cell.row.original.url} onClick={handleReportLoad} title={cell.row.original.name}>View</button>
                      </div>
                    }
                  </td>
                )
              })}
            </tr>
          )
        })}

        {rows.length <= 0 &&
          <tr><td colSpan={columns.length}>No Data Available</td></tr>
        }
      </tbody>
    </table>
  )
}

const DefaultReactTable = (props) => {
  if(!props.data) return;

  return (
    <div className="table-wrapper">
      {/* <Table {...props} /> */}
      <Table data={props.data} columns={props.columns} client={props.client} props={props} />
    </div>
  )
}

export default DefaultReactTable;