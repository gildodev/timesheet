/**
 * Reports Page
 * View analytics and reports
 */

import { useState, useEffect, useRef } from 'react';
import { Calendar, Download, TrendingUp, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportChart } from '@/components/ReportChart';
import { Heatmap } from '@/components/Heatmap';
import { PremiumBadge } from '@/components/PremiumBadge';
import { usePremium } from '@/hooks';
import { ReportGenerator } from '@/lib/reports';
import { formatHours, exportToJSON } from '@/lib/utils';
import { Report } from '@/types';
import { toast } from 'sonner';
import gsap from 'gsap';

export function ReportsPage() {
  const { isPremium } = usePremium();
  const [activeTab, setActiveTab] = useState('week');
  
  const cardsRef = useRef<HTMLDivElement>(null);

  // Generate reports
  const dayReport = ReportGenerator.generateDayReport(new Date());
  const weekReport = ReportGenerator.generateWeekReport(new Date());
  const monthReport = ReportGenerator.generateMonthReport(new Date());

  // Get current report based on active tab
  let currentReport: Report = weekReport;
  switch (activeTab) {
    case 'day':
      currentReport = dayReport;
      break;
    case 'week':
      currentReport = weekReport;
      break;
    case 'month':
      currentReport = monthReport;
      break;
  }

  // Generate heatmap data for current year
  const currentYear = new Date().getFullYear();
  const heatmapData = ReportGenerator.generateHeatmapData(currentYear);

  useEffect(() => {
    if (cardsRef.current) {
      const cards = cardsRef.current.children;
      gsap.fromTo(
        cards,
        { scale: 0.95, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.4,
          stagger: 0.1,
          ease: 'back.out(1.2)',
        }
      );
    }
  }, [activeTab]);

  const handleExport = () => {
    const data = {
      period: currentReport.period,
      startDate: currentReport.startDate,
      endDate: currentReport.endDate,
      totalHours: currentReport.totalHours,
      averageHoursPerDay: currentReport.averageHoursPerDay,
      bestDay: currentReport.bestDay,
      projects: currentReport.projectBreakdown,
      tags: currentReport.tagBreakdown,
      daily: currentReport.dailyBreakdown,
      prediction: currentReport.prediction,
    };

    exportToJSON(data, `report_${currentReport.period}_${new Date().toISOString().split('T')[0]}`);
    toast.success('Relatório exportado!');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Relatórios</h1>
          <p className="text-muted-foreground">
            Análise detalhada da sua produtividade
          </p>
        </div>

        <Button variant="outline" className="gap-2" onClick={handleExport}>
          <Download className="w-4 h-4" />
          Exportar Relatório
        </Button>
      </div>

      {/* Period Selector */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="day">Hoje</TabsTrigger>
          <TabsTrigger value="week">Semana</TabsTrigger>
          <TabsTrigger value="month">
            <div className="flex items-center gap-2">
              Mês
              {isPremium && <PremiumBadge size="sm" />}
            </div>
          </TabsTrigger>
        </TabsList>

        {/* Stats Cards */}
        <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <Card className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">{formatHours(currentReport.totalHours)}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">
              {formatHours(currentReport.averageHoursPerDay)}
            </div>
            <div className="text-sm text-muted-foreground">Média/Dia</div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-warning" />
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">
              {formatHours(currentReport.bestDay.hours)}
            </div>
            <div className="text-sm text-muted-foreground">Melhor Dia</div>
          </Card>

          {isPremium && currentReport.prediction && (
            <Card className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center premium-glow">
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <PremiumBadge size="sm" />
              </div>
              <div className="text-2xl font-bold mb-1">
                {formatHours(currentReport.prediction.nextWeekHours)}
              </div>
              <div className="text-sm text-muted-foreground">
                Previsão Próxima Semana
              </div>
            </Card>
          )}
        </div>

        {/* Day Report */}
        <TabsContent value="day" className="space-y-6 mt-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Horas por Projeto</h2>
            {dayReport.projectBreakdown.length > 0 ? (
              <ReportChart report={dayReport} type="pie" dataType="project" />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Sem dados para hoje
              </div>
            )}
          </Card>

          {dayReport.tagBreakdown.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Horas por Tag</h2>
              <ReportChart report={dayReport} type="bar" dataType="tag" />
            </Card>
          )}
        </TabsContent>

        {/* Week Report */}
        <TabsContent value="week" className="space-y-6 mt-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Horas Diárias</h2>
            {weekReport.dailyBreakdown.length > 0 ? (
              <ReportChart report={weekReport} type="line" dataType="daily" />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Sem dados para esta semana
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Por Projeto</h2>
              {weekReport.projectBreakdown.length > 0 ? (
                <ReportChart report={weekReport} type="pie" dataType="project" />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Sem dados
                </div>
              )}
            </Card>

            {weekReport.tagBreakdown.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Por Tag</h2>
                <ReportChart report={weekReport} type="bar" dataType="tag" />
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Month Report (Premium) */}
        <TabsContent value="month" className="space-y-6 mt-6">
          {!isPremium ? (
            <Card className="p-12 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center premium-glow">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold">Recurso Premium</h3>
                <p className="text-muted-foreground">
                  Relatórios mensais com análise avançada estão disponíveis apenas no plano Premium.
                </p>
                <Button className="gap-2">
                  <Download className="w-4 h-4" />
                  Ativar Premium
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Horas Diárias do Mês</h2>
                {monthReport.dailyBreakdown.length > 0 ? (
                  <ReportChart report={monthReport} type="line" dataType="daily" />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Sem dados para este mês
                  </div>
                )}
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Por Projeto</h2>
                    <PremiumBadge size="sm" />
                  </div>
                  {monthReport.projectBreakdown.length > 0 ? (
                    <ReportChart report={monthReport} type="pie" dataType="project" />
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      Sem dados
                    </div>
                  )}
                </Card>

                {monthReport.tagBreakdown.length > 0 && (
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">Por Tag</h2>
                      <PremiumBadge size="sm" />
                    </div>
                    <ReportChart report={monthReport} type="bar" dataType="tag" />
                  </Card>
                )}
              </div>

              {monthReport.prediction && (
                <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Previsão de Produtividade</h2>
                    <PremiumBadge size="sm" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-3xl font-bold mb-2">
                        {formatHours(monthReport.prediction.nextWeekHours)}
                      </div>
                      <p className="text-muted-foreground">
                        Horas previstas para próxima semana
                      </p>
                    </div>
                    <div>
                      <div className="text-3xl font-bold mb-2 capitalize">
                        {monthReport.prediction.trend === 'up' && '📈 Crescendo'}
                        {monthReport.prediction.trend === 'down' && '📉 Decrescendo'}
                        {monthReport.prediction.trend === 'stable' && '➡️ Estável'}
                      </div>
                      <p className="text-muted-foreground">
                        Tendência de produtividade
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Heatmap (Premium) */}
      {isPremium && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold">Mapa de Atividade</h2>
            <PremiumBadge size="sm" />
          </div>
          <Heatmap data={heatmapData} year={currentYear} />
        </div>
      )}
    </div>
  );
}
