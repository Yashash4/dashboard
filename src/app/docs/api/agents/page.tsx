import Link from "next/link";

export default function DocsAgentsAPIPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Agents API</h1>
      <p className="lead text-lg text-muted-foreground">
        The Agents API lets you retrieve information about your deployed AI agents, including their
        configuration, status, and model assignments. Use this endpoint to discover available agents
        before sending chat messages.
      </p>

      <h2>Endpoint</h2>
      <pre className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg p-4 text-sm overflow-x-auto"><code>GET /api/v1/agents</code></pre>

      <h2>Authentication</h2>
      <p>
        Requires a valid API key passed as a Bearer token. See the{" "}
        <Link href="/docs/api/auth" className="text-[var(--accent)] hover:underline">Authentication</Link> docs for details.
      </p>
      <pre className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg p-4 text-sm overflow-x-auto"><code>{`Authorization: Bearer $CLAWHQ_API_KEY`}</code></pre>

      <h2>Request</h2>
      <p>
        This endpoint supports the following optional query parameters for pagination:
      </p>
      <div className="not-prose overflow-x-auto my-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-primary)]">
              <th className="text-left py-2 px-3 text-[var(--text-primary)]">Parameter</th>
              <th className="text-left py-2 px-3 text-[var(--text-primary)]">Type</th>
              <th className="text-left py-2 px-3 text-[var(--text-primary)]">Default</th>
              <th className="text-left py-2 px-3 text-[var(--text-primary)]">Description</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-[var(--border-subtle)]">
              <td className="py-2 px-3"><code>limit</code></td>
              <td className="py-2 px-3">integer</td>
              <td className="py-2 px-3">20</td>
              <td className="py-2 px-3">Maximum number of agents to return (1-100)</td>
            </tr>
            <tr className="border-b border-[var(--border-subtle)]">
              <td className="py-2 px-3"><code>offset</code></td>
              <td className="py-2 px-3">integer</td>
              <td className="py-2 px-3">0</td>
              <td className="py-2 px-3">Number of agents to skip for pagination</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Response</h2>
      <p>
        A successful request returns a JSON object containing an array of agent objects along with
        pagination metadata:
      </p>
      <pre className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg p-4 text-sm overflow-x-auto"><code>{`{
  "agents": [
    {
      "agent_id": "abc123-def456-ghi789",
      "name": "Support Bot",
      "slug": "support-bot",
      "description": "Handles customer support inquiries with access to the knowledge base",
      "status": "deployed",
      "model": {
        "primary": "k2.5-standard",
        "fallback": "m2.5-mini"
      },
      "deployed_at": "2026-03-10T14:30:00Z"
    },
    {
      "agent_id": "jkl012-mno345-pqr678",
      "name": "Sales Assistant",
      "slug": "sales-assistant",
      "description": "Qualifies leads and answers product questions",
      "status": "deployed",
      "model": {
        "primary": "k2.5-reasoning",
        "fallback": null
      },
      "deployed_at": "2026-03-12T09:15:00Z"
    }
  ],
  "total": 2,
  "has_more": false
}`}</code></pre>

      <h2>Response Fields</h2>
      <div className="not-prose overflow-x-auto my-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-primary)]">
              <th className="text-left py-2 px-3 text-[var(--text-primary)]">Field</th>
              <th className="text-left py-2 px-3 text-[var(--text-primary)]">Type</th>
              <th className="text-left py-2 px-3 text-[var(--text-primary)]">Description</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-[var(--border-subtle)]">
              <td className="py-2 px-3"><code>agent_id</code></td>
              <td className="py-2 px-3">string</td>
              <td className="py-2 px-3">Unique agent identifier (UUID format)</td>
            </tr>
            <tr className="border-b border-[var(--border-subtle)]">
              <td className="py-2 px-3"><code>name</code></td>
              <td className="py-2 px-3">string</td>
              <td className="py-2 px-3">Human-readable display name of the agent</td>
            </tr>
            <tr className="border-b border-[var(--border-subtle)]">
              <td className="py-2 px-3"><code>slug</code></td>
              <td className="py-2 px-3">string</td>
              <td className="py-2 px-3">URL-safe identifier used in the <code>agent</code> parameter of the Chat API</td>
            </tr>
            <tr className="border-b border-[var(--border-subtle)]">
              <td className="py-2 px-3"><code>description</code></td>
              <td className="py-2 px-3">string</td>
              <td className="py-2 px-3">Brief description of the agent&apos;s purpose and capabilities</td>
            </tr>
            <tr className="border-b border-[var(--border-subtle)]">
              <td className="py-2 px-3"><code>status</code></td>
              <td className="py-2 px-3">string</td>
              <td className="py-2 px-3">Current status: <code>deployed</code>, <code>stopped</code>, or <code>error</code></td>
            </tr>
            <tr className="border-b border-[var(--border-subtle)]">
              <td className="py-2 px-3"><code>model.primary</code></td>
              <td className="py-2 px-3">string</td>
              <td className="py-2 px-3">The primary AI model the agent uses for inference</td>
            </tr>
            <tr className="border-b border-[var(--border-subtle)]">
              <td className="py-2 px-3"><code>model.fallback</code></td>
              <td className="py-2 px-3">string | null</td>
              <td className="py-2 px-3">The fallback model used if the primary is unavailable. Null if no fallback is configured.</td>
            </tr>
            <tr className="border-b border-[var(--border-subtle)]">
              <td className="py-2 px-3"><code>deployed_at</code></td>
              <td className="py-2 px-3">string (ISO 8601)</td>
              <td className="py-2 px-3">Timestamp of the most recent deployment</td>
            </tr>
            <tr className="border-b border-[var(--border-subtle)]">
              <td className="py-2 px-3"><code>total</code></td>
              <td className="py-2 px-3">integer</td>
              <td className="py-2 px-3">Total number of agents matching the query</td>
            </tr>
            <tr className="border-b border-[var(--border-subtle)]">
              <td className="py-2 px-3"><code>has_more</code></td>
              <td className="py-2 px-3">boolean</td>
              <td className="py-2 px-3">Whether there are more agents beyond the current page</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="not-prose border-l-2 border-emerald-500 bg-emerald-500/5 p-4 my-6 flex gap-3">
        <div className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
          <strong className="text-[var(--text-primary)]">Tip:</strong> Use the <code>slug</code> field as the
          <code> agent</code> parameter when calling the{" "}
          <Link href="/docs/api/chat" className="text-[var(--accent)] hover:underline">Chat API</Link>.
          Slugs are stable identifiers that do not change even if the agent is renamed.
        </div>
      </div>

      <h2>Agent Statuses</h2>
      <div className="not-prose overflow-x-auto my-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-primary)]">
              <th className="text-left py-2 px-3 text-[var(--text-primary)]">Status</th>
              <th className="text-left py-2 px-3 text-[var(--text-primary)]">Description</th>
              <th className="text-left py-2 px-3 text-[var(--text-primary)]">Accepts Chat?</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-[var(--border-subtle)]">
              <td className="py-2 px-3"><code>deployed</code></td>
              <td className="py-2 px-3">Agent is running and accepting messages</td>
              <td className="py-2 px-3">Yes</td>
            </tr>
            <tr className="border-b border-[var(--border-subtle)]">
              <td className="py-2 px-3"><code>stopped</code></td>
              <td className="py-2 px-3">Agent is configured but not currently running</td>
              <td className="py-2 px-3">No (returns 404)</td>
            </tr>
            <tr className="border-b border-[var(--border-subtle)]">
              <td className="py-2 px-3"><code>error</code></td>
              <td className="py-2 px-3">Agent encountered an error and is not accepting messages</td>
              <td className="py-2 px-3">No (returns 502)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Code Examples</h2>

      <h3>cURL</h3>
      <pre className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg p-4 text-sm overflow-x-auto"><code>{`curl https://app.clawhq.tech/api/v1/agents?limit=10&offset=0 \\
  -H "Authorization: Bearer $CLAWHQ_API_KEY"`}</code></pre>

      <h3>Python</h3>
      <pre className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg p-4 text-sm overflow-x-auto"><code>{`import os
