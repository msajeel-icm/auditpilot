import { create } from "zustand";

import type { AuditRunResult, AgentName } from "@/lib/agents/schemas";
import { mockCases, mockDocuments } from "@/lib/mock-docs";
import type { AuditCase, MockDocument } from "@/lib/types";

export type RunStatus = "idle" | "running" | "error" | "done";

export type AgentStepStatus = "pending" | "running" | "done" | "error";

/** SSE / stream event shapes from POST /api/audit/run?stream=1 */
export type AuditStreamStepEvent = {
  type: "step";
  agent: AgentName;
  status: "start" | "done" | "error";
  partial?: unknown;
  message?: string;
};

export type AuditStreamResultEvent = {
  type: "result";
  result: AuditRunResult;
};

export type AuditStreamErrorEvent = {
  type: "error";
  code: string;
  message: string;
  agent?: AgentName;
};

export type AuditStreamEvent =
  | AuditStreamStepEvent
  | AuditStreamResultEvent
  | AuditStreamErrorEvent;

interface AppState {
  cases: AuditCase[];
  documents: MockDocument[];
  selectedCaseId: string | null;
  selectedDocumentId: string | null;
  selectCase: (caseId: string | null) => void;
  selectDocument: (documentId: string | null) => void;
  getSelectedCase: () => AuditCase | undefined;
  getSelectedDocument: () => MockDocument | undefined;
  getDocumentsForSelectedCase: () => MockDocument[];

  runStatus: RunStatus;
  currentAgent: AgentName | null;
  runResult: AuditRunResult | null;
  errorMessage: string | null;
  /** Optional per-agent statuses for stream-driven steppers (Ada). */
  agentStatuses: Partial<Record<AgentName, AgentStepStatus>>;
  startRun: () => void;
  setRunProgress: (agent: AgentName | null) => void;
  completeRun: (result: AuditRunResult) => void;
  failRun: (message: string) => void;
  resetRun: () => void;
  /** Apply an SSE stream event; safe no-op for unrecognized shapes. */
  applyStreamEvent: (event: AuditStreamEvent) => void;
}

const emptyAgentStatuses = (): Partial<Record<AgentName, AgentStepStatus>> => ({});

export const useAppStore = create<AppState>((set, get) => ({
  cases: mockCases,
  documents: mockDocuments,
  selectedCaseId: mockCases[0]?.id ?? null,
  selectedDocumentId: null,
  selectCase: (caseId) =>
    set({ selectedCaseId: caseId, selectedDocumentId: null }),
  selectDocument: (documentId) => set({ selectedDocumentId: documentId }),
  getSelectedCase: () => {
    const { cases, selectedCaseId } = get();
    return cases.find((auditCase) => auditCase.id === selectedCaseId);
  },
  getSelectedDocument: () => {
    const { documents, selectedDocumentId } = get();
    return documents.find((document) => document.id === selectedDocumentId);
  },
  getDocumentsForSelectedCase: () => {
    const { documents, selectedCaseId } = get();
    return selectedCaseId
      ? documents.filter((document) => document.caseId === selectedCaseId)
      : documents;
  },

  runStatus: "idle",
  currentAgent: null,
  runResult: null,
  errorMessage: null,
  agentStatuses: emptyAgentStatuses(),
  startRun: () =>
    set({
      runStatus: "running",
      currentAgent: "reader",
      runResult: null,
      errorMessage: null,
      agentStatuses: emptyAgentStatuses(),
    }),
  setRunProgress: (agent) => set({ currentAgent: agent, runStatus: "running" }),
  completeRun: (result) =>
    set({
      runStatus: "done",
      currentAgent: null,
      runResult: result,
      errorMessage: null,
    }),
  failRun: (message) =>
    set({
      runStatus: "error",
      currentAgent: null,
      errorMessage: message,
    }),
  resetRun: () =>
    set({
      runStatus: "idle",
      currentAgent: null,
      runResult: null,
      errorMessage: null,
      agentStatuses: emptyAgentStatuses(),
    }),
  applyStreamEvent: (event) => {
    if (!event || typeof event !== "object" || !("type" in event)) {
      return;
    }

    if (event.type === "step") {
      const statusMap = {
        start: "running",
        done: "done",
        error: "error",
      } as const;
      const stepStatus = statusMap[event.status];
      set((state) => ({
        runStatus: "running",
        currentAgent:
          event.status === "start" ? event.agent : state.currentAgent,
        agentStatuses: {
          ...state.agentStatuses,
          [event.agent]: stepStatus,
        },
        ...(event.status === "error" && event.message
          ? { errorMessage: event.message }
          : {}),
      }));
      return;
    }

    if (event.type === "result") {
      set({
        runStatus: "done",
        currentAgent: null,
        runResult: event.result,
        errorMessage: null,
      });
      return;
    }

    if (event.type === "error") {
      set((state) => ({
        runStatus: "error",
        currentAgent: null,
        errorMessage: event.message,
        agentStatuses: event.agent
          ? { ...state.agentStatuses, [event.agent]: "error" }
          : state.agentStatuses,
      }));
    }
  },
}));

export type { AppState };
