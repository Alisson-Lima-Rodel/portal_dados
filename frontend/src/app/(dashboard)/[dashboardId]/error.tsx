"use client";

import { WidgetErrorCard } from "@/components/widgets/WidgetErrorCard";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center py-16">
      <WidgetErrorCard
        message={error.message || "Erro ao carregar o dashboard."}
        onRetry={reset}
      />
    </div>
  );
}
