import { Fragment, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { AppSelect } from "@/components/AppSelect";
import { ClearFiltersShortcutDialog } from "@/components/ClearFiltersShortcutDialog";
import { DataGridColumnHeader } from "@/components/DataGridColumnHeader";
import { IndexedTabsNav } from "@/components/IndexedTabsNav";
import { PaginationFooter } from "@/components/PaginationFooter";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PiecesDetailsDialog } from "@/components/PiecesDetailsDialog";
import { formatBRL, formatDate, type Order } from "@/lib/types";
import { api, useEncomendasPaginadas, useItensEncomenda } from "@/lib/api";
import { useIndexedTabs } from "@/hooks/useIndexedTabs";
import { useShortcutLabel } from "@/hooks/useShortcutLabel";
import { useDataGrid, type DataGridColumn } from "@/hooks/useDataGrid";
import { useServerPagination } from "@/hooks/usePagination";
import { TableSkeleton, CardsSkeleton } from "@/components/TableSkeleton";
import { CircleCheck, Pencil, Play, Plus, Search, ShoppingCart } from "lucide-react";
import Link from "next/link";

type StatusListaEncomenda = "Novo" | "Em produção" | "Fabricado parcialmente" | "Pronta" | "Entregue" | "Cancelada";
type AbaEncomenda = "Histórico" | StatusListaEncomenda;
type ModoVisualizacao = "list" | "grouped";
type ChaveOrdenacao = "criadoEm" | "previsao" | "total" | "cliente" | "status";
type DirecaoOrdenacao = "asc" | "desc";
type FiltroAba = {
  busca: string;
  modoVisualizacao: ModoVisualizacao;
  ordenarPor: ChaveOrdenacao;
  direcaoOrdenacao: DirecaoOrdenacao;
};

const ENCOMENDAS_VAZIAS: Order[] = [];

const ordemStatus: StatusListaEncomenda[] = ["Novo", "Em produção", "Fabricado parcialmente", "Pronta", "Entregue", "Cancelada"];
const abas: AbaEncomenda[] = ["Histórico", ...ordemStatus];
const filtrosPadraoAba: FiltroAba = {
  busca: "",
  modoVisualizacao: "list",
  ordenarPor: "previsao",
  direcaoOrdenacao: "asc",
};

const normalizarStatus = (status: string): StatusListaEncomenda => (status === "Aberta" ? "Novo" : status as StatusListaEncomenda);

const statusParaApi = (aba: AbaEncomenda): string | undefined => {
  if (aba === "Histórico") return undefined;
  if (aba === "Novo") return "Aberta";
  return aba;
};

const classeStatus: Record<StatusListaEncomenda, string> = {
  Novo: "border-primary/20 bg-primary/10 text-primary",
  "Em produção": "border-amber-200 bg-amber-50 text-amber-600",
  "Fabricado parcialmente": "border-[rgb(var(--partial))/0.28] bg-[rgb(var(--partial-soft))] text-[rgb(var(--partial-foreground))]",
  Pronta: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Entregue: "border-slate-200 bg-slate-50 text-slate-600",
  Cancelada: "border-red-200 bg-red-50 text-red-600",
};

function rotuloStatus(status: StatusListaEncomenda) {
  return status === "Pronta" ? "Pronto" : status;
}

function estaAtrasada(previsao: string, status: StatusListaEncomenda) {
  if (status === "Pronta" || status === "Entregue" || status === "Cancelada") return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return new Date(previsao.substring(0, 10) + "T00:00:00").getTime() < hoje.getTime();
}

