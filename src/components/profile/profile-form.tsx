"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { updateMyName } from "@/features/profile/actions";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/types/domain";

export function ProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const [name, setName] = useState(user.fullName);
  const [savingName, startName] = useTransition();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startName(async () => {
      const res = await updateMyName(name);
      if (res.ok) {
        toast.success("Nome atualizado");
        router.refresh();
      } else {
        toast.error(res.error ?? "Não foi possível salvar.");
      }
    });
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    if (password.length < 8) {
      setPwError("A senha deve ter ao menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setPwError("As senhas não coincidem.");
      return;
    }
    setSavingPw(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPw(false);
    if (error) {
      toast.error("Não foi possível alterar a senha.");
      return;
    }
    setPassword("");
    setConfirm("");
    toast.success("Senha alterada");
  }

  return (
    <div className="grid max-w-2xl gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados da conta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveName}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="profile-name">Nome completo</FieldLabel>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="profile-email">E-mail</FieldLabel>
                <Input id="profile-email" value={user.email} disabled readOnly />
                <FieldDescription>O e-mail não pode ser alterado.</FieldDescription>
              </Field>
              <div className="flex justify-end">
                <Button type="submit" disabled={savingName || !name.trim()}>
                  {savingName ? <Spinner data-icon="inline-start" /> : null}
                  Salvar nome
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alterar senha</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={savePassword}>
            <FieldGroup>
              <Field data-invalid={!!pwError}>
                <FieldLabel htmlFor="profile-password">Nova senha</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="profile-password"
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      type="button"
                      variant="ghost"
                      onClick={() => setShow((s) => !s)}
                      aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {show ? <EyeOff /> : <Eye />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </Field>
              <Field data-invalid={!!pwError}>
                <FieldLabel htmlFor="profile-confirm">Confirmar senha</FieldLabel>
                <Input
                  id="profile-confirm"
                  type={show ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
                {pwError ? <FieldError>{pwError}</FieldError> : null}
              </Field>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={savingPw || !password || !confirm}
                >
                  {savingPw ? <Spinner data-icon="inline-start" /> : null}
                  Alterar senha
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
