import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import TestInstructions from './TestInstructions';
import Introduction from './Introduction';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TestLandingPage from './TestLandingPage';
import InfoSecurity from './InfoSecurity';
import PrivacyPolicy from './PrivacyPolicy';
import Account from './Account/Account';
import TestPage from './pages/TestPage.jsx';
import ResultPage from './pages/ResultPage.jsx';
import PaymentPage from './pages/PaymentPage.jsx';
import ContactSection from './ContactSection';
import Navbar from './Navbar.jsx';
import Admin from './Admin.jsx';
import Tests from './Tests.jsx';

import AdminPanel from './AdminPanel.jsx';
import BundleDetail from './BundleDetail.jsx';
import Blogs from './Blogs.jsx';
import BlogDetail from './BlogDetail.jsx';
import GeneralTraining from './GeneralTraining.jsx';
import GeneralTrainingDetail from './GeneralTrainingDetail.jsx';
import IeltsPrediction from './IeltsPrediction.jsx';
import FullMockTestPage from './FullMockTestPage.jsx';
import FreeBundlesPage from './FreeBundlesPage.jsx';
function App() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const checkFs = () => {
      const isFs = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isFs);
    };
    document.addEventListener('fullscreenchange', checkFs);
    document.addEventListener('webkitfullscreenchange', checkFs);
    document.addEventListener('mozfullscreenchange', checkFs);
    document.addEventListener('MSFullscreenChange', checkFs);
    return () => {
      document.removeEventListener('fullscreenchange', checkFs);
      document.removeEventListener('webkitfullscreenchange', checkFs);
      document.removeEventListener('mozfullscreenchange', checkFs);
      document.removeEventListener('MSFullscreenChange', checkFs);
    };
  }, []);

  return (
    <Router>
      {!isFullscreen && <Navbar />}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/introduction" element={<Introduction />} />
        <Route path="/test-start" element={<TestLandingPage />} />

        <Route path="/security" element={<InfoSecurity />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/instructions" element={<TestInstructions />} />
        <Route path="/contact" element={<ContactSection />} />
        <Route path="/account" element={<Account />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/results" element={<ResultPage />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/:testId" element={<Admin />} />
        <Route path="/tests" element={<Tests />} />
        <Route path="/bundle" element={<FullMockTestPage />} />
        <Route path="/bundle/:bundleId" element={<BundleDetail />} />
        <Route path="/admin-panel" element={<AdminPanel />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/blogs/:id" element={<BlogDetail />} />
        <Route path="/general-training" element={<GeneralTraining />} />
        <Route path="/general-training/:id" element={<GeneralTrainingDetail />} />
        <Route path="/ielts-prediction" element={<IeltsPrediction />} />
        <Route path="/free-test" element={<FreeBundlesPage />} />
      </Routes>

      <ToastContainer position="top-center" />
    </Router>
  );
}

export default App;
