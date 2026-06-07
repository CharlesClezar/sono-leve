"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AppSelect } from "@/components/AppSelect";
import { ClearFiltersShortcutDialog } from "@/components/ClearFiltersShortcutDialog";
import { DataGrid, type GridColumnDef } from "@/components/DataGrid";
import { PaginationFooter } from "@/components/PaginationFooter";
import { IndexedTabsNav } from "@/components/IndexedTabsNav";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { useIndexedTabs } from "@/hooks/useIndexedTabs";
import { formatBRL, formatDate, type Account, type AccountStatus } from "@/lib/types";
import {
  api, useContasPaginadas, useBuscarClientes, useFormasPagamento,
  type ContaSalvar,
} from "@/lib/api";
import { useDataGrid } from "@/hooks/useDataGrid";
import { useServerPagination } from "@/hooks/usePagination";
import { Search, Plus, Wrench } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ─── Abas ─────────────────────────────────────────────────────────────────────

const tabs = ["Contas a receber", "Recebimentos"] as const;

// ─── Helper de status automático ──────────────────────────────────────────────

function calcStatus(total: number, recebido: number): AccountStatus {
  if (recebido <= 0) return "Aberto";
  if (recebido >= total) return "Pago";
  return "Parcial";
}

function dataHoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Estado inicial do formulário ─────────────────────────────────────────────

const DRAFT_VAZIO: ContaSalvar = {
  clienteId: "",
  origem: "Manual",
  descricao: "",
  total: 0,
  recebido: 0,
  vencimento: dataHoje(),
  status: "Aberto",
  ehManual: true,
  numeroParcelas: undefined,
  percentualTaxaCartao: undefined,
  taxaFixaCartao: undefined,
  valorTaxaCartao: undefined,
};

// ─── Modal de criação / edição ────────────────────────────────────────────────

