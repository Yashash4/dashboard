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
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>GET /api/v1/agents</code></pre>

      <h2>Authentication</h2>
      <p>
        Requires a valid API key passed as a Bearer token. See the{" "}
        <Link href="/docs/api/auth" className="text-primary">Authentication</Link> docs for details.
      </p>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>Authorization: Bearer clw_your_api_key_here</code></pre>

      <h2>Request</h2>
      <p>
        This endpoint accepts no query parameters. It returns all agents associated with your account.
      </p>

      <h2>Response</h2>
      <p>
        A successful request returns a JSON object containing an array of agent objects:
      </p>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`{
  "agents": [
    {
      "id": "agt_abc123",
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
      "id": "agt_def456",
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
  ]
}`}</code></pre>

      <h2>Response Fields</h2>
      <div className="not-prose overflow-x-auto my-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-3 text-white">Field</th>
              <th className="text-left py-2 px-3 text-white">Type</th>
              <th className="text-left py-2 px-3 text-white">Description</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>id</code></td>
              <td className="py-2 px-3">string</td>
              <td className="py-2 px-3">Unique agent identifier (prefixed with <code>agt_</code>)</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>name</code></td>
              <td className="py-2 px-3">string</td>
              <td className="py-2 px-3">Human-readable display name of the agent</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>slug</code></td>
              <td className="py-2 px-3">string</td>
              <td className="py-2 px-3">URL-safe identifier used in the <code>agent</code> parameter of the Chat API</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>description</code></td>
              <td className="py-2 px-3">string</td>
              <td className="py-2 px-3">Brief description of the agent&apos;s purpose and capabilities</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>status</code></td>
              <td className="py-2 px-3">string</td>
              <td className="py-2 px-3">Current status: <code>deployed</code>, <code>stopped</code>, or <code>error</code></td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>model.primary</code></td>
              <td className="py-2 px-3">string</td>
              <td className="py-2 px-3">The primary AI model the agent uses for inference</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>model.fallback</code></td>
              <td className="py-2 px-3">string | null</td>
              <td className="py-2 px-3">The fallback model used if the primary is unavailable. Null if no fallback is configured.</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>deployed_at</code></td>
              <td className="py-2 px-3">string (ISO 8601)</td>
              <td className="py-2 px-3">Timestamp of the most recent deployment</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm text-muted-foreground m-0">
          <strong className="text-white">Tip:</strong> Use the <code>slug</code> field as the
          <code> agent</code> parameter when calling the{" "}
          <Link href="/docs/api/chat" className="text-primary hover:underline">Chat API</Link>.
          Slugs are stable identifiers that do not change even if the agent is renamed.
        </p>
      </div>

      <h2>Agent Statuses</h2>
      <div className="not-prose overflow-x-auto my-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-3 text-white">Status</th>
              <th className="text-left py-2 px-3 text-white">Description</th>
              <th className="text-left py-2 px-3 text-white">Accepts Chat?</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>deployed</code></td>
              <td className="py-2 px-3">Agent is running and accepting messages</td>
              <td className="py-2 px-3">Yes</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>stopped</code></td>
              <td className="py-2 px-3">Agent is configured but not currently running</td>
              <td className="py-2 px-3">No (returns 404)</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>error</code></td>
              <td className="py-2 px-3">Agent encountered an error and is not accepting messages</td>
              <td className="py-2 px-3">No (returns 502)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Code Examples</h2>

      <h3>cURL</h3>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`curl https://app.clawhq.tech/api/v1/agents \\
  -H "Authorization: Bearer clw_your_api_key_here"`}</code></pre>

      <h3>Python</h3>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`import requests

API_KEY = "clw_your_api_key_here"

response = requests.get(
    "https://app.clawhq.tech/api/v1/agents",
    headers={"Authorization": f"Bearer {API_KEY}"},
)

agents = response.json()["agents"]
for agent in agents:
    print(f"{agent['name']} ({agent['slug']}) - {agent['status']}")
    print(f"  Model: {agent['model']['primary']}")
    if agent["model"]["fallback"]:
        print(f"  Fallback: {agent['model']['fallback']}")`}</code></pre>

      <h3>JavaScript</h3>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`const API_KEY = "clw_your_api_key_here";

const response = await fetch("https://app.clawhq.tech/api/v1/agents", {
  headers: {
    "Authorization": \`Bearer \${API_KEY}\`,
  },
});

const { agents } = await response.json();

agents.forEach((agent) => {
  console.log(\`\${agent.name} (\${agent.slug}) - \${agent.status}\`);
  console.log(\`  Model: \${agent.model.primary}\`);
  if (agent.model.fallback) {
    console.log(\`  Fallback: \${agent.model.fallback}\`);
  }
});`}</code></pre>

      <h2>Error Responses</h2>
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
              <td className="py-2 px-3"><code>429</code></td>
              <td className="py-2 px-3">Rate limit exceeded</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Next Steps</h2>
      <ul>
        <li><Link href="/docs/api/chat" className="text-primary">Chat API</Link> &mdash; Send messages to your agents</li>
        <li><Link href="/docs/api/models" className="text-primary">Models API</Link> &mdash; List available AI models</li>
        <li><Link href="/docs/api/webhooks" className="text-primary">Conversations &amp; Threads</Link> &mdash; Access conversation history</li>
      </ul>
    </article>
  );
}
