"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BrandMark } from "@/components/layout/brand-mark";
import { navItemsForRole } from "@/components/layout/nav-config";
import { USER_ROLE } from "@/features/auth/roles";
import { initials } from "@/lib/format";
import type { User } from "@/types/domain";

export function AppSidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const items = navItemsForRole(user.role);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center px-2 py-2">
          {/* Recolhida: mark compacto */}
          <div className="hidden aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:flex">
            <BrandMark />
          </div>
          {/* Expandida: nome por extenso (sem arquivo de logo da Oraltech ainda) */}
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
            <BrandMark className="size-6 text-sidebar-foreground" />
            <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
              SAC Oraltech
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="transition-colors data-[active=true]:font-medium data-[active=true]:[&>svg]:text-sidebar-primary"
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 group-data-[collapsible=icon]:px-0 transition-colors hover:bg-sidebar-accent/60">
          <div className="relative">
            <Avatar className="size-8">
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
                {initials(user.fullName)}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-sidebar-primary ring-2 ring-sidebar" />
          </div>
          <div className="grid flex-1 leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium">{user.fullName}</span>
            <span className="truncate text-xs text-sidebar-foreground/70">
              {USER_ROLE[user.role].label}
            </span>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
