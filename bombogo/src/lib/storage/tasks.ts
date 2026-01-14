/**
 * Task storage manager
 * Handles CRUD operations for tasks with Supabase integration
 */

import { Task } from '@/types';
import { SupabaseService } from '../supabase-service';

class TaskStorageManager {
  private cache: Task[] = [];
  private lastFetch: number = 0;
  private cacheDuration = 30000; // 30 seconds

  /**
   * Get all tasks from Supabase
   */
  async getAll(): Promise<Task[]> {
    const now = Date.now();
    if (this.cache.length > 0 && now - this.lastFetch < this.cacheDuration) {
      return this.cache;
    }

    const tasks = await SupabaseService.getTasks();
    this.cache = tasks;
    this.lastFetch = now;
    return tasks;
  }

  /**
   * Get task by ID
   */
  async getById(id: string): Promise<Task | undefined> {
    const tasks = await this.getAll();
    return tasks.find(t => t.id === id);
  }

  /**
   * Create new task
   */
  async create(task: Task): Promise<Task> {
    const created = await SupabaseService.createTask(task);
    if (created) {
      this.cache.push(created);
    }
    return created || task;
  }

  /**
   * Update task
   */
  async update(id: string, updates: Partial<Task>): Promise<Task | undefined> {
    const updated = await SupabaseService.updateTask(id, updates);
    if (updated) {
      const index = this.cache.findIndex(t => t.id === id);
      if (index !== -1) {
        this.cache[index] = updated;
      }
    }
    return updated;
  }

  /**
   * Delete task
   */
  async delete(id: string): Promise<boolean> {
    const success = await SupabaseService.deleteTask(id);
    if (success) {
      this.cache = this.cache.filter(t => t.id !== id);
    }
    return success;
  }

  /**
   * Get all tasks
   */
  async getAllTasks(): Promise<Task[]> {
    return this.getAll();
  }

  /**
   * Get tasks by project
   */
  async getTasksByProject(projectId: string): Promise<Task[]> {
    const tasks = await this.getAll();
    return tasks.filter(t => t.projectId === projectId);
  }

  /**
   * Get tasks by status
   */
  async getTasksByStatus(status: Task['status']): Promise<Task[]> {
    const tasks = await this.getAll();
    return tasks.filter(t => t.status === status);
  }

  /**
   * Get tasks by priority
   */
  async getTasksByPriority(priority: Task['priority']): Promise<Task[]> {
    const tasks = await this.getAll();
    return tasks.filter(t => t.priority === priority);
  }

  /**
   * Get active tasks (todo or in-progress)
   */
  async getActiveTasks(): Promise<Task[]> {
    const tasks = await this.getAll();
    return tasks.filter(t => t.status !== 'done');
  }

  /**
   * Get completed tasks
   */
  async getCompletedTasks(): Promise<Task[]> {
    const tasks = await this.getAll();
    return tasks.filter(t => t.status === 'done');
  }

  /**
   * Mark task as complete
   */
  async completeTask(id: string): Promise<Task | undefined> {
    return this.update(id, {
      status: 'done',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Mark task as in progress
   */
  async startTask(id: string): Promise<Task | undefined> {
    return this.update(id, {
      status: 'in-progress',
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Get tasks by tag
   */
  async getTasksByTag(tag: string): Promise<Task[]> {
    const tasks = await this.getAll();
    return tasks.filter(t => t.tags.includes(tag));
  }

  /**
   * Search tasks by name
   */
  async searchTasks(query: string): Promise<Task[]> {
    const tasks = await this.getAll();
    const lowerQuery = query.toLowerCase();
    return tasks.filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Delete all tasks from a project
   */
  async deleteProjectTasks(projectId: string): Promise<void> {
    const tasks = await this.getAll();
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    
    for (const task of projectTasks) {
      await this.delete(task.id);
    }
  }

  /**
   * Get task statistics
   */
  async getTaskStats(projectId?: string): Promise<{
    total: number;
    todo: number;
    inProgress: number;
    done: number;
  }> {
    let tasks = await this.getAll();
    
    if (projectId) {
      tasks = tasks.filter(t => t.projectId === projectId);
    }

    return {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      done: tasks.filter(t => t.status === 'done').length,
    };
  }

  /**
   * Clear cache (force refresh)
   */
  clearCache(): void {
    this.cache = [];
    this.lastFetch = 0;
  }
}

export const taskStorage = new TaskStorageManager();
