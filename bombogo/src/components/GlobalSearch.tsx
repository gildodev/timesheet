/**
 * Global Search Component
 * Search across all app data
 */

import { useState, useEffect, useRef } from 'react';
import { Search, Clock, FolderKanban, CheckSquare, X } from 'lucide-react';
import { Dialog, DialogContent } from './ui/dialog';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useNavigate } from 'react-router-dom';
import { useProjects, useTasks } from '@/hooks';
import { timeEntryStorage } from '@/lib/storage';
import { formatDurationHuman } from '@/lib/utils';
import gsap from 'gsap';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    projects: typeof projects;
    tasks: typeof tasks;
    entries: any[];
  }>({ projects: [], tasks: [], entries: [] });

  const resultsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ projects: [], tasks: [], entries: [] });
      return;
    }

    const searchQuery = query.toLowerCase();

    // Search projects
    const matchedProjects = projects.filter(
      p =>
        p.name.toLowerCase().includes(searchQuery) ||
        p.description?.toLowerCase().includes(searchQuery) ||
        p.tags.some(t => t.toLowerCase().includes(searchQuery))
    );

    // Search tasks
    const matchedTasks = tasks.filter(
      t =>
        t.name.toLowerCase().includes(searchQuery) ||
        t.description?.toLowerCase().includes(searchQuery) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchQuery))
    );

    // Search time entries
    const allEntries = timeEntryStorage.getAll();
    const matchedEntries = allEntries
      .filter(e => e.notes?.toLowerCase().includes(searchQuery))
      .slice(0, 5);

    setResults({
      projects: matchedProjects.slice(0, 5),
      tasks: matchedTasks.slice(0, 10),
      entries: matchedEntries,
    });
  }, [query, projects, tasks]);

  useEffect(() => {
    if (resultsRef.current && results.projects.length + results.tasks.length > 0) {
      const items = resultsRef.current.querySelectorAll('.search-result-item');
      gsap.fromTo(
        items,
        { x: -10, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.2, stagger: 0.05 }
      );
    }
  }, [results]);

  const handleSelectProject = (projectId: string) => {
    navigate('/projects');
    onOpenChange(false);
    setQuery('');
  };

  const handleSelectTask = (taskId: string) => {
    navigate('/tasks');
    onOpenChange(false);
    setQuery('');
  };

  const totalResults =
    results.projects.length + results.tasks.length + results.entries.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        {/* Search Input */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar projetos, tarefas, entradas..."
              className="pl-10 pr-10 h-12 text-base"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div
          ref={resultsRef}
          className="max-h-[400px] overflow-y-auto custom-scrollbar p-4 space-y-4"
        >
          {!query ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Digite para buscar</p>
              <p className="text-xs mt-1">Projetos · Tarefas · Entradas de Tempo</p>
            </div>
          ) : totalResults === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhum resultado encontrado</p>
              <p className="text-xs mt-1">Tente outro termo de busca</p>
            </div>
          ) : (
            <>
              {/* Projects */}
              {results.projects.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                    Projetos ({results.projects.length})
                  </h3>
                  <div className="space-y-1">
                    {results.projects.map(project => (
                      <div
                        key={project.id}
                        onClick={() => handleSelectProject(project.id)}
                        className="search-result-item flex items-center gap-3 p-3 rounded-lg hover:bg-secondary cursor-pointer transition-colors"
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: project.color + '20' }}
                        >
                          <FolderKanban
                            className="w-4 h-4"
                            style={{ color: project.color }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{project.name}</p>
                          {project.description && (
                            <p className="text-sm text-muted-foreground truncate">
                              {project.description}
                            </p>
                          )}
                        </div>
                        {project.tags.length > 0 && (
                          <div className="flex gap-1">
                            {project.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks */}
              {results.tasks.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                    Tarefas ({results.tasks.length})
                  </h3>
                  <div className="space-y-1">
                    {results.tasks.map(task => {
                      const project = projects.find(p => p.id === task.projectId);
                      return (
                        <div
                          key={task.id}
                          onClick={() => handleSelectTask(task.id)}
                          className="search-result-item flex items-center gap-3 p-3 rounded-lg hover:bg-secondary cursor-pointer transition-colors"
                        >
                          <CheckSquare className="w-4 h-4 text-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{task.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {project?.name || 'Projeto desconhecido'}
                            </p>
                          </div>
                          <Badge
                            variant={
                              task.status === 'done'
                                ? 'default'
                                : task.status === 'in-progress'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {task.status === 'done'
                              ? 'Concluída'
                              : task.status === 'in-progress'
                              ? 'Em progresso'
                              : 'A fazer'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Time Entries */}
              {results.entries.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                    Entradas de Tempo ({results.entries.length})
                  </h3>
                  <div className="space-y-1">
                    {results.entries.map(entry => {
                      const project = projects.find(p => p.id === entry.projectId);
                      return (
                        <div
                          key={entry.id}
                          className="search-result-item flex items-center gap-3 p-3 rounded-lg"
                        >
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{project?.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {entry.notes}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDurationHuman(entry.duration)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Keyboard Shortcut Hint */}
        <div className="border-t p-3 bg-secondary/30">
          <p className="text-xs text-muted-foreground text-center">
            Pressione <kbd className="px-2 py-1 bg-background rounded text-foreground">Esc</kbd>{' '}
            para fechar
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
