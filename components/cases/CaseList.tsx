"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import type { CaseStatus, RiskLevel } from "@/lib/types";

const STATUS_LABEL: Record<CaseStatus, string> = {
  "audit-ready": "audit-ready",
  "in-review": "in-review",
  "action-required": "action-required",
};

const RISK_LABEL: Record<RiskLevel, string> = {
  low: "low",
  medium: "medium",
  high: "high",
};

export function CaseList() {
  const router = useRouter();
  const cases = useAppStore((s) => s.cases);
  const selectedCaseId = useAppStore((s) => s.selectedCaseId);
  const selectCase = useAppStore((s) => s.selectCase);

  if (cases.length === 0) {
    return (
      <p className="text-[13px] text-[hsl(var(--muted-foreground))]">
        No cases in the mock set.
      </p>
    );
  }

  return (
    <ul
      className="flex flex-col gap-px overflow-hidden rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--border))]"
      role="listbox"
      aria-label="Audit cases"
    >
      {cases.map((c) => {
        const active = c.id === selectedCaseId;
        return (
          <li key={c.id} role="option" aria-selected={active}>
            <button
              type="button"
              onClick={() => {
                selectCase(c.id);
                router.push("/documents");
              }}
              className={cn(
                "flex w-full flex-col gap-1.5 px-3 py-2.5 text-left outline-none transition-[background-color,box-shadow] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[hsl(var(--ring))]",
                active
                  ? "bg-[hsl(var(--accent)/0.12)] shadow-[inset_2px_0_0_0_hsl(var(--accent))]"
                  : "bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted))]",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                  {c.name}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wide",
                    c.risk === "high" &&
                      "bg-[hsl(0_70%_40%/0.2)] text-[hsl(0_80%_70%)]",
                    c.risk === "medium" &&
                      "bg-[hsl(40_80%_40%/0.2)] text-[hsl(40_90%_70%)]",
                    c.risk === "low" &&
                      "bg-[hsl(var(--accent)/0.15)] text-[hsl(var(--accent))]",
                  )}
                >
                  {RISK_LABEL[c.risk]}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-[hsl(var(--muted-foreground))]">
                <span className="font-[family-name:var(--font-mono)] text-[10px]">
                  {c.id}
                </span>
                <span className="rounded border border-[hsl(var(--border))] px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px]">
                  {STATUS_LABEL[c.status]}
                </span>
                <span>{c.reviewPeriod}</span>
              </div>
              <p className="line-clamp-2 text-[12px] text-[hsl(var(--muted-foreground))]">
                {c.program}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
