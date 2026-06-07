export type ModalidadeProduto = 0 | 1; // 0 = Aberto, 1 = Fechado

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
  marcaId?: string;
  marcaNome?: string;
  tipoId?: string;
  tipoNome?: string;
  subtipoId?: string;
  subtipoNome?: string;
  categoriaId?: string;
  categoriaNome?: string;
  categoriaGrade?: string[];
  colecaoId?: string;
  colecaoNome?: string;
  precoVarejo: number;
  precoAtacado: number;
  ativo: boolean;
  modalidade: ModalidadeProduto;
  estoque: number;
  imagemUrl?: string;
}

export interface ItemVenda {
  id: string;
  produtoId: string;
  produtoNome: string;
  produtoRef: string;
  tamanho: string;
  quantidade: number;
  precoUnitario: number;
  descontoPct?: number;
  descontoVal?: number;
}

export interface Sale {
  id: string;
  clienteId: string;
  clienteNome: string;
  formaPagamentoId?: string;
  formaPagamentoNome?: string;
  data: string;
  pecas: number;
  total: number;
  status: SaleStatus;
  origem: "Balcão" | "Encomenda" | "Ficha";
}

export interface Order {
  id: string;
  clienteId: string;
  clienteNome: string;
  criadoEm: string;
  previsao: string;
  total: number;
  entrada: number;
  pecas: number;
  status: OrderStatus;
}

export interface Ficha {
  id: string;
  clienteId: string;
  revendedoraNome: string;
  dataAbertura: string;
  enviadas: number;
  devolvidas: number;
  vendidas: number;
  totalVendido: number;
  status: FichaStatus;
}

export interface Account {
  id: string;
  clienteId: string;
  clienteNome: string;
  ehManual: boolean;
  origem: string;
  descricao?: string;
  vendaId?: string;
  total: number;
  recebido: number;
  valorLiquido: number;
  vencimento: string;
  status: AccountStatus;
  numeroParcelas?: number;
  percentualTaxaCartao?: number;
  taxaFixaCartao?: number;
  valorTaxaCartao?: number;
  criadoEm: string;
}

export function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatDate(date: string) {
  return new Date(date.substring(0, 10) + "T00:00:00").toLocaleDateString("pt-BR");
}
