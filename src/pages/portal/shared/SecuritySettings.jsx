import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import PortalLayout from '../../../components/layout/PortalLayout';

export default function SecuritySettings() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('devices');

  const authHeaders = {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  };

  useEffect(() => {
    async function loadSecurityData() {
      setLoading(true);
      try {
        // Load sessions
        const sessRes = await fetch(apiUrl('/api/auth/sessions'), { headers: authHeaders });
        const sessData = await sessRes.json();
        if (sessData.success) {
          setSessions(sessData.data);
        }

        // Load audit logs (Admin only, or all if we want users to see their own)
        if (user?.role === 'admin') {
          const logRes = await fetch(apiUrl('/api/auth/audit-logs'), { headers: authHeaders });
          const logData = await logRes.json();
          if (logData.success) {
            setAuditLogs(logData.data);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSecurityData();
  }, [user]);

  const handleRevokeSession = async (tokenId) => {
    if (!window.confirm('Are you sure you want to revoke this session? The device will be logged out immediately.')) return;
    
    try {
      const res = await fetch(apiUrl(`/api/auth/sessions/${tokenId}`), {
        method: 'DELETE',
        headers: authHeaders
      });
      const data = await res.json();
      if (data.success) {
        setSessions(sessions.filter(s => s.token_id !== tokenId));
      } else {
        alert(data.message || 'Failed to revoke session');
      }
    } catch (err) {
      alert('Network error occurred while revoking session.');
    }
  };

  return (
    <PortalLayout>
      <div className="admin-dash text-slate-800">
        <section className="dash-hero" style={{ marginBottom: '1.5rem' }}>
          <div className="dash-hero__text">
            <span className="dash-hero__label">Security & Privacy</span>
            <h1 className="dash-hero__title">Account Security Management</h1>
            <p className="dash-hero__subtitle">
              Manage your active devices and monitor recent account activity.
            </p>
          </div>
        </section>

        <div className="dash-main-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="dash-pane">
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.25rem', gap: '1rem' }}>
              <button
                onClick={() => setActiveTab('devices')}
                style={{
                  background: 'none', border: 'none', padding: '0.75rem 0.5rem', fontSize: '0.875rem', fontWeight: 700,
                  color: activeTab === 'devices' ? 'var(--color-navy, #1b2a4a)' : '#94a3b8',
                  borderBottom: activeTab === 'devices' ? '2.5px solid var(--color-gold, #C9A84C)' : 'none',
                  cursor: 'pointer'
                }}
              >
                Active Devices & Sessions
              </button>
              {user?.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('audit')}
                  style={{
                    background: 'none', border: 'none', padding: '0.75rem 0.5rem', fontSize: '0.875rem', fontWeight: 700,
                    color: activeTab === 'audit' ? 'var(--color-navy, #1b2a4a)' : '#94a3b8',
                    borderBottom: activeTab === 'audit' ? '2.5px solid var(--color-gold, #C9A84C)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  System Login Activity
                </button>
              )}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div className="pane-spinner" style={{ margin: '0 auto 0.5rem' }}></div>
                <p style={{ color: '#64748b', fontSize: '0.75rem' }}>Loading security data...</p>
              </div>
            ) : activeTab === 'devices' ? (
              <div>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
                  These are the devices currently logged into your account. If you don't recognize a device, revoke its access immediately.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {sessions.length === 0 ? (
                    <p style={{ color: '#64748b' }}>No active sessions found.</p>
                  ) : sessions.map(session => (
                    <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '1.25rem' }}>💻</span>
                          <strong style={{ color: '#1e293b' }}>{session.ip_address || 'Unknown IP'}</strong>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          <div><strong>Device/Browser:</strong> {session.device_info || session.user_agent}</div>
                          <div><strong>Last Active:</strong> {new Date(session.last_active_at).toLocaleString()}</div>
                          <div><strong>Started:</strong> {new Date(session.created_at).toLocaleString()}</div>
                        </div>
                      </div>
                      <div>
                        <button 
                          onClick={() => handleRevokeSession(session.token_id)}
                          style={{
                            background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.5rem 1rem', 
                            borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer'
                          }}
                        >
                          Revoke Access
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
                  System-wide login and security events across all users.
                </p>
                <div className="students-table-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Time</th>
                        <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>User</th>
                        <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Action</th>
                        <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>IP & Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map(log => (
                        <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: '#64748b' }}>
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem' }}>
                            <strong>{log.users?.email || 'System'}</strong><br />
                            <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>{log.users?.role}</span>
                          </td>
                          <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem' }}>
                            <span className="badge badge--approved" style={{ fontSize: '0.6875rem', textTransform: 'uppercase' }}>
                              {log.action}
                            </span>
                          </td>
                          <td style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', color: '#64748b' }}>
                            <div><strong>IP:</strong> {log.ip_address}</div>
                            {log.details?.user_agent && (
                              <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                                <strong>Agent:</strong> {log.details.user_agent}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
