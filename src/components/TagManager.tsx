/**
 * Tag Manager Component
 * Centralized tag management
 */

import { useState, useEffect } from 'react';
import { X, Plus, Hash } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useProjects, useTasks } from '@/hooks';
import { toast } from 'sonner';

interface TagManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TagManager({ open, onOpenChange }: TagManagerProps) {
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const [newTag, setNewTag] = useState('');
  const [allTags, setAllTags] = useState<{ tag: string; count: number; color: string }[]>([]);

  useEffect(() => {
    // Collect all tags from projects and tasks
    const tagMap = new Map<string, { count: number; color: string }>();

    projects.forEach(p => {
      p.tags.forEach(tag => {
        const current = tagMap.get(tag) || { count: 0, color: p.color };
        tagMap.set(tag, { count: current.count + 1, color: p.color });
      });
    });

    tasks.forEach(t => {
      t.tags.forEach(tag => {
        const current = tagMap.get(tag) || { count: 0, color: '#6366f1' };
        tagMap.set(tag, { count: current.count + 1, color: current.color });
      });
    });

    const tags = Array.from(tagMap.entries())
      .map(([tag, data]) => ({ tag, ...data }))
      .sort((a, b) => b.count - a.count);

    setAllTags(tags);
  }, [projects, tasks]);

  const handleAddTag = () => {
    if (!newTag.trim()) {
      toast.error('Digite um nome para a tag');
      return;
    }

    // Add to localStorage for quick suggestions
    const existingTags = JSON.parse(localStorage.getItem('timeflow_suggested_tags') || '[]');
    if (!existingTags.includes(newTag.trim())) {
      existingTags.push(newTag.trim());
      localStorage.setItem('timeflow_suggested_tags', JSON.stringify(existingTags));
    }

    toast.success('Tag adicionada às sugestões!');
    setNewTag('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gerenciar Tags</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Tag */}
          <Card className="p-4">
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Nova tag..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <Button onClick={handleAddTag}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </Card>

          {/* All Tags */}
          <div>
            <h3 className="font-semibold mb-3">
              Todas as Tags ({allTags.length})
            </h3>
            {allTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {allTags.map(({ tag, count, color }) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="gap-2"
                    style={{ borderColor: color, color: color }}
                  >
                    <Hash className="w-3 h-3" />
                    {tag}
                    <span className="text-xs text-muted-foreground">({count})</span>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma tag encontrada. Adicione tags aos seus projetos e tarefas.
              </p>
            )}
          </div>

          {/* Quick Suggestions */}
          <div>
            <h3 className="font-semibold mb-3">Sugestões Rápidas</h3>
            <div className="flex flex-wrap gap-2">
              {['trabalho', 'pessoal', 'urgente', 'bug', 'feature', 'reunião', 'estudo'].map(
                tag => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer gap-1">
                    <Hash className="w-3 h-3" />
                    {tag}
                  </Badge>
                )
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
