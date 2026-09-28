import { generateAgentObject, type TokenUsage } from "@/lib/agents/deepseek";
import {
  crossReferenceOutputSchema,
  type ComplianceOutput,
  type CrossReferenceOutput,
  type ReaderOutput,
} from "@/lib/agents/schemas";
import type { AuditCase, MockDocument } from "@/lib/types";

export const CROSS_REFERENCE_SYSTEM_PROMPT = `You are Cross-Reference, the third AuditPilot agent for Medicaid IDD/LTC audit prep.
Compare documents against each other and against Compliance issues to find consistency or missing supports (ISP ↔ notes ↔ MAR ↔ incident ↔ training ↔ claim).
Return structured JSON only. No tool/function calls.`;

export async function runCrossReference(input: {
  auditCase: AuditCase;
  documents: MockDocument[];
  reader: ReaderOutput;
  compliance: ComplianceOutput;
}): Promise<{ output: CrossReferenceOutput; usage: TokenUsage }> {
  const prompt = [
    `Case ID: ${input.auditCase.id}`,
    `Documents: ${JSON.stringify(
      input.documents.map((d) => ({
        id: d.id,
        title: d.title,
        docType: d.docType,
        excerpt: d.excerpt,
      })),
    )}`,
    `Reader: ${JSON.stringify(input.reader)}`,
    `Compliance: ${JSON.stringify(input.compliance)}`,
    "Produce cross-document links, inconsistencies, and missing supports.",
  ].join("\n\n");

  const { object, usage } = await generateAgentObject({
    agent: "cross-reference",
    schema: crossReferenceOutputSchema,
    system: CROSS_REFERENCE_SYSTEM_PROMPT,
    prompt,
  });

  return { output: object, usage };
}
