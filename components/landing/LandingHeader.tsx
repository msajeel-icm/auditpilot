import Link from "next/link";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.92)] backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-[15px] font-semibold tracking-tight text-[hsl(var(--foreground))] outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
        >
          AuditPilot
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex h-8 items-center rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 text-[13px] font-medium text-[hsl(var(--foreground))] outline-none transition-colors hover:border-[hsl(var(--accent)/0.45)] hover:text-[hsl(var(--accent))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
        >
          Open app
        </Link>
      </div>
    </header>
  );
}
