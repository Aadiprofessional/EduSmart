/**
 * AdPromptToast
 *
 * Floating toast that appears after every 5 page navigations
 * (only in Lite Mode) to invite the user to watch an ad.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdReward } from '../../utils/AdRewardContext';
import WatchAdModal from './WatchAdModal';

const AdPromptToast: React.FC = () => {
  const { showAdPrompt, dismissAdPrompt, isLiteMode, currentCoins, dailyAdsRemaining, watchesUntilReward } = useAdReward();
  const [modalOpen, setModalOpen] = useState(false);

  if (!isLiteMode) return null;

  return (
    <>
      <AnimatePresence>
        {showAdPrompt && !modalOpen && (
          <motion.div
            className="fixed bottom-6 right-6 z-[990] max-w-[320px] w-full"
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="rounded-2xl border border-yellow-500/40 bg-gradient-to-br from-gray-900/95 to-purple-950/95 backdrop-blur-md shadow-2xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">🪙</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm leading-tight">
                    Earn coins — watch a short ad!
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {watchesUntilReward} more ad{watchesUntilReward !== 1 ? 's' : ''} until next reward •{' '}
                    {dailyAdsRemaining} left today
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-yellow-400 text-xs">🪙 {currentCoins} coins</span>
                  </div>
                </div>
                <button
                  onClick={dismissAdPrompt}
                  className="text-gray-500 hover:text-white flex-shrink-0 mt-0.5 text-lg leading-none"
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { setModalOpen(true); dismissAdPrompt(); }}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold text-xs hover:opacity-90 transition-all"
                >
                  ▶ Watch Ad
                </button>
                <button
                  onClick={dismissAdPrompt}
                  className="px-3 py-2 rounded-lg border border-gray-600 text-gray-400 text-xs hover:bg-gray-800 transition-all"
                >
                  Skip
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <WatchAdModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};

export default AdPromptToast;
