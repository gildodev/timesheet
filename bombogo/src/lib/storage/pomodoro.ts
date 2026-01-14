/**
 * Pomodoro storage manager
 * Handles CRUD operations for Pomodoro sessions and settings
 */

import { PomodoroSession, PomodoroSettings } from '@/types';
import { BaseStorageManager } from './base';

class PomodoroStorageManager extends BaseStorageManager<PomodoroSession> {
  private settingsKey = 'timeflow_pomodoro_settings';

  constructor() {
    super('timeflow_pomodoro_sessions');
  }

  /**
   * Get all sessions
   */
  getAllSessions(): PomodoroSession[] {
    return this.getAll().sort((a, b) =>
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }

  /**
   * Get sessions by date range
   */
  getSessionsByDateRange(startDate: Date, endDate: Date): PomodoroSession[] {
    return this.getAll().filter(s => {
      const sessionDate = new Date(s.startTime);
      return sessionDate >= startDate && sessionDate <= endDate;
    });
  }

  /**
   * Get today's sessions
   */
  getTodaySessions(): PomodoroSession[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getSessionsByDateRange(today, tomorrow);
  }

  /**
   * Get completed sessions count
   */
  getCompletedCount(type?: PomodoroSession['type']): number {
    let sessions = this.getAll().filter(s => s.completed);
    if (type) {
      sessions = sessions.filter(s => s.type === type);
    }
    return sessions.length;
  }

  /**
   * Get sessions by task
   */
  getSessionsByTask(taskId: string): PomodoroSession[] {
    return this.getAll().filter(s => s.taskId === taskId);
  }

  /**
   * Get Pomodoro settings
   */
  getSettings(): PomodoroSettings {
    try {
      const data = localStorage.getItem(this.settingsKey);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error reading pomodoro settings:', error);
    }

    // Default settings
    return {
      workDuration: 25,
      breakDuration: 5,
      longBreakDuration: 15,
      sessionsUntilLongBreak: 4,
      autoStartBreaks: false,
      autoStartWork: false,
      soundEnabled: true,
    };
  }

  /**
   * Update Pomodoro settings
   */
  updateSettings(settings: Partial<PomodoroSettings>): PomodoroSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    
    try {
      localStorage.setItem(this.settingsKey, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving pomodoro settings:', error);
    }

    return updated;
  }

  /**
   * Create a new session
   */
  createSession(
    type: PomodoroSession['type'],
    taskId?: string
  ): PomodoroSession {
    const session: PomodoroSession = {
      id: this.generateId(),
      taskId,
      startTime: new Date().toISOString(),
      duration: 0,
      type,
      completed: false,
      interrupted: false,
      createdAt: new Date().toISOString(),
    };

    return this.create(session);
  }

  /**
   * Complete a session
   */
  completeSession(id: string, duration: number): PomodoroSession | undefined {
    return this.update(id, {
      endTime: new Date().toISOString(),
      duration,
      completed: true,
    });
  }

  /**
   * Interrupt a session
   */
  interruptSession(id: string, duration: number): PomodoroSession | undefined {
    return this.update(id, {
      endTime: new Date().toISOString(),
      duration,
      interrupted: true,
    });
  }

  /**
   * Get statistics for today
   */
  getTodayStats(): {
    workSessions: number;
    breakSessions: number;
    totalWorkTime: number;
    totalBreakTime: number;
    completedWorkSessions: number;
  } {
    const sessions = this.getTodaySessions();

    const workSessions = sessions.filter(s => s.type === 'work');
    const breakSessions = sessions.filter(s => s.type !== 'work');

    return {
      workSessions: workSessions.length,
      breakSessions: breakSessions.length,
      totalWorkTime: workSessions.reduce((sum, s) => sum + s.duration, 0),
      totalBreakTime: breakSessions.reduce((sum, s) => sum + s.duration, 0),
      completedWorkSessions: workSessions.filter(s => s.completed).length,
    };
  }

  private generateId(): string {
    return `pomodoro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const pomodoroStorage = new PomodoroStorageManager();
