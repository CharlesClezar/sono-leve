"use client";

import { useState } from "react";
import { History, ChevronDown, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuditLogsPaginados, type AuditLog } from "@/lib/api";

const ACAO_COR: Record<string, string> = {
  Criado: "bg-emerald-500/15 text-emerald-700 border-emerald-200",
  Alterado: "bg-amber-500/15 text-amber-700 border-amber-200",
  "Excluído": "bg-red-500/15 text-red-700 border-red-200",
};

function formatarData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function JsonExpandido({ label, json }: { label: string; json: string | null }) {
  const [aberto, setAberto] = useState(false);
  if (!json) return null;

  let formatado: string;
  try {
    formatado = JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    formatado = json;
  }

  return (
    <div className="mt-1">
      <button
        onClick={() => setAberto((v) => !v)}
        className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {aberto ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {label}
      </button>
      {aberto && (
        <pre className="mt-1 rounded-md bg-muted/60 p-2 text-[10px] leading-relaxed overflow-x-auto whitespace-pre-wrap break-all border border-border/50">
          {formatado}
        </pre>
      )}
    </div>
  );
}

function StackTraceExpandido({ stack }: { stack: string | null }) {
  const [aberto, setAberto] = useState(false);
  if (!stack) return null;

  return (
    <div className="mt-1">
      <button
        onClick={() => setAberto((v) => !v)}
        className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {aberto ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        Stack trace
      </button>
      {aberto && (
        <pre className="mt-1 rounded-md bg-muted/60 p-2 text-[10px] leading-relaxed overflow-x-auto whitespace-pre-wrap break-all border border-border/50 text-muted-foreground">
          {stack}
        </pre>
      )}
    </div>
  );
}

function ItemAudit({ log }: { log: AuditLog }) {
  return (
    <div className="border-b border-border/60 px-4 py-3 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold ${ACAO_COR[log.acao] ?? "bg-muted text-muted-foreground border-border"}`}>
            {log.acao}
          </span>
          <span className="text-sm font-medium">{log.entidade}</span>
          <span className="text-xs text-muted-foreground font-mono truncate max-w-[140px]" title={log.entidadeId}>
            {log.entidadeId}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
          {formatarData(log.ocorridoEm)}
        </span>
      </div>

      {log.endpoint && (
        <div className="mt-1 text-[11px] text-muted-foreground font-mono">
          {log.endpoint}
        </div>
      )}

      <JsonExpandido label="Antes" json={log.dadosAntes} />
      <JsonExpandido label="Depois" json={log.dadosDepois} />
      <StackTraceExpandido stack={log.stackTrace} />
    </div>
  );
}

export function AuditLogDrawer({ collapsed = false }: { collapsed?: boolean }) {
  const [entidade, setEntidade] = useState("all");
  const [busca, setBusca] = useState("");
  const [buscaAtiva, setBuscaAtiva] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAuditLogsPaginados({
    entidade: entidade === "all" ? undefined : entidade,
    busca: buscaAtiva || undefined,
    page,
    pageSize: 30,
  });

  function aplicarBusca() {
    setBuscaAtiva(busca);
    setPage(1);
  }

  function limparFiltros() {
    setEntidade("all");
    setBusca("");
    setBuscaAtiva("");
    setPage(1);
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          title="Histórico de alterações"
          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <History className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="truncate">Histórico</span>}
        </button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[520px] max-w-full p-0 flex flex-col">
        <SheetHeader className="px-4 py-4 border-b border-border shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Histórico de alterações
          </SheetTitle>
        </SheetHeader>

        <div className="px-4 py-3 border-b border-border shrink-0 space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por ID, ação ou endpoint..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && aplicarBusca()}
              className="h-8 text-sm"
            />
            <Button size="sm" variant="secondary" onClick={aplicarBusca} className="h-8 shrink-0">
              Buscar
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Select value={entidade} onValueChange={(v) => { setEntidade(v); setPage(1); }}>
              <SelectTrigger className="h-8 text-sm flex-1">
                <SelectValue placeholder="Entidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as entidades</SelectItem>
                {data?.entidades.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(entidade !== "all" || buscaAtiva) && (
              <Button size="sm" variant="ghost" onClick={limparFiltros} className="h-8 text-xs shrink-0">
                Limpar
              </Button>
            )}

            {data && (
              <span className="text-xs text-muted-foreground shrink-0">
                {data.total} registro{data.total !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1">
          {isLoading && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Carregando...
            </div>
          )}

          {!isLoading && data?.data.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhum registro encontrado.
            </div>
          )}

          {data?.data.map((log) => (
            <ItemAudit key={log.id} log={log} />
          ))}
        </ScrollArea>

        {data && data.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border shrink-0 flex items-center justify-between">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-7 text-xs"
            >
              Anterior
            </Button>
            <span className="text-xs text-muted-foreground">
              {page} / {data.totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-7 text-xs"
            >
              Próxima
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
