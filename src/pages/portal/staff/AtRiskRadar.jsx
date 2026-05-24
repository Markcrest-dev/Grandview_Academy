import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../../utils/api';

export default function AtRiskRadar() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAtRisk = async () => {
      try {
        const res = await fetch(apiUrl('/api/academics/at-risk'), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await res.json();
        if (data.success) {
          setStudents(data.data);
        }
      } catch (err) {
        console.error('Error fetching at-risk radar:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAtRisk();
  }, []);

  if (loading) {
    return (
      <div className="metric-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="pane-spinner" style={{ margin: '0 auto 0.5rem' }}></div>
        <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Scanning performance metrics...</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="metric-card" style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <span style={{ fontSize: '2rem' }}>🎉</span>
        <h4 style={{ color: '#166534', margin: '0.5rem 0' }}>All Clear!</h4>
        <p style={{ fontSize: '0.875rem', color: '#15803d' }}>No students are currently flagged as at-risk based on our AI radar.</p>
      </div>
    );
  }

  return (
    <div className="dash-pane" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
        <h3 className="dash-pane__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b91c1c' }}>
          <span>⚠️</span> AI At-Risk Radar
        </h3>
        <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}>
          {students.length} Flagged
        </span>
      </div>
      
      <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
        The system has identified these students as potentially struggling based on grading and attendance heuristics. Early intervention is recommended.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {students.map(s => (
          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid #fecaca', borderRadius: '6px', backgroundColor: '#fff5f5' }}>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#7f1d1d', margin: '0 0 0.25rem 0' }}>
                {s.first_name} {s.last_name} ({s.classes?.name})
              </h4>
              <div style={{ fontSize: '0.8rem', color: '#991b1b', display: 'flex', gap: '1rem' }}>
                <span><strong>Avg:</strong> {s.avg_score.toFixed(1)}%</span>
                <span><strong>Att:</strong> {s.attendance_rate.toFixed(1)}%</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end' }}>
              {s.risk_factors.map((factor, idx) => (
                <span key={idx} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '4px' }}>
                  {factor}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
