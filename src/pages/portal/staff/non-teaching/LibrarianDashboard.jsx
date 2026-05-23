import { useState, useEffect } from 'react';

export default function LibrarianDashboard() {
  const [books, setBooks] = useState([]);
  const [borrowLogs, setBorrowLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Tab switch
  const [activeFormTab, setActiveFormTab] = useState('issue'); // 'issue' or 'add_book'

  // Form states
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Mathematics',
    total_copies: '10'
  });

  const [issueForm, setIssueForm] = useState({
    book_id: '',
    admission_number: '',
    remarks: ''
  });

  const token = localStorage.getItem('token');
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const loadLibraryData = async () => {
    setLoading(true);
    try {
      const bookRes = await fetch('/api/library/books', { headers: authHeaders });
      const bookData = await bookRes.json();
      if (bookData.success) {
        setBooks(bookData.data);
        if (bookData.data.length > 0) {
          setIssueForm(prev => ({ ...prev, book_id: bookData.data[0].id }));
        }
      }

      const borrowRes = await fetch('/api/library/borrow', { headers: authHeaders });
      const borrowData = await borrowRes.json();
      if (borrowData.success) {
        setBorrowLogs(borrowData.data);
      }
    } catch (err) {
      console.error('Library loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibraryData();
  }, []);

  const handleAddBook = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetch('/api/library/books', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(bookForm)
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: data.message, type: 'success' });
        setBooks(prev => [...prev, data.data]);
        setBookForm({ title: '', author: '', isbn: '', category: 'Mathematics', total_copies: '10' });
      } else {
        setMessage({ text: data.message || 'Failed to add book.', type: 'danger' });
      }
    } catch (err) {
      setMessage({ text: 'Unexpected connection error occurred.', type: 'danger' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleIssueBook = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetch('/api/library/borrow', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(issueForm)
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: data.message, type: 'success' });
        // Refresh catalog and logs
        await loadLibraryData();
        setIssueForm(prev => ({ ...prev, admission_number: '', remarks: '' }));
      } else {
        setMessage({ text: data.message || 'Failed to issue book.', type: 'danger' });
      }
    } catch (err) {
      setMessage({ text: 'Unexpected connection error occurred.', type: 'danger' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnBook = async (borrowId) => {
    setMessage({ text: '', type: '' });
    try {
      const res = await fetch(`/api/library/borrow/${borrowId}/return`, {
        method: 'PUT',
        headers: authHeaders
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: data.message, type: 'success' });
        await loadLibraryData();
      } else {
        setMessage({ text: data.message || 'Failed to return book.', type: 'danger' });
      }
    } catch (err) {
      setMessage({ text: 'Unexpected connection error occurred.', type: 'danger' });
    }
  };

  // Filter books catalog
  const filteredBooks = books.filter(book => {
    const q = searchQuery.toLowerCase();
    return (
      book.title.toLowerCase().includes(q) ||
      book.author.toLowerCase().includes(q) ||
      book.isbn.includes(q) ||
      book.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="admin-dash text-slate-800" style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Overview Hero Section */}
      <section className="dash-hero" style={{ marginBottom: '1.5rem' }}>
        <div className="dash-hero__text">
          <span className="dash-hero__label">Librarian Operations</span>
          <h1 className="dash-hero__title">Academic Library Center</h1>
          <p className="dash-hero__subtitle">
            Search book titles catalog, add catalog additions to the inventory repository, and audit borrow/return logs roster.
          </p>
        </div>
      </section>

      {/* Analytics Summary */}
      <section className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="metric-card">
          <span className="metric-icon">📚</span>
          <div className="metric-body">
            <span className="metric-value">{books.length}</span>
            <span className="metric-label">Registered Titles</span>
          </div>
        </div>

        <div className="metric-card metric-card--highlight">
          <span className="metric-icon">📖</span>
          <div className="metric-body">
            <span className="metric-value">
              {books.reduce((acc, b) => acc + b.total_copies, 0)}
            </span>
            <span className="metric-label">Total Copies in Stack</span>
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-icon">📤</span>
          <div className="metric-body">
            <span className="metric-value">
              {borrowLogs.filter(r => r.status === 'borrowed').length}
            </span>
            <span className="metric-label">Active Borrowed Copies</span>
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-icon">📥</span>
          <div className="metric-body">
            <span className="metric-value">
              {books.reduce((acc, b) => acc + b.available_copies, 0)}
            </span>
            <span className="metric-label">Available Shelf Copies</span>
          </div>
        </div>
      </section>

      {message.text && (
        <div className={`badge badge--${message.type === 'success' ? 'approved' : 'rejected'}`} style={{ padding: '0.875rem', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 600, display: 'block', width: '100%', marginBottom: '1.5rem', borderLeft: '4px solid' }}>
          {message.text}
        </div>
      )}

      {/* Main Workspace Grid */}
      <div className="dash-main-grid" style={{ display: 'grid', gridTemplateColumns: '1.15fr 1.85fr', gap: '1.5rem' }}>
        
        {/* Book Issuing / Adding */}
        <div className="dash-pane" style={{ height: 'fit-content' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
            <button
              onClick={() => setActiveFormTab('issue')}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: activeFormTab === 'issue' ? 'var(--color-navy, #1b2a4a)' : '#94a3b8',
                borderBottom: activeFormTab === 'issue' ? '2.5px solid var(--color-gold, #C9A84C)' : 'none',
                cursor: 'pointer'
              }}
            >
              Issue Book
            </button>
            <button
              onClick={() => setActiveFormTab('add_book')}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: activeFormTab === 'add_book' ? 'var(--color-navy, #1b2a4a)' : '#94a3b8',
                borderBottom: activeFormTab === 'add_book' ? '2.5px solid var(--color-gold, #C9A84C)' : 'none',
                cursor: 'pointer'
              }}
            >
              Add New Title
            </button>
          </div>

          {activeFormTab === 'issue' ? (
            /* ISSUE BOOK FORM */
            <form onSubmit={handleIssueBook} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Select Book</label>
                <select
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none' }}
                  value={issueForm.book_id}
                  onChange={(e) => setIssueForm(i => ({ ...i, book_id: e.target.value }))}
                  required
                >
                  <option value="" disabled>-- Select Catalog Title --</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id} disabled={b.available_copies <= 0}>
                      {b.title} ({b.available_copies}/{b.total_copies} left)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Student Admission No</label>
                <input
                  type="text"
                  placeholder="e.g. GA/2024/001"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none' }}
                  value={issueForm.admission_number}
                  onChange={(e) => setIssueForm(i => ({ ...i, admission_number: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Remarks</label>
                <textarea
                  placeholder="Special instructions or condition checks..."
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none', height: '60px', resize: 'none' }}
                  value={issueForm.remarks}
                  onChange={(e) => setIssueForm(i => ({ ...i, remarks: e.target.value }))}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn--gold"
                style={{ width: '100%', padding: '0.75rem', fontWeight: 700 }}
              >
                {submitting ? 'Issuing Book...' : 'Issue Book to Student 📤'}
              </button>
            </form>
          ) : (
            /* ADD NEW BOOK FORM */
            <form onSubmit={handleAddBook} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Book Title</label>
                <input
                  type="text"
                  placeholder="e.g. Comprehensive Mathematics"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none' }}
                  value={bookForm.title}
                  onChange={(e) => setBookForm(b => ({ ...b, title: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Author Name</label>
                <input
                  type="text"
                  placeholder="e.g. Wole Soyinka"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none' }}
                  value={bookForm.author}
                  onChange={(e) => setBookForm(b => ({ ...b, author: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>ISBN Code</label>
                <input
                  type="text"
                  placeholder="e.g. 978-0195752250"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none' }}
                  value={bookForm.isbn}
                  onChange={(e) => setBookForm(b => ({ ...b, isbn: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Category / Genre</label>
                <select
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none' }}
                  value={bookForm.category}
                  onChange={(e) => setBookForm(b => ({ ...b, category: e.target.value }))}
                  required
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Sciences</option>
                  <option value="Literature">Literature / Arts</option>
                  <option value="History">History & Civics</option>
                  <option value="Reference">Reference Materials</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Stock Quantity</label>
                <input
                  type="number"
                  placeholder="e.g. 10"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none' }}
                  value={bookForm.total_copies}
                  onChange={(e) => setBookForm(b => ({ ...b, total_copies: e.target.value }))}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn--navy"
                style={{ width: '100%', padding: '0.75rem', fontWeight: 700 }}
              >
                {submitting ? 'Registering Book...' : 'Add Book to Catalog 📝'}
              </button>
            </form>
          )}
        </div>

        {/* Catalog Search & Active Borrowers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Catalog Search Pane */}
          <div className="dash-pane">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 className="dash-pane__title" style={{ margin: 0 }}>Library Search Catalog</h3>
              <input
                type="text"
                placeholder="Search Title, Author or ISBN..."
                style={{ padding: '0.375rem 0.75rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.8125rem', outline: 'none', width: '220px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <div className="pane-spinner" style={{ margin: '0 auto 0.5rem' }}></div>
              </div>
            ) : filteredBooks.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>No books matching your criteria.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto' }}>
                {filteredBooks.map(b => (
                  <div key={b.id} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ fontSize: '0.8125rem', fontWeight: 'bold', color: '#1e293b', margin: '0 0 0.25rem' }}>{b.title}</h4>
                      <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '0' }}>By: {b.author}</p>
                      <span style={{ fontSize: '0.625rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: '10px', display: 'inline-block', marginTop: '0.25rem', fontWeight: 'bold', color: '#475569' }}>
                        {b.category}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', marginTop: '0.5rem', paddingTop: '0.375rem' }}>
                      <span style={{ fontSize: '0.625rem', color: '#64748b' }}>ISBN: {b.isbn}</span>
                      <strong style={{ fontSize: '0.75rem', color: b.available_copies > 0 ? '#16a34a' : '#dc2626' }}>
                        {b.available_copies}/{b.total_copies} Left
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Borrowers Pane */}
          <div className="dash-pane" style={{ overflowX: 'auto' }}>
            <h3 className="dash-pane__title" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              Active Borrowers Roster
            </h3>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <div className="pane-spinner" style={{ margin: '0 auto' }}></div>
              </div>
            ) : borrowLogs.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>No borrow transactions logged.</p>
            ) : (
              <div className="students-table-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '0.75rem', fontSize: '0.7rem', textTransform: 'uppercase', color: '#475569' }}>Student</th>
                      <th style={{ padding: '0.75rem', fontSize: '0.7rem', textTransform: 'uppercase', color: '#475569' }}>Book Title</th>
                      <th style={{ padding: '0.75rem', fontSize: '0.7rem', textTransform: 'uppercase', color: '#475569' }}>Status</th>
                      <th style={{ padding: '0.75rem', fontSize: '0.7rem', textTransform: 'uppercase', color: '#475569', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {borrowLogs.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem', fontSize: '0.75rem' }}>
                          <strong style={{ color: '#1e293b', display: 'block' }}>{log.student_name}</strong>
                          <span style={{ fontSize: '0.625rem', color: '#64748b' }}>{log.admission_number}</span>
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>
                          {log.book_title}
                          <span style={{ fontSize: '0.625rem', color: '#94a3b8', display: 'block' }}>Borrowed: {log.borrow_date}</span>
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.75rem' }}>
                          <span className={`badge badge--${log.status === 'borrowed' ? 'pending' : 'approved'}`} style={{ fontSize: '0.6rem', padding: '1px 5px' }}>
                            {log.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          {log.status === 'borrowed' ? (
                            <button
                              onClick={() => handleReturnBook(log.id)}
                              style={{ border: 'none', background: '#16a34a', color: '#ffffff', fontSize: '0.65rem', padding: '3px 8px', borderRadius: '3px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                              Log Return
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Returned ({log.return_date})</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
