"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Play, RotateCcw, Square } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { AuditStreamEvent } from "@/lib/store/use-app-store";
import { AgentStepper } from "./AgentStepper";
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
  if (code === "PIPELINE_ERROR") {
    return "Audit pipeline failed mid-run. Retry after the model path is fixed, or pick another case.";
  }
  if (typeof obj.message === "string" && obj.message.length > 0) {
    return obj.message;
  }
  if (typeof obj.error === "string") {
    return obj.error;
  }
  return `Request failed (${status}).`;
}

function isAbortError(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === "AbortError") ||
    (err instanceof Error && err.name === "AbortError")
  );
}

async function readSseStream(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal,
  onEvent: (event: AuditStreamEvent) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      if (signal.aborted) {
        await reader.cancel().catch(() => undefined);
        break;
      }
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() ?? "";
      for (const chunk of chunks) {
        if (signal.aborted) break;
        for (const line of chunk.split("\n")) {
          const trimmed = line.trimEnd();
          if (!trimmed.startsWith("data:")) continue;
          const raw = trimmed.slice(5).trimStart();
          if (!raw || raw === "[DONE]") continue;
          try {
            const parsed = JSON.parse(raw) as AuditStreamEvent;
            if (parsed && typeof parsed === "object" && "type" in parsed) {
              onEvent(parsed);
            }
          } catch {
            // ignore malformed SSE payloads
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export function AgentRunner() {
  const cases = useAppStore((s) => s.cases);
  const selectedCaseId = useAppStore((s) => s.selectedCaseId);
  const selectCase = useAppStore((s) => s.selectCase);
  const runStatus = useAppStore((s) => s.runStatus);
  const currentAgent = useAppStore((s) => s.currentAgent);
  const agentStatuses = useAppStore((s) => s.agentStatuses);
  const runResult = useAppStore((s) => s.runResult);
  const errorMessage = useAppStore((s) => s.errorMessage);
  const startRun = useAppStore((s) => s.startRun);
  const failRun = useAppStore((s) => s.failRun);
  const resetRun = useAppStore((s) => s.resetRun);
  const applyStreamEvent = useAppStore((s) => s.applyStreamEvent);

  const selectedCase = cases.find((c) => c.id === selectedCaseId);
  const abortRef = useRef<AbortController | null>(null);
  const intentionalCancelRef = useRef(false);
  const generationRef = useRef(0);

  const abortInFlight = useCallback((asCancel: boolean) => {
    intentionalCancelRef.current = asCancel;
    generationRef.current += 1;
    const ctrl = abortRef.current;
    abortRef.current = null;
    if (ctrl) ctrl.abort();
  }, []);

  const onCancel = useCallback(() => {
    if (useAppStore.getState().runStatus !== "running") return;
    abortInFlight(true);
    // Soft cancel → clean idle so demo UI does not look stuck in error
    resetRun();
  }, [abortInFlight, resetRun]);

  const onReset = useCallback(() => {
    abortInFlight(false);
    resetRun();
  }, [abortInFlight, resetRun]);

  useEffect(() => {
    return () => {
      abortInFlight(false);
    };
  }, [abortInFlight]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      // Cmd+K palette owns Esc while open
      if (document.getElementById("command-palette-dialog")) return;
      if (useAppStore.getState().runStatus !== "running") return;
      e.preventDefault();
      onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  async function onRun() {
    if (!selectedCaseId) return;
    if (useAppStore.getState().runStatus === "running") return;

    abortInFlight(false);
    intentionalCancelRef.current = false;
    const generation = (generationRef.current += 1);
    const controller = new AbortController();
    abortRef.current = controller;

    startRun();

    const stillActive = () =>
      generationRef.current === generation &&
      !controller.signal.aborted &&
      !intentionalCancelRef.current;

    try {
      const res = await fetch("/api/audit/run?stream=1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ caseId: selectedCaseId }),
        signal: controller.signal,
      });

      if (!stillActive()) return;

      const contentType = res.headers.get("content-type") ?? "";
      const isEventStream = contentType.includes("text/event-stream");
      const isJson = contentType.includes("application/json");

      if (!res.ok || isJson || !isEventStream) {
        const body: unknown = await res.json().catch(() => null);
        if (!stillActive()) return;
        failRun(friendlyError(res.status || 500, body));
        return;
      }

      if (!res.body) {
        if (!stillActive()) return;
        failRun("Stream response had no body.");
        return;
      }

      await readSseStream(res.body, controller.signal, (event) => {
        if (!stillActive()) return;
        if (event.type === "error") {
          const mapped = friendlyError(
            event.code === "MISSING_DEEPSEEK_API_KEY"
              ? 503
              : event.code === "UNKNOWN_CASE"
                ? 404
                : event.code === "AGENT_PARSE_ERROR"
                  ? 502
                  : 500,
            event,
          );
          applyStreamEvent({ ...event, message: mapped });
          return;
        }
        applyStreamEvent(event);
      });

      // Stream ended without result/error while still running → soft fail
      if (stillActive() && useAppStore.getState().runStatus === "running") {
        failRun("Stream ended before a result. Retry the run.");
      }
    } catch (err) {
      if (isAbortError(err) || intentionalCancelRef.current || !stillActive()) {
        // Cancel / unmount / superseded run — leave store as cancel/reset set it
        return;
      }
      failRun(
        "Network error talking to the audit API. Retry when the server is up.",
      );
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }

  const isRunning = runStatus === "running";

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
              disabled={isRunning}
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
              onClick={onReset}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[hsl(var(--border))] px-2.5 text-[12px] text-[hsl(var(--muted-foreground))] outline-none hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Reset
            </button>
          )}
          {isRunning ? (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[hsl(var(--border))] px-2.5 text-[12px] text-[hsl(var(--muted-foreground))] outline-none hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            >
              <Square className="h-3 w-3 fill-current" aria-hidden />
              Cancel
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void onRun()}
            disabled={!selectedCaseId || isRunning}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[hsl(var(--accent))] px-3 text-[12px] font-medium text-[hsl(var(--accent-foreground))] outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-1 focus-visible:ring-offset-[hsl(var(--background))] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5" aria-hidden />
            {isRunning ? "Running…" : "Run audit"}
          </button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[240px_minmax(0,1fr)]">
        <AgentStepper
          runStatus={runStatus}
          currentAgent={currentAgent}
          agentStatuses={agentStatuses}
        />
        <motion.div
          key={runStatus + (runResult?.finishedAt ?? errorMessage ?? currentAgent ?? "")}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
        >
          <AgentResultPanel
            runStatus={runStatus}
            result={runResult}
            errorMessage={errorMessage}
            currentAgent={currentAgent}
          />
        </motion.div>
      </div>
    </div>
  );
}
