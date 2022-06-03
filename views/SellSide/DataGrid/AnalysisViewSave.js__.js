import React, { Component } from 'react';
import * as Constants from '../../../components/Constants.js';

import SpeedSelect from '../../../components/SpeedSelect/SpeedSelect';
import APIService from '../../../services/apiService'; //Import Services
import AlertService from '../../../services/alertService';

const SAVE_PERIOD_OPTIONS = [{ id: '', name: 'Select Period' }, { id: 'Last 7 Days', name: 'Last 7 Days' }, { id: 'Last 15 Days', name: 'Last 15 Days' }, { id: 'Last 30 Days', name: 'Last 30 Days' }, { id: 'Last Month', name: 'Last Month' }, { id: 'This Month', name: 'This Month' }];

class AnalysisViewSave extends Component {
  constructor(props) {
    super(props);

    //Get Client & View Type & User
    this.client = this.props.client;
    this.view_type = this.props.view_type;
    this.user = this.props.user;

    const reportData = this.props.reportData || {};
    const currentConfig = reportData.config ? JSON.parse(reportData.config) : {};
    this.state = {
      inprocess: false,
      error: false,
      message: "",
      showSaveAnalysisDrawer: false,
      analysisSaveFormFields: {
        analysis_name: reportData.name || '',
        analysis_description: reportData.description || '',
        analysis_save_period: SAVE_PERIOD_OPTIONS.find(op => op.id === reportData.dynamic_time_period) || SAVE_PERIOD_OPTIONS[0],
        analysis_save_comparison_preselect: currentConfig.period_comparison_preselect ? this.props.period_comparison_preselect_options.find(op => op.id === currentConfig.period_comparison_preselect.id) : this.props.period_comparison_preselect_options[0],
        organization_specific: { id: '', name: 'Organization' },
        user_specific: '',
        // is_all_organization: 0
      },
      organizationsList: [],
      organizationsUsersList: [],
      orgSpecificUsersList: [], // On change of organization dropdown
      // analysisSavePeriod: "",
      isCustomReport: false,
      terminal_type: this.user.terminal_type.id
    }


    //Event Bind
    this.handleAnalysisViewSave = this.handleAnalysisViewSave.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    // this.handleOrganizationChange = this.handleOrganizationChange.bind(this);

    this.getOrganizationsOptionsList = this.getOrganizationsOptionsList.bind(this);
    this.getOrganizationsUsersOptionsList = this.getOrganizationsUsersOptionsList.bind(this);
    this.handleSwitchToggle = this.handleSwitchToggle.bind(this);
    this.onOptionSelect = this.onOptionSelect.bind(this);
  }

  handleLoadScripts() {
    this.getOrganizationsOptionsList();
    this.getOrganizationsUsersOptionsList();
  }


  componentDidMount() {
    // console.timeEnd('sight: Component - init');
    this.handleLoadScripts();
  }




  //Get Values under Columns and Rows
  generateSelectedRowsColsElements(arr) {
    var selected_values;
    var hasValues = arr.find((item, index) => {
      if (item.title === 'values') return true;
    });
    selected_values = this.getkeyValuesInArray(arr, 'title');

    if (hasValues) {
      var newValues = [];
      selected_values.map((item, index) => {
        if (item === 'values') {
          newValues.push({ 'values': this.generateValues(this.props.config.values) });
        } else {
          newValues.push(item);
        }
      });
      return newValues;
    }
    return selected_values;
  }

  //Generate Rows/Columns Values
  getkeyValuesInArray(arr, keyname) {
    var newArr = [];
    for (var i = 0, len = arr.length; i < len; i++) {
      newArr[i] = arr[i][keyname];
    }
    return newArr;
  }

  //Genrate Values
  generateValues(arr) {
    var newObj = [];
    arr.map((item, index) => (
      newObj.push({
        'id': item.title,
        'operation': item.operation,
        'type': item.type,
        'default_action': item.default_action,
      })
    ));
    return newObj;
  }


