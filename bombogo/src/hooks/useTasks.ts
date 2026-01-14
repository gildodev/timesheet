/**
 * Tasks hook
 * Manages task state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/types';
import { taskStorage } from '@/lib/storage';
import { generateId } from '@/lib/utils';

export function useTasks(projectId?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Load tasks on mount or when projectId changes
  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const loadTasks = useCallback(async () => {
    try {
      const allTasks = projectId 
        ? await taskStorage.getTasksByProject(projectId)
        : await taskStorage.getAllTasks();
      setTasks(allTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const createTask = useCallback(async (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const task: Task = {
      id: generateId('task'),
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    await taskStorage.create(task);
    await loadTasks();
    return task;
  }, [loadTasks]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    await taskStorage.update(id, { ...updates, updatedAt: new Date().toISOString() });
    await loadTasks();
  }, [loadTasks]);

  const deleteTask = useCallback(async (id: string) => {
    await taskStorage.delete(id);
    await loadTasks();
  }, [loadTasks]);

  const completeTask = useCallback(async (id: string) => {
    await taskStorage.completeTask(id);
    await loadTasks();
  }, [loadTasks]);

  const startTask = useCallback(async (id: string) => {
    await taskStorage.startTask(id);
    await loadTasks();
  }, [loadTasks]);

  const getTaskById = useCallback(async (id: string) => {
    return await taskStorage.getById(id);
  }, []);

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    startTask,
    getTaskById,
    refresh: loadTasks,
  };
}
