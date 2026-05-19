"use client";

import { useState, useEffect, Suspense, type ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";

function ShortcutsBridge() {
  useGlobalShortcuts();
  return null;
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)sidebar:state=([^;]*)/);
    if (match) setOpen(match[1] === "true");
  }, []);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <Suspense fallback={null}>
        <ShortcutsBridge />
      </Suspense>
      <div className="flex h-screen w-full max-w-full overflow-hidden bg-background">
        <AppSidebar />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </SidebarProvider>
  );
}
