import { useState, useEffect } from 'react';
import { apiUrl } from '../../../../utils/api';

export default function BursarDashboard() {
  const [structures, setStructures] = useState([]);
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Form states
  const [activeFormTab, setActiveFormTab] = useState('payment'); // 'payment', 'structure', 'scholarship'
  const [scholarships, setScholarships] = useState([]);
  
  const [scholarshipForm, setScholarshipForm] = useState({
    student_id: '',
    admission_number: '',
    title: '',
    percentage_discount: ''
  });
  const [feeForm, setFeeForm] = useState({
    academic_year_id: '8090544a-e490-48b4-934c-6874e4feee21', // Seeded ID
    term_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', // Seeded ID
    level: 'secondary',
    fee_type: 'Tuition',
    amount: '',
    description: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    student_id: '',
    fee_structure_id: '',
    amount_paid: '',
    payment_method: 'Bank Transfer',
    payment_date: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  const token = localStorage.getItem('token');
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Fetch fee structures
        const structRes = await fetch(apiUrl('/api/fees/structures'), { headers: authHeaders });
        const structData = await structRes.json();
        if (structData.success) {
          setStructures(structData.data);
          // Set first structure as default in payment form if available
          if (structData.data.length > 0) {
            setPaymentForm(prev => ({ ...prev, fee_structure_id: structData.data[0].id }));
          }
        }

        // Fetch payments
        const payRes = await fetch(apiUrl('/api/fees/payments'), { headers: authHeaders });
        const payData = await payRes.json();
        if (payData.success) {
          setPayments(payData.data);
        }

        // Fetch active students directory for dropdown selection
        const studentRes = await fetch(apiUrl('/api/students?limit=50'), { headers: authHeaders });
        const studentData = await studentRes.json();
        if (studentData.success) {
          setStudents(studentData.data);
          if (studentData.data.length > 0) {
            setPaymentForm(prev => ({ ...prev, student_id: studentData.data[0].id }));
            setScholarshipForm(prev => ({ 
              ...prev, 
              student_id: studentData.data[0].id,
              admission_number: studentData.data[0].admission_number 
            }));
          }
        }

        // Fetch Scholarships
        const scholRes = await fetch(apiUrl('/api/fees/scholarships'), { headers: authHeaders });
        const scholData = await scholRes.json();
        if (scholData.success) {
          setScholarships(scholData.data);
        }
      } catch (err) {
        console.error('Bursar data loading error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleFeeSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetch(apiUrl('/api/fees/structures'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(feeForm)
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: 'Fee structure successfully created!', type: 'success' });
        setStructures(prev => [data.data, ...prev]);
        setFeeForm(prev => ({ ...prev, amount: '', description: '' }));
      } else {
        setMessage({ text: data.message || 'Failed to create fee structure.', type: 'danger' });
      }
    } catch (err) {
      setMessage({ text: 'An unexpected connection error occurred.', type: 'danger' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetch(apiUrl('/api/fees/payments'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(paymentForm)
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: `Payment registered! Receipt No: ${data.data.receipt_number}`, type: 'success' });
        setPayments(prev => [data.data, ...prev]);
        setPaymentForm(prev => ({ ...prev, amount_paid: '', remarks: '' }));
      } else {
        setMessage({ text: data.message || 'Failed to register payment.', type: 'danger' });
      }
    } catch (err) {
      setMessage({ text: 'An unexpected connection error occurred.', type: 'danger' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleScholarshipSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetch(apiUrl('/api/fees/scholarships'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(scholarshipForm)
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: 'Scholarship awarded successfully!', type: 'success' });
        setScholarships(prev => [data.data, ...prev]);
        setScholarshipForm(prev => ({ ...prev, title: '', percentage_discount: '' }));
      } else {
        setMessage({ text: data.message || 'Failed to award scholarship.', type: 'danger' });
      }
    } catch (err) {
      setMessage({ text: 'An unexpected connection error occurred.', type: 'danger' });
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate quick metrics
  const totalRevenue = payments.reduce((acc, p) => acc + parseFloat(p.amount_paid), 0);
  const totalInvoiced = structures.reduce((acc, s) => acc + parseFloat(s.amount), 0) * (students.length || 1);
  const outstandingBal = Math.max(0, totalInvoiced - totalRevenue);

  return (
    <div className="admin-dash text-slate-800" style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Overview Hero Section */}
      <section className="dash-hero" style={{ marginBottom: '1.5rem' }}>
        <div className="dash-hero__text">
          <span className="dash-hero__label">Bursar Operations</span>
          <h1 className="dash-hero__title">Financial Tuition Ledger</h1>
          <p className="dash-hero__subtitle">
            Configure institutional fee structures, record student payment deposits, and track receipts auditing logs.
          </p>
        </div>
      </section>

      {/* Analytics Cards */}
      <section className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="metric-card">
          <span className="metric-icon">💰</span>
          <div className="metric-body">
            <span className="metric-value">₦{totalRevenue.toLocaleString()}</span>
            <span className="metric-label">Total Revenue Collected</span>
          </div>
        </div>

        <div className="metric-card metric-card--highlight">
          <span className="metric-icon">📄</span>
          <div className="metric-body">
            <span className="metric-value">₦{totalInvoiced.toLocaleString()}</span>
            <span className="metric-label">Projected Receivables</span>
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-icon">⏳</span>
          <div className="metric-body">
            <span className="metric-value">₦{outstandingBal.toLocaleString()}</span>
            <span className="metric-label">Outstanding Balance</span>
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-icon">🎒</span>
          <div className="metric-body">
            <span className="metric-value">{students.length}</span>
            <span className="metric-label">Billed Students</span>
          </div>
        </div>
      </section>

      {message.text && (
        <div className={`badge badge--${message.type === 'success' ? 'approved' : 'rejected'}`} style={{ padding: '0.875rem', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 600, display: 'block', width: '100%', marginBottom: '1.5rem', borderLeft: '4px solid' }}>
          {message.text}
        </div>
      )}

      {/* Main Grid: Management Panel & Ledger Logs */}
      <div className="dash-main-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '1.5rem' }}>
        
        {/* Operations Panel */}
        <div className="dash-pane" style={{ height: 'fit-content' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
            <button
              onClick={() => setActiveFormTab('payment')}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: activeFormTab === 'payment' ? 'var(--color-navy, #1b2a4a)' : '#94a3b8',
                borderBottom: activeFormTab === 'payment' ? '2.5px solid var(--color-gold, #C9A84C)' : 'none',
                cursor: 'pointer'
              }}
            >
              Record Payment
            </button>
            <button
              onClick={() => setActiveFormTab('structure')}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: activeFormTab === 'structure' ? 'var(--color-navy, #1b2a4a)' : '#94a3b8',
                borderBottom: activeFormTab === 'structure' ? '2.5px solid var(--color-gold, #C9A84C)' : 'none',
                cursor: 'pointer'
              }}
            >
              Add Fee Rate
            </button>
            <button
              onClick={() => setActiveFormTab('scholarship')}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: activeFormTab === 'scholarship' ? 'var(--color-navy, #1b2a4a)' : '#94a3b8',
                borderBottom: activeFormTab === 'scholarship' ? '2.5px solid var(--color-gold, #C9A84C)' : 'none',
                cursor: 'pointer'
              }}
            >
              Award Scholarship
            </button>
          </div>

          {activeFormTab === 'payment' ? (
            /* RECORD PAYMENT FORM */
            <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Select Student</label>
                <select
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none' }}
                  value={paymentForm.student_id}
                  onChange={(e) => setPaymentForm(p => ({ ...p, student_id: e.target.value }))}
                  required
                >
                  <option value="" disabled>-- Choose Active Student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} ({s.admission_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Select Fee Structure</label>
                <select
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none' }}
                  value={paymentForm.fee_structure_id}
                  onChange={(e) => setPaymentForm(p => ({ ...p, fee_structure_id: e.target.value }))}
                  required
                >
                  <option value="" disabled>-- Select Charge Item --</option>
                  {structures.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.fee_type} - ₦{parseFloat(st.amount).toLocaleString()} ({st.level})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Amount Paid (₦)</label>
                <input
                  type="number"
                  placeholder="e.g. 55000"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none' }}
                  value={paymentForm.amount_paid}
                  onChange={(e) => setPaymentForm(p => ({ ...p, amount_paid: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Payment Method</label>
                <select
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none' }}
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm(p => ({ ...p, payment_method: e.target.value }))}
                  required
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="Cash">Cash Deposit</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Remarks</label>
                <textarea
                  placeholder="Payment remarks (optional)"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none', height: '60px', resize: 'none' }}
                  value={paymentForm.remarks}
                  onChange={(e) => setPaymentForm(p => ({ ...p, remarks: e.target.value }))}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn--gold"
                style={{ width: '100%', padding: '0.75rem', fontWeight: 700 }}
              >
                {submitting ? 'Registering Payment...' : 'Record Payment Receipt 🧾'}
              </button>
            </form>
          ) : (
            /* CREATE FEE STRUCTURE FORM */
            <form onSubmit={handleFeeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Grade/Level Bracket</label>
                <select
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none' }}
                  value={feeForm.level}
                  onChange={(e) => setFeeForm(f => ({ ...f, level: e.target.value }))}
                  required
                >
                  <option value="primary">Primary Cohort</option>
                  <option value="secondary">Secondary Cohort</option>
                  <option value="university">University Cohort</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Fee Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Tuition, Excursion Fee, Library Levy"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none' }}
                  value={feeForm.fee_type}
                  onChange={(e) => setFeeForm(f => ({ ...f, fee_type: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Amount (₦)</label>
                <input
                  type="number"
                  placeholder="e.g. 150000"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none' }}
                  value={feeForm.amount}
                  onChange={(e) => setFeeForm(f => ({ ...f, amount: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Description</label>
                <textarea
                  placeholder="Item details..."
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none', height: '60px', resize: 'none' }}
                  value={feeForm.description}
                  onChange={(e) => setFeeForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn--navy"
                style={{ width: '100%', padding: '0.75rem', fontWeight: 700 }}
              >
                {submitting ? 'Creating Rate...' : 'Publish Fee Structure Item 📝'}
              </button>
            </form>
          ) : (
            /* AWARD SCHOLARSHIP FORM */
            <form onSubmit={handleScholarshipSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Select Student</label>
                <select
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none' }}
                  value={scholarshipForm.student_id}
                  onChange={(e) => {
                    const student = students.find(s => s.id === e.target.value);
                    setScholarshipForm(prev => ({ 
                      ...prev, 
                      student_id: e.target.value,
                      admission_number: student ? student.admission_number : ''
                    }));
                  }}
                  required
                >
                  <option value="" disabled>-- Choose Student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} ({s.admission_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Scholarship Title</label>
                <input
                  type="text"
                  placeholder="e.g. Academic Excellence Award"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none' }}
                  value={scholarshipForm.title}
                  onChange={(e) => setScholarshipForm(p => ({ ...p, title: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Discount Percentage (%)</label>
                <input
                  type="number"
                  placeholder="e.g. 50"
                  min="1"
                  max="100"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none' }}
                  value={scholarshipForm.percentage_discount}
                  onChange={(e) => setScholarshipForm(p => ({ ...p, percentage_discount: e.target.value }))}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn--gold"
                style={{ width: '100%', padding: '0.75rem', fontWeight: 700 }}
              >
                {submitting ? 'Awarding...' : 'Award Scholarship 🎓'}
              </button>
            </form>
          )}
        </div>

        {/* Ledger & Transactions log list */}
        <div className="dash-pane" style={{ overflowX: 'auto' }}>
          <h3 className="dash-pane__title" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
            Audited Payment Logs
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div className="pane-spinner" style={{ margin: '0 auto 0.5rem' }}></div>
              <p style={{ color: '#64748b', fontSize: '0.75rem' }}>Syncing financial database ledger...</p>
            </div>
          ) : payments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
              <span style={{ fontSize: '2.5rem' }}>🧾</span>
              <h4 style={{ fontWeight: 600, margin: '0.5rem 0 0.25rem', color: '#64748b' }}>No Payments Found</h4>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>There are no tuition payment records in the database ledger.</p>
            </div>
          ) : (
            <div className="students-table-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Receipt / Date</th>
                    <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Student Name</th>
                    <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Item Type</th>
                    <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569', textAlign: 'right' }}>Amount Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(pay => (
                    <tr key={pay.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem' }}>
                        <strong style={{ color: '#0f172a', display: 'block' }}>{pay.receipt_number}</strong>
                        <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>{new Date(pay.payment_date).toLocaleDateString()}</span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', fontWeight: '600' }}>
                        {pay.students ? `${pay.students.first_name} ${pay.students.last_name}` : 'Chidi Okafor'}
                        <span style={{ fontSize: '0.6875rem', color: '#64748b', display: 'block' }}>
                          ID: {pay.students?.admission_number || 'GA/2024/001'}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem' }}>
                        <span className="badge badge--pending" style={{ fontSize: '0.6875rem', padding: '0.125rem 0.5rem', textTransform: 'capitalize' }}>
                          {pay.fee_structures?.fee_type || 'Tuition'}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: '#64748b', display: 'block', marginTop: '0.125rem' }}>
                          Method: {pay.payment_method}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', fontWeight: 'bold', color: '#16a34a', textAlign: 'right' }}>
                        ₦{parseFloat(pay.amount_paid).toLocaleString()}
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
  );
}
