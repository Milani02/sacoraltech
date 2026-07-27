"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { createUser, updateUser } from "@/features/users/actions";
import { USER_ROLE } from "@/features/auth/roles";
import { initials } from "@/lib/format";
import type { User, UserRole } from "@/types/domain";

const ROLE_ORDER: UserRole[] = ["admin", "agent", "client"];

export function UsersManager({
  users,
  canManage,
}: {
  users: User[];
  canManage: boolean;
}) {
  const router = useRouter();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [pending, start] = useTransition();

  // shared form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("agent");
  const [isActive, setIsActive] = useState(true);

  function openCreate() {
    setFullName("");
    setEmail("");
    setPassword("");
    setRole("agent");
    setCreateOpen(true);
  }

  function openEdit(user: User) {
    setEditing(user);
    setFullName(user.fullName);
    setRole(user.role);
    setIsActive(user.isActive);
  }

  function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await createUser({
        fullName,
        email,
        password,
        role,
      });
      if (res.ok) {
        toast.success("Usuário criado");
        setCreateOpen(false);
        router.refresh();
      } else {
        toast.error(res.error ?? "Não foi possível criar.");
      }
    });
  }

  function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    start(async () => {
      const res = await updateUser(editing.id, {
        fullName,
        role,
        isActive,
      });
      if (res.ok) {
        toast.success("Usuário atualizado");
        setEditing(null);
        router.refresh();
      } else {
        toast.error(res.error ?? "Não foi possível salvar.");
      }
    });
  }

  return (
    <>
      {canManage ? (
        <div className="flex justify-end">
          <Button onClick={openCreate}>
            <Plus data-icon="inline-start" />
            Novo usuário
          </Button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Usuário</TableHead>
              <TableHead className="hidden md:table-cell">Perfil</TableHead>
              <TableHead className="text-right">Status</TableHead>
              {canManage ? <TableHead className="w-12" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-primary/10 text-xs text-primary">
                        {initials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid leading-tight">
                      <span className="font-medium">
                        {user.fullName || "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="secondary">{USER_ROLE[user.role].label}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={user.isActive ? "secondary" : "outline"}>
                    {user.isActive ? "Ativo" : "Inativo"}
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
                          <DropdownMenuItem onClick={() => openEdit(user)}>
                            <Pencil />
                            Editar
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

      {/* Create */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <form onSubmit={submitCreate}>
            <DialogHeader>
              <DialogTitle>Novo usuário</DialogTitle>
              <DialogDescription>
                Cria uma conta de acesso e define o perfil.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className="py-4">
              <Field>
                <FieldLabel htmlFor="user-name">Nome completo</FieldLabel>
                <Input
                  id="user-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoFocus
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="user-email">E-mail</FieldLabel>
                <Input
                  id="user-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="user-password">Senha provisória</FieldLabel>
                <Input
                  id="user-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                />
              </Field>
              <RoleField value={role} onChange={setRole} />
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Spinner data-icon="inline-start" /> : null}
                Criar usuário
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <form onSubmit={submitEdit}>
            <DialogHeader>
              <DialogTitle>Editar usuário</DialogTitle>
              <DialogDescription>
                {editing ? `${editing.fullName || editing.email}` : ""}
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className="py-4">
              <Field>
                <FieldLabel htmlFor="edit-name">Nome completo</FieldLabel>
                <Input
                  id="edit-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </Field>
              <RoleField value={role} onChange={setRole} />
              <Field orientation="horizontal">
                <Switch
                  id="user-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <FieldLabel htmlFor="user-active">Usuário ativo</FieldLabel>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Spinner data-icon="inline-start" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RoleField({
  value,
  onChange,
}: {
  value: UserRole;
  onChange: (v: UserRole) => void;
}) {
  return (
    <Field>
      <FieldLabel>Perfil</FieldLabel>
      <Select value={value} onValueChange={(v) => onChange(v as UserRole)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {ROLE_ORDER.map((r) => (
              <SelectItem key={r} value={r}>
                {USER_ROLE[r].label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}
