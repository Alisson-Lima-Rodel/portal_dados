"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDashboardWidgets, getDashboardData } from "@/services/dashboardApi";
import { getMyLayout, saveMyLayout } from "@/services/userApi";
import { useFullscreen } from "@/contexts/FullscreenContext";
import { WidgetRenderer } from "@/components/charts/WidgetRenderer";
import { WidgetSkeleton } from "@/components/widgets/WidgetSkeleton";
import { Button } from "@/components/ui/button";
import { Responsive, useContainerWidth } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { BarChart3, Maximize2 } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Widget } from "@/types";
import type { Layout, LayoutItem } from "react-grid-layout";

const DEFAULT_DASHBOARD_ID = 1;

const HOME_TABS = [
  { key: "faturamento", label: "Faturamento" },
  { key: "dre", label: "DRE" },
  { key: "gt", label: "GT" },
] as const;

type TabKey = (typeof HOME_TABS)[number]["key"];

function buildLayoutFromWidgets(widgets: Widget[]): LayoutItem[] {
  return widgets.map((w, i) => ({
    i: w.posicao_grid?.i || String(w.id),
    x: w.posicao_grid?.x ?? (i % 3) * 4,
    y: w.posicao_grid?.y ?? Math.floor(i / 3) * 4,
    w: w.posicao_grid?.w ?? 4,
    h: w.posicao_grid?.h ?? 4,
  }));
}

function WidgetGrid({
  widgets,
  widgetData,
  loadingWidgets,
  loadingData,
  dashboardId,
  gridContainerRef,
  gridWidth,
  onLayoutChange,
}: {
  widgets: Widget[];
  widgetData?: Record<string, unknown[]>;
  loadingWidgets: boolean;
  loadingData: boolean;
  dashboardId: number;
  gridContainerRef: React.RefObject<HTMLDivElement | null>;
  gridWidth: number;
  onLayoutChange?: (layout: Layout) => void;
}) {
  const defaultLayout = buildLayoutFromWidgets(widgets);

  return (
    <div ref={gridContainerRef}>
      {gridWidth > 0 && (
        <Responsive
          className="layout"
          width={gridWidth}
          layouts={{ lg: defaultLayout, md: defaultLayout, sm: defaultLayout }}
          breakpoints={{ lg: 1024, md: 768, sm: 0 }}
          cols={{ lg: 12, md: 8, sm: 4 }}
          rowHeight={80}
          onLayoutChange={onLayoutChange}
        >
          {widgets.map((widget) => {
            const key = widget.posicao_grid?.i || String(widget.id);
            return (
              <div key={key}>
                {loadingWidgets ? (
                  <WidgetSkeleton />
                ) : (
                  <WidgetRenderer
                    widget={widget}
                    data={
                      widget.query_service_key && widgetData
                        ? (widgetData[widget.query_service_key] as unknown[])
                        : undefined
                    }
                    isLoading={loadingData}
                    dashboardId={dashboardId}
                  />
                )}
              </div>
            );
          })}
        </Responsive>
      )}
    </div>
  );
}

