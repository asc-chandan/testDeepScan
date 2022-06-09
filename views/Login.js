import React, { Component } from 'react';
import * as Constants from '../components/Constants';
import APIService from '../services/apiService';
import socialLoginApi from '../services/socialLogin';
import SHA512 from 'crypto-js/sha512';
import Base64 from 'crypto-js/enc-base64';
import { setUserSession, getUserDetailsFromToken } from '../utils/Common';
import ResetPassword from './ResetPassword';

class Login extends Component {
  constructor() {
    super();
    this.state = {
      error: '',
      inprocess: false,
      showPassword: false,
      username: '',
      password: '',
      isResetPassword: false
    };

    this.googleSdkLoadedSubscription = null;
    this.facebookSdkLoadedSubscription = null;

    this.onGoogleSignInBtn = this.onGoogleSignInBtn.bind(this);
    this.onFacebookSignInBtn = this.onFacebookSignInBtn.bind(this);

    this.handlePassChange = this.handlePassChange.bind(this);
    this.handleUserChange = this.handleUserChange.bind(this);
    this.handleForgetPasswordButton = this.handleForgetPasswordButton.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.dismissError = this.dismissError.bind(this);
  }


  componentWillUnmount() {
    if (this.googleSdkLoadedSubscription) { this.googleSdkLoadedSubscription.unsubscribe(); }
    if (this.facebookSdkLoadedSubscription) { this.facebookSdkLoadedSubscription.unsubscribe(); }
  }

  handleClickShowPassword = () => {
    this.setState({ showPassword: !this.state.showPassword })
  };

  dismissError() {
    this.setState({ error: '' });
  }

