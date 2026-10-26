import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from './ui.jsx';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner full label="Loading..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}