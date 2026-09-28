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

export function DocumentList() {
  const documents = useAppStore((s) => s.documents);
  const selectedCaseId = useAppStore((s) => s.selectedCaseId);
  const selectedDocumentId = useAppStore((s) => s.selectedDocumentId);
  const selectDocument = useAppStore((s) => s.selectDocument);
  const cases = useAppStore((s) => s.cases);

  const filtered = selectedCaseId
    ? documents.filter((d) => d.caseId === selectedCaseId)
    : documents;

  const caseName = selectedCaseId
    ? cases.find((c) => c.id === selectedCaseId)?.name
    : null;

  return (
    <div className="flex flex-col gap-2">
      {!selectedCaseId ? (
        <p className="text-[13px] text-[hsl(var(--muted-foreground))]">
          No case selected — showing all documents. Pick a case on Cases to
          filter.
        </p>
      ) : (
        <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
          Showing{" "}
          <span className="font-[family-name:var(--font-mono)] text-[hsl(var(--foreground))]">
            {filtered.length}
          </span>{" "}
          docs for{" "}
          <span className="text-[hsl(var(--foreground))]">
            {caseName ?? selectedCaseId}
          </span>
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="text-[13px] text-[hsl(var(--muted-foreground))]">
          No documents for {caseName ?? "this case"}.
        </p>
      ) : (
        <ul
          className="flex flex-col gap-px overflow-hidden rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--border))]"
          role="listbox"
          aria-label="Documents"
        >
          {filtered.map((doc) => {
            const active = doc.id === selectedDocumentId;
            return (
              <li key={doc.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => selectDocument(doc.id)}
                  className={cn(
                    "flex w-full flex-col gap-1 px-3 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[hsl(var(--ring))]",
                    active
                      ? "bg-[hsl(var(--accent)/0.12)]"
                      : "bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted))]",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                      {doc.title}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wide",
                        doc.risk === "high" &&
                          "bg-[hsl(0_70%_40%/0.2)] text-[hsl(0_80%_70%)]",
                        doc.risk === "medium" &&
                          "bg-[hsl(40_80%_40%/0.2)] text-[hsl(40_90%_70%)]",
                        doc.risk === "low" &&
                          "bg-[hsl(var(--accent)/0.15)] text-[hsl(var(--accent))]",
                      )}
                    >
                      {RISK_LABEL[doc.risk]}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[hsl(var(--muted-foreground))]">
                    <span className="font-[family-name:var(--font-mono)] text-[10px]">
                      {doc.id}
                    </span>
                    <span className="rounded border border-[hsl(var(--border))] px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px]">
                      {STATUS_LABEL[doc.status]}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[10px]">
                      {formatDate(doc.updatedAt)}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-[12px] text-[hsl(var(--muted-foreground))]">
                    {doc.excerpt}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
