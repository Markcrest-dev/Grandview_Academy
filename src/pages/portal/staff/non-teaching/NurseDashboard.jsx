import { useState, useEffect } from 'react';

export default function NurseDashboard() {
  const [records, setRecords] = useState([]);
  const [visits, setVisits] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Tab switcher
  const [activeFormTab, setActiveFormTab] = useState('log_visit'); // 'log_visit' or 'update_chart'

  // Update chart form state
  const [chartForm, setChartForm] = useState({
    admission_number: '',
    blood_group: 'O+',
    genotype: 'AA',
    allergies: '',
    chronic_conditions: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_history: ''
  });

  // Log visit form state
  const [visitForm, setVisitForm] = useState({
    admission_number: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    nurse_remarks: ''
  });

  const token = localStorage.getItem('token');
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const loadMedicalData = async () => {
    setLoading(true);
    try {
      const recordsRes = await fetch('/api/medical/records', { headers: authHeaders });
      const recordsData = await recordsRes.json();
      if (recordsData.success) {
        setRecords(recordsData.data);
      }

      const visitsRes = await fetch('/api/medical/visits', { headers: authHeaders });
      const visitsData = await visitsRes.json();
      if (visitsData.success) {
        setVisits(visitsData.data);
      }
    } catch (err) {
      console.error('Medical loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicalData();
  }, []);

  const handleUpdateChart = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetch('/api/medical/records', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(chartForm)
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: data.message, type: 'success' });
        await loadMedicalData();
        setSelectedRecord(data.data);
        setActiveFormTab('log_visit');
      } else {
        setMessage({ text: data.message || 'Failed to update medical chart.', type: 'danger' });
      }
    } catch (err) {
      setMessage({ text: 'Unexpected connection error occurred.', type: 'danger' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogVisit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetch('/api/medical/visits', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(visitForm)
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: data.message, type: 'success' });
        await loadMedicalData();
        setVisitForm({ admission_number: '', symptoms: '', diagnosis: '', treatment: '', nurse_remarks: '' });
      } else {
        setMessage({ text: data.message || 'Failed to log sickbay visit.', type: 'danger' });
      }
    } catch (err) {
      setMessage({ text: 'Unexpected connection error occurred.', type: 'danger' });
    } finally {
      setSubmitting(false);
    }
  };

  const selectStudentChart = (record) => {
    setSelectedRecord(record);
    setChartForm({
      admission_number: record.admission_number,
      blood_group: record.blood_group,
      genotype: record.genotype,
      allergies: record.allergies,
      chronic_conditions: record.chronic_conditions,
      emergency_contact_name: record.emergency_contact_name,
      emergency_contact_phone: record.emergency_contact_phone,
      medical_history: record.medical_history
    });
    setVisitForm(prev => ({ ...prev, admission_number: record.admission_number }));
  };

  // Filter records
  const filteredRecords = records.filter(rec => {
    const q = searchQuery.toLowerCase();
    return (
      rec.student_name.toLowerCase().includes(q) ||
      rec.admission_number.toLowerCase().includes(q)
    );
  });

  return (
    <div className="admin-dash text-slate-800" style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Overview Hero Section */}
      <section className="dash-hero" style={{ marginBottom: '1.5rem' }}>
        <div className="dash-hero__text">
          <span className="dash-hero__label">Nurse Operations</span>
          <h1 className="dash-hero__title">Clinic Room & Sickbay Center</h1>
          <p className="dash-hero__subtitle">
            Manage student clinical files, update blood/genotypes demographics, and register clinic sickbay logs.
          </p>
        </div>
      </section>

      {/* Analytics Summary */}
      <section className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="metric-card">
          <span className="metric-icon">🏥</span>
          <div className="metric-body">
            <span className="metric-value">{records.length}</span>
            <span className="metric-label">Active Clinical Files</span>
          </div>
        </div>

        <div className="metric-card metric-card--highlight">
          <span className="metric-icon">🚨</span>
          <div className="metric-body">
            <span className="metric-value">
              {records.filter(r => r.chronic_conditions && r.chronic_conditions !== 'None').length}
            </span>
            <span className="metric-label">Monitored Conditions</span>
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-icon">🌡️</span>
          <div className="metric-body">
            <span className="metric-value">{visits.length}</span>
            <span className="metric-label">Logged Sickbay Visits</span>
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-icon">📅</span>
          <div className="metric-body">
            <span className="metric-value" style={{ fontSize: '1rem', fontWeight: 'bold' }}>
              {visits.length > 0 ? new Date(visits[0].visit_date).toLocaleDateString() : '—'}
            </span>
            <span className="metric-label">Last Recorded Visit Date</span>
          </div>
        </div>
      </section>

      {message.text && (
        <div className={`badge badge--${message.type === 'success' ? 'approved' : 'rejected'}`} style={{ padding: '0.875rem', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 600, display: 'block', width: '100%', marginBottom: '1.5rem', borderLeft: '4px solid' }}>
          {message.text}
        </div>
      )}

      {/* Main Workspace Grid */}
      <div className="dash-main-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '1.5rem' }}>
        
        {/* Sickbay Action Panel */}
        <div className="dash-pane" style={{ height: 'fit-content' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
            <button
              onClick={() => setActiveFormTab('log_visit')}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: activeFormTab === 'log_visit' ? 'var(--color-navy, #1b2a4a)' : '#94a3b8',
                borderBottom: activeFormTab === 'log_visit' ? '2.5px solid var(--color-gold, #C9A84C)' : 'none',
                cursor: 'pointer'
              }}
            >
              Log Sickbay Visit
            </button>
            <button
              onClick={() => setActiveFormTab('update_chart')}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: activeFormTab === 'update_chart' ? 'var(--color-navy, #1b2a4a)' : '#94a3b8',
                borderBottom: activeFormTab === 'update_chart' ? '2.5px solid var(--color-gold, #C9A84C)' : 'none',
                cursor: 'pointer'
              }}
            >
              Update Medical File
            </button>
          </div>

          {activeFormTab === 'log_visit' ? (
            /* LOG SICKBAY VISIT */
            <form onSubmit={handleLogVisit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Student Admission No</label>
                <input
                  type="text"
                  placeholder="e.g. GA/2024/001"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none' }}
                  value={visitForm.admission_number}
                  onChange={(e) => setVisitForm(v => ({ ...v, admission_number: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Symptoms Recorded</label>
                <input
                  type="text"
                  placeholder="e.g. High fever, headache, minor nausea"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none' }}
                  value={visitForm.symptoms}
                  onChange={(e) => setVisitForm(v => ({ ...v, symptoms: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Clinical Diagnosis</label>
                <input
                  type="text"
                  placeholder="e.g. Suspected malaria, mild heat exhaustion"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none' }}
                  value={visitForm.diagnosis}
                  onChange={(e) => setVisitForm(v => ({ ...v, diagnosis: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Treatment Administered</label>
                <input
                  type="text"
                  placeholder="e.g. Dispensed Paracetamol 500mg, 1 hour rest in sickbay"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none' }}
                  value={visitForm.treatment}
                  onChange={(e) => setVisitForm(v => ({ ...v, treatment: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Remarks</label>
                <textarea
                  placeholder="Additional observations or parent call instructions..."
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none', height: '60px', resize: 'none' }}
                  value={visitForm.nurse_remarks}
                  onChange={(e) => setVisitForm(v => ({ ...v, nurse_remarks: e.target.value }))}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn--gold"
                style={{ width: '100%', padding: '0.75rem', fontWeight: 700 }}
              >
                {submitting ? 'Registering Visit...' : 'Register Sickbay Entry 🌡️'}
              </button>
            </form>
          ) : (
            /* UPDATE MEDICAL CHART */
            <form onSubmit={handleUpdateChart} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Student Admission No</label>
                <input
                  type="text"
                  placeholder="e.g. GA/2024/001"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none' }}
                  value={chartForm.admission_number}
                  onChange={(e) => setChartForm(c => ({ ...c, admission_number: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Blood Group</label>
                  <select
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none' }}
                    value={chartForm.blood_group}
                    onChange={(e) => setChartForm(c => ({ ...c, blood_group: e.target.value }))}
                    required
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Genotype</label>
                  <select
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none' }}
                    value={chartForm.genotype}
                    onChange={(e) => setChartForm(c => ({ ...c, genotype: e.target.value }))}
                    required
                  >
                    {['AA', 'AS', 'SS', 'AC'].map(gt => (
                      <option key={gt} value={gt}>{gt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Allergies</label>
                <input
                  type="text"
                  placeholder="e.g. Peanuts, Aspirin, Penicillin"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none' }}
                  value={chartForm.allergies}
                  onChange={(e) => setChartForm(c => ({ ...c, allergies: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Chronic / Monitored Conditions</label>
                <input
                  type="text"
                  placeholder="e.g. Asthma, Diabetes, None"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none' }}
                  value={chartForm.chronic_conditions}
                  onChange={(e) => setChartForm(c => ({ ...c, chronic_conditions: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '0.5rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Emerg Contact Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Samuel Okafor"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.8125rem', outline: 'none' }}
                    value={chartForm.emergency_contact_name}
                    onChange={(e) => setChartForm(c => ({ ...c, emergency_contact_name: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Emerg Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +234803..."
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.8125rem', outline: 'none' }}
                    value={chartForm.emergency_contact_phone}
                    onChange={(e) => setChartForm(c => ({ ...c, emergency_contact_phone: e.target.value }))}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn--navy"
                style={{ width: '100%', padding: '0.75rem', fontWeight: 700 }}
              >
                {submitting ? 'Saving Chart...' : 'Commit Medical File 📝'}
              </button>
            </form>
          )}
        </div>

        {/* Student charts list & sickbay room logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Charts Index */}
          <div className="dash-pane">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 className="dash-pane__title" style={{ margin: 0 }}>Student Health Index</h3>
              <input
                type="text"
                placeholder="Search name or ID..."
                style={{ padding: '0.375rem 0.75rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.8125rem', outline: 'none', width: '200px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <div className="pane-spinner" style={{ margin: '0 auto' }}></div>
              </div>
            ) : filteredRecords.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>No records matches.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto' }}>
                {filteredRecords.map(rec => (
                  <div
                    key={rec.id}
                    onClick={() => selectStudentChart(rec)}
                    style={{
                      padding: '0.75rem',
                      background: selectedRecord?.id === rec.id ? '#fffbeb' : '#f8fafc',
                      border: selectedRecord?.id === rec.id ? '1px solid var(--color-gold, #C9A84C)' : '1px solid #e2e8f0',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <h4 style={{ fontSize: '0.8125rem', fontWeight: 'bold', color: '#1e293b', margin: '0 0 0.25rem' }}>{rec.student_name}</h4>
                    <p style={{ fontSize: '0.6875rem', color: '#64748b', margin: '0 0 0.5rem' }}>ID: {rec.admission_number}</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.65rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: '3px', fontWeight: 'bold' }}>BG: {rec.blood_group}</span>
                      <span style={{ fontSize: '0.65rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: '3px', fontWeight: 'bold' }}>GT: {rec.genotype}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visit entries list */}
          <div className="dash-pane" style={{ overflowX: 'auto' }}>
            <h3 className="dash-pane__title" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              Sickbay Clinic Room Log
            </h3>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <div className="pane-spinner" style={{ margin: '0 auto' }}></div>
              </div>
            ) : visits.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>No clinic visits logged yet.</p>
            ) : (
              <div className="students-table-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '0.75rem', fontSize: '0.7rem', textTransform: 'uppercase', color: '#475569' }}>Student / Time</th>
                      <th style={{ padding: '0.75rem', fontSize: '0.7rem', textTransform: 'uppercase', color: '#475569' }}>Diagnosis</th>
                      <th style={{ padding: '0.75rem', fontSize: '0.7rem', textTransform: 'uppercase', color: '#475569' }}>Treatment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visits.map(v => (
                      <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem', fontSize: '0.75rem' }}>
                          <strong style={{ color: '#1e293b', display: 'block' }}>{v.student_name}</strong>
                          <span style={{ fontSize: '0.625rem', color: '#64748b' }}>{new Date(v.visit_date).toLocaleString()}</span>
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#475569' }}>
                          <strong style={{ color: '#0f172a' }}>{v.diagnosis}</strong>
                          <span style={{ fontSize: '0.65rem', color: '#dc2626', display: 'block', fontStyle: 'italic' }}>Symptoms: {v.symptoms}</span>
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#475569' }}>
                          {v.treatment}
                          {v.nurse_remarks && (
                            <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', borderTop: '1px dashed #e2e8f0', marginTop: '0.25rem', paddingTop: '0.125rem' }}>
                              Obs: {v.nurse_remarks}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
