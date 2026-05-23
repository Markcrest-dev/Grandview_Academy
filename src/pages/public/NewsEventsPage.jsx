import PageWrapper from '../../components/layout/PageWrapper';
import './NewsEventsPage.css';

const news = [
  {
    id: 1,
    date: '15 May 2026',
    category: 'Examinations',
    title: 'Second Term Examination Timetable Released',
    excerpt: 'The examination timetable for all levels has been released. Students are advised to collect their exam cards from the Academic Office before the commencement date of 2nd June 2026. Late collection will not be entertained.',
  },
  {
    id: 2,
    date: '10 May 2026',
    category: 'Sports',
    title: 'Inter-House Sports Competition Dates Announced',
    excerpt: 'This year\'s Inter-House Sports Competition will run from 26th to 28th May. Events include track and field, swimming, and team sports. Registration closes 20th May through house captains.',
  },
  {
    id: 3,
    date: '3 May 2026',
    category: 'Academic',
    title: 'University Faculty Lecture Series — Guest Speaker Announced',
    excerpt: 'Professor Emeka Okonkwo, former Vice Chancellor of the University of Lagos, will deliver the keynote address at this term\'s Faculty Lecture Series on 5th June. All university students are expected to attend.',
  },
  {
    id: 4,
    date: '28 April 2026',
    category: 'Admissions',
    title: 'September 2026 Intake — Application Deadline Reminder',
    excerpt: 'Applications for the September 2026 intake close on 30th June. Prospective parents and students are encouraged to submit their forms and required documentation before the deadline.',
  },
  {
    id: 5,
    date: '20 April 2026',
    category: 'Community',
    title: 'Grandview Academy Wins National Debate Championship',
    excerpt: 'The Grandview Academy secondary school debate team emerged winners at the 2026 National Schools Debate Championship held in Abuja. This marks the school\'s third consecutive victory in the competition.',
  },
  {
    id: 6,
    date: '12 April 2026',
    category: 'Staff',
    title: 'Staff Professional Development Week',
    excerpt: 'All teaching and non-teaching staff participated in a week-long professional development programme focusing on digital literacy, inclusive education practices, and student welfare protocols.',
  },
];

const upcomingEvents = [
  { date: '26–28 May', title: 'Inter-House Sports Competition', location: 'Main Sports Complex', level: 'All Levels' },
  { date: '2 Jun', title: 'Second Term Examinations Begin', location: 'All Campuses', level: 'All Levels' },
  { date: '5 Jun', title: 'Faculty Lecture Series', location: 'University Auditorium', level: 'University' },
  { date: '12 Jun', title: 'Parent-Teacher Conference', location: 'Main Hall', level: 'Primary & Secondary' },
  { date: '20 Jun', title: 'Second Term Closes', location: '—', level: 'Primary & Secondary' },
  { date: '27 Jun', title: 'University Semester Examinations End', location: 'All Faculties', level: 'University' },
];

const termDates = [
  { term: 'First Term 2026/2027', resumption: '9 September 2026', closing: '13 December 2026' },
  { term: 'Second Term 2026/2027', resumption: '6 January 2027', closing: '28 March 2027' },
  { term: 'Third Term 2026/2027', resumption: '21 April 2027', closing: '18 July 2027' },
];

export default function NewsEventsPage() {
  return (
    <PageWrapper
      title="News & Events"
      description="Stay updated with the latest news, announcements, upcoming events, and term dates from Grandview Academy."
    >
      <section className="page-header">
        <div className="container">
          <span className="page-header__label">Stay Informed</span>
          <h1 className="page-header__title">News & Events</h1>
          <p className="page-header__subtitle">
            Keep up with the latest happenings, important announcements, 
            and upcoming events across all levels of Grandview Academy.
          </p>
        </div>
      </section>

      {/* News + Events Grid */}
      <section className="section">
        <div className="container news-layout">
          {/* News Articles */}
          <div className="news-main">
            <h2 className="news-section-title">Latest News</h2>
            <div className="news-list">
              {news.map((article) => (
                <article key={article.id} className="news-article">
                  <div className="news-article__meta">
                    <time>{article.date}</time>
                    <span className="news-article__category">{article.category}</span>
                  </div>
                  <h3 className="news-article__title">{article.title}</h3>
                  <p className="news-article__excerpt">{article.excerpt}</p>
                </article>
              ))}
            </div>
          </div>

          {/* Sidebar — Upcoming Events */}
          <aside className="news-sidebar">
            <div className="sidebar-block">
              <h3 className="sidebar-block__title">Upcoming Events</h3>
              <div className="sidebar-events">
                {upcomingEvents.map((event, i) => (
                  <div key={i} className="sidebar-event">
                    <div className="sidebar-event__date">{event.date}</div>
                    <div className="sidebar-event__info">
                      <h4 className="sidebar-event__title">{event.title}</h4>
                      <span className="sidebar-event__detail">{event.location}</span>
                      <span className="sidebar-event__level">{event.level}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Term Dates */}
      <section className="section section--subtle">
        <div className="container">
          <div className="section-heading">
            <span className="section-heading__label">Academic Calendar</span>
            <h2 className="section-heading__title">Term Dates</h2>
          </div>
          <div className="calendar-table-wrapper">
            <table className="calendar-table">
              <thead>
                <tr>
                  <th>Term</th>
                  <th>Resumption Date</th>
                  <th>Closing Date</th>
                </tr>
              </thead>
              <tbody>
                {termDates.map((td, i) => (
                  <tr key={i}>
                    <td><strong>{td.term}</strong></td>
                    <td>{td.resumption}</td>
                    <td>{td.closing}</td>
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
