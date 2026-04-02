import React from 'react';

const IeltsPrediction = () => {
  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: '100%',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 32,
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
          background: '#fff',
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: 12 }}>IELTS PREPARATION</h1>
        <p style={{ marginTop: 0, marginBottom: 16, color: '#4b5563', lineHeight: 1.6 }}>
          We are working hard to bring detailed IELTS prediction updates here.
        </p>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 16px',
            borderRadius: 999,
            background: '#f0f7ff',
            border: '1px solid #cfe3ff',
            color: '#1f3b57',
            fontWeight: 600,
          }}
        >
          Coming Soon
        </div>
      </div>
    </div>
  );
};

export default IeltsPrediction;
