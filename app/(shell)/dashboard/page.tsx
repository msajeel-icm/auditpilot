const METRICS = [
  { label: "Open cases", value: "24" },
  { label: "Docs queued", value: "182" },
  { label: "Findings", value: "7" },
  { label: "Pass rate", value: "91.4%" },
] as const;

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[13px] font-medium text-[hsl(var(--foreground))]">
          Dashboard
        </h2>
        <p className="mt-0.5 text-[12px] text-[hsl(var(--muted-foreground))]">
          Audit prep overview — placeholder metrics
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
            className="bg-[hsl(var(--card))] px-3 py-2.5"
          >
            <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
              {m.label}
            </div>
            <div className="mt-1 font-[family-name:var(--font-mono)] text-[18px] tabular-nums tracking-tight text-[hsl(var(--foreground))]">
              {m.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
