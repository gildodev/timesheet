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

  const loadEntries = useCallback(() => {
    let allEntries = timeEntryStorage.getAllEntries();

    // Apply filters
    if (filters?.projectId) {
      allEntries = allEntries.filter(e => e.projectId === filters.projectId);
    }
    if (filters?.taskId) {
      allEntries = allEntries.filter(e => e.taskId === filters.taskId);
    }
    if (filters?.startDate && filters?.endDate) {
      allEntries = timeEntryStorage.getEntriesByDateRange(
        filters.startDate,
        filters.endDate
      );
    }

    setEntries(allEntries);
    setLoading(false);
  }, [filters]);

  const updateEntry = useCallback((id: string, updates: Partial<TimeEntry>) => {
    timeEntryStorage.update(id, { ...updates, updatedAt: new Date().toISOString() });
    loadEntries();
  }, [loadEntries]);

  const deleteEntry = useCallback((id: string) => {
    timeEntryStorage.delete(id);
    loadEntries();
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
