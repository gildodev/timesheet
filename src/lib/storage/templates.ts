/**
 * Project Templates Storage Manager
 * Handles CRUD operations for project templates
 */

import { generateId } from '../utils';

export interface ProjectTemplate {
  id: string;
  name: string;
  description?: string;
  color: string;
  tags: string[];
  defaultTasks: {
    name: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    estimatedHours?: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

class TemplateStorageManager {
  private storageKey = 'timeflow_templates';

  /**
   * Get all templates
   */
  getAll(): ProjectTemplate[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Get template by ID
   */
  getById(id: string): ProjectTemplate | undefined {
    return this.getAll().find(t => t.id === id);
  }

  /**
   * Create new template
   */
  create(data: Omit<ProjectTemplate, 'id' | 'createdAt' | 'updatedAt'>): ProjectTemplate {
    const template: ProjectTemplate = {
      ...data,
      id: generateId('template'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const templates = this.getAll();
    templates.push(template);
    localStorage.setItem(this.storageKey, JSON.stringify(templates));

    return template;
  }

  /**
   * Update template
   */
  update(id: string, data: Partial<ProjectTemplate>): ProjectTemplate | undefined {
    const templates = this.getAll();
    const index = templates.findIndex(t => t.id === id);

    if (index === -1) return undefined;

    templates[index] = {
      ...templates[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(this.storageKey, JSON.stringify(templates));
    return templates[index];
  }

  /**
   * Delete template
   */
  delete(id: string): boolean {
    const templates = this.getAll();
    const filtered = templates.filter(t => t.id !== id);

    if (filtered.length === templates.length) return false;

    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    return true;
  }

  /**
   * Create default templates
   */
  createDefaults(): void {
    const existing = this.getAll();
    if (existing.length > 0) return;

    const defaults: Omit<ProjectTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Desenvolvimento Web',
        description: 'Template para projetos de desenvolvimento web',
        color: '#3b82f6',
        tags: ['desenvolvimento', 'web'],
        defaultTasks: [
          { name: 'Configuração inicial', priority: 'high', estimatedHours: 2 },
          { name: 'Design UI/UX', priority: 'high', estimatedHours: 8 },
          { name: 'Desenvolvimento Frontend', priority: 'high', estimatedHours: 20 },
          { name: 'Desenvolvimento Backend', priority: 'high', estimatedHours: 20 },
          { name: 'Testes', priority: 'medium', estimatedHours: 8 },
          { name: 'Deploy', priority: 'medium', estimatedHours: 4 },
        ],
      },
      {
        name: 'Estudos',
        description: 'Template para organizar estudos',
        color: '#10b981',
        tags: ['estudo', 'aprendizado'],
        defaultTasks: [
          { name: 'Leitura de material', priority: 'high', estimatedHours: 5 },
          { name: 'Fazer exercícios', priority: 'high', estimatedHours: 5 },
          { name: 'Projeto prático', priority: 'medium', estimatedHours: 10 },
          { name: 'Revisão', priority: 'low', estimatedHours: 3 },
        ],
      },
      {
        name: 'Marketing Digital',
        description: 'Template para campanhas de marketing',
        color: '#f59e0b',
        tags: ['marketing', 'digital'],
        defaultTasks: [
          { name: 'Pesquisa de mercado', priority: 'high', estimatedHours: 4 },
          { name: 'Criação de conteúdo', priority: 'high', estimatedHours: 8 },
          { name: 'Design de artes', priority: 'medium', estimatedHours: 6 },
          { name: 'Publicação e monitoramento', priority: 'medium', estimatedHours: 4 },
          { name: 'Análise de resultados', priority: 'low', estimatedHours: 2 },
        ],
      },
      {
        name: 'Projeto Pessoal',
        description: 'Template genérico para projetos pessoais',
        color: '#8b5cf6',
        tags: ['pessoal'],
        defaultTasks: [
          { name: 'Planejamento', priority: 'high', estimatedHours: 2 },
          { name: 'Execução', priority: 'high', estimatedHours: 10 },
          { name: 'Revisão e ajustes', priority: 'medium', estimatedHours: 3 },
        ],
      },
    ];

    defaults.forEach(template => this.create(template));
  }
}

export const templateStorage = new TemplateStorageManager();
