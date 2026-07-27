"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TICKET_CATEGORIES,
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY,
  TICKET_PRIORITY_ORDER,
  TICKET_STATUS,
  TICKET_STATUS_ORDER,
} from "@/features/tickets/constants";
import {
  assignTicket,
  updateTicketCategory,
  updateTicketPriority,
  updateTicketStatus,
  type ActionResult,
} from "@/features/tickets/actions";
import type { TicketPriority, TicketStatus, User } from "@/types/domain";

const UNASSIGNED = "unassigned";

function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<ActionResult>) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success("Ticket atualizado");
        router.refresh();
      } else {
        toast.error(res.error ?? "Não foi possível atualizar.");
      }
    });
  return { pending, run };
}

export function StatusSelect({
  ticketId,
  value,
}: {
  ticketId: string;
  value: TicketStatus;
}) {
  const { pending, run } = useAction();
  return (
    <Select
      value={value}
      disabled={pending}
      onValueChange={(v) => run(() => updateTicketStatus(ticketId, v as TicketStatus))}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {TICKET_STATUS_ORDER.map((s) => (
            <SelectItem key={s} value={s}>
              {TICKET_STATUS[s].label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function PrioritySelect({
  ticketId,
  value,
}: {
  ticketId: string;
  value: TicketPriority;
}) {
  const { pending, run } = useAction();
  return (
    <Select
      value={value}
      disabled={pending}
      onValueChange={(v) =>
        run(() => updateTicketPriority(ticketId, v as TicketPriority))
      }
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {TICKET_PRIORITY_ORDER.map((p) => (
            <SelectItem key={p} value={p}>
              {TICKET_PRIORITY[p].label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function AssigneeSelect({
  ticketId,
  value,
  agents,
  currentUserId,
}: {
  ticketId: string;
  value: string | null;
  agents: User[];
  /** Id do atendente logado, para o atalho "Atribuir a mim". */
  currentUserId?: string;
}) {
  const { pending, run } = useAction();
  const assignedToMe = !!currentUserId && value === currentUserId;
  return (
    <div className="grid gap-2">
      <Select
        value={value ?? UNASSIGNED}
        disabled={pending}
        onValueChange={(v) =>
          run(() => assignTicket(ticketId, v === UNASSIGNED ? null : v))
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={UNASSIGNED}>Não atribuído</SelectItem>
            {agents.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.fullName}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {currentUserId && !assignedToMe ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => run(() => assignTicket(ticketId, currentUserId))}
        >
          <UserCheck data-icon="inline-start" />
          Atribuir a mim
        </Button>
      ) : null}
    </div>
  );
}

const NO_CATEGORY = "none";

export function CategorySelect({
  ticketId,
  value,
}: {
  ticketId: string;
  value: string | null;
}) {
  const { pending, run } = useAction();
  return (
    <Select
      value={value ?? NO_CATEGORY}
      disabled={pending}
      onValueChange={(v) =>
        run(() => updateTicketCategory(ticketId, v === NO_CATEGORY ? null : v))
      }
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecione a categoria" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value={NO_CATEGORY}>Sem categoria</SelectItem>
          {TICKET_CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              {TICKET_CATEGORY_LABELS[c]}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
