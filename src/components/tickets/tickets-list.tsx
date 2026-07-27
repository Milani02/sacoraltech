"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExportTicketsDialog } from "@/components/tickets/export-tickets-dialog";
import {
  TicketsTable,
  type TicketSort,
  type TicketSortKey,
} from "@/components/tickets/tickets-table";
import {
  TICKET_CATEGORIES,
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY,
  TICKET_PRIORITY_ORDER,
  TICKET_STATUS,
  TICKET_STATUS_ORDER,
} from "@/features/tickets/constants";
import type { TicketWithRelations } from "@/types/domain";

const ALL = "all";
const PAGE_SIZE = 10;

// Direção padrão ao clicar numa coluna pela primeira vez.
const DEFAULT_DIR: Record<TicketSortKey, "asc" | "desc"> = {
  code: "asc",
  status: "asc",
  priority: "desc",
  updatedAt: "desc",
};

function compare(
  a: TicketWithRelations,
  b: TicketWithRelations,
  key: TicketSortKey,
): number {
  switch (key) {
    case "code":
      return a.code.localeCompare(b.code);
    case "status":
      return (
        TICKET_STATUS_ORDER.indexOf(a.status) -
        TICKET_STATUS_ORDER.indexOf(b.status)
      );
    case "priority":
      return TICKET_PRIORITY[a.priority].weight - TICKET_PRIORITY[b.priority].weight;
    case "updatedAt":
      return +new Date(a.updatedAt) - +new Date(b.updatedAt);
  }
}

export function TicketsList({
  tickets,
  initialQuery = "",
  initialStatus = ALL,
  canExport = false,
}: {
  tickets: TicketWithRelations[];
  initialQuery?: string;
  /** Status pré-selecionado ao abrir a lista (ex.: staff entra em "Em atendimento"). */
  initialStatus?: string;
  canExport?: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<string>(initialStatus);
  const [priority, setPriority] = useState<string>(ALL);
  const [category, setCategory] = useState<string>(ALL);
  // Período de abertura (yyyy-mm-dd), como na exportação XLS.
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sort, setSort] = useState<TicketSort>({ key: "updatedAt", dir: "desc" });
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tickets.filter((t) => {
      if (status !== ALL && t.status !== status) return false;
      if (priority !== ALL && t.priority !== priority) return false;
      if (category !== ALL && t.category !== category) return false;
      const day = t.createdAt.slice(0, 10); // yyyy-mm-dd
      if (fromDate && day < fromDate) return false;
      if (toDate && day > toDate) return false;
      if (q) {
        const haystack = `${t.code} ${t.title} ${t.requester.name}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [tickets, query, status, priority, category, fromDate, toDate]);

  const sorted = useMemo(() => {
    const mult = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => compare(a, b, sort.key) * mult);
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sorted.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const hasFilters =
    query !== "" ||
    status !== ALL ||
    priority !== ALL ||
    category !== ALL ||
    fromDate !== "" ||
    toDate !== "";

  // Qualquer mudança de filtro/busca/ordenação volta para a 1ª página.
  function setQueryReset(v: string) {
    setQuery(v);
    setPage(1);
  }
  function setStatusReset(v: string) {
    setStatus(v);
    setPage(1);
  }
  function setPriorityReset(v: string) {
    setPriority(v);
    setPage(1);
  }
  function setCategoryReset(v: string) {
    setCategory(v);
    setPage(1);
  }
  function setFromDateReset(v: string) {
    setFromDate(v);
    setPage(1);
  }
  function setToDateReset(v: string) {
    setToDate(v);
    setPage(1);
  }

  function clearFilters() {
    setQuery("");
    setStatus(ALL);
    setPriority(ALL);
    setCategory(ALL);
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  function handleSort(key: TicketSortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: DEFAULT_DIR[key] },
    );
    setPage(1);
  }

  const from = sorted.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, sorted.length);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <InputGroup className="lg:max-w-xs">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Buscar por código, título ou cliente..."
            value={query}
            onChange={(e) => setQueryReset(e.target.value)}
          />
        </InputGroup>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={status} onValueChange={setStatusReset}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={ALL}>Todos os status</SelectItem>
                {TICKET_STATUS_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {TICKET_STATUS[s].label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select value={priority} onValueChange={setPriorityReset}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={ALL}>Toda prioridade</SelectItem>
                {TICKET_PRIORITY_ORDER.map((p) => (
                  <SelectItem key={p} value={p}>
                    {TICKET_PRIORITY[p].label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {canExport ? (
            <Select value={category} onValueChange={setCategoryReset}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={ALL}>Toda categoria</SelectItem>
                  {TICKET_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {TICKET_CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          ) : null}

          {canExport ? (
            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(e) => setFromDateReset(e.target.value)}
                className="w-[150px]"
                aria-label="Aberto a partir de"
                title="Aberto a partir de"
              />
              <span className="text-xs text-muted-foreground">até</span>
              <Input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => setToDateReset(e.target.value)}
                className="w-[150px]"
                aria-label="Aberto até"
                title="Aberto até"
              />
            </div>
          ) : null}

          {hasFilters ? (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X data-icon="inline-start" />
              Limpar
            </Button>
          ) : null}

          {canExport ? (
            <div className="lg:ml-auto">
              <ExportTicketsDialog tickets={tickets} />
            </div>
          ) : null}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {sorted.length} {sorted.length === 1 ? "ticket" : "tickets"}
        {hasFilters ? " (filtrados)" : ""}
      </p>

      <TicketsTable
        tickets={pageItems}
        sort={sort}
        onSort={handleSort}
        showCategory={canExport}
        emptyHint={
          hasFilters
            ? "Nenhum ticket corresponde aos filtros. Ajuste a busca."
            : undefined
        }
      />

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground tabular-nums">
            {from}–{to} de {sorted.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft data-icon="inline-start" />
              Anterior
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Próxima
              <ChevronRight data-icon="inline-end" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
