import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../utils/api';
import PortalLayout from '../../../components/layout/PortalLayout';
import './MessagingPage.css';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'Now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export default function MessagingPage() {
  const { user, token } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState('');
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const [loading, setLoading] = useState(true);
  const threadRef = useRef(null);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Fetch conversations
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/messages/conversations?limit=50'), { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setConversations(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [token]);

  // Fetch messages for active conversation
  const loadMessages = useCallback(async (convoId) => {
    try {
      const res = await fetch(apiUrl(`/api/messages/conversations/${convoId}?limit=50`), { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setMessages(data.data || []);
    } catch (err) { console.error(err); }
  }, [token]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (activeConvo) {
      loadMessages(activeConvo.id);
      const interval = setInterval(() => loadMessages(activeConvo.id), 10000);
      return () => clearInterval(interval);
    }
  }, [activeConvo, loadMessages]);

  const selectConvo = (convo) => {
    setActiveConvo(convo);
    setMobileShowThread(true);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeConvo || sending) return;
    setSending(true);
    try {
      const res = await fetch(apiUrl('/api/messages/send'), {
        method: 'POST', headers,
        body: JSON.stringify({ conversation_id: activeConvo.id, body: newMsg.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [data.data, ...prev]);
        setNewMsg('');
        loadConversations(); // refresh last message
      }
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // New conversation
  const searchContacts = async (query) => {
    setContactSearch(query);
    if (query.length < 2) { setContacts([]); return; }
    try {
      const res = await fetch(apiUrl(`/api/messages/contacts?search=${encodeURIComponent(query)}`), { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setContacts(data.data || []);
    } catch (err) {}
  };

  const startConversation = async (recipientId) => {
    try {
      const res = await fetch(apiUrl('/api/messages/conversations'), {
        method: 'POST', headers,
        body: JSON.stringify({ recipient_id: recipientId }),
      });
      const data = await res.json();
      if (data.success) {
        setShowNewModal(false);
        setContactSearch('');
        setContacts([]);
        await loadConversations();
        setActiveConvo(data.data);
        setMobileShowThread(true);
      }
    } catch (err) { console.error(err); }
  };

  return (
    <PortalLayout>
      <div className="messaging-page">
        {/* Conversation List */}
        <div className={`msg-sidebar ${mobileShowThread ? 'msg-sidebar--hidden' : ''}`}>
          <div className="msg-sidebar__header">
            <h3 className="msg-sidebar__title">Messages</h3>
            <button className="msg-new-btn" onClick={() => setShowNewModal(true)}>+ New</button>
          </div>

          <div className="msg-list">
            {loading ? (
              <div className="msg-empty-state"><p className="msg-empty-state__text">Loading...</p></div>
            ) : conversations.length === 0 ? (
              <div className="msg-empty-state">
                <span className="msg-empty-state__icon">💬</span>
                <p className="msg-empty-state__text">No conversations yet</p>
              </div>
            ) : conversations.map(c => (
              <div
                key={c.id}
                className={`msg-convo-item ${activeConvo?.id === c.id ? 'msg-convo-item--active' : ''}`}
                onClick={() => selectConvo(c)}
              >
                <div className="msg-convo-avatar">
                  {(c.partner?.name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="msg-convo-info">
                  <h4 className="msg-convo-name">{c.partner?.name || c.partner?.email}</h4>
                  <p className="msg-convo-preview">
                    {c.lastMessage?.body || 'No messages yet'}
                  </p>
                </div>
                <div className="msg-convo-meta">
                  {c.lastMessage && (
                    <span className="msg-convo-time">{timeAgo(c.lastMessage.created_at)}</span>
                  )}
                  {c.unreadCount > 0 && (
                    <span className="msg-convo-badge">{c.unreadCount}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Thread */}
        {activeConvo ? (
          <div className={`msg-thread ${!mobileShowThread ? 'msg-thread--hidden' : ''}`}>
            <div className="msg-thread__header">
              <button className="msg-thread__back" onClick={() => setMobileShowThread(false)}>←</button>
              <div className="msg-convo-avatar" style={{ width: 36, height: 36, fontSize: '0.8rem' }}>
                {(activeConvo.partner?.name || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="msg-thread__name">{activeConvo.partner?.name}</h4>
                {activeConvo.partner?.role && (
                  <span className="msg-thread__role">{activeConvo.partner.role.replace(/_/g, ' ')}</span>
                )}
              </div>
            </div>

            <div className="msg-thread__body" ref={threadRef}>
              {messages.map(m => (
                <div
                  key={m.id}
                  className={`msg-bubble ${m.sender_id === user.id ? 'msg-bubble--sent' : 'msg-bubble--received'}`}
                >
                  {m.body}
                  <span className="msg-bubble__time">{timeAgo(m.created_at)}</span>
                </div>
              ))}
            </div>

            <div className="msg-thread__input">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button className="msg-send-btn" onClick={sendMessage} disabled={sending || !newMsg.trim()}>
                {sending ? '...' : 'Send'}
              </button>
            </div>
          </div>
        ) : (
          <div className={`msg-empty-state ${mobileShowThread ? '' : ''}`} style={{ flex: 1 }}>
            <span className="msg-empty-state__icon">✉️</span>
            <p className="msg-empty-state__text">Select a conversation or start a new one</p>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewModal && (
        <div className="msg-modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="msg-modal" onClick={e => e.stopPropagation()}>
            <div className="msg-modal__header">
              <h4 className="msg-modal__title">New Conversation</h4>
              <button className="msg-modal__close" onClick={() => setShowNewModal(false)}>✕</button>
            </div>
            <div className="msg-modal__body">
              <input
                type="text"
                placeholder="Search by email..."
                value={contactSearch}
                onChange={(e) => searchContacts(e.target.value)}
                autoFocus
              />
              <div className="msg-contact-list">
                {contacts.map(c => (
                  <div key={c.id} className="msg-contact-item" onClick={() => startConversation(c.id)}>
                    <div className="msg-convo-avatar" style={{ width: 36, height: 36, fontSize: '0.8rem' }}>
                      {(c.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="msg-contact-name">{c.name}</div>
                      <div className="msg-contact-role">{c.role?.replace(/_/g, ' ')} · {c.email}</div>
                    </div>
                  </div>
                ))}
                {contactSearch.length >= 2 && contacts.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8125rem', padding: '1rem' }}>No contacts found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
