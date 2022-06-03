import React, { useState, useEffect } from 'react';
import {useTable} from 'react-table';

function Table({columns, data, client, onPaymentStatusUpdate}) {
  const {
    getTableProps, 
    getTableBodyProps, 
    headerGroups, 
    rows, 
    prepareRow
  } = useTable({columns, data});



  //Get Payment Status on Initial Load
  const initialPaymentStatus = (records) => {
    var payments_results = JSON.parse(JSON.stringify(records));
    var initial_payment_status = [];
    payments_results.forEach((item, i)=>{
      if(item.advertiser==='Total')  {
        initial_payment_status.push(null);
      } else {
        if(item.payment_flag===1){
          initial_payment_status.push(true);
        } else {
          initial_payment_status.push(false);
        }
      }
    });

    return initial_payment_status;
  }

  const handleSelectAll = (event) => {
    const updatedCheck = event.target.checked ? Array(checked.length).fill(true) :  Array(checked.length).fill(false) 
    setChecked(updatedCheck);

    //Send Status back to parent component to update status in database
    var results;
    var payment_ids = [];

    checked.forEach((item, i) => { 
      if(data[i].id==="") return;
      payment_ids.push(data[i].id);
    });
    results = {payment_id: payment_ids, is_checked: event.target.checked};
    onPaymentStatusUpdate(results);
  }

  const handleChange = (event, index) => {
    const updatedCheck = [...checked.slice(0, index), event.target.checked, ...checked.slice(index+1)];
    setChecked(updatedCheck);

    var results = {payment_id: [parseInt(event.target.dataset.id)], is_checked: event.target.checked};
    
    //Send Status back to parent component to update status in database
    setTimeout(()=>{
      onPaymentStatusUpdate(results);
    },0);
  }


  const [checked, setChecked] = useState(initialPaymentStatus(data));
  const isAllChecked = checked.every((c) => c===null ? true : c);
  
  useEffect(() => {
    setChecked(initialPaymentStatus(data));
  }, [data]);


  // Render Data Table UI
  return (
    <table {...getTableProps()} className="custom-table">
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => {
              return (column.id==='payment_flag') ? <th key={column.id} {...column.getHeaderProps()}><span className="bg"></span><input type="checkbox" name="selectall-list" onChange={handleSelectAll} checked={isAllChecked} /> {column.render('Header')}</th> : <th key={column.id} {...column.getHeaderProps()}><span className="bg"></span>{column.render('Header')}</th>
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
                if(row.values.advertiser==='Total'){
                  return (
                    <td className="highlighted" {...cell.getCellProps()}>
                      {(cell.column.id==='advertiser' || cell.column.id==='amount' || cell.column.id==='currency') &&
                        cell.render('Cell')
                      }
                    </td>
                  )
                } else {
                  return (
                    <td {...cell.getCellProps()}>
                      {/* Used for Analysis View Home Page Only */}
                      {cell.column.id==='is_settled' &&
                        <input type="checkbox" className="payment-received" checked={checked[i]} data-id={cell.row.original.id} onChange={(e) => handleChange(e, i)} />
                      }
                      {cell.column.id!=='is_settled' &&
                        cell.render('Cell')
                      }
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

const AccountsReceivableReactTable = (props) => {
  if(!props.data) return;

  return (
    <div className="table-wrapper">
      <Table {...props} />
    </div>
  )
}

export default AccountsReceivableReactTable;