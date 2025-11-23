import React from 'react';

const AccountSidebar = ({ selectedTab, setSelectedTab, onChangeTab }) => {
  const tabs = ['profile', 'history', 'overview', 'logout'];

  return (
    <div className="account-sidebar">
      {tabs.map(tab => (
        <div
          key={tab}
          className={`sidebar-tab ${selectedTab === tab ? 'active' : ''}`}
          onClick={() => {
            if (tab === 'logout' && typeof onChangeTab === 'function') {
              // Let the parent handle the logout logic specifically if needed, 
              // but here we just pass it up. 
              // Actually, the plan was to pass a specific prop or handle it via onChangeTab.
              // Let's stick to the plan: check if tab is logout, if so, maybe don't set selected tab immediately?
              // The original code sets selectedTab then calls onChangeTab.
              // If we want to intercept, we should probably call onChangeTab first or check.
              // But wait, if I change the parent to handle it, I might not need to change this file much if I just use the existing callback.
              // However, to prevent the UI from switching to a "Logging out..." state immediately before confirmation,
              // we might want to prevent `setSelectedTab('logout')` if it's the logout action.

              // Let's modify to:
              if (tab === 'logout') {
                onChangeTab(tab);
                return;
              }
            }
            setSelectedTab(tab);
            if (typeof onChangeTab === 'function') onChangeTab(tab);
          }}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </div>
      ))}
    </div>
  );
};

export default AccountSidebar;
