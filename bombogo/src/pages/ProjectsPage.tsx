/**
 * Projects Page
 * Manage projects
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProjectCard } from '@/components/ProjectCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useProjects } from '@/hooks';
import { Project } from '@/types';
import { generateProjectColor } from '@/lib/utils';
import { toast } from 'sonner';
import gsap from 'gsap';

export function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, createProject, updateProject, deleteProject, archiveProject } = useProjects();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; projectId: string | null }>({
    open: false,
    projectId: null,
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: generateProjectColor(),
    tags: '',
    isPermanent: true,
    startDate: '',
    endDate: '',
  });

  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gridRef.current) {
      const cards = gridRef.current.children;
      gsap.fromTo(
        cards,
        { scale: 0.9, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.3,
          stagger: 0.05,
          ease: 'back.out(1.2)',
        }
      );
    }
  }, [projects, searchQuery]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: generateProjectColor(),
      tags: '',
      isPermanent: true,
      startDate: '',
      endDate: '',
    });
    setEditingProject(null);
  };

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        description: project.description || '',
        color: project.color,
        tags: project.tags.join(', '),
        isPermanent: project.isPermanent ?? true,
        startDate: project.startDate || '',
        endDate: project.endDate || '',
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Nome do projeto é obrigatório');
      return;
    }

    const tags = formData.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    if (editingProject) {
      updateProject(editingProject.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color,
        tags,
        isPermanent: formData.isPermanent,
        startDate: formData.startDate || undefined,
        endDate: !formData.isPermanent && formData.endDate ? formData.endDate : undefined,
      });
      toast.success('Projeto atualizado!');
    } else {
      createProject({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color,
        tags,
        isPermanent: formData.isPermanent,
        startDate: formData.startDate || undefined,
        endDate: !formData.isPermanent && formData.endDate ? formData.endDate : undefined,
      });
      toast.success('Projeto criado!');
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setConfirmDialog({ open: true, projectId: id });
  };

  const confirmDelete = () => {
    if (confirmDialog.projectId) {
      deleteProject(confirmDialog.projectId);
      toast.success('Projeto deletado!');
      setConfirmDialog({ open: false, projectId: null });
    }
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Projetos</h1>
          <p className="text-muted-foreground">
            {projects.length} {projects.length === 1 ? 'projeto' : 'projetos'} no total
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2" onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4" />
              Novo Projeto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProject ? 'Editar Projeto' : 'Novo Projeto'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do projeto"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do projeto"
                  rows={3}
                />
              </div>

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
                <Label>Tags (separadas por vírgula)</Label>
                <Input
                  value={formData.tags}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="trabalho, pessoal, urgente"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPermanent"
                    checked={formData.isPermanent}
                    onChange={e => setFormData({ ...formData, isPermanent: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <Label htmlFor="isPermanent" className="cursor-pointer">
                    Projeto Permanente (sem data fim)
                  </Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data de Início</Label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>

                  {!formData.isPermanent && (
                    <div className="space-y-2">
                      <Label>Data de Fim</Label>
                      <Input
                        type="date"
                        value={formData.endDate}
                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                        min={formData.startDate}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  {editingProject ? 'Salvar' : 'Criar'}
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar projetos..."
          className="pl-10"
        />
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => navigate(`/projects/${project.id}`)}
              onEdit={() => handleOpenDialog(project)}
              onDelete={() => handleDelete(project.id)}
              onArchive={() => {
                archiveProject(project.id);
                toast.success('Projeto arquivado!');
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery ? 'Nenhum projeto encontrado' : 'Nenhum projeto ainda'}
          </p>
          {!searchQuery && (
            <Button
              className="mt-4"
              onClick={() => handleOpenDialog()}
            >
              Criar Primeiro Projeto
            </Button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title="Deletar Projeto"
        description="Tem certeza que deseja deletar este projeto? Esta ação não pode ser desfeita e todas as tarefas e entradas de tempo associadas serão perdidas."
        onConfirm={confirmDelete}
        destructive
      />
    </div>
  );
}
