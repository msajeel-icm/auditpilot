"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Command = {
  id: string;
  title: string;
  href: string;
  keywords?: string[];
};

const COMMANDS: Command[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    href: "/dashboard",
    keywords: ["home", "overview", "metrics"],
  },
  {
    id: "cases",
    title: "Cases",
    href: "/cases",
    keywords: ["audit", "case"],
  },
  {
    id: "documents",
    title: "Documents",
    href: "/documents",
    keywords: ["docs", "files"],
  },
  {
    id: "agents",
    title: "Agents",
    href: "/agents",
    keywords: ["pipeline", "run", "audit"],
  },
];

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter((cmd) => {
      if (cmd.title.toLowerCase().includes(q)) return true;
      return (cmd.keywords ?? []).some((k) => k.toLowerCase().includes(q));
    });
  }, [query]);

  const close = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const runCommand = useCallback(
    (cmd: Command) => {
      router.push(cmd.href);
      onOpenChange(false);
    },
    [router, onOpenChange],
  );

  // Reset query / active index when opened
  useEffect(() => {
    if (open) {
      previouslyFocused.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      setQuery("");
      setActiveIndex(0);
      const t = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(t);
    }
    previouslyFocused.current?.focus?.();
    previouslyFocused.current = null;
  }, [open]);

  // Keep activeIndex in range when filter changes
  useEffect(() => {
    setActiveIndex((i) =>
      filtered.length === 0 ? 0 : Math.min(i, filtered.length - 1),
    );
  }, [filtered.length]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Focus trap
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        close();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) =>
          filtered.length === 0 ? 0 : (i + 1) % filtered.length,
        );
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) =>
          filtered.length === 0
            ? 0
            : (i - 1 + filtered.length) % filtered.length,
        );
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filtered[activeIndex];
        if (cmd) runCommand(cmd);
        return;
      }

      if (e.key === "Tab") {
        // Keep focus inside dialog (input + list items)
        const root = document.getElementById("command-palette-dialog");
        if (!root) return;
        const focusables = root.querySelectorAll<HTMLElement>(
          'input, button[role="option"]',
        );
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey) {
          if (active === first || !root.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else if (active === last || !root.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open, close, filtered, activeIndex, runCommand]);

  // Scroll active option into view
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[15vh]"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-[hsl(220_20%_10%/0.35)] backdrop-blur-[2px]"
        aria-hidden
        onClick={close}
      />
      <div
        id="command-palette-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-lg"
      >
        <h2 id={titleId} className="sr-only">
          Command palette
        </h2>
        <div className="flex items-center gap-2 border-b border-[hsl(var(--border))] px-3">
          <Search
            className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--muted-foreground))]"
            aria-hidden
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Jump to…"
            aria-label="Filter commands"
            aria-controls="command-palette-list"
            aria-autocomplete="list"
            aria-activedescendant={
              filtered[activeIndex]
                ? `command-option-${filtered[activeIndex].id}`
                : undefined
            }
            className="h-10 w-full bg-transparent text-[13px] text-[hsl(var(--foreground))] outline-none placeholder:text-[hsl(var(--muted-foreground))]"
          />
          <kbd className="hidden shrink-0 rounded border border-[hsl(var(--border))] px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[hsl(var(--muted-foreground))] sm:inline">
            esc
          </kbd>
        </div>
        <ul
          id="command-palette-list"
          ref={listRef}
          role="listbox"
          aria-label="Commands"
          className="max-h-[280px] overflow-auto p-1"
        >
          {filtered.length === 0 ? (
            <li className="px-2 py-3 text-[12px] text-[hsl(var(--muted-foreground))]">
              No matching commands
            </li>
          ) : (
            filtered.map((cmd, index) => {
              const active = index === activeIndex;
              return (
                <li key={cmd.id} role="presentation">
                  <button
                    type="button"
                    id={`command-option-${cmd.id}`}
                    role="option"
                    aria-selected={active}
                    data-index={index}
                    onClick={() => runCommand(cmd)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[hsl(var(--ring))]",
                      active
                        ? "bg-[hsl(var(--accent)/0.14)] text-[hsl(var(--accent))]"
                        : "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]",
                    )}
                  >
                    <span>{cmd.title}</span>
                    <span className="font-[family-name:var(--font-mono)] text-[10px] text-[hsl(var(--muted-foreground))]">
                      {cmd.href}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
