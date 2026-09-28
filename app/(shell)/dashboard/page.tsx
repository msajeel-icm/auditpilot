const METRICS = [
  { label: "Open cases", value: "24" },
  { label: "Docs queued", value: "182" },
  { label: "Findings", value: "7" },
  { label: "Pass rate", value: "91.4%" },
] as const;

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-[13px] font-medium tracking-tight text-[hsl(var(--foreground))]">
          Overview
        </h2>
        <p className="text-[12px] text-[hsl(var(--muted-foreground))]">
          Audit prep — mock metrics for the current workspace
        </p>
      </div>
      <div
        className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--border))] sm:grid-cols-4"
        role="list"
        aria-label="Key metrics"
      >
        {METRICS.map((m) => (
          <div
            key={m.label}
            role="listitem"
            className="bg-[hsl(var(--card))] px-3 py-3"
          >
            <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-[hsl(var(--muted-foreground))]">
              {m.label}
            </div>
            <div className="mt-1.5 font-[family-name:var(--font-mono)] text-[20px] tabular-nums leading-none tracking-tight text-[hsl(var(--foreground))]">
              {m.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
