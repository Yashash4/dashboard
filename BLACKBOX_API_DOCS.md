# Blackbox AI API — Complete Reference

## Overview
Blackbox AI is an AI API gateway/router that provides access to **500+ models** from 50+ providers (OpenAI, Anthropic, Google, Meta, Mistral, DeepSeek, xAI, Qwen, etc.) through a single **OpenAI-compatible API**.

---

## Authentication

- **API Key Format**: `bb_xxxxxxxxxxxxxxxxxxxxxx`
- **Header**: `Authorization: Bearer YOUR_API_KEY`
- **Get key from**: `https://app.blackbox.ai/dashboard` (Profile > BLACKBOX API Token)
- For multi-agent tasks: `https://cloud.blackbox.ai` (Profile > BLACKBOX API Token)

---

## Base URLs

| Type | URL |
|------|-----|
| Standard | `https://api.blackbox.ai` |
| Enterprise | `https://enterprise.blackbox.ai` |
| Cloud (Tasks) | `https://cloud.blackbox.ai` |

---

## Core Endpoint: Chat Completions

```
POST https://api.blackbox.ai/chat/completions
```

Also works at: `POST https://api.blackbox.ai/v1/chat/completions`

### Request Parameters

**Required:**
- `model` (string) — Model ID (e.g. `deepseek/deepseek-chat:free`)
- `messages` (array) — `[{role, content, name?, tool_call_id?}]`

**Response Control:**
- `stream` (boolean) — SSE streaming
- `max_tokens` (integer) — 1 to context_length
- `stop` (array) — Stop sequences

**Sampling:**
- `temperature` (0–2, default 1.0)
- `top_p` (0–1, default 1.0)
- `top_k` (1–Infinity)
- `top_a` (0–1)
- `min_p` (0–1)
- `frequency_penalty` (-2 to 2)
- `presence_penalty` (-2 to 2)
- `repetition_penalty` (0–2)
- `seed` (integer)

**Advanced:**
- `tools` (array) — OpenAI-format function definitions
- `tool_choice` — `none | auto | required | {specific}`
- `response_format` — `{"type": "json_object"}` for structured output
- `models` (array) — Fallback model list
- `provider` (object) — Provider routing preferences
- `user` (string) — End-user ID for abuse tracking
- `reasoning` (object) — Extended thinking control

### Response Structure

```json
{
  "id": "gen-...",
  "created": 1757140020,
  "model": "deepseek/deepseek-chat",
  "object": "chat.completion",
  "provider": "DeepSeek",
  "choices": [{
    "finish_reason": "stop",  // stop | length | content_filter | tool_calls | error
    "index": 0,
    "message": {
      "content": "...",
      "role": "assistant",
      "reasoning": null,
      "reasoning_details": null,
      "tool_calls": null,
      "annotations": null
    }
  }],
  "usage": {
    "prompt_tokens": 14,
    "completion_tokens": 7,
    "total_tokens": 21,
    "completion_tokens_details": {
      "reasoning_tokens": 0,
      "audio_tokens": null,
      "accepted_prediction_tokens": null,
      "rejected_prediction_tokens": null
    },
    "prompt_tokens_details": {
      "audio_tokens": 0,
      "cached_tokens": 0
    }
  }
}
```

**KEY INSIGHT: The `usage` object in every response gives us `prompt_tokens`, `completion_tokens`, and `total_tokens`. This is how we track per-request usage.**

---

## What Data Can We Get From the API

### Per-Request (from response):
- `prompt_tokens` — input tokens used
- `completion_tokens` — output tokens generated
- `total_tokens` — total
- `reasoning_tokens` — if reasoning was used
- `cached_tokens` — if caching was used
- `model` — which model was used
- `provider` — which provider served it
- `finish_reason` — why it stopped

### What We CANNOT Get From the API:
- **NO endpoint to check credit balance**
- **NO endpoint to check total usage history**
- **NO endpoint to check credits remaining**
- **NO billing/account API**
- Credits/balance can only be checked via the dashboard at `https://www.blackbox.ai/dashboard/credits`
- **We must track usage ourselves** by logging every response's `usage` object

---

## Credit System

