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

  const loadProjects = useCallback(() => {
    const allProjects = projectStorage.getActiveProjects();
    setProjects(allProjects);
    setLoading(false);
  }, []);

  const createProject = useCallback((data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'archived'>) => {
    const now = new Date().toISOString();
    const project: Project = {
      id: generateId('project'),
      ...data,
      color: data.color || generateProjectColor(),
      createdAt: now,
      updatedAt: now,
      archived: false,
    };

    projectStorage.create(project);
    loadProjects();
    return project;
  }, [loadProjects]);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    projectStorage.update(id, { ...updates, updatedAt: new Date().toISOString() });
    loadProjects();
  }, [loadProjects]);

  const deleteProject = useCallback((id: string) => {
    projectStorage.delete(id);
    loadProjects();
  }, [loadProjects]);

  const archiveProject = useCallback((id: string) => {
    projectStorage.archiveProject(id);
    loadProjects();
  }, [loadProjects]);

  const getProjectById = useCallback((id: string) => {
    return projectStorage.getById(id);
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
