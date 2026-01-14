/**
 * Compare Page (Premium)
 * Compare different time periods side by side
 */

import { useState } from 'react';
import { TrendingUp, TrendingDown, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PremiumBadge } from '@/components/PremiumBadge';
import { ReportChart } from '@/components/ReportChart';
import { usePremium, useProjects } from '@/hooks';
import { ReportGenerator } from '@/lib/reports';
import { formatHours, cn } from '@/lib/utils';
import { Report } from '@/types';

export function ComparePage() {
  const { isPremium } = usePremium();
  const { projects } = useProjects();
  
  const [compareType, setCompareType] = useState<'week' | 'month'>('week');
  const [period1Date, setPeriod1Date] = useState(new Date().toISOString().split('T')[0]);
  const [period2Date, setPeriod2Date] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  if (!isPremium) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center premium-glow">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold">Recurso Premium</h3>
            <p className="text-muted-foreground">
              A comparação de períodos está disponível apenas no plano Premium.
            </p>
            <Button className="gap-2">
              Ativar Premium
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Generate reports for both periods
  let report1: Report;
  let report2: Report;

  if (compareType === 'week') {
    report1 = ReportGenerator.generateWeekReport(new Date(period1Date));
    report2 = ReportGenerator.generateWeekReport(new Date(period2Date));
  } else {
    report1 = ReportGenerator.generateMonthReport(new Date(period1Date));
    report2 = ReportGenerator.generateMonthReport(new Date(period2Date));
  }

  // Calculate differences
  const totalDiff = report1.totalHours - report2.totalHours;
  const totalDiffPercent = report2.totalHours > 0 
    ? ((totalDiff / report2.totalHours) * 100).toFixed(1)
    : '0';

  const avgDiff = report1.averageHoursPerDay - report2.averageHoursPerDay;
  const avgDiffPercent = report2.averageHoursPerDay > 0
    ? ((avgDiff / report2.averageHoursPerDay) * 100).toFixed(1)
    : '0';

  const ComparisonCard = ({ 
    title, 
    value1, 
    value2, 
    diff, 
    diffPercent 
  }: { 
    title: string;
    value1: string;
    value2: string;
    diff: number;
    diffPercent: string;
  }) => {
    const isPositive = diff > 0;
    const isNeutral = diff === 0;

    return (
      <Card className="p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">{title}</h3>
        <div className="flex items-center justify-between mb-3">
          <div className="text-2xl font-bold">{value1}</div>
          <ArrowRight className="w-5 h-5 text-muted-foreground" />
          <div className="text-2xl font-bold">{value2}</div>
        </div>
        <div className={cn(
          'flex items-center gap-2 text-sm font-medium',
          isPositive && 'text-success',
          !isPositive && !isNeutral && 'text-destructive',
          isNeutral && 'text-muted-foreground'
        )}>
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : !isNeutral ? (
            <TrendingDown className="w-4 h-4" />
          ) : null}
          <span>
            {isPositive ? '+' : ''}{diff > 0 ? formatHours(diff) : formatHours(Math.abs(diff))}
            {' '}({isPositive ? '+' : ''}{diffPercent}%)
          </span>
        </div>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Comparação de Períodos</h1>
          <PremiumBadge />
        </div>
      </div>

      {/* Period Selection */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Comparação</Label>
            <Select value={compareType} onValueChange={(v: 'week' | 'month') => setCompareType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Semanas</SelectItem>
                <SelectItem value="month">Meses</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Período 1 (Mais Recente)</Label>
            <Input
              type="date"
              value={period1Date}
              onChange={e => setPeriod1Date(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Período 2 (Comparar com)</Label>
            <Input
              type="date"
              value={period2Date}
              onChange={e => setPeriod2Date(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Comparison Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ComparisonCard
          title="Total de Horas"
          value1={formatHours(report1.totalHours)}
          value2={formatHours(report2.totalHours)}
          diff={totalDiff}
          diffPercent={totalDiffPercent}
        />

        <ComparisonCard
          title="Média por Dia"
          value1={formatHours(report1.averageHoursPerDay)}
          value2={formatHours(report2.averageHoursPerDay)}
          diff={avgDiff}
          diffPercent={avgDiffPercent}
        />

        <ComparisonCard
          title="Melhor Dia"
          value1={formatHours(report1.bestDay.hours)}
          value2={formatHours(report2.bestDay.hours)}
          diff={report1.bestDay.hours - report2.bestDay.hours}
          diffPercent={
            report2.bestDay.hours > 0
              ? (((report1.bestDay.hours - report2.bestDay.hours) / report2.bestDay.hours) * 100).toFixed(1)
              : '0'
          }
        />
      </div>

      {/* Charts Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Período 1
            </h2>
            <span className="text-sm text-muted-foreground">
              {new Date(period1Date).toLocaleDateString('pt-BR')}
            </span>
          </div>
          <ReportChart report={report1} type="line" dataType="daily" />
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Período 2
            </h2>
            <span className="text-sm text-muted-foreground">
              {new Date(period2Date).toLocaleDateString('pt-BR')}
            </span>
          </div>
          <ReportChart report={report2} type="line" dataType="daily" />
        </Card>
      </div>

      {/* Project Breakdown Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Período 1 - Por Projeto</h2>
          {report1.projectBreakdown.length > 0 ? (
            <ReportChart report={report1} type="pie" dataType="project" />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Sem dados
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Período 2 - Por Projeto</h2>
          {report2.projectBreakdown.length > 0 ? (
            <ReportChart report={report2} type="pie" dataType="project" />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Sem dados
            </div>
          )}
        </Card>
      </div>

      {/* Project-by-Project Comparison */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Comparação Detalhada por Projeto</h2>
        <div className="space-y-3">
          {projects.map(project => {
            const p1Data = report1.projectBreakdown.find(p => p.projectId === project.id);
            const p2Data = report2.projectBreakdown.find(p => p.projectId === project.id);
            
            const hours1 = p1Data?.hours || 0;
            const hours2 = p2Data?.hours || 0;
            const diff = hours1 - hours2;

            if (hours1 === 0 && hours2 === 0) return null;

            return (
              <div key={project.id} className="flex items-center gap-4 p-3 rounded-lg border">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <div className="flex-1">
                  <h4 className="font-medium">{project.name}</h4>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="w-16 text-right">{formatHours(hours1)}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="w-16">{formatHours(hours2)}</span>
                  <span className={cn(
                    'w-20 text-right font-medium',
                    diff > 0 && 'text-success',
                    diff < 0 && 'text-destructive',
                    diff === 0 && 'text-muted-foreground'
                  )}>
                    {diff > 0 ? '+' : ''}{formatHours(Math.abs(diff))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
