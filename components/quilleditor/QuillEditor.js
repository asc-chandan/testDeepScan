import React, { Component } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

import * as Constants from '../../components/Constants.js';

//Import Common Functions
import { getKeyByValue, getClients } from '../../utils/Common';

//Import services
import APIService from '../../services/apiService';

/*
 * Custom toolbar component including insertStar button and dropdowns
 */
const CustomToolbar = () => (
  <div id="toolbar">
    <button className="ql-bold" />
    <button className="ql-italic" />
    <button name="submit-custom-note" id="submit-custom-note" onClick={this.handleCustomNoteSubmit}></button>
  </div>
);


class QuillEditor extends Component {
  constructor(props) {
    super(props)
    this.state = {
      inprocess: false,
      error: "",
      chartNotes: {},
      custom_note_editor: (this.props.value!==undefined) ? this.props.value : ''
    }
    this.customNoteDate = React.createRef();
    this.handleCustomNoteChange = this.handleCustomNoteChange.bind(this);
    this.handleCustomNoteSubmit = this.handleCustomNoteSubmit.bind(this);
  }

  componentDidMount(){
    //Do Nothing
  }

  componentDidUpdate(prevProps) {
    if ((prevProps.value !== undefined && this.props.value!==undefined) && prevProps.value !== this.props.value) {
      this.setState({custom_note_editor: this.props.value});
    }
  }

  
  //Handle Custom Note Submission
  handleCustomNoteChange(value){
    this.setState({custom_note_editor: value});
    if(this.props.onCustomNoteChange!==undefined){
      this.props.onCustomNoteChange(value);
    }
  }


  //Save Custom Notes
  handleCustomNoteSubmit(e){
    //Get selected date from hiddent date input dom node
    const node = this.customNoteDate.current;
    // cosnole.log('Submitted'+ this.state.custom_note_txt_field +'---'+node.value);

    //Input Validations and Send Fetch Request
    this.setState({ error: '', inprocess: true });
    
    let customNotePayLoad = {
      "client_id": this.props.client.id,
      "view_type": this.props.view_type,
      "date": node.value,
      "note": this.state.custom_note_editor
    }
    APIService.apiRequest(Constants.API_BASE_URL+'/saveCustomNotes', customNotePayLoad)
      .then(response => {
        if(response.status===1){
          this.props.onCustomNoteSubmit();
          this.setState({
            custom_note_editor: '',
            inprocess: false
          });

        } else {
          this.setState({inprocess: false, error: response.msg });
        }
      })
      .catch(err => {
        this.setState({ error: err.msg });
      });
  }

  render() {
    let show_loading = (this.state.inprocess) ? 'show-loading' : '';
    return (
      <div className={'editor-wrapper ' +show_loading}>
        <ReactQuill 
          readOnly={(this.props.readOnly!==undefined && this.props.readOnly==='true') ? this.props.readOnly : undefined}
          value={this.state.custom_note_editor} 
          onChange={this.handleCustomNoteChange} 
          modules={QuillEditor.modules}
          placeholder={this.props.placeholder && this.props.placeholder} />
        <input type="hidden" name="txt-date" id="txt-date" ref={this.customNoteDate} />
        <button name="submit-custom-note" id="submit-custom-note" onClick={this.handleCustomNoteSubmit}></button>
      </div>
    );
  }
}

/* 
 * Quill modules to attach to editor
 * See http://quilljs.com/docs/modules/ for complete options
 */
QuillEditor.modules = {
  toolbar: {
    container:
    [
      ['bold', 'italic', 'underline'],        // toggled buttons
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      // ['clean'] // remove formatting button         
    ],
    handlers: {
      // "placeholder": function (value) { 
      //   if (value) {
      //     const cursorPosition = this.quill.getSelection().index;
      //     this.quill.insertText(cursorPosition, value);
      //     this.quill.setSelection(cursorPosition + value.length);
      //   }
      // }
    }
  }
}

export default QuillEditor;