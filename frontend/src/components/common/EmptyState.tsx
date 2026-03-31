import { BarChart3 } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = "Nenhum resultado",
  description = "Tente ajustar os filtros ou critérios de busca.",
}: EmptyStateProps) {
  return (
    <div className="text-center py-16 text-muted-foreground">
      <BarChart3 className="mx-auto h-12 w-12 mb-3 opacity-40" />
      <p className="text-lg font-medium">{title}</p>
      <p className="text-sm">{description}</p>
    </div>
  );
}
