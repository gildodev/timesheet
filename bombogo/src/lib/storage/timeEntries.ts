/**
 * Time entry storage manager
 * Handles CRUD operations for time tracking entries with Supabase integration
 */

import { TimeEntry } from '@/types';
import { SupabaseService } from '../supabase-service';

class TimeEntryStorageManager {
  private cache: TimeEntry[] = [];
  private lastFetch: number = 0;
  private cacheDuration = 30000; // 30 seconds

  /**
   * Get all time entries from Supabase
   */
  async getAll(): Promise<TimeEntry[]> {
    const now = Date.now();
    if (this.cache.length > 0 && now - this.lastFetch < this.cacheDuration) {
      return this.cache;
    }

    const entries = await SupabaseService.getTimeEntries();
    this.cache = entries.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
    this.lastFetch = now;
    return this.cache;
  }

  /**
   * Get entry by ID
   */
  async getById(id: string): Promise<TimeEntry | undefined> {
    const entries = await this.getAll();
    return entries.find(e => e.id === id);
  }

  /**
   * Create new entry
   */
  async create(entry: TimeEntry): Promise<TimeEntry> {
    const created = await SupabaseService.createTimeEntry(entry);
    if (created) {
      this.cache.unshift(created);
    }
    return created || entry;
  }

  /**
   * Update entry
   */
  async update(id: string, updates: Partial<TimeEntry>): Promise<TimeEntry | undefined> {
    const updated = await SupabaseService.updateTimeEntry(id, updates);
    if (updated) {
      const index = this.cache.findIndex(e => e.id === id);
      if (index !== -1) {
        this.cache[index] = updated;
      }
    }
    return updated;
  }

  /**
   * Delete entry
   */
  async delete(id: string): Promise<boolean> {
    const success = await SupabaseService.deleteTimeEntry(id);
    if (success) {
      this.cache = this.cache.filter(e => e.id !== id);
    }
    return success;
  }

  /**
   * Get all time entries
   */
  async getAllEntries(): Promise<TimeEntry[]> {
    return this.getAll();
  }

  /**
   * Get running entry (timer active)
   */
  async getRunningEntry(): Promise<TimeEntry | undefined> {
    const entries = await this.getAll();
    return entries.find(e => e.isRunning);
  }

  /**
   * Get entries by project
   */
  async getEntriesByProject(projectId: string): Promise<TimeEntry[]> {
    const entries = await this.getAll();
    return entries.filter(e => e.projectId === projectId);
  }

  /**
   * Get entries by task
   */
  async getEntriesByTask(taskId: string): Promise<TimeEntry[]> {
    const entries = await this.getAll();
    return entries.filter(e => e.taskId === taskId);
  }

  /**
   * Get entries by date range
   */
  async getEntriesByDateRange(startDate: Date, endDate: Date): Promise<TimeEntry[]> {
    const entries = await this.getAll();
    return entries.filter(e => {
      const entryDate = new Date(e.startTime);
      return entryDate >= startDate && entryDate <= endDate;
    });
  }

  /**
   * Get entries for today
   */
  async getTodayEntries(): Promise<TimeEntry[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getEntriesByDateRange(today, tomorrow);
  }

  /**
   * Get entries for this week
   */
  async getWeekEntries(): Promise<TimeEntry[]> {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - diff);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 7);

    return this.getEntriesByDateRange(monday, sunday);
  }

  /**
   * Get entries for this month
   */
  async getMonthEntries(): Promise<TimeEntry[]> {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    lastDay.setHours(23, 59, 59, 999);

    return this.getEntriesByDateRange(firstDay, lastDay);
  }

  /**
   * Calculate total duration for entries
   */
  calculateTotalDuration(entries: TimeEntry[]): number {
    return entries.reduce((total, entry) => total + entry.duration, 0);
  }

  /**
   * Get total hours for a project
   */
  async getProjectTotalHours(projectId: string): Promise<number> {
    const entries = await this.getEntriesByProject(projectId);
    const totalSeconds = this.calculateTotalDuration(entries);
    return totalSeconds / 3600;
  }

  /**
   * Get total hours for a task
   */
  async getTaskTotalHours(taskId: string): Promise<number> {
    const entries = await this.getEntriesByTask(taskId);
    const totalSeconds = this.calculateTotalDuration(entries);
    return totalSeconds / 3600;
  }

  /**
   * Start a new timer
   */
  async startTimer(title: string, projectId: string, taskId?: string, tags: string[] = []): Promise<TimeEntry> {
    // Stop any running timers first
    await this.stopAllTimers();

    const entry: TimeEntry = {
      id: this.generateId(),
      title,
      projectId,
      taskId,
      startTime: new Date().toISOString(),
      duration: 0,
      tags,
      activities: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isRunning: true,
    };

    return this.create(entry);
  }

  /**
   * Stop a running timer
   */
  async stopTimer(id: string): Promise<TimeEntry | undefined> {
    const entry = await this.getById(id);
    if (!entry || !entry.isRunning) return undefined;

    const endTime = new Date().toISOString();
    const duration = Math.floor(
      (new Date(endTime).getTime() - new Date(entry.startTime).getTime()) / 1000
    );

    return this.update(id, {
      endTime,
      duration,
      isRunning: false,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Stop all running timers
   */
  async stopAllTimers(): Promise<void> {
    const runningEntry = await this.getRunningEntry();
    if (runningEntry) {
      await this.stopTimer(runningEntry.id);
    }
  }

  /**
   * Update running timer duration (for display)
   */
  getCurrentDuration(entry: TimeEntry): number {
    if (!entry.isRunning) return entry.duration;

    const now = new Date().getTime();
    const start = new Date(entry.startTime).getTime();
    return Math.floor((now - start) / 1000);
  }

  /**
   * Delete entries by project
   */
  async deleteProjectEntries(projectId: string): Promise<void> {
    const entries = await this.getAll();
    const projectEntries = entries.filter(e => e.projectId === projectId);
    
    for (const entry of projectEntries) {
      await this.delete(entry.id);
    }
  }

  /**
   * Delete entries by task
   */
  async deleteTaskEntries(taskId: string): Promise<void> {
    const entries = await this.getAll();
    const taskEntries = entries.filter(e => e.taskId === taskId);
    
    for (const entry of taskEntries) {
      await this.delete(entry.id);
    }
  }

  /**
   * Get entries by tag
   */
  async getEntriesByTag(tag: string): Promise<TimeEntry[]> {
    const entries = await this.getAll();
    return entries.filter(e => e.tags.includes(tag));
  }

  /**
   * Clear cache (force refresh)
   */
  clearCache(): void {
    this.cache = [];
    this.lastFetch = 0;
  }

  private generateId(): string {
    return `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const timeEntryStorage = new TimeEntryStorageManager();
