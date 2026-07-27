"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

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

export default function RegistroPage() {
  const [fullName, setFullName] = useState("");
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
    if (password.length < 8) {
      setError("A senha deve ter ao menos 8 caracteres.");
      return;
    }
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName.trim() } },
    });

    if (error) {
      setError(
        /already/i.test(error.message)
          ? "Já existe uma conta com este e-mail."
          : "Não foi possível criar a conta. Tente novamente.",
      );
      setLoading(false);
      return;
    }

    if (data.session) {
      window.location.assign("/dashboard");
      return;
    }

    // Sem confirmação de e-mail, o cadastro já cria sessão. Se por algum
    // motivo não vier (ex.: confirmação reativada no Supabase), seguimos
    // para o login.
    window.location.assign("/login");
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
          <span>Abra e acompanhe seus tickets</span>
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
            <h1 className="text-3xl font-bold tracking-tight">Criar conta</h1>
            <p className="text-sm text-muted-foreground">
              Registre-se como cliente para abrir e acompanhar tickets.
            </p>
          </div>

          {error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Não foi possível criar a conta</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4">
              <Field>
                <FieldLabel htmlFor="name">Nome completo</FieldLabel>
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onFocus={() => {
                    setEmailFocused(false);
                    setPasswordFocused(false);
                  }}
                  autoComplete="name"
                  required
                />
              </Field>

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
                  placeholder="voce@empresa.com"
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
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    required
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      type="button"
                      variant="ghost"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={
                        showPassword ? "Ocultar senha" : "Mostrar senha"
                      }
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </Field>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Spinner data-icon="inline-start" /> : null}
                Criar conta
              </Button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
