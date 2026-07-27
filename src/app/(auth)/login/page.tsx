"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Field, FieldLabel } from "@/components/ui/field";
import { BrandLogo } from "@/components/layout/brand-logo";
import { LoginCharacters } from "@/components/auth/login-characters";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : "Não foi possível entrar. Tente novamente.",
      );
      setLoading(false);
      return;
    }

    window.location.assign("/dashboard");
  }

  async function handleReset() {
    if (!email) {
      toast.error("Informe seu e-mail primeiro.");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/atualizar-senha`,
    });
    if (error) {
      toast.error("Não foi possível enviar o link.");
    } else {
      toast.success("Enviamos um link de redefinição para seu e-mail.");
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Painel claro com personagens */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-b from-secondary to-muted p-10 lg:flex">
        <BrandLogo />

        <div className="flex flex-1 items-center justify-center">
          <LoginCharacters
            emailFocused={emailFocused}
            passwordFocused={passwordFocused}
            revealPassword={showPassword}
          />
        </div>

        <div className="flex gap-5 text-xs text-muted-foreground">
          <span>Central de atendimento</span>
          <span>© {new Date().getFullYear()} Oraltech</span>
        </div>
      </div>

      {/* Painel escuro com o formulário */}
      <div className="dark flex items-center justify-center bg-background p-6 text-foreground sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center lg:hidden">
            <BrandLogo onDark />
          </div>

          <div className="mb-8 grid gap-1.5 text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              Bem-vindo de volta!
            </h1>
            <p className="text-sm text-muted-foreground">
              Entre com seus dados para acessar a central.
            </p>
          </div>

          {error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Não foi possível entrar</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4">
              <Field>
                <FieldLabel htmlFor="email">E-mail</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => {
                    setEmailFocused(true);
                    setPasswordFocused(false);
                  }}
                  onBlur={() => setEmailFocused(false)}
                  placeholder="voce@oraltech.com"
                  autoComplete="email"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Senha</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      type="button"
                      variant="ghost"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </Field>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Esqueci a senha?
                </button>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Spinner data-icon="inline-start" /> : null}
                Entrar
              </Button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            É cliente e ainda não tem conta?{" "}
            <Link
              href="/registro"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
