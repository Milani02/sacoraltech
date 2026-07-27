import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { ClientsManager } from "@/components/clients/clients-manager";
import { listClients } from "@/features/clients/queries";
import { listTickets } from "@/features/tickets/queries";
import { getCurrentUser } from "@/features/auth/current-user";
import { can } from "@/features/auth/roles";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientesPage() {
  // Autorização por papel: só staff (admin/atendente) acessa os clientes.
  const user = await getCurrentUser();
  if (!user || !can.manageClients(user.role)) redirect("/dashboard");

  const [clients, tickets] = await Promise.all([
    listClients(),
    listTickets(),
  ]);

  const counts: Record<string, number> = {};
  for (const t of tickets) {
    counts[t.requesterId] = (counts[t.requesterId] ?? 0) + 1;
  }

  const canManage = can.manageClients(user.role);
  const canDelete = user.role === "admin";

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Solicitantes que abrem tickets na central."
      />
      <ClientsManager
        clients={clients}
        counts={counts}
        canManage={canManage}
        canDelete={canDelete}
      />
    </>
  );
}
