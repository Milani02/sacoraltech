import type { TicketPriority, TicketStatus } from "@/types/domain";

interface StatusMeta {
  label: string;
  /** Tailwind utility prefix bound to a CSS token (see globals.css). */
  token: string;
}

export const TICKET_STATUS: Record<TicketStatus, StatusMeta> = {
  new: { label: "Novo", token: "status-new" },
  in_progress: { label: "Em atendimento", token: "status-progress" },
  waiting_client: { label: "Aguardando cliente", token: "status-waiting" },
  closed: { label: "Fechado", token: "status-closed" },
};

export const TICKET_STATUS_ORDER: TicketStatus[] = [
  "new",
  "in_progress",
  "waiting_client",
  "closed",
];

interface PriorityMeta {
  label: string;
  token: string;
  /** Relative weight for sorting (higher = more urgent). */
  weight: number;
}

export const TICKET_PRIORITY: Record<TicketPriority, PriorityMeta> = {
  low: { label: "Baixa", token: "prio-low", weight: 1 },
  medium: { label: "Média", token: "prio-medium", weight: 2 },
  high: { label: "Alta", token: "prio-high", weight: 3 },
  urgent: { label: "Urgente", token: "prio-urgent", weight: 4 },
};

export const TICKET_PRIORITY_ORDER: TicketPriority[] = [
  "urgent",
  "high",
  "medium",
  "low",
];

/**
 * Categorias internas do atendente (R1–R19).
 * O valor salvo no banco é o código (ex.: "R5"); a UI exibe o rótulo completo.
 */
export const TICKET_CATEGORY_LABELS: Record<string, string> = {
  R1: "R1 - EXPEDIÇÃO",
  R2: "R2 - PRODUTO COM DESVIO",
  R3: "R3 - SATISFAÇÃO / AGRADECIMENTO / ELOGIO",
  R4: "R4 - SOLICITAÇÃO DE INFORMAÇÕES ou DÚVIDAS TÉCNICAS",
  R5: "R5 - SUGESTÕES DE PRODUTOS ou ALTERAÇÕES",
  R6: "R6 - EMBALAGENS / VAZAMENTOS / FALTA DE COMPONENTES",
  R7: "R7 - TRANSPORTADORAS",
  R8: "R8 - OUTROS",
  R9: "R9 - SACs CRÍTICOS",
  R10: "R10 - INTERESSE COMERCIAL NACIONAL",
  R11: "R11 - INTERESSE COMERCIAL INTERNACIONAL",
  R12: "R12 - SOLICITAÇÕES FINANCEIRAS",
  R13: "R13 - SOLICITAÇÕES DE DOCUMENTOS",
  R14: "R14 - INTERESSE EM VAGA NA EMPRESA",
  R15: "R15 - SOLICITAÇÃO DE APOIO EM EVENTO, VERBAS, ETC",
  R16: "R16 - ERRO DE UTILIZAÇÃO DO PRODUTO",
  R17: "R17 - RECLAMAÇÃO NÃO PROCEDENTE",
  R18: "R18 - ERROS ADMINISTRATIVOS/COMERCIAL",
  R19: "R19 - ERROS DE CLIENTES",
};

export const TICKET_CATEGORIES: string[] = Object.keys(TICKET_CATEGORY_LABELS);

/** Statuses considered "open work" for dashboard counters. */
export const ACTIVE_STATUSES: TicketStatus[] = [
  "new",
  "in_progress",
  "waiting_client",
];
