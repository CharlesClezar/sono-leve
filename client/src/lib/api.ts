import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Account, Customer, Ficha, ItemVenda, Order, Product, Sale } from "@/lib/types";
import { http, BASE_URL } from "@/lib/http";

// Constantes estáveis para evitar que `?? []` crie nova referência a cada render
const CLIENTES_VAZIOS: Customer[] = [];
const PRODUTOS_VAZIOS: Product[] = [];
const VENDAS_VAZIAS: Sale[] = [];
const ENCOMENDAS_VAZIAS: Order[] = [];
const FICHAS_VAZIAS: Ficha[] = [];
const CONTAS_VAZIAS: Account[] = [];

// ─── Tipos do Dashboard (slim) ───────────────────────────────────────────────

export type VendaDashboard = { id: string; data: string; total: number; status: string };
export type EncomendaDashboard = { id: string; clienteNome: string; previsao: string; total: number; status: string };
export type FichaDashboard = { id: string; dataAbertura: string; status: string };
export type ContaDashboard = { id: string; vencimento: string; total: number; recebido: number };

export type DashboardKpis = {
  vendas: VendaDashboard[];
  fichas: FichaDashboard[];
  contas: ContaDashboard[];
};

const FETCH_ALL_PAGE_SIZE = 1000;

export const DASHBOARD_KPIS_VAZIO: DashboardKpis = { vendas: [], fichas: [], contas: [] };
export const ENCOMENDAS_CALENDARIO_VAZIAS: EncomendaDashboard[] = [];

// ─── Tipos de entrada (mutations) ────────────────────────────────────────────

export type ItemVendaSalvar = {
  produtoId: string;
  tamanho: string;
  quantidade: number;
  precoUnitario: number;
  descontoPct?: number;
  descontoVal?: number;
};

export type VendaSalvar = {
  id?: string;
  clienteId: string;
  formaPagamentoId?: string;
  data?: string;
  pecas: number;
  total: number;
  status: Sale["status"];
  origem: Sale["origem"];
  items?: ItemVendaSalvar[];
  // ── Pagamento / taxa (snapshot na Conta) ──────────────────────────────────
  bandeiraId?: string;
  numeroParcelas?: number;
  percentualTaxaCartao?: number;
  taxaFixaCartao?: number;
  valorTaxaCartao?: number;
  prazoRecebimentoDias?: number;
  valorPago?: number;
};

export type ContaSalvar = {
  clienteId: string;
  origem: string;
  descricao?: string;
  total: number;
  recebido: number;
  vencimento: string;
  status: Account["status"];
  ehManual?: boolean;
  vendaId?: string;
  numeroParcelas?: number;
  percentualTaxaCartao?: number;
  taxaFixaCartao?: number;
  valorTaxaCartao?: number;
};

export type EncomendaSalvar = {
  id?: string;
  clienteId: string;
  criadoEm?: string;
  previsao: string;
  total: number;
  entrada: number;
  status: Order["status"];
  items?: ItemVendaSalvar[];
};

export type FichaSalvar = {
  id?: string;
  clienteId: string;
  dataAbertura?: string;
  enviadas: number;
  devolvidas: number;
  vendidas: number;
  totalVendido: number;
  status: Ficha["status"];
};

export type CategoriaCatalogo = {
  id: string;
  name: string;
  grade: string[];
  products: number;
  active: boolean;
};

export type CatalogoSimples = {
  id: string;
  name: string;
  products: number;
  active: boolean;
};

export type TipoCatalogo = CatalogoSimples & { subtypes: number };
export type SubtipoCatalogo = CatalogoSimples;
export type ColecaoCatalogo = CatalogoSimples & { dataInicio?: string; dataFim?: string };

export type CatalogoProdutos = {
  categorias: CategoriaCatalogo[];
  marcas: CatalogoSimples[];
  tipos: TipoCatalogo[];
  subtipos: SubtipoCatalogo[];
  colecoes: ColecaoCatalogo[];
};

export type CatalogoProdutoSalvar = {
  name: string;
  active: boolean;
  grade?: string[];
  dataInicio?: string;
  dataFim?: string;
};

