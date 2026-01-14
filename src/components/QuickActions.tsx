/**
 * Quick Actions Bar
 * Floating action bar for quick access
 */

import { useState } from 'react';
import { Plus, Play, Clock, FolderKanban, CheckSquare, Search, Hash } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip } from './ui/tooltip';
import { cn } from '@/lib/utils';

interface QuickActionsProps {
  onNewProject: () => void;
  onNewTask: () => void;
  onStartTimer: () => void;
  onOpenTimesheet: () => void;
  onOpenSearch: () => void;
  onOpenTagManager: () => void;
}

export function QuickActions({
  onNewProject,
  onNewTask,
  onStartTimer,
  onOpenTimesheet,
  onOpenSearch,
  onOpenTagManager,
}: QuickActionsProps) {
  const [expanded, setExpanded] = useState(false);

  const actions = [
    { icon: FolderKanban, label: 'Novo Projeto', action: onNewProject, color: 'bg-primary' },
    { icon: CheckSquare, label: 'Nova Tarefa', action: onNewTask, color: 'bg-success' },
    { icon: Clock, label: 'Timesheet', action: onOpenTimesheet, color: 'bg-warning' },
    { icon: Search, label: 'Buscar', action: onOpenSearch, color: 'bg-accent' },
    { icon: Hash, label: 'Tags', action: onOpenTagManager, color: 'bg-secondary' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3">
      {/* Quick action buttons */}
      <div
        className={cn(
          'flex flex-col-reverse gap-2 transition-all duration-300',
          expanded ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        )}
      >
        {actions.map((action, index) => (
          <Button
            key={index}
            size="lg"
            className={cn(
              'gap-2 shadow-lg hover:shadow-xl transition-all',
              action.color
            )}
            onClick={() => {
              action.action();
              setExpanded(false);
            }}
          >
            <action.icon className="w-5 h-5" />
            <span className="hidden sm:inline">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Main toggle button */}
      <Button
        size="lg"
        className={cn(
          'w-14 h-14 rounded-full shadow-2xl transition-all hover:scale-110',
          expanded && 'rotate-45'
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Start Timer FAB */}
      {!expanded && (
        <Button
          size="lg"
          className="gap-2 shadow-lg bg-gradient-to-r from-primary to-accent hover:shadow-xl transition-all hover:scale-105"
          onClick={onStartTimer}
        >
          <Play className="w-5 h-5" />
          <span className="hidden sm:inline">Iniciar Timer</span>
        </Button>
      )}
    </div>
  );
}
