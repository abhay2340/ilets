import React from 'react';
import HistorySection from './HistorySection';
import OverviewSection from './OverviewSection';

const AccountContent = ({ selectedTab, user, onLogout }) => {
  switch (selectedTab) {
    case 'profile':
      return (
        <div className="account-section">
          <h2>My Profile</h2>
          <p><strong>Username:</strong> {user.displayName || 'Not set'}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Password:</strong> ******** (Not accessible)</p>
        </div>
      );
        case 'history':
      return (
        <div className="account-section">
          <HistorySection user={user} />
        </div>
      );
      case 'overview':
  return (
    <div className="account-section">
      <OverviewSection user={user} />
    </div>
  );
    case 'logout':
      onLogout();
      return <div className="account-section"><h2>Logging out...</h2></div>;
    default:
      return <div className="account-section"><h2>{selectedTab}</h2><p>Coming soon...</p></div>;
  }
};

export default AccountContent;
