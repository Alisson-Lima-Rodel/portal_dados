"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getDashboardsCatalog } from "@/services/dashboardApi";
import type { Dashboard } from "@/types";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

export function DashboardSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Dashboard[]>([]);

  // Ctrl+K / Cmd+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Debounce search
  const fetchResults = useCallback(async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }
    try {
      const data = await getDashboardsCatalog({ search: term, limit: 5 });
      setResults(data.items);
    } catch {
      setResults([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchResults(search), 300);
    return () => clearTimeout(timer);
  }, [search, fetchResults]);

  function handleSelect(dashboardId: number) {
    setOpen(false);
    setSearch("");
    router.push(`/${dashboardId}`);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Buscar dashboards... (Ctrl+K)"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>Nenhum dashboard encontrado.</CommandEmpty>
        {results.length > 0 && (
          <CommandGroup heading="Dashboards">
            {results.map((d) => (
              <CommandItem
                key={d.id}
                value={d.nome}
                onSelect={() => handleSelect(d.id)}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                <div className="flex-1">
                  <span className="font-medium">{d.nome}</span>
                  {d.area && (
                    <span className="text-xs text-muted-foreground ml-2">
                      {d.area.nome}
                    </span>
                  )}
                </div>
                <Badge variant="outline" className="ml-2 text-xs">
                  {d.is_public ? "Público" : "Privado"}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
