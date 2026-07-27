"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY,
  TICKET_STATUS,
  TICKET_STATUS_ORDER,
} from "@/features/tickets/constants";
import { formatDateTime } from "@/lib/format";
import type {
  TicketPriority,
  TicketStatus,
  TicketWithRelations,
} from "@/types/domain";

const ALL = "all";

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ---- Paleta da planilha (hex, pois o Excel não entende oklch) ----
const HEADER_BG = "#1f7a4d";
const TITLE_BG = "#0f5132";
const ZEBRA_BG = "#f5f8f6";
const BORDER = "#cbd5e1";

const STATUS_STYLE: Record<TicketStatus, { bg: string; fg: string }> = {
  new: { bg: "#dbeafe", fg: "#1e40af" },
  in_progress: { bg: "#fef9c3", fg: "#854d0e" },
  waiting_client: { bg: "#ffedd5", fg: "#9a3412" },
  closed: { bg: "#e5e7eb", fg: "#374151" },
};

const PRIORITY_STYLE: Record<TicketPriority, { bg: string; fg: string }> = {
  low: { bg: "#f1f5f9", fg: "#475569" },
  medium: { bg: "#dbeafe", fg: "#1e40af" },
  high: { bg: "#ffedd5", fg: "#9a3412" },
  urgent: { bg: "#fee2e2", fg: "#991b1b" },
};

interface Column {
  header: string;
  value: (t: TicketWithRelations) => string;
  /** Estilo extra da célula (ex.: cor por status/prioridade). */
  cellStyle?: (t: TicketWithRelations) => string;
}

const COLUMNS: Column[] = [
  { header: "Código", value: (t) => t.code },
  { header: "Título", value: (t) => t.title },
  {
    header: "Status",
    value: (t) => TICKET_STATUS[t.status].label,
    cellStyle: (t) =>
      `background-color:${STATUS_STYLE[t.status].bg};color:${STATUS_STYLE[t.status].fg};font-weight:bold;`,
  },
  {
    header: "Prioridade",
    value: (t) => TICKET_PRIORITY[t.priority].label,
    cellStyle: (t) =>
      `background-color:${PRIORITY_STYLE[t.priority].bg};color:${PRIORITY_STYLE[t.priority].fg};font-weight:bold;`,
  },
  {
    header: "Categoria",
    value: (t) =>
      t.category ? (TICKET_CATEGORY_LABELS[t.category] ?? t.category) : "",
  },
  { header: "Assunto", value: (t) => t.topic ?? "" },
  { header: "Solicitante", value: (t) => t.requester?.name ?? "" },
  { header: "E-mail", value: (t) => t.requester?.email ?? "" },
  {
    header: "Responsável",
    value: (t) => t.assignee?.fullName ?? "Não atribuído",
  },
  { header: "Aberto em", value: (t) => formatDateTime(t.createdAt) },
  { header: "Atualizado em", value: (t) => formatDateTime(t.updatedAt) },
];

/** Planilha estilizada compatível com Excel (.xls) a partir de tabela HTML. */
function buildWorkbook(rows: TicketWithRelations[]): string {
  const headerCells = COLUMNS.map(
    (c) =>
      `<th style="background-color:${HEADER_BG};color:#ffffff;font-weight:bold;` +
      `border:1px solid ${HEADER_BG};padding:8px 10px;text-align:left;white-space:nowrap;">` +
      `${esc(c.header)}</th>`,
  ).join("");

  const body = rows
    .map((t, i) => {
      const zebra = i % 2 === 1 ? `background-color:${ZEBRA_BG};` : "";
      const cells = COLUMNS.map((c) => {
        const tint = c.cellStyle ? c.cellStyle(t) : zebra;
        const style =
          `border:1px solid ${BORDER};padding:6px 10px;vertical-align:top;` + tint;
        return `<td style="${style}">${esc(c.value(t))}</td>`;
      }).join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const title = `SAC Oraltech — Tickets exportados em ${formatDateTime(
    new Date().toISOString(),
  )} (${rows.length})`;

  const table =
    `<table style="border-collapse:collapse;font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#1f2937;">` +
    `<thead>` +
    `<tr><th colspan="${COLUMNS.length}" style="background-color:${TITLE_BG};` +
    `color:#ffffff;font-size:13pt;font-weight:bold;text-align:left;padding:10px 12px;` +
    `border:1px solid ${TITLE_BG};">${esc(title)}</th></tr>` +
    `<tr>${headerCells}</tr>` +
    `</thead>` +
    `<tbody>${body}</tbody>` +
    `</table>`;
  return (
    `<html xmlns:o="urn:schemas-microsoft-com:office:office" ` +
    `xmlns:x="urn:schemas-microsoft-com:office:excel">` +
    `<head><meta charset="utf-8" /></head><body>${table}</body></html>`
  );
}

export function ExportTicketsDialog({
  tickets,
}: {
  tickets: TicketWithRelations[];
}) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState<string>(ALL);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (status !== ALL && t.status !== status) return false;
      const day = t.createdAt.slice(0, 10); // yyyy-mm-dd
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    });
  }, [tickets, status, from, to]);

  function download() {
    if (filtered.length === 0) {
      toast.warning("Nenhum ticket no período/status selecionado.");
      return;
    }
    const html = buildWorkbook(filtered);
    // BOM + UTF-8 para o Excel respeitar os acentos.
    const blob = new Blob(["﻿", html], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tickets-${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(
      `${filtered.length} ${filtered.length === 1 ? "ticket exportado" : "tickets exportados"}.`,
    );
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download data-icon="inline-start" />
          Exportar XLS
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exportar tickets</DialogTitle>
          <DialogDescription>
            Gere uma planilha (.xls) dos tickets. Use os filtros para escolher o
            período e o status.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="export-from">Data inicial</FieldLabel>
              <Input
                id="export-from"
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => setFrom(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="export-to">Data final</FieldLabel>
              <Input
                id="export-to"
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => setTo(e.target.value)}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="export-status">Status</FieldLabel>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="export-status" className="w-full">
                <SelectValue />
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
          </Field>

          <p className="text-sm text-muted-foreground">
            {filtered.length}{" "}
            {filtered.length === 1
              ? "ticket será exportado"
              : "tickets serão exportados"}
            .
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={download}>
            <Download data-icon="inline-start" />
            Baixar .xls
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
