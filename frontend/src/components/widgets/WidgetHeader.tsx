"use client";

import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WidgetHeaderProps {
  title: string;
  ariaLabel?: string;
  onEdit?: () => void;
}

export function WidgetHeader({ title, ariaLabel, onEdit }: WidgetHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-2" aria-label={ariaLabel}>
      <h3 className="text-sm font-medium truncate">{title}</h3>
      {onEdit && (
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
          <Settings className="h-3.5 w-3.5" />
          <span className="sr-only">Editar widget</span>
        </Button>
      )}
    </div>
  );
}
