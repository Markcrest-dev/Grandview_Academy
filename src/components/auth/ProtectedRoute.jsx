import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Route Guard Component
 * 
 * Restricts route access to authenticated users with matching roles.
 * Redirects unauthenticated traffic to the appropriate login page.
 * Redirects authenticated users accessing unmatched portals back to their proper dashboard.
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="portal-loading">
        <div className="portal-loading__container">
          <div className="portal-loading__crest">GA</div>
          <div className="portal-loading__spinner"></div>
          <p className="portal-loading__text">Verifying secure session...</p>
        </div>
      </div>
    );
  }

  // Helper to determine the target login role from current URL path
  const getLoginRoleFromPath = (path) => {
    if (path.startsWith('/portal/admin')) return 'admin';
    if (path.startsWith('/portal/student')) return 'student';
    if (path.startsWith('/portal/parent')) return 'parent';
    if (path.startsWith('/portal/staff')) return 'staff';
    return 'student'; // Default fallback
  };

  // If not logged in, redirect to the matching portal login
  if (!token || !user) {
    const role = getLoginRoleFromPath(location.pathname);
    return <Navigate to={`/login/${role}`} replace state={{ from: location }} />;
  }

  // If user role doesn't match allowedRoles
  // Note: 'teaching_staff' and 'non_teaching_staff' map to the 'staff' portal
  const normalizedUserRole = user.role === 'teaching_staff' || user.role === 'non_teaching_staff' 
    ? 'staff' 
    : user.role;

  const isAuthorized = allowedRoles.some(role => {
    if (role === 'staff') {
      return user.role === 'teaching_staff' || user.role === 'non_teaching_staff';
    }
    return user.role === role;
  });

  if (!isAuthorized) {
    // Elegant fallback: redirect user back to their correct dashboard portal
    if (user.role === 'admin') {
      return <Navigate to="/portal/admin" replace />;
    } else if (user.role === 'teaching_staff') {
      return <Navigate to="/portal/staff/teaching" replace />;
    } else if (user.role === 'non_teaching_staff') {
      return <Navigate to="/portal/staff/non-teaching" replace />;
    } else if (user.role === 'parent') {
      return <Navigate to="/portal/parent" replace />;
    } else if (user.role === 'student') {
      return <Navigate to="/portal/student" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}
