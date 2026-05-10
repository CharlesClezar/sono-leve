import defaultShortcuts from "@/data/shortcuts.json";

export type ShortcutPlatform = "windows" | "mac";

export interface ShortcutDefinition {
  id: string;
  action: string;
  windows: string;
  mac: string;
  scope: string;
  active: boolean;
}

const STORAGE_KEY = "sono-leve.shortcuts.v1";
const SHORTCUTS_UPDATED_EVENT = "app:shortcuts-updated";

const shortcutDefaults = defaultShortcuts as ShortcutDefinition[];
const shortcutModifiers = ["ctrl", "meta", "alt", "shift"] as const;
const macModifierLabels: Record<(typeof shortcutModifiers)[number], string> = {
  ctrl: "⌃",
  meta: "⌘",
  alt: "⌥",
  shift: "⇧",
};

type ShortcutToken =
  | "ctrl"
  | "meta"
  | "alt"
  | "shift"
  | "escape"
  | "enter"
  | "space"
  | string;

export function getShortcutDefaults() {
  return shortcutDefaults.map((shortcut) => ({ ...shortcut }));
}

export function getShortcutPlatform(): ShortcutPlatform {
  if (typeof navigator === "undefined") return "windows";
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
    navigator.platform ??
    navigator.userAgent;
  return /mac|iphone|ipad|ipod/i.test(platform) ? "mac" : "windows";
}

export function getStoredShortcuts() {
  if (typeof window === "undefined") return getShortcutDefaults();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getShortcutDefaults();
    const parsed = JSON.parse(raw) as Partial<ShortcutDefinition>[];
    return mergeShortcutSettings(parsed);
  } catch {
    return getShortcutDefaults();
  }
}

export function saveShortcutSettings(shortcuts: ShortcutDefinition[]) {
  if (typeof window === "undefined") return;
  const normalized = mergeShortcutSettings(shortcuts);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(SHORTCUTS_UPDATED_EVENT));
}

export function subscribeToShortcutSettings(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(SHORTCUTS_UPDATED_EVENT, callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SHORTCUTS_UPDATED_EVENT, callback);
  };
}

export function mergeShortcutSettings(shortcuts: Partial<ShortcutDefinition>[]) {
  const overrides = new Map(shortcuts.map((shortcut) => [shortcut.id, shortcut]));

  return shortcutDefaults.map((shortcut) => ({
    id: shortcut.id,
    action: shortcut.action,
    scope: shortcut.scope,
    windows: String(overrides.get(shortcut.id)?.windows ?? shortcut.windows).trim() || shortcut.windows,
    mac: String(overrides.get(shortcut.id)?.mac ?? shortcut.mac).trim() || shortcut.mac,
    active: overrides.get(shortcut.id)?.active ?? shortcut.active,
  }));
}

export function getShortcutById(shortcuts: ShortcutDefinition[], id: string) {
  return shortcuts.find((shortcut) => shortcut.id === id);
}

export function matchesShortcut(event: KeyboardEvent, shortcut: ShortcutDefinition | undefined, platform: ShortcutPlatform) {
  if (!shortcut || !shortcut.active) return false;

  const binding = platform === "mac" ? shortcut.mac : shortcut.windows;
  if (!binding) return false;

  const tokens = parseShortcut(binding);
  const modifiers = new Set(tokens.filter(isShortcutModifier));
  const key = tokens.find((token) => !isShortcutModifier(token));
  if (!key) return false;

  return (
    event.ctrlKey === modifiers.has("ctrl") &&
    event.metaKey === modifiers.has("meta") &&
    event.altKey === modifiers.has("alt") &&
    event.shiftKey === modifiers.has("shift") &&
    normalizeKey(event.key) === key
  );
}

export function formatShortcutBinding(parts: string[]) {
  return parts.filter(Boolean).join(" + ");
}

export function getShortcutDisplayValue(shortcut: ShortcutDefinition, platform: ShortcutPlatform) {
  return formatShortcutDisplayValue(platform === "mac" ? shortcut.mac : shortcut.windows, platform);
}

export function formatShortcutDisplayValue(binding: string, platform: ShortcutPlatform) {
  const parts = binding.split(/\s*\+\s*/).filter(Boolean);

  if (platform !== "mac") {
    return parts.join(" + ");
  }

  return parts
    .map((part) => formatMacShortcutPart(normalizeKey(part)))
    .join("");
}

export function isModifierOnlyKey(key: string) {
  return isShortcutModifier(normalizeKey(key));
}

export function normalizeShortcutKey(key: string) {
  return normalizeKey(key);
}

function parseShortcut(binding: string) {
  return binding
    .split("+")
    .map((token) => normalizeKey(token))
    .filter(Boolean);
}

function isShortcutModifier(token: ShortcutToken): token is (typeof shortcutModifiers)[number] {
  return shortcutModifiers.includes(token as (typeof shortcutModifiers)[number]);
}

function formatMacShortcutPart(normalized: ShortcutToken) {
  if (isShortcutModifier(normalized)) return macModifierLabels[normalized];
  if (normalized === "escape") return "Esc";
  if (normalized === "enter") return "↩";
  if (normalized.length === 1) return normalized.toUpperCase();
  return normalized.startsWith("f") ? normalized.toUpperCase() : normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function normalizeKey(token: string): ShortcutToken {
  const value = token.trim().toLowerCase();
  if (value === "cmd" || value === "command" || value === "meta") return "meta";
  if (value === "ctrl" || value === "control") return "ctrl";
  if (value === "option") return "alt";
  if (value === "esc") return "escape";
  if (value === "return") return "enter";
  if (value === " ") return "space";
  return value;
}
