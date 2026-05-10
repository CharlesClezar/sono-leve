import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
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
import { useCatalogoProdutos, useProdutos, type CategoriaCatalogo, type SubtipoCatalogo, type TipoCatalogo } from "@/lib/api";
import { Pencil, Plus, Search } from "lucide-react";

const tabs = [
  "Produtos",
  "Categorias",
  "Grades",
  "Marcas",
  "Tipos",
  "Subtipos",
  "Coleções",
  "Modelos",
] as const;
type ProductTab = (typeof tabs)[number];

const actionLabels: Record<ProductTab, string> = {
  Produtos: "Novo produto",
  Categorias: "Nova categoria",
  Grades: "Nova grade",
  Marcas: "Nova marca",
  Tipos: "Novo tipo",
  Subtipos: "Novo subtipo",
  Coleções: "Nova coleção",
  Modelos: "Novo modelo",
};

const catalogCreateHref: Record<ProductTab, string> = {
  Produtos: "/produtos/novo",
  Categorias: "/produtos/catalogo/categorias/novo",
  Grades: "/produtos/catalogo/grades/novo",
  Marcas: "/produtos/catalogo/marcas/novo",
  Tipos: "/produtos/catalogo/tipos/novo",
  Subtipos: "/produtos/catalogo/subtipos/novo",
  Coleções: "/produtos/catalogo/colecoes/novo",
  Modelos: "/produtos/catalogo/modelos/novo",
};

const categoriesFallback: CategoriaCatalogo[] = [
  { id: "cat-adulto", name: "Adulto", grade: ["P", "M", "G", "GG"], products: 0, active: true },
  { id: "cat-infantil", name: "Infantil", grade: ["2", "4", "6", "8", "10", "12"], products: 0, active: true },
  { id: "cat-plus-size", name: "Plus Size", grade: ["G1", "G2", "G3"], products: 0, active: true },
];

const brandsFallback = [
  { id: "marca-sono-leve", name: "Sono Leve", products: 0, active: true },
  { id: "marca-bella", name: "Bella", products: 0, active: true },
  { id: "marca-mini", name: "Mini", products: 0, active: true },
];

const typesFallback: TipoCatalogo[] = [
  { id: "tipo-curto", name: "Curto", subtypes: 3, products: 0, active: true },
  { id: "tipo-longo", name: "Longo", subtypes: 2, products: 0, active: true },
];

const subtypesFallback: SubtipoCatalogo[] = [
  { id: "sub-camisola-alca", name: "Camisola de alça", type: "Curto", products: 0, active: true },
  { id: "sub-conjunto-regata", name: "Conjunto de regata", type: "Curto", products: 0, active: true },
  { id: "sub-camisola-manga-longa", name: "Camisola de manga longa", type: "Longo", products: 0, active: true },
];

const collectionsFallback = [
  { id: "col-verao-2026", name: "Verão 2026", period: "Sazonal", products: 0, active: true },
  { id: "col-basica", name: "Linha Básica", period: "Contínua", products: 0, active: true },
  { id: "col-maes", name: "Dia das Mães", period: "Campanha", products: 0, active: false },
];

const modelsFallback = [
  { id: "mod-aurora", name: "Aurora", products: 0, active: true },
  { id: "mod-luna", name: "Luna", products: 0, active: true },
  { id: "mod-soft", name: "Soft", products: 0, active: true },
];

