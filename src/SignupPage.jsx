import React, { useMemo, useState } from 'react';
import './SignupPage.css';
import logo from './assets/logo.png';
import loginImage from './assets/login-image.jpg';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

import { auth } from './firebaseConfig';

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({ name: false, email: false, phone: false, password: false, confirmPassword: false });
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const emailRegex = useMemo(() => /[^\s@]+@[^\s@]+\.[^\s@]+/, []);

  const validate = () => {
    const next = {};
    if (!name.trim()) next.name = 'Name is required';
    if (!emailRegex.test(email)) next.email = 'Enter a valid email address';
    if (phone && !/^\d{7,15}$/.test(phone)) next.phone = 'Phone must be 7-15 digits';
    if (!password || password.length < 6) next.password = 'Password must be at least 6 characters';
    if (confirmPassword !== password) next.confirmPassword = 'Passwords do not match';
    return next;
  };

  const isValid = useMemo(() => {
    const v = validate();
    return Object.keys(v).length === 0;
  }, [name, email, phone, password, confirmPassword]);

  // Recompute errors live as user types
  React.useEffect(() => {
    setErrors(validate());
  }, [name, email, phone, password, confirmPassword]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;
    try {
      setSubmitting(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      navigate('/');
    } catch (error) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="signup-wrapper">
      <div className="signup-card">
        <div className="signup-left-side">
          <img src={loginImage} alt="Students studying" />
        </div>

        <div className="signup-right-side">
          <img src={logo} alt="Logo" className="signup-logo" />
          <h2>Create account</h2>

          <form onSubmit={handleSignup} noValidate>
            <label>Your Name</label>
            <input
              type="text"
              placeholder="Enter your first and last name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
              required
            />
            {(touched.name || submitAttempted) && errors.name && <div style={{ color: '#b30000', fontSize: 12, marginTop: 4 }}>{errors.name}</div>}

            <div className="signup-two-column">
              <div>
                <label>E-Mail</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                  required
                />
                {(touched.email || submitAttempted) && errors.email && <div style={{ color: '#b30000', fontSize: 12, marginTop: 4 }}>{errors.email}</div>}
              </div>
              <div>
                <label>Phone Number</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="\d*"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D+/g, ''))}
                  onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
                />
                {(touched.phone || submitAttempted) && errors.phone && <div style={{ color: '#b30000', fontSize: 12, marginTop: 4 }}>{errors.phone}</div>}
              </div>
            </div>

            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
              required
            />
            {(touched.password || submitAttempted) && errors.password && <div style={{ color: '#b30000', fontSize: 12, marginTop: 4 }}>{errors.password}</div>}

            <label>Re-Enter Password</label>
            <input
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
              required
            />
            {(touched.confirmPassword || submitAttempted) && errors.confirmPassword && <div style={{ color: '#b30000', fontSize: 12, marginTop: 4 }}>{errors.confirmPassword}</div>}

            <button className="signup-button" type="submit" disabled={!isValid || submitting}>
              {submitting ? 'Registering…' : 'Register →'}
            </button>

            <p className="signup-link">
              Already have an account? <a href="/login">Login</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
