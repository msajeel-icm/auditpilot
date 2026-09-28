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

export type OrchestratorStepEvent = {
  agent: AgentName;
  status: "start" | "done" | "error";
  partial?: unknown;
  message?: string;
};

export type RunAuditOptions = {
  caseId: string;
  /** Fired before each agent starts (legacy). Prefer onEvent for start/done/error. */
  onProgress?: (progress: OrchestratorProgress) => void;
  onEvent?: (event: OrchestratorStepEvent) => void;
};

async function runAgentStep<TOutput>(
  agent: AgentName,
  options: RunAuditOptions,
  fn: () => Promise<{ output: TOutput; usage: TokenUsage }>,
): Promise<{ output: TOutput; usage: TokenUsage }> {
  options.onProgress?.({ currentAgent: agent });
  options.onEvent?.({ agent, status: "start" });
  try {
    const result = await fn();
    options.onEvent?.({
      agent,
      status: "done",
      partial: result.output,
    });
    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown agent error";
    options.onEvent?.({ agent, status: "error", message });
    throw error;
  }
}

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

  const reader = await runAgentStep("reader", options, () =>
    runReader({ auditCase, documents }),
  );
  tokenUsage.push(reader.usage);

  const compliance = await runAgentStep("compliance", options, () =>
    runCompliance({
      auditCase,
      documents,
      reader: reader.output,
    }),
  );
  tokenUsage.push(compliance.usage);

  const crossReference = await runAgentStep("cross-reference", options, () =>
    runCrossReference({
      auditCase,
      documents,
      reader: reader.output,
      compliance: compliance.output,
    }),
  );
  tokenUsage.push(crossReference.usage);

  const remediation = await runAgentStep("remediation", options, () =>
    runRemediation({
      auditCase,
      compliance: compliance.output,
      crossReference: crossReference.output,
    }),
  );
  tokenUsage.push(remediation.usage);

  const narrator = await runAgentStep("narrator", options, () =>
    runNarrator({
      auditCase,
      reader: reader.output,
      compliance: compliance.output,
      crossReference: crossReference.output,
      remediation: remediation.output,
    }),
  );
  tokenUsage.push(narrator.usage);

  options.onProgress?.({ currentAgent: null });

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
