"use client";

import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { DataGridColumnHeader } from "@/components/DataGridColumnHeader";
import { PageHeader } from "@/components/PageHeader";
import { PaginationFooter } from "@/components/PaginationFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useShortcutLabel } from "@/hooks/useShortcutLabel";
import { useDataGrid, type DataGridColumn } from "@/hooks/useDataGrid";
import { usePagination } from "@/hooks/usePagination";
import { useShortcutSettings } from "@/hooks/useShortcutSettings";
import { api, useFormasPagamento, useBandeirasCartao, useConfiguracoesTaxaCartao, type FormaPagamento, type FormaPagamentoSalvar, type BandeiraCartao, type BandeiraCartaoSalvar, type ConfiguracaoTaxaCartao, type ConfiguracaoTaxaCartaoSalvar, type ConfiguracaoTaxaCartaoParcela } from "@/lib/api";
import { AppSelect } from "@/components/AppSelect";
import { Switch } from "@/components/ui/switch";
import { IndexedTabsNav } from "@/components/IndexedTabsNav";
import { useIndexedTabs } from "@/hooks/useIndexedTabs";
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
    title: "Pagamentos",
    description: "Formas de pagamento, bandeiras e configuração de taxas de cartão",
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

  const atalhosAlterados = useMemo(
    () => JSON.stringify(shortcutDraft) !== JSON.stringify(storedShortcuts),
    [shortcutDraft, storedShortcuts]
  );

  const handleSalvar = () => {
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
            {sectionKey !== "pagamentos" && (
              <Button onClick={handleSalvar} disabled={sectionKey === "atalhos" ? !atalhosAlterados : false}>
                {`Salvar alterações${saveShortcutLabel}`}
              </Button>
            )}
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
  const [idEditando, setEditingId] = useState<string | null>(null);
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
                  const editando =idEditando === item.id;
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
                            if (idEditando === item.id) stopEditing();
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
                              editando
                                ? "border-primary/35 bg-primary-soft text-primary shadow-sm"
                                : "border-border/80 bg-background hover:border-primary/40 hover:bg-muted/30"
                            }`}
                          >
                            <ShortcutKeycaps
                              value={editando ? draftDisplay || "Pressione..." : getShortcutDisplayValue(item, platform)}
                              active={editando}
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

// ── Tipos de Pagamento ─────────────────────────────────────────────────────
const TIPOS_PAGAMENTO = [
  { value: "Dinheiro", label: "Dinheiro" },
  { value: "Pix",      label: "Pix"      },
  { value: "Debito",   label: "Débito"   },
  { value: "Credito",  label: "Crédito"  },
  { value: "Boleto",   label: "Boleto"   },
  { value: "Outro",    label: "Outro"    },
];

const BADGE_ATIVO = ({ ativo }: { ativo: boolean }) => (
  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
    ativo ? "bg-green-500/15 text-green-700 dark:text-green-400" : "bg-muted text-muted-foreground"
  }`}>{ativo ? "Ativo" : "Inativo"}</span>
);

const pagamentosTabs = ["Formas de pagamento", "Bandeiras", "Taxas de cartão"] as const;
type PagamentosAba = (typeof pagamentosTabs)[number];

function PaymentsTable() {
  const [aba, setAba] = useState<PagamentosAba>("Formas de pagamento");
  const indexedTabs = useIndexedTabs({ tabs: pagamentosTabs, onTabChange: setAba });

  return (
    <div className="space-y-4">
      <IndexedTabsNav
        tabs={pagamentosTabs}
        activeTab={aba}
        onSelect={setAba}
        getTabButtonProps={indexedTabs.getTabButtonProps}
        getShortcutLabel={indexedTabs.getShortcutLabel}
      />
      <div {...indexedTabs.getTabPanelProps(aba)}>
        {aba === "Formas de pagamento" && <FormasPagamentoTabela />}
        {aba === "Bandeiras"            && <BandeirasTabela />}
        {aba === "Taxas de cartão"      && <TaxasCartaoTabela />}
      </div>
    </div>
  );
}

// ── Formas de Pagamento ────────────────────────────────────────────────────────

const FORMA_PADRAO: FormaPagamentoSalvar = { nome: "", tipo: "Pix", permiteParcelamento: false, exigeBandeira: false, ativo: true, repassaTaxaAoCliente: false };

