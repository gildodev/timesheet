/**
 * Project Detail Page
 * Shows all tasks and timesheet entries for a project
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckSquare, Calendar, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskCard } from '@/components/TaskCard';
import { TimeEntryRow } from '@/components/TimeEntryRow';
import { projectStorage, taskStorage, timeEntryStorage } from '@/lib/storage';
import { formatHours, formatDate, formatTime, generateId } from '@/lib/utils';
import { TimeEntry, TimeActivity } from '@/types';
import { toast } from 'sonner';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState(projectStorage.getById(id!));
  const [tasks, setTasks] = useState(taskStorage.getTasksByProject(id!));
  const [entries, setEntries] = useState(timeEntryStorage.getEntriesByProject(id!));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);

  const [entryForm, setEntryForm] = useState({
    taskId: '',
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
    if (!project) {
      navigate('/projects');
    }
  }, [project, navigate]);

  const refreshData = () => {
    setProject(projectStorage.getById(id!));
    setTasks(taskStorage.getTasksByProject(id!));
    setEntries(timeEntryStorage.getEntriesByProject(id!));
  };

  const totalHours = timeEntryStorage.calculateTotalDuration(entries) / 3600;
  const taskStats = taskStorage.getTaskStats(id!);

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();

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
      projectId: id!,
      taskId: entryForm.taskId || undefined,
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
      taskId: '',
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

    const duration = parseFloat(activityForm.duration) * 3600; // Convert hours to seconds

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

  if (!project) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => navigate('/projects')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Projetos
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
              <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
              {project.description && (
                <p className="text-muted-foreground">{project.description}</p>
              )}
              <div className="flex gap-2 mt-2">
                {project.tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
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
            <CheckSquare className="w-8 h-8 text-success" />
            <div>
              <div className="text-2xl font-bold">{taskStats.done}/{taskStats.total}</div>
              <div className="text-sm text-muted-foreground">Tarefas Concluídas</div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-accent" />
            <div>
              <div className="text-2xl font-bold">{entries.length}</div>
              <div className="text-sm text-muted-foreground">Entradas de Tempo</div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Status</div>
            {project.isPermanent ? (
              <Badge>Permanente</Badge>
            ) : (
              <div className="text-sm">
                {project.startDate && <div>Início: {formatDate(project.startDate)}</div>}
                {project.endDate && <div>Fim: {formatDate(project.endDate)}</div>}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList>
          <TabsTrigger value="tasks">Tarefas ({tasks.length})</TabsTrigger>
          <TabsTrigger value="timesheet">Timesheet ({entries.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-3 mt-6">
          {tasks.length > 0 ? (
            tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={() => navigate('/tasks')}
                onDelete={() => {
                  taskStorage.delete(task.id);
                  refreshData();
                  toast.success('Tarefa deletada!');
                }}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Nenhuma tarefa neste projeto</p>
              <Button onClick={() => navigate('/tasks')}>Criar Tarefa</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="timesheet" className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Entradas de Tempo</h3>
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
                    <Label>Tarefa (opcional)</Label>
                    <Select value={entryForm.taskId} onValueChange={v => setEntryForm({ ...entryForm, taskId: v === 'none' ? '' : v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma tarefa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem tarefa específica</SelectItem>
                        {tasks.map(task => (
                          <SelectItem key={task.id} value={task.id}>{task.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                <Card key={entry.id} className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-sm text-muted-foreground">
                          {formatDate(entry.startTime)}
                        </div>
                        <div className="text-sm font-medium">
                          {formatTime(entry.startTime)} - {entry.endTime ? formatTime(entry.endTime) : 'Em andamento'}
                        </div>
                        <Badge>{formatHours(entry.duration / 3600)}</Badge>
                      </div>
                      {entry.taskId && (
                        <div className="text-sm text-muted-foreground">
                          Tarefa: {tasks.find(t => t.id === entry.taskId)?.name}
                        </div>
                      )}
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

                  {/* Activities */}
                  {entry.activities && entry.activities.length > 0 && (
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <h4 className="text-sm font-semibold mb-2">Atividades:</h4>
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
        </TabsContent>
      </Tabs>

      {/* Activity Dialog */}
      <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Atividade ao Timesheet</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddActivity} className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição da Atividade</Label>
              <Textarea
                value={activityForm.description}
                onChange={e => setActivityForm({ ...activityForm, description: e.target.value })}
                placeholder="Ex: Reunião com cliente, Desenvolvimento de feature, etc."
                required
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Duração (horas)</Label>
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

            <Button type="submit" className="w-full">Adicionar Atividade</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