  //Handle Save Analysis View Submit
  handleAnalysisViewSave(e) {
    e.preventDefault();

    if (this.state.analysisSaveFormFields.analysis_name === '') {
      this.setState({ error: true, message: 'Please enter analysis name.' });
      return false;
    }

    //Input Validations
    this.setState({ error: false, inprocess: true, message: '' });
    var config = {
      all_items: this.props.config.all_items,
      rows: this.props.config.rows,
      columns: this.props.config.columns,
      values: this.props.config.values,
      measurements: this.props.config.measurements,
      filters: this.props.config.filters,
      conditional_formatting: this.props.config.conditional_formatting,
      period_comparison_enabled: this.props.config.period_comparison_enabled,
      show_benchmark_period: this.props.config.show_benchmark_period,
      selected_benchmark_index: this.props.config.selected_benchmark_index,
      period_comparison_preselect: this.state.analysisSaveFormFields.analysis_save_comparison_preselect
    }

    const viewSaveDetails = {
      is_autosaved: 0, // for manual save, this should be 0
      name: this.state.analysisSaveFormFields.analysis_name,
      description: this.state.analysisSaveFormFields.analysis_description,
      is_default: 0,
      is_organization_specific: (this.state.analysisSaveFormFields.organization_specific ? 1 : 0),
      is_user_specific: (this.state.analysisSaveFormFields.user_specific ? 1 : 0)
    }

    //Custom report - Make view_type and dynamic time period part of config key
    if (this.state.isCustomReport) {
      config = {
        rows: this.generateSelectedRowsColsElements(this.props.config.rows),
        columns: this.generateSelectedRowsColsElements(this.props.config.columns),
        measurements: this.props.config.measurements,
        filters: this.props.config.filters,
        view_type: this.view_type,
        dynamic_time_period: this.state.analysisSaveFormFields.analysis_save_period !== '' ? this.state.analysisSaveFormFields.analysis_save_period.id : 'Last 7 Days'
      }
      viewSaveDetails['client_id'] = this.client.id;
    } else {
      viewSaveDetails['view_type'] = this.view_type;
      viewSaveDetails['dynamic_time_period'] = this.state.analysisSaveFormFields.analysis_save_period !== '' ? this.state.analysisSaveFormFields.analysis_save_period.id : 'Last 7 Days';
    }
    viewSaveDetails['config'] = JSON.stringify(config);
    viewSaveDetails['is_custom_report'] = (this.state.isCustomReport) ? 1 : 0;

    if (this.user.privileges[this.state.terminal_type].indexOf('SAVE_PIVOT_VIEW_ANYORG') >= 0 || this.user.privileges[this.state.terminal_type].indexOf('SAVE_PIVOT_VIEW_MYORG') >= 0) {
      if (this.state.analysisSaveFormFields.organization_specific.id !== '') {
        viewSaveDetails['organization_id'] = this.state.analysisSaveFormFields.organization_specific.id;
        viewSaveDetails['is_all_organization'] = 1; //0 
      } else {
        viewSaveDetails['is_all_organization'] = 1;
        viewSaveDetails['organization_id'] = this.user.organization_id;
      }
      if (this.state.analysisSaveFormFields.user_specific) {
        viewSaveDetails['is_all_organization'] = 0;
        viewSaveDetails['user_id'] = this.state.analysisSaveFormFields.user_specific.id;
      }
    } else {
      viewSaveDetails['organization_id'] = this.user.organization_id;
      viewSaveDetails['user_id'] = this.user.id;
      viewSaveDetails['is_organization_specific'] = 1;
      viewSaveDetails['is_user_specific'] = 1;
    }
    if (this.props.reportData && this.props.reportData.id) {
      // Report is being edited, hence add the id field in payload
      viewSaveDetails['id'] = this.props.reportData.id;
    }

    //Org/User settings    
    // viewSaveDetails['is_all_organization'] = 0;
    // viewSaveDetails['is_organization_specific'] = 1;
    // viewSaveDetails['is_user_specific'] = 1;

    // if(this.state.analysisSaveFormFields.is_all_organization){
    //   viewSaveDetails['is_all_organization'] = 1;
    //   viewSaveDetails['is_user_specific'] = 0;
    //   viewSaveDetails['user_id'] = null;
    //   viewSaveDetails['is_organization_specific'] = 0;
    //   viewSaveDetails['organization_id'] = null;
    // }

    // if(this.state.analysisSaveFormFields.organization_specific.id==='' && this.state.analysisSaveFormFields.user_specific==='' && !this.state.analysisSaveFormFields.is_all_organization){
    //   viewSaveDetails['organization_id'] = this.user.organization_id;
    //   viewSaveDetails['user_id'] = this.user.id;
    // }

    // if(this.user.organization_id > 1){
    //   viewSaveDetails['is_organization_specific'] = 1;
    //   viewSaveDetails['organization_id'] = this.user.organization_id;
    // }
    // if(this.state.analysisSaveFormFields.organization_specific.id!==''){
    //   viewSaveDetails['is_organization_specific'] = 1;
    //   viewSaveDetails['organization_id'] = this.state.analysisSaveFormFields.organization_specific.id;
    //   viewSaveDetails['is_user_specific'] = 0;
    // } 
    // if(this.state.analysisSaveFormFields.user_specific && !this.state.analysisSaveFormFields.is_all_organization){
    //   viewSaveDetails['is_user_specific'] = 1;
    //   viewSaveDetails['user_id'] = this.state.analysisSaveFormFields.user_specific.id;
    // }
    const reqMethod = this.props.reportData && this.props.reportData.id ? 'PUT' : 'POST';
    APIService.apiRequest(Constants.API_BASE_URL + '/saveAnalysisView', viewSaveDetails, false, reqMethod)
      .then(response => {
        if (response.status == 1) {
          this.setState({
            inprocess: false,
            error: false,
            // message: "Analysis view saved successfully.",
          });
          AlertService.success('Analysis view saved successfully.');

          // Inform the parent component about save success and pass the updated info
          this.props.onSave({
            id: reqMethod === 'POST' ? response.new_id : this.props.reportData.id,
            name: this.state.analysisSaveFormFields.analysis_name,
            description: this.state.analysisSaveFormFields.analysis_description,
          });

        } else {
          this.setState({
            inprocess: false,
            error: true,
            // message: response.message
          });
          AlertService.error(response.message);
        }
      })
      .catch(err => {
        this.setState({ error: true, inprocess: false });
      });
  }

