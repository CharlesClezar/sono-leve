import { useQuery } from "@tanstack/react-query";
import type { Account, Customer, Ficha, Order, PieceDetailItem, Product, Sale } from "@/lib/types";

const STORAGE_KEY = "sono-leve.mock-db.v1";

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

export type TipoCatalogo = CatalogoSimples & {
  subtypes: number;
};

export type SubtipoCatalogo = CatalogoSimples & {
  type: string;
};

export type ColecaoCatalogo = CatalogoSimples & {
  period: string;
};

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

type MockDb = {
  clientes: Customer[];
  produtos: Product[];
  vendas: Sale[];
  encomendas: Order[];
  fichas: Ficha[];
  contasReceber: Account[];
  itensVenda: Record<string, PieceDetailItem[]>;
  itensEncomenda: Record<string, PieceDetailItem[]>;
  catalogoProdutos: CatalogoProdutos;
};

const seedDb: MockDb = {
  clientes: [
    { id: "1", name: "Maria Silva", phone: "(11) 99999-1111", cpf: "123.456.789-00", type: "varejo", status: "Ativo", credit: 0 },
    { id: "2", name: "Boutique da Ana", phone: "(11) 98888-2222", cpf: "987.654.321-00", type: "atacado", status: "Ativo", credit: 250 },
    { id: "3", name: "Joana Costa", phone: "(11) 97777-3333", cpf: "111.222.333-44", type: "varejo", status: "Ativo", credit: 0 },
    { id: "4", name: "Loja Bella", phone: "(11) 96666-4444", cpf: "555.666.777-88", type: "atacado", status: "Ativo", credit: 1200 },
    { id: "5", name: "Paula Rocha", phone: "(11) 95555-5555", cpf: "222.333.444-55", type: "varejo", status: "Inativo", credit: 0 },
    { id: "6", name: "Casa Aurora", phone: "(11) 91111-9988", cpf: "100.200.300-40", type: "atacado", status: "Ativo", credit: 940 },
  ],
  produtos: [
    { id: "1", name: "Short Doll Renda", ref: "SD-102", brand: "Sono Leve", type: "Curto", subtype: "Short doll", category: "Adulto", collection: "Verão 2026", model: "Luna", priceRetail: 149.9, priceWholesale: 74, active: true, stock: 42 },
    { id: "2", name: "Camisola Cetim Luna", ref: "CL-210", brand: "Sono Leve", type: "Curto", subtype: "Camisola de alça", category: "Adulto", collection: "Verão 2026", model: "Luna", priceRetail: 169.9, priceWholesale: 86, active: true, stock: 31 },
    { id: "3", name: "Pijama Americano Soft", ref: "PA-310", brand: "Bella", type: "Longo", subtype: "Pijama americano", category: "Adulto", collection: "Linha Básica", model: "Soft", priceRetail: 199.9, priceWholesale: 102, active: true, stock: 27 },
    { id: "4", name: "Robe Malha Confort", ref: "RB-405", brand: "Sono Leve", type: "Longo", subtype: "Robe", category: "Adulto", collection: "Linha Básica", model: "Aurora", priceRetail: 139.9, priceWholesale: 70, active: true, stock: 12 },
    { id: "5", name: "Pijama Infantil Estrelinhas", ref: "PI-115", brand: "Mini", type: "Curto", subtype: "Pijama infantil", category: "Infantil", collection: "Verão 2026", model: "Soft", priceRetail: 109.9, priceWholesale: 55, active: true, stock: 44 },
    { id: "6", name: "Conjunto Plus Size Serena", ref: "PS-512", brand: "Bella", type: "Curto", subtype: "Conjunto", category: "Plus Size", collection: "Linha Básica", model: "Aurora", priceRetail: 229.9, priceWholesale: 116, active: true, stock: 16 },
  ],
  vendas: [
    { id: "10001", customer: "Maria Silva", date: "2026-04-19", pieces: 3, payment: "Pix", total: 469.7, status: "Gerada", origin: "Balcão" },
    { id: "10002", customer: "Boutique da Ana", date: "2026-04-18", pieces: 24, payment: "Boleto", total: 2280, status: "Gerada", origin: "Encomenda" },
    { id: "10003", customer: "Loja Bella", date: "2026-04-17", pieces: 48, payment: "Boleto 28d", total: 4560, status: "Gerada", origin: "Ficha" },
    { id: "10004", customer: "Joana Costa", date: "2026-04-14", pieces: 1, payment: "Dinheiro", total: 149.9, status: "Cancelada", origin: "Balcão" },
  ],
  encomendas: [
    { id: "ENC-201", customer: "Maria Silva", createdAt: "2026-04-10", dueDate: "2026-04-25", total: 380, entry: 100, status: "Em produção" },
    { id: "ENC-202", customer: "Joana Costa", createdAt: "2026-04-12", dueDate: "2026-04-22", total: 520, entry: 200, status: "Pronta" },
    { id: "ENC-203", customer: "Boutique da Ana", createdAt: "2026-04-15", dueDate: "2026-04-30", total: 1250, entry: 0, status: "Aberta" },
    { id: "ENC-204", customer: "Casa Aurora", createdAt: "2026-04-16", dueDate: "2026-05-05", total: 2140, entry: 1000, status: "Fabricado parcialmente" },
    { id: "ENC-205", customer: "Paula Rocha", createdAt: "2026-04-01", dueDate: "2026-04-15", total: 220, entry: 220, status: "Entregue" },
  ],
  fichas: [
    { id: "FIC-101", reseller: "Boutique da Ana", openedAt: "2026-04-01", sent: 36, returned: 8, sold: 28, totalSold: 2960, status: "Parcial" },
    { id: "FIC-102", reseller: "Loja Bella", openedAt: "2026-04-05", sent: 48, returned: 0, sold: 48, totalSold: 4560, status: "Finalizada" },
    { id: "FIC-103", reseller: "Casa Aurora", openedAt: "2026-04-12", sent: 30, returned: 0, sold: 12, totalSold: 1320, status: "Aberta" },
  ],
  contasReceber: [
    { id: "CR-001", customer: "Boutique da Ana", origin: "Venda 10002", total: 2280, received: 800, dueDate: "2026-05-03", status: "Parcial" },
    { id: "CR-002", customer: "Loja Bella", origin: "Ficha FIC-102", total: 4560, received: 0, dueDate: "2026-05-10", status: "Aberto" },
    { id: "CR-003", customer: "Maria Silva", origin: "Encomenda ENC-201", total: 380, received: 100, dueDate: "2026-04-25", status: "Parcial" },
    { id: "CR-004", customer: "Casa Aurora", origin: "Encomenda ENC-204", total: 2140, received: 1000, dueDate: "2026-05-05", status: "Aberto" },
  ],
  itensVenda: {
    "10001": [
      { product: "Short Doll Renda", ref: "SD-102", size: "M", quantity: 2, unitPrice: 149.9 },
      { product: "Robe Malha Confort", ref: "RB-405", size: "G", quantity: 1, unitPrice: 169.9 },
    ],
    "10002": [
      { product: "Pijama Americano Soft", ref: "PA-310", size: "M", quantity: 12, unitPrice: 95 },
      { product: "Camisola Cetim Luna", ref: "CL-210", size: "G", quantity: 12, unitPrice: 95 },
    ],
    "10003": [
      { product: "Short Doll Renda", ref: "SD-102", size: "P", quantity: 16, unitPrice: 95 },
      { product: "Short Doll Renda", ref: "SD-102", size: "M", quantity: 16, unitPrice: 95 },
      { product: "Short Doll Renda", ref: "SD-102", size: "G", quantity: 16, unitPrice: 95 },
    ],
  },
  itensEncomenda: {
    "ENC-201": [
      { product: "Short Doll Renda", ref: "SD-102", size: "M", quantity: 1, unitPrice: 149.9 },
      { product: "Robe Malha Confort", ref: "RB-405", size: "M", quantity: 1, unitPrice: 139.9 },
    ],
    "ENC-204": [
      { product: "Pijama Americano Soft", ref: "PA-310", size: "M", quantity: 10, unitPrice: 102 },
      { product: "Camisola Cetim Luna", ref: "CL-210", size: "G", quantity: 10, unitPrice: 86 },
    ],
  },
  catalogoProdutos: {
    categorias: [
      { id: "cat-adulto", name: "Adulto", grade: ["P", "M", "G", "GG"], products: 4, active: true },
      { id: "cat-infantil", name: "Infantil", grade: ["2", "4", "6", "8", "10", "12"], products: 1, active: true },
      { id: "cat-plus-size", name: "Plus Size", grade: ["G1", "G2", "G3"], products: 1, active: true },
    ],
    marcas: [
      { id: "marca-sono-leve", name: "Sono Leve", products: 3, active: true },
      { id: "marca-bella", name: "Bella", products: 2, active: true },
      { id: "marca-mini", name: "Mini", products: 1, active: true },
    ],
    tipos: [
      { id: "tipo-curto", name: "Curto", subtypes: 4, products: 4, active: true },
      { id: "tipo-longo", name: "Longo", subtypes: 2, products: 2, active: true },
    ],
    subtipos: [
      { id: "sub-short-doll", name: "Short doll", type: "Curto", products: 1, active: true },
      { id: "sub-camisola-alca", name: "Camisola de alça", type: "Curto", products: 1, active: true },
      { id: "sub-pijama-americano", name: "Pijama americano", type: "Longo", products: 1, active: true },
      { id: "sub-robe", name: "Robe", type: "Longo", products: 1, active: true },
    ],
    colecoes: [
      { id: "col-verao-2026", name: "Verão 2026", period: "Sazonal", products: 3, active: true },
      { id: "col-basica", name: "Linha Básica", period: "Contínua", products: 3, active: true },
    ],
    modelos: [
      { id: "mod-aurora", name: "Aurora", products: 2, active: true },
      { id: "mod-luna", name: "Luna", products: 2, active: true },
      { id: "mod-soft", name: "Soft", products: 2, active: true },
    ],
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

function readDb(): MockDb {
  if (typeof window === "undefined") return clone(seedDb);

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = clone(seedDb);
    writeDb(initial);
    return initial;
  }

  return JSON.parse(raw) as MockDb;
}

function writeDb(db: MockDb) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

async function list<K extends keyof MockDb>(key: K): Promise<MockDb[K]> {
  return clone(readDb()[key]);
}

function upsertById<T extends { id: string }>(items: T[], item: T) {
  const index = items.findIndex((current) => current.id === item.id);
  if (index >= 0) items[index] = item;
  else items.unshift(item);
}

function saveCatalogItem<T extends CatalogoSimples>(items: T[], prefix: string, entrada: CatalogoProdutoSalvar, extra: Omit<T, keyof CatalogoSimples>) {
  const item = {
    id: makeId(prefix),
    name: entrada.name,
    products: 0,
    active: entrada.active,
    ...extra,
  } as T;

  items.unshift(item);
}

export const api = {
  clientes: () => list("clientes"),
  produtos: () => list("produtos"),
  vendas: () => list("vendas"),
  encomendas: () => list("encomendas"),
  fichas: () => list("fichas"),
  contasReceber: () => list("contasReceber"),
  catalogoProdutos: () => list("catalogoProdutos"),
  itensVenda: async (id: string) => clone(readDb().itensVenda[id] ?? []),
  itensEncomenda: async (id: string) => clone(readDb().itensEncomenda[id] ?? []),

  salvarCliente: async (cliente: Customer) => {
    const db = readDb();
    const saved = { ...cliente, id: cliente.id || makeId("CLI") };
    upsertById(db.clientes, saved);
    writeDb(db);
    return clone(saved);
  },
  atualizarCliente: async (cliente: Customer) => api.salvarCliente(cliente),

  salvarProduto: async (produto: Product) => {
    const db = readDb();
    const saved = { ...produto, id: produto.id || makeId("PROD") };
    upsertById(db.produtos, saved);
    writeDb(db);
    return clone(saved);
  },
  atualizarProduto: async (produto: Product) => api.salvarProduto(produto),

  salvarVenda: async (entrada: VendaSalvar) => {
    const db = readDb();
    const id = entrada.id || makeId("VENDA");
    const sale: Sale = {
      id,
      customer: entrada.customer,
      date: entrada.date || todayIso(),
      pieces: entrada.pieces,
      payment: entrada.payment,
      total: entrada.total,
      status: entrada.status,
      origin: entrada.origin,
    };
    upsertById(db.vendas, sale);
    db.itensVenda[id] = entrada.items ?? db.itensVenda[id] ?? [];
    writeDb(db);
    return clone(sale);
  },
  atualizarVenda: async (entrada: VendaSalvar & { id: string }) => api.salvarVenda(entrada),

  salvarEncomenda: async (entrada: EncomendaSalvar) => {
    const db = readDb();
    const id = entrada.id || makeId("ENC");
    const order: Order = {
      id,
      customer: entrada.customer,
      createdAt: entrada.createdAt || todayIso(),
      dueDate: entrada.dueDate,
      total: entrada.total,
      entry: entrada.entry,
      status: entrada.status,
    };
    upsertById(db.encomendas, order);
    db.itensEncomenda[id] = entrada.items ?? db.itensEncomenda[id] ?? [];
    writeDb(db);
    return clone(order);
  },
  atualizarEncomenda: async (entrada: EncomendaSalvar & { id: string }) => api.salvarEncomenda(entrada),
  atualizarStatusEncomenda: async (id: string, status: Order["status"]) => {
    const db = readDb();
    const order = db.encomendas.find((item) => item.id === id);
    if (!order) throw new Error("Encomenda não encontrada.");
    order.status = status;
    writeDb(db);
    return clone(order);
  },

  salvarFicha: async (entrada: FichaSalvar) => {
    const db = readDb();
    const ficha: Ficha = {
      id: entrada.id || makeId("FIC"),
      reseller: entrada.reseller,
      openedAt: entrada.openedAt || todayIso(),
      sent: entrada.sent,
      returned: entrada.returned,
      sold: entrada.sold,
      totalSold: entrada.totalSold,
      status: entrada.status,
    };
    upsertById(db.fichas, ficha);
    writeDb(db);
    return clone(ficha);
  },
  atualizarFicha: async (entrada: FichaSalvar & { id: string }) => api.salvarFicha(entrada),

  salvarCategoriaProduto: async (entrada: CatalogoProdutoSalvar) => {
    const db = readDb();
    db.catalogoProdutos.categorias.unshift({
      id: makeId("CAT"),
      name: entrada.name,
      grade: entrada.grade ?? [],
      products: 0,
      active: entrada.active,
    });
    writeDb(db);
    return clone(db.catalogoProdutos);
  },
  salvarMarcaProduto: async (entrada: CatalogoProdutoSalvar) => {
    const db = readDb();
    saveCatalogItem(db.catalogoProdutos.marcas, "MARCA", entrada, {});
    writeDb(db);
    return clone(db.catalogoProdutos);
  },
  salvarTipoProduto: async (entrada: CatalogoProdutoSalvar) => {
    const db = readDb();
    saveCatalogItem(db.catalogoProdutos.tipos, "TIPO", entrada, { subtypes: 0 });
    writeDb(db);
    return clone(db.catalogoProdutos);
  },
  salvarSubtipoProduto: async (entrada: CatalogoProdutoSalvar) => {
    const db = readDb();
    saveCatalogItem(db.catalogoProdutos.subtipos, "SUB", entrada, { type: entrada.type ?? "" });
    writeDb(db);
    return clone(db.catalogoProdutos);
  },
  salvarColecaoProduto: async (entrada: CatalogoProdutoSalvar) => {
    const db = readDb();
    saveCatalogItem(db.catalogoProdutos.colecoes, "COL", entrada, { period: entrada.period ?? "Contínua" });
    writeDb(db);
    return clone(db.catalogoProdutos);
  },
  salvarModeloProduto: async (entrada: CatalogoProdutoSalvar) => {
    const db = readDb();
    saveCatalogItem(db.catalogoProdutos.modelos, "MOD", entrada, {});
    writeDb(db);
    return clone(db.catalogoProdutos);
  },
};

export function resetMockData() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function useClientes() {
  return useQuery({ queryKey: ["clientes"], queryFn: api.clientes, initialData: seedDb.clientes });
}

export function useProdutos() {
  return useQuery({ queryKey: ["produtos"], queryFn: api.produtos, initialData: seedDb.produtos });
}

export function useVendas() {
  return useQuery({ queryKey: ["vendas"], queryFn: api.vendas, initialData: seedDb.vendas });
}

export function useEncomendas() {
  return useQuery({ queryKey: ["encomendas"], queryFn: api.encomendas, initialData: seedDb.encomendas });
}

export function useFichas() {
  return useQuery({ queryKey: ["fichas"], queryFn: api.fichas, initialData: seedDb.fichas });
}

export function useContasReceber() {
  return useQuery({ queryKey: ["contas-receber"], queryFn: api.contasReceber, initialData: seedDb.contasReceber });
}

export function useItensVenda(id: string) {
  return useQuery({ queryKey: ["vendas", id, "itens"], queryFn: () => api.itensVenda(id), initialData: seedDb.itensVenda[id] ?? [] });
}

export function useItensEncomenda(id: string) {
  return useQuery({ queryKey: ["encomendas", id, "itens"], queryFn: () => api.itensEncomenda(id), initialData: seedDb.itensEncomenda[id] ?? [] });
}

export function useDadosOperacionais() {
  const clientes = useClientes();
  const produtos = useProdutos();
  const vendas = useVendas();
  const encomendas = useEncomendas();
  const fichas = useFichas();
  const contas = useContasReceber();

  return {
    customers: clientes.data,
    products: produtos.data,
    sales: vendas.data,
    orders: encomendas.data,
    fichas: fichas.data,
    accounts: contas.data,
    isLoading: clientes.isLoading || produtos.isLoading || vendas.isLoading || encomendas.isLoading || fichas.isLoading || contas.isLoading,
  };
}

export function useCatalogoProdutos() {
  return useQuery({
    queryKey: ["catalogo-produtos"],
    queryFn: api.catalogoProdutos,
    initialData: seedDb.catalogoProdutos,
  });
}
