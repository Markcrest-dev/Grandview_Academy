import { useState, useEffect } from 'react';
import PortalLayout from '../../../components/layout/PortalLayout';
import { useAuth } from '../../../context/AuthContext';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [assignedClass, setAssignedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeacherRoster() {
      if (!user || !user.profile) return;
      
      setLoading(true);
      try {
        // 1. Fetch all classes to identify the one assigned to this teacher
        const classRes = await fetch('/api/classes?limit=100');
        const classData = await classRes.json();
        
        if (classData.success) {
          const matchedClass = classData.data.find(c => c.class_teacher_id === user.profile.id);
          
          if (matchedClass) {
            setAssignedClass(matchedClass);
            
            // 2. Fetch students enrolled in this class
            const studRes = await fetch(`/api/classes/${matchedClass.id}/students?limit=100`);
            const studData = await studRes.json();
            
            if (studData.success) {
              setStudents(studData.data);
            }
          }
        }
      } catch (err) {
        console.error('Error loading teacher roster:', err);
      } finally {
        setLoading(false);
      }
    }

    loadTeacherRoster();
  }, [user]);

  return (
    <PortalLayout>
      <div className="teacher-dash">
        {/* Welcome Section */}
        <section className="dash-hero" style={{ marginBottom: '2rem' }}>
          <div className="dash-hero__text">
            <span className="dash-hero__label">Faculty Portal</span>
            <h1 className="dash-hero__title">
              Form Class Roster
            </h1>
            <p className="dash-hero__subtitle">
              Manage and review the active list of students registered under your direct academic care.
            </p>
          </div>
        </section>

        {loading ? (
          <div className="dash-pane" style={{ textAlign: 'center', padding: '4rem' }}>
            <div className="pane-spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Syncing class details...</p>
          </div>
        ) : !assignedClass ? (
          <div className="dash-pane pane-empty" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <span className="empty-icon" style={{ backgroundColor: '#f0fdf4', color: '#15803d' }}>🏫</span>
            <h3 className="empty-title" style={{ marginTop: '1rem' }}>No Class Assigned</h3>
            <p className="empty-desc" style={{ maxWidth: '400px', margin: '0.5rem auto 0' }}>
              You are currently not registered as a form teacher for any class cohort. For assignments, contact the registrar.
            </p>
          </div>
        ) : (
          <div className="dash-pane">
            <div className="dash-pane__header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 className="dash-pane__title" style={{ fontSize: '1.25rem' }}>Classroom: {assignedClass.name}</h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0' }}>
                  Academic Level: <strong style={{ textTransform: 'capitalize' }}>{assignedClass.level}</strong> | 
                  Active Period: <strong>2026/2027 Session</strong>
                </p>
              </div>
              <span className="timeline-badge" style={{ alignSelf: 'center' }}>
                {students.length} Students
              </span>
            </div>

            {students.length === 0 ? (
              <div className="pane-empty" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                <span className="empty-icon">🎒</span>
                <h4 className="empty-title">Classroom Empty</h4>
                <p className="empty-desc">No active student profiles have been allocated to this class cohort yet.</p>
              </div>
            ) : (
              <div className="students-table-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <table className="directory-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
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
      </div>
    </PortalLayout>
  );
}