  //On Analysis Form Fields Input Change
  handleInputChange(event) {
    this.setState({
      analysisSaveFormFields: { ...this.state.analysisSaveFormFields, [event.target.name]: event.target.value }
    });
  }



  /******************************
   * getOrganizationsList 
   * Return no organization if he has member role and SAVE_PIVOT_VIEW privilege 
   * Return only child organizations if he has manager role and SAVE_PIVOT_VIEW_MYORG privilege 
   * Return all child organizations if he has manager role and SAVE_PIVOT_VIEW_ANYORG privilege
   */
  getOrganizationsOptionsList() {
    let organizationsOptions = [];

    if (this.user.privileges[this.state.terminal_type].indexOf('SAVE_PIVOT_VIEW_ANYORG') > -1 && this.props.organizationsList.length > 0) {
      this.props.organizationsList.forEach((item, i) => {
        organizationsOptions.push(item);
      });
    } else if (this.user.privileges[this.state.terminal_type].indexOf('SAVE_PIVOT_VIEW_MYORG') > -1 && this.props.organizationsList.length > 0) {
      this.props.organizationsList.forEach((item, i) => {
        if (item.id == this.user.organization_id) {
          organizationsOptions.push(item);
        }
      });
    }

    this.setState({ organizationsList: organizationsOptions });
  }


  /******************************
   * getOrganizationsUsersOptionsList 
   */
  getOrganizationsUsersOptionsList() {
    let usersOptions = [];
    if (this.state.orgSpecificUsersList.length > 0) {
      this.state.orgSpecificUsersList.forEach((item, i) => {
        usersOptions.push(item);
      });
    } else {
      if (this.user.privileges[this.state.terminal_type].indexOf('SAVE_PIVOT_VIEW_ANYORG') >= 0 && this.props.organizationsUsersList) {
        this.props.organizationsUsersList.forEach((item, i) => {
          usersOptions.push(item);
        });
      } else if (this.user.privileges[this.state.terminal_type].indexOf('SAVE_PIVOT_VIEW_MYORG') >= 0 && this.props.organizationsUsersList) {
        this.props.organizationsUsersList.forEach((item, i) => {
          if (item.organization_id == this.user.organization_id) {
            usersOptions.push(item);
          }
        });
      } else {
        usersOptions = [];
      }
    }

    this.setState({ organizationsUsersList: usersOptions });
    // return usersOptions;
  }