- Credits are allocated with subscription, refresh each billing period
- Free tier: limited monthly credits, ~5-10 advanced queries/day
- DeepSeek V3 and R1 models: **completely free, don't consume credits**
- API access: billed separately per token (like OpenAI pricing model)
- One-time credit purchases available
- Auto-replenishment at customizable thresholds
- Monitor via Settings tab in dashboard

### Blackbox Plans (approximate):
| Plan | Price | Details |
|------|-------|---------|
| Free | $0 | Limited credits, basic models, small context |
| Pro | ~$10-20/mo | All 300+ models, MCP support |
| Pro Plus | Higher | 3000 code gens/mo, direct API, $20 monthly credit |
| Enterprise | Custom | SSO, dedicated support, generous credits |

---

## Pricing Per Model (Per Million Tokens)

### FREE Models (47+ models, $0 cost):
| Model | ID | Context |
|-------|-----|---------|
| DeepSeek V3 | `deepseek/deepseek-chat:free` | 163K |
| DeepSeek R1 | `deepseek/deepseek-r1:free` | 163K |
| DeepSeek R1 0528 | `deepseek/deepseek-r1-0528:free` | 163K |
| Gemini 2.0 Flash Exp | `google/gemini-2.0-flash-exp:free` | 1M |
| Gemini 2.5 Pro Exp | `google/gemini-2.5-pro-exp-03-25` | 1M |
| Llama 4 Maverick | `meta-llama/llama-4-maverick:free` | 128K |
| Llama 4 Scout | `meta-llama/llama-4-scout:free` | 64K |
| Llama 3.3 70B | `meta-llama/llama-3.3-70b-instruct:free` | 131K |
| Qwen3 235B | `qwen/qwen3-235b-a22b:free` | 40K |
| Qwen3 32B | `qwen/qwen3-32b:free` | 40K |
| Kimi Dev 72B | `moonshotai/kimi-dev-72b:free` | 131K |
| Grok Code Fast 1 | `x-ai/grok-code-fast-1:free` | 256K |
| Mistral Nemo | `mistralai/mistral-nemo:free` | 131K |
| Gemma 3 27B | `google/gemma-3-27b-it:free` | 96K |
| + 33 more free models | ... | ... |

### Budget Paid Models (Input/Output per 1M tokens):
| Model | ID | Input | Output | Context |
|-------|-----|-------|--------|---------|
| GPT-4o-mini | `openai/gpt-4o-mini` | $0.15 | $0.60 | 128K |
| DeepSeek V3 (paid) | `deepseek/deepseek-chat` | $0.38 | $0.89 | 163K |
| DeepSeek R1 (paid) | `deepseek/deepseek-r1` | $0.45 | $2.15 | 128K |
| Gemini 2.0 Flash | `google/gemini-2.0-flash-001` | $0.10 | $0.40 | 1M |
| Gemini 2.5 Flash | `google/gemini-2.5-flash` | $0.30 | $2.50 | 1M |
| Llama 3.1 70B | `meta-llama/llama-3.1-70b-instruct` | $0.10 | $0.28 | 131K |

### Premium Models:
| Model | ID | Input | Output | Context |
|-------|-----|-------|--------|---------|
| Claude Sonnet 4.5 | `anthropic/claude-sonnet-4.5` | $3.00 | $15.00 | 200K |
| Claude Opus 4.5 | `anthropic/claude-opus-4.5` | $5.00 | $25.00 | 200K |
| GPT-4o | `openai/gpt-4o` | $2.50 | $10.00 | 128K |
| GPT-5.2 | `openai/gpt-5.2` | $1.75 | $14.00 | 400K |
| Gemini 2.5 Pro | `google/gemini-2.5-pro` | $1.25 | $10.00 | 1M |
| Grok 3 | `x-ai/grok-3` | $3.00 | $15.00 | 131K |
| o1-pro | `openai/o1-pro` | $150.00 | $600.00 | 200K |

---

## Special Endpoints

### Web Search
```
POST /chat/completions (or /v1/chat/completions)
model: "blackbox-search"
```
- Real-time web search + AI response
- Returns `annotations` array with citations (url, title, content)
- Pricing: Input $0.0002/1K, Output $0.0005/1K, Search $0.03/query

