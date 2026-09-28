import { z } from "zod";

export const agentNameSchema = z.enum([
  "reader",
  "compliance",
  "cross-reference",
  "remediation",
  "narrator",
]);

export type AgentName = z.infer<typeof agentNameSchema>;

export const readerFindingSchema = z.object({
  documentId: z.string(),
  title: z.string(),
  docType: z.string(),
  summary: z.string(),
  keyFacts: z.array(z.string()).max(12),
  gaps: z.array(z.string()).max(12),
  riskSignals: z.array(z.string()).max(12),
});

export const readerOutputSchema = z.object({
  caseId: z.string(),
  documentsReviewed: z.number().int().nonnegative(),
  findings: z.array(readerFindingSchema).min(1),
  overallReadinessNotes: z.string(),
});

export const complianceIssueSchema = z.object({
  id: z.string(),
  documentId: z.string().nullable(),
  severity: z.enum(["low", "medium", "high"]),
  ruleArea: z.string(),
  finding: z.string(),
  evidence: z.string(),
});

export const complianceOutputSchema = z.object({
  caseId: z.string(),
  issues: z.array(complianceIssueSchema),
  compliantAreas: z.array(z.string()),
  residualRisk: z.enum(["low", "medium", "high"]),
});

export const crossReferenceLinkSchema = z.object({
  fromDocumentId: z.string(),
  toDocumentId: z.string(),
  relationship: z.string(),
  consistent: z.boolean(),
  note: z.string(),
});

export const crossReferenceOutputSchema = z.object({
  caseId: z.string(),
  links: z.array(crossReferenceLinkSchema),
  inconsistencies: z.array(z.string()),
  missingSupports: z.array(z.string()),
});

export const remediationActionSchema = z.object({
  id: z.string(),
  priority: z.enum(["p0", "p1", "p2"]),
  ownerRole: z.string(),
  relatedIssueIds: z.array(z.string()),
  action: z.string(),
  acceptanceCriteria: z.string(),
});

export const remediationOutputSchema = z.object({
  caseId: z.string(),
  actions: z.array(remediationActionSchema),
  quickWins: z.array(z.string()),
  estimatedEffortDays: z.number().nonnegative(),
});

export const narratorOutputSchema = z.object({
  caseId: z.string(),
  executiveSummary: z.string(),
  strengths: z.array(z.string()),
  topRisks: z.array(z.string()),
  recommendedNextSteps: z.array(z.string()),
  auditorFacingNarrative: z.string(),
});

export const auditRunResultSchema = z.object({
  caseId: z.string(),
  startedAt: z.string(),
  finishedAt: z.string(),
  documentIds: z.array(z.string()),
  tokenUsage: z.array(
    z.object({
      agent: agentNameSchema,
      inputTokens: z.number().int().nonnegative(),
      outputTokens: z.number().int().nonnegative(),
      totalTokens: z.number().int().nonnegative(),
    }),
  ),
  reader: readerOutputSchema,
  compliance: complianceOutputSchema,
  crossReference: crossReferenceOutputSchema,
  remediation: remediationOutputSchema,
  narrator: narratorOutputSchema,
});

export type ReaderOutput = z.infer<typeof readerOutputSchema>;
export type ComplianceOutput = z.infer<typeof complianceOutputSchema>;
export type CrossReferenceOutput = z.infer<typeof crossReferenceOutputSchema>;
export type RemediationOutput = z.infer<typeof remediationOutputSchema>;
export type NarratorOutput = z.infer<typeof narratorOutputSchema>;
export type AuditRunResult = z.infer<typeof auditRunResultSchema>;
