import { useRef, useEffect, useState, type KeyboardEvent } from 'react';
import { X, Send, Trash2 } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { sendChatMessage } from '../api/chatbotApi';
import { ChatMessageBubble, TypingIndicator } from './ChatMessage';
import type { ChatMessage, ConversationTurn } from '../types';

const SUGGESTIONS = [
  'Movies showing today',
  'Book tickets for weekend',
  'My upcoming bookings',
  'IPL matches near me',
];

export function ChatWindow() {
  const { messages, isOpen, isTyping, close, addMessage, setTyping, clear } = useChatStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  async function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;
    setInput('');

    const userMsg: ChatMessage = {
      id:        crypto.randomUUID(),
      role:      'user',
      content:   trimmed,
      timestamp: Date.now(),
    };
    addMessage(userMsg);
    setTyping(true);

    try {
      const history: ConversationTurn[] = messages
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }));

      const resp = await sendChatMessage({ message: trimmed, history });

      const botMsg: ChatMessage = {
        id:        crypto.randomUUID(),
        role:      'assistant',
        content:   resp.message,
        shows:     resp.shows    ?? undefined,
        events:    resp.events   ?? undefined,
        bookings:  resp.bookings ?? undefined,
        actionType: resp.actionType,
        actionUrl:  resp.actionUrl,
        timestamp: Date.now(),
      };
      addMessage(botMsg);
    } catch {
      addMessage({
        id:        crypto.randomUUID(),
        role:      'assistant',
        content:   "Sorry, I couldn't connect right now. Please try again in a moment. 🙏",
        timestamp: Date.now(),
      });
    } finally {
      setTyping(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend(input);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="BookKaroo AI Assistant"
      className="flex flex-col bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
      style={{ width: 360, height: 560 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0 bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-accent-crimson flex items-center justify-center text-sm font-bold text-white select-none">
            BK
          </div>
          <div>
            <p className="text-[#2B3148] text-sm font-semibold leading-none">BookKaroo AI</p>
            <p className="text-green-500 text-[10px] mt-0.5">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={clear}
              aria-label="Clear chat"
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <Trash2 size={15} />
            </button>
          )}
          <button
            onClick={close}
            aria-label="Close chat"
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 min-h-0 bg-[#F4F5F6]">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-3 pt-6 text-center">
            <div className="w-12 h-12 rounded-full bg-accent-crimson/10 flex items-center justify-center text-2xl">
              🎬
            </div>
            <p className="text-[#2B3148] font-semibold text-sm">Hey! I'm BookKaroo AI</p>
            <p className="text-[#6C7480] text-xs max-w-[240px]">
              Ask me to find movies, events, check showtimes, or view your bookings.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => void handleSend(s)}
                  className="text-xs bg-white hover:bg-gray-50 text-[#2B3148] border border-gray-200 rounded-full px-3 py-1.5 transition-colors shadow-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessageBubble key={msg.id} msg={msg} />
        ))}

        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 px-4 py-3 border-t border-gray-100 flex-shrink-0 bg-white">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask anything about movies or events..."
          rows={1}
          className="flex-1 resize-none bg-[#F4F5F6] border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#2B3148] placeholder:text-[#9097A6] focus:outline-none focus:ring-1 focus:ring-accent-indigo/40 focus:border-accent-indigo/40 max-h-24 overflow-y-auto"
          style={{ fieldSizing: 'content' } as React.CSSProperties}
          aria-label="Chat message input"
        />
        <button
          onClick={() => void handleSend(input)}
          disabled={!input.trim() || isTyping}
          aria-label="Send message"
          className="flex-shrink-0 w-9 h-9 rounded-xl bg-accent-crimson text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
