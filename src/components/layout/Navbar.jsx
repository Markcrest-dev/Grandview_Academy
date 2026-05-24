import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Navbar.css';

const navLinks = [
  { key: 'home', path: '/' },
  { key: 'about', path: '/about' },
  { key: 'academics', path: '/academics' },
  { key: 'admissions', path: '/admissions' },
  { key: 'staff', path: '/staff' },
  { key: 'news', path: '/news' },
  { key: 'gallery', path: '/gallery' },
  { key: 'contact', path: '/contact' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner container">
        <Link to="/" className="navbar__brand">
          <div className="navbar__crest">GA</div>
          <div className="navbar__brand-text">
            <span className="navbar__name">Grandview Academy</span>
            <span className="navbar__tagline">Excellence Rooted in Tradition</span>
          </div>
        </Link>

        <nav className="navbar__nav">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`navbar__link ${location.pathname === link.path ? 'navbar__link--active' : ''}`}
            >
              {t(`nav.${link.key}`)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <select 
            onChange={changeLanguage} 
            value={i18n.language}
            className="bg-transparent text-sm border border-gray-300 rounded px-2 py-1 outline-none text-[#1A1A1A] mr-2"
          >
            <option value="en">EN</option>
            <option value="fr">FR</option>
            <option value="ha">HA</option>
          </select>
          
          <Link to="/login/student" className="navbar__portal-btn btn btn--gold btn--small">
            Portal Login
          </Link>
        </div>

        <button
          className="navbar__hamburger"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
        >
          <span className={`navbar__hamburger-line ${mobileOpen ? 'open' : ''}`}></span>
          <span className={`navbar__hamburger-line ${mobileOpen ? 'open' : ''}`}></span>
          <span className={`navbar__hamburger-line ${mobileOpen ? 'open' : ''}`}></span>
        </button>
      </div>

      {/* Mobile Drawer */}
      <div className={`navbar__mobile-overlay ${mobileOpen ? 'active' : ''}`} onClick={() => setMobileOpen(false)} />
      <div className={`navbar__mobile-drawer ${mobileOpen ? 'open' : ''}`}>
        <nav className="navbar__mobile-nav">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`navbar__mobile-link ${location.pathname === link.path ? 'navbar__mobile-link--active' : ''}`}
            >
              {t(`nav.${link.key}`)}
            </Link>
          ))}
          <Link to="/login/student" className="btn btn--gold" style={{ marginTop: '1rem', width: '100%' }}>
            Portal Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
