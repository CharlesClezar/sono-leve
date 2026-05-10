import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { AppSelect } from "@/components/AppSelect";
import { FormHeaderActions } from "@/components/FormHeaderActions";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { api, useCatalogoProdutos, useProdutos } from "@/lib/api";
import type { Product } from "@/lib/types";
import { useShortcutLabel } from "@/hooks/useShortcutLabel";
import { toast } from "sonner";

export default function NovoProduto() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const cancelShortcutLabel = useShortcutLabel("cancel");
  const saveShortcutLabel = useShortcutLabel("save");
  const params = useParams<{ id?: string }>();
  const { data: products } = useProdutos();
  const { data: catalogo } = useCatalogoProdutos();
  const product = products.find((item) => item.id === params.id);
  const isEditing = Boolean(product);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    ref: "",
    brand: "",
    type: "",
    subtype: "",
    category: "",
    collection: "",
    model: "",
    priceRetail: "",
    priceWholesale: "",
  });
  const [active, setActive] = useState(true);
  const [saldoPorTamanho, setSaldoPorTamanho] = useState<Record<string, string>>({});

  const categorias = catalogo.categorias;
  const marcas = catalogo.marcas;
  const tipos = catalogo.tipos;
  const subtiposDisponiveis = useMemo(
    () => catalogo.subtipos.filter((item) => item.type === form.type),
    [catalogo.subtipos, form.type],
  );
  const categoriaSelecionada = categorias.find((item) => item.name === form.category);
  const grade = categoriaSelecionada?.grade ?? [];

  useEffect(() => {
    if (!product) return;
    setForm({
      name: product.name,
      ref: product.ref,
      brand: product.brand,
      type: product.type,
      subtype: product.subtype,
      category: product.category,
      collection: product.collection ?? "",
      model: product.model ?? "",
      priceRetail: String(product.priceRetail),
      priceWholesale: String(product.priceWholesale),
    });
    setActive(product.active);
  }, [product]);

  useEffect(() => {
    if (form.category || categorias.length === 0) return;
    setForm((current) => ({ ...current, category: categorias[0].name }));
  }, [categorias, form.category]);

  useEffect(() => {
    if (form.brand || marcas.length === 0) return;
    setForm((current) => ({ ...current, brand: marcas[0].name }));
  }, [form.brand, marcas]);

  useEffect(() => {
    if (form.type || tipos.length === 0) return;
    setForm((current) => ({ ...current, type: tipos[0].name }));
  }, [form.type, tipos]);

  useEffect(() => {
    if (subtiposDisponiveis.some((item) => item.name === form.subtype)) return;
    setForm((current) => ({ ...current, subtype: subtiposDisponiveis[0]?.name ?? "" }));
  }, [form.subtype, subtiposDisponiveis]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.ref.trim() || !form.brand || !form.type || !form.subtype || !form.category) {
      toast.error("Preencha nome, referência, marca, tipo, subtipo e categoria.");
      return;
    }

    setSaving(true);
    try {
      const saldoInicial = Object.values(saldoPorTamanho).reduce((total, value) => total + Number(value || 0), 0);
      const produto: Product = {
        id: product?.id ?? "",
        name: form.name.trim(),
        ref: form.ref.trim(),
        brand: form.brand,
        type: form.type,
        subtype: form.subtype,
        category: form.category,
        collection: form.collection || undefined,
        model: form.model || undefined,
        priceRetail: Number(form.priceRetail || 0),
        priceWholesale: Number(form.priceWholesale || 0),
        active,
        stock: isEditing ? product?.stock ?? 0 : saldoInicial,
      };
      if (isEditing) await api.atualizarProduto(produto);
      else await api.salvarProduto(produto);
      await queryClient.invalidateQueries({ queryKey: ["produtos"] });
      await queryClient.invalidateQueries({ queryKey: ["catalogo-produtos"] });
      toast.success(isEditing ? "Produto atualizado com sucesso!" : "Produto cadastrado com sucesso!");
      router.push("/produtos");
    } catch {
      toast.error("Não foi possível salvar o produto.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        breadcrumb={["Produtos", isEditing ? "Editar" : "Novo"]}
        title={isEditing ? "Editar produto" : "Novo produto"}
        status={isEditing ? undefined : "Não salvo"}
        actions={
          <FormHeaderActions
            cancelHref="/produtos"
            cancelLabel={`Cancelar${cancelShortcutLabel}`}
            onSave={handleSave}
            saving={saving}
            idleLabel={`${isEditing ? "Salvar alterações" : "Cadastrar produto"}${saveShortcutLabel}`}
          />
        }
      />

      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Dados do produto</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Nome</span>
                <Input value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Ex.: Pijama americano" />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Referência</span>
                <Input value={form.ref} onChange={(event) => updateField("ref", event.target.value)} placeholder="Ex.: PJ-001" />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Marca</span>
                <AppSelect
                  value={form.brand}
                  onValueChange={(value) => updateField("brand", value)}
                  placeholder="Selecione"
                  options={marcas.map((item) => ({ value: item.name, label: item.name }))}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Coleção</span>
                <AppSelect
                  value={form.collection}
                  onValueChange={(value) => updateField("collection", value)}
                  placeholder="Sem coleção"
                  options={catalogo.colecoes.map((item) => ({ value: item.name, label: item.name }))}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Tipo</span>
                <AppSelect
                  value={form.type}
                  onValueChange={(value) => updateField("type", value)}
                  options={tipos.map((item) => ({ value: item.name, label: item.name }))}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Subtipo</span>
                <AppSelect
                  value={form.subtype}
                  onValueChange={(value) => updateField("subtype", value)}
                  options={subtiposDisponiveis.map((item) => ({ value: item.name, label: item.name }))}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Categoria</span>
                <AppSelect
                  value={form.category}
                  onValueChange={(value) => updateField("category", value)}
                  options={categorias.map((item) => ({ value: item.name, label: item.name }))}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Modelo</span>
                <AppSelect
                  value={form.model}
                  onValueChange={(value) => updateField("model", value)}
                  placeholder="Sem modelo"
                  options={catalogo.modelos.map((item) => ({ value: item.name, label: item.name }))}
                />
              </label>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Preços</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Varejo</span>
                <Input type="number" min={0} step="0.01" value={form.priceRetail} onChange={(event) => updateField("priceRetail", event.target.value)} placeholder="0,00" />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Atacado</span>
                <Input type="number" min={0} step="0.01" value={form.priceWholesale} onChange={(event) => updateField("priceWholesale", event.target.value)} placeholder="0,00" />
              </label>
            </div>
          </Card>

          {!isEditing && (
            <Card className="p-5">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Grade e estoque inicial</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {grade.map((tamanho) => (
                  <label key={tamanho} className="space-y-1.5">
                    <span className="text-sm font-medium">{tamanho}</span>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={saldoPorTamanho[tamanho] ?? ""}
                      onChange={(event) => setSaldoPorTamanho((current) => ({ ...current, [tamanho]: event.target.value }))}
                      placeholder="0"
                    />
                  </label>
                ))}
              </div>
            </Card>
          )}
        </div>

        <Card className="h-fit p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Ativo</h3>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium">Produto ativo</div>
              <p className="text-xs text-muted-foreground">Disponível para vendas e encomendas</p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
