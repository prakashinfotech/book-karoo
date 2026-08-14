import { createPortal } from 'react-dom';
import { MessageCircle, X } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { ChatWindow } from './ChatWindow';

export function ChatbotWidget() {
  const { isOpen, toggle } = useChatStore();

  return createPortal(
    <div
      className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end gap-3"
      style={{ fontFamily: 'inherit' }}
    >
      {isOpen && <ChatWindow />}

      <button
        onClick={toggle}
        aria-label={isOpen ? 'Close BookKaroo AI chat' : 'Open BookKaroo AI chat'}
        aria-expanded={isOpen}
        className="w-14 h-14 rounded-full bg-accent-crimson text-white shadow-lg flex items-center justify-center hover:opacity-90 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-accent-crimson focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>,
    document.body
  );
}
