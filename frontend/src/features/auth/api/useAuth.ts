import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/shared/lib/api';
import type { AuthResponse, LoginRequest, SignupRequest } from '@/shared/types';
import { useAuthStore } from '@/features/auth/store/authStore';
import { ROUTES } from '@/shared/constants';
import { toast } from '@/shared/components/ui/Toast';

export function useSignup() {
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: (data: SignupRequest) =>
      api.post<AuthResponse>('/api/auth/signup', data).then((r) => r.data),
    onSuccess: ({ accessToken, user }) => {
      setAuth(user, accessToken);
      toast('Welcome to BookKaroo!', 'success');
      // navigation handled by SignupPage (no returnTo flow for new accounts)
    },
  });
}

export function useLogin() {
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: (data: LoginRequest) =>
      api.post<AuthResponse>('/api/auth/login', data).then((r) => r.data),
    onSuccess: ({ accessToken, user }) => {
      setAuth(user, accessToken);
      // navigation handled by LoginForm so it can redirect to returnTo
    },
  });
}

export function useLogout() {
  const { clearAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => api.post('/api/auth/logout').then((r) => r.data),
    onSettled: () => {
      clearAuth();
      navigate(ROUTES.HOME);
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) =>
      api.post('/api/auth/forgot-password', { email }).then((r) => r.data),
  });
}

export function useResetPassword() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      api.post('/api/auth/reset-password', { token, newPassword }).then((r) => r.data),
    onSuccess: () => {
      toast('Password reset! Please sign in.', 'success');
      navigate(ROUTES.LOGIN);
    },
  });
}
