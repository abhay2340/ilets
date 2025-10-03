import React, { useState, useEffect } from 'react';
import AccountSidebar from './AccountSidebar';
import AccountContent from './AccountContent';
import { useAuth } from '../AuthContext.jsx';
import { useNavigate, useLocation } from 'react-router-dom';
import './Account.css'; // Ensure you have this CSS file for styling
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig.jsx';
const Account = () => {
  const [selectedTab, setSelectedTab] = useState('profile');
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh' }}>
        <div>Loading account…</div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return <p>Please log in to access your account.</p>;
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (_) { }
    navigate('/login');
  };

  // Support deep linking via ?tab=profile|history|overview|logout
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = (params.get('tab') || '').toLowerCase();
    const allowed = new Set(['profile', 'history', 'overview', 'logout']);
    if (allowed.has(tab)) setSelectedTab(tab);
  }, [location.search]);

  const handleChangeTab = (tab) => {
    const next = (tab || '').toLowerCase();
    setSelectedTab(next);
    try {
      const url = `/account?tab=${encodeURIComponent(next)}`;
      if (location.search !== `?tab=${next}`) navigate(url, { replace: false });
    } catch (_) { }
  };

  return (
    <>
      <div className="account-container">
        <AccountSidebar selectedTab={selectedTab} setSelectedTab={setSelectedTab} onChangeTab={handleChangeTab} />
        <AccountContent selectedTab={selectedTab} user={user} onLogout={handleLogout} />
      </div>
    </>
  );
};

export default Account;
