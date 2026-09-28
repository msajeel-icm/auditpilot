export type DocumentStatus = "ready" | "needs-review" | "missing";

export type RiskLevel = "low" | "medium" | "high";

export type DocumentType =
  | "individual-support-plan"
  | "progress-note"
  | "medication-administration-record"
  | "incident-report"
  | "staff-training"
  | "billing-claim";

export type CaseStatus = "audit-ready" | "in-review" | "action-required";

export interface AuditCase {
  id: string;
  name: string;
  program: string;
  reviewPeriod: string;
  status: CaseStatus;
  risk: RiskLevel;
  description: string;
}

export interface MockDocument {
  id: string;
  caseId: AuditCase["id"];
  title: string;
  docType: DocumentType;
  status: DocumentStatus;
  risk: RiskLevel;
  updatedAt: string;
  excerpt: string;
  body: string;
}
