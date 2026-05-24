import { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import './ContactPage.css';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
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
      title="Contact Us"
      description="Get in touch with Grandview Academy. Find our address, phone number, email, office hours, and send us a message directly."
    >
      <section className="page-header">
        <div className="container">
          <span className="page-header__label">Get in Touch</span>
          <h1 className="page-header__title">Contact Us</h1>
          <p className="page-header__subtitle">
            We are here to answer your questions. Reach out to us through any of the 
            channels below, or send a message using the contact form.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container contact-layout">
          {/* Contact Info */}
          <div className="contact-info">
            <div className="contact-block">
              <h3 className="contact-block__title">Campus Address</h3>
              <p className="contact-block__text">
                12 Academy Drive<br />
                Victoria Island<br />
                Lagos, Nigeria
              </p>
            </div>

            <div className="contact-block">
              <h3 className="contact-block__title">Phone</h3>
              <p className="contact-block__text">
                Main Line: +234 (0) 812 345 6789<br />
                Admissions: +234 (0) 812 345 6790<br />
                University: +234 (0) 812 345 6791
              </p>
            </div>

            <div className="contact-block">
              <h3 className="contact-block__title">Email</h3>
              <p className="contact-block__text">
                General: info@grandviewacademy.edu.ng<br />
                Admissions: admissions@grandviewacademy.edu.ng<br />
                Support: support@grandviewacademy.edu.ng
              </p>
            </div>

            <div className="contact-block">
              <h3 className="contact-block__title">Office Hours</h3>
              <p className="contact-block__text">
                Monday – Friday: 7:30 AM – 4:00 PM<br />
                Saturday: 9:00 AM – 1:00 PM (Admissions only)<br />
                Sunday: Closed
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="contact-form-section">
            <h2 className="contact-form-section__title">Send Us a Message</h2>
            <p className="contact-form-section__subtitle">
              Fill out the form below and we will get back to you within 1–2 working days.
            </p>
            {submitted ? (
              <div className="form-success">
                <h3>Message sent successfully.</h3>
                <p>We will respond to your enquiry within 1–2 working days. Thank you for contacting Grandview Academy.</p>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="contact-name">Full Name</label>
                    <input className="form-input" type="text" id="contact-name" name="name" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="contact-email">Email Address</label>
                    <input className="form-input" type="email" id="contact-email" name="email" value={formData.email} onChange={handleChange} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-subject">Subject</label>
                  <select className="form-input" id="contact-subject" name="subject" value={formData.subject} onChange={handleChange} required>
                    <option value="">Select a subject</option>
                    <option value="general">General Enquiry</option>
                    <option value="admissions">Admissions</option>
                    <option value="fees">Fees & Payments</option>
                    <option value="academic">Academic Matters</option>
                    <option value="portal">Portal Support</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-message">Message</label>
                  <textarea className="form-input" id="contact-message" name="message" value={formData.message} onChange={handleChange} placeholder="How can we help you?" required></textarea>
                </div>
                <button type="submit" className="btn btn--primary">Send Message</button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="map-section" style={{ backgroundColor: '#f9fafb', padding: '2rem 0' }}>
        <img src="/images/school_map.png" alt="Map — 12 Academy Drive, Victoria Island, Lagos" style={{ width: '100%', height: 'auto', maxHeight: '600px', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
      </section>
    </PageWrapper>
  );
}
