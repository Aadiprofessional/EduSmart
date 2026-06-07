/**
 * CoinPanel
 *
 * Displays current coin balance, Watch Ad CTA, cooldown timer,
 * daily remaining count, and an upgrade-to-paid button.
 * Shown whenever the user is in Lite Mode.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAdReward } from '../../utils/AdRewardContext';
import WatchAdModal from './WatchAdModal';

interface CoinPanelProps {
  /** 'sidebar' → compact vertical panel; 'inline' → horizontal strip */
  variant?: 'sidebar' | 'inline';
  onUpgradeClick?: () => void;
}

const CoinPanel: React.FC<CoinPanelProps> = ({ variant = 'sidebar', onUpgradeClick }) => {
  const {
    currentCoins,
    cooldownRemaining,
    dailyAdsRemaining,
    adRewardConfig,
    watchesUntilReward,
    isLiteMode,
  } = useAdReward();

  const [modalOpen, setModalOpen] = useState(false);
  const [lastEarned, setLastEarned] = useState<number | null>(null);

  if (!isLiteMode) return null;

  const coinsPerAd = adRewardConfig?.coinsPerAd ?? 1;
  const canWatch = cooldownRemaining === 0 && dailyAdsRemaining > 0;
  const displayCoins = Math.min(Math.max(currentCoins, 0), 9999);

  // ── Sidebar variant ─────────────────────────────────────────────────────────
  if (variant === 'sidebar') {
    return (
      <>
        <div className="rounded-xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-orange-500/5 p-3 space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-yellow-400 text-xs font-semibold uppercase tracking-wide">Coins</span>
            <div className="flex items-center gap-1">
              <span className="text-lg">🪙</span>
              <span className="text-white font-bold text-base tabular-nums min-w-[4ch] text-right">{displayCoins}</span>
            </div>
          </div>

          {/* Progress to next coin */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Ads watched</span>
              <span>{3 - watchesUntilReward}/{3}</span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-500"
                style={{ width: `${((3 - watchesUntilReward) / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* CTA */}
          {canWatch ? (
            <button
              onClick={() => { setLastEarned(null); setModalOpen(true); }}
              className="w-full py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold text-xs hover:from-yellow-300 hover:to-orange-300 transition-all"
            >
              ▶ Watch Ad, Earn {coinsPerAd} Coin{coinsPerAd !== 1 ? 's' : ''}
            </button>
          ) : cooldownRemaining > 0 ? (
            <div className="text-center text-orange-300 text-xs font-medium py-1">
              ⏳ Cooldown: {cooldownRemaining}s
            </div>
          ) : (
            <div className="text-center text-red-400 text-xs font-medium py-1">
              Daily limit reached
            </div>
          )}

          {/* Daily remaining */}
          <p className="text-gray-500 text-xs text-center">{dailyAdsRemaining} ads remaining today</p>

          {/* Last earned flash */}
          {lastEarned !== null && lastEarned > 0 && (
            <motion.div
              className="text-center text-yellow-400 text-xs font-bold"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ delay: 2, duration: 1 }}
              onAnimationComplete={() => setLastEarned(null)}
            >
              +{lastEarned} coin{lastEarned !== 1 ? 's' : ''} earned! 🎉
            </motion.div>
          )}

          {/* Upgrade nudge */}
          <button
            onClick={onUpgradeClick}
            className="w-full py-1.5 rounded-lg border border-purple-500/50 text-purple-300 text-xs hover:bg-purple-500/20 transition-all"
          >
            ↑ Upgrade to Paid Pro
          </button>
        </div>

        <WatchAdModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onComplete={(earned) => { setLastEarned(earned); setModalOpen(false); }}
        />
      </>
    );
  }

  // ── Inline variant ──────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex items-center gap-3 px-4 py-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">🪙</span>
          <span className="text-white font-bold tabular-nums">{displayCoins} coins</span>
        </div>
        <div className="h-4 w-px bg-gray-600" />
        {canWatch ? (
          <button
            onClick={() => { setLastEarned(null); setModalOpen(true); }}
            className="px-3 py-1 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold text-xs hover:opacity-90 transition-all"
          >
            ▶ Watch Ad +{coinsPerAd} coin{coinsPerAd !== 1 ? 's' : ''}
          </button>
        ) : cooldownRemaining > 0 ? (
          <span className="text-orange-300 text-xs">⏳ {cooldownRemaining}s</span>
        ) : (
          <span className="text-red-400 text-xs">Daily limit reached</span>
        )}
        <span className="text-gray-400 text-xs hidden sm:block">{dailyAdsRemaining} left today</span>
        {lastEarned !== null && lastEarned > 0 && (
          <motion.span
            className="text-yellow-400 text-xs font-bold"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ delay: 2, duration: 1 }}
            onAnimationComplete={() => setLastEarned(null)}
          >
            +{lastEarned}🪙
          </motion.span>
        )}
      </div>

      <WatchAdModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onComplete={(earned) => { setLastEarned(earned); setModalOpen(false); }}
      />
    </>
  );
};

export default CoinPanel;
