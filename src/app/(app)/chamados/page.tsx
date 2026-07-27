import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { TicketsList } from "@/components/tickets/tickets-list";
import { listTickets } from "@/features/tickets/queries";
import { getCurrentUser } from "@/features/auth/current-user";
import { can } from "@/features/auth/roles";

export const metadata: Metadata = { title: "Tickets" };

export default async function ChamadosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ q }, tickets, user] = await Promise.all([
    searchParams,
    listTickets(),
    getCurrentUser(),
  ]);
  const isStaff = !!user && can.respondTickets(user.role);
  return (
    <>
      <PageHeader
        title="Tickets"
        description="Todos os atendimentos da central."
        actions={
          <Button asChild>
            <Link href="/chamados/novo">
              <Plus data-icon="inline-start" />
              Novo ticket
            </Link>
          </Button>
        }
      />
      <TicketsList
        key={`q:${q ?? ""}`}
        tickets={tickets}
        initialQuery={q ?? ""}
        // Atendente entra com a fila "Em atendimento"; cliente vê tudo.
        initialStatus={isStaff ? "in_progress" : undefined}
        canExport={isStaff}
      />
    </>
  );
}
