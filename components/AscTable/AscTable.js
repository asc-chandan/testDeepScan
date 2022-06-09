import React, { useState, useEffect } from "react";
import SpeedSelect from '../SpeedSelect/SpeedSelect';
import DatePicker from '../ReactCalendar/DatePicker';
import './AscTable.scss';

function AscTable(props) {
  const [sort, setSort] = useState('');
  const [data, setData] = useState(props.data);
  const [filteredData, setFilteredData] = useState(props.data);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSizes] = useState([10,25,50,100,500]);
  const [pageSizeSelected, setPageSizeSelected] = useState(props.pageSize!==undefined ? props.pageSize : 50);
  const [totalRecords, setTotalRecords] = useState(props.data.length);
  const [totalPages, setTotalPages] = useState(Math.ceil(totalRecords/pageSizeSelected));

  //editable variables
  const [currentRowEditIndex, setCurrentEditIndex] = useState(false);
  const [currentColEditIndex, setCurrentColEditIndex] = useState(false);
  const [currentRecordId, setCurrentRecordId] = useState(false);
  const [updatedRecords, setUpdatedRecords] = useState([]);


  useEffect(()=>{
    setData(props.data);
    setTotalRecords(props.data.length);
  },[props.data]);

  //on total records update
  useEffect(()=>{
    setTotalPages(Math.ceil(totalRecords/pageSizeSelected));
    let filteredData = data.slice(currentPage-1, pageSizeSelected);
    setFilteredData(filteredData);
  }, [totalRecords]);

  //on page size changes
  useEffect(() => {
    let filteredData = data.slice(currentPage-1, pageSizeSelected);
    setFilteredData(filteredData);
    setTotalPages(Math.ceil(totalRecords/pageSizeSelected));
  }, [pageSizeSelected]);
  
  //On search value changes
  function onSearch(e){
    props.onSearch(e.target.value);
  }

  function handleColumnSort(e, col){
    if(!col.sort) return;

    let col_name = col.name;
    let updateSort;
    if(sort[col_name]===undefined){
      updateSort = 'desc';
    } else if(sort[col_name]==='desc'){
      updateSort = 'asc';
    } else if(sort[col_name]==='asc'){
      updateSort = 'desc';
    } else {
      updateSort = '';
    }
    let sortVal = {[col.name]: updateSort};
    setSort(sortVal);
    props.onSort(sortVal);
  }

  //Handle Page Change
  function handlePageChange(e, type){
    let newCurrentPage;
    if(type==='input'){
      if(isNaN(e.target.value)) return;
      newCurrentPage = e.target.value;
    } else if(type==='prev'){
      newCurrentPage = currentPage-1;
    } else if(type==='next'){
      newCurrentPage = currentPage+1;
    }
    if(newCurrentPage < 1 || newCurrentPage > totalPages) return false;
    setCurrentPage(newCurrentPage);
  }

  //on change of current page update filtered data 
  useEffect(() => {
    let startPage = (pageSizeSelected*(currentPage-1));
    let endPage = (pageSizeSelected*currentPage > totalRecords ? totalRecords : (pageSizeSelected*currentPage));
    let filteredData = data.slice(startPage, endPage);
    setFilteredData(filteredData);
  }, [currentPage]);


  function handleColEdit(event, row_index, col_index){
    event.stopPropagation();
    //Only allowed to ascendeum user who has REVENUE_SHARE_SETTINGS privilege
    if(props.user.organization_id===1 && props.user.privileges['sellside'].indexOf('APEX') >= 0){
      // let col_id = event.target.dataset.colid;
      // if(col_id===undefined || !col_id ) return false;
      
      setCurrentEditIndex(row_index);
      setCurrentColEditIndex(col_index);
      setCurrentRecordId(filteredData[row_index]['id']);

      //Set Row Columns State
      // setCurrentRevShareId(data[row_index]['id']);
      // setCurrentValToEditCol(col_id, data[row_index]);
    } else {
      return false;
    }
  }


  //On Change of Text Field
  function handleInputChange(event, col, is_add_new=false){
    let input_val = event.target.value;
    
    if(is_add_new){
      // do nothing right now
    } else { //Edit
      let obj = {};
      let newUpdatedRecords = JSON.parse(JSON.stringify(updatedRecords));
      let index = newUpdatedRecords.findIndex(p => p.id == currentRecordId);
      obj['id'] = currentRecordId;
      obj[col] = input_val;

      if(index > -1){
        newUpdatedRecords[index][col] = obj[col];
      } else {
        newUpdatedRecords.push(obj);
      }
    
      setUpdatedRecords(newUpdatedRecords);
    }
  }
  

  const start = (pageSizeSelected*(currentPage-1)+1);
  const end = (pageSizeSelected*currentPage > totalRecords ? totalRecords : (pageSizeSelected*currentPage));
  const isNextDisabled = (end >= totalRecords) ? true : false;
  const isPrevDisabled = (start <= 1) ? true : false;

  return (
    <div className="asc-custom-table-wrapper">
      {pageSizeSelected > 0 &&
        <div className="asc-table-filters">
          <div className="asc-table-pagination">
            <div className="records-info">Records: {start}-{end}/{(totalRecords)}</div>
            <div className="records-per-page">
              {totalRecords > 0 && 
                <SpeedSelect
                  options={pageSizes} // required
                  selectedOption={(pageSizeSelected) ? pageSizeSelected : ''} // required
                  onSelect={(e) => setPageSizeSelected(e)} 
                  displayKey='name'
                  uniqueKey='id'
                  selectLabel='Pages' 
                  maxHeight={120}
                />
              }
            </div>
            <div className="pagination">
              <input type="text" name="page-no" id="page-no" className="input-field" value={currentPage} onChange={(e) => handlePageChange(e, 'input')} />
              <div className="total-pages"> / {totalPages}</div>
              <div className="controls">
                <button className="btn-prev" onClick={(e) => handlePageChange(e, 'prev')} disabled={isPrevDisabled}>Prev</button>
                <button className="btn-next" onClick={(e) => handlePageChange(e, 'next')} disabled={isNextDisabled}>Next</button>
              </div>
            </div>
          </div>

          <div className="asc-table-search">
            <input type="text" name="txt-search" className="txt-search" placeholder="Search" onChange={(e) => onSearch(e)} />
          </div>
        </div>
      }
      

      <table className="asc-custom-table">
        <thead>
          <tr>
            {props.columns.map((item) => {
              return (
                <th key={item.name} className={(item.sort!==undefined && item.sort) ? 'has-sort' : ''} onClick={(e)=> handleColumnSort(e, item)}>{item.display_name} 
                  <span className="bg"></span>
                  {item.sort && <span className={'sort '+(sort[item.name]!==undefined ? sort[item.name] : '')}></span>}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {filteredData.map((item, i) => {
            var highlightedClass = (item.advertiser==='Total') ? 'highlighted' : 0;
            
            return (
              <tr key={i} data-num={i} valign="top" className={highlightedClass}>
                {props.columns.map((col, j) => {
                  let colValue = updatedRecords.filter((e) => e.id===item['id']);

                  //select selected value
                  let selectedOption = '';
                  if(col.option_type && col.option_type==='array_of_objects'){
                    selectedOption = col.select_options ? col.select_options.filter((e)=> (e.id===item[col.name] || e.name===item[col.name]))[0] : '';
                  } else {
                    selectedOption = col.select_options ? col.select_options.filter((e)=> e===item[col.name]) : [];
                  }
                  
                  return (
                    <td key={i+'-'+j} onClick={(e)=> handleColEdit(e,i,j)}>
                      {(col.name==='action' && item['status']==='not active') &&
                        <button className="btn outline xs btn-add">{props.actionAddButtonName}</button>
                      }

                      {/* if updated records available for given column show that otherwise show which is received from api */}
                      <span className="text">{(( colValue[0]!==undefined && colValue[0]['id'] && colValue[0][col.name]!==undefined) ? colValue[0][col.name] : item[col.name])}</span>
                      
                      {(col.editable && (currentRowEditIndex===i && currentColEditIndex===j)) &&
                        <span className="field-wrapper">
                          {col.field_type==='text' && 
                            <input type="text" name={col.name} value={((updatedRecords[i]!==undefined && updatedRecords[i][col.name]!==undefined) ? updatedRecords[i][col.name] : item[col.name])} className="form-control" placeholder={col.display_name} onChange={(e)=>handleInputChange(e, col.name)} /> 
                          }
                          {col.field_type==='select' && 
                            <SpeedSelect
                              options={col.select_options} // required
                              selectedOption={selectedOption} // required
                              onSelect={(e) => setPageSizeSelected(e)} 
                              displayKey='name'
                              uniqueKey='id'
                              selectLabel={col.display_name}
                              maxHeight={120}
                            />
                          }
                          {col.field_type==='date_picker' &&
                            <DatePicker picker="date"
                              placeholder="Pick a Date"
                              align="left"
                            />
                          }
                        </span>
                      }
                    </td>
                  );
                })}
              </tr>
            )
          })}

          {filteredData.length <= 0 &&
            <tr><td key="1" colSpan="8">No Record Found.</td></tr>
          }
        </tbody>
      </table>
    </div>
  );
}
export default AscTable;