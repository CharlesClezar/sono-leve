"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getFallbackModuleRoute, isModuleRoute, moduleNavigationItems, newOperationRoutes } from "@/lib/navigation";
import { getShortcutById, getShortcutPlatform, matchesShortcut } from "@/lib/shortcuts";
import { useShortcutSettings } from "@/hooks/useShortcutSettings";

function dispatchCancelableShortcut(name: string, detail: Record<string, string>) {
  const event = new CustomEvent(name, { detail, cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

export function useGlobalShortcuts() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const shortcuts = useShortcutSettings();
  const platform = getShortcutPlatform();

  useEffect(() => {
    const saveShortcut = getShortcutById(shortcuts, "save");
    const cancelShortcut = getShortcutById(shortcuts, "cancel");
    const contextualShortcut = getShortcutById(shortcuts, "new_contextual");
    const dashboardSaleShortcut = getShortcutById(shortcuts, "dashboard_new_sale");
    const dashboardOrderShortcut = getShortcutById(shortcuts, "dashboard_new_order");
    const dashboardFichaShortcut = getShortcutById(shortcuts, "dashboard_new_ficha");
    const salesFromOrderShortcut = getShortcutById(shortcuts, "sales_from_order");
    const salesFromFichaShortcut = getShortcutById(shortcuts, "sales_from_ficha");

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTypingField =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;

      if (isTypingField) return;

      const mod = e.ctrlKey || e.metaKey;

      // Ctrl/Cmd+S
      if (mod && matchesShortcut(e, saveShortcut, platform)) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("app:save"));
        return;
      }

      // Esc
      if (matchesShortcut(e, cancelShortcut, platform)) {
        e.preventDefault();
        const cameFromDashboard = searchParams.get("from") === "dashboard";
        const fallbackRoute = cameFromDashboard
          ? "/"
          : getFallbackModuleRoute(pathname) ?? "/";
        const historyIndex =
          typeof window.history.state === "object" && typeof window.history.state?.idx === "number"
            ? window.history.state.idx
            : 0;

        if (historyIndex > 0) {
          router.back();
        } else if (pathname !== fallbackRoute) {
          router.push(fallbackRoute);
        }

        window.dispatchEvent(new CustomEvent("app:cancel"));
        return;
      }

      if (pathname === "/" && matchesShortcut(e, dashboardSaleShortcut, platform)) {
        e.preventDefault();
        toast.dismiss();
        router.push("/vendas/nova?from=dashboard");
        return;
      }

      if (pathname === "/" && matchesShortcut(e, dashboardOrderShortcut, platform)) {
        e.preventDefault();
        toast.dismiss();
        router.push("/encomendas/nova?from=dashboard");
        return;
      }

      if (pathname === "/" && matchesShortcut(e, dashboardFichaShortcut, platform)) {
        e.preventDefault();
        toast.dismiss();
        router.push("/fichas/nova?from=dashboard");
        return;
      }

      if (pathname === "/vendas" && matchesShortcut(e, contextualShortcut, platform)) {
        e.preventDefault();
        toast.dismiss();
        if (!dispatchCancelableShortcut("app:vendas:shortcut", { shortcut: "contextual" })) {
          router.push("/vendas/nova");
        }
        return;
      }

      if (isModuleRoute(pathname) && newOperationRoutes[pathname] && matchesShortcut(e, contextualShortcut, platform)) {
        e.preventDefault();
        toast.dismiss();
        router.push(newOperationRoutes[pathname]);
        return;
      }

      if (pathname.startsWith("/vendas") && matchesShortcut(e, salesFromOrderShortcut, platform)) {
        e.preventDefault();
        toast.dismiss();
        if (!dispatchCancelableShortcut("app:vendas:shortcut", { shortcut: "encomendas" })) {
          router.push("/vendas?from=encomenda");
        }
        return;
      }

      if (pathname.startsWith("/vendas") && matchesShortcut(e, salesFromFichaShortcut, platform)) {
        e.preventDefault();
        toast.dismiss();
        if (!dispatchCancelableShortcut("app:vendas:shortcut", { shortcut: "fichas" })) {
          router.push("/vendas?from=ficha");
        }
        return;
      }

      // Navegação configurável dos módulos
      const navItem = moduleNavigationItems.find((item) =>
        matchesShortcut(e, getShortcutById(shortcuts, item.shortcutId), platform)
      );
      if (navItem) {
        e.preventDefault();
        toast.dismiss();
        router.push(navItem.url);
        return;
      }

      // Alt+1..9 -> fallback legado
      if (e.altKey && /^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        const route = moduleNavigationItems[idx]?.url;
        if (route) {
          e.preventDefault();
          toast.dismiss();
          router.push(route);
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, pathname, searchParams, shortcuts, platform]);
}
