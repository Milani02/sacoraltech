"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/features/auth/current-user";
import type { UserRole } from "@/types/domain";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const ROLES: UserRole[] = ["admin", "agent", "client"];

export async function updateUser(
  id: string,
  input: {
    fullName: string;
    role: UserRole;
    isActive: boolean;
  },
): Promise<ActionResult> {
  if (!ROLES.includes(input.role)) {
    return { ok: false, error: "Perfil inválido." };
  }
  if (!input.fullName.trim()) {
    return { ok: false, error: "Informe o nome." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName.trim(),
      role: input.role,
      is_active: input.isActive,
    })
    .eq("id", id);
  if (error) return { ok: false, error: "Não foi possível salvar o usuário." };

  revalidatePath("/usuarios");
  return { ok: true };
}

export async function createUser(input: {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<ActionResult> {
  // Only admins can create users.
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") {
    return { ok: false, error: "Apenas administradores podem criar usuários." };
  }

  const fullName = input.fullName.trim();
  const email = input.email.trim();
  if (!fullName) return { ok: false, error: "Informe o nome." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Informe um e-mail válido." };
  }
  if (input.password.length < 8) {
    return { ok: false, error: "A senha deve ter ao menos 8 caracteres." };
  }
  if (!ROLES.includes(input.role)) {
    return { ok: false, error: "Perfil inválido." };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      error:
        "Criação de usuários indisponível: configure SUPABASE_SERVICE_ROLE_KEY no servidor.",
    };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error || !data.user) {
    return { ok: false, error: "Não foi possível criar o usuário." };
  }

  // The signup trigger created the profile as 'client'; apply the role.
  const { error: profileError } = await admin
    .from("profiles")
    .update({
      full_name: fullName,
      role: input.role,
    })
    .eq("id", data.user.id);
  if (profileError) {
    return {
      ok: false,
      error: "Usuário criado, mas falhou ao definir perfil. Edite-o na lista.",
    };
  }

  revalidatePath("/usuarios");
  return { ok: true };
}
