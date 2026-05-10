"use client";

import { Suspense, type ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";

function ShortcutsBridge() {
  useGlobalShortcuts();
  return null;
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <Suspense fallback={null}>
        <ShortcutsBridge />
      </Suspense>
      <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-background">
        <AppSidebar />
        <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
      </div>
    </SidebarProvider>
  );
}
