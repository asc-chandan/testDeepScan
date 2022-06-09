import React, { useState } from 'react';
import {useTable} from 'react-table';

import * as Constants from '../../../components/Constants.js';
import { generateHashedPassword } from '../../../utils/Common';
import APIService from '../../../services/apiService';

function Table({columns, data}) {
  const {
    getTableProps, 
    getTableBodyProps, 
    headerGroups, 
    rows, 
    prepareRow
  } = useTable({columns, data});

  const [inprocess, setInprocess] = useState(false);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState('');
  // const [allowCopy, setAllowCopy] = useState(false);
  const [accessToken, setAccessToken] = useState('XXXXXXXXXXXXXXXXXXXXXXX');
  const [generatePassword, setGeneratePassword] = useState('');
  const [revokePassword, setRevokePassword] = useState('');
  const [revokeConfirm, setRevokeConfirm] = useState(false);
  const [revokeMessage, setRevokeMessage] = useState('');
  
  const [copyMsg, setCopyMsg] = useState('Copy');

  function handleTokenActionSubmit(e, type){
    e.preventDefault();
    let password = (type=='revoke') ? revokePassword : generatePassword;

    let apiPayload = {
      "action" : type,
      "password" : generateHashedPassword(password)
    };

    setInprocess(true);
    setError(false);
    setMessage('');

    APIService.apiRequest(Constants.API_BASE_URL+'/api_token', apiPayload, false, 'POST')
      .then(response => {
        if(response.status==1 && response.message!==''){
          
          if(type==='revoke'){
            setRevokePassword('');
            setRevokeConfirm(false);
            setRevokeMessage(response.message);
          } else {
            setAccessToken(response.access_token);
            setGeneratePassword('');
          }

          setInprocess(false);
          setError(false);
          setMessage('');
        } else {
          setInprocess(false);
          setError(true);
          setMessage(response.message);
        }
      })
      .catch(err => {
        setInprocess(false);
        setError(true);
        setMessage(err.message);
      });
  }

  function handleRevokeSubmit(e){
    e.preventDefault();
    handleTokenActionSubmit(e, 'revoke');
  }

  function handleRevokeConfirmation(e){
    e.preventDefault();
    setRevokeConfirm(true);
  }

  function handleTextBoxChange(e, id){
    if(id==='generate_password'){ setGeneratePassword(e.target.value); }
    if(id==='revoke_password'){ setRevokePassword(e.target.value); }
  }

  function handleCopyToken(){
    var copyText = document.getElementById("access-token");
    copyText.select();
    document.execCommand('copy');
    setCopyMsg('Copied');

    setTimeout(() => {
      setCopyMsg('Copy');
    }, 4000);
  }

  console.log('inprocess', inprocess);
  console.log('message', message);

  // Render Data Table UI
  return (
    <table {...getTableProps()} className="custom-table">
      <thead>
        {headerGroups.map((headerGroup, i) => (
          <tr key={i} {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => {
              let colWidth = 0;
              if(column.id==='id') { colWidth = 20; }
              if(column.id==='data_type') { colWidth = 50; }
              if(column.id==='possible_segmentation') { colWidth = 196; }
              
              return <th key={column.id} {...column.getHeaderProps()} width={(colWidth > 0 ? colWidth : 'auto')}><span className="bg"></span>{column.render('Header')}</th>
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
                let colWidth = 0;
                if(cell.column.id==='id') { colWidth = 20; }
                if(cell.column.id==='data_type') { colWidth = 50; }
                if(cell.column.id==='possible_segmentation') { colWidth = 196; }
                if(cell.column.id==='authenticate') { colWidth = 228; }

                if(cell.column.id==='action' && cell.row.original.access_token==='Generate'){
                  return (
                    <td key={cell.column.id} {...cell.getCellProps()} width={(colWidth > 0 ? colWidth : 'auto')}>
                      { accessToken!=='' ? <input type="text" id="access-token" className="access-token" value={accessToken} /> : ''  }
                      <button className={'btn-copy '+(accessToken==='XXXXXXXXXXXXXXXXXXXXXXX' ? 'disabled' : '')} disabled={accessToken!=='XXXXXXXXXXXXXXXXXXXXXXX' ? false : true} onClick={(e) => handleCopyToken(e)}>copy</button>
                      {copyMsg!=='' && <span className="copy-msg">{copyMsg}</span>}
                    </td>
                  )
                } else if(cell.column.id==='action' && cell.row.original.access_token==='Revoke'){
                  return (
                    <td key={cell.column.id} {...cell.getCellProps()} width={(colWidth > 0 ? colWidth : 'auto')}>
                      <button className={'btn outline xs btn-revoke-submit '+(revokeConfirm ? '' : 'disabled')} disabled={revokeConfirm ? false : true} onClick={(e)=>handleRevokeSubmit(e)}>Confirm Revoke</button>
                      {revokeMessage!=='' && <span className={'alert small '+(error ? 'error' : 'success')}>{revokeMessage}</span>}
                    </td>
                  )
                } else if(cell.column.id==='authenticate' && cell.row.original.access_token==='Generate'){
                  return (
                    <td key={cell.column.id} {...cell.getCellProps()} width={(colWidth > 0 ? colWidth : 'auto')}>
                      { cell.render('Cell') }
                      <form name="frm-generate-token" onSubmit={(e) => handleTokenActionSubmit(e, 'generate')}>
                        <input type="password" name="txt-generate-password" className="field-control" placeholder="Password" value={generatePassword} autoComplete="off" onChange={(e) => handleTextBoxChange(e, 'generate_password')} />
                        <input type="submit" id="btn-generate-submit" name="btn-generate-submit" className="btn-submit" value="submit" autoComplete="off" />
                      </form>
                    </td>
                  )
                } else if(cell.column.id==='authenticate' && cell.row.original.access_token==='Revoke'){
                  return (
                    <td key={cell.column.id} {...cell.getCellProps()} width={(colWidth > 0 ? colWidth : 'auto')}>
                      { cell.render('Cell') }
                      <form name="frm-revoke-token" onSubmit={(e) => handleTokenActionSubmit(e, 'revoke')}>
                        <input type="password" name="txt-revoke-password" className="field-control" placeholder="Password" value={revokePassword} autoComplete="off" onChange={(e) => handleTextBoxChange(e, 'revoke_password')} />
                        <button className="btn-submit" onClick={(e) => handleRevokeConfirmation(e)}>Revoke</button>
                      </form>
                    </td>
                  )
                } else if(cell.column.id==='possible_segmentation'){
                  return (<td key={cell.column.id} {...cell.getCellProps()} width={(colWidth > 0 ? colWidth : 'auto')}>
                    {/* { cell.render('Cell') } */}
                    <div className="html-val" dangerouslySetInnerHTML={{ __html: cell.value }}></div>
                  </td>)
                }  else {
                  return (
                    <td key={cell.column.id} {...cell.getCellProps()} width={(colWidth > 0 ? colWidth : 'auto')}>
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
      {/* <Table {...props} /> */}
      <Table data={props.data} columns={props.columns} client={props.client} props={props} />
    </div>
  )
}

export default CustomReportReactTable;