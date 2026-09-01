import { Navigate, useLocation } from 'react-router-dom';
import { useGeneralContext } from '../context/GeneralContext';

function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, loading } = useGeneralContext();
  const location = useLocation();

  if (loading) {
    return (
      <div className="stock-loading">
        <div className="spinner"></div>
        <p>Verifying secure session...</p>
      </div>
    );
  }

  // If user is not authenticated at all
  if (!isAuthenticated) {
    return (
      <Navigate
        to={adminOnly ? '/admin/login' : '/login'}
        state={{ from: location }}
        replace
      />
    );
  }

  // If route is restricted to administrators only
  if (adminOnly && !isAdmin) {
    return (
      <div className="admin-gate-container">
        <div className="admin-gate-card">
          <span className="gate-icon">🔒</span>
          <h2>Restricted Administrator Portal</h2>
          <p>
            Your account does not have administrator permissions to view this control panel.
          </p>
          <div className="gate-actions">
            <Navigate to="/admin/login" state={{ from: location }} replace />
          </div>
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
