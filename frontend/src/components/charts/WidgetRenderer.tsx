"use client";

import { Component, type ReactNode } from "react";
import dynamic from "next/dynamic";
import type { Widget } from "@/types";
import { WidgetErrorCard } from "@/components/widgets/WidgetErrorCard";
import { WidgetSkeleton } from "@/components/widgets/WidgetSkeleton";
import { NativeChartWidget } from "./NativeChartWidget";
import { KpiCard } from "./KpiCard";
import { PowerBIEmbed } from "./PowerBIEmbed";

const EChartWidget = dynamic(
  () => import("./EChartWidget").then((m) => m.EChartWidget),
  { ssr: false, loading: () => <WidgetSkeleton /> }
);

interface WidgetRendererProps {
  widget: Widget;
  data?: unknown[];
  isLoading?: boolean;
  dashboardId: number;
}

// Error boundary individual por widget
class WidgetBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; errorMsg: string }
> {
  state = { hasError: false, errorMsg: "" };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <WidgetErrorCard
          message={this.state.errorMsg || "Erro inesperado no widget"}
          onRetry={() => this.setState({ hasError: false, errorMsg: "" })}
        />
      );
    }
    return this.props.children;
  }
}

export function WidgetRenderer({
  widget,
  data,
  isLoading,
  dashboardId,
}: WidgetRendererProps) {
  if (isLoading) {
    return <WidgetSkeleton />;
  }

  const params = widget.parametros as Record<string, unknown>;
  const chartType = params.chartType as string | undefined;

  let content: ReactNode;

  if (widget.tipo === "nativo") {
    if (chartType === "kpi") {
      content = <KpiCard widget={widget} data={data} dashboardId={dashboardId} />;
    } else if (chartType?.startsWith("echart-")) {
      content = <EChartWidget widget={widget} data={data} dashboardId={dashboardId} />;
    } else {
      content = (
        <NativeChartWidget widget={widget} data={data} dashboardId={dashboardId} />
      );
    }
  } else if (widget.tipo === "powerbi") {
    content = <PowerBIEmbed widget={widget} dashboardId={dashboardId} />;
  } else {
    content = (
      <WidgetErrorCard message={`Tipo de widget não suportado: ${widget.tipo}`} />
    );
  }

  return <WidgetBoundary>{content}</WidgetBoundary>;
}
