import { create } from "zustand";

import { mockCases, mockDocuments } from "@/lib/mock-docs";
import type { AuditCase, MockDocument } from "@/lib/types";

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
}));

export type { AppState };
