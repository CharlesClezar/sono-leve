export const moduleNavigationItems = [
  { title: "Dashboard", url: "/", shortcutId: "nav_dashboard" },
  { title: "Vendas", url: "/vendas", shortcutId: "nav_sales" },
  { title: "Encomendas", url: "/encomendas", shortcutId: "nav_orders" },
  { title: "Fichas", url: "/fichas", shortcutId: "nav_fichas" },
  { title: "Produtos", url: "/produtos", shortcutId: "nav_products" },
  { title: "Estoque", url: "/estoque", shortcutId: "nav_stock" },
  { title: "Clientes", url: "/clientes", shortcutId: "nav_customers" },
  { title: "Financeiro", url: "/financeiro", shortcutId: "nav_finance" },
  { title: "Configurações", url: "/configuracoes", shortcutId: "nav_settings" },
] as const;

export const newOperationRoutes: Partial<Record<ModuleRoute, string>> = {
  "/vendas": "/vendas/nova",
  "/encomendas": "/encomendas/nova",
  "/fichas": "/fichas/nova",
  "/produtos": "/produtos/novo",
  "/clientes": "/clientes/novo",
};

export type ModuleRoute = (typeof moduleNavigationItems)[number]["url"];

export function isModuleRoute(pathname: string): pathname is ModuleRoute {
  return moduleNavigationItems.some((item) => item.url === pathname);
}

export function isActiveModuleRoute(pathname: string, route: ModuleRoute) {
  return route === "/" ? pathname === "/" : pathname.startsWith(route);
}

export function getFallbackModuleRoute(pathname: string) {
  return moduleNavigationItems
    .filter((item) => item.url !== "/")
    .find((item) => pathname.startsWith(`${item.url}/`))?.url;
}
