import { useState, useEffect } from 'react';
import { apiUrl } from '../../../utils/api';
import { useNavigate, Link } from 'react-router-dom';
import PortalLayout from '../../../components/layout/PortalLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
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
  const [flaggedStudents, setFlaggedStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock Data for KPI Charts
  const enrollmentData = [
    { name: 'Jan', students: 120 },
    { name: 'Feb', students: 150 },
    { name: 'Mar', students: 180 },
    { name: 'Apr', students: 220 },
    { name: 'May', students: 270 },
    { name: 'Jun', students: 310 },
  ];

  const attendanceTrends = [
    { name: 'Wk 1', rate: 98 },
    { name: 'Wk 2', rate: 95 },
    { name: 'Wk 3', rate: 92 },
    { name: 'Wk 4', rate: 96 },
  ];

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

        // Fetch flagged attendance students
        const flaggedRes = await fetch(apiUrl('/api/attendance/flagged?threshold=75'));
        const flaggedData = await flaggedRes.json();
        if (flaggedData.success) {
          setFlaggedStudents(flaggedData.data);
        }

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

        {/* KPI Charts Section */}
        <section className="dash-main-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: '1fr 1fr' }}>
          <div className="dash-pane">
            <h3 className="dash-pane__title">Enrollment Growth</h3>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrollmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="students" fill="#1b2a4a" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="dash-pane">
            <h3 className="dash-pane__title">Average Attendance Rate (%)</h3>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis domain={[80, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="rate" stroke="#C9A84C" strokeWidth={3} dot={{ r: 4, fill: '#1b2a4a', strokeWidth: 2, stroke: '#ffffff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
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

          {/* Attendance Alert Pane */}
          <div className="dash-pane">
            <div className="dash-pane__header">
              <h3 className="dash-pane__title" style={{ color: '#dc2626' }}>🚨 Attendance Alerts</h3>
              <span className="badge badge--pending">{flaggedStudents.length} Flagged</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>Students below 75% attendance threshold.</p>
            
            {loading ? (
              <div className="pane-loading">
                <div className="pane-spinner"></div>
              </div>
            ) : flaggedStudents.length === 0 ? (
              <div className="pane-empty">
                <span className="empty-icon" style={{ backgroundColor: '#f0fdf4', color: '#15803d' }}>✓</span>
                <h4 className="empty-title">All Good</h4>
                <p className="empty-desc">No students are currently below the attendance warning threshold.</p>
              </div>
            ) : (
              <div className="recent-apps-list">
                {flaggedStudents.slice(0, 5).map((student) => (
                  <div key={student.id} className="recent-app-item" style={{ borderLeft: '3px solid #ef4444' }}>
                    <div className="app-info" style={{ marginLeft: '0.5rem' }}>
                      <h4 className="app-name">{student.first_name} {student.last_name}</h4>
                      <span className="app-meta">Class: <strong>{student.classes?.name || 'Unassigned'}</strong></span>
                    </div>
                    <div className="app-status">
                      <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#dc2626' }}>{student.attendance_rate}%</span>
                      <span className="app-time">Rate</span>
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

                <div className="action-card" onClick={() => navigate('/portal/admin/manage')}>
                  <span className="action-icon">🔗</span>
                  <div className="action-text">
                    <h4 className="action-title">Relationship Manager</h4>
                    <p className="action-desc">Link parents to students, assign class teachers, and build lecture timetable schedules.</p>
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
