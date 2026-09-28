import { generateAgentObject, type TokenUsage } from "@/lib/agents/deepseek";
import {
  remediationOutputSchema,
  type ComplianceOutput,
  type CrossReferenceOutput,
  type RemediationOutput,
} from "@/lib/agents/schemas";
import type { AuditCase } from "@/lib/types";

export const REMEDIATION_SYSTEM_PROMPT = `You are Remediation, the fourth AuditPilot agent for Medicaid IDD/LTC audit prep.
Turn Compliance issues and Cross-Reference gaps into prioritized, actionable remediation steps with owners and acceptance criteria.
Return structured JSON only. Priorities must be p0|p1|p2. No tool/function calls.`;

export async function runRemediation(input: {
  auditCase: AuditCase;
  compliance: ComplianceOutput;
  crossReference: CrossReferenceOutput;
}): Promise<{ output: RemediationOutput; usage: TokenUsage }> {
  const prompt = [
    `Case ID: ${input.auditCase.id}`,
    `Program: ${input.auditCase.program}`,
    `Compliance: ${JSON.stringify(input.compliance)}`,
    `Cross-reference: ${JSON.stringify(input.crossReference)}`,
    "Produce remediation actions, quick wins, and estimated effort in days.",
  ].join("\n\n");

  const { object, usage } = await generateAgentObject({
    agent: "remediation",
    schema: remediationOutputSchema,
    system: REMEDIATION_SYSTEM_PROMPT,
    prompt,
  });

  return { output: object, usage };
}
