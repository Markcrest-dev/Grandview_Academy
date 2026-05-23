import PageWrapper from '../../components/layout/PageWrapper';
import './AboutPage.css';

const timeline = [
  { year: '1991', title: 'Foundation', description: 'Grandview Academy was established as a primary school in Victoria Island, Lagos, with an inaugural class of 45 students and 8 teachers.' },
  { year: '1998', title: 'Secondary School Opens', description: 'Responding to growing demand, the secondary school division was launched with a focus on preparing students for WASSCE and NECO examinations.' },
  { year: '2007', title: 'New Campus', description: 'A purpose-built campus was inaugurated featuring modern classrooms, science laboratories, a library complex, and sporting facilities.' },
  { year: '2014', title: 'University Charter', description: 'Grandview Academy received its university charter from the National Universities Commission, beginning with three founding faculties.' },
  { year: '2021', title: '30th Anniversary', description: 'The institution celebrated thirty years of academic service with over 12,000 alumni across Nigeria and internationally.' },
  { year: '2026', title: 'Digital Transformation', description: 'Launch of the integrated School Management System connecting students, parents, and staff through a unified digital platform.' },
];

const values = [
  { title: 'Academic Rigour', description: 'We maintain the highest standards of intellectual inquiry. Every programme is designed to challenge students and foster deep, independent thinking.' },
  { title: 'Integrity', description: 'Honesty, transparency, and ethical conduct are the foundation of every interaction within our institution — from the classroom to the administration.' },
  { title: 'Community', description: 'We believe education is a collective effort. Grandview Academy is a community of learners, educators, parents, and partners working toward shared goals.' },
  { title: 'Innovation', description: 'While rooted in tradition, we embrace modern teaching methods, technology, and research to prepare students for a rapidly evolving world.' },
];

export default function AboutPage() {
  return (
    <PageWrapper
      title="About Us"
      description="Learn about Grandview Academy's history, mission, values, and commitment to academic excellence across Primary, Secondary, and University education."
    >
      {/* Page Header */}
      <section className="page-header">
        <div className="container">
          <span className="page-header__label">About Grandview Academy</span>
          <h1 className="page-header__title">Our Story</h1>
          <p className="page-header__subtitle">
            For over three decades, Grandview Academy has cultivated a tradition of 
            academic excellence, character development, and service to the community.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section">
        <div className="container about-mission">
          <div className="about-mission__block">
            <h2 className="about-mission__title">Our Mission</h2>
            <p className="about-mission__text">
              To provide a structured, enriching, and inclusive learning environment that 
              empowers students at every level — primary, secondary, and university — to 
              achieve their full academic potential, develop strong moral character, and 
              contribute meaningfully to society.
            </p>
          </div>
          <div className="about-mission__divider"></div>
          <div className="about-mission__block">
            <h2 className="about-mission__title">Our Vision</h2>
            <p className="about-mission__text">
              To be recognised as one of Nigeria's foremost multi-level educational 
              institutions — producing graduates who are intellectually capable, ethically 
              grounded, and globally competitive.
            </p>
          </div>
        </div>
      </section>

      {/* Principal's Message */}
      <section className="section section--subtle">
        <div className="container principal-message">
          <div className="principal-message__photo">
            <div className="principal-message__photo-placeholder">
              <span>Principal's<br/>Photo</span>
            </div>
          </div>
          <div className="principal-message__content">
            <span className="section-heading__label">From the Principal's Desk</span>
            <h2 className="section-heading__title">A Message from Our Principal</h2>
            <blockquote className="principal-message__quote">
              "At Grandview Academy, we do not simply educate — we form. Every child who 
              walks through our gates is entrusted to us with the expectation that they will 
              leave better prepared for the challenges and opportunities ahead. That is a 
              responsibility we take seriously, every single day."
            </blockquote>
            <p className="principal-message__name">
              <strong>Dr. Olufemi Adeyemi</strong>
            </p>
            <p className="principal-message__role">
              Principal & Chief Academic Officer, Grandview Academy
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <span className="section-heading__label">What We Stand For</span>
            <h2 className="section-heading__title">Our Core Values</h2>
          </div>
          <div className="values-grid">
            {values.map((value, i) => (
              <div key={i} className="value-item">
                <span className="value-item__number">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="value-item__title">{value.title}</h3>
                <p className="value-item__description">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section section--subtle">
        <div className="container">
          <div className="section-heading">
            <span className="section-heading__label">Our Journey</span>
            <h2 className="section-heading__title">A History of Growth</h2>
          </div>
          <div className="timeline">
            {timeline.map((item, i) => (
              <div key={i} className="timeline__item">
                <div className="timeline__year">{item.year}</div>
                <div className="timeline__content">
                  <h3 className="timeline__title">{item.title}</h3>
                  <p className="timeline__description">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Accreditations */}
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <span className="section-heading__label">Recognition</span>
            <h2 className="section-heading__title">Accreditations & Affiliations</h2>
            <p className="section-heading__description">
              Grandview Academy holds full accreditation from Nigeria's leading educational 
              regulatory bodies and maintains active partnerships with institutions nationally 
              and internationally.
            </p>
          </div>
          <div className="accreditations-list">
            <div className="accreditation-item">
              <strong>National Universities Commission (NUC)</strong>
              <span>Full accreditation for all undergraduate programmes</span>
            </div>
            <div className="accreditation-item">
              <strong>West African Examinations Council (WAEC)</strong>
              <span>Approved examination centre since 1998</span>
            </div>
            <div className="accreditation-item">
              <strong>National Examination Council (NECO)</strong>
              <span>Registered secondary examination centre</span>
            </div>
            <div className="accreditation-item">
              <strong>Teachers Registration Council of Nigeria (TRCN)</strong>
              <span>All teaching staff are fully registered and certified</span>
            </div>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
