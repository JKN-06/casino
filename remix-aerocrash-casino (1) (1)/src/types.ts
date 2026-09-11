export type GamePhase = 'WAITING' | 'STARTING' | 'IN_FLIGHT' | 'CRASHED';

export type AccountMode = 'real' | 'demo';

export interface UserProfile {
  name: string;
  phone: string;
  avatarUrl: string;
  isRegistered: boolean;
}

export interface PlayerBet {
  id: string;
  username: string;
  avatar: string;
  avatarUrl?: string;
  amount: number;
  autoCashout?: number;
  cashoutMultiplier?: number;
  winAmount?: number;
  status: 'active' | 'cashed_out' | 'crashed';
  isUser?: boolean;
}

export interface ChatMessage {
  id: string;
  user: string;
  avatarUrl?: string;
  color: 'green' | 'yellow' | 'cyan' | 'purple' | 'orange';
  text: string;
  timestamp: string;
  badge?: 'verified' | 'claimed' | 'vip' | 'high_roller';
  isSelf?: boolean;
}

export interface HistoryItem {
  id: string;
  multiplier: number;
  timestamp: number;
  colorClass: string;
}

export interface BetPanelState {
  betAmount: number;
  autoCashoutEnabled: boolean;
  autoCashoutMultiplier: number;
  autoBetEnabled: boolean;
  hasPlacedBet: boolean;
  queuedForNextRound?: boolean;
  hasCashedOut: boolean;
  cashedOutMultiplier: number | null;
  winAmount: number | null;
}
