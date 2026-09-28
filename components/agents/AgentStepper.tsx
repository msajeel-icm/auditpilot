"use client";

import { motion } from "framer-motion";
import { Check, Circle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentName } from "@/lib/agents/schemas";
import type {
  AgentStepStatus,
  RunStatus,
} from "@/lib/store/use-app-store";

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
  agentStatuses?: Partial<Record<AgentName, AgentStepStatus>>,
): StepState {
  if (runStatus === "idle") return "pending";
  if (runStatus === "done") return "done";

  const fromStream = agentStatuses?.[stepId];
  if (fromStream === "running") return "active";
  if (fromStream === "done") return "done";
  if (fromStream === "error") return "error";
  if (fromStream === "pending") return "pending";

  const hasStreamStatuses =
    !!agentStatuses && Object.keys(agentStatuses).length > 0;
  if (hasStreamStatuses) {
    return "pending";
  }

  // Fallback: currentAgent + runStatus (pre-stream / idle overall)
  if (runStatus === "error") {
    if (!currentAgent) {
      return index === 0 ? "error" : "pending";
    }
    const currentIdx = PIPELINE_STEPS.findIndex((s) => s.id === currentAgent);
    if (index < currentIdx) return "done";
    if (index === currentIdx) return "error";
    return "pending";
  }

  // running without agentStatuses yet
  const currentIdx = currentAgent
    ? PIPELINE_STEPS.findIndex((s) => s.id === currentAgent)
    : 0;
  if (index < currentIdx) return "done";
  if (index === currentIdx) return "active";
  return "pending";
}

const STATE_CHIP: Record<StepState, string> = {
  pending: "pending",
  active: "running",
  done: "done",
  error: "error",
};

export function AgentStepper({
  runStatus,
  currentAgent,
  agentStatuses,
}: {
  runStatus: RunStatus;
  currentAgent: AgentName | null;
  agentStatuses?: Partial<Record<AgentName, AgentStepStatus>>;
}) {
  return (
    <ol
      className="flex flex-col gap-0.5 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2"
      aria-label="Audit pipeline"
    >
      <li className="mb-1 px-2 text-[10px] font-medium uppercase tracking-[0.06em] text-[hsl(var(--muted-foreground))]">
        Pipeline
      </li>
      {PIPELINE_STEPS.map((step, index) => {
        const state = stepState(
          step.id,
          index,
          runStatus,
          currentAgent,
          agentStatuses,
        );
        return (
          <motion.li
            key={step.id}
            layout
            initial={false}
            animate={{
              opacity: state === "pending" ? 0.7 : 1,
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
                <X className="h-3.5 w-3.5 text-[hsl(0_65%_38%)]" />
              ) : (
                <Circle className="h-3 w-3 text-[hsl(var(--muted-foreground))]" />
              )}
            </span>
            <span
              className={cn(
                "min-w-0 flex-1 truncate",
                state === "active" && "font-medium text-[hsl(var(--accent))]",
                state === "done" && "text-[hsl(var(--foreground))]",
                state === "pending" && "text-[hsl(var(--muted-foreground))]",
                state === "error" && "text-[hsl(0_65%_38%)]",
              )}
            >
              {step.label}
            </span>
            <span
              className={cn(
                "shrink-0 rounded px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wide",
                state === "active" &&
                  "bg-[hsl(var(--accent)/0.12)] text-[hsl(var(--accent))]",
                state === "done" &&
                  "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]",
                state === "pending" &&
                  "border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]",
                state === "error" &&
                  "bg-[hsl(0_70%_96%)] text-[hsl(0_65%_38%)]",
              )}
            >
              {STATE_CHIP[state]}
            </span>
          </motion.li>
        );
      })}
    </ol>
  );
}
