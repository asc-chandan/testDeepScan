
import React from 'react';
import * as Constants from '../components/Constants';
import APIService from '../services/apiService';import socialLoginApi from '../services/socialLogin';
import SHA512 from 'crypto-js/sha512';
import Base64 from 'crypto-js/enc-base64';
import { setUserSession, getUserDetailsFromToken } from '../utils/Common';


export default class Register extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            // variables related to from signup
            name: '',
            username: '',
            email: '',
            password: '',

            saving: false,
            errMsg: '',

            savingSocialInfo: false,
        };

        this.googleSdkLoadedSubscription = null;
        this.facebookSdkLoadedSubscription = null;

        this.userInfoFromGoogleFacebook = null;


        this.onRegisterBtn = this.onRegisterBtn.bind(this);
        this.onInfoChange = this.onInfoChange.bind(this);
        this.dismissError = this.dismissError.bind(this);

        this.onGoogleSignupBtn = this.onGoogleSignupBtn.bind(this);
        this.onFacebookSignupBtn = this.onFacebookSignupBtn.bind(this);
    }

    componentWillUnmount() {
        if (this.googleSdkLoadedSubscription) { this.googleSdkLoadedSubscription.unsubscribe(); }
        if (this.facebookSdkLoadedSubscription) { this.facebookSdkLoadedSubscription.unsubscribe(); }
    }

    onRegisterBtn(e) {
        e.preventDefault();


        // return if required conditions are not met
        if (this.state.email.trim() === '' || this.state.password.trim() === '') {
            this.setState({ errMsg: 'Email and Password is required' });
            return;
        }

        const hashedPwd = SHA512(this.state.password);
        const hashedPwdString = hashedPwd.toString(Base64);

        // send the request to register
        const payload = {
            first_name: this.state.email,
            username: this.state.email,
            email: this.state.email,
            password: hashedPwdString,
            registration_source: 'signup'
        };
        this.setState({ saving: true, errMsg: '' });
        APIService.apiRequest(Constants.API_BASE_URL+'/auth/register',payload,false,'POST')
            .then(resp => {
                if (resp.status >= 400) {
                    const err = new Error();
                    err.msg = resp.msg;
                    err.status = resp.status;
                    throw err;
                }
                this.setState({ saving: false, errMsg: '' });
                // for now navigate to login page after successfull registration
                // this.props.history.push('/login');
                this.props.onDone();
            }).catch(err => {
                this.setState({ saving: false, errMsg: err.msg });
            });
    }

    onInfoChange(e) {

        this.setState({ [e.target.name]: e.target.value });
    }

    dismissError() {
        this.setState({ errMsg: '' });
    }


    onGoogleSignupBtn() {
        // for handling multiple clicks : unsubscribe from previous scubscription, otherwise it can lead to unexpected behaviours
        if (this.googleSdkLoadedSubscription) { this.googleSdkLoadedSubscription.unsubscribe(); }

        this.googleSdkLoadedSubscription = socialLoginApi.googleSdkLoaded.subscribe((sdkLoaded) => {

            if (!sdkLoaded) { return; }

            const getUserProfile = (user) => {
                const profile = user.getBasicProfile();
     
                const idToken = user.getAuthResponse(true).id_token;
                this.userInfoFromGoogleFacebook = {
                    name: profile.getName(),
                    email: profile.getEmail(),
                    cover_img_url: profile.getImageUrl(),
                    id_token: idToken,
                    // google_user_id: profile.getId()
                };
                this.userInfoFromGoogleFacebook.source = 'google';
                this.doSocialSignUp();
            };

            const authInstance = window.gapi.auth2.getAuthInstance();
            // console.log('game- google signin status', authInstance.isSignedIn.get());
            if (authInstance.isSignedIn.get()) {
                const user = authInstance.currentUser.get();
                const resp = user.getAuthResponse();
                console.log(resp);
                getUserProfile(user);
            } else {
                authInstance.signIn()
                    .then(user => {
                        getUserProfile(user);

                    }).catch(err => {

                        console.log('game- google signin error', err);
                    });
            }


        });
    }

    onFacebookSignupBtn() {
        if (this.facebookSdkLoadedSubscription) { this.facebookSdkLoadedSubscription.unsubscribe(); }

        this.facebookSdkLoadedSubscription = socialLoginApi.facebookSdkLoaded.subscribe((sdkLoaded) => {
            if (!sdkLoaded) { return; }
            const getUserProfile = (token) => {
                window.FB.api(`/me/`, { "fields": "id,name,email,gender,location,birthday,picture.width(100).height(100)" }, (userProfileResponse) => {
                    // console.log('game- fb profile response', userProfileResponse);

                    if (!userProfileResponse || userProfileResponse.error) {
                        this.setState({ savingSocialInfo: false, errMsg: typeof userProfileResponse.error === 'string' ? userProfileResponse.error : String(userProfileResponse.error) });
                        return;
                    }

                    this.userInfoFromGoogleFacebook = {
                        name: userProfileResponse.name,
                        email: userProfileResponse.email,
                        cover_img_url: userProfileResponse.picture.data.url,
                        id_token: token,
                        fb_user_id: userProfileResponse.id
                    };
                    this.userInfoFromGoogleFacebook.source = 'facebook';
                    this.doSocialSignUp();
                });
            }

            window.FB.getLoginStatus((loginStatusResponse) => {
                // console.log('game- fb login status', loginStatusResponse)
                if (loginStatusResponse.status !== 'connected') {
                    window.FB.login((loginResponse) => {
                        // console.log('game- fb loign response : ', loginResponse);

                        // on successfull login, status will be 'connected'
                        if (loginResponse.status === 'connected') {
                            getUserProfile(loginResponse.authResponse.accessToken, loginResponse.authResponse.userID);
                        } else {
                            // alert('Some error occured');
                        }
                    }, {
                        scope: 'email,user_gender,user_birthday',
                        return_scopes: true
                    });
                } else {
                    // user is logged in to FB in his/her browser and already authenticated our app previously.
                    // hence just send the register request to our server
                    getUserProfile(loginStatusResponse.authResponse.accessToken);
                }
            });

        });
    }

    doSocialSignUp() {
        // user info is already available from google/facebook, send it to our server along with entered username to register the user
        const payload = {
            first_name: this.userInfoFromGoogleFacebook.name,
            username: this.userInfoFromGoogleFacebook.email,
            id_token: this.userInfoFromGoogleFacebook.id_token,
            email: this.userInfoFromGoogleFacebook.email,
            cover_img_url: this.userInfoFromGoogleFacebook.cover_img_url,
            registration_source: this.userInfoFromGoogleFacebook.source
        };
        if (payload.registration_source === 'facebook') {
            payload.fb_user_id = this.userInfoFromGoogleFacebook.fb_user_id;
        }
        // console.log(payload);
        this.setState({ savingSocialInfo: true, errMsg: '' });
        APIService.apiRequest(Constants.API_BASE_URL+'/auth/register',payload,false,'POST')
            .then(resp => {
                console.log('Register Success', resp);
                if (resp.status >= 400) {
                    const err = new Error();
                    err.msg = resp.msg;
                    err.status = resp.status;
                    throw err;
                }
                this.setState({ savingSocialInfo: false });
                let user_details = getUserDetailsFromToken(resp.access_token);
                let user_info = user_details.identity;
                setUserSession(resp.access_token, user_info); //Set token and user details in session
                this.props.history.push('/self_register/welcome');
                // this.props.history.push('/self_register');

            }).catch(err => {
                console.log('Register error', err.msg);
                this.setState({ savingSocialInfo: false, errMsg: err.msg });
            });
    }

    render() {

        console.log('Printin errmsg', this.state.errMsg);

        return (
            <div>
                <div className="login-header">
                    <h2>Register</h2>
                    {this.state.errMsg &&
                        <div className="alert" data-test="error" onClick={this.dismissError}>
                            {this.state.errMsg}
                        </div>
                    }
                </div>
                <div className="register-form">
                    <form onSubmit={this.onRegisterBtn} noValidate>

                        <div className="field-wrapper">
                            <input type="text" name="email" placeholder='Username / Email' value={this.state.email} className="input-field required" data-test="username" onChange={this.onInfoChange} />
                        </div>
                        <div className="field-wrapper field-passowrd">
                            <input type="password" name="password" placeholder='Password' value={this.state.password} className="input-field required" data-test="password" onChange={this.onInfoChange} />
                        </div>

                        <div className="btn-wrapper">
                            <input type="submit" className="btn" name="btn-submit" id="btn-submit" value={(this.state.saving || this.state.savingSocialInfo) ? 'Please wait...' : 'Register'} disabled={this.state.saving || this.state.savingSocialInfo} data-test="submit" />
                        </div>

                    </form>

                    <div className="login-separater">
                        <span>or</span>
                    </div>


                </div>

                <div className="social-media-login">
                    <button className="btn btn-google" onClick={this.onGoogleSignupBtn}>Google</button>
                    <button className="btn btn-facebook" onClick={this.onFacebookSignupBtn}>Meta</button>
                </div>
            </div>
        );
    }
}