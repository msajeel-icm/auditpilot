"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import "../../styles/tokens.css";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

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

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title={title} />
        <motion.main
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="min-h-0 flex-1 overflow-auto p-4"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
