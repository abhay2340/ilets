import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './TestLandingPage.css';
import backgroundImg from './assets/student-hero.jpg';
import { FaBookReader, FaClock, FaHeadphones } from 'react-icons/fa';
import { useAuth } from './AuthContext';
import { usePurchases } from './hooks/usePurchases';
import { TEST_PRICING, formatPrice } from './config/pricing';
import { signOut } from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import LoaderOverlay from './components/LoaderOverlay.jsx';
import ContactSection from './ContactSection';
import FreeTests from './FreeTests';
import PaidTests from './PaidTests';

function TestLandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { purchasedTests, loading, hasAccess } = usePurchases();
  const [bundles, setBundles] = React.useState([])
  const [bundlesLoading, setBundlesLoading] = React.useState(true)
  const [bundlesError, setBundlesError] = React.useState('')

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  // (Old access-check and quick purchase helpers removed; simplified buttons below use hasAccess directly.)
  // If navigated with #paid or ?section=paid, scroll into view
  React.useEffect(() => {
    const hash = (location.hash || '').toLowerCase();
    const section = new URLSearchParams(location.search).get('section');
    if (hash === '#paid' || (section && section.toLowerCase() === 'paid')) {
      // Defer to next frame to ensure layout is ready
      requestAnimationFrame(() => {
        const el = document.getElementById('paid-tests-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
      });
    }
  }, [location.pathname, location.hash, location.search]);

  React.useEffect(() => {
    const loadBundles = async () => {
      try {
        const snap = await getDocs(collection(db, 'bundles'))
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setBundles(items)
      } catch (e) {
        setBundlesError('Failed to load bundles')
      } finally {
        setBundlesLoading(false)
      }
    }
    loadBundles()
  }, [])

  return (
    <div className="test-landing-container">
      {/* Navbar is global now */}

      {/* Hero Section with Background */}
      <section className="full-hero" style={{ backgroundImage: `url(${backgroundImg})` }}>
        <div className="hero-anim-layer" aria-hidden="true">
          <div className="blob red"></div>
          <div className="blob orange"></div>
          <div className="blob pink"></div>
        </div>
        <div className="hero-overlay">
          <div className="hero-content">
            <h1>Prepare for Success with Our IELTS Practice Tests</h1>
            <p>
              Simulate the real IELTS experience with our expertly designed mock tests. Boost your
              confidence and get exam-ready with professional guidance.
            </p>

            <div className="hero-features">
              <div className="feature-item">
                <FaBookReader className="feature-icon" />
                <span className="feature-text">Realistic Reading</span>
              </div>
              <div className="feature-item">
                <FaClock className="feature-icon" />
                <span className="feature-text">Timed Practice</span>
              </div>
              <div className="feature-item">
                <FaHeadphones className="feature-icon" />
                <span className="feature-text">Listening Audio</span>
              </div>
            </div>

            <button
              onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
            >
              View Tests
            </button>
          </div>
        </div>
      </section>

      <section className="test-choose" id="paid-tests-anchor">
        <div className="tests-container">
          <div style={{ marginTop: 24 }}>
            {bundlesLoading && <LoaderOverlay text="Loading bundles…" />}
            {bundlesError && <div style={{ color: 'crimson' }}>{bundlesError}</div>}

            {!bundlesLoading && !bundlesError && (
              <>
                {/* Free Bundles Section */}
                {bundles.filter(b => Number(b.price || 0) === 0).length > 0 && (
                  <div className="tests-section">
                    <h2 className="choose-heading" style={{ textAlign: 'center' }}>Free Bundles</h2>
                    <div className="bundle-grid">
                      {bundles.filter(b => Number(b.price || 0) === 0).map(b => (
                        <div key={b.id} style={{ border: '1px solid #eaeaea', borderRadius: 10, padding: 20, background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                          <h3 style={{ margin: 0, fontSize: 20 }}>{b.name || 'Bundle'}</h3>
                          <div style={{ marginTop: 8, fontWeight: 700, color: '#28a745', fontSize: 16 }}>Free Bundle</div>
                          <div style={{ marginTop: 8, fontSize: 14, color: '#555' }}>
                            {Array.isArray(b.testIds) ? `${b.testIds.length} tests` : '0 tests'}
                          </div>
                          <div style={{ marginTop: 16, width: '100%' }}>
                            <button
                              onClick={() => navigate(`/bundle/${b.id}`)}
                              style={{
                                display: 'block',
                                width: '100%',
                                background: 'linear-gradient(135deg, #b30000, #ff0002)',
                                color: '#fff',
                                border: 'none',
                                padding: '10px 16px',
                                borderRadius: 8,
                                fontSize: 14,
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              View bundle
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Premium Bundles Section */}
                {bundles.filter(b => Number(b.price || 0) > 0).length > 0 && (
                  <div className="tests-section">
                    <h2 className="choose-heading" style={{ textAlign: 'center' }}>Premium Bundles</h2>
                    <div className="bundle-grid">
                      {bundles.filter(b => Number(b.price || 0) > 0).map(b => (
                        <div key={b.id} style={{ border: '1px solid #eaeaea', borderRadius: 10, padding: 20, background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                          <h3 style={{ margin: 0, fontSize: 20 }}>{b.name || 'Bundle'}</h3>
                          <div style={{ marginTop: 8, fontWeight: 700, fontSize: 16 }}>₹{Number(b.price || 0).toLocaleString()}</div>
                          <div style={{ marginTop: 8, fontSize: 14, color: '#555' }}>
                            {Array.isArray(b.testIds) ? `${b.testIds.length} tests` : '0 tests'}
                          </div>
                          <div style={{ marginTop: 16, width: '100%' }}>
                            <button
                              onClick={() => navigate(`/bundle/${b.id}`)}
                              style={{
                                display: 'block',
                                width: '100%',
                                background: 'linear-gradient(135deg, #b30000, #ff0002)',
                                color: '#fff',
                                border: 'none',
                                padding: '10px 16px',
                                borderRadius: 8,
                                fontSize: 14,
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              View bundle
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {bundles.length === 0 && <div>No bundles available.</div>}
              </>
            )}
          </div>
        </div>
      </section >
      <ContactSection />
    </div >
  );
}

export default TestLandingPage;
