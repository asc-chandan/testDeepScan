import React, { Component } from 'react';
import '../../styles/modules/popup.scss';

class Popup extends Component {
  constructor(props) {
    super(props)
    this.state = {
      inprocess: false,
      error: ""
    }
  }

  componentDidMount(){
    //Do Nothing
  }

  render() {
    let show_loading = (this.state.inprocess) ? 'show-loading' : '';
    // console.log(this.props.content);

    return (
      <div className={'popup-wrapper ' +(this.props.size ? ' '+this.props.size : '')+' '+show_loading}>
        <div className="popup">
          <button className="btn-popup-close" onClick={this.props.closePopup}>x</button>
          {this.props.heading &&
            <div className="popup-header"><h3>{this.props.heading}</h3></div>
          }
          <div className="popup-content">
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
}

export default Popup;