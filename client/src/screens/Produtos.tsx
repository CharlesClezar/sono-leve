import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { useDataGrid, type DataGridColumn } from "@/hooks/useDataGrid";
import { useIndexedTabs } from "@/hooks/useIndexedTabs";
import { usePagination, useServerPagination } from "@/hooks/usePagination";
import { formatBRL, type Product } from "@/lib/types";
import { api, useCatalogoProdutos, useProdutosPaginados, type CatalogSlug, type CategoriaCatalogo, type ColecaoCatalogo } from "@/lib/api";
import { BASE_URL } from "@/lib/http";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TableSkeleton } from "@/components/TableSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { Info, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

const abas = [
  "Produtos",
  "Categorias",
  "Marcas",
  "Tipos",
  "Subtipos",
  "Coleções",
] as const;
type AbaProduto = (typeof abas)[number];

const rotuloCriar: Record<AbaProduto, string> = {
  Produtos: "Novo produto",
  Categorias: "Nova categoria",
  Marcas: "Nova marca",
  Tipos: "Novo tipo",
  Subtipos: "Novo subtipo",
  Coleções: "Nova coleção",
};

const hrefCriarCatalogo: Record<AbaProduto, string> = {
  Produtos: "/produtos/novo",
  Categorias: "/produtos/catalogo/categorias/novo",
  Marcas: "/produtos/catalogo/marcas/novo",
  Tipos: "/produtos/catalogo/tipos/novo",
  Subtipos: "/produtos/catalogo/subtipos/novo",
  Coleções: "/produtos/catalogo/colecoes/novo",
};

const tooltipsPorAba: Record<AbaProduto, string> = {
  Produtos: "Peças vendidas pela loja. Cada produto pertence a uma marca, tipo, subtipo e categoria.",
  Categorias: "Define a grade de tamanhos dos produtos. Todo produto herda a grade da sua categoria.",
  Marcas: "Identidade comercial do produto — quem assina a peça. Permite agrupar e filtrar por marca.",
  Tipos: "Classificação macro do produto (ex: Camisola, Conjunto, Pantufa).",
  Subtipos: "Detalhamento do tipo (ex: Alça, Regata, Manga Curta, Manga Longa).",
  Coleções: "Agrupamento comercial ou sazonal (ex: Verão 2026, Dia das Mães). Não impacta regras operacionais.",
};

const abaParaTipo: Partial<Record<AbaProduto, CatalogSlug>> = {
  Categorias: "categorias",
  Marcas: "marcas",
  Tipos: "tipos",
  Subtipos: "subtipos",
  "Coleções": "colecoes",
};

function formatarDataColecao(dataInicio?: string, dataFim?: string): string {
  if (!dataInicio && !dataFim) return "—";
  const fmt = (d: string) => {
    const [ano, mes, dia] = d.split("-");
    return `${dia}/${mes}/${ano}`;
  };
  if (dataInicio && dataFim) return `${fmt(dataInicio)} – ${fmt(dataFim)}`;
  if (dataInicio) return `Início: ${fmt(dataInicio)}`;
  return `Até: ${fmt(dataFim!)}`;
}

