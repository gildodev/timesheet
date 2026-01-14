/**
 * Timer hook
 * Manages active timer state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { TimeEntry } from '@/types';
import { timeEntryStorage } from '@/lib/storage';

export function useTimer() {
  const [runningEntry, setRunningEntry] = useState<TimeEntry | null>(null);
  const [currentDuration, setCurrentDuration] = useState(0);

  // Load running entry on mount
  useEffect(() => {
    const loadRunningEntry = async () => {
      const entry = await timeEntryStorage.getRunningEntry();
      setRunningEntry(entry || null);
    };
    loadRunningEntry();
  }, []);

  // Update duration every second if timer is running
  useEffect(() => {
    if (!runningEntry) {
      setCurrentDuration(0);
      return;
    }

    const updateDuration = () => {
      const duration = timeEntryStorage.getCurrentDuration(runningEntry);
      setCurrentDuration(duration);
    };

    updateDuration(); // Initial update
    const interval = setInterval(updateDuration, 1000);

    return () => clearInterval(interval);
  }, [runningEntry]);

  /**
   * Start a new timer
   */
  const startTimer = useCallback(async (title: string, projectId: string, taskId?: string, tags: string[] = []) => {
    const entry = await timeEntryStorage.startTimer(title, projectId, taskId, tags);
    setRunningEntry(entry);
    return entry;
  }, []);

  /**
   * Stop the running timer
   */
  const stopTimer = useCallback(async () => {
    if (!runningEntry) return null;
    
    const stoppedEntry = await timeEntryStorage.stopTimer(runningEntry.id);
    setRunningEntry(null);
    setCurrentDuration(0);
    return stoppedEntry;
  }, [runningEntry]);

  /**
   * Check if timer is running
   */
  const isRunning = !!runningEntry;

  return {
    runningEntry,
    currentDuration,
    isRunning,
    startTimer,
    stopTimer,
  };
}
