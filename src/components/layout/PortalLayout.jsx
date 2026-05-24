import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationPanel, { NotificationBell } from '../ui/NotificationPanel';
import './PortalLayout.css';

export default function PortalLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  if (!user) return null;

  const role = user.role;
  const profile = user.profile || {};
  const userEmail = user.email || '';

  // Get full name based on role
  let fullName = 'System Administrator';
  let detailLabel = 'Admin Portal';

  if (role === 'student' && profile) {
    fullName = `${profile.firstName} ${profile.lastName}`;
    detailLabel = `Student — ${profile.admissionNumber || ''}`;
  } else if ((role === 'teaching_staff' || role === 'non_teaching_staff') && profile) {
    fullName = `${profile.firstName} ${profile.lastName}`;
    detailLabel = `${profile.designation || 'Staff'} — ${profile.staffIdNumber || ''}`;
  } else if (role === 'parent' && profile) {
    fullName = `${profile.firstName} ${profile.lastName}`;
    detailLabel = `Parent Portal — ${profile.parentIdNumber || ''}`;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Generate deterministic real person image based on email if photoUrl is missing
  const getProfileImage = (profile, email) => {
    if (profile.photoUrl) return profile.photoUrl;
    if (profile.photo_url) return profile.photo_url;
    if (!email) return null;
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % 90;
    const gender = (Math.abs(hash) % 2 === 0) ? 'men' : 'women';
    return `https://randomuser.me/api/portraits/${gender}/${index}.jpg`;
  };

  const displayPhotoUrl = getProfileImage(profile, userEmail);

  // Define navigation links based on roles
  const getNavLinks = () => {
    switch (role) {
      case 'admin':
        return [
          { path: '/portal/admin', label: 'Overview', icon: '📊' },
          { path: '/portal/admin/admissions', label: 'Admissions Board', icon: '📝' },
          { path: '/portal/admin/students', label: 'Student Directory', icon: '🎒' },
        ];
      case 'teaching_staff':
        return [
          { path: '/portal/staff/teaching', label: 'My Classroom', icon: '🏫' },
        ];
      case 'student':
        return [
          { path: '/portal/student', label: 'My Dashboard', icon: '🎒' },
        ];
      case 'parent':
        return [
          { path: '/portal/parent', label: 'Children Profiles', icon: '👪' },
        ];
      case 'non_teaching_staff': {
        const dept = (profile.department || '').toLowerCase();
        const desig = (profile.designation || '').toLowerCase();
        if (dept.includes('bursary') || dept.includes('finance') || desig.includes('bursar')) {
          return [{ path: '/portal/staff/non-teaching', label: 'Bursary Control', icon: '💰' }];
        } else if (dept.includes('library') || desig.includes('librarian')) {
          return [{ path: '/portal/staff/non-teaching', label: 'Library Catalog', icon: '📚' }];
        } else if (dept.includes('medical') || dept.includes('health') || desig.includes('nurse') || desig.includes('doctor')) {
          return [{ path: '/portal/staff/non-teaching', label: 'Sickbay Logs', icon: '🏥' }];
        }
        return [{ path: '/portal/staff/non-teaching', label: 'Staff Desk', icon: '📋' }];
      }
      default:
        return [];
    }
  };

  // Resolve messages path for the current role
  const getMessagesPath = () => {
    switch (role) {
      case 'admin': return '/portal/admin/messages';
      case 'teaching_staff': return '/portal/staff/teaching/messages';
      case 'non_teaching_staff': return '/portal/staff/non-teaching/messages';
      case 'parent': return '/portal/parent/messages';
      case 'student': return '/portal/student/messages';
      default: return '#';
    }
  };

  const navLinks = getNavLinks();
  
  // Add shared routes for all roles
  navLinks.push({ path: '/portal/shared/security', label: 'Security Settings', icon: '🔒' });

  return (
    <div className="portal-frame">
      {/* Sidebar for Desktop */}
      <aside className={`portal-sidebar ${mobileOpen ? 'portal-sidebar--open' : ''}`}>
        <div className="portal-sidebar__header">
          <Link to="/" className="portal-sidebar__logo">
            <span className="logo-icon">🏰</span>
            <div className="logo-text">
              <span className="logo-main">Grandview</span>
              <span className="logo-sub">Academy SMS</span>
            </div>
          </Link>
        </div>

        {/* User Card */}
        <div className="portal-sidebar__user">
          <div className="user-avatar">
            {displayPhotoUrl ? (
              <img src={displayPhotoUrl} alt={fullName} className="user-avatar-img" />
            ) : (
              <span className="user-avatar-initial">
                {fullName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="user-meta">
            <h4 className="user-name">{fullName}</h4>
            <span className="user-role">{detailLabel}</span>
          </div>
        </div>

        <nav className="portal-sidebar__nav">
          <ul className="nav-list">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path || location.pathname.startsWith(link.path + '/');
              return (
                <li key={link.path} className="nav-item">
                  <Link
                    to={link.path}
                    className={`nav-link ${isActive ? 'nav-link--active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="nav-icon">{link.icon}</span>
                    <span className="nav-label">{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="portal-sidebar__footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span className="logout-btn__icon">🚪</span>
            <span className="logout-btn__label">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="portal-content-wrapper">
        {/* Top Navbar */}
        <header className="portal-header">
          <div className="portal-header__left">
            <button
              className="portal-mobile-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation"
            >
              ☰
            </button>
            <div className="academic-timeline">
              <span className="timeline-badge">Active</span>
              <span className="timeline-text">2026/2027 Session | First Term</span>
            </div>
          </div>
          
          <div className="portal-header__right">
            <div className="header-icons" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem' }}>
              <Link
                to={getMessagesPath()}
                className="notif-bell"
                aria-label="Messages"
                style={{ textDecoration: 'none', fontSize: '1.25rem', color: '#475569' }}
              >
                ✉️
              </Link>
              <NotificationBell onClick={() => setNotifOpen(true)} />
            </div>
            <div className="header-info">
              <span className="header-email">{userEmail}</span>
            </div>
          </div>
        </header>

        {/* Content Pane */}
        <main className="portal-main-pane">
          <div className="portal-container">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="portal-mobile-overlay"
          onClick={() => setMobileOpen(false)}
        ></div>
      )}

      {/* Notification Slide-Out Panel */}
      <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}