/* ── Grid demo com CSS puro (sem depender do react-grid-layout) ── */
function DemoGrid({
  widgets,
  widgetData,
  dashboardId,
}: {
  widgets: Widget[];
  widgetData: Record<string, unknown[]>;
  dashboardId: number;
}) {
  return (
    <div className="grid grid-cols-12 gap-4 auto-rows-[320px]">
      {widgets.map((widget) => {
        const colSpan = widget.posicao_grid?.w ?? 4;
        return (
          <div
            key={widget.posicao_grid?.i || String(widget.id)}
            className="min-h-0"
            style={{ gridColumn: `span ${colSpan}` }}
          >
            <WidgetRenderer
              widget={widget}
              data={
                widget.query_service_key
                  ? (widgetData[widget.query_service_key] as unknown[])
                  : undefined
              }
              isLoading={false}
              dashboardId={dashboardId}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function HomePage() {
  const { openFullscreen } = useFullscreen();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("faturamento");
  const { containerRef: gridContainerRef, width: gridWidth } = useContainerWidth();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ── Homebroker: layout salvo do usuário ──
  const { data: savedLayout } = useQuery({
    queryKey: ["my-layout"],
    queryFn: getMyLayout,
  });

  const homeDashId = (savedLayout?.dashboardId as number) || DEFAULT_DASHBOARD_ID;

  const { data: widgets = [], isLoading: loadingWidgets } = useQuery({
    queryKey: ["home-widgets", homeDashId],
    queryFn: () => getDashboardWidgets(homeDashId),
  });

  const { data: widgetData, isLoading: loadingData } = useQuery({
    queryKey: ["home-data", homeDashId],
    queryFn: () => getDashboardData(homeDashId),
    enabled: widgets.length > 0,
  });

  // Demo widgets e dados mockados para exemplificar as visões quando não há widgets reais
  const demoWidgetsByTab: Record<TabKey, Widget[]> = {
    faturamento: [
      {
        id: -1,
        dashboard_id: homeDashId,
        tipo: "nativo",
        query_service_key: "demo:faturamento:bar1",
        parametros: { chartType: "BarChart", title: "Faturamento Mensal (Recharts)" },
        posicao_grid: { x: 0, y: 0, w: 6, h: 5, i: "demo-faturamento-1" },
      },
      {
        id: -2,
        dashboard_id: homeDashId,
        tipo: "nativo",
        query_service_key: "demo:faturamento:kpi1",
        parametros: { chartType: "kpi", title: "Receita Total", valueKey: "valor_atual", previousKey: "valor_anterior" },
        posicao_grid: { x: 6, y: 0, w: 3, h: 5, i: "demo-faturamento-2" },
      },
      {
        id: -10,
        dashboard_id: homeDashId,
        tipo: "nativo",
        query_service_key: "demo:faturamento:echart-bar1",
        parametros: { chartType: "echart-bar", title: "Faturamento Mensal (ECharts)" },
        posicao_grid: { x: 0, y: 5, w: 6, h: 5, i: "demo-faturamento-10" },
      },
      {
        id: -11,
        dashboard_id: homeDashId,
        tipo: "nativo",
        query_service_key: "demo:faturamento:echart-gauge1",
        parametros: { chartType: "echart-gauge", title: "Meta de Faturamento" },
        posicao_grid: { x: 9, y: 0, w: 3, h: 5, i: "demo-faturamento-11" },
      },
      {
        id: -12,
        dashboard_id: homeDashId,
        tipo: "nativo",
        query_service_key: "demo:faturamento:echart-scatter1",
        parametros: { chartType: "echart-scatter", title: "Ticket vs Volume" },
        posicao_grid: { x: 6, y: 5, w: 6, h: 5, i: "demo-faturamento-12" },
      },
    ],
    dre: [
      {
        id: -3,
        dashboard_id: homeDashId,
        tipo: "nativo",
        query_service_key: "demo:dre:line1",
        parametros: { chartType: "LineChart", title: "Evolução DRE (Recharts)" },
        posicao_grid: { x: 0, y: 0, w: 6, h: 5, i: "demo-dre-1" },
      },
      {
        id: -4,
        dashboard_id: homeDashId,
        tipo: "nativo",
        query_service_key: "demo:dre:pie1",
        parametros: { chartType: "PieChart", title: "Custos (Recharts)" },
        posicao_grid: { x: 6, y: 0, w: 3, h: 5, i: "demo-dre-2" },
      },
      {
        id: -13,
        dashboard_id: homeDashId,
        tipo: "nativo",
        query_service_key: "demo:dre:echart-line1",
        parametros: { chartType: "echart-line", title: "Evolução DRE (ECharts)" },
        posicao_grid: { x: 0, y: 5, w: 6, h: 5, i: "demo-dre-13" },
      },
      {
        id: -14,
        dashboard_id: homeDashId,
        tipo: "nativo",
        query_service_key: "demo:dre:echart-pie1",
        parametros: { chartType: "echart-pie", title: "Custos (ECharts)" },
        posicao_grid: { x: 6, y: 5, w: 3, h: 5, i: "demo-dre-14" },
      },
      {
        id: -15,
        dashboard_id: homeDashId,
        tipo: "nativo",
        query_service_key: "demo:dre:echart-radar1",
        parametros: { chartType: "echart-radar", title: "Indicadores por Área" },
        posicao_grid: { x: 9, y: 0, w: 3, h: 10, i: "demo-dre-15" },
      },
    ],
    gt: [
      {
        id: -5,
        dashboard_id: homeDashId,
        tipo: "nativo",
        query_service_key: "demo:gt:area1",
        parametros: { chartType: "AreaChart", title: "Visão GT (Recharts)" },
        posicao_grid: { x: 0, y: 0, w: 6, h: 5, i: "demo-gt-1" },
      },
      {
        id: -16,
        dashboard_id: homeDashId,
        tipo: "nativo",
        query_service_key: "demo:gt:echart-bar1",
        parametros: { chartType: "echart-bar", title: "Entregas por Sprint (ECharts)" },
        posicao_grid: { x: 6, y: 0, w: 6, h: 5, i: "demo-gt-16" },
      },
      {
        id: -17,
        dashboard_id: homeDashId,
        tipo: "nativo",
        query_service_key: "demo:gt:echart-gauge1",
        parametros: { chartType: "echart-gauge", title: "SLA Atendimento" },
        posicao_grid: { x: 0, y: 5, w: 4, h: 5, i: "demo-gt-17" },
      },
      {
        id: -18,
        dashboard_id: homeDashId,
        tipo: "nativo",
        query_service_key: "demo:gt:echart-radar1",
        parametros: { chartType: "echart-radar", title: "Performance por Time" },
        posicao_grid: { x: 4, y: 5, w: 4, h: 5, i: "demo-gt-18" },
      },
      {
        id: -19,
        dashboard_id: homeDashId,
        tipo: "nativo",
        query_service_key: "demo:gt:echart-line1",
        parametros: { chartType: "echart-line", title: "Tendência Mensal (ECharts)" },
        posicao_grid: { x: 8, y: 5, w: 4, h: 5, i: "demo-gt-19" },
      },
    ],
  };

  const demoDataByKey: Record<string, unknown[]> = {
    // ── Faturamento ──
    "demo:faturamento:bar1": [
      { name: "Jan", vendas: 120000, devolucoes: 5000 },
      { name: "Fev", vendas: 98000, devolucoes: 4000 },
      { name: "Mar", vendas: 143000, devolucoes: 6000 },
      { name: "Abr", vendas: 112000, devolucoes: 3000 },
      { name: "Mai", vendas: 158000, devolucoes: 7000 },
      { name: "Jun", vendas: 134000, devolucoes: 4500 },
    ],
    "demo:faturamento:kpi1": [
      { valor_atual: 647000, valor_anterior: 612000 },
    ],
    "demo:faturamento:echart-bar1": [
      { name: "Jan", vendas: 120000, devolucoes: 5000 },
      { name: "Fev", vendas: 98000, devolucoes: 4000 },
      { name: "Mar", vendas: 143000, devolucoes: 6000 },
      { name: "Abr", vendas: 112000, devolucoes: 3000 },
      { name: "Mai", vendas: 158000, devolucoes: 7000 },
      { name: "Jun", vendas: 134000, devolucoes: 4500 },
    ],
    "demo:faturamento:echart-gauge1": [{ value: 78 }],
    "demo:faturamento:echart-scatter1": [
      { ticket: 120, volume: 340 },
      { ticket: 200, volume: 510 },
      { ticket: 80, volume: 220 },
      { ticket: 310, volume: 680 },
      { ticket: 150, volume: 410 },
      { ticket: 250, volume: 590 },
      { ticket: 90, volume: 180 },
      { ticket: 180, volume: 460 },
    ],

    // ── DRE ──
    "demo:dre:line1": [
      { name: "Jan", receita: 200000, custo: 120000, lucro: 80000 },
      { name: "Fev", receita: 185000, custo: 110000, lucro: 75000 },
      { name: "Mar", receita: 210000, custo: 130000, lucro: 80000 },
      { name: "Abr", receita: 195000, custo: 125000, lucro: 70000 },
    ],
    "demo:dre:pie1": [
      { name: "Pessoal", value: 45 },
      { name: "Infra", value: 20 },
      { name: "Marketing", value: 15 },
      { name: "Outros", value: 20 },
    ],
    "demo:dre:echart-line1": [
      { name: "Jan", receita: 200000, custo: 120000, lucro: 80000 },
      { name: "Fev", receita: 185000, custo: 110000, lucro: 75000 },
      { name: "Mar", receita: 210000, custo: 130000, lucro: 80000 },
      { name: "Abr", receita: 195000, custo: 125000, lucro: 70000 },
      { name: "Mai", receita: 230000, custo: 140000, lucro: 90000 },
      { name: "Jun", receita: 215000, custo: 132000, lucro: 83000 },
    ],
    "demo:dre:echart-pie1": [
      { name: "Pessoal", value: 45 },
      { name: "Infra", value: 20 },
      { name: "Marketing", value: 15 },
      { name: "Outros", value: 20 },
    ],
    "demo:dre:echart-radar1": [
      { name: "Comercial", receita: 80, custo: 60 },
      { name: "Operações", receita: 70, custo: 55 },
      { name: "TI", receita: 65, custo: 75 },
      { name: "RH", receita: 50, custo: 40 },
      { name: "Financeiro", receita: 90, custo: 70 },
    ],

    // ── GT ──
    "demo:gt:area1": [
      { name: "Semana 1", entregas: 32, backlog: 18 },
      { name: "Semana 2", entregas: 45, backlog: 12 },
      { name: "Semana 3", entregas: 38, backlog: 20 },
      { name: "Semana 4", entregas: 50, backlog: 9 },
    ],
    "demo:gt:echart-bar1": [
      { name: "Sprint 1", entregas: 32, bugs: 5 },
      { name: "Sprint 2", entregas: 45, bugs: 3 },
      { name: "Sprint 3", entregas: 38, bugs: 8 },
      { name: "Sprint 4", entregas: 50, bugs: 2 },
      { name: "Sprint 5", entregas: 42, bugs: 6 },
    ],
    "demo:gt:echart-gauge1": [{ value: 92 }],
    "demo:gt:echart-radar1": [
      { name: "Backend", velocidade: 85, qualidade: 90 },
      { name: "Frontend", velocidade: 78, qualidade: 88 },
      { name: "DevOps", velocidade: 92, qualidade: 95 },
      { name: "QA", velocidade: 70, qualidade: 96 },
      { name: "Data", velocidade: 82, qualidade: 80 },
    ],
    "demo:gt:echart-line1": [
      { name: "Jan", entregas: 28, backlog: 22 },
      { name: "Fev", entregas: 35, backlog: 18 },
      { name: "Mar", entregas: 42, backlog: 14 },
      { name: "Abr", entregas: 38, backlog: 16 },
      { name: "Mai", entregas: 50, backlog: 10 },
      { name: "Jun", entregas: 55, backlog: 7 },
    ],
  };

  // ── Layout persistência com debounce ──
  const saveMutation = useMutation({
    mutationFn: (layout: Record<string, unknown>) => saveMyLayout(layout),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-layout"] });
      toast.success("Layout salvo!");
    },
    onError: () => toast.error("Erro ao salvar layout."),
  });

  const handleLayoutChange = useCallback(
    (newLayout: Layout) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        saveMutation.mutate({
          dashboardId: homeDashId,
          items: [...newLayout],
        });
      }, 2000);
    },
    [homeDashId, saveMutation]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Filtra widgets pela aba ativa (usa tag nos parametros, fallback = mostra todos em "faturamento")
  const filteredWidgets = widgets.filter((w) => {
    const tag = (w.parametros as Record<string, unknown>).tab as string | undefined;
    if (!tag) return activeTab === "faturamento";
    return tag === activeTab;
  });

  const isDemo = filteredWidgets.length === 0;
  const widgetsToRender = isDemo ? demoWidgetsByTab[activeTab] : filteredWidgets;

  function handleFullscreen() {
    openFullscreen(
      <div className="p-6">
        {isDemo ? (
          <DemoGrid
            widgets={widgetsToRender}
            widgetData={demoDataByKey}
            dashboardId={homeDashId}
          />
        ) : (
          <WidgetGrid
            widgets={widgetsToRender}
            widgetData={widgetData as Record<string, unknown[]> | undefined}
            loadingWidgets={loadingWidgets}
            loadingData={loadingData}
            dashboardId={homeDashId}
            gridContainerRef={gridContainerRef}
            gridWidth={gridWidth}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Submenu horizontal de abas ── */}
      <div className="flex items-center justify-between">
        <nav className="flex gap-1 rounded-lg bg-muted p-1">
          {HOME_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        {widgetsToRender.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleFullscreen}>
            <Maximize2 className="h-4 w-4 mr-1" />
            Expandir
          </Button>
        )}
      </div>

      {/* ── Homebroker Grid ── */}
      {isDemo ? (
        <DemoGrid
          widgets={widgetsToRender}
          widgetData={demoDataByKey}
          dashboardId={homeDashId}
        />
      ) : widgetsToRender.length > 0 ? (
        <WidgetGrid
          widgets={widgetsToRender}
          widgetData={widgetData as Record<string, unknown[]> | undefined}
          loadingWidgets={loadingWidgets}
          loadingData={loadingData}
          dashboardId={homeDashId}
          gridContainerRef={gridContainerRef}
          gridWidth={gridWidth}
          onLayoutChange={handleLayoutChange}
        />
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 className="mx-auto h-10 w-10 mb-2 opacity-50" />
          <p className="text-sm">Nenhum widget configurado para esta aba</p>
        </div>
      )}
    </div>
  );
}
