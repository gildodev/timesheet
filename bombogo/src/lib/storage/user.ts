/**
 * User storage manager
 * Handles user data and premium status
 */

import { User, AppSettings } from '@/types';

class UserStorageManager {
  private userKey = 'timeflow_user';
  private premiumKey = 'timeflow_premium';
  private settingsKey = 'timeflow_settings';

  /**
   * Get current user
   */
  getUser(): User | null {
    try {
      const data = localStorage.getItem(this.userKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading user:', error);
      return null;
    }
  }

  /**
   * Create or update user
   */
  setUser(user: User): void {
    try {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user:', error);
    }
  }

  /**
   * Create a new user
   */
  createUser(name: string, email?: string): User {
    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      createdAt: new Date().toISOString(),
      isPremium: false,
    };

    this.setUser(user);
    return user;
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.getUser() !== null;
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem(this.userKey);
  }

  /**
   * Check premium status
   */
  isPremium(): boolean {
    const user = this.getUser();
    if (!user) return false;
    return user.isPremium;
  }

  /**
   * Activate premium
   */
  activatePremium(): void {
    const user = this.getUser();
    if (user) {
      user.isPremium = true;
      this.setUser(user);
      localStorage.setItem(this.premiumKey, 'true');
    }
  }

  /**
   * Deactivate premium
   */
  deactivatePremium(): void {
    const user = this.getUser();
    if (user) {
      user.isPremium = false;
      this.setUser(user);
      localStorage.removeItem(this.premiumKey);
    }
  }

  /**
   * Get app settings
   */
  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(this.settingsKey);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error reading settings:', error);
    }

    // Default settings
    return {
      theme: 'system',
      language: 'pt-BR',
      notifications: true,
      soundEnabled: true,
      autoTrack: false,
      weekStartsOn: 'monday',
    };
  }

  /**
   * Update app settings
   */
  updateSettings(settings: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };

    try {
      localStorage.setItem(this.settingsKey, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving settings:', error);
    }

    return updated;
  }

  /**
   * Reset all user data
   */
  resetAllData(): void {
    const keysToRemove = [
      'timeflow_user',
      'timeflow_premium',
      'timeflow_settings',
      'timeflow_projects',
      'timeflow_tasks',
      'timeflow_time_entries',
      'timeflow_pomodoro_sessions',
      'timeflow_pomodoro_settings',
      'timeflow_goals',
      'timeflow_activity_logs',
    ];

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

export const userStorage = new UserStorageManager();
