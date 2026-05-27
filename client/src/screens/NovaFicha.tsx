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
import { api, useClientes, useBuscarProdutos, useFichaPorId } from "@/lib/api";
import type { Product } from "@/lib/types";
import { BASE_URL } from "@/lib/http";
import { useShortcutLabel } from "@/hooks/useShortcutLabel";
import { Search } from "lucide-react";
import { toast } from "sonner";

export default function NovaFicha() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: clientes = [] } = useClientes();
  const cancelShortcutLabel = useShortcutLabel("cancel");
  const saveShortcutLabel = useShortcutLabel("save");
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const { data: ficha } = useFichaPorId(params.id);
  const editando = Boolean(params.id);
  const vieuDoDashboard = searchParams.get("from") === "dashboard";
  const breadcrumb = vieuDoDashboard
    ? ["Dashboard", "Ficha", editando ? "Editar ficha" : "Nova ficha"]
    : ["Fichas", editando ? "Editar" : "Nova"];
  const cancelHref = vieuDoDashboard ? "/" : "/fichas";
  const idempotencyKey = useRef(gerarUUID());
  const [salvando, setSalvando] = useState(false);
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const [clienteId, setClienteId] = useState(ficha?.clienteId ?? "");
  const [produtoSelecionado, setProdutoSelecionado] = useState<Product | null>(null);
  const [buscaProduto, setBuscaProduto] = useState("");
  const [tamanho, setTamanho] = useState("P");
  const [quantidade, setQuantidade] = useState(ficha?.enviadas ?? 1);

  const { data: resultadosBusca = [] } = useBuscarProdutos(buscaProduto);

  useEffect(() => {
    if (ficha) {
      setClienteId(ficha.clienteId);
      setQuantidade(ficha.enviadas);
      return;
    }

    const primeiraRevendedora = clientes.find((c) => c.tipo === "atacado");
    if (!clienteId && primeiraRevendedora) setClienteId(primeiraRevendedora.id);
  }, [clientes, ficha, clienteId]);

  const handleSalvar = async () => {
    setTentouSalvar(true);
    if (!clienteId) return toast.error("Selecione uma revendedora.");

    setSalvando(true);
    try {
      const payload = {
        id: ficha?.id,
        clienteId,
        dataAbertura: ficha?.dataAbertura,
        enviadas: quantidade,
        devolvidas: ficha?.devolvidas ?? 0,
        vendidas: ficha?.vendidas ?? 0,
        totalVendido: ficha?.totalVendido ?? 0,
        status: ficha?.status ?? "Aberta" as const,
      };
      if (editando) await api.atualizarFicha({ ...payload, id: ficha!.id });
      else await api.salvarFicha(payload, idempotencyKey.current);
      await queryClient.invalidateQueries({ queryKey: ["fichas"] });
      toast.success(editando ? "Ficha atualizada com sucesso!" : "Ficha aberta com sucesso!");
      router.push("/fichas");
    } catch {
      toast.error("Não foi possível salvar a ficha.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        breadcrumb={breadcrumb}
        title={editando ? "Editar ficha" : "Nova ficha"}
        status={editando ? ficha?.status : "Não salvo"}
        actions={
          <FormHeaderActions
            cancelHref={cancelHref}
            cancelLabel={`Cancelar${cancelShortcutLabel}`}
            onSave={handleSalvar}
            saving={salvando}
            idleLabel={`${editando ? "Salvar alterações" : "Abrir ficha"}${saveShortcutLabel}`}
          />
        }
      />

      <div className="flex-1 min-h-0 overflow-hidden">
      <div className="flex h-full flex-col gap-6 overflow-hidden p-6 lg:flex-row">
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto">
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Revendedora</h3>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Revendedora <span className="text-destructive">*</span></span>
              <AppSelect
                value={clienteId}
                onValueChange={setClienteId}
                placeholder="Informe a revendedora"
                options={clientes
                  .filter((c) => c.tipo === "atacado")
                  .map((c) => ({ value: c.id, label: c.nome }))}
                className={tentouSalvar && !clienteId ? "border-destructive" : ""}
              />
            </label>
          </Card>

          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Produtos enviados</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-sm font-medium">Produto</span>
                {produtoSelecionado ? (
                  <div className="flex items-center justify-between rounded-md border bg-primary-soft/40 p-3">
                    <div className="flex items-center gap-3">
                      {produtoSelecionado.imagemUrl ? (
                        <img src={`${BASE_URL}${produtoSelecionado.imagemUrl}`} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-10 shrink-0 rounded bg-muted" />
                      )}
                      <div>
                        <div className="font-medium">{produtoSelecionado.nome}</div>
                        <div className="text-xs text-muted-foreground">{produtoSelecionado.ref} · {formatBRL(produtoSelecionado.precoVarejo)}</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setProdutoSelecionado(null)}>Trocar</Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou referência..."
                      className="pl-9"
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
                            {p.imagemUrl ? (
                              <img src={`${BASE_URL}${p.imagemUrl}`} alt="" className="h-8 w-8 shrink-0 rounded object-cover" />
                            ) : (
                              <div className="h-8 w-8 shrink-0 rounded bg-muted" />
                            )}
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
                  <span className="text-sm font-medium">Tamanho</span>
                  <AppSelect
                    defaultValue="P"
                    value={tamanho}
                    onValueChange={setTamanho}
                    options={["P", "M", "G", "GG"].map((t) => ({ value: t, label: t }))}
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-medium">Quantidade</span>
                  <Input type="number" min={1} value={quantidade} onChange={(event) => setQuantidade(Math.max(1, Number(event.target.value || 1)))} />
                </label>
              </div>
            </div>
          </Card>
        </div>

        <div className="overflow-y-auto pb-2 lg:w-[320px] lg:shrink-0">
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Observações</h3>
          <p className="mt-3 text-xs text-muted-foreground">A ficha inicia aberta para registrar devoluções, vendas e acertos.</p>
        </Card>
        </div>
      </div>
      </div>
    </AppShell>
  );
}
