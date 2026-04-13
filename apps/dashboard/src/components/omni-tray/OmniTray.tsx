'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Sparkle, X, PaperPlaneRight } from '@phosphor-icons/react';
import { useOmniTray } from './useOmniTray';
import { getChipsForPath } from './omni-tray-context-chips';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

const SURFACE_LABELS: Record<string, string> = {
  'command-center': 'Command Center',
  pr: 'PR Intelligence',
  content: 'Content Hub',
  seo: 'SEO / AEO Command',
  analytics: 'Analytics',
  calendar: 'Calendar',
};

function getSurfaceLabel(pathname: string): string {
  for (const [key, label] of Object.entries(SURFACE_LABELS)) {
    if (pathname.includes(`/${key}`)) return label;
  }
  return 'Pravado';
}

export function OmniTray() {
  const { close } = useOmniTray();
  const pathname = usePathname() ?? '';
  const chips = getChipsForPath(pathname);
  const surfaceLabel = getSurfaceLabel(pathname);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isAnimatingIn, setIsAnimatingIn] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  // Slide-in animation
  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsAnimatingIn(false));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 72)}px`;
    }
  }, [input]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim()) return;

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: content.trim(),
      };

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: 'AI response coming in Phase 2 \u2014 SAGE integration pending.',
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setInput('');
    },
    []
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const transformClass = isAnimatingIn ? 'translate-x-full' : 'translate-x-0';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[49]"
        onClick={close}
        aria-hidden="true"
      />

      {/* Right-edge tray panel */}
      <div
        className={`
          fixed z-50 bg-slate-3 flex flex-col
          top-1/2 -translate-y-1/2 right-0 w-[420px] max-w-[calc(100vw-16px)] rounded-l-xl
          border-2 border-brand-cyan/40 shadow-[-4px_0_32px_rgba(0,217,255,0.12)]
          transition-transform duration-[280ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]
          ${transformClass}
        `}
      >
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
            <Sparkle weight="regular" className="w-5 h-5 text-brand-cyan shrink-0" />
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-white/90">Ask Pravado</h2>
              <p className="text-xs text-white/50 truncate">{surfaceLabel}</p>
            </div>
            <button
              onClick={close}
              className="p-2 text-white/50 hover:text-white hover:bg-slate-4 rounded-lg transition-colors shrink-0"
              aria-label="Close tray"
            >
              <X weight="regular" className="w-4 h-4" />
            </button>
          </div>

          {/* Chat messages — only renders when messages exist, capped at 400px before scroll */}
          {messages.length > 0 && (
            <div ref={chatAreaRef} className="overflow-y-auto max-h-[400px] flex flex-col gap-3 px-4 py-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      max-w-[85%] px-3 py-2 rounded-lg text-sm
                      ${msg.role === 'user'
                        ? 'bg-brand-iris/10 border border-brand-iris/20 text-white/90'
                        : 'bg-slate-4 text-white/85'
                      }
                    `}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state — only when no messages */}
          {messages.length === 0 && (
            <div className="px-4 pt-3 pb-1 text-center">
              <p className="text-xs text-white/30">Ask me anything about your visibility strategy.</p>
            </div>
          )}

          {/* Chips — only when no messages */}
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2 px-4 py-3">
              {chips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => sendMessage(chip.prompt)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-4 border border-border-subtle text-white/70 hover:text-white hover:border-brand-cyan/30 hover:bg-slate-5 transition-all whitespace-nowrap"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div className="border-t border-border-subtle px-4 py-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Pravado anything..."
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-white/90 placeholder-white/40 outline-none max-h-[72px]"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim()}
                className={`
                  p-2 rounded-lg transition-colors shrink-0
                  ${input.trim()
                    ? 'bg-brand-cyan text-slate-0 hover:bg-brand-cyan/90'
                    : 'bg-slate-4 text-white/30 cursor-not-allowed'
                  }
                `}
                aria-label="Send message"
              >
                <PaperPlaneRight weight="regular" className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
