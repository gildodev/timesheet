/**
 * Project storage manager
 * Handles CRUD operations for projects
 */

import { Project } from '@/types';
import { BaseStorageManager } from './base';

class ProjectStorageManager extends BaseStorageManager<Project> {
  constructor() {
    super('timeflow_projects');
  }

  /**
   * Get all projects (including archived)
   */
  getAllProjects(): Project[] {
    return this.getAll();
  }

  /**
   * Get active projects only
   */
  getActiveProjects(): Project[] {
    return this.getAll().filter(p => !p.archived);
  }

  /**
   * Get archived projects
   */
  getArchivedProjects(): Project[] {
    return this.getAll().filter(p => p.archived);
  }

  /**
   * Get projects by tag
   */
  getProjectsByTag(tag: string): Project[] {
    return this.getAll().filter(p => p.tags.includes(tag));
  }

  /**
   * Search projects by name
   */
  searchProjects(query: string): Project[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Archive a project
   */
  archiveProject(id: string): Project | undefined {
    return this.update(id, { archived: true, updatedAt: new Date().toISOString() });
  }

  /**
   * Unarchive a project
   */
  unarchiveProject(id: string): Project | undefined {
    return this.update(id, { archived: false, updatedAt: new Date().toISOString() });
  }

  /**
   * Get all unique tags from projects
   */
  getAllTags(): string[] {
    const projects = this.getAll();
    const tags = new Set<string>();
    
    projects.forEach(project => {
      project.tags.forEach(tag => tags.add(tag));
    });

    return Array.from(tags).sort();
  }

  /**
   * Get project colors for UI
   */
  getProjectColors(): Record<string, string> {
    const projects = this.getAll();
    const colors: Record<string, string> = {};
    
    projects.forEach(project => {
      colors[project.id] = project.color;
    });

    return colors;
  }
}

export const projectStorage = new ProjectStorageManager();
