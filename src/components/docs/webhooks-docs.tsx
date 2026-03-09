"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeBlock } from "./code-block";
import { HttpBadge } from "./http-badge";
import { ParamTable } from "./param-table";
import { Callout } from "./callout";
import { SectionHeading } from "./section-heading";
import { StatusBadge } from "./status-badge";
import { DocsSidebar } from "./docs-sidebar";

const SECTIONS = [
  { id: "introduction", label: "Introduction", num: "001" },
  { id: "quick-start", label: "Quick Start", num: "002" },
  { id: "event-types", label: "Event Types", num: "003" },
  { id: "list-webhooks", label: "List Webhooks", num: "004" },
  { id: "create-webhook", label: "Create Webhook", num: "005" },
  { id: "update-webhook", label: "Update Webhook", num: "006" },
  { id: "delete-webhook", label: "Delete Webhook", num: "007" },
  { id: "test-webhook", label: "Test Webhook", num: "008" },
  { id: "signature-verification", label: "Signature Verification", num: "009" },
  { id: "delivery", label: "Delivery & Reliability", num: "010" },
  { id: "errors", label: "Error Reference", num: "011" },
];

const BASE_URL = "https://app.clawhq.tech/api";

/* ─── Code examples ─── */
const WEBHOOK_PAYLOAD_EXAMPLE = `{
  "event": "message.received",
  "data": {
    "agent": "support",
    "message": "How do I reset my password?",
    "response": "You can reset your password from Settings > Account.",
    "session_id": "sess_abc123"
  },
  "timestamp": "2026-03-09T14:30:00.000Z"
}`;

const VERIFY_NODE = `import crypto from "crypto";

function verifyWebhookSignature(body, signature, timestamp, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(\`\${timestamp}.\${body}\`)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// In your Express/Next.js handler:
app.post("/webhooks/clawhq", (req, res) => {
  const signature = req.headers["x-clawhq-signature"];
  const timestamp = req.headers["x-clawhq-timestamp"];
  const body = JSON.stringify(req.body);

  if (!verifyWebhookSignature(body, signature, timestamp, WEBHOOK_SECRET)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const { event, data } = req.body;
  console.log(\`Event: \${event}\`, data);

  res.status(200).json({ received: true });
});`;

const VERIFY_PYTHON = `import hmac
import hashlib
from flask import Flask, request, jsonify

app = Flask(__name__)
WEBHOOK_SECRET = "whsec_your_secret_here"

def verify_signature(body: str, signature: str, timestamp: str) -> bool:
    expected = hmac.new(
        WEBHOOK_SECRET.encode(),
        f"{timestamp}.{body}".encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(signature, expected)

@app.route("/webhooks/clawhq", methods=["POST"])
def handle_webhook():
    signature = request.headers.get("X-ClawHQ-Signature", "")
    timestamp = request.headers.get("X-ClawHQ-Timestamp", "")
    body = request.get_data(as_text=True)

    if not verify_signature(body, signature, timestamp):
        return jsonify({"error": "Invalid signature"}), 401

    event = request.json
    print(f"Event: {event['event']}", event["data"])

    return jsonify({"received": True}), 200`;

const CURL_CREATE = `curl -X POST ${BASE_URL}/webhooks \\
  -H "Cookie: <your_session_cookie>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://your-app.com/webhooks/clawhq",
    "events": ["message.received", "agent.deployed"],
    "description": "Production webhook"
  }'`;

const CURL_TEST = `curl -X POST ${BASE_URL}/webhooks/{webhook_id}/test \\
  -H "Cookie: <your_session_cookie>"`;

