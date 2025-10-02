import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig.jsx';
import { FaCalendarAlt, FaClock, FaBullseye, FaCheckCircle, FaTimesCircle, FaMinusCircle } from 'react-icons/fa';

const HistorySection = ({ user }) => {
  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchResults = async () => {
      const q = query(collection(db, 'results'), where('user', '==', user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setResults(data.sort((a, b) => b.submittedAt?.seconds - a.submittedAt?.seconds));
    };

    if (user?.uid) fetchResults();
  }, [user]);

  const formatDate = (ts) => {
    if (!ts) return '—';
    try {
      const d = ts?.toDate ? ts.toDate() : new Date(ts.seconds ? ts.seconds * 1000 : ts);
      return d.toLocaleString();
    } catch (_) { return '—'; }
  };

  const formatTime = (sec) => {
    if (sec == null) return '—';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  return (
    <div>
      <h2>Your Test History</h2>
      <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', maxHeight: '80vh', overflowY: 'auto' }}>
        {results.map((r) => {
          const accuracyColor = (r.accuracy >= 75) ? '#2e7d32' : (r.accuracy >= 50 ? '#ff8f00' : '#c62828');
          return (
            <div
              key={r.id}
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 16,
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontWeight: 800 }}>{r.test}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151' }}>
                  <FaCalendarAlt /> {formatDate(r.submittedAt)}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '8px 0 12px' }}>
                <div style={{
                  flex: '1 1 0',
                  minWidth: 120,
                  background: '#f9fafb',
                  border: '1px solid #eef2f7',
                  borderRadius: 10,
                  padding: 10
                }}>
                  <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FaBullseye /> Score
                  </div>
                  <div style={{ fontWeight: 800 }}>{r.correct}/{r.total}</div>
                </div>

                <div style={{
                  flex: '1 1 0',
                  minWidth: 120,
                  background: '#f9fafb',
                  border: '1px solid #eef2f7',
                  borderRadius: 10,
                  padding: 10
                }}>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Accuracy</div>
                  <div style={{ fontWeight: 800, color: accuracyColor }}>{r.accuracy}%</div>
                  <div style={{ height: 6, background: '#eee', borderRadius: 999, marginTop: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(Math.max(r.accuracy, 0), 100)}%`, height: '100%', background: accuracyColor }} />
                  </div>
                </div>

                <div style={{
                  flex: '1 1 0',
                  minWidth: 120,
                  background: '#f9fafb',
                  border: '1px solid #eef2f7',
                  borderRadius: 10,
                  padding: 10
                }}>
                  <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FaClock /> Time Taken
                  </div>
                  <div style={{ fontWeight: 800 }}>{formatTime(r.timeTaken)}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#e8f5e9', color: '#2e7d32', borderRadius: 999, padding: '6px 10px', fontSize: 12 }}>
                  <FaCheckCircle /> Correct: {r.correct}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ffebee', color: '#c62828', borderRadius: 999, padding: '6px 10px', fontSize: 12 }}>
                  <FaTimesCircle /> Wrong: {r.wrong}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff8e1', color: '#ff8f00', borderRadius: 999, padding: '6px 10px', fontSize: 12 }}>
                  <FaMinusCircle /> Unanswered: {r.unanswered}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistorySection;
