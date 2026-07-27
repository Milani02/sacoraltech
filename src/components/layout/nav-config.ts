import {
  LayoutDashboard,
  Ticket,
  Building2,
  Users,
  Contact,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types/domain";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Roles allowed to see this entry. Omit = everyone. */
  roles?: UserRole[];
}

export const navItems: NavItem[] = [
  { title: "Painel geral", href: "/dashboard", icon: LayoutDashboard },
  { title: "Tickets", href: "/chamados", icon: Ticket },
  { title: "Clientes", href: "/clientes", icon: Contact, roles: ["admin", "agent"] },
  { title: "Setores", href: "/setores", icon: Building2, roles: ["admin"] },
  { title: "Usuários", href: "/usuarios", icon: Users, roles: ["admin"] },
];

export function navItemsForRole(role: UserRole): NavItem[] {
  return navItems.filter((item) => !item.roles || item.roles.includes(role));
}
