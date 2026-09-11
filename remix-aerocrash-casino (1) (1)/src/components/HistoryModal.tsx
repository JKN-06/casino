import React from 'react';
import { X, Clock, Hash, CheckCircle2 } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  history: HistoryItem[];
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  history,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#121722] border border-[#232d3f] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-[#1f2635] flex items-center justify-between bg-[#0e121b]">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-zinc-400" />
            <h3 className="font-bold text-sm sm:text-base text-white">Round History Details</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
          {history.map((item, idx) => (
            <div
              key={item.id}
              className="bg-[#0b0e14] border border-[#1c2433] rounded-xl p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono-num text-zinc-500">#{history.length - idx}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono-num border ${item.colorClass}`}>
                  {item.multiplier.toFixed(2)}x
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono-num">
                <Hash className="w-3 h-3 text-zinc-500" />
                <span className="text-zinc-500 truncate max-w-[140px]">
                  hash_{item.id}_{Math.round(item.multiplier * 1000)}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-[#1f2635] bg-[#0e121b] text-center text-xs text-zinc-400">
          Showing last {history.length} completed rounds
        </div>
      </div>
    </div>
  );
};
