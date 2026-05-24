import React, { useState, useEffect, useRef } from 'react';
import { apiUrl } from '../../../utils/api';
import PortalLayout from '../../../components/layout/PortalLayout';
import './CertificateGenerator.css';

export default function CertificateGenerator() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [certificateType, setCertificateType] = useState('Graduation Diploma');
  const certificateRef = useRef(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch(apiUrl('/api/students?limit=500'), {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        if (data.success) {
          setStudents(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch students', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <PortalLayout>
      <div className="admin-dash text-slate-800 no-print">
        <section className="dash-hero" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="dash-hero__text">
            <span className="dash-hero__label">Graduation & Alumni</span>
            <h1 className="dash-hero__title">Certificate Generator</h1>
            <p className="dash-hero__subtitle">
              Instantly generate and download beautifully formatted certificates for students.
            </p>
          </div>
        </section>

        <div className="dash-main-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
          {/* Controls Panel */}
          <div className="dash-pane">
            <h3 className="dash-pane__title">Certificate Details</h3>
            
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Select Student</label>
              <select 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                value={selectedStudent ? selectedStudent.id : ''}
                onChange={e => setSelectedStudent(students.find(s => s.id === e.target.value))}
              >
                <option value="">-- Choose Student --</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.admission_number})</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Certificate Type</label>
              <select 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                value={certificateType}
                onChange={e => setCertificateType(e.target.value)}
              >
                <option value="Graduation Diploma">Graduation Diploma</option>
                <option value="Certificate of Excellence">Certificate of Excellence</option>
                <option value="Certificate of Participation">Certificate of Participation</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Issue Date</label>
              <input 
                type="date"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                value={issueDate}
                onChange={e => setIssueDate(e.target.value)}
              />
            </div>

            <button 
              className="btn btn--gold" 
              style={{ width: '100%', padding: '1rem', fontWeight: 700 }}
              onClick={handlePrint}
              disabled={!selectedStudent}
            >
              Generate & Print PDF
            </button>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.75rem', textAlign: 'center' }}>
              Tip: Set destination to "Save as PDF" and use Landscape layout in the print dialog.
            </p>
          </div>

          {/* Preview Panel */}
          <div className="dash-pane" style={{ backgroundColor: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center', overflowX: 'auto', padding: '2rem' }}>
            {!selectedStudent ? (
              <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🎓</span>
                <p>Select a student to preview the certificate.</p>
              </div>
            ) : (
              <div className="certificate-preview-wrapper" style={{ transform: 'scale(0.65)', transformOrigin: 'top center' }}>
                <div className="print-certificate" ref={certificateRef}>
                  <div className="cert-border-outer">
                    <div className="cert-border-inner">
                      <div className="cert-header">
                        <img src="/logo.svg" alt="Grandview Logo" className="cert-logo" onError={(e) => e.target.style.display='none'} />
                        <h1 className="cert-school-name">Grandview Academy</h1>
                        <p className="cert-motto">Excellence Rooted in Tradition</p>
                      </div>
                      
                      <div className="cert-body">
                        <h2 className="cert-title">{certificateType}</h2>
                        <p className="cert-subtitle">This is to certify that</p>
                        <h3 className="cert-student-name">{selectedStudent.first_name} {selectedStudent.last_name}</h3>
                        <p className="cert-description">
                          has successfully fulfilled the academic requirements prescribed by the Academy and is hereby awarded this certificate with all the rights, honors, and privileges appertaining thereto.
                        </p>
                      </div>

                      <div className="cert-footer">
                        <div className="cert-signature">
                          <div className="sig-line"></div>
                          <p>Principal / Administrator</p>
                        </div>
                        <div className="cert-seal">
                          <div className="seal-badge">SEAL</div>
                        </div>
                        <div className="cert-signature">
                          <p style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.25rem' }}>{new Date(issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          <div className="sig-line"></div>
                          <p>Date of Issue</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* The Actual Hidden Print DOM */}
      {selectedStudent && (
        <div className="print-only">
          <div className="print-certificate">
            <div className="cert-border-outer">
              <div className="cert-border-inner">
                <div className="cert-header">
                  <h1 className="cert-school-name">Grandview Academy</h1>
                  <p className="cert-motto">Excellence Rooted in Tradition</p>
                </div>
                
                <div className="cert-body">
                  <h2 className="cert-title">{certificateType}</h2>
                  <p className="cert-subtitle">This is to certify that</p>
                  <h3 className="cert-student-name">{selectedStudent.first_name} {selectedStudent.last_name}</h3>
                  <p className="cert-description">
                    has successfully fulfilled the academic requirements prescribed by the Academy and is hereby awarded this certificate with all the rights, honors, and privileges appertaining thereto.
                  </p>
                </div>

                <div className="cert-footer">
                  <div className="cert-signature">
                    <div className="sig-line"></div>
                    <p>Principal / Administrator</p>
                  </div>
                  <div className="cert-seal">
                    <div className="seal-badge">SEAL</div>
                  </div>
                  <div className="cert-signature">
                    <p style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.25rem' }}>{new Date(issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <div className="sig-line"></div>
                    <p>Date of Issue</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