export default function WebhooksDocs() {
  return (
    <DocsSidebar sections={SECTIONS}>
      {/* ════════ SECTION 1: INTRODUCTION ════════ */}
      <section id="introduction" className="mb-20 scroll-mt-24">
        <SectionHeading num="001" title="Introduction" id="introduction" />
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-primary/10 text-primary border border-primary/30">
            Pro Feature
          </span>
        </div>
        <p className="text-white/70 text-[15px] leading-relaxed mb-6">
          Webhooks let you receive real-time HTTP notifications when events
          happen in your ClawHQ instance. Instead of polling the API, your
          server gets a POST request with event data the moment something happens.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Delivery", value: "HTTPS POST" },
            { label: "Signing", value: "HMAC-SHA256" },
            { label: "Max Webhooks", value: "10 per account" },
          ].map((item) => (
            <div key={item.label} className="border border-white/10 p-3 bg-white/[0.01]">
              <div className="font-mono text-[10px] text-white/30 uppercase tracking-widest mb-1">
                {item.label}
              </div>
              <span className="font-mono text-[13px] text-white/70">{item.value}</span>
            </div>
          ))}
        </div>

        <h3 className="text-white font-semibold mb-3">How It Works</h3>
        <div className="space-y-3 mb-6">
          {[
            "You register a webhook URL and choose which events to subscribe to",
            "When an event occurs, ClawHQ sends a signed HTTPS POST to your endpoint",
            "Your server verifies the HMAC signature and processes the event",
            "If delivery fails, ClawHQ tracks failures and auto-disables after 10 consecutive errors",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="font-mono text-[11px] text-primary/60 mt-0.5 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-white/60 text-[13px]">{step}</p>
            </div>
          ))}
        </div>

        <Callout type="info">
          All webhook management endpoints require <strong>dashboard session authentication</strong> (cookie-based).
          These are called from your logged-in dashboard, not via API key.
        </Callout>
      </section>

      {/* ════════ SECTION 2: QUICK START ════════ */}
      <section id="quick-start" className="mb-20 scroll-mt-24">
        <SectionHeading num="002" title="Quick Start" id="quick-start" />
        <p className="text-white/70 text-[15px] leading-relaxed mb-8">
          Start receiving webhook events in 3 steps.
        </p>

        {/* Step 1 */}
        <div className="flex gap-4 mb-8">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border border-primary bg-primary/10 flex items-center justify-center font-mono text-sm text-primary font-bold">
              1
            </div>
            <div className="w-px flex-1 bg-white/10 mt-2" />
          </div>
          <div className="flex-1 pb-8">
            <h3 className="text-white font-semibold mb-2">Create a Webhook</h3>
            <p className="text-white/50 text-sm mb-3">
              Go to{" "}
              <Link href="/webhooks" className="text-primary hover:underline">
                Dashboard → Webhooks
              </Link>
              {" "}and create a webhook with your endpoint URL and desired events.
            </p>
            <Callout type="warning">
              Save the webhook secret immediately — it&apos;s shown <strong>only once</strong>.
              You&apos;ll need it to verify incoming signatures.
            </Callout>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-4 mb-8">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border border-primary bg-primary/10 flex items-center justify-center font-mono text-sm text-primary font-bold">
              2
            </div>
            <div className="w-px flex-1 bg-white/10 mt-2" />
          </div>
          <div className="flex-1 pb-8">
            <h3 className="text-white font-semibold mb-2">Set Up Your Endpoint</h3>
            <p className="text-white/50 text-sm mb-3">
              Create an HTTPS endpoint on your server that accepts POST requests.
              Verify the signature, then process the event:
            </p>
            <CodeBlock
              language="javascript"
              code={`app.post("/webhooks/clawhq", (req, res) => {
  // 1. Verify signature (see Section 009)
  // 2. Process the event
  const { event, data } = req.body;
  console.log(event, data);
  // 3. Return 200
  res.status(200).json({ received: true });
});`}
            />
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border border-primary bg-primary/10 flex items-center justify-center font-mono text-sm text-primary font-bold">
              3
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-2">Test It</h3>
            <p className="text-white/50 text-sm mb-3">
              Use the Test button in your dashboard (or the test endpoint) to send
              a test event. You&apos;ll see a signed POST arrive at your endpoint with
              the test payload.
            </p>
          </div>
        </div>
      </section>

      {/* ════════ SECTION 3: EVENT TYPES ════════ */}
      <section id="event-types" className="mb-20 scroll-mt-24">
        <SectionHeading num="003" title="Event Types" id="event-types" />
        <p className="text-white/70 text-[15px] leading-relaxed mb-6">
          Subscribe to specific events when creating a webhook. Each event
          type delivers a different data payload.
        </p>

        <div className="border border-white/10 overflow-hidden">
          {[
            {
              event: "message.received",
              desc: "A user sent a message through chat or the API and received a response.",
              payload: '{ "agent": "support", "message": "...", "response": "..." }',
            },
            {
              event: "agent.deployed",
              desc: "An agent was deployed or undeployed on the VPS.",
              payload: '{ "agent_name": "support", "action": "deployed" }',
            },
            {
              event: "vps.status_changed",
              desc: "The VPS status changed (started, stopped, restarted, etc.).",
              payload: '{ "status": "running", "previous_status": "stopped" }',
            },
            {
              event: "channel.connected",
              desc: "A messaging channel was connected to an agent.",
              payload: '{ "channel": "whatsapp", "agent": "support" }',
            },
            {
              event: "channel.disconnected",
              desc: "A messaging channel was disconnected.",
              payload: '{ "channel": "whatsapp", "agent": "support" }',
            },
          ].map((evt) => (
            <div
              key={evt.event}
              className="border-b border-white/[0.06] last:border-0 p-4"
            >
              <code className="font-mono text-[13px] text-primary mb-2 block">
                {evt.event}
              </code>
              <p className="text-white/50 text-[13px] mb-2">{evt.desc}</p>
              <code className="block font-mono text-[12px] text-white/30 bg-white/[0.02] p-2">
                {evt.payload}
              </code>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <Callout type="info">
            A special <code className="font-mono text-white/70">test</code> event is sent
            when you use the Test Webhook endpoint. It&apos;s not subscribable — it&apos;s
            always delivered to verify your endpoint works.
          </Callout>
        </div>
      </section>

      {/* ════════ SECTION 4: LIST WEBHOOKS ════════ */}
      <section id="list-webhooks" className="mb-20 scroll-mt-24">
        <SectionHeading num="004" title="List Webhooks" id="list-webhooks" />

        <div className="flex items-center gap-3 mb-4">
          <HttpBadge method="GET" />
          <code className="font-mono text-[15px] text-white/90">/api/webhooks</code>
        </div>
        <p className="text-white/70 text-[15px] leading-relaxed mb-6">
          Returns all webhooks for the authenticated user. Secrets are masked
          for security — only a prefix and last 4 characters are shown.
        </p>

        <h3 className="text-white font-semibold mb-3">Response</h3>
        <CodeBlock
          language="json"
          code={`{
  "webhooks": [
    {
      "id": "uuid-here",
      "url": "https://your-app.com/webhooks/clawhq",
      "secret": "whsec_a1b2c3••••••••wxyz",
      "events": ["message.received", "agent.deployed"],
      "enabled": true,
      "description": "Production webhook",
      "last_triggered_at": "2026-03-09T14:30:00Z",
      "last_status": "success",
      "last_status_code": 200,
      "failure_count": 0,
      "created_at": "2026-03-01T10:00:00Z"
    }
  ]
}`}
        />

        <h3 className="text-white font-semibold mb-3 mt-6">Response Fields</h3>
        <ParamTable
          params={[
            { name: "id", type: "uuid", required: true, description: "Unique webhook identifier." },
            { name: "url", type: "string", required: true, description: "The delivery URL." },
            { name: "secret", type: "string", required: true, description: "Masked signing secret (prefix + last 4 chars)." },
            { name: "events", type: "string[]", required: true, description: "Subscribed event types." },
            { name: "enabled", type: "boolean", required: true, description: "Whether the webhook is active." },
            { name: "description", type: "string", required: false, description: "User-provided label." },
            { name: "failure_count", type: "number", required: true, description: "Consecutive delivery failures. Resets on success. Auto-disables at 10." },
            { name: "last_status", type: "string", required: false, description: "Last delivery result: \"success\" or \"failed\"." },
            { name: "last_status_code", type: "number", required: false, description: "HTTP status code from last delivery attempt." },
          ]}
        />
      </section>

      {/* ════════ SECTION 5: CREATE WEBHOOK ════════ */}
      <section id="create-webhook" className="mb-20 scroll-mt-24">
        <SectionHeading num="005" title="Create Webhook" id="create-webhook" />

        <div className="flex items-center gap-3 mb-4">
          <HttpBadge method="POST" />
          <code className="font-mono text-[15px] text-white/90">/api/webhooks</code>
        </div>
        <p className="text-white/70 text-[15px] leading-relaxed mb-6">
          Register a new webhook endpoint. A unique HMAC signing secret is
          generated and returned — store it immediately.
        </p>

        <h3 className="text-white font-semibold mb-3">Request Body</h3>
        <ParamTable
          params={[
            {
              name: "url",
              type: "string",
              required: true,
              description: "HTTPS endpoint URL. Must be public (no localhost, private IPs). Max 2048 characters.",
            },
            {
              name: "events",
              type: "string[]",
              required: true,
              description: "Array of event types to subscribe to. At least one required.",
            },
            {
              name: "description",
              type: "string",
              required: false,
              description: "Optional label for this webhook.",
            },
          ]}
        />

        <h3 className="text-white font-semibold mb-3 mt-6">Example</h3>
        <CodeBlock language="bash" code={CURL_CREATE} />

        <h3 className="text-white font-semibold mb-3 mt-6">
          Response <StatusBadge code={200} />
        </h3>
        <CodeBlock
          language="json"
          code={`{
  "webhook": {
    "id": "uuid-here",
    "url": "https://your-app.com/webhooks/clawhq",
    "secret": "whsec_a1b2c3d4e5f6789012345678901234567890abcdef1234",
    "events": ["message.received", "agent.deployed"],
    "enabled": true,
    "description": "Production webhook",
    "failure_count": 0,
    "created_at": "2026-03-09T12:00:00Z"
  }
}`}
        />

        <div className="mt-4">
          <Callout type="warning">
            The <code className="font-mono text-white/70">secret</code> is returned in
            full <strong>only in this response</strong>. All subsequent GET requests
            return a masked version. Store it immediately.
          </Callout>
        </div>

        <div className="mt-4 space-y-3">
          <h4 className="text-white/80 text-sm font-semibold">Validation Rules</h4>
          <ul className="space-y-2 text-[13px] text-white/60">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1.5 text-[8px]">&#9632;</span>
              URL must start with <code className="font-mono text-white/70">https://</code>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1.5 text-[8px]">&#9632;</span>
              No private/internal addresses (localhost, 10.x.x.x, 192.168.x.x, etc.)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1.5 text-[8px]">&#9632;</span>
              Maximum 10 webhooks per account
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1.5 text-[8px]">&#9632;</span>
              Secret format: <code className="font-mono text-white/70">whsec_</code> + 48 hex characters
            </li>
          </ul>
        </div>
      </section>

      {/* ════════ SECTION 6: UPDATE WEBHOOK ════════ */}
      <section id="update-webhook" className="mb-20 scroll-mt-24">
        <SectionHeading num="006" title="Update Webhook" id="update-webhook" />

        <div className="flex items-center gap-3 mb-4">
          <HttpBadge method="PATCH" />
          <code className="font-mono text-[15px] text-white/90">/api/webhooks/{"{id}"}</code>
        </div>
        <p className="text-white/70 text-[15px] leading-relaxed mb-6">
          Partially update a webhook. Only include the fields you want to change.
          All validation rules apply to updated fields.
        </p>

        <h3 className="text-white font-semibold mb-3">Request Body</h3>
        <ParamTable
          params={[
            { name: "url", type: "string", required: false, description: "New HTTPS endpoint URL. Same validation as create." },
            { name: "events", type: "string[]", required: false, description: "New set of event subscriptions. Replaces existing." },
            { name: "enabled", type: "boolean", required: false, description: "Enable or disable the webhook. Use this to re-enable after circuit breaker." },
            { name: "description", type: "string", required: false, description: "Updated label." },
          ]}
        />

        <h3 className="text-white font-semibold mb-3 mt-6">Example: Re-enable a Disabled Webhook</h3>
        <CodeBlock
          language="bash"
          code={`curl -X PATCH ${BASE_URL}/webhooks/{webhook_id} \\
  -H "Cookie: <your_session_cookie>" \\
  -H "Content-Type: application/json" \\
  -d '{"enabled": true}'`}
        />

        <h3 className="text-white font-semibold mb-3 mt-6">
          Response <StatusBadge code={200} />
        </h3>
        <p className="text-white/50 text-[13px]">
          Returns the full updated webhook object (same shape as List response).
        </p>
      </section>

      {/* ════════ SECTION 7: DELETE WEBHOOK ════════ */}
      <section id="delete-webhook" className="mb-20 scroll-mt-24">
        <SectionHeading num="007" title="Delete Webhook" id="delete-webhook" />

        <div className="flex items-center gap-3 mb-4">
          <HttpBadge method="DELETE" />
          <code className="font-mono text-[15px] text-white/90">/api/webhooks/{"{id}"}</code>
        </div>
        <p className="text-white/70 text-[15px] leading-relaxed mb-6">
          Permanently delete a webhook. No further events will be delivered
          to this endpoint. This action is immediate and irreversible.
        </p>

        <h3 className="text-white font-semibold mb-3">Example</h3>
        <CodeBlock
          language="bash"
          code={`curl -X DELETE ${BASE_URL}/webhooks/{webhook_id} \\
  -H "Cookie: <your_session_cookie>"`}
        />

        <h3 className="text-white font-semibold mb-3 mt-6">
          Response <StatusBadge code={200} />
        </h3>
        <CodeBlock language="json" code={`{ "success": true }`} />
      </section>

      {/* ════════ SECTION 8: TEST WEBHOOK ════════ */}
      <section id="test-webhook" className="mb-20 scroll-mt-24">
        <SectionHeading num="008" title="Test Webhook" id="test-webhook" />

        <div className="flex items-center gap-3 mb-4">
          <HttpBadge method="POST" />
          <code className="font-mono text-[15px] text-white/90">/api/webhooks/{"{id}"}/test</code>
        </div>
        <p className="text-white/70 text-[15px] leading-relaxed mb-6">
          Send a test event to your webhook endpoint. The test payload is
          fully signed with your webhook&apos;s secret, so you can verify your
          signature validation logic.
        </p>

        <h3 className="text-white font-semibold mb-3">Example</h3>
        <CodeBlock language="bash" code={CURL_TEST} />

        <h3 className="text-white font-semibold mb-3 mt-6">Test Payload Sent to Your Endpoint</h3>
        <CodeBlock
          language="json"
          code={`{
  "event": "test",
  "data": {
    "message": "This is a test event from ClawHQ",
    "webhook_id": "uuid-here"
  },
  "timestamp": "2026-03-09T14:30:00.000Z"
}`}
        />

        <h3 className="text-white font-semibold mb-3 mt-6">
          Response <StatusBadge code={200} />
        </h3>
        <CodeBlock
          language="json"
          code={`{
  "success": true,
  "status_code": 200
}`}
        />

        <div className="mt-4">
          <Callout type="info">
            The test endpoint has a <strong>10-second timeout</strong>. If your
            server doesn&apos;t respond in time, you&apos;ll get a 502 with{" "}
            <code className="font-mono text-white/70">&quot;Request failed or timed out&quot;</code>.
          </Callout>
        </div>
      </section>

      {/* ════════ SECTION 9: SIGNATURE VERIFICATION ════════ */}
      <section id="signature-verification" className="mb-20 scroll-mt-24">
        <SectionHeading num="009" title="Signature Verification" id="signature-verification" />
        <p className="text-white/70 text-[15px] leading-relaxed mb-6">
          Every webhook delivery includes an HMAC-SHA256 signature so you can
          verify the request came from ClawHQ, not an attacker.
        </p>

        <h3 className="text-white font-semibold mb-3">Headers Sent with Every Delivery</h3>
        <ParamTable
          params={[
            { name: "X-ClawHQ-Signature", type: "string", required: true, description: "HMAC-SHA256 hex digest of the signed payload." },
            { name: "X-ClawHQ-Event", type: "string", required: true, description: "The event type (e.g. \"message.received\", \"test\")." },
            { name: "X-ClawHQ-Timestamp", type: "string", required: true, description: "ISO 8601 timestamp of when the event was generated." },
            { name: "Content-Type", type: "string", required: true, description: "Always \"application/json\"." },
          ]}
        />

        <h3 className="text-white font-semibold mb-3 mt-8">Signing Algorithm</h3>
        <div className="border border-white/10 p-4 bg-white/[0.01] mb-6">
          <div className="space-y-2 font-mono text-[13px]">
            <p className="text-white/50">
              <span className="text-white/30">1.</span> Concatenate:{" "}
              <code className="text-primary">timestamp</code>
              <span className="text-white/30"> + </span>
              <code className="text-white/60">&quot;.&quot;</code>
              <span className="text-white/30"> + </span>
              <code className="text-primary">JSON body</code>
            </p>
            <p className="text-white/50">
              <span className="text-white/30">2.</span> HMAC-SHA256 with your{" "}
              <code className="text-primary">webhook secret</code> as key
            </p>
            <p className="text-white/50">
              <span className="text-white/30">3.</span> Compare hex digest with{" "}
              <code className="text-primary">X-ClawHQ-Signature</code> header
            </p>
          </div>
        </div>

        <h3 className="text-white font-semibold mb-3">Verification Examples</h3>
        <Tabs defaultValue="node">
          <TabsList className="bg-white/[0.03] border border-white/10 h-10 p-0.5">
            <TabsTrigger
              value="node"
              className="font-mono text-[11px] data-[state=active]:bg-white/10 data-[state=active]:text-white px-4"
            >
              Node.js
            </TabsTrigger>
            <TabsTrigger
              value="python"
              className="font-mono text-[11px] data-[state=active]:bg-white/10 data-[state=active]:text-white px-4"
            >
              Python
            </TabsTrigger>
          </TabsList>
          <TabsContent value="node" className="mt-3">
            <CodeBlock language="javascript" code={VERIFY_NODE} />
          </TabsContent>
          <TabsContent value="python" className="mt-3">
            <CodeBlock language="python" code={VERIFY_PYTHON} />
          </TabsContent>
        </Tabs>

        <div className="mt-4">
          <Callout type="warning">
            Always use constant-time comparison (<code className="font-mono text-white/70">timingSafeEqual</code> or{" "}
            <code className="font-mono text-white/70">hmac.compare_digest</code>) to prevent
            timing attacks when verifying signatures.
          </Callout>
        </div>
      </section>

      {/* ════════ SECTION 10: DELIVERY ════════ */}
      <section id="delivery" className="mb-20 scroll-mt-24">
        <SectionHeading num="010" title="Delivery & Reliability" id="delivery" />
        <p className="text-white/70 text-[15px] leading-relaxed mb-6">
          Webhooks are delivered fire-and-forget. ClawHQ tracks delivery
          results and implements a circuit breaker pattern to protect both
          your server and our infrastructure.
        </p>

        <div className="border border-white/10 overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="text-left px-4 py-3 font-mono text-[11px] text-white/40 uppercase">
                  Parameter
                </th>
                <th className="text-left px-4 py-3 font-mono text-[11px] text-white/40 uppercase">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 text-white/70">Delivery timeout</td>
                <td className="px-4 py-3 font-mono text-white/90">10 seconds</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 text-white/70">Circuit breaker threshold</td>
                <td className="px-4 py-3 font-mono text-white/90">10 consecutive failures</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 text-white/70">Auto-disable on breach</td>
                <td className="px-4 py-3 font-mono text-white/90">Yes (sets enabled = false)</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 text-white/70">Failure counter reset</td>
                <td className="px-4 py-3 font-mono text-white/90">On any successful delivery</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 text-white/70">Retry policy</td>
                <td className="px-4 py-3 font-mono text-white/90">No automatic retries</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-white/70">Delivery method</td>
                <td className="px-4 py-3 font-mono text-white/90">Fire-and-forget (non-blocking)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-white font-semibold mb-3">Circuit Breaker Flow</h3>
        <div className="space-y-3 mb-6">
          {[
            "Each failed delivery increments failure_count",
            "A successful delivery resets failure_count to 0",
            "When failure_count reaches 10, the webhook is automatically disabled",
            "You can re-enable it via PATCH with { \"enabled\": true }",
            "Re-enabling resets the failure counter",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="font-mono text-[11px] text-primary/60 mt-0.5 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-white/60 text-[13px]">{step}</p>
            </div>
          ))}
        </div>

        <Callout type="tip">
          A &quot;failure&quot; is any non-2xx response or a timeout/connection error.
          Your endpoint must return a 2xx status code within 10 seconds to count
          as a successful delivery.
        </Callout>
      </section>

      {/* ════════ SECTION 11: ERRORS ════════ */}
      <section id="errors" className="mb-20 scroll-mt-24">
        <SectionHeading num="011" title="Error Reference" id="errors" />
        <p className="text-white/70 text-[15px] leading-relaxed mb-6">
          All webhook endpoints return JSON errors in the format{" "}
          <code className="font-mono text-[13px] text-white/90">{`{ "error": "message" }`}</code>.
        </p>

        <div className="border border-white/10 overflow-hidden">
          {[
            { code: 400, title: "Bad Request", examples: [
              '"HTTPS URL is required"',
              '"URL must point to a public endpoint"',
              '"URL too long (max 2048 characters)"',
              '"At least one event is required"',
              '"Invalid events: unknown_event"',
              '"Maximum 10 webhooks allowed. Delete an existing one first."',
              '"No updates provided"',
              '"Webhook URL points to a private address"',
            ]},
            { code: 401, title: "Unauthorized", examples: ['"Unauthorized"'] },
            { code: 403, title: "Forbidden", examples: ['"Pro plan required"'] },
            { code: 404, title: "Not Found", examples: ['"Webhook not found"'] },
            { code: 429, title: "Too Many Requests", examples: ['"Too many requests"'] },
            { code: 500, title: "Server Error", examples: ['"Failed to create webhook"', '"Failed to update webhook"', '"Failed to fetch webhooks"'] },
            { code: 502, title: "Bad Gateway", examples: ['"Request failed or timed out"'] },
          ].map((err) => (
            <div
              key={err.code}
              className="border-b border-white/[0.06] last:border-0 p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <StatusBadge code={err.code} />
                <span className="font-semibold text-white text-sm">{err.title}</span>
              </div>
              <div className="space-y-1">
                {err.examples.map((ex, i) => (
                  <code key={i} className="block font-mono text-[12px] text-white/40">
                    {`{ "error": ${ex} }`}
                  </code>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Webhook payload reference ─── */}
      <section className="mb-20">
        <h3 className="text-white font-semibold mb-3">Full Payload Example</h3>
        <p className="text-white/50 text-[13px] mb-3">
          Every webhook delivery sends this JSON structure:
        </p>
        <CodeBlock language="json" code={WEBHOOK_PAYLOAD_EXAMPLE} />
      </section>

      {/* ─── Footer ─── */}
      <div className="border-t border-white/[0.06] pt-8 mt-12">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-white/20">
            ClawHQ Webhooks API
          </span>
          <span className="font-mono text-[10px] text-white/20">
            Last updated: March 2026
          </span>
        </div>
      </div>
    </DocsSidebar>
  );
}