export default function Encomendas() {
  const queryClient = useQueryClient();
  const atalhoNova = useShortcutLabel("new_contextual");
  const [aba, setAba] = useState<AbaEncomenda>("Histórico");
  const [filtrosPorAba, setFiltrosPorAba] = useState<Record<AbaEncomenda, FiltroAba>>(
    () => Object.fromEntries(abas.map((item) => [item, filtrosPadraoAba])) as Record<AbaEncomenda, FiltroAba>,
  );
  const [pageByTab, setPageByTab] = useState<Record<AbaEncomenda, number>>(
    () => Object.fromEntries(abas.map((item) => [item, 1])) as Record<AbaEncomenda, number>,
  );
  const filtros = filtrosPorAba[aba];
  const page = pageByTab[aba];

  const atualizarFiltrosAba = (patch: Partial<FiltroAba>) => {
    setFiltrosPorAba((atual) => ({ ...atual, [aba]: { ...atual[aba], ...patch } }));
    setPageByTab((atual) => ({ ...atual, [aba]: 1 }));
  };
  const setTabPage = (p: number) => setPageByTab((atual) => ({ ...atual, [aba]: p }));
  const selecionarAba = (novaAba: AbaEncomenda) => setAba(novaAba);
  const indexedTabs = useIndexedTabs({ tabs: abas, onTabChange: selecionarAba });

  const { data: response, isLoading } = useEncomendasPaginadas({
    search: filtros.busca || undefined,
    status: statusParaApi(aba),
    page,
    pageSize: 30,
  });

  // Referência estável: evita novo array a cada render quando não há dados
  const encomendas = response?.data ?? ENCOMENDAS_VAZIAS;

  const [statusPorId, setStatusPorId] = useState<Record<string, StatusListaEncomenda>>({});

  useEffect(() => {
    // Sem dados, não há nada para sincronizar — sai cedo evitando loop
    if (encomendas.length === 0) return;
    setStatusPorId((prev) => ({
      ...Object.fromEntries(encomendas.map((e) => [e.id, normalizarStatus(e.status)])),
      ...prev,
    }));
  }, [encomendas]);

  useEffect(() => {
    const filtroEncomenda = new URLSearchParams(window.location.search).get("encomenda");
    if (!filtroEncomenda) return;
    setAba("Histórico");
    setFiltrosPorAba((atual) => ({ ...atual, Histórico: { ...atual.Histórico, busca: filtroEncomenda } }));
  }, []);

  const encomendasOrdenadas = useMemo(() => {
    return [...encomendas].sort((a, b) => {
      const statusA = statusPorId[a.id] ?? normalizarStatus(a.status);
      const statusB = statusPorId[b.id] ?? normalizarStatus(b.status);
      let valor = 0;
      if (filtros.ordenarPor === "criadoEm") valor = a.criadoEm.localeCompare(b.criadoEm);
      if (filtros.ordenarPor === "previsao") valor = a.previsao.localeCompare(b.previsao);
      if (filtros.ordenarPor === "total") valor = a.total - b.total;
      if (filtros.ordenarPor === "cliente") valor = a.clienteNome.localeCompare(b.clienteNome);
      if (filtros.ordenarPor === "status") valor = ordemStatus.indexOf(statusA) - ordemStatus.indexOf(statusB);
      return filtros.direcaoOrdenacao === "asc" ? valor : -valor;
    });
  }, [encomendas, filtros.ordenarPor, filtros.direcaoOrdenacao, statusPorId]);

  const colunas = useMemo<DataGridColumn<Order>[]>(
    () => [
      { id: "id", label: "Código", accessor: (e) => e.id },
      { id: "cliente", label: "Cliente", accessor: (e) => e.clienteNome },
      { id: "criadoEm", label: "Cadastro", accessor: (e) => e.criadoEm, filterAccessor: (e) => formatDate(e.criadoEm) },
      { id: "previsao", label: "Entrega", accessor: (e) => e.previsao, filterAccessor: (e) => formatDate(e.previsao) },
      { id: "pecas", label: "Peças", accessor: (e) => e.pecas },
      { id: "total", label: "Total", accessor: (e) => e.total },
      { id: "balance", label: "Saldo", accessor: (e) => e.total - e.entrada },
      { id: "status", label: "Status", accessor: (e) => statusPorId[e.id] ?? normalizarStatus(e.status) },
    ],
    [statusPorId],
  );
  const grid = useDataGrid(encomendasOrdenadas, colunas);
  const paginacao = useServerPagination(response, setTabPage);

  const agrupadas = useMemo(
    () =>
      ordemStatus
        .map((statusGrupo) => ({
          status: statusGrupo,
          encomendas: paginacao.items.filter((e) => (statusPorId[e.id] ?? normalizarStatus(e.status)) === statusGrupo),
        }))
        .filter((grupo) => grupo.encomendas.length > 0),
    [paginacao.items, statusPorId]
  );

  const moverStatus = async (id: string, novoStatus: StatusListaEncomenda) => {
    setStatusPorId((anterior) => ({ ...anterior, [id]: novoStatus }));
    await api.atualizarStatusEncomenda(id, novoStatus === "Novo" ? "Aberta" : novoStatus);
    await queryClient.invalidateQueries({ queryKey: ["encomendas"] });
  };

  return (
    <AppShell>
      <ClearFiltersShortcutDialog
        onConfirm={() => {
          setFiltrosPorAba(Object.fromEntries(abas.map((item) => [item, filtrosPadraoAba])) as Record<AbaEncomenda, FiltroAba>);
          setPageByTab(Object.fromEntries(abas.map((item) => [item, 1])) as Record<AbaEncomenda, number>);
          grid.clearFilters();
        }}
      />
      <PageHeader
        breadcrumb={["Encomendas", aba]}
        title="Encomendas"
        infoTooltip="Acompanha pedidos sob encomenda desde a abertura até produção, entrega e faturamento."
        actions={
          <Button asChild>
            <Link href="/encomendas/nova"><Plus className="mr-1.5 h-4 w-4" />{`Nova encomenda${atalhoNova}`}</Link>
          </Button>
        }
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="shrink-0 space-y-4 border-b px-6 py-4">
          <IndexedTabsNav
            tabs={abas}
            activeTab={aba}
            onSelect={selecionarAba}
            getTabButtonProps={indexedTabs.getTabButtonProps}
            getShortcutLabel={indexedTabs.getShortcutLabel}
          />

          <Card className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por cliente ou código" className="pl-9" value={filtros.busca} onChange={(e) => atualizarFiltrosAba({ busca: e.target.value })} />
            </div>
            <AppSelect
              className="w-full lg:w-[190px]"
              value={filtros.modoVisualizacao}
              onValueChange={(value) => atualizarFiltrosAba({ modoVisualizacao: value as ModoVisualizacao })}
              options={[
                { value: "list", label: "Lista em colunas" },
                { value: "grouped", label: "Agrupado por status" },
              ]}
            />
            <AppSelect
              className="w-full lg:w-[210px]"
              value={filtros.ordenarPor}
              onValueChange={(value) => atualizarFiltrosAba({ ordenarPor: value as ChaveOrdenacao })}
              options={[
                { value: "previsao", label: "Ordenar por entrega" },
                { value: "criadoEm", label: "Ordenar por cadastro" },
                { value: "total", label: "Ordenar por valor" },
                { value: "cliente", label: "Ordenar por cliente" },
                { value: "status", label: "Ordenar por status" },
              ]}
            />
            <AppSelect
              className="w-full lg:w-[150px]"
              value={filtros.direcaoOrdenacao}
              onValueChange={(value) => atualizarFiltrosAba({ direcaoOrdenacao: value as DirecaoOrdenacao })}
              options={[
                { value: "asc", label: "Crescente" },
                { value: "desc", label: "Decrescente" },
              ]}
            />
          </div>
          </Card>
        </div>

        <div {...indexedTabs.getTabPanelProps(aba)} className="flex-1 overflow-y-auto p-6">

        <div className="grid gap-3 lg:hidden">
          {isLoading ? (
            <CardsSkeleton />
          ) : paginacao.items.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              Nenhuma encomenda encontrada
            </Card>
          ) : (
            paginacao.items.map((encomenda) => {
              const statusAtual = statusPorId[encomenda.id] ?? normalizarStatus(encomenda.status);
              const atrasada = estaAtrasada(encomenda.previsao, statusAtual);

              return (
                <Card key={encomenda.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{encomenda.clienteNome}</div>
                      <div className="font-mono text-xs text-muted-foreground">{encomenda.id}</div>
                    </div>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${classeStatus[statusAtual]}`}>
                      {rotuloStatus(statusAtual)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Cadastro</div>
                      <div>{formatDate(encomenda.criadoEm)}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Entrega</div>
                      <div>{formatDate(encomenda.previsao)}</div>
                      {atrasada && <div className="text-xs font-semibold text-destructive">Atrasada</div>}
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Peças</div>
                      <DetalhesPecasEncomenda encomenda={encomenda} triggerClassName="rounded-md bg-primary-soft px-2.5 py-1 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground" />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Saldo</div>
                      <div>{formatBRL(encomenda.total - encomenda.entrada)}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Total</div>
                      <div className="font-semibold">{formatBRL(encomenda.total)}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <BotaoAcaoEncomenda
                      id={encomenda.id}
                      status={statusAtual}
                      aoMover={moverStatus}
                      propsAcao={indexedTabs.getActionProps(aba)}
                    />
                    <Button variant="ghost" size="icon" asChild aria-label={`Editar ${encomenda.id}`}>
                      <Link {...indexedTabs.getActionProps(aba)} href={`/encomendas/${encomenda.id}/editar`}><Pencil className="h-4 w-4" /></Link>
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
        <PaginationFooter pagination={paginacao} className="mt-3 rounded-md border lg:hidden" />

        <Card className="hidden overflow-hidden lg:block">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Ação</th>
                {colunas.map((coluna) => (
                  <DataGridColumnHeader
                    key={coluna.id}
                    grid={grid}
                    columnId={coluna.id}
                    label={coluna.label}
                    align={coluna.id === "pecas" ? "center" : ["total", "balance"].includes(coluna.id) ? "right" : "left"}
                  />
                ))}
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <TableSkeleton cols={10} />
              ) : paginacao.items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    Nenhuma encomenda encontrada
                  </td>
                </tr>
              ) : filtros.modoVisualizacao === "grouped" ? (
                agrupadas.map((grupo) => (
                  <Fragment key={grupo.status}>
                    <tr className="bg-muted/30">
                      <td colSpan={10} className="px-4 py-2">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${classeStatus[grupo.status]}`}>
                          {rotuloStatus(grupo.status)} · {grupo.encomendas.length}
                        </span>
                      </td>
                    </tr>
                    {grupo.encomendas.map((encomenda) => (
                      <LinhaEncomenda
                        key={encomenda.id}
                        encomenda={encomenda}
                        status={statusPorId[encomenda.id] ?? normalizarStatus(encomenda.status)}
                        aoMover={moverStatus}
                        propsAcao={indexedTabs.getActionProps(aba)}
                      />
                    ))}
                  </Fragment>
                ))
              ) : (
                paginacao.items.map((encomenda) => (
                  <LinhaEncomenda
                    key={encomenda.id}
                    encomenda={encomenda}
                    status={statusPorId[encomenda.id] ?? normalizarStatus(encomenda.status)}
                    aoMover={moverStatus}
                    propsAcao={indexedTabs.getActionProps(aba)}
                  />
                ))
              )}
            </tbody>
          </table>
          <PaginationFooter pagination={paginacao} />
          </div>
        </Card>
        </div>
      </div>
    </AppShell>
  );
}

