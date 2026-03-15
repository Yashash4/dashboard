import Link from "next/link";

export default function DocsRateLimitsPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Rate Limits</h1>
      <p className="lead text-lg text-muted-foreground">
        ClawHQ uses per-key rate limiting to ensure fair usage and platform stability. This page
        explains how rate limits work, how to configure them, and best practices for handling
        rate-limited responses in your application.
      </p>

      <h2>How Rate Limiting Works</h2>
      <p>
        Every API key has a configurable requests-per-minute (RPM) limit. When a request arrives,
        the API checks how many requests the key has made in the current sliding 60-second window.
        If the count exceeds the configured limit, the request is rejected with a <code>429</code>{" "}
        status code.
      </p>
      <p>
        Rate limits are applied per API key, not per account. If you have multiple keys, each has
        its own independent limit. This allows you to allocate different rate limits to different
        services or environments.
      </p>

      <h2>Available Tiers</h2>
      <p>
        When creating or editing an API key in the dashboard, you can select from four rate limit tiers:
      </p>

      <div className="not-prose overflow-x-auto my-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-3 text-white">Tier</th>
              <th className="text-left py-2 px-3 text-white">Requests per Minute</th>
              <th className="text-left py-2 px-3 text-white">Recommended Use</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-white/5">
              <td className="py-2 px-3 font-medium">Standard</td>
              <td className="py-2 px-3">30 RPM</td>
              <td className="py-2 px-3">Development, testing, and low-traffic applications</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3 font-medium">Enhanced</td>
              <td className="py-2 px-3">60 RPM</td>
              <td className="py-2 px-3">Small to medium production workloads</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3 font-medium">Professional</td>
              <td className="py-2 px-3">120 RPM</td>
              <td className="py-2 px-3">High-traffic applications and multi-channel deployments</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3 font-medium">Enterprise</td>
              <td className="py-2 px-3">300 RPM</td>
              <td className="py-2 px-3">Large-scale production systems with burst capacity</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm text-muted-foreground m-0">
          <strong className="text-white">Tip:</strong> Start with the Standard tier (30 RPM) during
          development and increase as your traffic grows. You can change the rate limit tier for any
          key at any time from the API Access page in the dashboard without regenerating the key.
        </p>
      </div>

      <h2>Rate Limit Response</h2>
      <p>
        When a request is rate-limited, the API returns a <code>429 Too Many Requests</code> response
        with a <code>Retry-After</code> header indicating how many seconds to wait before retrying.
      </p>

      <h3>Response Headers</h3>
      <div className="not-prose overflow-x-auto my-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-3 text-white">Header</th>
              <th className="text-left py-2 px-3 text-white">Description</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>Retry-After</code></td>
              <td className="py-2 px-3">Number of seconds to wait before the next request will be accepted</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>X-RateLimit-Limit</code></td>
              <td className="py-2 px-3">The configured RPM limit for this key</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>X-RateLimit-Remaining</code></td>
              <td className="py-2 px-3">Number of requests remaining in the current window</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-3"><code>X-RateLimit-Reset</code></td>
              <td className="py-2 px-3">Unix timestamp when the current rate limit window resets</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Response Body</h3>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMITED",
  "status": 429,
  "retry_after": 12
}`}</code></pre>

      <h2>Best Practices</h2>

      <h3>Use session_id for Conversations</h3>
      <p>
        When building conversational applications, always include a <code>session_id</code> parameter
        in your{" "}
        <Link href="/docs/api/chat" className="text-primary">Chat API</Link> requests. This allows
        the agent to maintain context across messages without you needing to send the full
        conversation history in every request, which reduces both request size and token consumption.
      </p>

      <h3>Handle 429 with Exponential Backoff</h3>
      <p>
        Implement exponential backoff when you receive a <code>429</code> response. Start with the
        delay indicated by the <code>Retry-After</code> header, then double the wait time for each
        consecutive rate-limited response. Add a small random jitter to prevent thundering herd
        problems when multiple clients retry simultaneously.
      </p>

      <h4>Python Example</h4>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`import requests
import time
import random

API_KEY = "clw_your_api_key_here"
BASE_URL = "https://app.clawhq.tech/api/v1"

