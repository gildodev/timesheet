/**
 * Heatmap component (Premium)
 * GitHub-style activity heatmap
 */

import { useMemo } from 'react';
import { Card } from './ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { HeatmapData } from '@/types';
import { cn } from '@/lib/utils';

interface HeatmapProps {
  data: HeatmapData[];
  year: number;
}

export function Heatmap({ data, year }: HeatmapProps) {
  // Group data by week
  const weeks = useMemo(() => {
    const result: HeatmapData[][] = [];
    let currentWeek: HeatmapData[] = [];

    data.forEach((day, index) => {
      const date = new Date(day.date);
      const dayOfWeek = date.getDay();

      // Start new week on Sunday
      if (dayOfWeek === 0 && currentWeek.length > 0) {
        result.push(currentWeek);
        currentWeek = [];
      }

      currentWeek.push(day);

      // Last day
      if (index === data.length - 1 && currentWeek.length > 0) {
        result.push(currentWeek);
      }
    });

    return result;
  }, [data]);

  const getLevelColor = (level: HeatmapData['level']) => {
    switch (level) {
      case 0:
        return 'bg-secondary';
      case 1:
        return 'bg-primary/20';
      case 2:
        return 'bg-primary/40';
      case 3:
        return 'bg-primary/60';
      case 4:
        return 'bg-primary';
      default:
        return 'bg-secondary';
    }
  };

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-1">Atividade em {year}</h3>
        <p className="text-sm text-muted-foreground">
          {data.filter(d => d.hours > 0).length} dias com atividade
        </p>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <div className="inline-flex flex-col gap-1 min-w-max">
          {/* Month labels */}
          <div className="flex gap-1 mb-2 ml-8">
            {months.map((month, index) => (
              <div
                key={month}
                className="text-xs text-muted-foreground"
                style={{ width: `${(weeks.length / 12) * 12}px` }}
              >
                {month}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-1 pr-2">
              {weekDays.map((day, index) => (
                <div
                  key={day}
                  className="text-xs text-muted-foreground h-3 flex items-center"
                >
                  {index % 2 === 1 ? day : ''}
                </div>
              ))}
            </div>

            {/* Weeks */}
            <TooltipProvider>
              <div className="flex gap-1">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {/* Fill empty days at start */}
                    {weekIndex === 0 && new Date(week[0].date).getDay() > 0 && (
                      Array.from({ length: new Date(week[0].date).getDay() }).map((_, i) => (
                        <div key={`empty-${i}`} className="w-3 h-3" />
                      ))
                    )}
                    
                    {week.map((day) => (
                      <Tooltip key={day.date}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'heatmap-cell w-3 h-3 cursor-pointer',
                              getLevelColor(day.level)
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">
                            {new Date(day.date).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-sm">
                            {day.hours > 0
                              ? `${day.hours.toFixed(1)} horas`
                              : 'Sem atividade'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                ))}
              </div>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
        <span>Menos</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn('heatmap-cell w-3 h-3', getLevelColor(level as HeatmapData['level']))}
          />
        ))}
        <span>Mais</span>
      </div>
    </Card>
  );
}
