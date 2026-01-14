/**
 * Premium Badge component
 * Displays premium status indicator
 */

import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PremiumBadge({ className, size = 'md' }: PremiumBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <span
      className={cn(
        'premium-badge inline-flex items-center gap-1.5 rounded-full font-semibold premium-glow',
        sizeClasses[size],
        className
      )}
    >
      <Crown size={iconSizes[size]} />
      Premium
    </span>
  );
}
