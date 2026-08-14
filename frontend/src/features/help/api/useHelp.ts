import { useMutation } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';
import { toast } from '@/shared/components/ui/Toast';

export interface ContactSupportRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
  bookingRef?: string;
}

interface ContactSupportResponse {
  message: string;
}

export function useContactSupport() {
  return useMutation<ContactSupportResponse, { message: string }, ContactSupportRequest>({
    mutationFn: (data) =>
      api.post<ContactSupportResponse>('/api/help/contact', data).then((r) => r.data),
    onError: () => toast('Failed to send message. Please try again.', 'error'),
  });
}
