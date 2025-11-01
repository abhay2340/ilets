import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from './assets/logo.png';
import { FaUserCircle, FaShoppingCart } from 'react-icons/fa';
import { useAuth } from './AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import './Navbar.css'; // we'll create this too

function Navbar({ transparent = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
              <li><Link to="/">Home</Link></li>
              <li><Link to="/introduction">Introduction</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/admin-panel">Admin Panel</Link></li>
            </ul>
          </div>
          <div className="navbar-right">
            {user ? (
              <>
                <FaUserCircle size={36} className="nav-icon" title={user.email} onClick={() => navigate('/account')}
                  style={{ cursor: 'pointer' }} />
                <button className="login-btn" onClick={() => setShowLogoutConfirm(true)}>Logout</button>
              </>
            ) : (
              <button className="login-btn" onClick={() => navigate('/login')}>LOGIN</button>
            )}
          </div>
        </div>
      </div>
      {showLogoutConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: 20
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div
            style={{
              background: '#fff',
              padding: '20px 24px',
              borderRadius: 10,
              minWidth: 320,
              maxWidth: '90vw',
              boxShadow: '0 12px 28px rgba(0,0,0,0.25)',
              textAlign: 'center'
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>Confirm Logout</h3>
            <p style={{ marginTop: 0, marginBottom: 18 }}>Are you sure you want to log out?</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  padding: '10px 16px',
                  borderRadius: 6,
                  border: '1px solid #bbb',
                  background: '#f2f2f2',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                style={{
                  padding: '10px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#b30000',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 800
                }}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
