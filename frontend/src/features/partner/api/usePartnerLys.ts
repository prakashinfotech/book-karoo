import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';
import type { LysPartnerEvent, LysPartnerEventPage } from '../types';

export function usePartnerLysSubmissions(params: {
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['partner', 'lys', params],
    queryFn: async () => {
      const { data } = await api.get<LysPartnerEventPage>('/api/partner/lys', { params });
      return data;
    },
  });
}

export function usePartnerLysDetail(eventId: string | undefined) {
  return useQuery({
    queryKey: ['partner', 'lys', 'detail', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data } = await api.get<LysPartnerEvent>(`/api/partner/lys/${eventId}`);
      return data;
    },
  });
}

export function usePartnerLysPendingCount() {
  return useQuery({
    queryKey: ['partner', 'lys', 'pending-count'],
    queryFn: async () => {
      const { data } = await api.get<{ count: number }>('/api/partner/lys/pending-count');
      return data.count;
    },
    staleTime: 30_000,
  });
}

export function useApprovePartnerLys() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { data } = await api.post<LysPartnerEvent>(`/api/partner/lys/${eventId}/approve`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partner', 'lys'] });
    },
  });
}

export function useRejectPartnerLys() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, reason }: { eventId: string; reason: string }) => {
      const { data } = await api.post<LysPartnerEvent>(`/api/partner/lys/${eventId}/reject`, { reason });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partner', 'lys'] });
    },
  });
}

export function useRequestChangesPartnerLys() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, notes }: { eventId: string; notes: string }) => {
      const { data } = await api.post<LysPartnerEvent>(`/api/partner/lys/${eventId}/request-changes`, { notes });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partner', 'lys'] });
    },
  });
}
