import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';
import { toast } from '@/shared/components/ui/Toast';
import type {
  LysOrganizer, LysEvent, LysEventListItem, LysDuplicateWarning,
  RegisterOrganizerForm, CreateLysEventForm,
  AdminLysEvent, AdminLysOrganizer,
} from '../types';

interface PaginatedLysEvents {
  items:      LysEventListItem[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

interface PaginatedAdminLys<T> {
  items:      T[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

// ── Venue list ────────────────────────────────────────────────────────────────

export interface LysVenueOption {
  id:       string;
  name:     string;
  cityName: string;
}

export function useLysVenues() {
  return useQuery<LysVenueOption[]>({
    queryKey: ['lys-venues'],
    queryFn:  () => api.get('/api/lys/venues').then((r) => r.data),
    staleTime: 5 * 60_000,
  });
}

// ── Organizer profile ─────────────────────────────────────────────────────────

export function useMyOrganizerProfile() {
  return useQuery<LysOrganizer>({
    queryKey: ['lys-organizer-me'],
    queryFn:  () => api.get('/api/lys/organizer/me').then((r) => r.data),
    retry:    false,
    staleTime: 10 * 60_000,
  });
}

export function useRegisterOrganizer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RegisterOrganizerForm) =>
      api.post('/api/lys/organizer/register', data).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['lys-organizer-me'] });
      toast('Organizer account created! You can now list your events.', 'success');
    },
    onError: (err: { message?: string }) =>
      toast(err?.message ?? 'Registration failed. Please try again.', 'error'),
  });
}

export function useUpdateOrganizerProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; phone?: string }) =>
      api.patch('/api/lys/organizer/me', data).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['lys-organizer-me'] });
      toast('Profile updated.', 'success');
    },
  });
}

// ── My events ─────────────────────────────────────────────────────────────────

export function useMyLysEvents(status: string, page: number) {
  return useQuery<PaginatedLysEvents>({
    queryKey: ['lys-my-events', status, page],
    queryFn:  () =>
      api.get('/api/lys/events', { params: { status, page, pageSize: 10 } }).then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useMyLysEvent(id: string | null) {
  return useQuery<LysEvent>({
    queryKey: ['lys-event', id],
    queryFn:  () => api.get(`/api/lys/events/${id}`).then((r) => r.data),
    enabled:  !!id,
    staleTime: 2 * 60_000,
  });
}

export function useCreateLysEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLysEventForm) =>
      api.post('/api/lys/events', data).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['lys-my-events'] });
      toast('Event draft created!', 'success');
    },
    onError: (err: { message?: string }) =>
      toast(err?.message ?? 'Could not create event.', 'error'),
  });
}

export function useUpdateLysEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateLysEventForm> }) =>
      api.patch(`/api/lys/events/${id}`, data).then((r) => r.data),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: ['lys-event', id] });
      void qc.invalidateQueries({ queryKey: ['lys-my-events'] });
      toast('Changes saved.', 'success');
    },
  });
}

export function useSubmitLysEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/api/lys/events/${id}/submit`).then((r) => r.data),
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: ['lys-event', id] });
      void qc.invalidateQueries({ queryKey: ['lys-my-events'] });
      toast('Event submitted for review! We will respond within 2 business days.', 'success');
    },
    onError: (err: { message?: string }) =>
      toast(err?.message ?? 'Could not submit event.', 'error'),
  });
}

export function useDeleteLysEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/lys/events/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['lys-my-events'] });
      toast('Draft deleted.', 'success');
    },
  });
}

export function useUploadLysImage() {
  return useMutation({
    mutationFn: async ({
      eventId, file, type,
    }: { eventId: string; file: File; type: 'poster' | 'backdrop' }) => {
      const form = new FormData();
      form.append('file', file);
      return api.post(
        `/api/lys/events/${eventId}/upload-${type}`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      ).then((r) => r.data as { posterUrl?: string; backdropUrl?: string });
    },
    onError: (err: { message?: string }) =>
      toast(err?.message ?? 'Image upload failed.', 'error'),
  });
}

export function useCheckDuplicates() {
  return useMutation({
    mutationFn: ({ title, date }: { title: string; date: string }) =>
      api.get('/api/lys/events/check-duplicates', { params: { title, date } })
         .then((r) => r.data as LysDuplicateWarning[]),
  });
}

export function useLysCommissionRate() {
  return useQuery<{ rate: number }>({
    queryKey: ['lys-commission-rate'],
    queryFn:  () => api.get('/api/lys/commission-rate').then((r) => r.data),
    staleTime: 60 * 60_000,
  });
}

// ── Admin LYS hooks ───────────────────────────────────────────────────────────

export function useAdminLysSubmissions(filters: Record<string, unknown>, page: number) {
  return useQuery<PaginatedAdminLys<AdminLysEvent>>({
    queryKey: ['admin-lys-submissions', filters, page],
    queryFn:  () =>
      api.get('/api/admin/lys/submissions', { params: { ...filters, page, pageSize: 20 } })
         .then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useAdminLysSubmissionDetail(id: string | null) {
  return useQuery<AdminLysEvent>({
    queryKey: ['admin-lys-submission', id],
    queryFn:  () => api.get(`/api/admin/lys/submissions/${id}`).then((r) => r.data),
    enabled:  !!id,
  });
}

export function useApproveSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/api/admin/lys/submissions/${id}/approve`).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-lys-submissions'] });
      toast('Event approved and published!', 'success');
    },
    onError: (err: { message?: string }) => toast(err?.message ?? 'Approval failed.', 'error'),
  });
}

export function useRejectSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/api/admin/lys/submissions/${id}/reject`, { reason }).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-lys-submissions'] });
      toast('Event rejected. Organizer notified.', 'success');
    },
  });
}

export function useRequestChanges() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      api.post(`/api/admin/lys/submissions/${id}/request-changes`, { notes }).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-lys-submissions'] });
      toast('Changes requested. Organizer notified.', 'success');
    },
  });
}

export function useUnpublishSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/api/admin/lys/events/${id}/unpublish`, { reason }).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-lys-submissions'] });
      toast('Event unpublished. Status reset to Submitted.', 'success');
    },
    onError: (err: { message?: string }) => toast(err?.message ?? 'Unpublish failed.', 'error'),
  });
}

export function useAdminLysOrganizers(filters: Record<string, unknown>, page: number) {
  return useQuery<PaginatedAdminLys<AdminLysOrganizer>>({
    queryKey: ['admin-lys-organizers', filters, page],
    queryFn:  () =>
      api.get('/api/admin/lys/organizers', { params: { ...filters, page, pageSize: 20 } })
         .then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useVerifyOrganizer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/api/admin/lys/organizers/${id}/verify`).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-lys-organizers'] });
      toast('Organizer verified.', 'success');
    },
  });
}

export function useUnverifyOrganizer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/api/admin/lys/organizers/${id}/unverify`).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-lys-organizers'] }),
  });
}

export function useDeactivateOrganizer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/api/admin/lys/organizers/${id}/deactivate`).then((r) => r.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-lys-organizers'] }),
  });
}
