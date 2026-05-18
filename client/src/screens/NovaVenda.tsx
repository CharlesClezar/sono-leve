import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { AppSelect } from "@/components/AppSelect";
import { FormHeaderActions } from "@/components/FormHeaderActions";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatBRL, type ItemVenda, type Sale } from "@/lib/types";
import { api, useDadosOperacionais, useFormasPagamento, useItensEncomenda, type VendaSalvar } from "@/lib/api";
import { BASE_URL } from "@/lib/http";
import { useShortcutLabel } from "@/hooks/useShortcutLabel";
import { Search, X, UserPlus, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface Item {
  produtoId: string;
  tamanho: string;
  quantidade: number;
  preco: number;
}

const tamanhos = ["P", "M", "G", "GG"];

function dataHoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function NovaVenda() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clientes, fichas, encomendas, produtos, vendas } = useDadosOperacionais();
  const { data: formasPagamento = [] } = useFormasPagamento();
  const cancelShortcutLabel = useShortcutLabel("cancel");
  const saveShortcutLabel = useShortcutLabel("save");
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const venda = vendas.find((item) => item.id === params.id);
  const encomendaOrigemId = searchParams.get("from") === "encomenda" ? searchParams.get("id") : null;
  const parcial = searchParams.get("parcial") === "1";
  const encomendaOrigem = encomendaOrigemId ? encomendas.find((item) => item.id === encomendaOrigemId) ?? null : null;
  const fichaOrigemId = searchParams.get("from") === "ficha" ? searchParams.get("id") : null;
  const fichaOrigem = fichaOrigemId ? fichas.find((item) => item.id === fichaOrigemId) ?? null : null;
  const editando = Boolean(venda);
  const vieuDoDashboard = searchParams.get("from") === "dashboard";
  const breadcrumb = vieuDoDashboard
    ? ["Dashboard", "Venda", editando ? "Editar venda" : "Nova venda"]
    : ["Vendas", editando ? "Editar" : "Nova"];
  const cancelHref = vieuDoDashboard ? "/" : "/vendas";
  const clienteIdInicial = venda
    ? venda.clienteId
    : encomendaOrigem
      ? encomendaOrigem.clienteId
      : fichaOrigem
        ? fichaOrigem.clienteId
      : null;
  const primeiroProduto = produtos[0];

  const [buscaCliente, setBuscaCliente] = useState("");
  const [clienteId, setClienteId] = useState<string | null>(clienteIdInicial);
  const [buscaProduto, setBuscaProduto] = useState("");
  const [itens, setItens] = useState<Item[]>(
    venda && primeiroProduto
      ? [{ produtoId: primeiroProduto.id, tamanho: "M", quantidade: venda.pecas, preco: primeiroProduto.precoVarejo }]
      : []
  );
  const [descontoGlobal, setDescontoGlobal] = useState(0);
  const [descontosPorProduto, setDescontosPorProduto] = useState<Record<string, number>>({});
  const [formaPagamentoId, setFormaPagamentoId] = useState(venda?.formaPagamentoId ?? "");
  const [valorPago, setValorPago] = useState(0);
  const [dataVenda, setDataVenda] = useState(venda?.data?.substring(0, 10) ?? dataHoje());
  const [modalPagamento, setModalPagamento] = useState(false);
  const [fpModal, setFpModal] = useState("");
  const [valorModal, setValorModal] = useState(0);
  const idempotencyKey = useRef(crypto.randomUUID());
  const [gerando, setGerando] = useState(false);
  const { data: itensEncomendaOrigem } = useItensEncomenda(encomendaOrigemId ?? "");
  const itensPreenchidos = useRef(false);

  useEffect(() => {
    if (itensPreenchidos.current) return;
    if (!encomendaOrigemId || produtos.length === 0) return;
    if (parcial) {
      itensPreenchidos.current = true;
      const str = sessionStorage.getItem("sono_leve_itens_venda");
      sessionStorage.removeItem("sono_leve_itens_venda");
      if (!str) return;
      const novosItens = mapearItensParaVenda(JSON.parse(str) as ItemVenda[]);
      if (novosItens.length > 0) setItens(novosItens);
    } else {
      if (!itensEncomendaOrigem || itensEncomendaOrigem.length === 0) return;
      itensPreenchidos.current = true;
      const novosItens = mapearItensParaVenda(itensEncomendaOrigem);
      if (novosItens.length > 0) setItens(novosItens);
    }
  }, [itensEncomendaOrigem, encomendaOrigemId, parcial, produtos]);

  const cliente = clientes.find((c) => c.id === clienteId) ?? null;
  const tipoCliente = cliente?.tipo ?? "varejo";

  const clientesFiltrados = buscaCliente
    ? clientes.filter((c) => c.nome.toLowerCase().includes(buscaCliente.toLowerCase()))
    : [];
  const produtosFiltrados = buscaProduto
    ? produtos.filter(
        (p) =>
          p.ativo &&
          (p.nome.toLowerCase().includes(buscaProduto.toLowerCase()) ||
            p.ref.toLowerCase().includes(buscaProduto.toLowerCase()))
      )
    : [];

  const adicionarProduto = (produtoId: string) => {
    const p = produtos.find((x) => x.id === produtoId)!;
    const preco = tipoCliente === "atacado" ? p.precoAtacado : p.precoVarejo;
    setItens((prev) => [...prev, ...tamanhos.map((t) => ({ produtoId, tamanho: t, quantidade: 0, preco }))]);
    setBuscaProduto("");
  };

  const atualizarQuantidade = (idx: number, quantidade: number) =>
    setItens((prev) => prev.map((it, i) => (i === idx ? { ...it, quantidade: Math.max(0, quantidade) } : it)));

  const itensValidos = useMemo(() => itens.filter((i) => i.quantidade > 0), [itens]);

  const subtotal = useMemo(
    () =>
      itensValidos.reduce((s, i) => {
        const d = descontosPorProduto[i.produtoId] ?? 0;
        return s + i.quantidade * (d > 0 ? i.preco * (1 - d / 100) : i.preco);
      }, 0),
    [itensValidos, descontosPorProduto]
  );
  const total = Math.max(0, subtotal - descontoGlobal);
  const saldo = Math.max(0, total - valorPago);
  const troco = Math.max(0, valorPago - total);

  const agrupados = useMemo(() => {
    const map = new Map<string, Item[]>();
    itens.forEach((it) => {
      if (!map.has(it.produtoId)) map.set(it.produtoId, []);
      map.get(it.produtoId)!.push(it);
    });
    return Array.from(map.entries());
  }, [itens]);

  const saldoRestante = encomendaOrigem ? Math.max(0, encomendaOrigem.total - total) : 0;

  const executarGerar = async (fpId: string, vPago: number) => {
    setGerando(true);
    try {
      const origem: Sale["origem"] = encomendaOrigem ? "Encomenda" : fichaOrigem ? "Ficha" : "Balcão";
      const payload: VendaSalvar = {
        id: venda?.id,
        clienteId: cliente!.id,
        formaPagamentoId: fpId || undefined,
        data: new Date(dataVenda + "T12:00:00").toISOString(),
        pecas: itensValidos.reduce((sum, item) => sum + item.quantidade, 0),
        total,
        status: venda?.status ?? "Gerada" as const,
        origem,
        items: itensValidos.map((item) => {
          const d = descontosPorProduto[item.produtoId] ?? 0;
          return {
            produtoId: item.produtoId,
            tamanho: item.tamanho,
            quantidade: item.quantidade,
            precoUnitario: d > 0 ? item.preco * (1 - d / 100) : item.preco,
          };
        }),
      };

      if (editando) await api.atualizarVenda({ ...payload, id: venda!.id });
      else await api.salvarVenda(payload, idempotencyKey.current);

      if (!editando && encomendaOrigem?.status === "Fabricado parcialmente" && saldoRestante > 0) {
        await api.salvarEncomenda({
          clienteId: encomendaOrigem.clienteId,
          previsao: encomendaOrigem.previsao,
          total: Number(saldoRestante.toFixed(2)),
          entrada: 0,
          status: "Aberta",
          items: [],
        });
        await api.atualizarStatusEncomenda(encomendaOrigem.id, "Entregue");
        toast.success(`Venda gerada e nova encomenda criada com saldo restante de ${formatBRL(saldoRestante)}!`);
      } else {
        if (!editando && encomendaOrigem) await api.atualizarStatusEncomenda(encomendaOrigem.id, "Entregue");
        toast.success(editando ? "Venda atualizada com sucesso!" : "Venda gerada com sucesso!");
      }
      await queryClient.invalidateQueries({ queryKey: ["vendas"] });
      await queryClient.invalidateQueries({ queryKey: ["encomendas"] });
      if (!editando) {
        setItens([]); setValorPago(0); setDescontoGlobal(0); setDescontosPorProduto({});
      }
      router.push("/vendas");
    } catch {
      toast.error("Não foi possível salvar a venda.");
    } finally {
      setGerando(false);
    }
  };

  const handleGerar = () => {
    if (!cliente) return toast.error("Selecione um cliente");
    if (itensValidos.length === 0) return toast.error("Adicione ao menos um item");
    if (!formaPagamentoId) {
      setFpModal("");
      setValorModal(0);
      setModalPagamento(true);
      return;
    }
    executarGerar(formaPagamentoId, valorPago);
  };

  const formasPagamentoAtivas = formasPagamento.filter((f) => f.ativo);

  return (
    <AppShell>
      <PageHeader
        breadcrumb={breadcrumb}
        title={editando ? "Editar venda" : "Nova venda"}
        status={editando ? venda?.status : itens.length === 0 ? "Não salvo" : undefined}
        actions={
          <FormHeaderActions
            cancelHref={cancelHref}
            cancelLabel={`Cancelar${cancelShortcutLabel}`}
            onSave={handleGerar}
            saving={gerando}
            idleLabel={`${editando ? "Salvar alterações" : "Gerar venda"}${saveShortcutLabel}`}
          />
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_360px]">

          {/* Coluna esquerda: apenas produtos */}
          <Card className="p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Produtos</h3>
              <div className="relative mb-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou referência..."
                  className="pl-9"
                  value={buscaProduto}
                  onChange={(e) => setBuscaProduto(e.target.value)}
                />
                {produtosFiltrados.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-lg">
                    {produtosFiltrados.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => adicionarProduto(p.id)}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
                      >
                        {p.imagemUrl ? (
                          <img src={`${BASE_URL}${p.imagemUrl}`} alt="" className="h-8 w-8 shrink-0 rounded object-cover" />
                        ) : (
                          <div className="h-8 w-8 shrink-0 rounded bg-muted" />
                        )}
                        <span className="flex-1 min-w-0">{p.nome} <span className="text-xs text-muted-foreground">({p.ref})</span></span>
                        <span className="shrink-0 text-xs font-semibold">
                          {formatBRL(tipoCliente === "atacado" ? p.precoAtacado : p.precoVarejo)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {agrupados.length === 0 ? (
                <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
                  Busque um produto acima para começar
                </div>
              ) : (
                <div className="space-y-4">
                  {agrupados.map(([pid, grupo]) => {
                    const p = produtos.find((x) => x.id === pid)!;
                    const descProduto = descontosPorProduto[pid] ?? 0;
                    const precoEfetivo = descProduto > 0 ? grupo[0].preco * (1 - descProduto / 100) : grupo[0].preco;
                    return (
                      <div key={pid} className="rounded-md border p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {p.imagemUrl ? (
                              <img src={`${BASE_URL}${p.imagemUrl}`} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
                            ) : (
                              <div className="h-10 w-10 shrink-0 rounded bg-muted" />
                            )}
                            <div>
                              <div className="font-medium">{p.nome}</div>
                              <div className="text-xs text-muted-foreground">
                                {p.ref} ·{" "}
                                {descProduto > 0 ? (
                                  <>
                                    <span className="line-through opacity-50">{formatBRL(grupo[0].preco)}</span>
                                    {" "}
                                    <span className="font-semibold text-[hsl(var(--success))]">{formatBRL(precoEfetivo)}</span>
                                  </>
                                ) : (
                                  formatBRL(grupo[0].preco)
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setItens((prev) => prev.filter((i) => i.produtoId !== pid))}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          {grupo.map((it) => {
                            const idx = itens.indexOf(it);
                            return (
                              <div key={it.tamanho} className="rounded-md bg-muted/40 p-2 text-center">
                                <div className="text-xs font-semibold uppercase text-muted-foreground">{it.tamanho}</div>
                                <Input
                                  type="number"
                                  min={0}
                                  value={it.quantidade}
                                  onChange={(e) => atualizarQuantidade(idx, +e.target.value)}
                                  className="mt-1 h-9 border-0 bg-card text-center font-semibold"
                                />
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-3 flex items-center gap-2 border-t pt-3">
                          <span className="text-xs text-muted-foreground">Desconto</span>
                          <div className="relative w-24">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={1}
                              value={descProduto || ""}
                              onChange={(e) => {
                                const v = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                setDescontosPorProduto((prev) => ({ ...prev, [pid]: v }));
                              }}
                              placeholder="0"
                              className="h-7 pr-6 text-right text-xs"
                            />
                            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                          </div>
                          {descProduto > 0 && (
                            <span className="text-xs text-[hsl(var(--success))]">
                              −{formatBRL(grupo[0].preco * (descProduto / 100))} por peça
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

          {/* Coluna direita */}
          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            {/* Resumo (inclui cliente) */}
            <Card className="p-5">
              {/* Cliente */}
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Cliente</h3>
              {cliente ? (
                <div className="flex items-center justify-between rounded-md border bg-primary-soft/40 p-3">
                  <div>
                    <div className="font-medium">{cliente.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {cliente.telefone} · <span className="font-medium uppercase text-primary">{cliente.tipo}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setClienteId(null)}>Trocar</Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cliente..."
                    className="pl-9"
                    value={buscaCliente}
                    onChange={(e) => setBuscaCliente(e.target.value)}
                  />
                  {clientesFiltrados.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-lg">
                      {clientesFiltrados.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => { setClienteId(c.id); setBuscaCliente(""); }}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                        >
                          <span>{c.nome}</span>
                          <span className="text-xs uppercase text-muted-foreground">{c.tipo}</span>
                        </button>
                      ))}
                      <button className="flex w-full items-center gap-2 border-t px-3 py-2 text-left text-sm font-medium text-primary hover:bg-primary-soft">
                        <UserPlus className="h-4 w-4" /> Cadastrar novo cliente
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Origem da venda (compacto) */}
              {encomendaOrigem && (
                <div className="mt-3 rounded-md border border-primary/15 bg-primary/5 px-3 py-2 text-xs">
                  <span className="font-medium text-primary">Encomenda</span>
                  <span className="mx-1 text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{encomendaOrigem.status}</span>
                  {encomendaOrigem.status === "Fabricado parcialmente" && saldoRestante > 0 && (
                    <span className="ml-1 text-warning">· saldo {formatBRL(saldoRestante)}</span>
                  )}
                </div>
              )}

              <div className="my-4 border-t" />

              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Resumo</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Data da venda</span>
                  <Input
                    type="date"
                    value={dataVenda}
                    onChange={(e) => setDataVenda(e.target.value)}
                    className="h-8 w-44 text-right"
                  />
                </div>
                <Linha label="Subtotal" valor={formatBRL(subtotal)} />
                <Linha label="Peças" valor={itensValidos.reduce((s, i) => s + i.quantidade, 0).toString()} />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Desconto (R$)</span>
                  <Input
                    type="number"
                    min={0}
                    value={descontoGlobal || ""}
                    onChange={(e) => setDescontoGlobal(+e.target.value || 0)}
                    placeholder="0"
                    className="h-8 w-28 text-right"
                  />
                </div>
                <div className="my-3 border-t" />
                <Linha label="Total" valor={formatBRL(total)} negrito />
                {encomendaOrigem?.status === "Fabricado parcialmente" && (
                  <Linha label="Restante na nova encomenda" valor={formatBRL(saldoRestante)} tom={saldoRestante > 0 ? "aviso" : "mudo"} />
                )}
              </div>
            </Card>

            {/* Pagamento */}
            <Card className="p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <CreditCard className="h-4 w-4" /> Pagamento
              </h3>
              <div className="space-y-3 text-sm">
                <label className="space-y-1.5">
                  <span className="text-xs text-muted-foreground">Forma de pagamento</span>
                  <AppSelect
                    value={formaPagamentoId}
                    onValueChange={setFormaPagamentoId}
                    placeholder="Selecionar..."
                    options={formasPagamentoAtivas.map((f) => ({
                      value: f.id,
                      label: `${f.nome}${f.condicao ? ` — ${f.condicao}` : ""}`,
                    }))}
                  />
                </label>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Valor pago</span>
                  <Input
                    type="number"
                    min={0}
                    value={valorPago || ""}
                    onChange={(e) => setValorPago(+e.target.value || 0)}
                    placeholder="0"
                    className="h-8 w-28 text-right"
                  />
                </div>
                {(valorPago > 0 || saldo > 0) && (
                  <>
                    <div className="border-t pt-2" />
                    <Linha label="Saldo em aberto" valor={formatBRL(saldo)} tom={saldo > 0 ? "aviso" : "mudo"} />
                    {troco > 0 && <Linha label="Troco" valor={formatBRL(troco)} tom="sucesso" />}
                  </>
                )}
              </div>
              <Button className="mt-5 w-full" size="lg" onClick={handleGerar} disabled={gerando}>
                {gerando ? "Salvando..." : editando ? "Salvar alterações" : "Gerar venda"}
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal: pagamento não preenchido */}
      <Dialog open={modalPagamento} onOpenChange={setModalPagamento}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Informar pagamento</DialogTitle>
            <DialogDescription>
              Nenhuma forma de pagamento foi selecionada. Deseja informar agora ou gerar a venda sem pagamento?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <label className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Forma de pagamento</span>
              <AppSelect
                value={fpModal}
                onValueChange={setFpModal}
                placeholder="Selecionar..."
                options={formasPagamentoAtivas.map((f) => ({
                  value: f.id,
                  label: `${f.nome}${f.condicao ? ` — ${f.condicao}` : ""}`,
                }))}
              />
            </label>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Valor pago</span>
              <Input
                type="number"
                min={0}
                value={valorModal || ""}
                onChange={(e) => setValorModal(+e.target.value || 0)}
                placeholder="0"
                className="h-8 w-28 text-right"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => {
                setModalPagamento(false);
                executarGerar("", 0);
              }}
              disabled={gerando}
            >
              Gerar sem pagamento
            </Button>
            <Button
              onClick={() => {
                setFormaPagamentoId(fpModal);
                setValorPago(valorModal);
                setModalPagamento(false);
                executarGerar(fpModal, valorModal);
              }}
              disabled={gerando || !fpModal}
            >
              Confirmar e gerar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function mapearItensParaVenda(fonte: ItemVenda[]): Item[] {
  return fonte
    .filter((pi) => pi.quantidade > 0)
    .map((pi) => ({
      produtoId: pi.produtoId,
      tamanho: pi.tamanho,
      quantidade: pi.quantidade,
      preco: pi.precoUnitario,
    }));
}

function Linha({ label, valor, negrito, tom }: { label: string; valor: string; negrito?: boolean; tom?: "mudo" | "aviso" | "sucesso" }) {
  const tomClass = tom === "aviso" ? "text-warning" : tom === "sucesso" ? "text-[hsl(var(--success))]" : "";
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`${negrito ? "text-base font-semibold" : ""} ${tomClass}`}>{valor}</span>
    </div>
  );
}
