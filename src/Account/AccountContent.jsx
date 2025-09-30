import React, { useEffect, useState } from 'react';
import { FaUserCircle, FaEnvelope, FaIdBadge, FaCalendarCheck, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { getUserPurchasedTests } from '../services/paymentService';
import { BUNDLE_ID, BUNDLE_PRICING } from '../config/pricing';
import HistorySection from './HistorySection';
import OverviewSection from './OverviewSection';

const AccountContent = ({ selectedTab, user, onLogout }) => {
  const [bundleDaysRemaining, setBundleDaysRemaining] = useState(null);

  useEffect(() => {
    const computeBundleExpiry = async () => {
      try {
        if (!user?.uid) return;
        const tests = await getUserPurchasedTests(user.uid);
        const bundleTests = BUNDLE_PRICING[BUNDLE_ID]?.tests || [];
        const relevant = (tests || []).filter(t => bundleTests.includes(t.testId));
        if (!relevant.length) {
          setBundleDaysRemaining(null);
          return;
        }
        let latestExpiresAt = null;
        for (const t of relevant) {
          const exp = t.expiresAt?.toDate ? t.expiresAt.toDate() : new Date(t.expiresAt);
          if (exp && (!latestExpiresAt || exp > latestExpiresAt)) latestExpiresAt = exp;
        }
        if (!latestExpiresAt) {
          setBundleDaysRemaining(null);
          return;
        }
        const now = new Date();
        const ms = latestExpiresAt - now;
        const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
        setBundleDaysRemaining(days > 0 ? days : 0);
      } catch (_) {
        setBundleDaysRemaining(null);
      }
    };
    computeBundleExpiry();
  }, [user?.uid]);

  switch (selectedTab) {
    case 'profile':
      return (
        <div className="account-section">
          <h2>My Profile</h2>
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="avatar" />
                ) : (
                  <FaUserCircle className="avatar-icon" />
                )}
              </div>
              <div className="profile-info">
                <div className="profile-name">{user.displayName || 'Anonymous User'}</div>
                <div className="profile-email">
                  <FaEnvelope style={{ marginRight: 8 }} />{user.email}
                </div>
                <div className="profile-verified">
                  {user.emailVerified ? (
                    <><FaCheckCircle color="#2e7d32" style={{ marginRight: 6 }} /> Email verified</>
                  ) : (
                    <><FaTimesCircle color="#b30000" style={{ marginRight: 6 }} /> Email not verified</>
                  )}
                </div>
              </div>
            </div>

            <div className="profile-grid">
              <div className="profile-item">
                <div className="label">Premium subscription</div>
                <div className="value">
                  {bundleDaysRemaining === null ? 'Not active' : `${bundleDaysRemaining} day${bundleDaysRemaining === 1 ? '' : 's'} remaining`}
                </div>
              </div>
              <div className="profile-item">
                <div className="label"><FaCalendarCheck style={{ marginRight: 8 }} /> Member since</div>
                <div className="value">{user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleString() : '—'}</div>
              </div>
              <div className="profile-item">
                <div className="label">Last sign in</div>
                <div className="value">{user.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : '—'}</div>
              </div>
            </div>

            <div className="profile-note">For your security, passwords are not displayed and cannot be retrieved.</div>
          </div>
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
