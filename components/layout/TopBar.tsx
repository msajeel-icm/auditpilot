"use client";

import { useEffect, useState } from "react";

type TopBarProps = {
  title: string;
  onOpenPalette?: () => void;
};

export function TopBar({ title, onOpenPalette }: TopBarProps) {
  const [modKey, setModKey] = useState("⌘");

  useEffect(() => {
    const isMac =
      typeof navigator !== "undefined" &&
      /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
    setModKey(isMac ? "⌘" : "Ctrl");
  }, []);

  return (
    <header className="flex h-11 shrink-0 items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4">
      <h1 className="text-[13px] font-medium tracking-tight text-[hsl(var(--foreground))]">
        {title}
      </h1>
      {onOpenPalette ? (
        <button
          type="button"
          onClick={onOpenPalette}
          aria-label="Open command palette"
          className="inline-flex h-7 items-center gap-1.5 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2 text-[11px] text-[hsl(var(--muted-foreground))] outline-none transition-colors hover:border-[hsl(var(--accent)/0.4)] hover:text-[hsl(var(--foreground))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
        >
          <span className="hidden sm:inline">Search</span>
          <kbd className="font-[family-name:var(--font-mono)] text-[10px] tracking-tight">
            {modKey === "⌘" ? "⌘K" : "Ctrl K"}
          </kbd>
        </button>
      ) : null}
    </header>
  );
}
