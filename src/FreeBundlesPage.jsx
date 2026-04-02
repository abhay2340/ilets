import React from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';
import LoaderOverlay from './components/LoaderOverlay.jsx';

const FreeBundlesPage = () => {
  const navigate = useNavigate();
  const [bundles, setBundles] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'bundles'));
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setBundles(items);
      } catch (e) {
        setError('Failed to load bundles', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const freeBundles = bundles.filter((b) => Number(b.price || 0) === 0);

  return (
    <div className="tests-section" style={{ padding: 16, maxWidth: 1100, margin: '0 auto' }}>
      <h1 className="choose-heading" style={{ textAlign: 'center', marginBottom: 16 }}>
        Free Test Package
      </h1>
      {loading && <LoaderOverlay text="Loading bundles…" />}
      {error && <div style={{ color: 'crimson' }}>{error}</div>}
      {!loading && !error && freeBundles.length === 0 && <div>No free bundles available.</div>}
      {!loading && !error && freeBundles.length > 0 && (
        <div className="bundle-grid">
          {freeBundles.map((b) => (
            <div
              key={b.id}
              style={{
                border: '1px solid #eaeaea',
                borderRadius: 10,
                padding: 20,
                background: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <h3 style={{ margin: 0, fontSize: 20 }}>{b.name || 'Package'}</h3>
              <div style={{ marginTop: 8, fontWeight: 700, color: '#28a745', fontSize: 16 }}>
                Free Package
              </div>
              <div style={{ marginTop: 8, fontSize: 14, color: '#555' }}>
                {Array.isArray(b.testIds) ? `${b.testIds.length} tests` : '0 tests'}
              </div>
              <div style={{ marginTop: 16, width: '100%' }}>
                <button
                  onClick={() => navigate(`/bundle/${b.id}`)}
                  style={{
                    display: 'block',
                    width: '100%',
                    background: 'linear-gradient(135deg, #1b5e20, #2e7d32)',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  View bundle
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FreeBundlesPage;
