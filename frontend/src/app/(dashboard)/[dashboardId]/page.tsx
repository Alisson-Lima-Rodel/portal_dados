"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getDashboard, getDashboardWidgets, getDashboardData } from "@/services/dashboardApi";
import { useFullscreen } from "@/contexts/FullscreenContext";
import { WidgetRenderer } from "@/components/charts/WidgetRenderer";
import { WidgetSkeleton } from "@/components/widgets/WidgetSkeleton";
import { WidgetErrorCard } from "@/components/widgets/WidgetErrorCard";
import { Button } from "@/components/ui/button";
import type { Widget } from "@/types";
import { Responsive, useContainerWidth } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Maximize2 } from "lucide-react";

function buildLayout(widgets: Widget[]) {
  return widgets.map((w, i) => ({
    i: w.posicao_grid?.i || String(w.id),
    x: w.posicao_grid?.x ?? (i % 3) * 4,
    y: w.posicao_grid?.y ?? Math.floor(i / 3) * 4,
    w: w.posicao_grid?.w ?? 4,
    h: w.posicao_grid?.h ?? 4,
  }));
}

export default function DashboardPage() {
  const { dashboardId } = useParams<{ dashboardId: string }>();
  const id = Number(dashboardId);
  const { containerRef, width } = useContainerWidth();
  const { openFullscreen } = useFullscreen();

  const {
    data: dashboard,
    isLoading: loadingDash,
  } = useQuery({
    queryKey: ["dashboard", id],
    queryFn: () => getDashboard(id),
    enabled: !isNaN(id),
  });

  const {
    data: widgets = [],
    isLoading: loadingWidgets,
    error: widgetsError,
    refetch: refetchWidgets,
  } = useQuery({
    queryKey: ["dashboard-widgets", id],
    queryFn: () => getDashboardWidgets(id),
    enabled: !isNaN(id),
  });

  const refetchMs = dashboard?.taxa_atualizacao_minutos
    ? dashboard.taxa_atualizacao_minutos * 60 * 1000
    : undefined;

  const {
    data: dashData,
    isLoading: loadingData,
  } = useQuery({
    queryKey: ["dashboard-data", id],
    queryFn: () => getDashboardData(id),
    enabled: !isNaN(id) && widgets.length > 0,
    refetchInterval: refetchMs || false,
  });

  const isLoading = loadingDash || loadingWidgets;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <WidgetSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (widgetsError) {
    return (
      <WidgetErrorCard
        message="Não foi possível carregar os widgets deste dashboard."
        onRetry={() => refetchWidgets()}
      />
    );
  }

  const layout = buildLayout(widgets);

  function handleFullscreen() {
    openFullscreen(
      <div className="p-6">
        <div ref={containerRef}>
          {width > 0 && (
            <Responsive
              className="layout"
              width={width}
              layouts={{ lg: layout, md: layout, sm: layout }}
              breakpoints={{ lg: 1024, md: 768, sm: 0 }}
              cols={{ lg: 12, md: 8, sm: 4 }}
              rowHeight={80}
            >
              {widgets.map((widget) => (
                <div key={widget.posicao_grid?.i || String(widget.id)}>
                  <WidgetRenderer
                    widget={widget}
                    data={
                      widget.query_service_key && dashData
                        ? dashData[widget.query_service_key]
                        : undefined
                    }
                    isLoading={loadingData}
                    dashboardId={id}
                  />
                </div>
              ))}
            </Responsive>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{dashboard?.nome}</h1>
          {dashboard?.descricao && (
            <p className="text-sm text-muted-foreground mt-1">{dashboard.descricao}</p>
          )}
        </div>
        {widgets.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleFullscreen}>
            <Maximize2 className="h-4 w-4 mr-1" />
            Expandir
          </Button>
        )}
      </div>

      {widgets.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">Nenhum widget configurado</p>
          <p className="text-sm">Este dashboard ainda não possui widgets.</p>
        </div>
      ) : (
        <div ref={containerRef}>
          {width > 0 && (
            <Responsive
              className="layout"
              width={width}
              layouts={{ lg: layout, md: layout, sm: layout }}
              breakpoints={{ lg: 1024, md: 768, sm: 0 }}
              cols={{ lg: 12, md: 8, sm: 4 }}
              rowHeight={80}
            >
              {widgets.map((widget) => (
                <div key={widget.posicao_grid?.i || String(widget.id)}>
                  <WidgetRenderer
                    widget={widget}
                    data={
                      widget.query_service_key && dashData
                        ? dashData[widget.query_service_key]
                        : undefined
                    }
                    isLoading={loadingData}
                    dashboardId={id}
                  />
                </div>
              ))}
            </Responsive>
          )}
        </div>
      )}
    </div>
  );
}
