import React from 'react';
import './TestLandingPage.css';
import { BUNDLE_ID, BUNDLE_PRICING } from './config/pricing';
import { useAuth } from './AuthContext';
import ConfirmationModal from './components/ConfirmationModal';

function PaidTests({ purchasedTests = [], loading = false, navigate, hasAccess }) {
    const { user } = useAuth();
    const [showLoginModal, setShowLoginModal] = React.useState(false);
    const [pendingTestId, setPendingTestId] = React.useState(null);
    const paidIds = (BUNDLE_PRICING[BUNDLE_ID]?.tests || [])
        .slice()
        .sort((a, b) => (parseInt(a.replace('test', '')) || 0) - (parseInt(b.replace('test', '')) || 0));

    const renderPaidCard = (testId) => {
        const num = parseInt(testId.replace('test', '')) || testId;
        const isUnlocked = purchasedTests?.some?.(t => t.testId === testId);
        const handleStart = async () => {
            if (!user) {
                setPendingTestId(testId);
                setShowLoginModal(true);
                return;
            }
            if (await hasAccess?.(testId)) navigate(`/security?testId=${testId}`);
            else navigate(`/payment?testId=${BUNDLE_ID}`);
        };
        return (
            <div key={`paid-card-${testId}`} className="test-box">
                <h3>Test {num}</h3>
                <p>Premium test. Included in bundle.</p>
                <div style={{ margin: '6px 0', fontWeight: 700 }}>
                    <span style={{ color: '#b30000' }}>Included in Bundle</span>
                </div>
                {isUnlocked && (
                    <div style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>Unlocked</div>
                )}
                <button onClick={handleStart} disabled={loading}>
                    {isUnlocked ? 'Start' : 'Unlock with Bundle'}
                </button>
            </div>
        );
    };

    const hasBundleAccess = purchasedTests?.some?.(t => (BUNDLE_PRICING[BUNDLE_ID]?.tests || []).includes(t.testId));

    return (
        <div className="tests-section">
            <h1 align="center" style={{ marginBottom: 10, zIndex: 3 }}>Premium Exam Plan</h1>
            <div className="paid-blur-container">
                {!hasBundleAccess && (
                    <div className="paid-overlay">
                        <div style={{ height: '100px', width: '400px', border: '10px solid #fff', padding: '44px', backgroundColor: '#fff', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <button
                                className="overlay-btn"
                                onClick={() => navigate(`/payment?testId=${BUNDLE_ID}`)}
                                disabled={loading}
                            >
                                Unlock 3-Month Access (₹{BUNDLE_PRICING[BUNDLE_ID].price})
                            </button>
                            <h3>Get all practice tests for 3 months</h3>
                        </div>
                    </div>
                )}
                <div className="cards-flex" style={{ marginTop: 16, justifyContent: 'space-between' }}>
                    {paidIds.map(renderPaidCard)}
                </div>

            </div>

            <ConfirmationModal
                isOpen={showLoginModal}
                onClose={() => {
                    setShowLoginModal(false);
                    setPendingTestId(null);
                }}
                onConfirm={() => {
                    setShowLoginModal(false);
                    const testId = pendingTestId;
                    setPendingTestId(null);
                    navigate('/login', { state: { from: { pathname: '/security', search: `?testId=${testId}` } } });
                }}
                title="Login Required"
                message="You need to login to start a test. Would you like to go to the login page?"
                confirmText="Go to Login"
                cancelText="Cancel"
            />
        </div>
    );
}

export default PaidTests;

