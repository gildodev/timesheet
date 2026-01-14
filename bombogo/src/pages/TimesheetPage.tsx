/**
 * Timesheet Page
 * View and manage time entries
 */

import { useState, useEffect, useRef } from 'react';
import { Download, Search, Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { TimeEntryRow } from '@/components/TimeEntryRow';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AdvancedFilters, FilterCriteria } from '@/components/AdvancedFilters';
import { useTimeEntries, useProjects, useTasks } from '@/hooks';
import { timeEntryStorage } from '@/lib/storage';
import { TimeEntry } from '@/types';
import { formatHours, exportToCSV, exportToJSON, generateId } from '@/lib/utils';
import { toast } from 'sonner';
import gsap from 'gsap';

export function TimesheetPage() {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [advancedFilters, setAdvancedFilters] = useState<FilterCriteria>({
    projectIds: [],
    taskIds: [],
    tags: [],
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; entryId: string | null }>({
    open: false,
    entryId: null,
  });

  const { projects } = useProjects();
  const { tasks } = useTasks();

  const [formData, setFormData] = useState({
    projectId: '',
    taskId: '',
    startTime: '',
    duration: '',
    notes: '',
    tags: '',
  });

  const listRef = useRef<HTMLDivElement>(null);

  // Get entries based on date range
  let entries: TimeEntry[] = [];
  switch (dateRange) {
    case 'today':
      entries = timeEntryStorage.getTodayEntries();
      break;
    case 'week':
      entries = timeEntryStorage.getWeekEntries();
      break;
    case 'month':
      entries = timeEntryStorage.getMonthEntries();
      break;
  }

  // Apply filters
  const filteredEntries = entries.filter(e => {
    // Basic filters
    const matchesProject = filterProject === 'all' || e.projectId === filterProject;
    const project = projects.find(p => p.id === e.projectId);
    const task = e.taskId ? tasks.find(t => t.id === e.taskId) : null;
    const matchesSearch = 
      project?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.notes?.toLowerCase().includes(searchQuery.toLowerCase());

    // Advanced filters
    const matchesAdvancedProject = advancedFilters.projectIds.length === 0 || 
      advancedFilters.projectIds.includes(e.projectId);
    
    const matchesAdvancedTags = advancedFilters.tags.length === 0 ||
      advancedFilters.tags.some(tag => e.tags.includes(tag));
    
    const entryDate = new Date(e.startTime).toISOString().split('T')[0];
    const matchesDateFrom = !advancedFilters.dateFrom || entryDate >= advancedFilters.dateFrom;
    const matchesDateTo = !advancedFilters.dateTo || entryDate <= advancedFilters.dateTo;
    
    const durationMinutes = e.duration / 60;
    const matchesMinDuration = !advancedFilters.minDuration || durationMinutes >= advancedFilters.minDuration;
    const matchesMaxDuration = !advancedFilters.maxDuration || durationMinutes <= advancedFilters.maxDuration;

    return matchesProject && matchesSearch && matchesAdvancedProject && 
           matchesAdvancedTags && matchesDateFrom && matchesDateTo &&
           matchesMinDuration && matchesMaxDuration;
  });

  const totalSeconds = timeEntryStorage.calculateTotalDuration(filteredEntries);
  const totalHours = totalSeconds / 3600;

  useEffect(() => {
    if (listRef.current) {
      const rows = listRef.current.children;
      gsap.fromTo(
        rows,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.3,
          stagger: 0.05,
          ease: 'power2.out',
        }
      );
    }
  }, [filteredEntries, dateRange]);

  const resetForm = () => {
    setFormData({
      projectId: projects[0]?.id || '',
      taskId: '',
      startTime: new Date().toISOString().slice(0, 16),
      duration: '',
      notes: '',
      tags: '',
    });
    setEditingEntry(null);
  };

  const handleOpenDialog = (entry?: TimeEntry) => {
    if (entry) {
      setEditingEntry(entry);
      const durationMinutes = Math.floor(entry.duration / 60);
      setFormData({
        projectId: entry.projectId,
        taskId: entry.taskId || '',
        startTime: new Date(entry.startTime).toISOString().slice(0, 16),
        duration: durationMinutes.toString(),
        notes: entry.notes || '',
        tags: entry.tags.join(', '),
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.projectId) {
      toast.error('Selecione um projeto');
      return;
    }

    if (!formData.duration) {
      toast.error('Informe a duração');
      return;
    }

    const durationSeconds = parseInt(formData.duration) * 60;
    const tags = formData.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    if (editingEntry) {
      timeEntryStorage.update(editingEntry.id, {
        projectId: formData.projectId,
        taskId: formData.taskId || undefined,
        startTime: new Date(formData.startTime).toISOString(),
        duration: durationSeconds,
        notes: formData.notes.trim() || undefined,
        tags,
        updatedAt: new Date().toISOString(),
      });
      toast.success('Entrada atualizada!');
    } else {
      const entry: TimeEntry = {
        id: generateId('entry'),
        projectId: formData.projectId,
        taskId: formData.taskId || undefined,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(new Date(formData.startTime).getTime() + durationSeconds * 1000).toISOString(),
        duration: durationSeconds,
        notes: formData.notes.trim() || undefined,
        tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isRunning: false,
      };
      timeEntryStorage.create(entry);
      toast.success('Entrada criada!');
    }

    setDialogOpen(false);
    resetForm();
    // Force re-render
    setDateRange(dateRange);
  };

  const handleDelete = (id: string) => {
    setConfirmDialog({ open: true, entryId: id });
  };

  const confirmDeleteEntry = () => {
    if (confirmDialog.entryId) {
      timeEntryStorage.delete(confirmDialog.entryId);
      toast.success('Entrada deletada!');
      setConfirmDialog({ open: false, entryId: null });
      setDateRange(dateRange); // Force re-render
    }
  };

  const handleExportCSV = () => {
    const data = filteredEntries.map(e => {
      const project = projects.find(p => p.id === e.projectId);
      const task = e.taskId ? tasks.find(t => t.id === e.taskId) : null;
      return {
        Data: new Date(e.startTime).toLocaleDateString('pt-BR'),
        Projeto: project?.name || 'Unknown',
        Tarefa: task?.name || '-',
        Início: new Date(e.startTime).toLocaleString('pt-BR'),
        Duração: `${(e.duration / 3600).toFixed(2)}h`,
        Notas: e.notes || '-',
        Tags: e.tags.join(', ') || '-',
      };
    });

    exportToCSV(data, `timesheet_${dateRange}_${new Date().toISOString().split('T')[0]}`);
    toast.success('Exportado com sucesso!');
  };

  const handleExportJSON = () => {
    exportToJSON(filteredEntries, `timesheet_${dateRange}_${new Date().toISOString().split('T')[0]}`);
    toast.success('Exportado com sucesso!');
  };

  const availableTasks = formData.projectId
    ? tasks.filter(t => t.projectId === formData.projectId)
    : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Timesheet</h1>
          <p className="text-muted-foreground">
            {filteredEntries.length} {filteredEntries.length === 1 ? 'entrada' : 'entradas'} · {formatHours(totalHours)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExportCSV}>
            <Download className="w-4 h-4" />
            CSV
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleExportJSON}>
            <Download className="w-4 h-4" />
            JSON
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4" />
                Nova Entrada
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingEntry ? 'Editar Entrada' : 'Nova Entrada Manual'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Projeto *</Label>
                    <Select value={formData.projectId} onValueChange={projectId => setFormData({ ...formData, projectId, taskId: '' })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
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
                    <Label>Tarefa (opcional)</Label>
                    <Select value={formData.taskId || 'none'} onValueChange={taskId => setFormData({ ...formData, taskId: taskId === 'none' ? '' : taskId })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma tarefa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {availableTasks.map(task => (
                          <SelectItem key={task.id} value={task.id}>
                            {task.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data e Hora *</Label>
                    <Input
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Duração (minutos) *</Label>
                    <Input
                      type="number"
                      value={formData.duration}
                      onChange={e => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="60"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Adicione notas sobre esta entrada..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tags (separadas por vírgula)</Label>
                  <Input
                    value={formData.tags}
                    onChange={e => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="reunião, desenvolvimento, revisão"
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="flex-1">
                    {editingEntry ? 'Salvar' : 'Criar'}
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
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2">
            <Button
              variant={dateRange === 'today' ? 'default' : 'outline'}
              onClick={() => setDateRange('today')}
            >
              Hoje
            </Button>
            <Button
              variant={dateRange === 'week' ? 'default' : 'outline'}
              onClick={() => setDateRange('week')}
            >
              Semana
            </Button>
            <Button
              variant={dateRange === 'month' ? 'default' : 'outline'}
              onClick={() => setDateRange('month')}
            >
              Mês
            </Button>
          </div>

          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar..."
              className="pl-10"
            />
          </div>

          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Projeto" />
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

          <AdvancedFilters
            filters={advancedFilters}
            onFiltersChange={setAdvancedFilters}
            onReset={() => setAdvancedFilters({
              projectIds: [],
              taskIds: [],
              tags: [],
            })}
          />
        </div>
      </Card>

      {/* Entries List */}
      {filteredEntries.length > 0 ? (
        <div ref={listRef} className="space-y-2">
          {filteredEntries.map(entry => (
            <TimeEntryRow
              key={entry.id}
              entry={entry}
              onEdit={() => handleOpenDialog(entry)}
              onDelete={() => handleDelete(entry.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">Nenhuma entrada de tempo encontrada</p>
          <Button onClick={() => handleOpenDialog()}>
            Criar Primeira Entrada
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title="Deletar Entrada"
        description="Tem certeza que deseja deletar esta entrada de tempo? Esta ação não pode ser desfeita."
        onConfirm={confirmDeleteEntry}
        destructive
      />
    </div>
  );
}
