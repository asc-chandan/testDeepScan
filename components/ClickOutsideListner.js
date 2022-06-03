import React from 'react';
export default class ClickOutsideListner extends React.Component {
  constructor(props) {
    super(props);
    this.domRef = React.createRef();
    this.listener = this.listener.bind(this);
  }

  componentDidMount() {
    document.addEventListener('click', this.listener,true);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.listener,true);
  }

  isClickedOutside(e) {
    // console.log('Click outside listener Called..');
    // e.stopPropagation();,true
    if (this.domRef.current && !this.domRef.current.contains(e.target)) {
      // console.log('Click outside listener SUCCESS..');
      return true;
    }

    return false;
  }

  listener(e) {
    if (this.isClickedOutside(e)) {
      this.props.onOutsideClick(e);
    }
  }

  render() {
    return (
      <div ref={this.domRef} className={(this.props.className !== undefined ? this.props.className : '')}>
        {this.props.children}
      </div>
    );
  }
}