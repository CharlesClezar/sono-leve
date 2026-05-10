import { useCallback, useEffect, useMemo, useRef, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { toast } from "sonner";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

function isVisible(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
}

function focusElement(element: HTMLElement) {
  element.scrollIntoView({ block: "center", behavior: "smooth" });
  window.setTimeout(() => element.focus(), 80);
}

function getShiftedTabIndex(event: KeyboardEvent) {
  const codeMatch = event.code.match(/^Digit([1-9])$/) ?? event.code.match(/^Numpad([1-9])$/);
  if (codeMatch) {
    return Number(codeMatch[1]);
  }

  if (/^[1-9]$/.test(event.key)) {
    return Number(event.key);
  }

  const shiftedSymbolMap: Record<string, number> = {
    "!": 1,
    "@": 2,
    "#": 3,
    "$": 4,
    "%": 5,
    "^": 6,
    "&": 7,
    "*": 8,
    "(": 9,
  };

  return shiftedSymbolMap[event.key] ?? null;
}

export function handleIndexedTabActionKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

  const actionGroup = event.currentTarget.getAttribute("data-tab-action");
  if (!actionGroup) return;

  event.preventDefault();
  const actions = Array.from(
    document.querySelectorAll<HTMLElement>(`[data-tab-action="${actionGroup}"]`)
  ).filter(isVisible);
  const currentIndex = actions.indexOf(event.currentTarget);
  if (currentIndex === -1) return;

  const direction = event.key === "ArrowDown" ? 1 : -1;
  const nextIndex = Math.min(actions.length - 1, Math.max(0, currentIndex + direction));
  actions[nextIndex]?.focus();
}

export function useIndexedTabs<T extends string>({
  tabs,
  onTabChange,
}: {
  tabs: readonly T[];
  onTabChange: (tab: T) => void;
}) {
  const tabRefs = useRef(new Map<T, HTMLButtonElement | null>());
  const tabIndexByValue = useMemo(
    () => new Map(tabs.map((tab, index) => [tab, index + 1] as const)),
    [tabs]
  );

  const focusFirstAction = useCallback((tab: T) => {
    const tabIndex = tabIndexByValue.get(tab);
    if (!tabIndex) return false;

    const actionTarget = Array.from(
      document.querySelectorAll<HTMLElement>(`[data-tab-action="${tabIndex}"]`)
    ).find(isVisible);

    if (actionTarget) {
      focusElement(actionTarget);
      return true;
    }

    const panel = document.querySelector<HTMLElement>(`[data-tab-panel="${tabIndex}"]`);
    if (!panel) return false;

    const fallbackTarget = Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector)).find(
      (element) => element !== tabRefs.current.get(tab) && isVisible(element)
    );

    if (!fallbackTarget) return false;
    focusElement(fallbackTarget);
    return true;
  }, [tabIndexByValue]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingField =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;

      if (isTypingField) return;
      if (!event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;

      const index = getShiftedTabIndex(event);
      if (!Number.isInteger(index) || index < 1 || index > tabs.length) return;

      const nextTab = tabs[index - 1];
      if (!nextTab) return;

      event.preventDefault();
      toast.dismiss();
      onTabChange(nextTab);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onTabChange, tabs]);

  const getTabButtonProps = useCallback((tab: T) => {
    const tabIndex = tabIndexByValue.get(tab) ?? 1;
    return {
      ref: (element: HTMLButtonElement | null) => {
        tabRefs.current.set(tab, element);
      },
      "data-tab-index": tabIndex,
      "aria-label": `${tab} (Shift+${tabIndex})`,
      onKeyDown: (event: ReactKeyboardEvent<HTMLButtonElement>) => {
        if (event.key !== "Tab" || event.shiftKey) return;
        if (focusFirstAction(tab)) {
          event.preventDefault();
        }
      },
    };
  }, [focusFirstAction, tabIndexByValue]);

  const getTabPanelProps = useCallback((tab: T) => {
    const tabIndex = tabIndexByValue.get(tab) ?? 1;
    return {
      "data-tab-panel": tabIndex,
    };
  }, [tabIndexByValue]);

  const getActionProps = useCallback((tab: T) => {
    const tabIndex = tabIndexByValue.get(tab) ?? 1;
    return {
      "data-tab-action": tabIndex,
      onKeyDown: handleIndexedTabActionKeyDown,
    };
  }, [tabIndexByValue]);

  const getShortcutLabel = useCallback((tab: T) => {
    const tabIndex = tabIndexByValue.get(tab) ?? 1;
    return `⇧${tabIndex}`;
  }, [tabIndexByValue]);

  return {
    focusFirstAction,
    getActionProps,
    getShortcutLabel,
    getTabButtonProps,
    getTabPanelProps,
  };
}
