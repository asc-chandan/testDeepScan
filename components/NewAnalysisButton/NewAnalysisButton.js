import React, { Component } from 'react';
import ClickOutsideListner from '../ClickOutsideListner';
import { getUser } from '../../utils/Common';

class NewAnalysisButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false
    };
    this.handleNewAnalysisClick = this.handleNewAnalysisClick.bind(this);
    this.handleToggleNewAnalysis = this.handleToggleNewAnalysis.bind(this);
  }

  handleNewAnalysisClick(event) {
    this.props.history.push(event.target.dataset.url, {
      isSavedView: false,
      analysisConfig: false
    });

    this.handleToggleNewAnalysis();
  }

  handleToggleNewAnalysis(event) {
    this.setState({ isOpen: !this.state.isOpen });
  }

  render() {
    let view_type_class = (this.props.view_type !== undefined && this.props.view_type !== '') ? 'has-viewtype' : '';
    let user = getUser();

    return (
      <React.Fragment>
        <div className="new-analysis-wrapper">
          <div className={'btn-new-analysis-wrapper ' + view_type_class}>
            <button className="btn-new-analysis" onClick={this.handleToggleNewAnalysis} title="New Analysis">
              {this.props.btn_label && <span className="label">{this.props.btn_label}</span>}

              {(this.props.view_type !== undefined && this.props.view_type !== '') &&
                <span className="type">{this.props.view_type}</span>
              }
            </button>
          </div>

          {this.state.isOpen &&
            <ClickOutsideListner childId="new-analysis-dropdown" onOutsideClick={() => this.setState({ isOpen: false })}>
              <div id="new-analysis-dropdown" className='new-analysis-dropdown'>
                {(this.props.data_sources !== undefined) &&
                  <ul>
                    {this.props.data_sources_title && <li className="title" ><button className="link">{this.props.data_sources_title}</button></li>}
                    {this.props.data_sources.map((item, i) => {
                      return <li key={i}><button className="link" data-url={(item.is_custom_trend !== undefined && item.is_custom_trend) ? '/' + this.props.terminal_type + '/' + item.name : this.props.template_url + '/' + item.name} onClick={this.handleNewAnalysisClick}>{item.display_name}</button></li>
                    })}
                  </ul>
                }
              </div>
            </ClickOutsideListner>
          }
        </div>
      </React.Fragment>
    );
  }
}

export default NewAnalysisButton;