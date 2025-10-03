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
