import { ChatMessage, HistoryItem, PlayerBet } from '../types';
import { getAvatarForUser } from './avatars';

export const INITIAL_HISTORY: HistoryItem[] = [
  { id: '1', multiplier: 1.78, timestamp: Date.now() - 300000, colorClass: 'text-white bg-red-600 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' },
  { id: '2', multiplier: 6.07, timestamp: Date.now() - 280000, colorClass: 'text-purple-200 bg-purple-800/80 border-purple-500/50' },
  { id: '3', multiplier: 58.84, timestamp: Date.now() - 250000, colorClass: 'text-amber-200 bg-amber-600/90 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]' },
  { id: '4', multiplier: 1.23, timestamp: Date.now() - 220000, colorClass: 'text-white bg-red-600 border-red-500' },
  { id: '5', multiplier: 1.78, timestamp: Date.now() - 190000, colorClass: 'text-white bg-red-600 border-red-500' },
  { id: '6', multiplier: 11.39, timestamp: Date.now() - 160000, colorClass: 'text-amber-200 bg-amber-600/90 border-amber-400' },
  { id: '7', multiplier: 1.01, timestamp: Date.now() - 130000, colorClass: 'text-white bg-red-700 border-red-600 font-extrabold' },
  { id: '8', multiplier: 2.26, timestamp: Date.now() - 100000, colorClass: 'text-purple-200 bg-purple-700/60 border-purple-500/40' },
  { id: '9', multiplier: 2.39, timestamp: Date.now() - 80000, colorClass: 'text-purple-200 bg-purple-700/60 border-purple-500/40' },
  { id: '10', multiplier: 1.88, timestamp: Date.now() - 60000, colorClass: 'text-white bg-red-600 border-red-500' },
  { id: '11', multiplier: 7.89, timestamp: Date.now() - 40000, colorClass: 'text-indigo-200 bg-indigo-700/70 border-indigo-400/50' },
  { id: '12', multiplier: 1.09, timestamp: Date.now() - 20000, colorClass: 'text-white bg-red-600 border-red-500' },
];

