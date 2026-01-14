/**
 * Templates Page
 * Manage project templates
 */

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Layers, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { templateStorage, ProjectTemplate } from '@/lib/storage/templates';
import { projectStorage, taskStorage } from '@/lib/storage';
import { generateProjectColor, generateId } from '@/lib/utils';
import { toast } from 'sonner';

export function TemplatesPage() {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProjectTemplate | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; templateId: string | null }>({
    open: false,
    templateId: null,
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: generateProjectColor(),
    tags: '',
    tasks: [{ name: '', priority: 'medium' as 'low' | 'medium' | 'high', estimatedHours: '' }],
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    templateStorage.createDefaults(); // Create defaults if none exist
    setTemplates(templateStorage.getAll());
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: generateProjectColor(),
      tags: '',
      tasks: [{ name: '', priority: 'medium', estimatedHours: '' }],
    });
    setEditingTemplate(null);
  };

  const handleOpenDialog = (template?: ProjectTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        description: template.description || '',
        color: template.color,
        tags: template.tags.join(', '),
        tasks: template.defaultTasks.map(t => ({
          name: t.name,
          priority: t.priority,
          estimatedHours: t.estimatedHours?.toString() || '',
        })),
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Nome do template é obrigatório');
      return;
    }

    const tags = formData.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const defaultTasks = formData.tasks
      .filter(t => t.name.trim())
      .map(t => ({
        name: t.name.trim(),
        priority: t.priority,
        estimatedHours: t.estimatedHours ? parseFloat(t.estimatedHours) : undefined,
      }));

    if (editingTemplate) {
      templateStorage.update(editingTemplate.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color,
        tags,
        defaultTasks,
      });
      toast.success('Template atualizado!');
    } else {
      templateStorage.create({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color,
        tags,
        defaultTasks,
      });
      toast.success('Template criado!');
    }

    setDialogOpen(false);
    resetForm();
    loadTemplates();
  };

  const handleDelete = (id: string) => {
    setConfirmDialog({ open: true, templateId: id });
  };

  const confirmDelete = () => {
    if (confirmDialog.templateId) {
      templateStorage.delete(confirmDialog.templateId);
      toast.success('Template deletado!');
      setConfirmDialog({ open: false, templateId: null });
      loadTemplates();
    }
  };

  const handleUseTemplate = (template: ProjectTemplate) => {
    // Create project from template
    const project = {
      id: generateId('project'),
      name: template.name,
      description: template.description,
      color: template.color,
      tags: [...template.tags],
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    projectStorage.create(project);

    // Create tasks from template
    template.defaultTasks.forEach(taskData => {
      taskStorage.create({
        id: generateId('task'),
        projectId: project.id,
        name: taskData.name,
        description: taskData.description,
        status: 'todo',
        priority: taskData.priority,
        tags: [],
        estimatedHours: taskData.estimatedHours,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    toast.success(`Projeto "${project.name}" criado a partir do template!`);
  };

  const addTask = () => {
    setFormData({
      ...formData,
      tasks: [...formData.tasks, { name: '', priority: 'medium', estimatedHours: '' }],
    });
  };

  const removeTask = (index: number) => {
    setFormData({
      ...formData,
      tasks: formData.tasks.filter((_, i) => i !== index),
    });
  };

  const updateTask = (index: number, field: string, value: string) => {
    const newTasks = [...formData.tasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setFormData({ ...formData, tasks: newTasks });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Templates de Projeto</h1>
          <p className="text-muted-foreground">
            Crie projetos rapidamente usando templates pré-configurados
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2" onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Editar Template' : 'Novo Template'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Template *</Label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Desenvolvimento Web"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do template"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={e => setFormData({ ...formData, color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormData({ ...formData, color: generateProjectColor() })}
                    >
                      Aleatória
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <Input
                    value={formData.tags}
                    onChange={e => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="trabalho, web, urgente"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Tarefas Padrão</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addTask}>
                    <Plus className="w-3 h-3 mr-2" />
                    Adicionar Tarefa
                  </Button>
                </div>

                {formData.tasks.map((task, index) => (
                  <Card key={index} className="p-3">
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          value={task.name}
                          onChange={e => updateTask(index, 'name', e.target.value)}
                          placeholder="Nome da tarefa"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTask(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={task.priority}
                          onValueChange={v => updateTask(index, 'priority', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Baixa</SelectItem>
                            <SelectItem value="medium">Média</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          value={task.estimatedHours}
                          onChange={e => updateTask(index, 'estimatedHours', e.target.value)}
                          placeholder="Horas estimadas"
                          min="0"
                          step="0.5"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  {editingTemplate ? 'Salvar' : 'Criar Template'}
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

      {/* Templates Grid */}
      {templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <Card key={template.id} className="p-5">
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${template.color}20`, color: template.color }}
                >
                  <Layers className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-1">{template.name}</h3>
                  {template.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                  )}
                </div>
              </div>

              {template.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {template.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="text-sm text-muted-foreground mb-4">
                {template.defaultTasks.length} {template.defaultTasks.length === 1 ? 'tarefa' : 'tarefas'} padrão
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => handleUseTemplate(template)}
                >
                  <Check className="w-4 h-4" />
                  Usar Template
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenDialog(template)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(template.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Nenhum template ainda
          </p>
          <Button onClick={() => handleOpenDialog()}>
            Criar Primeiro Template
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title="Deletar Template"
        description="Tem certeza que deseja deletar este template? Esta ação não pode ser desfeita."
        onConfirm={confirmDelete}
        destructive
      />
    </div>
  );
}
