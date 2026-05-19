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
import { Switch } from "@/components/ui/switch";
import { api, useCatalogoProdutos, useProdutoPorId } from "@/lib/api";
import { BASE_URL } from "@/lib/http";
import { useShortcutLabel } from "@/hooks/useShortcutLabel";
import { Camera, X } from "lucide-react";
import { toast } from "sonner";

const catalogoPadrao = { categorias: [], marcas: [], tipos: [], subtipos: [], colecoes: [] } as const;

export default function NovoProduto() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const tabOrigem = searchParams.get("tab") ?? "";
  const cancelShortcutLabel = useShortcutLabel("cancel");
  const saveShortcutLabel = useShortcutLabel("save");
  const params = useParams<{ id?: string }>();
  const { data: produto } = useProdutoPorId(params.id);
  const { data: catalogo = catalogoPadrao } = useCatalogoProdutos();
  const editando = Boolean(params.id);
  const idempotencyKey = useRef(crypto.randomUUID());
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    ref: "",
    marcaId: "",
    tipoId: "",
    subtipoId: "",
    categoriaId: "",
    colecaoId: "",
    precoVarejo: "",
    precoAtacado: "",
  });
  const [ativo, setAtivo] = useState(true);
  const [saldoPorTamanho, setSaldoPorTamanho] = useState<Record<string, string>>({});
  const [imagemUrl, setImagemUrl] = useState<string | undefined>(produto?.imagemUrl);
  const [imagemPendente, setImagemPendente] = useState<File | null>(null);
  const [uploadando, setUploadando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categorias = catalogo.categorias;
  const marcas = catalogo.marcas;
  const tipos = catalogo.tipos;
  const subtiposDisponiveis = catalogo.subtipos;
  const categoriaSelecionada = categorias.find((item) => item.id === form.categoriaId);
  const grade = categoriaSelecionada?.grade ?? [];

  useEffect(() => {
    if (produto) setImagemUrl(produto.imagemUrl);
  }, [produto]);

  useEffect(() => {
    if (!produto) return;
    setForm({
      nome: produto.nome,
      ref: produto.ref,
      marcaId: produto.marcaId ?? "",
      tipoId: produto.tipoId ?? "",
      subtipoId: produto.subtipoId ?? "",
      categoriaId: produto.categoriaId ?? "",
      colecaoId: produto.colecaoId ?? "",
      precoVarejo: String(produto.precoVarejo),
      precoAtacado: String(produto.precoAtacado),
    });
    setAtivo(produto.ativo);
  }, [produto]);

  useEffect(() => {
    if (form.categoriaId || categorias.length === 0) return;
    setForm((current) => ({ ...current, categoriaId: categorias[0].id }));
  }, [categorias, form.categoriaId]);

  useEffect(() => {
    if (form.marcaId || marcas.length === 0) return;
    setForm((current) => ({ ...current, marcaId: marcas[0].id }));
  }, [form.marcaId, marcas]);

  useEffect(() => {
    if (form.tipoId || tipos.length === 0) return;
    setForm((current) => ({ ...current, tipoId: tipos[0].id }));
  }, [form.tipoId, tipos]);

  const atualizarCampo = (campo: keyof typeof form, valor: string) => {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  };

  const handleArquivoSelecionado = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0];
    event.target.value = "";
    if (!arquivo) return;
    if (editando && produto) {
      setUploadando(true);
      try {
        const resultado = await api.uploadImagemProduto(produto.id, arquivo);
        setImagemUrl(resultado.imagemUrl);
        await queryClient.invalidateQueries({ queryKey: ["produtos"] });
        toast.success("Imagem atualizada.");
      } catch {
        toast.error("Falha no upload da imagem.");
      } finally {
        setUploadando(false);
      }
    } else {
      setImagemPendente(arquivo);
      setImagemUrl(URL.createObjectURL(arquivo));
    }
  };

  const handleRemoverImagem = async () => {
    if (editando && produto) {
      try {
        await api.removerImagemProduto(produto.id);
        setImagemUrl(undefined);
        await queryClient.invalidateQueries({ queryKey: ["produtos"] });
        toast.success("Imagem removida.");
      } catch {
        toast.error("Não foi possível remover a imagem.");
      }
    } else {
      setImagemUrl(undefined);
      setImagemPendente(null);
    }
  };

  const handleSalvar = async () => {
    if (!form.nome.trim() || !form.ref.trim() || !form.marcaId || !form.tipoId || !form.categoriaId) {
      toast.error("Preencha nome, referência, marca, tipo e categoria.");
      return;
    }

    setSalvando(true);
    try {
      const saldoInicial = Object.values(saldoPorTamanho).reduce((total, valor) => total + Number(valor || 0), 0);
      const dadosProduto = {
        id: produto?.id ?? "",
        nome: form.nome.trim(),
        ref: form.ref.trim(),
        marcaId: form.marcaId || undefined,
        tipoId: form.tipoId || undefined,
        subtipoId: form.subtipoId || undefined,
        categoriaId: form.categoriaId || undefined,
        colecaoId: form.colecaoId || undefined,
        precoVarejo: Number(form.precoVarejo || 0),
        precoAtacado: Number(form.precoAtacado || 0),
        ativo,
        estoque: editando ? produto?.estoque ?? 0 : saldoInicial,
      };
      if (editando) {
        await api.atualizarProduto(dadosProduto);
      } else {
        const criado = await api.salvarProduto(dadosProduto, idempotencyKey.current);
        if (imagemPendente) await api.uploadImagemProduto(criado.id, imagemPendente);
      }
      await queryClient.invalidateQueries({ queryKey: ["produtos"] });
      await queryClient.invalidateQueries({ queryKey: ["catalogo-produtos"] });
      toast.success(editando ? "Produto atualizado com sucesso!" : "Produto cadastrado com sucesso!");
      router.push(tabOrigem ? `/produtos?tab=${tabOrigem}` : "/produtos");
    } catch {
      toast.error("Não foi possível salvar o produto.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        breadcrumb={["Produtos", editando ? "Editar" : "Novo"]}
        title={editando ? "Editar produto" : "Novo produto"}
        status={editando ? undefined : "Não salvo"}
        actions={
          <FormHeaderActions
            cancelHref={tabOrigem ? `/produtos?tab=${tabOrigem}` : "/produtos"}
            cancelLabel={`Cancelar${cancelShortcutLabel}`}
            onSave={handleSalvar}
            saving={salvando}
            idleLabel={`${editando ? "Salvar alterações" : "Cadastrar produto"}${saveShortcutLabel}`}
          />
        }
      />

      <div className="flex-1 overflow-y-auto">
      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Dados do produto</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Nome</span>
                <Input value={form.nome} onChange={(event) => atualizarCampo("nome", event.target.value)} placeholder="Ex.: Pijama americano" />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Referência</span>
                <Input value={form.ref} onChange={(event) => atualizarCampo("ref", event.target.value)} placeholder="Ex.: PJ-001" />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Marca</span>
                <AppSelect value={form.marcaId} onValueChange={(value) => atualizarCampo("marcaId", value)} placeholder="Selecione" options={marcas.map((item) => ({ value: item.id, label: item.name }))} />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Coleção</span>
                <AppSelect value={form.colecaoId} onValueChange={(value) => atualizarCampo("colecaoId", value)} placeholder="Sem coleção" options={catalogo.colecoes.map((item) => ({ value: item.id, label: item.name }))} />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Tipo</span>
                <AppSelect value={form.tipoId} onValueChange={(value) => atualizarCampo("tipoId", value)} options={tipos.map((item) => ({ value: item.id, label: item.name }))} />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Subtipo</span>
                <AppSelect value={form.subtipoId} onValueChange={(value) => atualizarCampo("subtipoId", value)} options={subtiposDisponiveis.map((item) => ({ value: item.id, label: item.name }))} />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Categoria</span>
                <AppSelect value={form.categoriaId} onValueChange={(value) => atualizarCampo("categoriaId", value)} options={categorias.map((item) => ({ value: item.id, label: item.name }))} />
              </label>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Preços</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Varejo</span>
                <Input type="number" min={0} step="0.01" value={form.precoVarejo} onChange={(event) => atualizarCampo("precoVarejo", event.target.value)} placeholder="0,00" />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Atacado</span>
                <Input type="number" min={0} step="0.01" value={form.precoAtacado} onChange={(event) => atualizarCampo("precoAtacado", event.target.value)} placeholder="0,00" />
              </label>
            </div>
          </Card>

          {!editando && (
            <Card className="p-5">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Grade e estoque inicial</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {grade.map((tamanho) => (
                  <label key={tamanho} className="space-y-1.5">
                    <span className="text-sm font-medium">{tamanho}</span>
                    <Input type="number" min={0} step={1} value={saldoPorTamanho[tamanho] ?? ""} onChange={(event) => setSaldoPorTamanho((atual) => ({ ...atual, [tamanho]: event.target.value }))} placeholder="0" />
                  </label>
                ))}
              </div>
            </Card>
          )}
        </div>

        <Card className="h-fit space-y-5 p-5">
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Imagem</h3>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleArquivoSelecionado} />
            <div
              className="relative flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-md border-2 border-dashed hover:border-primary/50 transition-colors"
              onClick={() => !uploadando && fileInputRef.current?.click()}
            >
              {imagemUrl ? (
                <>
                  <img
                    src={imagemUrl.startsWith("blob:") ? imagemUrl : `${BASE_URL}${imagemUrl}`}
                    alt="Imagem do produto"
                    className="h-full w-full object-cover"
                  />
                  {uploadando && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                      <span className="text-sm text-muted-foreground">Enviando...</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  {uploadando ? (
                    <span className="text-sm">Enviando...</span>
                  ) : (
                    <>
                      <Camera className="h-8 w-8 opacity-40" />
                      <span className="text-xs">Clique para adicionar imagem</span>
                    </>
                  )}
                </div>
              )}
            </div>
            {imagemUrl && !uploadando && (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="mt-2 w-full text-muted-foreground hover:text-destructive"
                onClick={handleRemoverImagem}
              >
                <X className="mr-1.5 h-3.5 w-3.5" />Remover imagem
              </Button>
            )}
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Ativo</h3>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium">Produto ativo</div>
                <p className="text-xs text-muted-foreground">Disponível para vendas e encomendas</p>
              </div>
              <Switch checked={ativo} onCheckedChange={setAtivo} />
            </div>
          </div>
        </Card>
      </div>
      </div>
    </AppShell>
  );
}
