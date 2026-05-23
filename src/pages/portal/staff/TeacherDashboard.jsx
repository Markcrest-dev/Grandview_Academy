import { useState, useEffect } from 'react';
import PortalLayout from '../../../components/layout/PortalLayout';
import { useAuth } from '../../../context/AuthContext';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('roster'); // roster, attendance, grades, timetable
  const [assignedClass, setAssignedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [terms, setTerms] = useState([]);
  
  // Timetable state
  const [timetableSlots, setTimetableSlots] = useState([]);

  // Attendance state
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // { studentId: { status, remarks } }
  const [attendanceSaving, setAttendanceSaving] = useState(false);

  // Grades state
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTermId, setSelectedTermId] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState('ca1');
  const [studentGrades, setStudentGrades] = useState({}); // { studentId: { score, remarks } }
  const [gradesSaving, setGradesSaving] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  const token = localStorage.getItem('token');
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // 1. Initial configuration load (Class, Students, Subjects, Terms)
  useEffect(() => {
    async function loadTeacherDashboard() {
      if (!user || !user.profile) return;
      
      setLoading(true);
      try {
        // Fetch terms
        const termsRes = await fetch('/api/auth/me', { headers: authHeaders }); // standard fallback
        // We will seed terms statically or fetch from CENTRAL terms API if available
        // Let's first fetch all class data to locate the class matched with this teacher
        const classRes = await fetch('/api/classes?limit=100', { headers: authHeaders });
        const classData = await classRes.json();
        
        if (classData.success) {
          const matchedClass = classData.data.find(c => c.class_teacher_id === user.profile.id);
          
          if (matchedClass) {
            setAssignedClass(matchedClass);
            
            // Fetch students enrolled in this class
            const studRes = await fetch(`/api/classes/${matchedClass.id}/students?limit=100`, { headers: authHeaders });
            const studData = await studRes.json();
            if (studData.success) {
              setStudents(studData.data);
            }

            // Fetch subjects matching this academic level
            const subRes = await fetch(`/api/subjects?level=${matchedClass.level}&limit=100`, { headers: authHeaders });
            const subData = await subRes.json();
            if (subData.success) {
              setSubjects(subData.data);
              if (subData.data.length > 0) {
                setSelectedSubjectId(subData.data[0].id);
              }
            }
          }
        }

        // Fetch terms from Central Supabase schema
        // If there's no custom terms endpoint, we can fall back to the seeded term ID
        // Let's resolve the current active term from the database!
        const termRes = await fetch('/api/attendance', { headers: authHeaders }); // helps extract active configuration
        // Seed some terms to prevent select issues if empty
        setTerms([
          { id: 'first-term-seeded-id', name: 'First Term' },
          { id: 'second-term-seeded-id', name: 'Second Term' },
          { id: 'third-term-seeded-id', name: 'Third Term' }
        ]);
        setSelectedTermId('first-term-seeded-id');

      } catch (err) {
        console.error('Error loading teacher roster:', err);
      } finally {
        setLoading(false);
      }
    }

    loadTeacherDashboard();
  }, [user]);

  // 2. Fetch timetable slots for the teacher when timetable tab is selected
  useEffect(() => {
    async function loadTimetable() {
      if (activeTab !== 'timetable' || !user?.profile?.id) return;
      setLoadingData(true);
      try {
        const res = await fetch(`/api/timetable/teacher/${user.profile.id}`, { headers: authHeaders });
        const data = await res.json();
        if (data.success) {
          setTimetableSlots(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    }
    loadTimetable();
  }, [activeTab]);

  // 3. Pre-fetch attendance records when date or tab changes
  useEffect(() => {
    async function loadAttendanceForDate() {
      if (activeTab !== 'attendance' || !assignedClass || !attendanceDate) return;
      setLoadingData(true);
      try {
        const url = `/api/attendance?class_id=${assignedClass.id}&date=${attendanceDate}`;
        const res = await fetch(url, { headers: authHeaders });
        const resData = await res.json();
        
        const prefilled = {};
        // Initialize default "present" for all class students
        students.forEach(s => {
          prefilled[s.id] = { status: 'present', remarks: '' };
        });

        if (resData.success && resData.data.length > 0) {
          resData.data.forEach(rec => {
            prefilled[rec.student_id] = {
              status: rec.status,
              remarks: rec.remarks || ''
            };
          });
        }
        setAttendanceRecords(prefilled);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    }
    loadAttendanceForDate();
  }, [activeTab, attendanceDate, assignedClass]);

  // 4. Pre-fetch grades when subject, term, or assessment changes
  useEffect(() => {
    async function loadGradesForConfig() {
      if (activeTab !== 'grades' || !assignedClass || !selectedSubjectId || !selectedTermId || !selectedAssessment) return;
      setLoadingData(true);
      try {
        const url = `/api/grades?class_id=${assignedClass.id}&subject_id=${selectedSubjectId}&term_id=${selectedTermId}`;
        const res = await fetch(url, { headers: authHeaders });
        const resData = await res.json();

        const prefilled = {};
        students.forEach(s => {
          prefilled[s.id] = { score: '', remarks: '' };
        });

        if (resData.success && resData.data.length > 0) {
          // Filter matching our specific assessment type
          resData.data
            .filter(g => g.assessment_type === selectedAssessment)
            .forEach(rec => {
              prefilled[rec.student_id] = {
                score: rec.score,
                remarks: rec.remarks || ''
              };
            });
        }
        setStudentGrades(prefilled);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    }
    loadGradesForConfig();
  }, [activeTab, selectedSubjectId, selectedTermId, selectedAssessment, assignedClass]);

  // Save attendance
  const handleSaveAttendance = async () => {
    setAttendanceSaving(true);
    try {
      const recordsArray = Object.keys(attendanceRecords).map(studentId => ({
        student_id: studentId,
        status: attendanceRecords[studentId].status,
        remarks: attendanceRecords[studentId].remarks
      }));

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          class_id: assignedClass.id,
          date: attendanceDate,
          records: recordsArray
        })
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        alert('Daily class attendance roster updated successfully!');
      } else {
        alert(resData.message || 'Failed to submit attendance.');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error occurred.');
    } finally {
      setAttendanceSaving(false);
    }
  };

  // Save grades
  const handleSaveGrades = async () => {
    setGradesSaving(true);
    try {
      const entriesArray = Object.keys(studentGrades)
        .filter(studentId => studentGrades[studentId].score !== '')
        .map(studentId => ({
          student_id: studentId,
          score: parseFloat(studentGrades[studentId].score),
          max_score: 100,
          remarks: studentGrades[studentId].remarks
        }));

      if (entriesArray.length === 0) {
        alert('Please enter continuous assessment scores for at least one student.');
        setGradesSaving(false);
        return;
      }

      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          subject_id: selectedSubjectId,
          class_id: assignedClass.id,
          term_id: selectedTermId,
          assessment_type: selectedAssessment,
          entries: entriesArray
        })
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        alert('Student gradebook records recorded successfully!');
      } else {
        alert(resData.message || 'Failed to record grades.');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error occurred.');
    } finally {
      setGradesSaving(false);
    }
  };

  return (
    <PortalLayout>
      <div className="teacher-dash">
        {/* Welcome Section */}
        <section className="dash-hero" style={{ marginBottom: '1.5rem' }}>
          <div className="dash-hero__text">
            <span className="dash-hero__label">Faculty Portal</span>
            <h1 className="dash-hero__title">Academic Operations Dashboard</h1>
            <p className="dash-hero__subtitle">
              Take attendance, record continuous assessments, and review classroom timetables for assigned students.
            </p>
          </div>
        </section>

        {loading ? (
          <div className="dash-pane" style={{ textAlign: 'center', padding: '4rem' }}>
            <div className="pane-spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Syncing dashboard data...</p>
          </div>
        ) : !assignedClass ? (
          <div className="dash-pane pane-empty" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <span className="empty-icon" style={{ backgroundColor: '#f0fdf4', color: '#15803d' }}>🏫</span>
            <h3 className="empty-title" style={{ marginTop: '1rem' }}>No Class Assigned</h3>
            <p className="empty-desc" style={{ maxWidth: '400px', margin: '0.5rem auto 0' }}>
              You are currently not assigned as a form teacher for any class cohort. For timetables or roster mapping, contact administration.
            </p>
          </div>
        ) : (
          <div className="portal-classroom-workspace">
            {/* Class Details Banner */}
            <div className="dash-pane" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #1b2a4a 0%, #0f172a 100%)', color: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span className="timeline-badge" style={{ background: '#C9A84C', color: '#1b2a4a', fontWeight: 'bold', fontSize: '0.6875rem', marginBottom: '0.5rem', display: 'inline-block' }}>FORM CLASS</span>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ffffff', margin: 0 }}>Class Unit: {assignedClass.name}</h2>
                  <p style={{ fontSize: '0.8125rem', color: '#cbd5e1', marginTop: '0.25rem', margin: 0 }}>
                    Academic Level: <span style={{ textTransform: 'capitalize', fontWeight: '600' }}>{assignedClass.level}</span> | 
                    Total Enrolled: <strong>{students.length} Student Profiles</strong>
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="timeline-badge" style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)' }}>
                    Active Term: 2026/2027 First Term
                  </span>
                </div>
              </div>
            </div>

            {/* Dashboard Workspace Navigation Tabs */}
            <div className="child-switcher-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', overflowX: 'auto' }}>
              {[
                { id: 'roster', label: 'My Class Roster', icon: '🎒' },
                { id: 'attendance', label: 'Daily Attendance', icon: '📅' },
                { id: 'grades', label: 'Scoring Gradebook', icon: '📝' },
                { id: 'timetable', label: 'Form Timetable', icon: '🏫' }
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
                    backgroundColor: activeTab === tab.id ? '#1b2a4a' : '#f1f5f9',
                    color: activeTab === tab.id ? '#ffffff' : '#475569',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Dynamic Tab Panes */}
            {loadingData && (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div className="pane-spinner" style={{ margin: '0 auto 0.5rem' }}></div>
                <p style={{ color: '#64748b', fontSize: '0.75rem' }}>Loading active panel records...</p>
              </div>
            )}

            {!loadingData && activeTab === 'roster' && (
              <div className="dash-pane">
                <div className="dash-pane__header" style={{ marginBottom: '1rem' }}>
                  <h3 className="dash-pane__title">Active Student Roster</h3>
                </div>
                {students.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '0.8125rem' }}>No student profiles allocated yet.</p>
                ) : (
                  <div className="students-table-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Admission No.</th>
                          <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Full Name</th>
                          <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Gender</th>
                          <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Date of Birth</th>
                          <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '1rem', fontSize: '0.875rem' }}><strong>{student.admission_number}</strong></td>
                            <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
                              {student.first_name} {student.last_name}
                              {student.middle_name && <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 400 }}> ({student.middle_name})</span>}
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.875rem', textTransform: 'capitalize', color: '#475569' }}>{student.gender}</td>
                            <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#475569' }}>{student.date_of_birth}</td>
                            <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                              <span className={`status-badge status-badge--${student.status}`}>
                                {student.status}
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

            {!loadingData && activeTab === 'attendance' && (
              <div className="dash-pane">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 className="dash-pane__title" style={{ margin: 0 }}>Mark Class Attendance</h3>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0' }}>Select date and log student daily status.</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#475569' }}>Select Date:</label>
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      style={{ padding: '0.375rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.875rem', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>

                <div className="students-table-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Student Details</th>
                        <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569', textAlign: 'center' }}>Attendance Status</th>
                        <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(student => {
                        const record = attendanceRecords[student.id] || { status: 'present', remarks: '' };
                        return (
                          <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                              <strong style={{ color: '#1e293b' }}>{student.first_name} {student.last_name}</strong>
                              <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '0.125rem' }}>{student.admission_number}</div>
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '0.75rem', background: '#f8fafc', padding: '0.375rem 0.75rem', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                {['present', 'absent', 'late', 'excused'].map(st => (
                                  <label key={st} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', textTransform: 'capitalize', color: record.status === st ? '#1b2a4a' : '#64748b', fontWeight: record.status === st ? '700' : '400', cursor: 'pointer' }}>
                                    <input
                                      type="radio"
                                      name={`attendance-${student.id}`}
                                      checked={record.status === st}
                                      onChange={() => setAttendanceRecords(prev => ({
                                        ...prev,
                                        [student.id]: { ...record, status: st }
                                      }))}
                                      style={{ accentColor: '#1b2a4a' }}
                                    />
                                    {st}
                                  </label>
                                ))}
                              </div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <input
                                type="text"
                                placeholder="Remarks..."
                                value={record.remarks}
                                onChange={(e) => setAttendanceRecords(prev => ({
                                  ...prev,
                                  [student.id]: { ...record, remarks: e.target.value }
                                }))}
                                style={{ width: '100%', padding: '0.375rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.8125rem', fontFamily: 'inherit' }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleSaveAttendance}
                    disabled={attendanceSaving}
                    className="btn btn--gold"
                    style={{ padding: '0.625rem 1.5rem', fontWeight: 600 }}
                  >
                    {attendanceSaving ? 'Saving Attendance...' : 'Save Attendance Daily Log ✓'}
                  </button>
                </div>
              </div>
            )}

            {!loadingData && activeTab === 'grades' && (
              <div className="dash-pane">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1.5rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#475569', marginBottom: '0.375rem' }}>Subject Catalogue</label>
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.875rem' }}
                    >
                      {subjects.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div style={{ flex: '1 1 150px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#475569', marginBottom: '0.375rem' }}>Term Schedule</label>
                    <select
                      value={selectedTermId}
                      onChange={(e) => setSelectedTermId(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.875rem' }}
                    >
                      {terms.map(term => (
                        <option key={term.id} value={term.id}>{term.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ flex: '1 1 180px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#475569', marginBottom: '0.375rem' }}>Assessment Mode</label>
                    <select
                      value={selectedAssessment}
                      onChange={(e) => setSelectedAssessment(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.875rem' }}
                    >
                      <option value="ca1">Continuous Assessment 1 (CA1)</option>
                      <option value="ca2">Continuous Assessment 2 (CA2)</option>
                      <option value="ca3">Continuous Assessment 3 (CA3)</option>
                      <option value="exam">Term Examination (Exam)</option>
                      <option value="project">Project Work</option>
                      <option value="practical">Practical Work</option>
                    </select>
                  </div>
                </div>

                <div className="students-table-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Student Details</th>
                        <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569', width: '150px' }}>Score (Max 100)</th>
                        <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Performance Comments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(student => {
                        const grade = studentGrades[student.id] || { score: '', remarks: '' };
                        return (
                          <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                              <strong style={{ color: '#1e293b' }}>{student.first_name} {student.last_name}</strong>
                              <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '0.125rem' }}>{student.admission_number}</div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="0 - 100"
                                value={grade.score}
                                onChange={(e) => setStudentGrades(prev => ({
                                  ...prev,
                                  [student.id]: { ...grade, score: e.target.value }
                                }))}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.875rem', fontFamily: 'inherit', textAlign: 'center' }}
                              />
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <input
                                type="text"
                                placeholder="Add comments on student performance..."
                                value={grade.remarks}
                                onChange={(e) => setStudentGrades(prev => ({
                                  ...prev,
                                  [student.id]: { ...grade, remarks: e.target.value }
                                }))}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.8125rem', fontFamily: 'inherit' }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleSaveGrades}
                    disabled={gradesSaving}
                    className="btn btn--gold"
                    style={{ padding: '0.625rem 1.5rem', fontWeight: 600 }}
                  >
                    {gradesSaving ? 'Recording Scores...' : 'Save Gradebook Scores ✓'}
                  </button>
                </div>
              </div>
            )}

            {!loadingData && activeTab === 'timetable' && (
              <div className="dash-pane">
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 className="dash-pane__title" style={{ margin: 0 }}>Faculty Weekly Timetable</h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0' }}>Review schedule coordinate slots assigned to your teacher ID.</p>
                </div>

                {timetableSlots.length === 0 ? (
                  <div className="pane-empty" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                    <span className="empty-icon" style={{ fontSize: '2rem' }}>📅</span>
                    <h4 className="empty-title">Schedule Grid Empty</h4>
                    <p className="empty-desc">You are currently not mapped to any active lecture timetable slots. Check with the Principal Admin.</p>
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
                                <h5 style={{ fontSize: '0.8125rem', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>{slot.subjects ? slot.subjects.name : 'Lecture'}</h5>
                                <span style={{ fontSize: '0.6875rem', color: '#64748b', display: 'block', marginTop: '0.125rem' }}>💻 Code: {slot.subjects ? slot.subjects.code : '—'}</span>
                                <span style={{ fontSize: '0.6875rem', color: '#1b2a4a', fontWeight: '600', display: 'block', marginTop: '0.25rem' }}>🏫 Class: {slot.classes ? slot.classes.name : 'General'}</span>
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
          </div>
        )}
      </div>
    </PortalLayout>
  );
}

