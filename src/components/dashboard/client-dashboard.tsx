import Link from "next/link";
import { CheckCircle2, Inbox, MessageCircleQuestion, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { TicketsTable } from "@/components/tickets/tickets-table";
import { ACTIVE_STATUSES } from "@/features/tickets/constants";
import type { TicketWithRelations, User } from "@/types/domain";

export function ClientDashboard({
  user,
  tickets,
}: {
  user: User;
  tickets: TicketWithRelations[];
}) {
  const firstName = user.fullName.split(" ")[0] || "cliente";
  const open = tickets.filter((t) => ACTIVE_STATUSES.includes(t.status)).length;
  const waiting = tickets.filter((t) => t.status === "waiting_client").length;
  const solved = tickets.filter((t) => t.status === "closed").length;

  return (
    <>
      <PageHeader
        title={`Olá, ${firstName}`}
        description="Visualize seus tickets"
        actions={
          <Button asChild>
            <Link href="/chamados/novo">
              <Plus data-icon="inline-start" />
              Abrir ticket
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Em aberto"
          value={open}
          hint="Em análise pela equipe"
          icon={Inbox}
          accent="text-status-open"
        />
        <StatCard
          label="Aguardando você"
          value={waiting}
          hint="Precisam da sua resposta"
          icon={MessageCircleQuestion}
          accent="text-status-waiting"
        />
        <StatCard
          label="Resolvidos"
          value={solved}
          hint="Concluídos"
          icon={CheckCircle2}
          accent="text-status-resolved"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meus tickets</CardTitle>
          <CardDescription>
            Acompanhe o andamento e converse com a equipe em cada ticket.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TicketsTable
            tickets={tickets}
            emptyHint="Você ainda não abriu tickets. Clique em “Abrir ticket”."
          />
        </CardContent>
      </Card>
    </>
  );
}
