import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import answerKey from '../data/answerkey';
import { useAuth } from '../AuthContext';
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
import { db } from '../firebaseConfig.jsx';
import { doc, getDoc } from 'firebase/firestore';
import LoaderOverlay from '../components/LoaderOverlay.jsx';

const TEST_MAP = { test1, test2, test3, test4, test5, test6, test7, test8, test9 };

console.log(TEST_MAP);
const ResultPage = () => {

  const { state } = useLocation();
  const { userAnswers = {}, testId = 'test1', timeTaken = 0 } = state || {};
  // If no state (e.g., user navigated back), send them to dashboard to avoid reopening test
  if (!state) {
    window.location.replace('/dashboard');
    return null;
  }
  const isDbMode = !TEST_MAP[testId];
  const [dbTest, setDbTest] = React.useState(null);
  const [dbAnswers, setDbAnswers] = React.useState(null);
  const [loadingDb, setLoadingDb] = React.useState(isDbMode);
  // get actual test definition for this result
  const testData = isDbMode ? (dbTest || { parts: [] }) : (TEST_MAP[testId] || TEST_MAP.test1);
  const { user } = useAuth();

  // Local compare helper: ignore case, collapse spaces; for comma lists compare unordered
  const compareAnswers = (a, b) => {
    const toNorm = (s) => String(s ?? '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
    const aStr = String(a ?? '');
    const bStr = String(b ?? '');
    if (aStr.includes(',') || bStr.includes(',')) {
      const tokens = (s) => s.split(',').map(toNorm).filter(Boolean).sort();
      const A = tokens(aStr);
      const B = tokens(bStr);
      if (A.length !== B.length) return false;
      for (let i = 0; i < A.length; i += 1) if (A[i] !== B[i]) return false;
      return true;
    }
    return toNorm(aStr) === toNorm(bStr);
  };

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
    const isCorrect = compareAnswers(userAns, correctAns);
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

  // If db mode, fetch test + answers
  React.useEffect(() => {
    if (!isDbMode) return;
    let active = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'tests', testId));
        if (active && snap.exists()) setDbTest(snap.data());
        const ans = await getDoc(doc(db, 'answers', testId));
        if (active && ans.exists()) setDbAnswers((ans.data() || {}).answers || {});
      } catch { }
      if (active) setLoadingDb(false);
    })();
    return () => { active = false };
  }, [isDbMode, testId]);

  const correctAnswers = isDbMode ? (dbAnswers || {}) : (answerKey[testId] || {});

  const questionIds = Object.keys(correctAnswers || {}).map(Number).sort((a, b) => a - b);

  let correct = 0;
  let wrong = 0;
  let missed = 0;

  questionIds.forEach(id => {
    const ua = userAnswers[id];
    if (!String(ua ?? '').trim()) missed++;
    else if (compareAnswers(ua, correctAnswers[id])) correct++;
    else wrong++;
  });

  const rawTotal = correct + wrong + missed;
  const total = rawTotal || questionIds.length || Object.keys(userAnswers || {}).length || 0;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <>
      <div style={{ padding: '34px', position: 'relative' }}>
        {loadingDb && <LoaderOverlay text="Loading results…" />}
        <div style={{ display: 'flex', gap: 28, alignItems: 'stretch', minHeight: 'calc(100vh - 120px)' }}>
          {/* Sidebar: User details (moved left, full height) */}
          <div style={{ flex: '0 0 320px', maxWidth: 360, alignSelf: 'stretch' }}>
            <div style={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ fontWeight: 800, marginBottom: 14 }}>Submitted By</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="avatar" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    color: '#374151'
                  }}>
                    {(user?.displayName || user?.email || 'U').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 800, marginBottom: 2 }}>{user?.displayName || user?.email || 'User'}</div>
                  {user?.email && <div style={{ fontSize: 12, color: '#6b7280' }}>{user.email}</div>}
                </div>
              </div>
              <div style={{ marginTop: 6 }}>
                <div style={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: 14,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ color: '#6b7280', fontWeight: 800, fontSize: 14, marginBottom: 4 }}>Test</div>
                  <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 0.2 }}>{testData?.title || String(testId).toUpperCase()}</div>
                  <div style={{ height: 10 }} />
                  <div style={{ color: '#6b7280', fontWeight: 800, fontSize: 14, marginBottom: 4 }}>Score</div>
                  <div style={{ fontSize: 28, fontWeight: 900 }}>{correct}/{total} ({accuracy}%)</div>
                </div>
              </div>
              <div style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 12 }}>
                <div style={{ fontWeight: 800, marginBottom: 10 }}>Account</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link to="/account?tab=history" style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: 700 }}>View History</Link>
                  <Link to="/account?tab=overview" style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: 700 }}>Overview</Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '24px' }}>Test Summary</h2>

            {/* Dashboard Box */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 20,
              marginTop: 24,
              marginBottom: 36
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

            <hr style={{ marginTop: 6, marginBottom: 18 }} />

            {/* Detailed Answer View */}
            <h3 style={{ marginTop: 30, marginBottom: 12 }}>Question-wise Review</h3>

            <div style={{ marginTop: 10 }}>
              {parts.map((p, idx) => {
                const opened = openPart === idx;
                const first = p.ids[0];
                const last = p.ids[p.ids.length - 1];

                return (
                  <div key={p.title} style={{ marginBottom: 16, border: '1px solid #e6e6e6', borderRadius: 8, overflow: 'hidden' }}>
                    {/* Part header (click to toggle) */}
                    <button
                      onClick={() => setOpenPart(prev => (prev === idx ? -1 : idx))}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '14px 16px',
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
                      <div style={{ padding: '14px 16px', background: '#fff' }}>
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
