/**
 * Goals Page
 * Manage productivity goals (Premium)
 */

import { useState, useEffect } from 'react';
import { Target, Plus, Edit, Trash2, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PremiumBadge } from '@/components/PremiumBadge';
import { usePremium, useProjects } from '@/hooks';
import { goalStorage, timeEntryStorage } from '@/lib/storage';
import { Goal } from '@/types';
import { formatHours, cn } from '@/lib/utils';
import { toast } from 'sonner';

export function GoalsPage() {
  const { isPremium } = usePremium();
  const { projects } = useProjects();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; goalId: string | null }>({
    open: false,
    goalId: null,
  });

  const [formData, setFormData] = useState({
    type: 'daily' as Goal['type'],
    targetHours: '',
    projectId: '',
  });

  useEffect(() => {
    if (!isPremium) return;
    loadGoals();
  }, [isPremium]);

  const loadGoals = () => {
    const allGoals = goalStorage.getAllGoals();
    setGoals(allGoals);
  };

  const resetForm = () => {
    setFormData({
      type: 'daily',
      targetHours: '',
      projectId: '',
    });
    setEditingGoal(null);
  };

  const handleOpenDialog = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        type: goal.type,
        targetHours: goal.targetHours.toString(),
        projectId: goal.projectId || '',
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const targetHours = parseFloat(formData.targetHours);
    if (!targetHours || targetHours <= 0) {
      toast.error('Defina uma meta válida');
      return;
    }

    if (editingGoal) {
      // Update existing goal
      goalStorage.update(editingGoal.id, {
        targetHours,
        projectId: formData.projectId || undefined,
      });
      toast.success('Meta atualizada!');
    } else {
      // Create new goal
      switch (formData.type) {
        case 'daily':
          goalStorage.createDailyGoal(targetHours, formData.projectId || undefined);
          break;
        case 'weekly':
          goalStorage.createWeeklyGoal(targetHours, formData.projectId || undefined);
          break;
        case 'monthly':
          goalStorage.createMonthlyGoal(targetHours, formData.projectId || undefined);
          break;
      }
      toast.success('Meta criada!');
    }

    setDialogOpen(false);
    resetForm();
    loadGoals();
  };

  const handleDelete = (id: string) => {
    setConfirmDialog({ open: true, goalId: id });
  };

  const confirmDelete = () => {
    if (confirmDialog.goalId) {
      goalStorage.delete(confirmDialog.goalId);
      toast.success('Meta deletada!');
      setConfirmDialog({ open: false, goalId: null });
      loadGoals();
    }
  };

  const getGoalProgress = (goal: Goal): number => {
    const start = new Date(goal.startDate);
    const end = new Date(goal.endDate);
    const entries = timeEntryStorage.getEntriesByDateRange(start, end);

    let filteredEntries = entries;
    if (goal.projectId) {
      filteredEntries = entries.filter(e => e.projectId === goal.projectId);
    }

    const totalSeconds = timeEntryStorage.calculateTotalDuration(filteredEntries);
    const currentHours = totalSeconds / 3600;
    return (currentHours / goal.targetHours) * 100;
  };

  const getGoalStatus = (goal: Goal): 'active' | 'completed' | 'expired' => {
    const now = new Date();
    const end = new Date(goal.endDate);
    const progress = getGoalProgress(goal);

    if (progress >= 100) return 'completed';
    if (now > end) return 'expired';
    return 'active';
  };

  if (!isPremium) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center premium-glow">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold">Recurso Premium</h3>
            <p className="text-muted-foreground">
              O gerenciamento de metas está disponível apenas no plano Premium.
            </p>
            <Button className="gap-2">
              Ativar Premium
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const activeGoals = goals.filter(g => getGoalStatus(g) === 'active');
  const completedGoals = goals.filter(g => getGoalStatus(g) === 'completed');
  const expiredGoals = goals.filter(g => getGoalStatus(g) === 'expired');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            Metas
            <PremiumBadge />
          </h1>
          <p className="text-muted-foreground">
            Defina e acompanhe suas metas de produtividade
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2" onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingGoal ? 'Editar Meta' : 'Nova Meta'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingGoal && (
                <div className="space-y-2">
                  <Label>Tipo de Meta *</Label>
                  <Select value={formData.type} onValueChange={(value: Goal['type']) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diária</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Horas Objetivo *</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.targetHours}
                  onChange={e => setFormData({ ...formData, targetHours: e.target.value })}
                  placeholder="8"
                  min="0.5"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Projeto (opcional)</Label>
                <Select value={formData.projectId || 'none'} onValueChange={(value) => setFormData({ ...formData, projectId: value === 'none' ? '' : value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os projetos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Todos os projetos</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  {editingGoal ? 'Salvar' : 'Criar Meta'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Metas Ativas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeGoals.map(goal => {
              const progress = getGoalProgress(goal);
              const project = goal.projectId ? projects.find(p => p.id === goal.projectId) : null;

              return (
                <Card key={goal.id} className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        progress >= 100 ? 'bg-success/10' : 'bg-primary/10'
                      )}>
                        <Target className={cn(
                          'w-5 h-5',
                          progress >= 100 ? 'text-success' : 'text-primary'
                        )} />
                      </div>
                      <div>
                        <h3 className="font-semibold capitalize">{goal.type}</h3>
                        {project && (
                          <p className="text-xs text-muted-foreground">{project.name}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(goal)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(goal.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={Math.min(progress, 100)} className="h-2" />
                    <div className="text-sm text-muted-foreground">
                      Meta: {formatHours(goal.targetHours)}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Metas Concluídas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedGoals.map(goal => {
              const project = goal.projectId ? projects.find(p => p.id === goal.projectId) : null;

              return (
                <Card key={goal.id} className="p-5 bg-success/5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <h3 className="font-semibold capitalize">{goal.type}</h3>
                        {project && (
                          <p className="text-xs text-muted-foreground">{project.name}</p>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(goal.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="text-sm text-success font-medium">
                    🎉 Meta atingida! {formatHours(goal.targetHours)}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* No goals */}
      {goals.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">Nenhuma meta definida</p>
          <Button onClick={() => handleOpenDialog()}>
            Criar Primeira Meta
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title="Deletar Meta"
        description="Tem certeza que deseja deletar esta meta? Esta ação não pode ser desfeita."
        onConfirm={confirmDelete}
        destructive
      />
    </div>
  );
}
