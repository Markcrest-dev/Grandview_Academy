import { Routes, Route } from 'react-router-dom';

// Public pages
import HomePage from '../pages/public/HomePage';
import AboutPage from '../pages/public/AboutPage';
import AcademicsPage from '../pages/public/AcademicsPage';
import AdmissionsPage from '../pages/public/AdmissionsPage';
import StaffDirectoryPage from '../pages/public/StaffDirectoryPage';
import NewsEventsPage from '../pages/public/NewsEventsPage';
import GalleryPage from '../pages/public/GalleryPage';
import VirtualTour from '../pages/public/VirtualTour';
import AlumniPortal from '../pages/public/AlumniPortal';
import ContactPage from '../pages/public/ContactPage';

// Auth pages
import LoginPage from '../pages/auth/LoginPage';

// Portal dashboards
import AdminDashboard from '../pages/portal/admin/AdminDashboard';
import AdmissionsPipeline from '../pages/portal/admin/AdmissionsPipeline';
import StudentDirectory from '../pages/portal/admin/StudentDirectory';
import RelationshipManager from '../pages/portal/admin/RelationshipManager';
import TranscriptView from '../pages/portal/admin/TranscriptView';
import VisitorLog from '../pages/portal/admin/VisitorLog';
import TransportManager from '../pages/portal/admin/TransportManager';
import HostelManager from '../pages/portal/admin/HostelManager';
import CertificateGenerator from '../pages/portal/admin/CertificateGenerator';
import AlumniManagement from '../pages/portal/admin/AlumniManagement';
import TeacherDashboard from '../pages/portal/staff/TeacherDashboard';
import CourseManager from '../pages/portal/staff/CourseManager';
import StudentPortalDashboard from '../pages/portal/student/StudentPortalDashboard';
import ELearningPortal from '../pages/portal/student/ELearningPortal';
import ParentPortalDashboard from '../pages/portal/parent/ParentPortalDashboard';
import NonTeachingRouter from '../pages/portal/staff/non-teaching/NonTeachingRouter';

// Shared portal pages
import MessagingPage from '../pages/portal/shared/MessagingPage';
import ReceiptPage from '../pages/portal/shared/ReceiptPage';
import SecuritySettings from '../pages/portal/shared/SecuritySettings';

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
      <Route path="/tour" element={<VirtualTour />} />
      <Route path="/alumni" element={<AlumniPortal />} />
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
            <Route path="/manage" element={<RelationshipManager />} />
            <Route path="/visitors" element={<VisitorLog />} />
            <Route path="/transport" element={<TransportManager />} />
            <Route path="/hostels" element={<HostelManager />} />
            <Route path="/certificates" element={<CertificateGenerator />} />
            <Route path="/alumni" element={<AlumniManagement />} />
            <Route path="/transcript/:studentId" element={<TranscriptView />} />
            <Route path="/messages" element={<MessagingPage />} />
          </Routes>
        </ProtectedRoute>
      } />
      
      <Route path="/portal/staff/teaching/*" element={
        <ProtectedRoute allowedRoles={['teaching_staff']}>
          <Routes>
            <Route path="/" element={<TeacherDashboard />} />
            <Route path="/elearning" element={<CourseManager />} />
            <Route path="/messages" element={<MessagingPage />} />
          </Routes>
        </ProtectedRoute>
      } />
      
      <Route path="/portal/staff/non-teaching/*" element={
        <ProtectedRoute allowedRoles={['non_teaching_staff']}>
          <Routes>
            <Route path="/" element={<NonTeachingRouter />} />
            <Route path="/messages" element={<MessagingPage />} />
          </Routes>
        </ProtectedRoute>
      } />
      
      <Route path="/portal/parent/*" element={
        <ProtectedRoute allowedRoles={['parent']}>
          <Routes>
            <Route path="/" element={<ParentPortalDashboard />} />
            <Route path="/messages" element={<MessagingPage />} />
          </Routes>
        </ProtectedRoute>
      } />
      
      <Route path="/portal/student/*" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Routes>
            <Route path="/" element={<StudentPortalDashboard />} />
            <Route path="/elearning" element={<ELearningPortal />} />
            <Route path="/messages" element={<MessagingPage />} />
          </Routes>
        </ProtectedRoute>
      } />

      {/* ===== Shared Portal Routes ===== */}
      <Route path="/portal/receipt/:paymentId" element={
        <ProtectedRoute allowedRoles={['admin', 'parent', 'non_teaching_staff']}>
          <ReceiptPage />
        </ProtectedRoute>
      } />
      
      <Route path="/portal/shared/security" element={
        <ProtectedRoute allowedRoles={['admin', 'teaching_staff', 'non_teaching_staff', 'parent', 'student']}>
          <SecuritySettings />
        </ProtectedRoute>
      } />

      {/* ===== 404 ===== */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
