"use client";

import { useEffect, useState } from "react";
import { getStoredShortcuts, subscribeToShortcutSettings, type ShortcutDefinition } from "@/lib/shortcuts";

export function useShortcutSettings() {
  const [shortcuts, setShortcuts] = useState<ShortcutDefinition[]>(() => getStoredShortcuts());

  useEffect(() => {
    setShortcuts(getStoredShortcuts());
    return subscribeToShortcutSettings(() => setShortcuts(getStoredShortcuts()));
  }, []);

  return shortcuts;
}
