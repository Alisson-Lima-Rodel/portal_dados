"use client";

import { useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { getAuditLogs } from "@/services/auditApi";
import { getUsers } from "@/services/userApi";
import { getDashboardsCatalog } from "@/services/dashboardApi";
import { useAuth } from "@/contexts/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { redirect } from "next/navigation";

function AuditContent() {
  const { hasPermission } = useAuth();
  if (!hasPermission("manage_users")) redirect("/home");

  const searchParams = useSearchParams();
  const [usuarioId, setUsuarioId] = useState(searchParams.get("usuario_id") || "all");
  const [dashboardId, setDashboardId] = useState(
    searchParams.get("dashboard_id") || "all"
  );
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const { data: dashboards } = useQuery({
    queryKey: ["all-dashboards-audit"],
    queryFn: () => getDashboardsCatalog({ limit: 200, offset: 0 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", usuarioId, dashboardId, dataInicio, dataFim, offset],
    queryFn: () =>
      getAuditLogs({
        usuario_id: usuarioId !== "all" ? Number(usuarioId) : undefined,
        dashboard_id: dashboardId !== "all" ? Number(dashboardId) : undefined,
        data_inicio: dataInicio || undefined,
        data_fim: dataFim || undefined,
        limit,
        offset,
      }),
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 0;
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Log de Acessos</h1>

      {/* Filtros */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <Label className="text-xs">Usuário</Label>
          <Select
            value={usuarioId}
            onValueChange={(v) => {
              setUsuarioId(v ?? "all");
              setOffset(0);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Dashboard</Label>
          <Select
            value={dashboardId}
            onValueChange={(v) => {
              setDashboardId(v ?? "all");
              setOffset(0);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {dashboards?.items.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Data Início</Label>
          <Input
            type="date"
            value={dataInicio}
            onChange={(e) => {
              setDataInicio(e.target.value);
              setOffset(0);
            }}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Data Fim</Label>
          <Input
            type="date"
            value={dataFim}
            onChange={(e) => {
              setDataFim(e.target.value);
              setOffset(0);
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Página</TableHead>
                <TableHead className="hidden sm:table-cell">Dashboard</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      {users.find((u) => u.id === log.usuario_id)?.nome || log.usuario_id || "—"}
                    </TableCell>
                    <TableCell>{log.pagina}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {(log.dashboard_id && dashboards?.items.find((d) => d.id === log.dashboard_id)?.nome) || log.dashboard_id || "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Paginação */}
      {data && data.total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {data.total} registro{data.total !== 1 && "s"}
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

export default function AuditPage() {
  return (
    <Suspense>
      <AuditContent />
    </Suspense>
  );
}
