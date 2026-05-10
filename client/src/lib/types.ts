export type SaleStatus = "Gerada" | "Cancelada";
export type OrderStatus = "Aberta" | "Em produção" | "Fabricado parcialmente" | "Pronta" | "Entregue" | "Cancelada";
export type FichaStatus = "Aberta" | "Parcial" | "Finalizada" | "Cancelada";
export type AccountStatus = "Aberto" | "Parcial" | "Pago" | "Atrasado" | "Cancelado";
export type CustomerType = "varejo" | "atacado";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  cpf: string;
  type: CustomerType;
  status: "Ativo" | "Inativo";
  credit: number;
}

export interface Product {
  id: string;
  name: string;
  ref: string;
  brand: string;
  type: string;
  subtype: string;
  category: string;
  collection?: string;
  model?: string;
  priceRetail: number;
  priceWholesale: number;
  active: boolean;
  stock: number;
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
  customer: string;
  date: string;
  pieces: number;
  payment: string;
  total: number;
  status: SaleStatus;
  origin: "Balcão" | "Encomenda" | "Ficha";
}

export interface Order {
  id: string;
  customer: string;
  createdAt: string;
  dueDate: string;
  total: number;
  entry: number;
  status: OrderStatus;
}

export interface Ficha {
  id: string;
  reseller: string;
  openedAt: string;
  sent: number;
  returned: number;
  sold: number;
  totalSold: number;
  status: FichaStatus;
}

export interface Account {
  id: string;
  customer: string;
  origin: string;
  total: number;
  received: number;
  dueDate: string;
  status: AccountStatus;
}

export function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatDate(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("pt-BR");
}
