import { useQuery } from '@tanstack/react-query';
import { api } from './api';

export interface PublicSettings {
  convenience_fee_per_ticket: string;
  offer_processing_fee:       string;
  gst_rate:                   string;
  max_seats_per_booking:      string;
  seat_lock_minutes:          string;
  cancellation_window_hours:  string;
  refund_processing_days:     string;
  support_email:              string;
  support_url:                string;
  company_state_code:         string;
  payment_provider:           string;
}

const DEFAULTS: PublicSettings = {
  convenience_fee_per_ticket: '59',
  offer_processing_fee:       '15',
  gst_rate:                   '0.18',
  max_seats_per_booking:      '10',
  seat_lock_minutes:          '8',
  cancellation_window_hours:  '2',
  refund_processing_days:     '7',
  support_email:              'support@bookkaroo.com',
  support_url:                'https://bookkaroo.com/help',
  company_state_code:         '24',
  payment_provider:           'mock',
};

export function usePublicSettings() {
  return useQuery<PublicSettings>({
    queryKey: ['public-settings'],
    queryFn:  () =>
      api.get<PublicSettings>('/api/settings').then((r) => ({
        ...DEFAULTS,
        ...r.data,
      })),
    staleTime: 5 * 60 * 1000,
    placeholderData: DEFAULTS,
  });
}

export function parseNum(s: string | undefined, fallback: number): number {
  const n = parseFloat(s ?? '');
  return isNaN(n) ? fallback : n;
}
