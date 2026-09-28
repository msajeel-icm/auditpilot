# AuditPilot agents

Pipeline order: **Reader → Compliance → Cross-Reference → Remediation → Narrator**.

Provider: DeepSeek via OpenAI-compatible client (`https://api.deepseek.com`, model `deepseek-chat`). Key: `process.env.DEEPSEEK_API_KEY` only. Structured JSON through Vercel AI SDK `generateObject` + Zod. On `.safeParse()` failure each agent retries **once** with a repair prompt, then throws `AgentParseError`. Max **8k** output tokens per call. Token counts are logged; prompts/completions/keys are not.

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

`POST /api/audit/run` with `{ "caseId": "<id>" }`.

- `200` — full `AuditRunResult` JSON
- `503` — missing `DEEPSEEK_API_KEY` (message only; key never echoed)
- `404` — unknown case
- `502` — agent parse failure after repair
- `400` — bad body

## Local checks

```bash
# no key → 503
curl -s -o /tmp/out.json -w "%{http_code}" -X POST http://localhost:3000/api/audit/run \
  -H 'content-type: application/json' \
  -d '{"caseId":"case-riverbend-2026"}'
# expect 503

# with key → valid JSON for a case (Riverbend has 3 of 6 docs; Harbor 2; Meadow 1)
DEEPSEEK_API_KEY=*** pnpm dev
curl -s -X POST http://localhost:3000/api/audit/run \
  -H 'content-type: application/json' \
  -d '{"caseId":"case-riverbend-2026"}' | jq 'keys'
```

To cover all 6 mock docs, run once per case id (`case-riverbend-2026`, `case-harbor-2026`, `case-meadow-2026`) or call `runAuditPipeline` for each.
