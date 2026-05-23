import { useState, useEffect } from 'react';
import { apiUrl } from '../../../utils/api';
import PortalLayout from '../../../components/layout/PortalLayout';
import { useAuth } from '../../../context/AuthContext';

export default function StudentPortalDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // profile, timetable, attendance, report, materials, fees
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  // Live Performance State
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [attendanceData, setAttendanceData] = useState({ records: [], stats: { rate: 100, total: 0 } });
  const [gradesReport, setGradesReport] = useState([]);

  // Expanded State (Phase 7)
  const [materials, setMaterials] = useState([]);
  const [searchMaterials, setSearchMaterials] = useState('');
  const [payments, setPayments] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);

  const token = localStorage.getItem('token');
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // 1. Initial Load of Student Profile Folder
  useEffect(() => {
    async function loadStudentProfile() {
      if (!user || !user.profile) return;

      setLoading(true);
      try {
        const res = await fetch(apiUrl(`/api/students/${user.profile.id}`), { headers: authHeaders });
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

  // 2. Fetch specific tab performance metrics
  useEffect(() => {
    async function fetchTabData() {
      if (!profileData) return;
      
      setLoadingData(true);
      try {
        if (activeTab === 'timetable' && profileData.classes?.id) {
          const res = await fetch(apiUrl(`/api/timetable/class/${profileData.classes.id}`), { headers: authHeaders });
          const resData = await res.json();
          if (resData.success) {
            setTimetableSlots(resData.data);
          }
        } else if (activeTab === 'attendance') {
          const res = await fetch(apiUrl(`/api/attendance/student/${profileData.id}`), { headers: authHeaders });
          const resData = await res.json();
          if (resData.success) {
            setAttendanceData(resData.data);
          }
        } else if (activeTab === 'report') {
          const res = await fetch(apiUrl(`/api/grades/student/${profileData.id}`), { headers: authHeaders });
          const resData = await res.json();
          if (resData.success) {
            setGradesReport(resData.data);
          }
        } else if (activeTab === 'materials' && profileData.classes?.id) {
          // Fetch academic documents linked to their class ID
          const res = await fetch(apiUrl(`/api/documents?related_to=class&related_id=${profileData.classes.id}`), { headers: authHeaders });
          const resData = await res.json();
          if (resData.success) {
            setMaterials(resData.data);
          }
        } else if (activeTab === 'fees') {
          // Fetch fee payments history registered on their profile
          const payRes = await fetch(apiUrl(`/api/fees/payments/student/${profileData.id}`), { headers: authHeaders });
          const payData = await payRes.json();
          if (payData.success) {
            setPayments(payData.data);
          }

          // Fetch billing fee structures registered on their level bracket
          const structRes = await fetch(apiUrl(`/api/fees/structures?level=${profileData.level}`), { headers: authHeaders });
          const structData = await structRes.json();
          if (structData.success) {
            setFeeStructures(structData.data);
          }
        }
      } catch (err) {
        console.error('Error fetching student details:', err);
      } finally {
        setLoadingData(false);
      }
    }

    fetchTabData();
  }, [activeTab, profileData]);

  // Utility to group grades by subject and calculate total score
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

  // Financial ledger metrics
  const totalBilled = feeStructures.reduce((acc, s) => acc + parseFloat(s.amount), 0);
  const totalPaid = payments.reduce((acc, p) => acc + parseFloat(p.amount_paid), 0);
  const totalDue = Math.max(0, totalBilled - totalPaid);

  // Search materials filter
  const filteredMaterials = materials.filter(m =>
    m.title.toLowerCase().includes(searchMaterials.toLowerCase())
  );

  const triggerPrint = () => {
    window.print();
  };

  return (
    <PortalLayout>
      {/* Printable watermarks for browsers print formatting */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .portal-layout__sidebar, 
          .portal-layout__header, 
          .child-switcher-tabs, 
          .dash-hero, 
          .no-print, 
          header, 
          nav {
            display: none !important;
          }
          .portal-layout__content, .student-dash {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .print-header {
            display: flex !important;
            flex-direction: column;
            align-items: center;
            border-bottom: 2px solid #000000;
            padding-bottom: 1rem;
            margin-bottom: 1.5rem;
          }
          .dash-pane {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .print-signatures {
            display: flex !important;
            justify-content: space-between;
            margin-top: 3rem;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #94a3b8 !important;
            padding: 10px !important;
          }
        }
      `}} />

      <div className="student-dash">
        
        {/* Print Only Official School Watermark Header */}
        <div className="print-header" style={{ display: 'none', textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', margin: '0 0 0.25rem', color: '#1b2a4a' }}>GRANDVIEW ACADEMY</h1>
          <p style={{ fontSize: '0.8rem', letterSpacing: '2px', color: '#64748b', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>official student record transcript</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', width: '100%', border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '4px', textAlign: 'left', fontSize: '0.85rem', marginTop: '1rem' }}>
            <div>
              <p style={{ margin: '0 0 0.35rem' }}><strong>Student Name:</strong> {profileData?.first_name} {profileData?.last_name}</p>
              <p style={{ margin: '0 0 0.35rem' }}><strong>Admission Code:</strong> {profileData?.admission_number}</p>
              <p style={{ margin: '0' }}><strong>Enrollment Cohort:</strong> {profileData?.classes?.name}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 0.35rem' }}><strong>Date of Printing:</strong> {new Date().toLocaleDateString()}</p>
              <p style={{ margin: '0 0 0.35rem' }}><strong>Report Bracket:</strong> {profileData?.level?.toUpperCase()}</p>
              <p style={{ margin: '0' }}><strong>Status:</strong> ACTIVE ENROLLMENT</p>
            </div>
          </div>
        </div>

        {/* Welcome Banner */}
        <section className="dash-hero no-print" style={{ marginBottom: '1.5rem' }}>
          <div className="dash-hero__text">
            <span className="dash-hero__label">Student Portal</span>
            <h1 className="dash-hero__title">
              Welcome, {user?.profile?.first_name || 'Student'}!
            </h1>
            <p className="dash-hero__subtitle">
              Inspect your active academic profile folder, class schedule, and term-by-term assessment progress.
            </p>
          </div>
        </section>

        {loading ? (
          <div className="dash-pane" style={{ textAlign: 'center', padding: '4rem' }}>
            <div className="pane-spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Syncing student profile folder...</p>
          </div>
        ) : !profileData ? (
          <div className="dash-pane pane-empty" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <span className="empty-icon">🎒</span>
            <h4 className="empty-title">Profile Folder Not Found</h4>
            <p className="empty-desc">Your student demographic folder could not be retrieved from the database.</p>
          </div>
        ) : (
          <div className="student-portal-workspace">
            {/* Class Coordinates and Tab Switcher */}
            <div className="child-switcher-tabs no-print" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', overflowX: 'auto' }}>
              {[
                { id: 'profile', label: 'My Profile Folder', icon: '👤' },
                { id: 'timetable', label: 'Lecture Timetable', icon: '🏫' },
                { id: 'attendance', label: 'Attendance History', icon: '📅' },
                { id: 'report', label: 'Academic Report Card', icon: '📝' },
                { id: 'materials', label: 'Learning Materials 📚', icon: '' },
                { id: 'fees', label: 'Fees & Invoices ₦', icon: '' }
              ].map(tab => (
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
                    backgroundColor: activeTab === tab.id ? 'var(--color-navy, #1b2a4a)' : '#f1f5f9',
                    color: activeTab === tab.id ? '#ffffff' : '#475569',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {loadingData && (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div className="pane-spinner" style={{ margin: '0 auto 0.5rem' }}></div>
                <p style={{ color: '#64748b', fontSize: '0.75rem' }}>Synchronizing school coordinates...</p>
              </div>
            )}

            {/* TAB: PROFILE */}
            {!loadingData && activeTab === 'profile' && (
              <div className="dash-main-grid" style={{ gridTemplateColumns: '1.7fr 1.3fr', display: 'grid', gap: '1.5rem' }}>
                {/* Folder Sheet */}
                <div className="dash-pane" style={{ height: 'fit-content' }}>
                  <h3 className="dash-pane__title" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                    Demographic & Academic File
                  </h3>
                  
                  <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <div className="large-avatar" style={{ margin: '0', width: '80px', height: '80px', fontSize: '2rem', flexShrink: 0 }}>
                      {(() => {
                        const imgUrl = profileData.photo_url || (() => {
                          const email = profileData.users?.email || '';
                          let hash = 0;
                          for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
                          const idx = Math.abs(hash) % 90;
                          const g = (Math.abs(hash) % 2 === 0) ? 'men' : 'women';
                          return `https://randomuser.me/api/portraits/${g}/${idx}.jpg`;
                        })();
                        return <img src={imgUrl} alt={profileData.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />;
                      })()}
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
                <div className="dash-side-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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

                  <div className="dash-pane dash-pane--gold-trim">
                    <h3 className="dash-pane__title">Need Assistance?</h3>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: '1.6', margin: '0 0 1rem' }}>
                      For discrepancies in demographic records, class schedules, or subjects, reach out to your form teacher.
                    </p>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e293b', background: '#f8fafc', padding: '0.75rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                      🏫 Classroom Unit: <strong>{profileData.classes ? profileData.classes.name : 'Unassigned'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: TIMETABLE */}
            {!loadingData && activeTab === 'timetable' && (
              <div className="dash-pane">
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 className="dash-pane__title" style={{ margin: 0 }}>Class Weekly Timetable</h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0' }}>Review the active lecture schedule coordinate slots mapped to your class unit.</p>
                </div>

                {timetableSlots.length === 0 ? (
                  <div className="pane-empty" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                    <span className="empty-icon">📅</span>
                    <h4 className="empty-title">Schedule Grid Empty</h4>
                    <p className="empty-desc">No active lecture slots are currently scheduled for your class cohort.</p>
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

            {/* TAB: ATTENDANCE */}
            {!loadingData && activeTab === 'attendance' && (
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

            {/* TAB: ACADEMIC REPORT CARD */}
            {!loadingData && activeTab === 'report' && (
              <div className="dash-pane">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 className="dash-pane__title" style={{ margin: 0 }}>Academic Transcript Report</h3>
                    <p className="no-print" style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0' }}>Review continuous assessments and final term examination grades.</p>
                  </div>
                  <button onClick={triggerPrint} className="btn btn--gold no-print" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem', fontWeight: 'bold' }}>
                    Print Report Card 🖨️
                  </button>
                </div>

                {compiledGrades.length === 0 ? (
                  <div className="pane-empty" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                    <span className="empty-icon">📝</span>
                    <h4 className="empty-title">Transcript Empty</h4>
                    <p className="empty-desc">No academic grades have been published for your profile folder in the active term.</p>
                  </div>
                ) : (
                  <div>
                    <div className="students-table-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Subject Name</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569', textAlign: 'center' }}>CA1 (30)</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569', textAlign: 'center' }}>CA2 (30)</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569', textAlign: 'center' }}>Exam (40)</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569', textAlign: 'center' }}>Total (100)</th>
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
                                  {grade.total}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Official Signatures Row for printing only */}
                    <div className="print-signatures" style={{ display: 'none', marginTop: '3.5rem' }}>
                      <div style={{ textAlign: 'center', width: '200px', borderTop: '1px solid #000000', paddingTop: '0.5rem', fontSize: '0.8rem' }}>
                        Principal Signature
                      </div>
                      <div style={{ textAlign: 'center', width: '200px', borderTop: '1px solid #000000', paddingTop: '0.5rem', fontSize: '0.8rem' }}>
                        Registrar Stamp
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: LEARNING MATERIALS (Phase 7) */}
            {!loadingData && activeTab === 'materials' && (
              <div className="dash-pane">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 className="dash-pane__title" style={{ margin: 0 }}>Learning Materials Shelf</h3>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0' }}>Download lecture notes, worksheets, and textbooks published by teachers.</p>
                  </div>
                  <input
                    type="text"
                    placeholder="Search documents by title..."
                    style={{ padding: '0.4rem 0.75rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.8125rem', outline: 'none', width: '240px' }}
                    value={searchMaterials}
                    onChange={(e) => setSearchMaterials(e.target.value)}
                  />
                </div>

                {filteredMaterials.length === 0 ? (
                  <div className="pane-empty" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                    <span className="empty-icon">📚</span>
                    <h4 className="empty-title">Shelf Empty</h4>
                    <p className="empty-desc">No academic learning materials found matching your search or linked to your cohort.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {filteredMaterials.map(mat => (
                      <div key={mat.id} style={{ padding: '1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '1.75rem' }}>📄</span>
                            <span style={{ fontSize: '0.625rem', background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                              {mat.file_type.split('/')[1] || 'PDF'}
                            </span>
                          </div>
                          <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#1e293b', margin: '0 0 0.5rem', lineHeight: '1.4' }}>
                            {mat.title}
                          </h4>
                          <p style={{ fontSize: '0.7rem', color: '#64748b', margin: 0 }}>
                            Published: {new Date(mat.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <a
                          href={mat.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn--navy"
                          style={{
                            display: 'block',
                            textAlign: 'center',
                            padding: '0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            marginTop: '1rem',
                            textDecoration: 'none'
                          }}
                        >
                          Download Resource 📥
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: FEES & INVOICES LEDGER (Phase 7) */}
            {!loadingData && activeTab === 'fees' && (
              <div className="dash-pane">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 className="dash-pane__title" style={{ margin: 0 }}>Tuition Fees Balance Statement</h3>
                    <p className="no-print" style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0' }}>Audit billed invoices, payment registries, and outstanding balances.</p>
                  </div>
                  <button onClick={triggerPrint} className="btn btn--gold no-print" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem', fontWeight: 'bold' }}>
                    Print Statement 🧾
                  </button>
                </div>

                {/* Financial Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Total Billed Invoice</span>
                    <strong style={{ fontSize: '1.25rem', color: '#0f172a', display: 'block', marginTop: '0.25rem' }}>
                      ₦{totalBilled.toLocaleString()}
                    </strong>
                  </div>
                  <div style={{ padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#166534', display: 'block', fontWeight: 600 }}>Deposited Amount</span>
                    <strong style={{ fontSize: '1.25rem', color: '#16a34a', display: 'block', marginTop: '0.25rem' }}>
                      ₦{totalPaid.toLocaleString()}
                    </strong>
                  </div>
                  <div style={{ padding: '1rem', background: totalDue > 0 ? '#fdf2f2' : '#f0fdf4', border: totalDue > 0 ? '1px solid #fecaca' : '1px solid #bbf7d0', borderRadius: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: totalDue > 0 ? '#991b1b' : '#166534', display: 'block', fontWeight: 600 }}>Outstanding Balance</span>
                    <strong style={{ fontSize: '1.25rem', color: totalDue > 0 ? '#dc2626' : '#16a34a', display: 'block', marginTop: '0.25rem' }}>
                      ₦{totalDue.toLocaleString()}
                    </strong>
                  </div>
                </div>

                {/* Detailed Invoiced Structure Items */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#1b2a4a', marginBottom: '0.75rem' }}>Invoice Details Breakdown</h4>
                  {feeStructures.length === 0 ? (
                    <p style={{ fontSize: '0.75rem', color: '#64748b' }}>No billed fees configured for this class level.</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                      {feeStructures.map(st => (
                        <div key={st.id} style={{ padding: '0.75rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ fontSize: '0.8125rem', color: '#1e293b', display: 'block' }}>{st.fee_type}</strong>
                            <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>Level Bracket: {st.level}</span>
                          </div>
                          <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>₦{parseFloat(st.amount).toLocaleString()}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Audit Payments Table */}
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#1b2a4a', marginBottom: '0.75rem' }}>Receipt Transactions Ledger</h4>
                  {payments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94a3b8' }}>
                      <p style={{ fontSize: '0.75rem', margin: 0 }}>No payment receipts registered on your student catalog ledger.</p>
                    </div>
                  ) : (
                    <div className="students-table-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '0.75rem', fontSize: '0.7rem', textTransform: 'uppercase', color: '#475569' }}>Receipt Number</th>
                            <th style={{ padding: '0.75rem', fontSize: '0.7rem', textTransform: 'uppercase', color: '#475569' }}>Date Registered</th>
                            <th style={{ padding: '0.75rem', fontSize: '0.7rem', textTransform: 'uppercase', color: '#475569' }}>Fee Item</th>
                            <th style={{ padding: '0.75rem', fontSize: '0.7rem', textTransform: 'uppercase', color: '#475569' }}>Method</th>
                            <th style={{ padding: '0.75rem', fontSize: '0.7rem', textTransform: 'uppercase', color: '#475569', textAlign: 'right' }}>Amount Paid</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map(pay => (
                            <tr key={pay.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '0.75rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#0f172a' }}>{pay.receipt_number}</td>
                              <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>{new Date(pay.payment_date).toLocaleDateString()}</td>
                              <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>{pay.fee_structures?.fee_type || 'Tuition'}</td>
                              <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>{pay.payment_method}</td>
                              <td style={{ padding: '0.75rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#16a34a', textAlign: 'right' }}>
                                ₦{parseFloat(pay.amount_paid).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Print Only Official Ledger Signatures */}
                <div className="print-signatures" style={{ display: 'none', marginTop: '3.5rem' }}>
                  <div style={{ textAlign: 'center', width: '200px', borderTop: '1px solid #000000', paddingTop: '0.5rem', fontSize: '0.8rem' }}>
                    Bursary Department
                  </div>
                  <div style={{ textAlign: 'center', width: '200px', borderTop: '1px solid #000000', paddingTop: '0.5rem', fontSize: '0.8rem' }}>
                    Official Stamp
                  </div>
                </div>

              </div>
            )}

          </div>
        )}
      </div>
    </PortalLayout>
  );
}
