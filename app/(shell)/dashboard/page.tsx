"use client";

import Link from "next/link";
import { FolderKanban, FileText, Bot, ArrowRight } from "lucide-react";
import { useAppStore } from "@/lib/store";

const ACTIONS = [
  {
    href: "/cases",
    title: "Review open cases",
    description:
      "Pick a Medicaid audit case to focus the workspace. Selection filters documents and feeds the agent pipeline.",
    icon: FolderKanban,
    cta: "Open Cases",
  },
  {
    href: "/documents",
    title: "Inspect docs for selected case",
    description:
      "Browse evidence packets, spot high-risk gaps, and open a document for detail before you run agents.",
    icon: FileText,
    cta: "Open Documents",
  },
  {
    href: "/agents",
    title: "Run audit pipeline",
    description:
      "Stream Reader → Narrator over SSE for the selected case. Cancel or Esc aborts an in-flight run.",
    icon: Bot,
    cta: "Open Agents",
  },
] as const;

export default function DashboardPage() {
  const cases = useAppStore((s) => s.cases);
  const documents = useAppStore((s) => s.documents);
  const selectedCaseId = useAppStore((s) => s.selectedCaseId);

  const caseCount = cases.length;
  const docCount = documents.length;
  const highRiskDocs = documents.filter((d) => d.risk === "high").length;
  const needsReview = documents.filter(
    (d) => d.status === "needs-review" || d.status === "missing",
  ).length;
  const readyCount = documents.filter((d) => d.status === "ready").length;
  const readyPct =
    docCount === 0 ? "—" : `${((readyCount / docCount) * 100).toFixed(0)}%`;
  const selectedName =
    cases.find((c) => c.id === selectedCaseId)?.name ?? "none selected";

  const metrics = [
    { label: "Cases", value: String(caseCount), hint: "in workspace" },
    { label: "Documents", value: String(docCount), hint: "mock packet" },
    {
      label: "High risk",
      value: String(highRiskDocs),
      hint: `${needsReview} need review`,
    },
    { label: "Ready", value: readyPct, hint: `${readyCount}/${docCount} docs` },
  ] as const;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-[13px] font-medium tracking-tight text-[hsl(var(--foreground))]">
          Overview
        </h2>
        <p className="max-w-2xl text-[12px] text-[hsl(var(--muted-foreground))]">
          AuditPilot prepares Medicaid audit packets. Start with Cases, review
          Documents for the selected case, then run the agent pipeline. Active
          case:{" "}
          <span className="font-medium text-[hsl(var(--foreground))]">
            {selectedName}
          </span>
          . Use{" "}
          <kbd className="rounded border border-[hsl(var(--border))] px-1 py-0.5 font-[family-name:var(--font-mono)] text-[10px]">
            ⌘K
          </kbd>{" "}
          anytime to jump.
        </p>
      </div>

      <div
        className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--border))] sm:grid-cols-4"
        role="list"
        aria-label="Workspace metrics"
      >
        {metrics.map((m) => (
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
            <div className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">
              {m.hint}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[12px] font-medium uppercase tracking-[0.06em] text-[hsl(var(--muted-foreground))]">
          Next actions
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {ACTIONS.map(({ href, title, description, icon: Icon, cta }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col gap-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 outline-none transition-colors hover:bg-[hsl(var(--muted))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-1 focus-visible:ring-offset-[hsl(var(--background))]"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[hsl(var(--accent)/0.12)] text-[hsl(var(--accent))]">
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                  {title}
                </span>
              </div>
              <p className="flex-1 text-[12px] leading-relaxed text-[hsl(var(--muted-foreground))]">
                {description}
              </p>
              <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[hsl(var(--accent))]">
                {cta}
                <ArrowRight
                  className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
