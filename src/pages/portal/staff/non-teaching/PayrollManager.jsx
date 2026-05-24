import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../../../utils/api';

export default function PayrollManager() {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const authHeaders = {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  };

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/payroll?month=${month}&year=${year}`), { headers: authHeaders });
      const data = await res.json();
      if (data.success) {
        setPayrolls(data.data);
      }
    } catch (err) {
      console.error('Error fetching payroll:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, [month, year]);

  const handleGenerate = async () => {
    try {
      const res = await fetch(apiUrl('/api/payroll/generate'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ month, year })
      });
      const data = await res.json();
      if (data.success) {
        fetchPayrolls();
        alert(data.message);
      } else {
        alert(data.message || 'Failed to generate payroll.');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const handlePay = async (id) => {
    try {
      const res = await fetch(apiUrl(`/api/payroll/${id}/pay`), {
        method: 'PATCH',
        headers: authHeaders
      });
      const data = await res.json();
      if (data.success) {
        setPayrolls(payrolls.map(p => p.id === id ? { ...p, status: 'paid', payment_date: data.data.payment_date } : p));
      } else {
        alert(data.message || 'Failed to process payment.');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const handleUpdate = async (id, field, value) => {
    try {
      const numVal = parseFloat(value) || 0;
      const res = await fetch(apiUrl(`/api/payroll/${id}`), {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ [field]: numVal })
      });
      const data = await res.json();
      if (data.success) {
        setPayrolls(payrolls.map(p => p.id === id ? { ...p, [field]: numVal, net_pay: data.data.net_pay } : p));
      }
    } catch (err) {
      alert('Error updating field');
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Month</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
              {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Year</label>
            <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1', width: '80px' }} />
          </div>
        </div>
        <button className="btn btn--outline" onClick={handleGenerate}>
          Generate Payroll Batch
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading payroll...</div>
      ) : payrolls.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '2rem' }}>📭</span>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>No payroll records generated for this month.</p>
        </div>
      ) : (
        <div className="students-table-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Staff Member</th>
                <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Base Salary</th>
                <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Bonus</th>
                <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Deductions</th>
                <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Net Pay</th>
                <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', fontWeight: 600 }}>
                    {p.staff?.first_name} {p.staff?.last_name}
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'normal' }}>{p.staff?.designation}</div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <input 
                      type="number" 
                      value={p.base_salary} 
                      onChange={e => setPayrolls(payrolls.map(pr => pr.id === p.id ? { ...pr, base_salary: e.target.value } : pr))}
                      onBlur={(e) => handleUpdate(p.id, 'base_salary', e.target.value)}
                      style={{ width: '80px', padding: '0.25rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                      disabled={p.status === 'paid'}
                    />
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <input 
                      type="number" 
                      value={p.bonus} 
                      onChange={e => setPayrolls(payrolls.map(pr => pr.id === p.id ? { ...pr, bonus: e.target.value } : pr))}
                      onBlur={(e) => handleUpdate(p.id, 'bonus', e.target.value)}
                      style={{ width: '60px', padding: '0.25rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                      disabled={p.status === 'paid'}
                    />
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <input 
                      type="number" 
                      value={p.deductions} 
                      onChange={e => setPayrolls(payrolls.map(pr => pr.id === p.id ? { ...pr, deductions: e.target.value } : pr))}
                      onBlur={(e) => handleUpdate(p.id, 'deductions', e.target.value)}
                      style={{ width: '60px', padding: '0.25rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                      disabled={p.status === 'paid'}
                    />
                  </td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', fontWeight: 700, color: '#10b981' }}>
                    ₦{parseFloat(p.net_pay || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    {p.status === 'paid' ? (
                      <span className="badge badge--approved">Paid</span>
                    ) : (
                      <button 
                        onClick={() => handlePay(p.id)}
                        className="btn btn--gold"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
