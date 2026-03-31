import type { ChartTemplate } from "./types";

export const barComercial: ChartTemplate = {
  id: "bar-comercial",
  nome: "Barras Comercial",
  descricao: "Paleta verde/amarelo para dados comerciais",
  chartType: "BarChart",
  config: {
    cores: ["oklch(0.45 0.15 145)", "oklch(0.82 0.16 85)", "oklch(0.55 0.12 180)"],
    legendPosition: "top",
    showGrid: true,
    showTooltip: true,
    strokeWidth: 1,
    fillOpacity: 0.85,
    borderRadius: 6,
  },
};
