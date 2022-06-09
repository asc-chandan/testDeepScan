import React from 'react';
import * as Constants from '../components/Constants';
import APIService from '../services/apiService';
import SHA512 from 'crypto-js/sha512';
import Base64 from 'crypto-js/enc-base64';
import { setUserSession, getUserDetailsFromToken } from '../utils/Common';

class ResetPassword extends React.Component {
    constructor() {
        super();
        this.state = {
            error: '',
            inprocess: false,
            inProcessOtp: false,
            otpValid: false,
            isOtpConfirmed: false,
            showPassword: false,
            email: '',
            password: '',
            confirmPassword: '',
            otp: '',
            sec: 120,
            token: null,
            stopTimer: false,
            isPasswordReset: false,
            loginTime: 9,
            logUserIn: false
        };

        this.timeOut = null;

        this.handlePassChange = this.handlePassChange.bind(this);
        this.handleConfirmPassChange = this.handleConfirmPassChange.bind(this);
        this.handleUserChange = this.handleUserChange.bind(this);
        this.handleOtpChange = this.handleOtpChange.bind(this);
        this.handleConfirmOtp = this.handleConfirmOtp.bind(this);
        this.handleLoginUser = this.handleLoginUser.bind(this);
        this.handleLoginAndTimer = this.handleLoginAndTimer.bind(this);
        this.handleSendOTP = this.handleSendOTP.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.dismissError = this.dismissError.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
    }

    handleClickShowPassword = () => {
        this.setState({ showPassword: !this.state.showPassword })
    };

    dismissError() {
        this.setState({ error: '' });
    }

    handleLoginUser(evt) {
        evt.preventDefault();
        this.setState({ logUserIn: true });
    }

    handleLoginAndTimer(response) {
        if (this.state.loginTime === 0 || this.state.logUserIn) {
            //Redirect to home page after succcessful login
            let user_details = getUserDetailsFromToken(response.access_token);

            let user_info = user_details.identity;
            let terminal_type = { id: 'sellside', name: 'Sell Side' };
            if (user_info.clients.length === 0 && user_info.organization_id > 1 && user_info.privileges['klay_media'] !== undefined) {
                terminal_type = { id: 'klay_media', name: 'Klay Media' };
            }
            user_info.terminal_type = terminal_type;
            // let default_home_url = getDefaultHomePageURL(sitePages, terminal_type, user_info);

            //set default home url under local storage for future redirection
            // user_info.default_home_url = default_home_url;
            user_info.default_home_url = "/";

            //set terminals
            if (response.terminal) {
                user_info['terminals'] = response.terminal;
            }

            setUserSession(response.access_token, user_info); //Set token and user details in session
            setTimeout(() => {
                console.log('Successfully Login');
                // this.props.history.push(default_home_url);
                this.props.history.push("/");
            });
        } else {
            setTimeout(() => {
                this.setState({ loginTime: this.state.loginTime - 1 });
                this.handleLoginAndTimer(response);
            }, 1000);
        }
    }

    handleSubmit(evt) {
        evt.preventDefault();
        let error_msg = '';
        
        //Input Validations
        if (!this.state.password) { error_msg = 'Password is required' }
        if (!this.state.confirmPassword) { error_msg = 'Confirm Password is requried' }
        if (!this.state.password && !this.state.confirmPassword) { error_msg = 'Password and Confirm Password are requried' }
        if (this.state.password !== this.state.confirmPassword) { error_msg = 'Confirm Password should be same as Password' }

        //if there is error return after giving message
        if (error_msg !== '') {
            this.setState({ error: error_msg }, () => {
                this.props.handleError(this.state.error, this.props.that);
            });
            return false;
        }

        this.setState({
            error: error_msg,
            inprocess: true
        });

        const hashPassword = SHA512(this.state.password);
        const hasedPassword = hashPassword.toString(Base64);
        const hashConfirmPassword = SHA512(this.state.confirmPassword);
        const hasedConfirmPassword = hashConfirmPassword.toString(Base64);
        const payload = {
            email: this.state.email,
            token: this.state.token,
            new_password: hasedPassword,
            confirm_password: hasedConfirmPassword
        };

        APIService.apiRequest(Constants.API_BASE_URL + '/auth/forgot_password', payload, false, 'POST')
            .then(response => {
                if (response.access_token && response.access_token !== '') {
                    this.setState({ isPasswordReset: true });
                    
                    this.handleLoginAndTimer(response);
                    // New Method
                    //save token to sso local storage for one login
                    // window.SSO.saveToken(response.access_token, ()=>{
                    //   window.SSO.saveUserInfo(JSON.stringify(user_info), () => {
                    //     setTimeout(()=>{
                    //       console.log('getToken 1', getToken());
                    //       window.SSO.getToken((token) => {
                    //         console.log('token 2', token);
                    //         return token;
                    //       });
                    //       console.log('Successfully Login', default_home_url);
                    //       this.props.history.push(default_home_url);
                    //     }, 10);
                    //   });
                    // });

                } else {
                    this.setState({
                        inprocess: false,
                        error: response.msg
                    }, () => {
                        this.props.handleError(this.state.error, this.props.that);
                    });
                }
            })
            .catch(err => {
                this.setState({ inprocess: false, error: err.msg }, () => {
                    this.props.handleError(this.state.error, this.props.that);
                });
            });
    }

