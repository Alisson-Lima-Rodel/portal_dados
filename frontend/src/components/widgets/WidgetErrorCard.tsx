import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface WidgetErrorCardProps {
  message?: string;
  onRetry?: () => void;
}

export function WidgetErrorCard({
  message = "Erro ao carregar widget",
  onRetry,
}: WidgetErrorCardProps) {
  return (
    <Card className="h-full flex items-center justify-center border-destructive/30">
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Tentar novamente
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
