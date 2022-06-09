import React from 'react';
import {useTable} from 'react-table';

function Table({columns, data, props}) {
  const {
    getTableProps, 
    getTableBodyProps, 
    headerGroups, 
    rows, 
    prepareRow
  } = useTable({columns, data});

  function handleLoginAs(e){
    let user = e.target.dataset.user;
    props.onLoginAs(user)
  }

  // Render Data Table UI
  return (
    <table {...getTableProps()} className="custom-table">
      <thead>
        {headerGroups.map((headerGroup, i) => (
          <tr key={i} {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => {
              return <th key={column.id} {...column.getHeaderProps()}><span className="bg"></span>{column.render('Header')}</th>
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
                return (
                  <td key={cell.column.id} {...cell.getCellProps()}>
                    {cell.column.id==='action' &&
                      <button className="btn outline xs btn-login-as" data-user={cell.row.original.user_name} onClick={(e) => handleLoginAs(e)}>Login as</button> 
                    }
                    {cell.column.id!=='action' &&
                      cell.render('Cell') 
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

const LoginAsReactTable = (props) => {
  if(!props.data) return;

  return (
    <div className="table-wrapper">
      <Table data={props.data} columns={props.columns} props={props} />
    </div>
  )
}

export default LoginAsReactTable;