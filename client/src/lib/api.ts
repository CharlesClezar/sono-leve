import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Account, Customer, Ficha, Order, PieceDetailItem, Product, Sale } from "@/lib/types";
import { http, BASE_URL } from "@/lib/http";

// Constantes estáveis para evitar que `?? []` crie nova referência a cada render
const CLIENTES_VAZIOS: Customer[] = [];
const PRODUTOS_VAZIOS: Product[] = [];
const VENDAS_VAZIAS: Sale[] = [];
const ENCOMENDAS_VAZIAS: Order[] = [];
const FICHAS_VAZIAS: Ficha[] = [];
const CONTAS_VAZIAS: Account[] = [];

// ─── Tipos de entrada (mutations) ────────────────────────────────────────────

export type VendaSalvar = {
  id?: string;
  cliente: string;
  data?: string;
  pecas: number;
  pagamento: string;
  total: number;
  status: Sale["status"];
  origem: Sale["origem"];
  items?: PieceDetailItem[];
};

export type EncomendaSalvar = {
  id?: string;
  cliente: string;
  criadoEm?: string;
  previsao: string;
  total: number;
  entrada: number;
  status: Order["status"];
  items?: PieceDetailItem[];
};

export type FichaSalvar = {
  id?: string;
  revendedora: string;
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

export type CatalogoProdutoItem = {
  id: string;
  name: string;
  active: boolean;
  grade?: string[];
  type?: string;
  period?: string;
  products?: number;
  subtypes?: number;
};

export type CatalogSlug = "categorias" | "grades" | "marcas" | "tipos" | "subtipos" | "colecoes" | "modelos";

export type FormaPagamento = {
  id: string;
  nome: string;
  condicao: string;
  taxa: string;
  ativo: boolean;
};

export type FormaPagamentoSalvar = Omit<FormaPagamento, "id">;

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

  salvarCliente: (cliente: Omit<Customer, "id">, idempotencyKey?: string) =>
    http.post<Customer>("/clientes", cliente, idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined),

  atualizarCliente: (cliente: Customer) =>
    http.put<Customer>(`/clientes/${cliente.id}`, cliente),

  // ─── Produtos ──────────────────────────────────────────────────────────────

  salvarProduto: (produto: Omit<Product, "id">, idempotencyKey?: string) =>
    http.post<Product>("/produtos", produto, idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined),

  atualizarProduto: (produto: Product) =>
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

  salvarModeloProduto: (entrada: CatalogoProdutoSalvar, idempotencyKey?: string) =>
    http.post<CatalogoSimples>("/produtos/catalogo/modelos", entrada, idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined),

  obterCatalogoProduto: (tipo: CatalogSlug, id: string) =>
    http.get<CatalogoProdutoItem>(`/produtos/catalogo/${tipo === "grades" ? "categorias" : tipo}/${id}`),

  atualizarCatalogoProduto: (tipo: CatalogSlug, id: string, entrada: CatalogoProdutoSalvar) =>
    http.put<CatalogoProdutoItem>(`/produtos/catalogo/${tipo === "grades" ? "categorias" : tipo}/${id}`, entrada),

  excluirCatalogoProduto: (tipo: CatalogSlug, id: string) =>
    http.delete<void>(`/produtos/catalogo/${tipo === "grades" ? "categorias" : tipo}/${id}`),

  // ─── Formas de Pagamento ───────────────────────────────────────────────────

  formasPagamento: () => http.get<FormaPagamento[]>("/formas-pagamento"),

  salvarFormaPagamento: (entrada: FormaPagamentoSalvar) =>
    http.post<FormaPagamento>("/formas-pagamento", entrada),

  atualizarFormaPagamento: (id: string, entrada: FormaPagamentoSalvar) =>
    http.put<FormaPagamento>(`/formas-pagamento/${id}`, entrada),

  excluirFormaPagamento: (id: string) =>
    http.delete<void>(`/formas-pagamento/${id}`),
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
  };
}
