/**
 * WatchAdModal
 *
 * Plays a real rewarded video ad using the Google IMA SDK (ima3.js).
 * Test ad tag is used by default. On ad completion, calls the reward API.
 *
 * SDK docs: https://developers.google.com/interactive-media-ads/docs/sdks/html5/client-side
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdReward } from '../../utils/AdRewardContext';
import { loadImaSDK } from '../../utils/imaLoader';

// ── Google IMA test VAST ad tag (non-skippable — user must watch the full ad)
const TEST_AD_TAG_URL =
  'https://pubads.g.doubleclick.net/gampad/ads' +
  '?iu=/21775744923/external/single_preroll' +
  '&sz=640x480&ciu_szs=300x250%2C728x90' +
  '&gdfp_req=1&output=vast&unviewed_position_start=1' +
  '&env=vp&impl=s&correlator=';

interface WatchAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after the full ad has played and reward (if any) has been processed */
  onComplete?: (coinsEarned: number) => void;
}

type Phase = 'ready' | 'loading' | 'playing' | 'done' | 'error';

const WatchAdModal: React.FC<WatchAdModalProps> = ({ isOpen, onClose, onComplete }) => {
  const {
    onAdWatched,
    rewardPending,
    adRewardConfig,
    watchesUntilReward,
    cooldownRemaining,
    dailyAdsRemaining,
  } = useAdReward();

  // ── DOM refs for IMA SDK
  const adContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const adsLoaderRef = useRef<any>(null);
  const adsManagerRef = useRef<any>(null);
  const adDisplayContainerRef = useRef<any>(null);
  const adCompletedRef = useRef(false);

  // ── UI state
  const [phase, setPhase] = useState<Phase>('ready');
  const [result, setResult] = useState<{ coinsEarned: number; error?: string } | null>(null);
  const [adError, setAdError] = useState<string | null>(null);

  // ── Teardown IMA objects
  const cleanup = useCallback(() => {
    try { adsManagerRef.current?.destroy(); } catch {}
    try { adsLoaderRef.current?.destroy(); } catch {}
    try { adDisplayContainerRef.current?.destroy(); } catch {}
    adsManagerRef.current = null;
    adsLoaderRef.current = null;
    adDisplayContainerRef.current = null;
  }, []);

  // Reset + cleanup on open/close
  useEffect(() => {
    if (isOpen) {
      adCompletedRef.current = false;
      setPhase('ready');
      setResult(null);
      setAdError(null);
    } else {
      cleanup();
    }
    return cleanup;
  }, [isOpen, cleanup]);

  // ── Fire reward after IMA signals the ad completed
  const handleAdComplete = useCallback(async () => {
    if (adCompletedRef.current) return; // guard double-fire
    adCompletedRef.current = true;
    setPhase('done');
    const res = await onAdWatched();
    setResult(res);
    if (onComplete) onComplete(res.coinsEarned);
  }, [onAdWatched, onComplete]);

  // ── Initialise IMA SDK and request/play the ad
  const startAd = useCallback(async () => {
    if (cooldownRemaining > 0 || dailyAdsRemaining <= 0) return;
    if (!adContainerRef.current || !videoRef.current) return;

    setPhase('loading');
    cleanup();
    adCompletedRef.current = false;

    let ima: any;
    try {
      ima = await loadImaSDK();
    } catch {
      setAdError('Ad SDK could not load. Please disable your ad blocker and refresh the page.');
      setPhase('error');
      return;
    }

    try {
      // 1. Create the ad display container (overlays on the video element)
      const adc = new ima.AdDisplayContainer(adContainerRef.current, videoRef.current);
      adc.initialize();
      adDisplayContainerRef.current = adc;

      // 2. Create the ads loader
      const loader = new ima.AdsLoader(adc);
      adsLoaderRef.current = loader;

      // 3. Handle load errors
      loader.addEventListener(
        ima.AdErrorEvent.Type.AD_ERROR,
        (e: any) => {
          console.error('[IMA] AdsLoader error:', e.getError().toString());
          setAdError('Ad failed to load. Please try again in a moment.');
          setPhase('error');
          cleanup();
        },
        false
      );

      // 4. Handle successful load → set up AdsManager
      loader.addEventListener(
        ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
        (loadedEvent: any) => {
          const renderSettings = new ima.AdsRenderingSettings();
          renderSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;

          const manager = loadedEvent.getAdsManager(videoRef.current, renderSettings);
          adsManagerRef.current = manager;

          // Ad error during playback
          manager.addEventListener(
            ima.AdErrorEvent.Type.AD_ERROR,
            (e: any) => {
              console.error('[IMA] AdsManager error:', e.getError().toString());
              setAdError('Ad playback error. Please try again.');
              setPhase('error');
              cleanup();
            },
            false
          );

          // Ad started playing
          manager.addEventListener(
            ima.AdEvent.Type.STARTED,
            () => setPhase('playing'),
            false
          );

          // Ad finished — primary completion event
          manager.addEventListener(
            ima.AdEvent.Type.COMPLETE,
            handleAdComplete,
            false
          );

          // All ads done (backup for when COMPLETE doesn't fire)
          manager.addEventListener(
            ima.AdEvent.Type.ALL_ADS_COMPLETED,
            handleAdComplete,
            false
          );

          try {
            const w = adContainerRef.current!.clientWidth || 640;
            const h = adContainerRef.current!.clientHeight || 360;
            manager.init(w, h, ima.ViewMode.NORMAL);
            manager.start();
          } catch (err) {
            console.error('[IMA] manager.start error:', err);
            setAdError('Could not start ad playback. Please try again.');
            setPhase('error');
            cleanup();
          }
        },
        false
      );

      // 5. Request the ad
      const req = new ima.AdsRequest();
      // Append random correlator so each request is unique
      req.adTagUrl = TEST_AD_TAG_URL + Math.floor(Math.random() * 1e9);
      req.linearAdSlotWidth = adContainerRef.current.clientWidth || 640;
      req.linearAdSlotHeight = adContainerRef.current.clientHeight || 360;
      req.nonLinearAdSlotWidth = adContainerRef.current.clientWidth || 640;
      req.nonLinearAdSlotHeight = 150;
      req.setAdWillAutoPlay(true);
      req.setAdWillPlayMuted(false);

      loader.requestAds(req);
    } catch (err) {
      console.error('[IMA] init error:', err);
      setAdError('Failed to initialise ad. Please try again.');
      setPhase('error');
      cleanup();
    }
  }, [cooldownRemaining, dailyAdsRemaining, cleanup, handleAdComplete]);

  if (!isOpen) return null;

  const coinsPerAd = adRewardConfig?.coinsPerAd ?? 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop — only closeable on ready/error/done */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={phase === 'ready' || phase === 'error' || phase === 'done' ? onClose : undefined}
          />

          <motion.div
            className="relative z-10 w-full max-w-xl mx-4 rounded-2xl overflow-hidden shadow-2xl"
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
          >

            {/* ── READY ─────────────────────────────────────────── */}
            {phase === 'ready' && (
              <div className="bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 p-6 text-white">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-yellow-400/20 flex items-center justify-center mx-auto mb-3">
                    <span className="text-3xl">🪙</span>
                  </div>
                  <h2 className="text-xl font-bold mb-1">Watch a Short Ad</h2>
                  <p className="text-gray-300 text-sm">
                    {watchesUntilReward} more ad{watchesUntilReward !== 1 ? 's' : ''} until you earn{' '}
                    <span className="text-yellow-400 font-semibold">{coinsPerAd} coin{coinsPerAd !== 1 ? 's' : ''}</span>
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {dailyAdsRemaining} ads remaining today
                  </p>
                </div>

                {cooldownRemaining > 0 ? (
                  <div className="bg-orange-500/20 border border-orange-500/40 rounded-xl p-4 text-center mb-4">
                    <p className="text-orange-300 text-sm font-medium">
                      ⏳ Cooldown: {cooldownRemaining}s remaining
                    </p>
                  </div>
                ) : dailyAdsRemaining <= 0 ? (
                  <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-4 text-center mb-4">
                    <p className="text-red-300 text-sm font-medium">Daily limit reached. Come back tomorrow!</p>
                  </div>
                ) : (
                  <button
                    onClick={startAd}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold text-base hover:opacity-90 transition-all"
                  >
                    ▶ Watch Ad
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Maybe later
                </button>
              </div>
            )}

            {/* ── LOADING ───────────────────────────────────────── */}
            {phase === 'loading' && (
              <div className="bg-black text-white p-8 text-center">
                <div className="w-10 h-10 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-300 text-sm">Loading ad…</p>
              </div>
            )}

            {/* ── PLAYING — IMA SDK renders inside adContainerRef ── */}
            {(phase === 'loading' || phase === 'playing') && (
              <div className={`bg-black ${phase === 'loading' ? 'hidden' : 'block'}`}>
                {/* IMA requires a real video element even for linear ads */}
                <video
                  ref={videoRef}
                  className="w-full"
                  style={{ display: 'none' }}
                  playsInline
                />
                {/* IMA SDK injects the ad player into this div */}
                <div
                  ref={adContainerRef}
                  className="relative w-full"
                  style={{ aspectRatio: '16/9', background: '#000' }}
                />
                <div className="bg-gray-950 px-4 py-2 text-center">
                  <p className="text-gray-500 text-xs">
                    Watch the full ad to earn your reward — please do not close this window
                  </p>
                </div>
              </div>
            )}

            {/* ── ERROR ─────────────────────────────────────────── */}
            {phase === 'error' && (
              <div className="bg-gradient-to-br from-gray-900 to-gray-950 p-6 text-white text-center">
                <div className="text-4xl mb-3">⚠️</div>
                <h3 className="text-lg font-bold mb-2">Ad Unavailable</h3>
                <p className="text-gray-400 text-sm mb-5">{adError}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setPhase('ready'); setAdError(null); }}
                    className="flex-1 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm transition-all"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* ── DONE ──────────────────────────────────────────── */}
            {phase === 'done' && (
              <div className="bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 p-6 text-white text-center">
                {rewardPending ? (
                  <div className="py-8">
                    <div className="w-10 h-10 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-300">Claiming reward…</p>
                  </div>
                ) : result?.error ? (
                  <>
                    <div className="text-4xl mb-3">⚠️</div>
                    <h3 className="text-lg font-bold mb-2">Could Not Claim Reward</h3>
                    <p className="text-gray-300 text-sm mb-4">{result.error}</p>
                    <button onClick={onClose} className="w-full py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-all">
                      Close
                    </button>
                  </>
                ) : result && result.coinsEarned > 0 ? (
                  <>
                    <motion.div
                      className="text-5xl mb-3"
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.3, 1] }}
                      transition={{ duration: 0.5 }}
                    >
                      🎉
                    </motion.div>
                    <h3 className="text-xl font-bold mb-1 text-yellow-400">
                      +{result.coinsEarned} Coin{result.coinsEarned !== 1 ? 's' : ''} Earned!
                    </h3>
                    <p className="text-gray-300 text-sm mb-4">
                      Keep watching ads to earn more coins for AI features.
                    </p>
                    <button
                      onClick={onClose}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold transition-all hover:opacity-90"
                    >
                      Awesome!
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-4xl mb-3">✅</div>
                    <h3 className="text-lg font-bold mb-1">Ad Watched!</h3>
                    <p className="text-gray-300 text-sm mb-1">
                      {watchesUntilReward} more ad{watchesUntilReward !== 1 ? 's' : ''} until you earn{' '}
                      <span className="text-yellow-400 font-semibold">{coinsPerAd} coin{coinsPerAd !== 1 ? 's' : ''}</span>.
                    </p>
                    <p className="text-gray-500 text-xs mb-4">Progress saved</p>
                    <button
                      onClick={onClose}
                      className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all"
                    >
                      Continue
                    </button>
                  </>
                )}
              </div>
            )}

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WatchAdModal;

