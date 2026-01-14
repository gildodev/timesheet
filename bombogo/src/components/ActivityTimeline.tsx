/**
 * Activity Timeline Component (Premium)
 * Shows activity log in timeline format
 */

import { useState, useEffect } from 'react';
import { Clock, Play, Pause, CheckCircle2, Plus, Edit, Trash2 } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { PremiumBadge } from './PremiumBadge';
import { activityLogStorage } from '@/lib/storage';
import { ActivityLog } from '@/types';
import { formatDate, formatTime } from '@/lib/utils';
import { usePremium } from '@/hooks';

export function ActivityTimeline() {
  const { isPremium } = usePremium();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [filter, setFilter] = useState<ActivityLog['type'] | 'all'>('all');

  useEffect(() => {
    if (!isPremium) return;

    const logs = activityLogStorage.getAll();
    const filtered =
      filter === 'all' ? logs : logs.filter(a => a.type === filter);
    setActivities(filtered.slice(0, 50));
  }, [isPremium, filter]);

  if (!isPremium) {
    return (
      <Card className="p-12 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center premium-glow">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold">Recurso Premium</h3>
          <p className="text-muted-foreground">
            Timeline de atividades está disponível apenas no plano Premium.
          </p>
        </div>
      </Card>
    );
  }

  const getIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'timer_start':
        return <Play className="w-4 h-4" />;
      case 'timer_stop':
        return <Pause className="w-4 h-4" />;
      case 'task_complete':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'project_create':
        return <Plus className="w-4 h-4" />;
      case 'task_create':
        return <Plus className="w-4 h-4" />;
      case 'entry_create':
        return <Clock className="w-4 h-4" />;
      case 'entry_edit':
        return <Edit className="w-4 h-4" />;
      case 'entry_delete':
        return <Trash2 className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getColor = (type: ActivityLog['type']) => {
    switch (type) {
      case 'timer_start':
        return 'text-success';
      case 'timer_stop':
        return 'text-warning';
      case 'task_complete':
        return 'text-primary';
      case 'entry_delete':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Timeline de Atividades</h2>
          <PremiumBadge size="sm" />
        </div>

        <div className="flex gap-2">
          {(['all', 'timer_start', 'task_complete', 'entry_create'] as const).map(
            type => (
              <Button
                key={type}
                variant={filter === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(type)}
              >
                {type === 'all' ? 'Todas' : type.replace('_', ' ')}
              </Button>
            )
          )}
        </div>
      </div>

      {activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={activity.id} className="flex gap-4">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-background ${getColor(
                    activity.type
                  )}`}
                >
                  {getIcon(activity.type)}
                </div>
                {index < activities.length - 1 && (
                  <div className="w-0.5 h-full bg-border mt-2" />
                )}
              </div>

              {/* Activity content */}
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between mb-1">
                  <p className="font-medium">{activity.description}</p>
                  <Badge variant="outline" className="text-xs">
                    {formatTime(activity.timestamp)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDate(activity.timestamp)}
                </p>
                {activity.metadata && (
                  <div className="mt-2 text-xs text-muted-foreground space-y-1">
                    {Object.entries(activity.metadata).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium">{key}:</span> {String(value)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhuma atividade registrada</p>
        </div>
      )}
    </Card>
  );
}
