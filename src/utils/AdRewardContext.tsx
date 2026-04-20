/**
 * AdRewardContext
 *
 * Manages web ad reward logic for Lite Mode:
 * - Tracks page navigations (every 5 navigations → show "Watch Ad" prompt)
 * - Tracks local ad-watch count (every 5 ad watches → call backend reward API)
 * - Exposes current coin balance, cooldown state, daily limits
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { subscriptionAPI, AdRewardConfig } from './subscriptionAPI';

// ─── Constants ────────────────────────────────────────────────────────────────
const NAV_PER_PROMPT = 5;   // show ad prompt after every N navigations
const ADS_PER_REWARD = 3;   // call API after every N ad watches → earn coins

const LS_NAV_COUNT = 'edusmart_nav_count';
const LS_AD_WATCH_COUNT = 'edusmart_ad_watch_count';
const LS_LAST_COOLDOWN_END = 'edusmart_ad_cooldown_end';
const LS_DAILY_DATE = 'edusmart_ad_daily_date';
const LS_DAILY_ADS_REMAINING = 'edusmart_ad_daily_remaining';
const LS_COINS = 'edusmart_coins';

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface AdRewardContextType {
  /** Whether to show the "Watch Ad" prompt (triggered after N navigations) */
  showAdPrompt: boolean;
  dismissAdPrompt: () => void;

  /** Current coin balance (local cached, synced with backend) */
  currentCoins: number;
  setCurrentCoins: (c: number) => void;

  /** Ad reward config from backend */
  adRewardConfig: AdRewardConfig | null;

  /** Seconds remaining in cooldown (0 = ready) */
  cooldownRemaining: number;

  /** How many individual ad watches remain today (from backend daily cap) */
  dailyAdsRemaining: number;

  /** Whether user is in lite mode */
  isLiteMode: boolean;
  setIsLiteMode: (v: boolean) => void;

  /**
   * Called when user has finished watching a simulated ad.
   * Increments local ad-watch count; calls API every ADS_PER_REWARD watches.
   */
  onAdWatched: () => Promise<{ coinsEarned: number; error?: string }>;

  /** How many more local ad watches before the API reward call */
  watchesUntilReward: number;

  /** Whether a reward API call is in flight */
  rewardPending: boolean;

  /** Last reward error message */
  rewardError: string | null;
}

