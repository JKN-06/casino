import React, { useState } from 'react';
import { PlayerBet } from '../types';
import { ShieldCheck } from 'lucide-react';
import { formatKShShort, maskUsername } from '../utils/mockData';
import { FaceAvatar } from './FaceAvatar';

interface BetsSidebarProps {
  bets: PlayerBet[];
  userBets: PlayerBet[];
  currentMultiplier: number;
}

export const BetsSidebar: React.FC<BetsSidebarProps> = ({
  bets,
  userBets,
  currentMultiplier
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'previous' | 'top'>('all');

  // Compute stats
  const displayList = activeTab === 'all' ? [...userBets, ...bets] : userBets;
  const cashedOutWinners = displayList.filter((b) => b.status === 'cashed_out');
  const totalWinAmount = cashedOutWinners.reduce((sum, b) => sum + (b.winAmount || 0), 0);

  return (
    <div className="w-full h-full bg-[#121620] flex flex-col select-none text-xs">
      {/* Top Tabs: All Bets / Previous / Top (Matching Spribe Aviator) */}
      <div className="p-2.5 border-b border-[#1b2230] bg-[#0e121a]">
        <div className="max-w-md mx-auto grid grid-cols-3 p-0.5 bg-[#171d2b] rounded-full border border-[#242d3e] text-[11px] font-semibold">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-1 rounded-full transition-all text-center ${
              activeTab === 'all'
                ? 'bg-[#293447] text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Bets
          </button>
          <button
            onClick={() => setActiveTab('previous')}
            className={`py-1 rounded-full transition-all text-center ${
              activeTab === 'previous'
                ? 'bg-[#293447] text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Previous
          </button>
          <button
            onClick={() => setActiveTab('top')}
            className={`py-1 rounded-full transition-all text-center ${
              activeTab === 'top'
                ? 'bg-[#293447] text-white font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Top
          </button>
        </div>

        {/* Spribe Stats Row: 165/176 Bets | 328.46 Total win KES */}
        <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2 px-1 font-mono-num">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block animate-pulse"></span>
            <span className="font-semibold text-zinc-300">
              {cashedOutWinners.length}/{displayList.length} Bets
            </span>
          </div>
          <div className="text-right">
            <span className="text-zinc-400 mr-1 text-[10px] uppercase">Total win KES</span>
            <span className="text-emerald-400 font-bold">
              {totalWinAmount > 0 ? formatKShShort(Math.round(totalWinAmount)) : '0.00'}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Table Columns: Player | Bet KES | X | Win KES (Exact match to Spribe screenshot) */}
      <div className="grid grid-cols-12 px-2.5 py-1.5 bg-[#0b0e14] text-[10px] font-semibold text-zinc-400 border-b border-[#1b2230]">
        <div className="col-span-4">Player</div>
        <div className="col-span-3 text-right">Bet KES</div>
        <div className="col-span-2 text-center">X</div>
        <div className="col-span-3 text-right">Win KES</div>
      </div>

      {/* Scrollable Player Bets List with Masked Usernames (e.g. pa*******y, d***9) */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#151b26] text-[11px]">
        {displayList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-zinc-500 text-xs text-center p-4">
            <p>No active bets</p>
            <p className="text-[10px] text-zinc-600 mt-1">Cash in before takeoff to participate!</p>
          </div>
        ) : (
          displayList.map((player) => {
            const isCashed = player.status === 'cashed_out';
            const isCrashed = player.status === 'crashed';
            const isSelf = !!player.isUser;
            const displayedName = isSelf ? 'You' : maskUsername(player.username);

            return (
              <div
                key={player.id}
                className={`grid grid-cols-12 items-center px-2.5 py-1 transition-colors ${
                  isSelf
                    ? 'bg-emerald-950/30 border-l-2 border-emerald-500'
                    : isCashed
                    ? 'bg-emerald-950/10'
                    : 'hover:bg-[#151b26]'
                }`}
              >
                {/* 1. Player column with face avatar profile picture and masked handle */}
                <div className="col-span-4 flex items-center gap-1.5 min-w-0">
                  <FaceAvatar
                    src={player.avatarUrl}
                    name={displayedName}
                    size="xs"
                    className={isSelf ? 'ring-1 ring-emerald-400' : ''}
                  />
                  <span
                    className={`truncate font-mono-num font-medium text-[11px] ${
                      isSelf ? 'text-emerald-300 font-bold' : 'text-zinc-300'
                    }`}
                    title={displayedName}
                  >
                    {displayedName}
                  </span>
                </div>

                {/* 2. Bet KES column */}
                <div className="col-span-3 text-right font-mono-num font-semibold text-zinc-200">
                  {formatKShShort(player.amount)}
                </div>

                {/* 3. X Multiplier column */}
                <div className="col-span-2 text-center font-mono-num">
                  {isCashed ? (
                    <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/50 px-1 py-0.2 rounded border border-cyan-500/30">
                      {player.cashoutMultiplier?.toFixed(2)}x
                    </span>
                  ) : isCrashed ? (
                    <span className="text-zinc-600 text-[10px]">-</span>
                  ) : (
                    <span className="text-zinc-500 text-[10px] animate-pulse font-bold">
                      {currentMultiplier.toFixed(2)}x
                    </span>
                  )}
                </div>

                {/* 4. Win KES column */}
                <div className="col-span-3 text-right font-mono-num font-semibold">
                  {isCashed ? (
                    <span className="text-emerald-400 font-bold text-[11px]">
                      {formatKShShort(Math.round(player.winAmount || 0))}
                    </span>
                  ) : isCrashed ? (
                    <span className="text-zinc-600 text-[10px]">-</span>
                  ) : (
                    <span className="text-zinc-500 text-[10px]">
                      {formatKShShort(Math.round(player.amount * currentMultiplier))}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Spribe Authenticity Footer (Exact match to Spribe Aviator screenshot) */}
      <div className="p-2 border-t border-[#1b2230] bg-[#0c0f16] flex items-center justify-between text-[10px] text-zinc-500 font-medium">
        <div className="flex items-center gap-1 hover:text-zinc-300 transition-colors cursor-pointer">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          <span>Provably Fair Game</span>
        </div>
        <div className="text-zinc-500">
          Powered by <strong className="text-zinc-400 font-bold tracking-wider">SPRIBE</strong>
        </div>
      </div>
    </div>
  );
};
