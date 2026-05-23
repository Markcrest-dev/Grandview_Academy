import { Routes, Route } from 'react-router-dom';

// Public pages
import HomePage from '../pages/public/HomePage';
import AboutPage from '../pages/public/AboutPage';
import AcademicsPage from '../pages/public/AcademicsPage';
import AdmissionsPage from '../pages/public/AdmissionsPage';
import StaffDirectoryPage from '../pages/public/StaffDirectoryPage';
import NewsEventsPage from '../pages/public/NewsEventsPage';
import GalleryPage from '../pages/public/GalleryPage';
import ContactPage from '../pages/public/ContactPage';

// Auth pages
import LoginPage from '../pages/auth/LoginPage';

// Utility pages
import NotFoundPage from '../pages/NotFoundPage';
import PortalPlaceholder from '../pages/PortalPlaceholder';

export default function AppRoutes() {
  return (
    <Routes>
      {/* ===== Public Website ===== */}
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/academics" element={<AcademicsPage />} />
      <Route path="/admissions" element={<AdmissionsPage />} />
      <Route path="/staff" element={<StaffDirectoryPage />} />
      <Route path="/news" element={<NewsEventsPage />} />
      <Route path="/gallery" element={<GalleryPage />} />
      <Route path="/contact" element={<ContactPage />} />

      {/* ===== Login Routes ===== */}
      <Route path="/login/:role" element={<LoginPage />} />

      {/* ===== Portal Routes (Placeholders) ===== */}
      <Route path="/portal/admin/*" element={<PortalPlaceholder portalName="Admin" />} />
      <Route path="/portal/staff/teaching/*" element={<PortalPlaceholder portalName="Teaching Staff" />} />
      <Route path="/portal/staff/non-teaching/*" element={<PortalPlaceholder portalName="Non-Teaching Staff" />} />
      <Route path="/portal/parent/*" element={<PortalPlaceholder portalName="Parent" />} />
      <Route path="/portal/student/*" element={<PortalPlaceholder portalName="Student" />} />

      {/* ===== 404 ===== */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
