import { create } from "zustand";

import type { AuditRunResult, AgentName } from "@/lib/agents/schemas";
import { mockCases, mockDocuments } from "@/lib/mock-docs";
import type { AuditCase, MockDocument } from "@/lib/types";

export type RunStatus = "idle" | "running" | "error" | "done";

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
  startRun: () => void;
  setRunProgress: (agent: AgentName | null) => void;
  completeRun: (result: AuditRunResult) => void;
  failRun: (message: string) => void;
  resetRun: () => void;
}

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
  startRun: () =>
    set({
      runStatus: "running",
      currentAgent: "reader",
      runResult: null,
      errorMessage: null,
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
    }),
}));

export type { AppState };
