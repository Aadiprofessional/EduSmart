/**
 * AdBanner
 *
 * Real Google AdSense display banner ads.
 * Uses test publisher ID (ca-pub-3940256099942544) — replace with your own
 * ca-pub-XXXXXXXXXXXXXXXX once your AdSense account is approved.
 *
 * Sizes follow IAB standard units; the `responsive` variant uses auto format.
 */

import React, { useEffect, useRef } from 'react';
import { useSubscription } from '../../utils/SubscriptionContext';

// ── AdSense configuration ────────────────────────────────────────────────────
// Replace with your real publisher ID from https://adsense.google.com
const ADSENSE_CLIENT = 'ca-pub-3940256099942544';

// Standard Google AdSense test slot — works with the test publisher above
const AD_SLOT = '6300978111';

// ── Types ────────────────────────────────────────────────────────────────────
export type AdBannerSize =
  | 'leaderboard'          // 728×90
  | 'medium-rectangle'     // 300×250
  | 'large-rectangle'      // 336×280
  | 'mobile-banner'        // 320×50
  | 'responsive';          // auto — fills container width

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
};

const AdBanner: React.FC<AdBannerProps> = ({ size = 'responsive', className = '' }) => {
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const { subscriptionStatus } = useSubscription();

  const { width, height, format } = adSizeMap[size] ?? adSizeMap.responsive;
  const isResponsive = size === 'responsive';

  useEffect(() => {
    if (pushed.current) return;
    if (subscriptionStatus?.hasActiveSubscription) return;
    pushed.current = true;

    try {
      // Push the ad request to AdSense
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      console.warn('[AdBanner] adsbygoogle.push failed:', e);
    }
  }, [subscriptionStatus]);

  // Pro users see no ads and no reserved space
  if (subscriptionStatus?.hasActiveSubscription) {
    return null;
  }

  return (
    <div
      className={`overflow-hidden text-center ${className}`}
      style={isResponsive ? { minHeight: 90, display: 'block' } : { width: Number(width), maxWidth: '100%', margin: '0 auto' }}
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={
          isResponsive
            ? { display: 'block', minHeight: 90 }
            : { display: 'inline-block', width, height }
        }
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={AD_SLOT}
        data-ad-format={format}
        data-full-width-responsive={isResponsive ? 'true' : undefined}
        data-adtest="on"  // Remove this line once your AdSense account is approved
      />
    </div>
  );
};

export default AdBanner;

