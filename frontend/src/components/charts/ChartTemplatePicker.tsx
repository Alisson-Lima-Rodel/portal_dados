"use client";

import { getTemplatesByChartType } from "@/config/chart-templates";
import type { ChartTemplate } from "@/config/chart-templates/types";
import { Card, CardContent } from "@/components/ui/card";

interface ChartTemplatePickerProps {
  chartType: string;
  onSelect: (config: ChartTemplate["config"]) => void;
}

export function ChartTemplatePicker({ chartType, onSelect }: ChartTemplatePickerProps) {
  const templates = getTemplatesByChartType(chartType);

  if (templates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Nenhum template disponível para {chartType}.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
      {templates.map((tpl) => (
        <Card
          key={tpl.id}
          className="cursor-pointer hover:border-primary/40 transition-colors"
          onClick={() => onSelect(tpl.config)}
        >
          <CardContent className="p-3">
            <div className="flex gap-1 mb-2">
              {tpl.config.cores.slice(0, 4).map((cor, i) => (
                <div
                  key={i}
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: cor }}
                />
              ))}
            </div>
            <p className="text-sm font-medium">{tpl.nome}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {tpl.descricao}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
