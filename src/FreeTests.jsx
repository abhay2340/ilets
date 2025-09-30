import React from 'react';
import './TestLandingPage.css';
import { FaHeadphones, FaPenNib } from 'react-icons/fa';
import { TEST_PRICING } from './config/pricing';

function FreeTests({ purchasedTests = [], loading = false, navigate }) {
    const allIds = Object.keys(TEST_PRICING)
        .sort((a, b) => (parseInt(a.replace('test', '')) || 0) - (parseInt(b.replace('test', '')) || 0));
    const freeIds = allIds.filter(id => TEST_PRICING[id]?.isFree);

    const splitHalf = (ids) => {
        const mid = Math.ceil(ids.length / 2);
        return [ids.slice(0, mid), ids.slice(mid)];
    };

    const [freeListening, freeWriting] = splitHalf(freeIds);

    const renderCard = (testId, label) => {
        const num = parseInt(testId.replace('test', '')) || testId;
        const isPurchased = purchasedTests?.some?.(t => t.testId === testId);
        const handleStart = () => navigate(`/security?testId=${testId}`);
        return (
            <div key={`free-${label}-${testId}`} className="test-box">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="meta-badge" style={{ marginRight: '8px' }}>
                        {label === 'Listening' ? <FaHeadphones className="section-icon" /> : <FaPenNib className="section-icon" />}
                    </span>
                    <span>{label}</span>
                </div>
                <h3>Test {num}</h3>
                <p>Free {label} practice.</p>
                <div style={{ margin: '6px 0', fontWeight: 700 }}>
                    <span style={{ color: '#2e7d32' }}>FREE</span>
                </div>
                {isPurchased && (
                    <div style={{ fontSize: 12, color: '#555', marginBottom: 8 }}>Unlocked</div>
                )}
                <button onClick={handleStart} disabled={loading}>Start {label}</button>
            </div>
        );
    };

    return (
        <div className="tests-section">
            <h1 style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Starter Plan</h1>
            <div style={{ display: 'flex', justifyContent: 'space-around', gap: 16, flexWrap: 'wrap', alignItems: 'stretch' }}>
                <div style={{ flex: '1 1 0', minWidth: 260 }}>
                    <div className="cards-flex">
                        {freeListening.map(id => renderCard(id, 'Listening'))}
                    </div>
                </div>
                <div style={{ flex: '1 1 0', minWidth: 260 }}>
                    <div className="cards-flex">
                        {freeWriting.map(id => renderCard(id, 'Writing'))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FreeTests;