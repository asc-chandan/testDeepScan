import React, { Component } from 'react';

// import * as Constants from 'Constants.js';
import '../styles/Clients.scss';

class MultiSelectList extends Component {
  constructor(props) {
    super(props);

    this.filtered_options_list = [];
    if(typeof this.props.data[0]==='object'){
      this.props.data.forEach((item)=>{
        this.filtered_options_list.push(item.name);
      });
    } else {
      this.filtered_options_list = this.props.data;
    }
    
    this.state = {
      search_val: '',
      filtered_options_list: this.filtered_options_list,
    };

    //Event Bindings
    this.handleListSearch = this.handleListSearch.bind(this);
    // this.handleApply = this.handleApply.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleSelectAll = this.handleSelectAll.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount(){
    //Do Nothing
  }

  componentDidUpdate(prevProps) {
    // You don't have to do this check first, but it can help prevent an unneeded render
    if (prevProps.data !== this.props.data) {
      this.filtered_options_list = [];
      if(this.props.data!==undefined && typeof this.props.data[0]==='object'){
        this.props.data.forEach((item)=>{
          this.filtered_options_list.push(item.name);
        });
      } else {
        this.filtered_options_list = this.props.data;
      }

      this.setState({
        search_val: '',
        filtered_options_list: this.filtered_options_list
      });
    }
  }

  // componentWillReceiveProps(nextProps) {
  //   // You don't have to do this check first, but it can help prevent an unneeded render
  //   if (nextProps.data !== this.props.data) {
  //     this.setState({
  //       search_val: '',
  //       filtered_options_list: nextProps.data
  //     });
  //   }
  // }

  // Set all checked states to true
  handleSelectAll(event) {
    let obj = {'dimension_key': this.props.filter, 'dimension_val': event.target.checked ? 'ALL_CHECK' : 'ALL_UNCHECK'};
    this.props.onMultiSelectLFiltersSelection(obj);
  }


  //On Signle checkbox selection
  handleChange(index, event) {
    let obj = {'dimension_key': this.props.filter, 'dimension_val': this.state.filtered_options_list[index]};
    this.props.onMultiSelectLFiltersSelection(obj);
  }

  //Handle MultiSelectList Apply Button Click
  // handleApply(e){
  //   let select_values = [];
  //   this.state.checked.map((item,i) => {
  //     if(item===true){
  //       select_values.push(this.state.filtered_options_list[i]);
  //     }
  //   })

  //   let obj = {'dimension_key': this.state.filter_key, 'dimension_val': select_values};
  //   this.props.onMultiSelectLFiltersSelection(obj);
  // }

  //Handle MultiSelectList Cancel Button Click
  handleCancel(e){
    this.props.onMultiSelectFiltersClose();
  }

  //Handle List Search
  handleListSearch(e) {
    // Variable to hold the original version of the list
    let currentList = this.props.data;

    // Variable to hold the filtered list before putting into state
    let newList = [];
    
    if (e.target.value !== "") {
      newList = currentList.filter(item => {
        const lc = item.toLowerCase();
        const filter = e.target.value.toLowerCase();
        return lc.includes(filter);
      });
    } else {
      newList = this.props.data;
    }

    // Set the filtered state based on what our rules added to newList
    this.setState({
      search_val: e.target.value,
      filtered_options_list: newList
    });
  }

  render() {
    // var isAllChecked = this.state.checked.filter((c) => c).length === this.state.checked.length;
    let options = this.state.filtered_options_list;
    if(options===undefined) return false; //to fix when options not loaded

    let filter_key = this.props.filter;
    let selected_items = this.props.selectedOptions[filter_key] || [];
    let isAllChecked = (selected_items.length === options.length);
   
    return (
      <div className="options-list-wrapper">
        <div className="search-wrapper">
          <div className="select-all-wrapper">
            <label><input type="checkbox" name="selectall-list" onChange={this.handleSelectAll} checked={isAllChecked} /></label>
          </div>
          
          <input type="text" className="field-control" onChange={this.handleListSearch} placeholder="Search..." value={this.state.search_val} />
        </div>
        
        <div className="options-inner-wrapper">
          <div className="options-list">
            {options &&
              options.map((item,i) => {
                let checked = selected_items.includes(item);
                return <div className="item" key={i}>
                  <label>
                    <input type="checkbox" name="dimension[]" value={item} checked={checked} onChange={this.handleChange.bind(this, i)} /> <span>{item}</span>
                  </label>
                </div>
              })
            }
          </div>
        </div>
        
        
        {/* <div className="action-buttons">
          <button className="btn outline xs btn-ok" onClick={this.handleApply}>ok</button>
          <button className="btn outline xs btn-cancel" onClick={this.handleCancel}>cancel</button>
        </div> */}
      </div>
    );
  }
}

export default MultiSelectList;