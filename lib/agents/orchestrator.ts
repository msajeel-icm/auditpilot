import { runCompliance } from "@/lib/agents/compliance";
import { runCrossReference } from "@/lib/agents/cross-reference";
import {
  AgentParseError,
  MissingApiKeyError,
  type TokenUsage,
} from "@/lib/agents/deepseek";
import { runNarrator } from "@/lib/agents/narrator";
import { runReader } from "@/lib/agents/reader";
import { runRemediation } from "@/lib/agents/remediation";
import {
  auditRunResultSchema,
  type AgentName,
  type AuditRunResult,
} from "@/lib/agents/schemas";
import { mockCases, mockDocuments } from "@/lib/mock-docs";

export type OrchestratorProgress = {
  currentAgent: AgentName | null;
};

export type RunAuditOptions = {
  caseId: string;
  onProgress?: (progress: OrchestratorProgress) => void;
};

export async function runAuditPipeline(
  options: RunAuditOptions,
): Promise<AuditRunResult> {
  const auditCase = mockCases.find((item) => item.id === options.caseId);
  if (!auditCase) {
    throw new Error(`Unknown caseId: ${options.caseId}`);
  }

  const documents = mockDocuments.filter((doc) => doc.caseId === options.caseId);
  if (documents.length === 0) {
    throw new Error(`No mock documents found for caseId: ${options.caseId}`);
  }

  const startedAt = new Date().toISOString();
  const tokenUsage: TokenUsage[] = [];

  const report = (currentAgent: AgentName | null) => {
    options.onProgress?.({ currentAgent });
  };

  report("reader");
  const reader = await runReader({ auditCase, documents });
  tokenUsage.push(reader.usage);

  report("compliance");
  const compliance = await runCompliance({
    auditCase,
    documents,
    reader: reader.output,
  });
  tokenUsage.push(compliance.usage);

  report("cross-reference");
  const crossReference = await runCrossReference({
    auditCase,
    documents,
    reader: reader.output,
    compliance: compliance.output,
  });
  tokenUsage.push(crossReference.usage);

  report("remediation");
  const remediation = await runRemediation({
    auditCase,
    compliance: compliance.output,
    crossReference: crossReference.output,
  });
  tokenUsage.push(remediation.usage);

  report("narrator");
  const narrator = await runNarrator({
    auditCase,
    reader: reader.output,
    compliance: compliance.output,
    crossReference: crossReference.output,
    remediation: remediation.output,
  });
  tokenUsage.push(narrator.usage);

  report(null);

  const result = {
    caseId: options.caseId,
    startedAt,
    finishedAt: new Date().toISOString(),
    documentIds: documents.map((doc) => doc.id),
    tokenUsage,
    reader: reader.output,
    compliance: compliance.output,
    crossReference: crossReference.output,
    remediation: remediation.output,
    narrator: narrator.output,
  };

  const parsed = auditRunResultSchema.safeParse(result);
  if (!parsed.success) {
    throw new AgentParseError("narrator", parsed.error.message);
  }

  return parsed.data;
}

export { AgentParseError, MissingApiKeyError };
