import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ChevronDown, ChevronUp, ChevronsUpDown, Inbox } from "lucide-react";
import { StatusBadge } from "@/components/tickets/status-badge";
import { PriorityBadge } from "@/components/tickets/priority-badge";
import { TICKET_CATEGORY_LABELS } from "@/features/tickets/constants";
import { formatRelative, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TicketPriority, TicketWithRelations } from "@/types/domain";

export type TicketSortKey = "code" | "status" | "priority" | "updatedAt";

export interface TicketSort {
  key: TicketSortKey;
  dir: "asc" | "desc";
}

// Signature: a priority-colored rail on each row.
const rail: Record<TicketPriority, string> = {
  low: "bg-prio-low/50",
  medium: "bg-prio-medium",
  high: "bg-prio-high",
  urgent: "bg-prio-urgent",
};

function SortHead({
  label,
  column,
  sort,
  onSort,
  className,
}: {
  label: string;
  column?: TicketSortKey;
  sort?: TicketSort;
  onSort?: (key: TicketSortKey) => void;
  className?: string;
}) {
  const sortable = column && onSort;
  const active = sortable && sort?.key === column;
  const ariaSort: React.AriaAttributes["aria-sort"] = active
    ? sort?.dir === "asc"
      ? "ascending"
      : "descending"
    : "none";

  return (
    <TableHead className={className} aria-sort={sortable ? ariaSort : undefined}>
      {sortable ? (
        <button
          type="button"
          onClick={() => onSort(column)}
          className="-ml-1 inline-flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:text-foreground"
        >
          {label}
          {active ? (
            sort?.dir === "asc" ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )
          ) : (
            <ChevronsUpDown className="size-3.5 opacity-50" />
          )}
        </button>
      ) : (
        label
      )}
    </TableHead>
  );
}

export function TicketsTable({
  tickets,
  emptyHint,
  sort,
  onSort,
  showCategory = false,
}: {
  tickets: TicketWithRelations[];
  emptyHint?: string;
  sort?: TicketSort;
  onSort?: (key: TicketSortKey) => void;
  /** Mostra a coluna Categoria (só para staff; cliente nunca recebe true). */
  showCategory?: boolean;
}) {
  if (tickets.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Inbox />
          </EmptyMedia>
          <EmptyTitle>Nenhum ticket por aqui</EmptyTitle>
          <EmptyDescription>
            {emptyHint ?? "Quando houver tickets, eles aparecerão nesta lista."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40 [&>th]:h-10 [&>th]:text-xs [&>th]:font-medium [&>th]:uppercase [&>th]:tracking-wide">
            <TableHead className="w-1 p-0" />
            <SortHead label="Código" column="code" sort={sort} onSort={onSort} className="w-[120px]" />
            <SortHead label="Assunto" />
            <SortHead label="Responsável" className="hidden lg:table-cell" />
            <SortHead label="Status" column="status" sort={sort} onSort={onSort} />
            <SortHead label="Prioridade" column="priority" sort={sort} onSort={onSort} className="hidden sm:table-cell" />
            {showCategory ? (
              <SortHead label="Categoria" className="hidden lg:table-cell" />
            ) : null}
            <SortHead label="Atualizado" column="updatedAt" sort={sort} onSort={onSort} className="hidden xl:table-cell" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id} className="group">
              <TableCell className="p-0">
                <div
                  className={cn("ml-0.5 h-9 w-1 rounded-full", rail[ticket.priority])}
                  aria-hidden
                />
              </TableCell>
              <TableCell>
                <Link
                  href={`/chamados/${ticket.id}`}
                  className="font-mono text-xs text-muted-foreground transition-colors group-hover:text-primary"
                >
                  {ticket.code}
                </Link>
              </TableCell>
              <TableCell className="max-w-[280px]">
                <Link href={`/chamados/${ticket.id}`} className="block">
                  <span className="block truncate font-medium">
                    {ticket.title}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {ticket.requester.name}
                  </span>
                </Link>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {ticket.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="size-6">
                      <AvatarFallback className="bg-muted text-[10px]">
                        {initials(ticket.assignee.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{ticket.assignee.fullName}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Não atribuído
                  </span>
                )}
              </TableCell>
              <TableCell>
                <StatusBadge status={ticket.status} />
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <PriorityBadge priority={ticket.priority} />
              </TableCell>
              {showCategory ? (
                <TableCell className="hidden lg:table-cell">
                  {ticket.category ? (
                    <span
                      className="inline-flex rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs font-medium"
                      title={
                        TICKET_CATEGORY_LABELS[ticket.category] ??
                        ticket.category
                      }
                    >
                      {ticket.category}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              ) : null}
              <TableCell className="hidden text-sm text-muted-foreground tabular-nums xl:table-cell">
                {formatRelative(ticket.updatedAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
