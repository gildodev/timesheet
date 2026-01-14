/**
 * Reminder storage manager
 * Handles CRUD operations for reminders/alerts
 */

import { Reminder } from '@/types';
import { BaseStorageManager } from './base';

class ReminderStorageManager extends BaseStorageManager<Reminder> {
  constructor() {
    super('timeflow_reminders');
  }

  /**
   * Get active reminders (not completed)
   */
  getActiveReminders(): Reminder[] {
    return this.getAll()
      .filter(r => !r.completed)
      .sort((a, b) => {
        // Sort by due date
        const dateA = new Date(a.dueDate + (a.dueTime ? `T${a.dueTime}` : '')).getTime();
        const dateB = new Date(b.dueDate + (b.dueTime ? `T${b.dueTime}` : '')).getTime();
        return dateA - dateB;
      });
  }

  /**
   * Get completed reminders
   */
  getCompletedReminders(): Reminder[] {
    return this.getAll()
      .filter(r => r.completed)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /**
   * Get reminders by project
   */
  getRemindersByProject(projectId: string): Reminder[] {
    return this.getAll()
      .filter(r => r.projectId === projectId)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  /**
   * Get reminders by task
   */
  getRemindersByTask(taskId: string): Reminder[] {
    return this.getAll()
      .filter(r => r.taskId === taskId)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  /**
   * Get overdue reminders
   */
  getOverdueReminders(): Reminder[] {
    const now = new Date();
    return this.getActiveReminders().filter(r => {
      const dueDateTime = new Date(r.dueDate + (r.dueTime ? `T${r.dueTime}` : ''));
      return dueDateTime < now;
    });
  }

  /**
   * Get due today reminders
   */
  getTodayReminders(): Reminder[] {
    const today = new Date().toISOString().split('T')[0];
    return this.getActiveReminders().filter(r => r.dueDate === today);
  }

  /**
   * Mark reminder as completed
   */
  completeReminder(id: string): Reminder | undefined {
    return this.update(id, {
      completed: true,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Mark reminder as notified
   */
  markAsNotified(id: string): Reminder | undefined {
    return this.update(id, {
      notified: true,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Check and get reminders that need notification
   */
  getRemindersToNotify(): Reminder[] {
    const now = new Date();
    return this.getActiveReminders().filter(r => {
      if (r.notified) return false;
      
      const dueDateTime = new Date(r.dueDate + (r.dueTime ? `T${r.dueTime}` : ''));
      // Notify 15 minutes before
      const notifyTime = new Date(dueDateTime.getTime() - 15 * 60 * 1000);
      
      return now >= notifyTime;
    });
  }
}

export const reminderStorage = new ReminderStorageManager();
