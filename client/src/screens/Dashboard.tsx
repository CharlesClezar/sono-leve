"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { AppSelect } from "@/components/AppSelect";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBRL, formatDate, type ItemVenda, type OrderStatus } from "@/lib/types";
import { api, useDashboard, useEncomendasCalendario, DASHBOARD_KPIS_VAZIO, ENCOMENDAS_CALENDARIO_VAZIAS } from "@/lib/api";
import type { VendaDashboard, EncomendaDashboard, FichaDashboard, ContaDashboard } from "@/lib/api";
import { useShortcutLabel } from "@/hooks/useShortcutLabel";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Sale = VendaDashboard;
type Order = EncomendaDashboard;
type Ficha = FichaDashboard;
type Account = ContaDashboard;
import {
  TrendingUp,
  Wallet,
  Clock,
  ShoppingBag,
  Receipt,
  ClipboardList,
  Package2,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Play,
  ShoppingCart,
  PackageCheck,
  X,
} from "lucide-react";

const tonalidade: Record<string, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-[hsl(var(--success-soft))] text-[hsl(var(--success))]",
  warning: "bg-warning-soft text-warning",
  info: "bg-info-soft text-info",
};

const ordemStatusCalendario: OrderStatus[] = ["Aberta", "Em produção", "Fabricado parcialmente", "Pronta"];
const rotuloStatusCalendario: Record<OrderStatus, string> = {
  Aberta: "Novo",
  "Em produção": "Em produção",
  "Fabricado parcialmente": "Fabricado parcialmente",
  Pronta: "Pronta",
  Entregue: "Entregue",
  Cancelada: "Cancelada",
};

const classePontoStatus: Record<OrderStatus, string> = {
  Aberta: "bg-primary text-primary-foreground shadow-[0_0_0_2px_rgb(255_255_255)]",
  "Em produção": "bg-warning text-warning-foreground shadow-[0_0_0_2px_rgb(255_255_255)]",
  "Fabricado parcialmente": "bg-[rgb(var(--partial))] text-white shadow-[0_0_0_2px_rgb(255_255_255)]",
  Pronta: "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] shadow-[0_0_0_2px_rgb(255_255_255)]",
  Entregue: "hidden",
  Cancelada: "hidden",
};

const classePilula: Record<OrderStatus, string> = {
  Aberta: "bg-primary-soft text-primary",
  "Em produção": "bg-warning-soft text-warning",
  "Fabricado parcialmente": "bg-[rgb(var(--partial-soft))] text-[rgb(var(--partial-foreground))]",
  Pronta: "bg-[hsl(var(--success-soft))] text-[hsl(var(--success))]",
  Entregue: "bg-muted text-muted-foreground",
  Cancelada: "bg-[hsl(var(--destructive-soft))] text-[hsl(var(--destructive))]",
};

type PeriodoDashboard = "today" | "7d" | "30d" | "all";

type ConfirmacaoPendente = { id: string; novoStatus: OrderStatus; mensagem: string } | null;
type ModalItensPendente = { id: string; itens: ItemVenda[]; modo: "parcial" | "finalizar" } | null;

const formatarDataIso = (data: Date) => {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
};

const deslocarDias = (iso: string, quantidade: number) => {
  const data = new Date(`${iso}T00:00:00`);
  data.setDate(data.getDate() + quantidade);
  return formatarDataIso(data);
};


