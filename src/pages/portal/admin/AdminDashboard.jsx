import { useState, useEffect } from 'react';
import { apiUrl } from '../../../utils/api';
import { useNavigate, Link } from 'react-router-dom';
import PortalLayout from '../../../components/layout/PortalLayout';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    activeStudents: 1, // Start with seeded student count
    pendingAdmissions: 0,
    totalClasses: 1,
    activeTerm: '2026/2027 Session — First Term'
  });

  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Fetch students to count
        const studResponse = await fetch(apiUrl('/api/students?limit=1'));
        const studData = await studResponse.json();
        const activeStudentsCount = studData.success && studData.pagination ? studData.pagination.total : 1;

        // Fetch pending admissions
        const appResponse = await fetch(apiUrl('/api/admissions/applications?status=pending&limit=5'));
        const appData = await appResponse.json();
        
        let pendingCount = 0;
        let recentList = [];

        if (appData.success) {
          pendingCount = appData.pagination ? appData.pagination.total : appData.data.length;
          recentList = appData.data;
        }

        // Fetch classes
        const classResponse = await fetch(apiUrl('/api/classes?limit=1'));
        const classData = await classResponse.json();
        const classesCount = classData.success && classData.pagination ? classData.pagination.total : 1;

        setMetrics({
          activeStudents: activeStudentsCount,
          pendingAdmissions: pendingCount,
          totalClasses: classesCount,
          activeTerm: '2026/2027 Session — First Term'
        });

        setRecentApplications(recentList);
      } catch (err) {
        console.error('Error loading admin dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <PortalLayout>
      <div className="admin-dash">
        {/* Welcome Section */}
        <section className="dash-hero">
          <div className="dash-hero__text">
            <span className="dash-hero__label">Grandview System Admin</span>
            <h1 className="dash-hero__title">Institution Overview</h1>
            <p className="dash-hero__subtitle">
              Welcome back. Manage student enrollment applications, review cohort registrations, and monitor school system details.
            </p>
          </div>
          <div className="dash-hero__actions">
            <button className="btn btn--gold" onClick={() => navigate('/portal/admin/admissions')}>
              Review Admissions 📝
            </button>
            <button className="btn btn--outline btn--white" onClick={() => navigate('/portal/admin/students')}>
              Student Directory 🎒
            </button>
          </div>
        </section>

        {/* Metrics Grid */}
        <section className="metrics-grid">
          <div className="metric-card">
            <span className="metric-icon">🎒</span>
            <div className="metric-body">
              <span className="metric-value">{metrics.activeStudents}</span>
              <span className="metric-label">Registered Students</span>
            </div>
          </div>

          <div className="metric-card metric-card--highlight">
            <span className="metric-icon">📝</span>
            <div className="metric-body">
              <span className="metric-value">{metrics.pendingAdmissions}</span>
              <span className="metric-label">Pending Admissions</span>
            </div>
          </div>

          <div className="metric-card">
            <span className="metric-icon">🏫</span>
            <div className="metric-body">
              <span className="metric-value">{metrics.totalClasses}</span>
              <span className="metric-label">Active Classroom Units</span>
            </div>
          </div>

          <div className="metric-card">
            <span className="metric-icon">📅</span>
            <div className="metric-body">
              <span className="metric-value" style={{ fontSize: '1.0625rem', fontWeight: 700, marginTop: '4px' }}>
                First Term
              </span>
              <span className="metric-label">Active Term Schedule</span>
            </div>
          </div>
        </section>

        {/* Main Grid: Pipeline Log & Action Center */}
        <div className="dash-main-grid">
          {/* Recent Applications Pane */}
          <div className="dash-pane">
            <div className="dash-pane__header">
              <h3 className="dash-pane__title">Admissions Activity Queue</h3>
              <Link to="/portal/admin/admissions" className="pane-link">View All Applications →</Link>
            </div>
            
            {loading ? (
              <div className="pane-loading">
                <div className="pane-spinner"></div>
                <p>Loading application queue...</p>
              </div>
            ) : recentApplications.length === 0 ? (
              <div className="pane-empty">
                <span className="empty-icon">✓</span>
                <h4 className="empty-title">All Applications Processed</h4>
                <p className="empty-desc">There are currently no pending student enrollment applications to review.</p>
              </div>
            ) : (
              <div className="recent-apps-list">
                {recentApplications.map((app) => (
                  <div key={app.id} className="recent-app-item" onClick={() => navigate('/portal/admin/admissions')}>
                    <div className="app-avatar">
                      {app.first_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="app-info">
                      <h4 className="app-name">{app.first_name} {app.last_name}</h4>
                      <span className="app-meta">Applying for: <strong style={{ textTransform: 'capitalize' }}>{app.level}</strong> ({app.grade_applied_for || 'General'})</span>
                    </div>
                    <div className="app-status">
                      <span className="badge badge--pending">Pending</span>
                      <span className="app-time">{new Date(app.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Institutional Quick links & Information panel */}
          <div className="dash-side-column">
            <div className="dash-pane">
              <h3 className="dash-pane__title">Admissions Operations</h3>
              <div className="quick-actions-list">
                <div className="action-card" onClick={() => navigate('/portal/admin/admissions')}>
                  <span className="action-icon">📝</span>
                  <div className="action-text">
                    <h4 className="action-title">Admissions Board</h4>
                    <p className="action-desc">Verify submitted enrollment applications, review student qualifications, and manage parent profiles.</p>
                  </div>
                </div>

                <div className="action-card" onClick={() => navigate('/portal/admin/students')}>
                  <span className="action-icon">🎒</span>
                  <div className="action-text">
                    <h4 className="action-title">Student Records Directory</h4>
                    <p className="action-desc">Lookup active student profiles, update class coordinates, and modify demographic settings.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="dash-pane dash-pane--gold-trim" style={{ marginTop: '1.5rem' }}>
              <h3 className="dash-pane__title">Support Coordination</h3>
              <p className="coord-text" style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: '1.7', margin: '0 0 1rem' }}>
                For Registrar configurations, academic year rollovers, term calendars, or Cloudinary cloud sync parameters, contact support.
              </p>
              <div className="coord-contact" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '1.25rem' }}>📧</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b' }}>registrar@grandview.edu</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
