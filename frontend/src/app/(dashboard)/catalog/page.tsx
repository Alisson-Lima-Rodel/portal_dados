"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { getDashboardsCatalog } from "@/services/dashboardApi";
import { getAreas } from "@/services/areaApi";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  LayoutGrid,
  List,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, Suspense } from "react";

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [areaId, setAreaId] = useState(searchParams.get("area_id") || "all");
  const [offset, setOffset] = useState(0);
  const limit = 12;

  const { data: areas = [] } = useQuery({
    queryKey: ["areas"],
    queryFn: getAreas,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["catalog", search, areaId, offset],
    queryFn: () =>
      getDashboardsCatalog({
        search: search || undefined,
        area_id: areaId !== "all" ? Number(areaId) : undefined,
        limit,
        offset,
      }),
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 0;
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Catálogo de Dashboards</h1>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
          />
        </div>
        <Select
          value={areaId}
          onValueChange={(v) => {
            setAreaId(v ?? "all");
            setOffset(0);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Área" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as áreas</SelectItem>
            {areas.map((a) => (
              <SelectItem key={a.id} value={String(a.id)}>
                {a.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1 ml-auto">
          <Button
            variant={view === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setView("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && data?.items.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <BarChart3 className="mx-auto h-12 w-12 mb-3 opacity-40" />
          <p className="text-lg font-medium">Nenhum dashboard encontrado</p>
          <p className="text-sm">Tente ajustar os filtros</p>
        </div>
      )}

      {/* Grid View */}
      {!isLoading && data && data.items.length > 0 && view === "grid" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((d) => (
            <Link key={d.id} href={`/${d.id}`}>
              <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{d.nome}</CardTitle>
                    <Badge variant={d.is_public ? "secondary" : "outline"} className="shrink-0">
                      {d.is_public ? "Público" : "Privado"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {d.descricao || "Sem descrição"}
                  </p>
                  {d.taxa_atualizacao_minutos && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Atualiza a cada {d.taxa_atualizacao_minutos} min
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* List View */}
      {!isLoading && data && data.items.length > 0 && view === "list" && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">Descrição</TableHead>
                <TableHead className="w-28">Acesso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((d) => (
                <TableRow
                  key={d.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/${d.id}`)}
                >
                  <TableCell className="font-medium">{d.nome}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {d.descricao || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={d.is_public ? "secondary" : "outline"}>
                      {d.is_public ? "Público" : "Privado"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Paginação */}
      {data && data.total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {data.total} resultado{data.total !== 1 && "s"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - limit))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={offset + limit >= data.total}
              onClick={() => setOffset(offset + limit)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense>
      <CatalogContent />
    </Suspense>
  );
}
