import Link from "next/link";

export default function DocsWebhooksAPIPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Conversations, Threads, Usage &amp; Health API</h1>
      <p className="lead text-lg text-muted-foreground">
        These endpoints provide access to conversation history, threaded messaging, usage analytics,
        and system health status. Together they give you full programmatic control over your
        ClawHQ data and operational monitoring.
      </p>

      <hr className="border-white/10" />

      <h2>Conversations API</h2>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>GET /api/v1/conversations</code></pre>
      <p>
        Retrieves a paginated list of conversations across your deployed agents. Each conversation
        represents a distinct interaction session between a user and an agent.
      </p>

      <h3>Query Parameters</h3>
      <div className="not-prose overflow-x-auto my-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-3 text-white">Parameter</th>
              <th className="text-left py-2 px-3 text-white">Type</th>
              <th className="text-left py-2 px-3 text-white">Default</th>
              <th className="text-left py-2 px-3 text-white">Description</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>agent</code></td>
              <td className="py-2 px-3">string</td>
              <td className="py-2 px-3">all</td>
              <td className="py-2 px-3">Filter by agent slug. Omit to include all agents.</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>limit</code></td>
              <td className="py-2 px-3">number</td>
              <td className="py-2 px-3">20</td>
              <td className="py-2 px-3">Number of conversations to return (1&ndash;100).</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>offset</code></td>
              <td className="py-2 px-3">number</td>
              <td className="py-2 px-3">0</td>
              <td className="py-2 px-3">Number of conversations to skip for pagination.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Response</h3>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`{
  "conversations": [
    {
      "id": "conv_abc123",
      "agent": "support-bot",
      "session_id": "user_12345",
      "message_count": 8,
      "started_at": "2026-03-16T09:00:00Z",
      "last_message_at": "2026-03-16T09:12:30Z",
      "status": "completed"
    }
  ],
  "total": 142,
  "limit": 20,
  "offset": 0
}`}</code></pre>

      <h3>Code Example (cURL)</h3>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`curl "https://app.clawhq.tech/api/v1/conversations?agent=support-bot&limit=10" \\
  -H "Authorization: Bearer clw_your_api_key_here"`}</code></pre>

      <h3>Code Example (Python)</h3>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`import requests

API_KEY = "clw_your_api_key_here"

response = requests.get(
    "https://app.clawhq.tech/api/v1/conversations",
    headers={"Authorization": f"Bearer {API_KEY}"},
    params={"agent": "support-bot", "limit": 10},
)

data = response.json()
for conv in data["conversations"]:
    print(f"{conv['id']} - {conv['message_count']} messages ({conv['status']})")`}</code></pre>

      <h3>Code Example (JavaScript)</h3>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`const API_KEY = "clw_your_api_key_here";

const params = new URLSearchParams({ agent: "support-bot", limit: "10" });
const response = await fetch(
  \`https://app.clawhq.tech/api/v1/conversations?\${params}\`,
  { headers: { "Authorization": \`Bearer \${API_KEY}\` } }
);

const { conversations, total } = await response.json();
console.log(\`Showing \${conversations.length} of \${total} conversations\`);`}</code></pre>

      <hr className="border-white/10" />

      <h2>Threads API</h2>

      <h3>List Threads</h3>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>GET /api/v1/threads</code></pre>
      <p>
        Returns a list of message threads. Threads group related messages into a structured
        conversation that can be continued over time using the same thread ID.
      </p>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`{
  "threads": [
    {
      "id": "thr_xyz789",
      "title": "Product inquiry - Enterprise pricing",
      "agent": "sales-assistant",
      "message_count": 12,
      "created_at": "2026-03-15T14:00:00Z",
      "updated_at": "2026-03-16T08:30:00Z"
    }
  ]
}`}</code></pre>

      <h3>Create Thread</h3>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>POST /api/v1/threads</code></pre>
      <p>
        Creates a new message thread with an initial message.
      </p>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`// Request
{
  "title": "Integration help",
  "agent": "support-bot",
  "message": "How do I integrate the Chat API with my React app?"
}

// Response
{
  "thread": {
    "id": "thr_new123",
    "title": "Integration help",
    "agent": "support-bot",
    "message_count": 2,
    "created_at": "2026-03-16T10:00:00Z"
  },
  "response": "I'd be happy to help you integrate the Chat API with React..."
}`}</code></pre>

      <h3>Add Message to Thread</h3>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>POST /api/v1/threads/:id/messages</code></pre>
      <p>
        Appends a message to an existing thread and returns the agent&apos;s response. The agent
        has access to the full thread history for context.
      </p>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`// Request
{
  "message": "Can you show me a code example with TypeScript?"
}

// Response
{
  "message_id": "msg_abc456",
  "response": "Here's a TypeScript example using the fetch API...",
  "thread_id": "thr_new123"
}`}</code></pre>

      <h3>Code Example (Python)</h3>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`import requests

API_KEY = "clw_your_api_key_here"
BASE_URL = "https://app.clawhq.tech/api/v1"
headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

# Create a new thread
result = requests.post(
    f"{BASE_URL}/threads",
    headers=headers,
    json={
        "title": "Integration help",
        "agent": "support-bot",
        "message": "How do I integrate the Chat API?"
    },
).json()

thread_id = result["thread"]["id"]
print(f"Thread created: {thread_id}")
print(f"Response: {result['response']}")

# Continue the conversation
follow_up = requests.post(
    f"{BASE_URL}/threads/{thread_id}/messages",
    headers=headers,
    json={"message": "Show me a TypeScript example"},
).json()

print(f"Follow-up: {follow_up['response']}")`}</code></pre>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm text-muted-foreground m-0">
          <strong className="text-white">Tip:</strong> Threads are ideal for building support ticket
          integrations. Create a thread when a customer opens a ticket, and append messages as the
          conversation continues. The agent retains full context across all messages in the thread.
        </p>
      </div>

      <hr className="border-white/10" />

      <h2>Usage API</h2>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>GET /api/v1/usage</code></pre>
      <p>
        Returns API usage statistics for your account over a specified time period. Use this endpoint
        to monitor consumption, detect anomalies, and plan capacity.
      </p>

      <h3>Query Parameters</h3>
      <div className="not-prose overflow-x-auto my-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-3 text-white">Parameter</th>
              <th className="text-left py-2 px-3 text-white">Type</th>
              <th className="text-left py-2 px-3 text-white">Default</th>
              <th className="text-left py-2 px-3 text-white">Description</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>days</code></td>
              <td className="py-2 px-3">number</td>
              <td className="py-2 px-3">30</td>
              <td className="py-2 px-3">Number of days of history to return (1&ndash;90).</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Response</h3>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`{
  "usage": {
    "total_requests": 15420,
    "total_tokens": 2843000,
    "period_start": "2026-02-14T00:00:00Z",
    "period_end": "2026-03-16T00:00:00Z",
    "daily": [
      {
        "date": "2026-03-16",
        "requests": 520,
        "tokens": 96000,
        "avg_latency_ms": 1240
      }
    ],
    "by_agent": [
      {
        "agent": "support-bot",
        "requests": 12300,
        "tokens": 2100000
      },
      {
        "agent": "sales-assistant",
        "requests": 3120,
        "tokens": 743000
      }
    ]
  }
}`}</code></pre>

      <h3>Code Example (cURL)</h3>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`curl "https://app.clawhq.tech/api/v1/usage?days=7" \\
  -H "Authorization: Bearer clw_your_api_key_here"`}</code></pre>

      <h3>Code Example (JavaScript)</h3>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`const API_KEY = "clw_your_api_key_here";

const response = await fetch(
  "https://app.clawhq.tech/api/v1/usage?days=7",
  { headers: { "Authorization": \`Bearer \${API_KEY}\` } }
);

const { usage } = await response.json();
console.log(\`Total requests (7d): \${usage.total_requests.toLocaleString()}\`);
console.log(\`Total tokens (7d): \${usage.total_tokens.toLocaleString()}\`);

usage.by_agent.forEach((a) => {
  console.log(\`  \${a.agent}: \${a.requests} requests\`);
});`}</code></pre>

      <hr className="border-white/10" />

      <h2>Health API</h2>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>GET /api/v1/health</code></pre>
      <p>
        Returns the current health status of your ClawHQ instance, including the API server, VPS,
        and deployed agents. Use this endpoint for uptime monitoring and alerting integrations.
      </p>

      <h3>Response</h3>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`{
  "status": "healthy",
  "timestamp": "2026-03-16T10:30:00Z",
  "components": {
    "api": "operational",
    "vps": "operational",
    "agents": "operational",
    "gateway": "operational"
  },
  "uptime_seconds": 864000,
  "version": "3.2.1"
}`}</code></pre>

      <h3>Status Values</h3>
      <div className="not-prose overflow-x-auto my-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-3 text-white">Status</th>
              <th className="text-left py-2 px-3 text-white">Description</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>healthy</code></td>
              <td className="py-2 px-3">All components are operational</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>degraded</code></td>
              <td className="py-2 px-3">One or more components are experiencing issues but the system is functional</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>unhealthy</code></td>
              <td className="py-2 px-3">Critical components are down and the system cannot process requests</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Code Example (cURL)</h3>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`curl https://app.clawhq.tech/api/v1/health \\
  -H "Authorization: Bearer clw_your_api_key_here"`}</code></pre>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm text-muted-foreground m-0">
          <strong className="text-white">Tip:</strong> Integrate the Health API with your monitoring
          stack (e.g., Datadog, PagerDuty, or a custom uptime checker) by polling every 60 seconds.
          Alert when the status is anything other than <code>healthy</code>.
        </p>
      </div>

      <h2>Error Responses</h2>
      <p>
        All endpoints on this page return standard error responses:
      </p>
      <div className="not-prose overflow-x-auto my-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-3 text-white">Status</th>
              <th className="text-left py-2 px-3 text-white">Description</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>401</code></td>
              <td className="py-2 px-3">Invalid or missing API key</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>403</code></td>
              <td className="py-2 px-3">Account does not have an active Pro or Ultra plan</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>404</code></td>
              <td className="py-2 px-3">Thread not found (for thread-specific endpoints)</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>429</code></td>
              <td className="py-2 px-3">Rate limit exceeded</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Next Steps</h2>
      <ul>
        <li><Link href="/docs/api/chat" className="text-primary">Chat API</Link> &mdash; Send messages to agents</li>
        <li><Link href="/docs/api/rate-limits" className="text-primary">Rate Limits</Link> &mdash; Understand rate limiting and best practices</li>
        <li><Link href="/docs/api/auth" className="text-primary">Authentication</Link> &mdash; API key management</li>
      </ul>
    </article>
  );
}
