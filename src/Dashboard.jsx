import React from 'react';
import './Dashboard.css';
import logo from './assets/logo.png';
import { FaUserCircle, FaShoppingCart } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { FaLaptopCode, FaChartLine, FaUserGraduate, FaClock, FaBullseye, FaShieldAlt, FaHeadset, FaLightbulb, FaStar, FaBookReader, FaGraduationCap, FaHeadphones } from 'react-icons/fa';
import ContactSection from './ContactSection';
import heroBg from './assets/main-bg.jpg';

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <>
      {/* Background with White Box + animated education icons */}
      <div className="hero-section" style={{ backgroundImage: `url(${heroBg})` }}>

        <div className="hero-content">
          <h1 className="hero-title">Empower Your Future with <span>GURJANT IELTS</span></h1>
          <p className="hero-subtitle">Interactive tests, real-time feedback, and everything you need to succeed.</p>
          <button className="hero-btn" onClick={() => navigate('/test-start')}>Get Started</button>
        </div>
      </div>
      <div className="test-section">
        <div className="test-content">
          <h2 className="test-title">Start Practicing with Real IELTS Tests</h2>
          <p className="test-description">
            Dive into full-length IELTS mock tests that simulate the real exam environment. Track your progress and improve your skills.
          </p>
          <button className="hero-btn" onClick={() => navigate('/test-start')}>Get Started</button>
        </div>
      </div>
      <div className="why-section" id="why-us">
        <h2 className="why-title">Why Choose Us?</h2>
        <p className="why-subtitle">
          A smarter, simpler, and more effective way to prepare for IELTS.
        </p>
        <div className="why-cards">
          <div className="why-card"><FaLaptopCode className="why-icon" /><h3>Interactive Practice</h3><p>Real-time IELTS mock tests designed to mirror the actual exam format.</p></div>
          <div className="why-card"><FaChartLine className="why-icon" /><h3>Performance Tracking</h3><p>Track your progress with intelligent analytics and feedback tools.</p></div>
          <div className="why-card"><FaUserGraduate className="why-icon" /><h3>Expert Content</h3><p>Materials crafted by top IELTS educators to help you succeed.</p></div>
          <div className="why-card"><FaClock className="why-icon" /><h3>Flexible Timing</h3><p>Practice anytime, anywhere—on your own schedule.</p></div>
          <div className="why-card"><FaBullseye className="why-icon" /><h3>Goal-Oriented</h3><p>Structured learning paths that help you reach your band score target.</p></div>
          <div className="why-card"><FaShieldAlt className="why-icon" /><h3>Secure Platform</h3><p>Safe, private, and student-focused experience you can trust.</p></div>
          <div className="why-card"><FaHeadset className="why-icon" /><h3>24x7 Support</h3><p>Get expert assistance whenever you need help.</p></div>
          <div className="why-card"><FaLightbulb className="why-icon" /><h3>Smart Insights</h3><p>AI-powered tips to improve your weak areas and score faster.</p></div>
        </div>
      </div>
      <ContactSection />
      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-logo">Gurjant IELTS</div>
          <ul className="footer-nav">
            <li><a href="/">Home</a></li>
            <li><a href="/introduction">Introduction</a></li>
            <li><a href="/contact">Contact</a></li>
            <li><a href="/admin-panel">Admin Panel</a></li>
          </ul>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Gurjant IELTS. All rights reserved.</p>
        </div>
      </footer>

    </>
  );
}

export default Dashboard;
