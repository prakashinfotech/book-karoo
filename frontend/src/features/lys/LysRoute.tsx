import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';

export function LysRoute() {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const location = useLocation();

  if (!isInitialized) return null;

  if (!isAuthenticated)
    return <Navigate to="/login" state={{ returnTo: location.pathname + location.search }} replace />;

  return <Outlet />;
}
