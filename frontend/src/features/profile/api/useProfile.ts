import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/shared/lib/api';
import { useAuthStore } from '@/features/auth/store/authStore';
import { toast } from '@/shared/components/ui/Toast';
import type { User } from '@/shared/types';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<User>('/api/auth/me').then((r) => r.data),
  });
}

interface UpdateProfilePayload {
  name?: string;
  mobile?: string;
  gender?: string;
  cityId?: string;
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const { setAuth } = useAuthStore();
  return useMutation({
    mutationFn: (data: UpdateProfilePayload) =>
      api.put<User>('/api/users/me', data).then((r) => r.data),
    onSuccess: (updated) => {
      setAuth(updated, useAuthStore.getState().accessToken ?? '');
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.patch('/api/users/me/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }).then((r) => r.data),
  });
}

export function useDeleteAccount() {
  const { clearAuth } = useAuthStore();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => api.delete('/api/users/me').then((r) => r.data),
    onSuccess: () => {
      clearAuth();
      toast('Your account has been deactivated. Goodbye!', 'success');
      navigate('/');
    },
    onError: () => toast('Failed to delete account. Please try again.', 'error'),
  });
}
