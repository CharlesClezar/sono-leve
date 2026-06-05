"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Eye,
  Search,
  X,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { PaginationFooter } from "@/components/PaginationFooter";
import { DataGridColumnHeader } from "@/components/DataGridColumnHeader";
import { TableSkeleton } from "@/components/TableSkeleton";
import { AppSelect } from "@/components/AppSelect";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuditLogsPaginados, type AuditLog, type AuditLogsFiltros } from "@/lib/api";
import { useServerPagination } from "@/hooks/usePagination";
import { useDataGrid, type DataGridColumn } from "@/hooks/useDataGrid";

// ── Constantes ────────────────────────────────────────────────────────────────

const ACOES = [
  { value: "all", label: "Todas as ações" },
  { value: "Criado", label: "Criado" },
  { value: "Alterado", label: "Alterado" },
  { value: "Excluído", label: "Excluído" },
];

const ACAO_COR: Record<string, string> = {
  Criado: "bg-emerald-500/15 text-emerald-700 border-emerald-200 dark:border-emerald-800 dark:text-emerald-400",
  Alterado: "bg-amber-500/15 text-amber-700 border-amber-200 dark:border-amber-800 dark:text-amber-400",
  Excluído: "bg-red-500/15 text-red-700 border-red-200 dark:border-red-800 dark:text-red-400",
};

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

// ── Bloco JSON expansível ──────────────────────────────────────────────────────

