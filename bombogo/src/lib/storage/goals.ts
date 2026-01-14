/**
 * Goals storage manager
 * Handles CRUD operations for productivity goals with Supabase integration
 */

import { Goal } from '@/types';
import { SupabaseService } from '../supabase-service';

class GoalStorageManager {
  private cache: Goal[] = [];
  private lastFetch: number = 0;
  private cacheDuration = 30000; // 30 seconds

  /**
   * Get all goals from Supabase
   */
  async getAll(): Promise<Goal[]> {
    const now = Date.now();
    if (this.cache.length > 0 && now - this.lastFetch < this.cacheDuration) {
      return this.cache;
    }

    const goals = await SupabaseService.getGoals();
    this.cache = goals;
    this.lastFetch = now;
    return goals;
  }

  /**
   * Get goal by ID
   */
  async getById(id: string): Promise<Goal | undefined> {
    const goals = await this.getAll();
    return goals.find(g => g.id === id);
  }

  /**
   * Create new goal
   */
  async create(goal: Goal): Promise<Goal> {
    const created = await SupabaseService.createGoal(goal);
    if (created) {
      this.cache.push(created);
    }
    return created || goal;
  }

  /**
   * Update goal
   */
  async update(id: string, updates: Partial<Goal>): Promise<Goal | undefined> {
    const updated = await SupabaseService.updateGoal(id, updates);
    if (updated) {
      const index = this.cache.findIndex(g => g.id === id);
      if (index !== -1) {
        this.cache[index] = updated;
      }
    }
    return updated;
  }

  /**
   * Delete goal
   */
  async delete(id: string): Promise<boolean> {
    const success = await SupabaseService.deleteGoal(id);
    if (success) {
      this.cache = this.cache.filter(g => g.id !== id);
    }
    return success;
  }

  /**
   * Get all goals
   */
  async getAllGoals(): Promise<Goal[]> {
    return this.getAll();
  }

  /**
   * Get active goals (current period)
   */
  async getActiveGoals(): Promise<Goal[]> {
    const now = new Date();
    const goals = await this.getAll();
    return goals.filter(g => {
      const start = new Date(g.startDate);
      const end = new Date(g.endDate);
      return now >= start && now <= end;
    });
  }

  /**
   * Get goals by type
   */
  async getGoalsByType(type: Goal['type']): Promise<Goal[]> {
    const goals = await this.getAll();
    return goals.filter(g => g.type === type);
  }

  /**
   * Get active daily goal
   */
  async getActiveDailyGoal(): Promise<Goal | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const goals = await this.getAll();
    return goals.find(g => {
      if (g.type !== 'daily') return false;
      const goalDate = new Date(g.startDate);
      goalDate.setHours(0, 0, 0, 0);
      return goalDate.getTime() === today.getTime();
    });
  }

  /**
   * Get active weekly goal
   */
  async getActiveWeeklyGoal(): Promise<Goal | undefined> {
    const now = new Date();
    const goals = await this.getAll();
    return goals.find(g => {
      if (g.type !== 'weekly') return false;
      const start = new Date(g.startDate);
      const end = new Date(g.endDate);
      return now >= start && now <= end;
    });
  }

  /**
   * Get active monthly goal
   */
  async getActiveMonthlyGoal(): Promise<Goal | undefined> {
    const now = new Date();
    const goals = await this.getAll();
    return goals.find(g => {
      if (g.type !== 'monthly') return false;
      const start = new Date(g.startDate);
      const end = new Date(g.endDate);
      return now >= start && now <= end;
    });
  }

  /**
   * Get goals by project
   */
  async getProjectGoals(projectId: string): Promise<Goal[]> {
    const goals = await this.getAll();
    return goals.filter(g => (g as any).projectId === projectId);
  }

  /**
   * Create a daily goal
   */
  async createDailyGoal(targetHours: number, projectId?: string): Promise<Goal> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const goal: Goal & { projectId?: string } = {
      id: this.generateId(),
      type: 'daily',
      targetHours,
      currentHours: 0,
      startDate: today.toISOString(),
      endDate: tomorrow.toISOString(),
      projectId,
      achieved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.create(goal);
  }

  /**
   * Create a weekly goal
   */
  async createWeeklyGoal(targetHours: number, projectId?: string): Promise<Goal> {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const monday = new Date(today);
    monday.setDate(today.getDate() - diff);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 7);

    const goal: Goal & { projectId?: string } = {
      id: this.generateId(),
      type: 'weekly',
      targetHours,
      currentHours: 0,
      startDate: monday.toISOString(),
      endDate: sunday.toISOString(),
      projectId,
      achieved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.create(goal);
  }

  /**
   * Create a monthly goal
   */
  async createMonthlyGoal(targetHours: number, projectId?: string): Promise<Goal> {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    firstDay.setHours(0, 0, 0, 0);

    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    lastDay.setHours(23, 59, 59, 999);

    const goal: Goal & { projectId?: string } = {
      id: this.generateId(),
      type: 'monthly',
      targetHours,
      currentHours: 0,
      startDate: firstDay.toISOString(),
      endDate: lastDay.toISOString(),
      projectId,
      achieved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.create(goal);
  }

  /**
   * Clear cache (force refresh)
   */
  clearCache(): void {
    this.cache = [];
    this.lastFetch = 0;
  }

  private generateId(): string {
    return `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const goalStorage = new GoalStorageManager();
