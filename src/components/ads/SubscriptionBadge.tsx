/**
 * SubscriptionBadge
 *
 * Shows "Lite Mode (Free)" or "Pro Paid" badge based on subscription mode.
 */

import React from 'react';
import { useAdReward } from '../../utils/AdRewardContext';
import { useSubscription } from '../../utils/SubscriptionContext';

interface SubscriptionBadgeProps {
  className?: string;
}

const SubscriptionBadge: React.FC<SubscriptionBadgeProps> = ({ className = '' }) => {
  const { isLiteMode } = useAdReward();
  const { isProUser } = useSubscription();

  if (!isProUser && !isLiteMode) return null;

  if (isLiteMode) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 ${className}`}>
        <span>🆓</span> Lite Mode
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 border border-purple-500/50 text-purple-300 ${className}`}>
      <span>⭐</span> Pro Paid
    </span>
  );
};

export default SubscriptionBadge;
