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

  console.log('🔵 ResultPage: Page loaded', {
    hasState: !!state,
    testId,
    timeTaken,
    userAnswersCount: Object.keys(userAnswers).length,
    userAnswers: userAnswers,
    userAnswerIds: Object.keys(userAnswers).map(Number).sort((a, b) => a - b)
  });

  // If no state (e.g., user navigated back), send them to dashboard to avoid reopening test
  if (!state) {
    console.warn('⚠️ ResultPage: No state found, redirecting to dashboard');
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

  // build parts from testData (real question ids per part, including subIds)
  const parts = React.useMemo(() => {
    const result = (testData?.parts || []).map((p, idx) => {
      const allIds = [];
      const questionsWithDetails = [];

      (p.questions || []).forEach(q => {
        if (Array.isArray(q.subIds)) {
          // For questions with subIds, add each subId and store question details
          q.subIds.forEach((subId, subIdx) => {
            allIds.push(subId);
            questionsWithDetails.push({
              id: subId,
              parentId: q.id,
              question: q.question,
              type: q.type,
              options: q.options,
              rows: q.rows,
              rowIndex: subIdx,
              rowText: Array.isArray(q.rows) && q.rows[subIdx] ? q.rows[subIdx] : undefined,
              isSubQuestion: true
            });
          });
        } else if (typeof q.id === 'number') {
          // For regular questions, add the question ID
          allIds.push(q.id);
          questionsWithDetails.push({
            id: q.id,
            question: q.question,
            type: q.type,
            options: q.options,
            isSubQuestion: false
          });
        }
      });

      return {
        title: p.title || `Part ${idx + 1}`,
        ids: allIds.sort((a, b) => a - b),
        questionsWithDetails
      };
    }).filter(p => p.ids.length > 0);

    console.log('📋 ResultPage: Parts with question details', {
      partsCount: result.length,
      parts: result.map(p => ({
        title: p.title,
        idsCount: p.ids.length,
        questionsCount: p.questionsWithDetails?.length || 0
      }))
    });

    return result;
  }, [testData]);

  // accordion state: open first part by default
  const [openPart, setOpenPart] = React.useState(0);
  const ResultRow = ({ id, correctAnswers, userAnswers, questionDetails }) => {
    const correctAns = correctAnswers[id];
    const userAns = userAnswers[id];

    // Get question text and options if available
    const qDetail = questionDetails || {};
    const questionText = qDetail.question || '';
    const questionType = qDetail.type || '';
    const options = Array.isArray(qDetail.options) ? qDetail.options : [];
    const rows = Array.isArray(qDetail.rows) ? qDetail.rows : [];
    const isSubQuestion = qDetail.isSubQuestion || false;
    const parentId = qDetail.parentId;

    const uaStr = String(userAns ?? '').trim();
    const caStr = String(correctAns ?? '').trim();

    // Per‑question marks (supports partial marks for multiselect)
    let maxMarks = 1;
    let awarded = 0;
    let status = 'no_key'; // 'correct' | 'wrong' | 'missed' | 'partial' | 'no_key'

    if (!caStr) {
      status = uaStr ? 'no_key' : 'missed';
    } else if (questionType === 'multiselect') {
      const correctOptions = caStr ? caStr.split(',').map(s => s.trim()).filter(Boolean) : [];
      const userOptions = uaStr ? uaStr.split(',').map(s => s.trim()).filter(Boolean) : [];
      maxMarks = correctOptions.length || 0;

      if (!uaStr) {
        awarded = 0;
        status = 'missed';
      } else {
        const correctSet = new Set(correctOptions);
        userOptions.forEach(opt => {
          if (correctSet.has(opt)) awarded += 1;
        });
        if (awarded > maxMarks) awarded = maxMarks;
        if (awarded === 0) status = 'wrong';
        else if (awarded === maxMarks) status = 'correct';
        else status = 'partial';
      }
    } else {
      maxMarks = 1;
      if (!uaStr) {
        status = 'missed';
      } else if (compareAnswers(uaStr, caStr)) {
        awarded = 1;
        status = 'correct';
      } else {
        awarded = 0;
        status = 'wrong';
      }
    }

    const bg =
      status === 'correct' ? '#e8f5e9'
        : status === 'partial' ? '#e3f2fd'
        : status === 'missed' ? '#fff3cd'
          : status === 'wrong' ? '#ffebee'
            : '#f5f5f5';
    const bar =
      status === 'correct' ? '#4CAF50'
        : status === 'partial' ? '#1976d2'
        : status === 'missed' ? '#ff9800'
          : status === 'wrong' ? '#f44336'
            : '#9e9e9e';
    const text =
      status === 'correct' ? '#2e7d32'
        : status === 'partial' ? '#1565c0'
        : status === 'missed' ? '#ff9800'
          : status === 'wrong' ? '#c62828'
            : '#616161';

    // Format answer display based on question type
    const formatAnswer = (ans, isCorrectAnswer = false) => {
      if (!ans || String(ans).trim() === '') return 'Unanswered';
      const ansStr = String(ans).trim();

      if (questionType === 'matchingdrag') {
        const matchingOption = options.find(opt => String(opt).trim() === ansStr);
        if (matchingOption) return matchingOption;
        return ansStr;
      }
      return ansStr;
    };

    return (
      <div
        key={id}
        style={{
          margin: '8px 0',
          padding: '12px 16px',
          backgroundColor: bg,
          borderLeft: `6px solid ${bar}`,
          borderRadius: 4
        }}
      >
        <div style={{ marginBottom: 6 }}>
          <strong>Q{id}</strong>
          {isSubQuestion && parentId && (
            <span style={{ fontSize: 12, color: '#666', marginLeft: 6 }}>
              (Part of Q{parentId})
            </span>
          )}
        </div>
        {(questionText || (isSubQuestion && qDetail.rowText)) && (
          <div style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
            {isSubQuestion && qDetail.rowText ? (
              <div>
                <span style={{ fontStyle: 'italic' }}>{questionText}</span>
                <div style={{ marginTop: 4, fontWeight: 600 }}>
                  {qDetail.rowText}
                </div>
              </div>
            ) : (
              <span style={{ fontStyle: 'italic' }}>{questionText}</span>
            )}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div>
            <strong>Your Answer:</strong>{' '}
            <span style={{ fontWeight: 'bold', color: text }}>
              {formatAnswer(userAns)}
            </span>
          </div>
          {correctAns && (
            <div>
              <strong>Correct Answer:</strong>{' '}
              <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>
                {formatAnswer(correctAns, true)}
              </span>
            </div>
          )}
          {!correctAns && (
            <div style={{ fontSize: 12, color: '#999', fontStyle: 'italic' }}>
              No correct answer defined
            </div>
          )}
          {/* Show marks for questions that have a key */}
          {caStr && (
            <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
              <strong>Marks:</strong> {awarded}/{maxMarks}
              {status === 'partial' && ' (partial credit)'}
            </div>
          )}
        </div>
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
    if (!isDbMode) {
      console.log('🔵 ResultPage: Not in DB mode, using local answer key', { testId });
      return;
    }
    let active = true;
    (async () => {
      try {
        console.log('🔵 ResultPage: Loading test and answers from Firestore...', { testId, isDbMode });
        const snap = await getDoc(doc(db, 'tests', testId));
        if (active && snap.exists()) {
          const testData = snap.data();
          console.log('✅ ResultPage: Test loaded from Firestore API', {
            testId,
            testTitle: testData?.title,
            partsCount: testData?.parts?.length || 0,
            totalQuestions: testData?.parts?.reduce((sum, p) => sum + (p.questions?.length || 0), 0) || 0,
            testData: testData
          });
          setDbTest(testData);
        } else {
          console.warn('⚠️ ResultPage: Test not found in Firestore API', { testId });
        }
        const ans = await getDoc(doc(db, 'answers', testId));
        if (active && ans.exists()) {
          const answerData = ans.data();
          const answersMap = answerData?.answers || {};
          console.log('✅ ResultPage: Correct answers loaded from Firestore API', {
            testId,
            apiResponse: answerData,
            answersCount: Object.keys(answersMap).length,
            answerKeys: Object.keys(answersMap).map(Number).sort((a, b) => a - b),
            answers: answersMap
          });
          setDbAnswers(answersMap);
        } else {
          console.warn('⚠️ ResultPage: Answers not found in Firestore API', { testId });
          setDbAnswers({});
        }
      } catch (error) {
        console.error('❌ ResultPage: Error loading from Firestore API', { testId, error });
      }
      if (active) setLoadingDb(false);
    })();
    return () => { active = false };
  }, [isDbMode, testId]);

  const correctAnswers = isDbMode ? (dbAnswers || {}) : (answerKey[testId] || {});

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 ResultPage: Debug summary', {
      testId,
      isDbMode,
      dbAnswersCount: Object.keys(dbAnswers || {}).length,
      dbAnswers: dbAnswers,
      correctAnswersCount: Object.keys(correctAnswers).length,
      correctAnswers: correctAnswers,
      userAnswersCount: Object.keys(userAnswers || {}).length,
      userAnswers: userAnswers,
      testDataParts: testData?.parts?.length || 0,
      testData: testData
    });
  }, [isDbMode, testId, dbAnswers, correctAnswers, userAnswers, testData]);

  // Get question IDs from multiple sources to ensure we don't miss any
  const correctAnswerIds = Object.keys(correctAnswers || {}).map(Number);
  const userAnswerIds = Object.keys(userAnswers || {}).map(Number);
  // Also get IDs from test structure (including subIds)
  const testQuestionIds = React.useMemo(() => {
    const ids = [];
    (testData?.parts || []).forEach(part => {
      (part.questions || []).forEach(q => {
        if (Array.isArray(q.subIds)) {
          ids.push(...q.subIds);
        } else if (typeof q.id === 'number') {
          ids.push(q.id);
        }
      });
    });
    return ids;
  }, [testData]);

  // Combine all sources and remove duplicates
  const allQuestionIds = [...new Set([...correctAnswerIds, ...userAnswerIds, ...testQuestionIds])]
    .filter(id => typeof id === 'number' && !isNaN(id))
    .sort((a, b) => a - b);

  const questionIds = allQuestionIds.length > 0 ? allQuestionIds : correctAnswerIds;

  console.log('📊 ResultPage: Question ID collection', {
    correctAnswerIds,
    userAnswerIds,
    testQuestionIds,
    allQuestionIds,
    finalQuestionIds: questionIds,
    correctAnswers: correctAnswers,
    userAnswers: userAnswers
  });

  let correct = 0;   // total marks gained
  let wrong = 0;     // total marks lost (attempted but incorrect)
  let missed = 0;    // total marks from unanswered parts
  const scoringDetails = [];

  questionIds.forEach(id => {
    const ua = userAnswers[id];
    const ca = correctAnswers[id];
    const uaStr = String(ua ?? '').trim();
    const caStr = String(ca ?? '').trim();

    // Look up question type (for multiselect partial scoring)
    let qType = '';
    (testData?.parts || []).forEach(part => {
      (part.questions || []).forEach(q => {
        if (Array.isArray(q.subIds) && q.subIds.includes(id)) {
          qType = q.type || '';
        } else if (q.id === id) {
          qType = q.type || '';
        }
      });
    });

    if (!caStr) {
      if (!uaStr) {
        scoringDetails.push({ id, status: 'missed', userAnswer: uaStr, correctAnswer: caStr });
      } else {
        scoringDetails.push({ id, status: 'no_key', userAnswer: uaStr, correctAnswer: caStr });
      }
      return;
    }

    // Multiselect → each correct option is 1 mark
    if (qType === 'multiselect') {
      const correctOptions = caStr ? caStr.split(',').map(s => s.trim()).filter(Boolean) : [];
      const userOptions = uaStr ? uaStr.split(',').map(s => s.trim()).filter(Boolean) : [];
      const maxMarks = correctOptions.length || 0;

      if (!uaStr) {
        missed += maxMarks;
        scoringDetails.push({ id, status: 'missed', userAnswer: uaStr, correctAnswer: caStr, maxMarks, marksAwarded: 0 });
      } else {
        const correctSet = new Set(correctOptions);
        let awarded = 0;
        userOptions.forEach(opt => {
          if (correctSet.has(opt)) awarded += 1;
        });
        if (awarded > maxMarks) awarded = maxMarks;
        const lost = maxMarks - awarded;
        correct += awarded;
        wrong += lost;

        let status = 'wrong';
        if (awarded === 0) status = 'wrong';
        else if (awarded === maxMarks) status = 'correct';
        else status = 'partial';

        scoringDetails.push({
          id,
          status,
          userAnswer: uaStr,
          correctAnswer: caStr,
          maxMarks,
          marksAwarded: awarded
        });
      }
      return;
    }

    // Default single‑mark questions
    if (!uaStr) {
      missed += 1;
      scoringDetails.push({ id, status: 'missed', userAnswer: uaStr, correctAnswer: caStr, maxMarks: 1, marksAwarded: 0 });
    } else if (compareAnswers(ua, ca)) {
      correct += 1;
      scoringDetails.push({ id, status: 'correct', userAnswer: uaStr, correctAnswer: caStr, maxMarks: 1, marksAwarded: 1 });
    } else {
      wrong += 1;
      scoringDetails.push({ id, status: 'wrong', userAnswer: uaStr, correctAnswer: caStr, maxMarks: 1, marksAwarded: 0 });
    }
  });

  const rawTotal = correct + wrong + missed;
  const total = rawTotal > 0 ? rawTotal : (questionIds.length || Object.keys(userAnswers || {}).length || 0);
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  console.log('✅ ResultPage: Scoring complete', {
    correct,
    wrong,
    missed,
    total,
    accuracy,
    scoringDetails
  });

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
                        {p.ids.length === 0 ? (
                          <div style={{ color: '#999', fontStyle: 'italic', padding: 12 }}>
                            No questions found in this part
                          </div>
                        ) : (
                          p.ids.map(id => {
                            // Find question details for this ID
                            const questionDetail = p.questionsWithDetails?.find(q => q.id === id);

                            return (
                              <ResultRow
                                key={id}
                                id={id}
                                correctAnswers={correctAnswers}
                                userAnswers={userAnswers}
                                questionDetails={questionDetail}
                              />
                            );
                          })
                        )}
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
