# AI integration

The AI bar lets users type natural-language queries ("show failed refunds over £200, sorted by amount") and have them automatically translated into grid state changes (sorts, filters, grouping).

The grid never calls an LLM directly. It POSTs to an endpoint you control, so your API key never reaches the browser.

---

## Enabling the AI bar

Pass an `ai` prop with your endpoint URL:

```tsx
<DataGrid
  ai={{
    endpoint: '/api/grid-ai',
    placeholder: 'e.g. "show failed refunds over £200, sorted by amount"',
  }}
  ...
/>
```

The bar appears above the table. After the user submits a query, a one-sentence explanation is shown below the input. A "Clear" button resets all sorts, filters, and grouping.

---

## What the grid sends

```json
{
  "prompt": "show failed refunds over £200 sorted by amount",
  "columns": [
    { "id": "status", "header": "Status", "filterType": "select" },
    { "id": "type",   "header": "Type",   "filterType": "select" },
    { "id": "amount", "header": "Amount", "filterType": "number" }
  ],
  "currentState": {
    "sorts": [],
    "filters": [],
    "grouping": []
  }
}
```

The `columns` array includes only the columns defined in your `columns` prop, with their `id`, `header`, and `filterType`. This lets the LLM know what fields are available and what operators are valid.

---

## What your endpoint must return

```json
{
  "sorts":   [{ "columnId": "amount", "direction": "asc" }],
  "filters": [
    { "columnId": "status", "operator": "eq", "value": "failed"  },
    { "columnId": "type",   "operator": "eq", "value": "refund"  },
    { "columnId": "amount", "operator": "gt", "value": 200       }
  ],
  "grouping":     [],
  "reset":        false,
  "explanation":  "Showing failed refunds over £200, sorted by amount ascending."
}
```

Fields:

| Field | Required | Description |
|-------|----------|-------------|
| `sorts` | No | Replace the current sort stack |
| `filters` | No | Replace all active filters |
| `grouping` | No | Replace the current grouping |
| `reset` | No | If `true`, clears all sorts, filters, and grouping first |
| `explanation` | Yes | Displayed below the AI bar |

Omit `sorts`, `filters`, or `grouping` if you don't want to change them.

---

## The built-in server handler

The `server/` directory ships a framework-agnostic handler and LLM provider adapters. Import `handleGridAiRequest` in your backend:

### Express

```ts
import express from 'express'
import { handleGridAiRequest } from 'yk-grid/server/gridAiRoute'

const app = express()
app.use(express.json())

app.post('/api/grid-ai', async (req, res) => {
  try {
    const result = await handleGridAiRequest(req.body)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'AI request failed' })
  }
})
```

### Next.js App Router

```ts
// app/api/grid-ai/route.ts
import { handleGridAiRequest } from 'yk-grid/server/gridAiRoute'

export async function POST(req: Request) {
  const body = await req.json()
  const result = await handleGridAiRequest(body)
  return Response.json(result)
}
```

---

## LLM providers

The handler defaults to Anthropic. Set `LLM_PROVIDER=openai` to switch to OpenAI.

| Provider | Env var | Default model |
|----------|---------|---------------|
| Anthropic | `ANTHROPIC_API_KEY` | `claude-haiku-4-5-20251001` |
| OpenAI | `OPENAI_API_KEY` | `gpt-4o-mini` |

Set the relevant API key in your environment (or `.env.local` for local dev):

```bash
ANTHROPIC_API_KEY=sk-ant-...
# or
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

During development with `npm run dev:example`, set the key in `example/.env.local`. The Vite config loads env vars from both the project root and the `example/` directory.

---

## Writing your own handler

You can skip the built-in handler entirely and call any LLM or run any logic you want. The only contract is the request/response shape above.

```ts
// Your own endpoint — any framework, any LLM
app.post('/api/grid-ai', async (req, res) => {
  const { prompt, columns, currentState } = req.body

  const response = await myLlm.complete({
    system: buildSystemPrompt(columns),
    user: prompt,
  })

  // Parse and return the JSON
  res.json(JSON.parse(response))
})
```

---

## System prompt sent to the LLM

The built-in handler sends a system prompt that describes:

1. The column IDs, headers, and filter types available
2. The exact JSON response format required
3. Operator constraints per filter type (e.g. `select` columns must use `eq` or `in`)
4. Instructions to only reference existing column IDs

The LLM is instructed to return raw JSON only (no markdown fences, no prose outside the object). The handler strips accidental code fences if the model adds them anyway.

---

## Security

- Your API key stays on the server — it is never included in the request the grid sends.
- `handleGridAiRequest` only accepts `POST` bodies with a `prompt` string and a `columns` array. Unexpected fields are ignored.
- The handler validates that `prompt` and `columns` are present and throws if they are missing.
- Column IDs in the LLM response are validated against the `knownColumnIds` set before being applied to state — the grid silently ignores any column ID the LLM invents.

---

## UX behaviour

- After a successful query, the explanation text appears below the bar.
- Clicking **Clear** (or the × icon) dispatches `RESET`, which clears all sorts, filters, and grouping and removes the explanation text.
- If the fetch fails, no state changes are applied and the error is surfaced in the UI.
- The input is disabled while a request is in-flight.

## AI questions
### Why is endpoint needed in the component props (if I want to use ai)
What's "built in" is the handler (`handleGridAiRequest`), not the route. The library ships the logic, but it deliberately does not — and cannot — own the URL. The consumer decides where to mount it: `/api/grid-ai`, `/api/v2/grid/ai`, a different origin entirely, a Lambda URL, whatever their backend topology dictates. So the client genuinely needs to be told where to POST, and that's exactly what `endpoint` is.
The mental separation that resolves your discomfort:

* `endpoint` is transport config, not AI config. It answers "where do I send the request," not "which AI runs." The provider choice lives entirely server-side (env var or injected `LlmProvider`). The prop isn't leaking the AI implementation into the client — the client stays completely provider-agnostic, which is the property you actually want.
* The handler is reusable; the URL is per-app. Two apps using your library will share the identical handler but mount it at different paths. A prop is the right place for something that varies per consumer.

