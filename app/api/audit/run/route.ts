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

function missingKeyResponse() {
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

function pipelineErrorPayload(error: unknown): {
  status: number;
  body: Record<string, unknown>;
} {
  if (error instanceof MissingApiKeyError) {
    return {
      status: 503,
      body: {
        error: "DeepSeek API key is not configured",
        code: "MISSING_DEEPSEEK_API_KEY",
        message:
          "Set DEEPSEEK_API_KEY in the server environment to run the audit pipeline.",
      },
    };
  }

  if (error instanceof AgentParseError) {
    return {
      status: 502,
      body: {
        error: "Agent output failed schema validation",
        code: "AGENT_PARSE_ERROR",
        agent: error.agent,
        message: error.message,
      },
    };
  }

  const message =
    error instanceof Error ? error.message : "Unknown orchestration error";

  if (message.startsWith("Unknown caseId")) {
    return {
      status: 404,
      body: { error: message, code: "UNKNOWN_CASE" },
    };
  }

  return {
    status: 500,
    body: {
      error: "Audit pipeline failed",
      code: "PIPELINE_ERROR",
      message,
    },
  };
}

function wantsStream(request: Request): boolean {
  return new URL(request.url).searchParams.get("stream") === "1";
}

export async function POST(request: Request) {
  // Always gate missing key with JSON 503 — even when ?stream=1.
  if (!process.env.DEEPSEEK_API_KEY) {
    return missingKeyResponse();
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

  const { caseId } = parsed.data;

  if (!wantsStream(request)) {
    try {
      const result = await runAuditPipeline({ caseId });
      return NextResponse.json(result);
    } catch (error) {
      const { status, body: errorBody } = pipelineErrorPayload(error);
      if (status >= 500 && status !== 503) {
        console.info(
          `[audit-run] error=${error instanceof Error ? error.name : "unknown"}`,
        );
      }
      return NextResponse.json(errorBody, { status });
    }
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(obj)}\n\n`),
        );
      };

      try {
        const result = await runAuditPipeline({
          caseId,
          onEvent: (e) => send({ type: "step", ...e }),
        });
        send({ type: "result", result });
      } catch (error) {
        const { body: errorBody } = pipelineErrorPayload(error);
        const code =
          typeof errorBody.code === "string"
            ? errorBody.code
            : "PIPELINE_ERROR";
        const message =
          typeof errorBody.message === "string"
            ? errorBody.message
            : typeof errorBody.error === "string"
              ? errorBody.error
              : "Audit pipeline failed";
        const agent =
          typeof errorBody.agent === "string" ? errorBody.agent : undefined;

        send({
          type: "error",
          code,
          message,
          ...(agent ? { agent } : {}),
        });

        if (
          !(error instanceof MissingApiKeyError) &&
          !(error instanceof AgentParseError)
        ) {
          console.info(
            `[audit-run] stream error=${error instanceof Error ? error.name : "unknown"}`,
          );
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
