/**
 * Goal Tracker component (Premium)
 * Displays and tracks productivity goals
 */

import { useEffect, useState } from 'react';
import { Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Goal } from '@/types';
import { goalStorage, timeEntryStorage } from '@/lib/storage';
import { formatHours, cn } from '@/lib/utils';

interface GoalTrackerProps {
  type: Goal['type'];
}

export function GoalTracker({ type }: GoalTrackerProps) {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [currentHours, setCurrentHours] = useState(0);

  useEffect(() => {
    let activeGoal: Goal | undefined;

    switch (type) {
      case 'daily':
        activeGoal = goalStorage.getActiveDailyGoal();
        break;
      case 'weekly':
        activeGoal = goalStorage.getActiveWeeklyGoal();
        break;
      case 'monthly':
        activeGoal = goalStorage.getActiveMonthlyGoal();
        break;
    }

    setGoal(activeGoal || null);

    if (activeGoal) {
      const startDate = new Date(activeGoal.startDate);
      const endDate = new Date(activeGoal.endDate);
      const entries = timeEntryStorage.getEntriesByDateRange(startDate, endDate);

      let filteredEntries = entries;
      if (activeGoal.projectId) {
        filteredEntries = entries.filter((e) => e.projectId === activeGoal.projectId);
      }

      const totalSeconds = timeEntryStorage.calculateTotalDuration(filteredEntries);
      setCurrentHours(totalSeconds / 3600);
    }
  }, [type]);

  if (!goal) {
    return null;
  }

  const progress = (currentHours / goal.targetHours) * 100;
  const isCompleted = currentHours >= goal.targetHours;
  const isOnTrack = progress >= 50;

  const typeLabels = {
    daily: 'Meta Diária',
    weekly: 'Meta Semanal',
    monthly: 'Meta Mensal',
  };

  const getTrendIcon = () => {
    if (isCompleted) return TrendingUp;
    if (isOnTrack) return Minus;
    return TrendingDown;
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card className="p-5 card-hover">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            isCompleted ? 'bg-success/10' : 'bg-primary/10'
          )}>
            <Target className={cn(
              'w-5 h-5',
              isCompleted ? 'text-success' : 'text-primary'
            )} />
          </div>
          <div>
            <h3 className="font-semibold">{typeLabels[type]}</h3>
            <p className="text-sm text-muted-foreground">
              {formatHours(currentHours)} de {formatHours(goal.targetHours)}
            </p>
          </div>
        </div>

        <div className={cn(
          'flex items-center gap-1 text-sm font-medium',
          isCompleted && 'text-success',
          isOnTrack && !isCompleted && 'text-primary',
          !isOnTrack && 'text-destructive'
        )}>
          <TrendIcon className="w-4 h-4" />
          {Math.round(progress)}%
        </div>
      </div>

      <Progress
        value={Math.min(progress, 100)}
        className="h-2"
      />

      {isCompleted && (
        <div className="mt-3 text-sm text-success font-medium">
          🎉 Meta atingida!
        </div>
      )}
    </Card>
  );
}
