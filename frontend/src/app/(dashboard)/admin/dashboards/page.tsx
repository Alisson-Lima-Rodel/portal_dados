"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDashboardsCatalog,
  createDashboard,
  updateDashboard,
  deleteDashboard,
} from "@/services/dashboardApi";
import { getAreas } from "@/services/areaApi";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Dashboard, DashboardCreate, DashboardUpdate } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { redirect } from "next/navigation";

interface FormState {
  nome: string;
  descricao: string;
  area_id: string;
  is_public: boolean;
  taxa_atualizacao_minutos: string;
}

const emptyForm: FormState = {
  nome: "",
  descricao: "",
  area_id: "",
  is_public: true,
  taxa_atualizacao_minutos: "0",
};

export default function DashboardsAdminPage() {
  const { hasPermission } = useAuth();
  if (!hasPermission("edit_dashboard")) redirect("/home");

  const queryClient = useQueryClient();

  const { data: catalog, isLoading } = useQuery({
    queryKey: ["admin-dashboards"],
    queryFn: () => getDashboardsCatalog({ limit: 100, offset: 0 }),
  });

  const { data: areas = [] } = useQuery({
    queryKey: ["areas"],
    queryFn: getAreas,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Dashboard | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const createMutation = useMutation({
    mutationFn: (data: DashboardCreate) => createDashboard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dashboards"] });
      toast.success("Dashboard criado!");
      closeDialog();
    },
    onError: () => toast.error("Erro ao criar dashboard."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: DashboardUpdate }) =>
      updateDashboard(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dashboards"] });
      toast.success("Dashboard atualizado!");
      closeDialog();
    },
    onError: () => toast.error("Erro ao atualizar dashboard."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteDashboard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dashboards"] });
      toast.success("Dashboard removido!");
    },
    onError: () => toast.error("Erro ao remover dashboard."),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(dash: Dashboard) {
    setEditing(dash);
    setForm({
      nome: dash.nome,
      descricao: dash.descricao || "",
      area_id: String(dash.area_id),
      is_public: dash.is_public,
      taxa_atualizacao_minutos: String(dash.taxa_atualizacao_minutos || 0),
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
  }

  function handleSubmit() {
    const base = {
      nome: form.nome,
      descricao: form.descricao || undefined,
      area_id: Number(form.area_id),
      is_public: form.is_public,
      taxa_atualizacao_minutos: Number(form.taxa_atualizacao_minutos) || undefined,
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, data: base });
    } else {
      createMutation.mutate(base);
    }
  }

  function setField(key: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestão de Dashboards</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Dashboard
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">Descrição</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Acesso</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {catalog?.items.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.nome}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {d.descricao || "—"}
                  </TableCell>
                  <TableCell>{d.area?.nome || d.area_id}</TableCell>
                  <TableCell>
                    <Badge variant={d.is_public ? "secondary" : "outline"}>
                      {d.is_public ? "Público" : "Privado"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(d)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(d.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(v) => !v && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Dashboard" : "Novo Dashboard"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={form.nome}
                onChange={(e) => setField("nome", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={form.descricao}
                onChange={(e) => setField("descricao", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Área</Label>
              <Select
                value={form.area_id}
                onValueChange={(v) => v && setField("area_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma área" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Taxa de atualização (minutos)</Label>
              <Input
                type="number"
                value={form.taxa_atualizacao_minutos}
                onChange={(e) =>
                  setField("taxa_atualizacao_minutos", e.target.value)
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_public"
                checked={form.is_public}
                onCheckedChange={(v) => setField("is_public", !!v)}
              />
              <Label htmlFor="is_public">Dashboard público</Label>
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
