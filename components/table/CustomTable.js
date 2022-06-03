import React, { Component } from 'react';
import ReactTable from './ReactTable';

class CustomTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // checked: Array(Object.keys(this.props.data).length).fill(false)
      checked: this.initialPaymentStatus(this.props.data)
    };

    this.handleSelectAll = this.handleSelectAll.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount(){
    //Do Nothing
  }

  //Get Payment Status on Initial Load
  initialPaymentStatus(records){
    var payments_results = JSON.parse(JSON.stringify(records));
    var initial_payment_status = [];
    payments_results.map((item, i)=>{
      if(item.payment_flag===1){
        initial_payment_status.push(true);
      } else {
        initial_payment_status.push(false);
      }
    });
    return initial_payment_status;
  }
  

  componentWillReceiveProps(nextProps) {
    // You don't have to do this check first, but it can help prevent an unneeded render
    if(Object.keys(nextProps.data).length !== this.state.checked.length){
      this.setState({
        // checked: Array(Object.keys(nextProps.data).length).fill(false)
        checked: this.initialPaymentStatus(nextProps.data)
      });
    }
  }

  //Count Key's Values Count for rows span
  countKeyValuesCount(arr, key, value){
    var obj={};
    arr.forEach(function(item){
      obj[item[key]] ? obj[item[key]]++ : obj[item[key]]=1;
    });
    return obj;
  }

  //Generate values
  rowSpanKeyIndexesGeneration(obj){
    var indexesList = [];
    var init_val = 0;
    var valuesArr = Object.values(obj);
    valuesArr.forEach((key, index) => {
      init_val = (index===init_val) ? init_val : (valuesArr[index-1]+indexesList[index-1]);
      indexesList.push(init_val);
    });
    return indexesList;
  }


  // Set all checked states to true
  handleSelectAll(event) {
    this.setState({
    	checked: this.state.checked.map(() => { 
        return event.target.checked 
      })
    });

    //Send Status back to parent component to update status in database
    setTimeout(()=>{
      var results;
      var payment_ids = [];

      this.state.checked.map((item, i) => { 
        if(this.props.data[i].id==="") return;
        payment_ids.push(this.props.data[i].id);
      });
      results = {payment_id: payment_ids, is_checked: this.state.checked[0]};
      this.props.onPaymentStatusUpdate(results);
    },0);
  }

  //On Signle checkbox selection
  handleChange(index, event) {
    var checked = this.state.checked;
    checked[index] = event.target.checked;
    this.setState({ checked: checked });
    var results = {payment_id: parseInt(event.target.dataset.id), is_checked: event.target.checked};
    
    //Send Status back to parent component to update status in database
    setTimeout(()=>{
      this.props.onPaymentStatusUpdate(results);
    },0);
  }
  

  render() {
    let totalRecordsLen = Object.keys(this.props.data).length;
    let columnsOrgList = [];
    let columnsToDisplay = [];
    let columnsRowSpan = [];
    let columnsRowsSpanDetails = {};
    
    if(this.props.columns_rowspan){
      columnsRowSpan = this.props.columns_rowspan.split(',');
      columnsRowSpan.forEach((key, index) => {
        let list = this.countKeyValuesCount(this.props.data, key);
        columnsRowsSpanDetails[key] = {
          'list': list,
          'length': Object.keys(list).length,
          'span_indexes': this.rowSpanKeyIndexesGeneration(list)
        };
      });
    }

    //Get Columns Full List  - Extract it from data first index
    if(this.props.data[0]){
      columnsOrgList = Object.keys(this.props.data[0]);
      columnsToDisplay = this.props.columns.split(',');
    }

    var isAllChecked = this.state.checked.filter((c) => c).length === this.state.checked.length;

    return (
      <table className="custom-table">
        <thead>
          <tr>
            {columnsToDisplay.map((key, index) => {
              if(columnsOrgList.indexOf(key) !== -1){
                let output = (key==='payment_flag') ? <th key={key}><input type="checkbox" name="selectall-list" onChange={this.handleSelectAll} checked={isAllChecked} /> {key}</th> : <th key={key}>{key}</th>;
                return output;
              }
            })}
          </tr>
        </thead>
        <tbody>
          {this.props.data.map((item, key) => {
            var highlightedClass = (item.advertiser==='Total') ? 'highlighted' : 0;
            
            return (
              <tr key={key} data-num={key} valign="top" className={highlightedClass}>
                {columnsToDisplay.map((col, index) => {
                  if(columnsOrgList.indexOf(col) !== -1){
                    if(columnsRowSpan.length > 0 && columnsRowSpan.indexOf(col)!==-1){
                      if(columnsRowsSpanDetails[col]!=undefined && (columnsRowsSpanDetails[col]['span_indexes'].indexOf(key) !== -1) ){
                        return <td key={key+'_'+index} rowSpan={columnsRowsSpanDetails[col]['list'][item[col]]}>{item[col]}</td>
                      }
                    } else{
                      return (<td>
                        {(col==='payment_flag' && item['advertiser']!=='Total') &&
                          <input type="checkbox" className="payment-received" checked={this.state.checked[key]} data-id={item.id} onChange={this.handleChange.bind(this, key)} />
                          // <input type="checkbox" className="payment-received" checked={this.state.checked[key]} data-id={item.id} onChange={this.handleChange.bind(this, key)} />
                          // <input type="checkbox" className="payment-received" checked={payment_received} onChange={this.handlePaymentStatusUpdate}  />
                        }
                        {col!=='payment_flag' &&
                          item[col]
                        }
                      </td>)
                    }
                  }
                })}
              </tr>
            )
          })}

          { totalRecordsLen <= 0 &&
            <tr><td key="1" colSpan="8">No Record Found.</td></tr>
          }
        </tbody>
      </table>
    );
  }
}

export default CustomTable;