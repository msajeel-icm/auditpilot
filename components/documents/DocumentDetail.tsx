"use client";

import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import type { DocumentStatus, RiskLevel } from "@/lib/types";

const STATUS_LABEL: Record<DocumentStatus, string> = {
  ready: "ready",
  "needs-review": "needs-review",
  missing: "missing",
};

const RISK_LABEL: Record<RiskLevel, string> = {
  low: "low",
  medium: "medium",
  high: "high",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso;
  }
}

export function DocumentDetail() {
  const documents = useAppStore((s) => s.documents);
  const selectedDocumentId = useAppStore((s) => s.selectedDocumentId);
  const cases = useAppStore((s) => s.cases);

  const doc = documents.find((d) => d.id === selectedDocumentId);
  const caseName = doc
    ? cases.find((c) => c.id === doc.caseId)?.name
    : undefined;

  if (!doc) {
    return (
      <div className="flex h-full min-h-[180px] items-center rounded-md border border-dashed border-[hsl(var(--border))] px-3 py-6">
        <p className="text-[12px] text-[hsl(var(--muted-foreground))]">
          Select a document from the list to inspect title, status, risk, and
          body. Dense rows keep scan speed high.
        </p>
      </div>
    );
  }

  return (
    <article className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <header className="shrink-0 border-b border-[hsl(var(--border))] px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[13px] font-medium text-[hsl(var(--foreground))]">
            {doc.title}
          </h3>
          <span
            className={cn(
              "shrink-0 rounded px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wide",
              doc.risk === "high" &&
                "bg-[hsl(0_70%_96%)] text-[hsl(0_65%_38%)]",
              doc.risk === "medium" &&
                "bg-[hsl(40_90%_94%)] text-[hsl(32_80%_32%)]",
              doc.risk === "low" &&
                "bg-[hsl(var(--accent)/0.12)] text-[hsl(var(--accent))]",
            )}
          >
            {RISK_LABEL[doc.risk]}
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-[hsl(var(--muted-foreground))]">
          <span className="font-[family-name:var(--font-mono)] text-[10px]">
            {doc.id}
          </span>
          <span className="rounded border border-[hsl(var(--border))] px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px]">
            {STATUS_LABEL[doc.status]}
          </span>
          <span className="font-[family-name:var(--font-mono)] text-[10px]">
            {doc.docType}
          </span>
          <span className="font-[family-name:var(--font-mono)] text-[10px]">
            {formatDate(doc.updatedAt)}
          </span>
          {caseName ? <span>{caseName}</span> : null}
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-auto px-3 py-3">
        <p className="mb-3 text-[12px] text-[hsl(var(--muted-foreground))]">
          {doc.excerpt}
        </p>
        <pre className="whitespace-pre-wrap font-[family-name:var(--font-mono)] text-[12px] leading-relaxed text-[hsl(var(--foreground))]">
          {doc.body}
        </pre>
      </div>
    </article>
  );
}
