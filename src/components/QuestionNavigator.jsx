import React from 'react';

const QuestionNavigator = ({ allQuestions, setScrollToId }) => {
  // Flatten questions; if a question has subIds, render a button for each, all targeting the same element id
  const items = [];
  allQuestions.forEach((q) => {
    if (Array.isArray(q.subIds) && q.subIds.length) {
      q.subIds.forEach((num) => {
        if (typeof num === 'number') items.push({ num, target: q.id });
      });
    } else if (typeof q.id === 'number') {
      items.push({ num: q.id, target: q.id });
    }
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {items.sort((a, b) => a.num - b.num).map((it) => (
        <button
          key={`${it.target}-${it.num}`}
          style={{
            margin: '4px',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: '#eee',
            border: '1px solid #999'
          }}
          onClick={() => {
            const el = document.getElementById(`q-${it.target}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
        >
          {it.num}
        </button>
      ))}
    </div>
  );
};

export default QuestionNavigator;
