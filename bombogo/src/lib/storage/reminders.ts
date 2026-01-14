/**
 * Reminder storage manager
 * Handles CRUD operations for reminders/alerts with Supabase integration
 */

import { Reminder } from '@/types';
import { SupabaseService } from '../supabase-service';

class ReminderStorageManager {
  private cache: Reminder[] = [];
  private lastFetch: number = 0;
  private cacheDuration = 30000; // 30 seconds

  /**
   * Get all reminders from Supabase
   */
  async getAll(): Promise<Reminder[]> {
    const now = Date.now();
    if (this.cache.length > 0 && now - this.lastFetch < this.cacheDuration) {
      return this.cache;
    }

    const reminders = await SupabaseService.getReminders();
    this.cache = reminders;
    this.lastFetch = now;
    return reminders;
  }

  /**
   * Get reminder by ID
   */
  async getById(id: string): Promise<Reminder | undefined> {
    const reminders = await this.getAll();
    return reminders.find(r => r.id === id);
  }

  /**
   * Create new reminder
   */
  async create(reminder: Reminder): Promise<Reminder> {
    const created = await SupabaseService.createReminder(reminder);
    if (created) {
      this.cache.push(created);
    }
    return created || reminder;
  }

  /**
   * Update reminder
   */
  async update(id: string, updates: Partial<Reminder>): Promise<Reminder | undefined> {
    const updated = await SupabaseService.updateReminder(id, updates);
    if (updated) {
      const index = this.cache.findIndex(r => r.id === id);
      if (index !== -1) {
        this.cache[index] = updated;
      }
    }
    return updated;
  }

  /**
   * Delete reminder
   */
  async delete(id: string): Promise<boolean> {
    const success = await SupabaseService.deleteReminder(id);
    if (success) {
      this.cache = this.cache.filter(r => r.id !== id);
    }
    return success;
  }

  /**
   * Get active reminders (not completed)
   */
  async getActiveReminders(): Promise<Reminder[]> {
    const reminders = await this.getAll();
    return reminders
      .filter(r => !r.completed)
      .sort((a, b) => {
        const dateA = new Date(a.dueDate + (a.dueTime ? `T${a.dueTime}` : '')).getTime();
        const dateB = new Date(b.dueDate + (b.dueTime ? `T${b.dueTime}` : '')).getTime();
        return dateA - dateB;
      });
  }

  /**
   * Get completed reminders
   */
  async getCompletedReminders(): Promise<Reminder[]> {
    const reminders = await this.getAll();
    return reminders
      .filter(r => r.completed)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /**
   * Get reminders by project
   */
  async getRemindersByProject(projectId: string): Promise<Reminder[]> {
    const reminders = await this.getAll();
    return reminders
      .filter(r => r.projectId === projectId)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  /**
   * Get reminders by task
   */
  async getRemindersByTask(taskId: string): Promise<Reminder[]> {
    const reminders = await this.getAll();
    return reminders
      .filter(r => r.taskId === taskId)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  /**
   * Get overdue reminders
   */
  async getOverdueReminders(): Promise<Reminder[]> {
    const now = new Date();
    const activeReminders = await this.getActiveReminders();
    return activeReminders.filter(r => {
      const dueDateTime = new Date(r.dueDate + (r.dueTime ? `T${r.dueTime}` : ''));
      return dueDateTime < now;
    });
  }

  /**
   * Get due today reminders
   */
  async getTodayReminders(): Promise<Reminder[]> {
    const today = new Date().toISOString().split('T')[0];
    const activeReminders = await this.getActiveReminders();
    return activeReminders.filter(r => r.dueDate === today);
  }

  /**
   * Mark reminder as completed
   */
  async completeReminder(id: string): Promise<Reminder | undefined> {
    return this.update(id, {
      completed: true,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Mark reminder as notified
   */
  async markAsNotified(id: string): Promise<Reminder | undefined> {
    return this.update(id, {
      notified: true,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Check and get reminders that need notification
   */
  async getRemindersToNotify(): Promise<Reminder[]> {
    const now = new Date();
    const activeReminders = await this.getActiveReminders();
    return activeReminders.filter(r => {
      if (r.notified) return false;
      
      const dueDateTime = new Date(r.dueDate + (r.dueTime ? `T${r.dueTime}` : ''));
      const notifyTime = new Date(dueDateTime.getTime() - 15 * 60 * 1000);
      
      return now >= notifyTime;
    });
  }

  /**
   * Clear cache (force refresh)
   */
  clearCache(): void {
    this.cache = [];
    this.lastFetch = 0;
  }
}

export const reminderStorage = new ReminderStorageManager();
