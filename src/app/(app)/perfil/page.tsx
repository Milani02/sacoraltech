import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { getCurrentUser } from "@/features/auth/current-user";
import { USER_ROLE } from "@/features/auth/roles";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Meu perfil" };

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      <PageHeader
        title="Meu perfil"
        description="Gerencie seus dados de acesso à central."
        actions={
          <Badge variant="secondary">{USER_ROLE[user.role].label}</Badge>
        }
      />
      <p className="-mt-2 text-sm text-muted-foreground">
        Conta criada em {formatDate(user.createdAt)}.
      </p>
      <ProfileForm user={user} />
    </>
  );
}