  //Save Analysis View  - Form
  analysisSaveForm() {
    let alert_class = (this.state.error) ? 'error' : 'success';
    let alert_msg = (this.state.message !== '') ? this.state.message : '';

    return (
      <form id="frm-save-analysis" className="custom-form">
        {(alert_msg !== '') &&
          <div className={'alert ' + (alert_class)}>{alert_msg}</div>
        }

        <div className="field-wrapper">
          <div className="text-field">
            <input type="text" name="analysis_name" maxLength="100" placeholder="Analysis Name" className="input-field" value={this.state.analysisSaveFormFields.analysis_name} onChange={this.handleInputChange} />
          </div>
        </div>

        <div className="field-wrapper">
          <div className="text-field">
            <input type="text" name="analysis_description" placeholder="Analysis Description" className="input-field" value={this.state.analysisSaveFormFields.analysis_description} onChange={this.handleInputChange} />
          </div>
        </div>

        <div className="field-wrapper">
          <div className="form-group">
            <SpeedSelect
              options={SAVE_PERIOD_OPTIONS}
              selectedOption={(this.state.analysisSaveFormFields.analysis_save_period) ? this.state.analysisSaveFormFields.analysis_save_period : ""}
              onSelect={(e) => this.onOptionSelect(e, 'analysis_save_period')}
              displayKey='name'
              uniqueKey='id'
              selectLabel='Period'
              maxHeight={120}
            />
          </div>
        </div>

        {this.props.config.period_comparison_enabled &&
          <div className="field-wrapper">
            <div className="form-group">
              <SpeedSelect
                options={this.props.period_comparison_preselect_options}
                selectedOption={(this.state.analysisSaveFormFields.analysis_save_comparison_preselect) ? this.state.analysisSaveFormFields.analysis_save_comparison_preselect : ""}
                onSelect={(e) => this.onOptionSelect(e, 'analysis_save_comparison_preselect')}
                displayKey='name'
                uniqueKey='id'
                selectLabel='Compare With'
                maxHeight={120}
              />
            </div>
          </div>
        }


        {((this.props.terminal_type === this.state.terminal_type) && (this.user.privileges[this.state.terminal_type].indexOf('SAVE_PIVOT_VIEW_MYORG') >= 0 || this.user.privileges[this.state.terminal_type].indexOf('SAVE_PIVOT_VIEW_ANYORG') >= 0)) &&
          <div className="field-wrapper">
            {this.state.organizationsList.length > 0 &&
              <div className="form-group">
                <SpeedSelect
                  options={this.state.organizationsList}
                  selectedOption={(this.state.analysisSaveFormFields.organization_specific) ? this.state.analysisSaveFormFields.organization_specific : ""}
                  onSelect={(e) => this.onOptionSelect(e, 'organization_specific')}
                  displayKey='name'
                  uniqueKey='id'
                  selectLabel='Organization'
                  maxHeight={120}
                />
              </div>
            }
          </div>
        }


        {((this.props.terminal_type === this.state.terminal_type) && (this.user.privileges[this.state.terminal_type].indexOf('SAVE_PIVOT_VIEW_MYORG') >= 0 || this.user.privileges[this.state.terminal_type].indexOf('SAVE_PIVOT_VIEW_ANYORG') >= 0)) &&
          <div className="field-wrapper">
            {this.state.orgSpecificUsersList.length > 0 &&
              <div className="form-group">
                <SpeedSelect
                  options={this.state.orgSpecificUsersList}
                  selectedOption={(this.state.analysisSaveFormFields.user_specific) ? this.state.analysisSaveFormFields.user_specific : ""}
                  onSelect={(e) => this.onOptionSelect(e, 'user_specific')}
                  displayKey='name'
                  uniqueKey='id'
                  selectLabel='User'
                  maxHeight={120}
                />
              </div>
            }
          </div>
        }

        {(this.props.terminal_type === this.state.terminal_type && this.user.privileges[this.state.terminal_type].indexOf('APEX') >= 0) &&
          <div className="field-wrapper">
            <div className="switch-toggle small">
              <div className="switch">
                <input type="checkbox" id="group-by" onChange={(e) => this.handleSwitchToggle(e, 'custom_report')} />
                <label htmlFor="group-by">Toggle</label>
              </div>
              <div className="label">Is Custom Report</div>
            </div>
          </div>
        }

        {/* {(this.props.terminal_type===this.state.terminal_type && (this.user.privileges[this.state.terminal_type].indexOf('SAVE_PIVOT_VIEW_MYORG')>=0 || this.user.privileges[this.state.terminal_type].indexOf('SAVE_PIVOT_VIEW_ANYORG')>=0) || this.user.privileges[this.state.terminal_type].indexOf('APEX')>=0) && 
          <div className="field-wrapper">
            <div className="switch-toggle small">
              <div className="switch">
                <input type="checkbox" id="is-all-org" ref={input=>this.isAllOrgRef=input} disabled={this.state.analysisSaveFormFields['user_specific']===1 ? true : false} onChange={(e) => this.handleSwitchToggle(e, 'is_all_organization')} />
                <label htmlFor="is-all-org">Toggle</label>
              </div>
              <div className="label">All Organizations</div>
            </div>
          </div>
        } */}


        <div className="field-wrapper">
          <input type="submit" id="btn-analysis-save" value="Save" disabled={this.state.inprocess} className="btn outline xs" onClick={this.handleAnalysisViewSave} />
        </div>
      </form>
    )
  }

