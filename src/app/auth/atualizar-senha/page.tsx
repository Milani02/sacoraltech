"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Field,
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
import { BrandLogo } from "@/components/layout/brand-logo";
import { createClient } from "@/lib/supabase/client";

type Status = "checking" | "ready" | "invalid";

function AtualizarSenha() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Sessão de recuperação chega via evento (fluxo hash) ou via ?code (PKCE).
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setStatus("ready");
    });

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setStatus("ready");
        return;
      }
      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          setStatus("ready");
          return;
        }
        // Código de uso único pode já ter sido trocado: revalida a sessão.
        const { data: again } = await supabase.auth.getSession();
        if (again.session) {
          setStatus("ready");
          return;
        }
      }
      setStatus("invalid");
    }
    init();

    return () => sub.subscription.unsubscribe();
  }, [params]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("A senha deve ter ao menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      setError("Não foi possível redefinir a senha. O link pode ter expirado.");
      return;
    }
    toast.success("Senha redefinida! Faça login com a nova senha.");
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="dark flex min-h-svh items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <BrandLogo onDark />
        </div>

        <div className="mb-8 grid gap-1.5 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Redefinir senha</h1>
          <p className="text-sm text-muted-foreground">
            Escolha uma nova senha para sua conta.
          </p>
        </div>

        {status === "checking" ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : status === "invalid" ? (
          <div className="grid gap-4">
            <Alert variant="destructive">
              <AlertTitle>Link inválido ou expirado</AlertTitle>
              <AlertDescription>
                Solicite um novo link de redefinição na tela de login.
              </AlertDescription>
            </Alert>
            <Button asChild variant="outline">
              <Link href="/login">Voltar ao login</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {error ? (
                <Alert variant="destructive">
                  <AlertTitle>Não foi possível redefinir</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <Field data-invalid={!!error}>
                <FieldLabel htmlFor="new-password">Nova senha</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="new-password"
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    required
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
              <Field data-invalid={!!error}>
                <FieldLabel htmlFor="confirm-password">
                  Confirmar senha
                </FieldLabel>
                <Input
                  id="confirm-password"
                  type={show ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                {error ? <FieldError>{error}</FieldError> : null}
              </Field>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Spinner data-icon="inline-start" /> : null}
                Redefinir senha
              </Button>
            </FieldGroup>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AtualizarSenhaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <AtualizarSenha />
    </Suspense>
  );
}
