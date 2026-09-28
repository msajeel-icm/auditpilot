import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-[hsl(var(--border))]">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] text-[hsl(var(--muted-foreground))]">
          © 2026 AuditPilot · Medicaid IDD/LTC audit prep
        </p>
        <Link
          href="/dashboard"
          className="text-[12px] font-medium text-[hsl(var(--muted-foreground))] outline-none transition-colors hover:text-[hsl(var(--accent))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
        >
          Open app
        </Link>
      </div>
    </footer>
  );
}
