/**
 * Task Detail Page
 * Shows timesheet entries for a specific task
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Plus, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { taskStorage, projectStorage, timeEntryStorage, reminderStorage } from '@/lib/storage';
import { formatHours, formatDate, formatTime, generateId } from '@/lib/utils';
import { TimeEntry, TimeActivity } from '@/types';
import { toast } from 'sonner';

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState(taskStorage.getById(id!));
  const [project, setProject] = useState(task ? projectStorage.getById(task.projectId) : null);
  const [entries, setEntries] = useState(timeEntryStorage.getEntriesByTask(id!));
  const [reminders, setReminders] = useState(reminderStorage.getRemindersByTask(id!));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);

  const [entryForm, setEntryForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    notes: '',
  });

  const [activityForm, setActivityForm] = useState({
    description: '',
    duration: '',
  });

  useEffect(() => {
    if (!task) {
      navigate('/tasks');
    }
  }, [task, navigate]);

  const refreshData = () => {
    setTask(taskStorage.getById(id!));
    setEntries(timeEntryStorage.getEntriesByTask(id!));
    setReminders(reminderStorage.getRemindersByTask(id!));
  };

  const totalHours = timeEntryStorage.calculateTotalDuration(entries) / 3600;

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();

    if (!entryForm.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    if (!entryForm.startTime || !entryForm.endTime) {
      toast.error('Informe horário de início e fim');
      return;
    }

    const startTime = new Date(`${entryForm.date}T${entryForm.startTime}`);
    const endTime = new Date(`${entryForm.date}T${entryForm.endTime}`);

    if (endTime <= startTime) {
      toast.error('Horário de fim deve ser maior que início');
      return;
    }

    const duration = (endTime.getTime() - startTime.getTime()) / 1000;

    const entry: TimeEntry = {
      id: generateId('entry'),
      title: entryForm.title.trim(),
      projectId: task!.projectId,
      taskId: id!,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      notes: entryForm.notes || undefined,
      tags: [],
      activities: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    timeEntryStorage.create(entry);
    toast.success('Entrada de timesheet criada!');
    setDialogOpen(false);
    setEntryForm({
      title: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: '',
      notes: '',
    });
    refreshData();
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEntry || !activityForm.description || !activityForm.duration) {
      toast.error('Preencha todos os campos');
      return;
    }

    const duration = parseFloat(activityForm.duration) * 3600;

    const activity: TimeActivity = {
      id: generateId('activity'),
      description: activityForm.description,
      duration,
      timestamp: new Date().toISOString(),
    };

    const updatedEntry = {
      ...selectedEntry,
      activities: [...(selectedEntry.activities || []), activity],
      updatedAt: new Date().toISOString(),
    };

    timeEntryStorage.update(selectedEntry.id, updatedEntry);
    toast.success('Atividade adicionada!');
    setActivityDialogOpen(false);
    setActivityForm({ description: '', duration: '' });
    setSelectedEntry(null);
    refreshData();
  };

  const handleDeleteActivity = (entryId: string, activityId: string) => {
    const entry = timeEntryStorage.getById(entryId);
    if (!entry) return;

    const updatedEntry = {
      ...entry,
      activities: entry.activities?.filter(a => a.id !== activityId) || [],
      updatedAt: new Date().toISOString(),
    };

    timeEntryStorage.update(entryId, updatedEntry);
    toast.success('Atividade removida!');
    refreshData();
  };

  if (!task || !project) {
    return null;
  }

  const statusConfig = {
    'todo': { label: 'A fazer', color: 'bg-gray-500' },
    'in-progress': { label: 'Em progresso', color: 'bg-yellow-500' },
    'done': { label: 'Concluída', color: 'bg-green-500' },
  };

  const priorityConfig = {
    'low': { label: 'Baixa', color: 'text-blue-600' },
    'medium': { label: 'Média', color: 'text-yellow-600' },
    'high': { label: 'Alta', color: 'text-red-600' },
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => navigate('/tasks')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Tarefas
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${project.color}20`, color: project.color }}
            >
              <div className="w-8 h-8 rounded-full" style={{ backgroundColor: project.color }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{task.name}</h1>
              {task.description && (
                <p className="text-muted-foreground mb-2">{task.description}</p>
              )}
              <div className="flex gap-2">
                <Badge className={statusConfig[task.status].color}>{statusConfig[task.status].label}</Badge>
                <Badge variant="outline" className={priorityConfig[task.priority].color}>
                  {priorityConfig[task.priority].label}
                </Badge>
                <Badge variant="secondary">{project.name}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-primary" />
            <div>
              <div className="text-2xl font-bold">{formatHours(totalHours)}</div>
              <div className="text-sm text-muted-foreground">Horas Totais</div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-accent" />
            <div>
              <div className="text-2xl font-bold">{entries.length}</div>
              <div className="text-sm text-muted-foreground">Entradas</div>
            </div>
          </div>
        </Card>

        {task.estimatedHours && (
          <Card className="p-5">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Estimado</div>
              <div className="text-2xl font-bold">{formatHours(task.estimatedHours)}</div>
              <div className="text-sm text-muted-foreground">
                {totalHours > task.estimatedHours ? 'Excedeu' : 'Restante'}: {formatHours(Math.abs(totalHours - task.estimatedHours))}
              </div>
            </div>
          </Card>
        )}

        {task.startDate && (
          <Card className="p-5">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Prazo</div>
              {task.startDate && <div className="text-sm">Início: {formatDate(task.startDate)}</div>}
              {task.endDate && <div className="text-sm">Fim: {formatDate(task.endDate)}</div>}
            </div>
          </Card>
        )}
      </div>

      {/* Timesheet Entries */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Timesheet</h3>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Entrada
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Entrada de Timesheet</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateEntry} className="space-y-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    value={entryForm.title}
                    onChange={e => setEntryForm({ ...entryForm, title: e.target.value })}
                    placeholder="Ex: Desenvolvimento de feature X"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={entryForm.date}
                    onChange={e => setEntryForm({ ...entryForm, date: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Horário Início</Label>
                    <Input
                      type="time"
                      value={entryForm.startTime}
                      onChange={e => setEntryForm({ ...entryForm, startTime: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Horário Fim</Label>
                    <Input
                      type="time"
                      value={entryForm.endTime}
                      onChange={e => setEntryForm({ ...entryForm, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Textarea
                    value={entryForm.notes}
                    onChange={e => setEntryForm({ ...entryForm, notes: e.target.value })}
                    placeholder="Descreva o que foi feito..."
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full">Criar Entrada</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map(entry => (
              <Card key={entry.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{entry.title}</h4>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                      <div>{formatDate(entry.startTime)}</div>
                      <div>{formatTime(entry.startTime)} - {entry.endTime ? formatTime(entry.endTime) : 'Em andamento'}</div>
                      <Badge>{formatHours(entry.duration / 3600)}</Badge>
                    </div>
                    {entry.notes && (
                      <p className="text-sm mt-2">{entry.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedEntry(entry);
                        setActivityDialogOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Atividade
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        timeEntryStorage.delete(entry.id);
                        refreshData();
                        toast.success('Entrada deletada!');
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {entry.activities && entry.activities.length > 0 && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <h5 className="text-sm font-semibold">Atividades:</h5>
                    {entry.activities.map(activity => (
                      <div key={activity.id} className="flex items-center justify-between p-2 rounded bg-secondary/50">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{activity.description}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatHours(activity.duration / 3600)} - {formatTime(activity.timestamp)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteActivity(entry.id, activity.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhuma entrada de timesheet</p>
          </div>
        )}
      </Card>

      {/* Activity Dialog */}
      <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Atividade</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddActivity} className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Textarea
                value={activityForm.description}
                onChange={e => setActivityForm({ ...activityForm, description: e.target.value })}
                placeholder="Ex: Reunião, Desenvolvimento, Testes..."
                required
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Duração (horas) *</Label>
              <Input
                type="number"
                value={activityForm.duration}
                onChange={e => setActivityForm({ ...activityForm, duration: e.target.value })}
                placeholder="Ex: 2.5"
                min="0"
                step="0.25"
                required
              />
            </div>

            <Button type="submit" className="w-full">Adicionar</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
