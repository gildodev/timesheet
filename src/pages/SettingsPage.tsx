/**
 * Settings Page
 * App settings and preferences
 */

import { useState } from 'react';
import { Moon, Sun, Laptop, Trash2, Crown, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PremiumBadge } from '@/components/PremiumBadge';
import { useTheme, usePremium } from '@/hooks';
import { userStorage, goalStorage } from '@/lib/storage';
import { formatDate, exportToJSON, downloadFile } from '@/lib/utils';
import { toast } from 'sonner';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { isPremium, activatePremium, deactivatePremium } = usePremium();
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: '' });

  const user = userStorage.getUser();
  const settings = userStorage.getSettings();

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    toast.success('Tema alterado!');
  };

  const handleTogglePremium = () => {
    if (isPremium) {
      deactivatePremium();
      toast.success('Premium desativado');
    } else {
      activatePremium();
      toast.success('Premium ativado! 🎉');
    }
  };

  const handleCreateGoals = () => {
    goalStorage.createDailyGoal(8);
    goalStorage.createWeeklyGoal(40);
    goalStorage.createMonthlyGoal(160);
    toast.success('Metas criadas!');
  };

  const handleExportData = () => {
    const allData = {
      user: userStorage.getUser(),
      settings: userStorage.getSettings(),
      projects: localStorage.getItem('timeflow_projects'),
      tasks: localStorage.getItem('timeflow_tasks'),
      timeEntries: localStorage.getItem('timeflow_time_entries'),
      goals: localStorage.getItem('timeflow_goals'),
      pomodoro: {
        sessions: localStorage.getItem('timeflow_pomodoro_sessions'),
        settings: localStorage.getItem('timeflow_pomodoro_settings'),
      },
      exportDate: new Date().toISOString(),
    };

    exportToJSON(allData, `timeflow_backup_${new Date().toISOString().split('T')[0]}`);
    toast.success('Dados exportados com sucesso!');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        // Restore data
        if (data.projects) localStorage.setItem('timeflow_projects', data.projects);
        if (data.tasks) localStorage.setItem('timeflow_tasks', data.tasks);
        if (data.timeEntries) localStorage.setItem('timeflow_time_entries', data.timeEntries);
        if (data.goals) localStorage.setItem('timeflow_goals', data.goals);
        if (data.pomodoro?.sessions) localStorage.setItem('timeflow_pomodoro_sessions', data.pomodoro.sessions);
        if (data.pomodoro?.settings) localStorage.setItem('timeflow_pomodoro_settings', data.pomodoro.settings);

        toast.success('Dados importados! Recarregue a página.');
      } catch (error) {
        toast.error('Erro ao importar dados. Arquivo inválido.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    userStorage.resetAllData();
    toast.success('Dados resetados! Recarregando...');
    setTimeout(() => window.location.reload(), 1000);
  };

  const confirmReset = () => {
    if (confirmDialog.type === 'reset') {
      handleResetData();
      setConfirmDialog({ open: false, type: '' });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Configurações</h1>
        <p className="text-muted-foreground">
          Personalize sua experiência no TimeFlow
        </p>
      </div>

      {/* User Info */}
      {user && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Informações do Usuário</h2>
          <div className="space-y-3">
            <div>
              <Label>Nome</Label>
              <p className="text-sm font-medium mt-1">{user.name}</p>
            </div>
            {user.email && (
              <div>
                <Label>Email</Label>
                <p className="text-sm font-medium mt-1">{user.email}</p>
              </div>
            )}
            <div>
              <Label>Membro desde</Label>
              <p className="text-sm font-medium mt-1">{formatDate(user.createdAt)}</p>
            </div>
            <div>
              <Label>Status</Label>
              <div className="mt-1">
                {isPremium ? (
                  <PremiumBadge />
                ) : (
                  <span className="text-sm text-muted-foreground">Plano Gratuito</span>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Appearance */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Aparência</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tema</Label>
            <Select value={theme} onValueChange={handleThemeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4" />
                    Claro
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4" />
                    Escuro
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Laptop className="w-4 h-4" />
                    Sistema
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Premium */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Plano Premium</h2>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20">
            <div className="flex items-center gap-3 mb-3">
              <Crown className="w-6 h-6 text-yellow-500" />
              <div>
                <h3 className="font-semibold">Recursos Premium</h3>
                <p className="text-sm text-muted-foreground">
                  Desbloqueie todo o potencial do TimeFlow
                </p>
              </div>
            </div>
            <ul className="space-y-2 text-sm mb-4">
              <li>📊 Relatórios mensais avançados</li>
              <li>🔥 Heatmap de atividade GitHub-style</li>
              <li>🎯 Sistema de metas e objetivos</li>
              <li>📈 Previsões de produtividade</li>
              <li>💾 Exportação PDF profissional</li>
              <li>📊 Estatísticas detalhadas por tags</li>
            </ul>
            <Button
              className="w-full gap-2"
              variant={isPremium ? 'outline' : 'default'}
              onClick={handleTogglePremium}
            >
              <Crown className="w-4 h-4" />
              {isPremium ? 'Desativar Premium' : 'Ativar Premium'}
            </Button>
          </div>

          {isPremium && (
            <Button variant="outline" className="w-full" onClick={handleCreateGoals}>
              Criar Metas Padrão
            </Button>
          )}
        </div>
      </Card>

      {/* Data Management */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Gerenciamento de Dados</h2>
        <div className="space-y-3">
          <Button variant="outline" className="w-full gap-2" onClick={handleExportData}>
            <Download className="w-4 h-4" />
            Exportar Todos os Dados
          </Button>

          <div>
            <Input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
              id="import-file"
            />
            <Label htmlFor="import-file" className="cursor-pointer">
              <div className="w-full flex items-center justify-center gap-2 px-4 py-2 border rounded-md hover:bg-secondary transition-colors">
                <Upload className="w-4 h-4" />
                Importar Dados
              </div>
            </Label>
          </div>

          <Button
            variant="destructive"
            className="w-full gap-2"
            onClick={() => setConfirmDialog({ open: true, type: 'reset' })}
          >
            <Trash2 className="w-4 h-4" />
            Resetar Todos os Dados
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            ⚠️ O reset é permanente e não pode ser desfeito
          </p>
        </div>
      </Card>

      {/* About */}
      <Card className="p-6 text-center">
        <h2 className="text-lg font-semibold mb-2">TimeFlow</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Versão 1.0.0 · 100% Offline · Código Aberto
        </p>
        <p className="text-xs text-muted-foreground">
          Todos os seus dados são armazenados localmente no navegador.
          <br />
          Nenhuma informação é enviada para servidores externos.
        </p>
      </Card>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title="Resetar Todos os Dados"
        description="Esta ação irá deletar permanentemente todos os seus projetos, tarefas, entradas de tempo e configurações. Esta ação não pode ser desfeita."
        onConfirm={confirmReset}
        confirmText="Sim, resetar tudo"
        destructive
      />
    </div>
  );
}
