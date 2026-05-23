import { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import './AcademicsPage.css';

const levels = {
  primary: {
    label: 'Primary School',
    ages: 'Ages 5–11 (Year 1–6)',
    overview: 'Our primary school curriculum is designed to build a strong foundation in literacy, numeracy, and inquiry-based learning. We follow the Nigerian Educational Research and Development Council (NERDC) curriculum with enhancements in ICT, creative arts, and physical education.',
    subjects: [
      'English Language & Literature',
      'Mathematics',
      'Basic Science & Technology',
      'Social Studies',
      'Civic Education',
      'French Language',
      'Information & Communication Technology',
      'Creative & Cultural Arts',
      'Physical & Health Education',
      'Religious & Moral Education',
    ],
    programmes: [
      { title: 'Reading Champions Programme', description: 'A structured literacy initiative to ensure every child reads confidently by Year 3.' },
      { title: 'Young Innovators Club', description: 'Weekly after-school programme introducing basic coding, robotics, and problem-solving.' },
      { title: 'Character Formation Series', description: 'Integrated values education covering integrity, responsibility, and community service.' },
    ],
  },
  secondary: {
    label: 'Secondary School',
    ages: 'Ages 12–17 (JSS 1 – SS 3)',
    overview: 'Our secondary school programme prepares students for national and international examinations, including WASSCE, NECO, and JAMB. Students choose from Science, Commercial, or Arts tracks in Senior Secondary, with dedicated guidance counselling to support their academic and career paths.',
    subjects: [
      'English Language',
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'Further Mathematics',
      'Economics',
      'Government',
      'Literature in English',
      'Accounting',
      'Computer Science',
      'Geography',
      'Agricultural Science',
      'Technical Drawing',
      'French Language',
    ],
    programmes: [
      { title: 'WASSCE & JAMB Preparatory Classes', description: 'Intensive examination preparation classes running from SS 2, with mock exams and targeted revision.' },
      { title: 'Career Guidance Programme', description: 'Termly career talks, aptitude testing, and university counselling for senior students.' },
      { title: 'Debate & Public Speaking Society', description: 'Inter-school competitions fostering critical thinking, research, and articulate communication.' },
    ],
  },
  university: {
    label: 'University',
    ages: 'Undergraduate & Postgraduate',
    overview: 'Grandview University offers accredited degree programmes across multiple faculties. Our instruction is research-driven with strong ties to industry, and we provide students with internship placements, exchange programmes, and a comprehensive learning management system.',
    subjects: [
      'Faculty of Science',
      'Faculty of Engineering',
      'Faculty of Arts & Humanities',
      'Faculty of Social Sciences',
      'Faculty of Law',
      'Faculty of Management Sciences',
      'Faculty of Education',
      'Faculty of Environmental Sciences',
    ],
    programmes: [
      { title: 'Industry Partnership Programme', description: 'Mandatory internship placements in partnership with leading companies across Nigeria and West Africa.' },
      { title: 'Research & Innovation Grant', description: 'Annual research funding available to final-year and postgraduate students pursuing original research.' },
      { title: 'International Exchange', description: 'Semester exchange opportunities with partner universities in the United Kingdom, Ghana, and South Africa.' },
    ],
  },
};

const calendar = [
  { term: 'First Term', start: '9 September 2026', end: '13 December 2026', weeks: '14 weeks' },
  { term: 'Second Term', start: '6 January 2027', end: '28 March 2027', weeks: '12 weeks' },
  { term: 'Third Term', start: '21 April 2027', end: '18 July 2027', weeks: '13 weeks' },
];

export default function AcademicsPage() {
  const [activeTab, setActiveTab] = useState('primary');
  const current = levels[activeTab];

  return (
    <PageWrapper
      title="Academics"
      description="Explore academic programmes, curriculum, and special initiatives across Grandview Academy's Primary, Secondary, and University levels."
    >
      <section className="page-header">
        <div className="container">
          <span className="page-header__label">Academic Programmes</span>
          <h1 className="page-header__title">Academics</h1>
          <p className="page-header__subtitle">
            Grandview Academy offers a comprehensive education across three levels, 
            each with a tailored curriculum, dedicated staff, and enrichment programmes.
          </p>
        </div>
      </section>

      {/* Level Tabs */}
      <section className="section">
        <div className="container">
          <div className="academics-tabs">
            {Object.entries(levels).map(([key, level]) => (
              <button
                key={key}
                className={`academics-tab ${activeTab === key ? 'academics-tab--active' : ''}`}
                onClick={() => setActiveTab(key)}
              >
                {level.label}
              </button>
            ))}
          </div>

          <div className="academics-content">
            <div className="academics-header">
              <h2 className="academics-header__title">{current.label}</h2>
              <span className="academics-header__ages">{current.ages}</span>
            </div>
            <p className="academics-overview">{current.overview}</p>

            <div className="academics-grid">
              {/* Subjects */}
              <div>
                <h3 className="academics-section-title">
                  {activeTab === 'university' ? 'Faculties' : 'Core Subjects'}
                </h3>
                <ul className="subjects-list">
                  {current.subjects.map((subject, i) => (
                    <li key={i} className="subject-item">{subject}</li>
                  ))}
                </ul>
              </div>

              {/* Special Programmes */}
              <div>
                <h3 className="academics-section-title">Special Programmes</h3>
                <div className="programmes-list">
                  {current.programmes.map((prog, i) => (
                    <div key={i} className="programme-item">
                      <h4 className="programme-item__title">{prog.title}</h4>
                      <p className="programme-item__description">{prog.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Academic Calendar */}
      <section className="section section--subtle">
        <div className="container">
          <div className="section-heading">
            <span className="section-heading__label">2026/2027 Session</span>
            <h2 className="section-heading__title">Academic Calendar</h2>
          </div>
          <div className="calendar-table-wrapper">
            <table className="calendar-table">
              <thead>
                <tr>
                  <th>Term</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {calendar.map((item, i) => (
                  <tr key={i}>
                    <td><strong>{item.term}</strong></td>
                    <td>{item.start}</td>
                    <td>{item.end}</td>
                    <td>{item.weeks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
