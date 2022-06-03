import React, { useState } from 'react';
import {useTable} from 'react-table';
import { numberWithCommas } from '../../../utils/Common'; //Import Common Functions

const amount_cols = ["sum revenue", "sum cpm", "sum rpm", "sum rpms", "sum rps", "sum rpu"];
const number_cols = ["sum revenue", "sum impressions", "sum cpm", "sum rpm", "sum rpms", "sum rps", "sum rpu"];

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
      props.history.push(event.target.dataset.url, {
        dateRangeRequired: event.target.dataset.daterange,
        reportTitle: event.target.dataset.title,
        // reportPeriod: event.target.dataset.period,
        reportConfig: event.target.dataset.config
      })
    }
  }

  function checkDecimal(num){
    if(typeof num=='number' && ((num % 1)!=0)){
      return true;
    }
    return false;
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
                    {/* {amount_cols.includes(cell.column.id) && <span>$</span> }
                    {(isNumberCol && (typeof cell.value==='number')) &&
                      numberWithCommas(parseFloat(cell.value))
                    } */}

                    {checkDecimal(cell.value) && <span>$</span> }
                    {(!isNaN(Number(cell.value)) && typeof cell.value==='number') &&
                      numberWithCommas(parseFloat(cell.value))
                    }

                    {(cell.column.id!=='action' && isNaN(Number(cell.value))) &&
                      cell.render('Cell')
                    }
                    
                    {(cell.column.id!=='action' && !isNaN(Number(cell.value)) && typeof cell.value==='string') &&
                      cell.render('Cell')
                    }

                    {cell.column.id==='action' &&
                      <div className="action-buttons-wrapper">
                        <button 
                          className="btn outline xs btn-view" 
                          data-title={cell.row.original.name} 
                          data-daterange={cell.row.original.inputs_required ? cell.row.original.inputs_required : false} 
                          data-url={(cell.row.original.data_source==='custom') ? '/sellside/'+cell.row.original.custom_url : '/sellside/custom_report/'+cell.row.original.id} 
                          data-config={cell.row.original.config} 
                          onClick={handleReportLoad}>
                            View
                        </button>
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