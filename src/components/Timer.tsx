/**
 * Timer component
 * Active timer display with controls
 */

import { useEffect, useRef } from 'react';
import { Play, Square, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { formatDuration } from '@/lib/utils';
import { useTimer } from '@/hooks';
import { projectStorage, taskStorage } from '@/lib/storage';
import { cn } from '@/lib/utils';
import gsap from 'gsap';

interface TimerProps {
  onStart?: () => void;
  onStop?: () => void;
}

export function Timer({ onStart, onStop }: TimerProps) {
  const { runningEntry, currentDuration, isRunning, stopTimer } = useTimer();
  const cardRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const project = runningEntry ? projectStorage.getById(runningEntry.projectId) : null;
  const task = runningEntry?.taskId ? taskStorage.getById(runningEntry.taskId) : null;

  // Animate on mount
  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
      );
    }
  }, []);

  // Pulse animation when running
  useEffect(() => {
    if (isRunning && buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 1.05,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
      });
    }

    return () => {
      if (buttonRef.current) {
        gsap.killTweensOf(buttonRef.current);
        gsap.set(buttonRef.current, { scale: 1 });
      }
    };
  }, [isRunning]);

  const handleStop = () => {
    stopTimer();
    onStop?.();
  };

  const handleStart = () => {
    onStart?.();
  };

  if (!isRunning) {
    return (
      <Card
        ref={cardRef}
        className="p-6 text-center border-dashed card-hover cursor-pointer"
        onClick={handleStart}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Nenhum timer ativo</h3>
            <p className="text-sm text-muted-foreground">
              Clique para iniciar um novo timer
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card ref={cardRef} className={cn('p-6', isRunning && 'timer-active')}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div
            className="w-3 h-3 rounded-full bg-success animate-pulse"
            style={{ animationDuration: '2s' }}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {project && (
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
              )}
              <h3 className="font-semibold">{project?.name || 'Unknown Project'}</h3>
            </div>
            {task && (
              <p className="text-sm text-muted-foreground">{task.name}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-3xl font-mono font-bold gradient-text">
            {formatDuration(currentDuration)}
          </div>
          <Button
            ref={buttonRef}
            size="lg"
            variant="destructive"
            onClick={handleStop}
            className="gap-2"
          >
            <Square className="w-4 h-4" />
            Parar
          </Button>
        </div>
      </div>

      {runningEntry?.tags && runningEntry.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {runningEntry.tags.map((tag, index) => (
            <span
              key={index}
              className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
