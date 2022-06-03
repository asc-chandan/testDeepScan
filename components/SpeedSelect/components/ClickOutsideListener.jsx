import React from 'react';

export default class ClickOutsideListener extends React.Component {
    constructor(props) {
        super(props);
        this.domRef = React.createRef();
        this.listener = this.listener.bind(this);
    }

    componentDidMount() {
        document.addEventListener('click', this.listener);
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.listener);
    }

    isClickedOutside(e) {
        if(!this.domRef.current.contains(e.target)){
            return true;
        }
        return false;
    }

    listener(e) {
        if (this.isClickedOutside(e)) {
            this.props.onOutsideClick();
        }
    }

    render() {
        return (
            <div ref={this.domRef}>
                {this.props.children}
            </div>
        );
    }
}