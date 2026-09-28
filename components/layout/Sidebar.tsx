"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Bot,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cases", label: "Cases", icon: FolderKanban },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/agents", label: "Agents", icon: Bot },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex h-full w-[220px] shrink-0 flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--sidebar))]"
      aria-label="Primary"
    >
      <div className="flex h-11 items-center border-b border-[hsl(var(--border))] px-3">
        <Link
          href="/dashboard"
          className="rounded-sm text-[13px] font-semibold tracking-tight text-[hsl(var(--sidebar-foreground))] outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-1 focus-visible:ring-offset-[hsl(var(--sidebar))]"
        >
          AuditPilot
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="Main">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-8 items-center gap-2 rounded-md px-2 text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-1 focus-visible:ring-offset-[hsl(var(--sidebar))]",
                active
                  ? "bg-[hsl(var(--accent)/0.14)] text-[hsl(var(--accent))]"
                  : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--sidebar-foreground))]",
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
