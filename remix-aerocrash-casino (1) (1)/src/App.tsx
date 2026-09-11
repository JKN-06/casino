import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { GamePhase, BetPanelState, PlayerBet, ChatMessage, HistoryItem, AccountMode, UserProfile } from './types';
import { sounds } from './utils/audio';
import {
  INITIAL_HISTORY,
  INITIAL_CHAT,
  generateRoundBots,
  getMultiplierBadgeStyle,
  CHAT_TEMPLATES_TAKEOFF,
  CHAT_TEMPLATES_HIGH,
  CHAT_TEMPLATES_CRASH,
  CHAT_TEMPLATES_RANDOM,
  BOT_NAMES,
  maskUsername,
  formatKSh
} from './utils/mockData';
import { FACE_AVATARS } from './utils/avatars';
import { Header } from './components/Header';
import { CenterpieceGraph } from './components/CenterpieceGraph';
import { BetsSidebar } from './components/BetsSidebar';
import { ChatSidebar } from './components/ChatSidebar';
import { BettingPanel } from './components/BettingPanel';
import { RulesModal } from './components/RulesModal';
import { HistoryModal } from './components/HistoryModal';
import { PredictorModal } from './components/PredictorModal';
import { ProfileModal } from './components/ProfileModal';
import { Users, MessageSquare, Radar, ShieldCheck, Zap } from 'lucide-react';

const COUNTDOWN_SECONDS = 5.0;

