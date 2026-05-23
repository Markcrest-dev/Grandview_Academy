import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import './LoginPage.css';

const roleConfig = {
  student: {
    title: 'Student Portal',
    idLabel: 'Admission Number',
    idPlaceholder: 'e.g. GA/2024/001',
    description: 'Access your academic records, timetable, results, and learning materials.',
  },
  parent: {
    title: 'Parent / Guardian Portal',
    idLabel: 'Parent ID or Child\'s Admission Number',
    idPlaceholder: 'e.g. GA/2024/001',
    description: 'Monitor your child\'s attendance, grades, fee status, and communicate with teachers.',
  },
  staff: {
    title: 'Staff Portal',
    idLabel: 'Staff ID',
    idPlaceholder: 'e.g. GAS/2020/045',
    description: 'Manage your classes, attendance, grades, and access departmental resources.',
  },
  admin: {
    title: 'System Administration',
    idLabel: 'Admin ID',
    idPlaceholder: 'Enter your admin ID',
    description: 'Authorised personnel only. All activity is logged and monitored.',
  },
};

export default function LoginPage() {
  const { role } = useParams();
  const config = roleConfig[role];
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');

  if (!config) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h2>Invalid login route</h2>
          <p style={{ marginTop: '0.5rem', color: '#888' }}>
            This login page does not exist. Please use a valid portal link.
          </p>
          <Link to="/" className="btn btn--primary" style={{ marginTop: '1.5rem' }}>
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.identifier.trim() || !formData.password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    // Backend integration will go here
    setError('Authentication is not yet connected. This login page is a frontend scaffold — backend integration is in a future phase.');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Branding */}
        <Link to="/" className="login-brand">
          <div className="login-brand__crest">GA</div>
          <span className="login-brand__name">Grandview Academy</span>
        </Link>

        <div className="login-divider"></div>

        <h1 className="login-title">{config.title}</h1>
        <p className="login-description">{config.description}</p>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-id">{config.idLabel}</label>
            <input
              className="form-input"
              type="text"
              id="login-id"
              name="identifier"
              placeholder={config.idPlaceholder}
              value={formData.identifier}
              onChange={handleChange}
              autoComplete="username"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              className="form-input"
              type="password"
              id="login-password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn btn--primary login-submit">
            Sign In
          </button>
        </form>

        <div className="login-footer">
          <a href="#" className="login-footer__link">Forgot your password?</a>
          <span className="login-footer__divider">·</span>
          <Link to="/" className="login-footer__link">Back to Homepage</Link>
        </div>

        {role === 'admin' && (
          <div className="login-audit-notice">
            All login attempts to this portal are recorded and monitored. 
            Unauthorised access will be reported.
          </div>
        )}
      </div>
    </div>
  );
}
