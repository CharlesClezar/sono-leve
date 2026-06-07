import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { AppSelect } from "@/components/AppSelect";
import { ClearFiltersShortcutDialog } from "@/components/ClearFiltersShortcutDialog";
import { DataGrid, type GridColumnDef } from "@/components/DataGrid";
import { IndexedTabsNav } from "@/components/IndexedTabsNav";
import { PaginationFooter } from "@/components/PaginationFooter";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDataGrid } from "@/hooks/useDataGrid";
import { useIndexedTabs } from "@/hooks/useIndexedTabs";
import { usePagination, useServerPagination } from "@/hooks/usePagination";
import { formatBRL, type Product } from "@/lib/types";
import { api, useCatalogoProdutos, useProdutosPaginados, type CatalogSlug, type CategoriaCatalogo, type ColecaoCatalogo } from "@/lib/api";
import { ProdutoImagem } from "@/components/ProdutoImagem";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Info, Plus, Search } from "lucide-react";
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

  const colunasProdutos = useMemo<GridColumnDef<Product>[]>(
    () => [
      { id: "nome", label: "Nome", accessor: (p) => p.nome, render: (p) => <span className="font-medium">{p.nome}</span> },
      { id: "ref", label: "Ref.", accessor: (p) => p.ref, render: (p) => <span className="font-mono text-xs text-muted-foreground">{p.ref}</span> },
      { id: "marcaNome", label: "Marca", accessor: (p) => p.marcaNome ?? "" },
      { id: "tipo", label: "Tipo", accessor: (p) => `${p.tipoNome ?? ""} / ${p.subtipoNome ?? ""}`, render: (p) => <span className="text-muted-foreground">{p.tipoNome} / {p.subtipoNome}</span> },
      { id: "categoriaNome", label: "Categoria", accessor: (p) => p.categoriaNome ?? "", render: (p) => <span className="text-muted-foreground">{p.categoriaNome}</span> },
      { id: "colecaoNome", label: "Coleção", accessor: (p) => p.colecaoNome ?? "", render: (p) => <span className="text-muted-foreground">{p.colecaoNome}</span> },
      { id: "precoVarejo", label: "Varejo", accessor: (p) => p.precoVarejo, align: "right", render: (p) => formatBRL(p.precoVarejo) },
      { id: "precoAtacado", label: "Atacado", accessor: (p) => p.precoAtacado, align: "right", render: (p) => <span className="text-muted-foreground">{formatBRL(p.precoAtacado)}</span> },
      {
        id: "estoque", label: "Saldo", accessor: (p) => p.estoque,
        align: "center",
        render: (p) => <span className={`font-semibold ${p.estoque === 0 ? "text-destructive" : ""}`}>{p.estoque}</span>,
      },
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
  const colunasCategoria = useMemo<GridColumnDef<CategoriaCatalogo>[]>(
    () => [
      { id: "name", label: "Categoria", accessor: (item) => item.name, render: (item) => <span className="font-medium">{item.name}</span> },
      { id: "grade", label: "Grade", accessor: (item) => item.grade.join(", "), render: (item) => <span className="text-xs text-muted-foreground">{item.grade.join(", ")}</span> },
      { id: "products", label: "Produtos", accessor: (item) => item.products, align: "center" },
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
            <DataGrid
              grid={gridProdutos}
              columns={colunasProdutos}
              isLoading={carregandoProdutos}
              emptyMessage="Nenhum produto encontrado"
              editHref={(p) => `/produtos/${p.id}/editar?tab=Produtos`}
              leadingHeaderCell={<span />}
              leadingCell={(p) => <ProdutoImagem imagemUrl={p.imagemUrl} className="h-10 w-10 rounded object-cover" />}
              footer={<PaginationFooter pagination={paginacaoProdutos} />}
            />
          </div>
        )}

        {aba === "Categorias" && (
          <div {...indexedTabs.getTabPanelProps("Categorias")} className="space-y-4">
            <DataGrid
              grid={gridCategoria}
              columns={colunasCategoria}
              isLoading={carregandoCatalogo}
              emptyMessage="Nenhuma categoria cadastrada"
              editHref={(item) => `/produtos/catalogo/categorias/${item.id}/editar?tab=Categorias`}
              onDelete={async (item) => { if (item.id) await handleExcluir("categorias", String(item.id)); }}
              footer={<PaginationFooter pagination={paginacaoCategoria} />}
            />

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

type ItemCatalogo = { id?: string; name: string; products: number; active: boolean; grade?: string[] };
type OnExcluir = (tipo: CatalogSlug, id: string) => Promise<void>;

function TabelaCatalogoSimples({
  linhas, rotuloNome, rotuloMeio = "Produtos", chaveMeio = "products", sinalLimparFiltros, tipo, aba, onExcluir, carregando = false,
}: {
  linhas: ItemCatalogo[];
  rotuloNome: string; rotuloMeio?: string; chaveMeio?: string; sinalLimparFiltros: number;
  tipo: CatalogSlug; aba: AbaProduto; onExcluir: OnExcluir; carregando?: boolean;
}) {
  const colunas = useMemo<GridColumnDef<ItemCatalogo>[]>(
    () => [
      { id: "name", label: rotuloNome, accessor: (item) => item.name, render: (item) => <span className="font-medium">{item.name}</span> },
      {
        id: chaveMeio, label: rotuloMeio, accessor: (item) => item[chaveMeio as keyof ItemCatalogo] as string ?? "",
        align: chaveMeio === "products" ? "center" : "left",
        render: (item) => <span className="text-muted-foreground">{item[chaveMeio as keyof ItemCatalogo] as string}</span>,
      },
    ],
    [chaveMeio, rotuloMeio, rotuloNome],
  );
  const grid = useDataGrid(linhas, colunas);
  useEffect(() => { grid.clearFilters(); }, [sinalLimparFiltros]);
  const paginacao = usePagination(grid.rows);
  const editHref = useCallback(
    (item: ItemCatalogo) => `/produtos/catalogo/${tipo}/${item.id}/editar?tab=${aba}`,
    [tipo, aba],
  );
  const handleDelete = useCallback(
    async (item: ItemCatalogo) => { if (item.id) await onExcluir(tipo, item.id); },
    [tipo, onExcluir],
  );

  return (
    <DataGrid
      grid={grid}
      columns={colunas}
      isLoading={carregando}
      emptyMessage="Nenhum registro cadastrado"
      editHref={editHref}
      onDelete={handleDelete}
      footer={<PaginationFooter pagination={paginacao} />}
    />
  );
}

function TabelaColecoes({ linhas, sinalLimparFiltros, aba, onExcluir, carregando = false }: { linhas: ColecaoCatalogo[]; sinalLimparFiltros: number; aba: AbaProduto; onExcluir: OnExcluir; carregando?: boolean }) {
  const colunas = useMemo<GridColumnDef<ColecaoCatalogo>[]>(
    () => [
      { id: "name", label: "Coleção", accessor: (item) => item.name, render: (item) => <span className="font-medium">{item.name}</span> },
      {
        id: "periodo", label: "Período", accessor: (item) => formatarDataColecao(item.dataInicio, item.dataFim),
        render: (item) => <span className="text-muted-foreground">{formatarDataColecao(item.dataInicio, item.dataFim)}</span>,
      },
      { id: "products", label: "Produtos", accessor: (item) => item.products, align: "center" },
    ],
    [],
  );
  const grid = useDataGrid(linhas, colunas);
  useEffect(() => { grid.clearFilters(); }, [sinalLimparFiltros]);
  const paginacao = usePagination(grid.rows);
  const editHref = useCallback((item: ColecaoCatalogo) => `/produtos/catalogo/colecoes/${item.id}/editar?tab=${aba}`, [aba]);
  const handleDelete = useCallback(async (item: ColecaoCatalogo) => { if (item.id) await onExcluir("colecoes", item.id); }, [onExcluir]);

  return (
    <DataGrid
      grid={grid}
      columns={colunas}
      isLoading={carregando}
      emptyMessage="Nenhuma coleção cadastrada"
      editHref={editHref}
      onDelete={handleDelete}
      footer={<PaginationFooter pagination={paginacao} />}
    />
  );
}
