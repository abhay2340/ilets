import React from 'react';

const QuestionNavigator = ({ allQuestions, setScrollToId }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>

      {allQuestions
  .filter(q => typeof q.id === 'number') // only show numbered questions
  .map(q => (

        <button
          key={q.id}
          style={{
            margin: '4px',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: '#eee',
            border: '1px solid #999'
          }}
          onClick={() => {
            const el = document.getElementById(`q-${q.id}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
        >
          {q.id}
        </button>
      ))}
    </div>
  );
};

export default QuestionNavigator;
