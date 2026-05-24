import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../utils/api';
import PortalLayout from '../../../components/layout/PortalLayout';
import './ReceiptPage.css';

export default function ReceiptPage() {
  const { paymentId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadReceipt() {
      try {
        const res = await fetch(apiUrl(`/api/fees/receipts/${paymentId}`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setReceipt(data.data);
        } else {
          setError(data.message || 'Receipt not found.');
        }
      } catch (err) {
        setError('Failed to load receipt.');
      } finally {
        setLoading(false);
      }
    }
    loadReceipt();
  }, [paymentId, token]);

  if (loading) {
    return (
      <PortalLayout>
        <div className="receipt-loading">Loading receipt...</div>
      </PortalLayout>
    );
  }

  if (error || !receipt) {
    return (
      <PortalLayout>
        <div className="receipt-error">
          <p>{error || 'Receipt not found.'}</p>
          <button className="receipt-back-btn" onClick={() => navigate(-1)}>← Go Back</button>
        </div>
      </PortalLayout>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const formatMethod = (method) => {
    const map = { paystack: 'Paystack (Online)', cash: 'Cash', bank_transfer: 'Bank Transfer', pos: 'POS Terminal' };
    return map[method] || method;
  };

  return (
    <PortalLayout>
      <div className="receipt-page">
        <div className="receipt-card">
          {/* Letterhead */}
          <div className="receipt-header">
            <h1 className="receipt-school-name">🏰 {receipt.school.name}</h1>
            <p className="receipt-tagline">{receipt.school.tagline}</p>
            <p className="receipt-address">{receipt.school.address} · {receipt.school.email}</p>
            <h2 className="receipt-title">Official Payment Receipt</h2>
          </div>

          {/* Body */}
          <div className="receipt-body">
            {/* Student Details */}
            <div className="receipt-section">
              <h3 className="receipt-section-title">Student Information</h3>
              <div className="receipt-grid">
                <div className="receipt-field">
                  <span className="receipt-label">Student Name</span>
                  <span className="receipt-value">{receipt.student.name}</span>
                </div>
                <div className="receipt-field">
                  <span className="receipt-label">Admission No.</span>
                  <span className="receipt-value">{receipt.student.admissionNumber || '—'}</span>
                </div>
                <div className="receipt-field">
                  <span className="receipt-label">Class</span>
                  <span className="receipt-value">{receipt.student.class || '—'}</span>
                </div>
                <div className="receipt-field">
                  <span className="receipt-label">Level</span>
                  <span className="receipt-value" style={{ textTransform: 'capitalize' }}>{receipt.student.level || '—'}</span>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="receipt-section">
              <h3 className="receipt-section-title">Payment Details</h3>
              <div className="receipt-grid">
                <div className="receipt-field">
                  <span className="receipt-label">Receipt Number</span>
                  <span className="receipt-value">{receipt.payment.receiptNumber}</span>
                </div>
                <div className="receipt-field">
                  <span className="receipt-label">Payment Date</span>
                  <span className="receipt-value">{formatDate(receipt.payment.date)}</span>
                </div>
                <div className="receipt-field">
                  <span className="receipt-label">Payment Method</span>
                  <span className="receipt-value">{formatMethod(receipt.payment.method)}</span>
                </div>
                <div className="receipt-field">
                  <span className="receipt-label">Fee Type</span>
                  <span className="receipt-value" style={{ textTransform: 'capitalize' }}>{receipt.fee.type || '—'}</span>
                </div>
                <div className="receipt-field">
                  <span className="receipt-label">Academic Year</span>
                  <span className="receipt-value">{receipt.fee.academicYear || '—'}</span>
                </div>
                <div className="receipt-field">
                  <span className="receipt-label">Term</span>
                  <span className="receipt-value">{receipt.fee.term || '—'}</span>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="receipt-section" style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
              <span className="receipt-label">Amount Paid</span>
              <div className="receipt-value receipt-value--amount">
                ₦{Number(receipt.payment.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {receipt.payment.remarks && (
              <div className="receipt-section">
                <h3 className="receipt-section-title">Remarks</h3>
                <p style={{ fontSize: '0.8125rem', color: '#475569', margin: 0 }}>{receipt.payment.remarks}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="receipt-footer">
            <p className="receipt-footer-note">
              Generated {formatDate(receipt.generatedAt)} · This is a computer-generated receipt.
            </p>
            <span className="receipt-stamp">PAID</span>
          </div>
        </div>

        {/* Actions */}
        <div className="receipt-actions">
          <button className="receipt-back-btn" onClick={() => navigate(-1)}>← Back</button>
          <button className="receipt-print-btn" onClick={() => window.print()}>🖨 Print Receipt</button>
        </div>
      </div>
    </PortalLayout>
  );
}
