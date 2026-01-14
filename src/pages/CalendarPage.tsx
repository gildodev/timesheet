/**
 * Calendar Page
 * Visualize time entries in calendar view
 */

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTimeEntries, useProjects } from '@/hooks';
import { timeEntryStorage } from '@/lib/storage';
import { formatHours, cn } from '@/lib/utils';
import { TimeEntry } from '@/types';

export function CalendarPage() {
  const { projects } = useProjects();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Get days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Monday = 0

  // Generate calendar days
  const calendarDays: (Date | null)[] = [];
  
  // Add empty days for alignment
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null);
  }
  
  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(currentYear, currentMonth, day));
  }

  // Get entries for the month
  const monthStart = new Date(currentYear, currentMonth, 1);
  monthStart.setHours(0, 0, 0, 0);
  const monthEnd = new Date(currentYear, currentMonth + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);
  
  const monthEntries = timeEntryStorage.getEntriesByDateRange(monthStart, monthEnd);

  // Group entries by date
  const entriesByDate = new Map<string, TimeEntry[]>();
  monthEntries.forEach(entry => {
    const dateKey = new Date(entry.startTime).toISOString().split('T')[0];
    if (!entriesByDate.has(dateKey)) {
      entriesByDate.set(dateKey, []);
    }
    entriesByDate.get(dateKey)!.push(entry);
  });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDate(null);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const getDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getDayEntries = (date: Date | null) => {
    if (!date) return [];
    return entriesByDate.get(getDateKey(date)) || [];
  };

  const getDayTotal = (date: Date | null) => {
    const entries = getDayEntries(date);
    const totalSeconds = timeEntryStorage.calculateTotalDuration(entries);
    return totalSeconds / 3600;
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return getDateKey(date) === getDateKey(today);
  };

  const isSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false;
    return getDateKey(date) === getDateKey(selectedDate);
  };

  const selectedDayEntries = selectedDate ? getDayEntries(selectedDate) : [];
  const selectedDayTotal = selectedDate ? getDayTotal(selectedDate) : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Calendário</h1>
          <p className="text-muted-foreground">
            Visualize suas entradas de tempo
          </p>
        </div>
        <Button onClick={handleToday}>
          Hoje
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="p-6 lg:col-span-2">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
              <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} />;
              }

              const dayTotal = getDayTotal(date);
              const hasEntries = dayTotal > 0;

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    'aspect-square p-2 rounded-lg border transition-all hover:border-primary',
                    'flex flex-col items-center justify-center',
                    isToday(date) && 'border-primary bg-primary/10',
                    isSelected(date) && 'bg-primary text-primary-foreground border-primary',
                    !hasEntries && 'text-muted-foreground',
                    hasEntries && !isSelected(date) && 'font-semibold'
                  )}
                >
                  <span className="text-sm mb-1">{date.getDate()}</span>
                  {hasEntries && (
                    <div className={cn(
                      'text-xs',
                      isSelected(date) ? 'text-primary-foreground' : 'text-primary'
                    )}>
                      {formatHours(dayTotal)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-6 border-t flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-primary bg-primary/10" />
              <span>Hoje</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-primary bg-primary" />
              <span>Selecionado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border font-bold flex items-center justify-center text-xs">
                8h
              </div>
              <span>Com registros</span>
            </div>
          </div>
        </Card>

        {/* Day Details */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">
                {selectedDate ? (
                  selectedDate.toLocaleDateString('pt-BR', { 
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })
                ) : (
                  'Selecione um dia'
                )}
              </h3>
              {selectedDate && (
                <p className="text-sm text-muted-foreground">
                  {formatHours(selectedDayTotal)} registradas
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {selectedDayEntries.length > 0 ? (
              selectedDayEntries.map(entry => {
                const project = projects.find(p => p.id === entry.projectId);
                const hours = entry.duration / 3600;

                return (
                  <div
                    key={entry.id}
                    className="p-3 rounded-lg border"
                    style={{ borderLeftWidth: '4px', borderLeftColor: project?.color }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{project?.name || 'Unknown'}</h4>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.startTime).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{formatHours(hours)}</span>
                      </div>
                    </div>
                    {entry.notes && (
                      <p className="text-xs text-muted-foreground">{entry.notes}</p>
                    )}
                    {entry.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {entry.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {selectedDate ? 'Nenhum registro neste dia' : 'Selecione um dia para ver os detalhes'}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
