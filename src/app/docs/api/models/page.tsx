import Link from "next/link";

export default function DocsModelsAPIPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Models API</h1>
      <p className="lead text-lg text-muted-foreground">
        The Models API returns the list of AI models available on the ClawHQ platform. Use this
        endpoint to discover which models you can assign to your agents and to check their
        specifications.
      </p>

      <h2>Endpoint</h2>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>GET /api/v1/models</code></pre>

      <h2>Authentication</h2>
      <p>
        Requires a valid API key passed as a Bearer token. See the{" "}
        <Link href="/docs/api/auth" className="text-primary">Authentication</Link> docs for details.
      </p>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>Authorization: Bearer clw_your_api_key_here</code></pre>

      <h2>Request</h2>
      <p>
        This endpoint accepts no query parameters. It returns all models available to your account
        based on your current plan.
      </p>

      <h2>Response</h2>
      <p>
        A successful request returns a JSON object containing an array of model objects:
      </p>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`{
  "models": [
    {
      "id": "k2.5-standard",
      "name": "K2.5 Standard",
      "context_window": 128000,
      "description": "Most capable model with vision and function calling support"
    },
    {
      "id": "m2.5-mini",
      "name": "M2.5 Mini",
      "context_window": 128000,
      "description": "Smaller, faster, and more cost-effective version"
    },
    {
      "id": "k2.5-reasoning",
      "name": "K2.5 Reasoning",
      "context_window": 200000,
      "description": "Balanced model with strong reasoning and large context"
    },
    {
      "id": "m2.5-fast",
      "name": "M2.5 Fast",
      "context_window": 200000,
      "description": "Fast and efficient model optimized for high-throughput tasks"
    },
    {
      "id": "x3-flash",
      "name": "X3 Flash",
      "context_window": 1000000,
      "description": "High-speed model with the largest available context window"
    },
    {
      "id": "r1-reasoner",
      "name": "R1 Reasoner",
      "context_window": 64000,
      "description": "Open-weight reasoning model with strong analytical capabilities"
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
              <td className="py-2 px-3">Unique model identifier used when configuring agents</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>name</code></td>
              <td className="py-2 px-3">string</td>
              <td className="py-2 px-3">Human-readable display name</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>context_window</code></td>
              <td className="py-2 px-3">number</td>
              <td className="py-2 px-3">Maximum number of tokens the model can process in a single request (input + output)</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>description</code></td>
              <td className="py-2 px-3">string</td>
              <td className="py-2 px-3">Brief summary of the model&apos;s strengths and use cases</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Context Window</h2>
      <p>
        The <code>context_window</code> value represents the maximum number of tokens a model can
        handle in a single interaction. This includes both the input (your message, conversation
        history, knowledge base context) and the generated output.
      </p>
      <p>
        When choosing a model for your agent, consider the following:
      </p>
      <ul>
        <li><strong>Short conversations</strong> &mdash; Models with smaller context windows (64K) work well and tend to respond faster</li>
        <li><strong>Long conversations with history</strong> &mdash; Larger context windows (128K+) allow more conversation turns to be retained</li>
        <li><strong>Knowledge-heavy agents</strong> &mdash; Models with the largest context windows (200K+) can incorporate more knowledge base content per response</li>
      </ul>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm text-muted-foreground m-0">
          <strong className="text-white">Tip:</strong> Model availability may vary based on your
          plan and region. The Models API always returns the accurate list of models you can
          currently use. Check this endpoint before configuring a new agent to see the latest options.
        </p>
      </div>

      <h2>Code Examples</h2>

      <h3>cURL</h3>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`curl https://app.clawhq.tech/api/v1/models \\
  -H "Authorization: Bearer clw_your_api_key_here"`}</code></pre>

      <h3>Python</h3>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`import requests

API_KEY = "clw_your_api_key_here"

response = requests.get(
    "https://app.clawhq.tech/api/v1/models",
    headers={"Authorization": f"Bearer {API_KEY}"},
)

models = response.json()["models"]
for model in models:
    ctx = f"{model['context_window']:,}"
    print(f"{model['name']} ({model['id']}) - {ctx} tokens")
    print(f"  {model['description']}")`}</code></pre>

      <h3>JavaScript</h3>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`const API_KEY = "clw_your_api_key_here";

const response = await fetch("https://app.clawhq.tech/api/v1/models", {
  headers: {
    "Authorization": \`Bearer \${API_KEY}\`,
  },
});

const { models } = await response.json();

models.forEach((model) => {
  const ctx = model.context_window.toLocaleString();
  console.log(\`\${model.name} (\${model.id}) - \${ctx} tokens\`);
  console.log(\`  \${model.description}\`);
});`}</code></pre>

      <h2>Choosing the Right Model</h2>
      <p>
        Each model has different strengths. Here are some guidelines for selecting the right model
        for your use case:
      </p>
      <ul>
        <li><strong>Customer support</strong> &mdash; K2.5 Standard or K2.5 Reasoning for nuanced, empathetic responses</li>
        <li><strong>High-volume automation</strong> &mdash; M2.5 Mini or M2.5 Fast for fast, cost-effective processing</li>
        <li><strong>Complex reasoning</strong> &mdash; R1 Reasoner for analytical and logic-intensive tasks</li>
        <li><strong>Large document analysis</strong> &mdash; X3 Flash for its million-token context window</li>
      </ul>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm text-muted-foreground m-0">
          <strong className="text-white">Tip:</strong> You can assign both a primary and fallback
          model to each agent via the dashboard. If the primary model is temporarily unavailable,
          the agent automatically falls back to the secondary model with no downtime.
        </p>
      </div>

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
        <li><Link href="/docs/api/agents" className="text-primary">Agents API</Link> &mdash; See which models your agents are using</li>
        <li><Link href="/docs/api/chat" className="text-primary">Chat API</Link> &mdash; Send messages to your agents</li>
        <li><Link href="/docs/api/webhooks" className="text-primary">Usage API</Link> &mdash; Monitor your API consumption</li>
      </ul>
    </article>
  );
}
