import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import './HomePage.css';

const announcements = [
  {
    id: 1,
    date: '15 May 2026',
    title: 'Second Term Examination Timetable Released',
    excerpt: 'The examination timetable for all levels is now available. Students are advised to collect their exam cards from the Academic Office before the commencement date.',
  },
  {
    id: 2,
    date: '10 May 2026',
    title: 'Inter-House Sports Competition',
    excerpt: 'The annual Inter-House Sports Competition is scheduled for the last week of May. All students are encouraged to register through their house captains.',
  },
  {
    id: 3,
    date: '5 May 2026',
    title: 'Parent-Teacher Conference — June 2026',
    excerpt: 'The end-of-term Parent-Teacher Conference will hold on the 12th of June. Parents can schedule appointments through the parent portal.',
  },
];

const events = [
  { date: '28 May', title: 'Inter-House Sports Finals', level: 'All Levels' },
  { date: '5 Jun', title: 'University Faculty Lecture Series', level: 'University' },
  { date: '12 Jun', title: 'Parent-Teacher Conference', level: 'All Levels' },
  { date: '20 Jun', title: 'Second Term Closes', level: 'Primary & Secondary' },
];

const stats = [
  { value: '3,200+', label: 'Students Enrolled' },
  { value: '180+', label: 'Teaching Staff' },
  { value: '35', label: 'Years of Excellence' },
  { value: '98%', label: 'Graduation Rate' },
];

