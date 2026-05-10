import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FormHeaderActions({
  cancelHref,
  cancelLabel,
  onSave,
  saving,
  idleLabel,
  savingLabel = "Salvando...",
}: {
  cancelHref: string;
  cancelLabel: string;
  onSave: () => void;
  saving: boolean;
  idleLabel: string;
  savingLabel?: string;
}) {
  return (
    <>
      <Button variant="outline" asChild>
        <Link href={cancelHref}>{cancelLabel}</Link>
      </Button>
      <Button onClick={onSave} disabled={saving}>
        {saving ? savingLabel : idleLabel}
      </Button>
    </>
  );
}