function FormasPagamentoTabela() {
  const { data: formas = [], isLoading } = useFormasPagamento();
  const queryClient = useQueryClient();
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [adicionando, setAdicionando] = useState(false);
  const [draft, setDraft] = useState<FormaPagamentoSalvar>(FORMA_PADRAO);
  const [confirmandoExcluirId, setConfirmandoExcluirId] = useState<string | null>(null);

  const colunasFP = useMemo<DataGridColumn<FormaPagamento>[]>(() => [
    { id: "nome", label: "Nome", accessor: (f) => f.nome },
    { id: "tipo", label: "Tipo", accessor: (f) => f.tipo },
    { id: "permiteParcelamento", label: "Parcelamento", accessor: (f) => f.permiteParcelamento ? "Sim" : "Não" },
    { id: "exigeBandeira", label: "Exige bandeira", accessor: (f) => f.exigeBandeira ? "Sim" : "Não" },
    { id: "ativo", label: "Status", accessor: (f) => f.ativo ? "Ativo" : "Inativo" },
    { id: "repassaTaxaAoCliente", label: "Cobrar do cliente", accessor: (f) => f.repassaTaxaAoCliente ? "Sim" : "Não" },
  ], []);
  const gridFP = useDataGrid(formas, colunasFP);

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ["formas-pagamento"] });

  const handleEditar = (f: FormaPagamento) => {
    setEditandoId(f.id);
    setDraft({ nome: f.nome, tipo: f.tipo, permiteParcelamento: f.permiteParcelamento, exigeBandeira: f.exigeBandeira, ativo: f.ativo, repassaTaxaAoCliente: f.repassaTaxaAoCliente });
    setAdicionando(false);
    setConfirmandoExcluirId(null);
  };

  const handleSalvar = async (id?: string) => {
    try {
      if (id) {
        await api.atualizarFormaPagamento(id, draft);
        setEditandoId(null);
        toast.success("Forma de pagamento atualizada.");
      } else {
        await api.salvarFormaPagamento(draft);
        setAdicionando(false);
        toast.success("Forma de pagamento adicionada.");
      }
      await invalidar();
    } catch { toast.error("Erro ao salvar forma de pagamento."); }
  };

  const handleExcluir = async (id: string) => {
    try {
      await api.excluirFormaPagamento(id);
      setConfirmandoExcluirId(null);
      await invalidar();
      toast.success("Forma de pagamento excluída.");
    } catch { toast.error("Erro ao excluir forma de pagamento."); }
  };

  const EditRow = ({ rowKey, onSave, onCancel }: { rowKey: string; onSave: () => void; onCancel: () => void }) => (
    <tr key={rowKey} className="bg-primary/5">
      <td className="px-4 py-2">
        <Input value={draft.nome} onChange={e => setDraft(d => ({ ...d, nome: e.target.value }))} className="h-8 w-full" placeholder="Ex: Pix" />
      </td>
      <td className="px-4 py-2">
        <AppSelect
          className="w-full"
          value={draft.tipo}
          onValueChange={v => setDraft(d => ({ ...d, tipo: v }))}
          options={TIPOS_PAGAMENTO}
        />
      </td>
      <td className="px-4 py-2 text-center">
        <Switch checked={draft.permiteParcelamento} onCheckedChange={v => setDraft(d => ({ ...d, permiteParcelamento: v }))} />
      </td>
      <td className="px-4 py-2 text-center">
        <Switch checked={draft.exigeBandeira} onCheckedChange={v => setDraft(d => ({ ...d, exigeBandeira: v }))} />
      </td>
      <td className="px-4 py-2 text-center">
        <Switch checked={draft.ativo} onCheckedChange={v => setDraft(d => ({ ...d, ativo: v }))} />
      </td>
      <td className="px-4 py-2 text-center">
        <Switch checked={draft.repassaTaxaAoCliente} onCheckedChange={v => setDraft(d => ({ ...d, repassaTaxaAoCliente: v }))} />
      </td>
      <td className="px-4 py-2">
        <div className="flex gap-2">
          <Button size="sm" onClick={onSave}>Salvar</Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>Cancelar</Button>
        </div>
      </td>
    </tr>
  );

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">Formas de pagamento</span>
        <Button size="sm" onClick={() => { setAdicionando(true); setDraft(FORMA_PADRAO); setEditandoId(null); }} disabled={adicionando}>
          <Plus className="mr-1.5 h-4 w-4" />Adicionar
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] table-fixed text-sm">
          <colgroup>
            <col className="w-48" />
            <col className="w-40" />
            <col className="w-36" />
            <col className="w-36" />
            <col className="w-32" />
            <col className="w-40" />
            <col />
          </colgroup>
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <DataGridColumnHeader grid={gridFP} columnId="nome" label="Nome" />
              <DataGridColumnHeader grid={gridFP} columnId="tipo" label="Tipo" />
              <DataGridColumnHeader grid={gridFP} columnId="permiteParcelamento" label="Parcelamento" align="center" />
              <DataGridColumnHeader grid={gridFP} columnId="exigeBandeira" label="Exige bandeira" align="center" />
              <DataGridColumnHeader grid={gridFP} columnId="ativo" label="Status" align="center" />
              <DataGridColumnHeader grid={gridFP} columnId="repassaTaxaAoCliente" label="Cobrar do cliente" align="center" />
              <th className="sticky right-0 z-20 bg-muted/50 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground [box-shadow:-2px_0_5px_rgba(0,0,0,0.06)]">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading
              ? <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">Carregando...</td></tr>
              : gridFP.rows.length === 0 && !adicionando
                ? <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhuma forma de pagamento cadastrada.</td></tr>
                : gridFP.rows.map((f) =>
                    editandoId === f.id ? (
                      <EditRow key={f.id} rowKey={f.id} onSave={() => handleSalvar(f.id)} onCancel={() => setEditandoId(null)} />
                    ) : confirmandoExcluirId === f.id ? (
                      <tr key={f.id} className="bg-destructive/5">
                        <td colSpan={6} className="px-4 py-3 text-sm">Excluir <strong>{f.nome}</strong>?</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button size="sm" variant="destructive" onClick={() => handleExcluir(f.id)}>Excluir</Button>
                            <Button size="sm" variant="ghost" onClick={() => setConfirmandoExcluirId(null)}>Cancelar</Button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={f.id} className="group hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium border-r border-border/40">{f.nome}</td>
                        <td className="px-4 py-3 text-muted-foreground border-r border-border/40">{TIPOS_PAGAMENTO.find(t => t.value === f.tipo)?.label ?? f.tipo}</td>
                        <td className="px-4 py-3 text-center text-xs border-r border-border/40">{f.permiteParcelamento ? "Sim" : "—"}</td>
                        <td className="px-4 py-3 text-center text-xs border-r border-border/40">{f.exigeBandeira ? "Sim" : "—"}</td>
                        <td className="px-4 py-3 text-center border-r border-border/40"><BADGE_ATIVO ativo={f.ativo} /></td>
                        <td className="px-4 py-3 text-center text-xs border-r border-border/40">{f.repassaTaxaAoCliente ? "Sim" : "—"}</td>
                        <td className="sticky right-0 z-10 bg-card px-4 py-3 [box-shadow:-2px_0_5px_rgba(0,0,0,0.06)] group-hover:bg-muted/30">
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-8 px-3" onClick={() => handleEditar(f)}>Editar</Button>
                            <Button size="sm" variant="ghost" className="h-8 px-3 text-destructive hover:bg-destructive/10" onClick={() => setConfirmandoExcluirId(f.id)}>Excluir</Button>
                          </div>
                        </td>
                      </tr>
                    )
                  )
            }
            {adicionando && <EditRow rowKey="new" onSave={() => handleSalvar()} onCancel={() => setAdicionando(false)} />}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ── Bandeiras ─────────────────────────────────────────────────────────────────

