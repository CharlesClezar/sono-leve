import { useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useShortcutSettings } from "@/hooks/useShortcutSettings";
import { getShortcutById, getShortcutPlatform, matchesShortcut } from "@/lib/shortcuts";

type ClearFiltersShortcutDialogProps = {
  onConfirm: () => void;
};

export function ClearFiltersShortcutDialog({ onConfirm }: ClearFiltersShortcutDialogProps) {
  const [open, setOpen] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const shortcuts = useShortcutSettings();
  const platform = getShortcutPlatform();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (open) {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        setOpen(false);
        return;
      }

      const clearFiltersShortcut = getShortcutById(shortcuts, "clear_filters");
      if (!matchesShortcut(event, clearFiltersShortcut, platform)) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      setOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [open, platform, shortcuts]);

  const confirm = () => {
    onConfirm();
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          confirmRef.current?.focus();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Limpar filtros?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação remove os filtros da tela, incluindo filtros aplicados nas colunas da grid.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction ref={confirmRef} onClick={confirm}>
            Limpar filtros
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
