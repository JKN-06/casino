import React, { useState } from 'react';
import { BetPanelState, GamePhase } from '../types';
import { Minus, Plus, Check } from 'lucide-react';
import { formatKSh } from '../utils/mockData';

interface BettingPanelProps {
  panelIndex: number;
  state: BetPanelState;
  phase: GamePhase;
  currentMultiplier: number;
  balance: number;
  onUpdateState: (updates: Partial<BetPanelState>) => void;
  onPlaceBet: () => void;
  onCancelBet: () => void;
  onCashOut: () => void;
}

export const BettingPanel: React.FC<BettingPanelProps> = ({
  panelIndex,
  state,
  phase,
  currentMultiplier,
  balance,
  onUpdateState,
  onPlaceBet,
  onCancelBet,
  onCashOut
}) => {
  const [activeTab, setActiveTab] = useState<'bet' | 'auto'>('bet');

  const {
    betAmount,
    autoCashoutEnabled,
    autoCashoutMultiplier = 1.5,
    autoBetEnabled,
    hasPlacedBet,
    hasCashedOut,
    cashedOutMultiplier,
    winAmount
  } = state;

  // Handle amount adjustments in KSh
  const adjustAmount = (delta: number) => {
    const next = Math.max(10, Math.min(50000, Math.round((betAmount + delta) * 100) / 100));
    onUpdateState({ betAmount: next });
  };

  const setFixedAmount = (amt: number) => {
    onUpdateState({ betAmount: amt });
  };

  const adjustAutoCashout = (delta: number) => {
    const next = Math.max(1.05, Math.min(100, Math.round((autoCashoutMultiplier + delta) * 100) / 100));
    onUpdateState({ autoCashoutMultiplier: next });
  };

  // Button State Calculation
  const isFlightActive = phase === 'IN_FLIGHT';
  const isWaiting = phase === 'WAITING' || phase === 'STARTING';

  // Live cashout potential
  const liveWinPotential = betAmount * currentMultiplier;

  return (
    <div className="flex-1 bg-[#121722] border border-[#1f2635] rounded-xl p-2 sm:p-2.5 flex flex-col justify-between shadow-lg relative select-none min-w-0">
      {/* Top Header: Bet / Auto toggle & Box label */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center p-0.5 bg-[#0d1017] rounded border border-[#232d3f] text-[10px] sm:text-xs font-semibold">
          <button
            onClick={() => setActiveTab('bet')}
            className={`px-2 py-0.5 rounded transition-colors ${
              activeTab === 'bet' ? 'bg-[#232d3f] text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Bet
          </button>
          <button
            onClick={() => {
              setActiveTab('auto');
              onUpdateState({ autoBetEnabled: !autoBetEnabled });
            }}
            className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
              activeTab === 'auto' || autoBetEnabled
                ? 'bg-[#232d3f] text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Auto</span>
            {autoBetEnabled && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
          </button>
        </div>

        <span className="text-[10px] font-mono-num text-zinc-400 uppercase tracking-wider font-semibold">
          Box {panelIndex + 1}
        </span>
      </div>

      {/* Bet Amount Stepper & Quick Chips */}
      <div className="bg-[#10141d] border border-[#1e2736] rounded-lg p-1.5 mb-1.5">
        <div className="flex items-center justify-between mb-1 px-0.5">
          <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">
            Bet (KES)
          </span>
          <span className="text-[9px] text-zinc-500 font-mono-num">
            Min 10 • Max 50k
          </span>
        </div>

        {/* Stepper row */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={() => adjustAmount(-50)}
            disabled={hasPlacedBet && isFlightActive}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#2a3447] hover:bg-[#34425a] disabled:opacity-30 text-white font-bold flex items-center justify-center transition-colors shrink-0 shadow text-xs"
          >
            <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>

          <div className="flex-1 flex items-center justify-center bg-[#181f2c] border border-[#273347] rounded-full py-0.5 px-2">
            <input
              type="number"
              min="10"
              max="50000"
              step="10"
              value={betAmount}
              disabled={hasPlacedBet && isFlightActive}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                onUpdateState({ betAmount: Math.max(0, val) });
              }}
              className="w-full bg-transparent text-center font-mono-num font-extrabold text-xs sm:text-sm md:text-base text-white focus:outline-none disabled:opacity-50"
            />
          </div>

          <button
            type="button"
            onClick={() => adjustAmount(50)}
            disabled={hasPlacedBet && isFlightActive}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#2a3447] hover:bg-[#34425a] disabled:opacity-30 text-white font-bold flex items-center justify-center transition-colors shrink-0 shadow text-xs"
          >
            <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>

        {/* Quick chips matching Spribe presets */}
        <div className="grid grid-cols-4 gap-1 mt-1.5">
          {[50, 100, 200, 500].map((amt) => (
            <button
              key={amt}
              type="button"
              disabled={hasPlacedBet && isFlightActive}
              onClick={() => setFixedAmount(amt)}
              className={`py-0.5 rounded-full text-[10px] font-mono-num font-bold transition-all text-center ${
                betAmount === amt
                  ? 'bg-[#3b4861] text-white shadow'
                  : 'bg-[#1b2331] hover:bg-[#253043] text-zinc-300 disabled:opacity-40'
              }`}
            >
              {amt}
            </button>
          ))}
        </div>
      </div>

      {/* Auto Cashout Multiplier setting: Defaulted to 1.50x in all slots so users can simply click the checkbox */}
      <div className="bg-[#10141d] border border-[#1e2736] rounded-lg p-1.5 mb-1.5 flex items-center justify-between gap-1">
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoCashoutEnabled}
            onChange={(e) => {
              const checked = e.target.checked;
              onUpdateState({
                autoCashoutEnabled: checked,
                autoCashoutMultiplier: autoCashoutMultiplier || 1.5
              });
            }}
            className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-900 text-lime-500 focus:ring-0 cursor-pointer accent-lime-500"
          />
          <span className="text-[10px] sm:text-[11px] font-bold text-zinc-200 whitespace-nowrap">
            Auto Cash Out
          </span>
        </label>

        {/* Multiplier Stepper (Default 1.50x) */}
        <div className="flex items-center gap-1 bg-[#161c28] border border-[#252f42] rounded-full px-1.5 py-0.5">
          <button
            type="button"
            onClick={() => adjustAutoCashout(-0.1)}
            disabled={!autoCashoutEnabled || (hasPlacedBet && isFlightActive)}
            className="w-4 h-4 rounded-full bg-[#242d3d] hover:bg-[#303c52] disabled:opacity-30 text-white font-bold flex items-center justify-center text-[10px]"
          >
            -
          </button>
          <span className={`text-[10px] sm:text-[11px] font-mono-num font-black ${autoCashoutEnabled ? 'text-lime-400' : 'text-zinc-400'}`}>
            {(autoCashoutMultiplier || 1.5).toFixed(2)}x
          </span>
          <button
            type="button"
            onClick={() => adjustAutoCashout(0.1)}
            disabled={!autoCashoutEnabled || (hasPlacedBet && isFlightActive)}
            className="w-4 h-4 rounded-full bg-[#242d3d] hover:bg-[#303c52] disabled:opacity-30 text-white font-bold flex items-center justify-center text-[10px]"
          >
            +
          </button>
        </div>
      </div>

      {/* Dominating Spribe Action Button */}
      <div className="w-full">
        {/* 1. In flight AND user placed bet before takeoff -> CASH OUT BUTTON */}
        {isFlightActive && hasPlacedBet && !hasCashedOut ? (
          <button
            onClick={onCashOut}
            className="w-full min-h-[50px] sm:min-h-[56px] md:min-h-[64px] bg-gradient-to-b from-[#f97316] via-[#ea580c] to-[#c2410c] hover:from-[#fb923c] hover:to-[#ea580c] text-white rounded-xl font-extrabold flex flex-col items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.6)] border border-amber-300/40 transition-all transform active:scale-95 group cursor-pointer p-1"
          >
            <span className="text-[11px] sm:text-xs uppercase tracking-widest text-white font-extrabold drop-shadow">
              CASH OUT
            </span>
            <span className="text-sm sm:text-base md:text-lg font-mono-num font-black tracking-tight text-white drop-shadow">
              {formatKSh(liveWinPotential)}
            </span>
            <span className="text-[9px] sm:text-[10px] font-mono-num text-amber-200 font-bold">
              at {currentMultiplier.toFixed(2)}x
            </span>
          </button>
        ) : hasCashedOut ? (
          // User cashed out successfully this round
          <div className="w-full min-h-[50px] sm:min-h-[56px] md:min-h-[64px] bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 rounded-xl flex flex-col items-center justify-center p-1 text-center shadow-lg">
            <span className="text-[10px] sm:text-xs uppercase tracking-wider font-extrabold flex items-center gap-1 text-emerald-400">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              Cashed Out!
            </span>
            <span className="text-sm sm:text-base font-mono-num font-black text-white">
              +{formatKSh(winAmount || 0)}
            </span>
            <span className="text-[9px] font-mono-num text-emerald-300 font-bold">
              @ {cashedOutMultiplier?.toFixed(2)}x
            </span>
          </div>
        ) : state.queuedForNextRound ? (
          // User queued bet during flight for the upcoming round
          <button
            onClick={onCancelBet}
            className="w-full min-h-[50px] sm:min-h-[56px] md:min-h-[64px] bg-amber-900/30 hover:bg-amber-900/40 text-amber-300 border border-amber-500/40 rounded-xl font-bold flex flex-col items-center justify-center transition-all cursor-pointer shadow-lg p-1"
            title="Click to cancel queued bet"
          >
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded-full border border-amber-500/30">
              QUEUED NEXT ROUND
            </span>
            <span className="text-xs sm:text-sm font-mono-num font-black text-white mt-0.5">
              {formatKSh(betAmount)}
            </span>
            <span className="text-[9px] text-amber-300/80 uppercase font-semibold">
              Cancel
            </span>
          </button>
        ) : isWaiting && hasPlacedBet ? (
          // Bet is armed before takeoff -> CANCEL button
          <button
            onClick={onCancelBet}
            className="w-full min-h-[50px] sm:min-h-[56px] md:min-h-[64px] bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 rounded-xl font-bold flex flex-col items-center justify-center transition-all cursor-pointer shadow-lg p-1"
          >
            <span className="text-[10px] sm:text-xs uppercase tracking-wider font-extrabold">CANCEL BET</span>
            <span className="text-xs sm:text-sm font-mono-num font-black text-white mt-0.5">
              {formatKSh(betAmount)}
            </span>
            <span className="text-[9px] text-zinc-400 uppercase font-semibold">
              Starting soon...
            </span>
          </button>
        ) : (
          // Spribe Lime-Green BET button (Dominant yellow-green button)
          <button
            onClick={onPlaceBet}
            disabled={betAmount <= 0 || betAmount > balance}
            className="w-full min-h-[50px] sm:min-h-[56px] md:min-h-[64px] bg-gradient-to-b from-[#bbf246] via-[#a3e635] to-[#84cc16] hover:from-[#d9f99d] hover:to-[#a3e635] text-black disabled:opacity-40 text-center rounded-xl font-black flex flex-col items-center justify-center shadow-[0_0_20px_rgba(163,230,53,0.35)] border border-[#bef264]/60 transition-all transform active:scale-95 cursor-pointer p-1"
          >
            <span className="text-lg sm:text-xl md:text-2xl tracking-wide font-black text-black leading-none">
              Bet
            </span>
            <span className="text-xs sm:text-sm font-mono-num font-extrabold text-zinc-900 mt-0.5">
              {formatKSh(betAmount)}
            </span>
            {isFlightActive && (
              <span className="text-[8px] sm:text-[9px] text-zinc-800 uppercase tracking-wider font-bold bg-black/10 px-1.5 py-0.2 rounded-full mt-0.5">
                FOR NEXT ROUND
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
