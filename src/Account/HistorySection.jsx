import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig.jsx';

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

  if (!results.length) {
    return <p>No test history found.</p>;
  }

  return (
    <div>
      <h2>Your Test History</h2>
      <div style={{ marginTop: '20px', display: 'grid', gap: '15px' }}>
        {results.map(result => (
          <div key={result.id} style={{
            padding: '15px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            backgroundColor: '#fff'
          }}>
            <h4>{result.test}</h4>
            <p><strong>Score:</strong> {result.correct}/{result.total}</p>
            <p><strong>Accuracy:</strong> {result.accuracy}%</p>
            <p><strong>Date:</strong> {new Date(result.submittedAt?.seconds * 1000).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistorySection;
