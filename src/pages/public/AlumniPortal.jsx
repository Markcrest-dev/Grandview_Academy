import React, { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import './AlumniPortal.css';

export default function AlumniPortal() {
  const [activeTab, setActiveTab] = useState('login');
  
  // Registration Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    graduationYear: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/alumni/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit application');
      }

      setSubmitSuccess(true);
      setFormData({ firstName: '', lastName: '', graduationYear: '', email: '' });
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageWrapper
      title="Alumni Portal"
      description="Stay connected with Grandview Academy. Join our alumni network."
    >
      <section className="section section--subtle">
        <div className="container">
          <div className="section-heading" style={{ textAlign: 'center' }}>
            <span className="section-heading__label">Grandview Network</span>
            <h1 className="section-heading__title">Alumni Portal</h1>
            <p className="section-heading__description" style={{ margin: '1rem auto 0', maxWidth: '42rem' }}>
              Welcome back! Reconnect with classmates, access exclusive networking opportunities, 
              and stay updated on the latest developments at your alma mater.
            </p>
          </div>

          <div className="alumni-portal-card">
            <div className="alumni-tabs">
              <button
                className={`alumni-tabs__btn ${activeTab === 'login' ? 'alumni-tabs__btn--active' : ''}`}
                onClick={() => setActiveTab('login')}
              >
                Login
              </button>
              <button
                className={`alumni-tabs__btn ${activeTab === 'register' ? 'alumni-tabs__btn--active' : ''}`}
                onClick={() => setActiveTab('register')}
              >
                Join Network
              </button>
            </div>

            <div className="alumni-form-wrapper">
              {activeTab === 'login' ? (
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="alumni-form-options">
                    <div className="alumni-checkbox-group">
                      <input id="remember" type="checkbox" className="alumni-checkbox" />
                      <label htmlFor="remember" className="alumni-checkbox-label">Remember me</label>
                    </div>
                    <a href="#" className="alumni-forgot-link">Forgot password?</a>
                  </div>
                  <button type="submit" className="btn btn--primary alumni-btn">
                    Sign In
                  </button>
                </form>
              ) : submitSuccess ? (
                <div className="alumni-success-message" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem' }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <h3 style={{ marginBottom: '0.5rem' }}>Application Received</h3>
                  <p style={{ color: 'var(--color-subtle)' }}>Your request to join the alumni network has been submitted and is pending verification. You will receive an email once approved.</p>
                  <button 
                    onClick={() => setSubmitSuccess(false)}
                    className="btn btn--outline"
                    style={{ marginTop: '1.5rem' }}
                  >
                    Submit Another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegister}>
                  {submitError && (
                    <div className="form-error" style={{ color: 'var(--color-danger)', marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>
                      {submitError}
                    </div>
                  )}
                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="form-input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="form-input" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Graduation Year</label>
                    <select name="graduationYear" value={formData.graduationYear} onChange={handleChange} required className="form-input">
                      <option value="">Select Year</option>
                      {[...Array(30)].map((_, i) => (
                        <option key={i} value={2026 - i}>{2026 - i}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className="form-input" />
                  </div>
                  <button type="submit" disabled={isSubmitting} className="btn btn--primary alumni-btn">
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                  <p className="alumni-form-note">
                    All applications are verified by the school administration before access is granted.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
