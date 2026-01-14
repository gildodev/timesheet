/**
 * Report generation utilities
 * Handles analytics and report creation
 */

import { Report, HeatmapData, TimeEntry } from '@/types';
import { timeEntryStorage, projectStorage } from './storage';

export class ReportGenerator {
  /**
   * Generate report for a period
   */
  static generateReport(
    period: Report['period'],
    startDate: Date,
    endDate: Date
  ): Report {
    const entries = timeEntryStorage.getEntriesByDateRange(startDate, endDate);
    const projects = projectStorage.getAllProjects();

    // Calculate total hours
    const totalSeconds = entries.reduce((sum, e) => sum + e.duration, 0);
    const totalHours = totalSeconds / 3600;

    // Project breakdown
    const projectMap = new Map<string, number>();
    entries.forEach(entry => {
      const current = projectMap.get(entry.projectId) || 0;
      projectMap.set(entry.projectId, current + entry.duration);
    });

    const projectBreakdown = Array.from(projectMap.entries()).map(([projectId, seconds]) => {
      const project = projects.find(p => p.id === projectId);
      return {
        projectId,
        projectName: project?.name || 'Unknown Project',
        hours: seconds / 3600,
        percentage: (seconds / totalSeconds) * 100,
      };
    }).sort((a, b) => b.hours - a.hours);

    // Tag breakdown
    const tagMap = new Map<string, number>();
    entries.forEach(entry => {
      entry.tags.forEach(tag => {
        const current = tagMap.get(tag) || 0;
        tagMap.set(tag, current + entry.duration);
      });
    });

    const tagBreakdown = Array.from(tagMap.entries()).map(([tag, seconds]) => ({
      tag,
      hours: seconds / 3600,
      percentage: (seconds / totalSeconds) * 100,
    })).sort((a, b) => b.hours - a.hours);

    // Daily breakdown
    const dailyMap = new Map<string, number>();
    entries.forEach(entry => {
      const date = new Date(entry.startTime).toISOString().split('T')[0];
      const current = dailyMap.get(date) || 0;
      dailyMap.set(date, current + entry.duration);
    });

    const dailyBreakdown = Array.from(dailyMap.entries()).map(([date, seconds]) => ({
      date,
      hours: seconds / 3600,
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Best day
    const bestDay = dailyBreakdown.reduce((best, day) => 
      day.hours > best.hours ? day : best,
      { date: '', hours: 0 }
    );

    // Average hours per day
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const averageHoursPerDay = totalHours / daysDiff;

    // Prediction (simple linear projection)
    const prediction = this.generatePrediction(averageHoursPerDay);

    return {
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalHours,
      projectBreakdown,
      tagBreakdown,
      dailyBreakdown,
      bestDay,
      averageHoursPerDay,
      prediction,
    };
  }

  /**
   * Generate day report
   */
  static generateDayReport(date: Date): Report {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return this.generateReport('day', start, end);
  }

  /**
   * Generate week report
   */
  static generateWeekReport(date: Date): Report {
    const start = new Date(date);
    const dayOfWeek = start.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return this.generateReport('week', start, end);
  }

  /**
   * Generate month report
   */
  static generateMonthReport(date: Date): Report {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);

    return this.generateReport('month', start, end);
  }

  /**
   * Generate heatmap data for the year
   */
  static generateHeatmapData(year: number): HeatmapData[] {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    
    const entries = timeEntryStorage.getEntriesByDateRange(start, end);
    
    // Group by date
    const dateMap = new Map<string, number>();
    entries.forEach(entry => {
      const date = new Date(entry.startTime).toISOString().split('T')[0];
      const current = dateMap.get(date) || 0;
      dateMap.set(date, current + entry.duration);
    });

    // Calculate max hours for normalization
    const maxHours = Math.max(...Array.from(dateMap.values()).map(s => s / 3600), 1);

    // Generate data for all days of the year
    const heatmapData: HeatmapData[] = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const seconds = dateMap.get(dateStr) || 0;
      const hours = seconds / 3600;
      
      // Calculate level (0-4)
      let level: HeatmapData['level'] = 0;
      if (hours > 0) {
        const ratio = hours / maxHours;
        if (ratio >= 0.75) level = 4;
        else if (ratio >= 0.5) level = 3;
        else if (ratio >= 0.25) level = 2;
        else level = 1;
      }

      heatmapData.push({
        date: dateStr,
        hours,
        level,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return heatmapData;
  }

  /**
   * Generate productivity prediction
   */
  private static generatePrediction(averageHoursPerDay: number): Report['prediction'] {
    // Simple prediction: next week hours based on daily average with 10% variance
    const nextWeekHours = averageHoursPerDay * 7 * 1.1;
    
    // Determine trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (averageHoursPerDay > 6) trend = 'up';
    else if (averageHoursPerDay < 3) trend = 'down';

    return {
      nextWeekHours,
      trend,
    };
  }

  /**
   * Calculate current streak
   */
  static calculateStreak(): { current: number; longest: number } {
    const allEntries = timeEntryStorage.getAllEntries();
    if (allEntries.length === 0) return { current: 0, longest: 0 };

    // Get unique dates with activity
    const datesWithActivity = new Set(
      allEntries.map(e => new Date(e.startTime).toISOString().split('T')[0])
    );

    const sortedDates = Array.from(datesWithActivity).sort().reverse();

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedDates.length; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];

      if (sortedDates.includes(dateStr)) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const dayDiff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, currentStreak);

    return { current: currentStreak, longest: longestStreak };
  }
}