function LinhaEncomenda({
  encomenda,
  status,
  aoMover,
  propsAcao,
}: {
  encomenda: Order;
  status: StatusListaEncomenda;
  aoMover: (id: string, novoStatus: StatusListaEncomenda) => void;
  propsAcao: Record<string, unknown>;
}) {
  const atrasada = estaAtrasada(encomenda.previsao, status);

  return (
    <tr className="hover:bg-muted/30">
      <td className="px-4 py-3">
        <BotaoAcaoEncomenda id={encomenda.id} status={status} aoMover={aoMover} propsAcao={propsAcao} />
      </td>
      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{encomenda.id}</td>
      <td className="px-4 py-3 font-medium">{encomenda.clienteNome}</td>
      <td className="px-4 py-3 text-muted-foreground">{formatDate(encomenda.criadoEm)}</td>
      <td className="px-4 py-3">
        <div className="text-muted-foreground">{formatDate(encomenda.previsao)}</div>
        {atrasada && <div className="text-xs font-semibold text-destructive">Atrasada</div>}
      </td>
      <td className="px-4 py-3 text-center font-medium">
        <DetalhesPecasEncomenda encomenda={encomenda} triggerClassName="rounded-md bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground" />
      </td>
      <td className="px-4 py-3 text-right font-semibold">{formatBRL(encomenda.total)}</td>
      <td className="px-4 py-3 text-right text-muted-foreground">{formatBRL(encomenda.total - encomenda.entrada)}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${classeStatus[status]}`}>
          {rotuloStatus(status)}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <Button variant="ghost" size="icon" asChild aria-label={`Editar ${encomenda.id}`}>
          <Link {...propsAcao} href={`/encomendas/${encomenda.id}/editar`}><Pencil className="h-4 w-4" /></Link>
        </Button>
      </td>
    </tr>
  );
}

function DetalhesPecasEncomenda({ encomenda, triggerClassName }: { encomenda: Order; triggerClassName: string }) {
  const [open, setOpen] = useState(false);
  const { data: itens } = useItensEncomenda(open ? encomenda.id : "");

  return (
    <PiecesDetailsDialog
      open={open}
      onOpenChange={setOpen}
      pieces={encomenda.pecas}
      title={`Peças da encomenda ${encomenda.id}`}
      description={`Detalhamento dos produtos e tamanhos reservados para ${encomenda.clienteNome}.`}
      items={itens ?? []}
      triggerClassName={triggerClassName}
    />
  );
}

function BotaoAcaoEncomenda({
  id,
  status,
  aoMover,
  propsAcao,
}: {
  id: string;
  status: StatusListaEncomenda;
  aoMover: (id: string, novoStatus: StatusListaEncomenda) => void;
  propsAcao: Record<string, unknown>;
}) {
  if (status === "Novo") {
    return (
      <button
        {...propsAcao}
        onClick={() => aoMover(id, "Em produção")}
        className="inline-flex h-10 w-36 items-center justify-center gap-2 rounded-md border border-primary/25 bg-primary/10 text-sm font-medium text-primary transition hover:bg-primary/15"
      >
        <Play className="h-4 w-4" />
        Iniciar
      </button>
    );
  }

  if (status === "Em produção") {
    return (
      <button
        {...propsAcao}
        onClick={() => aoMover(id, "Fabricado parcialmente")}
        className="inline-flex h-10 w-36 items-center justify-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
      >
        <CircleCheck className="h-4 w-4" />
        Concluir
      </button>
    );
  }

  if (status === "Fabricado parcialmente") {
    return (
      <button
        {...propsAcao}
        onClick={() => aoMover(id, "Pronta")}
        className="inline-flex h-10 w-36 items-center justify-center gap-2 rounded-md border border-[rgb(var(--partial))/0.35] bg-[rgb(var(--partial-soft))] text-sm font-medium text-[rgb(var(--partial-foreground))] transition hover:bg-[rgb(var(--partial-soft))/0.8]"
      >
        <CircleCheck className="h-4 w-4" />
        Concluir
      </button>
    );
  }

  if (status === "Pronta") {
    return (
      <Link
        {...propsAcao}
        href={`/vendas/nova?from=encomenda&id=${id}`}
        className="inline-flex h-10 w-36 items-center justify-center gap-2 rounded-md bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        <ShoppingCart className="h-4 w-4" />
        Vender
      </Link>
    );
  }

  if (status === "Entregue") {
    return (
      <span className="inline-flex h-10 w-36 items-center justify-center rounded-md bg-primary text-xs font-semibold uppercase tracking-wide text-primary-foreground">
        Já faturado
      </span>
    );
  }

  return <div className="h-10 w-36" />;
}
