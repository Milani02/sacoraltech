import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { UsersManager } from "@/components/users/users-manager";
import { listUsers } from "@/features/users/queries";
import { getCurrentUser } from "@/features/auth/current-user";
import { can } from "@/features/auth/roles";

export const metadata: Metadata = { title: "Usuários" };

export default async function UsuariosPage() {
  // Autorização por papel: só admin acessa a gestão de usuários.
  const me = await getCurrentUser();
  if (!me || !can.manageUsers(me.role)) redirect("/dashboard");

  const users = await listUsers();

  const canManage = can.manageUsers(me.role);

  return (
    <>
      <PageHeader
        title="Usuários"
        description="Equipe com acesso à plataforma."
      />
      <UsersManager users={users} canManage={canManage} />
    </>
  );
}
