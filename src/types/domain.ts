/**
 * Domain model for the SAC Oraltech help desk.
 *
 * These types mirror the planned Postgres schema (see supabase/migrations).
 * Keeping them framework-agnostic lets the UI, mock data, and the future
 * Supabase data layer share one source of truth.
 */

export type UserRole = "admin" | "agent" | "client";

export type TicketStatus =
  | "new"
  | "in_progress"
  | "waiting_client"
  | "closed";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface Sector {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  sectorId: string | null;
  isActive: boolean;
  createdAt: string;
}

/** Requester of a ticket. May or may not have a login account. */
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  /** Linked auth account (when the requester logs in as a client). */
  authUserId: string | null;
  createdAt: string;
}

export interface TicketAttachment {
  id: string;
  ticketId: string;
  messageId: string | null;
  fieldLabel: string | null;
  filePath: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
  /** Temporary signed URL for viewing/downloading. */
  url: string | null;
  isImage: boolean;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  body: string;
  /** When true, the message is an internal note (staff-only). */
  isInternal: boolean;
  createdAt: string;
}

export interface Ticket {
  id: string;
  /** Human-facing unique code, e.g. SAC-000123. */
  code: string;
  title: string;
  description: string;
  requesterId: string;
  sectorId: string;
  assigneeId: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  /** Categoria interna definida pelo atendente (R1–R19). */
  category: string | null;
  /** Topic chosen by the client (null for staff-created tickets). */
  topic: string | null;
  /** Structured fields captured by the client's topic form. */
  details: { fields: { label: string; value: string }[] };
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

/** A ticket with its related entities resolved, for list/detail views. */
export interface TicketWithRelations extends Ticket {
  requester: Client;
  sector: Sector;
  assignee: User | null;
}
