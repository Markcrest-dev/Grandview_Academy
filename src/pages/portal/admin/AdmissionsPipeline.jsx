import { useState, useEffect } from 'react';
import { apiUrl } from '../../../utils/api';
import PortalLayout from '../../../components/layout/PortalLayout';
import './AdmissionsPipeline.css';

export default function AdmissionsPipeline() {
  const [applications, setApplications] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  
  // Enrollment dialog state
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [enrollError, setEnrollError] = useState(null);
  
  // Rejection dialog state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      let url = '/api/admissions/applications?limit=100';
      if (filterStatus) url += `&status=${filterStatus}`;
      if (filterLevel) url += `&level=${filterLevel}`;
      if (searchQuery) url += `&search=${searchQuery}`;

      const res = await fetch(apiUrl(url));
      const resData = await res.json();
      if (resData.success) {
        setApplications(resData.data);
      }

      // Load classes for the enrollment dialog
      const classRes = await fetch(apiUrl('/api/classes?limit=100'));
      const classData = await classRes.json();
      if (classData.success) {
        setClasses(classData.data);
      }
    } catch (err) {
      console.error('Error fetching admissions data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterStatus, filterLevel]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  // Move application to under review
  const handleMoveToReview = async (appId) => {
    try {
      const res = await fetch(apiUrl(`/api/admissions/applications/${appId}/status`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'under_review' }),
      });
      const data = await res.json();
      if (data.success) {
        loadData();
        setSelectedApp(prev => prev ? { ...prev, status: 'under_review' } : null);
      } else {
        alert(data.message || 'Failed to update application.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open rejection modal
  const handleRejectClick = () => {
    setRejectionReason('');
    setShowRejectModal(true);
  };

  // Submit rejection
  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }

    try {
      const res = await fetch(apiUrl(`/api/admissions/applications/${selectedApp.id}/status`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', rejection_reason: rejectionReason }),
      });
      const data = await res.json();
      if (data.success) {
        setShowRejectModal(false);
        loadData();
        setSelectedApp(prev => prev ? { ...prev, status: 'rejected', rejection_reason: rejectionReason } : null);
      } else {
        alert(data.message || 'Failed to reject application.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open enrollment modal
  const handleEnrollClick = () => {
    setSelectedClassId('');
    setEnrollError(null);
    setShowEnrollModal(true);
  };

  // Submit enrollment (admit)
  const handleEnrollConfirm = async () => {
    if (!selectedClassId) {
      setEnrollError('Please allocate a classroom unit.');
      return;
    }

    setLoading(true);
    setEnrollError(null);

    try {
      const res = await fetch(apiUrl(`/api/admissions/applications/${selectedApp.id}/admit`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class_id: selectedClassId }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setShowEnrollModal(false);
        alert(`Applicant enrolled successfully!\nGenerated Admission No: ${data.data.admission_number}\nCreated Account: ${data.data.email}`);
        setSelectedApp(null);
        loadData();
      } else {
        setEnrollError(data.message || 'Enrollment transaction failed.');
      }
    } catch (err) {
      console.error(err);
      setEnrollError('Connection error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Filter classes by active application level
  const filteredClasses = classes.filter(c => selectedApp && c.level === selectedApp.level);

  return (
    <PortalLayout>
      <div className="pipeline-page">
        {/* Header */}
        <section className="pipeline-header">
          <div>
            <h1 className="pipeline-title">Admissions Pipeline</h1>
            <p className="pipeline-subtitle">Review, process, and admit incoming student enrollment applications.</p>
          </div>
        </section>

        {/* Filter Controls Bar */}
        <section className="filters-bar">
          <form className="search-form" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search by name, parent email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">Search 🔍</button>
          </form>

          <div className="filter-dropdowns">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="">All Pipeline Statuses</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="filter-select"
            >
              <option value="">All Levels</option>
              <option value="primary">Primary School</option>
              <option value="secondary">Secondary School</option>
              <option value="university">University</option>
            </select>
          </div>
        </section>

        {/* Grid List View */}
        <div className="pipeline-layout">
          <div className="applications-pane">
            {loading ? (
              <div className="pipeline-loading">
                <div className="pipeline-spinner"></div>
                <p>Syncing applications feed...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="pipeline-empty">
                <span className="empty-icon">✓</span>
                <h4>No Applications Found</h4>
                <p>Try clearing filters or search coordinates to load records.</p>
              </div>
            ) : (
              <div className="applications-table-wrapper">
                <table className="pipeline-table">
                  <thead>
                    <tr>
                      <th>Applicant Name</th>
                      <th>Level</th>
                      <th>Parent Contact</th>
                      <th>Applied Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr
                        key={app.id}
                        className={`app-tr ${selectedApp?.id === app.id ? 'app-tr--selected' : ''}`}
                        onClick={() => setSelectedApp(app)}
                      >
                        <td>
                          <strong>{app.first_name} {app.last_name}</strong>
                          <span className="app-tr-sub">{app.grade_applied_for || 'General'}</span>
                        </td>
                        <td style={{ textTransform: 'capitalize' }}>{app.level}</td>
                        <td>
                          <span className="parent-tr-name">{app.parent_first_name} {app.parent_last_name}</span>
                          <span className="app-tr-sub">{app.parent_email}</span>
                        </td>
                        <td>{new Date(app.created_at).toLocaleDateString()}</td>
                        <td>
                          <span className={`status-badge status-badge--${app.status}`}>
                            {app.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Details Side Panel Drawer */}
          {selectedApp && (
            <aside className="details-panel">
              <div className="details-panel__header">
                <h3 className="panel-title">Application Profile</h3>
                <button className="panel-close" onClick={() => setSelectedApp(null)}>✕</button>
              </div>

              <div className="details-panel__body">
                {/* Avatar Banner */}
                <div className="panel-avatar-block">
                  <div className="large-avatar">
                    {(() => {
                      const email = selectedApp.parent_email || selectedApp.first_name || '';
                      let hash = 0;
                      for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
                      const idx = Math.abs(hash) % 90;
                      const g = selectedApp.gender === 'female' ? 'women' : 'men';
                      return <img src={`https://randomuser.me/api/portraits/${g}/${idx}.jpg`} alt={selectedApp.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />;
                    })()}
                  </div>
                  <h2 className="panel-name">{selectedApp.first_name} {selectedApp.last_name}</h2>
                  <span className={`status-badge status-badge--${selectedApp.status}`} style={{ margin: '0.5rem auto 0', display: 'inline-block' }}>
                    {selectedApp.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Info List */}
                <div className="panel-section">
                  <h4 className="panel-section-title">🎒 Demographic Details</h4>
                  <ul className="info-list">
                    <li><strong>Middle Name:</strong> {selectedApp.middle_name || '—'}</li>
                    <li><strong>Gender:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedApp.gender}</span></li>
                    <li><strong>Date of Birth:</strong> {selectedApp.date_of_birth}</li>
                    <li><strong>Academic Level:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedApp.level}</span></li>
                    <li><strong>Classroom Applied:</strong> {selectedApp.grade_applied_for || '—'}</li>
                    <li><strong>Previous School:</strong> {selectedApp.previous_school || '—'}</li>
                  </ul>
                </div>

                <div className="panel-section">
                  <h4 className="panel-section-title">👪 Parent & Contact details</h4>
                  <ul className="info-list">
                    <li><strong>Full Name:</strong> {selectedApp.parent_first_name} {selectedApp.parent_last_name}</li>
                    <li><strong>Relationship:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedApp.parent_relationship}</span></li>
                    <li><strong>Email Address:</strong> {selectedApp.parent_email}</li>
                    <li><strong>Phone Number:</strong> {selectedApp.parent_phone}</li>
                    <li><strong>Residential Address:</strong> <span style={{ whiteSpace: 'pre-line' }}>{selectedApp.parent_address}</span></li>
                  </ul>
                </div>

                {selectedApp.status === 'rejected' && (
                  <div className="panel-section panel-section--alert">
                    <h4 className="panel-section-title" style={{ color: '#9b1c1c' }}>⚠️ Rejection Review Detail</h4>
                    <p style={{ fontSize: '0.75rem', color: '#9b1c1c', margin: 0, lineHeight: 1.5 }}>
                      {selectedApp.rejection_reason}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              {selectedApp.status !== 'approved' && (
                <div className="details-panel__footer">
                  {selectedApp.status === 'pending' && (
                    <button
                      className="panel-btn panel-btn--primary"
                      onClick={() => handleMoveToReview(selectedApp.id)}
                    >
                      Put Under Review ⏳
                    </button>
                  )}
                  
                  {selectedApp.status !== 'rejected' && (
                    <>
                      <button
                        className="panel-btn panel-btn--gold"
                        onClick={handleEnrollClick}
                      >
                        Approve & Enroll 🎒
                      </button>
                      <button
                        className="panel-btn panel-btn--danger"
                        onClick={handleRejectClick}
                      >
                        Reject Application ✕
                      </button>
                    </>
                  )}
                </div>
              )}
            </aside>
          )}
        </div>

        {/* Enroll Approval Modal Overlay */}
        {showEnrollModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h3 className="modal-title">Approve & Admit Student</h3>
              <p className="modal-desc">
                Review and assign a classroom unit matching the student level (<strong>{selectedApp.level}</strong>) to execute student and parent profile generation.
              </p>

              {enrollError && (
                <div className="modal-error-banner" style={{ background: '#FDF2F2', color: '#9B1C1C', border: '1px solid #F8B4B4', padding: '0.75rem', borderRadius: '4px', fontSize: '0.75rem', marginBottom: '1rem' }}>
                  {enrollError}
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Select Allocated Classroom Unit</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="">-- Choose Classroom --</option>
                  {filteredClasses.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.level})</option>
                  ))}
                </select>
                {filteredClasses.length === 0 && (
                  <p style={{ fontSize: '0.6875rem', color: '#b45309', marginTop: '0.5rem' }}>
                    ⚠️ No classroom units exist for this level in the active academic year. Create a class first under settings.
                  </p>
                )}
              </div>

              <div className="modal-actions">
                <button className="btn btn--outline" onClick={() => setShowEnrollModal(false)}>Cancel</button>
                <button className="btn btn--gold" onClick={handleEnrollConfirm} disabled={filteredClasses.length === 0}>
                  Confirm Admission ✓
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal Overlay */}
        {showRejectModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h3 className="modal-title" style={{ color: '#9b1c1c' }}>Reject Admission Application</h3>
              <p className="modal-desc">
                Provide a detailed explanation. This context will be logged and communicated to the applicant.
              </p>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Explanation / Reason</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="form-input"
                  rows="4"
                  placeholder="e.g. Academic qualifications do not meet the minimum credit cutoff."
                  required
                ></textarea>
              </div>

              <div className="modal-actions">
                <button className="btn btn--outline" onClick={() => setShowRejectModal(false)}>Cancel</button>
                <button className="btn btn--danger" style={{ backgroundColor: '#ef4444', color: '#fff' }} onClick={handleRejectConfirm}>
                  Reject Application ✕
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
