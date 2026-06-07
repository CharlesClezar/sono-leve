import { gerarUUID } from "@/lib/uuid";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { AppSelect } from "@/components/AppSelect";
import { FormHeaderActions } from "@/components/FormHeaderActions";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBRL } from "@/lib/types";
import type { Product } from "@/lib/types";
import { api, useClientes, useBuscarProdutos, useEncomendaPorId, useProdutoPorId, useItensEncomenda } from "@/lib/api";
import { ProdutoImagem } from "@/components/ProdutoImagem";
import { useShortcutLabel } from "@/hooks/useShortcutLabel";
import { Search } from "lucide-react";
import { toast } from "sonner";

export default function NovaEncomenda() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: clientes = [] } = useClientes();
  const cancelShortcutLabel = useShortcutLabel("cancel");
  const saveShortcutLabel = useShortcutLabel("save");
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const { data: encomenda } = useEncomendaPorId(params.id);
  const editando = Boolean(params.id);
  const vieuDoDashboard = searchParams.get("from") === "dashboard";
  const breadcrumb = vieuDoDashboard
    ? ["Dashboard", "Encomenda", editando ? "Editar encomenda" : "Nova encomenda"]
    : ["Encomendas", editando ? "Editar" : "Nova"];
  const cancelHref = vieuDoDashboard ? "/" : "/encomendas";
  const idempotencyKey = useRef(gerarUUID());
  const itensPreenchidos = useRef(false);
  const [salvando, setSalvando] = useState(false);
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Product | null>(null);
  const [buscaProduto, setBuscaProduto] = useState("");
  const { data: itensExistentes } = useItensEncomenda(editando ? (params.id ?? "") : "");
  const primeiroItemProdutoId = editando ? (itensExistentes?.[0]?.produtoId ?? undefined) : undefined;
  const { data: produtoDoItem } = useProdutoPorId(primeiroItemProdutoId);
  const { data: resultadosBusca = [] } = useBuscarProdutos(buscaProduto);
  const [clienteId, setClienteId] = useState(encomenda?.clienteId ?? clientes[0]?.id ?? "");
  const [previsao, setPrevisao] = useState(encomenda?.previsao ?? "");
  const [tamanho, setTamanho] = useState("P");
  const [quantidade, setQuantidade] = useState(1);
  const [entrada, setEntrada] = useState(encomenda?.entrada ?? 0);

  const total = produtoSelecionado ? produtoSelecionado.precoVarejo * quantidade : encomenda?.total ?? 0;

  useEffect(() => {
    if (encomenda) {
      setClienteId(encomenda.clienteId);
      setPrevisao(encomenda.previsao);
      setEntrada(encomenda.entrada);
      return;
    }

    if (!clienteId && clientes[0]) setClienteId(clientes[0].id);
  }, [clienteId, clientes, encomenda]);

  useEffect(() => {
    if (!editando || itensPreenchidos.current || !itensExistentes?.length || !produtoDoItem) return;
    const primeiro = itensExistentes[0];
    setProdutoSelecionado(produtoDoItem);
    setTamanho(primeiro.tamanho);
    setQuantidade(primeiro.quantidade);
    itensPreenchidos.current = true;
  }, [itensExistentes, editando, produtoDoItem]);

  const handleSalvar = async () => {
    setTentouSalvar(true);
    if (!clienteId) return toast.error("Selecione um cliente.");
    if (!previsao) return toast.error("Informe a previsão de entrega.");
    if (!produtoSelecionado) return toast.error("Selecione um produto.");

    setSalvando(true);
    try {
      const payload = {
        id: encomenda?.id,
        clienteId,
        previsao,
        total,
        entrada,
        status: encomenda?.status ?? "Aberta" as const,
        items: [{
          produtoId: produtoSelecionado.id,
          tamanho,
          quantidade,
          precoUnitario: produtoSelecionado.precoVarejo,
        }],
      };
      if (editando) await api.atualizarEncomenda({ ...payload, id: encomenda!.id });
      else await api.salvarEncomenda(payload, idempotencyKey.current);
      await queryClient.invalidateQueries({ queryKey: ["encomendas"] });
      setSalvando(false);
      toast.success(editando ? "Encomenda atualizada com sucesso!" : "Encomenda cadastrada com sucesso!");
      router.push("/encomendas");
    } catch {
      toast.error("Não foi possível salvar a encomenda.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        breadcrumb={breadcrumb}
        title={editando ? "Editar encomenda" : "Nova encomenda"}
        status={editando ? encomenda?.status : "Não salvo"}
        actions={
          <FormHeaderActions
            cancelHref={cancelHref}
            cancelLabel={`Cancelar${cancelShortcutLabel}`}
            onSave={handleSalvar}
            saving={salvando}
            idleLabel={`${editando ? "Salvar alterações" : "Cadastrar encomenda"}${saveShortcutLabel}`}
          />
        }
      />

      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="flex h-full gap-6 overflow-hidden p-6 lg:flex-row">

          {/* ── Coluna esquerda: Cliente/Previsão + Item ── */}
          <Card className="flex min-h-0 flex-col overflow-hidden p-5 lg:flex-1">

            {/* Cabeçalho: Cliente + Previsão */}
            <div className="shrink-0 mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-6">
              <label className="flex-1 min-w-0 space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cliente <span className="text-destructive">*</span>
                </span>
                <AppSelect
                  value={clienteId}
                  onValueChange={setClienteId}
                  placeholder="Informe o cliente"
                  options={clientes.map((c) => ({ value: c.id, label: c.nome }))}
                  className={tentouSalvar && !clienteId ? "border-destructive" : ""}
                />
              </label>
              <label className="shrink-0 space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Previsão de entrega <span className="text-destructive">*</span>
                </span>
                <Input
                  type="date"
                  value={previsao}
                  onChange={(e) => setPrevisao(e.target.value)}
                  className={`h-9 w-36 text-sm${tentouSalvar && !previsao ? " border-destructive focus-visible:ring-destructive" : ""}`}
                />
              </label>
            </div>

            <div className="shrink-0 border-b mb-4" />

            {/* Item encomendado */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Item encomendado
              </h3>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Produto <span className="text-destructive">*</span>
                </span>
                {produtoSelecionado ? (
                  <div className="flex h-14 items-center gap-3 rounded-md border bg-muted/30 px-3">
                    <ProdutoImagem imagemUrl={produtoSelecionado.imagemUrl} className="h-9 w-9 shrink-0 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium">{produtoSelecionado.nome}</div>
                      <div className="text-xs text-muted-foreground">{produtoSelecionado.ref} · {formatBRL(produtoSelecionado.precoVarejo)}</div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 shrink-0 px-2 text-xs" onClick={() => setProdutoSelecionado(null)}>Trocar</Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou referência..."
                      className={`pl-9${tentouSalvar && !produtoSelecionado ? " border-destructive focus-visible:ring-destructive" : ""}`}
                      value={buscaProduto}
                      onChange={(e) => setBuscaProduto(e.target.value)}
                    />
                    {resultadosBusca.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-lg">
                        {resultadosBusca.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => { setProdutoSelecionado(p); setBuscaProduto(""); }}
                            className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
                          >
                            <ProdutoImagem imagemUrl={p.imagemUrl} className="h-8 w-8 shrink-0 rounded object-cover" />
                            <span className="flex-1 min-w-0">{p.nome} <span className="text-xs text-muted-foreground">({p.ref})</span></span>
                            <span className="shrink-0 text-xs font-semibold">{formatBRL(p.precoVarejo)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tamanho</span>
                  <AppSelect
                    defaultValue="P"
                    value={tamanho}
                    onValueChange={setTamanho}
                    options={["P", "M", "G", "GG"].map((t) => ({ value: t, label: t }))}
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quantidade</span>
                  <Input type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value || 1)))} />
                </label>
              </div>
            </div>
          </Card>

          {/* ── Coluna direita: Resumo ── */}
          <div className="flex flex-col gap-3 overflow-y-auto pb-2 lg:w-[300px] lg:shrink-0">
            <Card className="shrink-0 p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resumo</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preço unitário</span>
                  <span className="font-medium">{produtoSelecionado ? formatBRL(produtoSelecionado.precoVarejo) : formatBRL(0)}</span>
                </div>
                <label className="block space-y-1.5 pt-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Entrada</span>
                  <Input type="number" min={0} step="0.01" value={entrada} onChange={(e) => setEntrada(Number(e.target.value || 0))} placeholder="0,00" className="h-9" />
                </label>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-base font-semibold">{formatBRL(total)}</span>
                </div>
                <p className="text-xs text-muted-foreground">O saldo fica em aberto até a entrega ou geração da venda.</p>
              </div>
            </Card>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
