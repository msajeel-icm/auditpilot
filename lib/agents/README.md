# AuditPilot agents

Pipeline order: **Reader → Compliance → Cross-Reference → Remediation → Narrator**.

Provider: DeepSeek via OpenAI-compatible client (`https://api.deepseek.com`, model `deepseek-chat`). Key: `process.env.DEEPSEEK_API_KEY` only.

**Structured output:** Do **not** use AI SDK `generateObject` / provider `response_format` / `json_schema` (DeepSeek currently rejects that mode with `This response_format type is unavailable now`). Instead `generateAgentObject` uses `generateText` with JSON-only system instructions (optional JSON Schema hint via Zod `toJSONSchema` when available), extracts a JSON object from the text (handles optional ` ```json ` fences), then `schema.safeParse()`. On extract/parse failure each agent retries **once** with a repair prompt (validation issues + previous JSON + original task), then throws `AgentParseError`. Max **8k** output tokens per call. Token counts are logged; prompts/completions/keys are not.

## Agents

| Agent | Input | Output schema | Rough token cost |
|-------|--------|---------------|------------------|
| Reader | Case metadata + selected mock docs (chunked if long) | `readerOutputSchema` — per-doc findings, gaps, risk signals | ~2–4k in / ~1–3k out for a 2–3 doc case |
| Compliance | Case + doc inventory + Reader JSON | `complianceOutputSchema` — issues, compliant areas, residual risk | ~2–3k in / ~1–2k out |
| Cross-Reference | Case + docs + Reader + Compliance | `crossReferenceOutputSchema` — links, inconsistencies, missing supports | ~2–4k in / ~1–2k out |
| Remediation | Case + Compliance + Cross-Reference | `remediationOutputSchema` — prioritized actions, quick wins, effort days | ~2–3k in / ~1–2k out |
| Narrator | Case + all prior outputs | `narratorOutputSchema` — executive + auditor narrative | ~3–5k in / ~1–2k out |

Full-run envelope: `auditRunResultSchema` (includes `tokenUsage[]`).

## API

### One-shot JSON (default)

`POST /api/audit/run` with `{ "caseId": "<id>" }`.

- `200` — full `AuditRunResult` JSON
- `503` — missing `DEEPSEEK_API_KEY` (message only; key never echoed) — **always JSON**, even if `?stream=1`
- `404` — unknown case
- `502` — agent parse failure after repair
- `400` — bad body

### Progressive SSE stream (`?stream=1`)

`POST /api/audit/run?stream=1` with the same JSON body.

- Missing key / invalid JSON / bad `caseId` shape → **JSON error before the stream starts** (same status codes as above).
- On success path → `Content-Type: text/event-stream` with SSE `data:` lines (JSON payloads).

#### Stream event contract

Each SSE frame is `data: <json>\n\n` where `<json>` is one of:

**Per-agent step** (emitted by orchestrator `onEvent`):

```json
{
  "type": "step",
  "agent": "reader" | "compliance" | "cross-reference" | "remediation" | "narrator",
  "status": "start" | "done" | "error",
  "partial": {},
  "message": "optional human-readable error"
}
```

- `partial` is present on `status: "done"` (that agent’s Zod-validated output object).
- `message` is present on `status: "error"`.

**Final success:**

```json
{ "type": "result", "result": { /* AuditRunResult */ } }
```

**Pipeline failure mid-stream** (then stream closes):

```json
{
  "type": "error",
  "code": "AGENT_PARSE_ERROR" | "PIPELINE_ERROR" | "UNKNOWN_CASE" | "...",
  "message": "human-readable",
  "agent": "reader"
}
```

`agent` is optional (set for parse failures).

Zustand helper: `useAppStore.getState().applyStreamEvent(event)` updates `currentAgent`, `agentStatuses`, and calls through to complete/fail semantics without breaking existing `startRun` / `setRunProgress` / `completeRun` / `failRun` used by AgentRunner.

## Local checks

```bash
# no key → 503 JSON (works with or without ?stream=1)
curl -s -o /tmp/out.json -w "%{http_code}" -X POST \
  'http://localhost:3000/api/audit/run?stream=1' \
  -H 'content-type: application/json' \
  -d '{"caseId":"case-riverbend-2026"}'
# expect 503; body code MISSING_DEEPSEEK_API_KEY

# one-shot JSON with key
DEEPSEEK_API_KEY=*** pnpm dev
curl -s -X POST http://localhost:3000/api/audit/run \
  -H 'content-type: application/json' \
  -d '{"caseId":"case-riverbend-2026"}' | jq 'keys'

# SSE stream with key (prefer -N so curl does not buffer)
curl -N -X POST 'http://localhost:3000/api/audit/run?stream=1' \
  -H 'content-type: application/json' \
  -H 'accept: text/event-stream' \
  -d '{"caseId":"case-riverbend-2026"}'
# expect frames: data: {"type":"step",...} then data: {"type":"result",...}
```

To cover all 6 mock docs, run once per case id (`case-riverbend-2026`, `case-harbor-2026`, `case-meadow-2026`) or call `runAuditPipeline` for each.
