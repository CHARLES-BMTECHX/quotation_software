import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Show loading spinner while checking token
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl font-semibold text-gold">Loading...</div>
      </div>
    );
  }

  // If no user (not logged in), redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If logged in, render the protected content
  return children;
}