/**
 * Goals storage manager
 * Handles CRUD operations for productivity goals
 */

import { Goal } from '@/types';
import { BaseStorageManager } from './base';

class GoalStorageManager extends BaseStorageManager<Goal> {
  constructor() {
    super('timeflow_goals');
  }

  /**
   * Get all goals
   */
  getAllGoals(): Goal[] {
    return this.getAll();
  }

  /**
   * Get active goals (current period)
   */
  getActiveGoals(): Goal[] {
    const now = new Date();
    return this.getAll().filter(g => {
      const start = new Date(g.startDate);
      const end = new Date(g.endDate);
      return now >= start && now <= end;
    });
  }

  /**
   * Get goals by type
   */
  getGoalsByType(type: Goal['type']): Goal[] {
    return this.getAll().filter(g => g.type === type);
  }

  /**
   * Get active daily goal
   */
  getActiveDailyGoal(): Goal | undefined {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.getAll().find(g => {
      if (g.type !== 'daily') return false;
      const goalDate = new Date(g.startDate);
      goalDate.setHours(0, 0, 0, 0);
      return goalDate.getTime() === today.getTime();
    });
  }

  /**
   * Get active weekly goal
   */
  getActiveWeeklyGoal(): Goal | undefined {
    const now = new Date();
    return this.getAll().find(g => {
      if (g.type !== 'weekly') return false;
      const start = new Date(g.startDate);
      const end = new Date(g.endDate);
      return now >= start && now <= end;
    });
  }

  /**
   * Get active monthly goal
   */
  getActiveMonthlyGoal(): Goal | undefined {
    const now = new Date();
    return this.getAll().find(g => {
      if (g.type !== 'monthly') return false;
      const start = new Date(g.startDate);
      const end = new Date(g.endDate);
      return now >= start && now <= end;
    });
  }

  /**
   * Get goals by project
   */
  getProjectGoals(projectId: string): Goal[] {
    return this.getAll().filter(g => g.projectId === projectId);
  }

  /**
   * Create a daily goal
   */
  createDailyGoal(targetHours: number, projectId?: string): Goal {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const goal: Goal = {
      id: this.generateId(),
      type: 'daily',
      targetHours,
      startDate: today.toISOString(),
      endDate: tomorrow.toISOString(),
      projectId,
      createdAt: new Date().toISOString(),
    };

    return this.create(goal);
  }

  /**
   * Create a weekly goal
   */
  createWeeklyGoal(targetHours: number, projectId?: string): Goal {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const monday = new Date(today);
    monday.setDate(today.getDate() - diff);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 7);

    const goal: Goal = {
      id: this.generateId(),
      type: 'weekly',
      targetHours,
      startDate: monday.toISOString(),
      endDate: sunday.toISOString(),
      projectId,
      createdAt: new Date().toISOString(),
    };

    return this.create(goal);
  }

  /**
   * Create a monthly goal
   */
  createMonthlyGoal(targetHours: number, projectId?: string): Goal {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    firstDay.setHours(0, 0, 0, 0);

    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    lastDay.setHours(23, 59, 59, 999);

    const goal: Goal = {
      id: this.generateId(),
      type: 'monthly',
      targetHours,
      startDate: firstDay.toISOString(),
      endDate: lastDay.toISOString(),
      projectId,
      createdAt: new Date().toISOString(),
    };

    return this.create(goal);
  }

  private generateId(): string {
    return `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const goalStorage = new GoalStorageManager();