export default function Produtos() {
  const { data: products } = useProdutos();
  const { data: catalogo } = useCatalogoProdutos();
  const categories = catalogo.categorias.length > 0 ? catalogo.categorias : categoriesFallback;
  const brands = catalogo.marcas.length > 0 ? catalogo.marcas : brandsFallback;
  const types = catalogo.tipos.length > 0 ? catalogo.tipos : typesFallback;
  const subtypes = catalogo.subtipos.length > 0 ? catalogo.subtipos : subtypesFallback;
  const collections = catalogo.colecoes.length > 0 ? catalogo.colecoes : collectionsFallback;
  const models = catalogo.modelos.length > 0 ? catalogo.modelos : modelsFallback;
  const [tab, setTab] = useState<ProductTab>("Produtos");
  const indexedTabs = useIndexedTabs({ tabs, onTabChange: setTab });
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [active, setActive] = useState("all");
  const [clearFiltersSignal, setClearFiltersSignal] = useState(0);

  const productBrands = useMemo(() => brands.map((item) => item.name), [brands]);
  const productColumns = useMemo<DataGridColumn<Product>[]>(
    () => [
      { id: "name", label: "Nome", accessor: (product) => product.name },
      { id: "ref", label: "Ref.", accessor: (product) => product.ref },
      { id: "brand", label: "Marca", accessor: (product) => product.brand },
      { id: "type", label: "Tipo", accessor: (product) => `${product.type} / ${product.subtype}` },
      { id: "category", label: "Categoria", accessor: (product) => product.category },
      { id: "collection", label: "Coleção", accessor: (product) => product.collection ?? "" },
      { id: "model", label: "Modelo", accessor: (product) => product.model ?? "" },
      { id: "priceRetail", label: "Varejo", accessor: (product) => product.priceRetail },
      { id: "priceWholesale", label: "Atacado", accessor: (product) => product.priceWholesale },
      { id: "stock", label: "Saldo", accessor: (product) => product.stock },
    ],
    [],
  );

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        if (brand !== "all" && p.brand !== brand) return false;
        if (active === "active" && !p.active) return false;
        if (active === "inactive" && p.active) return false;
        if (query) {
          const q = query.toLowerCase();
          const matches =
            p.name.toLowerCase().includes(q) ||
            p.ref.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.type.toLowerCase().includes(q) ||
            p.subtype.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            (p.collection ?? "").toLowerCase().includes(q) ||
            (p.model ?? "").toLowerCase().includes(q);

          if (!matches) return false;
        }
        return true;
      }),
    [products, query, brand, active]
  );
  const productGrid = useDataGrid(filtered, productColumns);
  const productPagination = usePagination(productGrid.rows);
  const categoryColumns = useMemo<DataGridColumn<CategoriaCatalogo>[]>(
    () => [
      { id: "name", label: "Categoria", accessor: (item) => item.name },
      { id: "grade", label: "Grade herdada", accessor: (item) => item.grade.join(", ") },
      { id: "products", label: "Produtos", accessor: (item) => item.products },
    ],
    [],
  );
  const categoryGrid = useDataGrid(categories, categoryColumns);
  const categoryPagination = usePagination(categoryGrid.rows);
  const renderCatalogPanel = (catalogTab: ProductTab, content: ReactNode) => (
    <div {...indexedTabs.getTabPanelProps(catalogTab)} className="space-y-4">
      {content}
    </div>
  );

  return (
    <AppShell>
      <ClearFiltersShortcutDialog
        onConfirm={() => {
          setQuery("");
          setBrand("all");
          setActive("all");
          productGrid.clearFilters();
          categoryGrid.clearFilters();
          setClearFiltersSignal((current) => current + 1);
        }}
      />
      <PageHeader
        breadcrumb={["Produtos", tab]}
        title="Produtos"
        infoTooltip="Organiza cadastro de produtos, categorias, grades, marcas e demais estruturas do catálogo."
        actions={
          tab === "Produtos" ? (
            <Button asChild>
              <Link href="/produtos/novo"><Plus className="mr-1.5 h-4 w-4" />Novo produto</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href={catalogCreateHref[tab]}><Plus className="mr-1.5 h-4 w-4" />{actionLabels[tab]}</Link>
            </Button>
          )
        }
      />

      <div className="space-y-4 p-6">
        <div className="sticky top-20 z-20 -mx-6 space-y-4 border-b bg-background/95 px-6 pb-4 pt-4 backdrop-blur">
          <IndexedTabsNav
            tabs={tabs}
            activeTab={tab}
            onSelect={setTab}
            getTabButtonProps={indexedTabs.getTabButtonProps}
            getShortcutLabel={indexedTabs.getShortcutLabel}
            className="flex gap-1 overflow-x-auto border-b"
            listClassName="flex min-w-max gap-1"
            buttonClassName="relative flex items-center gap-1 px-4 py-2 text-sm font-medium leading-tight transition"
            activeClassName="text-primary"
            inactiveClassName="text-muted-foreground hover:text-foreground"
          />

          {tab === "Produtos" && (
            <Card className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, referência, marca, tipo, subtipo ou categoria"
                    className="pl-9"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <AppSelect
                  className="w-[170px]"
                  value={brand}
                  onValueChange={setBrand}
                  options={[
                    { value: "all", label: "Todas marcas" },
                    ...productBrands.map((brandName) => ({ value: brandName, label: brandName })),
                  ]}
                />
                <AppSelect
                  className="w-[130px]"
                  value={active}
                  onValueChange={setActive}
                  options={[
                    { value: "all", label: "Todos" },
                    { value: "active", label: "Ativos" },
                    { value: "inactive", label: "Inativos" },
                  ]}
                />
              </div>
            </Card>
          )}
        </div>

        {tab === "Produtos" && (
          <div {...indexedTabs.getTabPanelProps("Produtos")} className="space-y-4">

            <Card className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    {productColumns.map((column) => (
                      <DataGridColumnHeader
                        key={column.id}
                        grid={productGrid}
                        columnId={column.id}
                        label={column.label}
                        align={
                          ["priceRetail", "priceWholesale"].includes(column.id)
                            ? "right"
                            : column.id === "stock"
                              ? "center"
                              : "left"
                        }
                      />
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {productPagination.items.length === 0 ? (
                    <tr><td colSpan={11} className="px-4 py-12 text-center text-sm text-muted-foreground">Nenhum produto encontrado</td></tr>
                  ) : productPagination.items.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.ref}</td>
                      <td className="px-4 py-3">{p.brand}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.type} / {p.subtype}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.collection}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.model}</td>
                      <td className="px-4 py-3 text-right">{formatBRL(p.priceRetail)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{formatBRL(p.priceWholesale)}</td>
                      <td className={`px-4 py-3 text-center font-semibold ${p.stock === 0 ? "text-destructive" : ""}`}>{p.stock}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" asChild aria-label={`Editar ${p.name}`}>
                          <Link {...indexedTabs.getActionProps("Produtos")} href={`/produtos/${p.id}/editar`}><Pencil className="h-4 w-4" /></Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <PaginationFooter pagination={productPagination} />
            </Card>
          </div>
        )}

        {tab === "Categorias" && (
          <div {...indexedTabs.getTabPanelProps("Categorias")} className="space-y-4">
            <Card className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    {categoryColumns.map((column) => (
                      <DataGridColumnHeader
                        key={column.id}
                        grid={categoryGrid}
                        columnId={column.id}
                        label={column.label}
                        align={column.id === "products" ? "center" : "left"}
                      />
                    ))}
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {categoryPagination.items.map((item) => (
                    <tr key={item.name} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.grade.join(", ")}</td>
                      <td className="px-4 py-3 text-center">{item.products}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <PaginationFooter pagination={categoryPagination} />
            </Card>
          </div>
        )}

        {tab === "Grades" && renderCatalogPanel(
          "Grades",
          <>
            <Card className="p-5">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Grade por categoria</h3>
              <div className="space-y-4">
                {categories.map((item) => (
                  <div key={item.name} className="rounded-md border p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="font-medium">{item.name}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.grade.map((size, index) => (
                        <span key={size} className="rounded-md bg-muted px-3 py-1 text-sm">
                          {index + 1}. {size}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {tab === "Marcas" && renderCatalogPanel(
          "Marcas",
          <SimpleCatalogTable rows={brands} nameLabel="Marca" clearFiltersSignal={clearFiltersSignal} />
        )}
        {tab === "Tipos" && renderCatalogPanel(
          "Tipos",
          <SimpleCatalogTable rows={types} nameLabel="Tipo" middleLabel="Subtipos" middleKey="subtypes" clearFiltersSignal={clearFiltersSignal} />
        )}
        {tab === "Subtipos" && renderCatalogPanel(
          "Subtipos",
          <SubtypesTable rows={subtypes} clearFiltersSignal={clearFiltersSignal} />
        )}
        {tab === "Coleções" && renderCatalogPanel(
          "Coleções",
          <SimpleCatalogTable rows={collections} nameLabel="Coleção" middleLabel="Período" middleKey="period" clearFiltersSignal={clearFiltersSignal} />
        )}
        {tab === "Modelos" && renderCatalogPanel(
          "Modelos",
          <SimpleCatalogTable rows={models} nameLabel="Modelo" clearFiltersSignal={clearFiltersSignal} />
        )}
      </div>
    </AppShell>
  );
}

function SimpleCatalogTable({
  rows,
  nameLabel,
  middleLabel = "Produtos",
  middleKey = "products",
  clearFiltersSignal,
}: {
  rows: Array<{ id?: string; name: string; products: number; active: boolean; subtypes?: number; period?: string }>;
  nameLabel: string;
  middleLabel?: string;
  middleKey?: string;
  clearFiltersSignal: number;
}) {
  const columns = useMemo<DataGridColumn<{ id?: string; name: string; products: number; active: boolean; subtypes?: number; period?: string }>[]>(
    () => [
      { id: "name", label: nameLabel, accessor: (item) => item.name },
      { id: middleKey, label: middleLabel, accessor: (item) => item[middleKey as "products" | "subtypes" | "period"] ?? "" },
    ],
    [middleKey, middleLabel, nameLabel],
  );
  const grid = useDataGrid(rows, columns);
  useEffect(() => {
    grid.clearFilters();
  }, [clearFiltersSignal]);
  const pagination = usePagination(grid.rows);

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <DataGridColumnHeader
                key={column.id}
                grid={grid}
                columnId={column.id}
                label={column.label}
                align={column.id === "products" || column.id === "subtypes" ? "center" : "left"}
              />
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {pagination.items.map((item) => (
            <tr key={String(item.name)} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">{item.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{item[middleKey as "products" | "subtypes" | "period"]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <PaginationFooter pagination={pagination} />
    </Card>
  );
}

function SubtypesTable({
  rows,
  clearFiltersSignal,
}: {
  rows: SubtipoCatalogo[];
  clearFiltersSignal: number;
}) {
  const columns = useMemo<DataGridColumn<SubtipoCatalogo>[]>(
    () => [
      { id: "name", label: "Subtipo", accessor: (item) => item.name },
      { id: "type", label: "Tipo vinculado", accessor: (item) => item.type },
      { id: "products", label: "Produtos", accessor: (item) => item.products },
    ],
    [],
  );
  const grid = useDataGrid(rows, columns);
  useEffect(() => {
    grid.clearFilters();
  }, [clearFiltersSignal]);
  const pagination = usePagination(grid.rows);

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <DataGridColumnHeader
                key={column.id}
                grid={grid}
                columnId={column.id}
                label={column.label}
                align={column.id === "products" ? "center" : "left"}
              />
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {pagination.items.map((item) => (
            <tr key={item.name} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">{item.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{item.type}</td>
              <td className="px-4 py-3 text-center">{item.products}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <PaginationFooter pagination={pagination} />
    </Card>
  );
}
