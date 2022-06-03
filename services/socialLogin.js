import { BehaviorSubject } from 'rxjs';
import { FACEBOOK_APP_ID, FACEBOOK_SDK_VERSION, GOOGLE_CLIENT_ID } from '../components/Constants';

const socialLoginApi = {

    facebookSdkLoaded: new BehaviorSubject(false), // will be changed only one time in this case, as script will be loaded once and then not deleted from page
    googleSdkLoaded: new BehaviorSubject(false), // will be changed only one time in this case, as script will be loaded once and then not deleted from page

    notifyFacebookSdkLoaded() {
        // this method will be called only once when script is loaded
        this.facebookSdkLoaded.next(true);
    },

    loadFacebookSdk() {
        // check if already present on page or not
        const existingSdk = document.getElementById('fb-sdk');
        if (existingSdk) {
            this.notifyFacebookSdkLoaded();
        } else {
            const s = document.createElement('script');
            s.id = 'fb-sdk';
            s.src = 'https://connect.facebook.net/en_US/sdk.js';
            s.onload = () => {
                // first init the sdk and then notify any listener about its availablity
                window.FB.init({
                    appId: FACEBOOK_APP_ID,
                    status: true,
                    xfbml: true,
                    version: FACEBOOK_SDK_VERSION
                });
                this.notifyFacebookSdkLoaded();
            }

            document.body.appendChild(s);
        }
    },
    notifyGoogleSdkLoaded() {
        // this method will be called only once when script is loaded
        this.googleSdkLoaded.next(true);
    },

    loadGoogleSdk() {
        // check if already present on page or not
        const existingSdk = document.getElementById('google-sdk');
        if (existingSdk) {
            window.gapi.load('auth', () => {
                // init GoogleAuth object
                window.gapi.auth2.init({
                    client_id: GOOGLE_CLIENT_ID,
                    scope:'email profile'
                }).then(() => this.notifyGoogleSdkLoaded(), err => console.log('game- google sdk init error', err));
            });
        } else {
            const s = document.createElement('script');
            s.id = 'google-sdk';
            s.src = 'https://apis.google.com/js/platform.js';
            s.onload = () => {
                // first init the sdk and then notify any listener about its availablity
                window.gapi.load('auth', () => {
                    // init GoogleAuth object
                    window.gapi.auth2.init({
                        client_id: GOOGLE_CLIENT_ID
                    }).then(() => {
                        this.notifyGoogleSdkLoaded();
                        // now we can call any methods available on GoogleAuth object
                    }, err => {
                        console.log('game- google sdk init error', err);
                    });
                });
            }

            document.body.appendChild(s);
        }
    }

};

export default socialLoginApi;
