import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { SectorsManager } from "@/components/sectors/sectors-manager";
import { listSectors } from "@/features/sectors/queries";
import { listTickets } from "@/features/tickets/queries";
import { getCurrentUser } from "@/features/auth/current-user";
import { can } from "@/features/auth/roles";

export const metadata: Metadata = { title: "Setores" };

export default async function SetoresPage() {
  // Autorização por papel: só admin gerencia setores.
  const user = await getCurrentUser();
  if (!user || !can.manageSectors(user.role)) redirect("/dashboard");

  const [sectors, tickets] = await Promise.all([listSectors(), listTickets()]);

  const counts: Record<string, number> = {};
  for (const t of tickets) {
    counts[t.sectorId] = (counts[t.sectorId] ?? 0) + 1;
  }

  const canManage = can.manageSectors(user.role);

  return (
    <>
      <PageHeader
        title="Setores"
        description="Áreas responsáveis pelo atendimento dos tickets."
      />
      <SectorsManager
        sectors={sectors}
        counts={counts}
        canManage={canManage}
      />
    </>
  );
}
