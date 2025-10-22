import { useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'staff' | 'mentor' | 'admin';
}

/**
 * A component that protects routes requiring authentication and optionally a specific role.
 */
const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading, session } = useAuth();
  const { hasRole } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // If user authentication fails and loading is complete, redirect to login
    if (!loading && !user && !session && location.pathname !== '/login') {
      // Use React Router for navigation
      navigate('/login', { replace: true });
    }
  }, [user, loading, session, navigate, location.pathname]);
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!user && !session) {
    return <Navigate to="/login" replace />;
  }

  // If a role is required, check if the user has it
  if (requiredRole && !hasRole(requiredRole)) {
    // Redirect to a 'not authorized' page or home
    return <Navigate to="/events" replace />;
  }
  
  // Render children if authenticated and authorized
  return <>{children}</>;
};

export default ProtectedRoute;
