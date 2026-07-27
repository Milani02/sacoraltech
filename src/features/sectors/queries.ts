import "server-only";

import { createClient } from "@/lib/supabase/server";
import { mapSector } from "@/features/mappers";
import type { Sector } from "@/types/domain";

export async function listSectors(): Promise<Sector[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sectors")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data ?? []).map(mapSector);
}
