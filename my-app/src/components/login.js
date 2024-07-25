// src/components/login.js
import React, { useState } from 'react';
import '../assets/css/style.css';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { userAut } from './reducers/authSlice';
import { useAuth } from '../components/AuthContext.js';

function Login() {
  const [isadmin, setisadmin] = useState(false);
  const [email, setemail] = useState('');
  const [password, setpassword] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const authError = useSelector((state) => state.aut.error);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email && password) {
      dispatch(userAut({ email, password, isAdmin: isadmin })).then((action) => {
        if (userAut.fulfilled.match(action)) {
          login();
          if (isadmin) {
            navigate('/Admininterface');
          } else {
            navigate('/Userinterface');
          }
        }
      });
    } else {
      alert('Enter your Email and Password');
    }
  };

  const handleToggle = () => {
    setisadmin(!isadmin);
  };

  const clickRegister = () => {
    navigate('/Register');
  };

  return (
    <>
      <div className={`login-card ${isadmin ? 'admin' : 'user'}`}>
        <span>{isadmin ? 'Admin' : 'User'} Login</span>
        <form
          onSubmit={handleSubmit}
          action={isadmin ? '/admin-login' : '/user-login'}
          method="post"
        >
          <input
            onChange={(e) => setemail(e.target.value)}
            value={email}
            type="email"
            name="email"
            id="Email"
            placeholder="Email"
          />
          <input
            onChange={(e) => setpassword(e.target.value)}
            value={password}
            type="password"
            name="password"
            id="Pass"
            placeholder="Password"
          />
          <button type="submit">Login</button>
        </form>
        {authError && <p className="error-message">{authError}</p>}
        <div className="toggle-container" onClick={handleToggle}>
          <div className={`toggle-button ${isadmin ? 'admin' : ''}`}>
            <div className="toggle-slider"></div>
            <div className="toggle-label">User</div>
            <div className="toggle-label">Admin</div>
          </div>
        </div>
        <div className="registration">
          <button>
            <p onClick={clickRegister}>New Registration</p>
          </button>
        </div>
      </div>
    </>
  );
}

export default Login;
