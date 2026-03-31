"use client";

import { useState, useMemo } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { WidgetHeader } from "@/components/widgets/WidgetHeader";
import { WidgetEditModal } from "@/components/widgets/WidgetEditModal";
import type { Widget } from "@/types";

const DEFAULT_COLORS = [
  "oklch(0.45 0.15 145)",  // verde
  "oklch(0.82 0.16 85)",   // amarelo
  "oklch(0.55 0.12 180)",  // teal
  "oklch(0.55 0.15 260)",  // azul
  "oklch(0.60 0.10 30)",   // laranja
  "oklch(0.50 0.13 320)",  // roxo
];

interface NativeChartWidgetProps {
  widget: Widget;
  data?: unknown[];
  dashboardId: number;
}

export function NativeChartWidget({ widget, data, dashboardId }: NativeChartWidgetProps) {
  const [editOpen, setEditOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const params = widget.parametros as Record<string, unknown>;
  const chartType = (params.chartType as string) || "BarChart";
  const title = (params.title as string) || `Widget ${widget.id}`;
  const templateConfig = params.templateConfig as Record<string, unknown> | undefined;
  const series = (params.series as string[]) || [];

  const colors = (templateConfig?.cores as string[]) || DEFAULT_COLORS;
  const showGrid = templateConfig?.showGrid !== false;
  const showTooltip = templateConfig?.showTooltip !== false;
  const fillOpacity = (templateConfig?.fillOpacity as number) ?? 0.8;
  const strokeWidth = (templateConfig?.strokeWidth as number) ?? 2;
  const borderRadius = (templateConfig?.borderRadius as number) ?? 4;

  const axisColor = isDark ? "#a1a1aa" : "#71717a";
  const gridColor = isDark ? "#27272a" : "#e4e4e7";

  // Detectar keys de dados automaticamente
  const dataKeys = useMemo(() => {
    if (series.length > 0) return series;
    if (!data || data.length === 0) return [];
    const sample = data[0] as Record<string, unknown>;
    return Object.keys(sample).filter(
      (k) => typeof sample[k] === "number"
    );
  }, [data, series]);

  const categoryKey = useMemo(() => {
    if (!data || data.length === 0) return "name";
    const sample = data[0] as Record<string, unknown>;
    const strKey = Object.keys(sample).find(
      (k) => typeof sample[k] === "string"
    );
    return strKey || "name";
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center text-sm text-muted-foreground py-8">
          Nenhum dado disponível
        </CardContent>
      </Card>
    );
  }

  const ariaLabel = `Gráfico ${chartType.replace("Chart", "").toLowerCase()} - ${title}`;

  function renderChart() {
    const chartData = data as Record<string, unknown>[];

    switch (chartType) {
      case "BarChart":
        return (
          <BarChart data={chartData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />}
            <XAxis dataKey={categoryKey} tick={{ fill: axisColor, fontSize: 12 }} />
            <YAxis tick={{ fill: axisColor, fontSize: 12 }} />
            {showTooltip && <Tooltip />}
            <Legend />
            {dataKeys.map((key, i) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[i % colors.length]}
                radius={[borderRadius, borderRadius, 0, 0]}
                fillOpacity={fillOpacity}
              />
            ))}
          </BarChart>
        );

      case "LineChart":
        return (
          <LineChart data={chartData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />}
            <XAxis dataKey={categoryKey} tick={{ fill: axisColor, fontSize: 12 }} />
            <YAxis tick={{ fill: axisColor, fontSize: 12 }} />
            {showTooltip && <Tooltip />}
            <Legend />
            {dataKeys.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[i % colors.length]}
                strokeWidth={strokeWidth}
                dot={{ r: 3 }}
              />
            ))}
          </LineChart>
        );

      case "AreaChart":
        return (
          <AreaChart data={chartData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />}
            <XAxis dataKey={categoryKey} tick={{ fill: axisColor, fontSize: 12 }} />
            <YAxis tick={{ fill: axisColor, fontSize: 12 }} />
            {showTooltip && <Tooltip />}
            <Legend />
            {dataKeys.map((key, i) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[i % colors.length]}
                fill={colors[i % colors.length]}
                fillOpacity={fillOpacity}
                strokeWidth={strokeWidth}
              />
            ))}
          </AreaChart>
        );

      case "PieChart":
      case "DonutChart": {
        const isDonut = chartType === "DonutChart";
        const pieKey = dataKeys[0] || "value";
        return (
          <PieChart>
            <Pie
              data={chartData}
              dataKey={pieKey}
              nameKey={categoryKey}
              innerRadius={isDonut ? "55%" : 0}
              outerRadius="80%"
              paddingAngle={2}
              label
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            {showTooltip && <Tooltip />}
            <Legend />
          </PieChart>
        );
      }

      default:
        return (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Tipo de gráfico não suportado: {chartType}
          </div>
        );
    }
  }

  return (
    <>
      <Card className="h-full" aria-label={ariaLabel}>
        <CardContent className="h-full p-3 flex flex-col">
          <WidgetHeader
            title={title}
            ariaLabel={ariaLabel}
            onEdit={() => setEditOpen(true)}
          />
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <WidgetEditModal
        widget={widget}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        dashboardId={dashboardId}
      />
    </>
  );
}
