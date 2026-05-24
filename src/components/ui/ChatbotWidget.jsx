import React, { useState, useRef, useEffect } from 'react';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi there! 👋 I am the Grandview Academy Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInput('');

    // Rule-based responses
    setTimeout(() => {
      let botResponse = "I'm sorry, I didn't quite catch that. Could you please rephrase? You can ask me about Admissions, Tuition, or Term Dates.";
      const lower = userText.toLowerCase();

      if (lower.includes('admiss') || lower.includes('apply') || lower.includes('enroll')) {
        botResponse = "To apply for admission, please visit our Admissions portal and fill out the online application form. You will need the student's recent academic records and a birth certificate.";
      } else if (lower.includes('fee') || lower.includes('tuition') || lower.includes('cost') || lower.includes('pay')) {
        botResponse = "Our tuition fees vary by academic level (Primary vs. Secondary). You can view the exact breakdown by selecting 'Academics' -> 'Fee Structure' on our main site, or logging into the portal if you are an existing parent.";
      } else if (lower.includes('term') || lower.includes('date') || lower.includes('calendar') || lower.includes('when')) {
        botResponse = "The current academic session is ongoing. Please check the 'News & Calendar' section on our homepage for detailed term start and end dates.";
      } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        botResponse = "Hello! What can I assist you with today?";
      }

      setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
    }, 600);
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          left: '2rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#1b2a4a',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.75rem',
          zIndex: 9999,
          transition: 'transform 0.2s',
          transform: isOpen ? 'scale(0.9)' : 'scale(1)'
        }}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '6rem',
          left: '2rem',
          width: '350px',
          height: '450px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9999,
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {/* Header */}
          <div style={{
            backgroundColor: '#1b2a4a',
            padding: '1rem',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{ width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '50%' }}></div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Grandview Assistant</h3>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            padding: '1rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            backgroundColor: '#f8fafc'
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                backgroundColor: msg.sender === 'user' ? '#C9A84C' : '#e2e8f0',
                color: msg.sender === 'user' ? 'white' : '#1e293b',
                fontSize: '0.875rem',
                lineHeight: 1.4,
                borderBottomRightRadius: msg.sender === 'user' ? '4px' : '12px',
                borderBottomLeftRadius: msg.sender === 'bot' ? '4px' : '12px',
              }}>
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} style={{
            padding: '1rem',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            gap: '0.5rem',
            backgroundColor: 'white'
          }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your question..."
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '20px',
                outline: 'none',
                fontSize: '0.875rem'
              }}
            />
            <button type="submit" style={{
              backgroundColor: '#1b2a4a',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}>
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
