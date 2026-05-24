import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../../utils/api';
import PortalLayout from '../../../components/layout/PortalLayout';

export default function HostelManager() {
  const [hostels, setHostels] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('hostels');

  const [showHostelModal, setShowHostelModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  const [hostelForm, setHostelForm] = useState({ name: '', gender_type: 'mixed', capacity: 0, fee: 0 });
  const [assignForm, setAssignForm] = useState({ hostel_id: '', student_id: '', room_number: '' });

  const authHeaders = {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hostelRes, assignRes, studentRes] = await Promise.all([
        fetch(apiUrl('/api/hostels'), { headers: authHeaders }),
        fetch(apiUrl('/api/hostels/allocations'), { headers: authHeaders }),
        fetch(apiUrl('/api/students?limit=1000'), { headers: authHeaders })
      ]);

      const hostelData = await hostelRes.json();
      const assignData = await assignRes.json();
      const studentData = await studentRes.json();

      if (hostelData.success) setHostels(hostelData.data);
      if (assignData.success) setAllocations(assignData.data);
      if (studentData.success) setStudents(studentData.data || []);
    } catch (err) {
      console.error('Error fetching hostel data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleHostelSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/api/hostels'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(hostelForm)
      });
      const data = await res.json();
      if (data.success) {
        setHostels([...hostels, data.data]);
        setShowHostelModal(false);
        setHostelForm({ name: '', gender_type: 'mixed', capacity: 0, fee: 0 });
      } else {
        alert(data.message || 'Error creating hostel');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/api/hostels/allocations'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(assignForm)
      });
      const data = await res.json();
      if (data.success) {
        setAllocations([data.data, ...allocations]);
        setShowAssignModal(false);
      } else {
        alert(data.message || 'Error allocating student');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const handleDeleteAllocation = async (id) => {
    if(!window.confirm('Remove this student from the hostel?')) return;
    try {
      const res = await fetch(apiUrl(`/api/hostels/allocations/${id}`), {
        method: 'DELETE',
        headers: authHeaders
      });
      const data = await res.json();
      if (data.success) {
        setAllocations(allocations.filter(a => a.id !== id));
      }
    } catch (err) {
      alert('Error removing allocation');
    }
  };

  return (
    <PortalLayout>
      <div className="admin-dash text-slate-800">
        <section className="dash-hero" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="dash-hero__text">
            <span className="dash-hero__label">Logistics & Accommodation</span>
            <h1 className="dash-hero__title">Hostel Management</h1>
            <p className="dash-hero__subtitle">
              Manage boarding houses, capacities, and student allocations.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn--outline" onClick={() => setShowHostelModal(true)}>+ New Hostel</button>
            <button className="btn btn--gold" onClick={() => setShowAssignModal(true)}>+ Allocate Student</button>
          </div>
        </section>

        <div className="dash-pane">
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.25rem', gap: '1rem' }}>
            <button
              onClick={() => setActiveTab('hostels')}
              style={{
                background: 'none', border: 'none', padding: '0.75rem 0.5rem', fontSize: '0.875rem', fontWeight: 700,
                color: activeTab === 'hostels' ? '#1b2a4a' : '#94a3b8',
                borderBottom: activeTab === 'hostels' ? '2.5px solid #C9A84C' : 'none',
                cursor: 'pointer'
              }}
            >
              Hostel Directory
            </button>
            <button
              onClick={() => setActiveTab('allocations')}
              style={{
                background: 'none', border: 'none', padding: '0.75rem 0.5rem', fontSize: '0.875rem', fontWeight: 700,
                color: activeTab === 'allocations' ? '#1b2a4a' : '#94a3b8',
                borderBottom: activeTab === 'allocations' ? '2.5px solid #C9A84C' : 'none',
                cursor: 'pointer'
              }}
            >
              Student Allocations
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div className="pane-spinner" style={{ margin: '0 auto 0.5rem' }}></div>
              <p style={{ color: '#64748b', fontSize: '0.75rem' }}>Loading accommodation data...</p>
            </div>
          ) : activeTab === 'hostels' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {hostels.length === 0 ? (
                <p style={{ color: '#64748b' }}>No hostels defined.</p>
              ) : hostels.map(h => {
                const currentOccupancy = allocations.filter(a => a.hostel_id === h.id).length;
                return (
                  <div key={h.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.25rem', color: '#1e293b' }}>{h.name}</h3>
                      <span className="badge" style={{ backgroundColor: h.gender_type === 'boys' ? '#e0f2fe' : h.gender_type === 'girls' ? '#fce7f3' : '#f3f4f6', color: h.gender_type === 'boys' ? '#0369a1' : h.gender_type === 'girls' ? '#be185d' : '#374151', textTransform: 'uppercase' }}>
                        {h.gender_type}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginTop: '1rem', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#64748b' }}>Occupancy:</span>
                      <span style={{ fontWeight: 600, color: currentOccupancy >= h.capacity ? '#ef4444' : '#10b981' }}>
                        {currentOccupancy} / {h.capacity}
                      </span>
                    </div>
                    <div style={{ width: '100%', backgroundColor: '#e2e8f0', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '1rem' }}>
                      <div style={{ height: '100%', backgroundColor: currentOccupancy >= h.capacity ? '#ef4444' : '#10b981', width: `${Math.min(100, (currentOccupancy/h.capacity)*100)}%` }}></div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                      <span style={{ color: '#64748b' }}>Term Fee:</span>
                      <span style={{ fontWeight: 700, color: '#C9A84C' }}>₦{h.fee.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="students-table-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Student</th>
                    <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Class</th>
                    <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Hostel & Room</th>
                    <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.length === 0 ? (
                    <tr><td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>No students allocated.</td></tr>
                  ) : allocations.map(a => {
                    const hostel = hostels.find(h => h.id === a.hostel_id);
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
                          {hostel ? hostel.name : 'Unknown Hostel'}<br/>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'normal' }}>Room: {a.room_number || 'TBA'}</span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <button onClick={() => handleDeleteAllocation(a.id)} style={{ padding: '0.25rem 0.5rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>Remove</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Hostel Modal */}
        {showHostelModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', width: '400px', maxWidth: '90%', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Create Hostel</h2>
              <form onSubmit={handleHostelSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Hostel Name *</label>
                  <input type="text" required value={hostelForm.name} onChange={e => setHostelForm({...hostelForm, name: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} placeholder="e.g. Boys Hostel A" />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Gender Type *</label>
                  <select required value={hostelForm.gender_type} onChange={e => setHostelForm({...hostelForm, gender_type: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                    <option value="boys">Boys</option>
                    <option value="girls">Girls</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
                <div style={{ marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Capacity (Beds) *</label>
                    <input type="number" required value={hostelForm.capacity} onChange={e => setHostelForm({...hostelForm, capacity: Number(e.target.value)})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} min="1" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Termly Fee (NGN) *</label>
                    <input type="number" required value={hostelForm.fee} onChange={e => setHostelForm({...hostelForm, fee: Number(e.target.value)})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} min="0" step="1000" />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setShowHostelModal(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" className="btn btn--gold">Save Hostel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Modal */}
        {showAssignModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', width: '400px', maxWidth: '90%', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Allocate Student</h2>
              <form onSubmit={handleAssignSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Select Student *</label>
                  <select required value={assignForm.student_id} onChange={e => setAssignForm({...assignForm, student_id: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                    <option value="">-- Choose Student --</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.admission_number})</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Select Hostel *</label>
                  <select required value={assignForm.hostel_id} onChange={e => setAssignForm({...assignForm, hostel_id: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                    <option value="">-- Choose Hostel --</option>
                    {hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Room Number (Optional)</label>
                  <input type="text" value={assignForm.room_number} onChange={e => setAssignForm({...assignForm, room_number: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} placeholder="e.g. 101A" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setShowAssignModal(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" className="btn btn--gold">Allocate</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
