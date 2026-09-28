"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Play, RotateCcw } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { AuditRunResult } from "@/lib/agents/schemas";
import { AgentStepper, PIPELINE_STEPS } from "./AgentStepper";
import { AgentResultPanel } from "./AgentResultPanel";

function friendlyError(status: number, body: unknown): string {
  const obj =
    body && typeof body === "object"
      ? (body as Record<string, unknown>)
      : {};
  const code = typeof obj.code === "string" ? obj.code : "";

  if (status === 503 || code === "MISSING_DEEPSEEK_API_KEY") {
    return "API key not configured. Ask an admin to set the server key, then retry.";
  }
  if (status === 404 || code === "UNKNOWN_CASE") {
    return "Unknown case. Pick a case from Cases and try again.";
  }
  if (status === 502 || code === "AGENT_PARSE_ERROR") {
    return "An agent returned invalid structured output after repair. Retry the run.";
  }
  if (typeof obj.message === "string" && obj.message.length > 0) {
    return obj.message;
  }
  if (typeof obj.error === "string") {
    return obj.error;
  }
  return `Request failed (${status}).`;
}

export function AgentRunner() {
  const cases = useAppStore((s) => s.cases);
  const selectedCaseId = useAppStore((s) => s.selectedCaseId);
  const selectCase = useAppStore((s) => s.selectCase);
  const runStatus = useAppStore((s) => s.runStatus);
  const currentAgent = useAppStore((s) => s.currentAgent);
  const runResult = useAppStore((s) => s.runResult);
  const errorMessage = useAppStore((s) => s.errorMessage);
  const startRun = useAppStore((s) => s.startRun);
  const setRunProgress = useAppStore((s) => s.setRunProgress);
  const completeRun = useAppStore((s) => s.completeRun);
  const failRun = useAppStore((s) => s.failRun);
  const resetRun = useAppStore((s) => s.resetRun);

  const selectedCase = cases.find((c) => c.id === selectedCaseId);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    return () => {
      abortRef.current = true;
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, []);

  function stopProgress() {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  }

  function startOptimisticProgress() {
    stopProgress();
    let idx = 0;
    setRunProgress(PIPELINE_STEPS[0].id);
    progressTimer.current = setInterval(() => {
      idx = Math.min(idx + 1, PIPELINE_STEPS.length - 1);
      setRunProgress(PIPELINE_STEPS[idx].id);
      if (idx >= PIPELINE_STEPS.length - 1) stopProgress();
    }, 2200);
  }

  async function onRun() {
    if (!selectedCaseId || runStatus === "running") return;
    abortRef.current = false;
    startRun();
    startOptimisticProgress();

    try {
      const res = await fetch("/api/audit/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId: selectedCaseId }),
      });
      const body: unknown = await res.json().catch(() => null);
      stopProgress();
      if (abortRef.current) return;

      if (!res.ok) {
        failRun(friendlyError(res.status, body));
        return;
      }

      completeRun(body as AuditRunResult);
    } catch {
      stopProgress();
      if (abortRef.current) return;
      failRun("Network error talking to the audit API. Retry when the server is up.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-[220px] flex-col gap-1">
          <label
            htmlFor="agent-case"
            className="text-[11px] uppercase tracking-wide text-[hsl(var(--muted-foreground))]"
          >
            Case
          </label>
          {cases.length === 0 ? (
            <p className="text-[12px] text-[hsl(var(--muted-foreground))]">
              No cases.{" "}
              <Link
                href="/cases"
                className="text-[hsl(var(--accent))] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              >
                Open Cases
              </Link>
            </p>
          ) : (
            <select
              id="agent-case"
              value={selectedCaseId ?? ""}
              onChange={(e) => selectCase(e.target.value || null)}
              disabled={runStatus === "running"}
              className="h-8 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 text-[13px] text-[hsl(var(--foreground))] outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:opacity-60"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          {selectedCase ? (
            <p className="font-[family-name:var(--font-mono)] text-[10px] text-[hsl(var(--muted-foreground))]">
              {selectedCase.id} · {selectedCase.status}
            </p>
          ) : (
            <p className="text-[12px] text-[hsl(var(--muted-foreground))]">
              Select a case to run.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {(runStatus === "done" || runStatus === "error") && (
            <button
              type="button"
              onClick={() => resetRun()}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[hsl(var(--border))] px-2.5 text-[12px] text-[hsl(var(--muted-foreground))] outline-none hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={() => void onRun()}
            disabled={!selectedCaseId || runStatus === "running"}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[hsl(var(--accent))] px-3 text-[12px] font-medium text-[hsl(var(--accent-foreground))] outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-1 focus-visible:ring-offset-[hsl(var(--background))] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5" aria-hidden />
            {runStatus === "running" ? "Running…" : "Run audit"}
          </button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[240px_minmax(0,1fr)]">
        <AgentStepper runStatus={runStatus} currentAgent={currentAgent} />
        <motion.div
          key={runStatus + (runResult?.finishedAt ?? errorMessage ?? "")}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
        >
          <AgentResultPanel
            runStatus={runStatus}
            result={runResult}
            errorMessage={errorMessage}
          />
        </motion.div>
      </div>
    </div>
  );
}