export function formatKSh(amount: number): string {
  return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KES`;
}

export function formatKShShort(amount: number): string {
  return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Masks the username as requested by the user:
 * "Dont mention the whole name of people who are putting bets be like E.G pa*******y"
 * e.g. "kamau_254" -> "ka*****4", "paul_kenya" -> "pa*******a", "d_user_9" -> "d***9"
 */
export function maskUsername(name: string): string {
  if (!name || name.length <= 2) return `${name || 'u'}***`;
  
  // Format like Spribe screenshot: "d***9" or "pa*******y"
  const clean = name.replace(/[^a-zA-Z0-9]/g, '');
  if (clean.length <= 3) {
    return `${clean.charAt(0)}***${clean.charAt(clean.length - 1)}`;
  }
  
  if (clean.length <= 5) {
    return `${clean.slice(0, 1)}***${clean.slice(-1)}`;
  }

  // E.g. "pa*******y" for longer names
  const prefix = clean.slice(0, 2);
  const suffix = clean.slice(-1);
  const asterisks = '*'.repeat(Math.max(3, Math.min(7, clean.length - 3)));
  return `${prefix}${asterisks}${suffix}`;
}

/**
 * Multiplier badge style rule:
 * "for past bets below two or history bets use a red color to show and as the bets increases like now above two the color red fades"
 */
export function getMultiplierBadgeStyle(val: number): string {
  // Below 2.0x: Solid vibrant red (Spribe Aviator low crash)
  if (val < 2.0) {
    if (val <= 1.2) {
      return 'text-white bg-red-700 border-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)] font-bold';
    }
    return 'text-white bg-red-600 border-red-500 font-bold';
  }
  
  // Between 2.0x and 3.5x: Red fades out into magenta/purple
  if (val < 3.5) {
    return 'text-purple-200 bg-gradient-to-r from-rose-800/70 to-purple-800/70 border-purple-500/40 font-semibold';
  }
  
  // Between 3.5x and 10.0x: Soft violet / indigo
  if (val < 10.0) {
    return 'text-purple-200 bg-purple-900/60 border-purple-500/40 font-semibold';
  }
  
  // 10.0x and above: High golden multiplier
  return 'text-amber-200 bg-gradient-to-r from-amber-600/90 to-yellow-600/90 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)] font-bold';
}

// Authentic Kenyan Aviator handles that will be masked
export const BOT_NAMES = [
  'paul_kenya', 'david_9', 'daniel_2', 'dennis_5', 'duncan_4', 'douglas_6',
  'kamau_254', 'otieno_ace', 'wangari_x', 'brian_k', 'mwangi_bets',
  'chebet_win', 'mutua_99', 'omondi_jet', 'wambui_lucky', 'karanja_pro',
  'barasa_fly', 'mercy_k', 'hassan_m', 'kinyanjui_7', 'korir_champ',
  'fatuma_ke', 'juma_strike', 'maina_speed', 'kipchoge_run', 'njeri_fly'
];

export const AVATAR_COLORS = [
  'bg-amber-600', 'bg-blue-600', 'bg-red-600', 'bg-emerald-600', 
  'bg-purple-600', 'bg-rose-600', 'bg-indigo-600', 'bg-teal-600'
];

export function generateRoundBots(targetCount?: number): PlayerBet[] {
  const count = targetCount !== undefined ? targetCount : Math.floor(Math.random() * 50) + 120;
  const bets: PlayerBet[] = [];
  const usedNames = new Set<string>();

  // Standard Spribe Aviator bet amounts (KES 50 to KES 2,000)
  const amounts = [50, 100, 100, 100, 150, 200, 200, 250, 500, 500, 1000, 1500, 2000];

  for (let i = 0; i < count; i++) {
    const baseName = BOT_NAMES[i % BOT_NAMES.length];
    const uniqueRaw = i >= BOT_NAMES.length ? `${baseName}_${Math.floor(i / BOT_NAMES.length)}` : baseName;

    const amount = amounts[Math.floor(Math.random() * amounts.length)];

    // Realistic cashout targets
    const r = Math.random();
    let target = 1.15 + Math.random() * 2.8;
    if (r > 0.85) target = 4.0 + Math.random() * 15.0;
    if (r < 0.3) target = 1.1 + Math.random() * 0.5;

    bets.push({
      id: `bot-${i}-${Date.now()}`,
      username: maskUsername(uniqueRaw),
      avatar: uniqueRaw.substring(0, 1).toUpperCase(),
      avatarUrl: getAvatarForUser(uniqueRaw),
      amount,
      autoCashout: Math.round(target * 100) / 100,
      status: 'active'
    });
  }

  // Sort by amount descending
  return bets.sort((a, b) => b.amount - a.amount);
}

export const INITIAL_CHAT: ChatMessage[] = [
  {
    id: 'c1',
    user: 'pa*******y',
    avatarUrl: getAvatarForUser('paul_kenya'),
    color: 'yellow',
    text: 'Predictor signal 2.15x is accurate today! 🚀',
    timestamp: '17:28',
    badge: 'vip'
  },
  {
    id: 'c2',
    user: 'ot*****e',
    avatarUrl: getAvatarForUser('otieno_ace'),
    color: 'green',
    text: 'Cashed out KES 14,500 safely! 🔥',
    timestamp: '17:29',
    badge: 'claimed'
  },
  {
    id: 'c3',
    user: 'wa*****x',
    avatarUrl: getAvatarForUser('wangari_x'),
    color: 'cyan',
    text: 'Fly high red jet 🇰🇪 GL to all!',
    timestamp: '17:30',
    badge: 'verified'
  },
  {
    id: 'c4',
    user: 'd***5',
    avatarUrl: getAvatarForUser('dennis_5'),
    color: 'purple',
    text: 'Locked KES 100 on auto-cashout 1.75x ✈️',
    timestamp: '17:31'
  }
];

export const CHAT_TEMPLATES_TAKEOFF = [
  'Twende kazi! 🛫🇰🇪',
  'Takeoff smooth leo!',
  'Fly safe red bird!',
  'Holding to 2x minimum! 🙏',
  'Bet locked, GL guys!',
  'Let it soar today 🚀',
  'Spribe bird flying high!'
];

export const CHAT_TEMPLATES_HIGH = [
  'WOOO KES 25,000+ win potential!! 🔥',
  'HOLYY 5X+ Pesa tele leo!',
  'Over 4x already!! Who is still in?',
  'Cashed half, letting the second panel ride! 💎',
  '10X MONSTER ROUND! 🚀🚀🚀',
  'Huge flight round today!'
];

export const CHAT_TEMPLATES_CRASH = [
  'Aishh flew away just before 2x 😭',
  'Crashed! Next round will be massive',
  'GG cashed KES 3,500 just before it flew',
  'Reloading KES 200 for next round',
  'Caught 1.85x nice profit'
];

export const CHAT_TEMPLATES_RANDOM = [
  'Cheza safe wakuu, do not get greedy!',
  'Predictor radar is working like magic 🎯',
  'M-Pesa cashout is instant today 🙌',
  'Double bet strategy is best: 1.5x safe and 3x target',
  'Waiting for the next takeoff...',
  'Who caught that 6x flight?',
  'Nairobi gamers winning big today 🇰🇪'
];
