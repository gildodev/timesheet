/**
 * Pomodoro Page
 * Dedicated page for Pomodoro timer
 */

import { useState, useEffect } from 'react';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Clock, Zap, Coffee } from 'lucide-react';
import { pomodoroStorage } from '@/lib/storage';
import { useTasks } from '@/hooks';
import { formatDurationHuman } from '@/lib/utils';

export function PomodoroPage() {
  const { tasks } = useTasks();
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [stats, setStats] = useState(pomodoroStorage.getTodayStats());

  const activeTasks = tasks.filter(t => t.status !== 'done');

  useEffect(() => {
    // Update stats every minute
    const interval = setInterval(() => {
      setStats(pomodoroStorage.getTodayStats());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Modo Pomodoro</h1>
        <p className="text-muted-foreground">
          Mantenha o foco com a técnica Pomodoro
        </p>
      </div>

      {/* Task Selection */}
      {activeTasks.length > 0 && (
        <Card className="p-6">
          <Label className="mb-2 block">Tarefa Ativa (opcional)</Label>
          <Select value={selectedTask || 'none'} onValueChange={(value) => setSelectedTask(value === 'none' ? '' : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma tarefa para focar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma tarefa específica</SelectItem>
              {activeTasks.map(task => (
                <SelectItem key={task.id} value={task.id}>
                  {task.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>
      )}

      {/* Pomodoro Timer */}
      <PomodoroTimer taskId={selectedTask || undefined} />

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-success" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">{stats.completedWorkSessions}</div>
          <div className="text-sm text-muted-foreground">Sessões Concluídas</div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">
            {formatDurationHuman(stats.totalWorkTime)}
          </div>
          <div className="text-sm text-muted-foreground">Tempo de Foco</div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Coffee className="w-5 h-5 text-warning" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">
            {formatDurationHuman(stats.totalBreakTime)}
          </div>
          <div className="text-sm text-muted-foreground">Tempo de Pausa</div>
        </Card>
      </div>

      {/* Info */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5">
        <h3 className="font-semibold mb-3">O que é a Técnica Pomodoro?</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>🍅 Trabalhe com foco total por 25 minutos</li>
          <li>☕ Faça uma pausa de 5 minutos</li>
          <li>🔄 Repita o ciclo 4 vezes</li>
          <li>🎉 Faça uma pausa longa de 15 minutos</li>
          <li>✨ Aumente sua produtividade e evite burnout</li>
        </ul>
      </Card>
    </div>
  );
}
