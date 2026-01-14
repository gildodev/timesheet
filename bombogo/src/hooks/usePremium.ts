/**
 * Premium hook
 * Manages premium status
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function usePremium() {
  const { user, refreshUser } = useAuth();
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    setIsPremium(user?.isPremium || false);
  }, [user]);

  const activatePremium = () => {
    localStorage.setItem('timeflow_premium', 'true');
    setIsPremium(true);
    refreshUser();
  };

  const deactivatePremium = () => {
    localStorage.setItem('timeflow_premium', 'false');
    setIsPremium(false);
    refreshUser();
  };

  return {
    isPremium,
    activatePremium,
    deactivatePremium,
  };
}
