/**
 * Activity Log storage manager (Premium feature)
 * Tracks user activity and app usage patterns
 */

import { ActivityLog } from '@/types';
import { BaseStorageManager } from './base';

class ActivityLogStorageManager extends BaseStorageManager<ActivityLog> {
  constructor() {
    super('timeflow_activity_log');
  }

  /**
   * Log a new activity
   */
  logActivity(
    type: ActivityLog['type'],
    description: string,
    metadata?: Record<string, any>
  ): ActivityLog {
    const activity: ActivityLog = {
      id: this.generateId(),
      type,
      description,
      timestamp: new Date().toISOString(),
      metadata,
      createdAt: new Date().toISOString(),
    };

    return this.create(activity);
  }

  /**
   * Get activities by date range
   */
  getActivitiesByDateRange(startDate: Date, endDate: Date): ActivityLog[] {
    return this.getAll().filter(a => {
      const activityDate = new Date(a.timestamp);
      return activityDate >= startDate && activityDate <= endDate;
    });
  }

  /**
   * Get today's activities
   */
  getTodayActivities(): ActivityLog[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getActivitiesByDateRange(today, tomorrow);
  }

  /**
   * Get activities by type
   */
  getActivitiesByType(type: ActivityLog['type']): ActivityLog[] {
    return this.getAll().filter(a => a.type === type);
  }

  /**
   * Get most productive hours (Premium analytics)
   */
  getMostProductiveHours(): { hour: number; count: number }[] {
    const activities = this.getActivitiesByType('timer_start');
    const hourCounts: Record<number, number> = {};

    activities.forEach(activity => {
      const hour = new Date(activity.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: Number(hour), count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get app usage patterns
   */
  getUsagePatterns(): {
    totalSessions: number;
    averageSessionTime: number;
    mostUsedFeatures: { feature: string; count: number }[];
  } {
    const sessions = this.getActivitiesByType('timer_start').length;
    const features: Record<string, number> = {};

    this.getAll().forEach(activity => {
      if (activity.type !== 'timer_start' && activity.type !== 'timer_stop') {
        features[activity.type] = (features[activity.type] || 0) + 1;
      }
    });

    const mostUsedFeatures = Object.entries(features)
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalSessions: sessions,
      averageSessionTime: 0, // Would need to calculate from timer entries
      mostUsedFeatures,
    };
  }

  /**
   * Clear old logs (keep last 30 days)
   */
  clearOldLogs(daysToKeep = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const activities = this.getAll();
    activities.forEach(activity => {
      if (new Date(activity.timestamp) < cutoffDate) {
        this.delete(activity.id);
      }
    });
  }

  private generateId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const activityLogStorage = new ActivityLogStorageManager();