const BANDEIRA_PADRAO: BandeiraCartaoSalvar = { nome: "", ativo: true };

function BandeirasTabela() {
  const { data: bandeiras = [], isLoading } = useBandeirasCartao();
  const queryClient = useQueryClient();
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [adicionando, setAdicionando] = useState(false);
  const [draft, setDraft] = useState<BandeiraCartaoSalvar>(BANDEIRA_PADRAO);
  const [confirmandoExcluirId, setConfirmandoExcluirId] = useState<string | null>(null);

  const colunasBand = useMemo<DataGridColumn<BandeiraCartao>[]>(() => [
    { id: "nome", label: "Nome", accessor: (b) => b.nome },
    { id: "ativo", label: "Status", accessor: (b) => b.ativo ? "Ativo" : "Inativo" },
  ], []);
  const gridBand = useDataGrid(bandeiras, colunasBand);

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ["bandeiras-cartao"] });

  const handleEditar = (b: BandeiraCartao) => {
    setEditandoId(b.id);
    setDraft({ nome: b.nome, ativo: b.ativo });
    setAdicionando(false);
    setConfirmandoExcluirId(null);
  };

  const handleSalvar = async (id?: string) => {
    try {
      if (id) {
        await api.atualizarBandeiraCartao(id, draft);
        setEditandoId(null);
        toast.success("Bandeira atualizada.");
      } else {
        await api.salvarBandeiraCartao(draft);
        setAdicionando(false);
        toast.success("Bandeira adicionada.");
      }
      await invalidar();
    } catch { toast.error("Erro ao salvar bandeira."); }
  };

  const handleExcluir = async (id: string) => {
    try {
      await api.excluirBandeiraCartao(id);
      setConfirmandoExcluirId(null);
      await invalidar();
      toast.success("Bandeira excluída.");
    } catch { toast.error("Erro ao excluir bandeira."); }
  };

  const EditRowBand = ({ rowKey, onSave, onCancel }: { rowKey: string; onSave: () => void; onCancel: () => void }) => (
    <tr key={rowKey} className="bg-primary/5">
      <td className="px-4 py-2">
        <Input value={draft.nome} onChange={e => setDraft(d => ({ ...d, nome: e.target.value }))} className="h-8 w-full" placeholder="Ex: Visa" />
      </td>
      <td className="px-4 py-2 text-center">
        <Switch checked={draft.ativo} onCheckedChange={v => setDraft(d => ({ ...d, ativo: v }))} />
      </td>
      <td className="px-4 py-2">
        <div className="flex gap-2">
          <Button size="sm" onClick={onSave}>Salvar</Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>Cancelar</Button>
        </div>
      </td>
    </tr>
  );

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">Bandeiras de cartão</span>
        <Button size="sm" onClick={() => { setAdicionando(true); setDraft(BANDEIRA_PADRAO); setEditandoId(null); }} disabled={adicionando}>
          <Plus className="mr-1.5 h-4 w-4" />Adicionar
        </Button>
      </div>
      <table className="w-full table-fixed text-sm">
        <colgroup>
          <col />
          <col className="w-36" />
          <col className="w-40" />
        </colgroup>
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <DataGridColumnHeader grid={gridBand} columnId="nome" label="Nome" />
            <DataGridColumnHeader grid={gridBand} columnId="ativo" label="Status" align="center" />
            <th className="sticky right-0 z-20 bg-muted/50 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground [box-shadow:-2px_0_5px_rgba(0,0,0,0.06)]">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {isLoading
            ? <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground">Carregando...</td></tr>
            : gridBand.rows.length === 0 && !adicionando
              ? <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhuma bandeira cadastrada.</td></tr>
              : gridBand.rows.map((b) =>
                  editandoId === b.id ? (
                    <EditRowBand key={b.id} rowKey={b.id} onSave={() => handleSalvar(b.id)} onCancel={() => setEditandoId(null)} />
                  ) : confirmandoExcluirId === b.id ? (
                    <tr key={b.id} className="bg-destructive/5">
                      <td colSpan={2} className="px-4 py-3 text-sm">Excluir <strong>{b.nome}</strong>?</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="destructive" onClick={() => handleExcluir(b.id)}>Excluir</Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirmandoExcluirId(null)}>Cancelar</Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={b.id} className="group hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium border-r border-border/40">{b.nome}</td>
                      <td className="px-4 py-3 text-center border-r border-border/40"><BADGE_ATIVO ativo={b.ativo} /></td>
                      <td className="sticky right-0 z-10 bg-card px-4 py-3 [box-shadow:-2px_0_5px_rgba(0,0,0,0.06)] group-hover:bg-muted/30">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-8 px-3" onClick={() => handleEditar(b)}>Editar</Button>
                          <Button size="sm" variant="ghost" className="h-8 px-3 text-destructive hover:bg-destructive/10" onClick={() => setConfirmandoExcluirId(b.id)}>Excluir</Button>
                        </div>
                      </td>
                    </tr>
                  )
                )
          }
          {adicionando && <EditRowBand rowKey="new" onSave={() => handleSalvar()} onCancel={() => setAdicionando(false)} />}
        </tbody>
      </table>
    </Card>
  );
}

