import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './TestLandingPage.css';
import backgroundImg from './assets/student-hero.jpg';
import { FaBookReader, FaClock, FaHeadphones } from 'react-icons/fa';
import { useAuth } from './AuthContext';
import { usePurchases } from './hooks/usePurchases';
import { TEST_PRICING, formatPrice } from './config/pricing';
import { signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import ContactSection from './ContactSection';
import FreeTests from './FreeTests';
import PaidTests from './PaidTests';

function TestLandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { purchasedTests, loading, hasAccess } = usePurchases();

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
          <h2 className="choose-heading">Available Tests</h2>
          <FreeTests purchasedTests={purchasedTests} loading={loading} navigate={navigate} />
          <div id="paid-tests-section">
            <PaidTests purchasedTests={purchasedTests} loading={loading} navigate={navigate} hasAccess={hasAccess} />
          </div>
        </div>
      </section>
      <ContactSection />
    </div>
  );
}

export default TestLandingPage;
