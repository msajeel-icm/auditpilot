import { generateAgentObject, type TokenUsage } from "@/lib/agents/deepseek";
import {
  complianceOutputSchema,
  type ComplianceOutput,
  type ReaderOutput,
} from "@/lib/agents/schemas";
import type { AuditCase, MockDocument } from "@/lib/types";

export const COMPLIANCE_SYSTEM_PROMPT = `You are Compliance, the second AuditPilot agent for Medicaid IDD/LTC audit prep.
Evaluate Reader findings against documentation completeness, service-plan alignment, medication/incident documentation, staff qualifications, and claims support.
Return structured JSON only. Severity must be low|medium|high. No tool/function calls.`;

export async function runCompliance(input: {
  auditCase: AuditCase;
  documents: MockDocument[];
  reader: ReaderOutput;
}): Promise<{ output: ComplianceOutput; usage: TokenUsage }> {
  const prompt = [
    `Case ID: ${input.auditCase.id}`,
    `Program: ${input.auditCase.program}`,
    `Document inventory: ${JSON.stringify(
      input.documents.map((d) => ({
        id: d.id,
        title: d.title,
        docType: d.docType,
        status: d.status,
        risk: d.risk,
      })),
    )}`,
    `Reader output: ${JSON.stringify(input.reader)}`,
    "Identify compliance issues with evidence, plus compliant areas and residual risk.",
  ].join("\n\n");

  const { object, usage } = await generateAgentObject({
    agent: "compliance",
    schema: complianceOutputSchema,
    system: COMPLIANCE_SYSTEM_PROMPT,
    prompt,
  });

  return { output: object, usage };
}
