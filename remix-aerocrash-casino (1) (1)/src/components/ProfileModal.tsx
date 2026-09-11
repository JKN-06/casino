import React, { useState } from 'react';
import {
  X,
  User,
  Smartphone,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { AccountMode, UserProfile } from '../types';
import { formatKSh } from '../utils/mockData';
import { FACE_AVATARS } from '../utils/avatars';
import { FaceAvatar } from './FaceAvatar';
import { sounds } from '../utils/audio';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  accountMode: AccountMode;
  onSwitchAccountMode: (mode: AccountMode) => void;
  realBalance: number;
  demoBalance: number;
  onDeposit: (amount: number, phone: string) => Promise<boolean>;
  onWithdraw: (amount: number, phone: string) => Promise<boolean>;
  initialTab?: 'profile' | 'deposit' | 'withdraw';
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  accountMode,
  onSwitchAccountMode,
  realBalance,
  demoBalance,
  onDeposit,
  onWithdraw,
  initialTab = 'profile'
}) => {
  const [tab, setTab] = useState<'profile' | 'deposit' | 'withdraw'>(initialTab);

  // Profile Form state
  const [nameInput, setNameInput] = useState(profile.name);
  const [phoneInput, setPhoneInput] = useState(profile.phone);
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatarUrl);
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);

  // Deposit Form state
  const [depositAmount, setDepositAmount] = useState<number>(500);
  const [depositPhone, setDepositPhone] = useState(profile.phone || '0712345678');
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositSuccessMsg, setDepositSuccessMsg] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);

  // Safaricom M-Pesa STK Push PIN Prompt Modal State
  const [showMpesaPrompt, setShowMpesaPrompt] = useState(false);
  const [mpesaPin, setMpesaPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isProcessingPrompt, setIsProcessingPrompt] = useState(false);

  // Withdraw Form state
  const [withdrawAmount, setWithdrawAmount] = useState<number>(1000);
  const [withdrawPhone, setWithdrawPhone] = useState(profile.phone || '0712345678');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // Reset tab when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setNameInput(profile.name);
      setPhoneInput(profile.phone);
      setSelectedAvatar(profile.avatarUrl);
      setDepositPhone(profile.phone || '0712345678');
      setWithdrawPhone(profile.phone || '0712345678');
      setDepositError(null);
      setDepositSuccessMsg(null);
      setWithdrawError(null);
      setWithdrawSuccessMsg(null);
    }
  }, [isOpen, initialTab, profile]);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;

    onUpdateProfile({
      name: nameInput.trim() || 'Aviator Player',
      phone: phoneInput.trim(),
      avatarUrl: selectedAvatar,
      isRegistered: true
    });
    setProfileSavedMsg(true);
    setTimeout(() => setProfileSavedMsg(false), 2500);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDepositError(null);
    setDepositSuccessMsg(null);

    // Minimum deposit requirement: not less than KSh 100
    if (depositAmount < 100) {
      setDepositError('Minimum deposit amount is KSh 100.00');
      return;
    }

    if (!depositPhone.trim() || depositPhone.trim().length < 9) {
      setDepositError('Please enter a valid Kenyan Safaricom M-Pesa number');
      return;
    }

    // Open the authentic Safaricom M-PESA STK Push PIN prompt dialog
    setMpesaPin('');
    setPinError(null);
    setShowMpesaPrompt(true);
  };

  const handleConfirmMpesaPin = async () => {
    if (mpesaPin.length < 4) {
      setPinError('Please enter your 4-digit M-Pesa secret PIN');
      return;
    }

    setIsProcessingPrompt(true);
    setPinError(null);

    // Simulate authentic Safaricom USSD / Daraja network authorization
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const success = await onDeposit(depositAmount, depositPhone);
    setIsProcessingPrompt(false);

    if (success) {
      sounds.playCashout();
      setShowMpesaPrompt(false);
      setDepositSuccessMsg(
        `Confirmed! KSh ${depositAmount.toLocaleString()} deposited via M-Pesa to AVIATOR. Funds reflected on your Real Balance.`
      );
      // Switch automatically to real account if in demo
      if (accountMode === 'demo') {
        onSwitchAccountMode('real');
      }
    } else {
      setPinError('Transaction failed or timed out. Please check PIN and try again.');
    }
  };

  const handleCancelMpesaPrompt = () => {
    setShowMpesaPrompt(false);
    setDepositError('M-Pesa deposit prompt was cancelled.');
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    setWithdrawSuccessMsg(null);

    // Minimum withdrawal requirement: not less than KSh 1,000
    if (withdrawAmount < 1000) {
      setWithdrawError('Minimum withdrawal amount is KSh 1,000.00');
      return;
    }

    if (accountMode !== 'real') {
      setWithdrawError('Withdrawals are only allowed from your Real M-Pesa Account. Please switch to Real Account.');
      return;
    }

    if (realBalance < withdrawAmount) {
      setWithdrawError(`Insufficient funds in Real Account. Available: ${formatKSh(realBalance)}`);
      return;
    }

    if (!withdrawPhone.trim() || withdrawPhone.trim().length < 9) {
      setWithdrawError('Please enter a valid M-Pesa number to receive payout');
      return;
    }

    setIsWithdrawing(true);
    const success = await onWithdraw(withdrawAmount, withdrawPhone);
    setIsWithdrawing(false);

    if (success) {
      sounds.playCashout();
      const ref = `SH${Math.floor(10000000 + Math.random() * 90000000)}KES`;
      setWithdrawSuccessMsg(`Withdrawal Confirmed! Ref: ${ref}. KSh ${withdrawAmount.toLocaleString()} sent to ${withdrawPhone}.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 select-none animate-in fade-in duration-200">
      <div className="bg-[#0f141f] border border-[#232f45] rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#232f45] bg-[#141b29] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaceAvatar src={profile.avatarUrl} name={profile.name} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base">
                  {profile.name || 'My Account'}
                </h3>
                {profile.isRegistered && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>M-PESA VERIFIED</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 font-mono-num">
                {profile.phone ? `M-Pesa: ${profile.phone}` : 'No phone linked'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Account Mode Switcher Banner */}
        <div className="p-3 bg-[#0a0d14] border-b border-[#1c2536] flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="text-xs text-zinc-400">
            Current Active Wallet:
            <span className={`ml-1.5 font-bold uppercase tracking-wider ${accountMode === 'real' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {accountMode === 'real' ? 'Real Money (KES)' : 'Demo Fun Mode'}
            </span>
          </div>
          <div className="flex items-center p-0.5 bg-[#141b29] border border-[#232f45] rounded-full">
            <button
              onClick={() => onSwitchAccountMode('real')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                accountMode === 'real'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Real Account</span>
              <span className="text-[10px] font-mono-num opacity-90">({formatKSh(realBalance)})</span>
            </button>
            <button
              onClick={() => onSwitchAccountMode('demo')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                accountMode === 'demo'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Demo</span>
              <span className="text-[10px] font-mono-num opacity-90">({formatKSh(demoBalance)})</span>
            </button>
          </div>
        </div>

        {/* Tabs: Profile / Deposit / Withdraw */}
        <div className="flex border-b border-[#1f2a3d] bg-[#121824] px-4 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setTab('deposit')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              tab === 'deposit'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
            <span>Deposit (M-Pesa)</span>
          </button>
          <button
            onClick={() => setTab('withdraw')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              tab === 'withdraw'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4 text-red-400" />
            <span>Withdraw (M-Pesa)</span>
          </button>
          <button
            onClick={() => setTab('profile')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              tab === 'profile'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile & Avatars</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 1: DEPOSIT */}
          {tab === 'deposit' && (
            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div className="bg-[#0b0f17] border border-[#1f283a] rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    M-Pesa Instant Deposit (STK Push)
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                    Min KSh 100
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Enter amount and Safaricom phone number. A secure PIN prompt will appear on your phone instantly.
                </p>
              </div>

              {depositSuccessMsg && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{depositSuccessMsg}</span>
                </div>
              )}

              {depositError && (
                <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{depositError}</span>
                </div>
              )}

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Amount to Deposit (KES)
                </label>
                <div className="flex items-center bg-[#151c2a] border border-[#27354d] rounded-xl px-3 py-2">
                  <span className="text-zinc-400 font-bold text-sm mr-2">KES</span>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-transparent font-mono-num font-bold text-lg text-white focus:outline-none"
                    placeholder="100"
                    required
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Funds to be deposited not less than 100 KES</p>
              </div>

              {/* Quick Amount Chips */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[100, 250, 500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt)}
                    className={`py-1.5 rounded-lg text-xs font-mono-num font-bold transition-all ${
                      depositAmount === amt
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-[#182130] hover:bg-[#202c40] text-zinc-300'
                    }`}
                  >
                    +{amt}
                  </button>
                ))}
              </div>

              {/* M-Pesa Phone Number */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  M-Pesa Safaricom Mobile Number
                </label>
                <div className="flex items-center bg-[#151c2a] border border-[#27354d] rounded-xl px-3 py-2">
                  <Smartphone className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={depositPhone}
                    onChange={(e) => setDepositPhone(e.target.value)}
                    placeholder="e.g. 0712345678 or 2547..."
                    className="w-full bg-transparent font-mono-num text-sm text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isDepositing || depositAmount < 100}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-extrabold text-sm shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowDownCircle className="w-4 h-4" />
                <span>Confirm & Send M-Pesa Prompt (KSh {depositAmount.toLocaleString()})</span>
              </button>
            </form>
          )}

          {/* TAB 2: WITHDRAW */}
          {tab === 'withdraw' && (
            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div className="bg-[#0b0f17] border border-[#1f283a] rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-red-400" />
                    M-Pesa Instant Payout
                  </span>
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                    Min KSh 1,000
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mt-2">
                  <span className="text-zinc-400">Real Account Available:</span>
                  <span className="text-emerald-400 font-mono-num font-bold text-sm">
                    {formatKSh(realBalance)}
                  </span>
                </div>
              </div>

              {withdrawSuccessMsg && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{withdrawSuccessMsg}</span>
                </div>
              )}

              {withdrawError && (
                <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{withdrawError}</span>
                </div>
              )}

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Amount to Withdraw (KES)
                </label>
                <div className="flex items-center bg-[#151c2a] border border-[#27354d] rounded-xl px-3 py-2">
                  <span className="text-zinc-400 font-bold text-sm mr-2">KES</span>
                  <input
                    type="number"
                    min="1000"
                    step="100"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-transparent font-mono-num font-bold text-lg text-white focus:outline-none"
                    placeholder="1000"
                    required
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Funds to be withdrawn not less than 1,000 KES</p>
              </div>

              {/* Quick Amount Chips */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {[1000, 2000, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setWithdrawAmount(amt)}
                    className={`py-1.5 rounded-lg text-xs font-mono-num font-bold transition-all ${
                      withdrawAmount === amt
                        ? 'bg-red-600 text-white shadow'
                        : 'bg-[#182130] hover:bg-[#202c40] text-zinc-300'
                    }`}
                  >
                    {amt.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Destination M-Pesa Phone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Recipient M-Pesa Number
                </label>
                <div className="flex items-center bg-[#151c2a] border border-[#27354d] rounded-xl px-3 py-2">
                  <Smartphone className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={withdrawPhone}
                    onChange={(e) => setWithdrawPhone(e.target.value)}
                    placeholder="0712345678"
                    className="w-full bg-transparent font-mono-num text-sm text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isWithdrawing || withdrawAmount < 1000 || realBalance < withdrawAmount}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-40 text-white font-extrabold text-sm shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isWithdrawing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing M-Pesa Payout...</span>
                  </>
                ) : (
                  <>
                    <ArrowUpCircle className="w-4 h-4" />
                    <span>Withdraw KSh {withdrawAmount.toLocaleString()} to M-Pesa</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: PROFILE & AVATAR SELECTION */}
          {tab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {profileSavedMsg && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Profile and M-Pesa registration updated successfully!</span>
                </div>
              )}

              {/* Avatar Picker Section */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2 flex items-center justify-between">
                  <span>Choose Profile Picture (Face Avatar)</span>
                  <span className="text-[10px] text-zinc-500">Pick any portrait</span>
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-8 gap-2.5 bg-[#0b0f17] p-3 rounded-xl border border-[#1e2738]">
                  {FACE_AVATARS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedAvatar(url)}
                      className={`relative rounded-full p-0.5 transition-all transform hover:scale-110 active:scale-95 cursor-pointer ${
                        selectedAvatar === url
                          ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#0b0f17] scale-105'
                          : 'opacity-75 hover:opacity-100'
                      }`}
                    >
                      <FaceAvatar src={url} name={`Avatar ${i}`} size="md" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Display Name
                </label>
                <div className="flex items-center bg-[#151c2a] border border-[#27354d] rounded-xl px-3 py-2">
                  <User className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="e.g. Brian Otieno"
                    className="w-full bg-transparent text-sm text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* M-Pesa Phone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Registered M-Pesa Number
                </label>
                <div className="flex items-center bg-[#151c2a] border border-[#27354d] rounded-xl px-3 py-2">
                  <Smartphone className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="0712345678"
                    className="w-full bg-transparent font-mono-num text-sm text-white focus:outline-none"
                    required
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Used automatically for all M-Pesa deposits and payouts</p>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Save Profile & Register M-Pesa</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#1f2a3d] bg-[#0c1018] flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Safaricom M-Pesa Secured</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#182130] hover:bg-[#202c40] text-zinc-300 hover:text-white rounded-lg transition-colors font-medium text-xs"
          >
            Close
          </button>
        </div>

        {/* Safaricom M-Pesa SIM Toolkit STK Push Prompt Popup */}
        {showMpesaPrompt && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#0d141e] border-2 border-emerald-500 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
              {/* Safaricom Green Header Bar */}
              <div className="bg-[#00a651] px-4 py-3 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-white" />
                  <div>
                    <h4 className="font-extrabold text-sm tracking-wider uppercase">Safaricom M-PESA</h4>
                    <p className="text-[10px] text-emerald-100 font-medium">SIM Toolkit STK Push Prompt</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCancelMpesaPrompt}
                  className="text-white hover:text-red-200 text-xs font-bold px-2 py-1 bg-black/20 rounded cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* STK Push Body */}
              <div className="p-4 space-y-3">
                <div className="bg-[#141d2b] border border-[#233247] rounded-xl p-3 text-center">
                  <p className="text-xs text-zinc-300 font-medium leading-relaxed">
                    Do you want to pay <span className="text-emerald-400 font-mono-num font-bold">KSh {depositAmount.toLocaleString()}</span> to <strong className="text-white">AVIATOR GLOBAL (Paybill 290029)</strong> from <span className="text-zinc-200 font-mono-num font-semibold">{depositPhone}</span>?
                  </p>
                  <p className="text-[11px] text-emerald-400 mt-2 font-bold uppercase tracking-wider">
                    Enter M-PESA Secret PIN:
                  </p>
                </div>

                {/* 4-digit PIN Masked Display */}
                <div className="flex justify-center gap-2.5 my-2">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center font-mono-num font-black text-2xl transition-all ${
                        mpesaPin.length > idx
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                          : idx === mpesaPin.length
                          ? 'border-emerald-400 animate-pulse bg-[#162132]'
                          : 'border-zinc-700 bg-[#121926] text-zinc-600'
                      }`}
                    >
                      {mpesaPin.length > idx ? '•' : ''}
                    </div>
                  ))}
                </div>

                {pinError && (
                  <p className="text-xs text-red-400 text-center font-semibold">
                    {pinError}
                  </p>
                )}

                {/* Numeric Dial Pad */}
                <div className="grid grid-cols-3 gap-1.5 max-w-[240px] mx-auto">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      type="button"
                      disabled={isProcessingPrompt}
                      onClick={() => {
                        if (mpesaPin.length < 4) {
                          setMpesaPin((prev) => prev + num);
                          setPinError(null);
                        }
                      }}
                      className="py-2.5 rounded-xl bg-[#1b2535] hover:bg-[#253349] active:bg-emerald-600 text-white font-mono-num font-bold text-lg transition-all shadow cursor-pointer"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={isProcessingPrompt}
                    onClick={() => setMpesaPin('')}
                    className="py-2.5 rounded-xl bg-[#1a2230] hover:bg-zinc-700 text-zinc-400 font-bold text-xs transition-all cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    disabled={isProcessingPrompt}
                    onClick={() => {
                      if (mpesaPin.length < 4) {
                        setMpesaPin((prev) => prev + '0');
                        setPinError(null);
                      }
                    }}
                    className="py-2.5 rounded-xl bg-[#1b2535] hover:bg-[#253349] active:bg-emerald-600 text-white font-mono-num font-bold text-lg transition-all shadow cursor-pointer"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    disabled={isProcessingPrompt}
                    onClick={() => setMpesaPin((prev) => prev.slice(0, -1))}
                    className="py-2.5 rounded-xl bg-[#1a2230] hover:bg-zinc-700 text-zinc-400 font-bold text-sm transition-all cursor-pointer"
                  >
                    ⌫
                  </button>
                </div>

                {/* Confirm Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    disabled={isProcessingPrompt}
                    onClick={handleCancelMpesaPrompt}
                    className="flex-1 py-2.5 rounded-xl bg-[#1e2738] hover:bg-[#28354c] text-zinc-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isProcessingPrompt || mpesaPin.length < 4}
                    onClick={handleConfirmMpesaPin}
                    className="flex-1 py-2.5 rounded-xl bg-[#00a651] hover:bg-[#009247] disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isProcessingPrompt ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <span>Send PIN</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
