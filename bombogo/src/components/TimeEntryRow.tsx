/**
 * Time Entry Row component
 * Displays time entry in timesheet
 */

import { useState } from 'react';
import { MoreVertical, Clock, Edit2, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { TimeEntry } from '@/types';
import { projectStorage, taskStorage } from '@/lib/storage';
import { formatDuration, formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface TimeEntryRowProps {
  entry: TimeEntry;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TimeEntryRow({ entry, onEdit, onDelete }: TimeEntryRowProps) {
  const [isHovered, setIsHovered] = useState(false);
  const project = projectStorage.getById(entry.projectId);
  const task = entry.taskId ? taskStorage.getById(entry.taskId) : null;

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 rounded-lg border transition-all',
        isHovered && 'bg-secondary/50 border-primary/50'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {project && (
          <div
            className="w-1 h-12 rounded-full shrink-0"
            style={{ backgroundColor: project.color }}
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {project && (
              <span className="font-medium">{project.name}</span>
            )}
            {task && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground truncate">
                  {task.name}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDateTime(entry.startTime)}</span>
            </div>
            {entry.notes && (
              <span className="truncate">{entry.notes}</span>
            )}
          </div>

          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {entry.tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <div className="text-lg font-mono font-semibold">
            {formatDuration(entry.duration)}
          </div>
          <div className="text-xs text-muted-foreground">
            {(entry.duration / 3600).toFixed(2)}h
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <Edit2 className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
