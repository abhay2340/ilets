import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig.jsx';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

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


          <div style={{ display: 'grid', gap: '15px' }}>
            {results.map((r, i) => (
              <div key={i} style={{
                border: '1px solid #ccc',
                borderRadius: '10px',
                padding: '15px',
                background: '#f9f9f9'
              }}>
                <h4>{r.test}</h4>
                <p><strong>Score:</strong> {r.correct} / {r.total}</p>
                <p><strong>Accuracy:</strong> {r.accuracy}%</p>
                <p><strong>Time Taken:</strong> {formatTime(r.timeTaken || 0)}</p>
                <p><strong>Submitted:</strong> {r.submittedAt?.toDate().toLocaleString()}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default OverviewSection;
