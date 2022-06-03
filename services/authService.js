import AuthHeader from '../utils/AuthHeader';
import { getLocalStorageVal } from '../utils/Common';
import AlertSevice from './alertService';

const APIService = {
    apiRequest(API_URL, data, showProgress = false, req_method = 'POST', controller = null, authHeader = null) {
        let headerAuthHeader = (authHeader) ? authHeader : AuthHeader();
        let options = {
            method: req_method, // *GET, POST, PUT, DELETE, etc.
            mode: 'cors', // no-cors, *cors, same-origin
            // cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin', // include, *same-origin, omit
            headers: {
                'Content-Type': 'application/json',
                'Authorization': headerAuthHeader,
                'App-Version': window.SITE_VERSION || '0.0.0'
                // 'Unique-Id': getLocalStorageVal('sessionid')
            },
            redirect: 'follow', // manual, *follow, error
            referrerPolicy: 'no-referrer' // no-referrer, *client
        }
        if (req_method === 'POST' || req_method === 'PUT' || req_method === 'DELETE') {
            options['body'] = JSON.stringify(data);
        }
        if (controller) {
            options['signal'] = controller.signal;
        }

        // Default options are marked with *
        return fetch(API_URL, options)
            .then((response) => {
                // const cookies = response.headers['set-cookie'];
                // const settingsCookie = cookies.find((cookie) => cookie.startsWith('AWSALB='))
                // const parsedCookie = cookie.parse(settingsCookie)
                // console.log(response.headers);
                // // con

                // document.cookie = "AWSALB="+response.headers.get('set-cookie');
                // document.cookie = "AWSALB_L1="+response.headers['set-cookie'];
                // console.log('-------------------------');
                // console.log(response.headers.get('set-cookie')); // undefined
                // console.log(document.cookie); // nope
                // console.log('-------------------------');

                if (showProgress) {
                    if (!response.ok) { throw Error(response.status + ' ' + response.statusText) }

                    // ensure ReadableStream is supported
                    if (!response.body) { throw Error('ReadableStream not yet supported in this browser.') }

                    const contentLength = +response.headers.get('Content-Length'); // Step 2: get total length
                    // const AWSALB_Cookie = response.headers.get('Set-Cookie'); 

                    const reader = response.body.getReader(); // Step 3: read the data
                    return { total_len: contentLength, reader: reader };
                } else {
                    if (response.status === 207) {
                        // Special check - 207 indicates that a New version of app is available 
                        // so in this case, force reload the browser so that user gets the latest version of app
                        window.location.reload();
                        return {};
                    }
                    return response.json()
                        .then((parsedResponse) => {
                            if (parsedResponse.status === 0) {
                                AlertSevice.showToast('error', parsedResponse.message || parsedResponse.msg || 'Some error occured');
                            }

                            return parsedResponse;
                        });
                }
            })
            .catch((e) => {
                console.log('api request cancel', e.message);
                if (e.message !== 'The user aborted a request.') {
                    AlertSevice.showToast('error', e.message || 'Some Error Occured');
                }
                return {};
            });
    },
    abortAPIRequests(controller) {
        controller.abort();
    }
};

export default APIService;


import * as Constants from '../components/Constants.js';

const authService = {
    isLoggedIn() {
        return new Promise((res, rej) => {
            window.SSO.isLoggedIn((status) => res(status));
        });
    },
    saveToken(token) {
        return new Promise((res, rej) => {
            window.SSO.saveToken(token, () => res());
        });
    },

    getAndSaveUserInfo() {
        return new Promise((res, rej) => {
            axios.get(Constants.API_BASE_URL + '/profile')
            .then(resp => {
                const userData = resp.data;
                window.SSO.saveUserInfo(JSON.stringify(userData), () => res(resp));
            });
        });
    },
    clearToken() {
        localStorage.removeItem('access_token');
    },
    login(data) {
        return axios.post(Constants.API_BASE_URL + '/auth/login', data);
    },
    logout() {
        return new Promise((res, rej) => {
            localStorage.clear();
            window.SSO.clearData(() => res());
        });
    },
    register(userInfo) {
        return axios.post(Constants.API_BASE_URL + '/auth/register', userInfo);
    }
};

export default authService;
