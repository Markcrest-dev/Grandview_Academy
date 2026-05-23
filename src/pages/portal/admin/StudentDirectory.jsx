import { useState, useEffect } from 'react';
import PortalLayout from '../../../components/layout/PortalLayout';
import './StudentDirectory.css';

export default function StudentDirectory() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Edit Profile modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    date_of_birth: '',
    gender: '',
    level: '',
    current_class_id: '',
    status: ''
  });
  const [editError, setEditError] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      let url = '/api/students?limit=100';
      if (filterClass) url += `&class_id=${filterClass}`;
      if (filterLevel) url += `&level=${filterLevel}`;
      if (filterStatus) url += `&status=${filterStatus}`;
      if (searchQuery) url += `&search=${searchQuery}`;

      const res = await fetch(url);
      const resData = await res.json();
      if (resData.success) {
        setStudents(resData.data);
      }

      // Load classes for filtering and re-assignments
      const classRes = await fetch('/api/classes?limit=100');
      const classData = await classRes.json();
      if (classData.success) {
        setClasses(classData.data);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterClass, filterLevel, filterStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  // View student detail
  const handleSelectStudent = async (studentId) => {
    try {
      const res = await fetch(`/api/students/${studentId}`);
      const resData = await res.json();
      if (resData.success) {
        setSelectedStudent(resData.data);
      } else {
        alert(resData.message || 'Failed to retrieve student profile.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open edit modal
  const handleEditClick = (student) => {
    setEditFormData({
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      middle_name: student.middle_name || '',
      date_of_birth: student.date_of_birth || '',
      gender: student.gender || '',
      level: student.level || '',
      current_class_id: student.current_class_id || '',
      status: student.status || ''
    });
    setEditError(null);
    setShowEditModal(true);
  };

  // Save edit changes
  const handleEditConfirm = async () => {
    const { first_name, last_name, level, date_of_birth, gender, status } = editFormData;
    if (!first_name || !last_name || !level || !date_of_birth || !gender || !status) {
      setEditError('Please fill in all required fields.');
      return;
    }

    setEditLoading(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/students/${selectedStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      const resData = await res.json();

      if (res.ok && resData.success) {
        setShowEditModal(false);
        // Refresh details & list
        handleSelectStudent(selectedStudent.id);
        loadData();
      } else {
        setEditError(resData.message || 'Failed to update student profile.');
      }
    } catch (err) {
      console.error(err);
      setEditError('Connection error occurred.');
    } finally {
      setEditLoading(false);
    }
  };

  // Filter classes by selected level in edit modal
  const filteredClasses = classes.filter(c => c.level === editFormData.level);

  return (
    <PortalLayout>
      <div className="directory-page">
        {/* Header */}
        <section className="directory-header">
          <div>
            <h1 className="directory-title">Student Directory</h1>
            <p className="directory-subtitle">Monitor institutional student enrollment data, update classes, and inspect profile logs.</p>
          </div>
        </section>

        {/* Filters Controls */}
        <section className="filters-bar">
          <form className="search-form" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search by name, admission no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">Search 🔍</button>
          </form>

          <div className="filter-dropdowns">
            <select
              value={filterLevel}
              onChange={(e) => {
                setFilterLevel(e.target.value);
                setFilterClass(''); // reset class filter when level changes
              }}
              className="filter-select"
            >
              <option value="">All Levels</option>
              <option value="primary">Primary School</option>
              <option value="secondary">Secondary School</option>
              <option value="university">University</option>
            </select>

            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="filter-select"
            >
              <option value="">All Classes</option>
              {classes
                .filter(c => !filterLevel || c.level === filterLevel)
                .map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="graduated">Graduated</option>
              <option value="suspended">Suspended</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>
        </section>

        {/* Directory Layout */}
        <div className="directory-layout">
          <div className="students-pane">
            {loading ? (
              <div className="directory-loading">
                <div className="directory-spinner"></div>
                <p>Syncing active records...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="directory-empty">
                <span className="empty-icon">🎒</span>
                <h4>No Student Profiles Found</h4>
                <p>Try modifying search query or criteria to locate records.</p>
              </div>
            ) : (
              <div className="students-table-wrapper">
                <table className="directory-table">
                  <thead>
                    <tr>
                      <th>Admission No.</th>
                      <th>Full Name</th>
                      <th>Level</th>
                      <th>Class</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr
                        key={student.id}
                        className={`student-tr ${selectedStudent?.id === student.id ? 'student-tr--selected' : ''}`}
                        onClick={() => handleSelectStudent(student.id)}
                      >
                        <td><strong>{student.admission_number}</strong></td>
                        <td>
                          {student.first_name} {student.last_name}
                          {student.middle_name && <span className="m-name"> ({student.middle_name})</span>}
                        </td>
                        <td style={{ textTransform: 'capitalize' }}>{student.level}</td>
                        <td>{student.classes ? student.classes.name : 'Unassigned'}</td>
                        <td>
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

          {/* Details Drawer */}
          {selectedStudent && (
            <aside className="details-panel">
              <div className="details-panel__header">
                <h3 className="panel-title">Student Profile Folder</h3>
                <button className="panel-close" onClick={() => setSelectedStudent(null)}>✕</button>
              </div>

              <div className="details-panel__body">
                {/* Profile Header */}
                <div className="panel-avatar-block">
                  <div className="large-avatar">
                    {(() => {
                      const seed = encodeURIComponent(selectedStudent.users?.email || selectedStudent.admission_number || 'student');
                      const imgUrl = selectedStudent.photo_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&skinColor=brown,darkBrown,black`;
                      return <img src={imgUrl} alt={selectedStudent.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />;
                    })()}
                  </div>
                  <h2 className="panel-name">{selectedStudent.first_name} {selectedStudent.last_name}</h2>
                  <span className="panel-sub">{selectedStudent.admission_number}</span>
                  <div style={{ marginTop: '0.5rem' }}>
                    <span className={`status-badge status-badge--${selectedStudent.status}`}>
                      {selectedStudent.status}
                    </span>
                  </div>
                </div>

                {/* Profile Info Sections */}
                <div className="panel-section">
                  <h4 className="panel-section-title">🎒 Profile Details</h4>
                  <ul className="info-list">
                    <li><strong>Middle Name:</strong> {selectedStudent.middle_name || '—'}</li>
                    <li><strong>Gender:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedStudent.gender}</span></li>
                    <li><strong>Date of Birth:</strong> {selectedStudent.date_of_birth}</li>
                    <li><strong>School Level:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedStudent.level}</span></li>
                    <li><strong>Current Class:</strong> {selectedStudent.classes ? selectedStudent.classes.name : 'Unassigned'}</li>
                    <li><strong>Registration Date:</strong> {selectedStudent.admission_date}</li>
                    <li><strong>Account Login:</strong> {selectedStudent.users?.email || '—'}</li>
                  </ul>
                </div>

                <div className="panel-section">
                  <h4 className="panel-section-title">👪 Linked Family / Parents</h4>
                  {selectedStudent.parents && selectedStudent.parents.length > 0 ? (
                    selectedStudent.parents.map((parent, i) => (
                      <div key={i} className="linked-parent-card">
                        <h5 className="parent-card-name">{parent.first_name} {parent.last_name} ({parent.relationship})</h5>
                        <p className="parent-card-meta">📞 {parent.phone}</p>
                        <p className="parent-card-meta">📧 {parent.email}</p>
                        <p className="parent-card-meta">🏠 {parent.address}</p>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>No parents linked to this student profile folder.</p>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="details-panel__footer">
                <button
                  className="panel-btn panel-btn--gold"
                  onClick={() => handleEditClick(selectedStudent)}
                >
                  Edit Profile folder ✏️
                </button>
              </div>
            </aside>
          )}
        </div>

        {/* Edit Profile Modal Dialog */}
        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: '600px' }}>
              <h3 className="modal-title">Edit Student Profile Folder</h3>
              <p className="modal-desc">Modify demographic registry records and class coordinate mappings.</p>

              {editError && (
                <div className="modal-error-banner" style={{ background: '#FDF2F2', color: '#9B1C1C', border: '1px solid #F8B4B4', padding: '0.75rem', borderRadius: '4px', fontSize: '0.75rem', marginBottom: '1rem' }}>
                  {editError}
                </div>
              )}

              <div className="edit-form-grid">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    value={editFormData.first_name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    value={editFormData.last_name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Middle Name</label>
                  <input
                    type="text"
                    value={editFormData.middle_name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, middle_name: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, gender: e.target.value }))}
                    className="form-input"
                    required
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    value={editFormData.date_of_birth}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Academic Level</label>
                  <select
                    value={editFormData.level}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, level: e.target.value, current_class_id: '' }))}
                    className="form-input"
                    required
                  >
                    <option value="primary">Primary School</option>
                    <option value="secondary">Secondary School</option>
                    <option value="university">University</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Current Class allocation</label>
                  <select
                    value={editFormData.current_class_id}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, current_class_id: e.target.value }))}
                    className="form-input"
                  >
                    <option value="">-- Unassigned --</option>
                    {filteredClasses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Profile Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="form-input"
                    required
                  >
                    <option value="active">Active</option>
                    <option value="graduated">Graduated</option>
                    <option value="suspended">Suspended</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '2rem' }}>
                <button className="btn btn--outline" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button className="btn btn--gold" onClick={handleEditConfirm} disabled={editLoading}>
                  {editLoading ? 'Saving...' : 'Save Profile ✓'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
