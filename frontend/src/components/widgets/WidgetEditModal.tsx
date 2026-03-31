"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateWidget } from "@/services/widgetApi";
import { toast } from "sonner";
import type { Widget } from "@/types";
import type { ChartTemplate } from "@/config/chart-templates/types";
import { getTemplatesByChartType } from "@/config/chart-templates";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

const CHART_TYPES = ["BarChart", "LineChart", "AreaChart", "PieChart", "DonutChart"] as const;

interface WidgetEditModalProps {
  widget: Widget;
  open: boolean;
  onClose: () => void;
  dashboardId: number;
}

export function WidgetEditModal({
  widget,
  open,
  onClose,
  dashboardId,
}: WidgetEditModalProps) {
  const queryClient = useQueryClient();
  const params = widget.parametros as Record<string, unknown>;
  const [title, setTitle] = useState((params.title as string) || "");
  const [chartType, setChartType] = useState(
    (params.chartType as string) || "BarChart"
  );

  const currentTemplates = getTemplatesByChartType(chartType);

  const mutation = useMutation({
    mutationFn: (newParams: Record<string, unknown>) =>
      updateWidget(widget.id, { parametros: newParams }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-widgets", dashboardId] });
      toast.success("Widget atualizado!");
      onClose();
    },
    onError: () => toast.error("Erro ao salvar widget."),
  });

  function handleSaveManual() {
    mutation.mutate({ ...params, title, chartType });
  }

  function handleApplyTemplate(template: ChartTemplate) {
    mutation.mutate({
      ...params,
      title,
      chartType: template.chartType,
      templateConfig: template.config,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Widget</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="manual">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Gráfico</Label>
              <Select value={chartType} onValueChange={(v) => v && setChartType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHART_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={handleSaveManual}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </TabsContent>

          <TabsContent value="templates" className="mt-4">
            {currentTemplates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum template disponível para {chartType}.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {currentTemplates.map((tpl) => (
                  <Card
                    key={tpl.id}
                    className="cursor-pointer hover:border-primary/40 transition-colors"
                    onClick={() => handleApplyTemplate(tpl)}
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
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
