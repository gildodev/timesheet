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

  const loadTasks = useCallback(() => {
    const allTasks = projectId 
      ? taskStorage.getTasksByProject(projectId)
      : taskStorage.getAllTasks();
    setTasks(allTasks);
    setLoading(false);
  }, [projectId]);

  const createTask = useCallback((data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const task: Task = {
      id: generateId('task'),
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    taskStorage.create(task);
    loadTasks();
    return task;
  }, [loadTasks]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    taskStorage.update(id, { ...updates, updatedAt: new Date().toISOString() });
    loadTasks();
  }, [loadTasks]);

  const deleteTask = useCallback((id: string) => {
    taskStorage.delete(id);
    loadTasks();
  }, [loadTasks]);

  const completeTask = useCallback((id: string) => {
    taskStorage.completeTask(id);
    loadTasks();
  }, [loadTasks]);

  const startTask = useCallback((id: string) => {
    taskStorage.startTask(id);
    loadTasks();
  }, [loadTasks]);

  const getTaskById = useCallback((id: string) => {
    return taskStorage.getById(id);
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
