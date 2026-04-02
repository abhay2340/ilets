import React, { useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { Navigate } from 'react-router-dom';
import Admin from './Admin.jsx';
import Tests from './Tests.jsx';
import Package from './Bundle.jsx';
import ManageBlogs from './ManageBlogs.jsx';
import ManageGeneralTraining from './ManageGeneralTraining.jsx';

const AdminPanel = () => {
  const { loading, role } = useAuth();
  const isSuper = useMemo(() => role === 'ADMIN', [role]);
  const [section, setSection] = useState('add'); // add | tests | bundles | blogs | generalTraining

  if (!loading && !isSuper) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      <aside
        style={{
          width: 240,
          borderRight: '1px solid #eee',
          padding: 16,
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
          height: 'calc(100vh - 64px)',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Admin Panel</h3>
        <nav style={{ display: 'grid', gap: 8 }}>
          <button
            onClick={() => setSection('add')}
            style={{
              textAlign: 'left',
              padding: '10px 12px',
              borderRadius: 8,
              border: section === 'add' ? '1px solid #cfe3ff' : '1px solid #ddd',
              background: section === 'add' ? '#f0f7ff' : '#fff',
              cursor: 'pointer',
            }}
          >
            Add Tests
          </button>
          <button
            onClick={() => setSection('tests')}
            style={{
              textAlign: 'left',
              padding: '10px 12px',
              borderRadius: 8,
              border: section === 'tests' ? '1px solid #cfe3ff' : '1px solid #ddd',
              background: section === 'tests' ? '#f0f7ff' : '#fff',
              cursor: 'pointer',
            }}
          >
            All Tests
          </button>
          <button
            onClick={() => setSection('bundles')}
            style={{
              textAlign: 'left',
              padding: '10px 12px',
              borderRadius: 8,
              border: section === 'bundles' ? '1px solid #cfe3ff' : '1px solid #ddd',
              background: section === 'bundles' ? '#f0f7ff' : '#fff',
              cursor: 'pointer',
            }}
          >
            Package
          </button>
          <button
            onClick={() => setSection('blogs')}
            style={{
              textAlign: 'left',
              padding: '10px 12px',
              borderRadius: 8,
              border: section === 'blogs' ? '1px solid #cfe3ff' : '1px solid #ddd',
              background: section === 'blogs' ? '#f0f7ff' : '#fff',
              cursor: 'pointer',
            }}
          >
            Manage Blogs
          </button>
          <button
            onClick={() => setSection('generalTraining')}
            style={{
              textAlign: 'left',
              padding: '10px 12px',
              borderRadius: 8,
              border: section === 'generalTraining' ? '1px solid #cfe3ff' : '1px solid #ddd',
              background: section === 'generalTraining' ? '#f0f7ff' : '#fff',
              cursor: 'pointer',
            }}
          >
            Manage General Training
          </button>
        </nav>
      </aside>
      <main style={{ flex: 1, padding: 16 }}>
        {section === 'add' && <Admin />}
        {section === 'tests' && <Tests />}
        {section === 'bundles' && <Package />}
        {section === 'blogs' && <ManageBlogs />}
        {section === 'generalTraining' && <ManageGeneralTraining />}
      </main>
    </div>
  );
};

export default AdminPanel;
