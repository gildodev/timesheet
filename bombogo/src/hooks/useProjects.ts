/**
 * Projects hook
 * Manages project state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { Project } from '@/types';
import { projectStorage } from '@/lib/storage';
import { generateProjectColor, generateId } from '@/lib/utils';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const allProjects = await projectStorage.getActiveProjects();
      setProjects(allProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(async (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'archived'>) => {
    const now = new Date().toISOString();
    const project: Project = {
      id: generateId('project'),
      ...data,
      color: data.color || generateProjectColor(),
      createdAt: now,
      updatedAt: now,
      archived: false,
    };

    await projectStorage.create(project);
    await loadProjects();
    return project;
  }, [loadProjects]);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    await projectStorage.update(id, { ...updates, updatedAt: new Date().toISOString() });
    await loadProjects();
  }, [loadProjects]);

  const deleteProject = useCallback(async (id: string) => {
    await projectStorage.delete(id);
    await loadProjects();
  }, [loadProjects]);

  const archiveProject = useCallback(async (id: string) => {
    await projectStorage.archiveProject(id);
    await loadProjects();
  }, [loadProjects]);

  const getProjectById = useCallback(async (id: string) => {
    return await projectStorage.getById(id);
  }, []);

  return {
    projects,
    loading,
    createProject,
    updateProject,
    deleteProject,
    archiveProject,
    getProjectById,
    refresh: loadProjects,
  };
}
