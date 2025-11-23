import React, { useEffect, useState, useRef } from 'react';
import { FaUserCircle, FaEnvelope, FaIdBadge, FaCalendarCheck, FaCheckCircle, FaTimesCircle, FaCamera } from 'react-icons/fa';
import { getUserPurchasedTests } from '../services/paymentService';
import { BUNDLE_ID, BUNDLE_PRICING } from '../config/pricing';
import HistorySection from './HistorySection';
import OverviewSection from './OverviewSection';
import { storage, auth } from '../firebaseConfig';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';

const AccountContent = ({ selectedTab, user, onLogout }) => {
  const [bundleDaysRemaining, setBundleDaysRemaining] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File size should be less than 2MB");
      return;
    }

    // setUploading(true); // This state is no longer needed, replaced by uploadProgress
    setUploadProgress(0);

    const storageRef = ref(storage, `profile_pictures/${user.uid}`);
    // Use uploadBytesResumable for progress monitoring
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
        console.log('Upload is ' + progress + '% done');
      },
      (error) => {
        console.error("Error uploading profile picture:", error);
        alert("Failed to upload profile picture: " + error.message);
        setUploadProgress(0); // Reset progress on error
      },
      async () => {
        try {
          const photoURL = await getDownloadURL(uploadTask.snapshot.ref);
          if (auth.currentUser) {
            await updateProfile(auth.currentUser, { photoURL });
            window.location.reload();
          } else {
            // Fallback if auth.currentUser is somehow null but we have user prop
            console.error("No authenticated user found to update profile.");
            setUploadProgress(0); // Reset progress if update fails
          }
        } catch (error) {
          console.error("Error updating profile:", error);
          alert("Failed to update profile.");
          setUploadProgress(0); // Reset progress on error
        }
      }
    );
  };

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
              <div className="profile-avatar-container" onClick={handleImageClick}>
                <div className="profile-avatar">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="avatar" />
                  ) : (
                    <FaUserCircle className="avatar-icon" />
                  )}
                  <div className="avatar-overlay">
                    <FaCamera className="camera-icon" />
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  accept="image/*"
                />
                {uploadProgress > 0 && <div className="uploading-text">Uploading: {Math.round(uploadProgress)}%</div>}
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
