import { useState, useEffect } from 'react';
import PortalLayout from '../../../components/layout/PortalLayout';
import { useAuth } from '../../../context/AuthContext';

export default function ParentPortalDashboard() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [selectedChildData, setSelectedChildData] = useState(null);
  
  // Tab states
  const [subTab, setSubTab] = useState('profile'); // profile, timetable, attendance, report
  const [loading, setLoading] = useState(true);
  const [childLoading, setChildLoading] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Mapped performance metrics for the child
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [attendanceData, setAttendanceData] = useState({ records: [], stats: { rate: 100, total: 0 } });
  const [gradesReport, setGradesReport] = useState([]);

  const token = localStorage.getItem('token');
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // 1. Load family children
  useEffect(() => {
    async function loadFamilyChildren() {
      if (!user) return;

      setLoading(true);
      try {
        const res = await fetch('/api/students/family/children', { headers: authHeaders });
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
      // Reset tab when switching children to avoid mismatches
      setSubTab('profile');
      try {
        const res = await fetch(`/api/students/${selectedChildId}`, { headers: authHeaders });
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

  // 3. Load active tab academic metrics for the child
  useEffect(() => {
    async function fetchChildMetrics() {
      if (!selectedChildId || !selectedChildData) return;

      setLoadingMetrics(true);
      try {
        if (subTab === 'timetable' && selectedChildData.classes?.id) {
          const res = await fetch(`/api/timetable/class/${selectedChildData.classes.id}`, { headers: authHeaders });
          const resData = await res.json();
          if (resData.success) {
            setTimetableSlots(resData.data);
          }
        } else if (subTab === 'attendance') {
          const res = await fetch(`/api/attendance/student/${selectedChildId}`, { headers: authHeaders });
          const resData = await res.json();
          if (resData.success) {
            setAttendanceData(resData.data);
          }
        } else if (subTab === 'report') {
          const res = await fetch(`/api/grades/student/${selectedChildId}`, { headers: authHeaders });
          const resData = await res.json();
          if (resData.success) {
            setGradesReport(resData.data);
          }
        }
      } catch (err) {
        console.error('Error loading child performance metrics:', err);
      } finally {
        setLoadingMetrics(false);
      }
    }

    fetchChildMetrics();
  }, [subTab, selectedChildId, selectedChildData]);

  // Compile grades grouping
  const getCompiledReport = () => {
    const grouped = {};
    gradesReport.forEach(g => {
      const subId = g.subject_id;
      if (!grouped[subId]) {
        grouped[subId] = {
          subjectName: g.subjects?.name || 'Unknown',
          subjectCode: g.subjects?.code || '—',
          ca1: '—',
          ca2: '—',
          exam: '—',
          total: 0
        };
      }
      const scoreNum = parseFloat(g.score);
      if (g.assessment_type === 'ca1') {
        grouped[subId].ca1 = scoreNum;
        grouped[subId].total += scoreNum;
      } else if (g.assessment_type === 'ca2') {
        grouped[subId].ca2 = scoreNum;
        grouped[subId].total += scoreNum;
      } else if (g.assessment_type === 'exam') {
        grouped[subId].exam = scoreNum;
        grouped[subId].total += scoreNum;
      }
    });
    return Object.values(grouped);
  };

  const compiledGrades = getCompiledReport();

  return (
    <PortalLayout>
      <div className="parent-dash">
        {/* Welcome Section */}
        <section className="dash-hero" style={{ marginBottom: '1.5rem' }}>
          <div className="dash-hero__text">
            <span className="dash-hero__label">Parent Portal</span>
            <h1 className="dash-hero__title">Family Ward Directory</h1>
            <p className="dash-hero__subtitle">
              Inspect academic performance folders, attendance grids, and lecture schedules for your children.
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
              Your parent profile account does not have any linked student records. Contact the registrar to map your child's student folder.
            </p>
          </div>
        ) : (
          <div className="parent-portal-workspace">
            {/* Child Switcher Tabs */}
            <div className="child-switcher-tabs" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', overflowX: 'auto' }}>
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
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  🎒 {child.first_name} {child.last_name}
                </button>
              ))}
            </div>

            {childLoading ? (
              <div className="dash-pane" style={{ textAlign: 'center', padding: '3rem' }}>
                <div className="pane-spinner" style={{ margin: '0 auto 1rem' }}></div>
                <p style={{ color: '#64748b', fontSize: '0.8125rem' }}>Syncing child's profile file...</p>
              </div>
            ) : selectedChildData ? (
              <div className="child-folder-workspace">
                {/* Child Academic Tab Navigation */}
                <div className="child-switcher-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', overflowX: 'auto' }}>
                  {[
                    { id: 'profile', label: 'Ward Profile details', icon: '👤' },
                    { id: 'timetable', label: 'School Timetable', icon: '🏫' },
                    { id: 'attendance', label: 'Attendance stats', icon: '📅' },
                    { id: 'report', label: 'Report Card Transcript', icon: '📝' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSubTab(tab.id)}
                      style={{
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        backgroundColor: subTab === tab.id ? '#C9A84C' : '#f1f5f9',
                        color: subTab === tab.id ? '#1b2a4a' : '#475569',
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>

                {loadingMetrics && (
                  <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <div className="pane-spinner" style={{ margin: '0 auto 0.5rem' }}></div>
                    <p style={{ color: '#64748b', fontSize: '0.75rem' }}>Loading ward metrics...</p>
                  </div>
                )}

                {!loadingMetrics && subTab === 'profile' && (
                  <div className="dash-main-grid" style={{ gridTemplateColumns: '1.7fr 1.3fr', display: 'grid', gap: '1.5rem' }}>
                    {/* Child Folder pane */}
                    <div className="dash-pane" style={{ height: 'fit-content' }}>
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
                    <div className="dash-side-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div className="dash-pane dash-pane--gold-trim">
                        <h3 className="dash-pane__title" style={{ marginBottom: '1rem' }}>Classroom Coordinates</h3>
                        <p style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: '1.6', margin: '0 0 1rem' }}>
                          Your child is enrolled under class <strong>{selectedChildData.classes ? selectedChildData.classes.name : 'Unassigned'}</strong> for the active school period.
                        </p>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b', background: '#f8fafc', padding: '0.75rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                          🏫 Class Level: <span style={{ textTransform: 'capitalize' }}>{selectedChildData.level}</span>
                        </div>
                      </div>
                      
                      <div className="dash-pane">
                        <h3 className="dash-pane__title" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>School Operations</h3>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                          For requests like academic calendar details, tuition fee logs, or transport coordinates, reach out directly to settings or contact registrar.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!loadingMetrics && subTab === 'timetable' && (
                  <div className="dash-pane">
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 className="dash-pane__title" style={{ margin: 0 }}>{selectedChildData.first_name}'s Weekly Timetable</h3>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0' }}>Review active lecture coordinates assigned to your child's classroom unit.</p>
                    </div>

                    {timetableSlots.length === 0 ? (
                      <div className="pane-empty" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                        <span className="empty-icon">📅</span>
                        <h4 className="empty-title">Schedule Grid Empty</h4>
                        <p className="empty-desc">No active lecture schedule slots are configured for this class unit.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(day => {
                          const daySlots = timetableSlots.filter(s => s.day_of_week.toLowerCase() === day);
                          return (
                            <div key={day} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                              <h4 style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: '#1b2a4a', fontWeight: 'bold', borderBottom: '2px solid #C9A84C', paddingBottom: '0.375rem', marginBottom: '0.75rem' }}>
                                {day}
                              </h4>
                              {daySlots.length === 0 ? (
                                <p style={{ fontSize: '0.6875rem', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No lecture slots scheduled</p>
                              ) : (
                                daySlots.map(slot => (
                                  <div key={slot.id} style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '4px', borderLeft: '3px solid #1b2a4a', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '0.5rem' }}>
                                    <h5 style={{ fontSize: '0.8125rem', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>{slot.subjects?.name || 'Lecture'}</h5>
                                    <span style={{ fontSize: '0.6875rem', color: '#64748b', display: 'block', marginTop: '0.125rem' }}>💻 Code: {slot.subjects?.code || '—'}</span>
                                    <span style={{ fontSize: '0.6875rem', color: '#1b2a4a', fontWeight: '600', display: 'block', marginTop: '0.25rem' }}>👨‍🏫 Staff: {slot.staff ? `${slot.staff.first_name} ${slot.staff.last_name}` : '—'}</span>
                                    <span style={{ fontSize: '0.6875rem', color: '#b45309', display: 'block', marginTop: '0.25rem', fontWeight: '500' }}>⏰ {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {!loadingMetrics && subTab === 'attendance' && (
                  <div className="dash-main-grid" style={{ gridTemplateColumns: '1.2fr 1.8fr', display: 'grid', gap: '1.5rem' }}>
                    {/* Stats Summary Pane */}
                    <div className="dash-pane" style={{ height: 'fit-content' }}>
                      <h3 className="dash-pane__title" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                        Attendance Analytics
                      </h3>
                      
                      <div style={{ textAlign: 'center', padding: '1.5rem 0', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '3rem', fontWeight: '800', color: attendanceData.stats.rate >= 90 ? '#16a34a' : '#d97706' }}>
                          {attendanceData.stats.rate}%
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0.25rem 0 0', fontWeight: '600' }}>Average Attendance Rate</p>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.25rem', textAlign: 'center' }}>
                        <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>{attendanceData.stats.present + attendanceData.stats.late + attendanceData.stats.excused}</span>
                          <p style={{ fontSize: '0.6875rem', color: '#64748b', margin: '0.125rem 0 0' }}>Days Active</p>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#dc2626' }}>{attendanceData.stats.absent}</span>
                          <p style={{ fontSize: '0.6875rem', color: '#dc2626', margin: '0.125rem 0 0' }}>Absent Days</p>
                        </div>
                      </div>
                    </div>

                    {/* Log History list */}
                    <div className="dash-pane">
                      <h3 className="dash-pane__title" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                        Daily Attendance Logs
                      </h3>
                      
                      {attendanceData.records.length === 0 ? (
                        <p style={{ color: '#64748b', fontSize: '0.8125rem' }}>No daily attendance logs recorded yet.</p>
                      ) : (
                        <div className="students-table-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Date Log</th>
                                <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Roster Class</th>
                                <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {attendanceData.records.map(rec => (
                                <tr key={rec.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', fontWeight: '600' }}>{new Date(rec.date).toLocaleDateString()}</td>
                                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: '#475569' }}>{rec.classes?.name || 'Class Unit'}</td>
                                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem' }}>
                                    <span className={`status-badge status-badge--${rec.status}`} style={{ fontSize: '0.6875rem', padding: '0.125rem 0.5rem' }}>
                                      {rec.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!loadingMetrics && subTab === 'report' && (
                  <div className="dash-pane">
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 className="dash-pane__title" style={{ margin: 0 }}>Academic Transcript</h3>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0' }}>Review continuous assessments and final term examination grades published for your child.</p>
                    </div>

                    {compiledGrades.length === 0 ? (
                      <div className="pane-empty" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                        <span className="empty-icon">📝</span>
                        <h4 className="empty-title">Transcript Empty</h4>
                        <p className="empty-desc">No academic grades have been published for your child in the active term period.</p>
                      </div>
                    ) : (
                      <div className="students-table-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                              <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Subject Name</th>
                              <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569', textAlign: 'center' }}>CA1 (Max 30)</th>
                              <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569', textAlign: 'center' }}>CA2 (Max 30)</th>
                              <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569', textAlign: 'center' }}>Exam (Max 40)</th>
                              <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569', textAlign: 'center' }}>Total Score</th>
                            </tr>
                          </thead>
                          <tbody>
                            {compiledGrades.map((grade, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                  <strong style={{ color: '#0f172a' }}>{grade.subjectName}</strong>
                                  <span style={{ fontSize: '0.6875rem', color: '#64748b', display: 'block', marginTop: '0.125rem' }}>Code: {grade.subjectCode}</span>
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#1e293b', fontWeight: '600', textAlign: 'center' }}>{grade.ca1}</td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#1e293b', fontWeight: '600', textAlign: 'center' }}>{grade.ca2}</td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#1e293b', fontWeight: '600', textAlign: 'center' }}>{grade.exam}</td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                  <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '4px',
                                    fontSize: '0.875rem',
                                    fontWeight: 'bold',
                                    backgroundColor: grade.total >= 70 ? '#f0fdf4' : grade.total >= 50 ? '#fffbeb' : '#fdf2f2',
                                    color: grade.total >= 70 ? '#16a34a' : grade.total >= 50 ? '#d97706' : '#dc2626'
                                  }}>
                                    {grade.total} / 100
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}

