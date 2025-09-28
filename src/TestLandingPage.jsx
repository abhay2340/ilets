import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TestLandingPage.css';
import backgroundImg from './assets/student-hero.jpg';
import { FaBookReader, FaClock, FaHeadphones } from 'react-icons/fa';
import { useAuth } from './AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import Navbar from './Navbar';
import ContactSection from './ContactSection';

function TestLandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div className="test-landing-container">
      {/* Navbar */}
      <Navbar transparent />

      {/* Hero Section with Background */}
      <section className="full-hero" style={{ backgroundImage: `url(${backgroundImg})` }}>
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
                <span>Realistic Reading</span>
              </div>
              <div className="feature-item">
                <FaClock className="feature-icon" />
                <span>Timed Practice</span>
              </div>
              <div className="feature-item">
                <FaHeadphones className="feature-icon" />
                <span>Listening Audio</span>
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

      <section className="test-choose">
        <h2 className="choose-heading">Available Tests</h2>
        <div className="test-list">
          {
            Array.from({ length: 9 }).map((_, index) => (
              <div className="test-box">
                <h3>Test {index + 1}</h3>
                <p>Listening practice with audio.</p>
                <button onClick={() => navigate(`/security?testId=test${index + 1}`)}>Start Test {index + 1}</button>
              </div>
            ))
          }
        </div>
      </section>
      <ContactSection />
    </div>
  );
}

export default TestLandingPage;
