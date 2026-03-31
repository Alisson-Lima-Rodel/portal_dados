import type { ChartTemplate } from "./types";
import { barComercial } from "./bar-comercial";
import { lineFinanceiro } from "./line-financeiro";
import { areaOperacoes } from "./area-operacoes";

const templates: ChartTemplate[] = [
  barComercial,
  lineFinanceiro,
  areaOperacoes,
];

export const templateRegistry: Record<string, ChartTemplate> = Object.fromEntries(
  templates.map((t) => [t.id, t])
);

export function getTemplatesByChartType(chartType: string): ChartTemplate[] {
  return templates.filter((t) => t.chartType === chartType);
}

export { type ChartTemplate } from "./types";