const AdRewardContext = createContext<AdRewardContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AdRewardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  const location = useLocation();

  // Navigation counter
  const navCountRef = useRef<number>(parseInt(localStorage.getItem(LS_NAV_COUNT) || '0', 10));
  const [showAdPrompt, setShowAdPrompt] = useState(false);

  // Coin state
  const [currentCoins, setCurrentCoinsState] = useState<number>(
    parseInt(localStorage.getItem(LS_COINS) || '0', 10)
  );

  // Ad reward config from backend
  const [adRewardConfig, setAdRewardConfig] = useState<AdRewardConfig | null>(null);

  // Cooldown
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Daily limit (cached from last API response)
  const [dailyAdsRemaining, setDailyAdsRemaining] = useState<number>(
    parseInt(localStorage.getItem(LS_DAILY_ADS_REMAINING) || '10', 10)
  );

  // Local ad-watch batch counter
  const [localWatchCount, setLocalWatchCount] = useState<number>(
    parseInt(localStorage.getItem(LS_AD_WATCH_COUNT) || '0', 10)
  );

  // Lite mode flag
  const [isLiteMode, setIsLiteMode] = useState(false);

  // API in-flight
  const [rewardPending, setRewardPending] = useState(false);
  const [rewardError, setRewardError] = useState<string | null>(null);

  // ── Persist coins to localStorage whenever they change
  const setCurrentCoins = useCallback((c: number) => {
    setCurrentCoinsState(c);
    localStorage.setItem(LS_COINS, String(c));
  }, []);

  // ── Sync daily cap reset at midnight
  useEffect(() => {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem(LS_DAILY_DATE);
    if (savedDate !== today) {
      localStorage.setItem(LS_DAILY_DATE, today);
      localStorage.setItem(LS_DAILY_ADS_REMAINING, String(adRewardConfig?.dailyCapAds ?? 10));
      localStorage.setItem(LS_AD_WATCH_COUNT, '0');
      setDailyAdsRemaining(adRewardConfig?.dailyCapAds ?? 10);
      setLocalWatchCount(0);
    }
  }, [adRewardConfig]);

  // ── Track navigation; show prompt every NAV_PER_PROMPT navigations
  useEffect(() => {
    navCountRef.current += 1;
    localStorage.setItem(LS_NAV_COUNT, String(navCountRef.current));

    if (navCountRef.current % NAV_PER_PROMPT === 0 && isLiteMode && dailyAdsRemaining > 0) {
      setShowAdPrompt(true);
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Start / restore cooldown timer
  const startCooldown = useCallback((seconds: number) => {
    const endTime = Date.now() + seconds * 1000;
    localStorage.setItem(LS_LAST_COOLDOWN_END, String(endTime));

    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    cooldownTimerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setCooldownRemaining(remaining);
      if (remaining === 0 && cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
    }, 1000);
    setCooldownRemaining(seconds);
  }, []);

  // Restore cooldown on mount
  useEffect(() => {
    const savedEnd = parseInt(localStorage.getItem(LS_LAST_COOLDOWN_END) || '0', 10);
    if (savedEnd > Date.now()) {
      startCooldown(Math.ceil((savedEnd - Date.now()) / 1000));
    }
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, [startCooldown]);

  // ── Fetch subscription status to populate config
  useEffect(() => {
    if (!session) return;
    subscriptionAPI.getStatus(session).then((res) => {
      if (res.success && res.data) {
        if (res.data.adReward) setAdRewardConfig(res.data.adReward);
        if (typeof res.data.current_coins === 'number') setCurrentCoins(res.data.current_coins);
        setIsLiteMode(res.data.isLiteMode ?? res.data.mode === 'lite');
      }
    });
  }, [session, setCurrentCoins]);

  const dismissAdPrompt = useCallback(() => setShowAdPrompt(false), []);

  // ── Core: called after each simulated ad watch
  const onAdWatched = useCallback(async (): Promise<{ coinsEarned: number; error?: string }> => {
    if (cooldownRemaining > 0) {
      return { coinsEarned: 0, error: `Please wait ${cooldownRemaining}s before watching another ad.` };
    }
    if (dailyAdsRemaining <= 0) {
      return { coinsEarned: 0, error: 'Daily ad limit reached. Come back tomorrow!' };
    }

    const newLocalCount = localWatchCount + 1;
    setLocalWatchCount(newLocalCount);
    localStorage.setItem(LS_AD_WATCH_COUNT, String(newLocalCount));

    setDailyAdsRemaining((prev) => {
      const next = Math.max(0, prev - 1);
      localStorage.setItem(LS_DAILY_ADS_REMAINING, String(next));
      return next;
    });

    // Every ADS_PER_REWARD watches → call the backend
    if (newLocalCount % ADS_PER_REWARD === 0) {
      setRewardPending(true);
      setRewardError(null);

      const adEventId = `web_ad_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const result = await subscriptionAPI.rewardAd(adEventId, 'web_simulated', { batch: newLocalCount }, session);

      setRewardPending(false);

      if (result.status === 409) {
        setRewardError('Reward already claimed for this ad.');
        return { coinsEarned: 0, error: 'Reward already claimed.' };
      }
      if (result.status === 429) {
        const isCapError = result.error?.toLowerCase().includes('cap') || result.error?.toLowerCase().includes('limit');
        const msg = isCapError ? 'Daily limit reached.' : `Please wait before claiming again.`;
        setRewardError(msg);
        if (!isCapError && adRewardConfig?.cooldownSeconds) {
          startCooldown(adRewardConfig.cooldownSeconds);
        }
        return { coinsEarned: 0, error: msg };
      }
      if (!result.success) {
        setRewardError(result.error || 'Failed to claim reward. Please try again.');
        return { coinsEarned: 0, error: result.error || 'Failed to claim reward.' };
      }

      if (result.data) {
        const earned = result.data.coins_earned ?? (result.data.current_coins - currentCoins);
        setCurrentCoins(result.data.current_coins);
        if (result.data.daily_ads_remaining !== undefined) {
          setDailyAdsRemaining(result.data.daily_ads_remaining);
          localStorage.setItem(LS_DAILY_ADS_REMAINING, String(result.data.daily_ads_remaining));
        }
        if (adRewardConfig?.cooldownSeconds) startCooldown(adRewardConfig.cooldownSeconds);
        // Reset local batch counter after successful reward
        setLocalWatchCount(0);
        localStorage.setItem(LS_AD_WATCH_COUNT, '0');
        return { coinsEarned: earned > 0 ? earned : 1 };
      }
    }

    // Not yet at the batch threshold — no coins awarded yet
    return { coinsEarned: 0 };
  }, [cooldownRemaining, dailyAdsRemaining, localWatchCount, session, adRewardConfig, startCooldown, currentCoins, setCurrentCoins]);

  const watchesUntilReward = ADS_PER_REWARD - (localWatchCount % ADS_PER_REWARD);

  return (
    <AdRewardContext.Provider
      value={{
        showAdPrompt,
        dismissAdPrompt,
        currentCoins,
        setCurrentCoins,
        adRewardConfig,
        cooldownRemaining,
        dailyAdsRemaining,
        isLiteMode,
        setIsLiteMode,
        onAdWatched,
        watchesUntilReward,
        rewardPending,
        rewardError,
      }}
    >
      {children}
    </AdRewardContext.Provider>
  );
};

export const useAdReward = (): AdRewardContextType => {
  const ctx = useContext(AdRewardContext);
  if (!ctx) throw new Error('useAdReward must be used within AdRewardProvider');
  return ctx;
};
