import React, { useState, useEffect } from 'react';
import PageHeader from '../../../components/portal/PageHeader';

export default function AlumniManagement() {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'rejected'
  const [processingId, setProcessingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchApplications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/alumni/applications?status=${activeTab}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch applications');
      
      setApplications(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [activeTab]);

  const handleAction = async (id, action) => {
    setProcessingId(id);
    setSuccessMessage('');
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/alumni/applications/${id}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Failed to ${action} application`);
      
      // If approved, it returns temporary credentials in data.data.credentials
      if (action === 'approve' && data.data?.credentials) {
        setSuccessMessage(`Application approved. Temporary password for ${data.data.credentials.email}: ${data.data.credentials.temporaryPassword}`);
      } else {
        setSuccessMessage(`Application ${action}d successfully`);
      }

      fetchApplications();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="portal-page">
      <PageHeader 
        title="Alumni Management" 
        subtitle="Review and approve alumni network applications." 
      />

      {error && (
        <div className="alert alert--danger" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {successMessage && (
        <div className="alert alert--success" style={{ marginBottom: '1.5rem' }}>
          {successMessage}
        </div>
      )}

      <div className="portal-card">
        <div className="portal-tabs" style={{ marginBottom: '1.5rem' }}>
          <button 
            className={`portal-tab ${activeTab === 'pending' ? 'portal-tab--active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Review
          </button>
          <button 
            className={`portal-tab ${activeTab === 'approved' ? 'portal-tab--active' : ''}`}
            onClick={() => setActiveTab('approved')}
          >
            Approved
          </button>
          <button 
            className={`portal-tab ${activeTab === 'rejected' ? 'portal-tab--active' : ''}`}
            onClick={() => setActiveTab('rejected')}
          >
            Rejected
          </button>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <p className="empty-state__message">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__message">No {activeTab} applications found.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Graduation Year</th>
                  <th>Date Applied</th>
                  {activeTab === 'pending' && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <div style={{ fontWeight: '500', color: 'var(--color-navy)' }}>
                        {app.first_name} {app.last_name}
                      </div>
                    </td>
                    <td>{app.email}</td>
                    <td>{app.graduation_year}</td>
                    <td>{new Date(app.created_at).toLocaleDateString()}</td>
                    {activeTab === 'pending' && (
                      <td className="text-right">
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn--primary btn--sm"
                            disabled={processingId === app.id}
                            onClick={() => handleAction(app.id, 'approve')}
                          >
                            {processingId === app.id ? '...' : 'Approve'}
                          </button>
                          <button 
                            className="btn btn--outline btn--sm"
                            disabled={processingId === app.id}
                            onClick={() => handleAction(app.id, 'reject')}
                            style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
