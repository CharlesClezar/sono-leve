"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Package2,
  Settings,
  Shirt,
  ShoppingCart,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useShortcutSettings } from "@/hooks/useShortcutSettings";
import { isActiveModuleRoute, moduleNavigationItems } from "@/lib/navigation";
import { getShortcutById, getShortcutDisplayValue, getShortcutPlatform } from "@/lib/shortcuts";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { AuditLogDrawer } from "@/components/AuditLogDrawer";

const iconsByRoute = {
  "/": LayoutDashboard,
  "/vendas": ShoppingCart,
  "/encomendas": Package2,
  "/fichas": ClipboardList,
  "/produtos": Shirt,
  "/estoque": Boxes,
  "/clientes": Users,
  "/financeiro": Wallet,
  "/configuracoes": Settings,
} satisfies Record<(typeof moduleNavigationItems)[number]["url"], LucideIcon>;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = usePathname() ?? "/";
  const shortcuts = useShortcutSettings();
  const platform = getShortcutPlatform();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="h-20 shrink-0 justify-center border-b border-sidebar-border p-2">
        <div className={`flex h-full items-center gap-3 ${collapsed ? "justify-center" : "px-0"}`}>
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-sidebar-border bg-white shadow-sm">
            <Image
              src="/sono-leve-logo.svg"
              alt="Logo da Sono Leve"
              fill
              className="object-cover"
              priority
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-sidebar-accent-foreground">Sono Leve</span>
              <span className="text-[10px] uppercase tracking-[0.24em] text-sidebar-foreground/60">Pijamas</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <div className="flex h-8 shrink-0 items-center px-2 text-xs font-medium text-sidebar-foreground/70">
            {!collapsed && "Módulos"}
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {moduleNavigationItems.map((item) => {
                const Icon = iconsByRoute[item.url];
                const isActive = isActiveModuleRoute(pathname, item.url);
                const shortcut = getShortcutById(shortcuts, item.shortcutId);
                const shortcutLabel = shortcut ? getShortcutDisplayValue(shortcut, platform) : "";
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={shortcutLabel ? `${item.title} (${shortcutLabel})` : item.title}
                    >
                      <Link href={item.url}>
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {!collapsed && shortcutLabel && (
                          <span className="ml-auto rounded-md border border-sidebar-border/70 bg-sidebar-accent/40 px-1.5 py-0.5 text-[10px] font-medium text-sidebar-foreground/75">
                            {shortcutLabel}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <AuditLogDrawer collapsed={collapsed} />
      </SidebarFooter>
    </Sidebar>
  );
}
