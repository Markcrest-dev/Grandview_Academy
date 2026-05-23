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

// Portal dashboards
import AdminDashboard from '../pages/portal/admin/AdminDashboard';
import AdmissionsPipeline from '../pages/portal/admin/AdmissionsPipeline';
import StudentDirectory from '../pages/portal/admin/StudentDirectory';
import TeacherDashboard from '../pages/portal/staff/TeacherDashboard';
import StudentPortalDashboard from '../pages/portal/student/StudentPortalDashboard';
import ParentPortalDashboard from '../pages/portal/parent/ParentPortalDashboard';

// Utility pages
import NotFoundPage from '../pages/NotFoundPage';
import PortalPlaceholder from '../pages/PortalPlaceholder';
import ProtectedRoute from '../components/auth/ProtectedRoute';

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

      {/* ===== Portal Routes (Protected) ===== */}
      <Route path="/portal/admin/*" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/admissions" element={<AdmissionsPipeline />} />
            <Route path="/students" element={<StudentDirectory />} />
          </Routes>
        </ProtectedRoute>
      } />
      
      <Route path="/portal/staff/teaching/*" element={
        <ProtectedRoute allowedRoles={['teaching_staff']}>
          <Routes>
            <Route path="/" element={<TeacherDashboard />} />
          </Routes>
        </ProtectedRoute>
      } />
      
      <Route path="/portal/staff/non-teaching/*" element={
        <ProtectedRoute allowedRoles={['non_teaching_staff']}>
          <PortalPlaceholder portalName="Non-Teaching Staff" />
        </ProtectedRoute>
      } />
      
      <Route path="/portal/parent/*" element={
        <ProtectedRoute allowedRoles={['parent']}>
          <Routes>
            <Route path="/" element={<ParentPortalDashboard />} />
          </Routes>
        </ProtectedRoute>
      } />
      
      <Route path="/portal/student/*" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Routes>
            <Route path="/" element={<StudentPortalDashboard />} />
          </Routes>
        </ProtectedRoute>
      } />

      {/* ===== 404 ===== */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