  //On change of oragnization - change users list - under saved view drawer
  // handleOrganizationChange(event){
  //   let field_name = event.target.name;
  //   let field_value = event.target.value;
  //   let users = [];
  //   this.state.organizationsUsersList.map((item, i) => {
  //     if(item.organization_id==field_value){
  //       users.push(item);
  //     }
  //   });

  //   //Update User List and Form Value
  //   setTimeout(() => {
  //     this.setState({ 
  //       orgSpecificUsersList: users,
  //       analysisSaveFormFields: {...this.state.analysisSaveFormFields, [field_name]:field_value} 
  //     });
  //   }, 0);
  // }

  //On Switch Toggle
  handleSwitchToggle(event, type) {
    if (type === 'custom_report') {
      this.setState({ isCustomReport: event.target.checked });
    }
    // else if(type==='is_all_organization'){
    //   let updatedSaveFormFields = JSON.parse(JSON.stringify(this.state.analysisSaveFormFields));
    //   updatedSaveFormFields['is_all_organization'] = event.target.checked;
    //   updatedSaveFormFields['user_specific'] = '';
    //   this.setState({analysisSaveFormFields: updatedSaveFormFields});
    // }
  }

  //On select change
  onOptionSelect(event, field) {
    if (field === 'organization_specific') {
      let users = [];
      this.state.organizationsUsersList.forEach((item, i) => {
        if (item.organization_id == event.id) {
          users.push({ id: item.id, name: item.email });
        }
      });

      //Update User List and Form Value
      this.setState({
        orgSpecificUsersList: users,
        analysisSaveFormFields: { ...this.state.analysisSaveFormFields, [field]: event, 'user_specific': '' }
      });
    } else if (field === 'user_specific') {
      this.setState({
        analysisSaveFormFields: { ...this.state.analysisSaveFormFields, [field]: event }
      });

      //change is_all_organization to 0 incase user selected from dropdown
      setTimeout(() => {
        if (this.state.analysisSaveFormFields['is_all_organization']) {
          this.isAllOrgRef.click();
        }
      }, 0);

    } else {
      this.setState({
        analysisSaveFormFields: { ...this.state.analysisSaveFormFields, [field]: event }
      });
    }
  }

  render() {
    return (
      <div className="analysis-save-view">
        {this.analysisSaveForm()}
      </div>
    );
  }
}

export default AnalysisViewSave;