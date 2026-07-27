import "server-only";

import { createClient } from "@/lib/supabase/server";
import { mapClient } from "@/features/mappers";
import type { Client } from "@/types/domain";

export async function listClients(): Promise<Client[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data ?? []).map(mapClient);
}
