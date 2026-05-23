import { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import './AdmissionsPage.css';

const steps = [
  { number: '01', title: 'Obtain an Application Form', description: 'Application forms are available for download on this page or can be collected in person from the Admissions Office at 12 Academy Drive, Victoria Island, Lagos.' },
  { number: '02', title: 'Submit Completed Application', description: 'Return the completed form along with all required documents to the Admissions Office or submit electronically via the enquiry form below. A non-refundable application fee of ₦10,000 applies.' },
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
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', level: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
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

      {/* Enquiry Form */}
      <section className="section">
        <div className="container">
          <div className="admissions-form-layout">
            <div className="section-heading">
              <span className="section-heading__label">Get in Touch</span>
              <h2 className="section-heading__title">Admissions Enquiry</h2>
              <p className="section-heading__description">
                Have questions about the admissions process? Fill out the form below 
                and our Admissions Office will respond within 2 working days.
              </p>
            </div>
            {submitted ? (
              <div className="form-success">
                <h3>Thank you for your enquiry.</h3>
                <p>Our Admissions Office will contact you within 2 working days.</p>
              </div>
            ) : (
              <form className="admissions-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="adm-name">Full Name</label>
                    <input className="form-input" type="text" id="adm-name" name="name" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="adm-email">Email Address</label>
                    <input className="form-input" type="email" id="adm-email" name="email" value={formData.email} onChange={handleChange} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="adm-phone">Phone Number</label>
                    <input className="form-input" type="tel" id="adm-phone" name="phone" value={formData.phone} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="adm-level">Level of Interest</label>
                    <select className="form-input" id="adm-level" name="level" value={formData.level} onChange={handleChange} required>
                      <option value="">Select level</option>
                      <option value="primary">Primary School</option>
                      <option value="secondary">Secondary School</option>
                      <option value="university">University</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="adm-message">Your Message</label>
                  <textarea className="form-input" id="adm-message" name="message" value={formData.message} onChange={handleChange} placeholder="Tell us about your enquiry..." required></textarea>
                </div>
                <button type="submit" className="btn btn--primary">Submit Enquiry</button>
              </form>
            )}
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
