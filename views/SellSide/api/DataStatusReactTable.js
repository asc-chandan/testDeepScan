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
          
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map(cell => {
                return (
                  <td {...cell.getCellProps()}>
                    { cell.render('Cell') }
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

const CustomReportReactTable = (props) => {
  if(!props.data) return;

  return (
    <div className="table-wrapper">
      {/* <Table {...props} /> */}
      <Table data={props.data} columns={props.columns} client={props.client} props={props} />
    </div>
  )
}

export default CustomReportReactTable;