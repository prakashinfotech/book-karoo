import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';

export function PartnerRoute() {
  const { user, isAuthenticated, isInitialized } = useAuthStore();
  const location = useLocation();

  if (!isInitialized) return null;

  if (!isAuthenticated)
    return <Navigate to="/login" state={{ returnTo: location.pathname + location.search }} replace />;

  if (user?.role !== 'Partner' && user?.role !== 'Admin')
    return <Navigate to="/" replace />;

  return <Outlet />;
}
