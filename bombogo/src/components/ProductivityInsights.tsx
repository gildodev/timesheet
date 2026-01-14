/**
 * Productivity Insights Component (Premium)
 * AI-powered insights and recommendations
 */

import { useEffect, useState } from 'react';
import { Lightbulb, TrendingUp, TrendingDown, Clock, Zap, Coffee, AlertCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { PremiumBadge } from './PremiumBadge';
import { timeEntryStorage, pomodoroStorage } from '@/lib/storage';
import { ReportGenerator } from '@/lib/reports';

interface Insight {
  type: 'success' | 'warning' | 'info' | 'tip';
  icon: any;
  title: string;
  description: string;
}

export function ProductivityInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    generateInsights();
  }, []);

  const generateInsights = () => {
    const newInsights: Insight[] = [];

    // Get data
    const todayEntries = timeEntryStorage.getTodayEntries();
    const weekEntries = timeEntryStorage.getWeekEntries();
    const todaySeconds = timeEntryStorage.calculateTotalDuration(todayEntries);
    const weekSeconds = timeEntryStorage.calculateTotalDuration(weekEntries);
    const todayHours = todaySeconds / 3600;
    const weekHours = weekSeconds / 3600;
    const averageDaily = weekHours / 7;

    const pomodoroStats = pomodoroStorage.getTodayStats();
    const { current: streak } = ReportGenerator.calculateStreak();

    // Insight 1: Daily Performance
    if (todayHours > averageDaily * 1.2) {
      newInsights.push({
        type: 'success',
        icon: TrendingUp,
        title: 'Dia Produtivo!',
        description: `Você está ${Math.round(((todayHours / averageDaily) - 1) * 100)}% acima da sua média diária.`,
      });
    } else if (todayHours < averageDaily * 0.5 && todayHours > 0) {
      newInsights.push({
        type: 'warning',
        icon: TrendingDown,
        title: 'Abaixo da Média',
        description: `Você está ${Math.round((1 - (todayHours / averageDaily)) * 100)}% abaixo da sua média diária.`,
      });
    }

    // Insight 2: Streak
    if (streak >= 7) {
      newInsights.push({
        type: 'success',
        icon: Zap,
        title: 'Sequência Impressionante!',
        description: `Você está em uma sequência de ${streak} dias! Continue assim!`,
      });
    } else if (streak === 0 && weekHours > 0) {
      newInsights.push({
        type: 'info',
        icon: AlertCircle,
        title: 'Volte à Rotina',
        description: 'Sua sequência foi interrompida. Que tal retomar hoje?',
      });
    }

    // Insight 3: Best Time
    const hourlyMap = new Map<number, number>();
    todayEntries.forEach(entry => {
      const hour = new Date(entry.startTime).getHours();
      const current = hourlyMap.get(hour) || 0;
      hourlyMap.set(hour, current + entry.duration);
    });

    if (hourlyMap.size > 0) {
      const bestHour = Array.from(hourlyMap.entries()).reduce((best, [hour, duration]) =>
        duration > best[1] ? [hour, duration] : best
      )[0];

      const timeOfDay = bestHour < 12 ? 'manhã' : bestHour < 18 ? 'tarde' : 'noite';
      newInsights.push({
        type: 'info',
        icon: Clock,
        title: 'Horário de Pico',
        description: `Você é mais produtivo na ${timeOfDay} (${bestHour}h).`,
      });
    }

    // Insight 4: Pomodoro Usage
    if (pomodoroStats.completedWorkSessions >= 4) {
      newInsights.push({
        type: 'success',
        icon: Coffee,
        title: 'Mestre do Pomodoro!',
        description: `${pomodoroStats.completedWorkSessions} sessões completas hoje!`,
      });
    } else if (pomodoroStats.completedWorkSessions === 0 && todayHours > 2) {
      newInsights.push({
        type: 'tip',
        icon: Lightbulb,
        title: 'Experimente o Pomodoro',
        description: 'Use a técnica Pomodoro para manter o foco e evitar fadiga.',
      });
    }

    // Insight 5: Work-Life Balance
    if (todayHours > 10) {
      newInsights.push({
        type: 'warning',
        icon: AlertCircle,
        title: 'Cuide-se!',
        description: 'Você já trabalhou muito hoje. Lembre-se de fazer pausas.',
      });
    }

    // Insight 6: Weekly Trend
    const lastWeekEntries = timeEntryStorage.getEntriesByDateRange(
      new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    const lastWeekSeconds = timeEntryStorage.calculateTotalDuration(lastWeekEntries);
    const lastWeekHours = lastWeekSeconds / 3600;

    if (weekHours > lastWeekHours * 1.15) {
      newInsights.push({
        type: 'success',
        icon: TrendingUp,
        title: 'Tendência Positiva',
        description: `Você está ${Math.round(((weekHours / lastWeekHours) - 1) * 100)}% mais produtivo que a semana passada.`,
      });
    }

    // Insight 7: Empty State
    if (newInsights.length === 0) {
      newInsights.push({
        type: 'tip',
        icon: Lightbulb,
        title: 'Comece seu Dia',
        description: 'Inicie um timer para começar a receber insights personalizados!',
      });
    }

    setInsights(newInsights);
  };

  const getIconColor = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'info':
        return 'text-primary';
      case 'tip':
        return 'text-accent';
    }
  };

  const getBgColor = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return 'bg-success/10';
      case 'warning':
        return 'bg-warning/10';
      case 'info':
        return 'bg-primary/10';
      case 'tip':
        return 'bg-accent/10';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center premium-glow">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Insights de Produtividade</h2>
            <p className="text-sm text-muted-foreground">Análise inteligente do seu desempenho</p>
          </div>
        </div>
        <PremiumBadge size="sm" />
      </div>

      <div className="space-y-3">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <div
              key={index}
              className={`p-4 rounded-lg ${getBgColor(insight.type)} border border-${insight.type === 'success' ? 'success' : insight.type === 'warning' ? 'warning' : insight.type === 'info' ? 'primary' : 'accent'}/20`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg ${getBgColor(insight.type)} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${getIconColor(insight.type)}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{insight.title}</h3>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
