import React from 'react';
import { X, ShieldCheck, Zap, DollarSign, Award } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#121722] border border-[#232d3f] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-4 border-b border-[#1f2635] flex items-center justify-between bg-[#0e121b]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">How to Play & Provably Fair</h3>
              <p className="text-[11px] text-zinc-400">Aviator Crash Game Mechanics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs sm:text-sm text-zinc-300 max-h-[75vh] overflow-y-auto">
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 border border-emerald-500/30">
              1
            </div>
            <div>
              <h4 className="font-bold text-white mb-0.5">Place Your Bet</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Choose your bet amount before the round begins. You can place one or two independent bets simultaneously on both control panels.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-red-500/20 text-red-400 font-bold flex items-center justify-center shrink-0 border border-red-500/30">
              2
            </div>
            <div>
              <h4 className="font-bold text-white mb-0.5">Watch Multiplier Climb</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                The lucky plane takes off and the win coefficient starts scaling up from 1.00x! As the plane climbs, your potential cashout payout increases continuously.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 border border-amber-500/30">
              3
            </div>
            <div>
              <h4 className="font-bold text-white mb-0.5">Cash Out Before It Flees!</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Hit <strong className="text-amber-300">Cash Out</strong> before the lucky plane flies away! If you don't cash out before the crash, the bet is lost. You can also configure <strong className="text-white">Auto Cash Out</strong> (e.g., at 2.00x).
              </p>
            </div>
          </div>

          <div className="bg-[#0b0e14] border border-[#1e2736] rounded-xl p-3.5 mt-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1 text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              100% Provably Fair Technology
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Every round's multiplier is computed using cryptographic server and client seeds. The coefficient is pre-generated independently of the bet amounts, ensuring total mathematical fairness and transparency.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1f2635] bg-[#0e121b] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};
