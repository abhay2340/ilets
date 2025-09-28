import React from 'react';
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
function App() {
  return (
    <Router>
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

      </Routes>

      <ToastContainer position="top-center" />
    </Router>
  );
}

export default App;
