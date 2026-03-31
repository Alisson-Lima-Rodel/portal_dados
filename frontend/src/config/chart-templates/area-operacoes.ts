import type { ChartTemplate } from "./types";

export const areaOperacoes: ChartTemplate = {
  id: "area-operacoes",
  nome: "Área Operações",
  descricao: "Gráfico de área para métricas operacionais",
  chartType: "AreaChart",
  config: {
    cores: ["oklch(0.55 0.12 180)", "oklch(0.45 0.15 145)", "oklch(0.82 0.16 85)"],
    legendPosition: "top",
    showGrid: true,
    showTooltip: true,
    strokeWidth: 2,
    fillOpacity: 0.3,
    borderRadius: 0,
  },
};
