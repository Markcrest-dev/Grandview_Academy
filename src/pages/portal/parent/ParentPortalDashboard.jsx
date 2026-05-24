import { useState, useEffect } from 'react';
import { apiUrl } from '../../../utils/api';
import PortalLayout from '../../../components/layout/PortalLayout';
import { useAuth } from '../../../context/AuthContext';
import MessagingInterface from '../../../components/ui/MessagingInterface';

export default function ParentPortalDashboard() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [selectedChildData, setSelectedChildData] = useState(null);
  
  // Tab states
  const [subTab, setSubTab] = useState('profile'); // profile, timetable, attendance, report, fees, alerts, ptm
  const [loading, setLoading] = useState(true);
  const [childLoading, setChildLoading] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Mapped performance metrics for the child
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [attendanceData, setAttendanceData] = useState({ records: [], stats: { rate: 100, total: 0 } });
  const [gradesReport, setGradesReport] = useState([]);

  // Expanded Parent States (Phase 8)
  const [feeStructures, setFeeStructures] = useState([]);
  const [payments, setPayments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  
  // Payment Form States
  const [selectedFeeStructureId, setSelectedFeeStructureId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentReceiptNumber, setPaymentReceiptNumber] = useState('');

  // Messaging States
  const [teacherMessage, setTeacherMessage] = useState('');
  const [messageSending, setMessageSending] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState(false);

  // PTM States
  const [ptmSchedules, setPtmSchedules] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [showPtmModal, setShowPtmModal] = useState(false);
  const [ptmForm, setPtmForm] = useState({ teacher_user_id: '', date: '', time: '' });
  const [ptmSubmitting, setPtmSubmitting] = useState(false);

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
        const res = await fetch(apiUrl('/api/students/family/children'), { headers: authHeaders });
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
        const res = await fetch(apiUrl(`/api/students/${selectedChildId}`), { headers: authHeaders });
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

  // 3. Load active tab metrics for the child
  useEffect(() => {
    async function fetchChildMetrics() {
      if (!selectedChildId || !selectedChildData) return;

      setLoadingMetrics(true);
      try {
        if (subTab === 'timetable' && selectedChildData.classes?.id) {
          const res = await fetch(apiUrl(`/api/timetable/class/${selectedChildData.classes.id}`), { headers: authHeaders });
          const resData = await res.json();
          if (resData.success) {
            setTimetableSlots(resData.data);
          }
        } else if (subTab === 'attendance') {
          const res = await fetch(apiUrl(`/api/attendance/student/${selectedChildId}`), { headers: authHeaders });
          const resData = await res.json();
          if (resData.success) {
            setAttendanceData(resData.data);
          }
        } else if (subTab === 'report') {
          const res = await fetch(apiUrl(`/api/grades/student/${selectedChildId}`), { headers: authHeaders });
          const resData = await res.json();
          if (resData.success) {
            setGradesReport(resData.data);
          }
        } else if (subTab === 'fees') {
          await refreshFeesData();
        } else if (subTab === 'assignments') {
          const res = await fetch(apiUrl(`/api/assignments/student/${selectedChildId}/assignments`), { headers: authHeaders });
          const resData = await res.json();
          if (resData.success) {
            setAssignments(resData.data);
          }
        } else if (subTab === 'alerts') {
          // Fetch announcements
          const res = await fetch(apiUrl('/api/announcements'), { headers: authHeaders });
          const resData = await res.json();
          if (resData.success) {
            setAnnouncements(resData.data);
          }
          // Fetch attendance logs for absent alerts parser
          const attRes = await fetch(apiUrl(`/api/attendance/student/${selectedChildId}`), { headers: authHeaders });
          const attData = await attRes.json();
          if (attData.success) {
            setAttendanceData(attData.data);
          }
        } else if (subTab === 'ptm') {
          // Fetch existing schedules
          const ptmRes = await fetch(apiUrl('/api/messages/ptm'), { headers: authHeaders });
          const ptmData = await ptmRes.json();
          if (ptmData.success) {
            setPtmSchedules(ptmData.data);
          }
          // Fetch teachers for the current class
          if (selectedChildData.classes?.id) {
            // we will fetch all teachers for simplicity or fetch staff
            const staffRes = await fetch(apiUrl('/api/staff?role=teaching_staff'), { headers: authHeaders });
            const staffData = await staffRes.json();
            if (staffData.success) {
              setTeachers(staffData.data);
            }
          }
        }
      } catch (err) {
        console.error('Error loading child metrics:', err);
      } finally {
        setLoadingMetrics(false);
      }
    }

    fetchChildMetrics();
  }, [subTab, selectedChildId, selectedChildData]);

  // Helper to re-fetch fees and structures
  const refreshFeesData = async () => {
    if (!selectedChildId || !selectedChildData) return;
    try {
      const payRes = await fetch(apiUrl(`/api/fees/payments/student/${selectedChildId}`), { headers: authHeaders });
      const payData = await payRes.json();
      if (payData.success) {
        setPayments(payData.data);
      }

      const structRes = await fetch(apiUrl(`/api/fees/structures?level=${selectedChildData.level}`), { headers: authHeaders });
      const structData = await structRes.json();
      if (structData.success) {
        setFeeStructures(structData.data);
        if (structData.data.length > 0) {
          setSelectedFeeStructureId(structData.data[0].id);
          setPaymentAmount(structData.data[0].amount.toString());
        }
      }
    } catch (err) {
      console.error('Error refreshing fee structures:', err);
    }
  };

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

  // Financial ledgers summary metrics
  const totalBilled = feeStructures.reduce((acc, s) => acc + parseFloat(s.amount), 0);
  const totalPaid = payments.reduce((acc, p) => acc + parseFloat(p.amount_paid), 0);
  const totalDue = Math.max(0, totalBilled - totalPaid);

  // Absent days extractor
  const absentDays = attendanceData.records.filter(r => r.status.toLowerCase() === 'absent');

  // Submit Tuition Payment via Paystack
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFeeStructureId || !paymentAmount) return;

    setPaymentProcessing(true);

    try {
      const res = await fetch(apiUrl('/api/fees/pay/initialize'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          student_id: selectedChildId,
          fee_structure_id: selectedFeeStructureId,
          amount: parseFloat(paymentAmount)
        })
      });

      const resData = await res.json();
      
      if (resData.success && resData.data.authorization_url) {
        // Redirect to Paystack Checkout page
        window.location.href = resData.data.authorization_url;
      } else {
        alert(resData.message || 'Failed to initialize payment.');
        setPaymentProcessing(false);
      }
    } catch (err) {
      setPaymentProcessing(false);
      console.error('Payment gateway error:', err);
      alert('Failed to connect to Paystack Gateway.');
    }
  };

  // Submit direct message to Form Teacher
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!teacherMessage.trim()) return;

    setMessageSending(true);

    // Simulate messaging handshake
    setTimeout(() => {
      setMessageSending(false);
      setMessageSuccess(true);
      setTeacherMessage('');
      setTimeout(() => setMessageSuccess(false), 4000);
    }, 1200);
  };

  const triggerPrint = () => {
    window.print();
  };

  const handlePtmSubmit = async (e) => {
    e.preventDefault();
    if (!ptmForm.teacher_user_id || !ptmForm.date || !ptmForm.time) return;
    
    setPtmSubmitting(true);
    try {
      const res = await fetch(apiUrl('/api/messages/ptm'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          ...ptmForm,
          student_id: selectedChildId
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Meeting scheduled successfully!');
        setPtmSchedules(prev => [...prev, data.data]);
        setShowPtmModal(false);
        setPtmForm({ teacher_user_id: '', date: '', time: '' });
      } else {
        alert(data.message || 'Failed to schedule meeting.');
      }
    } catch (err) {
      alert('Network error while scheduling meeting.');
    } finally {
      setPtmSubmitting(false);
    }
  };

  return (
    <PortalLayout>
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
          .portal-layout__content, .parent-dash {
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
            border: 1px solid #cbd5e1 !important;
            padding: 10px !important;
          }
        }
      `}} />

      <div className="parent-dash">
        
        {/* Print Only Official School Watermark Header */}
        <div className="print-header" style={{ display: 'none', textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', margin: '0 0 0.25rem', color: '#1b2a4a' }}>GRANDVIEW ACADEMY</h1>
          <p style={{ fontSize: '0.8rem', letterSpacing: '2px', color: '#64748b', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>OFFICIAL TRANSCRIPT OF PERFORMANCE</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', width: '100%', border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '4px', textAlign: 'left', fontSize: '0.85rem', marginTop: '1rem' }}>
            <div>
              <p style={{ margin: '0 0 0.35rem' }}><strong>Student Ward:</strong> {selectedChildData?.first_name} {selectedChildData?.last_name}</p>
              <p style={{ margin: '0 0 0.35rem' }}><strong>Admission Code:</strong> {selectedChildData?.admission_number}</p>
              <p style={{ margin: '0' }}><strong>Enrolled Cohort:</strong> {selectedChildData?.classes?.name}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 0.35rem' }}><strong>Date of Printing:</strong> {new Date().toLocaleDateString()}</p>
              <p style={{ margin: '0 0 0.35rem' }}><strong>Guardian Name:</strong> {user?.profile?.first_name} {user?.profile?.last_name}</p>
              <p style={{ margin: '0' }}><strong>Report Bracket:</strong> {selectedChildData?.level?.toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* Welcome Section */}
        <section className="dash-hero no-print" style={{ marginBottom: '1.5rem' }}>
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
            <div className="child-switcher-tabs no-print" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', overflowX: 'auto' }}>
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
                <div className="child-switcher-tabs no-print" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', overflowX: 'auto' }}>
                  {[
                    { id: 'profile', label: 'Ward Profile Details', icon: '👤' },
                    { id: 'timetable', label: 'School Timetable', icon: '🏫' },
                    { id: 'attendance', label: 'Attendance Stats', icon: '📅' },
                    { id: 'report', label: 'Report Card Transcript', icon: '📝' },
                    { id: 'assignments', label: 'Assignments Tracker 📚', icon: '' },
                    { id: 'fees', label: 'Fees & Payments 💳', icon: '' },
                    { id: 'ptm', label: 'PTM Scheduler 📅', icon: '' },
                    { id: 'alerts', label: 'Alerts & Announcements 🔔', icon: '' },
                    { id: 'messages', label: 'Messages 💬', icon: '' }
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

                {/* SUBTAB: PROFILE */}
                {!loadingMetrics && subTab === 'profile' && (
                  <div className="dash-main-grid" style={{ gridTemplateColumns: '1.7fr 1.3fr', display: 'grid', gap: '1.5rem' }}>
                    {/* Child Folder pane */}
                    <div className="dash-pane" style={{ height: 'fit-content' }}>
                      <h3 className="dash-pane__title" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                        Demographic & Enrollment File
                      </h3>

                      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        <div className="large-avatar" style={{ margin: '0', width: '70px', height: '70px', fontSize: '1.75rem', flexShrink: 0 }}>
                          {(() => {
                            const imgUrl = selectedChildData.photo_url || (() => {
                              const email = selectedChildData.users?.email || '';
                              let hash = 0;
                              for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
                              const idx = Math.abs(hash) % 90;
                              const g = (Math.abs(hash) % 2 === 0) ? 'men' : 'women';
                              return `https://randomuser.me/api/portraits/${g}/${idx}.jpg`;
                            })();
                            return <img src={imgUrl} alt={selectedChildData.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />;
                          })()}
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

                {/* SUBTAB: TIMETABLE */}
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

                {/* SUBTAB: ATTENDANCE */}
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

                {/* SUBTAB: ACADEMIC REPORT CARD */}
                {!loadingMetrics && subTab === 'report' && (
                  <div className="dash-pane">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <h3 className="dash-pane__title" style={{ margin: 0 }}>Academic Transcript</h3>
                        <p className="no-print" style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0' }}>Review continuous assessments and final term examination grades published for your child.</p>
                      </div>
                      <button onClick={triggerPrint} className="btn btn--gold no-print" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem', fontWeight: 'bold' }}>
                        Print Report Card 🖨️
                      </button>
                    </div>

                    {compiledGrades.length === 0 ? (
                      <div className="pane-empty" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                        <span className="empty-icon">📝</span>
                        <h4 className="empty-title">Transcript Empty</h4>
                        <p className="empty-desc">No academic grades have been published for your child in the active term period.</p>
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

                {/* SUBTAB: ASSIGNMENTS TRACKER */}
                {!loadingMetrics && subTab === 'assignments' && (
                  <div className="dash-pane">
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 className="dash-pane__title" style={{ margin: 0 }}>Assignments Tracker</h3>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0' }}>Monitor your child's pending tasks and review graded coursework.</p>
                    </div>

                    {assignments.length === 0 ? (
                      <div className="pane-empty" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                        <span className="empty-icon">📚</span>
                        <h4 className="empty-title">No Assignments</h4>
                        <p className="empty-desc">Your child has no active or past assignments for their current class.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {assignments.map(assignment => (
                          <div key={assignment.id} style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                  <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>{assignment.title}</h4>
                                  <span className={`status-badge status-badge--${assignment.status}`} style={{ fontSize: '0.625rem', padding: '2px 8px' }}>
                                    {assignment.status.toUpperCase()}
                                  </span>
                                </div>
                                <p style={{ fontSize: '0.8125rem', color: '#475569', margin: '0 0 0.5rem' }}>{assignment.description || 'No description provided.'}</p>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                  <span><strong>Subject:</strong> {assignment.subjects?.name || 'General'}</span>
                                  <span><strong>Teacher:</strong> {assignment.staff?.first_name} {assignment.staff?.last_name}</span>
                                  <span style={{ color: new Date(assignment.due_date) < new Date() && assignment.status === 'pending' ? '#dc2626' : 'inherit' }}>
                                    <strong>Due:</strong> {new Date(assignment.due_date).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Grade Display */}
                              {assignment.status === 'graded' && assignment.submission && (
                                <div style={{ background: '#ffffff', padding: '0.75rem 1.25rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'center', minWidth: '100px' }}>
                                  <span style={{ fontSize: '0.6875rem', color: '#64748b', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>Score</span>
                                  <strong style={{ fontSize: '1.25rem', color: '#16a34a', display: 'block' }}>{assignment.submission.score} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>/ {assignment.max_score}</span></strong>
                                </div>
                              )}
                            </div>

                            {assignment.submission && (
                              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                                <div style={{ fontSize: '0.8125rem', color: '#475569' }}>
                                  <p style={{ margin: '0 0 0.5rem' }}><strong>Submission:</strong> {assignment.submission?.text_content || 'File uploaded'}</p>
                                  {assignment.submission?.remarks && (
                                    <p style={{ margin: 0, padding: '0.75rem', background: '#fef3c7', borderLeft: '3px solid #d97706', borderRadius: '0 4px 4px 0' }}>
                                      <strong>Teacher Remarks:</strong> {assignment.submission.remarks}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SUBTAB: FEES & PAYMENTS (Phase 8) */}
                {!loadingMetrics && subTab === 'fees' && (
                  <div className="dash-pane">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <h3 className="dash-pane__title" style={{ margin: 0 }}>Tuition Fees & Payments Portal</h3>
                        <p className="no-print" style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0' }}>Review billed items, outstanding balances, and execute online tuition payments.</p>
                      </div>
                      <div className="no-print" style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => setShowPaymentModal(true)} className="btn btn--navy" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem', fontWeight: 'bold' }}>
                          Make Online Payment 💳
                        </button>
                        <button onClick={triggerPrint} className="btn btn--gold" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem', fontWeight: 'bold' }}>
                          Print Statement 🧾
                        </button>
                      </div>
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
                        <span style={{ fontSize: '0.75rem', color: '#166534', display: 'block', fontWeight: 600 }}>Total Deposited</span>
                        <strong style={{ fontSize: '1.25rem', color: '#16a34a', display: 'block', marginTop: '0.25rem' }}>
                          ₦{totalPaid.toLocaleString()}
                        </strong>
                      </div>
                      <div style={{ padding: '1rem', background: totalDue > 0 ? '#fdf2f2' : '#f0fdf4', border: totalDue > 0 ? '1px solid #fecaca' : '1px solid #bbf7d0', borderRadius: '4px' }}>
                        <span style={{ fontSize: '0.75rem', color: totalDue > 0 ? '#991b1b' : '#166534', display: 'block', fontWeight: 600 }}>Net Outstanding</span>
                        <strong style={{ fontSize: '1.25rem', color: totalDue > 0 ? '#dc2626' : '#16a34a', display: 'block', marginTop: '0.25rem' }}>
                          ₦{totalDue.toLocaleString()}
                        </strong>
                      </div>
                    </div>

                    {/* Billed Fee Breakdown */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#1b2a4a', marginBottom: '0.75rem' }}>Billing Structure items</h4>
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

                    {/* Payment Transactions Ledger */}
                    <div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#1b2a4a', marginBottom: '0.75rem' }}>Receipt Transactions Ledger</h4>
                      {payments.length === 0 ? (
                        <p style={{ fontSize: '0.75rem', color: '#64748b' }}>No payment receipts registered on your student catalog ledger.</p>
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

                {/* SUBTAB: ALERTS & MESSAGES (Phase 8) */}
                {!loadingMetrics && subTab === 'alerts' && (
                  <div className="dash-main-grid" style={{ gridTemplateColumns: '1.5fr 1.5fr', display: 'grid', gap: '1.5rem' }}>
                    {/* Alerts and Announcements Panel */}
                    <div className="dash-pane" style={{ height: 'fit-content' }}>
                      <h3 className="dash-pane__title" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                        Guardian Notifications & Alerts
                      </h3>

                      {/* Dyn Absent Alerts Parser */}
                      {absentDays.length > 0 && (
                        <div style={{ background: '#fdf2f2', border: '1px solid #fecaca', borderRadius: '4px', padding: '1rem', marginBottom: '1.5rem' }}>
                          <h4 style={{ color: '#991b1b', fontSize: '0.875rem', fontWeight: 'bold', margin: '0 0 0.5rem' }}>
                            🚨 Attendance Truancy Warning
                          </h4>
                          {absentDays.map(abs => (
                            <p key={abs.id} style={{ fontSize: '0.75rem', color: '#dc2626', margin: '0 0 0.25rem', lineHeight: '1.4' }}>
                              ⚠️ <strong>{selectedChildData.first_name}</strong> was marked **ABSENT** on {new Date(abs.date).toLocaleDateString()} for class {abs.classes?.name}.
                            </p>
                          ))}
                        </div>
                      )}

                      {/* General announcements listing */}
                      <h4 style={{ fontSize: '0.8125rem', fontWeight: 'bold', color: '#1b2a4a', marginBottom: '0.75rem' }}>School-Wide Announcements</h4>
                      {announcements.length === 0 ? (
                        <p style={{ fontSize: '0.75rem', color: '#64748b' }}>No administrative announcements registered.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {announcements.map(ann => (
                            <div key={ann.id} style={{ padding: '0.75rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                              <strong style={{ fontSize: '0.8125rem', color: '#1e293b', display: 'block' }}>📢 {ann.title}</strong>
                              <span style={{ fontSize: '0.6875rem', color: '#64748b', display: 'block', marginTop: '0.25rem' }}>{ann.content}</span>
                              <span style={{ fontSize: '0.625rem', color: '#94a3b8', display: 'block', marginTop: '0.5rem' }}>Date: {new Date(ann.created_at).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Contact classroom teacher panel */}
                    <div className="dash-pane">
                      <h3 className="dash-pane__title" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                        Contact Classroom Form Instructor
                      </h3>

                      <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '4px', fontSize: '0.8125rem', borderLeft: '3px solid #C9A84C' }}>
                          🧑‍🏫 Recipient: <strong>Classroom Form Teacher</strong><br />
                          🏫 Class Segment: <strong>{selectedChildData.classes ? selectedChildData.classes.name : 'Unassigned'}</strong>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.375rem' }}>Secure Query Message</label>
                          <textarea
                            placeholder="Type details regarding report cards, timetables, or attendance updates..."
                            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8125rem', minHeight: '120px', outline: 'none', resize: 'vertical' }}
                            value={teacherMessage}
                            onChange={(e) => setTeacherMessage(e.target.value)}
                            required
                          />
                        </div>

                        {messageSuccess && (
                          <div style={{ padding: '0.5rem', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', textAlign: 'center' }}>
                            ✅ Secure message successfully dispatched to classroom teacher!
                          </div>
                        )}

                        <button
                          type="submit"
                          className="btn btn--navy"
                          disabled={messageSending}
                          style={{ padding: '0.625rem', fontSize: '0.8125rem', fontWeight: 'bold' }}
                        >
                          {messageSending ? 'Dispatching Message...' : 'Send Message ✉️'}
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* SUBTAB: MESSAGES */}
                {!loadingMetrics && subTab === 'messages' && (
                  <div className="dash-pane" style={{ padding: '0', background: 'transparent', border: 'none', boxShadow: 'none' }}>
                    <MessagingInterface />
                  </div>
                )}

                {/* SUBTAB: PTM SCHEDULER */}
                {!loadingMetrics && subTab === 'ptm' && (
                  <div className="dash-pane">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <h3 className="dash-pane__title" style={{ margin: 0 }}>Parent-Teacher Meetings</h3>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0' }}>Schedule and manage meetings with your child's teachers.</p>
                      </div>
                      <button onClick={() => setShowPtmModal(true)} className="btn btn--navy" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem', fontWeight: 'bold' }}>
                        Book Meeting 📅
                      </button>
                    </div>

                    {ptmSchedules.length === 0 ? (
                      <div className="pane-empty" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                        <span className="empty-icon">📅</span>
                        <h4 className="empty-title">No Meetings Scheduled</h4>
                        <p className="empty-desc">You do not have any upcoming parent-teacher meetings.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {ptmSchedules.map(ptm => (
                          <div key={ptm.id} style={{ padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', borderLeft: '4px solid #C9A84C' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#1b2a4a', margin: 0 }}>
                                Meeting with Instructor
                              </h4>
                              <span className="status-badge status-badge--active" style={{ fontSize: '0.625rem', padding: '2px 8px' }}>
                                {ptm.status.toUpperCase()}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: '#475569', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                              <span><strong>Date:</strong> {ptm.date}</span>
                              <span><strong>Time:</strong> {ptm.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* MODAL: CHECKOUT SIMULATION DRAWERS (Paystack Visual Inspired) */}
      {showPaymentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }} className="no-print">
          <div style={{ background: '#ffffff', borderRadius: '8px', padding: '2rem', width: '100%', maxWidth: '440px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', position: 'relative' }}>
            <button onClick={() => setShowPaymentModal(false)} style={{ position: 'absolute', top: '1rem', right: '1.25rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
            
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ background: '#3ecf8e', color: '#ffffff', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 0.5rem' }}>
                💳
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Paystack Secure Gateway</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0' }}>Grandview Academy Invoicing Checkout</p>
            </div>

            <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>BILLING FEE STRUCTURE CATEGORY</label>
                <select
                  style={{ width: '100%', padding: '0.4rem 0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8125rem', outline: 'none' }}
                  value={selectedFeeStructureId}
                  onChange={(e) => {
                    setSelectedFeeStructureId(e.target.value);
                    const matched = feeStructures.find(s => s.id === e.target.value);
                    if (matched) setPaymentAmount(matched.amount.toString());
                  }}
                  required
                >
                  {feeStructures.map(s => (
                    <option key={s.id} value={s.id}>{s.fee_type} — ₦{parseFloat(s.amount).toLocaleString()}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>PAYMENT AMOUNT (NGN ₦)</label>
                <input
                  type="number"
                  style={{ width: '100%', padding: '0.4rem 0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8125rem', outline: 'none', fontWeight: 'bold' }}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  min="1"
                  required
                />
              </div>

              <div style={{ padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
                You will be securely redirected to Paystack to complete your payment via Card, Bank Transfer, or USSD.
              </div>

              <button
                type="submit"
                disabled={paymentProcessing}
                style={{
                  background: '#3ecf8e',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#ffffff',
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginTop: '0.5rem',
                  transition: 'background 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {paymentProcessing ? (
                  <>
                    <div className="pane-spinner" style={{ width: '16px', height: '16px', borderLeftColor: '#ffffff', margin: 0 }}></div>
                    Contacting Interswitch Gateway...
                  </>
                ) : (
                  `Pay NGN ₦${parseFloat(paymentAmount || 0).toLocaleString()}`
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUCCESS CONFIRMATION PROMPTS */}
      {showSuccessModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, backdropFilter: 'blur(5px)' }} className="no-print">
          <div style={{ background: '#ffffff', borderRadius: '8px', padding: '2rem', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ background: '#d1fae5', color: '#059669', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1rem' }}>
              ✓
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a', margin: '0 0 0.5rem' }}>Transaction Successful!</h3>
            <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: '1.5', margin: '0 0 1.5rem' }}>
              We successfully registered payment for <strong>{selectedChildData?.first_name}</strong>'s school ledger.
            </p>
            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.75rem', color: '#1e293b', marginBottom: '1.5rem', fontWeight: 'bold', letterSpacing: '1px' }}>
              RECEIPT CODE: {paymentReceiptNumber}
            </div>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="btn btn--gold"
              style={{ padding: '0.625rem 1.5rem', fontWeight: 'bold', fontSize: '0.8125rem', width: '100%' }}
            >
              Back to Invoices Ledger
            </button>
          </div>
        </div>
      )}

      {/* MODAL: BOOK PTM */}
      {showPtmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }} className="no-print">
          <div style={{ background: '#ffffff', borderRadius: '8px', padding: '2rem', width: '100%', maxWidth: '440px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem' }}>Book a Meeting</h3>
              <button onClick={() => setShowPtmModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            
            <form onSubmit={handlePtmSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Select Teacher</label>
                <select
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8125rem', outline: 'none' }}
                  value={ptmForm.teacher_user_id}
                  onChange={(e) => setPtmForm(prev => ({ ...prev, teacher_user_id: e.target.value }))}
                  required
                >
                  <option value="" disabled>-- Choose Instructor --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Date</label>
                <input
                  type="date"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8125rem', outline: 'none' }}
                  value={ptmForm.date}
                  onChange={(e) => setPtmForm(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Time</label>
                <input
                  type="time"
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8125rem', outline: 'none' }}
                  value={ptmForm.time}
                  onChange={(e) => setPtmForm(prev => ({ ...prev, time: e.target.value }))}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={ptmSubmitting}
                className="btn btn--navy"
                style={{ padding: '0.75rem', fontWeight: 'bold', marginTop: '0.5rem' }}
              >
                {ptmSubmitting ? 'Booking...' : 'Confirm Appointment'}
              </button>
            </form>
          </div>
        </div>
      )}

    </PortalLayout>
  );
}
