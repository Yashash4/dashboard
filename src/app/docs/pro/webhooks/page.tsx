import Link from "next/link";

export default function DocsWebhooksPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>
        Webhooks{" "}
        <span className="text-xs bg-[#ffe0c2]/10 text-[#ffe0c2] px-2 py-0.5 rounded font-mono">PRO</span>
      </h1>

      <p className="lead text-lg text-muted-foreground">
        Webhooks let you push real-time event notifications from ClawHQ to any HTTP endpoint.
        React to messages, agent deployments, channel changes, tickets, and API requests
        instantly — without polling.
      </p>

      <h2>Event Types</h2>

      <p>
        ClawHQ supports nine event types. When you create a webhook, you select which events it
        should receive. Each event delivers a JSON payload to your endpoint.
      </p>

      <h3>message.received</h3>
      <p>Fired when a user sends a message to any of your agents.</p>
      <pre><code>{`{
  "event": "message.received",
  "timestamp": "2026-03-16T14:30:00Z",
  "data": {
    "message_id": "msg_abc123",
    "channel": "web-chat",
    "agent": "support-bot",
    "content": "How do I reset my password?",
    "user_id": "usr_xyz789"
  }
}`}</code></pre>

      <h3>message.sent</h3>
      <p>Fired when an agent sends a response to a user.</p>
      <pre><code>{`{
  "event": "message.sent",
  "timestamp": "2026-03-16T14:30:02Z",
  "data": {
    "message_id": "msg_def456",
    "channel": "web-chat",
    "agent": "support-bot",
    "content": "You can reset your password from the account settings page...",
    "response_time_ms": 1850
  }
}`}</code></pre>

      <h3>agent.deployed</h3>
      <p>Fired when an agent is deployed to your VPS.</p>
      <pre><code>{`{
  "event": "agent.deployed",
  "timestamp": "2026-03-16T15:00:00Z",
  "data": {
    "agent_name": "sales-assistant",
    "deployed_by": "admin@company.com"
  }
}`}</code></pre>

      <h3>agent.undeployed</h3>
      <p>Fired when an agent is removed from your VPS.</p>
      <pre><code>{`{
  "event": "agent.undeployed",
  "timestamp": "2026-03-16T15:05:00Z",
  "data": {
    "agent_name": "old-bot",
    "undeployed_by": "admin@company.com"
  }
}`}</code></pre>

      <h3>channel.connected</h3>
      <p>Fired when a new channel is connected to your instance.</p>
      <pre><code>{`{
  "event": "channel.connected",
  "timestamp": "2026-03-16T16:00:00Z",
  "data": {
    "channel_type": "slack",
    "channel_name": "#customer-support"
  }
}`}</code></pre>

      <h3>channel.disconnected</h3>
      <p>Fired when a channel is disconnected.</p>
      <pre><code>{`{
  "event": "channel.disconnected",
  "timestamp": "2026-03-16T16:30:00Z",
  "data": {
    "channel_type": "discord",
    "channel_name": "help-desk",
    "reason": "manual"
  }
}`}</code></pre>

      <h3>ticket.created</h3>
      <p>Fired when a new support ticket is opened.</p>
      <pre><code>{`{
  "event": "ticket.created",
  "timestamp": "2026-03-16T17:00:00Z",
  "data": {
    "ticket_id": "tkt_001",
    "subject": "Agent not responding",
    "priority": "high",
    "created_by": "user@example.com"
  }
}`}</code></pre>

      <h3>ticket.resolved</h3>
      <p>Fired when a support ticket is marked as resolved.</p>
      <pre><code>{`{
  "event": "ticket.resolved",
  "timestamp": "2026-03-16T18:00:00Z",
  "data": {
    "ticket_id": "tkt_001",
    "subject": "Agent not responding",
    "resolved_by": "admin@company.com",
    "resolution_time_hours": 1.0
  }
}`}</code></pre>

      <h3>api.request</h3>
      <p>Fired when an API request is made to your instance via an API key.</p>
      <pre><code>{`{
  "event": "api.request",
  "timestamp": "2026-03-16T19:00:00Z",
  "data": {
    "method": "POST",
    "path": "/v1/chat",
    "api_key_name": "production-key",
    "status_code": 200,
    "latency_ms": 320
  }
}`}</code></pre>

      <h2>HMAC Signature Verification</h2>

      <p>
        Every webhook delivery includes an <code>X-ClawHQ-Signature</code> header containing an
        HMAC-SHA256 signature. This allows you to verify that the payload was sent by ClawHQ and
        has not been tampered with in transit.
      </p>

      <p>
        To verify a signature:
      </p>

      <ol>
        <li>Read the raw request body (do not parse it first)</li>
        <li>Compute the HMAC-SHA256 hash of the raw body using your webhook&apos;s signing secret as the key</li>
        <li>Compare the computed hash with the value in the <code>X-ClawHQ-Signature</code> header</li>
        <li>If they match, the payload is authentic. If not, reject the request.</li>
      </ol>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <strong className="text-primary">Security note:</strong> Always verify the HMAC signature
        before processing webhook payloads. This protects against spoofed requests from
        unauthorized sources. Use a constant-time comparison function to prevent timing attacks.
      </div>

      <h2>Automatic Retries</h2>

      <p>
        If your endpoint returns a non-2xx status code or fails to respond within 10 seconds,
        ClawHQ will automatically retry the delivery. The retry schedule uses exponential backoff:
      </p>

      <ul>
        <li><strong>Retry 1</strong> — 30 seconds after the initial failure</li>
        <li><strong>Retry 2</strong> — 5 minutes after the first retry</li>
        <li><strong>Retry 3</strong> — 30 minutes after the second retry</li>
      </ul>

      <p>
        After three failed retries, the delivery is marked as permanently failed. You can view
        failed deliveries in the delivery log and manually re-trigger them if needed.
      </p>

      <h2>Circuit Breaker</h2>

      <p>
        If a webhook endpoint fails <strong>10 consecutive deliveries</strong>, ClawHQ
        automatically pauses that webhook to prevent further failed attempts from consuming
        resources. A paused webhook stops receiving events until you manually re-enable it.
      </p>

      <p>
        When a circuit breaker trips, you receive a notification in the dashboard. Fix the
        underlying issue with your endpoint, then re-enable the webhook from the Webhooks
        management page. ClawHQ will send a test ping to verify the endpoint is responding
        before resuming event delivery.
      </p>

      <h2>Webhook Templates</h2>

      <p>
        Pre-configured templates make it easy to set up webhooks for popular services:
      </p>

      <ul>
        <li><strong>Slack</strong> — Sends formatted messages to a Slack channel using incoming webhook URLs. Events are formatted with rich Slack blocks including event type, timestamp, and relevant data fields.</li>
        <li><strong>Discord</strong> — Posts embed-formatted messages to a Discord channel via webhook URL. Includes color-coded embeds based on event type.</li>
        <li><strong>Zapier</strong> — Connects to Zapier catch hooks for integration with 5,000+ apps. The payload format is optimized for Zapier&apos;s data mapping.</li>
      </ul>

      <p>
        Select a template when creating a new webhook, and the URL format and payload
        transformation are pre-configured. You can customize any template after creation.
      </p>

      <h2>Delivery Statistics</h2>

      <p>
        Each webhook has its own delivery statistics panel showing:
      </p>

      <ul>
        <li><strong>Success rate</strong> — Percentage of deliveries that received a 2xx response</li>
        <li><strong>Average latency</strong> — Mean time between sending the payload and receiving the response</li>
        <li><strong>Total deliveries</strong> — Count of all delivery attempts (including retries)</li>
        <li><strong>Last delivery</strong> — Timestamp and status of the most recent delivery</li>
      </ul>

      <h2>Delivery Log Viewer</h2>

      <p>
        The delivery log records every delivery attempt for every webhook. Each entry shows:
      </p>

      <ul>
        <li>Event type and timestamp</li>
        <li>HTTP status code returned by your endpoint</li>
        <li>Response body (first 1KB)</li>
        <li>Request duration in milliseconds</li>
        <li>Whether the delivery was a retry and which attempt number</li>
      </ul>

      <p>
        Use the delivery log to debug integration issues. If your endpoint is returning errors,
        the log shows exactly what was sent and what was received, making it easy to identify
        payload parsing issues, authentication problems, or endpoint misconfigurations.
      </p>

      <h2>SSRF Protection</h2>

      <p>
        ClawHQ validates all webhook destination URLs to prevent Server-Side Request Forgery
        (SSRF) attacks. Webhook URLs cannot point to private IP ranges, localhost, or internal
        network addresses. This protects your infrastructure from being used as a proxy for
        unauthorized internal requests.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-6">
        <strong className="text-primary">Tip:</strong> Use the &quot;Test&quot; button on any
        webhook to send a sample payload to your endpoint without waiting for a real event. This
        is the fastest way to verify your integration is working correctly.
      </div>

      <h2>Related Documentation</h2>

      <ul>
        <li><Link href="/docs/pro">Pro Features Overview</Link> — Full list of Pro capabilities</li>
        <li><Link href="/docs/pro/api">API Access</Link> — Programmatic access to your ClawHQ instance</li>
        <li><Link href="/docs/pro/audit-log">Audit Log</Link> — Track webhook configuration changes</li>
        <li><Link href="/docs/pro/logs">Logs Explorer</Link> — Debug webhook-related issues in the logs</li>
      </ul>
    </article>
  );
}
