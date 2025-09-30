import React from 'react';
import './TestLandingPage.css';
import { BUNDLE_ID, BUNDLE_PRICING, TEST_PRICING, formatPrice } from './config/pricing';
import { FaHeadphones, FaPenNib } from 'react-icons/fa';

function PaidTests({ purchasedTests = [], loading = false, navigate, hasAccess }) {
    const allIds = Object.keys(TEST_PRICING)
        .sort((a, b) => (parseInt(a.replace('test', '')) || 0) - (parseInt(b.replace('test', '')) || 0));
    const paidIds = allIds.filter(id => !TEST_PRICING[id]?.isFree);

    const renderPaidCard = (testId) => {
        const num = parseInt(testId.replace('test', '')) || testId;
        const isUnlocked = purchasedTests?.some?.(t => t.testId === testId);
        const handleStart = async () => {
            if (await hasAccess?.(testId)) navigate(`/security?testId=${testId}`);
            else navigate(`/payment?testId=${BUNDLE_ID}`);
        };
        return (
            <div key={`paid-card-${testId}`} className="test-box">
                <div className="card-meta">
                    <span className="meta-badge" style={{ marginRight: '8px' }}>
                        {(num % 2 === 0) ? <FaHeadphones className="section-icon" /> : <FaPenNib className="section-icon" />}
                    </span>
                    <span>{(num % 2 === 0) ? 'Listening' : 'Writing'}</span>
                </div>
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

    return (
        <div className="tests-section">
            <h1 align="center" style={{ marginBottom: 10, zIndex: 3 }}>Premium Exam Plan</h1>
            <div className="paid-blur-container">
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
                <div className="cards-flex" style={{ marginTop: 16, justifyContent: 'space-between' }}>
                    {paidIds.map(renderPaidCard)}
                </div>

            </div>
        </div>
    );
}

export default PaidTests;

