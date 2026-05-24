import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiUrl } from '../../../utils/api';

export default function TranscriptView() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadTranscript() {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // Load Student Info
        const stdRes = await fetch(apiUrl(`/api/students`), { headers });
        const stdData = await stdRes.json();
        if (stdData.success && stdData.data) {
          const s = stdData.data.find(st => st.id === studentId);
          if (s) setStudent(s);
          else throw new Error("Student not found.");
        }

        // Load Grades
        const grdRes = await fetch(apiUrl(`/api/grades/student/${studentId}`), { headers });
        const grdData = await grdRes.json();
        if (grdData.success) {
          setGrades(grdData.data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadTranscript();
  }, [studentId]);

  // Aggregate grades by term
  const termGrades = useMemo(() => {
    const termsMap = new Map();

    grades.forEach(g => {
      const termName = g.terms?.name || 'Unknown Term';
      if (!termsMap.has(termName)) {
        termsMap.set(termName, []);
      }
      termsMap.get(termName).push(g);
    });

    return Array.from(termsMap.entries()).map(([term, termEntries]) => {
      // Calculate term average
      const totalScore = termEntries.reduce((sum, g) => sum + ((g.score / g.max_score) * 100), 0);
      const average = termEntries.length > 0 ? (totalScore / termEntries.length) : 0;
      
      let letterGrade = 'F';
      if (average >= 75) letterGrade = 'A';
      else if (average >= 60) letterGrade = 'B';
      else if (average >= 50) letterGrade = 'C';
      else if (average >= 40) letterGrade = 'D';

      return { term, entries: termEntries, average, letterGrade };
    });
  }, [grades]);

  // Cumulative GPA (using average % / 20 = 5.0 scale approx)
  const cumulativeAverage = useMemo(() => {
    if (termGrades.length === 0) return 0;
    const sum = termGrades.reduce((acc, tg) => acc + tg.average, 0);
    return sum / termGrades.length;
  }, [termGrades]);
  
  const gpa = (cumulativeAverage / 20).toFixed(2);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
        <p>Generating Official Transcript...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
        <h3>Failed to load transcript</h3>
        <p>{error}</p>
        <button onClick={() => navigate(-1)} style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}>Go Back</button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Non-printable controls */}
      <div className="no-print" style={{ width: '100%', maxWidth: '210mm', display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <button onClick={() => navigate(-1)} style={{ padding: '0.5rem 1rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
          ← Back
        </button>
        <button onClick={() => window.print()} style={{ padding: '0.5rem 1rem', background: 'var(--color-gold, #C9A84C)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          🖨️ Print Transcript
        </button>
      </div>

      {/* A4 Printable Document Container */}
      <div 
        className="print-container"
        style={{
          width: '210mm',
          minHeight: '297mm',
          backgroundColor: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          padding: '20mm',
          boxSizing: 'border-box',
          position: 'relative'
        }}
      >
        <style>
          {`
            @media print {
              body * { visibility: hidden; }
              .print-container, .print-container * { visibility: visible; }
              .print-container { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; margin: 0; padding: 20mm; }
              .no-print { display: none !important; }
            }
          `}
        </style>

        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid var(--color-navy, #1b2a4a)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--color-navy, #1b2a4a)', margin: 0, textTransform: 'uppercase', letterSpacing: '2px' }}>Grandview Academy</h1>
          <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>Official Academic Transcript</p>
        </div>

        {/* Student Details Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem' }}><strong style={{ color: '#475569', display: 'inline-block', width: '120px' }}>Student Name:</strong> <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{student.first_name} {student.last_name}</span></p>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem' }}><strong style={{ color: '#475569', display: 'inline-block', width: '120px' }}>Admission No:</strong> <span style={{ color: '#0f172a' }}>{student.admission_number}</span></p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem' }}><strong style={{ color: '#475569' }}>Date Issued:</strong> <span style={{ color: '#0f172a' }}>{new Date().toLocaleDateString()}</span></p>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem' }}><strong style={{ color: '#475569' }}>Cumulative GPA:</strong> <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{gpa} / 5.0</span></p>
          </div>
        </div>

        {/* Grades Table */}
        {termGrades.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', margin: '4rem 0' }}>No academic records found for this student.</p>
        ) : (
          termGrades.map((tg, i) => (
            <div key={i} style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{tg.term}</h3>
                <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                  Term Average: <strong style={{ color: '#0f172a' }}>{tg.average.toFixed(1)}% ({tg.letterGrade})</strong>
                </span>
              </div>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #cbd5e1' }}>Subject Code</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #cbd5e1' }}>Subject Name</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #cbd5e1', textAlign: 'center' }}>Score</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #cbd5e1' }}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {tg.entries.map((g, j) => {
                    const pct = (g.score / g.max_score) * 100;
                    let l = 'F';
                    if (pct >= 75) l = 'A';
                    else if (pct >= 60) l = 'B';
                    else if (pct >= 50) l = 'C';
                    else if (pct >= 40) l = 'D';

                    return (
                      <tr key={j}>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#64748b' }}>{g.subjects?.code}</td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9', color: '#1e293b' }}>{g.subjects?.name}</td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontWeight: 'bold' }}>{pct.toFixed(1)}% ({l})</td>
                        <td style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{g.remarks || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))
        )}

        {/* Footer */}
        <div style={{ position: 'absolute', bottom: '20mm', left: '20mm', right: '20mm', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
          <span>* This document is generated electronically.</span>
          <span>Grandview Academy Registrar</span>
        </div>

      </div>
    </div>
  );
}
