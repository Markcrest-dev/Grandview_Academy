import { useState, useEffect } from 'react';
import PortalLayout from '../../../components/layout/PortalLayout';
import { useAuth } from '../../../context/AuthContext';

export default function StudentPortalDashboard() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStudentProfile() {
      if (!user || !user.profile) return;

      setLoading(true);
      try {
        const res = await fetch(`/api/students/${user.profile.id}`);
        const resData = await res.json();
        
        if (resData.success) {
          setProfileData(resData.data);
        }
      } catch (err) {
        console.error('Error loading student profile folder:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStudentProfile();
  }, [user]);

  return (
    <PortalLayout>
      <div className="student-dash">
        {/* Welcome Banner */}
        <section className="dash-hero" style={{ marginBottom: '2rem' }}>
          <div className="dash-hero__text">
            <span className="dash-hero__label">Student Portal</span>
            <h1 className="dash-hero__title">
              Welcome, {user?.profile?.firstName || 'Student'}!
            </h1>
            <p className="dash-hero__subtitle">
              Inspect your active academic profile folder, class allocations, and mapped contact cards.
            </p>
          </div>
        </section>

        {loading ? (
          <div className="dash-pane" style={{ textAlign: 'center', padding: '4rem' }}>
            <div className="pane-spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Syncing profile details...</p>
          </div>
        ) : !profileData ? (
          <div className="dash-pane pane-empty" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <span className="empty-icon">🎒</span>
            <h4 className="empty-title">Profile Folder Not Found</h4>
            <p className="empty-desc">Your student demographic folder could not be retrieved from the central database.</p>
          </div>
        ) : (
          <div className="dash-main-grid" style={{ gridTemplateColumns: '1.7fr 1.3fr' }}>
            {/* Folder Sheet */}
            <div className="dash-pane">
              <h3 className="dash-pane__title" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                Demographic & Academic File
              </h3>
              
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div className="large-avatar" style={{ margin: '0', width: '80px', height: '80px', fontSize: '2rem', flexShrink: 0 }}>
                  {profileData.photo_url ? (
                    <img src={profileData.photo_url} alt={profileData.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    profileData.first_name.charAt(0).toUpperCase()
                  )}
                </div>

                <div style={{ flexGrow: 1, minWidth: '240px' }}>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.5rem' }}>
                    {profileData.first_name} {profileData.middle_name ? `${profileData.middle_name} ` : ''}{profileData.last_name}
                  </h4>
                  <span className={`status-badge status-badge--${profileData.status}`} style={{ marginBottom: '1.5rem' }}>
                    {profileData.status}
                  </span>

                  <ul className="info-list" style={{ gap: '0.75rem' }}>
                    <li><strong>Admission No:</strong> {profileData.admission_number}</li>
                    <li><strong>Academic Level:</strong> <span style={{ textTransform: 'capitalize' }}>{profileData.level}</span></li>
                    <li><strong>Enrolled Class:</strong> {profileData.classes ? profileData.classes.name : 'Unassigned'}</li>
                    <li><strong>Resumption Date:</strong> {profileData.admission_date}</li>
                    <li><strong>Date of Birth:</strong> {profileData.date_of_birth}</li>
                    <li><strong>Gender:</strong> <span style={{ textTransform: 'capitalize' }}>{profileData.gender}</span></li>
                    <li><strong>Portal Email:</strong> {profileData.users?.email}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Parent contact & school status panel */}
            <div className="dash-side-column">
              <div className="dash-pane">
                <h3 className="dash-pane__title" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                  Mapped Parents & Guardians
                </h3>
                
                {profileData.parents && profileData.parents.length > 0 ? (
                  profileData.parents.map((parent, i) => (
                    <div key={i} className="linked-parent-card" style={{ marginTop: i > 0 ? '0.75rem' : '0' }}>
                      <h4 className="parent-card-name" style={{ fontSize: '0.875rem' }}>
                        {parent.first_name} {parent.last_name} ({parent.relationship})
                      </h4>
                      <p className="parent-card-meta">📞 {parent.phone}</p>
                      <p className="parent-card-meta">📧 {parent.email}</p>
                      <p className="parent-card-meta">🏠 {parent.address}</p>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>No parent coordinates have been linked to this folder.</p>
                )}
              </div>

              <div className="dash-pane dash-pane--gold-trim" style={{ marginTop: '1.5rem' }}>
                <h3 className="dash-pane__title">Need Assistance?</h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: '1.6', margin: '0 0 1rem' }}>
                  For discrepancies in demographic records, class schedules, or subjects, reach out to your form teacher.
                </p>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b', background: '#f8fafc', padding: '0.75rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                  🏫 Classroom Teacher: <strong>{profileData.classes ? 'Assigned' : 'Unassigned'}</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
