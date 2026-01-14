/**
 * Task Card component
 * Displays task information
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Clock, Play, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Task } from '@/types';
import { timeEntryStorage, projectStorage } from '@/lib/storage';
import { formatHours, cn } from '@/lib/utils';
import gsap from 'gsap';

interface TaskCardProps {
  task: Task;
  onEdit?: () => void;
  onDelete?: () => void;
  onComplete?: () => void;
  onStart?: () => void;
  onStartTimer?: () => void;
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onComplete,
  onStart,
  onStartTimer,
}: TaskCardProps) {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const totalHours = timeEntryStorage.getTaskTotalHours(task.id);
  const project = projectStorage.getById(task.projectId);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, []);

  const statusConfig = {
    'todo': { icon: Circle, label: 'A fazer', color: 'text-muted-foreground' },
    'in-progress': { icon: AlertCircle, label: 'Em progresso', color: 'text-warning' },
    'done': { icon: CheckCircle2, label: 'Concluída', color: 'text-success' },
  };

  const priorityConfig = {
    'low': { label: 'Baixa', variant: 'secondary' as const },
    'medium': { label: 'Média', variant: 'default' as const },
    'high': { label: 'Alta', variant: 'destructive' as const },
  };

  const StatusIcon = statusConfig[task.status].icon;

  return (
    <Card 
      ref={cardRef} 
      className="p-4 card-hover cursor-pointer" 
      onClick={() => navigate(`/tasks/${task.id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <StatusIcon className={cn('w-5 h-5 mt-0.5', statusConfig[task.status].color)} />
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              'font-semibold mb-1',
              task.status === 'done' && 'line-through text-muted-foreground'
            )}>
              {task.name}
            </h3>
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onStartTimer && task.status !== 'done' && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStartTimer(); }}>
                <Play className="w-4 h-4 mr-2" />
                Iniciar Timer
              </DropdownMenuItem>
            )}
            {onStart && task.status === 'todo' && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStart(); }}>
                Iniciar Tarefa
              </DropdownMenuItem>
            )}
            {onComplete && task.status !== 'done' && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onComplete(); }}>
                Marcar como Concluída
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                Editar
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-destructive">
                Deletar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {project && (
          <div className="flex items-center gap-2 text-sm">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            <span className="text-muted-foreground">{project.name}</span>
          </div>
        )}

        <Badge variant={priorityConfig[task.priority].variant} className="text-xs">
          {priorityConfig[task.priority].label}
        </Badge>

        {totalHours > 0 && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{formatHours(totalHours)}</span>
          </div>
        )}
      </div>

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {task.tags.map((tag, index) => (
            <span
              key={index}
              className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
