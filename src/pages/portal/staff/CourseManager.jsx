import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../../utils/api';
import PortalLayout from '../../../components/layout/PortalLayout';

export default function CourseManager() {
  const [materials, setMaterials] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    class_id: '',
    subject_id: '',
    material_type: 'document',
    file_url: ''
  });

  const authHeaders = {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [matRes, classRes, subRes] = await Promise.all([
        fetch(apiUrl('/api/elearning'), { headers: authHeaders }),
        fetch(apiUrl('/api/classes'), { headers: authHeaders }),
        fetch(apiUrl('/api/subjects'), { headers: authHeaders })
      ]);

      const matData = await matRes.json();
      const classData = await classRes.json();
      const subData = await subRes.json();

      if (matData.success) setMaterials(matData.data);
      if (classData.success) setClasses(classData.data);
      if (subData.success) setSubjects(subData.data);
    } catch (err) {
      console.error('Error fetching elearning data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/api/elearning'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setMaterials([data.data, ...materials]);
        setShowModal(false);
        setForm({ title: '', description: '', class_id: '', subject_id: '', material_type: 'document', file_url: '' });
      } else {
        alert(data.message || 'Error uploading material');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Delete this material?')) return;
    try {
      const res = await fetch(apiUrl(`/api/elearning/${id}`), {
        method: 'DELETE',
        headers: authHeaders
      });
      const data = await res.json();
      if (data.success) {
        setMaterials(materials.filter(m => m.id !== id));
      }
    } catch (err) {
      alert('Error deleting material');
    }
  };

  return (
    <PortalLayout>
      <div className="admin-dash text-slate-800">
        <section className="dash-hero" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="dash-hero__text">
            <span className="dash-hero__label">Digital Classroom</span>
            <h1 className="dash-hero__title">Course Manager</h1>
            <p className="dash-hero__subtitle">
              Upload study materials, video links, and assignments for your students.
            </p>
          </div>
          <button className="btn btn--gold" onClick={() => setShowModal(true)}>+ Upload Material</button>
        </section>

        <div className="dash-pane">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div className="pane-spinner" style={{ margin: '0 auto 0.5rem' }}></div>
              <p style={{ color: '#64748b', fontSize: '0.75rem' }}>Loading course materials...</p>
            </div>
          ) : materials.length === 0 ? (
            <div className="pane-empty">
              <span className="empty-icon">📁</span>
              <h4 className="empty-title">No Materials Uploaded</h4>
              <p className="empty-desc">Click "Upload Material" to share resources with your class.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
              {materials.map(m => (
                <div key={m.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.7rem' }}>
                      {m.classes?.name} | {m.subjects?.name}
                    </span>
                    <span style={{ fontSize: '1.25rem' }}>
                      {m.material_type === 'video' ? '🎥' : m.material_type === 'link' ? '🔗' : '📄'}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>{m.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {m.description || 'No description provided.'}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                    <a href={m.file_url} target="_blank" rel="noopener noreferrer" style={{ color: '#C9A84C', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
                      Open Link →
                    </a>
                    <button onClick={() => handleDelete(m.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.875rem', cursor: 'pointer', padding: '0.25rem' }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Modal */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', width: '450px', maxWidth: '90%', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Upload E-Learning Material</h2>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Title *</label>
                  <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} placeholder="e.g. Chapter 4 Math Notes" />
                </div>
                
                <div style={{ marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Class *</label>
                    <select required value={form.class_id} onChange={e => setForm({...form, class_id: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                      <option value="">-- Select Class --</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Subject *</label>
                    <select required value={form.subject_id} onChange={e => setForm({...form, subject_id: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                      <option value="">-- Select Subject --</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Type *</label>
                    <select required value={form.material_type} onChange={e => setForm({...form, material_type: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                      <option value="document">Document / PDF</option>
                      <option value="video">Video Lecture</option>
                      <option value="link">External Link</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>URL / Link *</label>
                    <input type="url" required value={form.file_url} onChange={e => setForm({...form, file_url: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} placeholder="https://..." />
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Description</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', resize: 'vertical' }}></textarea>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" className="btn btn--gold">Publish Material</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
