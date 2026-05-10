import { cn } from "@/lib/utils";

type Tone = "success" | "danger" | "warning" | "info" | "partial" | "neutral";

const map: Record<string, Tone> = {
  Gerada: "success",
  Pago: "success",
  Ativo: "success",
  Entregue: "success",
  Finalizada: "success",
  Pronta: "info",
  "Em produção": "warning",
  "Fabricado parcialmente": "partial",
  Aberta: "warning",
  Aberto: "warning",
  Parcial: "warning",
  Atrasado: "danger",
  Cancelada: "danger",
  Cancelado: "danger",
  Inativo: "neutral",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = map[status] ?? "neutral";
  return (
    <span className={cn("status-badge", `status-${tone}`)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
