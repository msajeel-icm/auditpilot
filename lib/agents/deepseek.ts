import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import type { z } from "zod";

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

export async function generateAgentObject<TSchema extends z.ZodType>(options: {
  agent: AgentName;
  schema: TSchema;
  system: string;
  prompt: string;
}): Promise<{ object: z.infer<TSchema>; usage: TokenUsage }> {
  const model = getDeepSeekModel();

  const first = await generateObject({
    model,
    schema: options.schema,
    system: options.system,
    prompt: options.prompt,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  });

  let usage: TokenUsage = {
    agent: options.agent,
    inputTokens: first.usage.inputTokens ?? 0,
    outputTokens: first.usage.outputTokens ?? 0,
    totalTokens: first.usage.totalTokens ?? 0,
  };
  logTokenUsage(usage);

  let parsed = options.schema.safeParse(first.object);
  if (parsed.success) {
    return { object: parsed.data, usage };
  }

  const repairPrompt = [
    "Your previous JSON failed validation. Return corrected JSON only that matches the schema.",
    `Validation issues: ${parsed.error.message}`,
    `Previous JSON: ${JSON.stringify(first.object)}`,
    "Original task:",
    options.prompt,
  ].join("\n\n");

  const repaired = await generateObject({
    model,
    schema: options.schema,
    system: options.system,
    prompt: repairPrompt,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  });

  usage = {
    agent: options.agent,
    inputTokens: usage.inputTokens + (repaired.usage.inputTokens ?? 0),
    outputTokens: usage.outputTokens + (repaired.usage.outputTokens ?? 0),
    totalTokens: usage.totalTokens + (repaired.usage.totalTokens ?? 0),
  };
  logTokenUsage(usage);

  parsed = options.schema.safeParse(repaired.object);
  if (!parsed.success) {
    throw new AgentParseError(options.agent, parsed.error.message);
  }

  return { object: parsed.data, usage };
}
