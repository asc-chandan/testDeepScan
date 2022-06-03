import React, { useState } from 'react';
import {useTable} from 'react-table';
import * as Constants from '../../../components/Constants.js';
import SpeedSelect from '../../../components/SpeedSelect/SpeedSelect';
import moment from 'moment';

//Import Services
import APIService from '../../../services/apiService';

function Table({columns, data, client, props}) {
  const {
    getTableProps, 
    getTableBodyProps, 
    headerGroups, 
    rows, 
    prepareRow
  } = useTable({columns, data});

  const [error, setError] = useState("");
  const [inprocess, setInprocess] = useState(false);
  const [revShareId, setRevShareId] = useState("");
  const [dataType, setDataType] = useState("");
  const [advertiser, setAdvertiser] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentEditIndex, setCurrentEditIndex] = useState(false);
  // const [currentEditDetails, currentEditDetails] = useState(false);
  
  
  const [isNet, setIsNet] = useState("");
  const [revSharePercent, setRevSharePercent] = useState("");
  
  //Rev share edit button click action
  function handleRevShareEdit(event, index){
    event.preventDefault();
    setCurrentEditIndex(index);

    //set current value in field
    console.log('columns');
    console.log(data[index]);

    setRevShareId(data[index]['id']);
    setDataType({id: data[index]['data_type'], name: data[index]['data_type']});
    setAdvertiser(data[index]['advertiser_name']);
    setIsNet({id: data[index]['is_net'], name: data[index]['is_net']});
    setStartDate(data[index]['effective_start_date']);
    setEndDate(data[index]['effective_end_date']);
    setRevSharePercent(data[index]['revenue_share_percent']);
  }

  //Update Rev share
  function handleRevShareUpdate(event, index){
    event.preventDefault();

    if(!checkRequiredField){
      alert('Please fill all input fields.');
    }
    setInprocess(true);
    
    let apiPayload = {
      "id": revShareId,
      "advertiser": advertiser,
      "data_type": dataType.id,
      "revenue_share_percent": (revSharePercent!=='') ? Number(revSharePercent) : 1,
      "effective_start_date": formatDate(startDate, 'YYYY-MM-DD'),
      "effective_end_date": (endDate!=='' && endDate!=='None') ? formatDate(endDate, 'YYYY-MM-DD') : 'None',
      "is_net": (isNet.id!=='') ? Number(isNet.id) : 0
    };


    APIService.apiRequest(Constants.API_BASE_URL+'/editRevShare', apiPayload, false, 'PUT')
    .then(response => {
      if(response.status===1){
        //Remove Loading Icon
        setInprocess(false);
        
        props.onUpdateRevShareData({
          id: apiPayload.id,
          data_type: apiPayload.data_type, 
          advertiser_name: apiPayload.advertiser,
          effective_start_date: apiPayload.effective_start_date,
          effective_end_date: apiPayload.effective_end_date,
          is_net: apiPayload.is_net,
          revenue_share_percent: apiPayload.revenue_share_percent
        }, currentEditIndex);

        setRevShareId("");
        setDataType("");
        setAdvertiser("");
        setIsNet("");
        setRevSharePercent("");
        setCurrentEditIndex(false);
      } else {
        setInprocess(false);
        setError(response.msg);
      }
    })
    .catch(err => {
      setInprocess(false);
      setError(err.msg);
    });
    
  }

  //On Select Change
  function onOptionSelect(event, id){
    if(id==='data_type'){ setDataType(event); }
    if(id==='advertiser'){ setAdvertiser(event); }
    if(id==='isNet'){ setIsNet(event); }
  }

  //On Change of Text Field
  function onInputChange(event, id){
    if(id==='revshare') setRevSharePercent(event.target.value);
    if(id==='start-date') setStartDate(event.target.value);
    if(id==='end-date') setEndDate(event.target.value);
  }

  function formatDate(date, date_format){
    return moment(date).format(date_format);
  }

  //Add New RevShare
  function handleAddNewRevShare(){
    if(!checkRequiredField){
      alert('Please fill all input fields.');
    }
    setInprocess(true);
    
    let apiPayload = {
      "client_id": props.client.id,
      "advertiser": advertiser,
      "data_type": dataType.id,
      "revenue_share_percent": (revSharePercent!=='') ? Number(revSharePercent) : 1,
      "effective_start_date": formatDate(startDate, 'YYYY-MM-DD'),
      "effective_end_date": (endDate!=='') ? formatDate(endDate, 'YYYY-MM-DD') : 'None',
      "is_net": (isNet.id!=='') ? Number(isNet.id) : 0,
    };

    APIService.apiRequest(Constants.API_BASE_URL+'/addRevShare', apiPayload)
    .then(response => {
      if(response.status===1){
        //Remove Loading Icon
        setInprocess(false);
        
        props.onAddNewRevShare({
          id: response['rev_share_id'],
          data_type: dataType.id, 
          advertiser_name: advertiser,
          client_id: Number(props.client.id), 
          client_name: props.client.name,
          effective_start_date: formatDate(startDate, 'YYYY-MM-DD'),
          effective_end_date: (endDate!=='') ? formatDate(endDate, 'YYYY-MM-DD') : 'None',
          is_net: Number(isNet.id),
          revenue_share_percent: Number(revSharePercent)
        });

        setDataType("");
        setAdvertiser("");
        setIsNet("");
        setRevSharePercent("");
      } else {
        setInprocess(false);
        setError(response.msg);
      }
    })
    .catch(err => {
      setInprocess(false);
      setError(err.msg);
    });
  }

  function checkRequiredField(){
    let allFilled = true;
    if(dataType==='' || startDate!=='' || advertiser==='' || isNet==='' || revSharePercent==='') {
      allFilled = false;
    }
    return allFilled;
  }

  function getEditableInputField(col){
    let output = '';
    // console.log(col);

    if(col==='data_type'){
      return (<div id="data_type" className="form-group">
        <SpeedSelect
          options={[{id: 'advertiser', name: 'Advertiser'}, {id:'adserver',name:'Adserver'}]}
          selectedOption={(dataType) ? dataType : ""}
          onSelect={(e) => onOptionSelect(e, 'data_type')}
          displayKey='name'
          uniqueKey='id'
          selectLabel='Data Type'
          maxHeight={120}
        />
      </div>)
    }

    if(col==='advertiser_name'){
      return (<div id="advertiser" className="form-group">
        <SpeedSelect
          options={props.advertisers}
          selectedOption={(advertiser) ? advertiser : ""}
          onSelect={(e) => onOptionSelect(e, 'advertiser')}
          displayKey='name'
          uniqueKey='id'
          selectLabel='Advertiser'
          maxHeight={120}
        />
      </div>)
    }

    if(col==='effective_start_date'){
      return (<div className="start-date form-group">
        <input type="date" name="txt-start-date" id="txt-start-date" className="field-control" value={startDate} placeholder="Start Date" onChange={(e) => onInputChange(e, 'start-date')} />
      </div>)
    }

    if(col==='effective_end_date'){
      return (<div className="end-date form-group">
        <input type="date" name="txt-end-date" id="txt-end-date" className="field-control" value={endDate} placeholder="End Date" onChange={(e) => onInputChange(e, 'end-date')} />
      </div>)
    }

    if(col==='is_net'){
      return (<div id="isnet" className="form-group">
        <SpeedSelect
          options={[{id:0, name:0}, {id:1, name:1}]}
          selectedOption={(isNet) ? isNet : ""}
          onSelect={(e) => onOptionSelect(e, 'isNet')}
          displayKey='name'
          uniqueKey='id'
          selectLabel='Is Net'
          maxHeight={120}
        />
      </div>)
    }

    if(col==='revenue_share_percent'){
      return (<div className="form-group">
        <input type="text" name="txt-revshare" id="txt-revshare" className="field-control" value={revSharePercent} placeholder="Rev Share Percent" onChange={(e) => onInputChange(e, 'revshare')} />
      </div>)
    }

    return output;
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
                      <>
                        <span className="text">{cell.render('Cell')}</span>
                        
                        {currentEditIndex===i && 
                          getEditableInputField(cell.column.id)
                        }
                      </>
                    }
                    {(cell.column.id==='action' && currentEditIndex!==i)&&
                      <div className="action-buttons-wrapper">
                        <button className="btn outline xs btn-view" data-config={row} onClick={(e) => handleRevShareEdit(e,i)}>edit</button>
                      </div>
                    }
                    {(cell.column.id==='action' && currentEditIndex===i)&&
                      <div className="action-buttons-wrapper">
                        <button className="btn outline xs btn-view" data-config={row} onClick={(e) => handleRevShareUpdate(e,i)}>{inprocess ? 'saving...' : 'save'}</button>
                      </div>
                    }
                  </td>
                )
              })}
            </tr>
          )
        })}

        {/* Add New Rev Share */}
        {props.showAddNewRow &&
          <tr>
            <td>{props.client.name}</td>
            <td>
              <div id="data_type" className="form-group">
                <SpeedSelect
                  options={[{id: 'advertiser', name: 'Advertiser'}, {id:'adserver',name:'Adserver'}]}
                  selectedOption={(dataType) ? dataType : ""}
                  onSelect={(e) => onOptionSelect(e, 'data_type')}
                  displayKey='name'
                  uniqueKey='id'
                  selectLabel='Data Type'
                  maxHeight={120}
                />
              </div>
            </td>
            <td>
              <div id="advertiser" className="form-group">
                <SpeedSelect
                  options={props.advertisers}
                  selectedOption={(advertiser) ? advertiser : ""}
                  onSelect={(e) => onOptionSelect(e, 'advertiser')}
                  displayKey='name'
                  uniqueKey='id'
                  selectLabel='Advertiser'
                  maxHeight={120}
                />
              </div>
            </td>
            <td>
              <div className="start-date form-group">
                <input type="date" name="txt-start-date" id="txt-start-date" className="field-control" value={startDate} placeholder="Start Date" onChange={(e) => onInputChange(e, 'start-date')} />
              </div>
            </td>
            <td>
              <div className="end-date form-group">
                <input type="date" name="txt-end-date" id="txt-end-date" className="field-control" value={endDate} placeholder="End Date" onChange={(e) => onInputChange(e, 'end-date')} />
              </div>
            </td>
            <td>
              <div id="isnet" className="form-group">
                <SpeedSelect
                  options={[{id:0, name:0}, {id:1, name:1}]}
                  selectedOption={(isNet) ? isNet : ""}
                  onSelect={(e) => onOptionSelect(e, 'isNet')}
                  displayKey='name'
                  uniqueKey='id'
                  selectLabel='Is Net'
                  maxHeight={120}
                />
              </div>
            </td>
            <td>
              <div className="form-group">
                <input type="text" name="txt-revshare" id="txt-revshare" className="field-control" value={revSharePercent} placeholder="Rev Share Percent" onChange={(e) => onInputChange(e, 'revshare')} />
              </div>
            </td>
            <td>
              <div className="action-buttons-wrapper">
                <button className="btn outline xs btn-view" onClick={handleAddNewRevShare}>{inprocess ? 'saving...' : 'save'}</button>
              </div>
            </td>
          </tr>
        }

        {rows.length <= 0 &&
          <tr><td colSpan={columns.length}>No Data Available</td></tr>
        }
      </tbody>
    </table>
  )
}

const RevShareReactTable = (props) => {
  if(!props.data) return;

  return (
    <div className="table-wrapper">
      {/* <Table {...props} /> */}
      <Table data={props.data} columns={props.columns} client={props.client} props={props} />
    </div>
  )
}

export default RevShareReactTable;