function JsonExpandido({ label, json }: { label: string; json: string | null }) {
  const [aberto, setAberto] = useState(false);
  if (!json) return <span className="text-xs text-muted-foreground">—</span>;

  let formatado: string;
  try {
    formatado = JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    formatado = json;
  }

  return (
    <div>
      <button
        onClick={() => setAberto((v) => !v)}
        className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {aberto ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {label}
      </button>
      {aberto && (
        <pre className="mt-2 rounded-md bg-muted/60 p-3 text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap break-all border border-border/50">
          {formatado}
        </pre>
      )}
    </div>
  );
}

// ── Comparação lado-a-lado ANTES / DEPOIS ─────────────────────────────────────

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
    <div className="grid grid-cols-2 gap-3">
      {/* Antes */}
      <div className="rounded-md border border-red-200 dark:border-red-900 overflow-hidden">
        <div className="bg-red-50 dark:bg-red-950/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-400 border-b border-red-200 dark:border-red-900">
          Antes
        </div>
        <div className="divide-y divide-border/50">
          {todasChaves.map((chave) => {
            const valorAntes = objAntes?.[chave];
            const valorDepois = objDepois?.[chave];
            const alterado = JSON.stringify(valorAntes) !== JSON.stringify(valorDepois);
            return (
              <div
                key={chave}
                className={`px-3 py-1.5 ${alterado && objAntes ? "bg-red-50/60 dark:bg-red-950/20" : ""}`}
              >
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{chave}</div>
                <div className="text-xs mt-0.5 break-all">
                  {valorAntes === undefined ? (
                    <span className="text-muted-foreground/50 italic">—</span>
                  ) : (
                    <span className={alterado ? "text-red-700 dark:text-red-400" : ""}>
                      {String(valorAntes === null ? "null" : typeof valorAntes === "object" ? JSON.stringify(valorAntes) : valorAntes)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Depois */}
      <div className="rounded-md border border-emerald-200 dark:border-emerald-900 overflow-hidden">
        <div className="bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 border-b border-emerald-200 dark:border-emerald-900">
          Depois
        </div>
        <div className="divide-y divide-border/50">
          {todasChaves.map((chave) => {
            const valorAntes = objAntes?.[chave];
            const valorDepois = objDepois?.[chave];
            const alterado = JSON.stringify(valorAntes) !== JSON.stringify(valorDepois);
            return (
              <div
                key={chave}
                className={`px-3 py-1.5 ${alterado && objDepois ? "bg-emerald-50/60 dark:bg-emerald-950/20" : ""}`}
              >
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{chave}</div>
                <div className="text-xs mt-0.5 break-all">
                  {valorDepois === undefined ? (
                    <span className="text-muted-foreground/50 italic">—</span>
                  ) : (
                    <span className={alterado ? "text-emerald-700 dark:text-emerald-400" : ""}>
                      {String(valorDepois === null ? "null" : typeof valorDepois === "object" ? JSON.stringify(valorDepois) : valorDepois)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
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

        {log.stackTrace && (
          <div className="mt-3">
            <JsonExpandido label="Stack trace" json={log.stackTrace} />
          </div>
        )}
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
  const [entidade, setEntidade] = useState("all");
  const [entidadeId, setEntidadeId] = useState("");
  const [acao, setAcao] = useState("all");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [buscaInput, setBuscaInput] = useState("");
  const [buscaAtiva, setBuscaAtiva] = useState("");
  const [page, setPage] = useState(1);

  const [detalheLogs, setDetalheLogs] = useState<AuditLog[] | null>(null);
  const [detalheIndice, setDetalheIndice] = useState(0);

  const filtros: AuditLogsFiltros = useMemo(() => ({
    entidade: entidade === "all" ? undefined : entidade,
    entidadeId: entidadeId || undefined,
    acao: acao === "all" ? undefined : acao,
    dataInicio: dataInicio || undefined,
    dataFim: dataFim || undefined,
    busca: buscaAtiva || undefined,
    page,
    pageSize: 30,
  }), [entidade, entidadeId, acao, dataInicio, dataFim, buscaAtiva, page]);

  const { data: response, isLoading } = useAuditLogsPaginados(filtros);
  const paginacao = useServerPagination(response, setPage);

  const colunas = useMemo<DataGridColumn<AuditLog>[]>(
    () => [
      { id: "entidade", label: "Entidade", accessor: (l) => l.entidade },
      { id: "entidadeId", label: "ID", accessor: (l) => l.entidadeId },
      { id: "acao", label: "Ação", accessor: (l) => l.acao },
      { id: "ocorridoEm", label: "Data", accessor: (l) => l.ocorridoEm },
    ],
    [],
  );

  const grid = useDataGrid(paginacao.items, colunas);

  const temFiltros =
    entidade !== "all" ||
    entidadeId !== "" ||
    acao !== "all" ||
    dataInicio !== "" ||
    dataFim !== "" ||
    buscaAtiva !== "";

  const resetFiltros = useCallback(() => {
    setEntidade("all");
    setEntidadeId("");
    setAcao("all");
    setDataInicio("");
    setDataFim("");
    setBuscaInput("");
    setBuscaAtiva("");
    setPage(1);
  }, []);

  function aplicarBusca() {
    setBuscaAtiva(buscaInput);
    setPage(1);
  }

  function abrirDetalhe(index: number) {
    setDetalheLogs(grid.rows);
    setDetalheIndice(index);
  }

  function fecharDetalhe() {
    setDetalheLogs(null);
  }

  const logAtual = detalheLogs?.[detalheIndice] ?? null;

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
            {/* Linha 1: busca + período + ações */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[200px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por endpoint, ID ou texto..."
                  className="pl-9"
                  value={buscaInput}
                  onChange={(e) => setBuscaInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && aplicarBusca()}
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap">De</span>
                <Input
                  type="date"
                  className="w-[150px]"
                  value={dataInicio}
                  onChange={(e) => { setDataInicio(e.target.value); setPage(1); }}
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Até</span>
                <Input
                  type="date"
                  className="w-[150px]"
                  value={dataFim}
                  onChange={(e) => { setDataFim(e.target.value); setPage(1); }}
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button onClick={aplicarBusca}>
                  <Search className="mr-1.5 h-4 w-4" />
                  Buscar
                </Button>
                {temFiltros && (
                  <Button variant="ghost" size="icon" onClick={resetFiltros} title="Limpar filtros">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Linha 2: entidade + ação + ID */}
            <div className="flex flex-wrap items-center gap-3">
              <AppSelect
                className="min-w-[180px] flex-1"
                value={entidade}
                onValueChange={(v) => { setEntidade(v); setPage(1); }}
                options={[
                  { value: "all", label: "Todas as entidades" },
                  ...(response?.entidades ?? []).map((e) => ({ value: e, label: e })),
                ]}
              />

              <AppSelect
                className="w-[180px] shrink-0"
                value={acao}
                onValueChange={(v) => { setAcao(v); setPage(1); }}
                options={ACOES}
              />

              <Input
                className="w-[220px] shrink-0"
                placeholder="Código / ID da entidade"
                value={entidadeId}
                onChange={(e) => { setEntidadeId(e.target.value); setPage(1); }}
              />

              {response && (
                <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
                  {response.total.toLocaleString("pt-BR")} registro{response.total !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </Card>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <DataGridColumnHeader grid={grid} columnId="entidade" label="Entidade" />
                  <DataGridColumnHeader grid={grid} columnId="entidadeId" label="ID" />
                  <DataGridColumnHeader grid={grid} columnId="acao" label="Ação" />
                  <DataGridColumnHeader grid={grid} columnId="ocorridoEm" label="Data / Hora" />
                  <th className="w-24 px-4 py-3 text-right">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <TableSkeleton cols={5} />
                ) : grid.rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      Nenhum registro encontrado.
                    </td>
                  </tr>
                ) : (
                  grid.rows.map((log, idx) => (
                    <tr key={log.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{log.entidade}</td>
                      <td className="px-4 py-3">
                        <span
                          className="font-mono text-xs text-muted-foreground truncate max-w-[200px] block"
                          title={log.entidadeId}
                        >
                          {log.entidadeId}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <AcaoBadge acao={log.acao} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs tabular-nums">
                        {formatarData(log.ocorridoEm)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => abrirDetalhe(idx)}
                          aria-label="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <PaginationFooter pagination={paginacao} />
          </Card>
        </div>
      </div>

      {/* Dialog de detalhe */}
      <Dialog open={!!logAtual} onOpenChange={(v) => { if (!v) fecharDetalhe(); }}>
        {logAtual && detalheLogs && (
          <DialogDetalhe
            log={logAtual}
            indiceAtual={detalheIndice}
            totalRegistros={detalheLogs.length}
            podePrevious={detalheIndice > 0}
            podeNext={detalheIndice < detalheLogs.length - 1}
            onPrevious={() => setDetalheIndice((i) => Math.max(0, i - 1))}
            onNext={() => setDetalheIndice((i) => Math.min(detalheLogs.length - 1, i + 1))}
            onClose={fecharDetalhe}
          />
        )}
      </Dialog>
    </AppShell>
  );
}
