import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../../utils/api';
import PortalLayout from '../../../components/layout/PortalLayout';

export default function VisitorLog() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    purpose: '',
    host_name: ''
  });

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/visitors'), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setVisitors(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch visitors', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignOut = async (id) => {
    try {
      const res = await fetch(apiUrl(`/api/visitors/${id}/sign-out`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setVisitors(visitors.map(v => v.id === id ? { ...v, status: 'signed_out', sign_out_time: new Date().toISOString() } : v));
      } else {
        alert(data.message || 'Failed to sign out visitor');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/api/visitors'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setVisitors([data.data, ...visitors]);
        setShowModal(false);
        setFormData({ name: '', phone: '', purpose: '', host_name: '' });
      } else {
        alert(data.message || 'Failed to log visitor');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  return (
    <PortalLayout>
      <div className="admin-dash text-slate-800">
        <section className="dash-hero" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="dash-hero__text">
            <span className="dash-hero__label">Security & Operations</span>
            <h1 className="dash-hero__title">Visitor Log</h1>
            <p className="dash-hero__subtitle">
              Monitor and record campus guests and their visitation purpose.
            </p>
          </div>
          <button className="btn btn--gold" onClick={() => setShowModal(true)}>
            + Log New Visitor
          </button>
        </section>

        <div className="dash-pane">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div className="pane-spinner" style={{ margin: '0 auto 0.5rem' }}></div>
              <p style={{ color: '#64748b', fontSize: '0.75rem' }}>Loading visitor records...</p>
            </div>
          ) : visitors.length === 0 ? (
            <div className="pane-empty">
              <span className="empty-icon" style={{ backgroundColor: '#f8fafc', color: '#64748b' }}>📝</span>
              <h4 className="empty-title">No Visitors Logged</h4>
              <p className="empty-desc">There are no visitor records available.</p>
            </div>
          ) : (
            <div className="students-table-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Visitor Name</th>
                    <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Host / Purpose</th>
                    <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Sign In Time</th>
                    <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Status / Sign Out</th>
                  </tr>
                </thead>
                <tbody>
                  {visitors.map(visitor => (
                    <tr key={visitor.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
                        {visitor.name}
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'normal' }}>{visitor.phone || 'No phone'}</div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: '#334155' }}>
                        <strong>Host:</strong> {visitor.host_name}<br />
                        <span style={{ color: '#64748b' }}>{visitor.purpose}</span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: '#64748b' }}>
                        {new Date(visitor.sign_in_time).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        {visitor.status === 'active' ? (
                          <button 
                            onClick={() => handleSignOut(visitor.id)}
                            style={{ padding: '0.4rem 0.75rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                          >
                            Sign Out
                          </button>
                        ) : (
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Signed Out:<br/>{new Date(visitor.sign_out_time).toLocaleTimeString()}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* New Visitor Modal */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', width: '400px', maxWidth: '90%', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#1e293b' }}>Log New Visitor</h2>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Full Name *</label>
                  <input type="text" name="name" required value={formData.name} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Phone Number</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Host Name (Person to visit) *</label>
                  <input type="text" name="host_name" required value={formData.host_name} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Purpose of Visit *</label>
                  <textarea name="purpose" required value={formData.purpose} onChange={handleInputChange} rows={3} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', resize: 'vertical' }}></textarea>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" className="btn btn--gold">Save Visitor</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
