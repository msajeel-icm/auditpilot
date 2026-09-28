"use client";

import { motion } from "framer-motion";
import { Check, Circle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentName } from "@/lib/agents/schemas";
import type { RunStatus } from "@/lib/store/use-app-store";

export const PIPELINE_STEPS: { id: AgentName; label: string }[] = [
  { id: "reader", label: "Reader" },
  { id: "compliance", label: "Compliance" },
  { id: "cross-reference", label: "Cross-Reference" },
  { id: "remediation", label: "Remediation" },
  { id: "narrator", label: "Narrator" },
];

type StepState = "pending" | "active" | "done" | "error";

function stepState(
  stepId: AgentName,
  index: number,
  runStatus: RunStatus,
  currentAgent: AgentName | null,
): StepState {
  if (runStatus === "idle") return "pending";
  if (runStatus === "error") {
    if (!currentAgent) {
      return index === 0 ? "error" : "pending";
    }
    const currentIdx = PIPELINE_STEPS.findIndex((s) => s.id === currentAgent);
    if (index < currentIdx) return "done";
    if (index === currentIdx) return "error";
    return "pending";
  }
  if (runStatus === "done") return "done";
  // running
  const currentIdx = currentAgent
    ? PIPELINE_STEPS.findIndex((s) => s.id === currentAgent)
    : 0;
  if (index < currentIdx) return "done";
  if (index === currentIdx) return "active";
  return "pending";
}

export function AgentStepper({
  runStatus,
  currentAgent,
}: {
  runStatus: RunStatus;
  currentAgent: AgentName | null;
}) {
  return (
    <ol
      className="flex flex-col gap-1 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2"
      aria-label="Audit pipeline"
    >
      {PIPELINE_STEPS.map((step, index) => {
        const state = stepState(step.id, index, runStatus, currentAgent);
        return (
          <motion.li
            key={step.id}
            layout
            initial={false}
            animate={{
              opacity: state === "pending" ? 0.55 : 1,
              scale: state === "active" ? 1.01 : 1,
            }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors duration-150",
              state === "active" && "bg-[hsl(var(--accent)/0.12)]",
            )}
          >
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center"
              aria-hidden
            >
              {state === "done" ? (
                <Check className="h-3.5 w-3.5 text-[hsl(var(--accent))]" />
              ) : state === "active" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[hsl(var(--accent))]" />
              ) : state === "error" ? (
                <X className="h-3.5 w-3.5 text-[hsl(0_80%_65%)]" />
              ) : (
                <Circle className="h-3 w-3 text-[hsl(var(--muted-foreground))]" />
              )}
            </span>
            <span
              className={cn(
                state === "active" && "text-[hsl(var(--accent))]",
                state === "done" && "text-[hsl(var(--foreground))]",
                state === "pending" && "text-[hsl(var(--muted-foreground))]",
                state === "error" && "text-[hsl(0_80%_70%)]",
              )}
            >
              {step.label}
            </span>
            <span className="ml-auto font-[family-name:var(--font-mono)] text-[10px] text-[hsl(var(--muted-foreground))]">
              {step.id}
            </span>
          </motion.li>
        );
      })}
    </ol>
  );
}
