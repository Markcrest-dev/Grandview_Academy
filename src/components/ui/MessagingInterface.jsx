import React, { useState, useEffect, useRef } from 'react';
import { apiUrl } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function MessagingInterface() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  const token = localStorage.getItem('token');
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
    }
  }, [activeConversation]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const loadConversations = async () => {
    try {
      const res = await fetch(apiUrl('/api/messages/conversations'), { headers: authHeaders });
      const data = await res.json();
      if (data.success) {
        setConversations(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (id) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(apiUrl(`/api/messages/conversations/${id}`), { headers: authHeaders });
      const data = await res.json();
      if (data.success) {
        setMessages(data.data.reverse()); // oldest first for chat display
        
        // Update unread count in conversations list
        setConversations(prev => prev.map(c => 
          c.id === id ? { ...c, unreadCount: 0 } : c
        ));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSearchContacts = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    try {
      const res = await fetch(apiUrl(`/api/messages/contacts?search=${encodeURIComponent(searchQuery)}`), { headers: authHeaders });
      const data = await res.json();
      if (data.success) {
        setContacts(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartConversation = async (contact) => {
    try {
      const res = await fetch(apiUrl('/api/messages/conversations'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ recipient_id: contact.id })
      });
      const data = await res.json();
      if (data.success) {
        // Switch to conversation
        const convo = data.data;
        // See if it already exists in the list to get full data
        const existing = conversations.find(c => c.id === convo.id);
        if (existing) {
          setActiveConversation(existing);
        } else {
          // Add to list and set active
          const newConvo = { ...convo, partner: contact, unreadCount: 0 };
          setConversations([newConvo, ...conversations]);
          setActiveConversation(newConvo);
        }
        setSearchQuery('');
        setContacts([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;
    
    setSending(true);
    try {
      const res = await fetch(apiUrl('/api/messages/send'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          conversation_id: activeConversation.id,
          body: newMessage
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessages([...messages, data.data]);
        setNewMessage('');
        
        // Update last message in the conversations list
        setConversations(prev => prev.map(c => 
          c.id === activeConversation.id ? { ...c, lastMessage: data.data, last_message_at: data.data.created_at } : c
        ).sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div className="pane-spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Loading messages...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', height: '600px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      
      {/* Sidebar: Conversations & Contacts */}
      <div style={{ borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 'bold', color: '#1b2a4a' }}>Messages</h3>
          <form onSubmit={handleSearchContacts} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="Search contacts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.75rem' }}
            />
            <button type="submit" className="btn btn--navy" style={{ padding: '0.5rem', fontSize: '0.75rem' }}>Search</button>
          </form>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {contacts.length > 0 ? (
            <div style={{ padding: '0.5rem' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#64748b', padding: '0.5rem' }}>Search Results</div>
              {contacts.map(contact => (
                <div 
                  key={contact.id} 
                  onClick={() => handleStartConversation(contact)}
                  style={{ padding: '0.75rem', cursor: 'pointer', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div>
                    <strong style={{ fontSize: '0.8125rem', color: '#0f172a', display: 'block' }}>{contact.name}</strong>
                    <span style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'capitalize' }}>{contact.role.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              ))}
              <div 
                style={{ textAlign: 'center', padding: '0.5rem', fontSize: '0.75rem', color: '#3b82f6', cursor: 'pointer' }}
                onClick={() => { setContacts([]); setSearchQuery(''); }}
              >
                Clear Search
              </div>
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.8125rem' }}>
              No active conversations. Search for a contact to start messaging.
            </div>
          ) : (
            <div>
              {conversations.map(convo => (
                <div 
                  key={convo.id}
                  onClick={() => setActiveConversation(convo)}
                  style={{ 
                    padding: '1rem', 
                    cursor: 'pointer', 
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: activeConversation?.id === convo.id ? '#f1f5f9' : 'transparent',
                    borderLeft: activeConversation?.id === convo.id ? '3px solid #1b2a4a' : '3px solid transparent'
                  }}
                  onMouseEnter={(e) => { if(activeConversation?.id !== convo.id) e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                  onMouseLeave={(e) => { if(activeConversation?.id !== convo.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>{convo.partner?.name || 'Unknown'}</strong>
                    {convo.unreadCount > 0 && (
                      <span style={{ background: '#dc2626', color: '#ffffff', fontSize: '0.625rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                        {convo.unreadCount}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: convo.unreadCount > 0 ? '#1e293b' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                      {convo.lastMessage ? convo.lastMessage.body : 'No messages yet'}
                    </span>
                    {convo.lastMessage && (
                      <span style={{ fontSize: '0.625rem', color: '#94a3b8' }}>
                        {new Date(convo.lastMessage.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
        {activeConversation ? (
          <>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', background: '#1b2a4a', color: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.25rem' }}>
                {activeConversation.partner?.name?.charAt(0) || '?'}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.125rem', color: '#0f172a' }}>{activeConversation.partner?.name || 'Unknown'}</h4>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' }}>
                  {activeConversation.partner?.role ? activeConversation.partner.role.replace(/_/g, ' ') : 'User'}
                </span>
              </div>
            </div>

            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#fafbfc' }}>
              {loadingMessages ? (
                <div className="pane-spinner" style={{ margin: 'auto' }}></div>
              ) : messages.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', color: '#64748b', fontSize: '0.8125rem' }}>
                  Say hello to {activeConversation.partner?.name}!
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.sender_id === user.id;
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                      <div style={{ 
                        maxWidth: '70%', 
                        padding: '0.75rem 1rem', 
                        borderRadius: '8px', 
                        background: isMine ? '#1b2a4a' : '#f1f5f9',
                        color: isMine ? '#ffffff' : '#0f172a',
                        borderBottomRightRadius: isMine ? '0' : '8px',
                        borderBottomLeftRadius: !isMine ? '0' : '8px',
                      }}>
                        <p style={{ margin: '0 0 0.25rem', fontSize: '0.875rem', lineHeight: '1.4' }}>{msg.body}</p>
                        <div style={{ fontSize: '0.625rem', color: isMine ? '#cbd5e1' : '#94a3b8', textAlign: isMine ? 'right' : 'left' }}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', background: '#ffffff' }}>
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  style={{ flex: 1, padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '24px', fontSize: '0.875rem', outline: 'none' }}
                />
                <button type="submit" disabled={sending} className="btn btn--gold" style={{ padding: '0 1.5rem', borderRadius: '24px', fontWeight: 'bold' }}>
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', flexDirection: 'column' }}>
            <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</span>
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
