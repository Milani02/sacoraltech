import type { Metadata } from "next";
import { AlertTriangle, Clock, Inbox, MessageSquareDot } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ClientDashboard } from "@/components/dashboard/client-dashboard";
import { AgentDashboard } from "@/components/dashboard/agent-dashboard";
import { StatusChart } from "@/components/dashboard/status-chart";
import { TicketsTable } from "@/components/tickets/tickets-table";
import { listTickets } from "@/features/tickets/queries";
import { getCurrentUser } from "@/features/auth/current-user";
import { can } from "@/features/auth/roles";
import {
  ACTIVE_STATUSES,
  TICKET_STATUS,
  TICKET_STATUS_ORDER,
} from "@/features/tickets/constants";

export const metadata: Metadata = { title: "Painel geral" };

export default async function DashboardPage() {
  const [tickets, user] = await Promise.all([listTickets(), getCurrentUser()]);
  const isStaff = user ? can.respondTickets(user.role) : false;

  // Cada perfil tem uma visão própria.
  if (user && user.role === "client") {
    return <ClientDashboard user={user} tickets={tickets} />;
  }
  if (user && user.role === "agent") {
    return <AgentDashboard user={user} tickets={tickets} />;
  }
  // Admin: visão global da central (abaixo).

  const openCount = tickets.filter((t) =>
    ACTIVE_STATUSES.includes(t.status),
  ).length;
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length;
  const waitingCount = tickets.filter((t) => t.status === "waiting_client").length;
  const urgentCount = tickets.filter(
    (t) => ["high", "urgent"].includes(t.priority) && t.status !== "closed",
  ).length;

  const statusData = TICKET_STATUS_ORDER.map((s) => ({
    key: s,
    label: TICKET_STATUS[s].label,
    count: tickets.filter((t) => t.status === s).length,
    color: `var(--${TICKET_STATUS[s].token})`,
  }));

  // "Meus tickets em aberto": atribuídos a mim + os novos ainda sem
  // responsável, para que todo ticket novo apareça aqui automaticamente.
  const myTickets = tickets.filter(
    (t) =>
      ACTIVE_STATUSES.includes(t.status) &&
      (!isStaff || !user || t.assigneeId === user.id || t.assigneeId === null),
  );

  const recent = tickets.slice(0, 6);

  return (
    <>
      <PageHeader
        eyebrow="Painel geral"
        title="Visão geral"
        description="Acompanhe os tickets da central de atendimento."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tickets em aberto"
          value={openCount}
          hint="Aguardando tratamento ou em curso"
          icon={Inbox}
          accent="text-status-open"
        />
        <StatCard
          label="Em atendimento"
          value={inProgressCount}
          hint="Sendo trabalhados agora"
          icon={MessageSquareDot}
          accent="text-status-progress"
        />
        <StatCard
          label="Aguardando cliente"
          value={waitingCount}
          hint="Pendentes de resposta do solicitante"
          icon={Clock}
          accent="text-status-waiting"
        />
        <StatCard
          label="Prioridade alta/urgente"
          value={urgentCount}
          hint="Exigem atenção imediata"
          icon={AlertTriangle}
          accent="text-prio-urgent"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tickets por status</CardTitle>
          <CardDescription>Distribuição atual da central.</CardDescription>
        </CardHeader>
        <CardContent>
          <StatusChart data={statusData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meus tickets em aberto</CardTitle>
          <CardDescription>
            {isStaff
              ? "Seus tickets e os novos ainda sem responsável."
              : "Seus tickets ativos na central."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TicketsTable
            tickets={myTickets}
            showCategory
            emptyHint={
              isStaff
                ? "Nenhum ticket em aberto no momento."
                : "Você não tem tickets em aberto."
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tickets recentes</CardTitle>
          <CardDescription>Últimas movimentações na central.</CardDescription>
        </CardHeader>
        <CardContent>
          <TicketsTable tickets={recent} showCategory />
        </CardContent>
      </Card>
    </>
  );
}