export type CatalogoProdutoItem = {
  id: string;
  name: string;
  active: boolean;
  grade?: string[];
  dataInicio?: string;
  dataFim?: string;
  products?: number;
  subtypes?: number;
};

export type CatalogSlug = "categorias" | "marcas" | "tipos" | "subtipos" | "colecoes";

// ─── Tipos de filtro para listagens paginadas ─────────────────────────────────

export type VendasFiltros = {
  search?: string;
  status?: string;
  tipoCliente?: string;
  formaPagamento?: string;
  periodo?: string;
  page?: number;
  pageSize?: number;
};

export type EncomendasFiltros = {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

export type FichasFiltros = {
  search?: string;
  status?: string;
  minVendidas?: number;
  page?: number;
  pageSize?: number;
};

export type ContasFiltros = {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

export type ClientesFiltros = {
  search?: string;
  tipo?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

export type ProdutosFiltros = {
  search?: string;
  marca?: string;
  ativo?: boolean;
  page?: number;
  pageSize?: number;
};

function buildQS(params: Record<string, string | number | boolean | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  }
  return qs.toString();
}

export type FormaPagamento = {
  id: string;
  nome: string;
  tipo: string;
  permiteParcelamento: boolean;
  exigeBandeira: boolean;
  ativo: boolean;
  repassaTaxaAoCliente: boolean;
};

export type FormaPagamentoSalvar = Omit<FormaPagamento, "id">;

export type BandeiraCartao = {
  id: string;
  nome: string;
  ativo: boolean;
};

export type BandeiraCartaoSalvar = Omit<BandeiraCartao, "id">;

export type ConfiguracaoTaxaCartaoParcela = {
  id: string;
  numeroParcelas: number;
  percentualTaxa: number;
  prazoRecebimentoDias: number;
  taxaFixa: number | null;
};

export type ConfiguracaoTaxaCartao = {
  id: string;
  formaPagamentoId: string;
  formaPagamentoNome: string;
  bandeiraId: string;
  bandeiraNome: string;
  tipoCartao: string;
  ativo: boolean;
  parcelas: ConfiguracaoTaxaCartaoParcela[];
};

export type ConfiguracaoTaxaCartaoSalvar = {
  formaPagamentoId: string;
  bandeiraId: string;
  tipoCartao: string;
  ativo: boolean;
  parcelas: Omit<ConfiguracaoTaxaCartaoParcela, "id">[];
};

type ListaResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// ─── API ──────────────────────────────────────────────────────────────────────

export const api = {
  clientes: async () => {
    const res = await http.get<ListaResponse<Customer>>(`/clientes?pageSize=${FETCH_ALL_PAGE_SIZE}`);
    return res.data;
  },

  produtos: async () => {
    const res = await http.get<ListaResponse<Product>>(`/produtos?pageSize=${FETCH_ALL_PAGE_SIZE}`);
    return res.data;
  },

  buscarProdutos: async (search: string) => {
    const res = await http.get<ListaResponse<Product>>(`/produtos?search=${encodeURIComponent(search)}&pageSize=15`);
    return res.data;
  },

  buscarClientes: async (search: string) => {
    const res = await http.get<ListaResponse<Customer>>(`/clientes?search=${encodeURIComponent(search)}&pageSize=15`);
    return res.data;
  },

  vendas: async () => {
    const res = await http.get<ListaResponse<Sale>>(`/vendas?pageSize=${FETCH_ALL_PAGE_SIZE}`);
    return res.data;
  },

  encomendas: async () => {
    const res = await http.get<ListaResponse<Order>>(`/encomendas?pageSize=${FETCH_ALL_PAGE_SIZE}`);
    return res.data;
  },

  fichas: async () => {
    const res = await http.get<ListaResponse<Ficha>>(`/fichas?pageSize=${FETCH_ALL_PAGE_SIZE}`);
    return res.data;
  },

  contasReceber: async () => {
    const res = await http.get<ListaResponse<Account>>(`/contas-receber?pageSize=${FETCH_ALL_PAGE_SIZE}`);
    return res.data;
  },

  // ─── Listagens paginadas com filtros server-side ──────────────────────────

  listarVendas: (f: VendasFiltros) =>
    http.get<ListaResponse<Sale>>(`/vendas?${buildQS({
      search: f.search, status: f.status, tipoCliente: f.tipoCliente,
      formaPagamento: f.formaPagamento, periodo: f.periodo,
      page: f.page ?? 1, pageSize: f.pageSize ?? 30,
    })}`),

  listarEncomendas: (f: EncomendasFiltros) =>
    http.get<ListaResponse<Order>>(`/encomendas?${buildQS({
      search: f.search, status: f.status,
      page: f.page ?? 1, pageSize: f.pageSize ?? 30,
    })}`),

  listarFichas: (f: FichasFiltros) =>
    http.get<ListaResponse<Ficha>>(`/fichas?${buildQS({
      search: f.search, status: f.status, minVendidas: f.minVendidas,
      page: f.page ?? 1, pageSize: f.pageSize ?? 30,
    })}`),

  listarContas: (f: ContasFiltros) =>
    http.get<ListaResponse<Account>>(`/contas-receber?${buildQS({
      search: f.search, status: f.status,
      page: f.page ?? 1, pageSize: f.pageSize ?? 30,
    })}`),

  criarConta: (entrada: ContaSalvar) =>
    http.post<Account>("/contas-receber", { ...entrada, ehManual: entrada.ehManual ?? true }),

  atualizarConta: (id: string, entrada: ContaSalvar) =>
    http.put<Account>(`/contas-receber/${id}`, { ...entrada, ehManual: entrada.ehManual ?? true }),

  listarClientes: (f: ClientesFiltros) =>
    http.get<ListaResponse<Customer>>(`/clientes?${buildQS({
      search: f.search, tipo: f.tipo, status: f.status,
      page: f.page ?? 1, pageSize: f.pageSize ?? 30,
    })}`),

  listarProdutos: (f: ProdutosFiltros) =>
    http.get<ListaResponse<Product>>(`/produtos?${buildQS({
      search: f.search, marca: f.marca, ativo: f.ativo, page: f.page ?? 1, pageSize: f.pageSize ?? 30,
    })}`),

  catalogoProdutos: () => http.get<CatalogoProdutos>("/produtos/catalogo"),

  obterCliente: (id: string) => http.get<Customer>(`/clientes/${id}`),

  obterProduto: (id: string) => http.get<Product>(`/produtos/${id}`),

  obterEncomenda: (id: string) => http.get<Order>(`/encomendas/${id}`),

  obterFicha: (id: string) => http.get<Ficha>(`/fichas/${id}`),

  itensVenda: (id: string) => http.get<ItemVenda[]>(`/vendas/${id}/itens`),

  itensEncomenda: (id: string) => http.get<ItemVenda[]>(`/encomendas/${id}/itens`),

  // ─── Clientes ──────────────────────────────────────────────────────────────

  salvarCliente: (cliente: Omit<Customer, "id">, idempotencyKey?: string) =>
    http.post<Customer>("/clientes", cliente, idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined),

  atualizarCliente: (cliente: Customer) =>
    http.put<Customer>(`/clientes/${cliente.id}`, cliente),

  // ─── Produtos ──────────────────────────────────────────────────────────────

  salvarProduto: (produto: Omit<Product, "id" | "marcaNome" | "tipoNome" | "subtipoNome" | "categoriaNome" | "colecaoNome">, idempotencyKey?: string) =>
    http.post<Product>("/produtos", produto, idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined),

  atualizarProduto: (produto: Omit<Product, "marcaNome" | "tipoNome" | "subtipoNome" | "categoriaNome" | "colecaoNome">) =>
    http.put<Product>(`/produtos/${produto.id}`, produto),

  uploadImagemProduto: async (id: string, arquivo: File): Promise<{ imagemUrl: string }> => {
    const form = new FormData();
    form.append("arquivo", arquivo);
    const res = await fetch(`${BASE_URL}/api/produtos/${id}/imagem`, { method: "POST", body: form });
    if (!res.ok) throw new Error("Falha no upload da imagem.");
    return res.json();
  },

  removerImagemProduto: (id: string) =>
    http.delete<void>(`/produtos/${id}/imagem`),

  // ─── Vendas ────────────────────────────────────────────────────────────────

  salvarVenda: (entrada: VendaSalvar, idempotencyKey?: string) =>
    http.post<Sale>("/vendas", entrada, idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined),

  atualizarVenda: (entrada: VendaSalvar & { id: string }) =>
    http.put<Sale>(`/vendas/${entrada.id}`, entrada),

  cancelarVenda: (id: string, motivo: string) =>
    http.patch<Sale>(`/vendas/${id}/cancelar`, { motivo }),

  // ─── Encomendas ────────────────────────────────────────────────────────────

  salvarEncomenda: (entrada: EncomendaSalvar, idempotencyKey?: string) =>
    http.post<Order>("/encomendas", entrada, idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined),

  atualizarEncomenda: (entrada: EncomendaSalvar & { id: string }) =>
    http.put<Order>(`/encomendas/${entrada.id}`, entrada),

  atualizarStatusEncomenda: (id: string, status: Order["status"]) =>
    http.patch<Order>(`/encomendas/${id}/status`, { status }),

  // ─── Fichas ────────────────────────────────────────────────────────────────

  salvarFicha: (entrada: FichaSalvar, idempotencyKey?: string) =>
    http.post<Ficha>("/fichas", entrada, idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined),

  atualizarFicha: (entrada: FichaSalvar & { id: string }) =>
    http.put<Ficha>(`/fichas/${entrada.id}`, entrada),

  // ─── Catálogo de Produtos ──────────────────────────────────────────────────

  salvarCategoriaProduto: (entrada: CatalogoProdutoSalvar, idempotencyKey?: string) =>
    http.post<CategoriaCatalogo>("/produtos/catalogo/categorias", entrada, idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined),

  salvarMarcaProduto: (entrada: CatalogoProdutoSalvar, idempotencyKey?: string) =>
    http.post<CatalogoSimples>("/produtos/catalogo/marcas", entrada, idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined),

  salvarTipoProduto: (entrada: CatalogoProdutoSalvar, idempotencyKey?: string) =>
    http.post<TipoCatalogo>("/produtos/catalogo/tipos", entrada, idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined),

  salvarSubtipoProduto: (entrada: CatalogoProdutoSalvar, idempotencyKey?: string) =>
    http.post<SubtipoCatalogo>("/produtos/catalogo/subtipos", entrada, idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined),

  salvarColecaoProduto: (entrada: CatalogoProdutoSalvar, idempotencyKey?: string) =>
    http.post<ColecaoCatalogo>("/produtos/catalogo/colecoes", entrada, idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined),

  obterCatalogoProduto: (tipo: CatalogSlug, id: string) =>
    http.get<CatalogoProdutoItem>(`/produtos/catalogo/${tipo}/${id}`),

  atualizarCatalogoProduto: (tipo: CatalogSlug, id: string, entrada: CatalogoProdutoSalvar) =>
    http.put<CatalogoProdutoItem>(`/produtos/catalogo/${tipo}/${id}`, entrada),

  excluirCatalogoProduto: (tipo: CatalogSlug, id: string) =>
    http.delete<void>(`/produtos/catalogo/${tipo}/${id}`),

  // ─── Formas de Pagamento ───────────────────────────────────────────────────

  formasPagamento: () => http.get<FormaPagamento[]>("/formas-pagamento"),

  salvarFormaPagamento: (entrada: FormaPagamentoSalvar) =>
    http.post<FormaPagamento>("/formas-pagamento", entrada),

  atualizarFormaPagamento: (id: string, entrada: FormaPagamentoSalvar) =>
    http.put<FormaPagamento>(`/formas-pagamento/${id}`, entrada),

  excluirFormaPagamento: (id: string) =>
    http.delete<void>(`/formas-pagamento/${id}`),

  // ─── Bandeiras de Cartão ──────────────────────────────────────────────────

  bandeirasCartao: () => http.get<BandeiraCartao[]>("/bandeiras-cartao"),

  salvarBandeiraCartao: (entrada: BandeiraCartaoSalvar) =>
    http.post<BandeiraCartao>("/bandeiras-cartao", entrada),

  atualizarBandeiraCartao: (id: string, entrada: BandeiraCartaoSalvar) =>
    http.put<BandeiraCartao>(`/bandeiras-cartao/${id}`, entrada),

  excluirBandeiraCartao: (id: string) =>
    http.delete<void>(`/bandeiras-cartao/${id}`),

  // ─── Configurações de Taxa de Cartão ─────────────────────────────────────

  configuracoesTaxaCartao: () =>
    http.get<ConfiguracaoTaxaCartao[]>("/configuracoes-taxa-cartao"),

  salvarConfiguracaoTaxaCartao: (entrada: ConfiguracaoTaxaCartaoSalvar) =>
    http.post<ConfiguracaoTaxaCartao>("/configuracoes-taxa-cartao", entrada),

  atualizarConfiguracaoTaxaCartao: (id: string, entrada: ConfiguracaoTaxaCartaoSalvar) =>
    http.put<ConfiguracaoTaxaCartao>(`/configuracoes-taxa-cartao/${id}`, entrada),

  excluirConfiguracaoTaxaCartao: (id: string) =>
    http.delete<void>(`/configuracoes-taxa-cartao/${id}`),
};

// ─── React Query Hooks ────────────────────────────────────────────────────────

export function useClientes() {
  return useQuery({ queryKey: ["clientes"], queryFn: api.clientes });
}

export function useProdutos() {
  return useQuery({ queryKey: ["produtos"], queryFn: api.produtos });
}

export function useBuscarProdutos(search: string) {
  return useQuery({
    queryKey: ["produtos", "busca", search],
    queryFn: () => api.buscarProdutos(search),
    enabled: search.trim().length >= 2,
    staleTime: 30_000,
  });
}

export function useBuscarClientes(search: string) {
  return useQuery({
    queryKey: ["clientes", "busca", search],
    queryFn: () => api.buscarClientes(search),
    enabled: search.trim().length >= 2,
    staleTime: 30_000,
  });
}

export function useVendas() {
  return useQuery({ queryKey: ["vendas"], queryFn: api.vendas, staleTime: 2 * 60_000 });
}

export function useEncomendas() {
  return useQuery({ queryKey: ["encomendas"], queryFn: api.encomendas, staleTime: 2 * 60_000 });
}

export function useFichas() {
  return useQuery({ queryKey: ["fichas"], queryFn: api.fichas, staleTime: 2 * 60_000 });
}

export function useContasReceber() {
  return useQuery({ queryKey: ["contas-receber"], queryFn: api.contasReceber, staleTime: 2 * 60_000 });
}

export function useItensVenda(id: string) {
  return useQuery({
    queryKey: ["vendas", id, "itens"],
    queryFn: () => api.itensVenda(id),
    enabled: !!id,
  });
}

export function useItensEncomenda(id: string) {
  return useQuery({
    queryKey: ["encomendas", id, "itens"],
    queryFn: () => api.itensEncomenda(id),
    enabled: !!id,
  });
}

export function useClientePorId(id: string | undefined) {
  return useQuery({
    queryKey: ["clientes", id],
    queryFn: () => api.obterCliente(id!),
    enabled: !!id,
  });
}

export function useProdutoPorId(id: string | undefined) {
  return useQuery({
    queryKey: ["produtos", id],
    queryFn: () => api.obterProduto(id!),
    enabled: !!id,
  });
}

export function useEncomendaPorId(id: string | undefined) {
  return useQuery({
    queryKey: ["encomendas", id],
    queryFn: () => api.obterEncomenda(id!),
    enabled: !!id,
  });
}

export function useFichaPorId(id: string | undefined) {
  return useQuery({
    queryKey: ["fichas", id],
    queryFn: () => api.obterFicha(id!),
    enabled: !!id,
  });
}

export function useCatalogoProdutos() {
  return useQuery({ queryKey: ["catalogo-produtos"], queryFn: api.catalogoProdutos });
}

export function useItemCatalogoProduto(tipo: CatalogSlug, id: string) {
  return useQuery({
    queryKey: ["catalogo-produtos", tipo, id],
    queryFn: () => api.obterCatalogoProduto(tipo, id),
    enabled: !!id,
  });
}

export function useFormasPagamento() {
  return useQuery({ queryKey: ["formas-pagamento"], queryFn: api.formasPagamento });
}

export function useBandeirasCartao() {
  return useQuery({ queryKey: ["bandeiras-cartao"], queryFn: api.bandeirasCartao });
}

export function useConfiguracoesTaxaCartao() {
  return useQuery({ queryKey: ["configuracoes-taxa-cartao"], queryFn: api.configuracoesTaxaCartao });
}

// ─── Hooks paginados com filtros server-side ──────────────────────────────────

export function useVendasPaginadas(filtros: VendasFiltros) {
  return useQuery({
    queryKey: ["vendas", "paginadas", filtros],
    queryFn: () => api.listarVendas(filtros),
  });
}

export function useEncomendasPaginadas(filtros: EncomendasFiltros, enabled = true) {
  return useQuery({
    queryKey: ["encomendas", "paginadas", filtros],
    queryFn: () => api.listarEncomendas(filtros),
    enabled,
  });
}

export function useFichasPaginadas(filtros: FichasFiltros, enabled = true) {
  return useQuery({
    queryKey: ["fichas", "paginadas", filtros],
    queryFn: () => api.listarFichas(filtros),
    enabled,
  });
}

export function useContasPaginadas(filtros: ContasFiltros) {
  return useQuery({
    queryKey: ["contas-receber", "paginadas", filtros],
    queryFn: () => api.listarContas(filtros),
  });
}

export function useClientesPaginados(filtros: ClientesFiltros) {
  return useQuery({
    queryKey: ["clientes", "paginados", filtros],
    queryFn: () => api.listarClientes(filtros),
  });
}

export function useProdutosPaginados(filtros: ProdutosFiltros) {
  return useQuery({
    queryKey: ["produtos", "paginados", filtros],
    queryFn: () => api.listarProdutos(filtros),
  });
}

export function useDadosOperacionais() {
  const clientes = useClientes();
  const produtos = useProdutos();
  const vendas = useVendas();
  const encomendas = useEncomendas();
  const fichas = useFichas();
  const contas = useContasReceber();

  return {
    clientes: clientes.data ?? CLIENTES_VAZIOS,
    produtos: produtos.data ?? PRODUTOS_VAZIOS,
    vendas: vendas.data ?? VENDAS_VAZIAS,
    encomendas: encomendas.data ?? ENCOMENDAS_VAZIAS,
    fichas: fichas.data ?? FICHAS_VAZIAS,
    contas: contas.data ?? CONTAS_VAZIAS,
    carregando:
      clientes.isLoading ||
      produtos.isLoading ||
      vendas.isLoading ||
      encomendas.isLoading ||
      fichas.isLoading ||
      contas.isLoading,
  };
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: () => http.get<DashboardKpis>("/dashboard"),
    staleTime: 5 * 60_000,
    placeholderData: DASHBOARD_KPIS_VAZIO,
  });
}

