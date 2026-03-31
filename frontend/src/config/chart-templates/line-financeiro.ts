import type { ChartTemplate } from "./types";

export const lineFinanceiro: ChartTemplate = {
  id: "line-financeiro",
  nome: "Linha Financeiro",
  descricao: "Linhas suaves para séries temporais financeiras",
  chartType: "LineChart",
  config: {
    cores: ["oklch(0.55 0.15 260)", "oklch(0.45 0.15 145)", "oklch(0.60 0.10 30)"],
    legendPosition: "bottom",
    showGrid: true,
    showTooltip: true,
    strokeWidth: 2.5,
    fillOpacity: 0,
    borderRadius: 0,
  },
};
