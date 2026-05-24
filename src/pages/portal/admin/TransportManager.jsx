import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../../utils/api';
import PortalLayout from '../../../components/layout/PortalLayout';

export default function TransportManager() {
  const [routes, setRoutes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]); // For assignment dropdown
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('routes'); // routes, assignments

  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  const [routeForm, setRouteForm] = useState({ name: '', vehicle_details: '', driver_name: '', driver_phone: '', fee: 0 });
  const [assignForm, setAssignForm] = useState({ route_id: '', student_id: '' });

  const authHeaders = {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [routeRes, assignRes, studentRes] = await Promise.all([
        fetch(apiUrl('/api/transport/routes'), { headers: authHeaders }),
        fetch(apiUrl('/api/transport/assignments'), { headers: authHeaders }),
        fetch(apiUrl('/api/students?limit=1000'), { headers: authHeaders })
      ]);

      const routeData = await routeRes.json();
      const assignData = await assignRes.json();
      const studentData = await studentRes.json();

      if (routeData.success) setRoutes(routeData.data);
      if (assignData.success) setAssignments(assignData.data);
      if (studentData.success) setStudents(studentData.data || []);
    } catch (err) {
      console.error('Error fetching transport data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRouteSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/api/transport/routes'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(routeForm)
      });
      const data = await res.json();
      if (data.success) {
        setRoutes([...routes, data.data]);
        setShowRouteModal(false);
        setRouteForm({ name: '', vehicle_details: '', driver_name: '', driver_phone: '', fee: 0 });
      } else {
        alert(data.message || 'Error creating route');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/api/transport/assignments'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(assignForm)
      });
      const data = await res.json();
      if (data.success) {
        setAssignments([data.data, ...assignments]);
        setShowAssignModal(false);
      } else {
        alert(data.message || 'Error assigning student');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const handleDeleteAssignment = async (id) => {
    if(!window.confirm('Remove this student from the route?')) return;
    try {
      const res = await fetch(apiUrl(`/api/transport/assignments/${id}`), {
        method: 'DELETE',
        headers: authHeaders
      });
      const data = await res.json();
      if (data.success) {
        setAssignments(assignments.filter(a => a.id !== id));
      }
    } catch (err) {
      alert('Error removing assignment');
    }
  };

  return (
    <PortalLayout>
      <div className="admin-dash text-slate-800">
        <section className="dash-hero" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="dash-hero__text">
            <span className="dash-hero__label">Logistics</span>
            <h1 className="dash-hero__title">Transport Management</h1>
            <p className="dash-hero__subtitle">
              Manage school bus routes and student transportation assignments.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn--outline" onClick={() => setShowRouteModal(true)}>+ New Route</button>
            <button className="btn btn--gold" onClick={() => setShowAssignModal(true)}>+ Assign Student</button>
          </div>
        </section>

        <div className="dash-pane">
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.25rem', gap: '1rem' }}>
            <button
              onClick={() => setActiveTab('routes')}
              style={{
                background: 'none', border: 'none', padding: '0.75rem 0.5rem', fontSize: '0.875rem', fontWeight: 700,
                color: activeTab === 'routes' ? '#1b2a4a' : '#94a3b8',
                borderBottom: activeTab === 'routes' ? '2.5px solid #C9A84C' : 'none',
                cursor: 'pointer'
              }}
            >
              Bus Routes
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              style={{
                background: 'none', border: 'none', padding: '0.75rem 0.5rem', fontSize: '0.875rem', fontWeight: 700,
                color: activeTab === 'assignments' ? '#1b2a4a' : '#94a3b8',
                borderBottom: activeTab === 'assignments' ? '2.5px solid #C9A84C' : 'none',
                cursor: 'pointer'
              }}
            >
              Student Roster
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div className="pane-spinner" style={{ margin: '0 auto 0.5rem' }}></div>
              <p style={{ color: '#64748b', fontSize: '0.75rem' }}>Loading logistics data...</p>
            </div>
          ) : activeTab === 'routes' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {routes.length === 0 ? (
                <p style={{ color: '#64748b' }}>No routes defined.</p>
              ) : routes.map(r => (
                <div key={r.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', background: '#f8fafc' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.25rem', color: '#1e293b' }}>{r.name}</h3>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '1rem' }}>Vehicle: {r.vehicle_details || 'N/A'}</div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#64748b' }}>Driver:</span>
                    <span style={{ fontWeight: 600 }}>{r.driver_name || 'Unassigned'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#64748b' }}>Phone:</span>
                    <span style={{ fontWeight: 600 }}>{r.driver_phone || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                    <span style={{ color: '#64748b' }}>Term Fee:</span>
                    <span style={{ fontWeight: 700, color: '#C9A84C' }}>₦{r.fee.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="students-table-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Student</th>
                    <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Class</th>
                    <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Route</th>
                    <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.length === 0 ? (
                    <tr><td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>No students assigned to transport.</td></tr>
                  ) : assignments.map(a => {
                    const route = routes.find(rt => rt.id === a.route_id);
                    return (
                      <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', fontWeight: 600 }}>
                          {a.students?.first_name} {a.students?.last_name}
                          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'normal' }}>{a.students?.admission_number}</div>
                        </td>
                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem' }}>
                          {a.students?.classes?.name || 'N/A'}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', fontWeight: 600 }}>
                          {route ? route.name : 'Unknown Route'}
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <button onClick={() => handleDeleteAssignment(a.id)} style={{ padding: '0.25rem 0.5rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>Remove</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Route Modal */}
        {showRouteModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', width: '400px', maxWidth: '90%', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Create Bus Route</h2>
              <form onSubmit={handleRouteSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Route Name *</label>
                  <input type="text" required value={routeForm.name} onChange={e => setRouteForm({...routeForm, name: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} placeholder="e.g. Route 1: Island" />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Vehicle Details</label>
                  <input type="text" value={routeForm.vehicle_details} onChange={e => setRouteForm({...routeForm, vehicle_details: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} placeholder="e.g. Toyota Coaster - ABC 123" />
                </div>
                <div style={{ marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Driver Name</label>
                    <input type="text" value={routeForm.driver_name} onChange={e => setRouteForm({...routeForm, driver_name: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Driver Phone</label>
                    <input type="text" value={routeForm.driver_phone} onChange={e => setRouteForm({...routeForm, driver_phone: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                  </div>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Termly Fee (NGN) *</label>
                  <input type="number" required value={routeForm.fee} onChange={e => setRouteForm({...routeForm, fee: Number(e.target.value)})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} min="0" step="1000" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setShowRouteModal(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" className="btn btn--gold">Save Route</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Modal */}
        {showAssignModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', width: '400px', maxWidth: '90%', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Assign Student to Route</h2>
              <form onSubmit={handleAssignSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Select Student *</label>
                  <select required value={assignForm.student_id} onChange={e => setAssignForm({...assignForm, student_id: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                    <option value="">-- Choose Student --</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.admission_number})</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Select Route *</label>
                  <select required value={assignForm.route_id} onChange={e => setAssignForm({...assignForm, route_id: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                    <option value="">-- Choose Route --</option>
                    {routes.map(r => <option key={r.id} value={r.id}>{r.name} - ₦{r.fee.toLocaleString()}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setShowAssignModal(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" className="btn btn--gold">Assign</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
