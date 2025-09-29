import './TestLandingPage.css';
function FreeTests({ index }) {
    return (
        <div>
            <h1>Free Tests</h1>
            <div className="test-list">
                <div key={index} className="test-box">
                    <h3>Test {index + 1}</h3>
                    <p>Reading and Listening practice.</p>
                    <div style={{ margin: '6px 0', fontWeight: 700 }}>
                        <span style={{ color: '#2e7d32' }}>FREE</span>
                    </div>
                    <button>Start Test</button>
                </div>
            </div>
        </div>
    )
}

export default FreeTests