export default function Dashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const atalhoNovaVenda = useShortcutLabel("dashboard_new_sale");
  const atalhoNovaEncomenda = useShortcutLabel("dashboard_new_order");
  const atalhoNovaFicha = useShortcutLabel("dashboard_new_ficha");
  const [periodoSelecionado, setPeriodoSelecionado] = useState<PeriodoDashboard>("today");
  const [dataBaseCalendario, setDataBaseCalendario] = useState(() => new Date());
  const { calendarioInicio, calendarioFim } = useMemo(() => {
    const ano = dataBaseCalendario.getFullYear();
    const mes = dataBaseCalendario.getMonth();
    const primeiroDia = new Date(ano, mes, 1).getDay();
    return {
      calendarioInicio: formatarDataIso(new Date(ano, mes, 1 - primeiroDia)),
      calendarioFim: formatarDataIso(new Date(ano, mes, 1 - primeiroDia + 41)),
    };
  }, [dataBaseCalendario]);
  const { data: dadosDashboard = DASHBOARD_KPIS_VAZIO } = useDashboard();
  const { data: encomendas = ENCOMENDAS_CALENDARIO_VAZIAS } = useEncomendasCalendario(calendarioInicio, calendarioFim);
  const vendas = dadosDashboard.vendas;
  const fichas = dadosDashboard.fichas;
  const contas = dadosDashboard.contas;
  const [statusPorId, setStatusPorId] = useState<Record<string, OrderStatus>>(
    () => Object.fromEntries(encomendas.map((encomenda) => [encomenda.id, encomenda.status as OrderStatus])),
  );
  const [confirmacaoPendente, setConfirmacaoPendente] = useState<ConfirmacaoPendente>(null);
  const [modalItens, setModalItens] = useState<ModalItensPendente>(null);
  const [carregandoItensId, setCarregandoItensId] = useState<string | null>(null);

  useEffect(() => {
    setStatusPorId((atual) => ({
      ...Object.fromEntries(encomendas.map((encomenda) => [encomenda.id, encomenda.status as OrderStatus])),
      ...atual,
    }));
  }, [encomendas]);

  const celulas = useMemo(() => {
  const ano = dataBaseCalendario.getFullYear();
  const mes = dataBaseCalendario.getMonth();
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const anoMesAnterior = mes === 0 ? ano - 1 : ano;
  const mesAnterior = mes === 0 ? 11 : mes - 1;
  const anoProximoMes = mes === 11 ? ano + 1 : ano;
  const proximoMes = mes === 11 ? 0 : mes + 1;
  const diasMesAnterior = new Date(ano, mes, 0).getDate();
  return Array.from({ length: 42 }, (_, index) => {
    const numeroDia = index - primeiroDia + 1;

    if (numeroDia <= 0) {
      const dia = diasMesAnterior + numeroDia;
      return {
        dia,
        noMesAtual: false,
        iso: `${anoMesAnterior}-${String(mesAnterior + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`,
      };
    }

    if (numeroDia > diasNoMes) {
      const dia = numeroDia - diasNoMes;
      return {
        dia,
        noMesAtual: false,
        iso: `${anoProximoMes}-${String(proximoMes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`,
      };
    }

    return {
      dia: numeroDia,
      noMesAtual: true,
      iso: `${ano}-${String(mes + 1).padStart(2, "0")}-${String(numeroDia).padStart(2, "0")}`,
    };
  });
  }, [dataBaseCalendario]);

  const entregasPorData = useMemo(() => {
    const agrupadas = new Map<string, typeof encomendas>();
    encomendas.forEach((encomenda) => {
      const statusAtual = statusPorId[encomenda.id] ?? encomenda.status;
      if (statusAtual === "Cancelada" || statusAtual === "Entregue") return;
      const iso = encomenda.previsao.substring(0, 10);
      const atuais = agrupadas.get(iso) ?? [];
      atuais.push(encomenda);
      agrupadas.set(iso, atuais);
    });
    return agrupadas;
  }, [encomendas, statusPorId]);

  const isosEntregasVisiveis = useMemo(
    () => celulas.map((celula) => celula.iso).filter((iso) => entregasPorData.has(iso)),
    [celulas, entregasPorData]
  );
  const diasEntrega = new Set(isosEntregasVisiveis);
  const dataAtualIso = useMemo(() => {
    const hoje = new Date();
    return formatarDataIso(hoje);
  }, []);
  const intervaloPeriodo = useMemo(() => {
    if (periodoSelecionado === "all") return null;
    if (periodoSelecionado === "today") return { inicio: dataAtualIso, fim: dataAtualIso };
    if (periodoSelecionado === "7d") return { inicio: deslocarDias(dataAtualIso, -6), fim: dataAtualIso };
    return { inicio: deslocarDias(dataAtualIso, -29), fim: dataAtualIso };
  }, [dataAtualIso, periodoSelecionado]);

  const vendasFiltradas = useMemo(
    () =>
      vendas.filter(
        (venda) =>
          venda.status === "Gerada" &&
          (intervaloPeriodo ? venda.data.substring(0, 10) >= intervaloPeriodo.inicio && venda.data.substring(0, 10) <= intervaloPeriodo.fim : true)
      ),
    [vendas, intervaloPeriodo]
  );
  const contasFiltradas = useMemo(
    () =>
      contas.filter((conta) =>
        intervaloPeriodo ? conta.vencimento.substring(0, 10) >= intervaloPeriodo.inicio && conta.vencimento.substring(0, 10) <= intervaloPeriodo.fim : true
      ),
    [contas, intervaloPeriodo]
  );
  const fichasFiltradas = useMemo(
    () =>
      fichas.filter((ficha) =>
        intervaloPeriodo ? ficha.dataAbertura.substring(0, 10) >= intervaloPeriodo.inicio && ficha.dataAbertura.substring(0, 10) <= intervaloPeriodo.fim : true
      ),
    [fichas, intervaloPeriodo]
  );
  const encomendasFiltradas = useMemo(
    () =>
      encomendas.filter((encomenda) =>
        intervaloPeriodo ? encomenda.previsao.substring(0, 10) >= intervaloPeriodo.inicio && encomenda.previsao.substring(0, 10) <= intervaloPeriodo.fim : true
      ),
    [encomendas, intervaloPeriodo]
  );
  const kpis = useMemo(() => {
    const faturado = vendasFiltradas.reduce((total, venda) => total + venda.total, 0);
    const recebido = contasFiltradas.reduce((total, conta) => total + conta.recebido, 0);
    const emAberto = contasFiltradas.reduce((total, conta) => total + Math.max(conta.total - conta.recebido, 0), 0);
    const numVendas = vendasFiltradas.length;
    const ticketMedio = numVendas > 0 ? faturado / numVendas : 0;
    const fichasAbertas = fichasFiltradas.filter((ficha) => ficha.status === "Aberta" || ficha.status === "Parcial").length;
    const encomendasProntas = encomendasFiltradas.filter((encomenda) => (statusPorId[encomenda.id] ?? encomenda.status) === "Pronta").length;

    return [
      { label: "Faturado", value: formatBRL(faturado), icon: TrendingUp, tom: "primary" },
      { label: "Recebido", value: formatBRL(recebido), icon: Wallet, tom: "success" },
      { label: "Em aberto", value: formatBRL(emAberto), icon: Clock, tom: "warning" },
      { label: "Vendas", value: numVendas.toString(), icon: ShoppingBag, tom: "primary" },
      { label: "Ticket médio", value: formatBRL(ticketMedio), icon: Receipt, tom: "primary" },
      { label: "Fichas abertas", value: fichasAbertas.toString(), icon: ClipboardList, tom: "primary" },
      { label: "Encomendas prontas", value: encomendasProntas.toString(), icon: Package2, tom: "info" },
    ];
  }, [contasFiltradas, fichasFiltradas, encomendasFiltradas, vendasFiltradas, statusPorId]);

  const [dataIsoSelecionada, setDataIsoSelecionada] = useState<string | null>(null);
  useEffect(() => {
    setDataIsoSelecionada((atual) => {
      if (atual && celulas.some((celula) => celula.iso === atual)) return atual;
      if (celulas.some((celula) => celula.iso === dataAtualIso)) return dataAtualIso;
      return isosEntregasVisiveis[0] ?? null;
    });
  }, [celulas, dataAtualIso, entregasPorData, isosEntregasVisiveis]);

  const encomendasSelecionadas = dataIsoSelecionada ? entregasPorData.get(dataIsoSelecionada) ?? [] : [];
  const rotuloDataSelecionada = dataIsoSelecionada ? formatDate(dataIsoSelecionada) : null;

  const moverStatus = async (id: string, novoStatus: OrderStatus) => {
    setStatusPorId((atual) => ({ ...atual, [id]: novoStatus }));
    await api.atualizarStatusEncomenda(id, novoStatus);
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const abrirConfirmacaoIniciar = (id: string) =>
    setConfirmacaoPendente({ id, novoStatus: "Em produção", mensagem: "Confirma o início da produção desta encomenda?" });

  const abrirConfirmacaoConcluir = (id: string) =>
    setConfirmacaoPendente({
      id,
      novoStatus: "Pronta",
      mensagem: "Confirma a conclusão de todos os itens desta encomenda? Todos os produtos serão marcados como concluídos.",
    });

  const confirmarAcao = async () => {
    if (!confirmacaoPendente) return;
    const { id, novoStatus } = confirmacaoPendente;
    setConfirmacaoPendente(null);
    await moverStatus(id, novoStatus);
  };

  const abrirModalItens = async (id: string, modo: "parcial" | "finalizar") => {
    setCarregandoItensId(id);
    try {
      const itens = await api.itensEncomenda(id);
      setModalItens({ id, itens, modo });
    } finally {
      setCarregandoItensId(null);
    }
  };

  const confirmarSelecaoItens = async (itensConcluidos: ItemVenda[]) => {
    if (!modalItens) return;
    const { id, modo } = modalItens;
    setModalItens(null);
    if (modo === "parcial") {
      localStorage.setItem(`sono_leve_parcial_${id}`, JSON.stringify(itensConcluidos));
      await moverStatus(id, "Fabricado parcialmente");
    } else {
      await moverStatus(id, "Pronta");
    }
  };

  const irParaVenda = (id: string, status: OrderStatus) => {
    if (status === "Fabricado parcialmente") {
      const parcialStr = localStorage.getItem(`sono_leve_parcial_${id}`);
      const itensParciais: ItemVenda[] = parcialStr ? JSON.parse(parcialStr) : [];
      sessionStorage.setItem("sono_leve_itens_venda", JSON.stringify(itensParciais));
      router.push(`/vendas/nova?from=encomenda&id=${id}&parcial=1`);
    } else {
      router.push(`/vendas/nova?from=encomenda&id=${id}`);
    }
  };

  const direcaoNav = useRef<"anterior" | "proximo">("proximo");

  const irParaMesAnterior = () => {
    direcaoNav.current = "anterior";
    setDataBaseCalendario((atual) => new Date(atual.getFullYear(), atual.getMonth() - 1, 1));
  };

  const irParaProximoMes = () => {
    direcaoNav.current = "proximo";
    setDataBaseCalendario((atual) => new Date(atual.getFullYear(), atual.getMonth() + 1, 1));
  };

  return (
    <AppShell>
      <PageHeader
        breadcrumb={["Dashboard"]}
        title="Visão geral"
        infoTooltip="Resumo operacional do negócio com indicadores, agenda de entregas, alertas e atalhos para as principais ações."
        actions={
          <>
            <AppSelect
              className="h-9 w-[170px]"
              value={periodoSelecionado}
              onValueChange={(value) => setPeriodoSelecionado(value as PeriodoDashboard)}
              options={[
                { value: "today", label: "Hoje" },
                { value: "7d", label: "Últimos 7 dias" },
                { value: "30d", label: "Últimos 30 dias" },
                { value: "all", label: "Todo o período" },
              ]}
            />
            <Button asChild variant="outline">
              <Link href="/fichas/nova?from=dashboard">{`Nova ficha${atalhoNovaFicha}`}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/encomendas/nova?from=dashboard">{`Nova encomenda${atalhoNovaEncomenda}`}</Link>
            </Button>
            <Button asChild>
              <Link href="/vendas/nova?from=dashboard">{`Nova venda${atalhoNovaVenda}`}</Link>
            </Button>
          </>
        }
      />

      <div className="p-3 lg:h-[calc(100svh-7.5rem)] lg:overflow-hidden lg:p-4">
        <div className="flex flex-col gap-3 lg:h-full lg:gap-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
            {kpis.map((k) => (
              <Card key={k.label} className="p-3 transition hover:shadow-md">
                <div className="mb-2 flex items-center gap-2">
                  <div className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${tonalidade[k.tom]}`}>
                    <k.icon className="h-4 w-4" />
                  </div>
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k.label}</div>
                </div>
                <div className="mt-1 text-lg font-semibold tracking-tight xl:text-xl">{k.value}</div>
              </Card>
            ))}
          </div>

          <div className="grid items-start gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-3 lg:items-stretch">
            <Card className="flex h-full flex-col overflow-hidden p-3 lg:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold">Calendário de entregas</h3>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={irParaMesAnterior}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label="Mês anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="min-w-[120px] text-center text-xs text-muted-foreground sm:text-sm">
                    {dataBaseCalendario.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                  </span>
                  <button
                    type="button"
                    onClick={irParaProximoMes}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label="Próximo mês"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center sm:gap-1.5">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                  <div key={d} className="py-0.5 text-[10px] font-medium text-muted-foreground sm:py-1 sm:text-xs">{d}</div>
                ))}
              </div>
              <div
                key={calendarioInicio}
                className={`grid flex-1 grid-cols-7 grid-rows-6 gap-1 text-center sm:gap-1.5 animate-in fade-in duration-200 ${direcaoNav.current === "proximo" ? "slide-in-from-right-3" : "slide-in-from-left-3"}`}
              >
                {celulas.map((celula, i) => (
                  (() => {
                    const { dia, noMesAtual, iso } = celula;
                    const encomendasDia = entregasPorData.get(iso) ?? [];
                    const contagensStatusDia = ordemStatusCalendario
                      .map((status) => ({
                        status,
                        count: encomendasDia.filter((encomenda) => (statusPorId[encomenda.id] ?? encomenda.status) === status).length,
                      }))
                      .filter((entrada) => entrada.count > 0);

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setDataIsoSelecionada(iso)}
                        className={`relative flex h-full min-h-[3.25rem] items-center justify-center rounded-xl border text-sm font-medium transition-all sm:min-h-[3.5rem] sm:text-base ${
                          diasEntrega.has(iso)
                            ? dataIsoSelecionada === iso
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "border-primary/35 bg-primary-soft/90 font-semibold text-primary hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary-soft hover:shadow-sm"
                            : noMesAtual
                              ? "border-transparent text-foreground hover:bg-muted"
                              : "border-transparent text-muted-foreground/40 hover:bg-muted/40"
                        } ${dataIsoSelecionada === iso ? "ring-2 ring-primary ring-offset-1" : ""}`}
                      >
                        <span className={`${contagensStatusDia.length > 0 ? "pb-3" : ""}`}>{dia}</span>
                        {contagensStatusDia.length > 0 && (
                          <span className="absolute bottom-1 right-1 flex items-center gap-1">
                            {contagensStatusDia.map(({ status, count }) => (
                              <span
                                key={status}
                                className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none ${classePontoStatus[status]}`}
                                title={`${count} ${rotuloStatusCalendario[status]}`}
                              >
                                {count}
                              </span>
                            ))}
                          </span>
                        )}
                      </button>
                    );
                  })()
                ))}
              </div>
            </Card>

            <Card className="flex h-full min-h-0 flex-col overflow-hidden p-3">
              <div className="mb-2 flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Encomendas do dia</h3>
              </div>
              {rotuloDataSelecionada ? (
                <p className="mb-3 text-sm text-muted-foreground">
                  {encomendasSelecionadas.length > 0
                    ? `${encomendasSelecionadas.length} encomenda${encomendasSelecionadas.length > 1 ? "s" : ""} para ${rotuloDataSelecionada}`
                    : `Nenhuma encomenda para ${rotuloDataSelecionada}`}
                </p>
              ) : (
                <p className="mb-3 text-sm text-muted-foreground">
                  Selecione uma data destacada no calendário.
                </p>
              )}
              <div className="min-h-0 flex-1">
                {encomendasSelecionadas.length > 0 ? (
                  <ul className="space-y-2 lg:h-full lg:overflow-y-auto lg:pr-1">
                    {encomendasSelecionadas.map((encomenda) => (
                      <li
                        key={encomenda.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => router.push(`/encomendas?encomenda=${encodeURIComponent(encomenda.id)}`)}
                        onKeyDown={(event) => {
                          if (event.target !== event.currentTarget) return;
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            router.push(`/encomendas?encomenda=${encodeURIComponent(encomenda.id)}`);
                          }
                        }}
                        className="cursor-pointer rounded-lg border bg-muted/30 p-3 transition hover:border-primary/35 hover:bg-primary-soft/40 focus-within:border-primary/35"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium">{encomenda.clienteNome}</div>
                            <div className="text-xs text-muted-foreground">{encomenda.id}</div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${classePilula[statusPorId[encomenda.id] ?? encomenda.status]}`}>
                              {rotuloStatusCalendario[statusPorId[encomenda.id] ?? encomenda.status]}
                            </span>
                            <BotaoAcaoEncomendaDashboard
                              id={encomenda.id}
                              status={statusPorId[encomenda.id] ?? encomenda.status}
                              carregando={carregandoItensId === encomenda.id}
                              aoIniciar={abrirConfirmacaoIniciar}
                              aoConcluirTudo={abrirConfirmacaoConcluir}
                              aoConcluirParcial={(id) => abrirModalItens(id, "parcial")}
                              aoFinalizarParcial={(id) => abrirModalItens(id, "finalizar")}
                              aoVender={irParaVenda}
                            />
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Total</span>
                          <span className="font-semibold">{formatBRL(encomenda.total)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                    Clique em uma data com destaque azul para visualizar as encomendas previstas.
                  </div>
                )}
              </div>
              <div className="mt-3">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/encomendas">Ver todas as encomendas</Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {confirmacaoPendente && (
        <ModalConfirmacao
          mensagem={confirmacaoPendente.mensagem}
          onConfirmar={confirmarAcao}
          onCancelar={() => setConfirmacaoPendente(null)}
        />
      )}
      {modalItens && (
        <ModalSelecaoItens
          itens={modalItens.itens}
          modo={modalItens.modo}
          onConfirmar={confirmarSelecaoItens}
          onCancelar={() => setModalItens(null)}
        />
      )}
    </AppShell>
  );
}

function BotaoAcaoEncomendaDashboard({
  id,
  status,
  carregando,
  aoIniciar,
  aoConcluirTudo,
  aoConcluirParcial,
  aoFinalizarParcial,
  aoVender,
}: {
  id: string;
  status: OrderStatus;
  carregando: boolean;
  aoIniciar: (id: string) => void;
  aoConcluirTudo: (id: string) => void;
  aoConcluirParcial: (id: string) => void;
  aoFinalizarParcial: (id: string) => void;
  aoVender: (id: string, status: OrderStatus) => void;
}) {
  if (status === "Aberta") {
    return (
      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); aoIniciar(id); }}
        disabled={carregando}
        className="inline-flex h-8 w-28 items-center justify-center gap-1.5 rounded-md border border-primary/25 bg-primary/10 text-xs font-medium text-primary transition hover:bg-primary/15 disabled:opacity-50"
      >
        <Play className="h-3.5 w-3.5" />
        Iniciar
      </button>
    );
  }

  if (status === "Em produção") {
    return (
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={(event) => { event.stopPropagation(); aoConcluirParcial(id); }}
          disabled={carregando}
          className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-warning/30 bg-warning-soft px-2.5 text-xs font-medium text-warning transition hover:bg-warning/10 disabled:opacity-50"
        >
          <PackageCheck className="h-3.5 w-3.5" />
          Parcial
        </button>
        <button
          type="button"
          onClick={(event) => { event.stopPropagation(); aoConcluirTudo(id); }}
          disabled={carregando}
          className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
        >
          <CircleCheck className="h-3.5 w-3.5" />
          Concluir
        </button>
      </div>
    );
  }

  if (status === "Fabricado parcialmente") {
    return (
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={(event) => { event.stopPropagation(); aoFinalizarParcial(id); }}
          disabled={carregando}
          className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-[rgb(var(--partial))/0.35] bg-[rgb(var(--partial-soft))] px-2.5 text-xs font-medium text-[rgb(var(--partial-foreground))] transition hover:opacity-80 disabled:opacity-50"
        >
          <CircleCheck className="h-3.5 w-3.5" />
          Concluir
        </button>
        <button
          type="button"
          onClick={(event) => { event.stopPropagation(); aoVender(id, status); }}
          disabled={carregando}
          className="inline-flex h-8 items-center justify-center gap-1 rounded-md bg-emerald-600 px-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Vender
        </button>
      </div>
    );
  }

  if (status === "Pronta") {
    return (
      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); aoVender(id, status); }}
        className="inline-flex h-8 w-28 items-center justify-center gap-1.5 rounded-md bg-emerald-600 text-xs font-semibold text-white transition hover:bg-emerald-700"
      >
        <ShoppingCart className="h-3.5 w-3.5" />
        Vender
      </button>
    );
  }

  return null;
}

function ModalConfirmacao({
  mensagem,
  onConfirmar,
  onCancelar,
}: {
  mensagem: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  const confirmarRef = useRef<HTMLButtonElement>(null);
  const cancelarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmarRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onCancelar}
      onKeyDown={(e) => { if (e.key === "Escape") onCancelar(); }}
    >
      <div
        className="w-96 rounded-xl border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-2 text-base font-semibold">Confirmar ação</h3>
        <p className="mb-6 text-sm text-muted-foreground">{mensagem}</p>
        <div className="flex justify-end gap-3">
          <button
            ref={cancelarRef}
            type="button"
            onClick={onCancelar}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            onKeyDown={(e) => {
              if (e.key === "Tab" || e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                confirmarRef.current?.focus();
              }
            }}
          >
            Cancelar
          </button>
          <button
            ref={confirmarRef}
            type="button"
            onClick={onConfirmar}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            onKeyDown={(e) => {
              if (e.key === "Tab" || e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                cancelarRef.current?.focus();
              }
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalSelecaoItens({
  itens,
  modo,
  onConfirmar,
  onCancelar,
}: {
  itens: ItemVenda[];
  modo: "parcial" | "finalizar";
  onConfirmar: (itensSelecionados: ItemVenda[]) => void;
  onCancelar: () => void;
}) {
  const [quantidades, setQuantidades] = useState<number[]>(() => itens.map((i) => i.quantidade));

  const atualizar = (idx: number, val: number) =>
    setQuantidades((prev) => prev.map((q, i) => (i === idx ? Math.max(0, Math.min(itens[idx].quantidade, val)) : q)));

  const agrupados = useMemo(() => {
    const map = new Map<string, { item: ItemVenda; idx: number }[]>();
    itens.forEach((item, idx) => {
      const key = `${item.produtoRef}__${item.produtoNome}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ item, idx });
    });
    return Array.from(map.entries());
  }, [itens]);

  const itensConcluidos = itens
    .map((item, i) => ({ ...item, quantidade: quantidades[i] }))
    .filter((item) => item.quantidade > 0);

  const titulo = modo === "parcial" ? "Conclusão parcial" : "Concluir encomenda";
  const descricao =
    modo === "parcial"
      ? "Informe quantas peças de cada item foram concluídas. Itens com zero não serão registrados."
      : "Informe quais itens foram concluídos nesta etapa.";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onCancelar}
      onKeyDown={(e) => { if (e.key === "Escape") onCancelar(); }}
    >
      <div
        className="flex max-h-[85vh] w-[520px] flex-col overflow-hidden rounded-xl border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b p-5">
          <div>
            <h3 className="font-semibold">{titulo}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>
          </div>
          <button
            type="button"
            onClick={onCancelar}
            className="ml-4 shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {agrupados.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum item cadastrado nesta encomenda.</p>
          )}
          {agrupados.map(([key, entries]) => {
            const { item } = entries[0];
            return (
              <div key={key} className="rounded-lg border p-4">
                <div className="mb-3">
                  <div className="text-sm font-medium">{item.produtoNome}</div>
                  <div className="text-xs text-muted-foreground">{item.produtoRef} · {formatBRL(item.precoUnitario)}</div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {entries.map(({ item: it, idx }) => (
                    <div key={it.tamanho} className="rounded-md bg-muted/40 p-2 text-center">
                      <div className="text-xs font-semibold uppercase text-muted-foreground">{it.tamanho}</div>
                      <div className="mt-0.5 text-[10px] text-muted-foreground/70">máx: {it.quantidade}</div>
                      <Input
                        type="number"
                        min={0}
                        max={it.quantidade}
                        value={quantidades[idx]}
                        onChange={(e) => atualizar(idx, Number(e.target.value))}
                        className="mt-1 h-8 border-0 bg-card text-center text-sm font-semibold"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 border-t p-5">
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirmar(itensConcluidos)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {modo === "parcial" ? "Confirmar conclusão parcial" : "Concluir encomenda"}
          </button>
        </div>
      </div>
    </div>
  );
}
