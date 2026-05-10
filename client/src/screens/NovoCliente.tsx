import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { AppSelect } from "@/components/AppSelect";
import { FormHeaderActions } from "@/components/FormHeaderActions";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { api, useClientes } from "@/lib/api";
import type { Customer } from "@/lib/types";
import { useShortcutLabel } from "@/hooks/useShortcutLabel";
import { toast } from "sonner";

export default function NovoCliente() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const cancelShortcutLabel = useShortcutLabel("cancel");
  const saveShortcutLabel = useShortcutLabel("save");
  const [saving, setSaving] = useState(false);
  const params = useParams<{ id?: string }>();
  const { data: customers } = useClientes();
  const customer = customers.find((item) => item.id === params.id);
  const isEditing = Boolean(customer);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    cpf: "",
    type: "varejo" as Customer["type"],
    credit: "",
  });
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!customer) return;
    setForm({
      name: customer.name,
      phone: customer.phone,
      cpf: customer.cpf,
      type: customer.type,
      credit: String(customer.credit),
    });
    setActive(customer.status !== "Inativo");
  }, [customer]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Preencha o nome do cliente.");
      return;
    }

    setSaving(true);
    try {
      const cliente: Customer = {
        id: customer?.id ?? "",
        name: form.name.trim(),
        phone: form.phone.trim(),
        cpf: form.cpf.trim(),
        type: form.type,
        status: active ? "Ativo" : "Inativo",
        credit: Number(form.credit || 0),
      };
      if (isEditing) await api.atualizarCliente(cliente);
      else await api.salvarCliente(cliente);
      await queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success(isEditing ? "Cliente atualizado com sucesso!" : "Cliente cadastrado com sucesso!");
      router.push("/clientes");
    } catch {
      toast.error("Não foi possível salvar o cliente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        breadcrumb={["Clientes", isEditing ? "Editar" : "Novo"]}
        title={isEditing ? "Editar cliente" : "Novo cliente"}
        status={isEditing ? undefined : "Não salvo"}
        actions={
          <FormHeaderActions
            cancelHref="/clientes"
            cancelLabel={`Cancelar${cancelShortcutLabel}`}
            onSave={handleSave}
            saving={saving}
            idleLabel={`${isEditing ? "Salvar alterações" : "Cadastrar cliente"}${saveShortcutLabel}`}
          />
        }
      />

      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Dados do cliente</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium">Nome</span>
              <Input value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Nome completo ou razão social" />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Telefone</span>
              <Input value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="(00) 00000-0000" />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">CPF/CNPJ</span>
              <Input value={form.cpf} onChange={(event) => updateField("cpf", event.target.value)} placeholder="000.000.000-00" />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Tipo</span>
              <AppSelect
                value={form.type}
                onValueChange={(value) => updateField("type", value as Customer["type"])}
                options={[
                  { value: "varejo", label: "Varejo" },
                  { value: "atacado", label: "Atacado" },
                ]}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Limite de crédito</span>
              <Input type="number" min={0} step="0.01" value={form.credit} onChange={(event) => updateField("credit", event.target.value)} placeholder="0,00" />
            </label>
          </div>
        </Card>

        <Card className="h-fit p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Ativo</h3>
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium">Cliente ativo</div>
              <p className="text-xs text-muted-foreground">Disponível para vendas, fichas e encomendas</p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Endereço</h3>
          <div className="space-y-4">
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Cidade</span>
              <Input placeholder="Cidade" />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Observações</span>
              <Input placeholder="Preferências, horários, referências" />
            </label>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
