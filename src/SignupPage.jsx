import React from 'react';
import './SignupPage.css';
import logo from './assets/logo.png';
import loginImage from './assets/login-image.jpg';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

import { auth } from './firebaseConfig';

function SignupPage() {
  const navigate = useNavigate();

  const handleSignup = async (e) => {
  e.preventDefault();
  const name = e.target[0].value;         // First input (name)
  const email = e.target[1].value;        // Second input
  const password = e.target[3].value;     // Fourth input (skip phone)

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // ✅ Set the displayName here
    await updateProfile(userCredential.user, {
      displayName: name
    });

    navigate('/');
  } catch (error) {
    alert(error.message);
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

          <form onSubmit={handleSignup}>
            <label>Your Name</label>
            <input type="text" placeholder="Enter your first and last name" required />

            <div className="signup-two-column">
              <div>
                <label>E-Mail</label>
                <input type="email" placeholder="Enter your email" required />
              </div>
              <div>
                <label>Phone Number</label>
                <input type="text" placeholder="Enter your phone number" />
              </div>
            </div>

            <label>Password</label>
            <input type="password" placeholder="Enter your password" required />

            <label>Re-Enter Password</label>
            <input type="password" placeholder="Re-enter your password" required />

            <button className="signup-button" type="submit">Register →</button>

            <p className="signup-link">
              Already have an account? <a href="/">Login</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