export default function App() {
  // --------------------------------------------------------------------------
  // ACCOUNT & PROFILE STATE (Real vs Demo, M-Pesa)
  // --------------------------------------------------------------------------
  const [accountMode, setAccountMode] = useState<AccountMode>(() => {
    const saved = localStorage.getItem('aviator_account_mode');
    return (saved === 'real' || saved === 'demo') ? saved : 'demo';
  });

  const [realBalance, setRealBalance] = useState<number>(() => {
    const saved = localStorage.getItem('aviator_real_balance_kes');
    return saved !== null ? parseFloat(saved) : 2500.0;
  });

  const [demoBalance, setDemoBalance] = useState<number>(() => {
    const saved = localStorage.getItem('aviator_demo_balance_kes');
    return saved !== null ? parseFloat(saved) : 50000.0;
  });

  // Current active balance based on selected mode
  const currentBalance = accountMode === 'real' ? realBalance : demoBalance;

  // Persist balances
  useEffect(() => {
    localStorage.setItem('aviator_account_mode', accountMode);
  }, [accountMode]);

  useEffect(() => {
    localStorage.setItem('aviator_real_balance_kes', realBalance.toFixed(2));
  }, [realBalance]);

  useEffect(() => {
    localStorage.setItem('aviator_demo_balance_kes', demoBalance.toFixed(2));
  }, [demoBalance]);

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('aviator_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      name: 'Brian Otieno',
      phone: '0712345678',
      avatarUrl: FACE_AVATARS[0],
      isRegistered: true
    };
  });

  const handleUpdateProfile = (updates: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem('aviator_user_profile', JSON.stringify(next));
      return next;
    });
  };

  // --------------------------------------------------------------------------
  // DYNAMIC STATS (Online playing count & Round bettor count)
  // --------------------------------------------------------------------------
  // 1. Online count updates to a new random number every 5 minutes (300,000 ms)
  const [onlineCount, setOnlineCount] = useState<number>(() => 1850 + Math.floor(Math.random() * 400));
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount(1800 + Math.floor(Math.random() * 550));
    }, 300000); // exactly 5 minutes
    return () => clearInterval(interval);
  }, []);

  // 2. Round Bettor count: animates from 0 to >100 before takeoff, then stops
  const [bettorCount, setBettorCount] = useState<number>(0);
  const bettorTargetRef = useRef<number>(128);

  // --------------------------------------------------------------------------
  // GAME ENGINE STATE
  // --------------------------------------------------------------------------
  const [phase, setPhase] = useState<GamePhase>('WAITING');
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [crashMultiplier, setCrashMultiplier] = useState<number>(2.4);
  const [countdown, setCountdown] = useState<number>(COUNTDOWN_SECONDS);
  const [flightProgress, setFlightProgress] = useState<number>(0);

  // Ref to lock flight start time and prevent multiplier reset on cashout
  const flightStartTimeRef = useRef<number>(0);

  // Sound mute state
  const [isMuted, setIsMuted] = useState<boolean>(() => sounds.getMuted());

  // History & Social
  const [history, setHistory] = useState<HistoryItem[]>(INITIAL_HISTORY);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT);
  const [botBets, setBotBets] = useState<PlayerBet[]>(() => generateRoundBots());

  // Modals
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isPredictorOpen, setIsPredictorOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalInitialTab, setProfileModalInitialTab] = useState<'profile' | 'deposit' | 'withdraw'>('profile');

  // Bottom Content Tab (below betting slots on mobile & desktop)
  const [bottomTab, setBottomTab] = useState<'bets' | 'chat'>('bets');

  // Dual Betting Panels state in KSh
  const [panel1, setPanel1] = useState<BetPanelState>({
    betAmount: 100,
    autoCashoutEnabled: false,
    autoCashoutMultiplier: 1.5,
    autoBetEnabled: false,
    hasPlacedBet: false,
    hasCashedOut: false,
    cashedOutMultiplier: null,
    winAmount: null
  });

  const [panel2, setPanel2] = useState<BetPanelState>({
    betAmount: 200,
    autoCashoutEnabled: false,
    autoCashoutMultiplier: 1.5,
    autoBetEnabled: false,
    hasPlacedBet: false,
    hasCashedOut: false,
    cashedOutMultiplier: null,
    winAmount: null
  });

  // Keep latest refs for animation loop
  const phaseRef = useRef<GamePhase>(phase);
  phaseRef.current = phase;

  const multiplierRef = useRef<number>(multiplier);
  multiplierRef.current = multiplier;

  const crashMultiplierRef = useRef<number>(crashMultiplier);
  crashMultiplierRef.current = crashMultiplier;

  const panel1Ref = useRef<BetPanelState>(panel1);
  panel1Ref.current = panel1;

  const panel2Ref = useRef<BetPanelState>(panel2);
  panel2Ref.current = panel2;

  const botBetsRef = useRef<PlayerBet[]>(botBets);
  botBetsRef.current = botBets;

  const accountModeRef = useRef<AccountMode>(accountMode);
  accountModeRef.current = accountMode;

  const handleResetDemoBalance = () => {
    setDemoBalance(50000.0);
    addChatMessage({
      user: 'M-Pesa Bot',
      color: 'green',
      text: 'Demo practice funds refreshed to KSh 50,000.00! ✅',
      badge: 'verified'
    });
  };

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  // Helper to append a chat message
  const addChatMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newMsg: ChatMessage = {
      ...msg,
      id: `chat-${Date.now()}-${Math.random()}`,
      timestamp
    };
    setChatMessages((prev) => [...prev.slice(-40), newMsg]);
  }, []);

  // Deposit Handler (Min KSh 100)
  const handleDeposit = async (amount: number, phone: string): Promise<boolean> => {
    if (amount < 100) return false;

    setRealBalance((prev) => {
      const next = prev + amount;
      localStorage.setItem('aviator_real_balance_kes', next.toString());
      return next;
    });

    // Automatically switch to Real Money mode so funds reflect instantly
    setAccountMode('real');

    addChatMessage({
      user: 'M-PESA',
      color: 'green',
      text: `M-PESA Confirmed! KSh ${amount.toLocaleString()} received from ${phone}. Account credited. 💰`,
      badge: 'verified'
    });
    return true;
  };

  // Withdraw Handler (Min KSh 1,000)
  const handleWithdraw = async (amount: number, phone: string): Promise<boolean> => {
    if (amount < 1000 || realBalance < amount) return false;
    // Simulate B2C Payout latency
    await new Promise((r) => setTimeout(r, 1400));

    setRealBalance((prev) => Math.max(0, prev - amount));

    addChatMessage({
      user: 'M-PESA',
      color: 'yellow',
      text: `B2C Payout Confirmed! KSh ${amount.toLocaleString()} sent to ${phone}. 📲`,
      badge: 'claimed'
    });
    return true;
  };

  // Apply AI Prediction to betting panels
  const handleApplyPrediction = (predictedMultiplier: number) => {
    setPanel1((prev) => ({
      ...prev,
      autoCashoutEnabled: true,
      autoCashoutMultiplier: predictedMultiplier
    }));
    setPanel2((prev) => ({
      ...prev,
      autoCashoutEnabled: true,
      autoCashoutMultiplier: Math.max(1.1, Math.round(predictedMultiplier * 0.9 * 100) / 100)
    }));
    addChatMessage({
      user: 'AI Predictor',
      color: 'yellow',
      text: `🎯 Radar signal locked at ${predictedMultiplier.toFixed(2)}x. Auto cash-out applied to Betting Box 1 & 2!`,
      badge: 'vip'
    });
  };

  // Generate realistic provably fair crash multiplier
  const calculateCrashMultiplier = (): number => {
    // 3% instant crash at 1.00x
    if (Math.random() < 0.03) {
      return 1.0;
    }
    const r = Math.random();
    // 97% RTP curve
    const raw = 0.97 / (1 - r);
    const rounded = Math.floor(raw * 100) / 100;
    return Math.max(1.05, Math.min(120.0, rounded));
  };

  // --------------------------------------------------------------------------
  // CASHOUT LOGIC - CRITICAL FIX:
  // Does NOT reset the game loop or multiplier! The plane keeps flying!
  // --------------------------------------------------------------------------
  const executeCashOut = useCallback((panelIndex: number, currentMult: number) => {
    const panel = panelIndex === 0 ? panel1Ref.current : panel2Ref.current;
    if (!panel.hasPlacedBet || panel.hasCashedOut) return;

    const win = Math.round(panel.betAmount * currentMult * 100) / 100;

    sounds.playCashout();

    // Confetti celebration
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.75, x: panelIndex === 0 ? 0.35 : 0.65 },
      colors: ['#10b981', '#34d399', '#f59e0b', '#38bdf8']
    });

    const update: Partial<BetPanelState> = {
      hasCashedOut: true,
      cashedOutMultiplier: currentMult,
      winAmount: win
    };

    if (panelIndex === 0) {
      setPanel1((prev) => ({ ...prev, ...update }));
    } else {
      setPanel2((prev) => ({ ...prev, ...update }));
    }

    // Credit funds to the active account mode (Real or Demo)
    if (accountModeRef.current === 'real') {
      setRealBalance((prev) => prev + win);
    } else {
      setDemoBalance((prev) => prev + win);
    }

    // Announce in chat
    addChatMessage({
      user: 'You',
      avatarUrl: userProfile.avatarUrl,
      color: 'green',
      text: `Won KSh ${win.toLocaleString('en-US', { minimumFractionDigits: 2 })} at ${currentMult.toFixed(2)}x! 🎉`,
      badge: 'claimed',
      isSelf: true
    });
  }, [addChatMessage, userProfile.avatarUrl]);

  // Handle manual cash out button clicks
  const handleCashOutPanel1 = () => executeCashOut(0, multiplierRef.current);
  const handleCashOutPanel2 = () => executeCashOut(1, multiplierRef.current);

  // Handle Bet placement
  const handlePlaceBetPanel1 = () => {
    if (currentBalance < panel1.betAmount) {
      if (accountMode === 'real') {
        setProfileModalInitialTab('deposit');
        setIsProfileModalOpen(true);
      }
      return;
    }

    if (accountMode === 'real') {
      setRealBalance((prev) => prev - panel1.betAmount);
    } else {
      setDemoBalance((prev) => prev - panel1.betAmount);
    }

    if (phase === 'WAITING' || phase === 'STARTING') {
      setPanel1((prev) => ({
        ...prev,
        hasPlacedBet: true,
        queuedForNextRound: false,
        hasCashedOut: false,
        winAmount: null
      }));
    } else {
      setPanel1((prev) => ({
        ...prev,
        queuedForNextRound: true,
        hasPlacedBet: false,
        hasCashedOut: false,
        winAmount: null
      }));
    }
  };

  const handleCancelBetPanel1 = () => {
    if (panel1.hasPlacedBet && (phase === 'WAITING' || phase === 'STARTING')) {
      if (accountMode === 'real') {
        setRealBalance((prev) => prev + panel1.betAmount);
      } else {
        setDemoBalance((prev) => prev + panel1.betAmount);
      }
      setPanel1((prev) => ({ ...prev, hasPlacedBet: false }));
    } else if (panel1.queuedForNextRound) {
      if (accountMode === 'real') {
        setRealBalance((prev) => prev + panel1.betAmount);
      } else {
        setDemoBalance((prev) => prev + panel1.betAmount);
      }
      setPanel1((prev) => ({ ...prev, queuedForNextRound: false }));
    }
  };

  const handlePlaceBetPanel2 = () => {
    if (currentBalance < panel2.betAmount) {
      if (accountMode === 'real') {
        setProfileModalInitialTab('deposit');
        setIsProfileModalOpen(true);
      }
      return;
    }

    if (accountMode === 'real') {
      setRealBalance((prev) => prev - panel2.betAmount);
    } else {
      setDemoBalance((prev) => prev - panel2.betAmount);
    }

    if (phase === 'WAITING' || phase === 'STARTING') {
      setPanel2((prev) => ({
        ...prev,
        hasPlacedBet: true,
        queuedForNextRound: false,
        hasCashedOut: false,
        winAmount: null
      }));
    } else {
      setPanel2((prev) => ({
        ...prev,
        queuedForNextRound: true,
        hasPlacedBet: false,
        hasCashedOut: false,
        winAmount: null
      }));
    }
  };

  const handleCancelBetPanel2 = () => {
    if (panel2.hasPlacedBet && (phase === 'WAITING' || phase === 'STARTING')) {
      if (accountMode === 'real') {
        setRealBalance((prev) => prev + panel2.betAmount);
      } else {
        setDemoBalance((prev) => prev + panel2.betAmount);
      }
      setPanel2((prev) => ({ ...prev, hasPlacedBet: false }));
    } else if (panel2.queuedForNextRound) {
      if (accountMode === 'real') {
        setRealBalance((prev) => prev + panel2.betAmount);
      } else {
        setDemoBalance((prev) => prev + panel2.betAmount);
      }
      setPanel2((prev) => ({ ...prev, queuedForNextRound: false }));
    }
  };

  // User sending chat message
  const handleUserSendMessage = (text: string) => {
    addChatMessage({
      user: userProfile.name || 'You',
      avatarUrl: userProfile.avatarUrl,
      color: 'cyan',
      text,
      badge: 'verified',
      isSelf: true
    });
  };

  // --------------------------------------------------------------------------
  // GAME ENGINE STATE MACHINE & ANIMATION LOOP
  // NOTE: Neither `balance` nor `realBalance` nor `demoBalance` is a dependency here!
  // This guarantees `flightStartTimeRef` and the flight loop never restart on cashout!
  // --------------------------------------------------------------------------
  useEffect(() => {
    let animationFrameId: number;
    let countdownInterval: NodeJS.Timeout;
    let crashTimeoutId: NodeJS.Timeout;
    let chatIntervalId: NodeJS.Timeout;

    if (phase === 'WAITING') {
      // Pick a new target of bettors above 100 for this round (e.g. 120 - 200, like 150 or 196)
      const targetBettors = 120 + Math.floor(Math.random() * 85);
      bettorTargetRef.current = targetBettors;
      setBettorCount(0);

      // Initialize new round bots with exact count matching targetBettors
      const newBots = generateRoundBots(targetBettors);
      setBotBets(newBots);
      setMultiplier(1.0);
      setFlightProgress(0);

      // Handle Auto-Bet or Queued Bets when new round starts
      setPanel1((prev) => {
        if (prev.queuedForNextRound) {
          return {
            ...prev,
            hasPlacedBet: true,
            queuedForNextRound: false,
            hasCashedOut: false,
            winAmount: null
          };
        }
        if (prev.autoBetEnabled && !prev.hasPlacedBet) {
          return { ...prev, hasPlacedBet: true, hasCashedOut: false, winAmount: null };
        }
        return prev;
      });

      setPanel2((prev) => {
        if (prev.queuedForNextRound) {
          return {
            ...prev,
            hasPlacedBet: true,
            queuedForNextRound: false,
            hasCashedOut: false,
            winAmount: null
          };
        }
        if (prev.autoBetEnabled && !prev.hasPlacedBet) {
          return { ...prev, hasPlacedBet: true, hasCashedOut: false, winAmount: null };
        }
        return prev;
      });

      // Active chat banter during WAITING
      const waitingChatDelay = setTimeout(() => {
        const randMsg = CHAT_TEMPLATES_RANDOM[Math.floor(Math.random() * CHAT_TEMPLATES_RANDOM.length)];
        const randBot = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
        addChatMessage({
          user: maskUsername(randBot),
          color: 'yellow',
          text: randMsg
        });
      }, 1500);

      let remaining = COUNTDOWN_SECONDS;
      setCountdown(remaining);

      countdownInterval = setInterval(() => {
        remaining -= 0.1;
        // Smoothly animate bettorCount from 0 up to targetBettors (> 100) before plane starts
        const elapsed = COUNTDOWN_SECONDS - remaining;
        const fraction = Math.min(1, Math.max(0, elapsed / COUNTDOWN_SECONDS));
        const currentCount = Math.round(fraction * targetBettors);
        setBettorCount(currentCount);

        if (remaining <= 0) {
          clearInterval(countdownInterval);
          clearTimeout(waitingChatDelay);
          setCountdown(0);
          setBettorCount(targetBettors); // Locks at final number (> 100)
          // Transition to IN_FLIGHT
          const target = calculateCrashMultiplier();
          setCrashMultiplier(target);
          setPhase('IN_FLIGHT');
        } else {
          setCountdown(Math.max(0, Math.round(remaining * 10) / 10));
          if (remaining <= 3 && Math.abs(remaining - Math.round(remaining)) < 0.08) {
            sounds.playTick();
          }
        }
      }, 100);
    } else if (phase === 'IN_FLIGHT') {
      sounds.startFlightSound();

      // Lock the flight start time - strictly immutable during flight
      flightStartTimeRef.current = performance.now();

      // Chat takeoff reaction
      setTimeout(() => {
        const randMsg = CHAT_TEMPLATES_TAKEOFF[Math.floor(Math.random() * CHAT_TEMPLATES_TAKEOFF.length)];
        const randBot = botBetsRef.current[Math.floor(Math.random() * botBetsRef.current.length)]?.username || 'pa*******y';
        addChatMessage({
          user: randBot,
          color: Math.random() > 0.5 ? 'green' : 'yellow',
          text: randMsg
        });
      }, 400);

      const targetCrash = crashMultiplierRef.current;
      let hasHighChatTriggered = false;
      let hasSuperHighChatTriggered = false;

      // Active chat interval during flight (every 3.5s)
      chatIntervalId = setInterval(() => {
        const currentM = multiplierRef.current;
        if (currentM > 1.4 && Math.random() > 0.3) {
          const randBot = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
          const inFlightMsgs = [
            `Holding to ${Math.round(currentM + 1.2)}x! ✈️`,
            `Twendelee! Multiplier climbing! 🚀`,
            `KES ${Math.round(currentM * 250)} profit locked 🔥`,
            `Steady climb leo! 🇰🇪`,
            `Fly high red bird!`
          ];
          addChatMessage({
            user: maskUsername(randBot),
            color: 'cyan',
            text: inFlightMsgs[Math.floor(Math.random() * inFlightMsgs.length)]
          });
        }
      }, 3500);

      const flightLoop = (currentTime: number) => {
        // Calculate elapsed time from the locked flight start time
        const elapsedSec = Math.max(0, (currentTime - flightStartTimeRef.current) / 1000);

        // Exponential flight multiplier curve
        const currentM = Math.max(
          1.0,
          Math.round((Math.exp(0.06 * elapsedSec) + (elapsedSec > 4 ? Math.pow(elapsedSec - 4, 1.3) * 0.05 : 0)) * 100) / 100
        );

        setMultiplier(currentM);
        sounds.updateFlightPitch(currentM);

        // Normalize flight progress for curve rendering
        const progress = Math.min(0.98, elapsedSec / 22);
        setFlightProgress(progress);

        // 1. Check Auto Cashout for Panel 1
        const p1 = panel1Ref.current;
        if (p1.hasPlacedBet && !p1.hasCashedOut && p1.autoCashoutEnabled && currentM >= p1.autoCashoutMultiplier) {
          executeCashOut(0, currentM);
        }

        // 2. Check Auto Cashout for Panel 2
        const p2 = panel2Ref.current;
        if (p2.hasPlacedBet && !p2.hasCashedOut && p2.autoCashoutEnabled && currentM >= p2.autoCashoutMultiplier) {
          executeCashOut(1, currentM);
        }

        // 3. Dynamic Bot Cashouts + Live Chat Wins
        let botUpdated = false;
        const nextBots = botBetsRef.current.map((bot) => {
          if (bot.status === 'active' && bot.autoCashout && currentM >= bot.autoCashout) {
            botUpdated = true;
            const wonAmount = Math.round(bot.amount * currentM);
            if (wonAmount >= 1500 && Math.random() > 0.65) {
              addChatMessage({
                user: bot.username,
                avatarUrl: bot.avatarUrl,
                color: 'green',
                text: `Cashed out KES ${wonAmount.toLocaleString()} at ${currentM.toFixed(2)}x! 🎉`,
                badge: 'claimed'
              });
            }
            return {
              ...bot,
              status: 'cashed_out' as const,
              cashoutMultiplier: currentM,
              winAmount: wonAmount
            };
          }
          return bot;
        });

        if (botUpdated) {
          setBotBets(nextBots);
        }

        // 4. Chat reaction on high multiplier
        if (!hasHighChatTriggered && currentM >= 3.0) {
          hasHighChatTriggered = true;
          const randMsg = CHAT_TEMPLATES_HIGH[Math.floor(Math.random() * CHAT_TEMPLATES_HIGH.length)];
          addChatMessage({
            user: maskUsername('paul_kenya'),
            color: 'yellow',
            text: randMsg,
            badge: 'vip'
          });
        }

        if (!hasSuperHighChatTriggered && currentM >= 10.0) {
          hasSuperHighChatTriggered = true;
          addChatMessage({
            user: maskUsername('otieno_ace'),
            color: 'orange',
            text: `🔥 MEGA ROUND! ${currentM.toFixed(2)}x AND STILL CLIMBING!! 🚀🚀`,
            badge: 'high_roller'
          });
        }

        // 5. Crash detection
        if (currentM >= targetCrash) {
          clearInterval(chatIntervalId);
          sounds.playCrash();
          setPhase('CRASHED');
          setMultiplier(targetCrash);

          // Mark remaining uncashed bets as crashed
          setBotBets((prev) =>
            prev.map((b) => (b.status === 'active' ? { ...b, status: 'crashed' } : b))
          );

          // Add to multiplier history
          const newHistoryItem: HistoryItem = {
            id: `hist-${Date.now()}`,
            multiplier: targetCrash,
            timestamp: Date.now(),
            colorClass: getMultiplierBadgeStyle(targetCrash)
          };
          setHistory((prev) => [newHistoryItem, ...prev.slice(0, 49)]);

          // Chat crash reaction
          setTimeout(() => {
            const randMsg = CHAT_TEMPLATES_CRASH[Math.floor(Math.random() * CHAT_TEMPLATES_CRASH.length)];
            const randBot = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
            addChatMessage({
              user: maskUsername(randBot),
              color: 'green',
              text: randMsg
            });
          }, 400);

          return;
        }

        animationFrameId = requestAnimationFrame(flightLoop);
      };

      animationFrameId = requestAnimationFrame(flightLoop);
    } else if (phase === 'CRASHED') {
      // Pause on crashed screen, then reset for next round
      crashTimeoutId = setTimeout(() => {
        setPanel1((prev) => ({
          ...prev,
          hasPlacedBet: prev.queuedForNextRound || prev.autoBetEnabled,
          queuedForNextRound: false,
          hasCashedOut: false,
          cashedOutMultiplier: null,
          winAmount: null
        }));
        setPanel2((prev) => ({
          ...prev,
          hasPlacedBet: prev.queuedForNextRound || prev.autoBetEnabled,
          queuedForNextRound: false,
          hasCashedOut: false,
          cashedOutMultiplier: null,
          winAmount: null
        }));

        setPhase('WAITING');
      }, 3000);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(countdownInterval);
      clearTimeout(crashTimeoutId);
      clearInterval(chatIntervalId);
    };
  }, [phase, executeCashOut, addChatMessage]);

  // Construct active user bets list for display
  const activeUserBets: PlayerBet[] = [];
  if (panel1.hasPlacedBet) {
    activeUserBets.push({
      id: 'user-panel-1',
      username: `${userProfile.name || 'You'} (Box 1)`,
      avatar: 'U1',
      avatarUrl: userProfile.avatarUrl,
      amount: panel1.betAmount,
      cashoutMultiplier: panel1.cashedOutMultiplier || undefined,
      winAmount: panel1.winAmount || undefined,
      status: panel1.hasCashedOut ? 'cashed_out' : phase === 'CRASHED' ? 'crashed' : 'active',
      isUser: true
    });
  }
  if (panel2.hasPlacedBet) {
    activeUserBets.push({
      id: 'user-panel-2',
      username: `${userProfile.name || 'You'} (Box 2)`,
      avatar: 'U2',
      avatarUrl: userProfile.avatarUrl,
      amount: panel2.betAmount,
      cashoutMultiplier: panel2.cashedOutMultiplier || undefined,
      winAmount: panel2.winAmount || undefined,
      status: panel2.hasCashedOut ? 'cashed_out' : phase === 'CRASHED' ? 'crashed' : 'active',
      isUser: true
    });
  }

  return (
    <div className="flex flex-col min-h-screen w-screen overflow-x-hidden bg-[#0a0d14] text-white">
      {/* Top Header with Dynamic Online Counter and Account Switcher */}
      <Header
        history={history}
        balance={currentBalance}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onResetBalance={handleResetDemoBalance}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        onlineCount={onlineCount}
        accountMode={accountMode}
        onSwitchAccountMode={setAccountMode}
        profile={userProfile}
        onOpenProfile={() => {
          setProfileModalInitialTab('profile');
          setIsProfileModalOpen(true);
        }}
        onOpenDeposit={() => {
          setProfileModalInitialTab('deposit');
          setIsProfileModalOpen(true);
        }}
      />

      {/* Main Unified Arena */}
      <div className="flex-1 flex flex-col w-full max-w-[1440px] mx-auto overflow-y-auto">
        {/* 1. Main Game Flight Canvas */}
        <section className="w-full h-[300px] sm:h-[360px] md:h-[420px] shrink-0 relative">
          <CenterpieceGraph
            phase={phase}
            multiplier={multiplier}
            countdown={countdown}
            crashMultiplier={crashMultiplier}
            flightProgress={flightProgress}
            bettorCount={bettorCount}
            accountMode={accountMode}
            onToggleChat={() => setBottomTab((prev) => (prev === 'chat' ? 'bets' : 'chat'))}
          />
        </section>

        {/* 2. Dual Betting Panels (Side-by-side horizontally even on phones) */}
        <section className="p-2 sm:p-3 bg-[#0e121a] border-y border-[#1c2436] shrink-0">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-6xl mx-auto">
            <BettingPanel
              panelIndex={0}
              state={panel1}
              phase={phase}
              currentMultiplier={multiplier}
              balance={currentBalance}
              onUpdateState={(updates) => setPanel1((prev) => ({ ...prev, ...updates }))}
              onPlaceBet={handlePlaceBetPanel1}
              onCancelBet={handleCancelBetPanel1}
              onCashOut={handleCashOutPanel1}
            />
            <BettingPanel
              panelIndex={1}
              state={panel2}
              phase={phase}
              currentMultiplier={multiplier}
              balance={currentBalance}
              onUpdateState={(updates) => setPanel2((prev) => ({ ...prev, ...updates }))}
              onPlaceBet={handlePlaceBetPanel2}
              onCancelBet={handleCancelBetPanel2}
              onCashOut={handleCashOutPanel2}
            />
          </div>

          {/* Bottom High-Tech AI Predictor Bar (Accurate Signal Target) */}
          <div className="mt-2.5 max-w-6xl mx-auto flex items-center justify-between bg-gradient-to-r from-red-950/40 via-[#151c2a] to-red-950/40 border border-red-500/30 rounded-xl px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <span className="text-xs font-black tracking-wider text-red-400 uppercase font-mono-num flex items-center gap-1">
                  <Radar className="w-3.5 h-3.5 text-red-400" />
                  AI PREDICTOR RADAR
                </span>
                <span className="text-[11px] text-zinc-300">
                  Signal Target:{' '}
                  <span className="font-mono-num font-bold text-white bg-red-600/30 px-1.5 py-0.2 rounded border border-red-500/40">
                    {Math.max(1.1, Math.floor(crashMultiplier * 0.9 * 100) / 100).toFixed(2)}x
                  </span>
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsPredictorOpen(true)}
              className="px-3 py-1 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs shadow-md border border-red-400/40 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>OPEN RADAR</span>
            </button>
          </div>
        </section>

        {/* 3. Responsive Bets & Chats Section Placed Directly Below Betting Slots */}
        {/* Fits horizontally all way across in any setup: phones, laptops, tablets */}
        <section className="flex-1 flex flex-col bg-[#0b0e14] min-h-[360px] pb-10 w-full">
          {/* Sub-Tabs Switcher Bar */}
          <div className="flex items-center justify-between bg-[#111622] border-b border-[#1f2838] px-3 sm:px-6 py-2 sticky top-0 z-10 w-full">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBottomTab('bets')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  bottomTab === 'bets'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-[#18202e] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>All Bets ({bettorCount > 0 ? bettorCount : botBets.length})</span>
              </button>
              <button
                onClick={() => setBottomTab('chat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  bottomTab === 'chat'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-[#18202e] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Live Chat ({chatMessages.length})</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Multi-Player Feed</span>
            </div>
          </div>

          {/* Tab Content: Bets or Chat fitting horizontally all way across in any setup */}
          <div className="flex-1 w-full p-2 sm:p-3">
            {bottomTab === 'bets' ? (
              <div className="w-full bg-[#0f141f] border border-[#1e2638] rounded-2xl overflow-hidden shadow-lg h-[430px]">
                <BetsSidebar
                  bets={botBets.slice(0, Math.max(1, bettorCount || botBets.length))}
                  userBets={activeUserBets}
                  currentMultiplier={multiplier}
                />
              </div>
            ) : (
              <div className="w-full bg-[#0f141f] border border-[#1e2638] rounded-2xl overflow-hidden shadow-lg h-[430px]">
                <ChatSidebar
                  messages={chatMessages}
                  onSendMessage={handleUserSendMessage}
                />
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Modals */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      <HistoryModal
        isOpen={isHistoryModalOpen}
        history={history}
        onClose={() => setIsHistoryModalOpen(false)}
      />
      <PredictorModal
        isOpen={isPredictorOpen}
        onClose={() => setIsPredictorOpen(false)}
        phase={phase}
        currentMultiplier={multiplier}
        crashMultiplier={crashMultiplier}
        onApplyPrediction={handleApplyPrediction}
      />
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={userProfile}
        onUpdateProfile={handleUpdateProfile}
        accountMode={accountMode}
        onSwitchAccountMode={setAccountMode}
        realBalance={realBalance}
        demoBalance={demoBalance}
        onDeposit={handleDeposit}
        onWithdraw={handleWithdraw}
        initialTab={profileModalInitialTab}
      />
    </div>
  );
}
