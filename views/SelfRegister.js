import React, { Component } from 'react';

class SelfRegister extends Component {
    constructor(props) {
        super(props);
        this.state = {
        }
        this.page_title = 'Self Register';

    }


    render() {

        return (
            <div className="app-wrapper">
                <div id="app-sub-header">
                    <h2 className="page-title">{this.page_title}</h2>
                </div>

                <div className="container">
                    <div className="">
                        <h2>User Created, Please contact admin for privileges</h2>
                    </div>
                </div>
            </div>
        );
    }
}

export default SelfRegister;