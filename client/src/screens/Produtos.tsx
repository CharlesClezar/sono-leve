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
import { usePagination } from "@/hooks/usePagination";
import { formatBRL, type Product } from "@/lib/types";
import { api, useCatalogoProdutos, useProdutos, type CatalogSlug, type CategoriaCatalogo, type SubtipoCatalogo, type TipoCatalogo } from "@/lib/api";
import { BASE_URL } from "@/lib/http";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TableSkeleton } from "@/components/TableSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { Info, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

const abas = [
  "Produtos",
  "Categorias",
  "Grades",
  "Marcas",
  "Tipos",
  "Subtipos",
  "Coleções",
  "Modelos",
] as const;
type AbaProduto = (typeof abas)[number];

const rotuloCriar: Record<AbaProduto, string> = {
  Produtos: "Novo produto",
  Categorias: "Nova categoria",
  Grades: "Nova grade",
  Marcas: "Nova marca",
  Tipos: "Novo tipo",
  Subtipos: "Novo subtipo",
  Coleções: "Nova coleção",
  Modelos: "Novo modelo",
};

const hrefCriarCatalogo: Record<AbaProduto, string> = {
  Produtos: "/produtos/novo",
  Categorias: "/produtos/catalogo/categorias/novo",
  Grades: "/produtos/catalogo/grades/novo",
  Marcas: "/produtos/catalogo/marcas/novo",
  Tipos: "/produtos/catalogo/tipos/novo",
  Subtipos: "/produtos/catalogo/subtipos/novo",
  Coleções: "/produtos/catalogo/colecoes/novo",
  Modelos: "/produtos/catalogo/modelos/novo",
};

const tooltipsPorAba: Record<AbaProduto, string> = {
  Produtos: "Peças vendidas pela loja. Cada produto pertence a uma marca, tipo, subtipo e categoria.",
  Categorias: "Define a grade de tamanhos dos produtos. Todo produto herda a grade da sua categoria.",
  Grades: "Tamanhos disponíveis por categoria (ex: P, M, G, GG). Herdados automaticamente pelos produtos.",
  Marcas: "Identidade comercial do produto — quem assina a peça. Permite agrupar e filtrar por marca.",
  Tipos: "Classificação macro do produto (ex: Curto, Longo). Serve como base para os subtipos.",
  Subtipos: "Detalhamento do tipo (ex: Camisola de alça, Conjunto de regata). Deve estar vinculado a um tipo.",
  Coleções: "Agrupamento comercial ou sazonal (ex: Verão 2026, Dia das Mães). Não impacta regras operacionais.",
  Modelos: "Identificação base da peça — nome ou design (ex: Aurora, Luna). Facilita reconhecimento comercial.",
};

const categoriasFallback: CategoriaCatalogo[] = [
  { id: "cat-adulto-masc", name: "Adulto Masculino", grade: ["P", "M", "G", "GG"],                products: 0, active: true },
  { id: "cat-adulto-fem",  name: "Adulto Feminino",  grade: ["P", "M", "G", "GG"],                products: 0, active: true },
  { id: "cat-infantil",    name: "Infantil",          grade: ["2", "4", "6", "8", "10", "12"],    products: 0, active: true },
  { id: "cat-pantufas",    name: "Pantufas",          grade: ["34/35", "36/37", "38/39", "40/41"], products: 0, active: true },
];

const marcasFallback = [
  { id: "marca-sono-leve",  name: "Sono Leve",        products: 0, active: true },
  { id: "marca-clelia",     name: "Clelia Anastácio", products: 0, active: true },
  { id: "marca-thaina",     name: "Thainá Reichen",   products: 0, active: true },
  { id: "marca-ronca",      name: "Ronca&Fuça",       products: 0, active: true },
];

const tiposFallback: TipoCatalogo[] = [
  { id: "tipo-curto", name: "Curto", subtypes: 3, products: 0, active: true },
  { id: "tipo-longo", name: "Longo", subtypes: 2, products: 0, active: true },
];

const subtipsFallback: SubtipoCatalogo[] = [
  { id: "sub-camisola-alca", name: "Camisola de alça", type: "Curto", products: 0, active: true },
  { id: "sub-conjunto-regata", name: "Conjunto de regata", type: "Curto", products: 0, active: true },
  { id: "sub-camisola-manga-longa", name: "Camisola de manga longa", type: "Longo", products: 0, active: true },
];

const colecoesFallback = [
  { id: "col-verao-2026", name: "Verão 2026", period: "Sazonal", products: 0, active: true },
  { id: "col-basica", name: "Linha Básica", period: "Contínua", products: 0, active: true },
  { id: "col-maes", name: "Dia das Mães", period: "Campanha", products: 0, active: false },
];