    handleSendOTP(evt) {
        evt.preventDefault();
        let error_msg = '';

        //Input Validations
        if (!this.state.email) { error_msg = 'Email is required'; }

        //if there is error return after giving message
        if (error_msg !== '') {
            this.setState({ error: error_msg }, () => {
                this.props.handleError(this.state.error, this.props.that);
            });
            return false;
        }

        this.setState({
            error: error_msg,
            inProcessOtp: true
        });

        //API CALL TO GET OTP ON EMAIL
        APIService.apiRequest(Constants.API_BASE_URL+'/send_otp', {email: this.state.email},false,'POST')
            .then((response) => {
                if (response.status === 1) {
                    this.setState({ isOtpSent: true });
                    this.setState({ otpValid: true });
                    this.setState({ inProcessOtp: false });
                    this.setState({ stopTimer: false });
                    if (this.state.sec !== 120) {
                        this.setState({ sec: 120 })
                    }
                    if (this.timeOut !== null) {
                        clearTimeout(this.timeOut)
                    }
                    this.startOtpTimer(this.state.min, this.state.sec);
                } else {
                    this.setState({ inProcessOtp: false, error: response.msg }, () => {
                        this.props.handleError(this.state.error, this.props.that);
                    })
                }
            })
            .catch(err => {
                this.setState({ inProcessOtp: false, error: err.msg }, () => {
                    this.props.handleError(this.state.error, this.props.that);
                });
              });
    }

    handleConfirmOtp(evt) {
        evt.preventDefault();
        let error_msg = '';

        //Input Validations
        if (!this.state.otp) { error_msg = 'OTP is required' }

        //if there is error return after giving message
        if (error_msg !== '') {
            this.setState({ error: error_msg }, () => {
                this.props.handleError(this.state.error, this.props.that);
            });
            return false;
        }

        this.setState({
            error: error_msg,
            inprocess: true
        });

        const payload = {
            email: this.state.email,
            otp: this.state.otp
        }

        APIService.apiRequest(Constants.API_BASE_URL + '/auth/verify_otp', payload, false, 'POST')
            .then((response) => {
                if (response.token) {
                    this.setState({ token: response.token });
                    this.setState({ isOtpConfirmed: true });
                    this.setState({ inprocess: false });
                    this.setState({ stopTimer: true })
                } else {
                    this.setState({
                        inprocess: false,
                        error: response.msg
                    }, () => {
                        this.props.handleError("Incorrect OTP", this.props.that);
                    });
                }
            }).catch((err) => {
                this.setState({ inprocess: false, error: err.msg }, () => {
                    this.props.handleError(this.state.error, this.props.that);
                });
            })
    }

    handleUserChange(evt) {
        this.props.dismissError();
        this.setState({
            email: evt.target.value,
        });
    }

    handlePassChange(evt) {
        this.props.dismissError();
        this.setState({
            password: evt.target.value,
        });
    }

    handleConfirmPassChange(evt) {
        this.props.dismissError();
        this.setState({
            confirmPassword: evt.target.value,
        });
    }

    handleOtpChange(evt) {
        this.props.dismissError();
        this.setState({
            otp: evt.target.value
        })
    }

    handleCancel(evt) {
        evt.preventDefault();
        this.props.dismissError();
        this.props.handleResetPassword();
    }

