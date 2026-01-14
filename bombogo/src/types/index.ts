/**
 * Type definitions for TimeFlow app
 */

export interface User {
  id: string;
  name: string;
  email?: string;
  isPremium: boolean;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  tags: string[];
  archived: boolean;
  isPermanent: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  startDate?: string;
  endDate?: string;
  estimatedHours?: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  title: string;
  projectId: string;
  taskId?: string;
  startTime: string;
  endTime?: string;
  duration: number; // in seconds
  notes?: string;
  tags: string[];
  activities?: TimeActivity[];
  isRunning?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TimeActivity {
  id: string;
  description: string;
  duration: number; // in seconds
  timestamp: string;
}

export interface PomodoroSession {
  id: string;
  taskId?: string;
  startTime: string;
  endTime?: string;
  duration: number; // in seconds
  type: 'work' | 'break' | 'long-break';
  completed: boolean;
  interrupted: boolean;
  createdAt: string;
}

export interface PomodoroSettings {
  workDuration: number; // in minutes
  breakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  soundEnabled: boolean;
}

export interface Goal {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  targetHours: number;
  currentHours: number;
  startDate: string;
  endDate: string;
  achieved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  startDate: string;
  endDate: string;
  totalHours: number;
  totalEntries: number;
  dailyBreakdown: {
    date: string;
    hours: number;
    entries: number;
  }[];
  projectBreakdown: {
    projectId: string;
    projectName: string;
    hours: number;
    percentage: number;
  }[];
  tagBreakdown: {
    tag: string;
    hours: number;
    percentage: number;
  }[];
  averageHoursPerDay: number;
  mostProductiveDay?: string;
  streak: {
    current: number;
    longest: number;
  };
}

export interface HeatmapData {
  date: string;
  hours: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ActivityLog {
  id: string;
  type: 
    | 'timer_start'
    | 'timer_stop'
    | 'project_created'
    | 'task_completed'
    | 'goal_achieved'
    | 'export'
    | 'settings_changed';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  dueTime?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  notified: boolean;
  projectId?: string;
  taskId?: string;
  createdAt: string;
  updatedAt: string;
}
