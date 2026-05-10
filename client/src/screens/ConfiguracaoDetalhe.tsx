"use client";

import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { DataGridColumnHeader } from "@/components/DataGridColumnHeader";
import { PageHeader } from "@/components/PageHeader";
import { PaginationFooter } from "@/components/PaginationFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useShortcutLabel } from "@/hooks/useShortcutLabel";
import { useDataGrid, type DataGridColumn } from "@/hooks/useDataGrid";
import { usePagination } from "@/hooks/usePagination";
import { useShortcutSettings } from "@/hooks/useShortcutSettings";
import {
  formatShortcutBinding,
  formatShortcutDisplayValue,
  getShortcutDefaults,
  getShortcutDisplayValue,
  getShortcutPlatform,
  isModifierOnlyKey,
  normalizeShortcutKey,
  saveShortcutSettings,
  type ShortcutDefinition,
} from "@/lib/shortcuts";

const payments = [
  { name: "Pix", condition: "À vista", fee: "0%", active: true },
  { name: "Dinheiro", condition: "À vista", fee: "0%", active: true },
  { name: "Crédito", condition: "Até 3x", fee: "Conforme maquininha", active: true },
  { name: "Boleto", condition: "7 dias", fee: "0%", active: true },
];

const params = [
  { name: "Estoque mínimo", value: "3 peças", description: "Sinaliza produto com saldo baixo" },
  { name: "Prefixo de vendas", value: "VEN", description: "Código gerado para novas vendas" },
  { name: "Prefixo de encomendas", value: "ENC", description: "Código gerado para novas encomendas" },
];

const sectionInfo = {
  atalhos: {
    title: "Atalhos",
    description: "Teclas por ação, plataforma e contexto",
  },
  pagamentos: {
    title: "Formas de pagamento",
    description: "Condições comerciais usadas nas vendas",
  },
  parametros: {
    title: "Parâmetros gerais",
    description: "Preferências operacionais do sistema",
  },
} as const;

const shortcutDescriptions: Record<string, string> = {
  save: "Salva o registro ou formulario atual.",
  cancel: "Volta ou cancela a tela atual.",
  clear_filters: "Abre a confirmação para limpar filtros das listas, incluindo filtros das colunas.",
  new_contextual: "Cria um novo registro conforme o modulo aberto.",
  dashboard_new_sale: "Abre o fluxo de nova venda a partir do dashboard.",
  dashboard_new_order: "Abre o fluxo de nova encomenda a partir do dashboard.",
  dashboard_new_ficha: "Abre o fluxo de nova ficha a partir do dashboard.",
  sales_from_order: "Inicia uma venda usando uma encomenda como origem.",
  sales_from_ficha: "Inicia uma venda usando uma ficha como origem.",
  nav_dashboard: "Navega diretamente para o Dashboard.",
  nav_sales: "Navega diretamente para o módulo de Vendas.",
  nav_orders: "Navega diretamente para o módulo de Encomendas.",
  nav_fichas: "Navega diretamente para o módulo de Fichas.",
  nav_products: "Navega diretamente para o módulo de Produtos.",
  nav_stock: "Navega diretamente para o módulo de Estoque.",
  nav_customers: "Navega diretamente para o módulo de Clientes.",
  nav_finance: "Navega diretamente para o módulo Financeiro.",
  nav_settings: "Navega diretamente para o módulo de Configurações.",
};

const shortcutScopeOrder = ["Global", "Listas", "Dashboard", "Contextual", "Vendas"];

type ConfigKey = keyof typeof sectionInfo;

function getConfigKey(value: string | string[] | undefined): ConfigKey {
  const key = Array.isArray(value) ? value[0] : value;
  return key && key in sectionInfo ? (key as ConfigKey) : "parametros";
}

