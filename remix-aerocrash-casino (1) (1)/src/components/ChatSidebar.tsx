import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, CheckCircle, Award, Sparkles, MessageSquare } from 'lucide-react';
import { FaceAvatar } from './FaceAvatar';

interface ChatSidebarProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  messages,
  onSendMessage
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleQuickEmoji = (emoji: string) => {
    onSendMessage(emoji);
  };

  return (
    <div className="w-full h-full bg-[#10141d] flex flex-col select-none">
      {/* Chat Header */}
      <div className="p-3 border-b border-[#1f2633] bg-[#0d1017] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-xs text-white uppercase tracking-wider">
            Player Chat
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Room EN #1</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
        {messages.map((msg) => {
          // Color logic: green or yellow or cyan
          const nameColorClass =
            msg.color === 'green'
              ? 'text-emerald-400'
              : msg.color === 'yellow'
              ? 'text-amber-400'
              : msg.color === 'cyan'
              ? 'text-cyan-400'
              : 'text-purple-400';

          return (
            <div
              key={msg.id}
              className={`rounded-lg p-2 transition-colors flex items-start gap-2 ${
                msg.isSelf
                  ? 'bg-emerald-950/20 border border-emerald-500/30'
                  : 'bg-[#151b26] hover:bg-[#192130]'
              }`}
            >
              <FaceAvatar
                src={msg.avatarUrl}
                name={msg.user}
                size="sm"
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`font-bold truncate text-xs ${nameColorClass}`}>
                      {msg.user}
                    </span>

                    {/* Badges / indicators */}
                    {msg.badge === 'verified' && (
                      <span title="Verified player">
                        <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                      </span>
                    )}
                    {msg.badge === 'claimed' && (
                      <span className="text-[9px] uppercase font-bold px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                        claimed
                      </span>
                    )}
                    {msg.badge === 'vip' && (
                      <span className="text-[9px] uppercase font-bold px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5 shrink-0">
                        <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                        VIP
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono-num shrink-0">
                    {msg.timestamp}
                  </span>
                </div>
                <p className="text-zinc-200 text-xs break-words leading-relaxed">
                  {msg.text}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Reaction Emojis */}
      <div className="px-3 py-1.5 bg-[#0c0f16] border-t border-[#18202d] flex items-center justify-between text-base">
        {['🚀', '💰', '🔥', '✈️', '👏', '😱'].map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleQuickEmoji(emoji)}
            className="p-1 rounded hover:bg-[#1a2230] transition-transform active:scale-90"
            title={`React ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Chat Input Box */}
      <form onSubmit={handleSubmit} className="p-2 bg-[#0a0d14] border-t border-[#1f2633] flex gap-1.5">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Send a message..."
          maxLength={120}
          className="flex-1 bg-[#161d2a] border border-[#263143] rounded-lg px-2.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white rounded-lg transition-colors flex items-center justify-center shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
