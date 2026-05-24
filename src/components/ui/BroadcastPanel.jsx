import { useState } from 'react';
import { apiUrl } from '../../utils/api';

export default function BroadcastPanel() {
  const [formData, setFormData] = useState({
    subject: '',
    body: '',
    target_audience: 'all_parents'
  });
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setMessage({ text: '', type: '' });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl('/api/messages/broadcast'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: `Broadcast sent to ${data.data.recipients_count} users successfully.`, type: 'success' });
        setFormData({ subject: '', body: '', target_audience: 'all_parents' });
      } else {
        setMessage({ text: data.message || 'Failed to send broadcast.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Network error occurred.', type: 'error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="dash-pane" style={{ borderTop: '3px solid var(--color-navy, #1b2a4a)' }}>
      <div className="dash-pane__header" style={{ marginBottom: '1rem' }}>
        <h3 className="dash-pane__title" style={{ margin: 0 }}>📢 Mass Email Broadcast</h3>
      </div>
      <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>
        Send an email and internal system notification to a specific school cohort.
      </p>

      {message.text && (
        <div style={{
          padding: '0.75rem',
          borderRadius: '4px',
          fontSize: '0.8125rem',
          marginBottom: '1rem',
          backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: message.type === 'success' ? '#16a34a' : '#dc2626',
          border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Audience Cohort</label>
          <select 
            value={formData.target_audience}
            onChange={e => setFormData({ ...formData, target_audience: e.target.value })}
            style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none' }}
          >
            <option value="all_parents">All Parents</option>
            <option value="all_students">All Students</option>
            <option value="all_staff">All Teaching & Non-Teaching Staff</option>
            <option value="everyone">Everyone (School-wide)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Message Subject</label>
          <input 
            type="text" 
            placeholder="e.g. Mid-Term Break Announcement"
            value={formData.subject}
            onChange={e => setFormData({ ...formData, subject: e.target.value })}
            style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none' }}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Message Body</label>
          <textarea 
            placeholder="Write your email content here..."
            value={formData.body}
            onChange={e => setFormData({ ...formData, body: e.target.value })}
            style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none', height: '100px', resize: 'vertical' }}
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={sending}
          style={{
            padding: '0.75rem',
            backgroundColor: 'var(--color-navy, #1b2a4a)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 600,
            cursor: sending ? 'not-allowed' : 'pointer',
            opacity: sending ? 0.7 : 1,
            transition: 'opacity 0.2s'
          }}
        >
          {sending ? 'Dispatching Broadcast...' : 'Send Broadcast Email 🚀'}
        </button>
      </form>
    </div>
  );
}