def send_message(message, max_retries=5):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    for attempt in range(max_retries):
        response = requests.post(
            f"{BASE_URL}/chat",
            headers=headers,
            json={"message": message},
        )

        if response.status_code == 429:
            retry_after = int(response.headers.get("Retry-After", 5))
            jitter = random.uniform(0, 1)
            wait_time = retry_after * (2 ** attempt) + jitter
            print(f"Rate limited. Retrying in {wait_time:.1f}s...")
            time.sleep(wait_time)
            continue

        response.raise_for_status()
        return response.json()

    raise Exception("Max retries exceeded")`}</code></pre>

      <h4>JavaScript Example</h4>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`const API_KEY = "clw_your_api_key_here";
const BASE_URL = "https://app.clawhq.tech/api/v1";

async function sendMessage(message, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(\`\${BASE_URL}/chat\`, {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${API_KEY}\`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get("Retry-After") || "5");
      const jitter = Math.random();
      const waitTime = retryAfter * Math.pow(2, attempt) + jitter;
      console.log(\`Rate limited. Retrying in \${waitTime.toFixed(1)}s...\`);
      await new Promise((r) => setTimeout(r, waitTime * 1000));
      continue;
    }

    if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
    return await response.json();
  }

  throw new Error("Max retries exceeded");
}`}</code></pre>

      <h3>Monitor Usage</h3>
      <p>
        Use the{" "}
        <Link href="/docs/api/webhooks" className="text-primary">/api/v1/usage</Link> endpoint to
        track your API consumption over time. Set up a daily check that compares your usage against
        your rate limit to detect when you are approaching capacity and need to upgrade your tier.
      </p>
      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto"><code>{`# Check your current usage over the last 24 hours
curl "https://app.clawhq.tech/api/v1/usage?days=1" \\
  -H "Authorization: Bearer clw_your_api_key_here"`}</code></pre>

      <h3>Distribute Load Across Keys</h3>
      <p>
        If a single key&apos;s rate limit is insufficient, create multiple API keys and distribute
        requests across them. For example, create a dedicated key for each service or microservice
        that calls the ClawHQ API, each with its own appropriate rate limit.
      </p>

      <h3>Use Streaming for Long Responses</h3>
      <p>
        Streaming requests (<code>stream: true</code>) count as a single request against your rate
        limit, regardless of how many SSE chunks are delivered. For long responses, streaming can
        improve the user experience without increasing your rate limit consumption.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <p className="text-sm text-muted-foreground m-0">
          <strong className="text-white">Tip:</strong> The rate limit headers
          (<code>X-RateLimit-Remaining</code> and <code>X-RateLimit-Reset</code>) are included in
          every successful response, not just 429 responses. Use them proactively to throttle your
          request rate before hitting the limit.
        </p>
      </div>

      <h2>Rate Limits by Endpoint</h2>
      <p>
        All API endpoints share the same per-key rate limit. There are no separate limits for
        individual endpoints. A key configured for 60 RPM can make 60 requests per minute across
        any combination of Chat, Agents, Models, Conversations, Threads, Usage, and Health endpoints.
      </p>

      <h2>Configuring Rate Limits</h2>
      <p>
        To change the rate limit for an existing key:
      </p>
      <ol>
        <li>Navigate to the <strong>API Access</strong> page in your dashboard</li>
        <li>Find the key you want to modify</li>
        <li>Click the <strong>Edit</strong> button (pencil icon)</li>
        <li>Select the new rate limit tier from the dropdown</li>
        <li>Click <strong>Save</strong></li>
      </ol>
      <p>
        The new rate limit takes effect immediately. There is no need to regenerate or replace
        the key.
      </p>

      <h2>Next Steps</h2>
      <ul>
        <li><Link href="/docs/api/auth" className="text-primary">Authentication</Link> &mdash; Create and manage API keys</li>
        <li><Link href="/docs/api/chat" className="text-primary">Chat API</Link> &mdash; Start sending messages</li>
        <li><Link href="/docs/api/webhooks" className="text-primary">Usage API</Link> &mdash; Monitor your consumption</li>
      </ul>
    </article>
  );
}
