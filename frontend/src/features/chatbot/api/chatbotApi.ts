import { api } from '@/shared/lib/api';
import { useCityStore } from '@/shared/store/cityStore';
import type { ChatbotMessageRequest, ChatbotMessageResponse } from '../types';

export async function sendChatMessage(
  request: ChatbotMessageRequest
): Promise<ChatbotMessageResponse> {
  const city = useCityStore.getState().selectedCity;

  const { data } = await api.post<ChatbotMessageResponse>(
    '/api/chatbot/message',
    request,
    {
      headers: {
        ...(city?.id   ? { 'X-City-Id':   city.id }   : {}),
        ...(city?.name ? { 'X-City-Name': city.name } : {}),
      },
    }
  );

  return data;
}
