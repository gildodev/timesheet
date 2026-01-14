/**
 * Report Chart component
 * Display charts for reports using recharts
 */

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card } from './ui/card';
import { Report } from '@/types';

interface ReportChartProps {
  report: Report;
  type?: 'bar' | 'line' | 'pie';
  dataType?: 'daily' | 'project' | 'tag';
}

const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6'];

export function ReportChart({ report, type = 'bar', dataType = 'daily' }: ReportChartProps) {
  const data = useMemo(() => {
    switch (dataType) {
      case 'daily':
        return report.dailyBreakdown.map(d => ({
          name: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          hours: Number(d.hours.toFixed(2)),
        }));
      case 'project':
        return report.projectBreakdown.slice(0, 7).map(p => ({
          name: p.projectName,
          hours: Number(p.hours.toFixed(2)),
          percentage: Number(p.percentage.toFixed(1)),
        }));
      case 'tag':
        return report.tagBreakdown.slice(0, 7).map(t => ({
          name: t.tag,
          hours: Number(t.hours.toFixed(2)),
          percentage: Number(t.percentage.toFixed(1)),
        }));
      default:
        return [];
    }
  }, [report, dataType]);

  if (data.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Sem dados para exibir</p>
      </Card>
    );
  }

  if (type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => `${entry.name}: ${entry.hours}h`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="hours"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="name"
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            label={{ value: 'Horas', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="hours"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))' }}
            name="Horas"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="name"
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          label={{ value: 'Horas', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Bar
          dataKey="hours"
          fill="hsl(var(--primary))"
          radius={[8, 8, 0, 0]}
          name="Horas"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
