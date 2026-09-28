import { chunkText, generateAgentObject, type TokenUsage } from "@/lib/agents/deepseek";
import { readerOutputSchema, type ReaderOutput } from "@/lib/agents/schemas";
import type { AuditCase, MockDocument } from "@/lib/types";

export const READER_SYSTEM_PROMPT = `You are Reader, the first agent in AuditPilot for Medicaid audit prep in IDD/LTC (adjacent to iCareManager).
Read the provided fictional case documents carefully. Extract key facts, documentation gaps, and risk signals.
Return structured JSON only. Do not invent real PHI; treat all names as fictional demo data.
No tool/function calls.`;

export async function runReader(input: {
  auditCase: AuditCase;
  documents: MockDocument[];
}): Promise<{ output: ReaderOutput; usage: TokenUsage }> {
  const docBlocks = input.documents
    .map((doc) => {
      const body = chunkText(doc.body).join("\n\n[continued]\n\n");
      return [
        `Document ID: ${doc.id}`,
        `Title: ${doc.title}`,
        `Type: ${doc.docType}`,
        `Status: ${doc.status}`,
        `Risk: ${doc.risk}`,
        `Updated: ${doc.updatedAt}`,
        `Excerpt: ${doc.excerpt}`,
        `Body:\n${body}`,
      ].join("\n");
    })
    .join("\n\n---\n\n");

  const prompt = [
    `Case ID: ${input.auditCase.id}`,
    `Case name: ${input.auditCase.name}`,
    `Program: ${input.auditCase.program}`,
    `Review period: ${input.auditCase.reviewPeriod}`,
    `Case status: ${input.auditCase.status}`,
    `Case risk: ${input.auditCase.risk}`,
    `Case description: ${input.auditCase.description}`,
    "",
    "Documents:",
    docBlocks,
    "",
    "Produce one finding object per document. Include overall readiness notes for the packet.",
  ].join("\n");

  const { object, usage } = await generateAgentObject({
    agent: "reader",
    schema: readerOutputSchema,
    system: READER_SYSTEM_PROMPT,
    prompt,
  });

  return { output: object, usage };
}
