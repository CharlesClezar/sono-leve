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
import { api, useCatalogoProdutos } from "@/lib/api";
import { useShortcutLabel } from "@/hooks/useShortcutLabel";
import { toast } from "sonner";

type CatalogSlug = "categorias" | "grades" | "marcas" | "tipos" | "subtipos" | "colecoes" | "modelos";

const catalogConfig: Record<CatalogSlug, { title: string; breadcrumb: string; nameLabel: string }> = {
  categorias: { title: "Nova categoria", breadcrumb: "Categorias", nameLabel: "Categoria" },
  grades: { title: "Nova grade", breadcrumb: "Grades", nameLabel: "Categoria da grade" },
  marcas: { title: "Nova marca", breadcrumb: "Marcas", nameLabel: "Marca" },
  tipos: { title: "Novo tipo", breadcrumb: "Tipos", nameLabel: "Tipo" },
  subtipos: { title: "Novo subtipo", breadcrumb: "Subtipos", nameLabel: "Subtipo" },
  colecoes: { title: "Nova coleção", breadcrumb: "Coleções", nameLabel: "Coleção" },
  modelos: { title: "Novo modelo", breadcrumb: "Modelos", nameLabel: "Modelo" },
};

export default function NovoCatalogoProduto() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams<{ tipo?: string }>();
  const tipo = (params.tipo ?? "categorias") as CatalogSlug;
  const config = catalogConfig[tipo] ?? catalogConfig.categorias;
  const { data: catalogo } = useCatalogoProdutos();
  const cancelShortcutLabel = useShortcutLabel("cancel");
  const saveShortcutLabel = useShortcutLabel("save");
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [linkedType, setLinkedType] = useState("");
  const [period, setPeriod] = useState("Contínua");
  const [active, setActive] = useState(true);

  const typeOptions = useMemo(
    () => catalogo.tipos.map((item) => ({ value: item.name, label: item.name })),
    [catalogo.tipos],
  );

  useEffect(() => {
    if (!linkedType && typeOptions[0]) setLinkedType(typeOptions[0].value);
  }, [linkedType, typeOptions]);

  const needsGrade = tipo === "categorias" || tipo === "grades";
  const needsType = tipo === "subtipos";
  const needsPeriod = tipo === "colecoes";

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Preencha o nome.");
      return;
    }

    if (needsType && !linkedType) {
      toast.error("Selecione o tipo vinculado.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        active,
        grade: needsGrade ? grade.split(",").map((item) => item.trim()).filter(Boolean) : undefined,
        type: needsType ? linkedType : undefined,
        period: needsPeriod ? period.trim() : undefined,
      };

      if (tipo === "categorias" || tipo === "grades") await api.salvarCategoriaProduto(payload);
      if (tipo === "marcas") await api.salvarMarcaProduto(payload);
      if (tipo === "tipos") await api.salvarTipoProduto(payload);
      if (tipo === "subtipos") await api.salvarSubtipoProduto(payload);
      if (tipo === "colecoes") await api.salvarColecaoProduto(payload);
      if (tipo === "modelos") await api.salvarModeloProduto(payload);

      await queryClient.invalidateQueries({ queryKey: ["catalogo-produtos"] });
      toast.success("Cadastro salvo com sucesso.");
      router.push("/produtos");
    } catch {
      toast.error("Não foi possível salvar o cadastro.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        breadcrumb={["Produtos", config.breadcrumb, "Novo"]}
        title={config.title}
        status="Não salvo"
        actions={
          <FormHeaderActions
            cancelHref="/produtos"
            cancelLabel={`Cancelar${cancelShortcutLabel}`}
            onSave={handleSave}
            saving={saving}
            idleLabel={`Salvar cadastro${saveShortcutLabel}`}
          />
        }
      />

      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Dados do cadastro</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium">{config.nameLabel}</span>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder={config.nameLabel} />
            </label>

            {needsType && (
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Tipo vinculado</span>
                <AppSelect value={linkedType} onValueChange={setLinkedType} options={typeOptions} />
              </label>
            )}

            {needsPeriod && (
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Período</span>
                <Input value={period} onChange={(event) => setPeriod(event.target.value)} placeholder="Ex.: Contínua, Sazonal" />
              </label>
            )}

            {needsGrade && (
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-sm font-medium">Grade de tamanhos</span>
                <Input value={grade} onChange={(event) => setGrade(event.target.value)} placeholder="Ex.: P, M, G, GG" />
              </label>
            )}
          </div>
        </Card>

        <Card className="h-fit p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Ativo</h3>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium">Cadastro ativo</div>
              <p className="text-xs text-muted-foreground">Disponível no cadastro de produtos</p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
