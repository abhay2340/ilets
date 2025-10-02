import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { usePurchases } from '../hooks/usePurchases';
import { TEST_PRICING, BUNDLE_PRICING, BUNDLE_ID, formatPrice } from '../config/pricing';
import { FaLock, FaCheck, FaArrowLeft, FaCreditCard } from 'react-icons/fa';
import './PaymentPage.css';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { purchaseTest, hasAccess } = usePurchases();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get test ID from URL params
  const params = new URLSearchParams(location.search);
  const testId = params.get('testId') || BUNDLE_ID;
  const isBundleParam = testId === BUNDLE_ID;
  const isFreeTest = !!TEST_PRICING[testId]?.isFree;
  const displayAsBundle = isBundleParam || !isFreeTest;
  const displayPricing = displayAsBundle ? BUNDLE_PRICING[BUNDLE_ID] : TEST_PRICING[testId];

  const handlePurchase = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const targetId = displayAsBundle ? BUNDLE_ID : testId;
      const res = await purchaseTest(targetId);
      // Show lightweight success message in-page
      // If you have a toast lib, you can replace with toast.success
      console.log('Payment successful:', res?.razorpay_payment_id || res);
      // Wait until access is confirmed before navigating
      const maxWaitMs = 4000;
      const start = Date.now();
      while (!(await hasAccess(targetId)) && Date.now() - start < maxWaitMs) {
        await new Promise(r => setTimeout(r, 200));
      }
      // After successful purchase, go to test-start and scroll to Paid Tests
      navigate(`/test-start#paid`);
    } catch (error) {
      console.error('Purchase error:', error);
      setError(error.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If user already has access, do not show purchase UI
  React.useEffect(() => {
    let isMounted = true;
    const check = async () => {
      if (!user || displayAsBundle) return;
      const access = await hasAccess(testId);
      if (isMounted && access) navigate(`/test?testId=${testId}`);
    };
    check();
    return () => { isMounted = false; };
  }, [user, testId]);

  const handleBack = () => {
    navigate('/test-start');
  };

  if (!displayPricing) {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <h2>Item Not Found</h2>
          <p>The requested item could not be found.</p>
          <button onClick={handleBack} className="back-btn">
            <FaArrowLeft /> Back to Tests
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
            <FaArrowLeft /> Back to Tests
          </button>
          <h1>{displayAsBundle ? 'Buy Subscription' : 'Purchase Test Access'}</h1>
        </div>

        <div className="payment-content">
          <div className="test-info">
            <div className="test-card">
              <div className="test-header">
                <h2>{displayAsBundle ? 'All Paid Tests (3 months)' : `IELTS Test ${testId.charAt(testId.length - 1)}`}</h2>
                <div className="test-badge">
                  {!displayAsBundle && TEST_PRICING[testId]?.isFree ? (
                    <span className="free-badge">FREE</span>
                  ) : (
                    <span className="premium-badge">PREMIUM</span>
                  )}
                </div>
              </div>

              <div className="test-features">
                <div className="feature-item">
                  <FaCheck className="feature-icon" />
                  <span>Full-length IELTS practice test</span>
                </div>
                <div className="feature-item">
                  <FaCheck className="feature-icon" />
                  <span>Listening, Reading, and Writing sections</span>
                </div>
                <div className="feature-item">
                  <FaCheck className="feature-icon" />
                  <span>Instant results and feedback</span>
                </div>
                <div className="feature-item">
                  <FaCheck className="feature-icon" />
                  <span>Performance analytics</span>
                </div>
                <div className="feature-item">
                  <FaCheck className="feature-icon" />
                  <span>30 days access</span>
                </div>
                <div className="feature-item">
                  <FaCheck className="feature-icon" />
                  <span>Unlimited attempts during access period</span>
                </div>
              </div>
            </div>
          </div>

          <div className="payment-section">
            <div className="price-card">
              <div className="price-header">
                <h3>{displayAsBundle ? 'Bundle Access' : 'Test Access'}</h3>
                <div className="price">
                  {!displayAsBundle && TEST_PRICING[testId]?.isFree ? (
                    <span className="free-price">FREE</span>
                  ) : (
                    <span className="paid-price">{formatPrice(displayPricing.price)}</span>
                  )}
                </div>
              </div>

              {displayAsBundle && (
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
                  <div className="payment-method">
                    <FaCreditCard className="payment-icon" />
                    <span>Wallet</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <div className="payment-actions">
                {!displayAsBundle && TEST_PRICING[testId]?.isFree ? (
                  <button
                    onClick={() => navigate(`/test?testId=${testId}`)}
                    className="start-test-btn"
                  >
                    Start Free Test
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
                        {displayAsBundle ? `Buy Subscription for ${formatPrice(displayPricing.price)}` : `Purchase for ${formatPrice(displayPricing.price)}`}
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
                  * 30 days access from purchase date
                </p>
                <p className="refund-policy">
                  * 7-day money-back guarantee if not satisfied
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="payment-footer">
          <div className="trust-indicators">
            <div className="trust-item">
              <FaCheck className="trust-icon" />
              <span>SSL Secured</span>
            </div>
            <div className="trust-item">
              <FaCheck className="trust-icon" />
              <span>Instant Access</span>
            </div>
            <div className="trust-item">
              <FaCheck className="trust-icon" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
