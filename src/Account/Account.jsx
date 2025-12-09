import React, { useState, useEffect } from 'react';
import AccountSidebar from './AccountSidebar';
import AccountContent from './AccountContent';
import { useAuth } from '../AuthContext.jsx';
import { useNavigate, useLocation } from 'react-router-dom';
import './Account.css'; // Ensure you have this CSS file for styling
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig.jsx';
import ConfirmationModal from '../components/ConfirmationModal';

const Account = () => {
  const [selectedTab, setSelectedTab] = useState('profile');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Support deep linking via ?tab=profile|history|overview|logout
  // IMPORTANT: All hooks must be called before any conditional returns
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = (params.get('tab') || '').toLowerCase();
    const allowed = new Set(['profile', 'history', 'overview', 'logout']);
    if (allowed.has(tab)) setSelectedTab(tab);
  }, [location.search]);

  // Handle navigation for unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh' }}>
        <div>Loading account…</div>
      </div>
    );
  }

  if (!user) {
    return <p>Please log in to access your account.</p>;
  }

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = async () => {
    setIsLogoutModalOpen(false);
    try {
      await signOut(auth);
    } catch (_) { }
    navigate('/login');
  };

  const handleCancelLogout = () => {
    setIsLogoutModalOpen(false);
  };

  const handleChangeTab = (tab) => {
    const next = (tab || '').toLowerCase();

    if (next === 'logout') {
      handleLogoutClick();
      return;
    }

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
        <AccountContent selectedTab={selectedTab} user={user} onLogout={handleConfirmLogout} />
      </div>
      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={handleCancelLogout}
        onConfirm={handleConfirmLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out of your account?"
        confirmText="Logout"
        cancelText="Cancel"
      />
    </>
  );
};

export default Account;
