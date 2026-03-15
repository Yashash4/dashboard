import Link from "next/link";

export default function DocsChatAPIPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Chat API</h1>
      <p className="lead text-lg text-muted-foreground">
        The Chat API lets you send messages to your deployed AI agents and receive responses
        programmatically. It supports both synchronous responses and real-time streaming via
        Server-Sent Events.
      </p>

      <h2>Endpoint</h2>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>POST /api/v1/chat</code></pre>

      <h2>Authentication</h2>
      <p>
        Requires a valid API key passed as a Bearer token. See the{" "}
        <Link href="/docs/api/auth" className="text-primary">Authentication</Link> docs for details.
      </p>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>Authorization: Bearer clw_your_api_key_here</code></pre>

      <h2>Request Parameters</h2>
      <div className="not-prose overflow-x-auto my-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-3 text-white">Parameter</th>
              <th className="text-left py-2 px-3 text-white">Type</th>
              <th className="text-left py-2 px-3 text-white">Required</th>
              <th className="text-left py-2 px-3 text-white">Description</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>message</code></td>
              <td className="py-2 px-3">string</td>
              <td className="py-2 px-3">Yes</td>
              <td className="py-2 px-3">The user message to send. Maximum size: 100KB.</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>agent</code></td>
              <td className="py-2 px-3">string</td>
              <td className="py-2 px-3">No</td>
              <td className="py-2 px-3">Slug or ID of the agent to handle the message. Defaults to the first deployed agent.</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>session_id</code></td>
              <td className="py-2 px-3">string</td>
              <td className="py-2 px-3">No</td>
              <td className="py-2 px-3">Alphanumeric identifier for conversation continuity. Max 128 characters. Messages with the same session_id share conversation history.</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>stream</code></td>
              <td className="py-2 px-3">boolean</td>
              <td className="py-2 px-3">No</td>
              <td className="py-2 px-3">Set to <code>true</code> to receive the response as a real-time SSE stream. Defaults to <code>false</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Standard Response</h2>
      <p>
        When <code>stream</code> is <code>false</code> (the default), the API returns a complete
        JSON response once the agent finishes generating:
      </p>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`{
  "response": "I can help you with that. Here's what you need to know...",
  "agent": "support-bot",
  "request_id": "req_abc123def456"
}`}</code></pre>

      <h2>Streaming Response</h2>
      <p>
        When <code>stream</code> is <code>true</code>, the API returns a <code>text/event-stream</code>{" "}
        response. Each chunk of the agent&apos;s response is sent as an SSE event:
      </p>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`data: {"content": "I can "}

data: {"content": "help you "}

data: {"content": "with that."}

data: [DONE]`}</code></pre>
      <p>
        The stream ends with <code>data: [DONE]</code> to signal completion. Concatenate all
        <code>content</code> values to reconstruct the full response.
      </p>

      <h2>Error Codes</h2>
      <div className="not-prose overflow-x-auto my-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-3 text-white">Status</th>
              <th className="text-left py-2 px-3 text-white">Code</th>
              <th className="text-left py-2 px-3 text-white">Description</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>400</code></td>
              <td className="py-2 px-3">BAD_REQUEST</td>
              <td className="py-2 px-3">Missing or invalid <code>message</code> parameter, or message exceeds 100KB</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>401</code></td>
              <td className="py-2 px-3">INVALID_KEY</td>
              <td className="py-2 px-3">API key is missing, malformed, or revoked</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>403</code></td>
              <td className="py-2 px-3">PLAN_REQUIRED</td>
              <td className="py-2 px-3">Account does not have an active Pro or Ultra plan</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>404</code></td>
              <td className="py-2 px-3">AGENT_NOT_FOUND</td>
              <td className="py-2 px-3">The specified agent slug or ID does not exist or is not deployed</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>429</code></td>
              <td className="py-2 px-3">RATE_LIMITED</td>
              <td className="py-2 px-3">Key has exceeded its requests-per-minute limit. Check the <code>Retry-After</code> header.</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>502</code></td>
              <td className="py-2 px-3">AGENT_ERROR</td>
              <td className="py-2 px-3">The agent encountered an internal error while processing the message</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>504</code></td>
              <td className="py-2 px-3">TIMEOUT</td>
              <td className="py-2 px-3">The agent did not respond within the timeout window (60 seconds)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Code Examples</h2>

      <h3>cURL &mdash; Standard Request</h3>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`curl -X POST https://app.clawhq.tech/api/v1/chat \\
  -H "Authorization: Bearer clw_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "What are your business hours?",
    "agent": "support-bot",
    "session_id": "user_12345"
  }'`}</code></pre>

      <h3>cURL &mdash; Streaming Request</h3>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`curl -X POST https://app.clawhq.tech/api/v1/chat \\
  -H "Authorization: Bearer clw_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -N \\
  -d '{
    "message": "Explain your return policy",
    "stream": true
  }'`}</code></pre>

      <h3>Python (requests)</h3>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`import requests

API_KEY = "clw_your_api_key_here"
BASE_URL = "https://app.clawhq.tech/api/v1"

# Standard request
response = requests.post(
    f"{BASE_URL}/chat",
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    },
    json={
        "message": "What are your business hours?",
        "agent": "support-bot",
        "session_id": "user_12345",
    },
)

data = response.json()
print(data["response"])

# Streaming request
response = requests.post(
    f"{BASE_URL}/chat",
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    },
    json={
        "message": "Explain your return policy",
        "stream": True,
    },
    stream=True,
)

for line in response.iter_lines():
    if line:
        text = line.decode("utf-8")
        if text.startswith("data: ") and text != "data: [DONE]":
            import json
            chunk = json.loads(text[6:])
            print(chunk["content"], end="", flush=True)`}</code></pre>

      <h3>JavaScript (fetch)</h3>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`const API_KEY = "clw_your_api_key_here";
const BASE_URL = "https://app.clawhq.tech/api/v1";

// Standard request
const response = await fetch(\`\${BASE_URL}/chat\`, {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    message: "What are your business hours?",
    agent: "support-bot",
    session_id: "user_12345",
  }),
});

const data = await response.json();
console.log(data.response);

// Streaming request
const stream = await fetch(\`\${BASE_URL}/chat\`, {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    message: "Explain your return policy",
    stream: true,
  }),
});

const reader = stream.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = decoder.decode(value);
  for (const line of text.split("\\n")) {
    if (line.startsWith("data: ") && line !== "data: [DONE]") {
      const chunk = JSON.parse(line.slice(6));
      process.stdout.write(chunk.content);
    }
  }
}`}</code></pre>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm text-muted-foreground m-0">
          <strong className="text-white">Tip:</strong> Use <code>session_id</code> to maintain
          conversation context across multiple requests. The agent will remember previous messages
          within the same session, enabling natural multi-turn conversations.
        </p>
      </div>

      <h2>Next Steps</h2>
      <ul>
        <li><Link href="/docs/api/agents" className="text-primary">Agents API</Link> &mdash; List available agents to find the right slug</li>
        <li><Link href="/docs/api/rate-limits" className="text-primary">Rate Limits</Link> &mdash; Understand and handle rate limiting</li>
        <li><Link href="/docs/api/webhooks" className="text-primary">Conversations &amp; Threads</Link> &mdash; Manage conversation history</li>
      </ul>
    </article>
  );
}
