"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import "../../styles/tokens.css";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { CommandPalette } from "@/components/command/CommandPalette";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/cases": "Cases",
  "/documents": "Documents",
  "/agents": "Agents",
};

function titleFor(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  const match = Object.keys(TITLES).find(
    (key) => pathname === key || pathname.startsWith(`${key}/`),
  );
  return match ? TITLES[match] : "AuditPilot";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = titleFor(pathname);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const onOpenChange = useCallback((open: boolean) => setPaletteOpen(open), []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title={title} onOpenPalette={openPalette} />
        <motion.main
          key={pathname}
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="min-h-0 flex-1 overflow-auto p-4"
        >
          {children}
        </motion.main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={onOpenChange} />
    </div>
  );
}
