export type SaleStatus = "Gerada" | "Cancelada";
export type OrderStatus = "Aberta" | "Em produção" | "Fabricado parcialmente" | "Pronta" | "Entregue" | "Cancelada";
export type FichaStatus = "Aberta" | "Parcial" | "Finalizada" | "Cancelada";
export type AccountStatus = "Aberto" | "Parcial" | "Pago" | "Atrasado" | "Cancelado";
export type CustomerType = "varejo" | "atacado";

export interface Customer {
  id: string;
  nome: string;
  telefone: string;
  cpf: string;
  tipo: CustomerType;
  status: "Ativo" | "Inativo";
  credito: number;
}

export interface Product {
  id: string;
  nome: string;
  ref: string;
  marca: string;
  tipo: string;
  subtipo: string;
  categoria: string;
  colecao?: string;
  modelo?: string;
  precoVarejo: number;
  precoAtacado: number;
  ativo: boolean;
  estoque: number;
  imagemUrl?: string;
}

export interface PieceDetailItem {
  product: string;
  ref: string;
  size: string;
  quantity: number;
  unitPrice: number;
}

export interface Sale {
  id: string;
  cliente: string;
  data: string;
  pecas: number;
  pagamento: string;
  total: number;
  status: SaleStatus;
  origem: "Balcão" | "Encomenda" | "Ficha";
}

export interface Order {
  id: string;
  cliente: string;
  criadoEm: string;
  previsao: string;
  total: number;
  entrada: number;
  pecas: number;
  status: OrderStatus;
}

export interface Ficha {
  id: string;
  revendedora: string;
  dataAbertura: string;
  enviadas: number;
  devolvidas: number;
  vendidas: number;
  totalVendido: number;
  status: FichaStatus;
}

export interface Account {
  id: string;
  cliente: string;
  origem: string;
  total: number;
  recebido: number;
  vencimento: string;
  status: AccountStatus;
}

export function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatDate(date: string) {
  return new Date(date.substring(0, 10) + "T00:00:00").toLocaleDateString("pt-BR");
}
