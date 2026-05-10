import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Account, Customer, Ficha, Order, PieceDetailItem, Product, Sale } from "@/lib/types";
import { auth, type UsuarioLogado } from "@/lib/auth";
import { http } from "@/lib/http";

// ─── Tipos de entrada (mutations) ────────────────────────────────────────────

export type VendaSalvar = {
  id?: string;
  customer: string;
  date?: string;
  pieces: number;
  payment: string;
  total: number;
  status: Sale["status"];
  origin: Sale["origin"];
  items?: PieceDetailItem[];
};

export type EncomendaSalvar = {
  id?: string;
  customer: string;
  createdAt?: string;
  dueDate: string;
  total: number;
  entry: number;
  status: Order["status"];
  items?: PieceDetailItem[];
};

export type FichaSalvar = {
  id?: string;
  reseller: string;
  openedAt?: string;
  sent: number;
  returned: number;
  sold: number;
  totalSold: number;
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
export type SubtipoCatalogo = CatalogoSimples & { type: string };
export type ColecaoCatalogo = CatalogoSimples & { period: string };

export type CatalogoProdutos = {
  categorias: CategoriaCatalogo[];
  marcas: CatalogoSimples[];
  tipos: TipoCatalogo[];
  subtipos: SubtipoCatalogo[];
  colecoes: ColecaoCatalogo[];
  modelos: CatalogoSimples[];
};

export type CatalogoProdutoSalvar = {
  name: string;
  active: boolean;
  grade?: string[];
  type?: string;
  period?: string;
};

type ListaResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function login(email: string, senha: string): Promise<{ token: string; usuario: UsuarioLogado }> {
  return http.post("/auth/login", { email, senha });
}

export async function logout(): Promise<void> {
  await http.post("/auth/logout").catch(() => null);
  auth.clearToken();
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const api = {
  clientes: async () => {
    const res = await http.get<ListaResponse<Customer>>("/clientes?pageSize=1000");
    return res.data;
  },

  produtos: async () => {
    const res = await http.get<ListaResponse<Product>>("/produtos?pageSize=1000");
    return res.data;
  },

  vendas: async () => {
    const res = await http.get<ListaResponse<Sale>>("/vendas?pageSize=1000");
    return res.data;
  },

  encomendas: async () => {
    const res = await http.get<ListaResponse<Order>>("/encomendas?pageSize=1000");
    return res.data;
  },

  fichas: async () => {
    const res = await http.get<ListaResponse<Ficha>>("/fichas?pageSize=1000");
    return res.data;
  },

  contasReceber: async () => {
    const res = await http.get<ListaResponse<Account>>("/contas-receber?pageSize=1000");
    return res.data;
  },

  catalogoProdutos: () => http.get<CatalogoProdutos>("/produtos/catalogo"),

  itensVenda: (id: string) => http.get<PieceDetailItem[]>(`/vendas/${id}/itens`),

  itensEncomenda: (id: string) => http.get<PieceDetailItem[]>(`/encomendas/${id}/itens`),

  // ─── Clientes ──────────────────────────────────────────────────────────────

  salvarCliente: (cliente: Omit<Customer, "id">) =>
    http.post<Customer>("/clientes", cliente),

  atualizarCliente: (cliente: Customer) =>
    http.put<Customer>(`/clientes/${cliente.id}`, cliente),

  // ─── Produtos ──────────────────────────────────────────────────────────────

  salvarProduto: (produto: Omit<Product, "id">) =>
    http.post<Product>("/produtos", produto),

  atualizarProduto: (produto: Product) =>
    http.put<Product>(`/produtos/${produto.id}`, produto),

  // ─── Vendas ────────────────────────────────────────────────────────────────

  salvarVenda: (entrada: VendaSalvar) =>
    http.post<Sale>("/vendas", entrada),

  atualizarVenda: (entrada: VendaSalvar & { id: string }) =>
    http.put<Sale>(`/vendas/${entrada.id}`, entrada),

  cancelarVenda: (id: string, motivo: string) =>
    http.patch<Sale>(`/vendas/${id}/cancelar`, { motivo }),

  // ─── Encomendas ────────────────────────────────────────────────────────────

  salvarEncomenda: (entrada: EncomendaSalvar) =>
    http.post<Order>("/encomendas", entrada),

  atualizarEncomenda: (entrada: EncomendaSalvar & { id: string }) =>
    http.put<Order>(`/encomendas/${entrada.id}`, entrada),

  atualizarStatusEncomenda: (id: string, status: Order["status"]) =>
    http.patch<Order>(`/encomendas/${id}/status`, { status }),

  // ─── Fichas ────────────────────────────────────────────────────────────────

  salvarFicha: (entrada: FichaSalvar) =>
    http.post<Ficha>("/fichas", entrada),

  atualizarFicha: (entrada: FichaSalvar & { id: string }) =>
    http.put<Ficha>(`/fichas/${entrada.id}`, entrada),

  // ─── Catálogo de Produtos ──────────────────────────────────────────────────

  salvarCategoriaProduto: (entrada: CatalogoProdutoSalvar) =>
    http.post<CategoriaCatalogo>("/produtos/catalogo/categorias", entrada),

  salvarMarcaProduto: (entrada: CatalogoProdutoSalvar) =>
    http.post<CatalogoSimples>("/produtos/catalogo/marcas", entrada),

  salvarTipoProduto: (entrada: CatalogoProdutoSalvar) =>
    http.post<TipoCatalogo>("/produtos/catalogo/tipos", entrada),

  salvarSubtipoProduto: (entrada: CatalogoProdutoSalvar) =>
    http.post<SubtipoCatalogo>("/produtos/catalogo/subtipos", entrada),

  salvarColecaoProduto: (entrada: CatalogoProdutoSalvar) =>
    http.post<ColecaoCatalogo>("/produtos/catalogo/colecoes", entrada),

  salvarModeloProduto: (entrada: CatalogoProdutoSalvar) =>
    http.post<CatalogoSimples>("/produtos/catalogo/modelos", entrada),
};

// ─── React Query Hooks ────────────────────────────────────────────────────────

export function useClientes() {
  return useQuery({ queryKey: ["clientes"], queryFn: api.clientes });
}

export function useProdutos() {
  return useQuery({ queryKey: ["produtos"], queryFn: api.produtos });
}

export function useVendas() {
  return useQuery({ queryKey: ["vendas"], queryFn: api.vendas });
}

export function useEncomendas() {
  return useQuery({ queryKey: ["encomendas"], queryFn: api.encomendas });
}

export function useFichas() {
  return useQuery({ queryKey: ["fichas"], queryFn: api.fichas });
}

export function useContasReceber() {
  return useQuery({ queryKey: ["contas-receber"], queryFn: api.contasReceber });
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

export function useCatalogoProdutos() {
  return useQuery({ queryKey: ["catalogo-produtos"], queryFn: api.catalogoProdutos });
}

export function useDadosOperacionais() {
  const clientes = useClientes();
  const produtos = useProdutos();
  const vendas = useVendas();
  const encomendas = useEncomendas();
  const fichas = useFichas();
  const contas = useContasReceber();

  return {
    customers: clientes.data ?? [],
    products: produtos.data ?? [],
    sales: vendas.data ?? [],
    orders: encomendas.data ?? [],
    fichas: fichas.data ?? [],
    accounts: contas.data ?? [],
    isLoading:
      clientes.isLoading ||
      produtos.isLoading ||
      vendas.isLoading ||
      encomendas.isLoading ||
      fichas.isLoading ||
      contas.isLoading,
  };
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
  };
}
