"use client";

import { useState, useMemo } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { BarChart, LineChart, PieChart, RadarChart, GaugeChart, ScatterChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { Card, CardContent } from "@/components/ui/card";
import { WidgetHeader } from "@/components/widgets/WidgetHeader";
import { WidgetEditModal } from "@/components/widgets/WidgetEditModal";
import type { Widget } from "@/types";

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  RadarChart,
  GaugeChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

const COLORS = [
  "#5470c6",
  "#91cc75",
  "#fac858",
  "#ee6666",
  "#73c0de",
  "#3ba272",
  "#fc8452",
  "#9a60b4",
];

interface EChartWidgetProps {
  widget: Widget;
  data?: unknown[];
  dashboardId: number;
}

export function EChartWidget({ widget, data, dashboardId }: EChartWidgetProps) {
  const [editOpen, setEditOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const params = widget.parametros as Record<string, unknown>;
  const echartsType = (params.echartsType as string) || "echart-bar";
  const title = (params.title as string) || `Widget ${widget.id}`;

  // Se o widget já traz uma option ECharts completa, usa direto
  const rawOption = params.echartsOption as Record<string, unknown> | undefined;

  const option = useMemo(() => {
    if (rawOption) return rawOption;
    return buildOption(echartsType, data, isDark);
  }, [rawOption, echartsType, data, isDark]);

  const ariaLabel = `Gráfico ECharts - ${title}`;

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
            {data && data.length > 0 ? (
              <ReactEChartsCore
                echarts={echarts}
                option={option}
                style={{ height: "100%", width: "100%" }}
                notMerge
                theme={isDark ? "dark" : undefined}
                opts={{ renderer: "canvas" }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
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

// ── Builders de option por tipo ──────────────────────────────────────────────

function buildOption(
  type: string,
  data: unknown[] | undefined,
  isDark: boolean
): Record<string, unknown> {
  const textColor = isDark ? "#ccc" : "#333";
  const records = (data ?? []) as Record<string, unknown>[];

  switch (type) {
    case "echart-bar":
      return buildBarOption(records, textColor);
    case "echart-line":
      return buildLineOption(records, textColor);
    case "echart-pie":
      return buildPieOption(records, textColor);
    case "echart-radar":
      return buildRadarOption(records, textColor);
    case "echart-gauge":
      return buildGaugeOption(records);
    case "echart-scatter":
      return buildScatterOption(records, textColor);
    default:
      return buildBarOption(records, textColor);
  }
}

function extractKeys(records: Record<string, unknown>[]) {
  if (records.length === 0) return { category: "name", values: [] as string[] };
  const sample = records[0];
  const category = Object.keys(sample).find((k) => typeof sample[k] === "string") || "name";
  const values = Object.keys(sample).filter((k) => typeof sample[k] === "number");
  return { category, values };
}

function buildBarOption(records: Record<string, unknown>[], textColor: string) {
  const { category, values } = extractKeys(records);
  return {
    color: COLORS,
    tooltip: { trigger: "axis" },
    legend: { textStyle: { color: textColor } },
    grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    xAxis: {
      type: "category",
      data: records.map((r) => r[category]),
      axisLabel: { color: textColor },
    },
    yAxis: { type: "value", axisLabel: { color: textColor } },
    series: values.map((key, i) => ({
      name: key,
      type: "bar",
      data: records.map((r) => r[key]),
      itemStyle: { borderRadius: [4, 4, 0, 0] },
      color: COLORS[i % COLORS.length],
    })),
  };
}

function buildLineOption(records: Record<string, unknown>[], textColor: string) {
  const { category, values } = extractKeys(records);
  return {
    color: COLORS,
    tooltip: { trigger: "axis" },
    legend: { textStyle: { color: textColor } },
    grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    xAxis: {
      type: "category",
      data: records.map((r) => r[category]),
      axisLabel: { color: textColor },
    },
    yAxis: { type: "value", axisLabel: { color: textColor } },
    series: values.map((key, i) => ({
      name: key,
      type: "line",
      smooth: true,
      data: records.map((r) => r[key]),
      color: COLORS[i % COLORS.length],
    })),
  };
}

function buildPieOption(records: Record<string, unknown>[], textColor: string) {
  const { category, values } = extractKeys(records);
  const valueKey = values[0] || "value";
  return {
    color: COLORS,
    tooltip: { trigger: "item" },
    legend: { orient: "vertical", left: "left", textStyle: { color: textColor } },
    series: [
      {
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        padAngle: 2,
        itemStyle: { borderRadius: 6 },
        label: { show: true, color: textColor },
        data: records.map((r) => ({ value: r[valueKey], name: r[category] })),
      },
    ],
  };
}

function buildRadarOption(records: Record<string, unknown>[], textColor: string) {
  const { category, values } = extractKeys(records);
  const maxVal = Math.max(
    ...records.flatMap((r) => values.map((v) => Number(r[v]) || 0))
  );
  return {
    color: COLORS,
    tooltip: {},
    legend: { textStyle: { color: textColor } },
    radar: {
      indicator: records.map((r) => ({
        name: r[category] as string,
        max: Math.ceil(maxVal * 1.2),
      })),
      axisName: { color: textColor },
    },
    series: values.map((key, i) => ({
      type: "radar",
      data: [
        {
          value: records.map((r) => r[key]),
          name: key,
          areaStyle: { opacity: 0.2 },
          lineStyle: { color: COLORS[i % COLORS.length] },
          itemStyle: { color: COLORS[i % COLORS.length] },
        },
      ],
    })),
  };
}

function buildGaugeOption(records: Record<string, unknown>[]) {
  const sample = records[0];
  const valueKey = sample
    ? Object.keys(sample).find((k) => typeof sample[k] === "number") || "value"
    : "value";
  const value = sample ? Number(sample[valueKey]) || 0 : 0;
  return {
    series: [
      {
        type: "gauge",
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        progress: { show: true, width: 18 },
        axisLine: { lineStyle: { width: 18 } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: true },
        detail: {
          valueAnimation: true,
          fontSize: 28,
          offsetCenter: [0, "70%"],
          formatter: "{value}%",
        },
        data: [{ value }],
      },
    ],
  };
}

function buildScatterOption(records: Record<string, unknown>[], textColor: string) {
  const { values } = extractKeys(records);
  const xKey = values[0] || "x";
  const yKey = values[1] || "y";
  return {
    color: COLORS,
    tooltip: { trigger: "item" },
    xAxis: { axisLabel: { color: textColor } },
    yAxis: { axisLabel: { color: textColor } },
    series: [
      {
        type: "scatter",
        symbolSize: 12,
        data: records.map((r) => [r[xKey], r[yKey]]),
      },
    ],
  };
}
