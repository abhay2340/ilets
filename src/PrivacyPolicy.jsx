import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Privacy Policy</h1>

      <p>
        We value your privacy and are committed to protecting your personal data. This privacy policy explains how we handle your information when you use our online test platform.
      </p>

      <h2>1. Information We Collect</h2>
      <ul>
        <li>Full name, email address, and contact number</li>
        <li>Test responses and scores</li>
        <li>Interaction behavior (e.g., time spent, clicks)</li>
        <li>Browser and device information</li>
      </ul>

      <h2>2. How We Use Your Data</h2>
      <ul>
        <li>To deliver and improve the online testing experience</li>
        <li>To provide performance analytics and insights</li>
        <li>To improve our educational services and platform</li>
      </ul>

      <h2>3. Data Security</h2>
      <p>
        Your data is encrypted and stored on secure servers. We implement access control, monitoring, and periodic audits to maintain confidentiality and integrity.
      </p>

      <h2>4. Sharing & Disclosure</h2>
      <p>
        We do not sell or share your data with any third party. Disclosure is only made to government agencies if legally required.
      </p>

      <h2>5. User Rights</h2>
      <ul>
        <li>You may request deletion or correction of your data</li>
        <li>You may withdraw consent at any time</li>
      </ul>

      <h2>6. Contact</h2>
      <p>
        For any questions or concerns regarding this policy, please contact us at: <strong>support@ieltsplatform.com</strong>
      </p>
    </div>
  );
};

export default PrivacyPolicy;