  handleSubmit(evt) {
    console.log('submit')
    evt.preventDefault();
    let error_msg = '';

    //Input Validations
    if (!this.state.username) { error_msg = 'Username is required'; }
    if (!this.state.password) { error_msg = 'Password is required'; }
    if (!this.state.username && !this.state.password) { error_msg = 'Username/Password is required'; }

    //if there is error return after giving message
    if (error_msg !== '') {
      this.setState({ error: error_msg });
      return false;
    }

    this.setState({
      error: error_msg,
      inprocess: true
    });

    //Send Login Request
    const hashPassword = SHA512(this.state.password);
    const hasedPassword = hashPassword.toString(Base64);
    const loginPayLoad = {
      username: this.state.username,
      password: hasedPassword,
    };
    APIService.apiRequest(Constants.API_BASE_URL+'/auth/login', loginPayLoad, false, 'POST', null, false)
      .then(response => {
        if (response.access_token && response.access_token !== '') {
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
          setTimeout(()=>{
            console.log('Successfully Login');
            // this.props.history.push(default_home_url);
            this.props.history.push("/");
          });
          
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
          });
        }
      })
      .catch(err => {
        this.setState({ inprocess: false, error: err.msg });
      });
  }

  handleUserChange(evt) {
    this.dismissError();
    this.setState({
      username: evt.target.value,
    });
  }

  handlePassChange(evt) {
    this.dismissError();
    this.setState({
      password: evt.target.value,
    });
  }

  handleForgetPasswordButton() {
    this.props.handleResetPassword();
    this.dismissError();
    this.setState({ erroe: '', isResetPassword: !this.state.isResetPassword })
  }

  handleErrorOnForgotPassword(err, that) {
    console.log(err)
    that.setState({ error: err });
  }

  /**SOCIAL LOGINS RELATED METHODS */
  onGoogleSignInBtn() {
    // for handling multiple clicks : unsubscribe from previous scubscription, otherwise it can lead to unexpected behaviours
    if (this.googleSdkLoadedSubscription) { this.googleSdkLoadedSubscription.unsubscribe(); }

    this.googleSdkLoadedSubscription = socialLoginApi.googleSdkLoaded.subscribe((sdkLoaded) => {
      if (!sdkLoaded) { return; }

      const getUserProfileAndSendToServer = (user) => {

        this.setState({ loading: true, errMsgForSocial: '' });

        const profile = user.getBasicProfile();
        // console.log(user.getAuthResponse(true));
        const idToken = user.getAuthResponse(true).id_token;
        // console.log('game- google signin response', profile.getName(), '--', profile.getGivenName(), profile.getEmail());
        // send the user info to our own login api
        const payload = {
          name: profile.getName(),
          username: profile.getEmail(),
          cover_img_url: profile.getImageUrl(),
          id_token: idToken,
          login_source: 'google'
        };

        this.onSocialLogin(payload);
      }

      const authInstance = window.gapi.auth2.getAuthInstance();
      // console.log('game- google signin status', authInstance.isSignedIn.get());
      if (authInstance.isSignedIn.get()) {
        const user = authInstance.currentUser.get();
        getUserProfileAndSendToServer(user);
      } else {
        authInstance.signIn()
          .then(user => {
            getUserProfileAndSendToServer(user);

          }).catch(err => {
            console.log('game - google signin error', err.msg);
          });
      }
    });
  }

  onFacebookSignInBtn() {
    if (this.facebookSdkLoadedSubscription) { this.facebookSdkLoadedSubscription.unsubscribe(); }
    this.facebookSdkLoadedSubscription = socialLoginApi.facebookSdkLoaded.subscribe((sdkLoaded) => {
      if (!sdkLoaded) { return; }

      const getUserProfileAndSendToServer = (token) => {
        this.setState({ loading: true, errMsgForSocial: '' });
        window.FB.api(`/me/`, { "fields": "id,name,email,picture.width(100).height(100)" }, (userProfileResponse) => {
          // console.log('game- fb profile response', userProfileResponse);

          if (!userProfileResponse || userProfileResponse.error) {
            this.setState({ loading: false, errMsgForSocial: typeof userProfileResponse.error === 'string' ? userProfileResponse.error : String(userProfileResponse.error) });
            return;
          }

          // send the user info to our own login api
          const payload = {
            name: userProfileResponse.name,
            username: userProfileResponse.email,
            cover_img_url: userProfileResponse.picture.data.url,
            id_token: token,
            login_source: 'facebook',
            fb_user_id: userProfileResponse.id
          };
          this.onSocialLogin(payload);

        });
      }

      window.FB.getLoginStatus((loginStatusResponse) => {
        // console.log('game- fb login status', loginStatusResponse)
        if (loginStatusResponse.status !== 'connected') {
          window.FB.login((loginResponse) => {
            // console.log('game- fb loign response : ', loginResponse);
            // on successfull login, status will be 'connected'
            if (loginResponse.status === 'connected') {
              getUserProfileAndSendToServer(loginResponse.authResponse.accessToken);
            } else {
              // alert('Some error occured');
            }
          }, {
            scope: 'email',
            return_scopes: true
          });
        } else {
          // user is logged in to FB in his/her browser and already authenticated our app previously.
          // hence just send the login request to our server
          getUserProfileAndSendToServer(loginStatusResponse.authResponse.accessToken);
        }
      });

    });
  }

  onSocialLogin(payload) {
    APIService.apiRequest(Constants.API_BASE_URL+'/auth/login',payload,false,'POST')
      .then((response) => {
        this.setState({ loading: false });
        // this.props.onDone();
        let user_details = getUserDetailsFromToken(response.access_token);
        let user_info = user_details.identity;
        setUserSession(response.access_token, user_info); //Set token and user details in session
        this.props.history.push('/self_register/welcome');

      })
      .catch(err => {
        // console.log('game- social login error', err);
        this.setState({ loading: false, errMsgForSocial: err.msg });
      });
  }



  render() {
    return (
      <div>
        <div className="login-header">
          <h2>{this.state.isResetPassword ? 'Forgot Password' : 'Login'}</h2>
          {this.state.error &&
            <div className="alert" data-test="error" onClick={this.dismissError}>
              {this.state.error}
            </div>
          }
        </div>
        {this.state.isResetPassword ? (
          <ResetPassword {...{ history: this.props.history , location: this.props.location, handleResetPassword: this.handleForgetPasswordButton, handleError: this.handleErrorOnForgotPassword, dismissError: this.dismissError, that: this }} />
        ) : (<>
        <form className="login-form" onSubmit={this.handleSubmit} autoComplete="off">
          <div className="field-wrapper">
            <input type="text" name="username" className="input-field required" placeholder='Username / Email' data-test="username" value={this.state.username} onChange={this.handleUserChange} />
          </div>

          <div className="field-wrapper field-passowrd">
            <input type={this.state.showPassword ? 'input' : 'password'} name="password" placeholder='Password' className="input-field required" data-test="username" value={this.state.password} onChange={this.handlePassChange} />
          </div>

          <a className="link-forgot-password" onClick={this.handleForgetPasswordButton}>Forgot Password</a>

          <div className="btn-wrapper">
            <input type="submit" className="btn" name="btn-submit" id="btn-submit" value={this.state.inprocess ? 'please wait...' : 'Log In'} disabled={this.state.inprocess} data-test="submit" />
          </div>
        </form>

        <div className="login-separater">
          <span>or</span>
        </div>

        <div className="social-media-login">
            <button className="btn btn-google" onClick={this.onGoogleSignInBtn}>Google</button>
            <button className="btn btn-facebook" onClick={this.onFacebookSignInBtn}>Meta</button>
        </div>
        </>)}
      </div>
    );

  }
}

export default Login;