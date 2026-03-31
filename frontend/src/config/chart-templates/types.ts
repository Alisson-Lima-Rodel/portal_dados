export interface ChartTemplate {
  id: string;
  nome: string;
  descricao: string;
  chartType: "BarChart" | "LineChart" | "AreaChart" | "PieChart" | "DonutChart";
  config: {
    cores: string[];
    legendPosition: "top" | "bottom" | "left" | "right" | "none";
    showGrid: boolean;
    showTooltip: boolean;
    strokeWidth: number;
    fillOpacity: number;
    borderRadius: number;
  };
  thumbnail?: string;
}
