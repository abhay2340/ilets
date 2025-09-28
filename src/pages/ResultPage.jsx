import React from 'react';
import { useLocation } from 'react-router-dom';
import answerKey from '../data/answerkey'; // assuming you've added the test1 key
import Navbar from '../Navbar.jsx'; // Adjust the import path as necessary
import test1 from '../data/test1.jsx';
import test2 from '../data/test2.jsx';
import test3 from '../data/test3.jsx';
import test4 from '../data/test4.jsx';
import test5 from '../data/test5.jsx';
import test6 from '../data/test6.jsx';
import test7 from '../data/test7.jsx';
import test8 from '../data/test8.jsx';
import test9 from '../data/test9.jsx';

const TEST_MAP = { test1, test2, test3, test4, test5, test6, test7, test8, test9 };

console.log(TEST_MAP);
const ResultPage = () => {

  const { state } = useLocation();
  const { userAnswers = {}, testId = 'test1', timeTaken = 0 } = state || {};
  // get actual test definition for this result
  const testData = TEST_MAP[testId] || TEST_MAP.test1;

  // build parts from testData (real question ids per part)
  const parts = (testData?.parts || []).map((p, idx) => {
    const ids = (p.questions || [])
      .map(q => q?.id)
      .filter(id => typeof id === 'number')
      .sort((a, b) => a - b);
    return {
      title: p.title || `Part ${idx + 1}`,
      ids,
    };
  }).filter(p => p.ids.length > 0);

  // accordion state: open first part by default
  const [openPart, setOpenPart] = React.useState(0);
  const ResultRow = ({ id, correctAnswers, userAnswers }) => {
    const correctAns = correctAnswers[id];
    const userAns = userAnswers[id];
    const isCorrect = userAns === correctAns;
    const bg = !userAns ? '#fff3cd' : (isCorrect ? '#e8f5e9' : '#ffebee');
    const bar = !userAns ? '#ff9800' : (isCorrect ? '#4CAF50' : '#f44336');
    const text = !userAns ? '#ff9800' : (isCorrect ? '#2e7d32' : '#c62828');

    return (
      <div
        key={id}
        style={{
          margin: '8px 0',
          padding: '10px 16px',
          backgroundColor: bg,
          borderLeft: `6px solid ${bar}`,
          borderRadius: 4
        }}
      >
        <strong>Q{id}:</strong>{' '}
        Your Answer:
        <span style={{ fontWeight: 'bold', color: text }}>
          {userAns || 'Unanswered'}
        </span>{' '}
        | Correct:
        <strong>{correctAns}</strong>
      </div>
    );
  };

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const correctAnswers = answerKey[testId];

  const questionIds = Object.keys(correctAnswers).map(Number).sort((a, b) => a - b);

  let correct = 0;
  let wrong = 0;
  let missed = 0;

  questionIds.forEach(id => {
    if (!userAnswers[id]) missed++;
    else if (userAnswers[id] === correctAnswers[id]) correct++;
    else wrong++;
  });

  const total = correct + wrong + missed;
  const accuracy = Math.round((correct / total) * 100);

  return (
    <>
      <Navbar />
      <div style={{ padding: '30px' }}>
        <h2 style={{ fontSize: '24px' }}>Test Summary</h2>

        {/* Dashboard Box */}
        <div style={{ display: 'flex', gap: '20px', marginTop: '20px', marginBottom: '30px' }}>
          <DashboardCard icon="✅" label="Correct answer" value={correct} color="#4CAF50" />
          <DashboardCard icon="❌" label="Wrong answer" value={wrong} color="#f44336" />
          <DashboardCard icon="⏭️" label="Missed" value={missed} color="#FFA726" />
          <DashboardCard icon="📈" label="Accuracy" value={`${accuracy}%`} color="#3F51B5" />
          <DashboardCard icon="⏱️" label="Time Taken" value={formatTime(timeTaken)} color="#009688" /> {/* <-- add this */}

        </div>

        <hr />

        {/* Detailed Answer View */}
        <h3 style={{ marginTop: '30px', marginBottom: 10 }}>Question-wise Review</h3>

        <div style={{ marginTop: 8 }}>
          {parts.map((p, idx) => {
            const opened = openPart === idx;
            const first = p.ids[0];
            const last = p.ids[p.ids.length - 1];

            return (
              <div key={p.title} style={{ marginBottom: 14, border: '1px solid #e6e6e6', borderRadius: 8, overflow: 'hidden' }}>
                {/* Part header (click to toggle) */}
                <button
                  onClick={() => setOpenPart(prev => (prev === idx ? -1 : idx))}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 16px',
                    background: opened ? '#b30000' : '#f7f7f7',
                    color: opened ? '#fff' : '#333',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  {p.title}
                  {!!p.ids.length && (
                    <span style={{ fontWeight: 400, marginLeft: 8 }}>
                      (Q{first}–{last})
                    </span>
                  )}
                  <span style={{ float: 'right', opacity: 0.8 }}>{opened ? '▲' : '▼'}</span>
                </button>

                {/* Part body (only when open) */}
                {opened && (
                  <div style={{ padding: '12px 16px', background: '#fff' }}>
                    {p.ids.map(id => (
                      <ResultRow
                        key={id}
                        id={id}
                        correctAnswers={correctAnswers}
                        userAnswers={userAnswers}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </>
  );
};

const DashboardCard = ({ icon, label, value, color }) => (
  <div style={{
    flex: 1,
    backgroundColor: '#fff',
    border: `2px solid ${color}`,
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  }}>
    <div style={{ fontSize: '32px' }}>{icon}</div>
    <div style={{ fontSize: '14px', marginTop: '10px', color }}>{label}</div>
    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{value}</div>
  </div>

);

export default ResultPage;
