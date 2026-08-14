import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';
import type { AdminPartnerResponse, CreatePartnerResponse } from '@/features/partner/types';

export interface AdminPartnersQuery {
  search?:   string;
  isActive?: boolean;
  page?:     number;
  pageSize?: number;
}

export interface AdminPartnersPage {
  items:      AdminPartnerResponse[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

export interface CreatePartnerRequest {
  email:          string;
  name:           string;
  mobile:         string;
  businessName:   string;
  contactPerson:  string;
  contactPhone:   string;
  contactEmail:   string;
  gstNumber?:     string;
  panNumber?:     string;
  notes?:         string;
  venueIds?:      string[];
}

export function useAdminPartners(query: AdminPartnersQuery) {
  return useQuery({
    queryKey: ['admin', 'partners', query],
    queryFn: async () => {
      const { data } = await api.get<AdminPartnersPage>('/api/admin/partners', { params: query });
      return data;
    },
  });
}

export function useCreatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreatePartnerRequest) => {
      const { data } = await api.post<CreatePartnerResponse>('/api/admin/partners', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'partners'] }),
  });
}

export function useDeactivatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (partnerId: string) => {
      await api.post(`/api/admin/partners/${partnerId}/deactivate`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'partners'] }),
  });
}

export function useActivatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (partnerId: string) => {
      await api.post(`/api/admin/partners/${partnerId}/activate`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'partners'] }),
  });
}

export function useGrantPartnerVenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ partnerId, venueId }: { partnerId: string; venueId: string }) => {
      await api.post(`/api/admin/partners/${partnerId}/venues`, { venueId });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'partners'] }),
  });
}

export function useRevokePartnerVenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ partnerId, venueId }: { partnerId: string; venueId: string }) => {
      await api.delete(`/api/admin/partners/${partnerId}/venues/${venueId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'partners'] }),
  });
}
