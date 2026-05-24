import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../utils/api';
import './NotificationPanel.css';

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? 'Yesterday' : `${days}d ago`;
}

export default function NotificationPanel({ isOpen, onClose }) {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(apiUrl('/api/notifications?limit=30'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setNotifications(data.data || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await fetch(apiUrl(`/api/notifications/${id}/read`), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (err) {}
  };

  const markAllAsRead = async () => {
    try {
      await fetch(apiUrl('/api/notifications/read-all'), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {}
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="notif-panel-overlay" onClick={onClose}></div>
      <div className="notif-panel">
        <div className="notif-panel__header">
          <h3 className="notif-panel__title">Notifications</h3>
          <div className="notif-panel__actions">
            <button className="notif-mark-all" onClick={markAllAsRead}>
              Mark all read
            </button>
            <button className="notif-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="notif-panel__body">
          {loading ? (
            <div className="notif-loading">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="notif-empty">
              <span className="notif-empty__icon">🔔</span>
              <p className="notif-empty__text">No notifications yet</p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`notif-item ${n.is_read ? 'notif-item--read' : 'notif-item--unread'}`}
                onClick={() => { if (!n.is_read) markAsRead(n.id); }}
              >
                <span className="notif-item__dot"></span>
                <div className="notif-item__content">
                  <h4 className="notif-item__title">{n.title}</h4>
                  {n.body && <p className="notif-item__body">{n.body}</p>}
                  <span className="notif-item__time">{timeAgo(n.created_at)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Bell icon button with unread badge.
 * Polls for unread count every 30 seconds.
 */
export function NotificationBell({ onClick }) {
  const { token } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(apiUrl('/api/notifications/unread-count'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setUnreadCount(data.data.count || 0);
    } catch (err) {}
  }, [token]);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  return (
    <button className="notif-bell" onClick={onClick} aria-label="Notifications">
      🔔
      {unreadCount > 0 && (
        <span className="notif-bell__badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
      )}
    </button>
  );
}
