import { useState } from 'react';
import { apiUrl } from '../../utils/api';
import PageWrapper from '../../components/layout/PageWrapper';
import './AdmissionsPage.css';

const steps = [
  { number: '01', title: 'Obtain an Application Form', description: 'Application forms are available for download on this page or can be collected in person from the Admissions Office at 12 Academy Drive, Victoria Island, Lagos.' },
  { number: '02', title: 'Submit Completed Application', description: 'Return the completed form along with all required documents to the Admissions Office or submit electronically via the online application form below.' },
  { number: '03', title: 'Entrance Assessment', description: 'Shortlisted candidates will be invited for an entrance assessment. Primary applicants sit a literacy and numeracy test. Secondary applicants write examinations in English, Mathematics, and one science subject. University applicants must meet JAMB and post-UTME requirements.' },
  { number: '04', title: 'Interview', description: 'Successful candidates and their parents or guardians will be invited for a brief interview with the Admissions Committee.' },
  { number: '05', title: 'Offer of Admission', description: 'Successful applicants receive an offer letter detailing the fee schedule, resumption date, and orientation information. Acceptance must be confirmed within 14 days of receiving the offer.' },
];

const requirements = [
  { level: 'Primary School', items: ['Birth Certificate or Age Declaration', 'Previous School Report (if applicable)', 'Immunisation Records', '4 Passport Photographs', 'Parent/Guardian Valid ID'] },
  { level: 'Secondary School', items: ['Primary School Leaving Certificate', 'Last 2 Years Academic Report', 'Birth Certificate', '4 Passport Photographs', 'Parent/Guardian Valid ID'] },
  { level: 'University', items: ['WASSCE/NECO Result (5 credits minimum incl. English & Maths)', 'JAMB Result with Grandview Academy as first choice', 'Birth Certificate or Age Declaration', 'Local Government Identification', '6 Passport Photographs', 'Medical Fitness Certificate'] },
];

const fees = [
  { level: 'Primary School', tuition: '₦450,000', boarding: 'Day only', other: '₦75,000' },
  { level: 'Secondary School (Day)', tuition: '₦650,000', boarding: '—', other: '₦95,000' },
  { level: 'Secondary School (Boarding)', tuition: '₦650,000', boarding: '₦400,000', other: '₦120,000' },
  { level: 'University (per session)', tuition: '₦850,000 – ₦1,200,000', boarding: '₦350,000', other: 'Varies by faculty' },
];

const deadlines = [
  { intake: 'September 2026 Intake', deadline: '30 June 2026', status: 'Open' },
  { intake: 'January 2027 Intake (University only)', deadline: '15 November 2026', status: 'Open' },
];

