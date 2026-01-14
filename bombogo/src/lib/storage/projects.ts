/**
 * Project storage manager
 * Handles CRUD operations for projects with Supabase integration
 */

import { Project } from '@/types';
import { SupabaseService } from '../supabase-service';

class ProjectStorageManager {
  private cache: Project[] = [];
  private lastFetch: number = 0;
  private cacheDuration = 30000; // 30 seconds

  /**
   * Get all projects from Supabase
   */
  async getAll(): Promise<Project[]> {
    const now = Date.now();
    if (this.cache.length > 0 && now - this.lastFetch < this.cacheDuration) {
      return this.cache;
    }

    const projects = await SupabaseService.getProjects();
    this.cache = projects;
    this.lastFetch = now;
    return projects;
  }

  /**
   * Get project by ID
   */
  async getById(id: string): Promise<Project | undefined> {
    const projects = await this.getAll();
    return projects.find(p => p.id === id);
  }

  /**
   * Create new project
   */
  async create(project: Project): Promise<Project> {
    const created = await SupabaseService.createProject(project);
    if (created) {
      this.cache.push(created);
    }
    return created || project;
  }

  /**
   * Update project
   */
  async update(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const updated = await SupabaseService.updateProject(id, updates);
    if (updated) {
      const index = this.cache.findIndex(p => p.id === id);
      if (index !== -1) {
        this.cache[index] = updated;
      }
    }
    return updated;
  }

  /**
   * Delete project
   */
  async delete(id: string): Promise<boolean> {
    const success = await SupabaseService.deleteProject(id);
    if (success) {
      this.cache = this.cache.filter(p => p.id !== id);
    }
    return success;
  }

  /**
   * Get all projects (including archived)
   */
  async getAllProjects(): Promise<Project[]> {
    return this.getAll();
  }

  /**
   * Get active projects only
   */
  async getActiveProjects(): Promise<Project[]> {
    const projects = await this.getAll();
    return projects.filter(p => !p.archived);
  }

  /**
   * Get archived projects
   */
  async getArchivedProjects(): Promise<Project[]> {
    const projects = await this.getAll();
    return projects.filter(p => p.archived);
  }

  /**
   * Get projects by tag
   */
  async getProjectsByTag(tag: string): Promise<Project[]> {
    const projects = await this.getAll();
    return projects.filter(p => p.tags.includes(tag));
  }

  /**
   * Search projects by name
   */
  async searchProjects(query: string): Promise<Project[]> {
    const projects = await this.getAll();
    const lowerQuery = query.toLowerCase();
    return projects.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Archive a project
   */
  async archiveProject(id: string): Promise<Project | undefined> {
    return this.update(id, { archived: true, updatedAt: new Date().toISOString() });
  }

  /**
   * Unarchive a project
   */
  async unarchiveProject(id: string): Promise<Project | undefined> {
    return this.update(id, { archived: false, updatedAt: new Date().toISOString() });
  }

  /**
   * Get all unique tags from projects
   */
  async getAllTags(): Promise<string[]> {
    const projects = await this.getAll();
    const tags = new Set<string>();
    
    projects.forEach(project => {
      project.tags.forEach(tag => tags.add(tag));
    });

    return Array.from(tags).sort();
  }

  /**
   * Get project colors for UI
   */
  async getProjectColors(): Promise<Record<string, string>> {
    const projects = await this.getAll();
    const colors: Record<string, string> = {};
    
    projects.forEach(project => {
      colors[project.id] = project.color;
    });

    return colors;
  }

  /**
   * Clear cache (force refresh)
   */
  clearCache(): void {
    this.cache = [];
    this.lastFetch = 0;
  }
}

export const projectStorage = new ProjectStorageManager();
