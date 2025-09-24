import React from 'react';

const QuestionBox = ({ question, answer, setAnswer }) => {
  // Info-type instructions (like for Q27–33)
  if (question.type === 'info') {
    return (
      <div style={{ marginBottom: '20px', fontStyle: 'italic' }}>
        <strong>{question.question.split('\n')[0]}</strong><br />
        {question.question.split('\n')[1]}
      </div>
    );
  }

  return (
    <div id={`q-${question.id}`} style={{ marginBottom: '25px' }}>
      <p><strong>{question.id}. {question.question}</strong></p>

      {/* Multiple choice (TRUE/FALSE/NOT GIVEN or 4 options) */}
      {question.type === 'mcq' &&
        question.options.map((opt, i) => (
          <label key={i} style={{ display: 'block', marginLeft: '20px' }}>
            <input
              type="radio"
              name={`q-${question.id}`}  // MUST be unique per question
              value={opt}
              checked={answer === opt}
              onChange={() => setAnswer(opt)}
            /> {opt}
          </label>
        ))
      }

      {/* Fill in the blank */}
      {question.type === 'written' &&
        <input
          type="text"
          value={answer || ''}
          onChange={(e) => setAnswer(e.target.value)}
          style={{
            marginLeft: '20px',
            marginTop: '10px',
            padding: '6px 12px',
            width: '80%',
            borderRadius: '5px',
            border: '1px solid #ccc'
          }}
          placeholder="Your answer"
        />
      }

      {/* Dropdown for heading matching */}
      {question.type === 'dropdown' &&
        <select
          name={`q-${question.id}`} // ensure uniqueness here too
          value={answer || ''}
          onChange={(e) => setAnswer(e.target.value)}
          style={{
            marginLeft: '20px',
            marginTop: '10px',
            padding: '6px 12px',
            width: '80%',
            borderRadius: '5px',
            border: '1px solid #aaa'
          }}
        >
          <option value="">-- Select heading --</option>
          {question.options.map((opt, index) => (
            <option key={index} value={opt}>{opt}</option>
          ))}
        </select>
      }
    </div>
  );
};

export default QuestionBox;
