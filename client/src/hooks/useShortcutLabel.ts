"use client";

import { useMemo } from "react";
import { useShortcutSettings } from "@/hooks/useShortcutSettings";
import { getShortcutById, getShortcutDisplayValue, getShortcutPlatform } from "@/lib/shortcuts";

export function useShortcutLabel(shortcutId: string) {
  const shortcuts = useShortcutSettings();
  const platform = getShortcutPlatform();

  return useMemo(() => {
    const shortcut = getShortcutById(shortcuts, shortcutId);
    if (!shortcut || !shortcut.active) return "";
    return ` (${getShortcutDisplayValue(shortcut, platform)})`;
  }, [platform, shortcutId, shortcuts]);
}

