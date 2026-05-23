import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
    idPlaceholder: 'e.g. GAP/2026/089 or GA/2024/001',
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
    idLabel: 'Admin Email',
    idPlaceholder: 'e.g. admin@grandview.edu',
    description: 'Authorised personnel only. All activity is logged and monitored.',
  },
};

export default function LoginPage() {
  const { role } = useParams();
  const config = roleConfig[role];
  const { login, verify2FA } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handle2FAChange = (e) => {
    // Only allow numbers and max length of 6
    const cleanValue = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setTwoFactorCode(cleanValue);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (requires2FA) {
      if (twoFactorCode.length !== 6) {
        setError('Please enter a valid 6-digit verification code.');
        return;
      }

      setLoading(true);
      const result = await verify2FA(tempToken, twoFactorCode);
      setLoading(false);

      if (result.success) {
        navigate('/portal/admin');
      } else {
        setError(result.message);
      }
    } else {
      if (!formData.identifier.trim() || !formData.password.trim()) {
        setError('Please fill in all fields.');
        return;
      }

      setLoading(true);
      const result = await login(formData.identifier, formData.password, role);
      setLoading(false);

      if (result.success) {
        if (result.requires2FA) {
          setRequires2FA(true);
          setTempToken(result.tempToken);
        } else {
          // Direct login success - route to corresponding portal
          const profile = result.user;
          if (role === 'admin') navigate('/portal/admin');
          else if (role === 'student') navigate('/portal/student');
          else if (role === 'parent') navigate('/portal/parent');
          else if (role === 'staff') {
            if (profile.role === 'teaching_staff') {
              navigate('/portal/staff/teaching');
            } else {
              navigate('/portal/staff/non-teaching');
            }
          }
        }
      } else {
        setError(result.message);
      }
    }
  };

  const handleReset2FA = () => {
    setRequires2FA(false);
    setTempToken(null);
    setTwoFactorCode('');
    setError('');
  };

  return (
    <div className={`login-page ${requires2FA ? 'login-page--mfa' : ''}`}>
      <div className={`login-card ${requires2FA ? 'login-card--glass' : ''} fade-in-up`}>
        
        {/* Branding */}
        <Link to="/" className="login-brand">
          <div className="login-brand__crest">GA</div>
          <span className="login-brand__name">Grandview Academy</span>
        </Link>

        <div className="login-divider"></div>

        {!requires2FA ? (
          /* ===== Standard Form State ===== */
          <div className="login-state-form">
            <h1 className="login-title">{config.title}</h1>
            <p className="login-description">{config.description}</p>

            {error && <div className="login-error bounce">{error}</div>}

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label font-medium" htmlFor="login-id">{config.idLabel}</label>
                <input
                  className="form-input transition-all duration-200"
                  type="text"
                  id="login-id"
                  name="identifier"
                  placeholder={config.idPlaceholder}
                  value={formData.identifier}
                  onChange={handleChange}
                  autoComplete="username"
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label className="form-label font-medium" htmlFor="login-password">Password</label>
                <input
                  className="form-input transition-all duration-200"
                  type="password"
                  id="login-password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
              </div>
              <button 
                type="submit" 
                className="btn btn--primary login-submit btn--loading-support"
                disabled={loading}
              >
                {loading ? (
                  <span className="btn-spinner-layout">
                    <span className="mini-spinner"></span> Authenticating...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            <div className="login-footer">
              <a href="#" className="login-footer__link">Forgot your password?</a>
              <span className="login-footer__divider">·</span>
              <Link to="/" className="login-footer__link">Back to Homepage</Link>
            </div>
          </div>
        ) : (
          /* ===== Elegant Glassmorphic 2FA State ===== */
          <div className="login-state-mfa slide-in-right">
            <h1 className="login-title login-title--gold">Admin MFA Verification</h1>
            <p className="login-description login-description--light">
              Enter the 6-digit dynamic verification code from your Google Authenticator or registered TOTP app.
            </p>

            {error && <div className="login-error bounce">{error}</div>}

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label form-label--light text-center mb-4" htmlFor="2fa-code">
                  6-Digit Security Code
                </label>
                <div className="two-fa-code-wrapper">
                  <input
                    className="form-input form-input--glass text-center letter-spacing-wide font-semibold text-xl"
                    type="text"
                    id="2fa-code"
                    name="code"
                    placeholder="0 0 0 0 0 0"
                    maxLength="6"
                    value={twoFactorCode}
                    onChange={handle2FAChange}
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    required
                    disabled={loading}
                    autoFocus
                  />
                  <div className="two-fa-visual-indicator-pulse"></div>
                </div>
              </div>
              <button 
                type="submit" 
                className="btn btn--gold login-submit btn--loading-support"
                disabled={loading || twoFactorCode.length !== 6}
              >
                {loading ? (
                  <span className="btn-spinner-layout">
                    <span className="mini-spinner mini-spinner--navy"></span> Verifying...
                  </span>
                ) : 'Verify & Continue'}
              </button>
            </form>

            <button 
              type="button" 
              className="login-btn-back-to-credentials"
              onClick={handleReset2FA}
              disabled={loading}
            >
              ← Use different credentials
            </button>
          </div>
        )}

        {role === 'admin' && !requires2FA && (
          <div className="login-audit-notice">
            All login attempts to this portal are recorded and monitored. 
            Unauthorised access will be reported.
          </div>
        )}
      </div>
    </div>
  );
}
