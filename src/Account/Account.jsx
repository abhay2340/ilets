import React, { useState } from 'react';
import AccountSidebar from './AccountSidebar';
import AccountContent from './AccountContent';
import { useAuth } from '../AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import './Account.css'; // Ensure you have this CSS file for styling
import Navbar from '../Navbar.jsx';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig.jsx';
const Account = () => {
  const [selectedTab, setSelectedTab] = useState('profile');
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <p>Please log in to access your account.</p>;
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (_) { }
    navigate('/login');
  };

  return (
    <>
      <Navbar />
      <div className="account-container">
        <AccountSidebar selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
        <AccountContent selectedTab={selectedTab} user={user} onLogout={handleLogout} />
      </div>
    </>
  );
};

export default Account;