export function useEncomendasCalendario(inicio: string, fim: string) {
  return useQuery({
    queryKey: ["dashboard", "encomendas", inicio, fim],
    queryFn: () => http.get<EncomendaDashboard[]>(`/dashboard/encomendas?inicio=${inicio}&fim=${fim}`),
    staleTime: 2 * 60_000,
    placeholderData: ENCOMENDAS_CALENDARIO_VAZIAS,
  });
}

export function useInvalidarConsultas() {
  const queryClient = useQueryClient();
  return {
    clientes: () => queryClient.invalidateQueries({ queryKey: ["clientes"] }),
    produtos: () => queryClient.invalidateQueries({ queryKey: ["produtos"] }),
    vendas: () => queryClient.invalidateQueries({ queryKey: ["vendas"] }),
    encomendas: () => queryClient.invalidateQueries({ queryKey: ["encomendas"] }),
    fichas: () => queryClient.invalidateQueries({ queryKey: ["fichas"] }),
    contasReceber: () => queryClient.invalidateQueries({ queryKey: ["contas-receber"] }),
    catalogo: () => queryClient.invalidateQueries({ queryKey: ["catalogo-produtos"] }),
    formasPagamento: () => queryClient.invalidateQueries({ queryKey: ["formas-pagamento"] }),
    bandeirasCartao: () => queryClient.invalidateQueries({ queryKey: ["bandeiras-cartao"] }),
    configuracoesTaxaCartao: () => queryClient.invalidateQueries({ queryKey: ["configuracoes-taxa-cartao"] }),
    dashboard: () => queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
  };
}
