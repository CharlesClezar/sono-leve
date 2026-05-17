import { useEffect, useRef, useState } from "react";
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
  const idempotencyKey = useRef(crypto.randomUUID());
  const [salvando, setSalvando] = useState(false);
  const params = useParams<{ id?: string }>();
  const { data: clientes = [] } = useClientes();
  const cliente = clientes.find((item) => item.id === params.id);
  const editando = Boolean(cliente);
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    cpf: "",
    tipo: "varejo" as Customer["tipo"],
    credito: "",
  });
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    if (!cliente) return;
    setForm({
      nome: cliente.nome,
      telefone: cliente.telefone,
      cpf: cliente.cpf,
      tipo: cliente.tipo,
      credito: String(cliente.credito),
    });
    setAtivo(cliente.status !== "Inativo");
  }, [cliente]);

  const atualizarCampo = (campo: keyof typeof form, valor: string) => {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  };

  const handleSalvar = async () => {
    if (!form.nome.trim()) {
      toast.error("Preencha o nome do cliente.");
      return;
    }

    setSalvando(true);
    try {
      const dadosCliente: Customer = {
        id: cliente?.id ?? "",
        nome: form.nome.trim(),
        telefone: form.telefone.trim(),
        cpf: form.cpf.trim(),
        tipo: form.tipo,
        status: ativo ? "Ativo" : "Inativo",
        credito: Number(form.credito || 0),
      };
      if (editando) await api.atualizarCliente(dadosCliente);
      else await api.salvarCliente(dadosCliente, idempotencyKey.current);
      await queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success(editando ? "Cliente atualizado com sucesso!" : "Cliente cadastrado com sucesso!");
      router.push("/clientes");
    } catch {
      toast.error("Não foi possível salvar o cliente.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        breadcrumb={["Clientes", editando ? "Editar" : "Novo"]}
        title={editando ? "Editar cliente" : "Novo cliente"}
        status={editando ? undefined : "Não salvo"}
        actions={
          <FormHeaderActions
            cancelHref="/clientes"
            cancelLabel={`Cancelar${cancelShortcutLabel}`}
            onSave={handleSalvar}
            saving={salvando}
            idleLabel={`${editando ? "Salvar alterações" : "Cadastrar cliente"}${saveShortcutLabel}`}
          />
        }
      />

      <div className="flex-1 overflow-y-auto">
      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Dados do cliente</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium">Nome</span>
              <Input value={form.nome} onChange={(event) => atualizarCampo("nome", event.target.value)} placeholder="Nome completo ou razão social" />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Telefone</span>
              <Input value={form.telefone} onChange={(event) => atualizarCampo("telefone", event.target.value)} placeholder="(00) 00000-0000" />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">CPF/CNPJ</span>
              <Input value={form.cpf} onChange={(event) => atualizarCampo("cpf", event.target.value)} placeholder="000.000.000-00" />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Tipo</span>
              <AppSelect
                value={form.tipo}
                onValueChange={(value) => atualizarCampo("tipo", value as Customer["tipo"])}
                options={[
                  { value: "varejo", label: "Varejo" },
                  { value: "atacado", label: "Atacado" },
                ]}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Limite de crédito</span>
              <Input type="number" min={0} step="0.01" value={form.credito} onChange={(event) => atualizarCampo("credito", event.target.value)} placeholder="0,00" />
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
            <Switch checked={ativo} onCheckedChange={setAtivo} />
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
      </div>
    </AppShell>
  );
}
