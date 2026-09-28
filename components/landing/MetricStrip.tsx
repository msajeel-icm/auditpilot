const metrics = [
  { label: "Avg. review cycle", value: "12 min" },
  { label: "Docs per case", value: "6–40" },
  { label: "Agent chain", value: "Reader→Narrator" },
  { label: "Export formats", value: "Markdown" },
] as const;

export function MetricStrip() {
  return (
    <section className="border-t border-[hsl(var(--border))]">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <p className="mb-6 text-[12px] font-medium uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))]">
          Built for survey readiness
        </p>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--border))] sm:grid-cols-4">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="bg-[hsl(var(--background))] px-5 py-5"
            >
              <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-[hsl(var(--muted-foreground))]">
                {m.label}
              </dt>
              <dd className="mt-2 font-[family-name:var(--font-mono)] text-[18px] tabular-nums tracking-tight text-[hsl(var(--foreground))]">
                {m.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
