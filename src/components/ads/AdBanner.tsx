/**
 * AdBanner
 *
 * Real Google AdSense display banner ads.
 * Uses test publisher ID (ca-pub-3940256099942544) — replace with your own
 * ca-pub-XXXXXXXXXXXXXXXX once your AdSense account is approved.
 *
 * Sizes follow IAB standard units; the `responsive` variant uses auto format.
 */

import React, { useEffect, useId, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSubscription } from '../../utils/SubscriptionContext';

// ── AdSense configuration ────────────────────────────────────────────────────
// Replace with your real publisher ID from https://adsense.google.com
const ADSENSE_CLIENT = 'ca-pub-4871365764888120';

// Standard Google AdSense test slot — works with the test publisher above
const AD_SLOT = '8625001603';
const AD_FLUID_SLOT = '1430027544';
const AD_IN_ARTICLE_SLOT = '6382971322';

// ── Types ────────────────────────────────────────────────────────────────────
export type AdBannerSize =
  | 'leaderboard'          // 728×90
  | 'medium-rectangle'     // 300×250
  | 'large-rectangle'      // 336×280
  | 'mobile-banner'        // 320×50
  | 'responsive'
  | 'fluid'
  | 'in-article';          // auto — fills container width

interface AdBannerProps {
  size?: AdBannerSize;
  className?: string;
  /** Kept for backward compatibility — currently unused */
  rewarded?: boolean;
}

// IAB size strings passed to AdSense
const adSizeMap: Record<AdBannerSize, { width: string; height: string; format: string }> = {
  leaderboard:         { width: '728', height: '90',  format: 'horizontal' },
  'medium-rectangle':  { width: '300', height: '250', format: 'rectangle' },
  'large-rectangle':   { width: '336', height: '280', format: 'rectangle' },
  'mobile-banner':     { width: '320', height: '50',  format: 'horizontal' },
  responsive:          { width: '',    height: '',     format: 'auto' },
  fluid:               { width: '',    height: '',     format: 'fluid' },
  'in-article':        { width: '',    height: '',     format: 'fluid' },
};

const AdBanner: React.FC<AdBannerProps> = ({ size = 'responsive', className = '' }) => {
  const adId = useId();
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const [blocked, setBlocked] = useState(false);
  const { subscriptionStatus } = useSubscription();
  const location = useLocation();

  const { width, height, format } = adSizeMap[size] ?? adSizeMap.responsive;
  const isResponsive = size === 'responsive' || size === 'fluid' || size === 'in-article';
  const slot = size === 'fluid' ? AD_FLUID_SLOT : size === 'in-article' ? AD_IN_ARTICLE_SLOT : AD_SLOT;

  useEffect(() => {
    if (pushed.current) return;
    if (subscriptionStatus?.hasActiveSubscription) return;
    if (typeof window === 'undefined') return;
    pushed.current = true;

    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      console.warn('[AdBanner] adsbygoogle.push failed:', e);
      setBlocked(true);
    }

    const timer = window.setTimeout(() => {
      const status = insRef.current?.getAttribute('data-ad-status');
      const height = insRef.current?.clientHeight || 0;
      if (status === 'unfilled' || height === 0) {
        setBlocked(true);
      }
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [subscriptionStatus, location.pathname, adId]);

  // Pro users see no ads and no reserved space
  if (subscriptionStatus?.hasActiveSubscription) {
    return null;
  }

  return (
    <div
      className={`overflow-hidden text-center ${className}`}
      style={isResponsive ? { display: 'block' } : { width: Number(width), maxWidth: '100%', margin: '0 auto' }}
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={
          isResponsive
            ? { display: 'block', textAlign: size === 'in-article' ? 'center' : undefined }
            : { display: 'inline-block', width, height }
        }
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-ad-layout={size === 'in-article' ? 'in-article' : undefined}
        data-ad-layout-key={size === 'fluid' ? '-fb+5w+4e-db+86' : undefined}
        data-full-width-responsive={size === 'responsive' ? 'true' : undefined}
      />
      {blocked && (
        <div className="rounded-xl border border-dashed border-gray-300/60 dark:border-white/10 px-4 py-3 text-xs text-gray-400 dark:text-gray-500">
          Advertisement
        </div>
      )}
    </div>
  );
};

export default AdBanner;

