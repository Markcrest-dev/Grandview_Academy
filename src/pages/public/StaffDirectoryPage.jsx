import { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import './StaffDirectoryPage.css';

const staffData = [
  { name: 'Dr. Olufemi Adeyemi', title: 'Principal & Chief Academic Officer', department: 'Administration', level: 'all', email: 'o.adeyemi@grandviewacademy.edu.ng' },
  { name: 'Mrs. Ngozi Okafor', title: 'Vice Principal — Academics', department: 'Administration', level: 'secondary', email: 'n.okafor@grandviewacademy.edu.ng' },
  { name: 'Mr. Chukwuemeka Eze', title: 'Head of Primary School', department: 'Administration', level: 'primary', email: 'c.eze@grandviewacademy.edu.ng' },
  { name: 'Prof. Adebayo Williams', title: 'Dean, Faculty of Science', department: 'Science', level: 'university', email: 'a.williams@grandviewacademy.edu.ng' },
  { name: 'Mrs. Fatima Bello', title: 'Senior Mathematics Teacher', department: 'Mathematics', level: 'secondary', email: 'f.bello@grandviewacademy.edu.ng' },
  { name: 'Mr. David Ogunlade', title: 'Head of English Department', department: 'English', level: 'secondary', email: 'd.ogunlade@grandviewacademy.edu.ng' },
  { name: 'Dr. Amina Yusuf', title: 'Senior Lecturer — Computer Science', department: 'Computer Science', level: 'university', email: 'a.yusuf@grandviewacademy.edu.ng' },
  { name: 'Mrs. Grace Afolabi', title: 'Primary Class Teacher — Year 4', department: 'Primary Education', level: 'primary', email: 'g.afolabi@grandviewacademy.edu.ng' },
  { name: 'Mr. Tunde Bakare', title: 'Physics Teacher & Lab Coordinator', department: 'Science', level: 'secondary', email: 't.bakare@grandviewacademy.edu.ng' },
  { name: 'Mrs. Chidinma Nwosu', title: 'Head of Arts Department', department: 'Arts', level: 'secondary', email: 'c.nwosu@grandviewacademy.edu.ng' },
  { name: 'Dr. Ibrahim Musa', title: 'Senior Lecturer — Law', department: 'Law', level: 'university', email: 'i.musa@grandviewacademy.edu.ng' },
  { name: 'Ms. Blessing Ojo', title: 'Primary Class Teacher — Year 2', department: 'Primary Education', level: 'primary', email: 'b.ojo@grandviewacademy.edu.ng' },
].map((staff) => {
  const seed = encodeURIComponent(staff.email);
  staff.photoUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&skinColor=brown,darkBrown,black`;
  return staff;
});

const filters = [
  { value: 'all', label: 'All Levels' },
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'university', label: 'University' },
];

export default function StaffDirectoryPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = staffData.filter(s => {
    const matchesLevel = activeFilter === 'all' || s.level === activeFilter || s.level === 'all';
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                          s.title.toLowerCase().includes(search.toLowerCase()) ||
                          s.department.toLowerCase().includes(search.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  return (
    <PageWrapper
      title="Staff Directory"
      description="Meet the dedicated teaching and administrative staff of Grandview Academy across Primary, Secondary, and University levels."
    >
      <section className="page-header">
        <div className="container">
          <span className="page-header__label">Our People</span>
          <h1 className="page-header__title">Staff Directory</h1>
          <p className="page-header__subtitle">
            Our staff are the backbone of Grandview Academy. Each member brings 
            expertise, dedication, and a commitment to student development.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {/* Filters */}
          <div className="staff-controls">
            <div className="staff-filters">
              {filters.map(f => (
                <button
                  key={f.value}
                  className={`staff-filter ${activeFilter === f.value ? 'staff-filter--active' : ''}`}
                  onClick={() => setActiveFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="staff-search">
              <input
                type="text"
                className="form-input"
                placeholder="Search by name, title, or department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Staff Grid */}
          <div className="staff-grid">
            {filtered.map((staff, i) => (
              <div key={i} className="staff-card">
                <div className="staff-card__avatar" style={{ padding: 0, overflow: 'hidden' }}>
                  <img 
                    src={staff.photoUrl} 
                    alt={staff.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>
                <div className="staff-card__info">
                  <h3 className="staff-card__name">{staff.name}</h3>
                  <p className="staff-card__title">{staff.title}</p>
                  <p className="staff-card__department">{staff.department}</p>
                  <a href={`mailto:${staff.email}`} className="staff-card__email">{staff.email}</a>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="staff-empty">No staff members found matching your criteria.</p>
          )}
        </div>
      </section>
    </PageWrapper>
  );
}
