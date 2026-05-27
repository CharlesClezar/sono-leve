import { gerarUUID } from "@/lib/uuid";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { FormHeaderActions } from "@/components/FormHeaderActions";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { api, useItemCatalogoProduto, type CatalogSlug } from "@/lib/api";
import { useShortcutLabel } from "@/hooks/useShortcutLabel";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

const catalogConfig: Record<CatalogSlug, { title: string; editTitle: string; breadcrumb: string; nameLabel: string }> = {
  categorias: { title: "Nova categoria",  editTitle: "Editar categoria",  breadcrumb: "Categorias", nameLabel: "Categoria" },
  marcas:     { title: "Nova marca",      editTitle: "Editar marca",      breadcrumb: "Marcas",     nameLabel: "Marca" },
  tipos:      { title: "Novo tipo",       editTitle: "Editar tipo",       breadcrumb: "Tipos",      nameLabel: "Tipo" },
  subtipos:   { title: "Novo subtipo",    editTitle: "Editar subtipo",    breadcrumb: "Subtipos",   nameLabel: "Subtipo" },
  colecoes:   { title: "Nova coleção",    editTitle: "Editar coleção",    breadcrumb: "Coleções",   nameLabel: "Nome da coleção" },
};

export default function NovoCatalogoProduto() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const tabOrigem = searchParams.get("tab") ?? "";
  const params = useParams<{ tipo?: string; id?: string }>();
  const tipo = (params.tipo ?? "categorias") as CatalogSlug;
  const idEditar = params.id;
  const editando = Boolean(idEditar);
  const config = catalogConfig[tipo] ?? catalogConfig.categorias;
  const { data: itemExistente } = useItemCatalogoProduto(tipo, idEditar ?? "");
  const cancelShortcutLabel = useShortcutLabel("cancel");
  const saveShortcutLabel = useShortcutLabel("save");
  const idempotencyKey = useRef(gerarUUID());
  const preenchido = useRef(false);
  const [salvando, setSalvando] = useState(false);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<string[]>([]);
  const [gradeInput, setGradeInput] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!editando || preenchido.current || !itemExistente) return;
    preenchido.current = true;
    setName(itemExistente.name);
    setActive(itemExistente.active);
    if (itemExistente.grade) setGrade(itemExistente.grade);
    if (itemExistente.dataInicio) setDataInicio(itemExistente.dataInicio);
    if (itemExistente.dataFim) setDataFim(itemExistente.dataFim);
  }, [editando, itemExistente]);

  const needsGrade = tipo === "categorias";
  const needsDates = tipo === "colecoes";

  const handleSalvar = async () => {
    if (!name.trim()) {
      toast.error("Preencha o nome.");
      return;
    }

    setSalvando(true);
    try {
      const payload = {
        name: name.trim(),
        active,
        grade: needsGrade ? grade : undefined,
        dataInicio: needsDates && dataInicio ? dataInicio : undefined,
        dataFim: needsDates && dataFim ? dataFim : undefined,
      };

      if (editando && idEditar) {
        await api.atualizarCatalogoProduto(tipo, idEditar, payload);
      } else {
        const key = idempotencyKey.current;
        if (tipo === "categorias") await api.salvarCategoriaProduto(payload, key);
        else if (tipo === "marcas") await api.salvarMarcaProduto(payload, key);
        else if (tipo === "tipos") await api.salvarTipoProduto(payload, key);
        else if (tipo === "subtipos") await api.salvarSubtipoProduto(payload, key);
        else if (tipo === "colecoes") await api.salvarColecaoProduto(payload, key);
      }

      await queryClient.invalidateQueries({ queryKey: ["catalogo-produtos"] });
      toast.success(editando ? "Cadastro atualizado com sucesso." : "Cadastro salvo com sucesso.");
      router.push(tabOrigem ? `/produtos?tab=${tabOrigem}` : "/produtos");
    } catch {
      toast.error("Não foi possível salvar o cadastro.");
    } finally {
      setSalvando(false);
    }
  };

  const destino = tabOrigem ? `/produtos?tab=${tabOrigem}` : "/produtos";

  return (
    <AppShell>
      <PageHeader
        breadcrumb={["Produtos", config.breadcrumb, editando ? "Editar" : "Novo"]}
        title={editando ? config.editTitle : config.title}
        status={editando ? undefined : "Não salvo"}
        actions={
          <FormHeaderActions
            cancelHref={destino}
            cancelLabel={`Cancelar${cancelShortcutLabel}`}
            onSave={handleSalvar}
            saving={salvando}
            idleLabel={`${editando ? "Salvar alterações" : "Salvar cadastro"}${saveShortcutLabel}`}
          />
        }
      />

      <div className="flex-1 overflow-y-auto">
      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Dados do cadastro</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium">{config.nameLabel}</span>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder={config.nameLabel} />
            </label>

            {needsDates && (
              <>
                <label className="space-y-1.5">
                  <span className="text-sm font-medium">Data de início</span>
                  <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-medium">Data de fim</span>
                  <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
                </label>
              </>
            )}

            {needsGrade && (
              <div className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium">Grade de tamanhos</span>
                <div className="flex gap-2">
                  <Input
                    value={gradeInput}
                    onChange={(e) => setGradeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === ",") && gradeInput.trim()) {
                        e.preventDefault();
                        const val = gradeInput.trim().replace(/,$/, "");
                        if (val && !grade.includes(val)) setGrade((prev) => [...prev, val]);
                        setGradeInput("");
                      }
                    }}
                    placeholder="Ex.: P, M, G, GG — Enter para adicionar"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const val = gradeInput.trim();
                      if (val && !grade.includes(val)) setGrade((prev) => [...prev, val]);
                      setGradeInput("");
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {grade.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {grade.map((tamanho) => (
                      <span key={tamanho} className="flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-sm">
                        {tamanho}
                        <button
                          type="button"
                          onClick={() => setGrade((prev) => prev.filter((t) => t !== tamanho))}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={`Remover ${tamanho}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
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
      </div>
    </AppShell>
  );
}