export default function ConfiguracaoDetalhe() {
  const cancelShortcutLabel = useShortcutLabel("cancel");
  const saveShortcutLabel = useShortcutLabel("save");
  const routeParams = useParams<{ secao: string }>();
  const sectionKey = getConfigKey(routeParams.secao);
  const section = sectionInfo[sectionKey];
  const storedShortcuts = useShortcutSettings();
  const [shortcutDraft, setShortcutDraft] = useState<ShortcutDefinition[]>(storedShortcuts);
  const shortcutDefaults = useMemo(() => getShortcutDefaults(), []);
  const platform = getShortcutPlatform();

  useEffect(() => {
    setShortcutDraft(storedShortcuts);
  }, [storedShortcuts]);

  const shortcutsChanged = useMemo(
    () => JSON.stringify(shortcutDraft) !== JSON.stringify(storedShortcuts),
    [shortcutDraft, storedShortcuts]
  );

  const handleSave = () => {
    if (sectionKey === "atalhos") {
      saveShortcutSettings(shortcutDraft);
      toast.success("Atalhos salvos nesta máquina.");
      return;
    }

    toast.success("Alterações salvas.");
  };

  const handleShortcutChange = (id: string, field: "windows" | "mac", value: string) => {
    setShortcutDraft((current) =>
      current.map((shortcut) => (shortcut.id === id ? { ...shortcut, [field]: value } : shortcut))
    );
  };

  const resetShortcuts = () => {
    const defaults = getShortcutDefaults();
    setShortcutDraft(defaults);
    saveShortcutSettings(defaults);
    toast.success("Atalhos restaurados para o padrão.");
  };

  return (
    <AppShell>
      <PageHeader
        breadcrumb={["Configurações", section.title]}
        title={section.title}
        description={section.description}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/configuracoes">{`Voltar${cancelShortcutLabel}`}</Link>
            </Button>
            {sectionKey === "atalhos" && (
              <Button variant="outline" onClick={resetShortcuts}>
                Restaurar padrão
              </Button>
            )}
            <Button onClick={handleSave} disabled={sectionKey === "atalhos" ? !shortcutsChanged : false}>
              {`Salvar alterações${saveShortcutLabel}`}
            </Button>
          </>
        }
      />

      <div className="space-y-6 p-6">
        {sectionKey === "atalhos" && (
          <ShortcutsTable
            shortcuts={shortcutDraft}
            defaults={shortcutDefaults}
            platform={platform}
            onChange={handleShortcutChange}
          />
        )}
        {sectionKey === "pagamentos" && <PaymentsTable />}
        {sectionKey === "parametros" && <ParamsTable />}
      </div>
    </AppShell>
  );
}

