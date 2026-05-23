import { useState, useEffect } from 'react';
import { apiUrl } from '../../../utils/api';
import PortalLayout from '../../../components/layout/PortalLayout';
import './RelationshipManager.css';

export default function RelationshipManager() {
  const [activeTab, setActiveTab] = useState('parents');
  const [toast, setToast] = useState(null);
  const token = localStorage.getItem('token');
  const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ═══ TAB 1: PARENT-STUDENT LINKING STATE ═══
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedParent, setSelectedParent] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [parentSearch, setParentSearch] = useState('');
  const [linkedParents, setLinkedParents] = useState([]);
  const [linkLoading, setLinkLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [parentsLoading, setParentsLoading] = useState(false);

  // ═══ TAB 2: TEACHER-CLASS STATE ═══
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classTeacherMap, setClassTeacherMap] = useState({});
  const [classesLoading, setClassesLoading] = useState(false);
  const [classSaving, setClassSaving] = useState(null);

  // ═══ TAB 3: TIMETABLE STATE ═══
  const [ttClassId, setTtClassId] = useState('');
  const [ttSlots, setTtSlots] = useState([]);
  const [ttSubjects, setTtSubjects] = useState([]);
  const [ttLoading, setTtLoading] = useState(false);
  const [newSlot, setNewSlot] = useState({ day_of_week: 'monday', subject_id: '', teacher_id: '', start_time: '08:00', end_time: '09:00', room: '' });
  const [addingSlot, setAddingSlot] = useState(false);

  // ═══ DATA FETCHERS ═══
  const fetchStudents = async (search = '') => {
    setStudentsLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/students?limit=50&search=${search}`), { headers: authHeaders });
      const d = await res.json();
      if (d.success) setStudents(d.data);
    } catch (e) { console.error(e); }
    finally { setStudentsLoading(false); }
  };

  const fetchParents = async (search = '') => {
    setParentsLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/parents?limit=50&search=${search}`), { headers: authHeaders });
      const d = await res.json();
      if (d.success) setParents(d.data);
    } catch (e) { console.error(e); }
    finally { setParentsLoading(false); }
  };

  const fetchStudentDetail = async (id) => {
    try {
      const res = await fetch(apiUrl(`/api/students/${id}`), { headers: authHeaders });
      const d = await res.json();
      if (d.success) {
        setSelectedStudent(d.data);
        setLinkedParents(d.data.parents || []);
      }
    } catch (e) { console.error(e); }
  };

  const fetchClassesAndTeachers = async () => {
    setClassesLoading(true);
    try {
      const [cRes, tRes] = await Promise.all([
        fetch(apiUrl('/api/classes?limit=100'), { headers: authHeaders }),
        fetch(apiUrl('/api/staff?staff_type=teaching&limit=100'), { headers: authHeaders })
      ]);
      const cData = await cRes.json();
      const tData = await tRes.json();
      if (cData.success) {
        setClasses(cData.data);
        const map = {};
        cData.data.forEach(c => { map[c.id] = c.class_teacher_id || ''; });
        setClassTeacherMap(map);
      }
      if (tData.success) setTeachers(tData.data);
    } catch (e) { console.error(e); }
    finally { setClassesLoading(false); }
  };

  const fetchTimetable = async (classId) => {
    if (!classId) return;
    setTtLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/timetable/class/${classId}`), { headers: authHeaders });
      const d = await res.json();
      if (d.success) setTtSlots(d.data);
    } catch (e) { console.error(e); }
    finally { setTtLoading(false); }
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch(apiUrl('/api/subjects?limit=100'), { headers: authHeaders });
      const d = await res.json();
      if (d.success) setTtSubjects(d.data);
    } catch (e) { console.error(e); }
  };

  // ═══ INITIAL LOADS ═══
  useEffect(() => {
    if (activeTab === 'parents') { fetchStudents(); fetchParents(); }
    else if (activeTab === 'teachers') { fetchClassesAndTeachers(); }
    else if (activeTab === 'timetable') { fetchClassesAndTeachers(); fetchSubjects(); }
  }, [activeTab]);

  // ═══ SEARCH DEBOUNCE ═══
  useEffect(() => { const t = setTimeout(() => fetchStudents(studentSearch), 400); return () => clearTimeout(t); }, [studentSearch]);
  useEffect(() => { const t = setTimeout(() => fetchParents(parentSearch), 400); return () => clearTimeout(t); }, [parentSearch]);

  // ═══ ACTIONS ═══
  const handleLinkParent = async () => {
    if (!selectedStudent || !selectedParent) return;
    setLinkLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/students/${selectedStudent.id}/link-parent`), {
        method: 'POST', headers: authHeaders, body: JSON.stringify({ parent_id: selectedParent.id })
      });
      const d = await res.json();
      if (d.success) {
        showToast(`${selectedParent.first_name} ${selectedParent.last_name} linked successfully!`);
        fetchStudentDetail(selectedStudent.id);
        setSelectedParent(null);
      } else { showToast(d.message, 'error'); }
    } catch (e) { showToast('Connection error.', 'error'); }
    finally { setLinkLoading(false); }
  };

  const handleUnlinkParent = async (parentId) => {
    if (!selectedStudent) return;
    try {
      const res = await fetch(apiUrl(`/api/students/${selectedStudent.id}/unlink-parent/${parentId}`), {
        method: 'DELETE', headers: authHeaders
      });
      const d = await res.json();
      if (d.success) {
        showToast('Parent unlinked successfully.');
        fetchStudentDetail(selectedStudent.id);
      } else { showToast(d.message, 'error'); }
    } catch (e) { showToast('Connection error.', 'error'); }
  };

  const handleSaveClassTeacher = async (classId) => {
    setClassSaving(classId);
    try {
      const res = await fetch(apiUrl(`/api/classes/${classId}`), {
        method: 'PUT', headers: authHeaders,
        body: JSON.stringify({ class_teacher_id: classTeacherMap[classId] || null })
      });
      const d = await res.json();
      if (d.success) { showToast('Class teacher assignment saved!'); }
      else { showToast(d.message, 'error'); }
    } catch (e) { showToast('Connection error.', 'error'); }
    finally { setClassSaving(null); }
  };

  const handleAddSlot = async () => {
    if (!ttClassId || !newSlot.subject_id || !newSlot.teacher_id) {
      showToast('Select class, subject, and teacher.', 'error'); return;
    }
    setAddingSlot(true);
    try {
      const res = await fetch(apiUrl('/api/timetable'), {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ class_id: ttClassId, ...newSlot })
      });
      const d = await res.json();
      if (d.success) {
        showToast('Timetable slot created!');
        fetchTimetable(ttClassId);
        setNewSlot(s => ({ ...s, subject_id: '', teacher_id: '', start_time: '08:00', end_time: '09:00', room: '' }));
      } else { showToast(d.message, 'error'); }
    } catch (e) { showToast('Connection error.', 'error'); }
    finally { setAddingSlot(false); }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      const res = await fetch(apiUrl(`/api/timetable/${slotId}`), { method: 'DELETE', headers: authHeaders });
      const d = await res.json();
      if (d.success) { showToast('Slot removed.'); fetchTimetable(ttClassId); }
      else { showToast(d.message, 'error'); }
    } catch (e) { showToast('Connection error.', 'error'); }
  };

  const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

  return (
    <PortalLayout>
      <div className="rm-page">
        <div className="rm-header">
          <h1>Relationship Manager</h1>
          <p>Link parents to students, assign class teachers, and build timetable schedules.</p>
        </div>

        {/* Tabs */}
        <div className="rm-tabs">
          {[
            { id: 'parents', label: '👪 Student-Parent Linking' },
            { id: 'teachers', label: '👨‍🏫 Teacher-Class Assignment' },
            { id: 'timetable', label: '📅 Timetable Builder' }
          ].map(tab => (
            <button key={tab.id} className={`rm-tab-btn ${activeTab === tab.id ? 'rm-tab-btn--active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══════ TAB 1: PARENT-STUDENT LINKING ═══════ */}
        {activeTab === 'parents' && (
          <div>
            <div className="rm-split">
              {/* Student Picker */}
              <div className="dash-pane">
                <div className="rm-section-head">
                  <div><h3>Select Student</h3><p>Search and select a student profile</p></div>
                </div>
                <div className="rm-search-wrap">
                  <input type="text" className="rm-search-input" placeholder="Search by name or admission number..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
                </div>
                {studentsLoading ? <div className="rm-spinner"></div> : (
                  <div className="rm-result-list">
                    {students.length === 0 ? (
                      <div className="rm-empty"><span className="rm-empty-icon">🎒</span>No students found</div>
                    ) : students.map(s => (
                      <div key={s.id} className={`rm-result-item ${selectedStudent?.id === s.id ? 'rm-result-item--selected' : ''}`} onClick={() => { setSelectedStudent(s); fetchStudentDetail(s.id); }}>
                        <div>
                          <div className="rm-result-name">{s.first_name} {s.last_name}</div>
                          <div className="rm-result-meta">{s.admission_number} · {s.classes?.name || 'Unassigned'}</div>
                        </div>
                        <span className="rm-result-badge">{s.level}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Parent Picker + Linked Parents */}
              <div className="dash-pane">
                <div className="rm-section-head">
                  <div><h3>Parent Directory</h3><p>Search for a parent to link</p></div>
                </div>
                <div className="rm-search-wrap">
                  <input type="text" className="rm-search-input" placeholder="Search by name, phone, or parent ID..." value={parentSearch} onChange={e => setParentSearch(e.target.value)} />
                </div>
                {parentsLoading ? <div className="rm-spinner"></div> : (
                  <div className="rm-result-list" style={{ maxHeight: '200px' }}>
                    {parents.length === 0 ? (
                      <div className="rm-empty"><span className="rm-empty-icon">👪</span>No parents found</div>
                    ) : parents.map(p => (
                      <div key={p.id} className={`rm-result-item ${selectedParent?.id === p.id ? 'rm-result-item--selected' : ''}`} onClick={() => setSelectedParent(p)}>
                        <div>
                          <div className="rm-result-name">{p.first_name} {p.last_name}</div>
                          <div className="rm-result-meta">{p.parent_id_number} · {p.phone} · {p.relationship}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Link Action */}
                {selectedStudent && selectedParent && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.8125rem', color: '#1e293b' }}>
                      Link <strong>{selectedParent.first_name} {selectedParent.last_name}</strong> → <strong>{selectedStudent.first_name} {selectedStudent.last_name}</strong>
                    </div>
                    <button className="rm-btn rm-btn--link" onClick={handleLinkParent} disabled={linkLoading}>
                      {linkLoading ? 'Linking...' : 'Confirm Link 🔗'}
                    </button>
                  </div>
                )}

                {/* Currently Linked Parents */}
                {selectedStudent && (
                  <div className="rm-linked-panel">
                    <h4>Linked Parents for {selectedStudent.first_name}</h4>
                    {linkedParents.length === 0 ? (
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>No parents linked yet.</p>
                    ) : linkedParents.map((p, i) => (
                      <div key={i} className="rm-linked-item">
                        <div className="rm-linked-info">
                          <strong>{p.first_name} {p.last_name} ({p.relationship})</strong>
                          <span>📞 {p.phone} · 📧 {p.email}</span>
                        </div>
                        <button className="rm-btn rm-btn--unlink" onClick={() => handleUnlinkParent(p.id)}>Unlink ✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════ TAB 2: TEACHER-CLASS ASSIGNMENT ═══════ */}
        {activeTab === 'teachers' && (
          <div className="dash-pane">
            <div className="rm-section-head">
              <div><h3>Class Teacher Assignments</h3><p>Assign a teaching staff member as form teacher for each class</p></div>
            </div>
            {classesLoading ? <div className="rm-spinner"></div> : (
              <div className="students-table-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <table className="rm-class-table">
                  <thead>
                    <tr>
                      <th>Class Name</th>
                      <th>Level</th>
                      <th>Assigned Class Teacher</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.name}</strong></td>
                        <td style={{ textTransform: 'capitalize' }}>{c.level}</td>
                        <td>
                          <select value={classTeacherMap[c.id] || ''} onChange={e => setClassTeacherMap(prev => ({ ...prev, [c.id]: e.target.value }))}>
                            <option value="">— No Teacher Assigned —</option>
                            {teachers.map(t => (
                              <option key={t.id} value={t.id}>{t.first_name} {t.last_name} ({t.staff_id_number})</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button className="rm-btn rm-btn--save" onClick={() => handleSaveClassTeacher(c.id)} disabled={classSaving === c.id}>
                            {classSaving === c.id ? '...' : 'Save'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══════ TAB 3: TIMETABLE BUILDER ═══════ */}
        {activeTab === 'timetable' && (
          <div className="dash-pane">
            <div className="rm-section-head">
              <div><h3>Timetable Slot Builder</h3><p>Select a class and build its weekly lecture schedule</p></div>
            </div>

            {/* Class Selector */}
            <div className="rm-timetable-controls">
              <div>
                <label>Select Class</label>
                <select value={ttClassId} onChange={e => { setTtClassId(e.target.value); fetchTimetable(e.target.value); }}>
                  <option value="">— Choose Class —</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.level})</option>)}
                </select>
              </div>
            </div>

            {ttClassId && (
              <>
                {/* Add New Slot Form */}
                <div className="rm-add-slot-form">
                  <div>
                    <label>Day</label>
                    <select value={newSlot.day_of_week} onChange={e => setNewSlot(s => ({ ...s, day_of_week: e.target.value }))}>
                      {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>Subject</label>
                    <select value={newSlot.subject_id} onChange={e => setNewSlot(s => ({ ...s, subject_id: e.target.value }))}>
                      <option value="">Select...</option>
                      {ttSubjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                    </select>
                  </div>
                  <div>
                    <label>Teacher</label>
                    <select value={newSlot.teacher_id} onChange={e => setNewSlot(s => ({ ...s, teacher_id: e.target.value }))}>
                      <option value="">Select...</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>Start Time</label>
                    <input type="time" value={newSlot.start_time} onChange={e => setNewSlot(s => ({ ...s, start_time: e.target.value }))} />
                  </div>
                  <div>
                    <label>End Time</label>
                    <input type="time" value={newSlot.end_time} onChange={e => setNewSlot(s => ({ ...s, end_time: e.target.value }))} />
                  </div>
                  <div>
                    <label>Room (Optional)</label>
                    <input type="text" placeholder="e.g. Block A-101" value={newSlot.room} onChange={e => setNewSlot(s => ({ ...s, room: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button className="rm-btn rm-btn--link" onClick={handleAddSlot} disabled={addingSlot} style={{ padding: '0.5rem 1rem' }}>
                      {addingSlot ? 'Adding...' : 'Add Slot ＋'}
                    </button>
                  </div>
                </div>

                {/* Timetable Grid */}
                {ttLoading ? <div className="rm-spinner"></div> : (
                  <div className="rm-day-grid" style={{ marginTop: '1.5rem' }}>
                    {DAYS.map(day => {
                      const daySlots = ttSlots.filter(s => s.day_of_week?.toLowerCase() === day);
                      return (
                        <div key={day} className="rm-day-col">
                          <h4>{day}</h4>
                          {daySlots.length === 0 ? (
                            <p style={{ fontSize: '0.6875rem', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No slots</p>
                          ) : daySlots.map(slot => (
                            <div key={slot.id} className="rm-slot-card">
                              <button className="rm-slot-delete" onClick={() => handleDeleteSlot(slot.id)} title="Remove slot">✕</button>
                              <h5>{slot.subjects?.name || 'Lecture'}</h5>
                              <span>📘 {slot.subjects?.code || '—'}</span>
                              <span>👨‍🏫 {slot.staff ? `${slot.staff.first_name} ${slot.staff.last_name}` : '—'}</span>
                              <span style={{ color: '#b45309', fontWeight: 500 }}>⏰ {slot.start_time?.slice(0,5)} – {slot.end_time?.slice(0,5)}</span>
                              {slot.room && <span>🏫 {slot.room}</span>}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {!ttClassId && (
              <div className="rm-empty"><span className="rm-empty-icon">📅</span>Select a class above to view and build its timetable.</div>
            )}
          </div>
        )}

        {/* Toast */}
        {toast && <div className={`rm-toast rm-toast--${toast.type}`}>{toast.message}</div>}
      </div>
    </PortalLayout>
  );
}
