import "server-only";

import { createClient } from "@/lib/supabase/server";
import { mapUser } from "@/features/mappers";
import type { User } from "@/types/domain";

export async function listUsers(): Promise<User[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name");
  if (error) throw error;
  return (data ?? []).map(mapUser);
}

/** Staff (admin/agent) eligible to be assigned to tickets. */
export async function listAgents(): Promise<User[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["admin", "agent"])
    .eq("is_active", true)
    .order("full_name");
  if (error) throw error;
  return (data ?? []).map(mapUser);
}
