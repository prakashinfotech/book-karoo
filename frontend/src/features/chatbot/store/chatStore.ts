import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ChatMessage } from '../types';

interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  isTyping: boolean;
}

interface ChatActions {
  open: () => void;
  close: () => void;
  toggle: () => void;
  addMessage: (msg: ChatMessage) => void;
  setTyping: (v: boolean) => void;
  clear: () => void;
}

export const useChatStore = create<ChatState & ChatActions>()(
  persist(
    (set) => ({
      messages:  [],
      isOpen:    false,
      isTyping:  false,

      open:   () => set({ isOpen: true }),
      close:  () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),

      addMessage: (msg) =>
        set((s) => ({ messages: [...s.messages.slice(-49), msg] })),

      setTyping: (v) => set({ isTyping: v }),

      clear: () => set({ messages: [] }),
    }),
    {
      name:    'bookkaroo-chat',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ messages: s.messages }),
    }
  )
);
