import React, { useState } from 'react';
import {useTable} from 'react-table';
import * as Constants from '../../../components/Constants.js';
import SpeedSelect from '../../../components/SpeedSelect/SpeedSelect';
import DatePicker from '../../../components/ReactCalendar/DatePicker';
import {formatDate} from '../../../utils/Common';

//Import Services
import APIService from '../../../services/apiService';

function Table({columns, data, props}) {
  const {
    getTableProps, 
    getTableBodyProps, 
    headerGroups, 
    rows, 
    prepareRow
  } = useTable({columns, data});

  const [error, setError] = useState("");
  const [inprocess, setInprocess] = useState(false);
  const [dataType, setDataType] = useState("");
  const [advertiser, setAdvertiser] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isNet, setIsNet] = useState("");
  const [revSharePercent, setRevSharePercent] = useState("");

  const [newDataType, setNewDataType] = useState("");
  const [newAdvertiser, setNewAdvertiser] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newIsNet, setNewIsNet] = useState("");
  const [newRevSharePercent, setNewRevSharePercent] = useState("");

  const [currentRowEditIndex, setCurrentEditIndex] = useState(false);
  const [currentColEditIndex, setCurrentColEditIndex] = useState(false);
  const [currentRevShareId, setCurrentRevShareId] = useState(false);
  const [updatedRows, setUpdatedRows] = useState([]);
  
  function handleColEdit(event, row_index, col_index){
    event.stopPropagation();
    //Only allowed to ascendeum user who has REVENUE_SHARE_SETTINGS privilege
    if(props.user.organization_id===1 && props.user.privileges['sellside'].indexOf('REVENUE_SHARE_SETTINGS') >= 0){
      let col_id = event.target.dataset.colid;
      if(col_id===undefined || !col_id ) return false;
      
      setCurrentEditIndex(row_index);
      setCurrentColEditIndex(col_index);

      //Set Row Columns State
      setCurrentRevShareId(data[row_index]['id']);
      setCurrentValToEditCol(col_id, data[row_index]);
    } else {
      return false;
    }
  }

  function setCurrentValToEditCol(col, data){
    switch(col){
      case 'data_type':
        setDataType({id: data[col], name: data[col]});
        break;

      case 'advertiser_name':
        setAdvertiser(data[col]);
        break;

      case 'is_net':
        setIsNet({id: data[col], name: data[col]});
        break;

      case 'effective_start_date':
        setStartDate(data[col]);
        break;

      case 'effective_end_date':
        setEndDate(data[col]);
        break;

      case 'revenue_share_percent':
        setRevSharePercent(data[col]);
        break;

      default:
        break;
    }
  }


  //On Select Change
  function onOptionSelect(event, id, is_add_new=false){
    if(is_add_new){
      if(id==='data_type'){ setNewDataType(event); }
      if(id==='advertiser_name'){ setNewAdvertiser(event); }
      if(id==='is_net'){ setNewIsNet(event); }

    } else { //Edit Field
      let obj = {};
      let updatedRecords = JSON.parse(JSON.stringify(updatedRows));
      var index = updatedRecords.findIndex(p => p.id == currentRevShareId);
      obj['id'] = currentRevShareId;
      
      if(id==='data_type'){ 
        setDataType(event); 
        obj[id] = event.id;
      }
      if(id==='advertiser_name'){ 
        setAdvertiser(event); 
        obj[id] = event;
      }
      if(id==='is_net'){ 
        setIsNet(event); 
        obj[id] = event.id;
      }
      
      if(index > -1){
        updatedRecords[index][id] = obj[id];
      } else {
        updatedRecords.push(obj);
      }
    
      setUpdatedRows(updatedRecords);
      
      setTimeout(() => {
        props.onUpdateRevShareData(obj, currentRowEditIndex, updatedRecords);
      },0);
    }
  }

  //On Change of Text Field
  function onInputChange(event, id, is_add_new=false){
    let input_val = event.target.value;
    
    if(is_add_new){
      if(id==='revenue_share_percent'){ setNewRevSharePercent(input_val); }

    } else { //Edit
      let obj = {};
      let updatedRecords = JSON.parse(JSON.stringify(updatedRows));
      let index = updatedRecords.findIndex(p => p.id == currentRevShareId);
      obj['id'] = currentRevShareId;

      if(id==='revenue_share_percent'){ 
        setRevSharePercent(input_val); 
        obj[id] = parseFloat(input_val);
      }
      
      if(index > -1){
        updatedRecords[index][id] = obj[id];
      } else {
        updatedRecords.push(obj);
      }
    
      setUpdatedRows(updatedRecords);
      setTimeout(() => {
        props.onUpdateRevShareData(obj, currentRowEditIndex, updatedRecords);
      },0);
    }
  }

  function onDateChange(val, id, is_add_new=false){
    let input_val = val!=='' ? formatDate(val, 'YYYY-MM-DD') : null;
    
    if(is_add_new){
      if(id==='effective_start_date'){ setNewStartDate(input_val); }
      if(id==='effective_end_date'){ setNewEndDate(input_val); }

    } else { //Edit
      let obj = {};
      let updatedRecords = JSON.parse(JSON.stringify(updatedRows));
      let index = updatedRecords.findIndex(p => p.id == currentRevShareId);
      obj['id'] = currentRevShareId;

      if(id==='effective_start_date'){ 
        setStartDate(input_val); 
        obj[id] = input_val;
      }
      if(id==='effective_end_date'){ 
        setEndDate(input_val); 
        obj[id] = input_val;
      }
      if(index > -1){
        updatedRecords[index][id] = obj[id];
      } else {
        updatedRecords.push(obj);
      }
    
      setUpdatedRows(updatedRecords);
      setTimeout(() => {
        props.onUpdateRevShareData(obj, currentRowEditIndex, updatedRecords);
      },0);
    }
  }



  // function formatDate(date, date_format){
  //   return moment(date).format(date_format);
  // }

  //Add New RevShare
  function handleAddNewRevShare(){
    if(!checkRequiredField){
      alert('Please fill all input fields.');
    }
    setInprocess(true);
    
    let apiPayloadObj = {
      "client_id": props.client.id,
      "advertiser_name": newAdvertiser,
      "data_type": newDataType.id,
      "revenue_share_percent": (newRevSharePercent!=='') ? Number(newRevSharePercent) : 1,
      "effective_start_date": formatDate(newStartDate, 'YYYY-MM-DD'),
      // "effective_end_date": (newEndDate!=='') ? formatDate(newEndDate, 'YYYY-MM-DD') : 'None',
      "is_net": (newIsNet.id!=='') ? Number(newIsNet.id) : 0,
    };

    if(newEndDate!==''){
      apiPayloadObj['effective_end_date'] = formatDate(newEndDate, 'YYYY-MM-DD');
    }
    
    let apiPayload = [apiPayloadObj];

    APIService.apiRequest(Constants.API_BASE_URL+'/addRevShare', apiPayload)
    .then(response => {
      if(response.status===1){
        //Remove Loading Icon
        setInprocess(false);
        
        props.onAddNewRevShare({
          id: response['rev_share_id'][0],
          data_type: apiPayload[0].data_type, 
          advertiser_name: apiPayload[0].advertiser_name,
          client_id: Number(props.client.id), 
          client_name: props.client.name,
          effective_start_date: apiPayload[0].effective_start_date,
          effective_end_date: apiPayload[0].effective_end_date,
          is_net: apiPayload[0].is_net,
          revenue_share_percent: apiPayload[0].revenue_share_percent
        });

        setTimeout(() => {
          setNewDataType("");
          setNewAdvertiser("");
          setNewIsNet("");
          setNewStartDate("");
          setNewEndDate("");
          setNewRevSharePercent("");
        },0);
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

  function getEditableInputField(col, row){
    let output = '';
    // console.log(row.cells);
    console.log('error', error);

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
      let data_type = row.cells[1]['value'];
      return (<div id="advertiser" className="form-group">
        <SpeedSelect
          options={props.advertisers[data_type]}
          selectedOption={(advertiser) ? advertiser : ""}
          onSelect={(e) => onOptionSelect(e, 'advertiser_name')}
          displayKey='name'
          uniqueKey='id'
          selectLabel='Advertiser'
          maxHeight={120}
        />
      </div>)
    }

    if(col==='effective_start_date'){
      return (<div className="start-date form-group">
        <DatePicker picker="date"
          placeholder="Start Date"
          align="left"
          date={startDate && startDate!=='None' ? new Date(startDate) : ''}
          onChange={(val) => onDateChange(val, 'effective_start_date')}
          // disableFn={(dObj) => isDateSmaller(dObj, new Date(2021, -1, 31))}
        />
      </div>)
    }

    if(col==='effective_end_date'){
      return (<div className="end-date form-group">
        <DatePicker picker="date"
          placeholder="End Date"
          align="left"
          date={endDate && endDate!=='None' ? new Date(endDate) : ''}
          onChange={(val) => onDateChange(val, 'effective_end_date')}
          // disableFn={(dObj) => isDateSmaller(dObj, new Date(2021, -1, 31))}
        />
      </div>)
    }

    if(col==='is_net'){
      return (<div id="isnet" className="form-group">
        <SpeedSelect
          options={[{id:0, name:0}, {id:1, name:1}]}
          selectedOption={(isNet) ? isNet : ""}
          onSelect={(e) => onOptionSelect(e, 'is_net')}
          displayKey='name'
          uniqueKey='id'
          selectLabel='Is Net'
          maxHeight={120}
        />
      </div>)
    }

    if(col==='revenue_share_percent'){
      return (<div className="form-group">
        <input type="text" name="txt-revshare" id="txt-revshare" className="field-control" value={revSharePercent} placeholder="Rev Share Percent" onChange={(e) => onInputChange(e, 'revenue_share_percent')} />
      </div>)
    }

    return output;
  }


  // Render Data Table UI
  return (
    <div className="table-wrapper">
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
            let highlight_class = ( (row.values.VIEW==='VIDEO' && row.values.Metric==='VIDEO') || (row.values.VIEW==='DISPLAY' && row.values.Metric==='DISPLAY') ) ? 'highlighted' : '';

            return (
              <tr key={i} className={highlight_class} {...row.getRowProps()}>
                {row.cells.map((cell, j) => {
                  return ( // Added event on both td and class text because click on text under td was not getting data attributes
                    <td key={cell.column.id} {...cell.getCellProps()} data-colid={cell.column.id} onClick={(e)=> handleColEdit(e,i,j)}>
                      {cell.column.id!=='action' &&
                        <React.Fragment>
                          <span className="text" data-colid={cell.column.id} onClick={(e)=> handleColEdit(e,i,j)}>{cell.render('Cell')}</span>
                          
                          {(currentRowEditIndex===i && currentColEditIndex===j) && 
                            getEditableInputField(cell.column.id, row)
                          }
                        </React.Fragment>
                      }
                      {/* {(cell.column.id==='action' && currentRowEditIndex!==i)&&
                        <div className="action-buttons-wrapper">
                          <button className="btn outline xs btn-view" onClick={(e) => handleRevShareEdit(e,i)}>edit</button>
                        </div>
                      } */}
                      {/* {(cell.column.id==='action' && currentRowEditIndex===i)&&
                        <div className="action-buttons-wrapper">
                          <button className="btn outline xs btn-view" onClick={(e) => handleRevShareUpdate(e,i)}>{inprocess ? 'saving...' : 'save'}</button>
                        </div>
                      } */}
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
                    selectedOption={(newDataType) ? newDataType : ""}
                    onSelect={(e) => onOptionSelect(e, 'data_type', true)}
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
                    options={props.advertisers[(newDataType!='' ? newDataType.id : 'advertiser')]}
                    selectedOption={(newAdvertiser) ? newAdvertiser : ""}
                    onSelect={(e) => onOptionSelect(e, 'advertiser_name', true)}
                    displayKey='name'
                    uniqueKey='id'
                    selectLabel='Advertiser'
                    maxHeight={120}
                  />
                </div>
              </td>
              <td>
                <div className="start-date form-group">
                  <DatePicker picker="date"
                    placeholder="Start Date"
                    align="left"
                    date={newStartDate ? new Date(newStartDate) : ''}
                    onChange={(val) => onDateChange(val, 'effective_start_date', true)}
                    // disableFn={(dObj) => isDateSmaller(dObj, new Date(2021, -1, 31))}
                  />
                </div>
              </td>
              <td>
                <div className="end-date form-group">
                  <DatePicker picker="date"
                    placeholder="End Date"
                    align="left"
                    date={newEndDate ? new Date(newEndDate) : ''}
                    onChange={(val) => onDateChange(val, 'effective_end_date', true)}
                    // disableFn={(dObj) => isDateSmaller(dObj, new Date(2021, -1, 31))}
                  />
                </div>
              </td>
              <td>
                <div id="isnet" className="form-group">
                  <SpeedSelect
                    options={[{id:0, name:0}, {id:1, name:1}]}
                    selectedOption={(newIsNet) ? newIsNet : ""}
                    onSelect={(e) => onOptionSelect(e, 'is_net', true)}
                    displayKey='name'
                    uniqueKey='id'
                    selectLabel='Is Net'
                    maxHeight={120}
                  />
                </div>
              </td>
              <td>
                <div className="form-group">
                  <input type="text" name="txt-revshare" id="txt-revshare" className="field-control" value={newRevSharePercent} placeholder="Rev Share Percent" onChange={(e) => onInputChange(e, 'revenue_share_percent', true)} />
                </div>
              </td>
              <td>
                <div className="action-buttons-wrapper">
                  <button className="btn outline xs btn-view" onClick={handleAddNewRevShare}>{inprocess ? 'adding...' : 'add'}</button>
                </div>
              </td>
            </tr>
          }

          {rows.length <= 0 &&
            <tr><td colSpan={columns.length}>No Data Available</td></tr>
          }
        </tbody>
      </table>
    </div>
  )
}



const RevShareReactTable = (props) => {
  if(!props.data) return;

  return (
    <Table data={props.data} columns={props.columns} client={props.client} props={props} />
  )
}

export default RevShareReactTable;