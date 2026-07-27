import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { NovoChamadoForm } from "@/components/tickets/novo-chamado-form";
import { TicketTopicForm } from "@/components/tickets/ticket-topic-form";
import { listClients } from "@/features/clients/queries";
import { getCurrentUser } from "@/features/auth/current-user";

export const metadata: Metadata = { title: "Novo ticket" };

export default async function NovoChamadoPage() {
  const user = await getCurrentUser();
  const isClient = user?.role === "client";
  const clients = isClient ? [] : await listClients();

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/chamados">
            <ArrowLeft data-icon="inline-start" />
            Tickets
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Novo ticket"
        description={
          isClient
            ? "Conte o que você precisa e nossa equipe responde por aqui."
            : "Abra um atendimento na central."
        }
      />

      {isClient ? (
        <TicketTopicForm />
      ) : (
        <NovoChamadoForm clients={clients} />
      )}
    </>
  );
}
