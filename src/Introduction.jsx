import React from 'react';
import './Introduction.css';
import logo from './assets/logo.png';
import benefitImage from './assets/benefit-girl.png'; // update if filename differs
import { FaUserCircle, FaShoppingCart } from 'react-icons/fa';
import Navbar from './Navbar';
import ContactSection from './ContactSection';

function Introduction() {
  return (
    <>
      <Navbar transparent />
      <div className="intro-top-bg" />
      <div className="intro-card">
        <div className="intro-left">
          <img src={logo} alt="Gurjant IELTS Logo" className="intro-logo" />
        </div>
        <div className="intro-right">
          <p className="intro-heading">About us</p>
          <h1 className="intro-title">Where IELTS Dreams Begin</h1>
          <p className="intro-text">
            At Gurjant IELTS Patiala, we’ve been helping students achieve their dream IELTS scores for over a decade.
            With 10 years of proven success, we’ve built a reputation for delivering high-quality, results-driven training to learners across the globe.
            <br />
            Whether you're preparing for your IELTS Academic or General exam, our expert-led online and offline classes,
            realistic mock tests, and intensive speaking practice sessions are designed to give you the confidence and skills you need to excel.
          </p>
        </div>
      </div>
      <h1 className="benefit-head">Take the Test. Feel the Difference.</h1>
      {/* Benefits Section Below Intro */}
      <div className="benefit-section">
        <div className="benefit-grid">
          <div className="benefit-card">
            <p><strong>1. Take the real test at home, just like the official test.</strong><br /> <br />
              The test experience is exactly the same as the official IELTS test with an accurately reproduced interface, helping you get used to the real test environment.
            </p>
          </div>
          <div className="benefit-card">
            <p><strong>2. Original test papers from the official test bank</strong><br /><br />
              Get familiar with the original test format compiled by a team of IELTS experts, providing the most realistic test experience possible.
            </p>
          </div>
          <div className="benefit-card">
            <p><strong>3. Increase your chances of getting a good score and effectively improve your band score.</strong><br /><br />
              Get familiar with many types of questions, common topics and topics, helping you increase your chances of getting a good score and achieving a high score in the real exam.
            </p>
          </div>
          <div className="benefit-card">
            <p><strong>4. The computer-based IELTS test system is developed by the Real IELTS team.</strong><br /><br />
              We provide a platform to help you practice IELTS on your computer with original test questions, accurately reproducing the real test environment, helping you confidently achieve your desired score.
            </p>
          </div>
        </div>

        <div className="benefit-highlight">
          <h1><span>Benefit</span><br />Students receive<br />after taking<br />the test</h1>
          <button>Try it now →</button>
          <img src={benefitImage} alt="Student with folder" />
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
          </ul>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Gurjant IELTS. All rights reserved.</p>
        </div>
      </footer>


    </>
  );
}

export default Introduction;
