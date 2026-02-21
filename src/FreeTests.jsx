import React from 'react';
import './TestLandingPage.css';
import { useAuth } from './AuthContext';
import { TEST_PRICING } from './config/pricing';
import ConfirmationModal from './components/ConfirmationModal';

function FreeTests({ purchasedTests = [], loading = false, navigate }) {
    const { user } = useAuth();
    const [showLoginModal, setShowLoginModal] = React.useState(false);
    const [pendingTestId, setPendingTestId] = React.useState(null);
    const allIds = Object.keys(TEST_PRICING)
        .sort((a, b) => (parseInt(a.replace('test', '')) || 0) - (parseInt(b.replace('test', '')) || 0));
    const freeIds = allIds.filter(id => TEST_PRICING[id]?.isFree);



    const renderCard = (testId) => {
        const num = parseInt(testId.replace('test', '')) || testId;
        const isPurchased = purchasedTests?.some?.(t => t.testId === testId);
        const handleStart = () => {
            if (!user) {
                setPendingTestId(testId);
                setShowLoginModal(true);
                return;
            }
            navigate(`/security?testId=${testId}`);
        };
        return (
            <div key={`free-${testId}`} className="test-box">
                <h3>Test {num}</h3>
                <p>Free practice test.</p>
                <div style={{ margin: '6px 0', fontWeight: 700 }}>
                    <span style={{ color: '#2e7d32' }}>FREE</span>
                </div>
                {isPurchased && (
                    <div style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>Unlocked</div>
                )}
                <button onClick={handleStart} disabled={loading}>Start Test</button>
            </div>
        );
    };

    return (
        <div className="tests-section">
            <h1 style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Starter Plan</h1>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', alignItems: 'stretch' }}>
                <div className="cards-flex">
                    {freeIds.map(id => renderCard(id))}
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

export default FreeTests;