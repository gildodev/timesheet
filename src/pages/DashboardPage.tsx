/**
 * Dashboard Page
 * Main dashboard with stats and overview
 */

import { useEffect, useRef, useState } from 'react';
import { Timer } from '@/components/Timer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GoalTracker } from '@/components/GoalTracker';
import { ReportChart } from '@/components/ReportChart';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { ProductivityInsights } from '@/components/ProductivityInsights';
import { Clock, TrendingUp, CheckSquare, FolderKanban, Play, Zap } from 'lucide-react';
import { timeEntryStorage, taskStorage, projectStorage } from '@/lib/storage';
import { formatHours, formatDurationHuman } from '@/lib/utils';
import { ReportGenerator } from '@/lib/reports';
import { usePremium, useProjects, useTasks, useTimer } from '@/hooks';
import { toast } from 'sonner';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';

export function DashboardPage() {
  const navigate = useNavigate();
  const { isPremium } = usePremium();
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const { startTimer } = useTimer();
  
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const cardsRef = useRef<HTMLDivElement>(null);

  // Get stats
  const todayEntries = timeEntryStorage.getTodayEntries();
  const weekEntries = timeEntryStorage.getWeekEntries();
  const todaySeconds = timeEntryStorage.calculateTotalDuration(todayEntries);
  const weekSeconds = timeEntryStorage.calculateTotalDuration(weekEntries);
  const todayHours = todaySeconds / 3600;
  const weekHours = weekSeconds / 3600;

  const activeTasks = tasks.filter(t => t.status !== 'done').length;
  const completedToday = tasks.filter(t => {
    if (!t.completedAt) return false;
    const completed = new Date(t.completedAt);
    const today = new Date();
    return completed.toDateString() === today.toDateString();
  }).length;

  const activeProjects = projects.length;

  const { current: currentStreak, longest: longestStreak } = ReportGenerator.calculateStreak();

  // Get week report for chart
  const weekReport = ReportGenerator.generateWeekReport(new Date());

  useEffect(() => {
    // Animate cards on mount
    if (cardsRef.current) {
      const cards = cardsRef.current.querySelectorAll('.stat-card');
      gsap.fromTo(
        cards,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: 'power2.out',
        }
      );
    }
  }, []);

  const handleStartTimer = () => {
    if (!selectedProject) {
      toast.error('Selecione um projeto');
      return;
    }

    startTimer(selectedProject, selectedTask || undefined);
    setDialogOpen(false);
    toast.success('Timer iniciado!');
  };

  const availableTasks = selectedProject
    ? tasks.filter(t => t.projectId === selectedProject && t.status !== 'done')
    : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta! Veja seu resumo de produtividade.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Play className="w-4 h-4" />
              Iniciar Timer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Iniciar Novo Timer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Projeto *</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: project.color }}
                          />
                          {project.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {availableTasks.length > 0 && (
                <div className="space-y-2">
                  <Label>Tarefa (opcional)</Label>
                  <Select value={selectedTask || 'none'} onValueChange={(value) => setSelectedTask(value === 'none' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma tarefa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma tarefa</SelectItem>
                      {availableTasks.map(task => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button onClick={handleStartTimer} className="w-full">
                Iniciar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Timer */}
      <Timer onStart={() => setDialogOpen(true)} />

      {/* Stats Grid */}
      <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 stat-card card-hover">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Hoje</span>
          </div>
          <div className="text-2xl font-bold mb-1">{formatHours(todayHours)}</div>
          <div className="text-sm text-muted-foreground">
            {formatDurationHuman(todaySeconds)}
          </div>
        </Card>

        <Card className="p-5 stat-card card-hover">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <span className="text-xs text-muted-foreground">Semana</span>
          </div>
          <div className="text-2xl font-bold mb-1">{formatHours(weekHours)}</div>
          <div className="text-sm text-muted-foreground">
            Média: {formatHours(weekHours / 7)}/dia
          </div>
        </Card>

        <Card className="p-5 stat-card card-hover">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-warning" />
            </div>
            <span className="text-xs text-muted-foreground">Tarefas</span>
          </div>
          <div className="text-2xl font-bold mb-1">{activeTasks}</div>
          <div className="text-sm text-muted-foreground">
            {completedToday} concluídas hoje
          </div>
        </Card>

        <Card className="p-5 stat-card card-hover">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-accent" />
            </div>
            <span className="text-xs text-muted-foreground">Projetos</span>
          </div>
          <div className="text-2xl font-bold mb-1">{activeProjects}</div>
          <div className="text-sm text-muted-foreground">
            {currentStreak} dias seguidos
          </div>
        </Card>
      </div>

      {/* Goals (Premium) */}
      {isPremium && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GoalTracker type="daily" />
          <GoalTracker type="weekly" />
          <GoalTracker type="monthly" />
        </div>
      )}

      {/* Week Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold mb-1">Horas da Semana</h2>
            <p className="text-sm text-muted-foreground">
              Total: {formatHours(weekReport.totalHours)}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/reports')}>
            Ver Relatórios
          </Button>
        </div>
        <ReportChart report={weekReport} type="bar" dataType="daily" />
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 card-hover cursor-pointer" onClick={() => navigate('/projects')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Gerenciar Projetos</h3>
              <p className="text-sm text-muted-foreground">
                Organize seus projetos e visualize o progresso
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 card-hover cursor-pointer" onClick={() => navigate('/pomodoro')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-success" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Modo Pomodoro</h3>
              <p className="text-sm text-muted-foreground">
                Mantenha o foco com a técnica Pomodoro
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Productivity Insights (Premium) */}
      {isPremium && <ProductivityInsights />}

      {/* Activity Timeline (Premium) */}
      {isPremium && <ActivityTimeline />}
    </div>
  );
}