    startOtpTimer() {
        if (!this.state.stopTimer) {
            this.timeOut = setTimeout(() => {
                if (this.state.sec === 1) {
                    this.setState({ otpValid: false });
                    this.setState({ sec: 120 })
                } else {
                    // if (this.state.sec === 1) {
                    //     this.setState({ sec: 59 });
                    //     this.setState({ min: this.state.min - 1 });
                    // } else {
                        this.setState({ sec: this.state.sec - 1 });
                    // }
                    this.startOtpTimer(this.state.min, this.state.sec);
                }
            }, 1000);
        } else {
            clearTimeout(this.timeOut);
        }
    }


    render() {
        return (
            <div>
                {this.state.isOtpConfirmed ? (
                    <>
                        <form className="reset-password-form" onSubmit={this.state.inprocess ? (evt) => {evt.preventDefault()} : this.handleSubmit} autoComplete="off">
                            <div>
                                <div className='login-inner-text'>
                                    <span className='para'>{this.state.isPasswordReset ? 'Your password has been successfully changed' : 'OTP successfully authenticated. Please proceed to setup a new password'}</span>
                                </div>
                                {!this.state.isPasswordReset && (
                                    <>
                                <div className="field-wrapper field-passowrd">
                                    <input type={this.state.showPassword ? 'input' : 'password'} placeholder='Password' name="password" className="input-field required otp-form" data-test="username" value={this.state.password} onChange={this.handlePassChange} />
                                </div>
                                <div className="field-wrapper field-passowrd">
                                    <input type='password' placeholder='Confirm Password' name="confirm password" className="input-field required otp-form" data-test="username" value={this.state.confirmPassword} onChange={this.handleConfirmPassChange} />
                                </div>
                                </>)}
                                {this.state.isPasswordReset ? (
                                    <div className="btn-wrapper timer-button">
                                        <button className="btn btn-timer" onClick={this.handleLoginUser}>Login</button>
                                        <span className='timer'>{this.state.loginTime}</span>
                                    </div>) : (<div className="btn-wrapper">
                                        <button className={`btn btn-otp`} onClick={this.state.inprocess ? (evt) => { evt.preventDefault() } : this.handleSubmit}>{this.state.inProcessOtp ? 'Please Wait...' : 'Submit'}</button>
                                        <button className="btn btn-cancel" onClick={this.handleCancel}>Cancel</button>
                                    </div>
                                )}
                            </div>
                        </form>
                        </>
                ) : (
                <>
                <form className="reset-password-form" onSubmit={this.state.otpValid ? (evt) => {evt.preventDefault()} : this.handleSendOTP} autoComplete="off">
                    <div className="field-wrapper">
                        <input type="text" placeholder='Email' name="email" className="input-field required otp-form" data-test="username" value={this.state.email} onChange={this.handleUserChange} />
                    </div>

                    <div className="btn-wrapper">
                        <button className={`btn btn-otp ${(this.state.otpValid || this.state.inProcessOtp) ? 'disabled' : ''}`} onClick={(this.state.otpValid || this.state.inProcessOtp) ? (evt) => {evt.preventDefault()} : this.handleSendOTP}>{this.state.inProcessOtp ? 'Please Wait...' : (this.state.otpValid ? 'OTP Sent' : 'Generate OTP')}</button>
                        <button className="btn btn-cancel" onClick={this.handleCancel}>Cancel</button>
                    </div>
                </form>
                
                {this.state.isOtpSent && (
                    <form className="reset-password-form" onSubmit={this.state.inprocess ? (evt) => {evt.preventDefault()} : this.handleConfirmOtp} autoComplete="off">
                        <div className={`login-inner-text${this.state.otpValid ? '' : ' over'}`}> {/* change in styles as well */}
                            <p className='para'>
                                {this.state.otpValid ? (
                                        `OTP successfully sent to your Email. Expires in ${this.state.sec < 10 ? ("0" + this.state.sec) : this.state.sec} Seconds`
                                    ) : (
                                        'OTP expired '
                                    )
                                }
                                <a className='resend-otp' onClick={this.handleSendOTP}>Resend OTP</a>
                            </p>
                            </div>
                        <div className="field-wrapper otp">
                            <input type="text" placeholder='OTP' name="OTP" className="input-field required otp-form" data-test="otp" value={this.state.otp} onChange={this.handleOtpChange} />
                        </div>
                        <div className="btn-wrapper">
                            <input type="submit" className="btn" name="btn-submit" id="btn-submit" value={this.state.inprocess ? 'please wait...' : 'Submit'} disabled={this.state.inprocess || !this.state.otpValid} data-test="submit" />
                        </div>
                    </form>
                )}
                </>
                )}
                    
            </div>
        );
    }
}

export default ResetPassword;