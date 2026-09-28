import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-6 pb-20 pt-24 sm:pt-28">
      <p className="mb-4 text-[12px] font-medium uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))]">
        Medicaid IDD / LTC audit prep
      </p>
      <h1 className="max-w-2xl text-[40px] font-semibold leading-[1.12] tracking-tight text-[hsl(var(--foreground))] sm:text-[48px]">
        Compliance docs in. Audit-ready narrative out.
      </h1>
      <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-[hsl(var(--muted-foreground))]">
        AuditPilot turns Medicaid IDD and LTC case files into a multi-agent
        review—then a remediation narrative your team can export before the
        surveyor arrives.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-[hsl(var(--accent))] px-4 text-[14px] font-medium text-[hsl(var(--accent-foreground))] outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2"
        >
          Open app
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <a
          href="#how-it-works"
          className="inline-flex h-10 items-center rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 text-[14px] font-medium text-[hsl(var(--foreground))] outline-none transition-colors hover:bg-[hsl(var(--muted))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2"
        >
          How it works
        </a>
      </div>
    </section>
  );
}
