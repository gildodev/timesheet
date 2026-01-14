/**
 * Time entries hook
 * Manages time entry state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { TimeEntry } from '@/types';
import { timeEntryStorage } from '@/lib/storage';

export function useTimeEntries(filters?: {
  projectId?: string;
  taskId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Load entries on mount or when filters change
  useEffect(() => {
    loadEntries();
  }, [filters?.projectId, filters?.taskId, filters?.startDate, filters?.endDate]);

  const loadEntries = useCallback(async () => {
    try {
      let allEntries: TimeEntry[];

      // Apply filters
      if (filters?.startDate && filters?.endDate) {
        allEntries = await timeEntryStorage.getEntriesByDateRange(
          filters.startDate,
          filters.endDate
        );
      } else {
        allEntries = await timeEntryStorage.getAllEntries();
      }

      if (filters?.projectId) {
        allEntries = allEntries.filter(e => e.projectId === filters.projectId);
      }
      if (filters?.taskId) {
        allEntries = allEntries.filter(e => e.taskId === filters.taskId);
      }

      setEntries(allEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateEntry = useCallback(async (id: string, updates: Partial<TimeEntry>) => {
    await timeEntryStorage.update(id, { ...updates, updatedAt: new Date().toISOString() });
    await loadEntries();
  }, [loadEntries]);

  const deleteEntry = useCallback(async (id: string) => {
    await timeEntryStorage.delete(id);
    await loadEntries();
  }, [loadEntries]);

  const getTotalDuration = useCallback(() => {
    return timeEntryStorage.calculateTotalDuration(entries);
  }, [entries]);

  return {
    entries,
    loading,
    updateEntry,
    deleteEntry,
    getTotalDuration,
    refresh: loadEntries,
  };
}
