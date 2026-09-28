"use client";

import type { AuditRunResult } from "@/lib/agents/schemas";
import type { RunStatus } from "@/lib/store/use-app-store";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <h3 className="border-b border-[hsl(var(--border))] px-3 py-2 text-[12px] font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
        {title}
      </h3>
      <div className="space-y-2 px-3 py-2.5 text-[13px] text-[hsl(var(--foreground))]">
        {children}
      </div>
    </section>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-[family-name:var(--font-mono)] text-[11px] text-[hsl(var(--muted-foreground))]">
      {children}
    </span>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return (
      <p className="text-[12px] text-[hsl(var(--muted-foreground))]">None</p>
    );
  }
  return (
    <ul className="list-inside list-disc space-y-0.5 text-[12px] text-[hsl(var(--muted-foreground))]">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function AgentResultPanel({
  runStatus,
  result,
  errorMessage,
}: {
  runStatus: RunStatus;
  result: AuditRunResult | null;
  errorMessage: string | null;
}) {
  if (runStatus === "idle") {
    return (
      <div className="flex min-h-[160px] items-center rounded-md border border-dashed border-[hsl(var(--border))] px-4 py-6">
        <p className="text-[13px] text-[hsl(var(--muted-foreground))]">
          Run an audit to see Reader → Narrator results here.
        </p>
      </div>
    );
  }

  if (runStatus === "running") {
    return (
      <div className="flex min-h-[160px] items-center rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-6">
        <p className="text-[13px] text-[hsl(var(--muted-foreground))]">
          Pipeline running… steps update as the orchestrator advances.
        </p>
      </div>
    );
  }

  if (runStatus === "error") {
    return (
      <div
        className="rounded-md border border-[hsl(0_50%_35%/0.5)] bg-[hsl(0_40%_12%/0.4)] px-4 py-4"
        role="alert"
      >
        <p className="text-[13px] font-medium text-[hsl(0_80%_75%)]">
          Audit did not complete
        </p>
        <p className="mt-1 text-[12px] text-[hsl(var(--muted-foreground))]">
          {errorMessage ?? "Something went wrong."}
        </p>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <Section title="Run">
        <div className="flex flex-wrap gap-3 text-[12px]">
          <span>
            Case <Mono>{result.caseId}</Mono>
          </span>
          <span>
            Docs{" "}
            <Mono>{result.documentIds.join(", ") || "—"}</Mono>
          </span>
          <span>
            Started <Mono>{result.startedAt}</Mono>
          </span>
          <span>
            Finished <Mono>{result.finishedAt}</Mono>
          </span>
        </div>
        <div className="mt-1 flex flex-wrap gap-2">
          {result.tokenUsage.map((t) => (
            <span
              key={t.agent}
              className="rounded border border-[hsl(var(--border))] px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[hsl(var(--muted-foreground))]"
            >
              {t.agent}:{t.totalTokens}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Narrator">
        <p className="text-[13px] leading-relaxed">{result.narrator.executiveSummary}</p>
        <div>
          <p className="mb-0.5 text-[11px] uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
            Top risks
          </p>
          <BulletList items={result.narrator.topRisks} />
        </div>
        <div>
          <p className="mb-0.5 text-[11px] uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
            Next steps
          </p>
          <BulletList items={result.narrator.recommendedNextSteps} />
        </div>
        <pre className="mt-1 whitespace-pre-wrap font-[family-name:var(--font-mono)] text-[11px] leading-relaxed text-[hsl(var(--muted-foreground))]">
          {result.narrator.auditorFacingNarrative}
        </pre>
      </Section>

      <Section title="Compliance">
        <p className="text-[12px]">
          Residual risk{" "}
          <Mono>{result.compliance.residualRisk}</Mono> ·{" "}
          <Mono>{result.compliance.issues.length}</Mono> issues
        </p>
        <ul className="space-y-1.5">
          {result.compliance.issues.map((issue) => (
            <li
              key={issue.id}
              className="rounded border border-[hsl(var(--border))] px-2 py-1.5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Mono>{issue.id}</Mono>
                <Mono>{issue.severity}</Mono>
                <span className="text-[12px]">{issue.ruleArea}</span>
              </div>
              <p className="mt-0.5 text-[12px] text-[hsl(var(--muted-foreground))]">
                {issue.finding}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Remediation">
        <p className="text-[12px]">
          Effort{" "}
          <Mono>{result.remediation.estimatedEffortDays}d</Mono>
        </p>
        <ul className="space-y-1.5">
          {result.remediation.actions.map((a) => (
            <li
              key={a.id}
              className="rounded border border-[hsl(var(--border))] px-2 py-1.5"
            >
              <div className="flex flex-wrap gap-2">
                <Mono>{a.priority}</Mono>
                <Mono>{a.id}</Mono>
                <span className="text-[12px]">{a.ownerRole}</span>
              </div>
              <p className="mt-0.5 text-[12px] text-[hsl(var(--muted-foreground))]">
                {a.action}
              </p>
            </li>
          ))}
        </ul>
        <div>
          <p className="mb-0.5 text-[11px] uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
            Quick wins
          </p>
          <BulletList items={result.remediation.quickWins} />
        </div>
      </Section>

      <Section title="Reader">
        <p className="text-[12px] text-[hsl(var(--muted-foreground))]">
          {result.reader.overallReadinessNotes}
        </p>
        <ul className="space-y-1.5">
          {result.reader.findings.map((f) => (
            <li
              key={f.documentId}
              className="rounded border border-[hsl(var(--border))] px-2 py-1.5"
            >
              <div className="flex flex-wrap gap-2">
                <Mono>{f.documentId}</Mono>
                <span className="text-[12px] font-medium">{f.title}</span>
              </div>
              <p className="mt-0.5 text-[12px] text-[hsl(var(--muted-foreground))]">
                {f.summary}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Cross-reference">
        <BulletList items={result.crossReference.inconsistencies} />
        <div>
          <p className="mb-0.5 text-[11px] uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
            Missing supports
          </p>
          <BulletList items={result.crossReference.missingSupports} />
        </div>
      </Section>
    </div>
  );
}
