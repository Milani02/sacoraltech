"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

function revalidate() {
  revalidatePath("/setores");
  revalidatePath("/chamados");
}

export async function createSector(input: {
  name: string;
  description: string;
}): Promise<ActionResult> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Informe o nome do setor." };

  const supabase = await createClient();
  const { error } = await supabase.from("sectors").insert({
    name,
    description: input.description.trim() || null,
  });
  if (error) return { ok: false, error: "Não foi possível criar o setor." };

  revalidate();
  return { ok: true };
}

export async function updateSector(
  id: string,
  input: { name: string; description: string; isActive: boolean },
): Promise<ActionResult> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Informe o nome do setor." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("sectors")
    .update({
      name,
      description: input.description.trim() || null,
      is_active: input.isActive,
    })
    .eq("id", id);
  if (error) return { ok: false, error: "Não foi possível salvar o setor." };

  revalidate();
  return { ok: true };
}

export async function deleteSector(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("sectors").delete().eq("id", id);
  if (error) {
    return {
      ok: false,
      error: "Não foi possível excluir. Há tickets ligados a este setor?",
    };
  }
  revalidate();
  return { ok: true };
}
