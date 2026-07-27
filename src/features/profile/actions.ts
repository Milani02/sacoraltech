"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/current-user";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/** Atualiza o nome do próprio usuário logado (RLS permite self-update). */
export async function updateMyName(fullName: string): Promise<ActionResult> {
  const name = fullName.trim();
  if (!name) return { ok: false, error: "Informe seu nome." };

  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Sessão expirada. Entre novamente." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: name })
    .eq("id", me.id);
  if (error) {
    console.error("updateMyName failed:", error);
    return { ok: false, error: "Não foi possível salvar o nome." };
  }

  revalidatePath("/perfil");
  return { ok: true };
}
