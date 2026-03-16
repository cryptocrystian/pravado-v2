'use client';

import { X } from '@phosphor-icons/react';
import type { Journalist, ConversationMessage } from './pr-mock-data';

interface ConversationThreadProps {
  journalist: Journalist;
  messages: ConversationMessage[];
  open: boolean;
  onClose: () => void;
}

export function ConversationThread({ journalist, messages, open, onClose }: ConversationThreadProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-page/70 z-40"
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-[520px] bg-cc-page border-l border-white/8 z-50 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
          <div className="w-10 h-10 rounded-full bg-cc-cyan/20 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-cc-cyan">{journalist.initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white">{journalist.name}</h3>
            <p className="text-xs text-white/45">{journalist.publication}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={16} className="text-white/45" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-xl p-4 ${
                msg.senderType === 'user'
                  ? 'bg-white/[0.03]'
                  : 'bg-cc-cyan/5 border border-cc-cyan/10'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-medium ${
                  msg.senderType === 'journalist' ? 'text-cc-cyan' : 'text-white/70'
                }`}>
                  {msg.sender}
                </span>
                <span className="text-xs text-white/30">{msg.date}</span>
              </div>
              <p className="text-sm text-white/70 whitespace-pre-line">{msg.body}</p>
            </div>
          ))}
        </div>

        {/* Reply area */}
        <div className="px-5 py-4 border-t border-white/5">
          <textarea
            rows={3}
            placeholder="Write a reply..."
            className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cc-cyan/30 resize-none mb-2"
          />
          <button
            type="button"
            className="bg-cc-cyan text-cc-page rounded-xl px-4 py-2 text-sm font-medium hover:bg-cc-cyan/90 transition-colors"
          >
            Copy &amp; Open Email
          </button>
        </div>
      </div>
    </>
  );
}