export default function Produtos() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { data: catalogo = { categorias: [], marcas: [], tipos: [], subtipos: [], colecoes: [] }, isLoading: carregandoCatalogo } = useCatalogoProdutos();
  const { categorias, marcas, tipos, subtipos, colecoes } = catalogo;
  const [aba, setAba] = useState<AbaProduto>(() => {
    const tab = searchParams.get("tab");
    return (tab && (abas as readonly string[]).includes(tab)) ? tab as AbaProduto : "Produtos";
  });
  const syncAba = useCallback((novaAba: AbaProduto) => {
    setAba(novaAba);
    router.replace(`/produtos?tab=${novaAba}`, { scroll: false });
  }, [router]);
  const indexedTabs = useIndexedTabs({ tabs: abas, onTabChange: syncAba });
  const [busca, setBusca] = useState("");
  const [marcaSelecionada, setMarcaSelecionada] = useState("all");
  const [filtroAtivo, setFiltroAtivo] = useState("all");
  const [page, setPage] = useState(1);
  const [sinalLimparFiltros, setSinalLimparFiltros] = useState(0);

  const { data: responseProdutos, isLoading: carregandoProdutos } = useProdutosPaginados({
    search: busca || undefined,
    marca: marcaSelecionada !== "all" ? marcaSelecionada : undefined,
    ativo: filtroAtivo === "active" ? true : filtroAtivo === "inactive" ? false : undefined,
    page,
    pageSize: 30,
  });

  const nomesMarcas = useMemo(() => marcas.map((item) => item.name), [marcas]);
  const colunasProdutos = useMemo<DataGridColumn<Product>[]>(
    () => [
      { id: "nome", label: "Nome", accessor: (p) => p.nome },
      { id: "ref", label: "Ref.", accessor: (p) => p.ref },
      { id: "marcaNome", label: "Marca", accessor: (p) => p.marcaNome ?? "" },
      { id: "tipo", label: "Tipo", accessor: (p) => `${p.tipoNome ?? ""} / ${p.subtipoNome ?? ""}` },
      { id: "categoriaNome", label: "Categoria", accessor: (p) => p.categoriaNome ?? "" },
      { id: "colecaoNome", label: "Coleção", accessor: (p) => p.colecaoNome ?? "" },
      { id: "precoVarejo", label: "Varejo", accessor: (p) => p.precoVarejo },
      { id: "precoAtacado", label: "Atacado", accessor: (p) => p.precoAtacado },
      { id: "estoque", label: "Saldo", accessor: (p) => p.estoque },
    ],
    [],
  );

  const handleExcluir = async (tipo: CatalogSlug, id: string) => {
    try {
      await api.excluirCatalogoProduto(tipo, id);
      await queryClient.invalidateQueries({ queryKey: ["catalogo-produtos"] });
      toast.success("Cadastro excluído com sucesso.");
    } catch {
      toast.error("Não foi possível excluir o cadastro.");
    }
  };

  const gridProdutos = useDataGrid(responseProdutos?.data ?? [], colunasProdutos);
  const paginacaoProdutos = useServerPagination(responseProdutos, setPage);
  const colunasCategoria = useMemo<DataGridColumn<CategoriaCatalogo>[]>(
    () => [
      { id: "name", label: "Categoria", accessor: (item) => item.name },
      { id: "grade", label: "Grade", accessor: (item) => item.grade.join(", ") },
      { id: "products", label: "Produtos", accessor: (item) => item.products },
    ],
    [],
  );
  const gridCategoria = useDataGrid(categorias, colunasCategoria);
  const paginacaoCategoria = usePagination(gridCategoria.rows);
  const renderizarPainel = (abaAtual: AbaProduto, conteudo: ReactNode) => (
    <div {...indexedTabs.getTabPanelProps(abaAtual)} className="space-y-4">
      {conteudo}
    </div>
  );

  return (
    <AppShell>
      <ClearFiltersShortcutDialog
        onConfirm={() => {
          setBusca("");
          setMarcaSelecionada("all");
          setFiltroAtivo("all");
          setPage(1);
          gridProdutos.clearFilters();
          gridCategoria.clearFilters();
          setSinalLimparFiltros((atual) => atual + 1);
        }}
      />
      <PageHeader
        breadcrumb={["Produtos", aba]}
        title="Produtos"
        infoTooltip="Organiza cadastro de produtos, categorias, marcas e demais estruturas do catálogo."
        actions={
          aba === "Produtos" ? (
            <Button asChild>
              <Link href={`/produtos/novo?tab=Produtos`}><Plus className="mr-1.5 h-4 w-4" />Novo produto</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href={`${hrefCriarCatalogo[aba]}?tab=${aba}`}><Plus className="mr-1.5 h-4 w-4" />{rotuloCriar[aba]}</Link>
            </Button>
          )
        }
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="shrink-0 space-y-4 border-b px-6 py-4">
          <TooltipProvider delayDuration={300}>
            <IndexedTabsNav
              tabs={abas}
              activeTab={aba}
              onSelect={syncAba}
              getTabButtonProps={indexedTabs.getTabButtonProps}
              getShortcutLabel={indexedTabs.getShortcutLabel}
              className="flex gap-1 overflow-x-auto border-b"
              listClassName="flex min-w-max gap-1"
              buttonClassName="relative flex items-center gap-1 px-4 py-2 text-sm font-medium leading-tight transition"
              activeClassName="text-primary"
              inactiveClassName="text-muted-foreground hover:text-foreground"
              renderAccessory={(tab) => (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-0.5 flex cursor-default items-center text-current/40 hover:text-current/70">
                      <Info className="h-3 w-3" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[220px] text-center text-xs">
                    {tooltipsPorAba[tab]}
                  </TooltipContent>
                </Tooltip>
              )}
            />
          </TooltipProvider>

          {aba === "Produtos" && (
            <Card className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar por nome, referência, marca, tipo, subtipo ou categoria" className="pl-9" value={busca} onChange={(e) => { setBusca(e.target.value); setPage(1); }} />
                </div>
                <AppSelect className="w-[170px]" value={marcaSelecionada} onValueChange={(v) => { setMarcaSelecionada(v); setPage(1); }} options={[{ value: "all", label: "Todas marcas" }, ...nomesMarcas.map((nome) => ({ value: nome, label: nome }))]} />
                <AppSelect className="w-[130px]" value={filtroAtivo} onValueChange={(v) => { setFiltroAtivo(v); setPage(1); }} options={[{ value: "all", label: "Todos" }, { value: "active", label: "Ativos" }, { value: "inactive", label: "Inativos" }]} />
              </div>
            </Card>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
        {aba === "Produtos" && (
          <div {...indexedTabs.getTabPanelProps("Produtos")} className="space-y-4">
            <Card className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="w-14 px-4 py-3" />
                    {colunasProdutos.map((coluna) => (
                      <DataGridColumnHeader
                        key={coluna.id}
                        grid={gridProdutos}
                        columnId={coluna.id}
                        label={coluna.label}
                        align={["precoVarejo", "precoAtacado"].includes(coluna.id) ? "right" : coluna.id === "estoque" ? "center" : "left"}
                      />
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {carregandoProdutos ? (
                    <TableSkeleton cols={11} />
                  ) : paginacaoProdutos.items.length === 0 ? (
                    <tr><td colSpan={11} className="px-4 py-12 text-center text-sm text-muted-foreground">Nenhum produto encontrado</td></tr>
                  ) : paginacaoProdutos.items.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        {p.imagemUrl ? (
                          <img src={`${BASE_URL}${p.imagemUrl}`} alt="" className="h-10 w-10 rounded object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted" />
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">{p.nome}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.ref}</td>
                      <td className="px-4 py-3">{p.marcaNome}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.tipoNome} / {p.subtipoNome}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.categoriaNome}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.colecaoNome}</td>
                      <td className="px-4 py-3 text-right">{formatBRL(p.precoVarejo)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{formatBRL(p.precoAtacado)}</td>
                      <td className={`px-4 py-3 text-center font-semibold ${p.estoque === 0 ? "text-destructive" : ""}`}>{p.estoque}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" asChild aria-label={`Editar ${p.nome}`}>
                          <Link {...indexedTabs.getActionProps("Produtos")} href={`/produtos/${p.id}/editar?tab=Produtos`}><Pencil className="h-4 w-4" /></Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <PaginationFooter pagination={paginacaoProdutos} />
            </Card>
          </div>
        )}

        {aba === "Categorias" && (
          <div {...indexedTabs.getTabPanelProps("Categorias")} className="space-y-4">
            <Card className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    {colunasCategoria.map((coluna) => (
                      <DataGridColumnHeader key={coluna.id} grid={gridCategoria} columnId={coluna.id} label={coluna.label} align={coluna.id === "products" ? "center" : "left"} />
                    ))}
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {carregandoCatalogo ? (
                    <TableSkeleton cols={4} />
                  ) : paginacaoCategoria.items.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">Nenhuma categoria cadastrada</td></tr>
                  ) : paginacaoCategoria.items.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{item.grade.join(", ")}</td>
                      <td className="px-4 py-3 text-center">{item.products}</td>
                      <td className="px-4 py-3 text-right">
                        <BotoesAcaoCatalogo item={item} tipo="categorias" aba={aba} onExcluir={handleExcluir} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <PaginationFooter pagination={paginacaoCategoria} />
            </Card>

            <Card className="p-5">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Grade por categoria</h3>
              <div className="space-y-4">
                {carregandoCatalogo ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-md border p-4 space-y-3">
                      <Skeleton className="h-4 w-36" />
                      <div className="flex gap-2">{Array.from({ length: 4 }).map((_, j) => <Skeleton key={j} className="h-7 w-14 rounded-md" />)}</div>
                    </div>
                  ))
                ) : categorias.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada.</p>
                ) : categorias.map((item) => (
                  <div key={item.id} className="rounded-md border p-4">
                    <div className="mb-3 font-medium">{item.name}</div>
                    <div className="flex flex-wrap gap-2">
                      {item.grade.map((tamanho, index) => (
                        <span key={tamanho} className="rounded-md bg-muted px-3 py-1 text-sm">{index + 1}. {tamanho}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {aba === "Marcas" && renderizarPainel("Marcas", <TabelaCatalogoSimples linhas={marcas} rotuloNome="Marca" sinalLimparFiltros={sinalLimparFiltros} tipo="marcas" aba={aba} onExcluir={handleExcluir} carregando={carregandoCatalogo} />)}
        {aba === "Tipos" && renderizarPainel("Tipos", <TabelaCatalogoSimples linhas={tipos} rotuloNome="Tipo" rotuloMeio="Produtos" chaveMeio="products" sinalLimparFiltros={sinalLimparFiltros} tipo="tipos" aba={aba} onExcluir={handleExcluir} carregando={carregandoCatalogo} />)}
        {aba === "Subtipos" && renderizarPainel("Subtipos", <TabelaCatalogoSimples linhas={subtipos} rotuloNome="Subtipo" sinalLimparFiltros={sinalLimparFiltros} tipo="subtipos" aba={aba} onExcluir={handleExcluir} carregando={carregandoCatalogo} />)}
        {aba === "Coleções" && renderizarPainel("Coleções", <TabelaColecoes linhas={colecoes} sinalLimparFiltros={sinalLimparFiltros} aba={aba} onExcluir={handleExcluir} carregando={carregandoCatalogo} />)}
        </div>
      </div>
    </AppShell>
  );
}

type ItemCatalogo = { id?: string; name: string; products: number; active: boolean; subtypes?: number; grade?: string[] };
type OnExcluir = (tipo: CatalogSlug, id: string) => Promise<void>;

function BotoesAcaoCatalogo({ item, tipo, aba, onExcluir }: { item: ItemCatalogo; tipo: CatalogSlug; aba: AbaProduto; onExcluir: OnExcluir }) {
  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  if (!item.id) return null;
  const editHref = `/produtos/catalogo/${tipo}/${item.id}/editar${aba ? `?tab=${aba}` : ""}`;

  const aoExcluir = async () => {
    if (!confirmando) { setConfirmando(true); return; }
    setExcluindo(true);
    await onExcluir(tipo, item.id!);
    setExcluindo(false);
    setConfirmando(false);
  };

  if (confirmando) {
    return (
      <div className="flex items-center justify-end gap-1">
        <span className="mr-1 text-xs text-muted-foreground">Confirmar?</span>
        <Button variant="destructive" size="sm" className="h-7 px-2 text-xs" onClick={aoExcluir} disabled={excluindo}>
          {excluindo ? "..." : "Excluir"}
        </Button>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setConfirmando(false)}>
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Button variant="ghost" size="icon" asChild aria-label={`Editar ${item.name}`}>
        <Link href={editHref}><Pencil className="h-4 w-4" /></Link>
      </Button>
      <Button variant="ghost" size="icon" onClick={aoExcluir} aria-label={`Excluir ${item.name}`} className="text-muted-foreground hover:text-destructive">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function TabelaCatalogoSimples({
  linhas, rotuloNome, rotuloMeio = "Produtos", chaveMeio = "products", sinalLimparFiltros, tipo, aba, onExcluir, carregando = false,
}: {
  linhas: ItemCatalogo[];
  rotuloNome: string; rotuloMeio?: string; chaveMeio?: string; sinalLimparFiltros: number;
  tipo: CatalogSlug; aba: AbaProduto; onExcluir: OnExcluir; carregando?: boolean;
}) {
  const colunas = useMemo<DataGridColumn<ItemCatalogo>[]>(
    () => [
      { id: "name", label: rotuloNome, accessor: (item) => item.name },
      { id: chaveMeio, label: rotuloMeio, accessor: (item) => item[chaveMeio as keyof ItemCatalogo] as string ?? "" },
    ],
    [chaveMeio, rotuloMeio, rotuloNome],
  );
  const grid = useDataGrid(linhas, colunas);
  useEffect(() => { grid.clearFilters(); }, [sinalLimparFiltros]);
  const paginacao = usePagination(grid.rows);

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {colunas.map((coluna) => (
              <DataGridColumnHeader key={coluna.id} grid={grid} columnId={coluna.id} label={coluna.label} align={coluna.id === "products" || coluna.id === "subtypes" ? "center" : "left"} />
            ))}
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {carregando ? (
            <TableSkeleton cols={3} />
          ) : paginacao.items.length === 0 ? (
            <tr><td colSpan={3} className="px-4 py-12 text-center text-sm text-muted-foreground">Nenhum registro cadastrado</td></tr>
          ) : paginacao.items.map((item) => (
            <tr key={item.id ?? item.name} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">{item.name}</td>
              <td className={`px-4 py-3 text-muted-foreground ${chaveMeio === "products" || chaveMeio === "subtypes" ? "text-center" : ""}`}>
                {item[chaveMeio as keyof ItemCatalogo] as string}
              </td>
              <td className="px-4 py-3">
                <BotoesAcaoCatalogo item={item} tipo={tipo} aba={aba} onExcluir={onExcluir} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <PaginationFooter pagination={paginacao} />
    </Card>
  );
}

function TabelaColecoes({ linhas, sinalLimparFiltros, aba, onExcluir, carregando = false }: { linhas: ColecaoCatalogo[]; sinalLimparFiltros: number; aba: AbaProduto; onExcluir: OnExcluir; carregando?: boolean }) {
  const colunas = useMemo<DataGridColumn<ColecaoCatalogo>[]>(
    () => [
      { id: "name", label: "Coleção", accessor: (item) => item.name },
      { id: "periodo", label: "Período", accessor: (item) => formatarDataColecao(item.dataInicio, item.dataFim) },
      { id: "products", label: "Produtos", accessor: (item) => item.products },
    ],
    [],
  );
  const grid = useDataGrid(linhas, colunas);
  useEffect(() => { grid.clearFilters(); }, [sinalLimparFiltros]);
  const paginacao = usePagination(grid.rows);

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {colunas.map((coluna) => (
              <DataGridColumnHeader key={coluna.id} grid={grid} columnId={coluna.id} label={coluna.label} align={coluna.id === "products" ? "center" : "left"} />
            ))}
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {carregando ? (
            <TableSkeleton cols={4} />
          ) : paginacao.items.length === 0 ? (
            <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">Nenhuma coleção cadastrada</td></tr>
          ) : paginacao.items.map((item) => (
            <tr key={item.id} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">{item.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatarDataColecao(item.dataInicio, item.dataFim)}</td>
              <td className="px-4 py-3 text-center">{item.products}</td>
              <td className="px-4 py-3">
                <BotoesAcaoCatalogo item={item} tipo="colecoes" aba={aba} onExcluir={onExcluir} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <PaginationFooter pagination={paginacao} />
    </Card>
  );
}
