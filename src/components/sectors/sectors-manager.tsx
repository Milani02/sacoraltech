"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  createSector,
  deleteSector,
  updateSector,
} from "@/features/sectors/actions";
import type { Sector } from "@/types/domain";

export function SectorsManager({
  sectors,
  counts,
  canManage,
}: {
  sectors: Sector[];
  counts: Record<string, number>;
  canManage: boolean;
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Sector | null>(null);
  const [toDelete, setToDelete] = useState<Sector | null>(null);
  const [pending, start] = useTransition();

  // form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  function openCreate() {
    setEditing(null);
    setName("");
    setDescription("");
    setIsActive(true);
    setFormOpen(true);
  }

  function openEdit(sector: Sector) {
    setEditing(sector);
    setName(sector.name);
    setDescription(sector.description ?? "");
    setIsActive(sector.isActive);
    setFormOpen(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Informe o nome do setor.");
      return;
    }
    start(async () => {
      const res = editing
        ? await updateSector(editing.id, { name, description, isActive })
        : await createSector({ name, description });
      if (res.ok) {
        toast.success(editing ? "Setor atualizado" : "Setor criado");
        setFormOpen(false);
        router.refresh();
      } else {
        toast.error(res.error ?? "Não foi possível salvar.");
      }
    });
  }

  function confirmDelete() {
    if (!toDelete) return;
    start(async () => {
      const res = await deleteSector(toDelete.id);
      if (res.ok) {
        toast.success("Setor excluído");
        setToDelete(null);
        router.refresh();
      } else {
        toast.error(res.error ?? "Não foi possível excluir.");
      }
    });
  }

  return (
    <>
      {canManage ? (
        <div className="flex justify-end">
          <Button onClick={openCreate}>
            <Plus data-icon="inline-start" />
            Novo setor
          </Button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Setor</TableHead>
              <TableHead className="hidden sm:table-cell">Descrição</TableHead>
              <TableHead className="text-right">Tickets</TableHead>
              <TableHead className="text-right">Status</TableHead>
              {canManage ? <TableHead className="w-12" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sectors.map((sector) => (
              <TableRow key={sector.id}>
                <TableCell className="font-medium">{sector.name}</TableCell>
                <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                  {sector.description ?? "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {counts[sector.id] ?? 0}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={sector.isActive ? "secondary" : "outline"}>
                    {sector.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                {canManage ? (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                          <DropdownMenuItem onClick={() => openEdit(sector)}>
                            <Pencil />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setToDelete(sector)}
                          >
                            <Trash2 />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create / edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar setor" : "Novo setor"}</DialogTitle>
              <DialogDescription>
                Setores agrupam os tickets por área responsável.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className="py-4">
              <Field>
                <FieldLabel htmlFor="sector-name">Nome</FieldLabel>
                <Input
                  id="sector-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: Suporte Técnico"
                  autoFocus
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="sector-desc">Descrição</FieldLabel>
                <Textarea
                  id="sector-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Opcional"
                  rows={3}
                />
              </Field>
              {editing ? (
                <Field orientation="horizontal">
                  <Switch
                    id="sector-active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <FieldLabel htmlFor="sector-active">Setor ativo</FieldLabel>
                  <FieldDescription>
                    Inativos não recebem novos tickets.
                  </FieldDescription>
                </Field>
              ) : null}
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Spinner data-icon="inline-start" /> : null}
                {editing ? "Salvar" : "Criar setor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir setor?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete
                ? `O setor "${toDelete.name}" será removido. Esta ação não pode ser desfeita.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={pending}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
