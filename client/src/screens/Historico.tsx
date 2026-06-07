"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  X,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { PaginationFooter } from "@/components/PaginationFooter";
import { DataGrid, type GridColumnDef } from "@/components/DataGrid";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, useAuditLogsPaginados, useEntidadesSistema, type AuditLog, type AuditLogsFiltros } from "@/lib/api";
import { useServerPagination } from "@/hooks/usePagination";
import { useDataGrid } from "@/hooks/useDataGrid";

// ── Constantes ────────────────────────────────────────────────────────────────

const ACOES_OPCOES = [
  { label: "Criado", value: "Criado" },
  { label: "Alterado", value: "Alterado" },
  { label: "Excluído", value: "Excluído" },
];

const ACAO_COR: Record<string, string> = {
  Criado: "bg-emerald-500/15 text-emerald-700 border-emerald-200 dark:border-emerald-800 dark:text-emerald-400",
  Alterado: "bg-amber-500/15 text-amber-700 border-amber-200 dark:border-amber-800 dark:text-amber-400",
  Excluído: "bg-red-500/15 text-red-700 border-red-200 dark:border-red-800 dark:text-red-400",
};

// ── Combobox de entidade ──────────────────────────────────────────────────────

function EntidadeCombobox({
  value,
  onChange,
  entidades,
}: {
  value: string;
  onChange: (v: string) => void;
  entidades: string[];
}) {
  const [aberto, setAberto] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sugestoes = value
    ? entidades.filter((e) => e.toLowerCase().includes(value.toLowerCase()))
    : entidades;

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => { onChange(e.target.value); setAberto(true); }}
        onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 120)}
        placeholder="Entidade..."
        autoComplete="off"
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      {value && (
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); onChange(""); inputRef.current?.focus(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          tabIndex={-1}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      {aberto && sugestoes.length > 0 && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border bg-popover shadow-md overflow-hidden">
          <div className="max-h-52 overflow-y-auto py-1">
            {sugestoes.map((e) => (
              <button
                key={e}
                type="button"
                onMouseDown={() => { onChange(e); setAberto(false); }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function AcaoBadge({ acao }: { acao: string }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold ${
        ACAO_COR[acao] ?? "bg-muted text-muted-foreground border-border"
      }`}
    >
      {acao}
    </span>
  );
}

// ── Comparação lado-a-lado ANTES / DEPOIS ─────────────────────────────────────

function ColunaCompare({
  label,
  chaves,
  objPrincipal,
  objComparacao,
  variante,
}: {
  label: string;
  chaves: string[];
  objPrincipal: Record<string, unknown>;
  objComparacao: Record<string, unknown> | null;
  variante: "antes" | "depois";
}) {
  const isAntes = variante === "antes";
  const borda = isAntes
    ? "border-amber-200 dark:border-amber-900"
    : "border-emerald-200 dark:border-emerald-900";
  const cabecalho = isAntes
    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
    : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400";
  const celulaDest = isAntes
    ? "bg-amber-50/70 dark:bg-amber-950/20"
    : "bg-emerald-50/70 dark:bg-emerald-950/20";
  const textoDest = isAntes
    ? "text-amber-800 dark:text-amber-300"
    : "text-emerald-800 dark:text-emerald-300";

  return (
    <div className={`rounded-md border ${borda} overflow-hidden`}>
      <div className={`${cabecalho} px-3 py-2 text-xs font-semibold uppercase tracking-wide border-b ${borda}`}>
        {label}
      </div>
      <div className="divide-y divide-border/50">
        {chaves.map((chave) => {
          const valPrincipal = objPrincipal[chave];
          const valComp = objComparacao?.[chave];
          const alterado = JSON.stringify(valPrincipal) !== JSON.stringify(valComp);
          return (
            <div key={chave} className={`px-3 py-1.5 ${alterado ? celulaDest : ""}`}>
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{chave}</div>
              <div className="text-xs mt-0.5 break-all">
                {valPrincipal === undefined ? (
                  <span className="text-muted-foreground/50 italic">—</span>
                ) : (
                  <span className={alterado ? textoDest : ""}>
                    {String(valPrincipal === null ? "null" : typeof valPrincipal === "object" ? JSON.stringify(valPrincipal) : valPrincipal)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ComparacaoJson({ antes, depois }: { antes: string | null; depois: string | null }) {
  const parse = (v: string | null): Record<string, unknown> | null => {
    if (!v) return null;
    try { return JSON.parse(v); } catch { return null; }
  };

  const objAntes = parse(antes);
  const objDepois = parse(depois);

  if (!objAntes && !objDepois) return null;

  const todasChaves = Array.from(
    new Set([
      ...Object.keys(objAntes ?? {}),
      ...Object.keys(objDepois ?? {}),
    ])
  );

  return (
    <div className={`grid gap-3 ${objAntes && objDepois ? "grid-cols-2" : "grid-cols-1"}`}>
      {objAntes && (
        <ColunaCompare
          label="Antes"
          chaves={todasChaves}
          objPrincipal={objAntes}
          objComparacao={objDepois}
          variante="antes"
        />
      )}
      {objDepois && (
        <ColunaCompare
          label="Depois"
          chaves={todasChaves}
          objPrincipal={objDepois}
          objComparacao={objAntes}
          variante="depois"
        />
      )}
    </div>
  );
}

// ── Dialog de Detalhe ─────────────────────────────────────────────────────────

function DialogDetalhe({
  log,
  indiceAtual,
  totalRegistros,
  podePrevious,
  podeNext,
  onPrevious,
  onNext,
  onClose,
}: {
  log: AuditLog;
  indiceAtual: number;
  totalRegistros: number;
  podePrevious: boolean;
  podeNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  return (
    <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
      <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
        <div className="flex items-start justify-between gap-4 pr-8">
          <div className="min-w-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <AcaoBadge acao={log.acao} />
              <span className="font-semibold">{log.entidade}</span>
            </DialogTitle>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-medium text-foreground/70 shrink-0">ID:</span>
                <span className="font-mono text-xs break-all">{log.entidadeId}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-medium text-foreground/70 shrink-0">Data:</span>
                <span className="text-xs">{formatarData(log.ocorridoEm)}</span>
              </div>
              {log.endpoint && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-medium text-foreground/70 shrink-0">Endpoint:</span>
                  <span className="font-mono text-xs">{log.endpoint}</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-xs text-muted-foreground shrink-0 text-right pt-1">
            {indiceAtual + 1} / {totalRegistros}
          </div>
        </div>

      </DialogHeader>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <ComparacaoJson antes={log.dadosAntes} depois={log.dadosDepois} />

        {!log.dadosAntes && !log.dadosDepois && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Sem dados de antes/depois para este registro.
          </p>
        )}
      </div>

      <div className="px-6 py-4 border-t shrink-0 flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={!podePrevious}
          onClick={onPrevious}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button variant="outline" size="sm" onClick={onClose}>
          Fechar
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!podeNext}
          onClick={onNext}
          className="gap-1.5"
        >
          Próximo
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </DialogContent>
  );
}

// ── Tela principal ────────────────────────────────────────────────────────────

export default function Historico() {
  const [entidade, setEntidade] = useState("");
  const [entidadeId, setEntidadeId] = useState("");
  const [acao, setAcao] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [buscaInput, setBuscaInput] = useState("");
  const [buscaAtiva, setBuscaAtiva] = useState("");
  const [buscarKey, setBuscarKey] = useState(0);
  const [page, setPage] = useState(1);

  const { data: entidadesSistema = [] } = useEntidadesSistema();

  const [timeline, setTimeline] = useState<AuditLog[] | null>(null);
  const [timelineIndice, setTimelineIndice] = useState(0);

  const filtros: AuditLogsFiltros = useMemo(() => ({
    entidade: entidade || undefined,
    entidadeId: entidadeId || undefined,
    acao: acao || undefined,
    dataInicio: dataInicio || undefined,
    dataFim: dataFim || undefined,
    busca: buscaAtiva || undefined,
    page,
    pageSize: 30,
  }), [entidade, entidadeId, acao, dataInicio, dataFim, buscaAtiva, page]);

  const { data: response, isLoading } = useAuditLogsPaginados(filtros, buscarKey);
  const paginacao = useServerPagination(response, setPage);

  const colunas = useMemo<GridColumnDef<AuditLog>[]>(
    () => [
      { id: "id", label: "Ordem", accessor: (l) => l.id, render: (l) => <span className="tabular-nums text-xs text-muted-foreground">{l.id}</span> },
      { id: "entidade", label: "Entidade", accessor: (l) => l.entidade, render: (l) => <span className="font-medium">{l.entidade}</span> },
      {
        id: "entidadeId", label: "ID", accessor: (l) => l.entidadeId,
        render: (l) => (
          <span className="block max-w-[200px] truncate font-mono text-xs text-muted-foreground" title={l.entidadeId}>
            {l.entidadeId}
          </span>
        ),
      },
      {
        id: "endpoint", label: "Endpoint", accessor: (l) => l.endpoint ?? "",
        render: (l) => (
          <span className="block max-w-[220px] truncate font-mono text-xs text-muted-foreground" title={l.endpoint ?? undefined}>
            {l.endpoint ?? <span className="italic opacity-40">—</span>}
          </span>
        ),
      },
      { id: "acao", label: "Ação", accessor: (l) => l.acao, render: (l) => <AcaoBadge acao={l.acao} /> },
      {
        id: "ocorridoEm", label: "Data / Hora", accessor: (l) => l.ocorridoEm,
        render: (l) => <span className="tabular-nums text-xs text-muted-foreground">{formatarData(l.ocorridoEm)}</span>,
      },
    ],
    [],
  );

  const grid = useDataGrid(paginacao.items, colunas);

  const temFiltros =
    entidade !== "" ||
    entidadeId !== "" ||
    acao !== "" ||
    dataInicio !== "" ||
    dataFim !== "" ||
    buscaAtiva !== "";

  const resetFiltros = useCallback(() => {
    setEntidade("");
    setEntidadeId("");
    setAcao("");
    setDataInicio("");
    setDataFim("");
    setBuscaInput("");
    setBuscaAtiva("");
    setPage(1);
    setBuscarKey((k) => k + 1);
  }, []);

  function aplicarBusca() {
    setBuscaAtiva(buscaInput);
    setPage(1);
    setBuscarKey((k) => k + 1);
  }

  async function abrirDetalhe(log: AuditLog) {
    // Abre imediatamente com o log clicado; busca o histórico completo em background
    setTimeline([log]);
    setTimelineIndice(0);

    const res = await api.listarTimelineEntidade(log.entidade, log.entidadeId);
    const ordenado = [...res.data].sort(
      (a, b) => new Date(a.ocorridoEm).getTime() - new Date(b.ocorridoEm).getTime(),
    );
    const idx = ordenado.findIndex((r) => r.id === log.id);
    setTimeline(ordenado);
    setTimelineIndice(idx >= 0 ? idx : 0);
  }

  function fecharDetalhe() {
    setTimeline(null);
  }

  const logAtual = timeline?.[timelineIndice] ?? null;

  return (
    <AppShell>
      <PageHeader
        breadcrumb={["Histórico"]}
        title="Histórico de alterações"
        infoTooltip="Registro de todas as criações, edições e exclusões realizadas no sistema."
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="shrink-0 border-b px-6 py-4">
          <Card className="p-4 space-y-3">
            {/* Linha 1: busca por texto + botão buscar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por endpoint ou texto..."
                  className="pl-9"
                  value={buscaInput}
                  onChange={(e) => setBuscaInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && aplicarBusca()}
                />
              </div>
              <Button onClick={aplicarBusca} className="shrink-0">
                <Search className="mr-1.5 h-4 w-4" />
                Buscar
              </Button>
              {temFiltros && (
                <Button variant="ghost" size="icon" onClick={resetFiltros} title="Limpar filtros" className="shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Linha 2: entidade + ação badges + ID + datas */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-[180px] shrink-0">
                <EntidadeCombobox
                  value={entidade}
                  onChange={(v) => { setEntidade(v); setPage(1); }}
                  entidades={entidadesSistema}
                />
              </div>

              <Input
                className="w-[200px] shrink-0"
                placeholder="Código / ID"
                value={entidadeId}
                onChange={(e) => { setEntidadeId(e.target.value); setPage(1); }}
              />

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap">De</span>
                <Input
                  type="date"
                  className="w-[148px]"
                  value={dataInicio}
                  onChange={(e) => { setDataInicio(e.target.value); setPage(1); }}
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Até</span>
                <Input
                  type="date"
                  className="w-[148px]"
                  value={dataFim}
                  onChange={(e) => { setDataFim(e.target.value); setPage(1); }}
                />
              </div>

              {/* Toggle de ação */}
              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                {ACOES_OPCOES.map((op) => (
                  <button
                    key={op.value}
                    type="button"
                    onClick={() => { setAcao(acao === op.value ? "" : op.value); setPage(1); }}
                    className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                      acao === op.value
                        ? ACAO_COR[op.value]
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>

              {response && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {response.total.toLocaleString("pt-BR")} registro{response.total !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </Card>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <DataGrid
            grid={grid}
            columns={colunas}
            isLoading={isLoading}
            emptyMessage="Nenhum registro encontrado."
            onView={(log) => abrirDetalhe(log)}
            footer={<PaginationFooter pagination={paginacao} />}
          />
        </div>
      </div>

      {/* Dialog de detalhe */}
      <Dialog open={!!logAtual} onOpenChange={(v) => { if (!v) fecharDetalhe(); }}>
        {logAtual && timeline && (
          <DialogDetalhe
            log={logAtual}
            indiceAtual={timelineIndice}
            totalRegistros={timeline.length}
            podePrevious={timelineIndice > 0}
            podeNext={timelineIndice < timeline.length - 1}
            onPrevious={() => setTimelineIndice((i) => Math.max(0, i - 1))}
            onNext={() => setTimelineIndice((i) => Math.min(timeline.length - 1, i + 1))}
            onClose={fecharDetalhe}
          />
        )}
      </Dialog>
    </AppShell>
  );
}
