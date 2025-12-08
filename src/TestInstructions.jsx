import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TestInstructions = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const testId = params.get('testId');
  const dbId = params.get('dbId');

  const handleBegin = () => {
    const query = dbId ? `?dbId=${dbId}` : `?testId=${testId || 'test1'}`;
    navigate(`/test${query}`, { replace: true });
  };

  return (
    <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
      <div style={{
        maxWidth: '800px',
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ textAlign: 'center' }}>NOTES BEFORE TAKING THE TEST</h2>

        <h4>📌 General information:</h4>
        <ul>
          <li>The online test is designed to closely mimic the official IELTS test format.</li>
          <li>In <strong>Full Test mode</strong>, the Listening section plays automatically and moves to the next question. Candidates cannot go back or skip questions in this section.</li>
          <li>After completing the test, click the “Submit” button in the upper right corner of the screen to see detailed results.</li>
        </ul>

        <h4>🖥️ Device and browser requirements:</h4>
        <ul>
          <li>Please use Google Chrome on desktop or laptop for the most stable experience.</li>
          <li>Use headphones to ensure sound quality in the Listening section.</li>
        </ul>

        <hr style={{ margin: '30px 0' }} />

        <h3 style={{ color: '#cc0000' }}>COPYRIGHT NOTICE AND COMMITMENT TO USE OF TEST CONTENT</h3>
        <p>All test content (including questions, images, audio and related data) is our intellectual property.</p>

        <h4>❌ Strictly Prohibited:</h4>
        <ul>
          <li>Copy, store, share or extract the content in any form other than for personal study purposes.</li>
          <li>Sharing accounts or transmitting test data to third parties.</li>
        </ul>

        <h4>⚠️ Violation handling method:</h4>
        <ul>
          <li>Account lock and access termination immediately without prior notice.</li>
          <li>No refunds for any subscribed services.</li>
          <li>Claim compensation if the act causing damage is determined.</li>
          <li>File a lawsuit under intellectual property laws if necessary.</li>
        </ul>

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button
            onClick={handleBegin}
            style={{
              backgroundColor: '#b30000',
              padding: '12px 30px',
              fontSize: '16px',
              borderRadius: '6px',
              color: 'white',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Begin
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestInstructions;
