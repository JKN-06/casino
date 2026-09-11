import React from 'react';
import { HistoryItem, AccountMode, UserProfile } from '../types';
import { Volume2, VolumeX, HelpCircle, RotateCcw, ArrowDownCircle, User } from 'lucide-react';
import { formatKSh } from '../utils/mockData';
import { FaceAvatar } from './FaceAvatar';

interface HeaderProps {
  history: HistoryItem[];
  balance: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onResetBalance: () => void;
  onOpenRules: () => void;
  onOpenHistoryModal: () => void;
  onlineCount: number;
  accountMode: AccountMode;
  onSwitchAccountMode: (mode: AccountMode) => void;
  profile: UserProfile;
  onOpenProfile: () => void;
  onOpenDeposit: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  history,
  balance,
  isMuted,
  onToggleMute,
  onResetBalance,
  onOpenRules,
  onOpenHistoryModal,
  onlineCount,
  accountMode,
  onSwitchAccountMode,
  profile,
  onOpenProfile,
  onOpenDeposit
}) => {
  return (
    <header className="h-14 bg-[#10141d] border-b border-[#1f2633] px-2 sm:px-4 md:px-5 flex items-center justify-between select-none z-20 shrink-0 gap-2">
      {/* Brand & Online count (updates randomly every 5 minutes) */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center gap-2">
          {/* Red Jet Icon */}
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-[0_0_12px_rgba(239,68,68,0.5)] border border-red-500/50">
            <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-current -rotate-45 transform">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="italic font-black text-red-500 text-lg sm:text-xl tracking-wide font-sans drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]">
                Aviator
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span>🇰🇪</span>
                <span>KES</span>
              </span>
            </div>
            {/* Dynamic Online Players counter (changes every 5 min) */}
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-zinc-400 font-medium font-mono-num">
                {onlineCount.toLocaleString()} online
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Live Multiplier History Ribbon */}
      <div className="hidden md:flex items-center gap-1.5 overflow-x-auto max-w-[25vw] lg:max-w-[36vw] py-1 px-1 scrollbar-none">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {history.slice(0, 10).map((item) => (
            <button
              key={item.id}
              onClick={onOpenHistoryModal}
              title="Click to view round details"
              className={`px-2 py-0.5 rounded-full text-[11px] font-mono-num font-bold border transition-all hover:scale-105 active:scale-95 shrink-0 ${item.colorClass}`}
            >
              {item.multiplier.toFixed(2)}x
            </button>
          ))}
        </div>
        <button
          onClick={onOpenHistoryModal}
          className="text-zinc-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-zinc-800 transition-colors shrink-0 font-bold"
          title="Show full history"
        >
          •••
        </button>
      </div>

      {/* Right Controls: Account Switcher, Balance, Deposit, Profile, Sound */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Real / Demo Toggle Pill */}
        <div className="flex items-center p-0.5 bg-[#171d2b] border border-[#242e40] rounded-lg text-[10px] sm:text-xs font-bold">
          <button
            onClick={() => onSwitchAccountMode('real')}
            className={`px-2 sm:px-2.5 py-1 rounded-md transition-all ${
              accountMode === 'real'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Real Money Account"
          >
            Real
          </button>
          <button
            onClick={() => onSwitchAccountMode('demo')}
            className={`px-2 sm:px-2.5 py-1 rounded-md transition-all ${
              accountMode === 'demo'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Demo Account (Fun Mode)"
          >
            Demo
          </button>
        </div>

        {/* Deposit Button (Instant M-Pesa STK) */}
        <button
          onClick={onOpenDeposit}
          className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1 shadow-[0_0_12px_rgba(16,185,129,0.4)] border border-emerald-400/40 transition-all transform active:scale-95 cursor-pointer shrink-0"
          title="Deposit via M-Pesa (Min KSh 100)"
        >
          <ArrowDownCircle className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">DEPOSIT</span>
        </button>

        {/* Kenyan Shilling Balance Card */}
        <div
          onClick={onOpenProfile}
          className="flex items-center bg-[#181f2c] hover:bg-[#1f2838] border border-[#263143] rounded-lg px-2 sm:px-2.5 py-1 gap-1.5 cursor-pointer transition-colors shadow-inner"
          title="Click to manage wallet / profile"
        >
          <div className="flex flex-col text-right">
            <span className="text-[8px] sm:text-[9px] text-zinc-400 font-medium uppercase tracking-wider leading-none">
              {accountMode === 'real' ? 'Real (KES)' : 'Demo (KES)'}
            </span>
            <span className="text-emerald-400 font-mono-num font-bold text-xs sm:text-sm leading-tight">
              {formatKSh(balance)}
            </span>
          </div>
          {accountMode === 'demo' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResetBalance();
              }}
              title="Reset demo balance to KSh 50,000.00"
              className="p-0.5 rounded text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Profile Avatar Button */}
        <button
          onClick={onOpenProfile}
          className="p-0.5 rounded-full border border-zinc-700 hover:border-emerald-400 transition-colors shrink-0"
          title="My Profile & M-Pesa Details"
        >
          <FaceAvatar src={profile.avatarUrl} name={profile.name} size="md" />
        </button>

        {/* Audio Mute */}
        <button
          onClick={onToggleMute}
          className={`p-1.5 sm:p-2 rounded-lg border transition-colors ${
            isMuted
              ? 'bg-[#181f2c] border-[#263143] text-zinc-500 hover:text-zinc-300'
              : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
          }`}
          title={isMuted ? 'Unmute audio' : 'Mute audio'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        </button>

        {/* Game Rules / Provably Fair */}
        <button
          onClick={onOpenRules}
          className="p-1.5 sm:p-2 rounded-lg bg-[#181f2c] border border-[#263143] text-zinc-400 hover:text-white hover:bg-[#20293a] transition-colors"
          title="Game Rules & Provably Fair"
        >
          <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </header>
  );
};
