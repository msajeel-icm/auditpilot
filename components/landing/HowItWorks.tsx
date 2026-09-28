import { FileUp, Bot, FileCheck } from "lucide-react";

const steps = [
  {
    icon: FileUp,
    title: "Upload or select case docs",
    body: "Pull Medicaid IDD/LTC files into a case—plans of care, progress notes, assessments, and supporting evidence.",
  },
  {
    icon: Bot,
    title: "Agents run Reader → Narrator",
    body: "A focused agent chain reads the packet, flags compliance gaps, and drafts a remediation narrative.",
  },
  {
    icon: FileCheck,
    title: "Export-ready findings",
    body: "Review structured findings and export an audit-prep narrative your compliance team can act on.",
  },
] as const;

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-16 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]"
    >
      <div className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))]">
          How it works
        </h2>
        <p className="mt-2 max-w-lg text-[22px] font-semibold tracking-tight text-[hsl(var(--foreground))]">
          Three steps from packet to narrative.
        </p>
        <ol className="mt-12 grid gap-px overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--border))] sm:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="flex flex-col gap-3 bg-[hsl(var(--card))] p-6"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--accent))]">
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span className="font-[family-name:var(--font-mono)] text-[11px] tabular-nums text-[hsl(var(--muted-foreground))]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="text-[15px] font-semibold tracking-tight text-[hsl(var(--foreground))]">
                  {step.title}
                </h3>
                <p className="text-[13px] leading-relaxed text-[hsl(var(--muted-foreground))]">
                  {step.body}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
