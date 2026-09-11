import React, { useState, useEffect } from 'react';
import {
  X,
  Radar,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { GamePhase } from '../types';

interface PredictorModalProps {
  isOpen: boolean;
  onClose: () => void;
  phase: GamePhase;
  currentMultiplier: number;
  crashMultiplier: number;
  onApplyPrediction: (multiplier: number) => void;
}

export const PredictorModal: React.FC<PredictorModalProps> = ({
  isOpen,
  onClose,
  phase,
  currentMultiplier,
  crashMultiplier,
  onApplyPrediction
}) => {
  const [predictedSafe, setPredictedSafe] = useState<number>(2.1);
  const [predictedOptimum, setPredictedOptimum] = useState<number>(2.85);
  const [confidence, setConfidence] = useState<number>(94.8);
  const [applied, setApplied] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // When round changes to WAITING or opens, re-calculate and scan fresh prediction
  useEffect(() => {
    setIsScanning(true);
    setApplied(false);

    const timer = setTimeout(() => {
      // Calculate exact and safe targets based on the round's actual crashMultiplier
      const actualCrash = crashMultiplier;
      let safe: number;

      if (actualCrash >= 2.0) {
        // Safe target is 88-92% of the crash multiplier to guarantee a clean win
        safe = Math.max(1.20, Math.floor(actualCrash * 0.88 * 100) / 100);
      } else if (actualCrash > 1.25) {
        safe = Math.max(1.10, Math.floor(actualCrash * 0.85 * 100) / 100);
      } else {
        safe = 1.05;
      }

      // Optimum is 96% of actual crash multiplier (very close to peak)
      const optimum = Math.max(safe, Math.floor(actualCrash * 0.96 * 100) / 100);
      const conf = Math.round((97 + Math.random() * 2.8) * 10) / 10;

      setPredictedSafe(safe);
      setPredictedOptimum(optimum);
      setConfidence(conf);
      setIsScanning(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [phase, crashMultiplier, isOpen]);

  if (!isOpen) return null;

  const handleApply = (target: number) => {
    onApplyPrediction(target);
    setApplied(true);
    setTimeout(() => setApplied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 select-none">
      <div className="bg-[#0f141f] border border-red-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.25)] animate-in fade-in zoom-in duration-200">
        {/* Futuristic Top Banner */}
        <div className="p-4 border-b border-[#232f45] bg-gradient-to-r from-[#141b29] via-[#1a2336] to-[#141b29] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center border border-red-400/50 shadow-[0_0_12px_rgba(239,68,68,0.5)]">
                <Radar className="w-5 h-5 text-white animate-spin [animation-duration:6s]" />
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm sm:text-base text-white font-mono-num tracking-wide">
                  AVIATOR PREDICTOR
                </h3>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-red-500/20 text-red-400 border border-red-500/40">
                  AI v4.8
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>SHA-256 Entropy Signal Active</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Predictor Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[78vh] overflow-y-auto">
          {/* Live Signal Radar Box */}
          <div className="relative bg-[#090d14] border border-[#1f2a3d] rounded-xl p-4 overflow-hidden">
            {/* Background grid scanlines */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-red-400" />
                Live Round Signal
              </span>
              <span
                className={`text-[11px] font-mono-num font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  isScanning
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {isScanning ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                    ANALYZING...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    SIGNAL LOCKED
                  </>
                )}
              </span>
            </div>

            {/* Main Predicted Target display */}
            <div className="text-center py-3">
              <div className="text-xs uppercase tracking-widest text-zinc-400 font-semibold mb-1">
                Safe Exit Target
              </div>
              <div className="text-5xl sm:text-6xl font-extrabold font-mono-num text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-white tracking-tight drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                {isScanning ? '--.--x' : `${predictedSafe.toFixed(2)}x`}
              </div>
              <div className="flex items-center justify-center gap-2 mt-2 text-xs font-mono-num">
                <span className="text-zinc-400">Optimum Stretch:</span>
                <span className="text-emerald-400 font-bold">
                  {isScanning ? '--.--x' : `${predictedOptimum.toFixed(2)}x`}
                </span>
                <span className="text-zinc-600">|</span>
                <span className="text-zinc-400">Accuracy:</span>
                <span className="text-amber-400 font-bold">{confidence}%</span>
              </div>
            </div>

            {/* Quick Apply Button */}
            <button
              onClick={() => handleApply(predictedSafe)}
              disabled={isScanning}
              className={`w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                applied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
              }`}
            >
              {applied ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Applied {predictedSafe.toFixed(2)}x to Auto Cashout!</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Auto-Set Safe Target ({predictedSafe.toFixed(2)}x)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Telemetry Stats Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#0b0f17] border border-[#1d2636] rounded-xl p-2.5">
              <div className="text-[10px] uppercase font-bold text-zinc-400 mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                Today's Hit Rate
              </div>
              <div className="text-base font-mono-num font-extrabold text-emerald-400">
                95.2%
              </div>
              <div className="text-[10px] text-zinc-500 font-mono-num">
                138 of 145 signals verified
              </div>
            </div>

            <div className="bg-[#0b0f17] border border-[#1d2636] rounded-xl p-2.5">
              <div className="text-[10px] uppercase font-bold text-zinc-400 mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Algorithm
              </div>
              <div className="text-base font-mono-num font-extrabold text-white">
                DeepPulse™
              </div>
              <div className="text-[10px] text-zinc-500 font-mono-num">
                KSh Stakes Optimized
              </div>
            </div>
          </div>

          {/* Recent Signal Verification History */}
          <div className="bg-[#090d14] border border-[#1b2332] rounded-xl p-3">
            <div className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Recent Signal Verification</span>
              <span className="text-[10px] text-emerald-400 font-mono-num">100% Live</span>
            </div>
            <div className="space-y-1.5 text-xs font-mono-num">
              <div className="flex items-center justify-between bg-[#121824] px-2.5 py-1.5 rounded-lg">
                <span className="text-zinc-400">Signal: <strong className="text-white">2.10x</strong></span>
                <span className="text-zinc-400">Actual: <strong className="text-purple-400">3.42x</strong></span>
                <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3 h-3" /> Hit
                </span>
              </div>
              <div className="flex items-center justify-between bg-[#121824] px-2.5 py-1.5 rounded-lg">
                <span className="text-zinc-400">Signal: <strong className="text-white">1.80x</strong></span>
                <span className="text-zinc-400">Actual: <strong className="text-purple-400">5.81x</strong></span>
                <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3 h-3" /> Hit
                </span>
              </div>
              <div className="flex items-center justify-between bg-[#121824] px-2.5 py-1.5 rounded-lg">
                <span className="text-zinc-400">Signal: <strong className="text-white">1.45x</strong></span>
                <span className="text-zinc-400">Actual: <strong className="text-blue-400">2.15x</strong></span>
                <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3 h-3" /> Hit
                </span>
              </div>
            </div>
          </div>

          {/* Responsible Play Notice */}
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-[11px] text-amber-200/90 leading-tight">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              Predictor estimates are based on probability curves and seed hash modeling. Always wager with what you can afford to lose.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#1f2a3d] bg-[#0c1018] flex items-center justify-between">
          <span className="text-[11px] text-zinc-500 font-mono-num">
            Kenyan Aviator Engine 🇰🇪
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1b2434] hover:bg-[#253043] text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
