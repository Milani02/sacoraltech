/**
 * Hand-written types mirroring the Postgres schema (supabase/migrations).
 * Keep in sync with the SQL. Columns are snake_case as stored in the DB;
 * the data layer maps them to the camelCase domain types in `domain.ts`.
 */

export type UserRole = "admin" | "agent" | "client";
export type TicketStatus =
  | "new"
  | "open"
  | "in_progress"
  | "waiting_client"
  | "resolved"
  | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

/** Structured fields captured by the client's topic-based form. */
export interface TicketDetails {
  fields?: { label: string; value: string }[];
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: UserRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          role?: UserRole;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          auth_user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          auth_user_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
        Relationships: [];
      };
      tickets: {
        Row: {
          id: string;
          code: string;
          title: string;
          description: string;
          requester_id: string;
          assignee_id: string | null;
          status: TicketStatus;
          priority: TicketPriority;
          category: string | null;
          topic: string | null;
          details: TicketDetails;
          created_at: string;
          updated_at: string;
          closed_at: string | null;
        };
        Insert: {
          id?: string;
          code?: string;
          title: string;
          description: string;
          requester_id: string;
          assignee_id?: string | null;
          status?: TicketStatus;
          priority?: TicketPriority;
          category?: string | null;
          topic?: string | null;
          details?: TicketDetails;
        };
        Update: Partial<Database["public"]["Tables"]["tickets"]["Insert"]>;
        Relationships: [];
      };
      ticket_messages: {
        Row: {
          id: string;
          ticket_id: string;
          author_id: string;
          body: string;
          is_internal: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          author_id: string;
          body: string;
          is_internal?: boolean;
        };
        Update: Partial<
          Database["public"]["Tables"]["ticket_messages"]["Insert"]
        >;
        Relationships: [];
      };
      ticket_attachments: {
        Row: {
          id: string;
          ticket_id: string;
          message_id: string | null;
          uploaded_by: string | null;
          field_label: string | null;
          file_path: string;
          file_name: string;
          mime_type: string | null;
          size_bytes: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          message_id?: string | null;
          uploaded_by: string;
          field_label?: string | null;
          file_path: string;
          file_name: string;
          mime_type?: string | null;
          size_bytes?: number | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["ticket_attachments"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      ensure_my_client: {
        Args: Record<string, never>;
        Returns: string;
      };
      ticket_message_authors: {
        Args: { p_ticket_id: string };
        Returns: { id: string; full_name: string }[];
      };
      ticket_assignee_name: {
        Args: { p_ticket_id: string };
        Returns: string | null;
      };
      ticket_assignee_names: {
        Args: Record<string, never>;
        Returns: { ticket_id: string; full_name: string }[];
      };
    };
    Enums: {
      user_role: UserRole;
      ticket_status: TicketStatus;
      ticket_priority: TicketPriority;
    };
    CompositeTypes: Record<string, never>;
  };
}
