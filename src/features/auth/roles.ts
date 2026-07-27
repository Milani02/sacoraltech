import type { UserRole } from "@/types/domain";

interface RoleMeta {
  label: string;
  description: string;
}

export const USER_ROLE: Record<UserRole, RoleMeta> = {
  admin: {
    label: "Administrador",
    description: "Acesso total à plataforma.",
  },
  agent: {
    label: "Atendente",
    description: "Acessa e responde tickets.",
  },
  client: {
    label: "Cliente",
    description: "Abre e acompanha os próprios tickets.",
  },
};

/**
 * Coarse capability checks used to gate routes and UI.
 * The authoritative enforcement lives in Postgres RLS (planned).
 */
export const can = {
  manageUsers: (role: UserRole) => role === "admin",
  manageClients: (role: UserRole) => role === "admin" || role === "agent",
  respondTickets: (role: UserRole) => role === "admin" || role === "agent",
  seeInternalNotes: (role: UserRole) => role === "admin" || role === "agent",
};
