/**
 * Time entry storage manager
 * Handles CRUD operations for time tracking entries
 */

import { TimeEntry } from '@/types';
import { BaseStorageManager } from './base';

class TimeEntryStorageManager extends BaseStorageManager<TimeEntry> {
  constructor() {
    super('timeflow_time_entries');
  }

  /**
   * Get all time entries
   */
  getAllEntries(): TimeEntry[] {
    return this.getAll().sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }

  /**
   * Get running entry (timer active)
   */
  getRunningEntry(): TimeEntry | undefined {
    return this.getAll().find(e => e.isRunning);
  }

  /**
   * Get entries by project
   */
  getEntriesByProject(projectId: string): TimeEntry[] {
    return this.getAll().filter(e => e.projectId === projectId);
  }

  /**
   * Get entries by task
   */
  getEntriesByTask(taskId: string): TimeEntry[] {
    return this.getAll().filter(e => e.taskId === taskId);
  }

  /**
   * Get entries by date range
   */
  getEntriesByDateRange(startDate: Date, endDate: Date): TimeEntry[] {
    return this.getAll().filter(e => {
      const entryDate = new Date(e.startTime);
      return entryDate >= startDate && entryDate <= endDate;
    });
  }

  /**
   * Get entries for today
   */
  getTodayEntries(): TimeEntry[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getEntriesByDateRange(today, tomorrow);
  }

  /**
   * Get entries for this week
   */
  getWeekEntries(): TimeEntry[] {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Start on Monday
    
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
  getMonthEntries(): TimeEntry[] {
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
  getProjectTotalHours(projectId: string): number {
    const entries = this.getEntriesByProject(projectId);
    const totalSeconds = this.calculateTotalDuration(entries);
    return totalSeconds / 3600;
  }

  /**
   * Get total hours for a task
   */
  getTaskTotalHours(taskId: string): number {
    const entries = this.getEntriesByTask(taskId);
    const totalSeconds = this.calculateTotalDuration(entries);
    return totalSeconds / 3600;
  }

  /**
   * Start a new timer
   */
  startTimer(projectId: string, taskId?: string, tags: string[] = []): TimeEntry {
    // Stop any running timers first
    this.stopAllTimers();

    const entry: TimeEntry = {
      id: this.generateId(),
      projectId,
      taskId,
      startTime: new Date().toISOString(),
      duration: 0,
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isRunning: true,
    };

    return this.create(entry);
  }

  /**
   * Stop a running timer
   */
  stopTimer(id: string): TimeEntry | undefined {
    const entry = this.getById(id);
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
  stopAllTimers(): void {
    const runningEntry = this.getRunningEntry();
    if (runningEntry) {
      this.stopTimer(runningEntry.id);
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
  deleteProjectEntries(projectId: string): void {
    const entries = this.getAll();
    const filtered = entries.filter(e => e.projectId !== projectId);
    this.saveAll(filtered);
  }

  /**
   * Delete entries by task
   */
  deleteTaskEntries(taskId: string): void {
    const entries = this.getAll();
    const filtered = entries.filter(e => e.taskId !== taskId);
    this.saveAll(filtered);
  }

  /**
   * Get entries by tag
   */
  getEntriesByTag(tag: string): TimeEntry[] {
    return this.getAll().filter(e => e.tags.includes(tag));
  }

  private generateId(): string {
    return `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const timeEntryStorage = new TimeEntryStorageManager();