function ModalConta({
  aberto,
  contaId,
  inicial,
  onFechar,
  onSalvo,
}: {
  aberto: boolean;
  contaId: string | null;
  inicial: ContaSalvar;
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const [draft, setDraft] = useState<ContaSalvar>(inicial);
  const [salvando, setSalvando] = useState(false);

  // Sincronizar draft quando o modal abre com dados diferentes
  const [chaveInicial, setChaveInicial] = useState(0);
  useMemo(() => {
    if (aberto) {
      setDraft(inicial);
      setChaveInicial((k) => k + 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  // Busca de cliente
  const [buscaCliente, setBuscaCliente] = useState("");
  const [termoCliente, setTermoCliente] = useState("");
  useMemo(() => {
    if (aberto) { setBuscaCliente(""); setTermoCliente(""); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  const { data: resultados = [], isFetching: buscando } = useBuscarClientes(termoCliente);

  const { data: formasPagamento = [] } = useFormasPagamento();

  // Auto-status ao mudar total/recebido
  const set = <K extends keyof ContaSalvar>(k: K, v: ContaSalvar[K]) =>
    setDraft((d) => {
      const novo = { ...d, [k]: v };
      if (k === "total" || k === "recebido") {
        novo.status = calcStatus(Number(novo.total) || 0, Number(novo.recebido) || 0);
      }
      return novo;
    });

  // Taxa auto-calculada = total * % + fixo
  const valorTaxaAuto = useMemo(() => {
    if (!draft.percentualTaxaCartao && !draft.taxaFixaCartao) return 0;
    return (Number(draft.total) || 0) * ((draft.percentualTaxaCartao ?? 0) / 100)
      + (draft.taxaFixaCartao ?? 0);
  }, [draft.total, draft.percentualTaxaCartao, draft.taxaFixaCartao]);

  const valorLiquido = (Number(draft.total) || 0) - (draft.valorTaxaCartao ?? valorTaxaAuto);

  const handleSalvar = async () => {
    if (!draft.clienteId) return toast.error("Selecione um cliente.");
    if (!draft.origem.trim()) return toast.error("Informe a origem.");
    if (Number(draft.total) <= 0) return toast.error("Total deve ser maior que zero.");
    setSalvando(true);
    try {
      const payload: ContaSalvar = {
        ...draft,
        valorTaxaCartao: draft.valorTaxaCartao ?? (valorTaxaAuto > 0 ? valorTaxaAuto : undefined),
      };
      if (contaId) {
        await api.atualizarConta(contaId, payload);
        toast.success("Conta atualizada.");
      } else {
        await api.criarConta(payload);
        toast.success("Conta criada.");
      }
      onSalvo();
    } catch {
      toast.error("Erro ao salvar conta.");
    } finally {
      setSalvando(false);
    }
  };

  void chaveInicial; // silencia lint

  return (
    <Dialog open={aberto} onOpenChange={(v) => { if (!v) onFechar(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{contaId ? "Editar conta" : "Nova conta a receber"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          {/* Cliente */}
          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Cliente <span className="text-destructive">*</span>
            </span>
            {draft.clienteId ? (
              <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
                <span className="font-medium">{inicial.clienteId === draft.clienteId ? (inicial as ContaSalvar & { clienteNome?: string }).clienteNome ?? draft.clienteId : draft.clienteId}</span>
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => set("clienteId", "")}>Trocar</Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Buscar cliente..."
                  value={buscaCliente}
                  onChange={(e) => { setBuscaCliente(e.target.value); if (e.target.value.trim().length >= 2) setTermoCliente(e.target.value.trim()); }}
                />
                {buscaCliente.trim().length >= 2 && (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-lg">
                    {buscando ? (
                      <div className="px-3 py-4 text-center text-xs text-muted-foreground">Buscando...</div>
                    ) : resultados.length > 0 ? (
                      resultados.map((c) => (
                        <button key={c.id} onClick={() => { set("clienteId", c.id); setBuscaCliente(""); setTermoCliente(""); }}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted">
                          <span>{c.nome}</span>
                          <span className="text-xs uppercase text-muted-foreground">{c.tipo}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center text-xs text-muted-foreground">Nenhum cliente encontrado.</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </label>

          {/* Origem + Descrição */}
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase">Origem</span>
              <Input value={draft.origem} onChange={(e) => set("origem", e.target.value)} placeholder="Ex: Manual, Serviço..." />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase">Descrição</span>
              <Input value={draft.descricao ?? ""} onChange={(e) => set("descricao", e.target.value)} placeholder="Opcional" />
            </label>
          </div>

          {/* Total + Recebido */}
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase">Total (R$)</span>
              <Input type="number" min={0} step={0.01} value={draft.total || ""} onChange={(e) => set("total", Number(e.target.value) || 0)} placeholder="0,00" />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase">Recebido (R$)</span>
              <Input type="number" min={0} step={0.01} value={draft.recebido || ""} onChange={(e) => set("recebido", Number(e.target.value) || 0)} placeholder="0,00" />
            </label>
          </div>

          {/* Vencimento + Status */}
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase">Vencimento</span>
              <Input type="date" value={draft.vencimento} onChange={(e) => set("vencimento", e.target.value)} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase">Status</span>
              <AppSelect
                value={draft.status}
                onValueChange={(v) => set("status", v as AccountStatus)}
                options={[
                  { value: "Aberto",    label: "Aberto" },
                  { value: "Parcial",   label: "Parcial" },
                  { value: "Pago",      label: "Pago" },
                  { value: "Atrasado",  label: "Atrasado" },
                  { value: "Cancelado", label: "Cancelado" },
                ]}
              />
            </label>
          </div>

          {/* Taxa de cartão (seção colapsável via estado) */}
          <details className="rounded-md border">
            <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase text-muted-foreground select-none hover:bg-muted/30">
              Taxa de cartão (opcional)
            </summary>
            <div className="space-y-3 border-t px-3 py-3">
              <div className="grid grid-cols-3 gap-2">
                <label className="space-y-1">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">Parcelas</span>
                  <Input type="number" min={1} max={24} value={draft.numeroParcelas ?? ""} onChange={(e) => set("numeroParcelas", e.target.value ? Number(e.target.value) : undefined)} placeholder="—" className="h-8 text-center" />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">Taxa (%)</span>
                  <Input type="number" min={0} max={100} step={0.01} value={draft.percentualTaxaCartao ?? ""} onChange={(e) => set("percentualTaxaCartao", e.target.value ? Number(e.target.value) : undefined)} placeholder="0,00" className="h-8" />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">Taxa fixa (R$)</span>
                  <Input type="number" min={0} step={0.01} value={draft.taxaFixaCartao ?? ""} onChange={(e) => set("taxaFixaCartao", e.target.value ? Number(e.target.value) : undefined)} placeholder="—" className="h-8" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">Valor taxa (R$)</span>
                  <Input type="number" min={0} step={0.01}
                    value={draft.valorTaxaCartao !== undefined ? draft.valorTaxaCartao : (valorTaxaAuto > 0 ? Number(valorTaxaAuto.toFixed(2)) : "")}
                    onChange={(e) => set("valorTaxaCartao", e.target.value ? Number(e.target.value) : undefined)}
                    placeholder={valorTaxaAuto > 0 ? `${formatBRL(valorTaxaAuto)} (auto)` : "—"} className="h-8" />
                </label>
                <div className="space-y-1">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">Valor líquido</span>
                  <div className="flex h-8 items-center rounded-md border bg-muted/30 px-3 text-sm font-semibold text-[hsl(var(--success))]">
                    {formatBRL(valorLiquido)}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Se "Valor taxa" ficar em branco, ele é calculado automaticamente como Total × % + Fixa.
              </p>
              <label className="space-y-1 block">
                <span className="text-[10px] font-medium text-muted-foreground uppercase">Forma de pagamento (opcional)</span>
                <AppSelect
                  value=""
                  onValueChange={() => {}}
                  placeholder="Apenas referência..."
                  options={formasPagamento.filter((f) => f.ativo).map((f) => ({ value: f.id, label: f.nome }))}
                />
              </label>
            </div>
          </details>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onFechar} disabled={salvando}>Cancelar</Button>
          <Button onClick={handleSalvar} disabled={salvando}>
            {salvando ? "Salvando..." : contaId ? "Salvar alterações" : "Criar conta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function Financeiro() {
  const queryClient = useQueryClient();
  const [aba, setAba] = useState<(typeof tabs)[number]>("Contas a receber");
  const indexedTabs = useIndexedTabs({ tabs, onTabChange: setAba });
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("all");
  const [page, setPage] = useState(1);

  // Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [contaEditando, setContaEditando] = useState<Account | null>(null);

  const { data: response, isLoading } = useContasPaginadas({
    search: busca || undefined,
    status: filtroStatus !== "all" ? filtroStatus : undefined,
    page,
    pageSize: 30,
  });

  const colunas = useMemo<GridColumnDef<Account>[]>(
    () => [
      {
        id: "cliente", label: "Cliente", accessor: (a) => a.clienteNome,
        render: (a) => (
          <div className="flex items-center gap-1.5 font-medium">
            {a.ehManual && <span title="Criada manualmente"><Wrench className="h-3 w-3 text-muted-foreground" /></span>}
            {a.clienteNome}
          </div>
        ),
      },
      {
        id: "origem", label: "Origem", accessor: (a) => a.origem,
        render: (a) => (
          <div className="text-muted-foreground">
            <div>{a.origem}</div>
            {a.descricao && <div className="max-w-[160px] truncate text-[11px] text-muted-foreground/70">{a.descricao}</div>}
          </div>
        ),
      },
      { id: "total", label: "Total", accessor: (a) => a.total, align: "right", render: (a) => formatBRL(a.total) },
      {
        id: "taxa", label: "Taxa", accessor: (a) => a.valorTaxaCartao ?? 0,
        align: "right",
        render: (a) => a.valorTaxaCartao ? (
          <div className="text-xs text-destructive/80">
            <div>{formatBRL(a.valorTaxaCartao)}</div>
            {a.numeroParcelas && <div className="text-muted-foreground">{a.numeroParcelas}x · {a.percentualTaxaCartao?.toFixed(2)}%</div>}
          </div>
        ) : <span className="text-muted-foreground/40">—</span>,
      },
      {
        id: "liquido", label: "Líquido", accessor: (a) => a.valorLiquido,
        align: "right",
        render: (a) => <span className="font-semibold text-[hsl(var(--success))]">{formatBRL(a.valorLiquido)}</span>,
      },
      { id: "recebido", label: "Recebido", accessor: (a) => a.recebido, align: "right", render: (a) => <span className="text-muted-foreground">{formatBRL(a.recebido)}</span> },
      {
        id: "vencimento", label: "Vencimento", accessor: (a) => a.vencimento,
        filterAccessor: (a) => formatDate(a.vencimento),
        render: (a) => <span className="text-muted-foreground">{formatDate(a.vencimento)}</span>,
      },
      { id: "status", label: "Status", accessor: (a) => a.status, render: (a) => <StatusBadge status={a.status} /> },
    ],
    [],
  );

  const grid      = useDataGrid(response?.data ?? [], colunas);
  const paginacao = useServerPagination(response, setPage);

  const abrirNova = () => {
    setContaEditando(null);
    setModalAberto(true);
  };

  const abrirEdicao = (conta: Account) => {
    setContaEditando(conta);
    setModalAberto(true);
  };

  const handleSalvo = async () => {
    await queryClient.invalidateQueries({ queryKey: ["contas-receber"] });
    setModalAberto(false);
    setContaEditando(null);
  };

  // Draft inicial para o modal
  const draftInicial = useMemo<ContaSalvar>(() => {
    if (!contaEditando) return DRAFT_VAZIO;
    return {
      clienteId:           contaEditando.clienteId,
      origem:              contaEditando.origem,
      descricao:           contaEditando.descricao,
      total:               contaEditando.total,
      recebido:            contaEditando.recebido,
      vencimento:          contaEditando.vencimento.substring(0, 10),
      status:              contaEditando.status,
      ehManual:            contaEditando.ehManual,
      vendaId:             contaEditando.vendaId,
      numeroParcelas:      contaEditando.numeroParcelas,
      percentualTaxaCartao: contaEditando.percentualTaxaCartao,
      taxaFixaCartao:      contaEditando.taxaFixaCartao,
      valorTaxaCartao:     contaEditando.valorTaxaCartao,
      // Campo extra para exibir nome no modal (tipagem estendida)
      ...({ clienteNome: contaEditando.clienteNome } as object),
    };
  }, [contaEditando]);

  return (
    <AppShell>
      <ClearFiltersShortcutDialog
        onConfirm={() => {
          setBusca("");
          setFiltroStatus("all");
          setPage(1);
          grid.clearFilters();
        }}
      />

      <PageHeader
        breadcrumb={["Financeiro", aba]}
        title="Financeiro"
        infoTooltip="Concentra contas a receber, recebimentos e acompanhamento financeiro das vendas e encomendas."
        actions={
          aba === "Contas a receber" ? (
            <Button size="sm" onClick={abrirNova}>
              <Plus className="mr-1.5 h-4 w-4" /> Nova conta
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="shrink-0 space-y-4 border-b px-6 py-4">
          <IndexedTabsNav
            tabs={tabs}
            activeTab={aba}
            onSelect={setAba}
            getTabButtonProps={indexedTabs.getTabButtonProps}
            getShortcutLabel={indexedTabs.getShortcutLabel}
          />

          {aba === "Contas a receber" && (
            <Card className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por cliente"
                    className="pl-9"
                    value={busca}
                    onChange={(e) => { setBusca(e.target.value); setPage(1); }}
                  />
                </div>
                <AppSelect
                  className="w-full lg:w-[170px]"
                  value={filtroStatus}
                  onValueChange={(v) => { setFiltroStatus(v); setPage(1); }}
                  options={[
                    { value: "all",       label: "Todos status" },
                    { value: "Aberto",    label: "Aberto" },
                    { value: "Parcial",   label: "Parcial" },
                    { value: "Pago",      label: "Pago" },
                    { value: "Atrasado",  label: "Atrasado" },
                    { value: "Cancelado", label: "Cancelado" },
                  ]}
                />
              </div>
            </Card>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {aba === "Contas a receber" && (
            <div {...indexedTabs.getTabPanelProps("Contas a receber")}>
              <DataGrid
                grid={grid}
                columns={colunas}
                isLoading={isLoading}
                emptyMessage="Nenhuma conta encontrada"
                onEdit={(a) => abrirEdicao(a)}
                footer={<PaginationFooter pagination={paginacao} />}
              />
            </div>
          )}

          {aba === "Recebimentos" && (
            <Card {...indexedTabs.getTabPanelProps("Recebimentos")} className="p-10 text-center text-sm text-muted-foreground">
              Histórico de recebimentos com taxa, líquido e forma de pagamento.
            </Card>
          )}
        </div>
      </div>

      <ModalConta
        aberto={modalAberto}
        contaId={contaEditando?.id ?? null}
        inicial={draftInicial}
        onFechar={() => { setModalAberto(false); setContaEditando(null); }}
        onSalvo={handleSalvo}
      />
    </AppShell>
  );
}
