import React from 'react';
import { useLocation } from 'react-router-dom';
import answerKey from '../data/answerkey'; // assuming you've added the test1 key
import Navbar from '../Navbar.jsx'; // Adjust the import path as necessary
import { FaCheckCircle, FaTimesCircle, FaStepForward, FaChartPie, FaStopwatch } from 'react-icons/fa';
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
    // Collect all question IDs including subIds from matching groups
    let ids = [];
    (p.questions || []).forEach(q => {
      if (typeof q?.id === 'number') {
        // For matching groups with subIds, add all subIds
        if (q.type === 'matchinggroup' && Array.isArray(q.subIds) && q.subIds.length > 0) {
          ids = [...ids, ...q.subIds];
        } else {
          ids.push(q.id);
        }
      }
    });
    
    // Sort IDs numerically
    ids.sort((a, b) => a - b);
    
    return {
      title: p.title || `Part ${idx + 1}`,
      ids,
    };
  }).filter(p => p.ids.length > 0);

  // accordion state: open first part by default
  const [openPart, setOpenPart] = React.useState(0);
  // Find the original question data for a given ID
  const findQuestionById = (id) => {
    for (const part of testData.parts || []) {
      for (const question of part.questions || []) {
        // Check if this is the main question with this ID
        if (question.id === id) return question;
        
        // Check if this ID is in the subIds of a matching group
        if (question.type === 'matchinggroup' && Array.isArray(question.subIds)) {
          const subIdIndex = question.subIds.indexOf(id);
          if (subIdIndex !== -1) {
            return {
              parentQuestion: question,
              subIdIndex
            };
          }
        }
      }
    }
    return null;
  };

  const ResultRow = ({ id, correctAnswers, userAnswers }) => {
    const correctAns = correctAnswers[id];
    // Use the processed user answers that have already been split for matching groups
    const userAns = processedUserAnswers[id];
    const isCorrect = userAns === correctAns;
    const bg = !userAns ? '#fff3cd' : (isCorrect ? '#e8f5e9' : '#ffebee');
    const bar = !userAns ? '#ff9800' : (isCorrect ? '#4CAF50' : '#f44336');
    const text = !userAns ? '#ff9800' : (isCorrect ? '#2e7d32' : '#c62828');
    
    // Format the display of the answer
    let displayUserAns = userAns || 'Unanswered';

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
          {displayUserAns}
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

  // Process user answers to extract individual answers for matching groups
  const processedUserAnswers = { ...userAnswers };
  
  // Find all matching group questions and process their answers
  for (const part of testData.parts || []) {
    for (const question of part.questions || []) {
      if (question.type === 'matchinggroup' && Array.isArray(question.subIds) && question.subIds.length > 0) {
        const groupAnswer = userAnswers[question.id] || '';
        const selections = groupAnswer.split('|');
        
        // Map each selection to its corresponding subId
        question.subIds.forEach((subId, index) => {
          if (index < selections.length && selections[index]) {
            processedUserAnswers[subId] = selections[index];
          }
        });
        
        // Also update the main question ID to show only the first answer
        // This fixes the issue with questions like Q37
        if (selections.length > 0 && selections[0]) {
          processedUserAnswers[question.id] = selections[0];
        }
      }
    }
  }

  questionIds.forEach(id => {
    if (!processedUserAnswers[id]) missed++;
    else if (processedUserAnswers[id] === correctAnswers[id]) correct++;
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginTop: '20px',
          marginBottom: '30px'
        }}>
          <DashboardCard
            icon={<FaCheckCircle />}
            label="Correct"
            value={correct}
            subtitle={`out of ${total}`}
            color="#2e7d32"
          />
          <DashboardCard
            icon={<FaTimesCircle />}
            label="Wrong"
            value={wrong}
            subtitle={`out of ${total}`}
            color="#c62828"
          />
          <DashboardCard
            icon={<FaStepForward />}
            label="Missed"
            value={missed}
            subtitle={`out of ${total}`}
            color="#ff8f00"
          />
          <DashboardCard
            icon={<FaChartPie />}
            label="Accuracy"
            value={`${accuracy}%`}
            color="#3F51B5"
            progressPercent={accuracy}
          />
          <DashboardCard
            icon={<FaStopwatch />}
            label="Time Taken"
            value={formatTime(timeTaken)}
            color="#009688"
          />
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

const DashboardCard = ({ icon, label, value, subtitle, color, progressPercent }) => (
  <div style={{
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color }}>
      <div style={{ fontSize: 22, display: 'flex', alignItems: 'center' }}>{icon}</div>
      <div style={{ fontWeight: 800 }}>{label}</div>
    </div>
    <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{value}</div>
    {subtitle && (
      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{subtitle}</div>
    )}
    {typeof progressPercent === 'number' && (
      <div style={{ height: 8, background: '#eee', borderRadius: 999, marginTop: 10, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(Math.max(progressPercent, 0), 100)}%`, height: '100%', background: color }} />
      </div>
    )}
  </div>
);

export default ResultPage;