// ── Taxas de Cartão ───────────────────────────────────────────────────────────

type ParcelaDraft = { numeroParcelas: number | ""; percentualTaxa: number | ""; prazoRecebimentoDias: number | ""; taxaFixa: number | "" | null; };

const parcelaDraft = (n: number): ParcelaDraft => ({ numeroParcelas: n, percentualTaxa: "", prazoRecebimentoDias: 30, taxaFixa: null });

const CONFIG_PADRAO: ConfiguracaoTaxaCartaoSalvar = {
  formaPagamentoId: "", bandeiraId: "", tipoCartao: "Crédito", ativo: true,
  parcelas: Array.from({ length: 6 }, (_, i) => ({ numeroParcelas: i + 1, percentualTaxa: 0, prazoRecebimentoDias: 30, taxaFixa: null })),
};

function TaxasCartaoTabela() {
  const { data: configs = [], isLoading } = useConfiguracoesTaxaCartao();
  const { data: formas = [] } = useFormasPagamento();
  const { data: bandeiras = [] } = useBandeirasCartao();
  const queryClient = useQueryClient();
  const [expandidoId, setExpandidoId] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [adicionando, setAdicionando] = useState(false);
  const [draft, setDraft] = useState<ConfiguracaoTaxaCartaoSalvar>(CONFIG_PADRAO);
  const [parcelasDraft, setParcelasDraft] = useState<ParcelaDraft[]>([]);
  const [confirmandoExcluirId, setConfirmandoExcluirId] = useState<string | null>(null);

  const colunasTaxa = useMemo<DataGridColumn<ConfiguracaoTaxaCartao>[]>(() => [
    { id: "formaPagamentoNome", label: "Forma", accessor: (c) => c.formaPagamentoNome },
    { id: "bandeiraNome", label: "Bandeira", accessor: (c) => c.bandeiraNome },
    { id: "tipoCartao", label: "Tipo", accessor: (c) => c.tipoCartao },
    { id: "parcelas", label: "Parcelas", accessor: (c) => String(c.parcelas.length) },
    { id: "ativo", label: "Status", accessor: (c) => c.ativo ? "Ativo" : "Inativo" },
  ], []);
  const gridTaxa = useDataGrid(configs, colunasTaxa);

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ["configuracoes-taxa-cartao"] });

  const formasComBandeira = formas.filter(f => f.exigeBandeira && f.ativo);

  const iniciarEdicao = (c: ConfiguracaoTaxaCartao) => {
    setEditandoId(c.id);
    setAdicionando(false);
    setDraft({ formaPagamentoId: c.formaPagamentoId, bandeiraId: c.bandeiraId, tipoCartao: c.tipoCartao, ativo: c.ativo, parcelas: [] });
    setParcelasDraft(c.parcelas.map(p => ({ numeroParcelas: p.numeroParcelas, percentualTaxa: p.percentualTaxa, prazoRecebimentoDias: p.prazoRecebimentoDias, taxaFixa: p.taxaFixa })));
  };

  const iniciarAdicao = () => {
    setAdicionando(true);
    setEditandoId(null);
    const p6 = Array.from({ length: 6 }, (_, i) => parcelaDraft(i + 1));
    setDraft({ ...CONFIG_PADRAO, formaPagamentoId: formasComBandeira[0]?.id ?? "", bandeiraId: bandeiras[0]?.id ?? "" });
    setParcelasDraft(p6);
  };

  const handleSalvar = async (id?: string) => {
    const payload: ConfiguracaoTaxaCartaoSalvar = {
      ...draft,
      parcelas: parcelasDraft.map(p => ({
        numeroParcelas:       Number(p.numeroParcelas) || 1,
        percentualTaxa:       Number(p.percentualTaxa) || 0,
        prazoRecebimentoDias: Number(p.prazoRecebimentoDias) || 30,
        taxaFixa:             p.taxaFixa !== null && p.taxaFixa !== "" ? Number(p.taxaFixa) : null,
      })),
    };
    try {
      if (id) {
        await api.atualizarConfiguracaoTaxaCartao(id, payload);
        setEditandoId(null);
        toast.success("Configuração atualizada.");
      } else {
        await api.salvarConfiguracaoTaxaCartao(payload);
        setAdicionando(false);
        toast.success("Configuração adicionada.");
      }
      await invalidar();
    } catch { toast.error("Erro ao salvar configuração."); }
  };

  const handleExcluir = async (id: string) => {
    try {
      await api.excluirConfiguracaoTaxaCartao(id);
      setConfirmandoExcluirId(null);
      await invalidar();
      toast.success("Configuração excluída.");
    } catch { toast.error("Erro ao excluir configuração."); }
  };

  const FormEdicao = ({ onSave, onCancel, id }: { onSave: () => void; onCancel: () => void; id?: string }) => (
    <tr className="bg-primary/5">
      <td colSpan={6} className="px-4 py-4">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase">Forma de pagamento</span>
              <AppSelect value={draft.formaPagamentoId} onValueChange={v => setDraft(d => ({ ...d, formaPagamentoId: v }))}
                options={formasComBandeira.map(f => ({ value: f.id, label: f.nome }))} placeholder="Selecionar..." />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase">Bandeira</span>
              <AppSelect value={draft.bandeiraId} onValueChange={v => setDraft(d => ({ ...d, bandeiraId: v }))}
                options={bandeiras.filter(b => b.ativo).map(b => ({ value: b.id, label: b.nome }))} placeholder="Selecionar..." />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase">Tipo</span>
              <AppSelect value={draft.tipoCartao} onValueChange={v => setDraft(d => ({ ...d, tipoCartao: v }))}
                options={[{ value: "Crédito", label: "Crédito" }, { value: "Débito", label: "Débito" }]} />
            </label>
            <label className="flex items-end gap-3 pb-1">
              <Switch checked={draft.ativo} onCheckedChange={v => setDraft(d => ({ ...d, ativo: v }))} />
              <span className="text-sm">Ativo</span>
            </label>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-center">Parcelas</th>
                  <th className="px-3 py-2 text-right">Taxa (%)</th>
                  <th className="px-3 py-2 text-right">Taxa fixa (R$)</th>
                  <th className="px-3 py-2 text-right">Prazo (dias)</th>
                  <th className="px-3 py-2 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {parcelasDraft.map((p, i) => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="px-3 py-1.5 text-center font-semibold">{p.numeroParcelas}x</td>
                    <td className="px-3 py-1.5">
                      <Input type="number" min={0} step={0.01} value={p.percentualTaxa}
                        onChange={e => setParcelasDraft(prev => prev.map((x, j) => j === i ? { ...x, percentualTaxa: e.target.value === "" ? "" : Number(e.target.value) } : x))}
                        className="h-7 w-24 text-right ml-auto" placeholder="0,00" />
                    </td>
                    <td className="px-3 py-1.5">
                      <Input type="number" min={0} step={0.01} value={p.taxaFixa ?? ""}
                        onChange={e => setParcelasDraft(prev => prev.map((x, j) => j === i ? { ...x, taxaFixa: e.target.value === "" ? null : Number(e.target.value) } : x))}
                        className="h-7 w-24 text-right ml-auto" placeholder="—" />
                    </td>
                    <td className="px-3 py-1.5">
                      <Input type="number" min={1} value={p.prazoRecebimentoDias}
                        onChange={e => setParcelasDraft(prev => prev.map((x, j) => j === i ? { ...x, prazoRecebimentoDias: Number(e.target.value) || 30 } : x))}
                        className="h-7 w-20 text-right ml-auto" />
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <button onClick={() => setParcelasDraft(prev => prev.filter((_, j) => j !== i))}
                        className="text-destructive hover:opacity-70 text-xs font-medium">Remover</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button size="sm" variant="outline" onClick={() => setParcelasDraft(prev => [...prev, parcelaDraft(prev.length + 1)])}>
            + Adicionar parcela
          </Button>

          <div className="flex gap-2">
            <Button size="sm" onClick={onSave}>Salvar</Button>
            <Button size="sm" variant="ghost" onClick={onCancel}>Cancelar</Button>
          </div>
        </div>
      </td>
    </tr>
  );

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">Taxas de cartão</span>
        <Button size="sm" onClick={iniciarAdicao} disabled={adicionando || !!editandoId}>
          <Plus className="mr-1.5 h-4 w-4" />Adicionar
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] table-fixed text-sm">
          <colgroup>
            <col />
            <col />
            <col className="w-28" />
            <col className="w-28" />
            <col className="w-28" />
            <col className="w-36" />
          </colgroup>
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <DataGridColumnHeader grid={gridTaxa} columnId="formaPagamentoNome" label="Forma" />
              <DataGridColumnHeader grid={gridTaxa} columnId="bandeiraNome" label="Bandeira" />
              <DataGridColumnHeader grid={gridTaxa} columnId="tipoCartao" label="Tipo" />
              <DataGridColumnHeader grid={gridTaxa} columnId="parcelas" label="Parcelas" align="center" />
              <DataGridColumnHeader grid={gridTaxa} columnId="ativo" label="Status" align="center" />
              <th className="sticky right-0 z-20 bg-muted/50 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground [box-shadow:-2px_0_5px_rgba(0,0,0,0.06)]">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {adicionando && <FormEdicao onSave={() => handleSalvar()} onCancel={() => setAdicionando(false)} />}
            {isLoading
              ? <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">Carregando...</td></tr>
              : gridTaxa.rows.length === 0 && !adicionando
                ? <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhuma configuração de taxa cadastrada.</td></tr>
                : gridTaxa.rows.map((c) =>
                    editandoId === c.id ? (
                      <FormEdicao key={c.id} id={c.id} onSave={() => handleSalvar(c.id)} onCancel={() => setEditandoId(null)} />
                    ) : confirmandoExcluirId === c.id ? (
                      <tr key={c.id} className="bg-destructive/5">
                        <td colSpan={5} className="px-4 py-3 text-sm">Excluir <strong>{c.formaPagamentoNome} + {c.bandeiraNome}</strong>?</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button size="sm" variant="destructive" onClick={() => handleExcluir(c.id)}>Excluir</Button>
                            <Button size="sm" variant="ghost" onClick={() => setConfirmandoExcluirId(null)}>Cancelar</Button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <React.Fragment key={c.id}>
                        <tr className="group cursor-pointer hover:bg-muted/30" onClick={() => setExpandidoId(expandidoId === c.id ? null : c.id)}>
                          <td className="px-4 py-3 font-medium border-r border-border/40">{c.formaPagamentoNome}</td>
                          <td className="px-4 py-3 text-muted-foreground border-r border-border/40">{c.bandeiraNome}</td>
                          <td className="px-4 py-3 text-muted-foreground border-r border-border/40">{c.tipoCartao}</td>
                          <td className="px-4 py-3 text-center text-muted-foreground border-r border-border/40">{c.parcelas.length}x</td>
                          <td className="px-4 py-3 text-center border-r border-border/40"><BADGE_ATIVO ativo={c.ativo} /></td>
                          <td className="sticky right-0 z-10 bg-card px-4 py-3 [box-shadow:-2px_0_5px_rgba(0,0,0,0.06)] group-hover:bg-muted/30">
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-8 px-3" onClick={e => { e.stopPropagation(); iniciarEdicao(c); }}>Editar</Button>
                              <Button size="sm" variant="ghost" className="h-8 px-3 text-destructive hover:bg-destructive/10" onClick={e => { e.stopPropagation(); setConfirmandoExcluirId(c.id); }}>Excluir</Button>
                            </div>
                          </td>
                        </tr>
                        {expandidoId === c.id && (
                          <tr className="bg-muted/10">
                            <td colSpan={6} className="px-6 py-3">
                              <div className="overflow-x-auto rounded-md border">
                                <table className="w-full min-w-[400px] text-xs">
                                  <thead className="bg-muted/50 text-left uppercase tracking-wide text-muted-foreground">
                                    <tr>
                                      <th className="px-3 py-2 text-center">Parcelas</th>
                                      <th className="px-3 py-2 text-right">Taxa (%)</th>
                                      <th className="px-3 py-2 text-right">Taxa fixa</th>
                                      <th className="px-3 py-2 text-right">Prazo</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y">
                                    {c.parcelas.map(p => (
                                      <tr key={p.id} className="hover:bg-muted/20">
                                        <td className="px-3 py-2 text-center font-semibold">{p.numeroParcelas}x</td>
                                        <td className="px-3 py-2 text-right">{p.percentualTaxa.toFixed(2)}%</td>
                                        <td className="px-3 py-2 text-right text-muted-foreground">{p.taxaFixa != null ? `R$ ${p.taxaFixa.toFixed(2)}` : "—"}</td>
                                        <td className="px-3 py-2 text-right text-muted-foreground">{p.prazoRecebimentoDias} dias</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  )
            }
          </tbody>
        </table>
      </div>
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
              <td className="px-4 py-3 font-medium border-r border-border/40">{item.name}</td>
              <td className="px-4 py-3 border-r border-border/40"><Input defaultValue={item.value} className="h-9 max-w-[180px]" /></td>
              <td className="px-4 py-3 text-muted-foreground">{item.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <PaginationFooter pagination={pagination} />
    </Card>
  );
}