const modelosFallback = [
  { id: "mod-aurora", name: "Aurora", products: 0, active: true },
  { id: "mod-luna", name: "Luna", products: 0, active: true },
  { id: "mod-soft", name: "Soft", products: 0, active: true },
];

const abaParaTipo: Partial<Record<AbaProduto, CatalogSlug>> = {
  Categorias: "categorias",
  Grades: "categorias",
  Marcas: "marcas",
  Tipos: "tipos",
  Subtipos: "subtipos",
  "Coleções": "colecoes",
  Modelos: "modelos",
};

export default function Produtos() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { data: produtos = [], isLoading: carregandoProdutos } = useProdutos();
  const { data: catalogo = { categorias: [], marcas: [], tipos: [], subtipos: [], colecoes: [], modelos: [] }, isLoading: carregandoCatalogo } = useCatalogoProdutos();
  const categorias = catalogo.categorias.length > 0 ? catalogo.categorias : categoriasFallback;
  const marcas = catalogo.marcas.length > 0 ? catalogo.marcas : marcasFallback;
  const tipos = catalogo.tipos.length > 0 ? catalogo.tipos : tiposFallback;
  const subtipos = catalogo.subtipos.length > 0 ? catalogo.subtipos : subtipsFallback;
  const colecoes = catalogo.colecoes.length > 0 ? catalogo.colecoes : colecoesFallback;
  const modelos = catalogo.modelos.length > 0 ? catalogo.modelos : modelosFallback;
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
  const [sinalLimparFiltros, setSinalLimparFiltros] = useState(0);

  const nomesMarcas = useMemo(() => marcas.map((item) => item.name), [marcas]);
  const colunasProdutos = useMemo<DataGridColumn<Product>[]>(
    () => [
      { id: "nome", label: "Nome", accessor: (p) => p.nome },
      { id: "ref", label: "Ref.", accessor: (p) => p.ref },
      { id: "marcaNome", label: "Marca", accessor: (p) => p.marcaNome ?? "" },
      { id: "tipo", label: "Tipo", accessor: (p) => `${p.tipoNome ?? ""} / ${p.subtipoNome ?? ""}` },
      { id: "categoriaNome", label: "Categoria", accessor: (p) => p.categoriaNome ?? "" },
      { id: "colecaoNome", label: "Coleção", accessor: (p) => p.colecaoNome ?? "" },
      { id: "modeloNome", label: "Modelo", accessor: (p) => p.modeloNome ?? "" },
      { id: "precoVarejo", label: "Varejo", accessor: (p) => p.precoVarejo },
      { id: "precoAtacado", label: "Atacado", accessor: (p) => p.precoAtacado },
      { id: "estoque", label: "Saldo", accessor: (p) => p.estoque },
    ],
    [],
  );

  const produtosFiltrados = useMemo(
    () =>
      produtos.filter((p) => {
        if (marcaSelecionada !== "all" && p.marcaNome !== marcaSelecionada) return false;
        if (filtroAtivo === "active" && !p.ativo) return false;
        if (filtroAtivo === "inactive" && p.ativo) return false;
        if (busca) {
          const q = busca.toLowerCase();
          const coincide =
            p.nome.toLowerCase().includes(q) ||
            p.ref.toLowerCase().includes(q) ||
            (p.marcaNome ?? "").toLowerCase().includes(q) ||
            (p.tipoNome ?? "").toLowerCase().includes(q) ||
            (p.subtipoNome ?? "").toLowerCase().includes(q) ||
            (p.categoriaNome ?? "").toLowerCase().includes(q) ||
            (p.colecaoNome ?? "").toLowerCase().includes(q) ||
            (p.modeloNome ?? "").toLowerCase().includes(q);

          if (!coincide) return false;
        }
        return true;
      }),
    [produtos, busca, marcaSelecionada, filtroAtivo]
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

  const gridProdutos = useDataGrid(produtosFiltrados, colunasProdutos);
  const paginacaoProdutos = usePagination(gridProdutos.rows);
  const colunasCategoria = useMemo<DataGridColumn<CategoriaCatalogo>[]>(
    () => [
      { id: "name", label: "Categoria", accessor: (item) => item.name },
      { id: "grade", label: "Grade herdada", accessor: (item) => item.grade.join(", ") },
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
          gridProdutos.clearFilters();
          gridCategoria.clearFilters();
          setSinalLimparFiltros((atual) => atual + 1);
        }}
      />
      <PageHeader
        breadcrumb={["Produtos", aba]}
        title="Produtos"
        infoTooltip="Organiza cadastro de produtos, categorias, grades, marcas e demais estruturas do catálogo."
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
                  <Input placeholder="Buscar por nome, referência, marca, tipo, subtipo ou categoria" className="pl-9" value={busca} onChange={(e) => setBusca(e.target.value)} />
                </div>
                <AppSelect className="w-[170px]" value={marcaSelecionada} onValueChange={setMarcaSelecionada} options={[{ value: "all", label: "Todas marcas" }, ...nomesMarcas.map((nome) => ({ value: nome, label: nome }))]} />
                <AppSelect className="w-[130px]" value={filtroAtivo} onValueChange={setFiltroAtivo} options={[{ value: "all", label: "Todos" }, { value: "active", label: "Ativos" }, { value: "inactive", label: "Inativos" }]} />
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
                    <TableSkeleton cols={12} />
                  ) : paginacaoProdutos.items.length === 0 ? (
                    <tr><td colSpan={12} className="px-4 py-12 text-center text-sm text-muted-foreground">Nenhum produto encontrado</td></tr>
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
                      <td className="px-4 py-3 text-muted-foreground">{p.modeloNome}</td>
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
                  ) : paginacaoCategoria.items.map((item) => (
                    <tr key={item.name} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.grade.join(", ")}</td>
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
          </div>
        )}

        {aba === "Grades" && renderizarPainel("Grades", (
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
              ) : categorias.map((item) => (
                <div key={item.name} className="rounded-md border p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="font-medium">{item.name}</div>
                    {item.id && (
                      <BotoesAcaoCatalogo item={item} tipo="categorias" aba={aba} onExcluir={handleExcluir} />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.grade.map((tamanho, index) => (
                      <span key={tamanho} className="rounded-md bg-muted px-3 py-1 text-sm">{index + 1}. {tamanho}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}

        {aba === "Marcas" && renderizarPainel("Marcas", <TabelaCatalogoSimples linhas={marcas} rotuloNome="Marca" sinalLimparFiltros={sinalLimparFiltros} tipo="marcas" aba={aba} onExcluir={handleExcluir} carregando={carregandoCatalogo} />)}
        {aba === "Tipos" && renderizarPainel("Tipos", <TabelaCatalogoSimples linhas={tipos} rotuloNome="Tipo" rotuloMeio="Subtipos" chaveMeio="subtypes" sinalLimparFiltros={sinalLimparFiltros} tipo="tipos" aba={aba} onExcluir={handleExcluir} carregando={carregandoCatalogo} />)}
        {aba === "Subtipos" && renderizarPainel("Subtipos", <TabelaSubtipos linhas={subtipos} sinalLimparFiltros={sinalLimparFiltros} aba={aba} onExcluir={handleExcluir} carregando={carregandoCatalogo} />)}
        {aba === "Coleções" && renderizarPainel("Coleções", <TabelaCatalogoSimples linhas={colecoes} rotuloNome="Coleção" rotuloMeio="Período" chaveMeio="period" sinalLimparFiltros={sinalLimparFiltros} tipo="colecoes" aba={aba} onExcluir={handleExcluir} carregando={carregandoCatalogo} />)}
        {aba === "Modelos" && renderizarPainel("Modelos", <TabelaCatalogoSimples linhas={modelos} rotuloNome="Modelo" sinalLimparFiltros={sinalLimparFiltros} tipo="modelos" aba={aba} onExcluir={handleExcluir} carregando={carregandoCatalogo} />)}
        </div>
      </div>
    </AppShell>
  );
}

type ItemCatalogo = { id?: string; name: string; products: number; active: boolean; subtypes?: number; period?: string; grade?: string[] };
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
          ) : paginacao.items.map((item) => (
            <tr key={String(item.name)} className="hover:bg-muted/30">
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

function TabelaSubtipos({ linhas, sinalLimparFiltros, aba, onExcluir, carregando = false }: { linhas: SubtipoCatalogo[]; sinalLimparFiltros: number; aba: AbaProduto; onExcluir: OnExcluir; carregando?: boolean }) {
  const colunas = useMemo<DataGridColumn<SubtipoCatalogo>[]>(
    () => [
      { id: "name", label: "Subtipo", accessor: (item) => item.name },
      { id: "type", label: "Tipo vinculado", accessor: (item) => item.type },
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
          ) : paginacao.items.map((item) => (
            <tr key={item.name} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">{item.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{item.type}</td>
              <td className="px-4 py-3 text-center">{item.products}</td>
              <td className="px-4 py-3">
                <BotoesAcaoCatalogo item={item} tipo="subtipos" aba={aba} onExcluir={onExcluir} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <PaginationFooter pagination={paginacao} />
    </Card>
  );
}
