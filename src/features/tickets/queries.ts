import "server-only";

import { createClient } from "@/lib/supabase/server";
import { mapClient, mapMessage, mapTicket, mapUser } from "@/features/mappers";
import type {
  TicketAttachment,
  TicketMessage,
  TicketWithRelations,
  User,
} from "@/types/domain";

/** Placeholder assignee for clients: RLS only lets them read the display name (via RPC), not the full profile. */
function nameOnlyAssignee(id: string, fullName: string): User {
  return {
    id,
    fullName,
    email: "",
    role: "agent",
    isActive: true,
    createdAt: "",
  };
}

/**
 * Lists all tickets the current user can see (scoped by RLS), with their
 * requester and assignee resolved. Ordered by most recently updated.
 */
export async function listTickets(): Promise<TicketWithRelations[]> {
  const supabase = await createClient();

  const [tickets, clients, profiles] = await Promise.all([
    supabase.from("tickets").select("*").order("updated_at", { ascending: false }),
    supabase.from("clients").select("*"),
    supabase.from("profiles").select("*"),
  ]);

  if (tickets.error) throw tickets.error;
  if (clients.error) throw clients.error;
  if (profiles.error) throw profiles.error;

  const clientById = new Map((clients.data ?? []).map((c) => [c.id, mapClient(c)]));
  const userById = new Map((profiles.data ?? []).map((p) => [p.id, mapUser(p)]));

  // Cliente não enxerga o perfil do atendente por RLS (profiles_select); a
  // RPC (SECURITY DEFINER) devolve só o nome de exibição do responsável nos
  // tickets que o próprio cliente já pode acessar (mesmo padrão do nome do
  // autor da mensagem).
  const needsNameFallback = (tickets.data ?? []).some(
    (t) => t.assignee_id && !userById.has(t.assignee_id),
  );
  const assigneeNameByTicket = new Map<string, string>();
  if (needsNameFallback) {
    const { data: names } = await supabase.rpc("ticket_assignee_names");
    for (const n of names ?? []) assigneeNameByTicket.set(n.ticket_id, n.full_name);
  }

  return (tickets.data ?? []).map((row) => {
    const ticket = mapTicket(row);
    let assignee = ticket.assigneeId ? (userById.get(ticket.assigneeId) ?? null) : null;
    if (!assignee && ticket.assigneeId) {
      const name = assigneeNameByTicket.get(ticket.id);
      if (name) assignee = nameOnlyAssignee(ticket.assigneeId, name);
    }
    return {
      ...ticket,
      requester: clientById.get(ticket.requesterId)!,
      assignee,
    };
  });
}

export async function getTicket(
  id: string,
): Promise<TicketWithRelations | null> {
  const supabase = await createClient();

  const { data: row, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!row) return null;

  const ticket = mapTicket(row);

  const [requesterRes, assigneeRes] = await Promise.all([
    supabase.from("clients").select("*").eq("id", ticket.requesterId).maybeSingle(),
    ticket.assigneeId
      ? supabase.from("profiles").select("*").eq("id", ticket.assigneeId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  let assignee = assigneeRes.data ? mapUser(assigneeRes.data) : null;
  if (!assignee && ticket.assigneeId) {
    // Cliente sem RLS para o perfil do atendente: pega só o nome via RPC.
    const { data: name } = await supabase.rpc("ticket_assignee_name", {
      p_ticket_id: id,
    });
    if (name) assignee = nameOnlyAssignee(ticket.assigneeId, name);
  }

  return {
    ...ticket,
    requester: requesterRes.data ? mapClient(requesterRes.data) : ({} as never),
    assignee,
  };
}

export async function getTicketMessages(
  ticketId: string,
): Promise<TicketMessage[]> {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at");
  if (error) throw error;
  if (!rows || rows.length === 0) return [];

  // RPC (SECURITY DEFINER) em vez de SELECT direto em `profiles`: o cliente
  // não tem RLS para ler o perfil do atendente, só o nome de exibição dos
  // autores das mensagens do próprio ticket.
  const { data: authors } = await supabase.rpc("ticket_message_authors", {
    p_ticket_id: ticketId,
  });

  const nameById = new Map<string, string>(
    (authors ?? []).map((a) => [a.id, a.full_name]),
  );

  return rows.map((r) => mapMessage(r, nameById.get(r.author_id) ?? "Usuário"));
}

export async function getTicketAttachments(
  ticketId: string,
): Promise<TicketAttachment[]> {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("ticket_attachments")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at");
  if (error) throw error;
  if (!rows || rows.length === 0) return [];

  const { data: signed } = await supabase.storage
    .from("attachments")
    .createSignedUrls(
      rows.map((r) => r.file_path),
      60 * 60,
    );
  const urlByPath = new Map(
    (signed ?? []).map((s) => [s.path ?? "", s.signedUrl]),
  );

  return rows.map((r) => ({
    id: r.id,
    ticketId: r.ticket_id,
    messageId: r.message_id,
    fieldLabel: r.field_label,
    filePath: r.file_path,
    fileName: r.file_name,
    mimeType: r.mime_type,
    sizeBytes: r.size_bytes,
    createdAt: r.created_at,
    url: urlByPath.get(r.file_path) ?? null,
    isImage: (r.mime_type ?? "").startsWith("image/"),
  }));
}
