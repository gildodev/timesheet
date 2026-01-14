/**
 * Tasks Page
 * Manage tasks
 */

import { useState, useRef, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskCard } from '@/components/TaskCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useTasks, useProjects, useTimer } from '@/hooks';
import { Task } from '@/types';
import { toast } from 'sonner';
import gsap from 'gsap';

export function TasksPage() {
  const { tasks, createTask, updateTask, deleteTask, completeTask, startTask } = useTasks();
  const { projects } = useProjects();
  const { startTimer } = useTimer();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; taskId: string | null }>({
    open: false,
    taskId: null,
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    projectId: '',
    status: 'todo' as Task['status'],
    priority: 'medium' as Task['priority'],
    tags: '',
    startDate: '',
    endDate: '',
    estimatedHours: '',
  });

  const listRef = useRef<HTMLDivElement>(null);

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
  }, [tasks, searchQuery, filterProject, filterPriority]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      projectId: projects[0]?.id || '',
      status: 'todo',
      priority: 'medium',
      tags: '',
      startDate: '',
      endDate: '',
      estimatedHours: '',
    });
    setEditingTask(null);
  };

  const handleOpenDialog = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        name: task.name,
        description: task.description || '',
        projectId: task.projectId,
        status: task.status,
        priority: task.priority,
        tags: task.tags.join(', '),
        startDate: task.startDate || '',
        endDate: task.endDate || '',
        estimatedHours: task.estimatedHours?.toString() || '',
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Nome da tarefa é obrigatório');
      return;
    }

    if (!formData.projectId) {
      toast.error('Selecione um projeto');
      return;
    }

    const tags = formData.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    if (editingTask) {
      updateTask(editingTask.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        projectId: formData.projectId,
        status: formData.status,
        priority: formData.priority,
        tags,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
      });
      toast.success('Tarefa atualizada!');
    } else {
      createTask({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        projectId: formData.projectId,
        status: formData.status,
        priority: formData.priority,
        tags,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
      });
      toast.success('Tarefa criada!');
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setConfirmDialog({ open: true, taskId: id });
  };

  const confirmDeleteTask = () => {
    if (confirmDialog.taskId) {
      deleteTask(confirmDialog.taskId);
      toast.success('Tarefa deletada!');
      setConfirmDialog({ open: false, taskId: null });
    }
  };

  const handleStartTimer = (task: Task) => {
    startTimer(task.projectId, task.id);
    toast.success('Timer iniciado para: ' + task.name);
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesProject = filterProject === 'all' || t.projectId === filterProject;
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;

    return matchesSearch && matchesProject && matchesPriority;
  });

  const todoTasks = filteredTasks.filter(t => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in-progress');
  const doneTasks = filteredTasks.filter(t => t.status === 'done');

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Tarefas</h1>
          <p className="text-muted-foreground">
            {tasks.length} {tasks.length === 1 ? 'tarefa' : 'tarefas'} no total
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2" onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome da tarefa"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição da tarefa"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Projeto *</Label>
                  <Select value={formData.projectId} onValueChange={projectId => setFormData({ ...formData, projectId })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={status => setFormData({ ...formData, status: status as Task['status'] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">A fazer</SelectItem>
                      <SelectItem value="in-progress">Em progresso</SelectItem>
                      <SelectItem value="done">Concluída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={formData.priority} onValueChange={priority => setFormData({ ...formData, priority: priority as Task['priority'] })}>
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
                <Label>Tags (separadas por vírgula)</Label>
                <Input
                  value={formData.tags}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="frontend, bug, urgente"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Data de Início</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data de Fim</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    min={formData.startDate}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Horas Estimadas</Label>
                  <Input
                    type="number"
                    value={formData.estimatedHours}
                    onChange={e => setFormData({ ...formData, estimatedHours: e.target.value })}
                    placeholder="Ex: 8"
                    min="0"
                    step="0.5"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  {editingTask ? 'Salvar' : 'Criar'}
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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar tarefas..."
            className="pl-10"
          />
        </div>

        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Todos os projetos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os projetos</SelectItem>
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Todas prioridades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas prioridades</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            Todas ({filteredTasks.length})
          </TabsTrigger>
          <TabsTrigger value="todo">
            A fazer ({todoTasks.length})
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            Em progresso ({inProgressTasks.length})
          </TabsTrigger>
          <TabsTrigger value="done">
            Concluídas ({doneTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-6" ref={listRef}>
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={() => handleOpenDialog(task)}
                onDelete={() => handleDelete(task.id)}
                onComplete={() => {
                  completeTask(task.id);
                  toast.success('Tarefa concluída! 🎉');
                }}
                onStart={() => {
                  startTask(task.id);
                  toast.success('Tarefa iniciada!');
                }}
                onStartTimer={() => handleStartTimer(task)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma tarefa encontrada</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="todo" className="space-y-3 mt-6">
          {todoTasks.length > 0 ? (
            todoTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={() => handleOpenDialog(task)}
                onDelete={() => handleDelete(task.id)}
                onStart={() => {
                  startTask(task.id);
                  toast.success('Tarefa iniciada!');
                }}
                onStartTimer={() => handleStartTimer(task)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma tarefa a fazer</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-3 mt-6">
          {inProgressTasks.length > 0 ? (
            inProgressTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={() => handleOpenDialog(task)}
                onDelete={() => handleDelete(task.id)}
                onComplete={() => {
                  completeTask(task.id);
                  toast.success('Tarefa concluída! 🎉');
                }}
                onStartTimer={() => handleStartTimer(task)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma tarefa em progresso</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="done" className="space-y-3 mt-6">
          {doneTasks.length > 0 ? (
            doneTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={() => handleOpenDialog(task)}
                onDelete={() => handleDelete(task.id)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma tarefa concluída</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title="Deletar Tarefa"
        description="Tem certeza que deseja deletar esta tarefa? Esta ação não pode ser desfeita."
        onConfirm={confirmDeleteTask}
        destructive
      />
    </div>
  );
}
