import type { ReactNode } from "react";

export function IndexedTabsNav<T extends string>({
  tabs,
  activeTab,
  onSelect,
  getTabButtonProps,
  getShortcutLabel,
  renderAccessory,
  className = "overflow-x-auto border-b",
  listClassName = "inline-flex min-w-max gap-1",
  buttonClassName = "relative flex shrink-0 items-center gap-1 rounded-full px-4 py-2 text-sm font-medium leading-tight transition touch-manipulation",
  activeClassName = "bg-primary/10 text-primary",
  inactiveClassName = "text-muted-foreground hover:bg-muted hover:text-foreground",
}: {
  tabs: readonly T[];
  activeTab: T;
  onSelect: (tab: T) => void;
  getTabButtonProps: (tab: T) => Record<string, unknown>;
  getShortcutLabel: (tab: T) => string;
  renderAccessory?: (tab: T) => ReactNode;
  className?: string;
  listClassName?: string;
  buttonClassName?: string;
  activeClassName?: string;
  inactiveClassName?: string;
}) {
  return (
    <div className={`no-scrollbar ${className}`}>
      <div className={listClassName}>
        {tabs.map((tab) => (
          <div
            key={tab}
            className={`${buttonClassName} ${activeTab === tab ? activeClassName : inactiveClassName}`}
          >
            <button
              {...getTabButtonProps(tab)}
              type="button"
              onClick={() => onSelect(tab)}
              onTouchEnd={(event) => {
                event.preventDefault();
                onSelect(tab);
              }}
              className="flex touch-manipulation items-center gap-1 leading-tight"
            >
              <span className="whitespace-nowrap">{tab}</span>
              <span className="text-[9px] font-medium leading-none text-current/65">
                {getShortcutLabel(tab)}
              </span>
            </button>
            {renderAccessory?.(tab)}
            {activeTab === tab && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />}
          </div>
        ))}
      </div>
    </div>
  );
}
