/**
 * Supabase Service
 * Central service for all Supabase database operations
 */

import { supabase } from './supabase';
import { 
  Project, 
  Task, 
  TimeEntry, 
  Goal, 
  Reminder, 
  PomodoroSession,
  ActivityLog,
  PomodoroSettings
} from '@/types';

export class SupabaseService {
  /**
   * Get current user ID
   */
  private static async getUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  }

  // ============================================
  // PROJECTS
  // ============================================

  static async getProjects(): Promise<Project[]> {
    const userId = await this.getUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return [];
    }

    return data.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      color: p.color,
      tags: p.tags || [],
      archived: p.archived,
      isPermanent: p.is_permanent,
      startDate: p.start_date,
      endDate: p.end_date,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));
  }

  static async createProject(project: Project): Promise<Project | null> {
    const userId = await this.getUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('projects')
      .insert({
        id: project.id,
        user_id: userId,
        name: project.name,
        description: project.description,
        color: project.color,
        tags: project.tags,
        archived: project.archived,
        is_permanent: project.isPermanent,
        start_date: project.startDate,
        end_date: project.endDate,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return null;
    }

    return this.mapProject(data);
  }

  static async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .update({
        name: updates.name,
        description: updates.description,
        color: updates.color,
        tags: updates.tags,
        archived: updates.archived,
        is_permanent: updates.isPermanent,
        start_date: updates.startDate,
        end_date: updates.endDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      return null;
    }

    return this.mapProject(data);
  }

  static async deleteProject(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting project:', error);
      return false;
    }

    return true;
  }

  private static mapProject(data: any): Project {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      color: data.color,
      tags: data.tags || [],
      archived: data.archived,
      isPermanent: data.is_permanent,
      startDate: data.start_date,
      endDate: data.end_date,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  // ============================================
  // TASKS
  // ============================================

  static async getTasks(): Promise<Task[]> {
    const userId = await this.getUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }

    return data.map(this.mapTask);
  }

  static async createTask(task: Task): Promise<Task | null> {
    const userId = await this.getUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        id: task.id,
        user_id: userId,
        project_id: task.projectId,
        name: task.name,
        description: task.description,
        status: task.status,
        priority: task.priority,
        tags: task.tags,
        start_date: task.startDate,
        end_date: task.endDate,
        estimated_hours: task.estimatedHours,
        completed_at: task.completedAt,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return null;
    }

    return this.mapTask(data);
  }

  static async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        name: updates.name,
        description: updates.description,
        status: updates.status,
        priority: updates.priority,
        tags: updates.tags,
        start_date: updates.startDate,
        end_date: updates.endDate,
        estimated_hours: updates.estimatedHours,
        completed_at: updates.completedAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return null;
    }

    return this.mapTask(data);
  }

  static async deleteTask(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      return false;
    }

    return true;
  }

  private static mapTask(data: any): Task {
    return {
      id: data.id,
      projectId: data.project_id,
      name: data.name,
      description: data.description,
      status: data.status,
      priority: data.priority,
      tags: data.tags || [],
      startDate: data.start_date,
      endDate: data.end_date,
      estimatedHours: data.estimated_hours,
      completedAt: data.completed_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  // ============================================
  // TIME ENTRIES
  // ============================================

  static async getTimeEntries(): Promise<TimeEntry[]> {
    const userId = await this.getUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error fetching time entries:', error);
      return [];
    }

    return data.map(this.mapTimeEntry);
  }

  static async createTimeEntry(entry: TimeEntry): Promise<TimeEntry | null> {
    const userId = await this.getUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('time_entries')
      .insert({
        id: entry.id,
        user_id: userId,
        title: entry.title,
        project_id: entry.projectId,
        task_id: entry.taskId,
        start_time: entry.startTime,
        end_time: entry.endTime,
        duration: entry.duration,
        notes: entry.notes,
        tags: entry.tags,
        activities: entry.activities || [],
        is_running: entry.isRunning || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating time entry:', error);
      return null;
    }

    return this.mapTimeEntry(data);
  }

  static async updateTimeEntry(id: string, updates: Partial<TimeEntry>): Promise<TimeEntry | null> {
    const { data, error } = await supabase
      .from('time_entries')
      .update({
        title: updates.title,
        project_id: updates.projectId,
        task_id: updates.taskId,
        start_time: updates.startTime,
        end_time: updates.endTime,
        duration: updates.duration,
        notes: updates.notes,
        tags: updates.tags,
        activities: updates.activities,
        is_running: updates.isRunning,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating time entry:', error);
      return null;
    }

    return this.mapTimeEntry(data);
  }

  static async deleteTimeEntry(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting time entry:', error);
      return false;
    }

    return true;
  }

  private static mapTimeEntry(data: any): TimeEntry {
    return {
      id: data.id,
      title: data.title,
      projectId: data.project_id,
      taskId: data.task_id,
      startTime: data.start_time,
      endTime: data.end_time,
      duration: data.duration,
      notes: data.notes,
      tags: data.tags || [],
      activities: data.activities || [],
      isRunning: data.is_running,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  // ============================================
  // GOALS
  // ============================================

  static async getGoals(): Promise<Goal[]> {
    const userId = await this.getUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching goals:', error);
      return [];
    }

    return data.map(this.mapGoal);
  }

  static async createGoal(goal: Goal): Promise<Goal | null> {
    const userId = await this.getUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('goals')
      .insert({
        id: goal.id,
        user_id: userId,
        type: goal.type,
        target_hours: goal.targetHours,
        current_hours: goal.currentHours,
        start_date: goal.startDate,
        end_date: goal.endDate,
        project_id: (goal as any).projectId,
        achieved: goal.achieved,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating goal:', error);
      return null;
    }

    return this.mapGoal(data);
  }

  static async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal | null> {
    const { data, error } = await supabase
      .from('goals')
      .update({
        target_hours: updates.targetHours,
        current_hours: updates.currentHours,
        project_id: (updates as any).projectId,
        achieved: updates.achieved,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating goal:', error);
      return null;
    }

    return this.mapGoal(data);
  }

  static async deleteGoal(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting goal:', error);
      return false;
    }

    return true;
  }

  private static mapGoal(data: any): Goal {
    return {
      id: data.id,
      type: data.type,
      targetHours: parseFloat(data.target_hours),
      currentHours: parseFloat(data.current_hours || 0),
      startDate: data.start_date,
      endDate: data.end_date,
      projectId: data.project_id,
      achieved: data.achieved,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as Goal;
  }

  // ============================================
  // REMINDERS
  // ============================================

  static async getReminders(): Promise<Reminder[]> {
    const userId = await this.getUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching reminders:', error);
      return [];
    }

    return data.map(this.mapReminder);
  }

  static async createReminder(reminder: Reminder): Promise<Reminder | null> {
    const userId = await this.getUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('reminders')
      .insert({
        id: reminder.id,
        user_id: userId,
        title: reminder.title,
        description: reminder.description,
        due_date: reminder.dueDate,
        due_time: reminder.dueTime,
        priority: reminder.priority,
        completed: reminder.completed,
        notified: reminder.notified,
        project_id: reminder.projectId,
        task_id: reminder.taskId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating reminder:', error);
      return null;
    }

    return this.mapReminder(data);
  }

  static async updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder | null> {
    const { data, error } = await supabase
      .from('reminders')
      .update({
        title: updates.title,
        description: updates.description,
        due_date: updates.dueDate,
        due_time: updates.dueTime,
        priority: updates.priority,
        completed: updates.completed,
        notified: updates.notified,
        project_id: updates.projectId,
        task_id: updates.taskId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating reminder:', error);
      return null;
    }

    return this.mapReminder(data);
  }

  static async deleteReminder(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting reminder:', error);
      return false;
    }

    return true;
  }

  private static mapReminder(data: any): Reminder {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      dueDate: data.due_date,
      dueTime: data.due_time,
      priority: data.priority,
      completed: data.completed,
      notified: data.notified,
      projectId: data.project_id,
      taskId: data.task_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  // ============================================
  // POMODORO SESSIONS
  // ============================================

  static async getPomodoroSessions(): Promise<PomodoroSession[]> {
    const userId = await this.getUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error fetching pomodoro sessions:', error);
      return [];
    }

    return data.map(this.mapPomodoroSession);
  }

  static async createPomodoroSession(session: PomodoroSession): Promise<PomodoroSession | null> {
    const userId = await this.getUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .insert({
        id: session.id,
        user_id: userId,
        task_id: session.taskId,
        start_time: session.startTime,
        end_time: session.endTime,
        duration: session.duration,
        type: session.type,
        completed: session.completed,
        interrupted: session.interrupted,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pomodoro session:', error);
      return null;
    }

    return this.mapPomodoroSession(data);
  }

  static async updatePomodoroSession(id: string, updates: Partial<PomodoroSession>): Promise<PomodoroSession | null> {
    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .update({
        end_time: updates.endTime,
        duration: updates.duration,
        completed: updates.completed,
        interrupted: updates.interrupted,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating pomodoro session:', error);
      return null;
    }

    return this.mapPomodoroSession(data);
  }

  private static mapPomodoroSession(data: any): PomodoroSession {
    return {
      id: data.id,
      taskId: data.task_id,
      startTime: data.start_time,
      endTime: data.end_time,
      duration: data.duration,
      type: data.type,
      completed: data.completed,
      interrupted: data.interrupted,
      createdAt: data.created_at,
    };
  }

  // ============================================
  // USER SETTINGS
  // ============================================

  static async getUserSettings(): Promise<PomodoroSettings | null> {
    const userId = await this.getUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no settings exist, create default
      if (error.code === 'PGRST116') {
        const defaultSettings: PomodoroSettings = {
          workDuration: 25,
          breakDuration: 5,
          longBreakDuration: 15,
          sessionsUntilLongBreak: 4,
          autoStartBreaks: false,
          autoStartWork: false,
          soundEnabled: true,
        };

        await this.updateUserSettings(defaultSettings);
        return defaultSettings;
      }

      console.error('Error fetching user settings:', error);
      return null;
    }

    return {
      workDuration: data.pomodoro_work_duration,
      breakDuration: data.pomodoro_break_duration,
      longBreakDuration: data.pomodoro_long_break_duration,
      sessionsUntilLongBreak: data.pomodoro_sessions_until_long_break,
      autoStartBreaks: data.pomodoro_auto_start_breaks,
      autoStartWork: data.pomodoro_auto_start_work,
      soundEnabled: data.pomodoro_sound_enabled,
    };
  }

  static async updateUserSettings(settings: Partial<PomodoroSettings>): Promise<boolean> {
    const userId = await this.getUserId();
    if (!userId) return false;

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        pomodoro_work_duration: settings.workDuration,
        pomodoro_break_duration: settings.breakDuration,
        pomodoro_long_break_duration: settings.longBreakDuration,
        pomodoro_sessions_until_long_break: settings.sessionsUntilLongBreak,
        pomodoro_auto_start_breaks: settings.autoStartBreaks,
        pomodoro_auto_start_work: settings.autoStartWork,
        pomodoro_sound_enabled: settings.soundEnabled,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error updating user settings:', error);
      return false;
    }

    return true;
  }
}
