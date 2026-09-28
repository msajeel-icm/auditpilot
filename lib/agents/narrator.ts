import { generateAgentObject, type TokenUsage } from "@/lib/agents/deepseek";
import {
  narratorOutputSchema,
  type ComplianceOutput,
  type CrossReferenceOutput,
  type NarratorOutput,
  type ReaderOutput,
  type RemediationOutput,
} from "@/lib/agents/schemas";
import type { AuditCase } from "@/lib/types";

export const NARRATOR_SYSTEM_PROMPT = `You are Narrator, the final AuditPilot agent for Medicaid IDD/LTC audit prep.
Write a clear executive summary and auditor-facing narrative from the prior agent outputs.
Be professional, concise, and concrete. Return structured JSON only. No tool/function calls.`;

export async function runNarrator(input: {
  auditCase: AuditCase;
  reader: ReaderOutput;
  compliance: ComplianceOutput;
  crossReference: CrossReferenceOutput;
  remediation: RemediationOutput;
}): Promise<{ output: NarratorOutput; usage: TokenUsage }> {
  const prompt = [
    `Case ID: ${input.auditCase.id}`,
    `Case name: ${input.auditCase.name}`,
    `Reader: ${JSON.stringify(input.reader)}`,
    `Compliance: ${JSON.stringify(input.compliance)}`,
    `Cross-reference: ${JSON.stringify(input.crossReference)}`,
    `Remediation: ${JSON.stringify(input.remediation)}`,
    "Produce executiveSummary, strengths, topRisks, recommendedNextSteps, and auditorFacingNarrative.",
  ].join("\n\n");

  const { object, usage } = await generateAgentObject({
    agent: "narrator",
    schema: narratorOutputSchema,
    system: NARRATOR_SYSTEM_PROMPT,
    prompt,
  });

  return { output: object, usage };
}
