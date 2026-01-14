/**
 * Advanced Filters Component
 * Multi-criteria filtering system
 */

import { useState } from 'react';
import { Filter, X, Calendar, Hash, FolderKanban } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useProjects, useTasks } from '@/hooks';

export interface FilterCriteria {
  projectIds: string[];
  taskIds: string[];
  tags: string[];
  dateFrom?: string;
  dateTo?: string;
  minDuration?: number; // in minutes
  maxDuration?: number;
}

interface AdvancedFiltersProps {
  filters: FilterCriteria;
  onFiltersChange: (filters: FilterCriteria) => void;
  onReset: () => void;
}

export function AdvancedFilters({ filters, onFiltersChange, onReset }: AdvancedFiltersProps) {
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const [open, setOpen] = useState(false);

  // Get all unique tags
  const allTags = Array.from(
    new Set([
      ...projects.flatMap(p => p.tags),
      ...tasks.flatMap(t => t.tags),
    ])
  );

  const handleProjectToggle = (projectId: string) => {
    const newIds = filters.projectIds.includes(projectId)
      ? filters.projectIds.filter(id => id !== projectId)
      : [...filters.projectIds, projectId];
    onFiltersChange({ ...filters, projectIds: newIds });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: newTags });
  };

  const activeFilterCount = 
    filters.projectIds.length +
    filters.taskIds.length +
    filters.tags.length +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.minDuration ? 1 : 0) +
    (filters.maxDuration ? 1 : 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filtros Avançados
          {activeFilterCount > 0 && (
            <Badge variant="default" className="ml-2">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filtros Avançados</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Projects Filter */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4" />
              Projetos
            </Label>
            <div className="flex flex-wrap gap-2">
              {projects.map(project => (
                <Badge
                  key={project.id}
                  variant={filters.projectIds.includes(project.id) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleProjectToggle(project.id)}
                >
                  <div
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: project.color }}
                  />
                  {project.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Tags
              </Label>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleTagToggle(tag)}
                  >
                    <Hash className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Date Range */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Período
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">De:</Label>
                <Input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={e => onFiltersChange({ ...filters, dateFrom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Até:</Label>
                <Input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={e => onFiltersChange({ ...filters, dateTo: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Duration Range */}
          <div className="space-y-3">
            <Label>Duração (minutos)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Mínimo:</Label>
                <Input
                  type="number"
                  value={filters.minDuration || ''}
                  onChange={e => onFiltersChange({ ...filters, minDuration: parseInt(e.target.value) || undefined })}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Máximo:</Label>
                <Input
                  type="number"
                  value={filters.maxDuration || ''}
                  onChange={e => onFiltersChange({ ...filters, maxDuration: parseInt(e.target.value) || undefined })}
                  placeholder="999"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => {
                onReset();
                setOpen(false);
              }}
            >
              <X className="w-4 h-4" />
              Limpar Filtros
            </Button>
            <Button
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
