import React, { useMemo, useState } from 'react';
import './LoginPage.css';
import logo from './assets/logo.png';
import loginImage from './assets/login-image.jpg';
import { Link, useNavigate } from 'react-router-dom';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const emailRegex = useMemo(() => /[^\s@]+@[^\s@]+\.[^\s@]+/, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    const next = {};
    if (!emailRegex.test(email)) next.email = 'Enter a valid email';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      setSubmitting(true);
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

    } finally { setSubmitting(false); }
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

          <form onSubmit={handleLogin} noValidate>
            <label>Email</label>
            <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setErrors(prev => ({ ...prev, email: emailRegex.test(email) ? undefined : 'Enter a valid email' }))} required />
            {errors.email && <div style={{ color: '#b30000', fontSize: 12, marginTop: 4 }}>{errors.email}</div>}
            <label>Password</label>
            <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => setErrors(prev => ({ ...prev, password: password ? undefined : 'Password is required' }))} required />
            {errors.password && <div style={{ color: '#b30000', fontSize: 12, marginTop: 4 }}>{errors.password}</div>}

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

            <button className="login-button" type="submit" disabled={submitting}> {submitting ? 'Logging in…' : 'Log In'} </button>

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
