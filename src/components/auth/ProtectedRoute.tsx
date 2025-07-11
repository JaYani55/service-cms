import { useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * A component that protects routes requiring authentication
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, session } = useAuth();
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
  
  // Render children if authenticated
  return <>{children}</>;
};

export default ProtectedRoute;
