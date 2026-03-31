"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getConnections,
  createConnection,
  updateConnection,
  deleteConnection,
} from "@/services/connectionApi";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Connection, ConnectionCreate, ConnectionUpdate } from "@/types";
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

const TIPOS_CONEXAO = ["fabric", "oracle", "postgres"] as const;

interface FormState {
  nome: string;
  tipo: string;
  host: string;
  porta: string;
  database: string;
  usuario: string;
  senha: string;
}

const emptyForm: FormState = {
  nome: "",
  tipo: "postgres",
  host: "",
  porta: "5432",
  database: "",
  usuario: "",
  senha: "",
};

export default function ConnectionsPage() {
  const { hasPermission } = useAuth();
  if (!hasPermission("manage_connections")) redirect("/home");

  const queryClient = useQueryClient();
  const { data: connections, isLoading } = useQuery({
    queryKey: ["connections"],
    queryFn: getConnections,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Connection | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const createMutation = useMutation({
    mutationFn: (data: ConnectionCreate) => createConnection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
      toast.success("Conexão criada!");
      closeDialog();
    },
    onError: () => toast.error("Erro ao criar conexão."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ConnectionUpdate }) =>
      updateConnection(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
      toast.success("Conexão atualizada!");
      closeDialog();
    },
    onError: () => toast.error("Erro ao atualizar conexão."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteConnection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
      toast.success("Conexão removida!");
    },
    onError: () => toast.error("Erro ao remover conexão."),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(conn: Connection) {
    setEditing(conn);
    setForm({
      nome: conn.nome,
      tipo: conn.tipo,
      host: conn.host,
      porta: String(conn.porta),
      database: conn.database,
      usuario: conn.usuario,
      senha: "",
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
      tipo: form.tipo as ConnectionCreate["tipo"],
      host: form.host,
      porta: Number(form.porta),
      database: form.database,
      usuario: form.usuario,
    };

    if (editing) {
      const data: ConnectionUpdate = { ...base };
      if (form.senha) data.senha = form.senha;
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate({ ...base, senha: form.senha });
    }
  }

  function setField(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestão de Conexões</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Conexão
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden sm:table-cell">Host</TableHead>
                <TableHead className="hidden md:table-cell">Database</TableHead>
                <TableHead>Senha</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {connections?.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{c.tipo}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {c.host}:{c.porta}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{c.database}</TableCell>
                  <TableCell className="text-muted-foreground">••••••</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(c.id)}
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
            <DialogTitle>{editing ? "Editar Conexão" : "Nova Conexão"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => setField("nome", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => v && setField("tipo", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_CONEXAO.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label>Host</Label>
                <Input
                  value={form.host}
                  onChange={(e) => setField("host", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Porta</Label>
                <Input
                  type="number"
                  value={form.porta}
                  onChange={(e) => setField("porta", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Database</Label>
              <Input
                value={form.database}
                onChange={(e) => setField("database", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Usuário</Label>
                <Input
                  value={form.usuario}
                  onChange={(e) => setField("usuario", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {editing ? "Nova Senha (vazio = manter)" : "Senha"}
                </Label>
                <Input
                  type="password"
                  value={form.senha}
                  placeholder={editing ? "••••••" : ""}
                  onChange={(e) => setField("senha", e.target.value)}
                />
              </div>
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
