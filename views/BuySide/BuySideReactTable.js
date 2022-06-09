import React from 'react';
import { Link } from "react-router-dom";
import {useTable,useSortBy} from 'react-table';

function Table({columns, data}) {
  const {
    getTableProps, 
    getTableBodyProps, 
    headerGroups, 
    rows, 
    prepareRow
  } = useTable(
    {columns, data},
    useSortBy
  );


  // Render Data Table UI
  return (
    <table {...getTableProps()} className="custom-table">
      <thead>
        {headerGroups.map((headerGroup, i) => (
          <tr key={i} {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column,j) => {
              return (
                <th key={j} {...column.getHeaderProps(column.getSortByToggleProps())}>
                  <span className="bg"></span>{column.render('Header')}
                  <span className="sorting-wrapper">
                    {column.isSorted
                      ? column.isSortedDesc
                        ?  <span className="sort desc"></span>
                        :  <span className="sort asc"></span>
                      : ''}
                  </span>
                </th>
              )
            })}
          </tr>
        ))}
      </thead>
              
      <tbody {...getTableBodyProps()}>
        {rows.map((row, i) => {
          prepareRow(row);
          
          return (
            <tr key={i} {...row.getRowProps()}>
              {row.cells.map(cell => {
                if(cell.column.id !==undefined && cell.column.id=='campaign_name'){
                  return (<td key={cell.column.id} {...cell.getCellProps()}>
                    <Link to={'/buyside/campaign/'+(cell.row.original.campaign_id)} style={{'color': '#fff', 'textDecoration': 'underline'}}>{cell.row.original.campaign_name}</Link>
                  </td>)
                } else {
                  return (
                    <td key={cell.column.id} {...cell.getCellProps()}>
                      { cell.render('Cell') }
                    </td>
                  )
                }
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
      <Table data={props.data} columns={props.columns} client={props.client} props={props} />
    </div>
  )
}

export default CustomReportReactTable;