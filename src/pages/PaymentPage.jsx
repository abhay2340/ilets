import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { usePurchases } from '../hooks/usePurchases';
import { TEST_PRICING, BUNDLE_PRICING, BUNDLE_ID, formatPrice } from '../config/pricing';
import { FaLock, FaCheck, FaArrowLeft, FaCreditCard } from 'react-icons/fa';
import './PaymentPage.css';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import ConfirmationModal from '../components/ConfirmationModal';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { purchaseTest, hasAccess } = usePurchases();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [itemData, setItemData] = useState(null); // { id, name, price, isBundle, features }
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Get ID from URL params
  const params = new URLSearchParams(location.search);
  const bundleId = params.get('bundleId');
  const testId = params.get('testId'); // legacy or single test

  useEffect(() => {
    const fetchItem = async () => {
      // 1. Dynamic Bundle
      if (bundleId) {
        try {
          const docRef = doc(db, 'bundles', bundleId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            setItemData({
              id: bundleId,
              name: data.name || 'Bundle',
              price: Number(data.price || 0),
              isBundle: true,
              isFree: Number(data.price || 0) === 0,
              testIds: data.testIds || [], // Capture testIds for post-purchase granting
              features: ['Includes multiple tests', 'Full access for 3 months', 'Instant activation']
            });
          } else {
            setError('Bundle not found');
          }
        } catch (err) {
          setError('Failed to load bundle details');
        }
        return;
      }

      // 2. Legacy/Static configs (Test or Static Bundle)
      const targetId = testId || BUNDLE_ID;
      if (targetId === BUNDLE_ID) {
        // Static bundle
        setItemData({
          id: BUNDLE_ID,
          name: 'All Paid Tests (3 months)',
          price: BUNDLE_PRICING[BUNDLE_ID].price,
          isBundle: true,
          isFree: false,
          testIds: BUNDLE_PRICING[BUNDLE_ID].tests, // Static list
          features: ['Full-length IELTS practice test', 'Listening, Reading, and Writing sections', 'Instant results and feedback']
        });
      } else {
        // Single Test
        const info = TEST_PRICING[targetId];
        if (info) {
          setItemData({
            id: targetId,
            name: `IELTS Test ${targetId.replace('test', '')}`,
            price: info.price,
            isBundle: false,
            isFree: !!info.isFree,
            title: `IELTS Test ${targetId.replace('test', '')}`,
            features: ['Full-length IELTS practice test', 'Listening, Reading, and Writing sections', 'Instant results and feedback']
          });
        } else {
          // Fallback: try fetching as dynamic bundle if testId matches a bundle ID (edge case) or show error
          setError('Item not found');
        }
      }
    };

    fetchItem();
  }, [bundleId, testId]);


  const handlePurchase = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (!itemData) return;

    setLoading(true);
    setError('');

    try {
      // Pass itemData to purchaseTest so it knows the price/details for dynamic items
      const res = await purchaseTest(itemData.id, itemData);
      console.log('Payment successful:', res?.razorpay_payment_id || res);

      const maxWaitMs = 4000;
      const start = Date.now();
      // Check access using the ID we just bought
      while (!(await hasAccess(itemData.id)) && Date.now() - start < maxWaitMs) {
        await new Promise(r => setTimeout(r, 200));
      }

      if (itemData.isBundle) {
        navigate(`/bundle/${itemData.id}`);
      } else {
        navigate(`/test-start`);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      setError(error.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If user already has access, redirect
  React.useEffect(() => {
    let isMounted = true;
    const check = async () => {
      if (!user || !itemData) return;
      const access = await hasAccess(itemData.id);
      if (isMounted && access) {
        if (itemData.isBundle) navigate(`/bundle/${itemData.id}`);
        else navigate(`/test?testId=${itemData.id}`);
      }
    };
    check();
    return () => { isMounted = false; };
  }, [user, itemData]);

  const handleBack = () => {
    navigate(-1);
  };

  if (!itemData && !error) {
    return (
      <div className="payment-page">
        <div className="payment-container" style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          Loading...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={handleBack} className="back-btn">
            <FaArrowLeft /> Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-container">
        <div className="payment-header">
          <button onClick={handleBack} className="back-btn">
            <FaArrowLeft /> Back
          </button>
          <h1>{itemData.isBundle ? 'Buy Subscription' : 'Purchase Access'}</h1>
        </div>

        <div className="payment-content">
          <div className="test-info">
            <div className="test-card">
              <div className="test-header">
                <h2>{itemData.name}</h2>
                <div className="test-badge">
                  {itemData.isFree ? (
                    <span className="free-badge">FREE</span>
                  ) : (
                    <span className="premium-badge">PREMIUM</span>
                  )}
                </div>
              </div>

              <div className="test-features">
                {itemData.features && itemData.features.map((f, i) => (
                  <div className="feature-item" key={i}>
                    <FaCheck className="feature-icon" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="payment-section">
            <div className="price-card">
              <div className="price-header">
                <h3>{itemData.isBundle ? 'Bundle Access' : 'Test Access'}</h3>
                <div className="price">
                  {itemData.isFree ? (
                    <span className="free-price">FREE</span>
                  ) : (
                    <span className="paid-price">{formatPrice(itemData.price)}</span>
                  )}
                </div>
              </div>

              {!itemData.isFree && (
                <div className="payment-methods">
                  <div className="payment-method">
                    <FaCreditCard className="payment-icon" />
                    <span>Credit/Debit Card</span>
                  </div>
                  <div className="payment-method">
                    <FaCreditCard className="payment-icon" />
                    <span>Net Banking</span>
                  </div>
                  <div className="payment-method">
                    <FaCreditCard className="payment-icon" />
                    <span>UPI</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <div className="payment-actions">
                {itemData.isFree ? (
                  <button
                    onClick={() => navigate(itemData.isBundle ? `/bundle/${itemData.id}` : `/test?testId=${itemData.id}`)}
                    className="start-test-btn"
                  >
                    Start Now
                  </button>
                ) : (
                  <button
                    onClick={handlePurchase}
                    disabled={loading}
                    className="purchase-btn"
                  >
                    {loading ? (
                      <>
                        <div className="spinner"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <FaLock className="lock-icon" />
                        Purchase for {formatPrice(itemData.price)}
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="security-info">
                <p>
                  <FaLock className="security-icon" />
                  Your payment is secure and encrypted
                </p>
                <p className="access-info">
                  * Limited time access
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onConfirm={() => {
          setShowLoginModal(false);
          navigate('/login');
        }}
        title="Login Required"
        message="You need to login to buy a test. Would you like to go to the login page?"
        confirmText="Go to Login"
        cancelText="Cancel"
      />
    </div>
  );
};

export default PaymentPage;
