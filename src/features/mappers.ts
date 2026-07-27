import type { Database, TicketStatus as DbTicketStatus } from "@/types/database";
import type {
  Client,
  Ticket,
  TicketMessage,
  TicketStatus,
  User,
} from "@/types/domain";

type Tables = Database["public"]["Tables"];

/**
 * O enum do Postgres ainda contém 'open'/'resolved' (remover valor de enum
 * exige recriar o tipo). A migração 0011 converte as linhas existentes, mas
 * normalizamos aqui para o domínio caso alguma sobre.
 */
function normalizeStatus(status: DbTicketStatus): TicketStatus {
  if (status === "open") return "in_progress";
  if (status === "resolved") return "closed";
  return status;
}

export function mapUser(row: Tables["profiles"]["Row"]): User {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export function mapClient(row: Tables["clients"]["Row"]): Client {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    authUserId: row.auth_user_id,
    createdAt: row.created_at,
  };
}

export function mapTicket(row: Tables["tickets"]["Row"]): Ticket {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    requesterId: row.requester_id,
    assigneeId: row.assignee_id,
    status: normalizeStatus(row.status),
    priority: row.priority,
    category: row.category,
    topic: row.topic,
    details: { fields: row.details?.fields ?? [] },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    closedAt: row.closed_at,
  };
}

export function mapMessage(
  row: Tables["ticket_messages"]["Row"],
  authorName: string,
): TicketMessage {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    authorId: row.author_id,
    authorName,
    body: row.body,
    isInternal: row.is_internal,
    createdAt: row.created_at,
  };
}