export default function AdmissionsPage() {
  const [currentStep, setCurrentStep] = useState(1); // 1: Student details, 2: Parent details, 3: Review, 4: Success
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    date_of_birth: '',
    gender: '',
    level: '',
    previous_school: '',
    grade_applied_for: '',
    parent_first_name: '',
    parent_last_name: '',
    parent_email: '',
    parent_phone: '',
    parent_relationship: '',
    parent_address: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateStep1 = () => {
    const { first_name, last_name, date_of_birth, gender, level } = formData;
    if (!first_name || !last_name || !date_of_birth || !gender || !level) {
      setErrorMsg('Please fill in all required student details.');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const validateStep2 = () => {
    const { parent_first_name, parent_last_name, parent_email, parent_phone, parent_relationship, parent_address } = formData;
    if (!parent_first_name || !parent_last_name || !parent_email || !parent_phone || !parent_relationship || !parent_address) {
      setErrorMsg('Please fill in all required parent details.');
      return false;
    }
    // Simple email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parent_email)) {
      setErrorMsg('Please provide a valid email address for the parent.');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handlePrev = () => {
    setErrorMsg(null);
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep1() || !validateStep2()) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch(apiUrl('/api/admissions/apply'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        setCurrentStep(4);
      } else {
        setErrorMsg(resData.message || 'Failed to submit application. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Connection error. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper
      title="Admissions"
      description="Apply to Grandview Academy. Learn about admission requirements, fees, deadlines, and the application process for Primary, Secondary, and University levels."
    >
      <section className="page-header">
        <div className="container">
          <span className="page-header__label">Join Grandview Academy</span>
          <h1 className="page-header__title">Admissions</h1>
          <p className="page-header__subtitle">
            We welcome applications from students at all levels. Below you will find 
            everything you need to know about our admission process, requirements, and fees.
          </p>
        </div>
      </section>

      {/* Application Process */}
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <span className="section-heading__label">How to Apply</span>
            <h2 className="section-heading__title">Application Process</h2>
          </div>
          <div className="admission-steps">
            {steps.map((step) => (
              <div key={step.number} className="admission-step">
                <span className="admission-step__number">{step.number}</span>
                <div className="admission-step__content">
                  <h3 className="admission-step__title">{step.title}</h3>
                  <p className="admission-step__description">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="section section--subtle">
        <div className="container">
          <div className="section-heading">
            <span className="section-heading__label">What You Need</span>
            <h2 className="section-heading__title">Admission Requirements</h2>
          </div>
          <div className="requirements-grid">
            {requirements.map((req, i) => (
              <div key={i} className="requirements-card">
                <h3 className="requirements-card__title">{req.level}</h3>
                <ul className="requirements-card__list">
                  {req.items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fee Overview */}
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <span className="section-heading__label">Financial Information</span>
            <h2 className="section-heading__title">Fee Overview</h2>
            <p className="section-heading__description">
              Fees are payable per term for Primary and Secondary levels, and per session 
              for University. Payment plans are available upon request.
            </p>
          </div>
          <div className="calendar-table-wrapper">
            <table className="calendar-table">
              <thead>
                <tr>
                  <th>Level</th>
                  <th>Tuition (per term/session)</th>
                  <th>Boarding</th>
                  <th>Other Charges</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((fee, i) => (
                  <tr key={i}>
                    <td><strong>{fee.level}</strong></td>
                    <td>{fee.tuition}</td>
                    <td>{fee.boarding}</td>
                    <td>{fee.other}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Deadlines */}
      <section className="section section--subtle">
        <div className="container">
          <div className="section-heading">
            <span className="section-heading__label">Key Dates</span>
            <h2 className="section-heading__title">Application Deadlines</h2>
          </div>
          <div className="deadlines-list">
            {deadlines.map((d, i) => (
              <div key={i} className="deadline-item">
                <div>
                  <h3 className="deadline-item__intake">{d.intake}</h3>
                  <p className="deadline-item__date">Deadline: {d.deadline}</p>
                </div>
                <span className={`badge ${d.status === 'Open' ? '' : 'badge--closed'}`}>{d.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Online Application Form */}
      <section className="section" id="application-form">
        <div className="container">
          <div className="admissions-form-layout" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="section-heading section-heading--center">
              <span className="section-heading__label">Join Our Community</span>
              <h2 className="section-heading__title">Online Application Portal</h2>
              <p className="section-heading__description" style={{ maxWidth: '600px', margin: '0 auto' }}>
                Complete the three-step application wizard to submit your child's enrollment application.
              </p>
            </div>

            {/* Stepper Header */}
            {currentStep <= 3 && (
              <div className="application-stepper-header">
                <div className={`stepper-node ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                  <span className="step-num">1</span>
                  <span className="step-label">Student Details</span>
                </div>
                <div className="stepper-connector"></div>
                <div className={`stepper-node ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                  <span className="step-num">2</span>
                  <span className="step-label">Parent Details</span>
                </div>
                <div className="stepper-connector"></div>
                <div className={`stepper-node ${currentStep === 3 ? 'active' : ''}`}>
                  <span className="step-num">3</span>
                  <span className="step-label">Review & Submit</span>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="form-error-banner" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FDF2F2', border: '1px solid #F8B4B4', padding: '1rem', borderRadius: '4px', color: '#9B1C1C', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                <span style={{ fontWeight: 'bold' }}>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="application-wizard-container">
              {/* STEP 1: Student Information */}
              {currentStep === 1 && (
                <div className="wizard-step-pane">
                  <h3 className="wizard-step-title">Step 1: Student Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="first_name">First Name <span className="req">*</span></label>
                      <input className="form-input" type="text" id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="last_name">Last Name <span className="req">*</span></label>
                      <input className="form-input" type="text" id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="middle_name">Middle Name</label>
                      <input className="form-input" type="text" id="middle_name" name="middle_name" value={formData.middle_name} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="gender">Gender <span className="req">*</span></label>
                      <select className="form-input" id="gender" name="gender" value={formData.gender} onChange={handleChange} required>
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="date_of_birth">Date of Birth <span className="req">*</span></label>
                      <input className="form-input" type="date" id="date_of_birth" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="level">Academic Level <span className="req">*</span></label>
                      <select className="form-input" id="level" name="level" value={formData.level} onChange={handleChange} required>
                        <option value="">Select Level</option>
                        <option value="primary">Primary School</option>
                        <option value="secondary">Secondary School</option>
                        <option value="university">University</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="grade_applied_for">Grade / Programme Applied For</label>
                      <input className="form-input" type="text" id="grade_applied_for" name="grade_applied_for" placeholder="e.g. JSS 1, Primary 3, B.Sc Computer Science" value={formData.grade_applied_for} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="previous_school">Previous School Attended</label>
                      <input className="form-input" type="text" id="previous_school" name="previous_school" value={formData.previous_school} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="wizard-actions">
                    <div></div>
                    <button type="button" className="btn btn--primary" onClick={handleNext}>Next: Parent Details →</button>
                  </div>
                </div>
              )}

              {/* STEP 2: Parent Details */}
              {currentStep === 2 && (
                <div className="wizard-step-pane">
                  <h3 className="wizard-step-title">Step 2: Parent / Guardian Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="parent_first_name">Parent First Name <span className="req">*</span></label>
                      <input className="form-input" type="text" id="parent_first_name" name="parent_first_name" value={formData.parent_first_name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="parent_last_name">Parent Last Name <span className="req">*</span></label>
                      <input className="form-input" type="text" id="parent_last_name" name="parent_last_name" value={formData.parent_last_name} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="parent_email">Parent Email Address <span className="req">*</span></label>
                      <input className="form-input" type="email" id="parent_email" name="parent_email" value={formData.parent_email} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="parent_phone">Parent Phone Number <span className="req">*</span></label>
                      <input className="form-input" type="tel" id="parent_phone" name="parent_phone" value={formData.parent_phone} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label" htmlFor="parent_relationship">Relationship to Student <span className="req">*</span></label>
                      <select className="form-input" id="parent_relationship" name="parent_relationship" value={formData.parent_relationship} onChange={handleChange} required>
                        <option value="">Select Relationship</option>
                        <option value="father">Father</option>
                        <option value="mother">Mother</option>
                        <option value="guardian">Guardian</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="parent_address">Residential Address <span className="req">*</span></label>
                    <textarea className="form-input" id="parent_address" name="parent_address" rows="3" value={formData.parent_address} onChange={handleChange} required></textarea>
                  </div>
                  <div className="wizard-actions">
                    <button type="button" className="btn btn--outline" onClick={handlePrev}>← Back</button>
                    <button type="button" className="btn btn--primary" onClick={handleNext}>Next: Review Details →</button>
                  </div>
                </div>
              )}

              {/* STEP 3: Review & Confirm */}
              {currentStep === 3 && (
                <div className="wizard-step-pane">
                  <h3 className="wizard-step-title" style={{ marginBottom: '1.5rem' }}>Step 3: Review Your Application</h3>
                  
                  <div className="review-section">
                    <h4 className="review-section-title">🎒 Student Demographics</h4>
                    <table className="review-table">
                      <tbody>
                        <tr>
                          <th>Full Name:</th>
                          <td>{formData.first_name} {formData.middle_name} {formData.last_name}</td>
                          <th>Gender:</th>
                          <td style={{ textTransform: 'capitalize' }}>{formData.gender}</td>
                        </tr>
                        <tr>
                          <th>Date of Birth:</th>
                          <td>{formData.date_of_birth}</td>
                          <th>Academic Level:</th>
                          <td style={{ textTransform: 'capitalize' }}>{formData.level}</td>
                        </tr>
                        <tr>
                          <th>Grade/Programme:</th>
                          <td>{formData.grade_applied_for || '—'}</td>
                          <th>Previous School:</th>
                          <td>{formData.previous_school || '—'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="review-section" style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
                    <h4 className="review-section-title">👪 Parent / Guardian Details</h4>
                    <table className="review-table">
                      <tbody>
                        <tr>
                          <th>Parent Name:</th>
                          <td>{formData.parent_first_name} {formData.parent_last_name}</td>
                          <th>Relationship:</th>
                          <td style={{ textTransform: 'capitalize' }}>{formData.parent_relationship}</td>
                        </tr>
                        <tr>
                          <th>Email Address:</th>
                          <td>{formData.parent_email}</td>
                          <th>Phone Number:</th>
                          <td>{formData.parent_phone}</td>
                        </tr>
                        <tr>
                          <th>Address:</th>
                          <td colSpan="3">{formData.parent_address}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="wizard-actions">
                    <button type="button" className="btn btn--outline" onClick={handlePrev}>← Back</button>
                    <button type="button" className="btn btn--gold" onClick={handleSubmit} disabled={loading}>
                      {loading ? 'Submitting Application...' : 'Submit Application ✓'}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Success Message */}
              {currentStep === 4 && (
                <div className="form-success glass-card" style={{ border: '1px solid var(--color-gold)', background: 'rgba(255, 255, 255, 0.9)', boxShadow: '0 8px 32px 0 rgba(201, 168, 76, 0.1)', backdropFilter: 'blur(8px)', textAlign: 'center', padding: '3rem 2rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '3rem', color: 'var(--color-gold)', marginBottom: '1rem' }}>✓</div>
                  <h3 style={{ fontSize: '1.5rem', color: 'var(--color-navy)', marginBottom: '1rem' }}>Application Submitted Successfully!</h3>
                  <p style={{ fontSize: '0.9375rem', lineHeight: '1.8', maxWidth: '600px', margin: '0 auto 2rem' }}>
                    Thank you for applying to Grandview Academy. Your application has been logged under student name <strong>{formData.first_name} {formData.last_name}</strong>. 
                    An admissions officer will review your application and contact you at <strong>{formData.parent_email}</strong> within 2 working days regarding the entrance assessment schedule.
                  </p>
                  <button type="button" className="btn btn--primary" onClick={() => {
                    setFormData({
                      first_name: '',
                      last_name: '',
                      middle_name: '',
                      date_of_birth: '',
                      gender: '',
                      level: '',
                      previous_school: '',
                      grade_applied_for: '',
                      parent_first_name: '',
                      parent_last_name: '',
                      parent_email: '',
                      parent_phone: '',
                      parent_relationship: '',
                      parent_address: ''
                    });
                    setCurrentStep(1);
                  }}>Apply for Another Student</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
