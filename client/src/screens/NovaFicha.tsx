import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { AppSelect } from "@/components/AppSelect";
import { FormHeaderActions } from "@/components/FormHeaderActions";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, useDadosOperacionais } from "@/lib/api";
import { useShortcutLabel } from "@/hooks/useShortcutLabel";
import { toast } from "sonner";

export default function NovaFicha() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { customers, products, fichas } = useDadosOperacionais();
  const cancelShortcutLabel = useShortcutLabel("cancel");
  const saveShortcutLabel = useShortcutLabel("save");
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const ficha = fichas.find((item) => item.id === params.id);
  const isEditing = Boolean(ficha);
  const cameFromDashboard = searchParams.get("from") === "dashboard";
  const breadcrumb = cameFromDashboard
    ? ["Dashboard", "Ficha", isEditing ? "Editar ficha" : "Nova ficha"]
    : ["Fichas", isEditing ? "Editar" : "Nova"];
  const cancelHref = cameFromDashboard ? "/" : "/fichas";
  const [saving, setSaving] = useState(false);
  const [reseller, setReseller] = useState(ficha?.reseller ?? "");
  const [productName, setProductName] = useState(products[0]?.name ?? "");
  const [quantity, setQuantity] = useState(ficha?.sent ?? 1);

  useEffect(() => {
    if (ficha) {
      setReseller(ficha.reseller);
      setQuantity(ficha.sent);
      return;
    }

    const firstReseller = customers.find((customer) => customer.type === "atacado");
    if (!reseller && firstReseller) setReseller(firstReseller.name);
  }, [customers, ficha, reseller]);

  useEffect(() => {
    if (!productName && products[0]) setProductName(products[0].name);
  }, [productName, products]);

  const handleSave = async () => {
    if (!reseller) return toast.error("Selecione uma revendedora.");

    setSaving(true);
    try {
      const payload = {
        id: ficha?.id,
        reseller,
        openedAt: ficha?.openedAt,
        sent: quantity,
        returned: ficha?.returned ?? 0,
        sold: ficha?.sold ?? 0,
        totalSold: ficha?.totalSold ?? 0,
        status: ficha?.status ?? "Aberta" as const,
      };
      if (isEditing) await api.atualizarFicha({ ...payload, id: ficha!.id });
      else await api.salvarFicha(payload);
      await queryClient.invalidateQueries({ queryKey: ["fichas"] });
      toast.success(isEditing ? "Ficha atualizada com sucesso!" : "Ficha aberta com sucesso!");
      router.push("/fichas");
    } catch {
      toast.error("Não foi possível salvar a ficha.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        breadcrumb={breadcrumb}
        title={isEditing ? "Editar ficha" : "Nova ficha"}
        status={isEditing ? ficha?.status : "Não salvo"}
        actions={
          <FormHeaderActions
            cancelHref={cancelHref}
            cancelLabel={`Cancelar${cancelShortcutLabel}`}
            onSave={handleSave}
            saving={saving}
            idleLabel={`${isEditing ? "Salvar alterações" : "Abrir ficha"}${saveShortcutLabel}`}
          />
        }
      />

      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Revendedora</h3>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Cliente</span>
              <AppSelect
                value={reseller}
                onValueChange={setReseller}
                options={customers
                  .filter((customer) => customer.type === "atacado")
                  .map((customer) => ({ value: customer.name, label: customer.name }))}
              />
            </label>
          </Card>

          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Produtos enviados</h3>
            <div className="grid gap-4 md:grid-cols-[1fr_120px_120px]">
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Produto</span>
                <AppSelect
                  value={productName}
                  onValueChange={setProductName}
                  options={products.map((product) => ({
                    value: product.name,
                    label: `${product.name} (${product.ref})`,
                  }))}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Tamanho</span>
                <AppSelect
                  defaultValue="P"
                  options={["P", "M", "G", "GG"].map((size) => ({ value: size, label: size }))}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Quantidade</span>
                <Input type="number" min={1} value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value || 1)))} />
              </label>
            </div>
          </Card>
        </div>

        <Card className="h-fit p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Observações</h3>
          <Textarea placeholder="Condições combinadas com a revendedora" />
          <p className="mt-3 text-xs text-muted-foreground">A ficha inicia aberta para registrar devoluções, vendas e acertos.</p>
        </Card>
      </div>
    </AppShell>
  );
}
