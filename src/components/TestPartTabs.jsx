import React from 'react';

const TestPartTabs = ({ partIndex, setPartIndex, total }) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          onClick={() => setPartIndex(i)}
          style={{
            marginRight: '10px',
            padding: '8px 16px',
            backgroundColor: i === partIndex ? '#b30000' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontWeight: 'bold'
          }}
        >
          Part {i + 1}
        </button>
      ))}
    </div>
  );
};

export default TestPartTabs;
