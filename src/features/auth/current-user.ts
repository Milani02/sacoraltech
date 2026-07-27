import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { User } from "@/types/domain";

/**
 * Returns the signed-in user's profile (domain shape), or null if there is
 * no authenticated session / no profile row yet.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  return {
    id: profile.id,
    fullName: profile.full_name || user.email || "Usuário",
    email: profile.email,
    role: profile.role,
    isActive: profile.is_active,
    createdAt: profile.created_at,
  };
}
