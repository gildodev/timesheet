/**
 * Reminders Page
 * Manage reminders and alerts
 */

import { useState, useEffect, useRef } from 'react';
import { Bell, Plus, Check, Trash2, Clock, AlertCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useProjects } from '@/hooks';
import { reminderStorage, taskStorage } from '@/lib/storage';
import { Reminder } from '@/types';
import { generateId, formatDate, formatTime, cn } from '@/lib/utils';
import { toast } from 'sonner';
import gsap from 'gsap';

export function RemindersPage() {
  const { projects } = useProjects();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; reminderId: string | null }>({
    open: false,
    reminderId: null,
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '',
    priority: 'medium' as Reminder['priority'],
    projectId: '',
    taskId: '',
  });

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadReminders();
  }, []);

  useEffect(() => {
    if (listRef.current) {
      const cards = listRef.current.children;
      gsap.fromTo(
        cards,
        { x: -20, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.3,
          stagger: 0.05,
          ease: 'power2.out',
        }
      );
    }
  }, [reminders]);

  const loadReminders = () => {
    setReminders(reminderStorage.getAll());
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '',
      priority: 'medium',
      projectId: '',
      taskId: '',
    });
    setEditingReminder(null);
  };

  const handleOpenDialog = (reminder?: Reminder) => {
    if (reminder) {
      setEditingReminder(reminder);
      setFormData({
        title: reminder.title,
        description: reminder.description || '',
        dueDate: reminder.dueDate,
        dueTime: reminder.dueTime || '',
        priority: reminder.priority,
        projectId: reminder.projectId || '',
        taskId: reminder.taskId || '',
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    if (editingReminder) {
      reminderStorage.update(editingReminder.id, {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        dueDate: formData.dueDate,
        dueTime: formData.dueTime || undefined,
        priority: formData.priority,
        projectId: formData.projectId || undefined,
        taskId: formData.taskId || undefined,
        updatedAt: new Date().toISOString(),
      });
      toast.success('Lembrete atualizado!');
    } else {
      const reminder: Reminder = {
        id: generateId('reminder'),
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        dueDate: formData.dueDate,
        dueTime: formData.dueTime || undefined,
        priority: formData.priority,
        projectId: formData.projectId || undefined,
        taskId: formData.taskId || undefined,
        completed: false,
        notified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      reminderStorage.create(reminder);
      toast.success('Lembrete criado!');
    }

    setDialogOpen(false);
    resetForm();
    loadReminders();
  };

  const handleComplete = (id: string) => {
    reminderStorage.completeReminder(id);
    toast.success('Lembrete concluído!');
    loadReminders();
  };

  const handleDelete = (id: string) => {
    setConfirmDialog({ open: true, reminderId: id });
  };

  const confirmDelete = () => {
    if (confirmDialog.reminderId) {
      reminderStorage.delete(confirmDialog.reminderId);
      toast.success('Lembrete deletado!');
      setConfirmDialog({ open: false, reminderId: null });
      loadReminders();
    }
  };

  const activeReminders = reminderStorage.getActiveReminders();
  const overdueReminders = reminderStorage.getOverdueReminders();
  const todayReminders = reminderStorage.getTodayReminders();
  const completedReminders = reminderStorage.getCompletedReminders();

  const availableTasks = formData.projectId 
    ? taskStorage.getTasksByProject(formData.projectId)
    : [];

  const priorityConfig = {
    low: { label: 'Baixa', color: 'bg-blue-500' },
    medium: { label: 'Média', color: 'bg-yellow-500' },
    high: { label: 'Alta', color: 'bg-red-500' },
  };

  const ReminderCard = ({ reminder }: { reminder: Reminder }) => {
    const project = reminder.projectId ? projects.find(p => p.id === reminder.projectId) : null;
    const task = reminder.taskId ? taskStorage.getById(reminder.taskId) : null;
    const isOverdue = new Date(reminder.dueDate + (reminder.dueTime ? `T${reminder.dueTime}` : '')) < new Date();

    return (
      <Card className={cn(
        'p-4',
        isOverdue && !reminder.completed && 'border-destructive'
      )}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            <div className={cn(
              'w-1 h-full rounded-full',
              priorityConfig[reminder.priority].color
            )} />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold mb-1">{reminder.title}</h3>
              {reminder.description && (
                <p className="text-sm text-muted-foreground mb-2">{reminder.description}</p>
              )}
              
              <div className="flex flex-wrap gap-2 mb-2">
                {project && (
                  <Badge variant="secondary">
                    <span
                      className="w-2 h-2 rounded-full mr-1"
                      style={{ backgroundColor: project.color }}
                    />
                    {project.name}
                  </Badge>
                )}
                {task && (
                  <Badge variant="outline">{task.name}</Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(reminder.dueDate)}
                </div>
                {reminder.dueTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {reminder.dueTime}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-1">
            {!reminder.completed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleComplete(reminder.id)}
              >
                <Check className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(reminder.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isOverdue && !reminder.completed && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />
            Atrasado
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Lembretes</h1>
          <p className="text-muted-foreground">
            {activeReminders.length} {activeReminders.length === 1 ? 'lembrete ativo' : 'lembretes ativos'}
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2" onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4" />
              Novo Lembrete
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingReminder ? 'Editar Lembrete' : 'Novo Lembrete'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Reunião com cliente"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalhes do lembrete..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input
                    type="time"
                    value={formData.dueTime}
                    onChange={e => setFormData({ ...formData, dueTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={formData.priority} onValueChange={(v: Reminder['priority']) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Projeto (opcional)</Label>
                <Select value={formData.projectId || 'none'} onValueChange={(v) => setFormData({ ...formData, projectId: v === 'none' ? '' : v, taskId: '' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum projeto</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.projectId && availableTasks.length > 0 && (
                <div className="space-y-2">
                  <Label>Tarefa (opcional)</Label>
                  <Select value={formData.taskId || 'none'} onValueChange={(v) => setFormData({ ...formData, taskId: v === 'none' ? '' : v })}>
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

              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  {editingReminder ? 'Salvar' : 'Criar'}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <div className="text-2xl font-bold">{overdueReminders.length}</div>
              <div className="text-sm text-muted-foreground">Atrasados</div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-warning" />
            </div>
            <div>
              <div className="text-2xl font-bold">{todayReminders.length}</div>
              <div className="text-sm text-muted-foreground">Hoje</div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Check className="w-5 h-5 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold">{completedReminders.length}</div>
              <div className="text-sm text-muted-foreground">Concluídos</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Reminders Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">
            Ativos ({activeReminders.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Concluídos ({completedReminders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3 mt-6" ref={listRef}>
          {activeReminders.length > 0 ? (
            activeReminders.map(reminder => (
              <ReminderCard key={reminder.id} reminder={reminder} />
            ))
          ) : (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">Nenhum lembrete ativo</p>
              <Button onClick={() => handleOpenDialog()}>
                Criar Primeiro Lembrete
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3 mt-6">
          {completedReminders.length > 0 ? (
            completedReminders.map(reminder => (
              <ReminderCard key={reminder.id} reminder={reminder} />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum lembrete concluído</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title="Deletar Lembrete"
        description="Tem certeza que deseja deletar este lembrete? Esta ação não pode ser desfeita."
        onConfirm={confirmDelete}
        destructive
      />
    </div>
  );
}
