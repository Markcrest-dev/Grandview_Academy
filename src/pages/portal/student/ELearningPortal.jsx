import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../../utils/api';
import PortalLayout from '../../../components/layout/PortalLayout';

export default function ELearningPortal() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  const authHeaders = {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  };

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/elearning'), { headers: authHeaders });
      const data = await res.json();
      if (data.success) {
        setMaterials(data.data);
      }
    } catch (err) {
      console.error('Error fetching elearning data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  return (
    <PortalLayout>
      <div className="student-dash text-slate-800">
        <section className="dash-hero" style={{ marginBottom: '1.5rem' }}>
          <div className="dash-hero__text">
            <span className="dash-hero__label">Digital Classroom</span>
            <h1 className="dash-hero__title">E-Learning Portal</h1>
            <p className="dash-hero__subtitle">
              Access your digital study materials, video lectures, and external resources.
            </p>
          </div>
        </section>

        <div className="dash-pane">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div className="pane-spinner" style={{ margin: '0 auto 0.5rem' }}></div>
              <p style={{ color: '#64748b', fontSize: '0.75rem' }}>Loading your course materials...</p>
            </div>
          ) : materials.length === 0 ? (
            <div className="pane-empty">
              <span className="empty-icon">📚</span>
              <h4 className="empty-title">No Materials Yet</h4>
              <p className="empty-desc">Your teachers haven't uploaded any study materials for your class yet.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
              {materials.map(m => (
                <a key={m.id} href={m.file_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'transform 0.2s', cursor: 'pointer' }}
                       onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                       onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span className="badge" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', fontSize: '0.7rem' }}>
                        {m.subjects?.name}
                      </span>
                      <span style={{ fontSize: '1.5rem' }}>
                        {m.material_type === 'video' ? '🎥' : m.material_type === 'link' ? '🔗' : '📄'}
                      </span>
                    </div>
                    
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>{m.title}</h3>
                    
                    <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {m.description || 'No description provided.'}
                    </p>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                      <span>By: {m.staff?.first_name} {m.staff?.last_name}</span>
                      <span>{new Date(m.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
