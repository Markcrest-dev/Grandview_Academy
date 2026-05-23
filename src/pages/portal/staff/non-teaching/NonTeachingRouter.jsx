import { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import PortalLayout from '../../../../components/layout/PortalLayout';
import BursarDashboard from './BursarDashboard';
import LibrarianDashboard from './LibrarianDashboard';
import NurseDashboard from './NurseDashboard';

export default function NonTeachingRouter() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(null);

  const profile = user?.profile || {};
  const department = (profile.department || '').toLowerCase();
  const designation = (profile.designation || '').toLowerCase();

  // Set the default dashboard based on department/designation
  useEffect(() => {
    if (department.includes('bursary') || department.includes('finance') || designation.includes('bursar')) {
      setActiveTab('bursar');
    } else if (department.includes('library') || designation.includes('librarian')) {
      setActiveTab('librarian');
    } else if (department.includes('medical') || department.includes('health') || designation.includes('nurse') || designation.includes('doctor')) {
      setActiveTab('nurse');
    } else {
      // Default fallback
      setActiveTab('bursar');
    }
  }, [department, designation]);

  if (!activeTab) {
    return (
      <PortalLayout>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="pane-spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Hydrating department credentials...</p>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="non-teaching-workspace">
        {/* Dynamic Department Tabs */}
        <div className="child-switcher-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', overflowX: 'auto' }}>
          {[
            { id: 'bursar', label: 'Bursar Desk 💰', desc: 'Fees & Invoices' },
            { id: 'librarian', label: 'Library Catalog 📚', desc: 'Books Inventory' },
            { id: 'nurse', label: 'Clinic Sickbay 🏥', desc: 'Medical Charts' }
          ].map(tab => {
            const isDeptDefault = 
              (tab.id === 'bursar' && (department.includes('bursary') || designation.includes('bursar'))) ||
              (tab.id === 'librarian' && (department.includes('library') || designation.includes('librarian'))) ||
              (tab.id === 'nurse' && (department.includes('medical') || designation.includes('nurse')));

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  border: 'none',
                  padding: '0.625rem 1.25rem',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: activeTab === tab.id ? 'var(--color-gold, #C9A84C)' : '#f1f5f9',
                  color: activeTab === tab.id ? '#ffffff' : '#475569',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  position: 'relative'
                }}
              >
                {tab.label}
                {isDeptDefault && (
                  <span style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-4px',
                    background: '#1b2a4a',
                    color: '#ffffff',
                    fontSize: '0.6rem',
                    padding: '2px 5px',
                    borderRadius: '10px',
                    border: '1.5px solid #ffffff',
                    fontWeight: 700
                  }}>
                    My Dept
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Render selected Dashboard */}
        {activeTab === 'bursar' && <BursarDashboard />}
        {activeTab === 'librarian' && <LibrarianDashboard />}
        {activeTab === 'nurse' && <NurseDashboard />}
      </div>
    </PortalLayout>
  );
}
