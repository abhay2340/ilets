import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig.jsx';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { FaCalendarAlt, FaClock, FaBullseye, FaCheckCircle, FaTimesCircle, FaMinusCircle } from 'react-icons/fa';

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const formatTime = (seconds) => {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}m ${sec}s`;
};

const OverviewSection = ({ user }) => {
  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchResults = async () => {
      const q = query(collection(db, 'results'), where('user', '==', user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => doc.data());
      setResults(data);
    };
    fetchResults();
  }, [user.uid]);

  // Chart data prep
  const labels = results.map((r) => r.test);
  const accuracyData = results.map((r) => r.accuracy);
  const timeData = results.map((r) => Math.round((r.timeTaken || 0) / 60)); // minutes
  const scoreData = results.map((r) => r.correct);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Accuracy %',
        data: accuracyData,
        backgroundColor: '#3F51B5',
      },

      {
        label: 'Score',
        data: scoreData,
        backgroundColor: '#4CAF50',
      }
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Test Progress Overview' },
    },
  };

  return (
    <div className="account-section">
      <h2 style={{ marginBottom: '30px' }}>Your Test Dashboard</h2>

      {results.length === 0 ? (
        <p>No test results found yet.</p>
      ) : (
        <>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Bar options={options} data={chartData} />
          </div>


          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginTop: '30px' }}>
            {results.map((r, i) => {
              const accuracyColor = (r.accuracy >= 75) ? '#2e7d32' : (r.accuracy >= 50 ? '#ff8f00' : '#c62828');
              const submittedAt = r.submittedAt?.toDate ? r.submittedAt.toDate() : (r.submittedAt ? new Date(r.submittedAt) : null);
              return (
                <div key={i} style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: 16,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontWeight: 800 }}>{r.test}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151' }}>
                      <FaCalendarAlt /> {submittedAt ? submittedAt.toLocaleString() : '—'}
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
                      <div style={{ fontWeight: 800 }}>{formatTime(r.timeTaken || 0)}</div>
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
        </>
      )}
    </div>
  );
};

export default OverviewSection;
