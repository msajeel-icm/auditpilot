import { NextResponse } from "next/server";
import { z } from "zod";

import {
  AgentParseError,
  MissingApiKeyError,
  runAuditPipeline,
} from "@/lib/agents/orchestrator";

export const runtime = "nodejs";
export const maxDuration = 300;

const requestSchema = z.object({
  caseId: z.string().min(1),
});

export async function POST(request: Request) {
  if (!process.env.DEEPSEEK_API_KEY) {
    return NextResponse.json(
      {
        error: "DeepSeek API key is not configured",
        code: "MISSING_DEEPSEEK_API_KEY",
        message:
          "Set DEEPSEEK_API_KEY in the server environment to run the audit pipeline.",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "INVALID_JSON" },
      { status: 400 },
    );
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request",
        code: "INVALID_REQUEST",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const result = await runAuditPipeline({ caseId: parsed.data.caseId });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof MissingApiKeyError) {
      return NextResponse.json(
        {
          error: "DeepSeek API key is not configured",
          code: "MISSING_DEEPSEEK_API_KEY",
          message:
            "Set DEEPSEEK_API_KEY in the server environment to run the audit pipeline.",
        },
        { status: 503 },
      );
    }

    if (error instanceof AgentParseError) {
      return NextResponse.json(
        {
          error: "Agent output failed schema validation",
          code: "AGENT_PARSE_ERROR",
          agent: error.agent,
          message: error.message,
        },
        { status: 502 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Unknown orchestration error";

    if (message.startsWith("Unknown caseId")) {
      return NextResponse.json(
        { error: message, code: "UNKNOWN_CASE" },
        { status: 404 },
      );
    }

    console.info(
      `[audit-run] error=${error instanceof Error ? error.name : "unknown"}`,
    );

    return NextResponse.json(
      {
        error: "Audit pipeline failed",
        code: "PIPELINE_ERROR",
        message,
      },
      { status: 500 },
    );
  }
}