import requests

API_KEY = os.environ["CLAWHQ_API_KEY"]

response = requests.get(
    "https://app.clawhq.tech/api/v1/agents",
    headers={"Authorization": f"Bearer {API_KEY}"},
    params={"limit": 10, "offset": 0},
)

data = response.json()
for agent in data["agents"]:
    print(f"{agent['name']} ({agent['slug']}) - {agent['status']}")
    print(f"  Model: {agent['model']['primary']}")
    if agent["model"]["fallback"]:
        print(f"  Fallback: {agent['model']['fallback']}")

print(f"Total: {data['total']}, Has more: {data['has_more']}")`}</code></pre>

      <h3>JavaScript</h3>
      <pre className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg p-4 text-sm overflow-x-auto"><code>{`const CLAWHQ_API_KEY = process.env.CLAWHQ_API_KEY;

const response = await fetch("https://app.clawhq.tech/api/v1/agents?limit=10&offset=0", {
  headers: {
    "Authorization": \`Bearer \${CLAWHQ_API_KEY}\`,
  },
});

const data = await response.json();

data.agents.forEach((agent) => {
  console.log(\`\${agent.name} (\${agent.slug}) - \${agent.status}\`);
  console.log(\`  Model: \${agent.model.primary}\`);
  if (agent.model.fallback) {
    console.log(\`  Fallback: \${agent.model.fallback}\`);
  }
});

console.log(\`Total: \${data.total}, Has more: \${data.has_more}\`);`}</code></pre>

      <h2>Error Responses</h2>
      <div className="not-prose overflow-x-auto my-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-primary)]">
              <th className="text-left py-2 px-3 text-[var(--text-primary)]">Status</th>
              <th className="text-left py-2 px-3 text-[var(--text-primary)]">Description</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-[var(--border-subtle)]">
              <td className="py-2 px-3"><code>401</code></td>
              <td className="py-2 px-3">Invalid or missing API key</td>
            </tr>
            <tr className="border-b border-[var(--border-subtle)]">
              <td className="py-2 px-3"><code>403</code></td>
              <td className="py-2 px-3">Account does not have an active Pro or Ultra plan</td>
            </tr>
            <tr className="border-b border-[var(--border-subtle)]">
              <td className="py-2 px-3"><code>429</code></td>
              <td className="py-2 px-3">Rate limit exceeded</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Next Steps</h2>
      <ul>
        <li><Link href="/docs/api/chat" className="text-[var(--accent)] hover:underline">Chat API</Link> &mdash; Send messages to your agents</li>
        <li><Link href="/docs/api/models" className="text-[var(--accent)] hover:underline">Models API</Link> &mdash; List available AI models</li>
        <li><Link href="/docs/api/auth" className="text-[var(--accent)] hover:underline">Authentication</Link> &mdash; API key management and security</li>
      </ul>
    </article>
  );
}
