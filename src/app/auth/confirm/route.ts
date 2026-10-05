import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Redireciona preservando o host público. Em produção o app roda com
 * `next start -H 0.0.0.0` atrás de um proxy, então o `origin` de `request.url`
 * vira `http://0.0.0.0:3000`. Para não mandar o usuário para 0.0.0.0, usamos
 * um `Location` relativo — o navegador resolve contra o domínio público atual.
 * Os cookies gravados pelo `verifyOtp` (via next/headers) são anexados a esta
 * resposta automaticamente pelo Next.
 */
function redirectTo(path: string) {
  const res = new NextResponse(null, { status: 303 });
  res.headers.set("Location", path);
  return res;
}

/**
 * Verifica no servidor o token enviado por e-mail (recuperação de senha,
 * confirmação de cadastro, etc.) via `verifyOtp` e grava a sessão em cookies
 * antes de redirecionar.
 *
 * É mais robusto que trocar o `?code` (PKCE) no cliente: não depende de um
 * `code_verifier` guardado no mesmo navegador em que o link foi solicitado,
 * então funciona mesmo quando o e-mail é aberto em outro dispositivo.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // Evita open redirect: só aceita caminhos relativos internos.
  const nextParam = searchParams.get("next");
  const next =
    nextParam && nextParam.startsWith("/") ? nextParam : "/auth/atualizar-senha";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return redirectTo(next);
    }
  }

  // Token ausente, inválido ou expirado → a tela exibe o aviso para pedir outro.
  return redirectTo("/auth/atualizar-senha?error=expired");
}
