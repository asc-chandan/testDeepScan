import React, { useState, useEffect } from 'react';
import '../styles/LoginRegister.scss';
import Login from './Login';
import Register from './Register';
import socialLoginApi from '../services/socialLogin';

const LoginRegister = ({ location ,history}) => {
    const [isResetPassword, setIsResetPassword] = useState(false);

    const handleResetPassword = () => {
        setIsResetPassword(!isResetPassword);
    }

    const currentForm = location.pathname === '/login' ? 'login' : 'register';
    const otherForm = currentForm === 'login' ? 'register' : 'login';
    const otherPath = currentForm === 'login' ? 'Signup' : 'Login';

    useEffect(() => {
        // trigger loading of google and facebook sdks as soon as /login-register view is loaded
        socialLoginApi.loadFacebookSdk();
        socialLoginApi.loadGoogleSdk();
    }, [])


    return (
        <div className="login-page">
            <div className="site-logo">
                {/* <div className="name">Sight</div> */}
                <a href="https://ascendeum.com" target="_blank" className="logo">byData</a>
                <div className="tagline">Customized data visualization for decision makers</div>
            </div>

            <div className="login-wrapper">
                <div className="login-inner">
                    {!isResetPassword && <div className='tab-selection'>
                        <span>{currentForm === 'login' ? "Don't have account?" : "Already have an account?"}</span>
                        <button onClick={() => history.push(`/${otherForm}`)}>{otherPath}</button>
                    </div>}
                    <div className="tabs">
                        {currentForm === 'login' ? <Login {...{ history, location, handleResetPassword }} /> : <Register onDone={() => history.push('/login')} {...{ history, location }} />}
                    </div>
                </div>
                {/* {!isResetPassword ? (
                <div className="login-inner">
                    <div className="tabs">
                        <ul>
                            <li>
                                <a onClick={() => history.push('/login')} className={currentForm === 'login' ? 'active' : ''}><span>Log In</span></a>
                            </li>
                            <li>
                                <a onClick={() => history.push('/register')} className={currentForm === 'register' ? 'active' : ''}><span>Register</span></a>
                            </li>
                        </ul>
                    </div>
                    {currentForm === 'login' ? <Login {...{ history, location, handleResetPassword }} /> : <Register onDone={() => history.push('/login')} {...{ history, location }} />}
                </div>
                ) : (
                    <div className="login-inner">
                    <div className="tab">
                        <ul>
                            <li>
                                <a onClick={() => {}} className={currentForm === 'forgot-password' ? 'active' : ''}><span>Forgot Password</span></a>
                            </li>
                        </ul>
                    </div>
                    {<ResetPassword {...{ history, location, handleResetPassword }} />}
                    </div>
                )} */}
            </div>
        </div>

    );
};
export default LoginRegister;



