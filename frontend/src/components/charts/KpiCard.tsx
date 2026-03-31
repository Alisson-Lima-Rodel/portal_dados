"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Widget } from "@/types";

interface KpiCardProps {
  widget: Widget;
  data?: unknown[];
  dashboardId: number;
}

export function KpiCard({ widget, data }: KpiCardProps) {
  const params = widget.parametros as Record<string, unknown>;
  const title = (params.title as string) || "KPI";
  const valueKey = (params.valueKey as string) || "valor_atual";
  const previousKey = (params.previousKey as string) || "valor_anterior";

  const record = data?.[0] as Record<string, unknown> | undefined;
  const valorAtual = record ? Number(record[valueKey]) : 0;
  const valorAnterior = record ? Number(record[previousKey]) : undefined;

  let delta: number | null = null;
  let deltaType: "positive" | "negative" | "neutral" = "neutral";

  if (valorAnterior != null && !isNaN(valorAnterior) && valorAnterior !== 0) {
    delta = ((valorAtual - valorAnterior) / valorAnterior) * 100;
    deltaType = delta > 0 ? "positive" : delta < 0 ? "negative" : "neutral";
  }

  const DeltaIcon =
    deltaType === "positive"
      ? TrendingUp
      : deltaType === "negative"
        ? TrendingDown
        : Minus;

  const deltaColor =
    deltaType === "positive"
      ? "text-green-600 dark:text-green-400"
      : deltaType === "negative"
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground";

  return (
    <Card
      className="h-full"
      role="status"
      aria-live="polite"
      aria-label={`KPI - ${title}: ${valorAtual}`}
    >
      <CardContent className="flex flex-col justify-center h-full p-4 gap-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold tracking-tight">
          {typeof valorAtual === "number"
            ? valorAtual.toLocaleString("pt-BR")
            : valorAtual}
        </p>
        {delta !== null && (
          <div className="flex items-center gap-1.5">
            <DeltaIcon className={`h-4 w-4 ${deltaColor}`} />
            <Badge
              variant="outline"
              className={deltaColor}
            >
              {delta > 0 ? "+" : ""}
              {delta.toFixed(1)}%
            </Badge>
            <span className="text-xs text-muted-foreground">vs anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
