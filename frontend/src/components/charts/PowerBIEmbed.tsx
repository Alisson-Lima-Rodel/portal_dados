"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getEmbedToken } from "@/services/dashboardApi";
import { Card, CardContent } from "@/components/ui/card";
import { WidgetSkeleton } from "@/components/widgets/WidgetSkeleton";
import { WidgetErrorCard } from "@/components/widgets/WidgetErrorCard";
import type { Widget } from "@/types";

interface PowerBIEmbedProps {
  widget: Widget;
  dashboardId: number;
}

export function PowerBIEmbed({ widget, dashboardId }: PowerBIEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const params = widget.parametros as Record<string, unknown>;
  const title = (params.title as string) || "Relatório Power BI";

  const loadReport = useCallback(async () => {
    try {
      setError(null);
      const tokenData = await getEmbedToken(dashboardId);

      if (!containerRef.current) return;

      // Usar iframe como fallback (powerbi-client-react pode ser adicionado depois)
      const iframe = document.createElement("iframe");
      iframe.title = title;
      iframe.src = `${tokenData.embedUrl}&accessToken=${tokenData.accessToken}`;
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.border = "none";
      iframe.allowFullscreen = true;

      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(iframe);
      setIsLoading(false);

      // Agendar refresh 5 min antes da expiração
      const expiry = new Date(tokenData.tokenExpiry).getTime();
      const refreshIn = expiry - Date.now() - 5 * 60 * 1000;
      if (refreshIn > 0) {
        refreshTimerRef.current = setTimeout(() => loadReport(), refreshIn);
      }
    } catch {
      setError("Não foi possível carregar o relatório Power BI");
      setIsLoading(false);
    }
  }, [dashboardId, title]);

  useEffect(() => {
    loadReport();
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [loadReport]);

  if (error) {
    return <WidgetErrorCard message={error} onRetry={loadReport} />;
  }

  return (
    <Card className="h-full" aria-label={`Power BI - ${title}`}>
      <CardContent className="h-full p-0 relative">
        {isLoading && (
          <div className="absolute inset-0">
            <WidgetSkeleton />
          </div>
        )}
        <div ref={containerRef} className="w-full h-full min-h-[300px]" />
      </CardContent>
    </Card>
  );
}
