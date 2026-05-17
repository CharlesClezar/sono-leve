"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { ChevronRight, Info } from "lucide-react";
import { usePathname } from "next/navigation";
import { StatusBadge } from "./StatusBadge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PageHeaderProps {
  breadcrumb: string[];
  title: string;
  status?: string;
  description?: string;
  infoTooltip?: string;
  actions?: ReactNode;
}

const rootRoutes: Record<string, string> = {
  Dashboard: "/",
  Vendas: "/vendas",
  Venda: "/vendas",
  Encomendas: "/encomendas",
  Encomenda: "/encomendas",
  Fichas: "/fichas",
  Ficha: "/fichas",
  Produtos: "/produtos",
  Estoque: "/estoque",
  Clientes: "/clientes",
  Financeiro: "/financeiro",
  Configurações: "/configuracoes",
};

export function PageHeader({ breadcrumb, title, status, description, infoTooltip, actions }: PageHeaderProps) {
  const pathname = usePathname() ?? "/";

  const getBreadcrumbHref = (label: string, index: number) => {
    if (rootRoutes[label]) return rootRoutes[label];
    if (index === breadcrumb.length - 1) return pathname;
    return pathname;
  };

  return (
    <div className="shrink-0 sticky top-0 z-30 flex min-h-20 flex-wrap items-center justify-between gap-4 border-b bg-card/95 px-4 py-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-start gap-3 md:items-center">
        <SidebarTrigger className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground md:mt-0" />
        <div className="min-w-0">
          <nav className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                <Link
                  href={getBreadcrumbHref(b, i)}
                  aria-current={i === breadcrumb.length - 1 ? "page" : undefined}
                  className={i === breadcrumb.length - 1 ? "font-medium text-foreground hover:text-primary" : "hover:text-foreground"}
                >
                  {b}
                </Link>
              </span>
            ))}
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
              {infoTooltip && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground"
                        aria-label={`Mais informações sobre ${title}`}
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      {infoTooltip}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {status && <StatusBadge status={status} />}
          </div>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">{actions}</div>}
    </div>
  );
}
