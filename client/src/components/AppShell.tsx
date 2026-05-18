"use client";

import { useState, Suspense, type ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";

function ShortcutsBridge() {
  useGlobalShortcuts();
  return null;
}

export function AppShell({ children }: { children: ReactNode }) {
  const [defaultOpen] = useState(() => {
    if (typeof document === "undefined") return true;
    const cookie = document.cookie.split(";").find((c) => c.trim().startsWith("sidebar:state="));
    return cookie ? cookie.trim().split("=")[1] === "true" : true;
  });

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
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
