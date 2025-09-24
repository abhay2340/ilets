import React from 'react';
import './LoginPage.css';
import logo from './assets/logo.png';
import loginImage from './assets/login-image.jpg';
import {Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { toast } from 'react-toastify';
import { sendPasswordResetEmail } from 'firebase/auth';

const handleForgotPassword = async () => {
  const email = prompt("Enter your email to reset password");
  if (!email) return;

  try {
    await sendPasswordResetEmail(auth, email);
    toast.success("Reset link sent to your email!", {
      position: "top-center",
      autoClose: 3000,
      theme: "colored",
    });
  } catch (error) {
    toast.error("Error sending reset email", {
      position: "top-center",
      autoClose: 3000,
      theme: "colored",
    });
  }
};

function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target[0].value;
    const password = e.target[1].value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (error) {
toast.error("Invalid credentials. Please sign up first.", {
  position: "top-center",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "colored",
});

    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-left-side">
          <img src={loginImage} alt="Education Illustration" />
        </div>

        <div className="login-right-side">
          <img src={logo} alt="IELTS Logo" className="login-logo" />
          <h2>WELCOME TO <span>GURJANT IELTS</span>!</h2>
          <p className="subtitle">Log in to continue your IELTS journey</p>

          <form onSubmit={handleLogin}>
            <label>Email / Username</label>
            <input type="text" placeholder="Enter your email or username" required />
            <label>Password</label>
            <input type="password" placeholder="Enter your password" required />

            <div className="form-options">
             <button
  type="button"
  className="forgot-password-btn"
  onClick={handleForgotPassword}
  style={{
    background: 'none',
    border: 'none',
    color: '#0470c1',
    cursor: 'pointer',
    fontSize: '14px',
    padding: 0
  }}
>
  Forgot password?
</button>

            </div>

            <button className="login-button" type="submit">Log In</button>

            <p className="signup-link">
              Don't have an account? <Link to="/signup">Sign up</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
  
}

export default LoginPage;
