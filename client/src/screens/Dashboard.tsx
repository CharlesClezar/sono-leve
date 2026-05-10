"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { AppSelect } from "@/components/AppSelect";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatBRL, formatDate, type OrderStatus } from "@/lib/types";
import { api, useDadosOperacionais } from "@/lib/api";
import { useShortcutLabel } from "@/hooks/useShortcutLabel";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

const toneClass: Record<string, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-[hsl(var(--success-soft))] text-[hsl(var(--success))]",
  warning: "bg-warning-soft text-warning",
  info: "bg-info-soft text-info",
};

const calendarStatusOrder: OrderStatus[] = ["Aberta", "Em produção", "Fabricado parcialmente", "Pronta"];
const calendarStatusLabel: Record<OrderStatus, string> = {
  Aberta: "Novo",
  "Em produção": "Em produção",
  "Fabricado parcialmente": "Fabricado parcialmente",
  Pronta: "Pronta",
  Entregue: "Entregue",
  Cancelada: "Cancelada",
};

const statusDotClass: Record<OrderStatus, string> = {
  Aberta: "bg-primary text-primary-foreground shadow-[0_0_0_2px_rgb(255_255_255)]",
  "Em produção": "bg-warning text-warning-foreground shadow-[0_0_0_2px_rgb(255_255_255)]",
  "Fabricado parcialmente": "bg-[rgb(var(--partial))] text-white shadow-[0_0_0_2px_rgb(255_255_255)]",
  Pronta: "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] shadow-[0_0_0_2px_rgb(255_255_255)]",
  Entregue: "hidden",
  Cancelada: "hidden",
};

const statusPillClass: Record<OrderStatus, string> = {
  Aberta: "bg-primary-soft text-primary",
  "Em produção": "bg-warning-soft text-warning",
  "Fabricado parcialmente": "bg-[rgb(var(--partial-soft))] text-[rgb(var(--partial-foreground))]",
  Pronta: "bg-[hsl(var(--success-soft))] text-[hsl(var(--success))]",
  Entregue: "bg-muted text-muted-foreground",
  Cancelada: "bg-[hsl(var(--destructive-soft))] text-[hsl(var(--destructive))]",
};

type DashboardPeriod = "today" | "7d" | "30d" | "all";

const formatIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const shiftDays = (iso: string, amount: number) => {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return formatIsoDate(date);
};