function ShortcutsTable({
  shortcuts,
  defaults,
  platform,
  onChange,
}: {
  shortcuts: ShortcutDefinition[];
  defaults: ShortcutDefinition[];
  platform: "windows" | "mac";
  onChange: (id: string, field: "windows" | "mac", value: string) => void;
}) {
  const editableField = platform === "mac" ? "mac" : "windows";
  const platformLabel = platform === "mac" ? "macOS" : "Windows/Linux";
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftDisplay, setDraftDisplay] = useState("");
  const [collapsedScopes, setCollapsedScopes] = useState<string[]>([]);
  const defaultById = useMemo(
    () => new Map(defaults.map((shortcut) => [shortcut.id, shortcut])),
    [defaults]
  );
  const groupedShortcuts = useMemo(() => {
    const grouped = shortcuts.reduce<Record<string, ShortcutDefinition[]>>((acc, shortcut) => {
      const defaultShortcut = defaultById.get(shortcut.id);
      const effectiveScope = defaultShortcut?.scope ?? shortcut.scope;
      if (!acc[effectiveScope]) acc[effectiveScope] = [];
      acc[effectiveScope].push({ ...shortcut, scope: effectiveScope });
      return acc;
    }, {});

    return Object.entries(grouped).sort(([scopeA], [scopeB]) => {
      const orderA = shortcutScopeOrder.indexOf(scopeA);
      const orderB = shortcutScopeOrder.indexOf(scopeB);
      return (orderA === -1 ? Number.MAX_SAFE_INTEGER : orderA) - (orderB === -1 ? Number.MAX_SAFE_INTEGER : orderB);
    });
  }, [defaultById, shortcuts]);

  const startEditing = (shortcut: ShortcutDefinition) => {
    setEditingId(shortcut.id);
    setDraftDisplay(getShortcutDisplayValue(shortcut, platform));
  };

  const stopEditing = () => {
    setEditingId(null);
    setDraftDisplay("");
  };

  const toggleScope = (scope: string) => {
    setCollapsedScopes((current) =>
      current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope]
    );
  };

  const handleCapture = (event: ReactKeyboardEvent<HTMLButtonElement>, shortcut: ShortcutDefinition) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.key === "Escape" && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
      stopEditing();
      return;
    }

    const modifiers = [
      event.ctrlKey ? "Ctrl" : "",
      event.metaKey ? "Command" : "",
      event.altKey ? "Alt" : "",
      event.shiftKey ? "Shift" : "",
    ].filter(Boolean);

    if (isModifierOnlyKey(event.key)) {
      setDraftDisplay(formatShortcutDisplayValue(formatShortcutBinding([...modifiers, "…"]), platform));
      return;
    }

    const mainKey = formatMainKey(event.key);
    const value = formatShortcutBinding([...modifiers, mainKey]);
    onChange(shortcut.id, editableField, value);
    stopEditing();
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-primary-soft/20 px-4 py-3 text-sm">
        <div className="font-medium">
          Sistema detectado: {platformLabel}
        </div>
        <p className="mt-1 text-muted-foreground">
          Nesta máquina, apenas os atalhos de {platformLabel} podem ser editados.
          Clique no atalho, pressione a combinação desejada e finalize com a tecla principal.
        </p>
      </Card>

      {groupedShortcuts.map(([scope, items]) => (
        <Card key={scope} className="overflow-hidden">
          <button
            type="button"
            onClick={() => toggleScope(scope)}
            className="flex w-full items-center justify-between border-b bg-muted/30 px-4 py-3 text-left transition hover:bg-muted/40"
          >
            <h3 className="text-sm font-semibold">{scope}</h3>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${
                collapsedScopes.includes(scope) ? "-rotate-90" : "rotate-0"
              }`}
            />
          </button>
          {!collapsedScopes.includes(scope) && (
            <div className="space-y-3 bg-muted/10 p-3">
              <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                {items.map((item) => {
                  const isEditing = editingId === item.id;
                  const itemDefault = defaultById.get(item.id);
                  const currentValue = platform === "mac" ? item.mac : item.windows;
                  const defaultValue = platform === "mac" ? itemDefault?.mac ?? item.mac : itemDefault?.windows ?? item.windows;
                  const canResetLine = currentValue !== defaultValue;
                  return (
                    <div
                      key={item.id}
                      className="flex h-full flex-col gap-4 rounded-xl border bg-card/85 p-4 shadow-[0_1px_0_rgba(15,23,42,0.03)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-foreground">{item.action}</div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {shortcutDescriptions[item.id] ?? "Atalho configuravel desta acao."}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (!itemDefault) return;
                            onChange(item.id, editableField, defaultValue);
                            if (editingId === item.id) stopEditing();
                          }}
                          disabled={!canResetLine}
                          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                          title="Restaurar padrão desta ação"
                          aria-label={`Restaurar padrão de ${item.action}`}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Restaurar
                        </button>
                      </div>

                      <div className="flex flex-wrap items-end gap-3">
                        <div className="space-y-1.5">
                          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            {platformLabel}
                          </div>
                          <button
                            type="button"
                            onClick={() => startEditing(item)}
                            onKeyDown={(event) => handleCapture(event, item)}
                            className={`inline-flex min-h-10 items-center rounded-xl border px-2.5 py-1.5 text-left text-sm transition ${
                              isEditing
                                ? "border-primary/35 bg-primary-soft text-primary shadow-sm"
                                : "border-border/80 bg-background hover:border-primary/40 hover:bg-muted/30"
                            }`}
                          >
                            <ShortcutKeycaps
                              value={isEditing ? draftDisplay || "Pressione..." : getShortcutDisplayValue(item, platform)}
                              active={isEditing}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function ShortcutKeycaps({ value, active = false }: { value: string; active?: boolean }) {
  const parts = value.split(/\s*\+\s*/).filter(Boolean);

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {parts.map((part, index) => (
        <span key={`${part}-${index}`} className="inline-flex items-center gap-1.5">
          <span
            className={`inline-flex min-w-[2rem] items-center justify-center rounded-md border px-2 py-1 text-xs font-semibold leading-none ${
              active
                ? "border-primary/25 bg-background/80 text-primary"
                : "border-border/70 bg-background/70 text-foreground"
            }`}
          >
            {part}
          </span>
          {index < parts.length - 1 && <span className="text-xs text-muted-foreground/70">+</span>}
        </span>
      ))}
    </span>
  );
}

function formatMainKey(key: string) {
  const normalized = normalizeShortcutKey(key);
  if (normalized.length === 1) return normalized.toUpperCase();
  if (normalized === "escape") return "Esc";
  if (normalized === "enter") return "Enter";
  if (normalized === "space") return "Space";
  return normalized.startsWith("f") ? normalized.toUpperCase() : normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function PaymentsTable() {
  const columns = useMemo<DataGridColumn<(typeof payments)[number]>[]>(
    () => [
      { id: "name", label: "Forma", accessor: (item) => item.name },
      { id: "condition", label: "Condição", accessor: (item) => item.condition },
      { id: "fee", label: "Taxa", accessor: (item) => item.fee },
    ],
    [],
  );
  const grid = useDataGrid(payments, columns);
  const pagination = usePagination(grid.rows);

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <DataGridColumnHeader key={column.id} grid={grid} columnId={column.id} label={column.label} />
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {pagination.items.map((item) => (
            <tr key={item.name} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">{item.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{item.condition}</td>
              <td className="px-4 py-3">{item.fee}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <PaginationFooter pagination={pagination} />
    </Card>
  );
}

function ParamsTable() {
  const columns = useMemo<DataGridColumn<(typeof params)[number]>[]>(
    () => [
      { id: "name", label: "Parâmetro", accessor: (item) => item.name },
      { id: "value", label: "Valor", accessor: (item) => item.value },
      { id: "description", label: "Uso", accessor: (item) => item.description },
    ],
    [],
  );
  const grid = useDataGrid(params, columns);
  const pagination = usePagination(grid.rows);

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <DataGridColumnHeader key={column.id} grid={grid} columnId={column.id} label={column.label} />
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {pagination.items.map((item) => (
            <tr key={item.name} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">{item.name}</td>
              <td className="px-4 py-3"><Input defaultValue={item.value} className="h-9 max-w-[180px]" /></td>
              <td className="px-4 py-3 text-muted-foreground">{item.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <PaginationFooter pagination={pagination} />
    </Card>
  );
}
