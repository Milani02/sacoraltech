"use server";

import { revalidatePath } from "next/cache";

import { createClient as createSupabase } from "@/lib/supabase/server";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function revalidate() {
  revalidatePath("/clientes");
  revalidatePath("/chamados");
}

function validate(input: { name: string; email: string }): string | null {
  if (!input.name.trim()) return "Informe o nome do cliente.";
  if (!EMAIL_RE.test(input.email.trim())) return "Informe um e-mail válido.";
  return null;
}

export async function createClient(input: {
  name: string;
  email: string;
  phone: string;
}): Promise<ActionResult> {
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const supabase = await createSupabase();
  const { error } = await supabase.from("clients").insert({
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim() || null,
  });
  if (error) return { ok: false, error: "Não foi possível criar o cliente." };

  revalidate();
  return { ok: true };
}

export async function updateClient(
  id: string,
  input: { name: string; email: string; phone: string },
): Promise<ActionResult> {
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const supabase = await createSupabase();
  const { error } = await supabase
    .from("clients")
    .update({
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone.trim() || null,
    })
    .eq("id", id);
  if (error) return { ok: false, error: "Não foi possível salvar o cliente." };

  revalidate();
  return { ok: true };
}

export async function deleteClient(id: string): Promise<ActionResult> {
  const supabase = await createSupabase();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) {
    return {
      ok: false,
      error: "Não foi possível excluir. Há tickets ligados a este cliente?",
    };
  }
  revalidate();
  return { ok: true };
}