export default function Dashboard() {
  const { accounts, fichas, orders, sales } = useDadosOperacionais();
  const router = useRouter();
  const queryClient = useQueryClient();
  const saleShortcutLabel = useShortcutLabel("dashboard_new_sale");
  const orderShortcutLabel = useShortcutLabel("dashboard_new_order");
  const fichaShortcutLabel = useShortcutLabel("dashboard_new_ficha");
  const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>("today");
  const [calendarBaseDate, setCalendarBaseDate] = useState(() => new Date());
  const [statusById, setStatusById] = useState<Record<string, OrderStatus>>(
    () => Object.fromEntries(orders.map((order) => [order.id, order.status])),
  );
  useEffect(() => {
    setStatusById((current) => ({
      ...Object.fromEntries(orders.map((order) => [order.id, order.status])),
      ...current,
    }));
  }, [orders]);
  const year = calendarBaseDate.getFullYear();
  const month = calendarBaseDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousMonthYear = month === 0 ? year - 1 : year;
  const previousMonth = month === 0 ? 11 : month - 1;
  const nextMonthYear = month === 11 ? year + 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  const previousMonthDays = new Date(year, month, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - firstDay + 1;

    if (dayNumber <= 0) {
      const day = previousMonthDays + dayNumber;
      return {
        day,
        inCurrentMonth: false,
        iso: `${previousMonthYear}-${String(previousMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      };
    }

    if (dayNumber > daysInMonth) {
      const day = dayNumber - daysInMonth;
      return {
        day,
        inCurrentMonth: false,
        iso: `${nextMonthYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      };
    }

    return {
      day: dayNumber,
      inCurrentMonth: true,
      iso: `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`,
    };
  });
  const deliveriesByDate = useMemo(() => {
    const grouped = new Map<string, typeof orders>();
    orders.forEach((order) => {
      const currentStatus = statusById[order.id] ?? order.status;
      if (currentStatus === "Cancelada" || currentStatus === "Entregue") return;
      const dueDate = new Date(`${order.dueDate}T00:00:00`);
      const iso = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, "0")}-${String(dueDate.getDate()).padStart(2, "0")}`;
      const current = grouped.get(iso) ?? [];
      current.push(order);
      grouped.set(iso, current);
    });
    return grouped;
  }, [statusById]);
  const visibleDeliveryIsos = useMemo(
    () => cells.map((cell) => cell.iso).filter((iso) => deliveriesByDate.has(iso)),
    [cells, deliveriesByDate]
  );
  const deliveryDays = new Set(visibleDeliveryIsos);
  const currentDateIso = useMemo(() => {
    const today = new Date();
    return formatIsoDate(today);
  }, []);
  const periodRange = useMemo(() => {
    if (selectedPeriod === "all") return null;
    if (selectedPeriod === "today") return { start: currentDateIso, end: currentDateIso };
    if (selectedPeriod === "7d") return { start: shiftDays(currentDateIso, -6), end: currentDateIso };
    return { start: shiftDays(currentDateIso, -29), end: currentDateIso };
  }, [currentDateIso, selectedPeriod]);
  const filteredSales = useMemo(
    () =>
      sales.filter(
        (sale) =>
          sale.status === "Gerada" &&
          (periodRange ? sale.date >= periodRange.start && sale.date <= periodRange.end : true)
      ),
    [periodRange]
  );
  const filteredAccounts = useMemo(
    () =>
      accounts.filter((account) =>
        periodRange ? account.dueDate >= periodRange.start && account.dueDate <= periodRange.end : true
      ),
    [periodRange]
  );
  const filteredFichas = useMemo(
    () =>
      fichas.filter((ficha) =>
        periodRange ? ficha.openedAt >= periodRange.start && ficha.openedAt <= periodRange.end : true
      ),
    [periodRange]
  );
  const filteredOrders = useMemo(
    () =>
      orders.filter((order) =>
        periodRange ? order.dueDate >= periodRange.start && order.dueDate <= periodRange.end : true
      ),
    [periodRange]
  );
  const kpis = useMemo(() => {
    const faturado = filteredSales.reduce((total, sale) => total + sale.total, 0);
    const recebido = filteredAccounts.reduce((total, account) => total + account.received, 0);
    const emAberto = filteredAccounts.reduce((total, account) => total + Math.max(account.total - account.received, 0), 0);
    const vendas = filteredSales.length;
    const ticketMedio = vendas > 0 ? faturado / vendas : 0;
    const fichasAbertas = filteredFichas.filter((ficha) => ficha.status === "Aberta" || ficha.status === "Parcial").length;
    const encomendasProntas = filteredOrders.filter((order) => (statusById[order.id] ?? order.status) === "Pronta").length;

    return [
      { label: "Faturado", value: formatBRL(faturado), icon: TrendingUp, tone: "primary" },
      { label: "Recebido", value: formatBRL(recebido), icon: Wallet, tone: "success" },
      { label: "Em aberto", value: formatBRL(emAberto), icon: Clock, tone: "warning" },
      { label: "Vendas", value: vendas.toString(), icon: ShoppingBag, tone: "primary" },
      { label: "Ticket médio", value: formatBRL(ticketMedio), icon: Receipt, tone: "primary" },
      { label: "Fichas abertas", value: fichasAbertas.toString(), icon: ClipboardList, tone: "primary" },
      { label: "Encomendas prontas", value: encomendasProntas.toString(), icon: Package2, tone: "info" },
    ];
  }, [filteredAccounts, filteredFichas, filteredOrders, filteredSales, statusById]);
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null);
  useEffect(() => {
    setSelectedDateIso((current) => {
      if (current && cells.some((cell) => cell.iso === current)) return current;
      if (cells.some((cell) => cell.iso === currentDateIso)) return currentDateIso;
      return visibleDeliveryIsos[0] ?? null;
    });
  }, [cells, currentDateIso, deliveriesByDate, visibleDeliveryIsos]);

  const selectedOrders = selectedDateIso ? deliveriesByDate.get(selectedDateIso) ?? [] : [];
  const selectedDateLabel = selectedDateIso ? formatDate(selectedDateIso) : null;
  const moveStatus = async (id: string, nextStatus: OrderStatus) => {
    setStatusById((current) => ({ ...current, [id]: nextStatus }));
    await api.atualizarStatusEncomenda(id, nextStatus);
    await queryClient.invalidateQueries({ queryKey: ["encomendas"] });
  };

  const goToPreviousMonth = () => {
    setCalendarBaseDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCalendarBaseDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
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
              value={selectedPeriod}
              onValueChange={(value) => setSelectedPeriod(value as DashboardPeriod)}
              options={[
                { value: "today", label: "Hoje" },
                { value: "7d", label: "Últimos 7 dias" },
                { value: "30d", label: "Últimos 30 dias" },
                { value: "all", label: "Todo o período" },
              ]}
            />
            <Button asChild variant="outline">
              <Link href="/fichas/nova?from=dashboard">{`Nova ficha${fichaShortcutLabel}`}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/encomendas/nova?from=dashboard">{`Nova encomenda${orderShortcutLabel}`}</Link>
            </Button>
            <Button asChild>
              <Link href="/vendas/nova?from=dashboard">{`Nova venda${saleShortcutLabel}`}</Link>
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
                  <div className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${toneClass[k.tone]}`}>
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
                    onClick={goToPreviousMonth}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label="Mês anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="min-w-[120px] text-center text-xs text-muted-foreground sm:text-sm">
                    {calendarBaseDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                  </span>
                  <button
                    type="button"
                    onClick={goToNextMonth}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label="Próximo mês"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center sm:gap-1.5">
                {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                  <div key={i} className="py-0.5 text-[10px] font-medium text-muted-foreground sm:py-1 sm:text-xs">{d}</div>
                ))}
              </div>
              <div className="grid flex-1 grid-cols-7 grid-rows-6 gap-1 text-center sm:gap-1.5">
                {cells.map((cell, i) => (
                  (() => {
                    const day = cell.day;
                    const inCurrentMonth = cell.inCurrentMonth;
                    const iso = cell.iso;
                    const dayOrders = deliveriesByDate.get(iso) ?? [];
                    const dayStatusCounts = calendarStatusOrder
                      .map((status) => ({
                        status,
                        count: dayOrders.filter((order) => (statusById[order.id] ?? order.status) === status).length,
                      }))
                      .filter((entry) => entry.count > 0);

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedDateIso(iso)}
                        className={`relative flex h-full min-h-[3.25rem] items-center justify-center rounded-xl border text-sm font-medium transition-all sm:min-h-[3.5rem] sm:text-base ${
                          deliveryDays.has(iso)
                            ? selectedDateIso === iso
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "border-primary/35 bg-primary-soft/90 font-semibold text-primary hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary-soft hover:shadow-sm"
                            : inCurrentMonth
                              ? "border-transparent text-foreground hover:bg-muted"
                              : "border-transparent text-muted-foreground/40 hover:bg-muted/40"
                        } ${selectedDateIso === iso ? "ring-2 ring-primary ring-offset-1" : ""}`}
                      >
                        <span className={`${dayStatusCounts.length > 0 ? "pb-3" : ""}`}>{day}</span>
                        {dayStatusCounts.length > 0 && (
                          <span className="absolute bottom-1 right-1 flex items-center gap-1">
                            {dayStatusCounts.map(({ status, count }) => (
                              <span
                                key={status}
                                className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none ${statusDotClass[status]}`}
                                title={`${count} ${calendarStatusLabel[status]}`}
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
              {selectedDateLabel ? (
                <p className="mb-3 text-sm text-muted-foreground">
                  {selectedOrders.length > 0
                    ? `${selectedOrders.length} encomenda${selectedOrders.length > 1 ? "s" : ""} para ${selectedDateLabel}`
                    : `Nenhuma encomenda para ${selectedDateLabel}`}
                </p>
              ) : (
                <p className="mb-3 text-sm text-muted-foreground">
                  Selecione uma data destacada no calendário.
                </p>
              )}
              <div className="min-h-0 flex-1">
                {selectedOrders.length > 0 ? (
                  <ul className="space-y-2 lg:h-full lg:overflow-y-auto lg:pr-1">
                    {selectedOrders.map((order) => (
                      <li
                        key={order.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => router.push(`/encomendas?encomenda=${encodeURIComponent(order.id)}`)}
                        onKeyDown={(event) => {
                          if (event.target !== event.currentTarget) return;
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            router.push(`/encomendas?encomenda=${encodeURIComponent(order.id)}`);
                          }
                        }}
                        className="cursor-pointer rounded-lg border bg-muted/30 p-3 transition hover:border-primary/35 hover:bg-primary-soft/40 focus-within:border-primary/35"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium">{order.customer}</div>
                            <div className="text-xs text-muted-foreground">{order.id}</div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusPillClass[statusById[order.id] ?? order.status]}`}>
                              {calendarStatusLabel[statusById[order.id] ?? order.status]}
                            </span>
                            <DashboardOrderActionButton
                              id={order.id}
                              status={statusById[order.id] ?? order.status}
                              onMove={moveStatus}
                            />
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Total</span>
                          <span className="font-semibold">{formatBRL(order.total)}</span>
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
    </AppShell>
  );
}

function DashboardOrderActionButton({
  id,
  status,
  onMove,
}: {
  id: string;
  status: OrderStatus;
  onMove: (id: string, nextStatus: OrderStatus) => void;
}) {
  if (status === "Aberta") {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onMove(id, "Em produção");
        }}
        className="inline-flex h-8 w-28 items-center justify-center gap-1.5 rounded-md border border-primary/25 bg-primary/10 text-xs font-medium text-primary transition hover:bg-primary/15"
      >
        <Play className="h-3.5 w-3.5" />
        Iniciar
      </button>
    );
  }

  if (status === "Em produção") {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onMove(id, "Fabricado parcialmente");
        }}
        className="inline-flex h-8 w-28 items-center justify-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
      >
        <CircleCheck className="h-3.5 w-3.5" />
        Concluir
      </button>
    );
  }

  if (status === "Fabricado parcialmente") {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onMove(id, "Pronta");
        }}
        className="inline-flex h-8 w-28 items-center justify-center gap-1.5 rounded-md border border-[rgb(var(--partial))/0.35] bg-[rgb(var(--partial-soft))] text-xs font-medium text-[rgb(var(--partial-foreground))] transition hover:bg-[rgb(var(--partial-soft))/0.8]"
      >
        <CircleCheck className="h-3.5 w-3.5" />
        Concluir
      </button>
    );
  }

  if (status === "Pronta") {
    return (
      <Link
        href={`/vendas/nova?from=encomenda&id=${id}`}
        onClick={(event) => event.stopPropagation()}
        className="inline-flex h-8 w-28 items-center justify-center gap-1.5 rounded-md bg-emerald-600 text-xs font-semibold text-white transition hover:bg-emerald-700"
      >
        <ShoppingCart className="h-3.5 w-3.5" />
        Vender
      </Link>
    );
  }

  return null;
}
