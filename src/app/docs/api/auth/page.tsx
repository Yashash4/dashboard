import Link from "next/link";

export default function DocsAPIAuthPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>API Authentication</h1>
      <p className="lead text-lg text-muted-foreground">
        All ClawHQ API endpoints require authentication via API keys. This page covers how to create,
        manage, and use API keys to authenticate your requests.
      </p>

      <h2>
        Plan Requirements{" "}
        <span className="text-xs bg-[#ffe0c2]/10 text-[#ffe0c2] px-2 py-0.5 rounded font-mono">PRO</span>
      </h2>
      <p>
        API access is available on the Pro plan and above. Starter plan users can upgrade from the
        Billing page in the dashboard. The API is included at no additional cost with your Pro or
        Ultra subscription.
      </p>

      <h2>API Key Format</h2>
      <p>
        ClawHQ API keys follow a consistent format for easy identification:
      </p>
      <ul>
        <li><strong>Prefix:</strong> All keys begin with <code>clw_</code></li>
        <li><strong>Length:</strong> 36 characters total (including the prefix)</li>
        <li><strong>Character set:</strong> Alphanumeric characters (a-z, 0-9)</li>
      </ul>
      <p>Example key:</p>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>clw_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6</code></pre>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm text-muted-foreground m-0">
          <strong className="text-white">Tip:</strong> API keys are shown only once at creation time.
          Store your key in a secure location immediately. If you lose a key, you will need to
          revoke it and create a new one.
        </p>
      </div>

      <h2>Creating API Keys</h2>
      <p>
        API keys are created and managed from the <strong>API Access</strong> page in your ClawHQ
        dashboard.
      </p>
      <ol>
        <li>Navigate to the <strong>API Access</strong> section in the dashboard sidebar</li>
        <li>Click <strong>Create New Key</strong></li>
        <li>Enter a descriptive name for the key (e.g., &quot;Production Backend&quot;, &quot;Staging Environment&quot;)</li>
        <li>Select a rate limit tier (30, 60, 120, or 300 requests per minute)</li>
        <li>Click <strong>Generate</strong></li>
        <li>Copy the key immediately &mdash; it will not be shown again</li>
      </ol>
      <p>
        You can create multiple API keys for different environments or services. Each key has its
        own rate limit and can be independently revoked.
      </p>

      <h2>Using API Keys</h2>
      <p>
        Include your API key in the <code>Authorization</code> header of every request using the
        Bearer token scheme:
      </p>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>Authorization: Bearer clw_your_api_key_here</code></pre>

      <h3>Key Validation</h3>
      <p>
        When the API receives a request, it performs the following validation steps:
      </p>
      <ol>
        <li><strong>Format check</strong> &mdash; Verifies the key starts with <code>clw_</code> and is 36 characters</li>
        <li><strong>Hash lookup</strong> &mdash; The key is hashed using SHA-256 and compared against stored hashes in the database. Raw keys are never stored.</li>
        <li><strong>Plan check</strong> &mdash; Confirms the associated account has an active Pro or Ultra subscription</li>
        <li><strong>Rate limit check</strong> &mdash; Verifies the key has not exceeded its configured requests-per-minute limit</li>
      </ol>
      <p>
        If any step fails, the API returns an appropriate error response (see Error Responses below).
      </p>

      <h2>Code Examples</h2>

      <h3>cURL</h3>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`curl -X POST https://app.clawhq.tech/api/v1/chat \\
  -H "Authorization: Bearer clw_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello, how can I help you?"}'`}</code></pre>

      <h3>Python</h3>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`import requests

API_KEY = "clw_your_api_key_here"
BASE_URL = "https://app.clawhq.tech/api/v1"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

response = requests.post(
    f"{BASE_URL}/chat",
    headers=headers,
    json={"message": "Hello, how can I help you?"}
)

print(response.json())`}</code></pre>

      <h3>JavaScript</h3>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`const API_KEY = "clw_your_api_key_here";
const BASE_URL = "https://app.clawhq.tech/api/v1";

const response = await fetch(\`\${BASE_URL}/chat\`, {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    message: "Hello, how can I help you?",
  }),
});

const data = await response.json();
console.log(data);`}</code></pre>

      <h2>Error Responses</h2>
      <p>
        Authentication errors return standard HTTP status codes with a JSON error body:
      </p>

      <div className="not-prose overflow-x-auto my-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-3 text-white">Status</th>
              <th className="text-left py-2 px-3 text-white">Error</th>
              <th className="text-left py-2 px-3 text-white">Cause</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>401</code></td>
              <td className="py-2 px-3">Invalid API key</td>
              <td className="py-2 px-3">The key is missing, malformed, or does not match any active key</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>403</code></td>
              <td className="py-2 px-3">Plan required</td>
              <td className="py-2 px-3">The account does not have an active Pro or Ultra subscription</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>429</code></td>
              <td className="py-2 px-3">Rate limit exceeded</td>
              <td className="py-2 px-3">The key has exceeded its requests-per-minute limit</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>Example error response:</p>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`{
  "error": "Invalid API key",
  "code": "INVALID_KEY",
  "status": 401
}`}</code></pre>

      <h2>Security Best Practices</h2>
      <ul>
        <li>Never expose API keys in client-side code, public repositories, or browser requests</li>
        <li>Use environment variables to store keys in your application</li>
        <li>Create separate keys for each environment (development, staging, production)</li>
        <li>Rotate keys periodically by creating a new key and revoking the old one</li>
        <li>Set the lowest rate limit that meets your needs to minimize blast radius if a key is compromised</li>
        <li>Monitor key usage on the API Access page to detect anomalous patterns</li>
      </ul>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm text-muted-foreground m-0">
          <strong className="text-white">Tip:</strong> If you suspect a key has been compromised,
          revoke it immediately from the API Access page. Revoking a key is instant and all
          subsequent requests using that key will receive a 401 error.
        </p>
      </div>

      <h2>Next Steps</h2>
      <ul>
        <li><Link href="/docs/api/chat" className="text-primary">Chat API</Link> &mdash; Send messages and receive AI responses</li>
        <li><Link href="/docs/api/agents" className="text-primary">Agents API</Link> &mdash; List your deployed agents</li>
        <li><Link href="/docs/api/rate-limits" className="text-primary">Rate Limits</Link> &mdash; Understand rate limiting and best practices</li>
      </ul>
    </article>
  );
}
