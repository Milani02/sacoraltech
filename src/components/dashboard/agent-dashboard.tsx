import Link from "next/link";
import { AlertTriangle, Clock, Inbox, Layers } from "lucide-react";

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
import { StatusChart } from "@/components/dashboard/status-chart";
import { TicketsTable } from "@/components/tickets/tickets-table";
import {
  ACTIVE_STATUSES,
  TICKET_STATUS,
  TICKET_STATUS_ORDER,
} from "@/features/tickets/constants";
import type { TicketWithRelations, User } from "@/types/domain";

export function AgentDashboard({
  user,
  tickets,
}: {
  user: User;
  tickets: TicketWithRelations[];
}) {
  const firstName = user.fullName.split(" ")[0] || "atendente";

  const mine = tickets.filter((t) => t.assigneeId === user.id);
  const mineActive = mine.filter((t) => ACTIVE_STATUSES.includes(t.status));
  const waitingMine = mine.filter((t) => t.status === "waiting_client").length;
  const urgentMine = mineActive.filter((t) =>
    ["high", "urgent"].includes(t.priority),
  ).length;

  // Fila compartilhada de atendimento: todo ticket novo (sem responsável e
  // ativo) aparece aqui para qualquer atendente, sem depender do setor.
  const queue = tickets.filter(
    (t) => t.assigneeId === null && ACTIVE_STATUSES.includes(t.status),
  );

  // "Meus tickets em aberto": os atribuídos a mim + os novos ainda sem
  // responsável, para que todo ticket novo apareça aqui automaticamente.
  const openForMe = tickets.filter(
    (t) =>
      ACTIVE_STATUSES.includes(t.status) &&
      (t.assigneeId === user.id || t.assigneeId === null),
  );

  const statusData = TICKET_STATUS_ORDER.map((s) => ({
    key: s,
    label: TICKET_STATUS[s].label,
    count: mine.filter((t) => t.status === s).length,
    color: `var(--${TICKET_STATUS[s].token})`,
  }));

  return (
    <>
      <PageHeader
        title={`Olá, ${firstName}`}
        description="Sua fila de atendimento e o que precisa de ação."
        actions={
          <Button asChild>
            <Link href="/chamados/novo">Novo ticket</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Atribuídos a mim"
          value={mineActive.length}
          hint="Tickets ativos sob sua responsabilidade"
          icon={Inbox}
          accent="text-status-progress"
        />
        <StatCard
          label="Aguardando cliente"
          value={waitingMine}
          hint="Esperando resposta do solicitante"
          icon={Clock}
          accent="text-status-waiting"
        />
        <StatCard
          label="Fila de atendimento"
          value={queue.length}
          hint="Tickets novos aguardando atendimento"
          icon={Layers}
          accent="text-status-new"
        />
        <StatCard
          label="Alta/urgente (meus)"
          value={urgentMine}
          hint="Exigem atenção imediata"
          icon={AlertTriangle}
          accent="text-prio-urgent"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Meus tickets em aberto</CardTitle>
            <CardDescription>
              Seus tickets e os novos ainda sem responsável.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TicketsTable
              tickets={openForMe}
              showCategory
              emptyHint="Nenhum ticket em aberto no momento."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meus tickets por status</CardTitle>
            <CardDescription>Distribuição da sua carteira.</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusChart data={statusData} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
