"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/current-user";
import { getTopic } from "@/features/tickets/topics";
import { TICKET_CATEGORIES } from "@/features/tickets/constants";
import type { TicketPriority, TicketStatus } from "@/types/domain";

export interface ActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

const STATUSES: TicketStatus[] = [
  "new",
  "in_progress",
  "waiting_client",
  "closed",
];
const PRIORITIES: TicketPriority[] = ["low", "medium", "high", "urgent"];

function revalidateTicket(id?: string) {
  revalidatePath("/chamados");
  revalidatePath("/dashboard");
  if (id) revalidatePath(`/chamados/${id}`);
}

export async function createTicket(input: {
  title: string;
  description: string;
  requesterId: string;
  priority: TicketPriority;
}): Promise<ActionResult> {
  const title = input.title.trim();
  const description = input.description.trim();
  if (!title) return { ok: false, error: "Informe um título." };
  if (!description) return { ok: false, error: "Descreva o ticket." };
  if (!PRIORITIES.includes(input.priority)) {
    return { ok: false, error: "Prioridade inválida." };
  }

  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Sessão expirada. Entre novamente." };

  const supabase = await createClient();

  // Cliente abre chamado em seu próprio nome (resolve/cria o registro de
  // solicitante). Staff escolhe o solicitante na lista.
  let requesterId = input.requesterId;
  if (me.role === "client") {
    const { data: cid, error: rpcError } = await supabase.rpc("ensure_my_client");
    if (rpcError || !cid) {
      return { ok: false, error: "Não foi possível identificar seu cadastro." };
    }
    requesterId = cid;
  } else if (!requesterId) {
    return { ok: false, error: "Selecione o solicitante." };
  }

  const { data, error } = await supabase
    .from("tickets")
    .insert({
      title,
      description,
      requester_id: requesterId,
      priority: input.priority,
    })
    .select("id")
    .single();

  if (error) {
    console.error("createTicket insert failed:", error);
    return { ok: false, error: "Não foi possível abrir o ticket." };
  }

  revalidateTicket(data.id);
  return { ok: true, id: data.id };
}

/**
 * Abertura de ticket pelo cliente via tópico ("Assunto"). Campos extras vão
 * para `details`. Retorna o id do ticket criado (usado para anexar arquivos
 * no cliente).
 */
export async function createTicketFromTopic(input: {
  topicId: string;
  values: Record<string, string>;
}): Promise<ActionResult> {
  const topic = getTopic(input.topicId);
  if (!topic) return { ok: false, error: "Assunto inválido." };

  // Validação dos campos obrigatórios.
  for (const f of topic.fields) {
    if (f.required && !(input.values[f.key] ?? "").trim()) {
      return { ok: false, error: `Preencha: ${f.label}.` };
    }
  }
  if (topic.describe?.required && !(input.values[topic.describe.key] ?? "").trim()) {
    return { ok: false, error: `Preencha: ${topic.describe.label}.` };
  }

  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Sessão expirada. Entre novamente." };

  const supabase = await createClient();

  const { data: requesterId } = await supabase.rpc("ensure_my_client");
  if (!requesterId) {
    return { ok: false, error: "Não foi possível preparar o atendimento." };
  }

  const detailFields = topic.fields
    .map((f) => ({ label: f.label, value: (input.values[f.key] ?? "").trim() }))
    .filter((d) => d.value);

  const describeValue = topic.describe
    ? (input.values[topic.describe.key] ?? "").trim()
    : "";
  const description = describeValue || topic.description;

  const resumo = (input.values.resumo ?? "").trim();
  const produto = (input.values.produto ?? "").trim();
  const title =
    topic.label + (resumo ? ` — ${resumo}` : produto ? ` — ${produto}` : "");

  const { data, error } = await supabase
    .from("tickets")
    .insert({
      title,
      description,
      requester_id: requesterId,
      topic: topic.label,
      details: { fields: detailFields },
    })
    .select("id")
    .single();

  if (error) {
    console.error("createTicketFromTopic insert failed:", error);
    return { ok: false, error: "Não foi possível abrir o ticket." };
  }

  revalidateTicket(data.id);
  return { ok: true, id: data.id };
}

export async function updateTicketStatus(
  id: string,
  status: TicketStatus,
): Promise<ActionResult> {
  if (!STATUSES.includes(status)) {
    return { ok: false, error: "Status inválido." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("tickets")
    .update({ status })
    .eq("id", id);
  if (error) return { ok: false, error: "Não foi possível atualizar o status." };
  revalidateTicket(id);
  return { ok: true };
}

export async function updateTicketPriority(
  id: string,
  priority: TicketPriority,
): Promise<ActionResult> {
  if (!PRIORITIES.includes(priority)) {
    return { ok: false, error: "Prioridade inválida." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("tickets")
    .update({ priority })
    .eq("id", id);
  if (error) {
    return { ok: false, error: "Não foi possível atualizar a prioridade." };
  }
  revalidateTicket(id);
  return { ok: true };
}

export async function updateTicketCategory(
  id: string,
  category: string | null,
): Promise<ActionResult> {
  // null/"" limpa a categoria; caso contrário precisa ser uma das R1–R19.
  const value = category && category.trim() ? category.trim() : null;
  if (value && !TICKET_CATEGORIES.includes(value)) {
    return { ok: false, error: "Categoria inválida." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("tickets")
    .update({ category: value })
    .eq("id", id);
  if (error) {
    console.error("updateTicketCategory failed:", error);
    return { ok: false, error: "Não foi possível atualizar a categoria." };
  }
  revalidateTicket(id);
  return { ok: true };
}

export async function assignTicket(
  id: string,
  assigneeId: string | null,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tickets")
    .update({ assignee_id: assigneeId })
    .eq("id", id);
  if (error) {
    return { ok: false, error: "Não foi possível alterar o responsável." };
  }
  revalidateTicket(id);
  return { ok: true };
}

export async function addMessage(
  ticketId: string,
  body: string,
  isInternal: boolean,
): Promise<ActionResult> {
  const text = body.trim();
  if (!text) return { ok: false, error: "Escreva uma mensagem." };

  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Sessão expirada. Entre novamente." };

  const supabase = await createClient();

  // Ticket fechado: só a equipe pode comentar (e reabrir manualmente).
  // O RLS também bloqueia; aqui devolvemos uma mensagem amigável.
  if (me.role === "client") {
    const { data: ticket } = await supabase
      .from("tickets")
      .select("status")
      .eq("id", ticketId)
      .single();
    if (ticket?.status === "closed") {
      return {
        ok: false,
        error: "Este ticket foi fechado pela equipe e não aceita novas mensagens.",
      };
    }
  }

  const { data, error } = await supabase
    .from("ticket_messages")
    .insert({
      ticket_id: ticketId,
      author_id: me.id,
      body: text,
      is_internal: isInternal,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: "Não foi possível enviar a mensagem." };

  revalidateTicket(ticketId);
  return { ok: true, id: data.id };
}
