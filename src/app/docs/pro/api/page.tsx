import Link from "next/link";

export default function DocsAPIAccessPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>
        API Access{" "}
        <span className="text-xs bg-[#ffe0c2]/10 text-[#ffe0c2] px-2 py-0.5 rounded font-mono">PRO</span>
      </h1>

      <p className="lead text-lg text-muted-foreground">
        The API Access module lets you interact with your ClawHQ instance programmatically. Create
        and manage API keys, set per-key rate limits, test endpoints in the interactive playground,
        and integrate with any language or framework using the REST API.
      </p>

      <h2>API Key Management</h2>

      <p>
        API keys are managed from the API Access page in your dashboard. Each key is a credential
        that grants programmatic access to your ClawHQ instance.
      </p>

      <h3>Key Format</h3>

      <p>
        All API keys use the <code>clw_</code> prefix followed by 32 random alphanumeric
        characters, for a total of <strong>36 characters</strong>. Example:
      </p>

      <pre><code>clw_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6</code></pre>

      <p>
        The <code>clw_</code> prefix makes it easy to identify ClawHQ keys in your codebase and
        prevents accidental use of keys from other services. Secret scanners and credential
        detectors can also use this prefix to flag exposed keys.
      </p>

      <h3>Creating Keys</h3>

      <p>
        When creating a key, you provide a descriptive name (e.g., &quot;production-backend&quot;,
        &quot;staging-test&quot;, &quot;mobile-app&quot;). The name is for your reference only — it
        does not affect the key&apos;s permissions. After creation, the full key is shown once.
        Copy it immediately, as it cannot be retrieved later.
      </p>

      <h3>Per-Key Rate Limits</h3>

      <p>
        Each key can be assigned its own rate limit to control how many requests per minute it is
        allowed to make. Available rate limit tiers:
      </p>

      <ul>
        <li><strong>30 RPM</strong> — Suitable for development and testing</li>
        <li><strong>60 RPM</strong> — Standard production usage</li>
        <li><strong>120 RPM</strong> — High-throughput applications</li>
        <li><strong>300 RPM</strong> — Maximum throughput for high-volume integrations</li>
      </ul>

      <p>
        When a key exceeds its rate limit, the API returns a <code>429 Too Many Requests</code>{" "}
        response with a <code>Retry-After</code> header indicating how many seconds to wait before
        retrying.
      </p>

      <h3>Revoking Keys</h3>

      <p>
        Revoke a key at any time from the dashboard. Revocation is immediate — any request using
        the revoked key will receive a <code>401 Unauthorized</code> response. Revoked keys cannot
        be restored; create a new key if needed.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <strong className="text-primary">Security best practice:</strong> Create separate API keys
        for each environment (development, staging, production) and each integration. This way, if
        a key is compromised, you can revoke it without affecting other systems.
      </div>

      <h2>Authentication</h2>

      <p>
        Include your API key in the <code>Authorization</code> header using the Bearer scheme:
      </p>

      <pre><code>{`Authorization: Bearer clw_your_api_key_here`}</code></pre>

      <p>
        All API requests must be made over HTTPS. Requests over plain HTTP are rejected. For
        detailed endpoint documentation, see the{" "}
        <Link href="/docs/api/auth">API Authentication reference</Link>.
      </p>

      <h2>Interactive API Playground</h2>

      <p>
        The API Playground is built into your dashboard, so you can test API calls without leaving
        the browser. Select an endpoint from the dropdown, fill in the parameters, and send the
        request. The playground shows the full request (method, URL, headers, body) and the
        complete response (status code, headers, body) side by side.
      </p>

      <p>
        The playground uses your selected API key for authentication, so you can verify that each
        key has the correct rate limits and access. Response bodies are syntax-highlighted and
        formatted for readability.
      </p>

      <h2>SSE Streaming</h2>

      <p>
        For chat endpoints, you can enable Server-Sent Events (SSE) streaming by setting the{" "}
        <code>stream</code> parameter to <code>true</code>. When streaming is enabled, the
        response is delivered as a series of SSE events, with each event containing a chunk of
        the agent&apos;s response as it is generated.
      </p>

      <pre><code>{`POST /api/v1/chat
Content-Type: application/json
Authorization: Bearer clw_your_api_key_here

{
  "message": "Explain how webhooks work",
  "agent": "support-bot",
  "stream": true
}`}</code></pre>

      <p>
        The response is a stream of <code>text/event-stream</code> events:
      </p>

      <pre><code>{`data: {"chunk": "Webhooks are ", "done": false}
data: {"chunk": "HTTP callbacks ", "done": false}
data: {"chunk": "that notify your server...", "done": false}
data: {"chunk": "", "done": true, "usage": {"prompt_tokens": 45, "completion_tokens": 128}}`}</code></pre>

      <h2>Code Examples</h2>

      <h3>JavaScript / Node.js</h3>

      <pre><code>{`const response = await fetch("https://app.clawhq.tech/api/v1/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer clw_your_api_key_here"
  },
  body: JSON.stringify({
    message: "What are your business hours?",
    agent: "support-bot"
  })
});

const data = await response.json();
console.log(data.reply);`}</code></pre>

      <h3>Python</h3>

      <pre><code>{`import requests

response = requests.post(
    "https://app.clawhq.tech/api/v1/chat",
    headers={
        "Content-Type": "application/json",
        "Authorization": "Bearer clw_your_api_key_here"
    },
    json={
        "message": "What are your business hours?",
        "agent": "support-bot"
    }
)

data = response.json()
print(data["reply"])`}</code></pre>

      <h3>cURL</h3>

      <pre><code>{`curl -X POST https://app.clawhq.tech/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer clw_your_api_key_here" \\
  -d '{"message": "What are your business hours?", "agent": "support-bot"}'`}</code></pre>

      <h3>Go</h3>

      <pre><code>{`payload := map[string]string{
    "message": "What are your business hours?",
    "agent":   "support-bot",
}
body, _ := json.Marshal(payload)

req, _ := http.NewRequest("POST",
    "https://app.clawhq.tech/api/v1/chat",
    bytes.NewBuffer(body))
req.Header.Set("Content-Type", "application/json")
req.Header.Set("Authorization", "Bearer clw_your_api_key_here")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()`}</code></pre>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <strong className="text-primary">Tip:</strong> Use the interactive playground to build and
        test your request, then copy the generated code snippet in your preferred language. The
        playground generates working code for all four languages shown above.
      </div>

      <h2>Error Handling</h2>

      <p>
        The API uses standard HTTP status codes. Common responses:
      </p>

      <ul>
        <li><code>200 OK</code> — Request succeeded</li>
        <li><code>400 Bad Request</code> — Invalid parameters or missing required fields</li>
        <li><code>401 Unauthorized</code> — Missing, invalid, or revoked API key</li>
        <li><code>429 Too Many Requests</code> — Rate limit exceeded; check the <code>Retry-After</code> header</li>
        <li><code>500 Internal Server Error</code> — Server-side error; retry with exponential backoff</li>
      </ul>

      <p>
        All error responses include a JSON body with an <code>error</code> field describing the
        issue:
      </p>

      <pre><code>{`{
  "error": "Rate limit exceeded. Retry after 12 seconds.",
  "code": "RATE_LIMITED"
}`}</code></pre>

      <h2>Related Documentation</h2>

      <ul>
        <li><Link href="/docs/api/auth">API Authentication Reference</Link> — Full endpoint documentation</li>
        <li><Link href="/docs/pro">Pro Features Overview</Link> — Full list of Pro capabilities</li>
        <li><Link href="/docs/pro/webhooks">Webhooks</Link> — Receive events via webhook instead of polling</li>
        <li><Link href="/docs/pro/audit-log">Audit Log</Link> — Track API key creation and usage</li>
      </ul>
    </article>
  );
}
