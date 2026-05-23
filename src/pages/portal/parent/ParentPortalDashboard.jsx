import { useState, useEffect } from 'react';
import PortalLayout from '../../../components/layout/PortalLayout';
import { useAuth } from '../../../context/AuthContext';

export default function ParentPortalDashboard() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [selectedChildData, setSelectedChildData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [childLoading, setChildLoading] = useState(false);

  // 1. Load list of children
  useEffect(() => {
    async function loadFamilyChildren() {
      if (!user) return;

      setLoading(true);
      try {
        const res = await fetch('/api/students/family/children');
        const resData = await res.json();
        
        if (resData.success && resData.data.length > 0) {
          setChildren(resData.data);
          setSelectedChildId(resData.data[0].id); // select first child by default
        }
      } catch (err) {
        console.error('Error loading family children:', err);
      } finally {
        setLoading(false);
      }
    }

    loadFamilyChildren();
  }, [user]);

  // 2. Load selected child profile folder data
  useEffect(() => {
    async function loadSelectedChildFolder() {
      if (!selectedChildId) return;

      setChildLoading(true);
      try {
        const res = await fetch(`/api/students/${selectedChildId}`);
        const resData = await res.json();
        
        if (resData.success) {
          setSelectedChildData(resData.data);
        }
      } catch (err) {
        console.error('Error loading child folder details:', err);
      } finally {
        setChildLoading(false);
      }
    }

    loadSelectedChildFolder();
  }, [selectedChildId]);

  return (
    <PortalLayout>
      <div className="parent-dash">
        {/* Welcome Section */}
        <section className="dash-hero" style={{ marginBottom: '2rem' }}>
          <div className="dash-hero__text">
            <span className="dash-hero__label">Parent Portal</span>
            <h1 className="dash-hero__title">
              Family Ward Directory
            </h1>
            <p className="dash-hero__subtitle">
              Inspect profile files, academic records, and classroom coordinates of your children enrolled in Grandview Academy.
            </p>
          </div>
        </section>

        {loading ? (
          <div className="dash-pane" style={{ textAlign: 'center', padding: '4rem' }}>
            <div className="pane-spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Syncing family records...</p>
          </div>
        ) : children.length === 0 ? (
          <div className="dash-pane pane-empty" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <span className="empty-icon">👪</span>
            <h3 className="empty-title" style={{ marginTop: '1rem' }}>No Children Linked</h3>
            <p className="empty-desc" style={{ maxWidth: '400px', margin: '0.5rem auto 0' }}>
              Your parent profile account does not have any linked student records. Contact the Admissions registrar to map your child's profile folder.
            </p>
          </div>
        ) : (
          <div className="parent-portal-workspace">
            {/* Child Switcher Tabs */}
            <div className="child-switcher-tabs" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  style={{
                    border: 'none',
                    padding: '0.625rem 1.25rem',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: selectedChildId === child.id ? 'var(--color-navy, #1b2a4a)' : '#e2e8f0',
                    color: selectedChildId === child.id ? '#ffffff' : '#475569',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🎒 {child.first_name} {child.last_name}
                </button>
              ))}
            </div>

            {childLoading ? (
              <div className="dash-pane" style={{ textAlign: 'center', padding: '3rem' }}>
                <div className="pane-spinner" style={{ margin: '0 auto 1rem' }}></div>
                <p style={{ color: '#64748b', fontSize: '0.8125rem' }}>Loading child's profile file...</p>
              </div>
            ) : selectedChildData ? (
              <div className="dash-main-grid" style={{ gridTemplateColumns: '1.7fr 1.3fr' }}>
                {/* Child Folder pane */}
                <div className="dash-pane">
                  <h3 className="dash-pane__title" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                    Demographic & Enrollment File
                  </h3>

                  <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <div className="large-avatar" style={{ margin: '0', width: '70px', height: '70px', fontSize: '1.75rem', flexShrink: 0 }}>
                      {selectedChildData.photo_url ? (
                        <img src={selectedChildData.photo_url} alt={selectedChildData.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      ) : (
                        selectedChildData.first_name.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div style={{ flexGrow: 1, minWidth: '240px' }}>
                      <h4 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.5rem' }}>
                        {selectedChildData.first_name} {selectedChildData.middle_name ? `${selectedChildData.middle_name} ` : ''}{selectedChildData.last_name}
                      </h4>
                      <span className={`status-badge status-badge--${selectedChildData.status}`} style={{ marginBottom: '1.25rem' }}>
                        {selectedChildData.status}
                      </span>

                      <ul className="info-list" style={{ gap: '0.75rem' }}>
                        <li><strong>Admission Number:</strong> {selectedChildData.admission_number}</li>
                        <li><strong>Academic Level:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedChildData.level}</span></li>
                        <li><strong>Allocated Class:</strong> {selectedChildData.classes ? selectedChildData.classes.name : 'Unassigned'}</li>
                        <li><strong>Enrolled Date:</strong> {selectedChildData.admission_date}</li>
                        <li><strong>Date of Birth:</strong> {selectedChildData.date_of_birth}</li>
                        <li><strong>Gender:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedChildData.gender}</span></li>
                        <li><strong>School Account:</strong> {selectedChildData.users?.email}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Primary Contacts / Classroom teacher details */}
                <div className="dash-side-column">
                  <div className="dash-pane dash-pane--gold-trim">
                    <h3 className="dash-pane__title" style={{ marginBottom: '1rem' }}>Classroom Coordinates</h3>
                    <p style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: '1.6', margin: '0 0 1rem' }}>
                      Your child is enrolled under class <strong>{selectedChildData.classes ? selectedChildData.classes.name : 'Unassigned'}</strong> for the active school period.
                    </p>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b', background: '#f8fafc', padding: '0.75rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                      🏫 Class Level: <span style={{ textTransform: 'capitalize' }}>{selectedChildData.level}</span>
                    </div>
                  </div>
                  
                  <div className="dash-pane" style={{ marginTop: '1.5rem' }}>
                    <h3 className="dash-pane__title" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>School Operations</h3>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                      For requests like academic calendar details, tuition fee logs, term card grades, or transport coordinates, check portal submenus or contact admin.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
