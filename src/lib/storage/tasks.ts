/**
 * Task storage manager
 * Handles CRUD operations for tasks
 */

import { Task } from '@/types';
import { BaseStorageManager } from './base';

class TaskStorageManager extends BaseStorageManager<Task> {
  constructor() {
    super('timeflow_tasks');
  }

  /**
   * Get all tasks
   */
  getAllTasks(): Task[] {
    return this.getAll();
  }

  /**
   * Get tasks by project
   */
  getTasksByProject(projectId: string): Task[] {
    return this.getAll().filter(t => t.projectId === projectId);
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: Task['status']): Task[] {
    return this.getAll().filter(t => t.status === status);
  }

  /**
   * Get tasks by priority
   */
  getTasksByPriority(priority: Task['priority']): Task[] {
    return this.getAll().filter(t => t.priority === priority);
  }

  /**
   * Get active tasks (todo or in-progress)
   */
  getActiveTasks(): Task[] {
    return this.getAll().filter(t => t.status !== 'done');
  }

  /**
   * Get completed tasks
   */
  getCompletedTasks(): Task[] {
    return this.getAll().filter(t => t.status === 'done');
  }

  /**
   * Mark task as complete
   */
  completeTask(id: string): Task | undefined {
    return this.update(id, {
      status: 'done',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Mark task as in progress
   */
  startTask(id: string): Task | undefined {
    return this.update(id, {
      status: 'in-progress',
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Get tasks by tag
   */
  getTasksByTag(tag: string): Task[] {
    return this.getAll().filter(t => t.tags.includes(tag));
  }

  /**
   * Search tasks by name
   */
  searchTasks(query: string): Task[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Delete all tasks from a project
   */
  deleteProjectTasks(projectId: string): void {
    const tasks = this.getAll();
    const filtered = tasks.filter(t => t.projectId !== projectId);
    this.saveAll(filtered);
  }

  /**
   * Get task statistics
   */
  getTaskStats(projectId?: string): {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
  } {
    let tasks = this.getAll();
    
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
}

export const taskStorage = new TaskStorageManager();
