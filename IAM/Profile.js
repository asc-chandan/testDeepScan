import React, { Component } from 'react';
import * as Constants from '../components/Constants.js';
import { getUser, generateHashedPassword } from '../utils/Common';
import '../styles/profile.scss';

//Import Services
import APIService from '../services/apiService';

class Profile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      inprocess1: false,
      status1: "",
      message1: "",
      inprocess2: false,
      status2: "",
      message2: "",
      user: getUser(),
      user_name: '',
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      company: '',
      current_password: '',
      new_password: '',
      confirm_new_password: '',
      show_change_password: false
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleProfileUpdateSubmit = this.handleProfileUpdateSubmit.bind(this);
    this.handleChangePasswordSubmit = this.handleChangePasswordSubmit.bind(this);
    this.handleChangePasswordToggle = this.handleChangePasswordToggle.bind(this);
    this.page_title = "Profile";
  }

  componentDidMount() {
    //Do Nothing
    this.setState({
      user_name: this.state.user.user_name,
      email: this.state.user.email,
      first_name: this.state.user.first_name,
      last_name: this.state.user.last_name,
      phone: this.state.user.phone,
      country: this.state.user.country,
    });
  }


  handleChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  //Handle Profile Update Submit
  handleProfileUpdateSubmit(event) {
    event.preventDefault();

    //Input Validations
    this.setState({ inprocess1: true, status1: '', message1: '' });

    const profilePayLoad = {
      "action_type": 'update-user',
      "user_username": this.state.user_name,
      "user_email": this.state.email,
      "user_first_name": this.state.first_name,
      "user_last_name": this.state.last_name,
      "phone": this.state.phone,
      "country": this.state.country
    };
    APIService.apiRequest(Constants.API_BASE_URL + '/iam', profilePayLoad)
      .then(response => {
        if (response.status === 1) {
          //Update User updated information into Local Storage
          this.updateUserInfoInLocalStorage();

          //Set State
          this.setState({ inprocess1: false, status1: 'success', message1: response.message });

          //Hide the message after 5 seconds
          setTimeout(() => {
            this.setState({ message1: '', status1: '' });
          }, 5000);
        } else {
          this.setState({ inprocess1: false, status1: 'error', message1: response.message });
        }
      })
      .catch(err => {
        this.setState({ inprocess1: false, status1: 'error', message1: err.msg });
      });
  }


  //Update User Info into Local Storage
  updateUserInfoInLocalStorage() {
    // Get the existing data
    let userStr = localStorage.getItem(Constants.SITE_PREFIX + 'user');

    // If no existing data, create an array
    userStr = (userStr) ? JSON.parse(userStr) : {};

    // Add new data to localStorage Array
    userStr['first_name'] = this.state.first_name;
    userStr['last_name'] = this.state.last_name;
    userStr['phone'] = this.state.phone;
    userStr['country'] = this.state.country;

    // Update it to localStorage
    localStorage.setItem(Constants.SITE_PREFIX + 'user', JSON.stringify(userStr));
  }


  //Handle Change Password Change Submit
  handleChangePasswordSubmit(event) {
    event.preventDefault();

    //Input Validations
    this.setState({ inprocess2: true, status2: '', message2: '' });

    const changePasswordPayLoad = {
      "action_type": 'update-user',
      "old_password": generateHashedPassword(this.state.current_password),
      "new_password": generateHashedPassword(this.state.new_password),
      "confirm_password": generateHashedPassword(this.state.confirm_new_password)
    };
    APIService.apiRequest(Constants.API_BASE_URL + '/iam/change_password', changePasswordPayLoad)
      .then(response => {
        if (response.status === 1) {
          this.setState({
            inprocess2: false,
            status2: 'success',
            message2: response.message,
            current_password: '',
            new_password: '',
            confirm_new_password: '',
          });

          //Hide the message after 5 seconds
          setTimeout(() => {
            this.setState({ message2: '', status2: '' });
          }, 5000);
        } else {
          this.setState({ inprocess2: false, status2: 'error', message2: response.message });
        }
      })
      .catch(err => {
        this.setState({ inprocess2: false, status2: 'error', message2: err.msg });
      });
  }

  //Handle Change Password Form Toggle
  handleChangePasswordToggle() {
    if (this.state.show_change_password === true) {
      this.setState({ show_change_password: false });
    } else {
      this.setState({ show_change_password: true });
    }
  }


  render() {
    let showLoadingClass1 = (this.state.inprocess1 === true) ? 'show-loading' : '';
    let showLoadingClass2 = (this.state.inprocess3 === true) ? 'show-loading' : '';
    let showChangePasswordButtom = (this.state.show_change_password === false) ? '' : 'hidden';
    let showChangePasswordForm = this.state.show_change_password;

    // const { classes } = this.props;

    return (
      <div className="app-wrapper profile">

        <div className="container">

          <section className="section">
            <form id="profile-update-form" className={'custom-form ' + showLoadingClass1} onSubmit={this.handleProfileUpdateSubmit}>
              {this.state.message1 &&
                <div className={'alert ' + this.state.status1}>
                  {this.state.message1}
                </div>
              }

              <div className="row">
                <div className="col-50">
                  <div className="field-wrapper">
                    <div className="disabled field-with-label">
                      <label>Username</label>
                      <input type="text" name="user_name" className="field-control" value={this.state.user_name} disabled />
                    </div>
                  </div>
                </div>
                <div className="col-50">
                  <div className="field-wrapper">
                    <div className="field-with-label">
                      <label>First Name</label>
                      <input type="text" name="first_name" className="field-control required" value={this.state.first_name} onChange={this.handleChange} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-50">
                  <div className="field-wrapper">
                    <div className="field-with-label">
                      <label>Last Name</label>
                      <input type="text" name="last_name" className="field-control required" value={this.state.last_name} onChange={this.handleChange} />
                    </div>
                  </div>
                </div>

                <div className="col-50">
                  <div className="field-wrapper">
                    <div className="disabled field-with-label">
                      <label>Email</label>
                      <input type="text" name="email" className="field-control required" value={this.state.email} disabled />
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-50">
                  <div className="field-wrapper">
                    <div className="select-box field-with-label">
                      <label>Country</label>
                      <select className="select field-control" id="country" name="country" onChange={this.handleChange}>
                        <option value="">Select</option>
                        <option value="India">India</option>
                        <option value="USA">USA</option>
                        <option value="UK">UK</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="col-50">
                  <div className="field-wrapper">
                    <div className="field-with-label">
                      <label>Phone</label>
                      <input type="text" name="phone" className="field-control required" value={this.state.phone} onChange={this.handleChange} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="row profile-btn">
                <button id="btn-toggle-change-password" className={'btn btn-large ' + showChangePasswordButtom} onClick={this.handleChangePasswordToggle}>Change Password</button>
                <input type="submit" value="Update" className="btn btn-large" />
              </div>
            </form>
          </section>


          {showChangePasswordForm &&
            <section className="section">
              <form id="change-password-form" className={'custom-form '  + showLoadingClass2} onSubmit={this.handleChangePasswordSubmit}>
                {this.state.message2 &&
                  <div className={'alert ' + this.state.status2}>
                    {this.state.message2}
                  </div>
                }
                <div className="row">
                  <div className="col-50">
                    <div className="field-wrapper">
                      <div className="field-with-label">
                        <label>Current Password</label>
                        <input type="text" name="current_password" className="field-control required" value={this.state.current_password} onChange={this.handleChange} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-50">
                    <div className="field-wrapper">
                      <div className="field-with-label">
                        <label>New Password</label>
                        <input type="text" name="new_password" className="field-control required" value={this.state.new_password} onChange={this.handleChange} />
                      </div>
                    </div>
                  </div>

                  <div className="col-50">
                    <div className="field-wrapper">
                      <div className="field-with-label">
                        <label>Confirm New Password</label>
                        <input type="password" name="confirm_new_password" className="field-control required" value={this.state.confirm_new_password} onChange={this.handleChange} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-25"><input type="submit" value="Change" className="btn btn-submit outline small" /></div>
                </div>
              </form>
            </section>
          }
        </div>
      </div>
    );
  }

}


// Profile.propTypes = {
//   classes: PropTypes.object.isRequired
// };

export default Profile;