export default function HomePage() {
  const [bannerVisible, setBannerVisible] = useState(true);

  return (
    <PageWrapper
      title="Home"
      description="Grandview Academy is a multi-level institution offering Primary, Secondary, and University education with a commitment to excellence rooted in tradition."
    >
      {/* Emergency / Notice Banner */}
      {bannerVisible && (
        <div className="notice-banner">
          <div className="container notice-banner__inner">
            <p>
              <strong>Notice:</strong> Second term examinations begin on 2nd June 2026. 
              All students must collect their exam cards from the Academic Office.
            </p>
            <button
              onClick={() => setBannerVisible(false)}
              className="notice-banner__close"
              aria-label="Dismiss notice"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="hero">
        <div className="container hero__content">
          <span className="hero__label">Est. 1991 — Lagos, Nigeria</span>
          <h1 className="hero__title">Excellence Rooted in Tradition</h1>
          <p className="hero__subtitle">
            Grandview Academy is a multi-level institution nurturing learners from 
            primary school through university with rigorous academics, strong values, 
            and a commitment to developing future leaders.
          </p>
          <div className="hero__actions">
            <Link to="/admissions" className="btn btn--primary">Apply for Admission</Link>
            <Link to="/about" className="btn btn--outline">Learn More About Us</Link>
          </div>
        </div>
      </section>

      {/* Quick Links Bar */}
      <section className="quicklinks">
        <div className="container quicklinks__inner">
          <Link to="/login/student" className="quicklinks__item">
            <span className="quicklinks__icon">📋</span>
            <span className="quicklinks__text">Check Results</span>
          </Link>
          <Link to="/login/parent" className="quicklinks__item">
            <span className="quicklinks__icon">💳</span>
            <span className="quicklinks__text">Pay Fees</span>
          </Link>
          <Link to="/admissions" className="quicklinks__item">
            <span className="quicklinks__icon">📄</span>
            <span className="quicklinks__text">Download Forms</span>
          </Link>
          <Link to="/contact" className="quicklinks__item">
            <span className="quicklinks__icon">📞</span>
            <span className="quicklinks__text">Contact Us</span>
          </Link>
        </div>
      </section>

      {/* Announcements & Events */}
      <section className="section">
        <div className="container home-news">
          <div className="home-news__announcements">
            <div className="section-heading">
              <span className="section-heading__label">Latest Updates</span>
              <h2 className="section-heading__title">Announcements</h2>
            </div>
            <div className="announcements-list">
              {announcements.map((item) => (
                <article key={item.id} className="announcement-item">
                  <time className="announcement-item__date">{item.date}</time>
                  <h3 className="announcement-item__title">{item.title}</h3>
                  <p className="announcement-item__excerpt">{item.excerpt}</p>
                </article>
              ))}
            </div>
            <Link to="/news" className="btn btn--outline btn--small" style={{ marginTop: '1.5rem' }}>
              View All Announcements
            </Link>
          </div>

          <aside className="home-news__events">
            <div className="section-heading">
              <span className="section-heading__label">Coming Up</span>
              <h2 className="section-heading__title">Events</h2>
            </div>
            <div className="events-list">
              {events.map((event, i) => (
                <div key={i} className="event-item">
                  <div className="event-item__date">{event.date}</div>
                  <div className="event-item__info">
                    <h4 className="event-item__title">{event.title}</h4>
                    <span className="event-item__level">{event.level}</span>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {/* About Section */}
      <section className="section section--subtle">
        <div className="container home-about">
          <div className="section-heading">
            <span className="section-heading__label">Who We Are</span>
            <h2 className="section-heading__title">A Legacy of Academic Excellence</h2>
            <p className="section-heading__description">
              For over three decades, Grandview Academy has been at the forefront of 
              education in Nigeria, providing a structured and enriching learning environment 
              across three academic levels.
            </p>
          </div>
          <div className="home-about__levels">
            <div className="level-card">
              <span className="level-card__indicator level-card__indicator--primary"></span>
              <h3 className="level-card__title">Primary School</h3>
              <p className="level-card__description">
                Building a strong foundation in literacy, numeracy, and critical thinking 
                for learners ages 5 to 11. Our primary curriculum emphasises inquiry-based 
                learning and character development.
              </p>
              <Link to="/academics" className="level-card__link">View Curriculum →</Link>
            </div>
            <div className="level-card">
              <span className="level-card__indicator level-card__indicator--secondary"></span>
              <h3 className="level-card__title">Secondary School</h3>
              <p className="level-card__description">
                Preparing students for national examinations (WASSCE, NECO, JAMB) with 
                a balanced mix of sciences, arts, and commercial subjects. Emphasis on 
                discipline, leadership, and career guidance.
              </p>
              <Link to="/academics" className="level-card__link">View Programmes →</Link>
            </div>
            <div className="level-card">
              <span className="level-card__indicator level-card__indicator--university"></span>
              <h3 className="level-card__title">University</h3>
              <p className="level-card__description">
                Offering accredited undergraduate and postgraduate programmes across 
                multiple faculties. Research-driven instruction with industry partnerships 
                and global exchange opportunities.
              </p>
              <Link to="/academics" className="level-card__link">Explore Faculties →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="stats-bar">
        <div className="container stats-bar__inner">
          {stats.map((stat, i) => (
            <div key={i} className="stat-item">
              <span className="stat-item__value">{stat.value}</span>
              <span className="stat-item__label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Who Are You? Section */}
      <section className="section">
        <div className="container portal-gateway">
          <div className="section-heading" style={{ textAlign: 'center' }}>
            <span className="section-heading__label">Portal Access</span>
            <h2 className="section-heading__title">Who Are You?</h2>
            <p className="section-heading__description" style={{ margin: '0 auto' }}>
              Select your role below to access your personalised portal. 
              If you do not yet have login credentials, contact the school administration.
            </p>
          </div>
          <div className="portal-gateway__grid">
            <Link to="/login/staff" className="portal-card">
              <div className="portal-card__icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3 className="portal-card__title">Staff</h3>
              <p className="portal-card__description">Teaching and non-teaching staff portal</p>
            </Link>
            <Link to="/login/student" className="portal-card">
              <div className="portal-card__icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"/>
                </svg>
              </div>
              <h3 className="portal-card__title">Student</h3>
              <p className="portal-card__description">Access your academic information</p>
            </Link>
            <Link to="/login/parent" className="portal-card">
              <div className="portal-card__icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h3 className="portal-card__title">Parent / Guardian</h3>
              <p className="portal-card__description">Monitor your child's progress</p>
            </Link>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
