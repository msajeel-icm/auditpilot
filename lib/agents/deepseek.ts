import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { z, type ZodType } from "zod";

import type { AgentName } from "@/lib/agents/schemas";

export const MAX_OUTPUT_TOKENS = 8000;
export const CHUNK_CHAR_LIMIT = 6000;

export class AgentParseError extends Error {
  readonly agent: AgentName;
  readonly issues: string;

  constructor(agent: AgentName, issues: string) {
    super(`Agent "${agent}" returned JSON that failed schema validation after one repair attempt.`);
    this.name = "AgentParseError";
    this.agent = agent;
    this.issues = issues;
  }
}

export class MissingApiKeyError extends Error {
  constructor() {
    super("DEEPSEEK_API_KEY is not configured on this environment.");
    this.name = "MissingApiKeyError";
  }
}

export type TokenUsage = {
  agent: AgentName;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export function assertApiKey(): string {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    throw new MissingApiKeyError();
  }
  return key;
}

export function getDeepSeekModel() {
  const apiKey = assertApiKey();
  const deepseek = createOpenAI({
    apiKey,
    baseURL: "https://api.deepseek.com",
    name: "deepseek",
  });
  return deepseek.chat("deepseek-chat");
}

export function chunkText(text: string, limit = CHUNK_CHAR_LIMIT): string[] {
  if (text.length <= limit) {
    return [text];
  }
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += limit) {
    chunks.push(text.slice(i, i + limit));
  }
  return chunks;
}

export function logTokenUsage(usage: TokenUsage): void {
  // Token counts only — never log prompts, completions, or API keys.
  console.info(
    `[audit-agent] agent=${usage.agent} inputTokens=${usage.inputTokens} outputTokens=${usage.outputTokens} totalTokens=${usage.totalTokens}`,
  );
}

const JSON_ONLY_INSTRUCTION =
  "Respond with a single JSON object only. No markdown fences if possible. No prose before or after the JSON.";

function schemaHint(schema: ZodType): string {
  try {
    const jsonSchema = z.toJSONSchema(schema);
    return `Return JSON matching this JSON Schema:\n${JSON.stringify(jsonSchema)}`;
  } catch {
    return "Return JSON matching the schema fields required by this agent.";
  }
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No JSON object in model response");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function buildSystemPrompt(system: string, schema: ZodType): string {
  return [system, JSON_ONLY_INSTRUCTION, schemaHint(schema)].join("\n\n");
}

function usageFromResult(
  agent: AgentName,
  usage: { inputTokens?: number | null; outputTokens?: number | null; totalTokens?: number | null },
  prior?: TokenUsage,
): TokenUsage {
  const inputTokens = (prior?.inputTokens ?? 0) + (usage.inputTokens ?? 0);
  const outputTokens = (prior?.outputTokens ?? 0) + (usage.outputTokens ?? 0);
  const totalTokens = (prior?.totalTokens ?? 0) + (usage.totalTokens ?? 0);
  return { agent, inputTokens, outputTokens, totalTokens };
}

export async function generateAgentObject<TSchema extends z.ZodType>(options: {
  agent: AgentName;
  schema: TSchema;
  system: string;
  prompt: string;
}): Promise<{ object: z.infer<TSchema>; usage: TokenUsage }> {
  const model = getDeepSeekModel();
  const system = buildSystemPrompt(options.system, options.schema);

  const first = await generateText({
    model,
    system,
    prompt: options.prompt,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  });

  let usage = usageFromResult(options.agent, first.usage);
  logTokenUsage(usage);

  let raw: unknown;
  let parseIssues: string | null = null;

  try {
    raw = extractJsonObject(first.text);
    const parsed = options.schema.safeParse(raw);
    if (parsed.success) {
      return { object: parsed.data, usage };
    }
    parseIssues = parsed.error.message;
  } catch (err) {
    parseIssues = err instanceof Error ? err.message : "Failed to extract JSON from model response";
    raw = first.text;
  }

  const previousJsonText =
    typeof raw === "string" ? raw : (() => {
      try {
        return JSON.stringify(raw);
      } catch {
        return String(raw);
      }
    })();

  const repairPrompt = [
    "Your previous JSON failed validation. Return corrected JSON only that matches the schema.",
    JSON_ONLY_INSTRUCTION,
    `Validation issues: ${parseIssues}`,
    `Previous JSON: ${previousJsonText}`,
    "Original task:",
    options.prompt,
  ].join("\n\n");

  const repaired = await generateText({
    model,
    system,
    prompt: repairPrompt,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  });

  usage = usageFromResult(options.agent, repaired.usage, usage);
  logTokenUsage(usage);

  try {
    const repairedRaw = extractJsonObject(repaired.text);
    const parsed = options.schema.safeParse(repairedRaw);
    if (!parsed.success) {
      throw new AgentParseError(options.agent, parsed.error.message);
    }
    return { object: parsed.data, usage };
  } catch (err) {
    if (err instanceof AgentParseError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : "Failed to extract JSON from repair response";
    throw new AgentParseError(options.agent, message);
  }
}