### Image Generation
```
POST /chat/completions
model: "flux-pro"
```
- Response contains image URL in `choices[0].message.content`

### Video Generation
```
POST /chat/completions
model: "veo-2"
```
- Response contains video URL in `choices[0].message.content`

---

## Multi-Agent Tasks

```
POST https://cloud.blackbox.ai/api/tasks
```

Run 2-5 AI agents in parallel on the same task (code tasks with GitHub repos).

**Available Agents**: Claude, Blackbox, Codex, Gemini

**Check Status:**
```
GET https://cloud.blackbox.ai/api/tasks/{taskId}
```

**Stream Logs:**
```
GET https://cloud.blackbox.ai/api/tasks/{taskId}/stream
```
- SSE events: connected, log, status, complete, error
- Optional params: `fromIndex`, `includeStatus`

---

## GitHub Orgs
```
GET https://cloud.blackbox.ai/api/github/orgs
```
Returns array of `{login, name, avatar_url}` for connected GitHub orgs.

---

## Tool Calling

OpenAI-compatible function calling. 3-step process:
1. Send prompt + `tools` array with function definitions
2. Model returns `tool_calls` with function name + arguments
3. Send tool results back with `role: "tool"` + `tool_call_id`

Supports: `tool_choice` (none/auto/required/specific), `parallel_tool_calls`, reasoning between tool calls.

---

## Reasoning (Extended Thinking)

```json
"reasoning": {
  "effort": "high",        // minimal | low | medium | high | xhigh | none
  "max_tokens": 2000,      // for Anthropic/Gemini
  "exclude": false,         // internal-only reasoning
  "enabled": true
}
```

Reasoning tokens billed as output tokens. Visible in `usage.completion_tokens_details.reasoning_tokens`.

---

## Provider Routing

Control which provider serves your request:

**Prefix shorthand**: `bedrock/claude-sonnet-4.5`, `together/llama-3.1-70b`

**Provider object**:
```json
"provider": {
  "sort": "price",           // price | throughput | latency
  "order": ["together", "deepinfra"],
  "only": ["anthropic"],
  "ignore": ["azure"],
  "allow_fallbacks": true,
  "data_collection": "deny",
  "quantizations": ["fp16"],
  "preferred_min_throughput": 50,
  "preferred_max_latency": 2.0
}
```

---

## Error Codes

| Code | Type | Description |
|------|------|-------------|
| 400 | Bad Request | Invalid/missing params |
| 401 | Unauthorized | Invalid/expired API key |
| 402 | Insufficient Credits | Account has no credits |
| 403 | Moderation | Content flagged |
| 408 | Timeout | Request timed out |
| 429 | Rate Limited | Too many requests |
| 502 | Model Down | Model unavailable |
| 503 | No Provider | No provider available |

---

## SDK Compatibility

Blackbox is **OpenAI SDK compatible**. Just change the base URL:

**Python:**
```python
from openai import OpenAI
client = OpenAI(
    api_key="bb_xxx",
    base_url="https://api.blackbox.ai/v1"
)
```

**JavaScript:**
```javascript
import OpenAI from "openai";
const client = new OpenAI({
    apiKey: "bb_xxx",
    baseURL: "https://api.blackbox.ai/v1"
});
```

---

## Key Takeaways for Our SaaS

1. **Usage tracking must be self-built** — No API endpoint to check credits/balance. We must log every response's `usage` object ourselves.
2. **47+ free models available** — DeepSeek V3, R1, Gemini Flash, Llama 4, Qwen3, Kimi — these cost us $0 to serve.
3. **Per-token pricing** on paid models — We need to track tokens and calculate cost per user.
4. **Rate limiting is our responsibility** — Blackbox has its own rate limits (429 errors), but per-customer rate limiting is on us.
5. **OpenAI-compatible** — Any OpenClaw config that works with OpenAI will work with Blackbox by just changing base URL + key.
6. **The `402 Insufficient Credits` error** is the only programmatic way to detect we're out of credits.
7. **Provider routing** lets us optimize for cost/speed per customer tier.
