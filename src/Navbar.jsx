import React from 'react';
import {Link, useNavigate } from 'react-router-dom';
import logo from './assets/logo.png';
import { FaUserCircle, FaShoppingCart } from 'react-icons/fa';
import { useAuth } from './AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import './Navbar.css'; // we'll create this too

function Navbar({ transparent = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <nav className={`navbar ${transparent ? 'transparent-navbar' : ''}`}>
         <div className="navbar-container">
      <div className="navbar-content">
        <div className="navbar-left">
          <img src={logo} alt="Gurjant IELTS" className="logo-img" onClick={() => navigate('/')} />
          <ul className="nav-links">
  <li><Link to="/introduction">Introduction</Link></li>
  <li><Link to="/news">News</Link></li>
  <li><Link to="/contact">Contact</Link></li>
</ul>
        </div>
        <div className="navbar-right">
          <FaShoppingCart className="nav-icon" title="Cart" />
          {user ? (
            <>
              <FaUserCircle className="nav-icon" title={user.email}  onClick={() => navigate('/account')}
        style={{ cursor: 'pointer' }}/>
              <button className="login-btn" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <button className="login-btn" onClick={() => navigate('/login')}>LOGIN</button>
          )}
        </div>
      </div>
      </div>
    </nav>
  );
}

export default Navbar;
