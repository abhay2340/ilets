import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const InfoSecurity = () => {
  const [agree, setAgree] = useState(false);
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const testId = params.get('testId') || 'test1'; // default to test1 if not provided

  const handleContinue = () => {
    if (agree) {
      // Pass testId to instructions
      navigate(`/instructions?testId=${testId}`);
    } else {
      alert('Please agree to the Privacy Policy.');
    }
  };

  return (
    <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: '800px', backgroundColor: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
        <h2 style={{ textAlign: 'center' }}>Information Security</h2> 
<h3>We are committed to absolute protection of users' personal information and test data during the online test.
<br />
🔒 Information collected and protected includes:
<br />
Full name, email, phone number and account registration information. <br />
Candidates' test results and data. <br />
Access history, test times, and interactive behavior within the exam system. <br />
✅ Commitment to use:
<br />
Use data only for the purpose of analyzing results, supporting learning and improving the system. <br />
Do not share, sell, or disclose information to third parties in any form, unless required by competent authorities as prescribed by law. <br />
🛡️ Security measures:
<br />
Data is encrypted and stored on a highly secure system that meets international standards. <br />
User accounts are protected by strong authentication. It is the user's responsibility to keep their login information confidential and not share their account with others.
❗ Violations and consequences: <br />

Any acts of intrusion, theft, or dissemination of data will be strictly handled according to current laws. <br />
We reserve the right to lock accounts and terminate user access if we detect signs of violation.</h3>
        {/* ...rest of your content... */}

        <div style={{ marginTop: '20px' }}>
          <label>
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            /> 
            &nbsp; I agree to the
            <a href="/privacy"><span style={{ color: '#b30000', textDecoration:'none' }}>Privacy Policy</span></a>
          </label>
        </div>

        <div style={{ marginTop: '20px' }}>
          <button
            onClick={handleContinue}
            disabled={!agree}
            style={{
              backgroundColor: agree ? '#b30000' : '#ccc',
              color: agree ? 'white' : '#666',
              padding: '10px 25px',
              borderRadius: '5px',
              border: 'none',
              fontWeight: 'bold',
              cursor: agree ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease'
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfoSecurity;
